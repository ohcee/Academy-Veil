# Veil Academy

**Learn privacy. Earn Veil.**

Veil Academy is an interactive, self-paced educational site for the [Veil cryptocurrency project](https://veil-project.com). Complete lessons on privacy tech, staking, mining, and the Veil ecosystem, then earn real Veil through quizzes.

🌐 **Live site:** [ohcee.github.io/Academy-Veil](https://ohcee.github.io/Academy-Veil)

---

## Lessons

| # | Topic |
|---|-------|
| 1 | What is the Veil Project? |
| 2 | Setting Up the Core Wallet + Snapshot |
| 3 | How RingCT Works |
| 4 | How to Stake Veil |
| 5 | Where to Get Veil |
| 6 | Basecoin vs Stealth vs RingCT |
| 7 | Minting for Staking |
| 8 | Denominations & Efficiency |
| 9 | Mining Algorithms |
| 10 | Staking Zerocoin Mints |
| 11 | How to Contribute |

---

## How It Works

- Work through lessons in order — each one unlocks the next after you pass the quiz
- XP is tracked in your browser via `localStorage`
- Pass a quiz, enter your Veil address, and the faucet sends you real Veil (10 VEIL daily cap per IP)

---

## Architecture

```
Academy-Veil/
├── index.html          # Home / lesson grid
├── lesson1–11.html     # Individual lesson + quiz pages
├── style.css           # Shared styles
├── progress.js         # localStorage XP + lesson lock/unlock logic
├── quiz-reward.js      # Quiz scoring + faucet payout trigger
├── quiz.js             # Quiz utilities
├── api.py              # Flask faucet backend (runs on a separate server)
└── veil-logo.png
```

The frontend is **100% static** and hosted on GitHub Pages. The `api.py` faucet runs on a separate VPS or home server with a Veil daemon (`veild`) running locally.

---

## Running the Faucet Backend

**Requirements:** Python 3.9+, a synced Veil daemon with RPC enabled

```bash
pip install flask flask-cors
python api.py
```

Configure your Veil daemon's `veil.conf`:

```
rpcuser=yourusername
rpcpassword=yourpassword
rpcport=58812
server=1
```

Set your RPC credentials as environment variables before running:

```bash
export VEIL_RPC_USER=yourusername
export VEIL_RPC_PASS=yourpassword
export VEIL_RPC_PORT=58812
```

The API runs on `http://127.0.0.1:5000` and should be proxied behind nginx with HTTPS in production.

---

## Deployment

The static site deploys automatically to GitHub Pages via GitHub Actions on every push to `main`.

To enable: **Settings → Pages → Source: GitHub Actions**

---

## Contributing

Lesson corrections, new lessons, and UI improvements are welcome. Open an issue or PR.

For core Veil development, see the [main Veil repo](https://github.com/Veil-Project/veil).

---

## Links

| Resource | URL |
|----------|-----|
| Veil Project | [veil-project.com](https://veil-project.com) |
| Veil Info | [veil-info.org](https://veil-info.org) |
| Core Wallet | [github.com/Veil-Project/veil/releases](https://github.com/Veil-Project/veil/releases) |
| Blockchain Snapshot | [veil.tools](https://veil.tools) |
| Explorer | [explorer.veil-project.com](https://explorer.veil-project.com/main) |
| Live Stats | [veil-stats.com](https://veil-stats.com) |

---

*Built by [@ohcee](https://github.com/ohcee)*
