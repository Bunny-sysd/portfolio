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
(function initSplashController() {
  const splash   = document.getElementById('splash');
  if (!splash) {
    document.body.style.overflow = '';
    // Trigger scroll reveals immediately
    document.querySelectorAll('.reveal-up').forEach((el) => {
      el.classList.add('visible');
    });
    return;
  }
  const bar      = document.getElementById('splashBar');
  const skipBtn  = document.getElementById('splashSkipBtn');
  const lines    = [
    document.getElementById('splashLine1'),
    document.getElementById('splashLine2'),
    document.getElementById('splashLine3'),
  ];

  const messages = [
    '> [SYS] Loading user profile: Aaron Alva... [OK]',
    '> Syncing vulnerability decompiler...',
    '> Authorization granted. Decrypting interface...',
  ];

  let lineIdx = 0;
  let charIdx = 0;
  let resolved = false;

  function resolveSplash() {
    if (resolved) return;
    resolved = true;

    if (splash) splash.classList.add('hidden');
    document.body.style.overflow = '';
    
    // Trigger scroll reveals
    document.querySelectorAll('.hero-section .reveal-up').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 100);
    });

    // Run active hero diagnostic simulation
    runHeroTerminalDiagnostics();
  }

  function typeNext() {
    if (resolved) return;
    if (lineIdx >= messages.length) {
      setTimeout(resolveSplash, 400);
      return;
    }
    const msg  = messages[lineIdx];
    const line = lines[lineIdx];

    if (charIdx < msg.length) {
      if (line) line.textContent += msg[charIdx++];
      setTimeout(typeNext, 20);
    } else {
      lineIdx++;
      charIdx = 0;
      if (lineIdx < messages.length) {
        setTimeout(typeNext, 120);
      } else {
        setTimeout(resolveSplash, 300);
      }
    }
  }

  // Bind failsafe button click
  if (skipBtn) {
    skipBtn.addEventListener('click', resolveSplash);
  }

  // Bind Escape keyboard key
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      resolveSplash();
    }
  });

  // Ensure Auto-Start on window load
  window.addEventListener('load', () => {
    // Start typing
    setTimeout(() => {
      if (resolved) return;
      typeNext();
      if (bar) bar.style.width = '100%';
    }, 150);

    // Hard fail-safe timeout in case anything is delayed
    setTimeout(resolveSplash, 4000);
  });

  document.body.style.overflow = 'hidden';
})();

// ── HERO BOOT TERMINAL SIMULATION ────────────────
function runHeroTerminalDiagnostics() {
  const terminal = document.getElementById('heroTerminalOutput');
  const inputEl = document.getElementById('terminalInput');
  const chips = document.querySelectorAll('.command-chip');
  if (!terminal) return;

  // Clear output terminal body
  terminal.innerHTML = '';

  const diagnosticLines = [
    { text: '> [SYS] Initializing local Gemma 4 environment... [OK]', delay: 100, class: 'text-dim' },
    { text: '> [SYS] Establishing secure VM pipeline link... [OK]', delay: 350, class: 'text-dim' },
    { text: '> [SYS] Loading user profile: Aaron Lawrence Alva... [OK]', delay: 600, class: 'text-dim' },
    { text: '> [SYS] Mapping 91 TryHackMe completed rooms (Top 1%)... [OK]', delay: 850, class: 'text-dim' },
    { text: '> [SYS] Initializing NLP processing translation agent... [OK]', delay: 1100, class: 'text-green' },
    { text: '> Available modules loaded. Click any highlighted command below or type your inquiry.', delay: 1350, class: 'text-cyan' },
    { text: '==================================================', delay: 1500, class: 'separator' },
    { text: 'AARON ALVA // ', delay: 1700, isName: true }
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
          terminal.scrollTop = terminal.scrollHeight;
        }, 800);

      } else {
        div.className = 'console-line ' + (line.class || '');
        div.textContent = line.text;
        terminal.appendChild(div);
      }
      
      terminal.scrollTop = terminal.scrollHeight;
    }, line.delay);
  });

  // Helper to print a line to terminal output
  function printLine(text, cssClass = '') {
    const div = document.createElement('div');
    div.className = 'console-line ' + cssClass;
    div.textContent = text;
    terminal.appendChild(div);
    terminal.scrollTop = terminal.scrollHeight;
  }

  // Execute terminal command
  function executeCommand(cmd) {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    // Print command header
    printLine('guest@0xportfolio:~$ ' + trimmed, 'prompt-symbol');

    const lowerCmd = trimmed.toLowerCase();

    if (lowerCmd === 'clear') {
      terminal.innerHTML = '';
      return;
    }

    if (lowerCmd === './view_mutagen_fuzzer') {
      printLine('[OK] Triggering autonomous fuzzer pipeline logging...', 'text-cyan');
      let logDelay = 100;
      const logs = [
        '[08:42:01] [SYS] AI zero-day fuzzer engine active.',
        '[08:42:03] [Ghidra] Disassembling C binary buffers...',
        '[08:42:07] [HEAP] Crash caught at instruction offset 0x004011d4.',
        '[08:42:11] [PoC] Compiling buffer overflow exploit payload: VERIFIED.',
        '[08:42:15] [PATCH] Safe buffer injection patch applied to source code.',
        '[08:42:19] [AUDIT] Re-fuzz pass: 0 leaks, 0 crashes. Target secured.'
      ];
      logs.forEach(log => {
        setTimeout(() => {
          printLine(log, 'text-green');
        }, logDelay);
        logDelay += 200;
      });
      return;
    }

    if (lowerCmd === 'cat certifications.txt') {
      printLine('[OK] Querying local credentials vault...', 'text-cyan');
      setTimeout(() => {
        printLine('------------------------------------------------------------', 'text-muted');
        printLine('LEGAL NAME: Aaron Lawrence Alva', 'text-white');
        printLine('VERIFIED CREDENTIALS:', 'text-green');
        printLine('  1. TryHackMe Intro to Cybersecurity (91 Rooms Completed (Top 1% Global)) - VERIFIED', 'text-dim');
        printLine('  2. TryHackMe AI Security (Prompt Injection / Attack Mapping) - VERIFIED', 'text-dim');
        printLine('------------------------------------------------------------', 'text-muted');
      }, 200);
      return;
    }

    if (lowerCmd === 'cat resume.md') {
      printLine('[OK] Fetching formatted functional resume...', 'text-cyan');
      setTimeout(() => {
        printLine('============================================================', 'text-muted');
        printLine('AARON ALVA // Mississauga, ON // Email: aaron.lawrence.alva@gmail.com', 'text-white');
        printLine('------------------------------------------------------------', 'text-muted');
        printLine('SUMMARY:', 'text-green');
        printLine('  Motivated Grade 11 honours student with deep passion for network defense,', 'text-dim');
        printLine('  ethical hacking, and automated security pipelines. Self-taught with fully', 'text-dim');
        printLine('  operational VirtualBox home lab running threat simulations.', 'text-dim');
        printLine('------------------------------------------------------------', 'text-muted');
        printLine('TECHNICAL SKILLS:', 'text-green');
        printLine('  - Security: Wireshark, Nmap, Burp Suite, Metasploit, GraphSpy', 'text-dim');
        printLine('  - Code: Python, Bash, Advanced SQL, JS, TS, C++, C#', 'text-dim');
        printLine('  - Systems: Kali Linux, Ubuntu, Arch, Windows 10/11, VirtualBox', 'text-dim');
        printLine('  - Frameworks: MITRE ATT&CK, OWASP Top 10, TCP/IP Model', 'text-dim');
        printLine('------------------------------------------------------------', 'text-muted');
        printLine('ACHIEVEMENTS:', 'text-green');
        printLine('  - Safe Virtual Hacking Environment: Designed VirtualBox lab simulating attacks.', 'text-dim');
        printLine('  - Local Business AI Automation: Built lead-securing and security-hardened pipelines.', 'text-dim');
        printLine('  - Web Vulnerability Research: Exploited SQLi & privilege escalation vectors.', 'text-dim');
        printLine('  - Gemma 4 Fine-Tuning: Finetuned local transformer model for red team pentesting.', 'text-dim');
        printLine('------------------------------------------------------------', 'text-muted');
        printLine('EDUCATION:', 'text-green');
        printLine('  - Ontario Secondary School Diploma (St. Joseph, Mississauga, ON) // Grade 11 (GIAC GFACT Certified)', 'text-dim');
        printLine('  - Standing: Honours (80+) // Computer Science & Math coursework', 'text-dim');
        printLine('============================================================', 'text-muted');
      }, 200);
      return;
    }

    if (lowerCmd === 'cat skills.db') {
      printLine('[OK] Fetching dynamic skills matrix database...', 'text-cyan');
      setTimeout(() => {
        printLine('------------------------------------------------------------', 'text-muted');
        printLine('OFFENSIVE: Nmap, Metasploit, John the Ripper, Hydra, Custom Exploits', 'text-white');
        printLine('DEFENSIVE: MITRE ATT&CK, OWASP Top 10, Threat Modeling', 'text-white');
        printLine('AI/ML: Fine-tuning transformers, Dataset prep, Hugging Face API', 'text-white');
        printLine('DEVELOPMENT: HTML, CSS, Vanilla JS, REST APIs, JSON Data Pipelines', 'text-white');
        printLine('------------------------------------------------------------', 'text-muted');
      }, 200);
      return;
    }

    if (lowerCmd === 'cat profile.md') {
      printLine('[OK] Querying user catalog database...', 'text-cyan');
      setTimeout(() => {
        printLine('------------------------------------------------------------', 'text-muted');
        printLine('IDENTITY: Aaron Lawrence Alva // Cybersecurity Researcher', 'text-white');
        printLine('BIO: I design closed-loop AI systems that find and fix zero-day vulnerabilities in C codebases automatically.', 'text-dim');
        printLine('PROJECTS: Mutagen (fuzzer), SignalHub (analytics), PentestAI', 'text-dim');
        printLine('CONTACT: aaron.lawrence.alva@gmail.com', 'text-green');
        printLine('------------------------------------------------------------', 'text-muted');
      }, 200);
      return;
    }

    // Default catch-all
    printLine('Error: Command not found: ' + trimmed, 'text-muted');
  }

  // NLP simulated engine
  function processNaturalLanguage(query) {
    printLine('guest@0xportfolio:~$ ' + query, 'text-white');
    printLine('> [NLP_AGENT] Parsing input... translating to system call...', 'text-cyan');

    const cleanQuery = query.toLowerCase();
    let targetCommand = 'cat profile.md'; // fallback

    if (cleanQuery.includes('cert') || cleanQuery.includes('education') || cleanQuery.includes('giac') || cleanQuery.includes('credential') || cleanQuery.includes('badge') || cleanQuery.includes('thm')) {
      targetCommand = 'cat certifications.txt';
    } else if (cleanQuery.includes('resume') || cleanQuery.includes('cv') || cleanQuery.includes('career') || cleanQuery.includes('experience') || cleanQuery.includes('history')) {
      targetCommand = 'cat resume.md';
    } else if (cleanQuery.includes('skill') || cleanQuery.includes('arsenal') || cleanQuery.includes('tools') || cleanQuery.includes('techno') || cleanQuery.includes('offensive') || cleanQuery.includes('defense')) {
      targetCommand = 'cat skills.db';
    } else if (cleanQuery.includes('mutagen') || cleanQuery.includes('fuzzer') || cleanQuery.includes('zero') || cleanQuery.includes('exploit') || cleanQuery.includes('sandbox')) {
      targetCommand = './view_mutagen_fuzzer';
    } else if (cleanQuery.includes('clear') || cleanQuery.includes('clean') || cleanQuery.includes('reset')) {
      targetCommand = 'clear';
    } else if (cleanQuery.includes('profile') || cleanQuery.includes('who') || cleanQuery.includes('bio') || cleanQuery.includes('name') || cleanQuery.includes('about')) {
      targetCommand = 'cat profile.md';
    } else {
      // dynamic query grep
      targetCommand = 'grep -i "' + query.replace(/[^a-zA-Z0-9 ]/g, '') + '" /usr/vault/credentials.db';
    }

    setTimeout(() => {
      printLine('> Executing system call: ' + targetCommand, 'text-muted');
      setTimeout(() => {
        if (targetCommand.startsWith('grep')) {
          printLine('guest@0xportfolio:~$ ' + targetCommand, 'prompt-symbol');
          printLine('[OK] Searching database...', 'text-cyan');
          setTimeout(() => {
            printLine('No exact entry for "' + query + '" found in /usr/vault/credentials.db.', 'text-muted');
            printLine('Suggested action: try click suggested command controls.', 'text-green');
          }, 300);
        } else {
          executeCommand(targetCommand);
        }
      }, 300);
    }, 850);
  }

  // Clickable Chips action listener
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      if (navigator.vibrate) {
        navigator.vibrate(10); // Sharp, 10ms click vibration
      }
      const cmd = chip.getAttribute('data-cmd');
      if (!cmd || !inputEl) return;
      
      // Simulate typing speed
      inputEl.value = '';
      inputEl.focus();
      let charIdx = 0;
      const typeInterval = setInterval(() => {
        if (charIdx < cmd.length) {
          inputEl.value += cmd[charIdx++];
        } else {
          clearInterval(typeInterval);
          setTimeout(() => {
            executeCommand(cmd);
            inputEl.value = '';
          }, 200);
        }
      }, 30);
    });
  });

  // Text Prompt input listener
  if (inputEl) {
    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const val = inputEl.value.trim();
        if (!val) return;

        // Reset input field
        inputEl.value = '';

        // If it's a direct command or in the chips, run directly
        const knownCommands = ['./view_mutagen_fuzzer', 'cat certifications.txt', 'cat skills.db', 'cat profile.md', 'cat resume.md', 'clear'];
        const matchedCmd = knownCommands.find(c => c.toLowerCase() === val.toLowerCase());
        if (matchedCmd) {
          executeCommand(val); // execute matching command with user's casing
        } else {
          // Process via NLP simulated translator
          processNaturalLanguage(val);
        }
      }
    });
  }
}

