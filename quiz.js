// quiz.js

const API_URL = "http://127.0.0.1:5000/api/sendVeil"; // change later when deployed

document.getElementById("quizForm").onsubmit = async function (e) {
  e.preventDefault();

  // Map of correct answers
  const answers = {
    q1: "b",
    q2: "c"
  };

  const result = document.getElementById("result");
  const xpBar = document.getElementById("xpBar");
  const addrInput = document.getElementById("veilAddress");

  if (!result || !xpBar || !addrInput) {
    alert("Missing result/xp/address elements in the HTML.");
    return;
  }

  // XP tracking
  let xp = parseInt(localStorage.getItem("xp") || "0", 10);
  xpBar.innerText = "XP: " + xp;

  // Calculate score
  let score = 0;
  const total = Object.keys(answers).length;

  for (let q in answers) {
    const userAnswer = document.querySelector(`input[name="${q}"]:checked`);
    if (userAnswer && userAnswer.value === answers[q]) {
      score++;
    }
  }

  // Expose score globally if we want to use it elsewhere
  window.quizScore = score;
  window.quizTotal = total;

  // Require all correct for now
  if (score === total) {
    result.innerText = "✅ You passed! Enter your Veil address to claim your reward.";
    result.style.color = "#00ff99";

    xp += 5; // simple XP award
    localStorage.setItem("xp", xp);
    xpBar.innerText = "XP: " + xp;
  } else {
    result.innerText = `❌ You got ${score} out of ${total} correct. Try again!`;
    result.style.color = "#ff5555";
    return; // don't send any reward if they didn't pass
  }

  // Now handle reward sending
  const address = addrInput.value.trim();
  if (!address || address.length < 20) {
    result.innerText = "Please enter a valid Veil address before claiming your reward.";
    result.style.color = "#ffcc00";
    return;
  }

  result.innerText = "⏳ Sending your Veil reward...";
  result.style.color = "#00bcd4";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address })
    });

    const txt = await res.text();

    if (!res.ok) {
      result.innerText = txt || "Error sending reward. Please try again later.";
      result.style.color = "#ff5555";
      return;
    }

    // Handle cooldown message from api.py
    if (txt.toLowerCase().includes("wait 24 hours")) {
      result.innerText = txt;
      result.style.color = "#ffcc00";
      return;
    }

    result.innerText = txt; // e.g. "Veil sent to <addr>!"
    result.style.color = "#00ff99";

    // Mark lesson complete in localStorage for the homepage
    localStorage.setItem("veilLesson_1_completed", "true"); // change 1 → lesson number if needed
  } catch (err) {
    console.error(err);
    result.innerText = "Error talking to the reward server. Try again later.";
    result.style.color = "#ff5555";
  }
};
