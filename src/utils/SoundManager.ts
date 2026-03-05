/**
 * SoundManager – Web Audio API implementation (web only).
 * Metro bundler picks SoundManager.native.ts for iOS/Android,
 * and this file for web.
 *
 * Sounds are synthesized on the fly — no file loading needed.
 */

type SoundKey = 'drop' | 'merge' | 'star' | 'blackhole' | 'virus' | 'gameover';

const SOUND_PREF_KEY = 'solar_merge_sound_enabled';

let soundEnabled: boolean = (() => {
  try {
    const val = typeof localStorage !== 'undefined' ? localStorage.getItem(SOUND_PREF_KEY) : null;
    return val === null ? true : val === 'true';
  } catch { return true; }
})();

export function isSoundEnabled(): boolean { return soundEnabled; }

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
  if (enabled) {
    startAmbientAlien();
  } else {
    stopAmbientAlien();
  }
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SOUND_PREF_KEY, String(enabled));
    }
  } catch { }
}

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

// ── Black hole: punchy "whomp" sweep 320Hz → 50Hz (500ms) ───────────────────

function synthBlackhole(c: AudioContext) {
  const now = c.currentTime;
  const dur = 0.5;

  // Main sweep: 320Hz → 50Hz exponential, sawtooth-like harmonics
  const freqs = [1, 2, 3, 4];
  const amps = [0.60, 0.22, 0.12, 0.06];
  freqs.forEach((mult, i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.connect(g);
    g.connect(c.destination);
    osc.frequency.setValueAtTime(320 * mult, now);
    osc.frequency.exponentialRampToValueAtTime(50 * mult, now + dur);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(amps[i] * 0.9, now + 0.002); // instant attack
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.start(now);
    osc.stop(now + dur + 0.01);
  });

  // Detuned layer (+1.8%) for width
  const oscDet = c.createOscillator();
  const gainDet = c.createGain();
  oscDet.connect(gainDet);
  gainDet.connect(c.destination);
  oscDet.frequency.setValueAtTime(320 * 1.018, now);
  oscDet.frequency.exponentialRampToValueAtTime(50 * 1.018, now + dur);
  gainDet.gain.setValueAtTime(0, now);
  gainDet.gain.linearRampToValueAtTime(0.32, now + 0.002);
  gainDet.gain.exponentialRampToValueAtTime(0.001, now + dur);
  oscDet.start(now);
  oscDet.stop(now + dur + 0.01);
}

// ── Game Over: sad descending 4-note minor phrase (900ms) ────────────────────

function synthGameOver(c: AudioContext) {
  const now = c.currentTime;
  const noteFreqs = [440, 370, 330, 247];
  const noteDur = 0.21;

  noteFreqs.forEach((freq, idx) => {
    const start = now + idx * noteDur;
    const end = start + noteDur;

    // Fundamental
    const osc1 = c.createOscillator();
    const g1 = c.createGain();
    osc1.connect(g1);
    g1.connect(c.destination);
    osc1.frequency.setValueAtTime(freq, start);
    g1.gain.setValueAtTime(0, start);
    g1.gain.linearRampToValueAtTime(0.5, start + 0.018);
    g1.gain.setValueAtTime(0.5, start + noteDur * 0.7);
    g1.gain.exponentialRampToValueAtTime(0.001, end);
    osc1.start(start);
    osc1.stop(end + 0.01);

    // 2nd harmonic (warm trombone-like)
    const osc2 = c.createOscillator();
    const g2 = c.createGain();
    osc2.connect(g2);
    g2.connect(c.destination);
    osc2.frequency.setValueAtTime(freq * 2, start);
    g2.gain.setValueAtTime(0, start);
    g2.gain.linearRampToValueAtTime(0.22, start + 0.018);
    g2.gain.setValueAtTime(0.22, start + noteDur * 0.7);
    g2.gain.exponentialRampToValueAtTime(0.001, end);
    osc2.start(start);
    osc2.stop(end + 0.01);
  });
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

// ── Alien Ambient: eerie sci-fi space sounds ──────────────────────────

let ambientNodes: {
  oscillators: (OscillatorNode | AudioBufferSourceNode)[];
  gain: GainNode;
} | null = null;

function createPinkNoise(c: AudioContext, duration: number = 2) {
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    data[i] *= 0.11; // gain compensation
    b6 = white * 0.115926;
  }
  return buffer;
}

