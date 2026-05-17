/* ==================================================
   AnchorPoint Studio — Galaxy + Black Hole Effect
   - Twinkling star field
   - Particle-to-particle connection lines
   - Black hole at cursor: dark void + glowing ring
   - Gravity lines from nearby stars → cursor
   - Subtle mouse attraction (reduced pull)
   ================================================== */

(function () {
  'use strict';

  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const isMobile = window.innerWidth < 768;

  const CONFIG = {
    count:        isMobile ? 120 : 220,
    connectDist:  130,         /* particle-to-particle line distance */
    bhRadius:     260,         /* black hole gravity line radius     */
    mouseRadius:  180,
    mouseForce:   0.0004,      /* barely any pull — dots just drift  */
    colors: [
      [255, 255, 255],
      [210, 230, 255],
      [160, 200, 255],
      [79,  142, 255],
      [100, 190, 255],
      [180, 140, 255],
      [220, 180, 255],
    ],
  };

  let particles = [];
  let mouse = { x: -1000, y: -1000 };  /* off-screen until moved */
  let orbX  = 0;
  let orbY  = 0;
  let rafId = null;
  let running = true;
  let t = 0;

  /* ── Star ─────────────────────────────────────── */
  class Star {
    constructor() { this.spawn(); }

    spawn() {
      this.x  = Math.random() * canvas.width;
      this.y  = Math.random() * canvas.height;

      const speed = Math.random() < 0.80 ? 0.07 : 0.22;
      this.vx = (Math.random() - 0.5) * speed;
      this.vy = (Math.random() - 0.5) * speed;

      const tier = Math.random();
      if (tier < 0.60)      { this.baseR = Math.random() * 0.55 + 0.18; this.baseAlpha = Math.random() * 0.28 + 0.07; }
      else if (tier < 0.88) { this.baseR = Math.random() * 0.90 + 0.60; this.baseAlpha = Math.random() * 0.38 + 0.22; }
      else                  { this.baseR = Math.random() * 1.40 + 1.10; this.baseAlpha = Math.random() * 0.28 + 0.52; }

      this.twinkleSpeed  = Math.random() * 0.022 + 0.005;
      this.twinkleOffset = Math.random() * Math.PI * 2;
      this.twinkleAmp    = Math.random() * 0.32 + 0.05;
      this.color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];

      /* current rendered values */
      this.r     = this.baseR;
      this.alpha = this.baseAlpha;
    }

    update() {
      /* Reduced mouse attraction */
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const d  = Math.hypot(dx, dy);
      if (d < CONFIG.mouseRadius && d > 1) {
        const f = CONFIG.mouseForce * (1 - d / CONFIG.mouseRadius);
        this.vx += (dx / d) * f;
        this.vy += (dy / d) * f;
      }

      this.vx *= 0.975;
      this.vy *= 0.975;
      /* Cap max speed so dots never fully chase the cursor */
      const spd = Math.hypot(this.vx, this.vy);
      if (spd > 0.5) { this.vx = (this.vx / spd) * 0.5; this.vy = (this.vy / spd) * 0.5; }
      this.x  += this.vx;
      this.y  += this.vy;

      /* Wrap */
      if (this.x < -5) this.x = canvas.width  + 5;
      if (this.x > canvas.width  + 5) this.x = -5;
      if (this.y < -5) this.y = canvas.height + 5;
      if (this.y > canvas.height + 5) this.y = -5;

      /* Twinkling */
      const tw   = Math.sin(t * this.twinkleSpeed + this.twinkleOffset);
      this.r     = Math.max(0.1, this.baseR     + tw * this.baseR * 0.38);
      this.alpha = Math.max(0,   this.baseAlpha + tw * this.twinkleAmp);
    }

    draw() {
      /* Boost near nebula core */
      const dOrb = Math.hypot(orbX - this.x, orbY - this.y);
      const boost = Math.max(0, 1 - dOrb / 280) * 0.65;
      const alpha = Math.min(1, this.alpha + boost);
      const size  = this.r + boost * 1.4;
      const [r, g, b] = this.color;

      if (size > 1.0 || boost > 0.12) {
        ctx.shadowColor = `rgba(${r},${g},${b},0.75)`;
        ctx.shadowBlur  = 4 + size * 3.5 + boost * 10;
      }
      ctx.beginPath();
      ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  /* ── Init ────────────────────────────────────── */
  function init() {
    orbX = canvas.width  / 2;
    orbY = canvas.height / 2;
    particles = Array.from({ length: CONFIG.count }, () => new Star());
  }

  /* ── Nebula clouds ───────────────────────────── */
  function drawNebula() {
    let g = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, 320);
    g.addColorStop(0,    'rgba(100,160,255,0.14)');
    g.addColorStop(0.30, 'rgba(60,100,200,0.06)');
    g.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(orbX, orbY, 320, 0, Math.PI * 2);
    ctx.fill();

    /* Inner core glow */
    g = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, 65);
    g.addColorStop(0,   'rgba(180,215,255,0.20)');
    g.addColorStop(0.5, 'rgba(79,142,255,0.07)');
    g.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(orbX, orbY, 65, 0, Math.PI * 2);
    ctx.fill();

    /* Purple cloud — top-right */
    const px = canvas.width * 0.74 + (orbX - canvas.width  * 0.5) * 0.14;
    const py = canvas.height * 0.28 + (orbY - canvas.height * 0.5) * 0.10;
    g = ctx.createRadialGradient(px, py, 0, px, py, 240);
    g.addColorStop(0,   'rgba(150,70,255,0.11)');
    g.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, 240, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ── Particle-to-particle lines ──────────────── */
  function drawStarLines() {
    const cd = CONFIG.connectDist;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i], p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const d  = Math.hypot(dx, dy);
        if (d >= cd) continue;

        /* Lines brighten when midpoint is near black hole */
        const mx  = (p1.x + p2.x) / 2;
        const my  = (p1.y + p2.y) / 2;
        const dBH = Math.hypot(mx - mouse.x, my - mouse.y);
        const bhBoost = Math.max(0, 1 - dBH / CONFIG.bhRadius) * 0.45;
        const alpha   = (1 - d / cd) * 0.18 + bhBoost;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(100,160,255,${alpha})`;
        ctx.lineWidth   = 0.45;
        ctx.stroke();
      }
    }
  }


  /* ── Main loop ───────────────────────────────── */
  function loop() {
    if (!running) return;
    t++;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* Edge vignette */
    const vg = ctx.createRadialGradient(
      canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.25,
      canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.92
    );
    vg.addColorStop(0, 'rgba(6,11,22,0)');
    vg.addColorStop(1, 'rgba(6,11,22,0.65)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    /* Nebula core follows mouse slowly */
    orbX += (mouse.x - orbX) * 0.035;
    orbY += (mouse.y - orbY) * 0.035;

    drawNebula();
    drawStarLines();
    particles.forEach(p => { p.update(); p.draw(); });

    rafId = requestAnimationFrame(loop);
  }

  /* ── Resize ──────────────────────────────────── */
  function resize() {
    if (rafId) cancelAnimationFrame(rafId);
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    init();
    if (running) loop();
  }

  /* ── Mouse / touch ───────────────────────────── */
  const section = canvas.closest('section') || canvas.parentElement;
  section.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  section.addEventListener('mouseleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  /* ── Reduced motion ──────────────────────────── */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    running = false;
    resize();
    return;
  }

  resize();
  window.addEventListener('resize', resize);
})();
