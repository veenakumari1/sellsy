/**
 * storsySound.js — cinematic "wow" intro score for StorsyIntro
 * Drop-in replacement for the inline createSound() (same API).
 *
 * Feel: warm pad swell + rising air → deep sub "drop" exactly when the logo
 * slides away → glassy bell chord → soft sparkles while the ribbon flies →
 * resolving chord at the finale. No chiptune/arcade/club sounds.
 *
 * Usage in StorsyIntro.jsx:
 *   import { createSound, NOOP } from './storsySound';
 *   const sound = createSound(setSnd, logoTime, duration) || NOOP;
 *   (delete the old SCALE / NOOP / createSound block from the component)
 *
 * Autoplay: the score starts the moment the AudioContext is allowed to run
 * (instantly if the visitor already interacted with your site, e.g. came via a
 * redirect/click; otherwise on the first touch/click/key/scroll). If audio
 * unlocks late, the score joins at the correct point of the timeline.
 */

const SCALE = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99]; // D major pentatonic

export const NOOP = {
  resume() {}, tick() {}, toggle() {}, pluck() {}, swash() {}, bell() {},
  slide() {}, riser() {}, pass() {}, land() {}, finale() {}, dispose() {},
};

export function createSound(onUi, logoTime = 3, duration = 4.5) {
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return null;

  let muted = false;
  try { muted = (localStorage.getItem('storsySoundMuted') ?? localStorage.getItem('sellsySoundMuted')) === '1'; } catch (e) {}

  const ctx = new AC();

  /* ---------- master chain ---------- */
  const master = ctx.createGain();
  master.gain.value = 0;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.2;
  master.connect(comp); comp.connect(ctx.destination);

  // lush stereo reverb (generated impulse response)
  const rv = ctx.createConvolver();
  {
    const L = Math.floor(ctx.sampleRate * 2.8);
    const ir = ctx.createBuffer(2, L, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < L; i++) {
        const n = Math.random() * 2 - 1;
        lp += (n - lp) * 0.35; // soften the tail
        d[i] = lp * Math.pow(1 - i / L, 2.6);
      }
    }
    rv.buffer = ir;
  }
  const wet = ctx.createGain(); wet.gain.value = 0.38; rv.connect(wet); wet.connect(master);
  const bus = ctx.createGain(); bus.connect(master); bus.connect(rv);   // dry + reverb
  const dry = ctx.createGain(); dry.connect(master);                    // dry only (sub / thud)

  const nL = ctx.sampleRate * 4;
  const noise = ctx.createBuffer(1, nL, ctx.sampleRate);
  { const d = noise.getChannelData(0); for (let i = 0; i < nL; i++) d[i] = Math.random() * 2 - 1; }

  const running = () => ctx.state === 'running';
  const ui = () => onUi && onUi(muted ? 'off' : 'on');
  const applyVol = () => master.gain.setTargetAtTime(muted ? 0 : 0.95, ctx.currentTime, 0.08);
  ctx.onstatechange = () => { applyVol(); ui(); };
  applyVol(); ui();

  /* ---------- building blocks ---------- */
  // glassy bell: fundamental + inharmonic partials, long reverb tail
  function glass(freq, t, dur = 1.4, v = 0.1) {
    [[1, 1, 1], [2.76, 0.32, 0.55], [5.4, 0.12, 0.3]].forEach(([m, a, k]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq * m;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(v * a, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur * k);
      o.connect(g); g.connect(bus);
      o.start(t); o.stop(t + dur * k + 0.05);
    });
  }

  // filtered noise sweep (air / whoosh)
  function air(t, dur, f0, f1, v, q = 1.1, type = 'bandpass') {
    const src = ctx.createBufferSource(); src.buffer = noise;
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + dur * 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(bus);
    src.start(t, Math.random() * 2, dur + 0.1);
  }

  // deep sub boom + soft body thump
  function boom(t, v = 0.55) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(105, t);
    o.frequency.exponentialRampToValueAtTime(34, t + 1.1);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    o.connect(g); g.connect(dry); o.start(t); o.stop(t + 1.7);

    const o2 = ctx.createOscillator(), g2 = ctx.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(170, t);
    o2.frequency.exponentialRampToValueAtTime(58, t + 0.22);
    g2.gain.setValueAtTime(v * 0.9, t);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o2.connect(g2); g2.connect(dry); o2.start(t); o2.stop(t + 0.35);
  }

  // soft detuned pad voice with slow swell
  function padVoice(freq, tStart, tPeak, tEnd, v, cutA, cutB) {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.7;
    lp.frequency.setValueAtTime(cutA, tStart);
    lp.frequency.exponentialRampToValueAtTime(cutB, Math.max(tStart + 0.1, tPeak));
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, tStart);
    g.gain.linearRampToValueAtTime(v, Math.max(tStart + 0.1, tPeak));
    g.gain.setValueAtTime(v, Math.max(tStart + 0.1, tPeak));
    g.gain.exponentialRampToValueAtTime(0.0001, tEnd);
    lp.connect(g); g.connect(bus);
    [-7, 7].forEach((d, i) => {
      const o = ctx.createOscillator();
      o.type = i ? 'triangle' : 'sine';
      o.frequency.value = freq; o.detune.value = d;
      o.connect(lp); o.start(tStart); o.stop(tEnd + 0.1);
    });
  }

  /* ---------- the score (scheduled once, aligned to the visual clock) ---------- */
  let scheduled = false;
  function schedule(clock) {
    const base = ctx.currentTime - clock;      // audio time of clock = 0
    const T = (x) => base + x;
    const now = ctx.currentTime + 0.03;
    const total = logoTime + duration;

    // 1) warm pad bed: swells through the logo, blooms at the drop, fades after the ribbon
    const bedStart = Math.max(now, T(0));
    const bedPeak = Math.max(bedStart + 0.2, T(logoTime));
    const bedEnd = T(total + 1.2);
    if (bedEnd > now) {
      [73.42, 110.0, 146.83, 185.0, 220.0].forEach((f) => padVoice(f, bedStart, bedPeak, bedEnd, 0.05, 220, 2200));
      // brighter layer that opens at the drop
      const bl = Math.max(now, T(logoTime - 0.05));
      [329.63, 440.0, 554.37, 739.99].forEach((f) => padVoice(f, bl, bl + 0.6, bedEnd, 0.022, 600, 4800));
    }

    // 2) riser: air + faint pitch glide into the drop
    const r0 = Math.max(now, T(Math.max(0, logoTime - 2.2)));
    const r1 = T(logoTime);
    if (r1 - r0 > 0.35) {
      air(r0, r1 - r0, 400, 9500, 0.085, 1.2);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(220, r0); o.frequency.exponentialRampToValueAtTime(1040, r1);
      g.gain.setValueAtTime(0.0001, r0);
      g.gain.linearRampToValueAtTime(0.03, r1 - 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, r1 + 0.05);
      o.connect(g); g.connect(bus); o.start(r0); o.stop(r1 + 0.1);
    }

    // 3) THE DROP — exactly when the logo slides away
    if (T(logoTime) >= ctx.currentTime - 0.02) {
      const d = Math.max(T(logoTime), now);
      boom(d, 0.6);
      air(d, 1.4, 12000, 2500, 0.05, 0.6, 'highpass');                   // airy burst
      [587.33, 739.99, 880.0, 1318.51].forEach((f, i) => glass(f, d + i * 0.045, 2.2, 0.085)); // D major add9 shimmer
      glass(1174.66, d + 0.35, 2.4, 0.05);
    }

    // 4) gentle ascending sparkles while the dashboard ribbon flies
    const spark = [587.33, 659.25, 739.99, 880.0, 987.77, 1174.66, 1318.51, 1479.98];
    spark.forEach((f, i) => {
      const t = T(logoTime + 0.45 + i * (duration * 0.78 / spark.length));
      if (t >= now) glass(f, t, 1.5, 0.05 + i * 0.004);
    });
  }

  /* ---------- public API (same as before) ---------- */
  return {
    resume() { if (ctx.state !== 'running') ctx.resume().catch(() => {}); },

    tick(pp, clock) {
      if (!scheduled && running()) {
        scheduled = true;
        schedule(clock || 0);
      }
    },

    toggle() {
      if (ctx.state !== 'running') { muted = false; ctx.resume().catch(() => {}); }
      else muted = !muted;
      try { localStorage.setItem('storsySoundMuted', muted ? '1' : '0'); } catch (e) {}
      applyVol(); ui();
    },

    // letters of the wordmark: soft glass notes
    pluck(i) {
      if (!running()) return;
      glass(SCALE[i % SCALE.length] * 2, ctx.currentTime, 1.1, 0.075);
    },

    // burgundy swash drawing: silky shimmer
    swash() { if (running()) air(ctx.currentTime, 0.9, 3000, 11000, 0.035, 1.4); },

    // calm bell as the tagline appears
    bell() {
      if (!running()) return;
      const t = ctx.currentTime;
      glass(1174.66, t, 1.8, 0.06);
      glass(1760.0, t + 0.05, 1.6, 0.04);
    },

    // logo slides away (the big drop is scheduled in tick; this is just the swoosh)
    slide() { if (running()) air(ctx.currentTime, 0.55, 2400, 380, 0.07, 1.0); },

    riser() {},

    pass() { if (running()) air(ctx.currentTime, 1.0, 700, 6500, 0.06, 1.0); },

    land(i) {
      if (!running()) return;
      glass([587.33, 659.25, 739.99, 880, 987.77, 1174.66][i % 6], ctx.currentTime, 0.9, 0.06);
    },

    // curtain lifts: resolving chord + soft thump
    finale() {
      if (!running()) return;
      const t = ctx.currentTime;
      [587.33, 739.99, 880.0, 1174.66, 1479.98].forEach((f, i) => glass(f, t + i * 0.05, 2.4, 0.075));
      boom(t, 0.42);
      air(t, 0.9, 5000, 800, 0.04, 0.8);
    },

    dispose() {
      try {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
      } catch (e) {}
      setTimeout(() => { try { ctx.close(); } catch (e) {} }, 1200);
    },
  };
}