export function stopAmbientAlien(): void {
  if (ambientNodes) {
    const { oscillators, gain } = ambientNodes;
    const now = gain.context.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    setTimeout(() => {
      oscillators.forEach(o => { try { o.stop(); o.disconnect(); } catch { } });
      gain.disconnect();
    }, 1600);
    ambientNodes = null;
  }
}

export function startAmbientAlien(): void {
  if (ambientNodes || !soundEnabled) return;
  const c = getCtx();
  if (!c) return;
  resumeCtx(c);

  const now = c.currentTime;
  const masterGain = c.createGain();
  masterGain.connect(c.destination);
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(0.35, now + 4);

  const nodes: (OscillatorNode | AudioBufferSourceNode)[] = [];

  // 1. FM "Space Hum" (Carrier + Modulator)
  const carrier = c.createOscillator();
  const modulator = c.createOscillator();
  const modGain = c.createGain();

  carrier.frequency.setValueAtTime(55, now); // Low G
  modulator.frequency.setValueAtTime(0.5, now); // Slow oscillation
  modGain.gain.setValueAtTime(20, now); // Frequency modulation depth

  modulator.connect(modGain);
  modGain.connect(carrier.frequency);
  carrier.connect(masterGain);

  carrier.start(now);
  modulator.start(now);
  nodes.push(carrier, modulator);

  // 2. High-pitched "Distant Alien Beeps" (Randomized sparse beeps)
  const scheduleBeep = (delay: number) => {
    if (!ambientNodes) return;
    const startTime = c.currentTime + delay;
    const osc = c.createOscillator();
    const g = c.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000 + Math.random() * 1000, startTime);
    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(0.06, startTime + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + 2.5);

    osc.connect(g);
    g.connect(masterGain);
    try {
      osc.start(startTime);
      osc.stop(startTime + 2.6);
    } catch { } // Context might be closed

    setTimeout(() => {
      if (ambientNodes) scheduleBeep(Math.random() * 8 + 5);
    }, (delay + 4) * 1000);
  };
  scheduleBeep(3);

  // 3. Modulated Filtered Noise
  const noiseSource = c.createBufferSource();
  noiseSource.buffer = createPinkNoise(c, 4);
  noiseSource.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(600, now);

  const filterLFO = c.createOscillator();
  const filterLFOGain = c.createGain();
  filterLFO.frequency.setValueAtTime(0.15, now);
  filterLFOGain.gain.setValueAtTime(300, now); // Modulate filter cutoff
  filterLFO.connect(filterLFOGain);
  filterLFOGain.connect(filter.frequency);

  noiseSource.connect(filter);
  filter.connect(masterGain);
  noiseSource.start(now);
  filterLFO.start(now);
  nodes.push(noiseSource, filterLFO);

  ambientNodes = { oscillators: nodes, gain: masterGain };
}

// Global resume listener for browser autoplay policy
if (typeof window !== 'undefined') {
  const resume = () => {
    const c = getCtx();
    if (c && c.state === 'suspended') {
      c.resume().then(() => {
        if (soundEnabled) startAmbientAlien();
      });
    } else if (c && c.state === 'running' && soundEnabled) {
      startAmbientAlien();
    }
  };
  window.addEventListener('click', resume, { once: true });
  window.addEventListener('touchstart', resume, { once: true });
}

// ── Public API ────────────────────────────────────────────────────────────────

export function initSounds(): Promise<void> {
  // Eagerly create the AudioContext (may be suspended until user gesture)
  getCtx();
  return Promise.resolve();
}

export function playSound(key: SoundKey): Promise<void> {
  if (!soundEnabled) return Promise.resolve();
  const c = getCtx();
  if (!c) return Promise.resolve();
  resumeCtx(c);

  if (key === 'drop') synthDrop(c);
  else if (key === 'merge') synthMerge(c);
  else if (key === 'star') synthStar(c);
  else if (key === 'blackhole') synthBlackhole(c);
  else if (key === 'virus') synthVirus(c);
  else if (key === 'gameover') synthGameOver(c);

  return Promise.resolve();
}