// ── FLOATING PILL NAV ACTIVE TAB HIGHLIGHT ────────
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[data-section]');
  const hudLinks = document.querySelectorAll('.hud-tab-btn');

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

    hudLinks.forEach(link => {
      if (link.dataset.section === activeId) {
        link.classList.add('active-hud-tab');
        link.style.color = 'var(--green)';
      } else {
        link.classList.remove('active-hud-tab');
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
      
      // Trigger R3F Particle Burst Effect
      window.dispatchEvent(new Event('particle-burst'));

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

// ── FLOATING NETWORK NODE GRAPH CANVAS FOR SKILLS SECTION ──────────
(function initSkillsCanvases() {
  const canvases = document.querySelectorAll('.skills-network-canvas');
  canvases.forEach(canvas => {
    const parentBox = canvas.closest('.bento-skill-box');
    if (!parentBox) return;
    
    const ctx = canvas.getContext('2d');
    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;
    
    let particles = [];
    const particleCount = 15;
    const mouse = { x: null, y: null, active: false };
    
    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.45;
        this.vy = (Math.random() - 0.5) * 0.45;
        this.radius = 1.5 + Math.random() * 2;
      }
      update() {
        if (mouse.active && mouse.x !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            const force = (80 - dist) / 80;
            this.vx += (dx / dist) * force * 0.15;
            this.vy += (dy / dist) * force * 0.15;
          }
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        this.vx *= 0.96;
        this.vy *= 0.96;
        
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 102, 0.6)';
        ctx.fill();
      }
    }
    
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
    
    parentBox.addEventListener('mousemove', e => {
      const rect = parentBox.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    });
    
    parentBox.addEventListener('mouseleave', () => {
      mouse.active = false;
    });
    
    window.addEventListener('resize', () => {
      if (!canvas) return;
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    });
    
    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 60) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 255, 102, ${0.18 * (1 - dist / 60)})`;
            ctx.lineWidth = 0.55;
            ctx.stroke();
          }
        }
      }
    }
    
    function loop() {
      ctx.clearRect(0, 0, width, height);
      drawConnections();
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(loop);
    }
    loop();
  });
})();

// ── BENTO WIDGETS DYNAMIC LOGGING & SIGNAL STREAMS ────────────────
(function initBentoWidgets() {
  
  // Custom rapid HTML character typist helper
  function typeHtmlLine(container, htmlContent, className, onComplete) {
    const line = document.createElement('div');
    line.className = className || '';
    container.appendChild(line);
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    const childNodes = Array.from(tempDiv.childNodes);
    let currentNodeIndex = 0;
    let currentCharIndex = 0;
    
    function step() {
      if (currentNodeIndex >= childNodes.length) {
        container.scrollTop = container.scrollHeight;
        if (onComplete) onComplete();
        return;
      }
      
      const node = childNodes[currentNodeIndex];
      if (node.nodeType === Node.TEXT_NODE) {
        if (currentCharIndex < node.textContent.length) {
          line.appendChild(document.createTextNode(node.textContent[currentCharIndex]));
          currentCharIndex++;
          setTimeout(step, 10);
        } else {
          currentNodeIndex++;
          currentCharIndex = 0;
          step();
        }
      } else {
        const clonedNode = node.cloneNode(false);
        line.appendChild(clonedNode);
        
        let elementCharIndex = 0;
        function stepElement() {
          if (elementCharIndex < node.textContent.length) {
            clonedNode.appendChild(document.createTextNode(node.textContent[elementCharIndex]));
            elementCharIndex++;
            setTimeout(stepElement, 10);
          } else {
            currentNodeIndex++;
            step();
          }
        }
        stepElement();
      }
      container.scrollTop = container.scrollHeight;
    }
    step();
  }

  // 1. Overhauled Mutagen Live Log Streamer with left-to-right typewriter effect
  const mutagenLogs = document.getElementById('mutagenLiveLogs');
  if (mutagenLogs) {
    const logTemplates = [
      { tag: '[SYS]', class: 'tag-sys', text: 'Spawning headless target audit gateway... [OK]' },
      { tag: '[DEBUG]', class: 'tag-agent', text: 'Disassembling logic instruction offset <span class="highlight-address" style="color:var(--cyan);">0x004011d4</span>...' },
      { tag: '[AUDIT]', class: 'tag-audit', text: 'Found unsafe string strcpy copy bounds offset overflow.' },
      { tag: '[FUZZ]', class: 'tag-fuzz', text: 'Fuzz pass: mutating payload buffer address sizes...' },
      { tag: '[CRASH]', class: 'tag-exploit', text: 'SIGSEGV triggered! Stack instruction register corrupted.' },
      { tag: '[PATCH]', class: 'tag-sys', text: 'Compiling boundary index validator bypass audit patch...' },
      { tag: '[OK]', class: 'tag-sys', text: 'Re-running test: 10000 mutations compiled. Target vulnerability successfully secured.' }
    ];

    let logIndex = 0;
    
    function startMutagenTypistLoop() {
      const template = logTemplates[logIndex];
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const fullLogStr = `<span class="log-time" style="color:var(--text-muted);">[${timeStr}]</span> <span class="log-tag ${template.class}">${template.tag}</span> ${template.text}`;
      
      typeHtmlLine(mutagenLogs, fullLogStr, 'mutagen-log-line', () => {
        // Prevent DOM bloating
        while (mutagenLogs.children.length > 11) {
          mutagenLogs.removeChild(mutagenLogs.firstChild);
        }
        logIndex = (logIndex + 1) % logTemplates.length;
        setTimeout(startMutagenTypistLoop, 2000);
      });
    }
    
    // Start initial loop
    setTimeout(startMutagenTypistLoop, 100);
  }

  // 2. Overhauled TryHackMe CTF Labs Terminal typing simulation loop
  const thmTerminal = document.getElementById('thmLiveTerminal');
  if (thmTerminal) {
    const thmLines = [
      { text: '<span class="cmd-prompt">kali@thm-target-box:~$</span> nmap -sS -p- 10.10.200.45', class: '' },
      { text: 'Starting Nmap 7.94 active scanner...', class: 'res-out' },
      { text: 'PORT   STATE SERVICE', class: 'res-out' },
      { text: '21/tcp open  ftp (vsftpd 2.3.4)', class: 'res-out' },
      { text: '22/tcp open  ssh', class: 'res-out' },
      { text: '80/tcp open  http (Apache)', class: 'res-out' },
      { text: '<span class="cmd-prompt">kali@thm-target-box:~$</span> python exploit.py --target 10.10.200.45', class: '' },
      { text: '[+] Triggering vsftpd 2.3.4 backdoor socket handler...', class: 'tag-agent' },
      { text: '[+] Backdoor successful. Spawning root shell descriptor.', class: 'tag-sys' },
      { text: '<span class="cmd-prompt">root@thm-target-box:~#</span> cat /root/flag.txt', class: '' },
      { text: '<span class="tag-sys" style="text-shadow: 0 0 6px var(--green);">THM{zero_day_stack_smashing_complete}</span>', class: '' }
    ];

    let lineIndex = 0;
    
    function startThmTypistLoop() {
      if (lineIndex >= thmLines.length) {
        setTimeout(() => {
          thmTerminal.innerHTML = '';
          lineIndex = 0;
          startThmTypistLoop();
        }, 3500);
        return;
      }
      
      const lineData = thmLines[lineIndex];
      typeHtmlLine(thmTerminal, lineData.text, lineData.class, () => {
        lineIndex++;
        setTimeout(startThmTypistLoop, 1000);
      });
    }
    
    setTimeout(startThmTypistLoop, 500);
  }

  // 3. VM Lab Sandbox target node border status triggers
  const vmTargetBox = document.getElementById('vmTargetBox');
  const vmTargetLabel = document.getElementById('vmTargetLabel');
  const vmAttackConsole = document.getElementById('vmAttackConsole');
  if (vmAttackConsole) {
    const statuses = [
      { text: '[SYS] Running background port mapping scanner...', targetBorder: 'rgba(255,255,255,0.15)', targetColor: '', label: '[VULN_HOST]' },
      { text: '[ATTACK] Sending stack pointer payload vector...', targetBorder: 'var(--cyan)', targetColor: 'rgba(0, 212, 255, 0.05)', label: '[INJECTING]' },
      { text: '[COMPROMISED] Port socket overridden. Shell active.', targetBorder: '#ff4a5a', targetColor: 'rgba(255, 74, 90, 0.08)', label: '[COMPROMISED]' }
    ];
    let statusIndex = 0;
    setInterval(() => {
      const state = statuses[statusIndex];
      vmAttackConsole.textContent = state.text;
      
      if (vmTargetBox) {
        vmTargetBox.style.borderColor = state.targetBorder;
        vmTargetBox.style.backgroundColor = state.targetColor;
      }
      if (vmTargetLabel) {
        vmTargetLabel.textContent = state.label;
        if (state.label.includes('COMPROMISED')) {
          vmTargetLabel.style.color = '#ff4a5a';
        } else if (state.label.includes('INJECTING')) {
          vmTargetLabel.style.color = 'var(--cyan)';
        } else {
          vmTargetLabel.style.color = 'var(--text-dim)';
        }
      }
      statusIndex = (statusIndex + 1) % statuses.length;
    }, 4500);
  }

  // 4. AI Model Training tensor weights mapping updates
  const tensorGrid = document.getElementById('tensorWeights');
  const llmLoss = document.getElementById('llmLoss');
  const llmEpoch = document.getElementById('llmEpoch');
  const llmStatus = document.getElementById('llmStatus');
  if (tensorGrid) {
    // Populate 24 weights blocks
    for (let i = 0; i < 24; i++) {
      const block = document.createElement('div');
      block.className = 'tensor-block';
      tensorGrid.appendChild(block);
    }
    
    // Dynamic weight activations animator
    setInterval(() => {
      const blocks = tensorGrid.querySelectorAll('.tensor-block');
      blocks.forEach(block => {
        block.className = 'tensor-block';
        const rand = Math.random();
        if (rand > 0.8) {
          block.classList.add('active-weight-high');
        } else if (rand > 0.5) {
          block.classList.add('active-weight-med');
        } else if (rand > 0.2) {
          block.classList.add('active-weight-low');
        }
      });
    }, 150);

    // Live training loss simulator
    let stepCount = 0;
    setInterval(() => {
      stepCount += 12;
      if (stepCount > 3000) stepCount = 0;
      
      const currentLoss = (0.95 - (stepCount / 3000) * 0.91 + (Math.random() - 0.5) * 0.05).toFixed(4);
      if (llmLoss) llmLoss.textContent = `loss: ${currentLoss}`;
      if (llmEpoch) llmEpoch.textContent = `step: ${stepCount}/3000`;
      
      if (llmStatus) {
        if (stepCount >= 2800) {
          llmStatus.textContent = 'WEIGHTS_SYNCHRONIZED';
          llmStatus.style.color = 'var(--green)';
        } else {
          llmStatus.textContent = 'MODEL_FINETUNING';
          llmStatus.style.color = 'var(--cyan)';
        }
      }
    }, 200);
  }

  // 5. SignalHub Stock JSON Ticker Streamer
  const stockStream = document.getElementById('stockJsonStream');
  if (stockStream) {
    const symbols = ['NVDA', 'MSFT', 'AAPL', 'TSLA'];
    const prices = { NVDA: 824.15, MSFT: 418.20, AAPL: 182.30, TSLA: 175.40 };
    const deltas = { NVDA: 4.2, MSFT: 2.3, AAPL: 0.8, TSLA: -3.1 };

    setInterval(() => {
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const deltaShift = (Math.random() - 0.48) * 0.8;
      deltas[sym] = parseFloat((deltas[sym] + deltaShift).toFixed(2));
      prices[sym] = parseFloat((prices[sym] * (1 + deltaShift / 100)).toFixed(2));

      const nvdaEl = document.getElementById('ticker-nvda');
      const msftEl = document.getElementById('ticker-msft');
      if (nvdaEl) {
        nvdaEl.textContent = `${deltas.NVDA >= 0 ? '+' : ''}${deltas.NVDA}%`;
        nvdaEl.className = `t-val ${deltas.NVDA >= 0 ? 'up' : 'down'}`;
      }
      if (msftEl) {
        msftEl.textContent = `${deltas.MSFT >= 0 ? '+' : ''}${deltas.MSFT}%`;
        msftEl.className = `t-val ${deltas.MSFT >= 0 ? 'up' : 'down'}`;
      }

      const jsonPayload = {
        symbol: sym,
        price: prices[sym],
        volume: Math.floor(2500000 + Math.random() * 5000000),
        sentiment: deltas[sym] >= 0 ? 'BULLISH' : 'BEARISH',
        action: deltas[sym] > 1.5 ? 'BUY' : deltas[sym] < -1.5 ? 'SELL' : 'HOLD'
      };

      stockStream.textContent = JSON.stringify(jsonPayload, null, 2);
    }, 1600);
  }
})();

// ── OPENCLAW AUTONOMOUS ROUTING NODE GRAPH CANVAS ────────────────
(function initOpenClaw() {
  const canvas = document.getElementById('openclawCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = canvas.offsetWidth;
  let height = canvas.offsetHeight;
  
  // Fit canvas dimensions
  canvas.width = width;
  canvas.height = height;

  let nodes = [];
  const totalNodes = 32;
  const mouse = { x: null, y: null, active: false };

  class Node {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 1.8;
      this.vy = (Math.random() - 0.5) * 1.8;
      this.radius = 1.8 + Math.random() * 2.5;
    }
    update() {
      if (mouse.active && mouse.x !== null) {
        // Aggressive attraction cluster around cursor
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          const force = (130 - dist) / 130;
          this.vx += (dx / dist) * force * 0.45;
          this.vy += (dy / dist) * force * 0.45;
        }
      }
      this.x += this.vx;
      this.y += this.vy;
      // Friction
      this.vx *= 0.94;
      this.vy *= 0.94;
      // Boundary check
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 102, 0.85)';
      ctx.fill();
    }
  }

  // Populate nodes
  for (let i = 0; i < totalNodes; i++) {
    nodes.push(new Node());
  }

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  });
  canvas.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  window.addEventListener('resize', () => {
    if (!canvas) return;
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;
  });

  function drawLinks() {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 90) {
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(0, 212, 255, ${0.4 * (1 - dist / 90)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, width, height);
    drawLinks();
    nodes.forEach(node => {
      node.update();
      node.draw();
    });
    requestAnimationFrame(loop);
  }
  loop();
})();

// Helper to play synthesized PC alarm beep sound (Web Audio API)
function playSystemAlarmBeep() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(920, audioCtx.currentTime); // high pitch warning tone
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.55);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
  } catch (err) {
    console.warn("AudioContext blocked or uninitialized.");
  }
}

// ── DETAIL EXPAND MODAL & HARDWARE GLITCH SIMULATOR ───────────────
(function initProjectModals() {
  const cards = document.querySelectorAll('.bento-project-card.hardware-glitch');
  const modal = document.getElementById('projectModal');
  const modalBody = document.getElementById('modalBody');
  const closeBtn = document.getElementById('modalCloseBtn');
  const faultOverlay = document.getElementById('faultOverlay');

  if (!modal || !modalBody) return;

  const projectsDb = {
    "proj-mutagen": {
      title: "Mutagen Zero-Day Fuzzer",
      meta: "AGENTIC_AI / BINARY_FUZZER // 2026",
      desc: "Mutagen is an autonomous vulnerability platform designed to inspect binary systems for memory vulnerabilities. It combines headless Ghidra disassembly with LLM agents to detect buffer overflows, construct target payloads to verify exploitative impact, compile patches, and re-test binaries in secure Docker sandboxes.",
      tags: ["Python", "Gemma 4", "Ghidra API", "Docker Sandbox", "C++ ASM"],
      btnText: "VIEW_REPOSITORY",
      repoUrl: "https://github.com/Bunny-sysd/mutagen"
    },
    "proj-vigil": {
      title: "Vigil Threat Hunter",
      meta: "THREAT_INTEL / LOG_ENGINE // 2026",
      desc: "Vigil Threat Hunter is an autonomous security log parsing and threat intelligence system. It ingests system syslog streams, network traffic captures, and authentication logs, automatically mapping threat indicators against live CVE databases (MITRE ATT&CK & NVD). When vulnerabilities are detected, Vigil queries the GitHub API for published PoC exploits and audits codebase dependencies for exposure risks.",
      tags: ["Python", "CVE Database", "GitHub API", "NVD Parser", "Syslog Intel", "MITRE ATT&CK"],
      btnText: "VIEW_REPOSITORY",
      repoUrl: "https://github.com/Bunny-sysd/vigil-hunter"
    },
    "proj-stock": {
      title: "SignalHub Market AI Pipeline",
      meta: "LIVE_WEB_APP / FIREBASE // 2025",
      desc: "Live AI-powered market intelligence dashboard deployed at signalhub-e79ba.web.app. Streams market feed variables from live APIs directly to Firebase Realtime Databases. Integrated triggers invoke agentic models to analyze price indicators and output trading momentum buy/sell signals and risk scores in real-time.",
      tags: ["Live Web App", "Firebase Cloud", "Stock API", "LLM Prompting", "JSON Pipeline", "WebSockets"],
      btnText: "LAUNCH_LIVE_APP",
      repoUrl: "https://signalhub-e79ba.web.app"
    },
    "proj-thm": {
      title: "TryHackMe CTF Labs",
      meta: "OFFENSIVE_OPERATIONS // 2025",
      tags: ["Metasploit Suite", "Burp Suite Pro", "Nmap Scanner", "Wireshark", "John"],
      isSandbox: true,
      btnText: "CLOSE_SANDBOX"
    },
    "proj-vm": {
      title: "Security Lab Sandbox",
      meta: "VIRTUAL_ISOLATION_LAB // 2023-2025",
      tags: ["VirtualBox Hypervisor", "Kali Linux", "Wireshark PCAPs", "PFsense Firewall"],
      isSandbox: true,
      btnText: "CLOSE_SANDBOX"
    },
    "proj-pentestai": {
      title: "Security LLM Fine-Tuning",
      meta: "TRANSFORMERS / HUGGINGFACE // 2025",
      desc: "Fine-tuned Mistral and LLaMA transformers on custom datasets of vulnerable source code to automatically classify CVE entry categories, assess exploit severity, and generate remediation code snippets.",
      tags: ["HuggingFace", "Python PyTorch", "QLoRA", "Tokenizer Tuning"],
      btnText: "CLOSE_SPEC"
    }
  };

  let activeTypewriters = [];

  function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function openModal(id) {
    window.openProjectModal = openModal;
    const data = projectsDb[id];
    if (!data) return;

    // Clear active typewriters
    activeTypewriters.forEach(t => clearInterval(t));
    activeTypewriters = [];

    const safeTitle = escapeHTML(data.title);
    const safeMeta  = escapeHTML(data.meta);
    const safeDesc  = escapeHTML(data.desc || '');
    const safeBtn   = escapeHTML(data.btnText || 'CLOSE_SPEC');

    if (data.isSandbox) {
      modalBody.innerHTML = `
        <div class="modal-body-title">${safeTitle}</div>
        <div class="modal-body-meta">${safeMeta}</div>
        <div class="sandbox-split-container">
          <div class="sandbox-panel">
            <div class="panel-header">
              <span>Kali Terminal Sandbox</span>
              <span class="panel-status-tag" id="terminalStatus">CONNECTING...</span>
            </div>
            <div class="panel-body-lines" id="sandboxTerminal"></div>
          </div>
          <div class="sandbox-panel">
            <div class="panel-header">
              <span>Burp Suite HTTP Intercept</span>
              <span class="panel-status-tag" style="color: var(--cyan);" id="burpStatus">CAPTURING...</span>
            </div>
            <div class="panel-body-lines" id="sandboxBurp"></div>
          </div>
        </div>
        <div class="modal-body-tags mt-4">
          ${data.tags.map(tag => `<span>${escapeHTML(tag)}</span>`).join('')}
        </div>
        <div class="mt-4">
          <button class="modal-action-btn" id="modalDismissBtn">${safeBtn}</button>
        </div>
      `;

      // Start typing simulation
      setTimeout(() => startSandboxSimulation(), 200);

    } else {
      modalBody.innerHTML = `
        <div class="modal-body-title">${safeTitle}</div>
        <div class="modal-body-meta">${safeMeta}</div>
        <p class="modal-body-desc">${safeDesc}</p>
        <div class="modal-body-tags">
          ${data.tags.map(tag => `<span>${escapeHTML(tag)}</span>`).join('')}
        </div>
        <div class="mt-4" style="display: flex; gap: 10px; flex-wrap: wrap;">
          ${data.repoUrl ? `<a href="${escapeHTML(data.repoUrl)}" target="_blank" rel="noopener noreferrer" class="modal-action-btn" style="text-decoration: none; display: inline-block;">${safeBtn}</a>` : ''}
          <button class="modal-action-btn" id="modalDismissBtn" style="background: rgba(255,255,255,0.05); border-color: var(--border);">CLOSE_SPEC</button>
        </div>
      `;
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Bind dismiss action
    const dismissBtn = document.getElementById('modalDismissBtn');
    if (dismissBtn) dismissBtn.addEventListener('click', closeModal);
  }

  function startSandboxSimulation() {
    const term = document.getElementById('sandboxTerminal');
    const burp = document.getElementById('sandboxBurp');
    const termStatus = document.getElementById('terminalStatus');
    const burpStatus = document.getElementById('burpStatus');

    if (!term || !burp) return;

    termStatus.textContent = 'ONLINE';
    burpStatus.textContent = 'INTERCEPT_ON';

    const termLines = [
      { text: 'guest@kali:~$ nmap -sS -sV 10.10.142.85', class: 'cmd-prompt', delay: 100 },
      { text: 'Starting Nmap 7.94 ( https://nmap.org ) at 2026-07-04 22:00', class: 'text-muted', delay: 400 },
      { text: 'Nmap scan report for 10.10.142.85', class: '', delay: 800 },
      { text: 'PORT   STATE SERVICE VERSION', class: '', delay: 1200 },
      { text: '22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.5', class: 'res-out', delay: 1500 },
      { text: '80/tcp open  http    Apache httpd 2.4.41', class: 'res-out', delay: 1800 },
      { text: 'Vulnerable backend service audited on Port 80!', class: 'panel-status-tag', delay: 2200 },
      { text: 'guest@kali:~$ exploit_payload --target 10.10.142.85', class: 'cmd-prompt', delay: 2800 },
      { text: '[OK] Launching buffer overflow exploit socket injection...', class: 'panel-status-tag', delay: 3200 }
    ];

    const burpLines = [
      { text: 'POST /login.php HTTP/1.1', class: 'req-out', delay: 100 },
      { text: 'Host: vulnerable-bank.thm', class: '', delay: 300 },
      { text: 'User-Agent: Mozilla/5.0 (Kali Linux)', class: '', delay: 600 },
      { text: 'Content-Type: application/x-www-form-urlencoded', class: '', delay: 900 },
      { text: 'Content-Length: 43', class: '', delay: 1200 },
      { text: '', class: '', delay: 1400 },
      { text: 'username=admin&password=admin123\' OR \'1\'=\'1', class: 'cmd-prompt', delay: 1600 },
      { text: '------------------------------------------------', class: 'text-muted', delay: 2000 },
      { text: 'HTTP/1.1 200 OK', class: 'res-out', delay: 2400 },
      { text: 'Content-Type: application/json', class: 'res-out', delay: 2700 },
      { text: '{"status":"success","session_token":"JWT_ROOT_KEY_..."}', class: 'panel-status-tag', delay: 3200 }
    ];

    termLines.forEach(line => {
      const t = setTimeout(() => {
        const div = document.createElement('div');
        div.className = line.class;
        div.textContent = line.text;
        term.appendChild(div);
        term.scrollTop = term.scrollHeight;
      }, line.delay);
      activeTypewriters.push(t);
    });

    burpLines.forEach(line => {
      const t = setTimeout(() => {
        const div = document.createElement('div');
        div.className = line.class;
        div.textContent = line.text;
        burp.appendChild(div);
        burp.scrollTop = burp.scrollHeight;
      }, line.delay);
      activeTypewriters.push(t);
    });
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    // Clear active typewriters
    activeTypewriters.forEach(t => clearInterval(t));
    activeTypewriters = [];
  }

  // Bind glitch clicks
  cards.forEach(card => {
    card.addEventListener('click', e => {
      // Prevent modal opening when clicking active external links directly
      const link = e.target.closest('a.proj-link');
      if (link && link.getAttribute('href') !== 'javascript:void(0)') return;

      const id = card.getAttribute('id');
      if (!id) return;

      if (id === 'proj-pentestai') {
        if (window.triggerGemmaHardwareFault) {
          window.triggerGemmaHardwareFault();
        } else {
          openModal(id);
        }
      } else {
        // Standard 0.3s glitch
        card.classList.add('glitch-active');
        setTimeout(() => {
          card.classList.remove('glitch-active');
          openModal(id);
        }, 300);
      }
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });
})();

// ── ACTIVE TARGETING NODE MATRIX CONTROLLER ──
(function initActiveNodeMatrix() {
  // 1. Draw SVG bezier curves from parent title to child chips
  function drawNodeMatrixLines() {
    document.querySelectorAll('.parent-node').forEach(parent => {
      const svg = parent.querySelector('.node-matrix-svg');
      if (!svg) return;
      svg.innerHTML = ''; // Clear existing path lines
      
      const header = parent.querySelector('.parent-node-header');
      const chips = parent.querySelectorAll('.skill-child-chip');
      if (!header || chips.length === 0) return;
      
      const parentRect = parent.getBoundingClientRect();
      const headerRect = header.getBoundingClientRect();
      
      // Connection source: center bottom of parent title
      const startX = headerRect.left - parentRect.left + headerRect.width / 2;
      const startY = headerRect.bottom - parentRect.top;
      
      chips.forEach(chip => {
        const chipRect = chip.getBoundingClientRect();
        // Connection end: center top of child chip
        const endX = chipRect.left - parentRect.left + chipRect.width / 2;
        const endY = chipRect.top - parentRect.top;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        // Elegant S-curve / cubic bezier connection path
        const d = `M ${startX} ${startY} C ${startX} ${(startY + endY) / 2}, ${endX} ${(startY + endY) / 2}, ${endX} ${endY}`;
        path.setAttribute('d', d);
        path.setAttribute('stroke', 'rgba(0, 255, 102, 0.15)');
        path.setAttribute('stroke-width', '1');
        path.setAttribute('fill', 'none');
        svg.appendChild(path);
      });
    });
  }

  // Draw lines on DOM load, resize, and scroll triggers
  window.addEventListener('load', drawNodeMatrixLines);
  window.addEventListener('resize', drawNodeMatrixLines);
  setTimeout(drawNodeMatrixLines, 500); // safety fallback

  // 2. The Terminal Tooltip Hover
  const tooltip = document.getElementById('terminalTooltip');
  const tooltipText = document.getElementById('tooltipText');
  let typeInterval = null;

  const tooltipData = {
    nmap: 'nmap -sC -sV target_subnet... [PORT 22 OPEN]',
    metasploit: 'msfconsole -q... exploit/multi/handler',
    burpsuite: 'POST /login.php HTTP/1.1 (admin123\' OR \'1\'=\'1)',
    john: 'john --wordlist=rockyou.txt hash.txt... [CRACKED]',
    graphspy: 'intercepting active proxy sockets...',
    hydra: 'hydra -l admin -P pass.txt ssh://10.10.12.85',
    custom_exploits: 'Disassembling binary offset 0x004011d4...',
    owasp: 'A01:2021-Broken Access Control verification test...',
    mitre: 'mapping techniques: T1059.004 Command Interpreter...',
    tcpip: 'validating network frames... SYN-ACK captured',
    aisec: 'auditing model prompt injection mitigation filters...',
    cve: 'searching CVE database for target buffer exploits...',
    wireshark: 'listening on interface eth0... PCAP captured',
    packet: 'analyzing TCP frame structure... offset matches payload',
    huggingface: 'from transformers import pipeline; classifier=pipeline(...)',
    finetuning: 'training loss: 0.246 // QLoRA adapters loaded',
    transformers: 'AutoModelForCausalLM.from_pretrained("./gemma-4")',
    dataset: 'cleaning adversarial payload datasets... [OK]',
    adversarial: 'initiating adversarial gradient descent checks...',
    python: 'python3 -c "import socket; s=socket.socket()..."',
    bash: 'guest@kali:~$ chmod +x target_payload.sh && ./target_payload.sh',
    sql: 'SELECT * FROM users WHERE username=\'admin\' --',
    javascript: 'fetch("/api/v1/sec").then(res => res.json())',
    typescript: 'const secConfig: SecurityConfig = { sandbox: true };',
    cpp: 'g++ -O3 -std=c++20 exploit.cpp -o exploit.exe',
    kali: 'guest@kali:~$ sudo apt update && searchsplit',
    vms: 'VBoxManage startvm "Target_Host" --type headless',
    virtualbox: 'initializing virtual host adapters... [SANDBOXED]'
  };

  document.querySelectorAll('.skill-child-chip').forEach(chip => {
    chip.addEventListener('mouseenter', e => {
      if (!tooltip || !tooltipText) return;
      const skillId = chip.getAttribute('data-skill');
      const textToType = tooltipData[skillId] || 'Executing virtual process...';
      
      clearInterval(typeInterval);
      tooltip.classList.add('active');
      
      // Typewriter sequence
      tooltipText.textContent = '> ';
      let charIdx = 0;
      typeInterval = setInterval(() => {
        if (charIdx < textToType.length) {
          tooltipText.textContent += textToType[charIdx++];
        } else {
          clearInterval(typeInterval);
        }
      }, 15);
    });

    chip.addEventListener('mousemove', e => {
      if (!tooltip) return;
      // Position tooltip near cursor
      tooltip.style.left = (e.clientX + 15) + 'px';
      tooltip.style.top = (e.clientY + 15) + 'px';
    });

    chip.addEventListener('mouseleave', () => {
      if (!tooltip) return;
      clearInterval(typeInterval);
      tooltip.classList.remove('active');
      tooltipText.textContent = '> ';
    });
  });

  // 3. Local Inference Click-State (Hugging Face Node)
  const aimlNode = document.getElementById('parent-aiml');
  const aimlConsole = document.getElementById('aimlConsole');
  let aimlIntervals = [];

  if (aimlNode && aimlConsole) {
    aimlNode.addEventListener('click', e => {
      // Prevent trigger when clicking clickable cert triggers directly
      if (e.target.closest('.clickable-cert-trigger')) return;

      aimlNode.classList.add('active-glow');
      aimlConsole.innerHTML = '<span class="console-cursor">></span> ';
      
      aimlIntervals.forEach(i => clearTimeout(i));
      aimlIntervals = [];

      const lines = [
        '[SYS] Allocating weights for local fine-tuning...',
        '[SYS] Gemma 4 foundation model initialized via QLoRA.'
      ];

      let totalDelay = 100;
      lines.forEach((lineText, lineIdx) => {
        const t = setTimeout(() => {
          if (lineIdx > 0) aimlConsole.innerHTML += '<br><span class="console-cursor">></span> ';
          
          let charIdx = 0;
          const charInterval = setInterval(() => {
            if (charIdx < lineText.length) {
              aimlConsole.innerHTML += lineText[charIdx++];
            } else {
              clearInterval(charInterval);
            }
          }, 10);
        }, totalDelay);
        aimlIntervals.push(t);
        totalDelay += 1200;
      });

      // Clear glow state after logs finish
      const endGlow = setTimeout(() => {
        aimlNode.classList.remove('active-glow');
      }, 3500);
      aimlIntervals.push(endGlow);
    });
  }

  // 4. Hardware Stress Test (Security Lab Node)
  const sandboxNode = document.getElementById('parent-sandbox');
  const sandboxConsole = document.getElementById('sandboxConsole');
  let sandboxTimeout = null;

  if (sandboxNode && sandboxConsole) {
    sandboxNode.addEventListener('click', e => {
      // Prevent trigger on clickable cert links
      if (e.target.closest('.clickable-cert-trigger')) return;

      sandboxNode.classList.add('stress-fault-glitch');
      sandboxConsole.style.color = '#ff0055';
      sandboxConsole.innerHTML = '<span class="console-cursor" style="color:#ff0055">></span> [SYS_WARN: FAN OVER-SPIN] // HARDWARE FAULT STRESS TESTING...';
      
      playSystemAlarmBeep(); // Alarm beep
      
      clearTimeout(sandboxTimeout);
      sandboxTimeout = setTimeout(() => {
        sandboxNode.classList.remove('stress-fault-glitch');
        sandboxConsole.style.color = 'var(--green)';
        sandboxConsole.innerHTML = '<span class="console-cursor">></span> [SYS] Memory reseated. Allocation stable. Lab active.';
      }, 400); // 0.4 seconds exactly
    });
  }
})();

// ── CLICKABLE CERTIFICATIONS NAVIGATION ──
(function initClickableCerts() {
  document.querySelectorAll('.clickable-cert-trigger').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const certId = el.getAttribute('data-cert');
      const target = document.getElementById(certId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Temporary active highlighting glow
        target.style.transition = 'border-color 0.5s, box-shadow 0.5s';
        target.style.borderColor = 'var(--green)';
        target.style.boxShadow = '0 0 25px rgba(0, 255, 102, 0.4)';
        setTimeout(() => {
          target.style.borderColor = '';
          target.style.boxShadow = '';
        }, 1500);
      }
    });
  });
})();

// ── DEVICE ORIENTATION GYROSCOPE PARALLAX ──
(function initDeviceOrientationParallax() {
  const bg = document.getElementById('bgCanvas');
  if (!bg) return;
  
  window.addEventListener('deviceorientation', e => {
    // Read alpha/beta/gamma and shift the background layer subtly
    const x = (e.gamma || 0) * 0.7; // Left/right tilt
    const y = (e.beta || 0) * 0.7;  // Front/back tilt
    // Cap at +/- 18px and use GPU translate transform for maximum frame rates
    const capX = Math.max(-18, Math.min(18, x));
    const capY = Math.max(-18, Math.min(18, y));
    bg.style.transform = `translate(${capX}px, ${capY}px) scale(1.04)`;
  }, { passive: true });
})();

// ── GEMMA 4 HARDWARE FAULT INTERACTIVE GAME ──
(function initGemmaFaultGame() {
  let faultActive = false;
  let alarmInterval = null;
  let shakeProgress = 0;

  function playSystemSuccessChime() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.55);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.6);
      osc2.stop(audioCtx.currentTime + 0.6);
    } catch(e) {}
  }

  function triggerGemmaHardwareFault() {
    const faultScreen = document.getElementById('hardwareFaultScreen');
    if (!faultScreen) return;

    faultActive = true;
    shakeProgress = 0;
    updateShakeIndicator();

    faultScreen.classList.add('active');
    document.body.classList.add('stress-fault-glitch'); // full screen tear effect

    // Play synthetic sawtooth beep loop
    playSystemAlarmBeep();
    clearInterval(alarmInterval);
    alarmInterval = setInterval(() => {
      if (faultActive) playSystemAlarmBeep();
    }, 850);

    // Setup motion listener for mobile phone shakes
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission().then(state => {
        if (state === 'granted') {
          window.addEventListener('devicemotion', handleMobileShake, true);
        }
      }).catch(() => {});
    } else {
      window.addEventListener('devicemotion', handleMobileShake, true);
    }
  }
  window.triggerGemmaHardwareFault = triggerGemmaHardwareFault;

  function updateShakeIndicator() {
    const indicator = document.getElementById('shakeIndicator');
    if (indicator) {
      indicator.textContent = `${shakeProgress}% ATTAINED`;
      if (shakeProgress >= 100) {
        resolveHardwareFault();
      }
    }
  }

  function handleMobileShake(e) {
    if (!faultActive) return;
    const acc = e.accelerationIncludingGravity || e.acceleration;
    if (!acc) return;
    const totalAcc = Math.sqrt(acc.x*acc.x + acc.y*acc.y + acc.z*acc.z);
    if (totalAcc > 22) { // Shake intensity threshold
      shakeProgress = Math.min(100, shakeProgress + 20);
      updateShakeIndicator();
    }
  }

  function resolveHardwareFault() {
    if (!faultActive) return;
    faultActive = false;
    clearInterval(alarmInterval);
    window.removeEventListener('devicemotion', handleMobileShake, true);

    const faultScreen = document.getElementById('hardwareFaultScreen');
    if (faultScreen) faultScreen.classList.remove('active');
    document.body.classList.remove('stress-fault-glitch');

    playSystemSuccessChime();

    // Open standard project details modal
    if (window.openProjectModal) {
      window.openProjectModal('proj-pentestai');
    }

    // Inject system resolution log lines
    setTimeout(() => {
      const modalBody = document.getElementById('modalBody');
      if (modalBody) {
        const log = document.createElement('div');
        log.className = 'console-line text-green mb-4';
        log.innerHTML = `> [SYS] Hardware failure resolved. RAM reseated.<br>> Gemma 4 allocation stable. Proceed with local inference.`;
        modalBody.insertBefore(log, modalBody.firstChild);
      }
    }, 100);
  }

  // Bind drag-drop & tap clicks
  const module = document.getElementById('ramModule');
  const slot = document.getElementById('ramSlot');
  const tapBtn = document.getElementById('ramModuleTap');

  if (module && slot) {
    module.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', 'ram');
    });

    slot.addEventListener('dragover', e => {
      e.preventDefault();
      slot.classList.add('dragover');
    });

    slot.addEventListener('dragleave', () => {
      slot.classList.remove('dragover');
    });

    slot.addEventListener('drop', e => {
      e.preventDefault();
      slot.classList.remove('dragover');
      const data = e.dataTransfer.getData('text/plain');
      if (data === 'ram') {
        resolveHardwareFault();
      }
    });

    // Tap/click bypass fallback
    module.addEventListener('click', resolveHardwareFault);
  }

  if (tapBtn) {
    tapBtn.addEventListener('click', () => {
      shakeProgress = Math.min(100, shakeProgress + 20);
      updateShakeIndicator();
    });
  }
})();

// ── CONTACT CLI TERMINAL FORM HANDLER ──
(function initContactTerminal() {
  const transmitBtn = document.getElementById('contactTransmitBtn');
  const nameInput   = document.getElementById('contactName');
  const msgInput    = document.getElementById('contactMsg');
  const cipherBlock = document.getElementById('contactCipherBlock');
  const resultLine  = document.getElementById('contactResultLine');

  if (!transmitBtn || !nameInput || !msgInput) return;

  function generateCiphertext(length) {
    const hexChars = '0123456789ABCDEF';
    let output = '';
    for (let i = 0; i < length; i++) {
      if (i > 0 && i % 2 === 0) output += ' ';
      if (i > 0 && i % 32 === 0) output += '\n';
      output += '0x' + hexChars[Math.floor(Math.random() * 16)] + hexChars[Math.floor(Math.random() * 16)];
    }
    return output;
  }

  transmitBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const msg  = msgInput.value.trim();

    if (!name || !msg) {
      resultLine.style.color = '#ff0055';
      resultLine.textContent = 'Payload incomplete. All fields required.';
      setTimeout(() => {
        resultLine.textContent = '';
        resultLine.style.color = '';
      }, 2000);
      return;
    }

    // Haptic feedback on mobile
    if (navigator.vibrate) navigator.vibrate(10);

    transmitBtn.disabled = true;
    transmitBtn.textContent = 'Encrypting...';
    resultLine.textContent = '';

    // Phase 1: Show rapid ciphertext scramble for 0.5s
    cipherBlock.classList.add('active');
    let scrambleInterval = setInterval(() => {
      cipherBlock.textContent = generateCiphertext(48);
    }, 50);

    setTimeout(() => {
      clearInterval(scrambleInterval);
      cipherBlock.classList.remove('active');
      cipherBlock.textContent = '';

      // Construct dynamic URI-encoded mailto link
      const mailtoLink = 'mailto:aaron.lawrence.alva@gmail.com?subject=' + 
        encodeURIComponent('Encrypted Payload from ' + name) + 
        '&body=' + encodeURIComponent(msg);

      // Force open local native mail client
      window.location.href = mailtoLink;

      // Phase 2: Show success resolution
      resultLine.style.color = 'var(--green)';
      resultLine.textContent = 'Payload packaged. Handoff to secure local mail client complete.';
      transmitBtn.textContent = 'Transmitted';

      // Reset form controls after delay
      setTimeout(() => {
        nameInput.value = '';
        msgInput.value = '';
        transmitBtn.disabled = false;
        transmitBtn.textContent = 'Transmit Payload';
        resultLine.textContent = '';
      }, 4000);
    }, 500); // 0.5 seconds exactly
  });
})();

// ── BENTO CARD SPOTLIGHT TRACKER ──
(function initBentoSpotlightTracker() {
  const cards = document.querySelectorAll('.bento-project-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    }, { passive: true });
  });
})();

// ── VIGIL RED EYE SCANNER MOUSE TRACKER ──
(function initVigilEyeTracker() {
  const vigilCard = document.getElementById('proj-vigil');
  const vigilIris = document.getElementById('vigilIris');
  if (!vigilCard || !vigilIris) return;

  vigilCard.addEventListener('mousemove', (e) => {
    const rect = vigilCard.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) / (rect.width / 2);
    const deltaY = (e.clientY - centerY) / (rect.height / 2);

    const moveX = Math.min(Math.max(deltaX * 6, -6), 6);
    const moveY = Math.min(Math.max(deltaY * 5, -5), 5);

    vigilIris.style.animation = 'none';
    vigilIris.style.transform = `translate(${moveX}px, ${moveY}px)`;
  }, { passive: true });

  vigilCard.addEventListener('mouseleave', () => {
    vigilIris.style.transform = 'translate(0px, 0px)';
    vigilIris.style.animation = 'vigilLookAround 6s ease-in-out infinite alternate';
  });
})();

// ═════════════════════════════════════════════════════════
// 1. PROCEDURAL ACTIVE THEORY CYBER WEB AUDIO SFX ENGINE
// ═════════════════════════════════════════════════════════
const SoundFX = (function initWebAudioSFX() {
  let audioCtx = null;
  let isSoundEnabled = (localStorage.getItem('sfx_enabled') === 'true'); // Persist user sound preference

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, type, duration, gainVal = 0.05, rampDown = true) {
    if (!isSoundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      if (rampDown) {
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  // Active Theory Procedural Cyber Sound Presets
  const sfx = {
    click: () => {
      if (!isSoundEnabled) return;
      playTone(1900, 'square', 0.012, 0.025);
      setTimeout(() => playTone(540, 'triangle', 0.022, 0.035), 6);
    },
    hover: () => {
      if (!isSoundEnabled) return;
      playTone(3400, 'sine', 0.007, 0.009);
    },
    chime: () => {
      if (!isSoundEnabled) return;
      playTone(880, 'sine', 0.09, 0.03);
      setTimeout(() => playTone(1320, 'sine', 0.12, 0.04), 45);
    },
    action: () => {
      if (!isSoundEnabled) return;
      playTone(600, 'triangle', 0.05, 0.03);
      setTimeout(() => playTone(1200, 'sine', 0.08, 0.04), 30);
    },
    toggle: () => {
      if (!isSoundEnabled) return;
      playTone(720, 'sine', 0.04, 0.025);
      setTimeout(() => playTone(480, 'triangle', 0.05, 0.025), 30);
    },
    warp: () => {
      if (sfx.warpTransition) sfx.warpTransition();
    },
    dialTick: () => {
      if (!isSoundEnabled) return;
      playTone(2200, 'triangle', 0.015, 0.02);
    },
    portalClose: () => {
      if (!isSoundEnabled) return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch (e) {}
    },
    warpTransition: () => {
      if (!isSoundEnabled) return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        // Sub-bass impact
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(180, ctx.currentTime);
        subOsc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.45);
        subGain.gain.setValueAtTime(0.08, ctx.currentTime);
        subGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start();
        subOsc.stop(ctx.currentTime + 0.45);

        // High frequency cyber resonance sweep
        const sweepOsc = ctx.createOscillator();
        const sweepGain = ctx.createGain();
        sweepOsc.type = 'sawtooth';
        sweepOsc.frequency.setValueAtTime(220, ctx.currentTime);
        sweepOsc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.35);
        sweepGain.gain.setValueAtTime(0.03, ctx.currentTime);
        sweepGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.40);
        sweepOsc.connect(sweepGain);
        sweepGain.connect(ctx.destination);
        sweepOsc.start();
        sweepOsc.stop(ctx.currentTime + 0.40);
      } catch (e) {}
    }
  };

  // Expose global cyber SFX trigger
  window.playCyberSFX = function(name) {
    if (sfx[name]) {
      sfx[name]();
    }
  };

  // Bind sound toggle button in header
  const toggleBtn = document.getElementById('audioToggleBtn');
  const audioIcon = document.getElementById('audioIcon');

  function updateAudioUI() {
    if (toggleBtn) {
      toggleBtn.classList.toggle('active-sfx', isSoundEnabled);
      if (audioIcon) {
        audioIcon.textContent = isSoundEnabled ? '[VOL]' : '[MUTE]';
      }
    }
    const mobileAudioIcon = document.getElementById('mobileAudioIcon');
    if (mobileAudioIcon) {
      mobileAudioIcon.textContent = isSoundEnabled ? '[VOL]' : '[MUTE]';
    }
    const cmdDesc = document.getElementById('cmdSoundDesc');
    const cmdIcon = document.getElementById('cmdSoundIcon');
    if (cmdDesc) {
      cmdDesc.textContent = isSoundEnabled ? 'Sound synthesizer: Active (Enabled)' : 'Sound synthesizer: Muted (Disabled)';
    }
    if (cmdIcon) {
      cmdIcon.textContent = isSoundEnabled ? '[ON]' : '[OFF]';
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      isSoundEnabled = !isSoundEnabled;
      localStorage.setItem('sfx_enabled', isSoundEnabled ? 'true' : 'false');
      updateAudioUI();
      if (isSoundEnabled) {
        sfx.chime();
      }
    });
  }

  // Attach tactile audio to interactive buttons & links
  document.addEventListener('click', (e) => {
    const target = e.target.closest('a, button, .cmd-item, .radar-tab, .cert-card, .know-badge, .at-hud-btn, .at-dial-btn');
    if (target) {
      sfx.click();
    }
  });

  // Attach subtle hover audio
  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('button, a, .at-hud-btn, .at-dial-btn, .cmd-item');
    if (target && !target.dataset.soundHovered) {
      target.dataset.soundHovered = 'true';
      sfx.hover();
      setTimeout(() => { delete target.dataset.soundHovered; }, 100);
    }
  });

  updateAudioUI();

  return {
    ...sfx,
    toggleState: () => {
      isSoundEnabled = !isSoundEnabled;
      localStorage.setItem('sfx_enabled', isSoundEnabled ? 'true' : 'false');
      updateAudioUI();
      return isSoundEnabled;
    }
  };
})();

// ═════════════════════════════════════════════════════════
// 2. SIGNALHUB LIVE AI MARKET RADAR CONTROLLER
// ═════════════════════════════════════════════════════════
(function initSignalHubRadar() {
  const radarRoot = document.getElementById('signalhubRadar');
  if (!radarRoot) return;

  const canvas = document.getElementById('radarSparklineCanvas');
  const tabs = document.querySelectorAll('.radar-tab');
  const symbolEl = document.getElementById('radarSymbol');
  const nameEl = document.getElementById('radarAssetName');
  const priceEl = document.getElementById('radarPrice');
  const changeEl = document.getElementById('radarChange');
  const signalEl = document.getElementById('radarSignal');
  const scoreEl = document.getElementById('radarScore');
  const latencyEl = document.getElementById('radarLatency');

  // Stock telemetry dataset
  const tickersData = {
    NVDA: {
      name: "NVIDIA Corp",
      price: 138.40,
      change: "+4.25%",
      positive: true,
      signal: "STRONG BUY",
      score: "94.2%",
      latency: "42ms",
      points: [126.5, 128.2, 127.8, 131.0, 130.4, 134.2, 133.8, 136.5, 138.4]
    },
    SPY: {
      name: "S&P 500 Index",
      price: 588.56,
      change: "+0.40%",
      positive: true,
      signal: "ACCUMULATION",
      score: "88.0%",
      latency: "36ms",
      points: [584.2, 585.1, 584.8, 586.3, 585.9, 587.4, 586.8, 588.1, 588.56]
    },
    TSLA: {
      name: "Tesla Inc",
      price: 241.13,
      change: "-3.09%",
      positive: false,
      signal: "AVOID / ROTATION",
      score: "16.5%",
      latency: "48ms",
      points: [252.0, 249.5, 250.2, 246.8, 248.0, 244.3, 245.1, 242.0, 241.13]
    },
    BTC: {
      name: "Bitcoin / USD",
      price: 96450.00,
      change: "+2.85%",
      positive: true,
      signal: "MOMENTUM BUY",
      score: "91.8%",
      latency: "28ms",
      points: [93100, 93800, 93400, 94600, 94200, 95400, 95100, 96000, 96450]
    },
    LLY: {
      name: "Eli Lilly & Co",
      price: 888.65,
      change: "+4.72%",
      positive: true,
      signal: "STRONG BUY",
      score: "92.4%",
      latency: "39ms",
      points: [846.0, 852.5, 849.0, 865.2, 861.8, 874.0, 871.2, 882.5, 888.65]
    }
  };

  let activeTicker = "NVDA";
  let pulsePhase = 0;
  let chartPoints = [...tickersData.NVDA.points];

  // Canvas drawing loop
  function drawSparkline() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    const data = chartPoints;
    if (data.length < 2) return;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = (max - min) || 1;
    const padding = 14;

    const coords = data.map((val, idx) => {
      const x = padding + (idx / (data.length - 1)) * (w - padding * 2);
      const y = h - padding - ((val - min) / range) * (h - padding * 2);
      return { x, y };
    });

    const isPositive = tickersData[activeTicker].positive;
    const strokeColor = isPositive ? 'rgba(0, 255, 102, 0.95)' : 'rgba(255, 74, 90, 0.95)';
    const fillColor = isPositive ? 'rgba(0, 255, 102, 0.12)' : 'rgba(255, 74, 90, 0.12)';

    // Draw area fill
    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 0; i < coords.length - 1; i++) {
      const xc = (coords[i].x + coords[i + 1].x) / 2;
      const yc = (coords[i].y + coords[i + 1].y) / 2;
      ctx.quadraticCurveTo(coords[i].x, coords[i].y, xc, yc);
    }
    ctx.lineTo(coords[coords.length - 1].x, coords[coords.length - 1].y);
    ctx.lineTo(coords[coords.length - 1].x, h);
    ctx.lineTo(coords[0].x, h);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, fillColor);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw main stroke line
    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 0; i < coords.length - 1; i++) {
      const xc = (coords[i].x + coords[i + 1].x) / 2;
      const yc = (coords[i].y + coords[i + 1].y) / 2;
      ctx.quadraticCurveTo(coords[i].x, coords[i].y, xc, yc);
    }
    ctx.lineTo(coords[coords.length - 1].x, coords[coords.length - 1].y);

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.2;
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = 10;
    ctx.stroke();

    // Draw end pulsing point
    const lastCoord = coords[coords.length - 1];
    pulsePhase += 0.06;
    const pulseSize = 4 + Math.sin(pulsePhase) * 2;

    ctx.beginPath();
    ctx.arc(lastCoord.x, lastCoord.y, pulseSize, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.shadowBlur = 12;
    ctx.fill();

    ctx.restore();
    requestAnimationFrame(drawSparkline);
  }

  function updateTickerDisplay(tickerKey) {
    activeTicker = tickerKey;
    const d = tickersData[tickerKey];
    if (!d) return;

    chartPoints = [...d.points];

    if (symbolEl) symbolEl.textContent = tickerKey;
    if (nameEl) nameEl.textContent = d.name;
    if (priceEl) {
      priceEl.textContent = tickerKey === 'BTC'
        ? `$${d.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        : `$${d.price.toFixed(2)}`;
      priceEl.style.color = d.positive ? 'var(--green)' : '#ff4a5a';
    }
    if (changeEl) {
      changeEl.textContent = d.change;
      changeEl.className = `radar-change ${d.positive ? 'positive' : 'negative'}`;
    }
    if (signalEl) {
      signalEl.textContent = d.signal;
      signalEl.className = `metric-val ${d.positive ? 'buy' : 'avoid'}`;
    }
    if (scoreEl) scoreEl.textContent = d.score;
    if (latencyEl) latencyEl.textContent = d.latency;

    tabs.forEach(t => {
      t.classList.toggle('active', t.dataset.ticker === tickerKey);
    });
  }

  // Tab click listeners
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const ticker = tab.dataset.ticker;
      if (ticker && ticker !== activeTicker) {
        SoundFX.hover();
        updateTickerDisplay(ticker);
      }
    });
  });

  // Micro-fluctuation simulation to keep radar alive
  setInterval(() => {
    if (chartPoints.length > 0) {
      const last = chartPoints[chartPoints.length - 1];
      const delta = (Math.random() - 0.48) * (last * 0.0035);
      chartPoints[chartPoints.length - 1] = Math.max(1, last + delta);
    }
  }, 2200);

  updateTickerDisplay('NVDA');
  requestAnimationFrame(drawSparkline);
})();

