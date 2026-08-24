"""
Veil Academy Faucet API
═══════════════════════
Scores quizzes server-side and pays passing users in RingCT.

Design notes, please read before changing anything:

  * The answer key lives ONLY here (answers.json, gitignored). It is never sent
    to the browser. The client submits answers; this service scores them. If you
    move answers back into lessons.js, the faucet becomes free money for anyone
    who opens View Source.

  * Rate limiting keys on a SALTED, DATE-ROTATED HASH of the client IP, never the
    IP itself. Payout addresses are never written to the database or the log, and
    are never stored next to any network identifier. This is a privacy tool; a
    faucet that builds an IP-to-address table would undo the thing it is teaching.

  * The daily cap is RESERVED before the RPC send and refunded if the send fails.
    Checking first and writing after leaves a window where concurrent requests
    both pass the check.

Requirements:
    pip install flask flask-cors requests

Environment variables:
    VEIL_RPC_USER          veil.conf rpcuser                     (required)
    VEIL_RPC_PASS          veil.conf rpcpassword                 (required)
    VEIL_RPC_HOST          default 127.0.0.1
    VEIL_RPC_PORT          default 58812
    FAUCET_SECRET          random string, salts the IP hash      (required)
    FAUCET_ORIGINS         comma-separated allowed origins       (required)
    FAUCET_TRUSTED_PROXIES number of reverse proxies in front    (default 0)
    FAUCET_DAILY_CAP       VEIL per client per day               (default 10)
    FAUCET_REWARD          VEIL per passed lesson                (default 1)
    FAUCET_GLOBAL_DAILY    VEIL paid to everyone per day         (default 500)
    FAUCET_MIN_RESERVE     never spend the wallet below this     (default 100)
    FAUCET_RING_SIZE       ring size for payouts                 (default 11)
    FAUCET_QUIZ_TTL        seconds a quiz session token is valid (default 1800)
    FAUCET_DB              sqlite path                           (default faucet.db)
    FAUCET_ANSWERS         answer key path                       (default answers.json)

Run behind a reverse proxy with TLS. See DEPLOY.md.
"""

import base64
import hashlib
import hmac
import json
import logging
import os
import secrets
import sqlite3
import time
from datetime import date, timedelta
from decimal import Decimal, InvalidOperation

import requests as http
from flask import Flask, jsonify, request
from flask_cors import CORS

# ── Configuration ────────────────────────────────────────────────────────────

def _env_decimal(name: str, default: str) -> Decimal:
    try:
        return Decimal(os.environ.get(name, default))
    except InvalidOperation:
        raise RuntimeError(f"{name} must be a number")


RPC_USER = os.environ.get("VEIL_RPC_USER", "")
RPC_PASS = os.environ.get("VEIL_RPC_PASS", "")
RPC_HOST = os.environ.get("VEIL_RPC_HOST", "127.0.0.1")
RPC_PORT = os.environ.get("VEIL_RPC_PORT", "58812")
RPC_URL = f"http://{RPC_HOST}:{RPC_PORT}/"

SECRET = os.environ.get("FAUCET_SECRET", "")
ORIGINS = [o.strip() for o in os.environ.get("FAUCET_ORIGINS", "").split(",") if o.strip()]
TRUSTED_PROXIES = int(os.environ.get("FAUCET_TRUSTED_PROXIES", "0"))

DAILY_CAP = _env_decimal("FAUCET_DAILY_CAP", "10")
REWARD = _env_decimal("FAUCET_REWARD", "1")
GLOBAL_DAILY = _env_decimal("FAUCET_GLOBAL_DAILY", "500")
MIN_RESERVE = _env_decimal("FAUCET_MIN_RESERVE", "100")
RING_SIZE = int(os.environ.get("FAUCET_RING_SIZE", "11"))

# How long a quiz session token stays valid. The client fetches a token from
# /api/quiz/start, then must submit before this elapses. Short enough that a
# harvested token cannot be replayed later; long enough for a real reader.
QUIZ_TOKEN_TTL = int(os.environ.get("FAUCET_QUIZ_TTL", "1800"))

