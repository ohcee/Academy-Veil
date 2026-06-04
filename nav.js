/**
 * nav.js — Injects the header/nav and XP bar into every page.
 * Include this script ONCE per page. It reads LESSONS from lessons.js (already loaded).
 * To add a lesson: edit lessons.js. Nav updates automatically everywhere.
 */

(function () {
  // ── XP helpers ────────────────────────────────────────────────────────────
  function getXP() {
    return parseInt(localStorage.getItem("veil_xp") || "0", 10);
  }

  // ── Build nav HTML ────────────────────────────────────────────────────────
  function buildNav(currentId) {
    const completedRaw = localStorage.getItem("veil_completed");
    const completed = completedRaw ? JSON.parse(completedRaw) : [];

    const lessonLinks = LESSONS.map(l => {
      const isActive   = l.id === currentId;
      const isDone     = completed.includes(l.id);
      const isLocked   = l.id > 1 && !completed.includes(l.id - 1) && !isActive;
      const cls = [
        "nav-lesson",
        isActive  ? "active"   : "",
        isDone    ? "done"     : "",
        isLocked  ? "locked"   : ""
      ].filter(Boolean).join(" ");

      if (isLocked) {
        return `<span class="${cls}" title="Complete lesson ${l.id - 1} to unlock">
          <span class="lock-icon">🔒</span> ${l.id}
        </span>`;
      }
      return `<a href="lesson.html?id=${l.id}" class="${cls}">${l.id}</a>`;
    }).join("");

    const xp       = getXP();
    const total    = typeof totalXP === "function" ? totalXP() : 0;
    const pct      = total > 0 ? Math.round((xp / total) * 100) : 0;

    return `
<header class="site-header">
  <div class="header-inner">
    <a href="index.html" class="brand">
      <img src="veil-logo.png" alt="Veil" class="brand-logo">
      <span class="brand-text">ACADEMY</span>
    </a>

    <nav class="main-nav">
      <a href="index.html" class="nav-home ${currentId === 0 ? "active" : ""}">Home</a>
      <div class="nav-lessons">${lessonLinks}</div>
    </nav>

    <a href="https://veil-project.com" target="_blank" class="nav-ext">veil-project.com ↗</a>
  </div>

  <div class="xp-strip">
    <div class="xp-label">
      <span class="xp-val">${xp} XP</span>
      <span class="xp-total">/ ${total} XP</span>
    </div>
    <div class="xp-track">
      <div class="xp-fill" style="width:${pct}%"></div>
    </div>
    <span class="xp-pct">${pct}%</span>
  </div>
</header>`;
  }

  // ── Inject ────────────────────────────────────────────────────────────────
  function inject() {
    // Detect current lesson from meta tag set in each page
    const meta = document.querySelector("meta[name='lesson-id']");
    const currentId = meta ? parseInt(meta.content, 10) : 0;

    const container = document.createElement("div");
    container.innerHTML = buildNav(currentId);
    document.body.insertBefore(container.firstElementChild, document.body.firstChild);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