// ═════════════════════════════════════════════════════════
// 3. CRT THEME ENGINE & PERSISTENCE
// ═════════════════════════════════════════════════════════
const ThemeEngine = (function initThemeEngine() {
  const THEME_KEY = 'portfolio_crt_theme';
  const validThemes = ['green', 'amber', 'cyan', 'monokai'];

  function applyTheme(themeName, playSound = false) {
    if (!validThemes.includes(themeName)) themeName = 'green';

    if (themeName === 'green') {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = themeName;
    }

    localStorage.setItem(THEME_KEY, themeName);

    if (playSound) {
      SoundFX.action();
    }
  }

  // Load saved theme on boot
  const savedTheme = localStorage.getItem(THEME_KEY) || 'green';
  applyTheme(savedTheme, false);

  return {
    setTheme: applyTheme,
    getTheme: () => localStorage.getItem(THEME_KEY) || 'green'
  };
})();

// ═════════════════════════════════════════════════════════
// 4. CYBER COMMAND PALETTE (CTRL+K / CMD+K) CONTROLLER
// ═════════════════════════════════════════════════════════
(function initCommandPalette() {
  const palette = document.getElementById('cmdPalette');
  const input = document.getElementById('cmdInput');
  const closeBadge = document.getElementById('cmdCloseBadge');
  const triggerBtn = document.getElementById('cmdTriggerBtn');
  const itemsContainer = document.getElementById('cmdBody');

  if (!palette || !input) return;

  let isOpen = false;
  let activeIndex = 0;

  function getVisibleItems() {
    return Array.from(palette.querySelectorAll('.cmd-item')).filter(
      item => item.style.display !== 'none'
    );
  }

  function openPalette() {
    isOpen = true;
    palette.classList.add('open');
    palette.setAttribute('aria-hidden', 'false');
    input.value = '';
    filterItems('');
    input.focus();
    SoundFX.chime();
  }

  function closePalette() {
    if (!isOpen) return;
    isOpen = false;
    palette.classList.remove('open');
    palette.setAttribute('aria-hidden', 'true');
    input.blur();
    SoundFX.click();
  }

  function highlightItem(index) {
    const visible = getVisibleItems();
    if (visible.length === 0) return;

    if (index < 0) index = visible.length - 1;
    if (index >= visible.length) index = 0;

    activeIndex = index;
    visible.forEach((item, i) => {
      item.classList.toggle('active', i === activeIndex);
    });

    // Scroll into view if needed
    visible[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }

  function executeItem(item) {
    if (!item) return;
    const action = item.dataset.action;

    if (action === 'nav') {
      const targetId = item.dataset.target;
      closePalette();
      const sec = document.querySelector(targetId);
      if (sec) {
        sec.scrollIntoView({ behavior: 'smooth' });
        SoundFX.action();
      }
    } else if (action === 'theme') {
      const theme = item.dataset.theme;
      ThemeEngine.setTheme(theme, true);
      closePalette();
    } else if (action === 'copy-email') {
      const email = 'aaronalva@yahoo.com';
      navigator.clipboard.writeText(email).then(() => {
        const badge = document.getElementById('cmdCopyBadge');
        if (badge) {
          badge.textContent = 'COPIED!';
          badge.style.background = 'var(--green)';
          badge.style.color = '#000';
          setTimeout(() => {
            badge.textContent = 'COPY';
            badge.style.background = '';
            badge.style.color = '';
          }, 2000);
        }
        SoundFX.action();
      });
    } else if (action === 'open-github') {
      window.open('https://github.com/Bunny-sysd', '_blank');
      closePalette();
    } else if (action === 'open-thm') {
      window.open('https://tryhackme.com/p/354221973', '_blank');
      closePalette();
    } else if (action === 'toggle-sound') {
      SoundFX.toggleState();
    }
  }

  function filterItems(query) {
    query = query.trim().toLowerCase();
    const allGroups = palette.querySelectorAll('.cmd-group');

    allGroups.forEach(group => {
      let hasVisibleInGroup = false;
      const items = group.querySelectorAll('.cmd-item');

      items.forEach(item => {
        const title = item.querySelector('.cmd-item-title')?.textContent.toLowerCase() || '';
        const desc = item.querySelector('.cmd-item-desc')?.textContent.toLowerCase() || '';
        const matches = !query || title.includes(query) || desc.includes(query);

        item.style.display = matches ? 'flex' : 'none';
        if (matches) hasVisibleInGroup = true;
      });

      group.style.display = hasVisibleInGroup ? 'block' : 'none';
    });

    highlightItem(0);
  }

  // Keyboard shortcut listener (Ctrl+K, Cmd+K, /, ESC)
  document.addEventListener('keydown', (e) => {
    // Open on Ctrl+K or Cmd+K
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (isOpen) closePalette();
      else openPalette();
      return;
    }

    // Open on '/' if not inside an input/textarea
    if (e.key === '/' && !isOpen && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      openPalette();
      return;
    }

    if (!isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closePalette();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightItem(activeIndex + 1);
      SoundFX.hover();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightItem(activeIndex - 1);
      SoundFX.hover();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const visible = getVisibleItems();
      if (visible[activeIndex]) {
        executeItem(visible[activeIndex]);
      }
    }
  });

  // Input typing listener
  input.addEventListener('input', (e) => {
    filterItems(e.target.value);
  });

  // Click on items
  itemsContainer.addEventListener('click', (e) => {
    const item = e.target.closest('.cmd-item');
    if (item) {
      executeItem(item);
    }
  });

  // Hover item highlights
  itemsContainer.addEventListener('mousemove', (e) => {
    const item = e.target.closest('.cmd-item');
    if (item) {
      const visible = getVisibleItems();
      const idx = visible.indexOf(item);
      if (idx !== -1 && idx !== activeIndex) {
        activeIndex = idx;
        visible.forEach((el, i) => el.classList.toggle('active', i === activeIndex));
      }
    }
  });

  // Header trigger button
  if (triggerBtn) {
    triggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openPalette();
    });
  }

  // Close badge
  if (closeBadge) {
    closeBadge.addEventListener('click', closePalette);
  }

  // Click backdrop outside dialog to close
  palette.addEventListener('click', (e) => {
    if (e.target === palette) {
      closePalette();
    }
  });
})();