DB_PATH = os.environ.get("FAUCET_DB", "faucet.db")
ANSWERS_PATH = os.environ.get("FAUCET_ANSWERS", "answers.json")

# Cryptographically-seeded RNG for shuffling served questions and option order.
# The shuffle is not itself a secret (it is sent to the client so it can render
# the quiz); it only has to VARY per session so a fixed answer sequence cannot be
# memorised. The nonce that makes a token single-use is what must be unguessable.
_RNG = secrets.SystemRandom()

# Brute-force limits. Five questions with three options each is only 243
# combinations, so unlimited attempts would defeat server-side scoring entirely.
MAX_ATTEMPTS_PER_LESSON = 8
MIN_SECONDS_BETWEEN_SUBMITS = 3
MAX_BODY_BYTES = 4096

# ── Logging ──────────────────────────────────────────────────────────────────
# Deliberately coarse. No IPs, no addresses, no txids tied to a client.

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger("faucet")

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_BODY_BYTES


def _startup_checks():
    """Fail loudly at boot rather than quietly running with no rate limiting."""
    problems = []
    if not RPC_USER or not RPC_PASS:
        problems.append("VEIL_RPC_USER and VEIL_RPC_PASS must be set")
    if len(SECRET) < 32:
        problems.append("FAUCET_SECRET must be set to at least 32 random characters")
    if not ORIGINS:
        problems.append("FAUCET_ORIGINS must list the site origin(s)")
    if not os.path.exists(ANSWERS_PATH):
        problems.append(f"answer key not found at {ANSWERS_PATH}")
    if problems:
        raise RuntimeError("Refusing to start:\n  - " + "\n  - ".join(problems))


_startup_checks()

def _load_answers(path):
    """
    Parse the answer key into {lesson_id: {"serve": n, "questions": [...]}}.

    Two on-disk formats are accepted per lesson:

      * Legacy, a bare list of correct option letters, one per question:
            "1": ["b", "a", "b", "a", "a"]
        Each question is assumed to have options a, b, c (every current lesson
        does). This is what the existing answers.json already uses, so no edit
        is needed to deploy the shuffle/token protections.

      * Explicit, required for a question bank or for anything other than three
        a/b/c options:
            "2": {"serve": 5, "questions": [
                     {"options": ["a","b","c"], "answer": "b"}, ...]}
        `serve` (optional, default = all) is how many of the bank to show each
        attempt; the server picks that many at random and shuffles their options.

    Each question is normalised to {"options": [keys...], "answer": key}.
    """
    with open(path) as fh:
        raw = json.load(fh)

    out = {}
    for k, v in raw.items():
        if k.startswith("_"):
            continue
        lid = int(k)

        if isinstance(v, list):
            questions = []
            for ans in v:
                a = str(ans).strip().lower()
                # Widen the option set only if a legacy answer letter is beyond
                # c; otherwise the standard three options a, b, c.
                n = 3
                if len(a) == 1 and a.isalpha():
                    n = max(3, ord(a) - ord("a") + 1)
                opts = [chr(ord("a") + i) for i in range(n)]
                if a not in opts:
                    raise RuntimeError(f"lesson {lid}: answer '{a}' not a valid option letter")
                questions.append({"options": opts, "answer": a})
            out[lid] = {"serve": len(questions), "questions": questions}

        elif isinstance(v, dict):
            parsed = []
            for q in v.get("questions", []):
                opts = [str(o).strip().lower() for o in q.get("options", [])]
                ans = str(q.get("answer", "")).strip().lower()
                if len(opts) < 2:
                    raise RuntimeError(f"lesson {lid}: a question has fewer than two options")
                if len(set(opts)) != len(opts):
                    raise RuntimeError(f"lesson {lid}: duplicate option keys {opts}")
                if ans not in opts:
                    raise RuntimeError(f"lesson {lid}: answer '{ans}' not in options {opts}")
                parsed.append({"options": opts, "answer": ans})
            if not parsed:
                raise RuntimeError(f"lesson {lid}: no questions")
            serve = int(v.get("serve", len(parsed)))
            serve = max(1, min(serve, len(parsed)))
            out[lid] = {"serve": serve, "questions": parsed}

        else:
            raise RuntimeError(f"lesson {lid}: unrecognised answer format")

    if not out:
        raise RuntimeError("answer key is empty")
    return out


