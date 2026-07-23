# Veil Academy

**Learn privacy. Earn Veil.**

An interactive, self-paced course on the [Veil](https://veil-project.com) privacy
coin — RingCT, staking, minting, and mining. Pass a quiz, earn real VEIL.

🌐 **Live site:** [ohcee.github.io/Academy-Veil](https://ohcee.github.io/Academy-Veil)

---

## Lessons

| # | Topic | XP |
|---|-------|-----|
| 1 | What is the Veil Project? | 50 |
| 2 | Setting Up the Core Wallet + Snapshot | 50 |
| 3 | How RingCT Works | 75 |
| 4 | How to Stake Veil | 50 |
| 5 | Where to Get Veil | 50 |
| 6 | Coin Types and Where Veil Is Heading | 75 |
| 7 | Minting for Staking | 75 |
| 8 | Denominations & Efficiency | 75 |
| 9 | Mining Algorithms | 75 |
| 10 | Inside the Staking Engine | 100 |
| 11 | How to Contribute | 100 |

55 questions, 775 XP total.

---

## How it works

- Lessons unlock in order — each opens after you pass the previous quiz.
- XP is tracked in your browser via `localStorage`.
- Pass a quiz and give a stealth address, and the faucet sends 1 VEIL as RingCT,
  capped at 10 VEIL per day.
- No account, no email, no KYC.

---

## Architecture

```
Academy-Veil/
├── index.html            Home — lesson grid
├── lesson.html           Single template for every lesson
├── lessons.js            Lesson content and quiz questions (no answers)
├── page-home.js          Builds the home grid
├── page-lesson.js        Builds a lesson page
├── progress.js           XP, completion, unlock logic
├── quiz-reward.js        Quiz submission and payout display
├── nav.js                Header, lesson nav, XP bar
├── config.js             Faucet endpoint — the only file to edit when it moves
├── confetti.js           Self-hosted celebration effect
├── style.css             All styling
│
├── api.py                Faucet server (runs on a VPS, not on Pages)
├── answers.example.json  Template for the answer key
├── answers.json          The real key — GITIGNORED, server-only
├── check_content.py      Validates lessons against the answer key
└── DEPLOY.md             Faucet deployment guide
```

The frontend is fully static and hosted on GitHub Pages. `api.py` runs separately
on a VPS alongside a synced `veild`.

---

## Two design decisions worth knowing

### Quiz answers are not in this repo

`lessons.js` ships to the browser and deliberately contains **no answers**. The
key lives in `answers.json` — gitignored, deployed only to the faucet server —
and the server scores every submission.

This is not incidental. The faucet pays real money, and an answer key in a public
repo, or in a file the browser downloads, is not an answer key: anyone could read
it with View Source and farm the daily cap.

If you add or edit a quiz, update `answers.json` on the server too, then run:

```bash
python3 check_content.py
```

It fails loudly if the questions and the key have drifted apart.

### The site makes zero third-party requests

No CDN, no webfonts, no analytics, no trackers. Every asset comes from the site's
own origin, and both pages carry a Content-Security-Policy that forbids inline
script and blocks outside loads.

A site teaching people about network-level privacy should not hand every
visitor's IP address to Google Fonts and jsDelivr on page load. `confetti.js`
exists because replacing a CDN dependency with sixty lines of canvas code was
cheaper than justifying the request.

The faucet applies the same standard: it stores a date-salted hash of your IP for
rate limiting, never your payout address, and never a link between the two.

---

## Content accuracy

Every factual claim is checked against Veil core at the current release
(**v1.4.2.0**), and most lessons link the source file that backs them.

The rule for this repo: **do not describe unmerged work as if it ships today.**
RingCT staking ([#1019](https://github.com/Veil-Project/veil/pull/1019)) and
auto-convert ([#1055](https://github.com/Veil-Project/veil/pull/1055)) are open
PRs, so Lesson 6 presents them as the project's direction while saying plainly
that they are not in the wallet yet. Staking today uses Zerocoin mints, and the
lessons say so — RingCT outputs and Zerocoin mints are different things and are
very easy to conflate.

If you edit content, verify against `Veil-Project/veil` at the tag people are
actually running, not against a branch or a blog post.

---

## Running locally

```bash
python3 -m http.server 8099
```

Open <http://localhost:8099>. With `FAUCET_URL: null` in `config.js` the site
runs in **study mode**: every lesson is readable and quizzes appear as self-check
questions. Marking requires the faucet server, because that is where the answers
live.

To exercise the full flow, follow [DEPLOY.md](DEPLOY.md) to run `api.py` locally
and set `FAUCET_URL` to `http://127.0.0.1:5000`. The CSP allows loopback origins,
so this works without TLS.

---

## Deployment

The static site deploys to GitHub Pages via Actions on every push to `main`
(**Settings → Pages → Source: GitHub Actions**).

The faucet is deployed separately — see **[DEPLOY.md](DEPLOY.md)**, which covers
the hot-wallet setup, the reverse-proxy configuration that makes IP rate limiting
actually work, and what the faucet does and does not protect against.

---

## Contributing

To add a lesson: copy the last object in `lessons.js`, increment the `id`, write
the body and quiz, add matching answers to `answers.json`, and run
`check_content.py`. Everything else — nav, grid, XP total, unlock chain — derives
from the data and updates itself.

Corrections to the content are especially welcome. If something here is wrong, it
is teaching people something wrong.

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
