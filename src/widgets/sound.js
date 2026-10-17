// The site's sound, generated live with WebAudio — no audio files, nothing
// sampled or borrowed; every motif here is original.
//
// Score — "Event Horizon": a sub-bass well (two detuned saws under a slow
// lowpass sweep, plus a sine an octave below), accretion hiss (filtered noise
// that swells and ebbs), a pulsar (a dry periodic click, like a radio
// telescope picking one up), and a sparse arpeggio in D phrygian drifting
// through a long synthetic reverb. The mix follows where you are: home is
// wide and calm, work adds motion, and across the event horizon (contact)
// everything is time-dilated — pitched down, slowed, low-passed.
//
// Stingers: each project's opening effect gets its own cue (fuzz → crash →
// patched chord; a sonar ping and threat blips; packets converging into a
// chord; a brute-force ticker, a lock clunk and an original flag fanfare; the
// SHA-256 sigil played as notes), plus a sinkhole whoosh when a card falls in
// and a drop when you cross the horizon.
//
// Off by default; needs a click to start (autoplay policy); remembered per
// browser. Under reduced motion it still plays, but the score stays calm.
const KEY = 'aa-sound';
const D = 73.42; // D2
const PHRYGIAN = [0, 1, 3, 5, 7, 8, 10];
const note = (deg, oct = 0) => D * 2 ** ((PHRYGIAN[((deg % 7) + 7) % 7] + 12 * (oct + Math.floor(deg / 7))) / 12);

