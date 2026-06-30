/* ═══════════════════════════════════════════
   0xPortfolio — app.js
   ═══════════════════════════════════════════ */

'use strict';

// ── SPLASH SCREEN ──────────────────────────
(function initSplash() {
  const splash   = document.getElementById('splash');
  const bar      = document.getElementById('splashBar');
  const lines    = [
    document.getElementById('splashLine1'),
    document.getElementById('splashLine2'),
    document.getElementById('splashLine3'),
  ];

  const messages = [
    '> Initializing portfolio...',
    '> Loading security modules...',
    '> Access granted. Welcome.',
  ];

  let lineIdx = 0;
  let charIdx = 0;

  function typeNext() {
    if (lineIdx >= messages.length) return;
    const msg  = messages[lineIdx];
    const line = lines[lineIdx];

    if (charIdx < msg.length) {
      line.textContent += msg[charIdx++];
      setTimeout(typeNext, 38);
    } else {
      lineIdx++;
      charIdx = 0;
      if (lineIdx < messages.length) {
        setTimeout(typeNext, 260);
      }
    }
  }

  // Start typing after a short pause
  setTimeout(() => {
    typeNext();
    // Animate the progress bar
    requestAnimationFrame(() => {
      bar.style.width = '100%';
    });
  }, 300);

  // Hide splash after animations complete
  setTimeout(() => {
    splash.classList.add('hidden');
    document.body.style.overflow = '';
    // Trigger hero reveals
    document.querySelectorAll('.hero-section .reveal-up').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 120);
    });
  }, 3200);

  document.body.style.overflow = 'hidden';
})();


// ── CUSTOM CURSOR ──────────────────────────
(function initCursor() {
  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');

  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left  = mouseX + 'px';
    dot.style.top   = mouseY + 'px';
  });

  // Smooth ring follow
  function animateRing() {
    ringX += (mouseX - ringX) * 0.13;
    ringY += (mouseY - ringY) * 0.13;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  // Hover effect on interactive elements
  const hoverTargets = 'a, button, .project-card, .info-card, .cert-card, .skill-tag, .know-badge';
  document.querySelectorAll(hoverTargets).forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hovered'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hovered'));
  });

  // Click burst
  document.addEventListener('mousedown', () => dot.classList.add('clicked'));
  document.addEventListener('mouseup',   () => dot.classList.remove('clicked'));
})();





// ── HEADER SCROLL EFFECT ───────────────────
(function initHeader() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (header) {
      header.classList.toggle('scrolled', window.scrollY > 60);
    }
  }, { passive: true });
})();


// ── MOBILE MENU ────────────────────────────
(function initMobileMenu() {
  const hamburger   = document.getElementById('hamburger');
  const mobileMenu  = document.getElementById('mobileMenu');
  const mobileClose = document.getElementById('mobileClose');

  function open() {
    mobileMenu.classList.add('open');
    hamburger.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('active');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', open);
  mobileClose.addEventListener('click', close);

  document.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', close);
  });
})();


// ── SMOOTH SCROLL NAV ──────────────────────
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();


// ── TYPEWRITER ROLES ───────────────────────
(function initTypewriter() {
  const roles = [
    'Cybersecurity Enthusiast',
    'Agentic AI Developer',
    'Penetration Tester',
    'AI Security Researcher',
    'CTF Player',
    'Creator of Mutagen',
  ];

  const el = document.getElementById('roleTypewriter');
  if (!el) return;

  let roleIdx = 0;
  let charIdx = 0;
  let deleting = false;
  let paused   = false;

  function type() {
    if (paused) { setTimeout(type, 1200); paused = false; return; }

    const role = roles[roleIdx];

    if (!deleting) {
      el.textContent = role.slice(0, ++charIdx);
      if (charIdx === role.length) { deleting = true; paused = true; }
      setTimeout(type, 80);
    } else {
      el.textContent = role.slice(0, --charIdx);
      if (charIdx === 0) {
        deleting = false;
        roleIdx = (roleIdx + 1) % roles.length;
      }
      setTimeout(type, 40);
    }
  }

  // Start after splash
  setTimeout(type, 3400);
})();


// ── SCROLL REVEAL ──────────────────────────
(function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Animate skill bars when visible
        entry.target.querySelectorAll('.skill-bar-fill').forEach(bar => {
          bar.style.width = bar.dataset.width + '%';
        });
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal-up').forEach(el => observer.observe(el));
  // Also observe containers for skill bars
  document.querySelectorAll('.skill-bars-wrap').forEach(el => observer.observe(el));
})();


// ── COUNTER ANIMATION ──────────────────────
(function initCounters() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.stat-num[data-target]').forEach(el => {
        const target = parseInt(el.dataset.target, 10);
        const duration = 1200;
        const start = performance.now();
        function update(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.floor(eased * target);
          if (progress < 1) requestAnimationFrame(update);
          else el.textContent = target;
        }
        requestAnimationFrame(update);
      });
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) observer.observe(heroStats);
})();


// ── SKILL BAR TRIGGER ─────────────────────
(function initSkillBars() {
  // Triggered via IntersectionObserver in initReveal as well, but direct handle:
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.skill-bar-fill').forEach(bar => {
          setTimeout(() => {
            bar.style.width = bar.dataset.width + '%';
          }, 200);
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.skill-bars-wrap').forEach(el => observer.observe(el));
})();


// ── ACTIVE NAV LINK ON SCROLL ──────────────
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[data-section]');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.style.color = link.dataset.section === entry.target.id
            ? 'var(--text)'
            : '';
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => observer.observe(s));
})();


// ── CERT CARD TILT ────────────────────────
(function initTilt() {
  document.querySelectorAll('.project-card, .cert-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const rx = (e.clientY - cy) / rect.height * 6;
      const ry = (e.clientX - cx) / rect.width  * -6;
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-5px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();


// ── BADGE MATRIX ───────────────────────────
(function initBadgeMatrix() {
  const container = document.getElementById('badgeMatrix');
  if (!container) return;

  const totalBadges = 91;
  for (let i = 0; i < totalBadges; i++) {
    const dot = document.createElement('div');
    dot.className = 'badge-dot';
    container.appendChild(dot);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const dots = entry.target.querySelectorAll('.badge-dot');
        dots.forEach((dot, index) => {
          setTimeout(() => {
            // Mix of green and purple dots
            if (Math.random() > 0.85) {
               dot.classList.add('ai-active');
            } else {
               dot.classList.add('active');
            }
          }, index * 10 + Math.random() * 300);
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const section = document.querySelector('.badge-matrix-section');
  if (section) observer.observe(section);
})();


// ── CONSOLE EGG ───────────────────────────
console.log(
  '%c 0x | Portfolio ',
  'color:#00ff88;background:#0a0a0f;font-family:monospace;font-size:20px;padding:8px 16px;border:1px solid #00ff88;border-radius:4px;'
);
console.log(
  '%c > Greetings, fellow hacker. 👋',
  'color:#00d4ff;font-family:monospace;font-size:13px;'
);
console.log(
  '%c > Built with ☕ curiosity and too many late nights.',
  'color:#94a3b8;font-family:monospace;font-size:12px;'
);
