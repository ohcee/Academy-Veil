from flask import Flask, request
from flask_cors import CORS
import time
import datetime

app = Flask(__name__)
CORS(app)

# Matches frontend cap
DAILY_CAP = 10

# In-memory tracking:
# ip_state[ip] = { "day": "YYYY-MM-DD", "total": int, "last_ts": float }
ip_state = {}


def today_str():
    return datetime.date.today().isoformat()


@app.route("/api/sendVeil", methods=["POST"])
def send_veil():
    data = request.get_json(force=True) or {}

    addr = (data.get("address") or "").strip()
    amount = data.get("amount")

    # -------------------------------
    # Validation
    # -------------------------------
    if not addr or len(addr) < 20:
        return "Invalid Veil address.", 400

    try:
        amount = int(amount)
    except (ValueError, TypeError):
        return "Invalid amount.", 400

    if amount <= 0:
        return "Amount must be positive.", 400
    if amount > DAILY_CAP:
        return f"Amount too large. Max per request is {DAILY_CAP} VEIL.", 400

    # -------------------------------
    # IP-based daily rate limiting
    # -------------------------------
    ip = request.remote_addr or "unknown"
    today = today_str()

    state = ip_state.get(ip, {"day": today, "total": 0})

    # Reset daily totals when the date changes
    if state["day"] != today:
        state = {"day": today, "total": 0}

    # If over daily cap
    if state["total"] + amount > DAILY_CAP:
        # 100% block – stop the payout
        return "You have reached the 10 VEIL daily cap. Try again tomorrow."

    # -------------------------------
    # SEND VEIL (stub → replace with real RPC)
    # -------------------------------
    print(f"[FAUCET] Sending {amount} VEIL to {addr} (IP {ip})")

    # -------------------------------
    # Update IP state
    # -------------------------------
    state["total"] += amount
    state["last_ts"] = time.time()
    ip_state[ip] = state

    return f"Sent {amount} VEIL to {addr}."


if __name__ == "__main__":
    app.run(port=5000, host="127.0.0.1")