ANSWERS = _load_answers(ANSWERS_PATH)

CORS(
    app,
    resources={r"/api/*": {"origins": ORIGINS}},
    methods=["POST", "GET", "OPTIONS"],
    allow_headers=["Content-Type"],
    max_age=600,
)

# ── Client identity (privacy-preserving) ─────────────────────────────────────


def client_key() -> str:
    """
    A per-day, salted, irreversible handle for the client.

    X-Forwarded-For is only consulted for as many hops as we actually run behind
    (FAUCET_TRUSTED_PROXIES), counted from the right. Trusting the whole header
    lets any client invent an IP per request and bypass the cap completely.

    The current date is folded into the hash, so handles from different days
    cannot be correlated even by someone holding the database and the secret.
    """
    ip = request.remote_addr or "unknown"

    if TRUSTED_PROXIES > 0:
        forwarded = request.headers.get("X-Forwarded-For", "")
        if forwarded:
            hops = [h.strip() for h in forwarded.split(",") if h.strip()]
            if len(hops) >= TRUSTED_PROXIES:
                ip = hops[-TRUSTED_PROXIES]

    return hmac.new(
        SECRET.encode(),
        f"{date.today().isoformat()}|{ip}".encode(),
        hashlib.sha256,
    ).hexdigest()


def today_str() -> str:
    return date.today().isoformat()


# ── Database ─────────────────────────────────────────────────────────────────

SCHEMA = """
CREATE TABLE IF NOT EXISTS spend (
    client   TEXT NOT NULL,
    day      TEXT NOT NULL,
    total    TEXT NOT NULL DEFAULT '0',
    last_ts  REAL NOT NULL DEFAULT 0,
    PRIMARY KEY (client, day)
);
CREATE TABLE IF NOT EXISTS claims (
    client    TEXT NOT NULL,
    day       TEXT NOT NULL,
    lesson_id INTEGER NOT NULL,
    PRIMARY KEY (client, day, lesson_id)
);
CREATE TABLE IF NOT EXISTS attempts (
    client    TEXT NOT NULL,
    day       TEXT NOT NULL,
    lesson_id INTEGER NOT NULL,
    n         INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (client, day, lesson_id)
);
CREATE TABLE IF NOT EXISTS global_spend (
    day   TEXT PRIMARY KEY,
    total TEXT NOT NULL DEFAULT '0'
);
CREATE TABLE IF NOT EXISTS tokens (
    nonce TEXT PRIMARY KEY,
    day   TEXT NOT NULL
);
"""


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=10, isolation_level=None)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    return conn


def init_db():
    conn = get_db()
    try:
        conn.executescript(SCHEMA)
    finally:
        conn.close()


def purge_old(conn):
    """Drop everything older than yesterday. We keep no long-term history."""
    cutoff = (date.today() - timedelta(days=1)).isoformat()
    for table in ("spend", "claims", "attempts", "tokens"):
        conn.execute(f"DELETE FROM {table} WHERE day < ?", (cutoff,))
    conn.execute("DELETE FROM global_spend WHERE day < ?", (cutoff,))


# ── Veil RPC ─────────────────────────────────────────────────────────────────


class RPCError(RuntimeError):
    """
    `ambiguous` means we do not know whether the call took effect.

    This matters only for sends. A refused connection is safe to retry, nothing
    happened. A timeout is not: veild may well have broadcast the transaction and
    simply not answered in time. Treating those two the same would let a slow
    node turn into a double payout.
    """

    def __init__(self, message, ambiguous=False):
        super().__init__(message)
        self.ambiguous = ambiguous


