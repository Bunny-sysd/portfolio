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

// ── FRONT DOOR: instant credentials-first landing, shown every load.
// No auto-resolve, no fail-safe timer — only an explicit click or Escape
// dismisses it. Input to the 3D scene underneath is locked via the
// front-door-active body class, checked by three-bg.js's wheel/pointer/
// click guards (the same pattern the drawer system uses for in-deep-dive),
// and by the global 1-6/arrow hotkey handler above. ──
(function initFrontDoor() {
  const gate = document.getElementById('frontDoor');
  if (!gate) return;

  const enterBtn = document.getElementById('frontDoorEnter');
  const skipBtn = document.getElementById('frontDoorSkip');
  let resolved = false;

  function enterSite() {
    if (resolved) return;
    resolved = true;
    gate.classList.add('hidden');
    document.body.classList.remove('front-door-active');
  }

  if (enterBtn) enterBtn.addEventListener('click', enterSite);
  if (skipBtn) skipBtn.addEventListener('click', enterSite);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !resolved) enterSite();
  });

  document.body.classList.add('front-door-active');
})();

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
    if (document.body.classList.contains('front-door-active')) return;

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

  // ── Command block typewriter reveal: comment lines pop in, the actual
  // `$ command` text types out character-by-character, then a pause before
  // the next command — makes each command read as its own sequential step
  // rather than everything arriving in one 90ms-staggered burst. ──
  const PROMPT_LINE_RE = /^(<span class="cmd-prompt">.*?<\/span>)(.*)$/;
  function revealCommandBlocks(scopeEl) {
    if (!scopeEl) return;
    scopeEl.querySelectorAll('.command-block-code').forEach((block) => {
      if (!block.dataset.rawHtml) block.dataset.rawHtml = block.innerHTML;
      const lines = block.dataset.rawHtml.split('\n');
      block.innerHTML = '';
      let delay = 0;
      lines.forEach((lineHtml) => {
        // Each line's wrapper is created now but only appended to the DOM
        // (triggering its entrance animation) at the moment its first
        // character actually appears — appending it empty ahead of time
        // would fire the fade/slide-in against a blank box.
        const lineWrap = document.createElement('span');
        lineWrap.className = 'command-line-reveal';
        const promptMatch = lineHtml.match(PROMPT_LINE_RE);
        if (promptMatch) {
          const [, promptHtml, commandText] = promptMatch;
          setTimeout(() => { lineWrap.innerHTML = promptHtml; block.appendChild(lineWrap); }, delay);
          for (let ci = 1; ci <= commandText.length; ci++) {
            setTimeout(() => { lineWrap.innerHTML = promptHtml + commandText.slice(0, ci); }, delay + 60 + ci * 18);
          }
          delay += 60 + commandText.length * 18 + 450; // pause after this command "finishes running"
        } else {
          setTimeout(() => { lineWrap.innerHTML = lineHtml; block.appendChild(lineWrap); }, delay);
          delay += lineHtml.trim() ? 150 : 80;
        }
      });
    });
  }

  // ── Phase-flow diagram: one timer per drawer drives the node glow,
  // the connector pulse travel, and the "PHASE X/N · LABEL" text together,
  // so all three can never drift out of sync with each other. ──
  const activePhaseFlowCleanups = [];
  function stopPhaseFlowCycles() {
    activePhaseFlowCleanups.forEach((fn) => fn());
    activePhaseFlowCleanups.length = 0;
  }
  function runPhaseFlow(wrap) {
    const nodeEls = Array.from(wrap.querySelectorAll('.phase-node'));
    const connectorEls = Array.from(wrap.querySelectorAll('.phase-connector'));
    const pulseEls = connectorEls.map((c) => c.querySelector('.phase-pulse'));
    const readout = wrap.querySelector('[data-phase-readout]');
    const labels = nodeEls.map((n) => n.querySelector('.phase-node-label')?.textContent.trim() || '');
    const count = nodeEls.length;
    if (!readout || count < 1) return () => {};

    const setActive = (i) => {
      nodeEls.forEach((n, idx) => n.classList.toggle('is-active', idx === i));
      readout.textContent = `PHASE ${i + 1}/${count} · ${labels[i].toUpperCase()}`;
    };
    setActive(0);
    if (count < 2) return () => {};

    // Reduced motion still needs to see every phase — it's informational
    // content, not just decoration — so only the sliding-dot sub-animation
    // (the one continuous motion element) is skipped, not the whole cycle.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const DWELL_MS = 2100;
    const TRAVEL_MS = 900;
    const timeouts = [];
    let current = 0;

    const travelPulse = (connectorIdx) => {
      if (reduceMotion) return;
      const pulse = pulseEls[connectorIdx];
      if (!pulse) return;
      pulse.style.transitionDuration = '0s';
      pulse.style.left = '0%';
      pulse.classList.add('is-traveling');
      void pulse.offsetWidth; // force reflow so the 0% start actually applies before animating
      pulse.style.transitionDuration = '';
      requestAnimationFrame(() => { pulse.style.left = '100%'; });
    };

    const step = () => {
      timeouts.push(setTimeout(() => {
        if (current < count - 1) travelPulse(current);
        timeouts.push(setTimeout(() => {
          current = (current + 1) % count;
          setActive(current);
          pulseEls.forEach((p) => { if (p) { p.classList.remove('is-traveling'); p.style.left = '0%'; } });
          step();
        }, TRAVEL_MS));
      }, DWELL_MS));
    };
    step();

    return () => timeouts.forEach(clearTimeout);
  }
  function startPhaseFlowCycles(scopeEl) {
    stopPhaseFlowCycles();
    if (!scopeEl) return;
    scopeEl.querySelectorAll('.phase-flow-wrap').forEach((wrap) => {
      activePhaseFlowCleanups.push(runPhaseFlow(wrap));
    });
  }

  // Hook into drawer open/close events to trigger canvas loops + new widgets
  const originalOpenDrawer = window.openActiveTheoryDrawer;
  window.openActiveTheoryDrawer = function(cardId) {
    if (typeof originalOpenDrawer === 'function') originalOpenDrawer(cardId);
    setTimeout(() => {
      const drawerEl = document.getElementById(`drawer-${cardId}`);
      if (drawerEl) {
        revealCommandBlocks(drawerEl);
        startPhaseFlowCycles(drawerEl);
      }
    }, 320);
  };

  const originalCloseDrawer = window.closeActiveTheoryDrawer;
  window.closeActiveTheoryDrawer = function() {
    stopPhaseFlowCycles();
    if (typeof originalCloseDrawer === 'function') originalCloseDrawer();
  };

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

