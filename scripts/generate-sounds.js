#!/usr/bin/env node
/**
 * Generates simple synthesized WAV sound effects for Solar Merge.
 * Run once: node scripts/generate-sounds.js
 */

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 22050;
const OUT_DIR = path.join(__dirname, '../assets/sounds');

// ── WAV writer ────────────────────────────────────────────────────────────────

function writeWav(filename, samples) {
  const numSamples = samples.length;
  const buf = Buffer.alloc(44 + numSamples * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + numSamples * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(numSamples * 2, 40);
  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  fs.writeFileSync(path.join(OUT_DIR, filename), buf);
  console.log(`✓ ${filename} (${numSamples} samples)`);
}

// ── Drop: short descending chirp (180ms) ─────────────────────────────────────

function generateDrop() {
  const duration = 0.18;
  const n = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;
    const freq = 520 - 240 * progress;
    const env = Math.min(1, t / 0.005) * Math.exp(-progress * 5.5);
    samples[i] = (Math.sin(2 * Math.PI * freq * t) * 0.75
                + Math.sin(2 * Math.PI * freq * 2 * t) * 0.15) * env * 0.8;
  }
  writeWav('drop.wav', samples);
}

// ── Merge: ascending bell "ding" (320ms) ─────────────────────────────────────

function generateMerge() {
  const duration = 0.32;
  const n = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;
    const freq = progress < 0.08 / duration ? 660 + 220 * (t / 0.08) : 880;
    const env = Math.exp(-progress * 4.8);
    samples[i] = (Math.sin(2 * Math.PI * freq * t) * 0.6
                + Math.sin(2 * Math.PI * freq * 2 * t) * 0.25
                + Math.sin(2 * Math.PI * freq * 3 * t) * 0.08) * env * 0.85;
  }
  writeWav('merge.wav', samples);
}

// ── Star: bright sparkling arpeggio (280ms) ───────────────────────────────────
// Four quick notes: C5→E5→G5→C6 (523→659→784→1047 Hz)

function generateStar() {
  const duration = 0.28;
  const n = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(n);
  const notes = [523, 659, 784, 1047];
  const noteDur = duration / notes.length;

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const noteIdx = Math.min(Math.floor(t / noteDur), notes.length - 1);
    const noteT = t - noteIdx * noteDur;
    const noteProgress = noteT / noteDur;
    const freq = notes[noteIdx];

    const env = Math.min(1, noteT / 0.003) * Math.exp(-noteProgress * 8);
    // Bright timbre: fundamental + 2nd + 3rd harmonic
    const wave = Math.sin(2 * Math.PI * freq * t) * 0.55
               + Math.sin(2 * Math.PI * freq * 2 * t) * 0.28
               + Math.sin(2 * Math.PI * freq * 3 * t) * 0.10;

    samples[i] = wave * env * 0.75;
  }
  writeWav('star.wav', samples);
}

// ── Black hole: punchy "whomp" sweep 320Hz → 50Hz (500ms) ───────────────────
// Loud impact attack + harmonic sweep for maximum audibility

function generateBlackhole() {
  const duration = 0.5;
  const n = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;

    // Exponential frequency sweep: 320Hz → 50Hz (very fast at first)
    const freq = 320 * Math.pow(50 / 320, progress);

    // Punchy envelope: instant attack (2ms), then slow decay
    const env = Math.min(1, t / 0.002) * Math.exp(-progress * 4.0);

    // Sawtooth-like: sum of harmonics for rich buzzy texture
    const f = 2 * Math.PI * freq * t;
    const wave = Math.sin(f) * 0.60
               + Math.sin(f * 2) * 0.22   // 2nd harmonic
               + Math.sin(f * 3) * 0.12   // 3rd harmonic
               + Math.sin(f * 4) * 0.06;  // 4th harmonic

    // Detuned layer (+1.8%) for width
    const fDet = 2 * Math.PI * freq * 1.018 * t;
    const wave2 = Math.sin(fDet) * 0.35;

    samples[i] = (wave + wave2) * env * 0.95;
  }
  writeWav('blackhole.wav', samples);
}

// ── Virus: eerie glitchy warble (220ms) ──────────────────────────────────────

function generateVirus() {
  const duration = 0.22;
  const n = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(n);

  const lfoFreq = 28; // fast wobble rate

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;

    // Carrier frequency modulated by LFO: warble between 420Hz and 580Hz
    const lfo = Math.sin(2 * Math.PI * lfoFreq * t);
    const freq = 500 + 80 * lfo;

    // Envelope: quick attack, medium decay with slight tremolo
    const tremolo = 0.7 + 0.3 * Math.abs(lfo);
    const env = Math.min(1, t / 0.006) * Math.exp(-progress * 4.5) * tremolo;

    // Dissonant: two oscillators with interval of minor 2nd
    const wave = Math.sin(2 * Math.PI * freq * t) * 0.55
               + Math.sin(2 * Math.PI * freq * 1.059 * t) * 0.35; // minor 2nd

    samples[i] = wave * env * 0.8;
  }
  writeWav('virus.wav', samples);
}

// ── Game Over: sad descending 4-note minor phrase (900ms) ────────────────────
// A4(440) → F#4(370) → E4(330) → B3(247), each ~200ms with slow vibrato

function generateGameOver() {
  const notes = [440, 370, 330, 247];
  const noteDur = 0.21;
  const totalDur = notes.length * noteDur + 0.1; // slight tail
  const n = Math.floor(SAMPLE_RATE * totalDur);
  const samples = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const noteIdx = Math.min(Math.floor(t / noteDur), notes.length - 1);
    const noteT = t - noteIdx * noteDur;
    const noteProgress = noteT / noteDur;
    const freq = notes[noteIdx];

    // Vibrato deepens as note goes on (expressive)
    const vibratoDepth = 3 + noteProgress * 5;
    const vibratoFreq  = 5.5;
    const vibrato = vibratoDepth * Math.sin(2 * Math.PI * vibratoFreq * noteT);
    const instFreq = freq + vibrato;

    // Envelope: quick attack, hold, decay at end of each note
    const attack = Math.min(1, noteT / 0.018);
    const decay  = noteProgress > 0.7 ? Math.pow((1 - noteProgress) / 0.3, 0.6) : 1;
    const env = attack * decay;

    // Warm trombone-like timbre
    const f = 2 * Math.PI * instFreq * t;
    const wave = Math.sin(f) * 0.60
               + Math.sin(f * 2) * 0.26
               + Math.sin(f * 3) * 0.10
               + Math.sin(f * 4) * 0.04;

    // Overall fade at the very end
    const tail = Math.max(0, 1 - Math.max(0, t - (notes.length * noteDur)) / 0.1);

    samples[i] = wave * env * tail * 0.85;
  }
  writeWav('gameover.wav', samples);
}

// ── Run ───────────────────────────────────────────────────────────────────────

fs.mkdirSync(OUT_DIR, { recursive: true });
generateDrop();
generateMerge();
generateStar();
generateBlackhole();
generateVirus();
generateGameOver();
console.log('Done — assets/sounds/ ready.');
