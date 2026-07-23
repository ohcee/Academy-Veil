/**
 * config.js — the only file you need to edit when the faucet moves.
 *
 * FAUCET_URL must point at the origin running api.py, and that origin must list
 * this site in its FAUCET_ORIGINS environment variable or the browser will block
 * the request. Leave it as null to run the site in study-only mode: lessons and
 * quizzes work normally, no payouts are offered.
 */

const CONFIG = {
  // e.g. "https://faucet.example.org"   (no trailing slash)
  FAUCET_URL: null,

  // Shown to the user so the reward is stated before they enter an address.
  REWARD_TEXT: "1 VEIL",
  DAILY_CAP_TEXT: "10 VEIL per day",

  // Block explorer used to link a payout txid.
  EXPLORER_TX: "https://explorer.veil-project.com/tx/"
};

/** True when a faucet endpoint is configured at all. */
function faucetConfigured() {
  return typeof CONFIG.FAUCET_URL === "string" && CONFIG.FAUCET_URL.length > 0;
}

/** Absolute URL for an API path. */
function faucetEndpoint(path) {
  return CONFIG.FAUCET_URL.replace(/\/$/, "") + path;
}
