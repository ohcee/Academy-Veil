/**
 * progress.js — XP tracking and lesson lock/unlock logic.
 * Reads/writes to localStorage. No server needed.
 */

const Progress = (() => {
  const XP_KEY        = "veil_xp";
  const COMPLETED_KEY = "veil_completed";

  function getXP() {
    return parseInt(localStorage.getItem(XP_KEY) || "0", 10);
  }

  function addXP(amount) {
    const current = getXP();
    const next    = current + amount;
    localStorage.setItem(XP_KEY, next);
    return next;
  }

  function getCompleted() {
    const raw = localStorage.getItem(COMPLETED_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  function markComplete(lessonId) {
    const list = getCompleted();
    if (!list.includes(lessonId)) {
      list.push(lessonId);
      localStorage.setItem(COMPLETED_KEY, JSON.stringify(list));
    }
  }

  function isComplete(lessonId) {
    return getCompleted().includes(lessonId);
  }

  /**
   * Sequential unlocking only makes sense when quizzes can actually be marked.
   * Scoring happens on the faucet server, so with no server configured there is
   * no way to complete lesson 1 and therefore no way to ever reach lesson 2.
   * In that case the whole course opens for reading — "study mode".
   */
  function studyMode() {
    return typeof faucetConfigured !== "function" || !faucetConfigured();
  }

  function isUnlocked(lessonId) {
    if (lessonId <= 1) return true;
    if (studyMode()) return true;
    return isComplete(lessonId - 1);
  }

  /** Returns id of the next lesson after lessonId, or null if none */
  function nextLesson(lessonId) {
    const ids = LESSONS.map(l => l.id).sort((a, b) => a - b);
    const idx = ids.indexOf(lessonId);
    return idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : null;
  }

  return { getXP, addXP, getCompleted, markComplete, isComplete, isUnlocked, nextLesson, studyMode };
})();