// Console log egg easter header
console.log(
  '%c 0xPORTFOLIO ACTIVE // AUTHORIZED SESSION ',
  'color:#00ff41;background:#0A0A0C;font-family:monospace;font-size:16px;padding:6px 12px;border:1px solid #00ff41;'
);

// ── GSAP SCROLLTRIGGER ANIMATIONS ────────────────
(function initGSAP() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  
  gsap.registerPlugin(ScrollTrigger);

  // Parallax fade-in for section titles
  gsap.utils.toArray('.section-title').forEach(title => {
    gsap.fromTo(title, 
      { opacity: 0, y: 50 },
      {
        opacity: 1, 
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: title,
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      }
    );
  });

  // Staggered fade up for Bento Cards
  gsap.utils.toArray('.bento-project-card').forEach((card, i) => {
    gsap.fromTo(card, 
      { opacity: 0, y: 100, scale: 0.95 },
      {
        opacity: 1, 
        y: 0, 
        scale: 1,
        duration: 0.8,
        ease: "back.out(1.2)",
        scrollTrigger: {
          trigger: card,
          start: "top 90%",
          toggleActions: "play none none reverse"
        }
      }
    );
  });

  // Fade-in and slide for the skills sections
  gsap.utils.toArray('.bento-skill-box').forEach(box => {
    gsap.fromTo(box,
      { opacity: 0, x: -50 },
      {
        opacity: 1,
        x: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: box,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );
  });
})();