export function createSound(button, { reduced = () => false } = {}) {
  let ctx = null, master = null, wet = null, bus = null, on = false;
  const S = {}; // score nodes
  const read = () => { try { return localStorage.getItem(KEY) === 'on'; } catch { return false; } };
  const save = (v) => { try { localStorage.setItem(KEY, v ? 'on' : 'off'); } catch { /* private mode */ } };

  // A long, dark synthetic reverb: decaying stereo noise as an impulse response.
  function reverb(seconds = 5.5) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    const c = ctx.createConvolver();
    c.buffer = ir;
    return c;
  }
  function noiseBuffer(seconds = 2) {
    const b = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  function boot() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 3;
    master.connect(comp).connect(ctx.destination);
    // bus: everything passes a "horizon" lowpass, so crossing it dulls the world.
    S.horizon = ctx.createBiquadFilter(); S.horizon.type = 'lowpass'; S.horizon.frequency.value = 18000;
    S.horizon.connect(master);
    bus = ctx.createGain(); bus.connect(S.horizon);
    wet = ctx.createGain(); wet.gain.value = 0.55;
    const verb = reverb(); wet.connect(verb).connect(S.horizon);
    S.noise = noiseBuffer(2);

    // The well: sub sine + two detuned saws through a slowly sweeping lowpass.
    S.detune = ctx.createConstantSource(); S.detune.offset.value = 0; S.detune.start();
    const well = ctx.createBiquadFilter(); well.type = 'lowpass'; well.frequency.value = 260; well.Q.value = 7;
    const sweep = ctx.createOscillator(), sweepAmt = ctx.createGain();
    sweep.frequency.value = 0.035; sweepAmt.gain.value = 180;
    sweep.connect(sweepAmt).connect(well.frequency); sweep.start();
    S.wellGain = ctx.createGain(); S.wellGain.gain.value = 0.32;
    well.connect(S.wellGain).connect(bus);
    for (const [f, type, g, det] of [[D / 2, 'sine', 0.55, 0], [D, 'sawtooth', 0.09, -7], [D, 'sawtooth', 0.09, 7], [D * 1.5, 'triangle', 0.04, 3]]) {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = type; o.frequency.value = f; o.detune.value = det; og.gain.value = g;
      S.detune.connect(o.detune);
      o.connect(og).connect(type === 'sine' ? S.wellGain : well); o.start();
    }
    // Accretion hiss: bandpassed noise, its level breathing very slowly.
    const hiss = ctx.createBufferSource(); hiss.buffer = S.noise; hiss.loop = true;
    const hissF = ctx.createBiquadFilter(); hissF.type = 'bandpass'; hissF.frequency.value = 1400; hissF.Q.value = 0.6;
    S.hissGain = ctx.createGain(); S.hissGain.gain.value = 0.018;
    const breathe = ctx.createOscillator(), breatheAmt = ctx.createGain();
    breathe.frequency.value = 0.07; breatheAmt.gain.value = 0.012;
    breathe.connect(breatheAmt).connect(S.hissGain.gain); breathe.start();
    hiss.connect(hissF).connect(S.hissGain).connect(bus); hissF.connect(wet); hiss.start();

    S.mode = 'home';
    S.next = ctx.currentTime + 0.5; S.pulse = ctx.currentTime + 1; S.step = 0;
    S.timer = setInterval(schedule, 120);
    return true;
  }

  // A soft voice: sine + octave triangle, a pluck envelope, into dry + reverb.
  function voice(freq, at, { dur = 1.6, vol = 0.05, type = 'sine', wetAmt = 1, glideTo = 0 } = {}) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, at);
    o2.type = 'triangle'; o2.frequency.setValueAtTime(freq * 2, at);
    if (glideTo) { o.frequency.exponentialRampToValueAtTime(glideTo, at + dur); o2.frequency.exponentialRampToValueAtTime(glideTo * 2, at + dur); }
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    o.connect(g); o2.connect(g2).connect(g);
    g.connect(bus);
    if (wetAmt) { const w = ctx.createGain(); w.gain.value = wetAmt; g.connect(w).connect(wet); }
    o.start(at); o2.start(at); o.stop(at + dur + 0.05); o2.stop(at + dur + 0.05);
  }
  function click(at, { freq = 2400, vol = 0.04, dur = 0.03, q = 8 } = {}) {
    const src = ctx.createBufferSource(); src.buffer = S.noise;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f).connect(g).connect(bus);
    src.start(at, Math.random()); src.stop(at + dur + 0.02);
  }
  function thump(at, { from = 120, to = 38, vol = 0.35, dur = 0.7 } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(from, at); o.frequency.exponentialRampToValueAtTime(to, at + dur * 0.8);
    g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(bus); o.start(at); o.stop(at + dur + 0.05);
  }
  function whoosh(at, { from = 3000, to = 120, dur = 0.9, vol = 0.05 } = {}) {
    const src = ctx.createBufferSource(); src.buffer = S.noise;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 3;
    f.frequency.setValueAtTime(from, at); f.frequency.exponentialRampToValueAtTime(to, at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f).connect(g).connect(bus); f.connect(wet);
    src.start(at); src.stop(at + dur + 0.05);
  }
  const chord = (degs, at, opts) => degs.forEach((d, i) => voice(note(d, 2), at + i * 0.02, opts));

  // The score's scheduler: a sparse phrygian arpeggio and a pulsar click,
  // looked ahead a little so timing doesn't depend on timers.
  function schedule() {
    if (!on || !ctx) return;
    const ahead = ctx.currentTime + 0.4;
    const inside = S.mode === 'contact';
    const busy = S.mode === 'work' || S.mode === 'detail';
    const calm = reduced();
    while (S.next < ahead) {
      const pattern = [0, 4, 2, 6, 1, 4, 3, 7];
      const deg = pattern[S.step % pattern.length] + (S.step % 16 >= 8 ? 2 : 0);
      if (Math.random() < (busy ? 0.85 : 0.55)) voice(note(deg, 2) * (inside ? 0.5 : 1), S.next, { dur: inside ? 4 : 2.6, vol: 0.022 });
      if (S.step % 8 === 0) voice(note(0, 1) * (inside ? 0.5 : 1), S.next, { dur: 5, vol: 0.018 });
      S.step++;
      S.next += (inside ? 1.4 : busy && !calm ? 0.45 : 0.75) * (Math.random() < 0.15 ? 2 : 1);
    }
    // The pulsar: steady, about 1.3 Hz, slower across the horizon.
    while (S.pulse < ahead) {
      click(S.pulse, { freq: 3200, vol: inside ? 0.012 : 0.02, dur: 0.02, q: 14 });
      S.pulse += inside ? 1.9 : 0.77;
    }
  }

  // Where you are shapes the mix; crossing the horizon time-dilates it.
  function setMode(mode) {
    if (!ctx) { S.mode = mode; return; }
    const t = ctx.currentTime;
    S.mode = mode;
    const inside = mode === 'contact';
    S.horizon.frequency.cancelScheduledValues(t);
    S.horizon.frequency.setTargetAtTime(inside ? 900 : 18000, t, inside ? 0.6 : 0.4);
    S.detune.offset.cancelScheduledValues(t);
    S.detune.offset.setTargetAtTime(inside ? -500 : 0, t, 0.8);
    S.wellGain.gain.setTargetAtTime(inside ? 0.45 : mode === 'home' ? 0.32 : 0.26, t, 0.6);
    S.hissGain.gain.setTargetAtTime(mode === 'work' || mode === 'detail' ? 0.028 : 0.018, t, 0.6);
  }

  // Per-project stingers, timed to the 1.5 s reveal effects (widgets/reveal.js).
  const STINGERS = {
    mutagen(t) {
      // Fuzzing: random square blips accelerating, a crash, then patched.
      for (let i = 0; i < 18; i++) {
        const at = t + 0.55 * Math.pow(i / 18, 0.7);
        voice(200 + Math.random() * 1600, at, { type: 'square', dur: 0.06, vol: 0.02, wetAmt: 0 });
      }
      whoosh(t + 0.55, { from: 5000, to: 400, dur: 0.35, vol: 0.06 });
      thump(t + 0.6, { from: 90, to: 30, vol: 0.3, dur: 0.4 });
      chord([0, 2, 4], t + 1.0, { dur: 2.2, vol: 0.035 });
    },
    vigil(t) {
      // Sonar: a ping that rings into the reverb, then threat blips.
      voice(1180, t, { dur: 2.4, vol: 0.06, wetAmt: 1.4 });
      voice(1180, t + 0.6, { dur: 1.8, vol: 0.025, wetAmt: 1.4 });
      [0.35, 0.62, 0.8, 1.05].forEach((d, i) => voice(note(4 + i, 3), t + d, { dur: 0.25, vol: 0.03, type: 'triangle' }));
      chord([0, 4], t + 1.2, { dur: 2, vol: 0.03 });
    },
    signalhub(t) {
      // Packets streaming in, tightening into a chord.
      for (let i = 0; i < 24; i++) click(t + 0.6 * Math.pow(i / 24, 0.6), { freq: 1500 + i * 120, vol: 0.025, dur: 0.025 });
      [0, 2, 4, 6].forEach((d, i) => voice(note(d, 2), t + 0.6 + i * 0.09, { dur: 2, vol: 0.03 }));
    },
    'proving-grounds'(t) {
      // Brute force: an accelerating ticker, the lock clunks open, and an
      // original flag fanfare — a rising phrygian figure landing on a bright major.
      for (let i = 0; i < 14; i++) click(t + 0.85 * Math.pow(i / 14, 0.75), { freq: 2600, vol: 0.03, dur: 0.02 });
      thump(t + 0.88, { from: 160, to: 60, vol: 0.25, dur: 0.25 });
      click(t + 0.88, { freq: 600, vol: 0.08, dur: 0.12, q: 2 });
      const fan = [[0, 0.95], [4, 1.07], [7, 1.19], [9, 1.31]];
      fan.forEach(([d, at]) => voice(note(d, 2), t + at, { dur: 0.5, vol: 0.05, type: 'triangle' }));
      // The landing: D major (F# not in phrygian — the "won" colour).
      [D * 4, D * 4 * 1.26, D * 4 * 1.5, D * 8].forEach((f, i) => voice(f, t + 1.45 + i * 0.015, { dur: 2.6, vol: 0.04 }));
    },
    jarvis(t) {
      // Boot-up: a rising power-on sweep, then a settled AI chord.
      voice(110, t, { dur: 0.6, vol: 0.05, type: 'sawtooth', glideTo: 440, wetAmt: 0.5 });
      for (let i = 0; i < 6; i++) click(t + 0.45 + i * 0.08, { freq: 2000 + i * 400, vol: 0.02, dur: 0.02 });
      [0, 3, 5].forEach((d, i) => voice(note(d, 2), t + 0.7 + i * 0.04, { dur: 2.4, vol: 0.035, type: 'triangle' }));
    },
    homelab(t) {
      // Wiring up: a few link clicks, then a soft online chord.
      [0.1, 0.3, 0.5, 0.7].forEach((d) => click(t + d, { freq: 1600, vol: 0.03, dur: 0.03 }));
      [0, 4].forEach((d, i) => voice(note(d, 2), t + 0.8 + i * 0.05, { dur: 2, vol: 0.03 }));
    },
    who(t, bits) {
      // The identity sigil, played: the first 16 bits of sha256("Researcher")
      // walk up the scale — a 1 sounds a note, a 0 rests.
      const b = bits || [];
      for (let i = 0; i < 16; i++) if (b[i]) voice(note(i % 8, 2 + (i >= 8 ? 1 : 0)), t + i * 0.06, { dur: 1.2, vol: 0.03 });
      chord([0, 2, 4], t + 1.0, { dur: 2.4, vol: 0.03 });
    },
  };

  function set(v) {
    if (v && !ctx && !boot()) return;
    on = v;
    if (ctx) {
      if (on) { ctx.resume(); S.next = Math.max(S.next, ctx.currentTime + 0.1); S.pulse = Math.max(S.pulse, ctx.currentTime + 0.2); }
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(on ? 0.7 : 0, ctx.currentTime, 0.5);
      if (on) setMode(S.mode);
    }
    button.setAttribute('aria-pressed', String(on));
    button.querySelector('.sound__state').textContent = on ? 'on' : 'off';
    save(on);
  }

  button.hidden = false;
  button.addEventListener('click', () => set(!on));
  // Remembered "on" still waits for a gesture (autoplay policy).
  if (read()) addEventListener('pointerdown', () => { if (!on) set(true); }, { once: true });

  const live = () => on && ctx;
  return {
    get on() { return on; },
    setMode,
    tick() { if (live()) click(ctx.currentTime, { freq: 1800, vol: 0.03, dur: 0.03 }); },
    cascade() {
      if (!live()) return;
      const t = ctx.currentTime;
      for (let i = 0; i < 10; i++) if (Math.random() < 0.6) voice(note(i, 3), t + i * 0.028, { dur: 0.3, vol: 0.02, type: 'square', wetAmt: 0.4 });
    },
    stinger(id, bits) { if (live()) STINGERS[id]?.(ctx.currentTime + 0.05, bits); },
    sinkhole() { if (live()) { const t = ctx.currentTime; whoosh(t, { from: 2600, to: 90, dur: 0.8, vol: 0.06 }); thump(t + 0.55, { from: 70, to: 28, vol: 0.4, dur: 0.9 }); } },
    horizon() { if (live()) { const t = ctx.currentTime; whoosh(t, { from: 6000, to: 60, dur: 1.4, vol: 0.07 }); thump(t + 0.2, { from: 55, to: 22, vol: 0.5, dur: 2.2 }); } },
  };
}
