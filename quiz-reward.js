// ===============================
// Veil Academy – Shared Quiz Logic
// ===============================

// XP Bar on every page
const xpEl = document.getElementById("xpBar");
if (xpEl) {
  let xp = parseInt(localStorage.getItem("xp") || "0", 10);
  xpEl.innerText = "XP: " + xp;
}

// Daily reward limiter (per browser)
function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getRewardAmount(score) {
  // You can tweak these:
  if (score <= 2) return 2;   // 1–2 correct
  if (score <= 4) return 5;   // 3–4 correct
  return 10;                  // 5+ (if you add more questions later)
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

  return totalToday + amount <= 50; // 50 VEIL/day cap
}

function updateDailyTotal(amount) {
  const current = parseInt(localStorage.getItem("veilDailyTotal") || "0", 10);
  localStorage.setItem("veilDailyTotal", current + amount);
}

// ===============================
// Auto-detect and handle quiz form
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("quizForm");
  if (!form) return;

  const correctAnswers = window.quizAnswers || {};
  const result = document.getElementById("result");
  const addressInput = document.getElementById("veilAddress");

  form.onsubmit = function (e) {
    e.preventDefault();

    if (!result) {
      alert("Missing #result element in HTML.");
      return;
    }
    if (!addressInput) {
      result.innerText = "Missing Veil address input.";
      return;
    }

    const lessonId = form.getAttribute("data-lesson"); // e.g. "lesson1"

    // Score quiz
    let score = 0;
    for (let q in correctAnswers) {
      const selected = document.querySelector(`input[name="${q}"]:checked`);
      if (selected && selected.value === correctAnswers[q]) score++;
    }

    const total = Object.keys(correctAnswers).length || 1;

    if (score === 0) {
      result.innerText = "You didn’t get any right. Try again!";
      result.style.color = "#ff5555";
      return;
    }

    const address = addressInput.value.trim();
    if (address.length < 20) {
      result.innerText = "Please enter a valid Veil address.";
      result.style.color = "#ffcc00";
      return;
    }

    const reward = getRewardAmount(score);
    if (!canRewardToday(reward)) {
      result.innerText = "You reached the 50 VEIL daily reward cap. Try again tomorrow.";
      result.style.color = "#ffcc00";
      return;
    }

    // XP
    let xp = parseInt(localStorage.getItem("xp") || "0", 10);
    xp += reward;
    localStorage.setItem("xp", xp);
    if (xpEl) xpEl.innerText = "XP: " + xp;

    // Update daily cap tracking
    updateDailyTotal(reward);

    result.innerText = `⏳ You scored ${score}/${total}. Sending ${reward} VEIL reward...`;
    result.style.color = "#00bcd4";

    // Call your Flask backend
    fetch("http://127.0.0.1:5000/api/sendVeil", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: address, amount: reward })
    })
      .then(res => res.text().then(txt => ({ ok: res.ok, txt })))
      .then(({ ok, txt }) => {
        if (!ok) {
          result.innerText = txt || "Error sending reward. Please try again later.";
          result.style.color = "#ff5555";
          return;
        }

        result.innerText = `You earned ${reward} VEIL! ${txt}`;
        result.style.color = "#00ff99";

        // Show badge if present
        const badge = document.getElementById("badgeBox");
        if (badge) badge.style.display = "block";

        // Show "Next Lesson" if present
        const nextBox = document.getElementById("nextLesson");
        const nextLink = document.getElementById("nextLink");
        if (nextBox && nextLink && lessonId) {
          const lessonNum = parseInt(lessonId.replace("lesson", ""), 10);
          nextLink.href = `lesson${lessonNum + 1}.html`;
          nextBox.style.display = "block";
        }

        // Store lesson progress
        if (lessonId) {
          localStorage.setItem(lessonId + "_passed", "true");
        }
      })
      .catch(err => {
        console.error(err);
        result.innerText = "Error talking to reward server. Try again later.";
        result.style.color = "#ff5555";
      });
  };
});