// ══════════════════════════════════════════════════════
// CINEMATIC SCROLLYTELLING HUD & ZONE FAST-TRAVEL DOCK
// ══════════════════════════════════════════════════════
(function initCinematicHUDController() {
  const hudZoneName = document.getElementById('hudZoneName');
  const hudVelocity = document.getElementById('hudVelocity');
  const zoneButtons = document.querySelectorAll('.zone-jump-btn');

  let activeZoneIdx = 0;

  // Listen to zone changes dispatched by three-bg.js
  window.addEventListener('cinematic-zone-change', (e) => {
    const { zoneIndex, zoneName } = e.detail;
    if (zoneIndex !== activeZoneIdx) {
      activeZoneIdx = zoneIndex;

      if (hudZoneName) {
        hudZoneName.textContent = zoneName;
        hudZoneName.dataset.text = zoneName;
        if (typeof decryptText === 'function') {
          decryptText(hudZoneName);
        }
      }

      zoneButtons.forEach((btn, idx) => {
        btn.classList.toggle('active', idx === zoneIndex);
      });
    }
  });

  // Listen to velocity updates for the tachometer
  window.addEventListener('cinematic-velocity-update', (e) => {
    const { warp } = e.detail;
    if (hudVelocity) {
      hudVelocity.textContent = warp.toFixed(2) + ' LY/S';
    }
  });

  // Fast-travel zone buttons click
  zoneButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const zoneIdx = parseInt(btn.dataset.zone, 10);
      if (!isNaN(zoneIdx) && typeof window.warpToZone === 'function') {
        window.warpToZone(zoneIdx);
      }
    });
  });

  // Keyboard numbers 0..5 for quick warp jumping
  window.addEventListener('keydown', (e) => {
    // Only if not typing in an input/textarea
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    const keyNum = parseInt(e.key, 10);
    if (!isNaN(keyNum) && keyNum >= 0 && keyNum <= 5) {
      if (typeof window.warpToZone === 'function') {
        window.warpToZone(keyNum);
      }
    }
  });
})();