def rpc(method: str, params: list, timeout: int = 30):
    """
    Call veild. Credentials go in the Authorization header, not the URL, so they
    do not end up in exception text or proxy logs.
    """
    try:
        resp = http.post(
            RPC_URL,
            json={"jsonrpc": "1.0", "id": "academy-faucet", "method": method, "params": params},
            auth=(RPC_USER, RPC_PASS),
            timeout=timeout,
            headers={"Content-Type": "application/json"},
        )
    except http.exceptions.ConnectionError:
        raise RPCError("Wallet node unreachable.")
    except http.exceptions.Timeout:
        raise RPCError("Wallet node timed out.", ambiguous=True)

    if resp.status_code == 401:
        raise RPCError("Wallet node rejected credentials.")

    try:
        data = resp.json()
    except ValueError:
        raise RPCError("Wallet node returned an unreadable response.")

    if data.get("error"):
        raise RPCError(str(data["error"].get("message", "RPC error")))

    return data.get("result")


def is_payable_stealth_address(addr: str) -> bool:
    """
    Authoritative address check, ask the node, do not pattern-match.

    A payout must go to a stealth address; that is what makes the output RingCT
    and therefore private. Paying a basecoin address would publish the amount
    and the recipient on a transparent output.
    """
    try:
        info = rpc("validateaddress", [addr], timeout=10)
    except RPCError:
        return False
    if not isinstance(info, dict) or not info.get("isvalid"):
        return False
    # DescribeAddressVisitor sets this only for CStealthAddress destinations.
    return bool(info.get("isstealthaddress"))


def spendable_balance() -> Decimal:
    try:
        balances = rpc("getbalances", [], timeout=10)
        if isinstance(balances, dict):
            for key in ("ringct_spendable", "total_spendable"):
                if key in balances:
                    return Decimal(str(balances[key]))
    except (RPCError, InvalidOperation):
        pass
    return Decimal("0")


def send_ringct(address: str, amount: Decimal) -> str:
    """
    sendringcttoringct "address" amount ( "comment" "comment_to"
                       subtractfeefromamount "narration" ringsize inputs_per_sig )

    Narration is intentionally left empty: it is written to the blockchain, and
    on a faucet payout it would be a permanent public label on the recipient.
    """
    return rpc(
        "sendringcttoringct",
        [address, str(amount), "", "", False, "", RING_SIZE, 32],
        timeout=90,
    )


# ── Cap accounting ───────────────────────────────────────────────────────────


def reserve(conn, client: str, lesson_id: int, amount: Decimal):
    """
    Atomically reserve `amount` against the per-client and global daily caps.

    Runs inside BEGIN IMMEDIATE so two concurrent submissions cannot both read a
    below-cap total and both proceed. Returns (ok, error_message).
    """
    day = today_str()
    now = time.time()

    conn.execute("BEGIN IMMEDIATE")
    try:
        row = conn.execute(
            "SELECT total, last_ts FROM spend WHERE client = ? AND day = ?", (client, day)
        ).fetchone()
        spent = Decimal(row[0]) if row else Decimal("0")
        last_ts = row[1] if row else 0.0

        if now - last_ts < MIN_SECONDS_BETWEEN_SUBMITS:
            conn.execute("ROLLBACK")
            return False, "Slow down a moment and try again."

        already = conn.execute(
            "SELECT 1 FROM claims WHERE client = ? AND day = ? AND lesson_id = ?",
            (client, day, lesson_id),
        ).fetchone()
        if already:
            conn.execute("ROLLBACK")
            return False, "You have already been paid for this lesson today."

        if spent + amount > DAILY_CAP:
            conn.execute("ROLLBACK")
            remaining = DAILY_CAP - spent
            return False, f"Daily cap reached. {remaining} VEIL remaining today."

        grow = conn.execute("SELECT total FROM global_spend WHERE day = ?", (day,)).fetchone()
        global_total = Decimal(grow[0]) if grow else Decimal("0")
        if global_total + amount > GLOBAL_DAILY:
            conn.execute("ROLLBACK")
            return False, "The faucet has reached its daily limit. Try again tomorrow."

        conn.execute(
            "INSERT INTO spend (client, day, total, last_ts) VALUES (?, ?, ?, ?) "
            "ON CONFLICT(client, day) DO UPDATE SET total = ?, last_ts = ?",
            (client, day, str(spent + amount), now, str(spent + amount), now),
        )
        conn.execute(
            "INSERT OR IGNORE INTO claims (client, day, lesson_id) VALUES (?, ?, ?)",
            (client, day, lesson_id),
        )
        conn.execute(
            "INSERT INTO global_spend (day, total) VALUES (?, ?) "
            "ON CONFLICT(day) DO UPDATE SET total = ?",
            (day, str(global_total + amount), str(global_total + amount)),
        )
        conn.execute("COMMIT")
        return True, None
    except Exception:
        conn.execute("ROLLBACK")
        raise


