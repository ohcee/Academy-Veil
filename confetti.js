/**
 * confetti.js — a small self-contained celebration effect.
 *
 * This replaces the canvas-confetti CDN script. A CDN <script> tag hands the
 * visitor's IP address, user agent, and referring page to a third party on every
 * single page load. On a site that exists to teach people about network privacy,
 * that was not a defensible dependency. This does the same job in ~60 lines and
 * makes no requests at all.
 */

function confetti(opts) {
  const options = opts || {};
  const count = options.particleCount || 100;
  const spread = options.spread || 70;
  const originY = (options.origin && options.origin.y) || 0.6;
  const colors = options.colors || ["#00d4ff", "#7c3aed", "#ffffff"];

  // Respect the user's motion preference.
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const originX = canvas.width / 2;
  const startY = canvas.height * originY;
  const particles = [];

  for (let i = 0; i < count; i++) {
    const angle = (-90 + (Math.random() - 0.5) * spread) * (Math.PI / 180);
    const velocity = 6 + Math.random() * 8;
    particles.push({
      x: originX,
      y: startY,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      size: 4 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
      life: 1
    });
  }

  let frame = 0;

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    for (const p of particles) {
      if (p.life <= 0) continue;
      alive = true;

      p.vy += 0.28;          // gravity
      p.vx *= 0.99;          // drag
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;
      p.life -= 0.008;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }

    frame++;
    if (alive && frame < 400) {
      requestAnimationFrame(tick);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(tick);
}
