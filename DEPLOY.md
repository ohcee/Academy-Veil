# Deploying the faucet

The site itself is static and deploys to GitHub Pages on push to `main`. This
document is about `api.py`, which hands out real VEIL and therefore needs care.

The threat model is simple and worth stating up front: **anyone on the internet
can call this API as many times as they like.** Every protection below assumes
the caller is hostile.

---

## 1. A dedicated hot wallet

Do not point the faucet at your main wallet.

Run a separate `veild` with its own wallet holding only a working float — enough
for a few days of payouts. Top it up manually. A hot wallet on an internet-facing
box will eventually be compromised; the only question is how much is in it.

Leave that wallet unencrypted. This sounds wrong, but the alternative is putting
the passphrase in an environment variable on the same machine, which protects
nothing and adds the risk of an unlock left open. Keep the balance small instead.

The faucet refuses to spend below `FAUCET_MIN_RESERVE`, so a drain attempt hits a
floor rather than emptying the wallet.

### Fund it in RingCT, not basecoin

Payouts use `sendringcttoringct`, which spends **RingCT inputs**. A wallet holding
its float as basecoin cannot pay out, and `/api/health` will report
`"payouts": false` even though the balance looks fine in the GUI — the reserve
check reads `ringct_spendable`, not the total.

After funding, convert the float and confirm:

```bash
veil-cli getbalances | grep ringct_spendable
```

That number is what the faucet can actually spend.

### veil.conf

```
server=1
rpcuser=faucet
rpcpassword=<long random string>
rpcbind=127.0.0.1
rpcallowip=127.0.0.1
```

`rpcbind=127.0.0.1` matters. The RPC port must never be reachable from outside
the box — it is a full wallet control interface with no rate limiting of its own.

---

## 2. Install

```bash
git clone https://github.com/ohcee/Academy-Veil.git
cd Academy-Veil
python3 -m venv venv
./venv/bin/pip install flask flask-cors requests gunicorn
```

Copy the answer key up separately. **It is not in the repo**, because the repo is
public and an answer key in a public repo is not an answer key:

```bash
scp answers.json you@yourserver:/opt/academy/answers.json
```

Verify it matches the lessons before starting:

```bash
python3 check_content.py
```

---

## 3. Environment

```bash
export VEIL_RPC_USER=faucet
export VEIL_RPC_PASS='<the rpcpassword from veil.conf>'
export VEIL_RPC_HOST=127.0.0.1
export VEIL_RPC_PORT=58812

export FAUCET_SECRET="$(python3 -c 'import secrets;print(secrets.token_hex(32))')"
export FAUCET_ORIGINS=https://academy.veil-info.org
export FAUCET_TRUSTED_PROXIES=1

export FAUCET_DAILY_CAP=10
export FAUCET_REWARD=1
export FAUCET_GLOBAL_DAILY=500
export FAUCET_MIN_RESERVE=100

export FAUCET_RING_SIZE=11      # ring size for payouts; 11 is the network default
export FAUCET_QUIZ_TTL=1800     # seconds a quiz session token stays valid
```

`api.py` refuses to start if `FAUCET_SECRET`, `FAUCET_ORIGINS`, the RPC
credentials, or the answer key are missing. That is deliberate — a faucet that
boots with rate limiting silently disabled is worse than one that does not boot.

### FAUCET_TRUSTED_PROXIES

Set this to **the number of reverse proxies you actually run in front of the
app** — normally `1` for a single nginx or Caddy.

This is the setting that was previously broken, and it is the one most worth
understanding. `X-Forwarded-For` is a client-supplied header. If the app trusts
the whole thing, anyone can send `X-Forwarded-For: 1.2.3.4`, invent a new one per
request, and bypass the daily cap entirely. With this set to `1`, the app reads
only the single hop your own proxy appended and ignores anything the client
tried to prepend.

If you run the app with no proxy at all, set `0`.

### FAUCET_SECRET

Salts the client-identity hash. Rotating it resets everyone's daily cap, so do
not rotate it casually. Losing it is harmless — the database only holds hashes.

---

## 4. Run it

```bash
./venv/bin/gunicorn -w 2 -b 127.0.0.1:5000 api:app
```

Do not use `python api.py` in production; that is Flask's development server.

A systemd unit:

```ini
[Unit]
Description=Veil Academy faucet
After=network.target veild.service

[Service]
User=faucet
WorkingDirectory=/opt/academy
EnvironmentFile=/etc/academy.env
ExecStart=/opt/academy/venv/bin/gunicorn -w 2 -b 127.0.0.1:5000 api:app
Restart=on-failure

# The faucet needs nothing but its own directory.
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/academy

[Install]
WantedBy=multi-user.target
```

Put the environment in `/etc/academy.env` with mode `600` — it holds the RPC
password.

---

## 5. Reverse proxy

nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name faucet.example.org;

    ssl_certificate     /etc/letsencrypt/live/faucet.example.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/faucet.example.org/privkey.pem;

    # Do not log visitor IPs. The whole point of the hashing in api.py is that
    # no IP-to-payout link exists anywhere; an access log undoes that in one line.
    access_log off;

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header X-Forwarded-For $remote_addr;   # replace, do not append
        proxy_set_header Host $host;
    }
}
```

Two things worth noting:

- `proxy_set_header X-Forwarded-For $remote_addr` **replaces** the header rather
  than appending to whatever the client sent. Using `$proxy_add_x_forwarded_for`
  appends, which preserves client-supplied values and is what makes spoofing
  possible in the first place.
- `access_log off` is not optional if you take the privacy claim on the site
  seriously. `api.py` goes out of its way to store only date-salted hashes and to
  keep payout addresses out of the logs. An nginx access log sitting next to it
  recording every IP and timestamp makes that effort pointless.

---

## 6. Point the site at it

In `config.js`:

```js
FAUCET_URL: "https://faucet.example.org",
```

Commit and push; Pages redeploys. With `FAUCET_URL: null` the site runs in study
mode — all lessons readable, quizzes shown as self-check, no payouts offered.

The origin in `FAUCET_ORIGINS` must exactly match the site's origin or the
browser blocks the request. Use the origin **as it appears in the address bar**,
with no path and no trailing slash. The live site is served from the custom
domain, so that is `https://academy.veil-info.org` — **not** the underlying
`https://ohcee.github.io`. A GitHub Pages custom domain sends its own origin, so
listing only the `github.io` name silently breaks every quiz with a CORS error
(`fetch` fails and the page says it "couldn't reach the scoring server"). The
value is comma-separated if you need to allow both:

```
FAUCET_ORIGINS=https://academy.veil-info.org,https://ohcee.github.io
```

### Deploy order matters

The quiz flow spans both halves: the frontend calls `GET /api/quiz/start` for a
signed session, then `POST /api/quiz` with that token. An old cached frontend
cannot talk to nothing, and a new frontend cannot talk to an old backend that has
no `/start` route. Both cases fail **closed** (no payout, "couldn't reach the
scoring server"), which is safe, but to avoid a visible gap deploy the **backend
first** (`git pull` on the server, then restart the service), then push the
frontend. Cached clients heal on refresh.

---

## 7. Check it

```bash
curl https://faucet.example.org/api/health
# {"ok":true,"payouts":true,"reward":"1","dailyCap":"10"}
```

`payouts: false` means either the node is unreachable or the wallet is at the
reserve floor.

Confirm a quiz session starts (this reveals nothing about the answers):

```bash
curl 'https://faucet.example.org/api/quiz/start?lessonId=1'
# {"token":"…","ttl":1800,"questions":[{"qi":3,"order":["c","a","b"]}, …]}
```

Scoring is a two-step flow now: the client fetches a token from `/start`, then
submits the option **positions** it chose to `/api/quiz` with that token. A bare
`POST /api/quiz` with hardcoded letters (the old format) is rejected — there is
nothing to memorise and replay.

---

## Quiz sessions and the answer key

The answer key never reaches the browser. `/api/quiz/start` hands out a signed,
single-use, short-lived token that pins which questions are asked and a freshly
shuffled option order for each; the client renders that and submits positions, so
a memorised answer sequence is worthless and a captured token cannot be replayed.
A failing submission is told only its score, never which questions were wrong.

`answers.json` accepts two per-lesson shapes (see `answers.example.json`):

- **Legacy** — a bare list of correct letters, e.g. `"1": ["b","a","c","a","b"]`.
  Assumes three options `a`, `b`, `c` per question. The existing key is already
  in this form, so the protections above turn on with **no edit to the key** —
  just deploy the new `api.py` and restart.
- **Explicit** — `{"serve": 5, "questions": [{"options":["a","b","c"],"answer":"b"}, …]}`.
  Required only for a question **bank** (author more than five questions and serve
  a random subset each attempt) or for questions that aren't three `a`/`b`/`c`
  options. The bank and the lesson's `quiz[]` array in `lessons.js` are
  index-aligned and must be the same length.

---

## What this does and does not protect against

Worth being honest about, since it is a faucet.

**Handled:** direct API calls without passing a quiz; answer keys extracted from
the page source; **memorising an answer sequence and replaying it** (option order
is shuffled per attempt and the session token is single-use and short-lived);
**walking the key with a per-question oracle** (a failing response returns only
the score, never which answers were wrong); `X-Forwarded-For` spoofing; concurrent
requests racing the cap check; brute-forcing a quiz (capped attempts, and with a
question bank each attempt draws a different subset); claiming one lesson
repeatedly; payouts to transparent addresses; draining the wallet past a reserve;
a global spend ceiling regardless of how many clients appear.

**Not handled by any of the above:** a bot that genuinely reads each shuffled
question and answers it correctly (e.g. an LLM). Nothing client-rendered can stop
that; the defence is economic — a small reward, the per-client and global daily
caps, and `FAUCET_GLOBAL_DAILY` as the hard ceiling on a day's loss.

**Not handled:** someone with a large pool of genuinely distinct IP addresses.
A botnet or a wide VPN pool can collect the per-client cap repeatedly. This is
not solvable without identity checks, which would defeat the point of the site.
`FAUCET_GLOBAL_DAILY` is the backstop: it bounds the total daily loss no matter
how many identities show up. Set it to a number you are willing to lose in a day,
and watch the logs early on.
