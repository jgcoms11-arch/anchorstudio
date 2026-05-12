// Navbar
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 40));

// Mobile nav
const nt = document.getElementById('navToggle'), nl = document.getElementById('navLinks');
nt.addEventListener('click', () => nl.classList.toggle('open'));
nl.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nl.classList.remove('open')));

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
  });
});

// ── Scroll Animation Engine ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.anim').forEach(el => observer.observe(el));

// Safety fallback — force all .anim visible after 2s so content never stays hidden
setTimeout(() => {
  document.querySelectorAll('.anim:not(.in)').forEach(el => el.classList.add('in'));
}, 2000);
