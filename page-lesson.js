/**
 * page-lesson.js — builds a lesson page from the LESSONS data.
 *
 * Kept out of lesson.html so the Content-Security-Policy can forbid inline
 * script entirely (script-src 'self'), which is the single most effective
 * mitigation against script injection on a static site.
 */

(function () {
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const params = new URLSearchParams(window.location.search);
  const id     = parseInt(params.get("id") || "1", 10);
  const lesson = getLessonById(id);

  if (!lesson) {
    document.getElementById("lessonTitle").textContent = "Lesson not found.";
    document.getElementById("lessonSummary").textContent =
      "That lesson doesn't exist. Head back to the Academy home page.";
    return;
  }

  // nav.js reads this to highlight the current lesson.
  document.querySelector("meta[name='lesson-id']").content = id;
  document.title = `Lesson ${id}: ${lesson.title} — Veil Academy`;

  document.getElementById("crumbTitle").textContent     = `Lesson ${id}`;
  document.getElementById("lessonNumBadge").textContent = String(id).padStart(2, "0");
  document.getElementById("lessonTitle").textContent    = lesson.title;
  document.getElementById("lessonSummary").textContent  = lesson.summary;
  document.getElementById("lessonXPBadge").querySelector("span").textContent = lesson.xp;

  // ── Body ────────────────────────────────────────────────────────────────
  const bodyEl = document.getElementById("lessonBody");

  bodyEl.innerHTML = lesson.body.map(block => {
    switch (block.type) {
      case "p":
        return `<p>${esc(block.text)}</p>`;
      case "h":
        return `<h3>${esc(block.text)}</h3>`;
      case "ul":
        return `<ul>${block.items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>`;
      case "note":
        return `<div class="lesson-note">${esc(block.text)}</div>`;
      case "code":
        return `<pre class="lesson-code"><code>${esc(block.text)}</code></pre>`;
      default:
        return "";
    }
  }).join("");

  // ── Sources ─────────────────────────────────────────────────────────────
  // Every factual claim on this site should be checkable. Where a lesson cites
  // the code it is describing, link it.
  if (Array.isArray(lesson.sources) && lesson.sources.length) {
    const sources = document.createElement("div");
    sources.className = "lesson-sources";
    sources.innerHTML = `
      <h4>Check it yourself</h4>
      <ul>
        ${lesson.sources.map(s => `
          <li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a></li>
        `).join("")}
      </ul>`;
    bodyEl.appendChild(sources);
  }

  // ── Lock ────────────────────────────────────────────────────────────────
  // The lesson text stays readable either way; only the quiz is gated.
  if (!Progress.isUnlocked(id)) {
    const lock = document.createElement("div");
    lock.className = "locked-overlay";
    lock.innerHTML = `
      <div class="locked-msg">
        <div class="locked-icon">🔒</div>
        <p>Complete <a href="lesson.html?id=${id - 1}">Lesson ${id - 1}</a> to unlock this quiz.</p>
      </div>`;
    document.getElementById("quizContainer").appendChild(lock);
    return;
  }

  Quiz.render(lesson, "quizContainer");
})();
