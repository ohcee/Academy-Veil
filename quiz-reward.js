/**
 * quiz-reward.js
 * Handles quiz rendering, scoring, faucet payout, XP award, and lesson unlock.
 * Expects: LESSONS, Progress (from progress.js), confetti (from CDN)
 *
 * FAUCET_URL: update to your live API endpoint before deploying the backend.
 */

const FAUCET_URL = "https://your-server.example.com/api/sendVeil";
// ↑ Replace with your actual faucet server URL once deployed.
// While testing locally you can use: "http://127.0.0.1:5000/api/sendVeil"

const Quiz = (() => {

  // ── Render quiz form for a given lesson object ──────────────────────────
  function render(lesson, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // If already completed, show a done state instead
    if (Progress.isComplete(lesson.id)) {
      container.innerHTML = `
        <div class="quiz-done">
          <div class="quiz-done-icon">✓</div>
          <p>You've already completed this lesson.</p>
          ${nextBtn(lesson.id)}
        </div>`;
      return;
    }

    const questions = lesson.quiz.map((q, i) => `
      <div class="quiz-question" id="q${i}">
        <p class="q-prompt">${i + 1}. ${q.prompt}</p>
        <div class="q-options">
          ${Object.entries(q.options).map(([key, val]) => `
            <label class="q-option">
              <input type="radio" name="q${i}" value="${key}">
              <span>${val}</span>
            </label>
          `).join("")}
        </div>
      </div>
    `).join("");

    container.innerHTML = `
      <form id="quizForm" class="quiz-form" novalidate>
        ${questions}

        <div class="quiz-address">
          <label for="veilAddress">Your Veil address <span class="label-note">(to receive your reward)</span></label>
          <input type="text" id="veilAddress" placeholder="bv1q... or sv1q..." autocomplete="off" spellcheck="false">
        </div>

        <button type="submit" class="btn-submit">Submit Quiz</button>
        <div id="quizResult" class="quiz-result hidden"></div>
      </form>`;

    document.getElementById("quizForm").addEventListener("submit", e => {
      e.preventDefault();
      handleSubmit(lesson);
    });
  }

  // ── Score submission ─────────────────────────────────────────────────────
  function handleSubmit(lesson) {
    const form    = document.getElementById("quizForm");
    const result  = document.getElementById("quizResult");
    const address = (document.getElementById("veilAddress")?.value || "").trim();

    // Score
    let correct = 0;
    const total = lesson.quiz.length;

    lesson.quiz.forEach((q, i) => {
      const selected = form.querySelector(`input[name="q${i}"]:checked`);
      const questionEl = document.getElementById(`q${i}`);
      if (selected) {
        if (selected.value === q.answer) {
          correct++;
          questionEl.classList.add("correct");
        } else {
          questionEl.classList.add("incorrect");
          // Reveal correct answer
          const correctLabel = questionEl.querySelector(`input[value="${q.answer}"]`)?.closest(".q-option");
          if (correctLabel) correctLabel.classList.add("reveal-correct");
        }
      } else {
        questionEl.classList.add("unanswered");
      }
    });

    const passed = correct === total;
    result.classList.remove("hidden");

    if (!passed) {
      result.innerHTML = `
        <div class="result-fail">
          <strong>${correct}/${total} correct.</strong> Review the highlighted questions and try again.
        </div>`;
      // Reset for retry — remove old class markings after a moment
      setTimeout(() => {
        form.querySelectorAll(".quiz-question").forEach(el => {
          el.classList.remove("correct", "incorrect", "unanswered");
          el.querySelectorAll(".reveal-correct").forEach(l => l.classList.remove("reveal-correct"));
        });
        result.classList.add("hidden");
      }, 3500);
      return;
    }

    // ── Passed ───────────────────────────────────────────────────────────
    result.innerHTML = `<div class="result-pass">All correct! Sending your reward…</div>`;

    // Disable form
    form.querySelectorAll("input, button").forEach(el => el.disabled = true);

    // Attempt faucet payout if address provided
    if (address.length >= 20) {
      sendReward(address, 1, lesson, result);
    } else {
      finalize(lesson, result, null);
    }
  }

  // ── Faucet call ──────────────────────────────────────────────────────────
  async function sendReward(address, amount, lesson, resultEl) {
    try {
      const resp = await fetch(FAUCET_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ address, amount })
      });
      const data = await resp.json();

      if (data.success && data.txid) {
        resultEl.innerHTML = `
          <div class="result-pass">
            ✓ ${data.amount} VEIL sent!<br>
            <span class="txid">txid: <a href="https://explorer.veil-project.com/tx/${data.txid}" target="_blank">${data.txid.slice(0, 24)}…</a></span>
          </div>`;
      } else {
        resultEl.innerHTML = `
          <div class="result-pass">
            Quiz passed! Faucet note: ${data.error || "could not send at this time."}
          </div>`;
      }
    } catch {
      resultEl.innerHTML = `
        <div class="result-pass">
          Quiz passed! Faucet is offline — reward will be sent manually.
        </div>`;
    }

    finalize(lesson, resultEl, null);
  }

  // ── Award XP, mark complete, show next button ────────────────────────────
  function finalize(lesson, resultEl, _unused) {
    if (!Progress.isComplete(lesson.id)) {
      const newXP = Progress.addXP(lesson.xp);
      Progress.markComplete(lesson.id);

      // XP flash
      const xpFlash = document.createElement("div");
      xpFlash.className = "xp-flash";
      xpFlash.textContent = `+${lesson.xp} XP`;
      document.body.appendChild(xpFlash);
      setTimeout(() => xpFlash.remove(), 2000);

      // Refresh XP bar in header
      refreshXPBar(newXP);
    }

    // Confetti
    if (typeof confetti === "function") {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#00d4ff", "#7c3aed", "#ffffff"] });
    }

    // Next lesson button
    const nextId = Progress.nextLesson(lesson.id);
    const form   = document.getElementById("quizForm");
    const nextHTML = nextId
      ? `<a href="lesson.html?id=${nextId}" class="btn-next">Next Lesson →</a>`
      : `<a href="index.html" class="btn-next">Back to Home</a>`;

    const btnRow = document.createElement("div");
    btnRow.className = "quiz-next-row";
    btnRow.innerHTML = nextHTML;
    form.appendChild(btnRow);
  }

  // ── Update XP bar without full page reload ───────────────────────────────
  function refreshXPBar(xp) {
    const total = typeof totalXP === "function" ? totalXP() : 0;
    const pct   = total > 0 ? Math.round((xp / total) * 100) : 0;
    const val   = document.querySelector(".xp-val");
    const fill  = document.querySelector(".xp-fill");
    const pctEl = document.querySelector(".xp-pct");
    if (val)   val.textContent   = `${xp} XP`;
    if (fill)  fill.style.width  = `${pct}%`;
    if (pctEl) pctEl.textContent = `${pct}%`;
  }

  function nextBtn(lessonId) {
    const nextId = Progress.nextLesson(lessonId);
    return nextId
      ? `<a href="lesson.html?id=${nextId}" class="btn-next">Next Lesson →</a>`
      : `<a href="index.html" class="btn-next">Back to Home</a>`;
  }

  return { render };
})();
