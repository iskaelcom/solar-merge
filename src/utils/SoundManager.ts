/**
 * SoundManager – Web Audio API implementation (web only).
 * Metro bundler picks SoundManager.native.ts for iOS/Android,
 * and this file for web.
 *
 * Sounds are synthesized on the fly — no file loading needed.
 */

type SoundKey = 'drop' | 'merge';

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

  if (key === 'drop') synthDrop(c);
  else if (key === 'merge') synthMerge(c);

  return Promise.resolve();
}
