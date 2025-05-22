from flask import Flask, request
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)

last_sent = {}  # In production, use Redis or SQLite

@app.route("/api/sendVeil", methods=["POST"])
def send_veil():
    data = request.get_json()
    addr = data.get("address")

    # cooldown: one payout per IP per 24 hours
    ip = request.remote_addr
    if ip in last_sent and time.time() - last_sent[ip] < 86400:
        return "Wait 24 hours between rewards."

    # Send Veil using your bot/faucet
    last_sent[ip] = time.time()
    # For now just return success (replace this with actual call to your Veil faucet)
    print(f"Sending to {addr}")
    return f"Veil sent to {addr}!"

if __name__ == "__main__":
    app.run(port=5000)
