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
        const knownCommands = ['./view_mutagen_fuzzer', 'cat certifications.txt', 'cat skills.db', 'cat profile.md', 'clear'];
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

// ── DETAIL EXPAND MODAL & HARDWARE GLITCH SIMULATOR ───────────────
(function initProjectModals() {
  const cards = document.querySelectorAll('.bento-project-card.hardware-glitch');
  const modal = document.getElementById('projectModal');
  const modalBody = document.getElementById('modalBody');
  const closeBtn = document.getElementById('modalCloseBtn');

  if (!modal || !modalBody) return;

  const projectsDb = {
    "proj-mutagen": {
      title: "Mutagen Zero-Day Fuzzer",
      meta: "AGENTIC_AI / BINARY_FUZZER // 2026",
      desc: "Mutagen is an autonomous vulnerability platform designed to inspect binary systems for memory vulnerabilities. It combines headless Ghidra disassembly with LLM agents to detect buffer overflows, construct target payloads to verify exploitative impact, compile patches, and re-test binaries in secure Docker sandboxes.",
      tags: ["Python", "Gemma 4", "Ghidra API", "Docker Sandbox", "C++ ASM"],
      link: "https://github.com/bunny-sysd/mutagen",
      btnText: "CONNECT_TO_MUTAGEN_PIPELINE"
    },
    "proj-stock": {
      title: "SignalHub Analytics",
      meta: "DATA_PIPELINE / LIVE // 2025",
      desc: "SignalHub builds high-frequency stock parsing micro-systems. It streams market feed variables from Alpha Vantage API directly to Firebase Realtime Databases. Integrated triggers invoke agentic models to analyze price indicators and output trading buy/sell signal models.",
      tags: ["Firebase Database", "Alpha Vantage API", "Node.js REST", "Tailwind CSS"],
      link: "https://signalhub-e79ba.web.app/",
      btnText: "ESTABLISH_LIVE_SOCKET"
    },
    "proj-thm": {
      title: "TryHackMe CTF Labs",
      meta: "OFFENSIVE_OPERATIONS // 2025",
      desc: "Completed 91 security badges tracking network pen-testing, password audits, active directory compromises, privilege escalation, and binary exploitation models.",
      tags: ["Metasploit Suite", "Burp Suite Pro", "Nmap Scanner", "Wireshark", "John"],
      link: "https://tryhackme.com/p/354221973",
      btnText: "VIEW_VERIFIED_BADGES"
    },
    "proj-vm": {
      title: "Security Lab Sandbox",
      meta: "VIRTUAL_ISOLATION_LAB // 2023-2025",
      desc: "Configured local virtualized network sandboxes to perform secure penetration testing on targets. Establishes isolated interfaces to trace network packet headers without exposing external systems.",
      tags: ["VirtualBox Hypervisor", "Kali Linux", "Wireshark PCAPs", "PFsense Firewall"],
      link: "https://github.com/Bunny-sysd",
      btnText: "VIEW_LAB_DIAGRAMS"
    },
    "proj-pentestai": {
      title: "Security LLM Training",
      meta: "TRANSFORMERS / HUGGINGFACE // 2025",
      desc: "Finetuned Mistral and LLaMA transformers on custom datasets of vulnerable source codes to classify CVE entry categories automatically.",
      tags: ["HuggingFace", "Python PyTorch", "QLoRA", "Tokenizer Tuning"],
      link: "https://github.com/Bunny-sysd",
      btnText: "ACCESS_MODEL_WEIGHTS"
    }
  };

  function openModal(id) {
    const data = projectsDb[id];
    if (!data) return;

    modalBody.innerHTML = `
      <div class="modal-body-title">${data.title}</div>
      <div class="modal-body-meta">${data.meta}</div>
      <p class="modal-body-desc">${data.desc}</p>
      <div class="modal-body-tags">
        ${data.tags.map(tag => `<span>${tag}</span>`).join('')}
      </div>
      <div class="mt-4">
        <a href="${data.link}" target="_blank" class="modal-action-btn">${data.btnText}</a>
      </div>
    `;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Bind glitch clicks
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('id');
      if (!id) return;

      // Trigger 0.3s hardware fault glitch stutter
      card.classList.add('glitch-active');
      setTimeout(() => {
        card.classList.remove('glitch-active');
        openModal(id);
      }, 300);
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });
})();

// Console log egg easter header
console.log(
  '%c 0xPORTFOLIO ACTIVE // AUTHORIZED SESSION ',
  'color:#00ff41;background:#0A0A0C;font-family:monospace;font-size:16px;padding:6px 12px;border:1px solid #00ff41;'
);
