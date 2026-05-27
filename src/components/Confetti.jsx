import { useEffect, useRef } from 'react';

// Lightweight confetti — no external deps
const COLORS = ['#00d084','#f59e0b','#818cf8','#f87171','#fbbf24','#34d399','#60a5fa'];

function rnd(min, max) { return Math.random() * (max - min) + min; }

export function fireConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';

  const pieces = Array.from({ length: 120 }, () => ({
    x:    rnd(0, canvas.width),
    y:    rnd(-canvas.height * 0.2, 0),
    r:    rnd(5, 10),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    vx:   rnd(-2, 2),
    vy:   rnd(3, 8),
    spin: rnd(-0.2, 0.2),
    rot:  rnd(0, Math.PI * 2),
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
    opacity: 1,
  }));

  let frame;
  let elapsed = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    elapsed++;
    let alive = 0;
    for (const p of pieces) {
      p.x   += p.vx;
      p.y   += p.vy;
      p.rot += p.spin;
      p.vy  += 0.12; // gravity
      if (elapsed > 80) p.opacity = Math.max(0, p.opacity - 0.018);

      if (p.y < canvas.height + 20 && p.opacity > 0) alive++;

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === 'rect') {
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.r / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (alive > 0) {
      frame = requestAnimationFrame(draw);
    } else {
      canvas.style.display = 'none';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  cancelAnimationFrame(frame);
  draw();
}

export default function ConfettiCanvas() {
  return (
    <canvas
      id="confetti-canvas"
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        pointerEvents: 'none', display: 'none',
        width: '100%', height: '100%',
      }}
    />
  );
}
