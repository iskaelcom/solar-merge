/**
 * SoundManager – Web Audio API implementation (web only).
 * Metro bundler picks SoundManager.native.ts for iOS/Android,
 * and this file for web.
 *
 * Sounds are synthesized on the fly — no file loading needed.
 */

type SoundKey = 'drop' | 'merge' | 'star' | 'blackhole' | 'virus' | 'gameover';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext();
    return ctx;
  } catch {
    return null;
  }
}

// Resume context if suspended (browser autoplay policy)
function resumeCtx(c: AudioContext) {
  if (c.state === 'suspended') c.resume();
}

// ── Synthesizers ──────────────────────────────────────────────────────────────

function synthDrop(c: AudioContext) {
  const now = c.currentTime;

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);

  // Descending chirp: 520 Hz → 280 Hz over 180ms
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(280, now + 0.18);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.55, now + 0.005); // fast attack
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc.start(now);
  osc.stop(now + 0.19);
}

function synthMerge(c: AudioContext) {
  const now = c.currentTime;

  // Fundamental: glide 660→880 Hz in first 80ms, then hold
  const osc1 = c.createOscillator();
  const gain1 = c.createGain();
  osc1.connect(gain1);
  gain1.connect(c.destination);
  osc1.frequency.setValueAtTime(660, now);
  osc1.frequency.exponentialRampToValueAtTime(880, now + 0.08);
  gain1.gain.setValueAtTime(0.5, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
  osc1.start(now);
  osc1.stop(now + 0.33);

  // Octave harmonic at 1760 Hz
  const osc2 = c.createOscillator();
  const gain2 = c.createGain();
  osc2.connect(gain2);
  gain2.connect(c.destination);
  osc2.frequency.setValueAtTime(1760, now);
  gain2.gain.setValueAtTime(0.18, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  osc2.start(now);
  osc2.stop(now + 0.23);
}

// ── Star: bright sparkling arpeggio C5→E5→G5→C6 (280ms) ─────────────────────

function synthStar(c: AudioContext) {
  const notes = [523, 659, 784, 1047];
  const noteDur = 0.28 / notes.length;
  const now = c.currentTime;

  notes.forEach((freq, idx) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);

    const start = now + idx * noteDur;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.45, start + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, start + noteDur);

    // Add octave harmonic
    const osc2 = c.createOscillator();
    const gain2 = c.createGain();
    osc2.connect(gain2);
    gain2.connect(c.destination);
    osc2.frequency.setValueAtTime(freq * 2, start);
    gain2.gain.setValueAtTime(0.2, start);
    gain2.gain.exponentialRampToValueAtTime(0.001, start + noteDur * 0.8);
    osc2.start(start);
    osc2.stop(start + noteDur);

    osc.start(start);
    osc.stop(start + noteDur);
  });
}

// ── Black hole: deep ominous descending rumble (450ms) ───────────────────────

function synthBlackhole(c: AudioContext) {
  const now = c.currentTime;
  const dur = 0.45;

  // Main descending oscillator
  const osc1 = c.createOscillator();
  const gain1 = c.createGain();
  osc1.connect(gain1);
  gain1.connect(c.destination);
  osc1.frequency.setValueAtTime(110, now);
  osc1.frequency.exponentialRampToValueAtTime(45, now + dur);
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(0.5, now + 0.06);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + dur);
  osc1.start(now);
  osc1.stop(now + dur + 0.01);

  // Detuned second oscillator for width
  const osc2 = c.createOscillator();
  const gain2 = c.createGain();
  osc2.connect(gain2);
  gain2.connect(c.destination);
  osc2.frequency.setValueAtTime(112, now);
  osc2.frequency.exponentialRampToValueAtTime(46, now + dur);
  gain2.gain.setValueAtTime(0, now);
  gain2.gain.linearRampToValueAtTime(0.35, now + 0.06);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + dur);
  osc2.start(now);
  osc2.stop(now + dur + 0.01);

  // Sub-octave
  const osc3 = c.createOscillator();
  const gain3 = c.createGain();
  osc3.connect(gain3);
  gain3.connect(c.destination);
  osc3.frequency.setValueAtTime(55, now);
  osc3.frequency.exponentialRampToValueAtTime(22, now + dur);
  gain3.gain.setValueAtTime(0, now);
  gain3.gain.linearRampToValueAtTime(0.25, now + 0.08);
  gain3.gain.exponentialRampToValueAtTime(0.001, now + dur);
  osc3.start(now);
  osc3.stop(now + dur + 0.01);
}

// ── Virus: eerie glitchy warble (220ms) ──────────────────────────────────────

function synthVirus(c: AudioContext) {
  const now = c.currentTime;
  const dur = 0.22;
  const lfoRate = 28;

  // Use OscillatorNode for LFO via frequency modulation
  const carrier = c.createOscillator();
  const modulator = c.createOscillator();
  const modGain = c.createGain();
  const outGain = c.createGain();

  modulator.frequency.setValueAtTime(lfoRate, now);
  modGain.gain.setValueAtTime(80, now); // modulation depth in Hz

  modulator.connect(modGain);
  modGain.connect(carrier.frequency);
  carrier.frequency.setValueAtTime(500, now);
  carrier.connect(outGain);
  outGain.connect(c.destination);

  outGain.gain.setValueAtTime(0, now);
  outGain.gain.linearRampToValueAtTime(0.55, now + 0.006);
  outGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

  // Second detuned oscillator (minor 2nd) for dissonance
  const osc2 = c.createOscillator();
  const gain2 = c.createGain();
  osc2.connect(gain2);
  gain2.connect(c.destination);
  osc2.frequency.setValueAtTime(530, now); // ~minor 2nd above 500
  gain2.gain.setValueAtTime(0, now);
  gain2.gain.linearRampToValueAtTime(0.3, now + 0.006);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.9);
  osc2.start(now);
  osc2.stop(now + dur);

  modulator.start(now);
  modulator.stop(now + dur);
  carrier.start(now);
  carrier.stop(now + dur);
}

// ── Public API ────────────────────────────────────────────────────────────────

export function initSounds(): Promise<void> {
  // Eagerly create the AudioContext (may be suspended until user gesture)
  getCtx();
  return Promise.resolve();
}

export function playSound(key: SoundKey): Promise<void> {
  const c = getCtx();
  if (!c) return Promise.resolve();
  resumeCtx(c);

  if (key === 'drop')      synthDrop(c);
  else if (key === 'merge')      synthMerge(c);
  else if (key === 'star')      synthStar(c);
  else if (key === 'blackhole') synthBlackhole(c);
  else if (key === 'virus')     synthVirus(c);

  return Promise.resolve();
}
