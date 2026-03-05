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

  // RIFF header
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + numSamples * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);           // chunk size
  buf.writeUInt16LE(1, 20);            // PCM
  buf.writeUInt16LE(1, 22);            // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32);            // block align
  buf.writeUInt16LE(16, 34);           // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  fs.writeFileSync(path.join(OUT_DIR, filename), buf);
  console.log(`✓ ${filename} (${numSamples} samples)`);
}

// ── Drop sound: short "plop" descending chirp (180ms) ────────────────────────

function generateDrop() {
  const duration = 0.18;
  const n = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;

    // Frequency slides down from 520 Hz → 280 Hz
    const freq = 520 - 240 * progress;

    // Envelope: quick attack (5ms), then exponential decay
    const attack = Math.min(1, t / 0.005);
    const decay = Math.exp(-progress * 5.5);
    const env = attack * decay;

    // Sine + slight harmonic
    const wave = Math.sin(2 * Math.PI * freq * t) * 0.75
               + Math.sin(2 * Math.PI * freq * 2 * t) * 0.15;

    samples[i] = wave * env * 0.8;
  }

  writeWav('drop.wav', samples);
}

// ── Merge sound: bright ascending "ding" (320ms) ─────────────────────────────

function generateMerge() {
  const duration = 0.32;
  const n = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;

    // Two-tone: fundamental 660 Hz, glides up to 880 Hz over first 80ms,
    // then octave harmonic at 1320 Hz
    const glideEnd = 0.08;
    const freq = progress < glideEnd / duration
      ? 660 + 220 * (t / glideEnd)
      : 880;

    // Envelope: instant attack, bell-like decay
    const env = Math.exp(-progress * 4.8);

    const wave = Math.sin(2 * Math.PI * freq * t) * 0.6
               + Math.sin(2 * Math.PI * freq * 2 * t) * 0.25
               + Math.sin(2 * Math.PI * freq * 3 * t) * 0.08;

    samples[i] = wave * env * 0.85;
  }

  writeWav('merge.wav', samples);
}

// ── Run ───────────────────────────────────────────────────────────────────────

fs.mkdirSync(OUT_DIR, { recursive: true });
generateDrop();
generateMerge();
console.log('Done — assets/sounds/ ready.');
