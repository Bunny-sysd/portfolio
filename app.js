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
  const bar      = document.getElementById('splashBar');
  const skipBtn  = document.getElementById('splashSkipBtn');
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
    { text: '> [SYS] Mapping 91 TryHackMe active badges... [OK]', delay: 850, class: 'text-dim' },
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

    if (trimmed === 'clear') {
      terminal.innerHTML = '';
      return;
    }

    if (trimmed === './view_mutagen_fuzzer') {
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

    if (trimmed === 'cat certifications.txt') {
      printLine('[OK] Querying local credentials vault...', 'text-cyan');
      setTimeout(() => {
        printLine('------------------------------------------------------------', 'text-muted');
        printLine('LEGAL NAME: Aaron Lawrence Alva', 'text-white');
        printLine('VERIFIED CREDENTIALS:', 'text-green');
        printLine('  1. TryHackMe Intro to Cybersecurity (91 Badges Map) - VERIFIED', 'text-dim');
        printLine('  2. TryHackMe AI Security (Prompt Injection / Attack Mapping) - VERIFIED', 'text-dim');
        printLine('------------------------------------------------------------', 'text-muted');
      }, 200);
      return;
    }

    if (trimmed === 'cat resume.md') {
      printLine('[OK] Fetching formatted functional resume...', 'text-cyan');
      setTimeout(() => {
        printLine('============================================================', 'text-muted');
        printLine('AARON ALVA // Mississauga, ON // Email: aaron.lawrence.alva@gmail.com', 'text-white');
        printLine('------------------------------------------------------------', 'text-muted');
        printLine('SUMMARY:', 'text-green');
        printLine('  Motivated Grade 10 honours student with deep passion for network defense,', 'text-dim');
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
        printLine('  - Ontario Secondary School Diploma (St. Joseph, Mississauga, ON) // Grade 10', 'text-dim');
        printLine('  - Standing: Honours (80+) // Computer Science & Math coursework', 'text-dim');
        printLine('============================================================', 'text-muted');
      }, 200);
      return;
    }

    if (trimmed === 'cat skills.db') {
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

    if (trimmed === 'cat profile.md') {
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
        if (knownCommands.includes(val)) {
          executeCommand(val);
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

// ── BENTO WIDGETS DYNAMIC LOGGING & SIGNAL STREAMS ────────────────
(function initBentoWidgets() {
  // 1. Mutagen Live Log Streamer
  const mutagenLogs = document.getElementById('mutagenLiveLogs');
  if (mutagenLogs) {
    const logTemplates = [
      { tag: '[SYS]', class: 'tag-sys', text: 'Routing fuzzer input via OpenClaw gateway... [OK]' },
      { tag: '[Ghidra]', class: 'tag-agent', text: 'Disassembling instruction offset 0x004011d4...' },
      { tag: '[AUDIT]', class: 'tag-audit', text: 'Memory limit buffer overflow check: COMPLETED.' },
      { tag: '[HEAP]', class: 'tag-fuzz', text: 'Memory chunk offset 0x004012fc overflow audited... PATCHED.' },
      { tag: '[PoC]', class: 'tag-exploit', text: 'Compiling buffer corrupt payload verification exploit...' },
      { tag: '[NLP]', class: 'tag-agent', text: 'Analyzing buffer bounds targeting socket Port 8080...' },
      { tag: '[OK]', class: 'tag-sys', text: 'Patch compiled. Target system vulnerability successfully secured.' }
    ];

    let logIndex = 0;
    setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const template = logTemplates[logIndex];

      const line = document.createElement('div');
      line.className = 'mutagen-log-line';
      
      const timeSpan = document.createElement('span');
      timeSpan.className = 'log-time';
      timeSpan.textContent = `[${timeStr}] `;
      
      const tagSpan = document.createElement('span');
      tagSpan.className = `log-tag ${template.class}`;
      tagSpan.textContent = `${template.tag} `;
      
      const textSpan = document.createElement('span');
      textSpan.textContent = template.text;
      if (template.text.includes('0x004011d4')) {
        textSpan.innerHTML = 'Disassembling instruction offset <span class="highlight-address">0x004011d4</span>...';
      } else if (template.text.includes('secured') || template.text.includes('[OK]')) {
        textSpan.innerHTML = 'Patch compiled. Target system vulnerability successfully <span class="highlight-success">SECURED</span>.';
      }

      line.appendChild(timeSpan);
      line.appendChild(tagSpan);
      line.appendChild(textSpan);
      mutagenLogs.appendChild(line);

      // Prevent DOM bloating
      while (mutagenLogs.children.length > 14) {
        mutagenLogs.removeChild(mutagenLogs.firstChild);
      }

      mutagenLogs.scrollTop = mutagenLogs.scrollHeight;
      logIndex = (logIndex + 1) % logTemplates.length;
    }, 2800);
  }

  // 2. SignalHub Stock JSON Ticker Streamer
  const stockStream = document.getElementById('stockJsonStream');
  if (stockStream) {
    const symbols = ['NVDA', 'MSFT', 'AAPL', 'TSLA'];
    const prices = { NVDA: 824.15, MSFT: 418.20, AAPL: 182.30, TSLA: 175.40 };
    const deltas = { NVDA: 4.2, MSFT: 2.3, AAPL: 0.8, TSLA: -3.1 };

    setInterval(() => {
      // Pick random symbol
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      
      // Update values
      const deltaShift = (Math.random() - 0.48) * 0.8;
      deltas[sym] = parseFloat((deltas[sym] + deltaShift).toFixed(2));
      prices[sym] = parseFloat((prices[sym] * (1 + deltaShift / 100)).toFixed(2));

      // Update Tickers text and colors
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

      // Generate structured JSON string
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
      btnText: "TERMINATE_SESSION"
    },
    "proj-stock": {
      title: "SignalHub Analytics",
      meta: "DATA_PIPELINE / LIVE // 2025",
      desc: "SignalHub builds high-frequency stock parsing micro-systems. It streams market feed variables from Alpha Vantage API directly to Firebase Realtime Databases. Integrated triggers invoke agentic models to analyze price indicators and output trading buy/sell signal models.",
      tags: ["Firebase Database", "Alpha Vantage API", "Node.js REST", "Tailwind CSS"],
      btnText: "TERMINATE_SESSION"
    },
    "proj-thm": {
      title: "TryHackMe CTF Labs",
      meta: "OFFENSIVE_OPERATIONS // 2025",
      tags: ["Metasploit Suite", "Burp Suite Pro", "Nmap Scanner", "Wireshark", "John"],
      isSandbox: true,
      btnText: "TERMINATE_SESSION"
    },
    "proj-vm": {
      title: "Security Lab Sandbox",
      meta: "VIRTUAL_ISOLATION_LAB // 2023-2025",
      tags: ["VirtualBox Hypervisor", "Kali Linux", "Wireshark PCAPs", "PFsense Firewall"],
      isSandbox: true,
      btnText: "TERMINATE_SESSION"
    },
    "proj-pentestai": {
      title: "Security LLM Training",
      meta: "TRANSFORMERS / HUGGINGFACE // 2025",
      desc: "Finetuned Mistral and LLaMA transformers on custom datasets of vulnerable source codes to classify CVE entry categories automatically.",
      tags: ["HuggingFace", "Python PyTorch", "QLoRA", "Tokenizer Tuning"],
      btnText: "TERMINATE_SESSION"
    }
  };

  let activeTypewriters = [];

  function openModal(id) {
    window.openProjectModal = openModal;
    const data = projectsDb[id];
    if (!data) return;

    // Clear active typewriters
    activeTypewriters.forEach(t => clearInterval(t));
    activeTypewriters = [];

    if (data.isSandbox) {
      modalBody.innerHTML = `
        <div class="modal-body-title">${data.title}</div>
        <div class="modal-body-meta">${data.meta}</div>
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
          ${data.tags.map(tag => `<span>${tag}</span>`).join('')}
        </div>
        <div class="mt-4">
          <button class="modal-action-btn" id="modalDismissBtn">${data.btnText}</button>
        </div>
      `;

      // Start typing simulation
      setTimeout(() => startSandboxSimulation(), 200);

    } else {
      modalBody.innerHTML = `
        <div class="modal-body-title">${data.title}</div>
        <div class="modal-body-meta">${data.meta}</div>
        <p class="modal-body-desc">${data.desc}</p>
        <div class="modal-body-tags">
          ${data.tags.map(tag => `<span>${tag}</span>`).join('')}
        </div>
        <div class="mt-4">
          <button class="modal-action-btn" id="modalDismissBtn">${data.btnText}</button>
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
      // Prevent modal opening when clicking active buttons directly
      if (e.target.closest('a.proj-link')) return;

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

// Console log egg easter header
console.log(
  '%c 0xPORTFOLIO ACTIVE // AUTHORIZED SESSION ',
  'color:#00ff41;background:#0A0A0C;font-family:monospace;font-size:16px;padding:6px 12px;border:1px solid #00ff41;'
);