// ══════════════════════════════════════════════════════
// MUTAGEN LIVE FUZZER SANDBOX SIMULATION MODAL
// ══════════════════════════════════════════════════════
(function initMutagenSandboxController() {
  const modal = document.getElementById('mutagenSandboxModal');
  const launchBtn = document.getElementById('launchFuzzerSandboxBtn');
  const closeBtn = document.getElementById('closeMutagenModalBtn');
  const triggerFuzzBtn = document.getElementById('btnRunFuzzCycle');
  const logsStream = document.getElementById('fuzzerSimLogs');
  const statusTag = document.getElementById('simStatusTag');
  const metricMutations = document.getElementById('metricMutations');
  const metricCoverage = document.getElementById('metricCoverage');
  const metricCrashes = document.getElementById('metricCrashes');
  const targetBtns = document.querySelectorAll('.target-btn');

  if (!modal) return;

  function openModal() {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (launchBtn) launchBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });

  let currentTarget = 'cjson';
  targetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      targetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTarget = btn.dataset.target;
      if (logsStream) {
        logsStream.innerHTML += `<div style="color: var(--cyan); margin-top: 6px;">[SWITCH TARGET] Loaded /sandbox/targets/${currentTarget}_target.c</div>`;
        logsStream.scrollTop = logsStream.scrollHeight;
      }
    });
  });

  // Autonomous Fuzz Cycle Execution Simulation
  let isRunning = false;
  if (triggerFuzzBtn) {
    triggerFuzzBtn.addEventListener('click', () => {
      if (isRunning) return;
      isRunning = true;
      triggerFuzzBtn.disabled = true;
      triggerFuzzBtn.innerHTML = '<span>⏳ EXECUTING FUZZ CYCLE...</span>';
      if (statusTag) statusTag.innerHTML = '<span style="color: #ffbd2e;">● CYCLE RUNNING</span>';

      const simSteps = [
        { text: '[PHASE 1 - AST PARSER] Decompiled function pointers & dynamic memory bounds in C source tree...', delay: 400, color: 'var(--cyan)' },
        { text: '[PHASE 2 - LLM PAYLOAD GEN] Synthesizing high-entropy byte mutators: 0x41414141... (Magic Byte Repair applied)', delay: 1000, color: '#ffbd2e' },
        { text: '[PHASE 3 - DOCKER SANDBOX] Spawning --network=none isolated container [Container ID: 7f8a912e] with AddressSanitizer (ASan)', delay: 1700, color: 'var(--text-dim)' },
        { text: '[CRASH DETECTED] AddressSanitizer: heap-buffer-overflow on address 0x602000000010 (Write size: 64)', delay: 2400, color: '#ff3366' },
        { text: '[PHASE 4 - GDB TRIAGE] Extracted core dump stack trace: parse_object() at cjson.c:142 (Signal: SIGSEGV)', delay: 3100, color: '#ff3366' },
        { text: '[PHASE 5 - AUTO-PATCH] Generating verification patch diff with bounded malloc check: `+ if (len > MAX_BUF) return -1;`', delay: 3800, color: 'var(--green)' },
        { text: '[VERIFIED] Patch applied and verified against regression tests. ZERO CRASHES ON RE-EXECUTION.', delay: 4500, color: 'var(--green)' }
      ];

      simSteps.forEach((step, idx) => {
        setTimeout(() => {
          if (logsStream) {
            const div = document.createElement('div');
            div.style.color = step.color;
            div.textContent = step.text;
            logsStream.appendChild(div);
            logsStream.scrollTop = logsStream.scrollHeight;
          }

          if (idx === 1 && metricMutations) {
            metricMutations.textContent = '19,842';
          }
          if (idx === 2 && metricCoverage) {
            metricCoverage.textContent = '94.2%';
          }
          if (idx === 3 && metricCrashes) {
            metricCrashes.textContent = '2 (PATCHED)';
          }

          if (idx === simSteps.length - 1) {
            isRunning = false;
            triggerFuzzBtn.disabled = false;
            triggerFuzzBtn.innerHTML = '<span>▶ RUN AUTONOMOUS FUZZ CYCLE</span>';
            if (statusTag) statusTag.innerHTML = '<span style="color: var(--green);">● SYSTEM IDLE</span>';
          }
        }, step.delay);
      });
    });
  }
})();