def release(conn, client: str, lesson_id: int, amount: Decimal):
    """Undo a reservation after a failed send, so a node outage costs no one their cap."""
    day = today_str()
    conn.execute("BEGIN IMMEDIATE")
    try:
        row = conn.execute(
            "SELECT total FROM spend WHERE client = ? AND day = ?", (client, day)
        ).fetchone()
        if row:
            restored = max(Decimal("0"), Decimal(row[0]) - amount)
            conn.execute(
                "UPDATE spend SET total = ? WHERE client = ? AND day = ?",
                (str(restored), client, day),
            )
        grow = conn.execute("SELECT total FROM global_spend WHERE day = ?", (day,)).fetchone()
        if grow:
            restored_global = max(Decimal("0"), Decimal(grow[0]) - amount)
            conn.execute(
                "UPDATE global_spend SET total = ? WHERE day = ?", (str(restored_global), day)
            )
        conn.execute(
            "DELETE FROM claims WHERE client = ? AND day = ? AND lesson_id = ?",
            (client, day, lesson_id),
        )
        conn.execute("COMMIT")
    except Exception:
        conn.execute("ROLLBACK")
        raise


def count_attempt(conn, client: str, lesson_id: int) -> int:
    """Record a scoring attempt and return the running count for today."""
    day = today_str()
    conn.execute("BEGIN IMMEDIATE")
    try:
        row = conn.execute(
            "SELECT n FROM attempts WHERE client = ? AND day = ? AND lesson_id = ?",
            (client, day, lesson_id),
        ).fetchone()
        n = (row[0] if row else 0) + 1
        conn.execute(
            "INSERT INTO attempts (client, day, lesson_id, n) VALUES (?, ?, ?, ?) "
            "ON CONFLICT(client, day, lesson_id) DO UPDATE SET n = ?",
            (client, day, lesson_id, n, n),
        )
        conn.execute("COMMIT")
        return n
    except Exception:
        conn.execute("ROLLBACK")
        raise


# ── Quiz session tokens ──────────────────────────────────────────────────────
#
# The client never learns the answer key. Instead /api/quiz/start hands out a
# per-attempt token that pins (a) which questions are asked, (b) the order the
# options are shown in, and (c) a one-time nonce and issue time. The token is
# HMAC-signed with FAUCET_SECRET so the client cannot forge or edit it. Because
# the option order is different every session and the token is single-use and
# short-lived, a memorised answer sequence is worthless and a captured token
# cannot be replayed. The permutation itself is not secret, the client needs it
# to render the quiz, so it travels in the clear inside the signed payload.


def _sign(b64: str) -> str:
    return hmac.new(SECRET.encode(), b64.encode(), hashlib.sha256).hexdigest()


def make_token(payload: dict) -> str:
    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    b64 = base64.urlsafe_b64encode(raw).decode().rstrip("=")
    return f"{b64}.{_sign(b64)}"


def read_token(token):
    """Return the payload dict for a valid token, else None. Never raises."""
    if not isinstance(token, str) or "." not in token:
        return None
    b64, _, sig = token.partition(".")
    if not hmac.compare_digest(sig, _sign(b64)):
        return None
    try:
        raw = base64.urlsafe_b64decode(b64 + "=" * (-len(b64) % 4))
        payload = json.loads(raw)
    except (ValueError, TypeError):
        return None
    return payload if isinstance(payload, dict) else None


def burn_token(conn, nonce: str) -> bool:
    """
    Record a token nonce as spent. Returns True the first time and False on any
    later attempt, so a token can be submitted at most once. INSERT OR IGNORE is
    atomic, so two concurrent submissions of the same token cannot both win.
    """
    if not isinstance(nonce, str) or not nonce:
        return False
    cur = conn.execute(
        "INSERT OR IGNORE INTO tokens (nonce, day) VALUES (?, ?)", (nonce, today_str())
    )
    return cur.rowcount == 1


