// progress.js
document.addEventListener("DOMContentLoaded", () => {
  const TOTAL_LESSONS = 11;

  // Figure out how many lessons are passed
  let maxPassed = 0;
  for (let i = 1; i <= TOTAL_LESSONS; i++) {
    if (localStorage.getItem(`lesson${i}_passed`) === "true") {
      maxPassed = i;
    } else {
      break;
    }
  }

  // Lock/unlock lesson links (works on index + lesson pages)
  document.querySelectorAll("[data-lesson-link]").forEach(link => {
    const n = parseInt(link.dataset.lessonLink, 10);

    if (n <= maxPassed) {
      link.classList.add("lesson-completed"); // ✅ finished
    }

    // Only allow user to go to lessons up to maxPassed + 1
    if (n > maxPassed + 1) {
      link.classList.add("lesson-locked");
      link.addEventListener("click", (e) => {
        e.preventDefault();
        alert("Complete the previous lessons to unlock this one.");
      });
    }
  });

  // Handle footer "Next Lesson" button on lesson pages
  const currentLessonEl = document.querySelector("[data-current-lesson]");
  const nextBtn = document.getElementById("nextLessonBtn");

  if (currentLessonEl && nextBtn) {
    const n = parseInt(currentLessonEl.dataset.currentLesson, 10);
    const isPassed = localStorage.getItem(`lesson${n}_passed`) === "true";

    if (n >= TOTAL_LESSONS) {
      // last lesson → hide button
      nextBtn.style.display = "none";
      return;
    }

    if (isPassed) {
      nextBtn.disabled = false;
      nextBtn.textContent = "Next lesson";
      nextBtn.addEventListener("click", () => {
        window.location.href = `lesson${n + 1}.html`;
      });
    } else {
      nextBtn.disabled = true;
      nextBtn.textContent = "Finish this quiz to unlock the next lesson";
    }
  }
});
