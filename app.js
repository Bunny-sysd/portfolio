/* ═══════════════════════════════════════════
   0xPortfolio — app.js
   Theme: Immersive Cyber-Diagnostic Interface
   ═══════════════════════════════════════════ */

'use strict';

// ── CUSTOM CURSOR & SPOTLIGHT EFFECT ────────────────
(function initCursor() {
  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');

  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (dot) {
      dot.style.left  = mouseX + 'px';
      dot.style.top   = mouseY + 'px';
    }

    // Set CSS custom variables for the animated spotlight gradient on body
    document.documentElement.style.setProperty('--mouse-x', mouseX + 'px');
    document.documentElement.style.setProperty('--mouse-y', mouseY + 'px');
  });

  // Smooth ring follow
  function animateRing() {
    ringX += (mouseX - ringX) * 0.13;
    ringY += (mouseY - ringY) * 0.13;
    if (ring) {
      ring.style.left = ringX + 'px';
      ring.style.top  = ringY + 'px';
    }
    requestAnimationFrame(animateRing);
  }
  animateRing();

  // Hover effect on interactive elements
  const hoverTargets = 'a, button, .bento-project-card, .sidebar-item, .cert-card, .skill-badge, .know-badge';
  document.querySelectorAll(hoverTargets).forEach(el => {
    el.addEventListener('mouseenter', () => ring && ring.classList.add('hovered'));
    el.addEventListener('mouseleave', () => ring && ring.classList.remove('hovered'));
  });

  // Click burst
  document.addEventListener('mousedown', () => dot && dot.classList.add('clicked'));
  document.addEventListener('mouseup',   () => dot && dot.classList.remove('clicked'));
})();

// ── MATRIX DECRYPTION EFFECT ───────────────────────
const decryptChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$&%*#+=/\\{}[]';
function decryptText(element) {
  if (element.classList.contains('decrypting')) return;
  element.classList.add('decrypting');

  const targetText = element.dataset.text || element.textContent;
  let iterations = 0;

  const interval = setInterval(() => {
    element.textContent = targetText.split('').map((char, index) => {
      if (index < iterations) {
        return targetText[index];
      }
      if (char === ' ') return ' ';
      return decryptChars[Math.floor(Math.random() * decryptChars.length)];
    }).join('');

    if (iterations >= targetText.length) {
      clearInterval(interval);
      element.classList.remove('decrypting');
      element.textContent = targetText; // guarantee exact string match
    }
    iterations += targetText.length / 15; // solve dynamically based on string size
  }, 25);
}

// Bind hover trigger for decryption
document.querySelectorAll('.decrypt-trigger').forEach(el => {
  el.addEventListener('mouseenter', () => decryptText(el));
});

// ── SPLASH SCREEN ──
(function initSplash() {
  const splash   = document.getElementById('splash');
  const bar      = document.getElementById('splashBar');
  const lines    = [
    document.getElementById('splashLine1'),
    document.getElementById('splashLine2'),
    document.getElementById('splashLine3'),
  ];

  const messages = [
    '> Initializing terminal link...',
    '> Syncing vulnerability decompiler...',
    '> Authorization granted. Decrypting interface...',
  ];

  let lineIdx = 0;
  let charIdx = 0;

  function typeNext() {
    if (lineIdx >= messages.length) return;
    const msg  = messages[lineIdx];
    const line = lines[lineIdx];

    if (charIdx < msg.length) {
      if (line) line.textContent += msg[charIdx++];
      setTimeout(typeNext, 25);
    } else {
      lineIdx++;
      charIdx = 0;
      if (lineIdx < messages.length) {
        setTimeout(typeNext, 180);
      }
    }
  }

  // Start typing
  setTimeout(() => {
    typeNext();
    if (bar) bar.style.width = '100%';
  }, 200);

  // Hide splash and run hero boot diagnostic simulation
  setTimeout(() => {
    if (splash) splash.classList.add('hidden');
    document.body.style.overflow = '';
    
    // Trigger scroll reveals
    document.querySelectorAll('.hero-section .reveal-up').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 100);
    });

    // Run active hero diagnostic simulation
    runHeroTerminalDiagnostics();
  }, 2600);

  document.body.style.overflow = 'hidden';
})();

