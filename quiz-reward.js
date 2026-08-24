/**
 * quiz-reward.js
 * Renders a quiz, submits it for server-side scoring, awards XP, unlocks the
 * next lesson, and surfaces the faucet payout result.
 *
 * Expects: LESSONS (lessons.js), Progress (progress.js), CONFIG (config.js),
 *          confetti (confetti.js)
 *
 * Anti-bot flow (see api.py): the client never holds the answers. On render it
 * asks the faucet for a quiz *session*, a signed, single-use, short-lived token
 * that pins which questions to show and, for each, a freshly shuffled option
 * order. The client renders that layout from the local question text and submits
 * the option *positions* the user picked, never a letter. Because the order
 * changes every session and the token cannot be replayed, a memorised answer
 * sequence is useless. A wrong submission is told only its score, never which
 * questions were wrong, so it cannot be walked to the key.
 *
 * The server's question bank for a lesson and this file's `lesson.quiz` array are
 * index-aligned: the session refers to questions by their index (`qi`) into that
 * array, so the two must stay the same length per lesson.
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
      // Completed lessons stay "done" for progression, and XP is earned only
      // once (see finalize). But the faucet pays once per lesson *per day*, so a
      // finished lesson can be taken again for that day's reward. Study mode has
      // no payout, so there is nothing to retake for there.
      const canRetake = !Progress.studyMode();
      container.innerHTML = `
        <div class="quiz-done">
          <div class="quiz-done-icon">✓</div>
          <p>You've already completed this lesson.${canRetake
            ? " You can take it again for today's reward. Your XP stays as it is." : ""}</p>
          <div class="quiz-next-row">
            ${canRetake ? `<button type="button" class="btn-next" id="quizRetakeBtn">Take the quiz again</button>` : ""}
            ${nextBtn(lesson.id)}
          </div>
        </div>`;
      const retake = document.getElementById("quizRetakeBtn");
      if (retake) {
        retake.addEventListener("click", () => startAttempt(lesson, container,
          "Answer again to earn today's reward. Your XP stays as it is."));
      }
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

    // Faucet mode: fetch a scored session and render it.
    startAttempt(lesson, container);
  }

  // ── Session lifecycle ────────────────────────────────────────────────────
  async function startAttempt(lesson, container, note) {
    container.innerHTML = `
      <div class="quiz-result"><div class="result-pending">Loading quiz…</div></div>`;

    let session;
    try {
      session = await fetchSession(lesson.id);
    } catch (err) {
      // The server issues the questions, so if it is unreachable there is no
      // quiz to take. Say so plainly and award nothing; the lesson text stays
      // readable, and with no faucet configured at all we fall into study mode.
      container.innerHTML = `
        <div class="quiz-result">
          <div class="result-fail">
            Couldn't reach the scoring server, so this quiz can't be marked right now.
            Try again in a little while. Every lesson is readable in the meantime.
          </div>
        </div>`;
      return;
    }

    renderForm(lesson, container, session, note);
  }

  async function fetchSession(lessonId) {
    const resp = await fetch(
      faucetEndpoint(`/api/quiz/start?lessonId=${encodeURIComponent(lessonId)}`),
      { method: "GET", credentials: "omit", referrerPolicy: "no-referrer" }
    );
    const data = await resp.json();
    if (!resp.ok || !data || !data.token || !Array.isArray(data.questions)) {
      throw new Error((data && data.error) || "could not start quiz");
    }
    return data;
  }

  function renderForm(lesson, container, session, note) {
    // Every served question must exist in this file's bank; if the server is
    // ahead of a cached lessons.js we cannot render it safely.
    const sources = session.questions.map(q => lesson.quiz[q.qi]);
    if (sources.some(s => !s)) {
      container.innerHTML = `
        <div class="quiz-result">
          <div class="result-fail">
            This quiz is being updated right now. Please refresh the page in a little while.
          </div>
        </div>`;
      return;
    }

    const questions = session.questions.map((q, i) => {
      const source = sources[i];
      const opts = q.order.map((key, pos) => `
        <label class="q-option">
          <input type="radio" name="q${i}" value="${pos}">
          <span>${esc(source.options[key])}</span>
        </label>`).join("");
      return `
        <div class="quiz-question" id="q${i}">
          <p class="q-prompt">${i + 1}. ${esc(source.prompt)}</p>
          <div class="q-options">${opts}</div>
        </div>`;
    }).join("");

    const addressBlock = faucetConfigured() ? `
      <div class="quiz-address">
        <label for="veilAddress">
          Your stealth address
          <span class="label-note">optional, for your ${esc(CONFIG.REWARD_TEXT)} reward</span>
        </label>
        <input type="text" id="veilAddress" placeholder="sv1…"
               autocomplete="off" spellcheck="false" maxlength="200">
        <p class="addr-help">
          Payouts are sent as RingCT to stealth addresses (sv…) only, so the payment
          stays private. Capped at ${esc(CONFIG.DAILY_CAP_TEXT)}. Leave this blank to
          just take the quiz, you'll still earn XP and unlock the next lesson.
        </p>
      </div>` : `
      <div class="quiz-address">
        <p class="addr-help">Rewards are paused right now. The quiz still counts toward your XP.</p>
      </div>`;

    const noteHTML = note
      ? `<div class="study-mode-note">${esc(note)}</div>` : "";

    container.innerHTML = `
      <form id="quizForm" class="quiz-form" novalidate>
        ${noteHTML}
        ${questions}
        ${addressBlock}
        <button type="submit" class="btn-submit">Submit Quiz</button>
        <div id="quizResult" class="quiz-result hidden"></div>
      </form>`;

    document.getElementById("quizForm").addEventListener("submit", e => {
      e.preventDefault();
      handleSubmit(lesson, container, session);
    });
  }

  // ── Submit ──────────────────────────────────────────────────────────────
  async function handleSubmit(lesson, container, session) {
    const form   = document.getElementById("quizForm");
    const result = document.getElementById("quizResult");
    const total  = session.questions.length;

    // Collect the chosen option positions. Every question must be answered
    // before we call the API, both to be fair and to avoid burning the session.
    const answers = [];
    let unanswered = false;

    for (let i = 0; i < total; i++) {
      const selected = form.querySelector(`input[name="q${i}"]:checked`);
      const questionEl = document.getElementById(`q${i}`);
      questionEl.classList.remove("unanswered");
      if (selected) {
        answers.push(parseInt(selected.value, 10));
      } else {
        answers.push(-1);
        unanswered = true;
        questionEl.classList.add("unanswered");
      }
    }

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
      data = await submitAnswers(session.token, answers, address);
    } catch (err) {
      submitBtn.disabled = false;
      result.innerHTML = `
        <div class="result-fail">
          Couldn't reach the scoring server, so this quiz can't be marked right now.
          Your answers weren't lost, try again in a little while.
        </div>`;
      return;
    }

    // The session expired or was already used. Quietly fetch a fresh one; the
    // token is single-use by design, so a retry always needs a new session.
    if (data.expired) {
      startAttempt(lesson, container,
        "This quiz session refreshed. Here's a fresh set, answer and submit again.");
      return;
    }

    if (data.error) {
      submitBtn.disabled = false;
      result.innerHTML = `<div class="result-fail">${esc(data.error)}</div>`;
      return;
    }

    if (!data.passed) {
      // The server never tells us which questions were wrong (that would leak
      // the key), so we can only show the score and offer a fresh attempt.
      result.innerHTML = `
        <div class="result-fail">
          <strong>${esc(String(data.score))}/${esc(String(data.total))} correct.</strong>
          Re-read the lesson and try again.
          <div class="quiz-next-row">
            <button type="button" class="btn-next" id="quizRetryBtn">Try again</button>
          </div>
        </div>`;
      const retry = document.getElementById("quizRetryBtn");
      if (retry) {
        retry.addEventListener("click", () =>
          startAttempt(lesson, container, "Fresh questions, give it another go."));
      }
      return;
    }

    // Passed.
    form.querySelectorAll("input, button").forEach(el => el.disabled = true);
    result.innerHTML = payoutMessage(data.payout);
    finalize(lesson, result);
  }

  async function submitAnswers(token, answers, address) {
    const body = { token, answers };
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
          ✓ All correct, ${esc(CONFIG.REWARD_TEXT)} sent!<br>
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
