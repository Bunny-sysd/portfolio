// Generative sound, no audio files: a low two-oscillator drone under a slow
// filter sweep, a soft tick per carousel step, and a run of bit-blips for each
// avalanche transition. Off by default (and it needs a click to start anyway);
// the choice is remembered per browser.
const KEY = 'aa-sound';
const SCALE = [220, 246.94, 293.66, 329.63, 392, 440, 493.88, 587.33];

export function createSound(button) {
  let ctx = null, master = null, on = false;
  const read = () => { try { return localStorage.getItem(KEY) === 'on'; } catch { return false; } };
  const save = (v) => { try { localStorage.setItem(KEY, v ? 'on' : 'off'); } catch { /* private mode */ } };

  function boot() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 420; filter.Q.value = 6;
    filter.connect(master);
    const lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
    lfo.frequency.value = 0.05; lfoGain.gain.value = 260;
    lfo.connect(lfoGain).connect(filter.frequency); lfo.start();
    for (const [f, type, g] of [[55, 'sawtooth', 0.05], [82.6, 'sine', 0.08], [110.3, 'triangle', 0.03]]) {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = type; o.frequency.value = f; og.gain.value = g;
      o.connect(og).connect(filter); o.start();
    }
    return true;
  }

  function blip(freq, at, dur = 0.05, vol = 0.05, type = 'square') {
    if (!on || !ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(master);
    o.start(at); o.stop(at + dur + 0.02);
  }

  function set(v) {
    if (v && !ctx && !boot()) return;
    on = v;
    if (ctx) {
      if (on) ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(on ? 0.6 : 0, ctx.currentTime, 0.4);
    }
    button.setAttribute('aria-pressed', String(on));
    button.querySelector('.sound__state').textContent = on ? 'on' : 'off';
    save(on);
  }

  button.hidden = false;
  button.addEventListener('click', () => set(!on));
  // Remembered "on" still waits for a gesture (autoplay policy): arm it on
  // the first click anywhere.
  if (read()) addEventListener('pointerdown', () => { if (!on) set(true); }, { once: true });

  return {
    tick() { if (on) blip(SCALE[(Math.random() * 3) | 0] * 2, ctx.currentTime, 0.04, 0.03, 'sine'); },
    cascade() {
      if (!on) return;
      const t = ctx.currentTime;
      for (let i = 0; i < 10; i++) if (Math.random() < 0.6) blip(SCALE[(Math.random() * SCALE.length) | 0] * (i % 2 ? 2 : 1), t + i * 0.028, 0.06, 0.035);
    },
  };
}