# ── Routes ───────────────────────────────────────────────────────────────────


@app.route("/api/health", methods=["GET"])
def health():
    """Liveness for the frontend. Reveals nothing about funds or clients."""
    try:
        rpc("getblockcount", [], timeout=5)
        node_ok = True
    except RPCError:
        node_ok = False
    return jsonify({
        "ok": True,
        "payouts": node_ok and spendable_balance() > MIN_RESERVE,
        "reward": str(REWARD),
        "dailyCap": str(DAILY_CAP),
    })


@app.route("/api/quiz/start", methods=["GET"])
def quiz_start():
    """
    Begin a quiz attempt. Returns a signed session token plus the questions to
    show, which ones, and the order to render each one's options, so the client
    can render the quiz without ever seeing the answer key.

    Request:  /api/quiz/start?lessonId=1
    Response: {"token": "...", "ttl": 1800,
               "questions": [{"qi": 3, "order": ["c","a","b"]}, ...]}

    `qi` indexes the lesson's question bank (the same array the client holds in
    lessons.js); `order` is the option keys in the sequence to display them. The
    user submits the *position* they picked, never a key, so knowing which key is
    correct does not survive the shuffle.
    """
    try:
        lesson_id = int(request.args.get("lessonId"))
    except (TypeError, ValueError):
        return jsonify({"error": "Missing lesson id."}), 400

    spec = ANSWERS.get(lesson_id)
    if spec is None:
        return jsonify({"error": "Unknown lesson."}), 404

    bank = spec["questions"]
    serve = min(spec["serve"], len(bank))

    # Random subset, random question order, and a fresh option order per
    # question, all three vary from one attempt to the next.
    served = []
    for qi in _RNG.sample(range(len(bank)), serve):
        order = list(bank[qi]["options"])
        _RNG.shuffle(order)
        served.append({"qi": qi, "order": order})

    payload = {
        "lid": lesson_id,
        "qs": served,
        "n": secrets.token_hex(12),
        "iat": int(time.time()),
    }
    return jsonify({
        "token": make_token(payload),
        "ttl": QUIZ_TOKEN_TTL,
        "questions": served,
    })