// ── HERO BOOT TERMINAL SIMULATION ────────────────
function runHeroTerminalDiagnostics() {
  const terminal = document.getElementById('heroTerminalOutput');
  if (!terminal) return;

  // Clear original placeholder contents
  terminal.innerHTML = '';

  const diagnosticLines = [
    { text: '[INIT] Loading core framework assets...', delay: 100, class: 'text-muted' },
    { text: '[OK] Connection to target virtual machine established.', delay: 400, class: 'text-muted' },
    { text: '[OK] 91 TryHackMe Badges mapped onto security matrix.', delay: 700, class: 'text-muted' },
    { text: '[READY] Decryption module initialized.', delay: 1000, class: 'text-green' },
    { text: '==================================================', delay: 1200, class: 'separator' },
    { text: 'AARON ALVA // ', delay: 1550, isName: true }
  ];

  diagnosticLines.forEach(line => {
    setTimeout(() => {
      const div = document.createElement('div');
      
      if (line.isName) {
        div.className = 'console-line identity-line';
        
        const prefix = document.createElement('span');
        prefix.className = 'role-prefix';
        prefix.textContent = line.text;
        
        const nameText = document.createElement('span');
        nameText.className = 'text-white';
        nameText.dataset.text = 'Cybersecurity Researcher & Agentic AI Developer';
        nameText.textContent = '';
        
        div.appendChild(prefix);
        div.appendChild(nameText);
        terminal.appendChild(div);
        
        // Decrypt name text once printed
        setTimeout(() => {
          decryptText(nameText);
        }, 150);
        
        // Add description below name text
        setTimeout(() => {
          const desc = document.createElement('div');
          desc.className = 'console-line bio-line text-dim mt-4';
          desc.textContent = 'Building closed-loop AI pipelines that decompile, fuzz, exploit, and patch target C binaries autonomously. Creating Mutagen, an agentic zero-day fuzzer.';
          terminal.appendChild(desc);
        }, 800);

      } else {
        div.className = 'console-line ' + (line.class || '');
        div.textContent = line.text;
        terminal.appendChild(div);
      }
      
      // Auto-scroll terminal body if content overflows
      terminal.scrollTop = terminal.scrollHeight;
    }, line.delay);
  });
}

// ── FLOATING PILL NAV ACTIVE TAB HIGHLIGHT ────────
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[data-section]');

  function updateActive() {
    const scrollPos = window.scrollY + window.innerHeight * 0.35;
    let activeId = '';

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        activeId = section.getAttribute('id');
      }
    });

    if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 60) {
      activeId = 'contact';
    }

    navLinks.forEach(link => {
      if (link.dataset.section === activeId) {
        link.classList.add('active-nav-tab');
        link.style.color = 'var(--green)';
      } else {
        link.classList.remove('active-nav-tab');
        link.style.color = '';
      }
    });
  }

  window.addEventListener('scroll', updateActive, { passive: true });
  window.addEventListener('resize', updateActive, { passive: true });
  setTimeout(updateActive, 100);
})();

// ── MOBILE MENU TOGGLES ──
(function initMobileMenu() {
  const hamburger   = document.getElementById('hamburger');
  const mobileMenu  = document.getElementById('mobileMenu');
  const mobileClose = document.getElementById('mobileClose');

  if (!hamburger || !mobileMenu) return;

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
  if (mobileClose) mobileClose.addEventListener('click', close);

  document.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', close);
  });
})();

// ── SMOOTH NAV SCROLLING ──
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      
      // Close mobile menu if open
      const mobileMenu = document.getElementById('mobileMenu');
      if (mobileMenu) mobileMenu.classList.remove('open');
      document.body.style.overflow = '';

      const offset = 90;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

// ── SCROLL REVEALS ──
(function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        
        // If the header has a decrypt title, decrypt it automatically when revealed
        const title = entry.target.querySelector('.section-title.decrypt-trigger');
        if (title) {
          setTimeout(() => decryptText(title), 200);
        }
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal-up').forEach(el => observer.observe(el));
})();

// ── COUNTER STATISTICS ANIMATION ──
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
  }, { threshold: 0.4 });

  const heroStats = document.querySelector('.hero-grid-stats');
  if (heroStats) observer.observe(heroStats);
})();

// ── CARD MOUSE ROTATION (TILT) EFFECT ──
(function initTilt() {
  document.querySelectorAll('.bento-project-card, .cert-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'none';
    });
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
      const ny = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
      
      const edgeThreshold = 0.75;
      if (Math.abs(nx) > edgeThreshold || Math.abs(ny) > edgeThreshold) return;
      
      const rx = ny * 3.5; // subtle rotate strength
      const ry = nx * -3.5;
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      card.style.transform = '';
    });
  });
})();

// ── TRYHACKME 91 BADGE MATRIX POPULATOR ────────────────
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
            dot.classList.add('active');
          }, index * 8 + Math.random() * 200);
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  const section = document.querySelector('.badge-matrix-section');
  if (section) observer.observe(section);
})();

// Console log egg easter header
console.log(
  '%c 0xPORTFOLIO ACTIVE // AUTHORIZED SESSION ',
  'color:#00ff41;background:#0A0A0C;font-family:monospace;font-size:16px;padding:6px 12px;border:1px solid #00ff41;'
);
