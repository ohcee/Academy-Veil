"""
Veil Academy Faucet API
-----------------------
Sends VEIL to quiz completers.

Requirements:
    pip install flask flask-cors

Environment variables (set before running):
    VEIL_RPC_USER   - veil.conf rpcuser
    VEIL_RPC_PASS   - veil.conf rpcpassword
    VEIL_RPC_PORT   - veil.conf rpcport (default: 58812)
    VEIL_RPC_HOST   - host for veild (default: 127.0.0.1)

Run:
    python api.py
"""

import os
import time
import datetime
import sqlite3
import requests as rpc_requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ── Config ──────────────────────────────────────────────────────────────────
DAILY_CAP    = 10           # max VEIL per IP per day
DB_PATH      = "faucet.db"  # SQLite file, persists across restarts

RPC_USER = os.environ.get("VEIL_RPC_USER", "")
RPC_PASS = os.environ.get("VEIL_RPC_PASS", "")
RPC_PORT = os.environ.get("VEIL_RPC_PORT", "58812")
RPC_HOST = os.environ.get("VEIL_RPC_HOST", "127.0.0.1")
RPC_URL  = f"http://{RPC_USER}:{RPC_PASS}@{RPC_HOST}:{RPC_PORT}/"

# ── Database ─────────────────────────────────────────────────────────────────
def get_db():
    """Return a DB connection. Creates the table on first run."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS ip_limits (
            ip      TEXT PRIMARY KEY,
            day     TEXT NOT NULL,
            total   INTEGER NOT NULL DEFAULT 0,
            last_ts REAL
        )
    """)
    conn.commit()
    return conn

def today_str():
    return datetime.date.today().isoformat()

def get_ip_state(conn, ip):
    today = today_str()
    row = conn.execute(
        "SELECT day, total FROM ip_limits WHERE ip = ?", (ip,)
    ).fetchone()

    if row is None:
        return {"day": today, "total": 0}

    day, total = row
    if day != today:
        # New day — reset total
        conn.execute(
            "UPDATE ip_limits SET day = ?, total = 0 WHERE ip = ?",
            (today, ip)
        )
        conn.commit()
        return {"day": today, "total": 0}

    return {"day": day, "total": total}

def update_ip_state(conn, ip, amount):
    today = today_str()
    conn.execute("""
        INSERT INTO ip_limits (ip, day, total, last_ts)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(ip) DO UPDATE SET
            day     = excluded.day,
            total   = excluded.total,
            last_ts = excluded.last_ts
    """, (ip, today, get_ip_state(conn, ip)["total"] + amount, time.time()))
    conn.commit()

# ── Veil RPC ─────────────────────────────────────────────────────────────────
def send_veil_rpc(address: str, amount: int) -> str:
    """
    Calls veild via JSON-RPC: sendringcttorinct <address> <amount>
    Sends RingCT → RingCT, keeping the payout fully private.
    Returns the txid string on success, raises on failure.
    """
    if not RPC_USER or not RPC_PASS:
        raise RuntimeError(
            "VEIL_RPC_USER and VEIL_RPC_PASS environment variables are not set."
        )

    payload = {
        "jsonrpc": "1.0",
        "id":      "academy-faucet",
        "method":  "sendringcttorinct",
        "params":  [address, amount]
    }

    try:
        resp = rpc_requests.post(
            RPC_URL,
            json=payload,
            timeout=15,
            headers={"Content-Type": "application/json"}
        )
        resp.raise_for_status()
    except rpc_requests.exceptions.ConnectionError:
        raise RuntimeError("Could not connect to veild. Is the daemon running?")
    except rpc_requests.exceptions.Timeout:
        raise RuntimeError("veild RPC timed out.")

    data = resp.json()
    if data.get("error"):
        err = data["error"]
        raise RuntimeError(f"RPC error {err.get('code')}: {err.get('message')}")

    return data["result"]  # txid

# ── Route ─────────────────────────────────────────────────────────────────────
@app.route("/api/sendVeil", methods=["POST"])
def send_veil():
    data = request.get_json(force=True) or {}
    addr   = (data.get("address") or "").strip()
    amount = data.get("amount")

    # Validation
    if not addr or len(addr) < 20:
        return jsonify({"error": "Invalid Veil address."}), 400

    try:
        amount = int(amount)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount."}), 400

    if amount <= 0:
        return jsonify({"error": "Amount must be positive."}), 400

    if amount > DAILY_CAP:
        return jsonify({
            "error": f"Amount too large. Max per request is {DAILY_CAP} VEIL."
        }), 400

    # IP rate limiting
    ip   = request.headers.get("X-Forwarded-For", request.remote_addr or "unknown").split(",")[0].strip()
    conn = get_db()

    try:
        state = get_ip_state(conn, ip)

        if state["total"] + amount > DAILY_CAP:
            remaining = DAILY_CAP - state["total"]
            return jsonify({
                "error": f"Daily cap reached. You have {remaining} VEIL remaining today."
            }), 429

        # Send via RPC
        try:
            txid = send_veil_rpc(addr, amount)
        except RuntimeError as e:
            app.logger.error(f"[FAUCET] RPC error for {addr}: {e}")
            return jsonify({"error": str(e)}), 503

        # Persist state only after successful send
        update_ip_state(conn, ip, amount)

        app.logger.info(f"[FAUCET] Sent {amount} VEIL to {addr} | txid: {txid} | IP: {ip}")
        return jsonify({"success": True, "txid": txid, "amount": amount})

    finally:
        conn.close()


if __name__ == "__main__":
    # Ensure DB is initialized on startup
    conn = get_db()
    conn.close()
    app.run(port=5000, host="127.0.0.1")
