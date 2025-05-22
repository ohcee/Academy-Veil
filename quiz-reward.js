// XP Bar on every page
const xpEl = document.getElementById("xpBar");
if (xpEl) {
  let xp = parseInt(localStorage.getItem("xp") || "0");
  xpEl.innerText = "XP: " + xp;
}

// Daily reward limiter
function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getRewardAmount(score) {
  if (score <= 2) return 2;
  if (score <= 4) return 5;
  return 10;
}

function canRewardToday(amount) {
  const today = getToday();
  const lastDate = localStorage.getItem("veilLastRewardDate");
  let totalToday = parseInt(localStorage.getItem("veilDailyTotal") || "0");

  if (lastDate !== today) {
    localStorage.setItem("veilLastRewardDate", today);
    localStorage.setItem("veilDailyTotal", "0");
    totalToday = 0;
  }

  return totalToday + amount <= 50;
}

function updateDailyTotal(amount) {
  const current = parseInt(localStorage.getItem("veilDailyTotal") || "0");
  localStorage.setItem("veilDailyTotal", current + amount);
}

// Auto-detect and handle quiz form
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("quizForm");
  if (!form) return;

  const correctAnswers = window.quizAnswers || {};

  form.onsubmit = function(e) {
    e.preventDefault();

    const lessonId = form.getAttribute("data-lesson"); 
    let score = 0;
    for (let q in correctAnswers) {
      const selected = document.querySelector(`input[name="${q}"]:checked`);
      if (selected && selected.value === correctAnswers[q]) score++;
    }

    const result = document.getElementById("result");
    const address = document.getElementById("veilAddress").value;

    if (score === 0) {
      result.innerText = "You didn’t get any right. Try again!";
      return;
    }

    if (address.length < 20) {
      result.innerText = "Please enter a valid Veil address.";
      return;
    }

    const reward = getRewardAmount(score);
    if (!canRewardToday(reward)) {
      result.innerText = "You reached the 50 VEIL daily reward cap. Try again tomorrow.";
      return;
    }

    // Update XP
    let xp = parseInt(localStorage.getItem("xp") || "0");
    xp += reward;
    localStorage.setItem("xp", xp);
    document.getElementById("xpBar").innerText = "XP: " + xp;
    updateDailyTotal(reward);

    fetch("http://localhost:5000/api/sendVeil", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: address, amount: reward })
    })
    .then(res => res.text())
    .then(txt => {
      result.innerText = `You earned ${reward} VEIL! ${txt}`;
      const badge = document.getElementById("badgeBox");
      if (badge) badge.style.display = "block";

      const nextBox = document.getElementById("nextLesson");
      const nextLink = document.getElementById("nextLink");
      if (nextBox && nextLink && lessonId) {
        const lessonNum = parseInt(lessonId.replace("lesson", ""));
        nextLink.href = `lesson${lessonNum + 1}.html`;
        nextBox.style.display = "block";
      }
    });

    // Store lesson progress
    if (lessonId) {
      localStorage.setItem(lessonId + "_passed", "true");
    }
  };
});
