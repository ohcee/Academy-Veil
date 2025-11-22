// ===== XP bar on every page =====
const xpEl = document.getElementById("xpBar");
if (xpEl) {
  const xp = parseInt(localStorage.getItem("xp") || "0", 10);
  xpEl.innerText = "XP: " + xp;
}

// ===== Settings =====
const XP_UNLOCK = 10;      // need this much XP before ANY VEIL payouts
const DAILY_CAP = 10;      // max VEIL per browser/day (frontend guard)

// ===== Daily reward limiter =====
function getToday() {
  return new Date().toISOString().split("T")[0];
}

function canRewardToday(amount) {
  const today = getToday();
  const lastDate = localStorage.getItem("veilLastRewardDate");
  let totalToday = parseInt(localStorage.getItem("veilDailyTotal") || "0", 10);

  if (lastDate !== today) {
    localStorage.setItem("veilLastRewardDate", today);
    localStorage.setItem("veilDailyTotal", "0");
    totalToday = 0;
  }

  return totalToday + amount <= DAILY_CAP;
}

function updateDailyTotal(amount) {
  const current = parseInt(localStorage.getItem("veilDailyTotal") || "0", 10);
  localStorage.setItem("veilDailyTotal", current + amount);
}

// 1 XP per correct answer
function getRewardAmount(score) {
  return score; // 1 XP / 1 potential VEIL per correct question
}

// ===== Main quiz handler =====
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("quizForm");
  if (!form) return;

  const correctAnswers = window.quizAnswers || {};
  const addressInput = document.getElementById("veilAddress");
  const lessonId = form.getAttribute("data-lesson"); // e.g. "lesson2"

  // On load, enable/disable address field based on current XP
  let currentXp = parseInt(localStorage.getItem("xp") || "0", 10);
  if (addressInput) {
    if (currentXp < XP_UNLOCK) {
      addressInput.disabled = true;
      addressInput.placeholder = `Reach ${XP_UNLOCK} XP to unlock Veil rewards.`;
    } else {
      addressInput.disabled = false;
      if (!addressInput.placeholder) {
        addressInput.placeholder = "Enter your Veil address";
      }
    }
  }

  form.onsubmit = function (e) {
    e.preventDefault();

    const result = document.getElementById("result");
    if (!result) return;

    // ----- Score the quiz -----
    let score = 0;
    for (let q in correctAnswers) {
      const selected = document.querySelector(`input[name="${q}"]:checked`);
      if (selected && selected.value === correctAnswers[q]) {
        score++;
      }
    }

    if (score === 0) {
      result.innerText = "You didn not get any right. Try again!";
      result.style.color = "#ff5555";
      return;
    }

    // Mark lesson as passed as soon as they get > 0 correct
    if (lessonId) {
      localStorage.setItem(lessonId + "_passed", "true");
    }

    const reward = getRewardAmount(score); // points gained this quiz

    // ----- XP update -----
    const xpBefore = parseInt(localStorage.getItem("xp") || "0", 10);
    const xpAfter = xpBefore + reward;
    localStorage.setItem("xp", xpAfter);
    if (xpEl) {
      xpEl.innerText = "XP: " + xpAfter;
    }

    // If they haven't reached XP_UNLOCK *before this quiz*, it's XP-only
    if (xpBefore < XP_UNLOCK) {
      if (addressInput) {
        addressInput.disabled = true;
        addressInput.value = "";
        addressInput.placeholder = `Reach ${XP_UNLOCK} XP to unlock Veil rewards.`;
      }

      // If this quiz pushed them over the line, tell them that
      if (xpAfter >= XP_UNLOCK) {
        result.innerText =
          `You earned ${reward} XP and reached ${xpAfter} XP total. ` +
          `From your next quiz onward, you can enter a Veil address to earn up to ${DAILY_CAP} VEIL per day.`;
      } else {
        result.innerText =
          `You earned ${reward} XP. Keep going — rewards unlock at ${XP_UNLOCK} XP.`;
      }
      result.style.color = "#00ff99";
      return;
    }

    // At this point, xpBefore >= XP_UNLOCK → they were eligible when they started this quiz
    if (addressInput) {
      addressInput.disabled = false;
      if (!addressInput.placeholder ||
          addressInput.placeholder.includes("Reach")) {
        addressInput.placeholder = "Enter your Veil address";
      }
    }

    const address = addressInput ? addressInput.value.trim() : "";

    if (!address) {
      result.innerText = "Enter your Veil address to receive rewards.";
      result.style.color = "#ffcc00";
      return;
    }

    if (address.length < 20) {
      result.innerText = "Please enter a valid Veil address.";
      result.style.color = "#ff5555";
      return;
    }

    // Check daily cap before calling backend
    if (!canRewardToday(reward)) {
      result.innerText =
        `You have reached the ${DAILY_CAP} VEIL daily reward cap. ` +
        "You can still practice quizzes, but no more payouts today.";
      result.style.color = "#ffcc00";
      return;
    }

    // ----- Attempt to send reward via backend -----
    fetch("http://localhost:5000/api/sendVeil", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: address, amount: reward }),
    })
      .then((res) => res.text())
      .then((txt) => {
        const lower = txt.toLowerCase();

        // If backend mentions caps/limits, show that message only
        if (
          lower.includes("cap") ||
          lower.includes("limit") ||
          lower.includes("tomorrow")
        ) {
          result.innerText = txt;
          result.style.color = "#ffcc00";
          return;
        }

        // Backend accepted → update daily total and show success
        updateDailyTotal(reward);

        result.innerText = `You earned ${reward} VEIL! ${txt}`;
        result.style.color = "#00ff99";

        // confetti only on actual payout
        if (typeof confetti === "function") {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });
        }
      })
      .catch((err) => {
        console.error(err);
        result.innerText =
          "You passed the quiz, but there was a problem sending the reward. Please try again later.";
        result.style.color = "#ff5555";
      });
  };
});
