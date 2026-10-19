// The site's sound, generated live with WebAudio — no audio files, nothing
// sampled. Tonal and sparse on purpose: a calm ambient score, not a noise bed.
//
// Score — "Event Horizon": a low drone pad (a few detuned sines/triangles
// under a slow, gentle lowpass), a soft sine sub, a sparse bell arpeggio in D
// phrygian through a smooth reverb, and a quiet pulse. The mix follows where
// you are — home is calm, work a touch brighter, and across the event horizon
// (contact) everything is pitched down, slowed and muffled.
//
// Stingers: each project's opening effect gets its own short cue. Plus a
// sinkhole swell when a card falls in and a low drop crossing the horizon.
//
// Off by default; needs a click to start (autoplay policy); remembered per
// browser. There is no sustained white-noise layer anywhere — brief filtered
// noise is used only for soft transient ticks, kept dry and quiet.
const KEY = 'aa-sound';
const D = 73.42; // D2
const PHRYGIAN = [0, 1, 3, 5, 7, 8, 10];
const note = (deg, oct = 0) => D * 2 ** ((PHRYGIAN[((deg % 7) + 7) % 7] + 12 * (oct + Math.floor(deg / 7))) / 12);

export function createSound(button, { reduced = () => false, lite = false } = {}) {
  let ctx = null, master = null, wet = null, bus = null, on = false;
  const S = {};
  const read = () => { try { return localStorage.getItem(KEY) === 'on'; } catch { return false; } };
  const save = (v) => { try { localStorage.setItem(KEY, v ? 'on' : 'off'); } catch { /* private mode */ } };

  // A smooth reverb: a decaying sine-swept impulse (not noise), so sustained
  // tones bloom instead of hissing.
  function reverb(seconds = 3.2) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        // Sparse decaying taps, lightly randomised in time — diffuse but tonal.
        d[i] = Math.sin(i * 0.5 + ch) * Math.pow(1 - t, 3) * (0.3 + 0.7 * Math.random()) * 0.5;
      }
    }
    const c = ctx.createConvolver(); c.buffer = ir; return c;
  }

  function boot() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3; comp.release.value = 0.4;
    master.connect(comp).connect(ctx.destination);
    // Everything passes a "horizon" lowpass, so crossing it muffles the world.
    S.horizon = ctx.createBiquadFilter(); S.horizon.type = 'lowpass'; S.horizon.frequency.value = 16000;
    S.horizon.connect(master);
    bus = ctx.createGain(); bus.connect(S.horizon);
    wet = ctx.createGain(); wet.gain.value = 0.3;
    wet.connect(reverb()).connect(S.horizon);
    S.noise = (() => { const b = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; })();

    // Drone pad: a sub sine plus two gently detuned triangles through a slow
    // lowpass — warm, no buzz.
    S.detune = ctx.createConstantSource(); S.detune.offset.value = 0; S.detune.start();
    const pad = ctx.createBiquadFilter(); pad.type = 'lowpass'; pad.frequency.value = 440; pad.Q.value = 0.8;
    const sweep = ctx.createOscillator(), sweepAmt = ctx.createGain();
    sweep.frequency.value = 0.03; sweepAmt.gain.value = 160;
    sweep.connect(sweepAmt).connect(pad.frequency); sweep.start();
    S.padGain = ctx.createGain(); S.padGain.gain.value = 0.16;
    pad.connect(S.padGain).connect(bus); pad.connect(wet);
    for (const [mult, type, g, det] of [[0.5, 'sine', 0.5, 0], [1, 'triangle', 0.18, -6], [1, 'triangle', 0.18, 6], [1.5, 'sine', 0.1, 0]]) {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = type; o.frequency.value = D * mult; o.detune.value = det; og.gain.value = g;
      S.detune.connect(o.detune);
      o.connect(og).connect(mult === 0.5 ? S.padGain : pad); o.start();
    }

    S.mode = 'home';
    S.beat = 0; S.beatTime = ctx.currentTime + 0.3;
    S.timer = setInterval(schedule, 120);
    return true;
  }

  // A plucked synth bass: saw through a snapping lowpass — the drive layer.
  function bass(freq, at, dur = 0.16, vol = 0.09) {
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.value = freq;
    f.type = 'lowpass'; f.Q.value = 7;
    f.frequency.setValueAtTime(1100, at); f.frequency.exponentialRampToValueAtTime(220, at + dur);
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(f).connect(g).connect(bus); o.start(at); o.stop(at + dur + 0.03);
  }

  // A soft bell: sine + quiet octave, a pluck envelope, into dry + reverb.
  function bell(freq, at, { dur = 2.2, vol = 0.05, type = 'sine', wetAmt = 1, glideTo = 0 } = {}) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, at);
    o2.type = 'sine'; o2.frequency.setValueAtTime(freq * 2, at); g2.gain.value = 0.18;
    if (glideTo) { o.frequency.exponentialRampToValueAtTime(glideTo, at + dur); }
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); o2.connect(g2).connect(g); g.connect(bus);
    if (wetAmt) { const w = ctx.createGain(); w.gain.value = wetAmt * 0.6; g.connect(w).connect(wet); }
    o.start(at); o2.start(at); o.stop(at + dur + 0.05); o2.stop(at + dur + 0.05);
  }
  // A short dry tick (filtered noise burst) — never sustained, never to reverb.
  // A clean tonal blip — one oscillator, soft attack/decay. Replaces the old
  // filtered-noise "tick": repeated high-frequency noise bursts read as
  // firecrackers/sparks on phones and crackle under load.
  function tick(at, { freq = 2200, vol = 0.03, dur = 0.05, type = 'triangle' } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(bus); o.start(at); o.stop(at + dur + 0.02);
  }
  function thump(at, { from = 110, to = 34, vol = 0.3, dur = 0.7 } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(from, at); o.frequency.exponentialRampToValueAtTime(to, at + dur * 0.8);
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(bus); o.start(at); o.stop(at + dur + 0.05);
  }
  // A tonal sweep (sine gliding), for whooshes — no noise.
  function sweepTone(at, { from = 900, to = 90, dur = 0.9, vol = 0.06, type = 'sawtooth' } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 1200; f.Q.value = 4;
    o.type = type; o.frequency.setValueAtTime(from, at); o.frequency.exponentialRampToValueAtTime(to, at + dur);
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + dur * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(f).connect(g).connect(bus); o.start(at); o.stop(at + dur + 0.05);
  }
  const chord = (degs, at, opts) => degs.forEach((d, i) => bell(note(d, 2), at + i * 0.03, opts));

  // A beat grid (96 BPM, sixteenths), looked ahead. Intensity rises with the
  // view: calm and spacious on home, a driving kick + bass + hats in the work
  // carousel, and slow, heavy, muffled near the black hole (contact).
  const SIX = 60 / 96 / 4; // one sixteenth note, seconds
  const BASS_SEQ = [0, 0, 3, 0, 5, 0, 1, 3]; // phrygian root walk, per eighth
  const ARP = [0, 3, 2, 5]; // lead bell degrees, per quarter
  function schedule() {
    if (!on || !ctx) return;
    const ahead = ctx.currentTime + 0.4;
    const inside = S.mode === 'contact';
    const driving = S.mode === 'work' || S.mode === 'detail';
    while (S.beatTime < ahead) {
      const b = S.beat % 16, t = S.beatTime;
      // Lead bells, on quarter notes, denser when driving.
      if (b % 4 === 0 && Math.random() < (driving ? 0.7 : 0.4)) {
        const deg = ARP[(S.beat / 4 | 0) % ARP.length];
        bell(note(deg, 2) * (inside ? 0.5 : 1), t, { dur: inside ? 3.2 : 2.2, vol: 0.028 });
      }
      if (b === 0) bell(note(0, 1) * (inside ? 0.5 : 1), t, { dur: 4.5, vol: 0.022 });
      if (driving) {
        if (b % 4 === 0) thump(t, { from: 150, to: 42, vol: 0.3, dur: 0.26 });           // kick, on the quarter
        if (!lite && b % 4 === 2) tick(t, { freq: 1480, vol: 0.012, dur: 0.05 });         // soft tonal hat, offbeat
        // Bass on eighths (quarters on phones, to halve the voice count).
        if ((lite ? b % 4 === 0 : b % 2 === 0)) bass(note(BASS_SEQ[(S.beat / 2 | 0) % BASS_SEQ.length], 1), t);
      } else if (inside) {
        if (b % 8 === 0) thump(t, { from: 92, to: 24, vol: 0.5, dur: 0.95 });             // heavy slow kick
        if (b % 4 === 0) bass(note(0, 0), t, 0.5, 0.07);                                  // sub drone pulse
      } else if (b % 8 === 0) {
        tick(t, { freq: note(0, 2), vol: 0.012, dur: 0.5, type: 'sine' });                // soft tonal home pulse
      }
      S.beat++; S.beatTime += SIX;
    }
  }

  function setMode(mode) {
    if (!ctx) { S.mode = mode; return; }
    const t = ctx.currentTime; S.mode = mode;
    const inside = mode === 'contact';
    S.horizon.frequency.cancelScheduledValues(t);
    S.horizon.frequency.setTargetAtTime(inside ? 700 : 16000, t, inside ? 0.6 : 0.5);
    S.detune.offset.cancelScheduledValues(t);
    S.detune.offset.setTargetAtTime(inside ? -500 : 0, t, 0.8);
    S.padGain.gain.setTargetAtTime(inside ? 0.2 : mode === 'home' ? 0.16 : 0.14, t, 0.6);
  }

  // Per-project stingers, timed to the 1.5 s reveal effects.
  const STINGERS = {
    mutagen(t) {
      for (let i = 0; i < 12; i++) bell(300 + Math.random() * 1200, t + 0.5 * Math.pow(i / 12, 0.7), { type: 'triangle', dur: 0.12, vol: 0.02, wetAmt: 0 });
      thump(t + 0.6, { from: 80, to: 28, vol: 0.26, dur: 0.4 });
      chord([0, 2, 4], t + 1.0, { dur: 2.2, vol: 0.035 });
    },
    vigil(t) {
      bell(1180, t, { dur: 2.6, vol: 0.05, wetAmt: 1.6 });
      [0.4, 0.68, 0.9, 1.1].forEach((d, i) => bell(note(4 + i, 3), t + d, { dur: 0.3, vol: 0.028, type: 'triangle' }));
      chord([0, 4], t + 1.2, { dur: 2, vol: 0.03 });
    },
    signalhub(t) {
      for (let i = 0; i < 16; i++) tick(t + 0.6 * Math.pow(i / 16, 0.6), { freq: 1400 + i * 110, vol: 0.02, dur: 0.02 });
      [0, 2, 4, 6].forEach((d, i) => bell(note(d, 2), t + 0.6 + i * 0.1, { dur: 2, vol: 0.03 }));
    },
    'proving-grounds'(t) {
      for (let i = 0; i < 12; i++) tick(t + 0.85 * Math.pow(i / 12, 0.75), { freq: 2600, vol: 0.022, dur: 0.018 });
      thump(t + 0.88, { from: 150, to: 55, vol: 0.22, dur: 0.25 });
      // Flag fanfare: a rising figure landing on a bright D major.
      [[0, 0.95], [4, 1.07], [7, 1.19]].forEach(([d, at]) => bell(note(d, 2), t + at, { dur: 0.5, vol: 0.045, type: 'triangle' }));
      [D * 4, D * 4 * 1.26, D * 4 * 1.5].forEach((f, i) => bell(f, t + 1.4 + i * 0.02, { dur: 2.4, vol: 0.038 }));
    },
    jarvis(t) {
      sweepTone(t, { from: 110, to: 440, dur: 0.55, vol: 0.05, type: 'sawtooth' });
      for (let i = 0; i < 5; i++) tick(t + 0.5 + i * 0.08, { freq: 1800 + i * 300, vol: 0.016, dur: 0.02 });
      [0, 3, 5].forEach((d, i) => bell(note(d, 2), t + 0.75 + i * 0.04, { dur: 2.4, vol: 0.032, type: 'triangle' }));
    },
    homelab(t) {
      [0.1, 0.32, 0.54, 0.76].forEach((d) => tick(t + d, { freq: 1500, vol: 0.024, dur: 0.025 }));
      [0, 4].forEach((d, i) => bell(note(d, 2), t + 0.85 + i * 0.05, { dur: 2, vol: 0.03 }));
    },
    who(t, bits) {
      const b = bits || [];
      for (let i = 0; i < 16; i++) if (b[i]) bell(note(i % 8, 2 + (i >= 8 ? 1 : 0)), t + i * 0.07, { dur: 1.3, vol: 0.028 });
      chord([0, 2, 4], t + 1.1, { dur: 2.4, vol: 0.03 });
    },
  };

  function set(v) {
    if (v && !ctx && !boot()) return;
    on = v;
    if (ctx) {
      if (on) { ctx.resume(); S.beatTime = Math.max(S.beatTime, ctx.currentTime + 0.1); }
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(on ? 0.6 : 0, ctx.currentTime, 0.5);
      if (on) setMode(S.mode);
    }
    button.setAttribute('aria-pressed', String(on));
    button.querySelector('.sound__state').textContent = on ? 'on' : 'off';
    save(on);
  }

  button.hidden = false;
  button.addEventListener('click', () => set(!on));
  if (read()) addEventListener('pointerdown', () => { if (!on) set(true); }, { once: true });

  const alive = () => on && ctx;
  return {
    get on() { return on; },
    setMode,
    tick() { if (alive()) tick(ctx.currentTime, { freq: 1700, vol: 0.022, dur: 0.025 }); },
    cascade() { if (alive()) { const t = ctx.currentTime; for (let i = 0; i < 6; i++) if (Math.random() < 0.6) bell(note(i, 3), t + i * 0.03, { dur: 0.4, vol: 0.018, type: 'triangle', wetAmt: 0.5 }); } },
    stinger(id, bits) { if (alive()) STINGERS[id]?.(ctx.currentTime + 0.05, bits); },
    sinkhole() { if (alive()) { const t = ctx.currentTime; sweepTone(t, { from: 600, to: 70, dur: 0.8, vol: 0.055 }); thump(t + 0.5, { from: 64, to: 26, vol: 0.34, dur: 0.9 }); } },
    horizon() { if (alive()) { const t = ctx.currentTime; sweepTone(t, { from: 1200, to: 55, dur: 1.3, vol: 0.06 }); thump(t + 0.2, { from: 52, to: 20, vol: 0.42, dur: 2.0 }); } },
  };
}