// ══════════════════════════════════════════════════════
// ACTIVE THEORY 3D CYLINDER CONTROLLER & SYNTHESIZER
// ══════════════════════════════════════════════════════
(function initActiveTheoryUIController() {
  let currentCardIndex = 0;
  const totalCards = 6;
  const cardIds = [
    'profile',
    'mutagen',
    'vigil',
    'signalhub',
    'tryhackme',
    'transmission'
  ];
  const cardNames = [
    '01 // AARON ALVA • RESEARCHER IDENTITY',
    '02 // MUTAGEN ZERO-DAY FUZZER',
    '03 // VIGIL THREAT HUNTER CLI',
    '04 // SIGNALHUB MARKET AI PIPELINE',
    '05 // PROVING GROUNDS (TOP 1%)',
    '06 // TRANSMIT SIGNAL & CONTACT'
  ];

  const activeNameEl = document.getElementById('atActiveCardName');
  const indexEl = document.getElementById('hudCardIndex');
  const mobileCardNumEl = document.getElementById('atMobileCardNum');
  const sidebarBtns = document.querySelectorAll('.at-hud-btn');
  const prevBtn = document.getElementById('btnDialPrev');
  const nextBtn = document.getElementById('btnDialNext');
  const heroPrompt = document.getElementById('heroScrollPrompt');

  function updateActiveUI(idx) {
    if (idx === -1) {
      if (activeNameEl) activeNameEl.textContent = '00 // CYBERNETIC NEXUS CORE • SCROLL TO ENGAGE';
      if (indexEl) indexEl.textContent = '00';
      if (mobileCardNumEl) mobileCardNumEl.textContent = '00 / 06';
      if (heroPrompt) heroPrompt.classList.remove('hidden');
      sidebarBtns.forEach(btn => btn.classList.remove('active'));
      return;
    }

    currentCardIndex = idx;
    if (activeNameEl) activeNameEl.textContent = cardNames[idx] || `0${idx + 1} // ACTIVE STAGE`;
    if (indexEl) indexEl.textContent = String(idx + 1).padStart(2, '0');
    if (mobileCardNumEl) mobileCardNumEl.textContent = `${String(idx + 1).padStart(2, '0')} / 06`;
    if (heroPrompt) heroPrompt.classList.add('hidden');

    sidebarBtns.forEach((btn, i) => {
      if (i === idx) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }

  // Hook sidebar buttons to rotate cylinder to target card (1-indexed for 3D engine)
  sidebarBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-card'), 10);
      if (!isNaN(idx)) {
        updateActiveUI(idx);
        if (typeof window.rotateCylinderToCard === 'function') {
          window.rotateCylinderToCard(idx + 1);
        }
      }
    });
  });

  // Listen to 3D Cylinder Active Card event
  window.addEventListener('activetheory-card-active', (e) => {
    const data = e.detail;
    if (data?.isHero) {
      updateActiveUI(-1);
    } else if (data?.index) {
      const idx = parseInt(data.index, 10) - 1;
      updateActiveUI(idx);
    }
  });

  // Next / Prev Dial Buttons
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const nextIdx = (currentCardIndex - 1 + totalCards) % totalCards;
      updateActiveUI(nextIdx);
      if (typeof window.rotateCylinderToCard === 'function') {
        window.rotateCylinderToCard(nextIdx + 1);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const nextIdx = (currentCardIndex + 1) % totalCards;
      updateActiveUI(nextIdx);
      if (typeof window.rotateCylinderToCard === 'function') {
        window.rotateCylinderToCard(nextIdx + 1);
      }
    });
  }

  // Mobile Cyber Menu Handlers
  const mobileMenuModal = document.getElementById('mobileMenuModal');
  const btnMobileMenuToggle = document.getElementById('btnMobileMenuToggle');
  const btnMobileMenuClose = document.getElementById('btnMobileMenuClose');
  const mobileMenuBackdrop = document.getElementById('mobileMenuBackdrop');
  const mobileAudioToggleBtn = document.getElementById('mobileAudioToggleBtn');
  const mobileCmdTriggerBtn = document.getElementById('mobileCmdTriggerBtn');

  window.openMobileMenu = function() {
    if (mobileMenuModal) {
      mobileMenuModal.classList.add('active');
      mobileMenuModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('mobile-menu-open');
      if (typeof window.playCyberSFX === 'function') window.playCyberSFX('click');
    }
  };

  window.closeMobileMenu = function() {
    if (mobileMenuModal) {
      mobileMenuModal.classList.remove('active');
      mobileMenuModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('mobile-menu-open');
    }
  };

  if (btnMobileMenuToggle) {
    btnMobileMenuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (mobileMenuModal?.classList.contains('active')) {
        window.closeMobileMenu();
      } else {
        window.openMobileMenu();
      }
    });
  }

  if (btnMobileMenuClose) {
    btnMobileMenuClose.addEventListener('click', window.closeMobileMenu);
  }

  if (mobileMenuBackdrop) {
    mobileMenuBackdrop.addEventListener('click', window.closeMobileMenu);
  }

  if (mobileAudioToggleBtn) {
    mobileAudioToggleBtn.addEventListener('click', () => {
      const toggleBtn = document.getElementById('audioToggleBtn');
      if (toggleBtn) toggleBtn.click();
    });
  }

  if (mobileCmdTriggerBtn) {
    mobileCmdTriggerBtn.addEventListener('click', () => {
      window.closeMobileMenu();
      setTimeout(() => {
        const cmdTrigger = document.getElementById('cmdTriggerBtn');
        if (cmdTrigger) cmdTrigger.click();
      }, 150);
    });
  }

  // Keyboard Navigation: Arrows, 1-6 Hotkeys, Mute M, ESC
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

    if (e.key >= '1' && e.key <= '6') {
      const idx = parseInt(e.key, 10) - 1;
      updateActiveUI(idx);
      if (typeof window.rotateCylinderToCard === 'function') {
        window.rotateCylinderToCard(idx + 1);
      }
      if (typeof window.triggerActiveTheoryCardDeepDive === 'function') {
        window.triggerActiveTheoryCardDeepDive(cardIds[idx]);
      }
    } else if (e.key === 'm' || e.key === 'M') {
      if (typeof SoundFX?.toggleState === 'function') {
        SoundFX.toggleState();
      }
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      const nextIdx = (currentCardIndex + 1) % totalCards;
      updateActiveUI(nextIdx);
      if (typeof window.rotateCylinderToCard === 'function') {
        window.rotateCylinderToCard(nextIdx + 1);
      }
      if (typeof window.playCyberSFX === 'function') window.playCyberSFX('dialTick');
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      const nextIdx = (currentCardIndex - 1 + totalCards) % totalCards;
      updateActiveUI(nextIdx);
      if (typeof window.rotateCylinderToCard === 'function') {
        window.rotateCylinderToCard(nextIdx + 1);
      }
      if (typeof window.playCyberSFX === 'function') window.playCyberSFX('dialTick');
    } else if (e.key === 'Escape') {
      if (mobileMenuModal?.classList.contains('active')) {
        window.closeMobileMenu();
      } else if (document.body.classList.contains('in-deep-dive')) {
        window.closeActiveTheoryDrawer();
      }
    }
  });

  // Active Theory Live Telemetry Clock Loop
  function updateTelemetryClock() {
    const clockEl = document.getElementById('atUtcClock');
    const mobileClockEl = document.getElementById('mobileUtcClock');
    const now = new Date();
    const h = String(now.getUTCHours()).padStart(2, '0');
    const m = String(now.getUTCMinutes()).padStart(2, '0');
    const s = String(now.getUTCSeconds()).padStart(2, '0');
    const timeStr = `${h}:${m}:${s} UTC`;
    if (clockEl) clockEl.textContent = timeStr;
    if (mobileClockEl) mobileClockEl.textContent = timeStr;
  }
  setInterval(updateTelemetryClock, 1000);
  updateTelemetryClock();

  // 6 Unique Card-Specific Transition Map
  const transitionMap = {
    profile: 'iris-scan',
    mutagen: 'quantum-glitch',
    vigil: 'radar-sweep',
    signalhub: 'oscilloscope-wave',
    tryhackme: 'hex-breach',
    transmission: 'quantum-teleport'
  };

  // Active Theory Cyber Shutter & Drawer Controller
  window.openActiveTheoryDrawer = function(cardId) {
    if (!cardId) cardId = cardIds[currentCardIndex];
    const shutter = document.getElementById('atShutterOverlay');

    // Assign card-specific transition theme
    if (shutter) {
      shutter.dataset.trans = transitionMap[cardId] || 'iris-scan';
      shutter.classList.add('active');
    }

    // Trigger distinctive sound effect based on card type
    if (typeof window.playCyberSFX === 'function') {
      if (cardId === 'mutagen' || cardId === 'tryhackme') {
        window.playCyberSFX('warpTransition');
      } else if (cardId === 'vigil') {
        window.playCyberSFX('portalClose');
      } else {
        window.playCyberSFX('click');
      }
    }

    setTimeout(() => {
      document.querySelectorAll('.at-drawer').forEach(d => {
        d.classList.remove('open');
        d.style.display = 'none';
      });
      const drawer = document.getElementById(`drawer-${cardId}`);
      if (drawer) {
        drawer.style.display = 'flex';
        void drawer.offsetWidth;
        drawer.classList.add('open');
        document.body.classList.add('in-deep-dive');

        // Scramble / Decrypt Drawer Title & Badges
        const h2 = drawer.querySelector('.at-drawer-title-group h2');
        if (h2) {
          if (!h2.dataset.text) h2.dataset.text = h2.textContent.trim();
          decryptText(h2);
        }
        const badge = drawer.querySelector('.at-drawer-badge');
        if (badge) {
          if (!badge.dataset.text) badge.dataset.text = badge.textContent.trim();
          decryptText(badge);
        }
        drawer.querySelectorAll('.dossier-header-title').forEach(el => {
          if (!el.dataset.text) el.dataset.text = el.textContent.trim();
          decryptText(el);
        });
      }

      // Open shutter blades with high-tech reveal
      if (shutter) {
        setTimeout(() => {
          shutter.classList.remove('active');
        }, 150);
      }
    }, 280);
  };

  window.closeActiveTheoryDrawer = function() {
    const shutter = document.getElementById('atShutterOverlay');
    if (shutter) shutter.classList.add('active');

    setTimeout(() => {
      document.querySelectorAll('.at-drawer').forEach(d => {
        d.classList.remove('open');
        d.style.display = 'none';
      });
      document.body.classList.remove('in-deep-dive');
      if (typeof window.closeActiveTheoryDeepDive === 'function') {
        window.closeActiveTheoryDeepDive();
      }
      if (shutter) shutter.classList.remove('active');
    }, 240);
  };

  // Card Deep Dive Handler
  window.addEventListener('activetheory-deepdive-open', (e) => {
    const cardId = e.detail?.cardId || cardIds[currentCardIndex];
    if (cardId) {
      if (typeof window.triggerActiveTheoryCardDeepDive === 'function') {
        window.triggerActiveTheoryCardDeepDive(cardId);
      } else {
        window.openActiveTheoryDrawer(cardId);
      }
    }
  });

  // ── LIVE INTERACTIVE CANVAS & MICRO-TOOL SIMULATORS ──
  
  // 1. Skill Radar Canvas Renderer (5-Axis Cyber Polygon)
  function renderSkillRadar() {
    const canvas = document.getElementById('skillRadarCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2 + 10, r = 105;
    const axes = [
      { name: 'VULN DISCOVERY', val: 0.95 },
      { name: 'LINUX PRIVESC', val: 0.98 },
      { name: 'DOCKER ASAN', val: 0.96 },
      { name: 'AI & LLM SEC', val: 0.94 },
      { name: 'THREAT INTEL', val: 0.92 }
    ];
    const count = axes.length;

    let time = 0;
    function drawRadar() {
      if (document.getElementById('drawer-profile')?.style.display === 'none') return;
      time += 0.03;
      ctx.clearRect(0, 0, w, h);

      // Background web polygons (3 levels)
      for (let level = 1; level <= 3; level++) {
        const lr = (r / 3) * level;
        ctx.beginPath();
        for (let a = 0; a < count; a++) {
          const angle = (Math.PI * 2 / count) * a - Math.PI / 2;
          const px = cx + Math.cos(angle) * lr;
          const py = cy + Math.sin(angle) * lr;
          if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(0, 255, 102, ${0.12 * level})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw axis lines & labels
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      for (let a = 0; a < count; a++) {
        const angle = (Math.PI * 2 / count) * a - Math.PI / 2;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.stroke();

        const lx = cx + Math.cos(angle) * (r + 26);
        const ly = cy + Math.sin(angle) * (r + 14);
        ctx.textAlign = 'center';
        ctx.fillText(axes[a].name, lx, ly);
      }

      // Animated Filled Polygon
      ctx.beginPath();
      for (let a = 0; a < count; a++) {
        const pulse = 1.0 + Math.sin(time + a) * 0.03;
        const currentVal = axes[a].val * pulse;
        const angle = (Math.PI * 2 / count) * a - Math.PI / 2;
        const px = cx + Math.cos(angle) * (r * currentVal);
        const py = cy + Math.sin(angle) * (r * currentVal);
        if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 255, 102, 0.22)';
      ctx.fill();
      ctx.strokeStyle = '#00ff66';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glowing nodes on vertices
      for (let a = 0; a < count; a++) {
        const pulse = 1.0 + Math.sin(time + a) * 0.03;
        const currentVal = axes[a].val * pulse;
        const angle = (Math.PI * 2 / count) * a - Math.PI / 2;
        const px = cx + Math.cos(angle) * (r * currentVal);
        const py = cy + Math.sin(angle) * (r * currentVal);
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#00ff66';
        ctx.stroke();
      }

      requestAnimationFrame(drawRadar);
    }
    drawRadar();
  }

  // 1b. Operator Live CLI Explorer
  const operatorCliTags = document.querySelectorAll('#operatorCliTags .cli-tag-btn');
  const operatorCliOutput = document.getElementById('operatorCliOutput');
  const cliResponses = {
    whoami: '<div style="color: var(--green);">[OPERATOR] Aaron Alva | Grade 11 Cybersecurity Researcher & Systems Developer</div><div class="dim">> Stack: Python, C/C++, Docker ASan, Linux Kernel Security, LLM Agent Fuzzing, SARIF v2.1</div>',
    research: '<div style="color: var(--cyan);">[RESEARCH_AREAS] Autonomous AST Fuzzing (Mutagen), Zero-Day Triage, CVE Correlation (Vigil), Linux Kernel PrivEsc, BCM2711 Hardware RE</div><div class="dim">> Current: LLM-guided high-entropy mutation engines and SARIF v2.1 pipeline automation</div>',
    methodology: '<div style="color: #00ff66;">[METHODOLOGY] 4-Phase VR Lifecycle: (1) Surface Enumeration & CFG Analysis -> (2) Semantic AST Mutation -> (3) Docker ASan Sandboxing -> (4) RCA & Auto-Patching</div><div class="dim">> Standard: OASIS SARIF v2.1 + NIST SP 800-115 + MITRE ATT&CK Framework</div>',
    scholarship: '<div style="color: #ffd700;">[GIAC_GFACT] SANS Institute National Scholar (CyberStart Canada Top Performer)</div><div class="dim">> GIAC GFACT Certified (Issued: 1 Sep 2026) | 98% Systems Logic, 99% Linux Security, 100% Python</div><div class="dim">> Credly ID: e6b7f224-b57d-4224-9f7a-cabe2b3fb257</div>',
    skills: '<div style="color: var(--green);">[CORE_SKILLS] AST Fuzzing, ASan Triage, Threat Intel, SARIF v2.1, Active Directory, Wireshark PCAP Forensics</div>',
    clearance: '<div style="color: #ff3366;">[SECURITY_CLEARANCE] LEVEL 5 // GIAC GFACT CERTIFIED & CTF TOP 1% VERIFIED</div>',
    cveaudit: '<div style="color: var(--cyan);">[CVE_AUDIT] Ingesting Nmap XML & PEASS telemetry... Correlated with NVD REST API v2.0 (Apache 2.4.49 CVE-2021-41773 Critical PoC Verified)</div>'
  };

  operatorCliTags.forEach(btn => {
    btn.onclick = () => {
      const cmd = btn.dataset.cmd;
      if (operatorCliOutput && cliResponses[cmd]) {
        operatorCliOutput.innerHTML = `<div>> aaronalva@nexus-terminal:~$ <span class="cyan">${cmd}</span></div>${cliResponses[cmd]}`;
        if (typeof window.playCyberSFX === 'function') window.playCyberSFX('click');
      }
    };
  });

  // 2. SignalHub Live Market Chart (Waveform + Candlestick Toggle)
  let activeTicker = 'NVDA';
  let chartMode = 'line'; // 'line' or 'candle'
  const btnToggleChartType = document.getElementById('btnToggleChartType');
  if (btnToggleChartType) {
    btnToggleChartType.onclick = () => {
      chartMode = chartMode === 'line' ? 'candle' : 'line';
      btnToggleChartType.textContent = chartMode === 'line' ? '[CANDLESTICK VIEW]' : '[WAVEFORM VIEW]';
      if (typeof window.playCyberSFX === 'function') window.playCyberSFX('click');
    };
  }

  function renderMarketChart() {
    const canvas = document.getElementById('marketChartCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    const tabs = document.querySelectorAll('#marketTickerTabs .target-btn');
    tabs.forEach(btn => {
      btn.onclick = () => {
        tabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTicker = btn.dataset.ticker || 'NVDA';
        if (typeof window.playCyberSFX === 'function') window.playCyberSFX('click');
      };
    });

    let frame = 0;
    const dataPoints = 60;
    const history = [];
    let basePrice = 128.40;

    for (let i = 0; i < dataPoints; i++) {
      history.push(basePrice + (Math.sin(i * 0.2) * 4.0));
    }

    function drawMarket() {
      if (document.getElementById('drawer-signalhub')?.style.display === 'none') return;
      frame++;

      if (frame % 4 === 0) {
        const noise = (Math.random() - 0.48) * 1.2;
        const last = history[history.length - 1];
        history.shift();
        history.push(Math.max(10, last + noise));
      }

      ctx.clearRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      for (let y = 30; y < h; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      for (let x = 60; x < w; x += 80) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }

      const minVal = Math.min(...history) - 2;
      const maxVal = Math.max(...history) + 2;

      if (chartMode === 'line') {
        const fillGrad = ctx.createLinearGradient(0, 0, 0, h);
        fillGrad.addColorStop(0, 'rgba(0, 255, 102, 0.35)');
        fillGrad.addColorStop(1, 'rgba(0, 255, 102, 0.0)');

        ctx.beginPath();
        const stepX = w / (dataPoints - 1);
        for (let i = 0; i < dataPoints; i++) {
          const px = i * stepX;
          const py = h - ((history[i] - minVal) / (maxVal - minVal)) * (h - 60) - 30;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = fillGrad;
        ctx.fill();

        ctx.beginPath();
        for (let i = 0; i < dataPoints; i++) {
          const px = i * stepX;
          const py = h - ((history[i] - minVal) / (maxVal - minVal)) * (h - 60) - 30;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = '#00ff66';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00ff66';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Candlestick rendering
        const stepX = w / dataPoints;
        for (let i = 0; i < dataPoints; i++) {
          const px = i * stepX + stepX / 2;
          const price = history[i];
          const prev = i > 0 ? history[i - 1] : price;
          const isUp = price >= prev;
          const py1 = h - ((Math.min(price, prev) - minVal) / (maxVal - minVal)) * (h - 60) - 30;
          const py2 = h - ((Math.max(price, prev) - minVal) / (maxVal - minVal)) * (h - 60) - 30;
          const barH = Math.max(3, Math.abs(py1 - py2));

          ctx.fillStyle = isUp ? '#00ff66' : '#ff3366';
          ctx.fillRect(px - 4, Math.min(py1, py2), 8, barH);
        }
      }

      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00ff66';
      ctx.textAlign = 'right';
      ctx.fillText(`${activeTicker} REAL-TIME: $${history[history.length - 1].toFixed(2)}`, w - 18, 30);

      requestAnimationFrame(drawMarket);
    }
    drawMarket();
  }

  // 3. Dynamic CVSS v3.1 Calculator (Card 03)
  const cvssAV = document.getElementById('cvssAV');
  const cvssAC = document.getElementById('cvssAC');
  const cvssPR = document.getElementById('cvssPR');
  const cvssScoreDisplay = document.getElementById('cvssScoreDisplay');
  const cvssAVLabel = document.getElementById('cvssAVLabel');
  const cvssACLabel = document.getElementById('cvssACLabel');
  const cvssPRLabel = document.getElementById('cvssPRLabel');

  function updateCvssScore() {
    if (!cvssAV || !cvssAC || !cvssPR || !cvssScoreDisplay) return;
    const avVal = parseInt(cvssAV.value, 10);
    const acVal = parseInt(cvssAC.value, 10);
    const prVal = parseInt(cvssPR.value, 10);

    const avNames = { 1: 'Physical', 2: 'Local', 3: 'Adj Net', 4: 'Network' };
    const acNames = { 1: 'High', 2: 'Low' };
    const prNames = { 1: 'None', 2: 'Low', 3: 'High' };

    if (cvssAVLabel) cvssAVLabel.textContent = avNames[avVal] || 'Network';
    if (cvssACLabel) cvssACLabel.textContent = acNames[acVal] || 'Low';
    if (cvssPRLabel) cvssPRLabel.textContent = prNames[prVal] || 'None';

    const score = Math.min(10.0, (avVal * 1.5 + acVal * 1.4 + (4 - prVal) * 0.9)).toFixed(1);
    cvssScoreDisplay.textContent = score;
    cvssScoreDisplay.style.color = score >= 9.0 ? '#ff3366' : score >= 7.0 ? '#ffb000' : '#00e5ff';
  }

  if (cvssAV) cvssAV.oninput = updateCvssScore;
  if (cvssAC) cvssAC.oninput = updateCvssScore;
  if (cvssPR) cvssPR.oninput = updateCvssScore;

  // 4. Wireshark PCAP Packet Row Selector (Card 05)
  const pcapRows = document.querySelectorAll('#pcapPacketList .pcap-row');
  const pcapHexInspector = document.getElementById('pcapHexInspector');
  pcapRows.forEach(row => {
    row.onclick = () => {
      pcapRows.forEach(r => r.style.background = 'transparent');
      row.style.background = 'rgba(0, 229, 255, 0.15)';
      const hex = row.dataset.hex || '';
      if (pcapHexInspector) {
        pcapHexInspector.innerHTML = `0000  ${hex.substring(0, 48)}  ...\n0010  ${hex.substring(48)}  ...`;
      }
      if (typeof window.playCyberSFX === 'function') window.playCyberSFX('click');
    };
  });

  // 5. AST Target Picker (Card 02)
  const fuzzerTargetPicker = document.querySelectorAll('#fuzzerTargetPicker .target-btn');
  const fuzzerSimLogs = document.getElementById('fuzzerSimLogs');
  const targetLogs = {
    cjson: '<div>> [AST_PARSER] Loaded target source: /sandbox/targets/cjson_target.c</div><div class="cyan">> [ASAN_SIGNAL] AddressSanitizer: heap-buffer-overflow on address 0x7fffa1 at pc 0x00000040182b</div><div style="color: #ff3366;">> [CRASH_LOC] READ of size 128 at 0x7fffa1 thread T0 in cjson_parse() (RIP: 0x40182b)</div><div style="color: var(--green);">> [AUTO_PATCH] Synthesized bounds check. Recompiling harness... PASSED (0 crashes in 5,000 cycles).</div>',
    auth: '<div>> [AST_PARSER] Loaded target source: /sandbox/targets/target_auth_verify.c</div><div class="cyan">> [ASAN_SIGNAL] AddressSanitizer: heap-use-after-free on address 0x602000000010 at pc 0x000000401a8f</div><div style="color: #ff3366;">> [CRASH_LOC] WRITE of size 8 at 0x602000000010 in verify_token() (RIP: 0x401a8f)</div><div style="color: var(--green);">> [AUTO_PATCH] Injected pointer zeroization post-free. Recompiling... PASSED.</div>',
    dns: '<div>> [AST_PARSER] Loaded target source: /sandbox/targets/target_dns_resolver.c</div><div class="cyan">> [ASAN_SIGNAL] AddressSanitizer: global-buffer-overflow in dns_decompress() at pc 0x00000040210e</div><div style="color: #ff3366;">> [CRASH_LOC] Stack pointer out-of-bounds at frame #3 during label decompression</div><div style="color: var(--green);">> [AUTO_PATCH] Added recursion depth cap and pointer offset check. PASSED.</div>'
  };

  fuzzerTargetPicker.forEach(btn => {
    btn.onclick = () => {
      fuzzerTargetPicker.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.target;
      if (fuzzerSimLogs && targetLogs[target]) {
        fuzzerSimLogs.innerHTML = `<div>> [SYS_INIT] Initializing Mutagen AST Mutation Engine & Docker ASan Sandbox...</div>${targetLogs[target]}`;
        if (typeof window.playCyberSFX === 'function') window.playCyberSFX('click');
      }
    };
  });

  const btnRunFuzzCycle = document.getElementById('btnRunFuzzCycle');
  const simStatusTag = document.getElementById('simStatusTag');
  if (btnRunFuzzCycle) {
    btnRunFuzzCycle.onclick = () => {
      if (simStatusTag) simStatusTag.innerHTML = '<span style="color: #00e5ff;">[RUNNING] SYNTHESIZING AST MUTATIONS...</span>';
      if (fuzzerSimLogs) {
        fuzzerSimLogs.innerHTML = '<div>> [FUZZ_START] Spawning ephemeral Docker sandbox (--network=none)...</div><div class="dim">> [MUTATOR] Generating 2,500 AST high-entropy input variations...</div>';
      }
      if (typeof window.playCyberSFX === 'function') window.playCyberSFX('warpTransition');

      setTimeout(() => {
        if (fuzzerSimLogs) {
          fuzzerSimLogs.innerHTML += '<div class="cyan">> [ASAN_SIGNAL] AddressSanitizer: heap-buffer-overflow on address 0x7fffa1</div><div style="color: #ff3366;">> [CRASH_DEDUPLICATE] Crash signature hash: RIP_0x40182b_HEAP_OVERFLOW</div><div style="color: var(--green);">> [AUTO_PATCH] Generated patch verified successfully!</div>';
        }
        if (simStatusTag) simStatusTag.innerHTML = '<span style="color: var(--green);">[PASS] AUTO-PATCH VERIFIED</span>';
      }, 900);
    };
  }

  // 5b. SANS GFACT Interactive Knowledge Quiz (Card 06)
  const sansQuizAnswers = document.querySelectorAll('#sansQuizAnswers button');
  const sansQuizFeedback = document.getElementById('sansQuizFeedback');
  sansQuizAnswers.forEach(btn => {
    btn.onclick = () => {
      const isCorrect = btn.dataset.correct === 'true';
      sansQuizAnswers.forEach(b => b.style.borderColor = 'rgba(255, 215, 0, 0.25)');
      if (isCorrect) {
        btn.style.borderColor = 'var(--green)';
        btn.style.background = 'rgba(0, 255, 102, 0.2)';
        if (sansQuizFeedback) {
          sansQuizFeedback.innerHTML = '<span style="color: var(--green); font-weight: bold;">[CORRECT] In x86_64 ABI, the `ret` instruction pops the stored return address from the stack directly into %rip.</span>';
        }
        if (typeof window.playCyberSFX === 'function') window.playCyberSFX('warpTransition');
      } else {
        btn.style.borderColor = '#ff3366';
        btn.style.background = 'rgba(255, 51, 102, 0.15)';
        if (sansQuizFeedback) {
          sansQuizFeedback.innerHTML = '<span style="color: #ff3366;">[INCORRECT] The Instruction Pointer (%rip) determines the next instruction to execute when popped from stack frame.</span>';
        }
        if (typeof window.playCyberSFX === 'function') window.playCyberSFX('click');
      }
    };
  });

  // 5c. CTF Machine Case Study Tabs (Card 07)
  const ctfMachineTabs = document.querySelectorAll('#ctfMachineTabs .target-btn');
  const ctfMachineContent = document.getElementById('ctfMachineContent');
  const machineWriteups = {
    ad: `<div style="color: var(--cyan); font-weight: bold;">[CASE STUDY: VULNNET ACTIVE // ACTIVE DIRECTORY COMPROMISE]</div>
<div class="dim">> Objective: Escalate from unauthenticated SMB null session to Domain Admin.</div>
<div>1. <span class="cyan">SMB Null Session:</span> Discovered readable IPC$ share listing service account usernames (<code>Enterprise-Backup</code>).</div>
<div>2. <span class="warn">Kerberoasting:</span> Executed <code>GetUserSPNs.py enterprise.local/Enterprise-Backup -request</code> to dump TGS ticket hashes for SPN <code>MSSQLSvc/db01.enterprise.local</code>.</div>
<div>3. <span class="warn">Hashcat Cracking:</span> Recovered plaintext password in 4.2 minutes using mode 13100 and rockyou.txt.</div>
<div>4. <span class="err">BloodHound Analysis:</span> Identified member of "Server Operators" group with permission to restart <code>AppReadiness</code> service.</div>
<div>5. <span class="green">Domain Admin:</span> Configured binary path to net user admin exploit and spawned privileged SYSTEM shell.</div>`,
    linux: `<div style="color: var(--green); font-weight: bold;">[CASE STUDY: CYBERPULSE // LINUX SUID & CAPABILITY EXPLOITATION]</div>
<div class="dim">> Objective: Bypass low-privilege www-data shell to gain root via SUID binary reverse engineering.</div>
<div>1. <span class="cyan">Web Shell Foothold:</span> Uploaded obfuscated PHP reverse shell via unsanitized avatar upload bypass.</div>
<div>2. <span class="cyan">LinPEAS Enumeration:</span> Discovered custom compiled binary <code>/usr/local/bin/log_monitor</code> with SUID bit (4755).</div>
<div>3. <span class="warn">Ghidra Reverse Engineering:</span> Analyzed decompiled C code; found vulnerable <code>system("tail -n 20 /var/log/syslog")</code> calling relative path without absolute binary definition.</div>
<div>4. <span class="err">PATH Hijacking:</span> Created malicious <code>tail</code> script in <code>/tmp</code> executing <code>/bin/bash -p</code> and pre-pended <code>PATH=/tmp:$PATH</code>.</div>
<div>5. <span class="green">Root Execution:</span> Triggered binary to obtain root shell (<code>euid=0(root)</code>).</div>`,
    web: `<div style="color: #ffd700; font-weight: bold;">[CASE STUDY: RETROAUTH // BLIND SQLi & CLOUD METADATA SSRF TO RCE]</div>
<div class="dim">> Objective: Exploit blind SQL injection to dump administrative API keys, chain with SSRF to achieve cloud RCE.</div>
<div>1. <span class="cyan">Boolean-Blind SQLi:</span> Identified injection point in HTTP <code>X-Forwarded-For</code> header using conditional time delays (<code>pg_sleep(5)</code>).</div>
<div>2. <span class="cyan">Data Exfiltration:</span> Scripted custom Python multithreaded binary search script to extract admin bcrypt hash and secret internal endpoint.</div>
<div>3. <span class="warn">Cloud SSRF:</span> Targeted internal PDF generation service via <code>&lt;iframe src="http://169.254.169.254/latest/meta-data/iam/security-credentials/"&gt;</code>.</div>
<div>4. <span class="err">AWS STS Tokens:</span> Harvested temporary IAM session credentials with EC2 full administrative access.</div>
<div>5. <span class="green">Cloud Shell RCE:</span> Deployed AWS SSM command to execute remote shell on target container.</div>`
  };

  ctfMachineTabs.forEach(tab => {
    tab.onclick = () => {
      ctfMachineTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const machine = tab.dataset.machine;
      if (ctfMachineContent && machineWriteups[machine]) {
        ctfMachineContent.innerHTML = machineWriteups[machine];
        if (typeof window.playCyberSFX === 'function') window.playCyberSFX('click');
      }
    };
  });

  // ── SEQUENTIAL DYNAMIC TYPEWRITER TERMINAL ENGINE ──
  window.runSequentialTypewriterLogs = function() {
    const logsEl = document.getElementById('fuzzerSimLogs');
    const statusEl = document.getElementById('simStatusTag');
    if (!logsEl) return;

    if (statusEl) {
      statusEl.innerHTML = '<span style="color: #00e5ff;">● EXECUTING DYNAMIC FUZZ WORKERS...</span>';
    }

    const logLines = [
      { text: '> [SYS_INIT] Initializing Mutagen AST Mutation Engine & Docker ASan Sandbox...', color: '' },
      { text: '> [AST_PARSER] Loaded target source: /sandbox/targets/target_cjson.c (12 functions, 4 API sinks)', color: 'dim' },
      { text: '> [AST_MUTATOR] Generating high-entropy JSON payloads with overlong hex escapes (\'\\x41\\x41...\')...', color: 'cyan' },
      { text: '> [DOCKER_EXEC] Detonating payload in isolated container (PID 4912, --network=none)...', color: '' },
      { text: '> [ASAN_SIGNAL] AddressSanitizer: heap-buffer-overflow on address 0x7fffa1 at pc 0x00000040182b', color: 'cyan' },
      { text: '> [CRASH_LOC] READ of size 128 at 0x7fffa1 thread T0 in cjson_unescape() (RIP: 0x40182b)', color: '#ff3366' },
      { text: '> [RCA_ENGINE] Isolated minimal testcase: "\\x41" * 256. Out-of-bounds offset: +128 bytes.', color: 'warn' },
      { text: '> [AST_SYNTHESIS] Generating dynamic capacity tracking bounds check patch...', color: '' },
      { text: '> [VERIFY] Recompiling target with synthesized AST patch in ASan harness... PASSED.', color: '#00ff66' },
      { text: '> [AUTO_PATCH] 0 crashes in 5,000 fuzz cycles. Exporting patch diff & SARIF v2.1 report.', color: '#00ff66' }
    ];

    logsEl.innerHTML = '';
    let lineIdx = 0;

    function streamNextLine() {
      if (lineIdx >= logLines.length) {
        if (statusEl) {
          statusEl.innerHTML = '<span style="color: #00ff66;">● MUTAGEN CYCLE COMPLETE // 0 CRASHES</span>';
        }
        return;
      }

      const item = logLines[lineIdx];
      const div = document.createElement('div');
      if (item.color.startsWith('#')) {
        div.style.color = item.color;
      } else if (item.color) {
        div.className = item.color;
      }
      div.innerHTML = '<span class="tw-text"></span><span class="typewriter-cursor"></span>';
      logsEl.appendChild(div);
      logsEl.scrollTop = logsEl.scrollHeight;

      const twSpan = div.querySelector('.tw-text');
      const cursorSpan = div.querySelector('.typewriter-cursor');
      let charIdx = 0;
      const fullText = item.text;

      function typeChar() {
        if (charIdx < fullText.length) {
          twSpan.textContent += fullText.charAt(charIdx);
          charIdx++;
          setTimeout(typeChar, Math.max(6, Math.min(22, 160 / fullText.length)));
        } else {
          if (cursorSpan) cursorSpan.remove();
          lineIdx++;
          setTimeout(streamNextLine, 110);
        }
      }

      typeChar();
    }

    streamNextLine();
  };

  // Hook into drawer open events to trigger canvas loops & sequential typewriter
  const originalOpenDrawer = window.openActiveTheoryDrawer;
  window.openActiveTheoryDrawer = function(cardId) {
    if (typeof originalOpenDrawer === 'function') originalOpenDrawer(cardId);
    setTimeout(() => {
      if (cardId === 'profile') renderSkillRadar();
      if (cardId === 'mutagen') window.runSequentialTypewriterLogs();
      if (cardId === 'signalhub') renderMarketChart();
    }, 320);
  };

  // Interactive Phase Pipeline Nodes Sound & Wave Interaction
  document.querySelectorAll('.cpp-stage-node').forEach((node) => {
    node.addEventListener('click', () => {
      if (typeof window.playCyberSFX === 'function') window.playCyberSFX('warpTransition');
    });
    node.addEventListener('mouseenter', () => {
      if (typeof window.playCyberSFX === 'function') window.playCyberSFX('hover');
    });
  });

  // 6. Interactive In-Browser CTF Flag Solver
  const btnSolveFlag = document.getElementById('btnSolveFlag');
  const ctfInputFlag = document.getElementById('ctfInputFlag');
  const ctfFlagResult = document.getElementById('ctfFlagResult');

  if (btnSolveFlag && ctfInputFlag) {
    btnSolveFlag.onclick = () => {
      const val = ctfInputFlag.value.trim();
      const targetFlag = 'THM{AARON_ALVA_CYBER_SECURITY_NEXUS_2024}';
      if (val === targetFlag || val.toLowerCase().includes('aaron_alva')) {
        ctfFlagResult.innerHTML = '<span style="color: var(--green); font-weight: bold;">[FLAG_CAPTURED] 100 PTS AWARDED! ACCESS KEY VERIFIED!</span>';
        if (typeof window.playCyberSFX === 'function') window.playCyberSFX('warpTransition');
      } else {
        ctfFlagResult.innerHTML = '<span style="color: #ff3366;">[INVALID_FLAG] Try base64 decoding the payload string above!</span>';
        if (typeof window.playCyberSFX === 'function') window.playCyberSFX('click');
      }
    };
  }

  // 7. Contact Transmission Form Handler
  const transmitBtn = document.getElementById('contactTransmitBtn');
  const contactName = document.getElementById('contactName');
  const contactMsg = document.getElementById('contactMsg');
  const contactResultLine = document.getElementById('contactResultLine');

  if (transmitBtn) {
    transmitBtn.addEventListener('click', () => {
      const name = (contactName?.value || '').trim() || 'Anonymous';
      const msg = (contactMsg?.value || '').trim();

      if (!msg) {
        if (contactResultLine) {
          contactResultLine.innerHTML = '<span style="color:#ff3344">[ERROR] Transmission message buffer is empty.</span>';
        }
        return;
      }

      transmitBtn.disabled = true;
      transmitBtn.innerHTML = '[ENCRYPTING & TRANSMITTING...]';
      if (contactResultLine) {
        contactResultLine.innerHTML = '<span style="color:#00e5ff">[PROTOCOL] Establishing PGP handshaking protocol...</span>';
      }

      setTimeout(() => {
        const subject = encodeURIComponent(`[Portfolio Transmission] from ${name}`);
        const body = encodeURIComponent(`Sender: ${name}\n\nMessage:\n${msg}`);
        window.location.href = `mailto:aaronalva@yahoo.com?subject=${subject}&body=${body}`;

        transmitBtn.disabled = false;
        transmitBtn.innerHTML = '[TRANSMISSION DELIVERED]';
        if (contactResultLine) {
          contactResultLine.innerHTML = '<span style="color:#00ff66">[SUCCESS] Packet dispatched successfully to secure inbox.</span>';
        }
      }, 700);
    });
  }
})();

