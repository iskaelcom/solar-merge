#!/usr/bin/env node
/**
 * Generates logo.png from inline SVG — mirrors the GameLogo component.
 * Run: node scripts/generate-logo-png.js
 */

const fs   = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.join(__dirname, '..', 'assets');
fs.mkdirSync(OUT, { recursive: true });

// Sun rays: [0,60,120,180,240,300] degrees, alternating thick/thin
function sunRays(cx, cy, len) {
  return [0, 60, 120, 180, 240, 300].map((deg, i) => {
    const r  = deg * Math.PI / 180;
    const x  = (cx + len * Math.cos(r)).toFixed(2);
    const y  = (cy + len * Math.sin(r)).toFixed(2);
    const sw = i % 2 === 0 ? 1.8 : 1.2;
    return `<path d="M${cx} ${cy} L${x} ${y}" stroke="#FF8F00" stroke-width="${sw}" stroke-linecap="round" opacity="0.5"/>`;
  }).join('');
}

// viewBox: 200 × 84  →  export at 3× = 600 × 252
const VW = 200, VH = 84;
const SCALE = 3;
const W = VW * SCALE, H = VH * SCALE;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="grad_solar" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="#FFF9C4"/>
      <stop offset="40%"  stop-color="#FFD600"/>
      <stop offset="100%" stop-color="#FF8F00"/>
    </linearGradient>
    <linearGradient id="grad_merge" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="#E0F7FA"/>
      <stop offset="40%"  stop-color="#26C6DA"/>
      <stop offset="100%" stop-color="#006064"/>
    </linearGradient>
    <radialGradient id="sun_glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#FFD600" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#FF8F00" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Decorative orbit rings -->
  <ellipse cx="100" cy="42" rx="94" ry="22" fill="none" stroke="rgba(255,214,0,0.12)" stroke-width="1"/>
  <ellipse cx="100" cy="42" rx="94" ry="22" fill="none" stroke="rgba(38,198,218,0.10)" stroke-width="0.5" stroke-dasharray="4 6"/>

  <!-- Left mini moon -->
  <circle cx="12" cy="42" r="5" fill="#C8C8D8"/>
  <circle cx="10.5" cy="40.5" r="2" fill="rgba(255,255,255,0.4)"/>

  <!-- Right mini sun -->
  <circle cx="188" cy="42" r="7" fill="#FFD600"/>
  ${sunRays(188, 42, 10)}
  <circle cx="188" cy="42" r="5.5" fill="#FFD600"/>
  <circle cx="186" cy="40" r="2" fill="rgba(255,255,255,0.5)"/>

  <!-- Sparkles -->
  <text x="22"  y="16" font-size="9" fill="#FFD600" opacity="0.8">&#10022;</text>
  <text x="160" y="12" font-size="7" fill="#26C6DA" opacity="0.7">&#10022;</text>
  <text x="175" y="22" font-size="5" fill="#FFD600" opacity="0.6">&#10022;</text>
  <text x="10"  y="22" font-size="6" fill="#26C6DA" opacity="0.5">&#10022;</text>

  <!-- SOLAR shadow -->
  <text x="101" y="48" font-size="34" font-weight="900" text-anchor="middle"
        fill="rgba(180,80,0,0.4)" letter-spacing="3">SOLAR</text>
  <!-- SOLAR main -->
  <text x="100" y="46" font-size="34" font-weight="900" text-anchor="middle"
        fill="url(#grad_solar)" letter-spacing="3">SOLAR</text>

  <!-- MERGE shadow -->
  <text x="101" y="72" font-size="22" font-weight="900" text-anchor="middle"
        fill="rgba(0,80,90,0.45)" letter-spacing="8">MERGE</text>
  <!-- MERGE main -->
  <text x="100" y="70" font-size="22" font-weight="900" text-anchor="middle"
        fill="url(#grad_merge)" letter-spacing="8">MERGE</text>

  <!-- Underline glow -->
  <ellipse cx="100" cy="76" rx="55" ry="3" fill="url(#grad_solar)" opacity="0.35"/>
</svg>`;

async function main() {
  const out = path.join(OUT, 'logo.png');
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log(`✓ logo.png saved to assets/ (${W}×${H})`);
}

main().catch(err => { console.error(err); process.exit(1); });
