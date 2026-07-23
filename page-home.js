/**
 * page-home.js — builds the lesson grid and hero stats on index.html.
 * Kept external so the CSP can forbid inline script (script-src 'self').
 */

(function () {
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const completed = Progress.getCompleted();
  const xp        = Progress.getXP();

  document.getElementById("statLessons").textContent = LESSONS.length;
  document.getElementById("statXP").textContent      = xp;
  document.getElementById("statDone").textContent    = completed.length;

  const grid = document.getElementById("lessonGrid");

  grid.innerHTML = LESSONS.map(lesson => {
    const isDone   = completed.includes(lesson.id);
    const isLocked = !Progress.isUnlocked(lesson.id);
    const cls = ["lesson-card", isDone ? "card-done" : "", isLocked ? "card-locked" : ""]
      .filter(Boolean).join(" ");

    const href = isLocked ? "#" : `lesson.html?id=${lesson.id}`;

    return `
      <a href="${href}" class="${cls}" data-locked="${isLocked}">
        <div class="card-num">${String(lesson.id).padStart(2, "0")}</div>
        <div class="card-body">
          <strong class="card-title">${esc(lesson.title)}</strong>
          <span class="card-summary">${esc(lesson.summary)}</span>
        </div>
        <div class="card-meta">
          <span class="card-xp">${lesson.xp} XP</span>
          ${isDone   ? '<span class="card-badge done">✓ Done</span>' : ""}
          ${isLocked ? '<span class="card-badge locked">🔒</span>'  : ""}
        </div>
      </a>`;
  }).join("");

  // Locked cards are inert. Bound here rather than with an inline onclick
  // attribute, which the CSP blocks.
  grid.querySelectorAll('a[data-locked="true"]').forEach(card => {
    card.addEventListener("click", e => e.preventDefault());
  });
})();