@app.route("/api/quiz", methods=["POST"])
def quiz():
    """
    Score a quiz attempt and, if it passes and an address was supplied, pay out.

    Request:  {"token": "<from /api/quiz/start>", "answers": [1, 0, 2, ...],
               "address": "sv1..."}
              `answers[i]` is the option *position* chosen for the i-th served
              question, indexing that question's shuffled `order`.
    Response: {"passed": bool, "score": n, "total": n,
               "payout": {"sent": bool, "txid": str|null, "note": str|null}}

    A failing response returns only the score, never which questions were wrong.
    A per-question oracle plus a few attempts would otherwise leak the whole key.
    The token is single-use and short-lived, so a failed attempt cannot be
    re-scored, the client fetches a fresh session to try again.
    """
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"error": "Malformed request."}), 400

    payload = read_token(body.get("token"))
    if payload is None:
        return jsonify({
            "error": "This quiz session is invalid. Refresh the page for a new one.",
            "expired": True,
        }), 400

    # Freshness. Reject an expired token; the small negative allowance guards
    # against one stamped slightly in the future by clock skew.
    iat = payload.get("iat")
    now = time.time()
    if not isinstance(iat, (int, float)) or now - iat > QUIZ_TOKEN_TTL or iat - now > 60:
        return jsonify({
            "error": "This quiz session timed out. Refresh the page for a new one.",
            "expired": True,
        }), 400

    lesson_id = payload.get("lid")
    spec = ANSWERS.get(lesson_id) if isinstance(lesson_id, int) else None
    if spec is None:
        return jsonify({"error": "Unknown lesson."}), 404
    bank = spec["questions"]

    served = payload.get("qs")
    if not isinstance(served, list) or not served:
        return jsonify({"error": "Malformed quiz session.", "expired": True}), 400

    answers = body.get("answers")
    if not isinstance(answers, list) or len(answers) != len(served):
        return jsonify({"error": "Answer the whole quiz before submitting."}), 400

    # Each answer is a chosen display position. Booleans are ints in Python, so
    # reject them explicitly.
    positions = []
    for a, q in zip(answers, served):
        order = q.get("order") if isinstance(q, dict) else None
        if not isinstance(order, list) or isinstance(a, bool) or not isinstance(a, int) \
                or a < 0 or a >= len(order):
            return jsonify({"error": "Malformed answers."}), 400
        positions.append(a)

    client = client_key()
    conn = get_db()

    try:
        purge_old(conn)

        # Single-use: burn the token before counting the attempt, so a replay is
        # rejected outright rather than consuming one of the user's tries.
        if not burn_token(conn, payload.get("n")):
            return jsonify({
                "error": "This quiz was already submitted. Refresh the page for a new one.",
                "expired": True,
            }), 409

        n = count_attempt(conn, client, lesson_id)
        if n > MAX_ATTEMPTS_PER_LESSON:
            return jsonify({
                "error": "Too many attempts on this lesson today. "
                         "Re-read the lesson and come back tomorrow."
            }), 429

        # Score: map each chosen position back through the shuffle to a canonical
        # option key, then compare it to that bank question's answer.
        score = 0
        for pos, q in zip(positions, served):
            qi = q.get("qi")
            if not isinstance(qi, int) or qi < 0 or qi >= len(bank):
                return jsonify({"error": "Malformed quiz session.", "expired": True}), 400
            chosen_key = q["order"][pos]
            if hmac.compare_digest(chosen_key, bank[qi]["answer"]):
                score += 1

        total = len(served)
        passed = score == total

        result = {
            "passed": passed,
            "score": score,
            "total": total,
            "payout": {"sent": False, "txid": None, "note": None},
        }

        if not passed:
            return jsonify(result)

        address = (body.get("address") or "").strip()
        if not address:
            result["payout"]["note"] = "No address supplied, no payout requested."
            return jsonify(result)

        if len(address) > 200:
            result["payout"]["note"] = "That does not look like a Veil address."
            return jsonify(result)

        if spendable_balance() - REWARD < MIN_RESERVE:
            result["payout"]["note"] = "The faucet is empty right now. Nothing was sent."
            return jsonify(result)

        if not is_payable_stealth_address(address):
            result["payout"]["note"] = (
                "That is not a valid Veil stealth address. Payouts go to stealth "
                "addresses (sv…) only, so the payment stays private."
            )
            return jsonify(result)

        ok, why = reserve(conn, client, lesson_id, REWARD)
        if not ok:
            result["payout"]["note"] = why
            return jsonify(result)

        try:
            txid = send_ringct(address, REWARD)
        except RPCError as exc:
            if exc.ambiguous:
                # The send may have gone through. Keep the reservation: the cost
                # of being wrong here is one user losing 1 VEIL of their daily
                # cap, versus paying an unbounded number of people twice.
                log.error("payout ambiguous for lesson %s (reservation kept): %s",
                          lesson_id, exc)
                result["payout"]["note"] = (
                    "The faucet timed out while sending. If the payment went through "
                    "it will arrive shortly, check your wallet before retrying."
                )
            else:
                release(conn, client, lesson_id, REWARD)
                log.error("payout failed for lesson %s: %s", lesson_id, exc)
                result["payout"]["note"] = (
                    "The faucet could not send just now. Your cap was not used."
                )
            return jsonify(result)

        # Note what is NOT logged here: no address, no client handle, no txid.
        log.info("payout ok lesson=%s amount=%s", lesson_id, REWARD)

        result["payout"] = {"sent": True, "txid": txid, "note": None}
        return jsonify(result)

    finally:
        conn.close()


@app.errorhandler(413)
def too_large(_):
    return jsonify({"error": "Request too large."}), 413


@app.errorhandler(500)
def server_error(_):
    return jsonify({"error": "Internal error."}), 500


init_db()


if __name__ == "__main__":
    # Development only. In production run under gunicorn behind a TLS proxy:
    #   gunicorn -w 2 -b 127.0.0.1:5000 api:app
    log.warning("Starting Flask development server, do not use this in production.")
    app.run(port=5000, host="127.0.0.1")
