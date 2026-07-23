/**
 * quiz-reward.js
 * Renders a quiz, submits it for server-side scoring, awards XP, unlocks the
 * next lesson, and surfaces the faucet payout result.
 *
 * Expects: LESSONS (lessons.js), Progress (progress.js), CONFIG (config.js),
 *          confetti (confetti.js)
 *
 * Scoring happens on the server. This file does not know the answers and must
 * never be given them — see the header of lessons.js.
 */

const Quiz = (() => {

  // ── Small helper: escape anything that reaches innerHTML ────────────────
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Render ──────────────────────────────────────────────────────────────
  function render(lesson, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (Progress.isComplete(lesson.id)) {
      container.innerHTML = `
        <div class="quiz-done">
          <div class="quiz-done-icon">✓</div>
          <p>You've already completed this lesson.</p>
          ${nextBtn(lesson.id)}
        </div>`;
      return;
    }

    // Quizzes are marked by the faucet server. With none configured there is
    // nothing to submit to, so show the questions as self-check material rather
    // than a form that cannot do anything.
    if (Progress.studyMode()) {
      const items = lesson.quiz.map((q, i) => `
        <div class="quiz-question">
          <p class="q-prompt">${i + 1}. ${esc(q.prompt)}</p>
          <div class="q-options">
            ${Object.values(q.options).map(v => `
              <label class="q-option"><span>${esc(v)}</span></label>
            `).join("")}
          </div>
        </div>`).join("");

      container.innerHTML = `
        <div class="study-mode-note">
          Quiz marking is offline at the moment, so these are here to check yourself
          against. Every lesson is unlocked for reading.
        </div>
        ${items}
        ${nextBtn(lesson.id)}`;
      return;
    }

    const questions = lesson.quiz.map((q, i) => `
      <div class="quiz-question" id="q${i}">
        <p class="q-prompt">${i + 1}. ${esc(q.prompt)}</p>
        <div class="q-options">
          ${Object.entries(q.options).map(([key, val]) => `
            <label class="q-option">
              <input type="radio" name="q${i}" value="${esc(key)}">
              <span>${esc(val)}</span>
            </label>
          `).join("")}
        </div>
      </div>
    `).join("");

    const addressBlock = faucetConfigured() ? `
      <div class="quiz-address">
        <label for="veilAddress">
          Your stealth address
          <span class="label-note">optional — for your ${esc(CONFIG.REWARD_TEXT)} reward</span>
        </label>
        <input type="text" id="veilAddress" placeholder="sv1…"
               autocomplete="off" spellcheck="false" maxlength="200">
        <p class="addr-help">
          Payouts are sent as RingCT to stealth addresses (sv…) only, so the payment
          stays private. Capped at ${esc(CONFIG.DAILY_CAP_TEXT)}. Leave this blank to
          just take the quiz — you'll still earn XP and unlock the next lesson.
        </p>
      </div>` : `
      <div class="quiz-address">
        <p class="addr-help">Rewards are paused right now. The quiz still counts toward your XP.</p>
      </div>`;

    container.innerHTML = `
      <form id="quizForm" class="quiz-form" novalidate>
        ${questions}
        ${addressBlock}
        <button type="submit" class="btn-submit">Submit Quiz</button>
        <div id="quizResult" class="quiz-result hidden"></div>
      </form>`;

    document.getElementById("quizForm").addEventListener("submit", e => {
      e.preventDefault();
      handleSubmit(lesson);
    });
  }

  // ── Submit ──────────────────────────────────────────────────────────────
  async function handleSubmit(lesson) {
    const form   = document.getElementById("quizForm");
    const result = document.getElementById("quizResult");
    const total  = lesson.quiz.length;

    // Collect answers. Every question must be answered before we call the API,
    // both to be fair to the user and to avoid burning one of their attempts.
    const answers = [];
    let unanswered = false;

    lesson.quiz.forEach((q, i) => {
      const selected = form.querySelector(`input[name="q${i}"]:checked`);
      const questionEl = document.getElementById(`q${i}`);
      questionEl.classList.remove("correct", "incorrect", "unanswered");
      if (selected) {
        answers.push(selected.value);
      } else {
        answers.push("");
        unanswered = true;
        questionEl.classList.add("unanswered");
      }
    });

    result.classList.remove("hidden");

    if (unanswered) {
      result.innerHTML = `<div class="result-fail">Answer every question before submitting.</div>`;
      return;
    }

    const address = (document.getElementById("veilAddress")?.value || "").trim();
    const submitBtn = form.querySelector(".btn-submit");
    submitBtn.disabled = true;
    result.innerHTML = `<div class="result-pending">Checking your answers…</div>`;

    let data;
    try {
      data = await score(lesson.id, answers, address);
    } catch (err) {
      // The server is the only thing that knows the answers, so if it is
      // unreachable we genuinely cannot mark this quiz. Say so and award
      // nothing — quietly passing the user would make the badge meaningless
      // and would let anyone complete the whole site by pulling their network
      // cable. The lesson text stays readable, and study mode (below) keeps
      // every lesson reachable while the server is down.
      submitBtn.disabled = false;
      result.innerHTML = `
        <div class="result-fail">
          Couldn't reach the scoring server, so this quiz can't be marked right now.
          Your answers weren't lost — try again in a little while.
          Every lesson is readable in the meantime.
        </div>`;
      return;
    }

    if (data.error) {
      submitBtn.disabled = false;
      result.innerHTML = `<div class="result-fail">${esc(data.error)}</div>`;
      return;
    }

    // Per-question marking from the server's response.
    (data.correct || []).forEach((isCorrect, i) => {
      const questionEl = document.getElementById(`q${i}`);
      if (questionEl) questionEl.classList.add(isCorrect ? "correct" : "incorrect");
    });

    if (!data.passed) {
      submitBtn.disabled = false;
      result.innerHTML = `
        <div class="result-fail">
          <strong>${data.score}/${data.total} correct.</strong>
          Review the highlighted questions and try again.
        </div>`;
      setTimeout(() => {
        form.querySelectorAll(".quiz-question").forEach(el =>
          el.classList.remove("correct", "incorrect", "unanswered"));
        result.classList.add("hidden");
      }, 6000);
      return;
    }

    // Passed.
    form.querySelectorAll("input, button").forEach(el => el.disabled = true);
    result.innerHTML = payoutMessage(data.payout);
    finalize(lesson, result);
  }

  // ── API call ────────────────────────────────────────────────────────────
  async function score(lessonId, answers, address) {
    if (!faucetConfigured()) {
      // No server configured at all — this is a deliberate offline mode, not an
      // error. Throwing sends us down the "server unreachable" path.
      throw new Error("no faucet configured");
    }

    const body = { lessonId, answers };
    if (address) body.address = address;

    const resp = await fetch(faucetEndpoint("/api/quiz"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // Don't attach cookies or credentials to a cross-origin request.
      credentials: "omit",
      referrerPolicy: "no-referrer"
    });

    return await resp.json();
  }

  // ── Result rendering ────────────────────────────────────────────────────
  function payoutMessage(payout) {
    if (!payout) {
      return `<div class="result-pass">All correct! Lesson complete.</div>`;
    }

    if (payout.sent && payout.txid) {
      const short = esc(String(payout.txid).slice(0, 24));
      return `
        <div class="result-pass">
          ✓ All correct — ${esc(CONFIG.REWARD_TEXT)} sent!<br>
          <span class="txid">txid:
            <a href="${esc(CONFIG.EXPLORER_TX)}${encodeURIComponent(payout.txid)}"
               target="_blank" rel="noopener noreferrer">${short}…</a>
          </span>
        </div>`;
    }

    if (payout.note) {
      return `
        <div class="result-pass">
          All correct! Lesson complete.<br>
          <span class="payout-note">${esc(payout.note)}</span>
        </div>`;
    }

    return `<div class="result-pass">All correct! Lesson complete.</div>`;
  }

  // ── XP, completion, next button ─────────────────────────────────────────
  function finalize(lesson, resultEl) {
    if (!Progress.isComplete(lesson.id)) {
      const newXP = Progress.addXP(lesson.xp);
      Progress.markComplete(lesson.id);

      const xpFlash = document.createElement("div");
      xpFlash.className = "xp-flash";
      xpFlash.textContent = `+${lesson.xp} XP`;
      document.body.appendChild(xpFlash);
      setTimeout(() => xpFlash.remove(), 2000);

      refreshXPBar(newXP);
    }

    if (typeof confetti === "function") {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#00d4ff", "#7c3aed", "#ffffff"]
      });
    }

    const form = document.getElementById("quizForm");
    if (form && !form.querySelector(".quiz-next-row")) {
      const btnRow = document.createElement("div");
      btnRow.className = "quiz-next-row";
      btnRow.innerHTML = nextBtn(lesson.id);
      form.appendChild(btnRow);
    }
  }

  function refreshXPBar(xp) {
    const total = typeof totalXP === "function" ? totalXP() : 0;
    const pct   = total > 0 ? Math.round((xp / total) * 100) : 0;
    const val   = document.querySelector(".xp-val");
    const fill  = document.querySelector(".xp-fill");
    const pctEl = document.querySelector(".xp-pct");
    if (val)   val.textContent  = `${xp} XP`;
    if (fill)  fill.style.width = `${pct}%`;
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
