// XP bar on every page
document.addEventListener("DOMContentLoaded", () => {
  const xpEl = document.getElementById("xpBar");
  if (xpEl) {
    let xp = parseInt(localStorage.getItem("xp") || "0", 10);
    xpEl.innerText = "XP: " + xp;
  }

  const form = document.getElementById("quizForm");
  if (!form) return;

  const correctAnswers = window.quizAnswers || {};

  function getToday() {
    return new Date().toISOString().split("T")[0];
  }

  function getRewardAmount(score) {
    // change scoring
    if (score <= 2) return 2;
    if (score <= 4) return 5;
    return 10;
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

    return totalToday + amount <= 50;
  }

  function updateDailyTotal(amount) {
    const current = parseInt(localStorage.getItem("veilDailyTotal") || "0", 10);
    localStorage.setItem("veilDailyTotal", current + amount);
  }

  function enableNextLessonButton() {
    const currentLessonEl = document.querySelector("[data-current-lesson]");
    const nextBtn = document.getElementById("nextLessonBtn");
    if (!currentLessonEl || !nextBtn) return;

    const n = parseInt(currentLessonEl.dataset.currentLesson, 10);
    const TOTAL_LESSONS = 11;

    if (n >= TOTAL_LESSONS) {
      nextBtn.style.display = "none";
      return;
    }

    nextBtn.disabled = false;
    nextBtn.textContent = "Next lesson";
    nextBtn.onclick = () => {
      window.location.href = `lesson${n + 1}.html`;
    };
  }

  form.onsubmit = function (e) {
    e.preventDefault();

    const lessonId = form.getAttribute("data-lesson");
    const result = document.getElementById("result");
    const addressInput = document.getElementById("veilAddress");
    const address = addressInput ? addressInput.value.trim() : "";

    // Calculate score
    let score = 0;
    for (let q in correctAnswers) {
      const selected = document.querySelector(`input[name="${q}"]:checked`);
      if (selected && selected.value === correctAnswers[q]) {
        score++;
      }
    }

    if (score === 0) {
      result.innerText = "Not enough correct answers. Try again!";
      result.style.color = "#ff5555";
      return;
    }

    if (address.length < 20) {
      result.innerText = "Please enter a valid Veil address.";
      result.style.color = "#ffcc00";
      return;
    }

    if (lessonId) {
      localStorage.setItem(lessonId + "_passed", "true");
    }
    enableNextLessonButton();

    const reward = getRewardAmount(score);

    if (!canRewardToday(reward)) {
      result.innerText =
        "You completed the lesson but reached the 50 VEIL daily reward cap. Try again tomorrow for more rewards.";
      result.style.color = "#ffcc00";
      return;
    }

    fetch("http://localhost:5000/api/sendVeil", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: address, amount: reward }),
    })
      .then((res) => res.text())
      .then((txt) => {
        const lower = txt.toLowerCase();

        if (
          lower.includes("cap") ||
          lower.includes("limit") ||
          lower.includes("tomorrow")
        ) {
          result.innerText = "Daily limit reached. Try again tomorrow.";
          result.style.color = "#ffcc00";
          return;
        }

        // Success path
        let xp = parseInt(localStorage.getItem("xp") || "0", 10);
        xp += reward;
        localStorage.setItem("xp", xp);

        const xpEl2 = document.getElementById("xpBar");
        if (xpEl2) xpEl2.innerText = "XP: " + xp;

        updateDailyTotal(reward);

        result.innerText = `You earned ${reward} VEIL! (Daily cap: 50 VEIL)`;
        result.style.color = "#00ff99";

        // celebrate if confetti lib exists
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
          "You passed the quiz, but the reward couldn't be sent. Try again later.";
        result.style.color = "#ff5555";
      });

  };
});
