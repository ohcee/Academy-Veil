document.getElementById("quizForm").onsubmit = function(e) {
  e.preventDefault();

  const answers = {
    q1: "b",
    q2: "c"
  };

    // XP Tracking
  let xp = parseInt(localStorage.getItem("xp") || "0");
  document.getElementById("xpBar").innerText = "XP: " + xp;

  let score = 0;
  for (let q in answers) {
    const userAnswer = document.querySelector(`input[name="${q}"]:checked`);
    if (userAnswer && userAnswer.value === answers[q]) score++;
  }

  if (score == 2) 
    {
    result.innerText = "✅ You passed! Veil reward is on its way.";
    result.style.color = "#00ff99";
    xp += 5;
    localStorage.setItem("xp", xp);
    document.getElementById("xpBar").innerText = "XP: " + xp;
    
    } else if (score == 3){
    xp += 10;
    localStorage.setItem("xp", xp);
    document.getElementById("xpBar").innerText = "XP: " + xp;
    confetti({
      particleCount: 100,
      spread: 60,
      origin: { y: 0.6 }
    });

    } else {
    result.innerText = "❌ Not enough correct answers. Try again!";
    result.style.color = "#ff5555";
    }

    fetch("https://yourserver.com/api/sendVeil", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address })
    }).then(res => res.text())
      .then(txt => document.getElementById("result").innerText = txt);
};
