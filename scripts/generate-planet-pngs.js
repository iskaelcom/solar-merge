#!/usr/bin/env node
/**
 * Generates PNG planet assets from inline SVG — original cute style.
 * Run: node scripts/generate-planet-pngs.js
 */

const fs   = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.join(__dirname, '..', 'assets', 'planets');
fs.mkdirSync(OUT, { recursive: true });

// Pre-compute Sun corona rays + ellipses
function sunRays() {
  return [0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
    const r = deg * Math.PI / 180;
    const x = (55 + 48 * Math.cos(r)).toFixed(2);
    const y = (55 + 48 * Math.sin(r)).toFixed(2);
    return `<path d="M55 55 L${x} ${y}" stroke="#FF8F00" stroke-width="${i%2===0?5:3}" stroke-linecap="round" opacity="0.6"/>`;
  }).join('');
}
function sunCorona() {
  return [15,75,135,195,255,315].map(deg => {
    const r  = deg * Math.PI / 180;
    const cx = (55 + 48 * Math.cos(r)).toFixed(2);
    const cy = (55 + 48 * Math.sin(r)).toFixed(2);
    return `<ellipse cx="${cx}" cy="${cy}" rx="8" ry="4" fill="#FFD600" opacity="0.45" transform="rotate(${deg+90},${cx},${cy})"/>`;
  }).join('');
}

// Saturn Cassini-division gap paths
const GAP_BACK  = 'M 23 53 A 77 16.5 0 0 0 177 53 L 173 53 A 73 15.5 0 0 1 27 53 L 23 53 Z';
const GAP_FRONT = 'M 23 53 A 77 16.5 0 0 1 177 53 L 173 53 A 73 15.5 0 0 0 27 53 L 23 53 Z';

// [ name, pxW, pxH, svgString ]
const PLANETS = [

// ── 1. MOON ──────────────────────────────────────────────────────────────────
['moon', 400, 400, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="400" height="400">
  <defs>
    <radialGradient id="g" cx="38%" cy="32%" r="65%">
      <stop offset="0%" stop-color="#F8F8FF"/>
      <stop offset="100%" stop-color="#B0B0C8"/>
    </radialGradient>
  </defs>
  <circle cx="50" cy="50" r="47" fill="url(#g)"/>
  <!-- Craters -->
  <circle cx="28" cy="37" r="11" fill="rgba(0,0,0,.10)"/>
  <circle cx="26" cy="35" r="8.5" fill="rgba(255,255,255,.07)"/>
  <circle cx="67" cy="27" r="7.5" fill="rgba(0,0,0,.09)"/>
  <circle cx="65" cy="25" r="6" fill="rgba(255,255,255,.06)"/>
  <circle cx="72" cy="65" r="9" fill="rgba(0,0,0,.09)"/>
  <circle cx="70" cy="63" r="7" fill="rgba(255,255,255,.06)"/>
  <circle cx="42" cy="72" r="5" fill="rgba(0,0,0,.08)"/>
  <!-- Closed sleepy eyes -->
  <path d="M35 49 Q40 44 45 49" stroke="#7878B0" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M55 49 Q60 44 65 49" stroke="#7878B0" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Eyelashes -->
  <line x1="38" y1="46" x2="37" y2="43" stroke="#7878B0" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="58" y1="46" x2="57" y2="43" stroke="#7878B0" stroke-width="1.5" stroke-linecap="round"/>
  <!-- zzz -->
  <text x="70" y="44" font-size="10" fill="#A0A0CC" font-weight="bold">z</text>
  <text x="76" y="37" font-size="8"  fill="#A0A0CC" font-weight="bold">z</text>
  <!-- Smile -->
  <path d="M42 61 Q50 68 58 61" stroke="#8080B0" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Blush -->
  <ellipse cx="33" cy="58" rx="7" ry="4.5" fill="rgba(255,160,160,.35)"/>
  <ellipse cx="67" cy="58" rx="7" ry="4.5" fill="rgba(255,160,160,.35)"/>
  <!-- Shine -->
  <ellipse cx="27" cy="27" rx="11" ry="7.5" fill="rgba(255,255,255,.32)" transform="rotate(-30,27,27)"/>
</svg>`],

// ── 2. MERCURY ───────────────────────────────────────────────────────────────
['mercury', 400, 400, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="400" height="400">
  <defs>
    <radialGradient id="g" cx="38%" cy="32%" r="65%">
      <stop offset="0%" stop-color="#D0D0D8"/>
      <stop offset="100%" stop-color="#686870"/>
    </radialGradient>
  </defs>
  <circle cx="50" cy="50" r="47" fill="url(#g)"/>
  <!-- Craters -->
  <circle cx="30" cy="35" r="10" fill="rgba(0,0,0,.13)"/>
  <circle cx="28" cy="33" r="8"  fill="rgba(255,255,255,.07)"/>
  <circle cx="65" cy="30" r="7.5" fill="rgba(0,0,0,.12)"/>
  <circle cx="63" cy="28" r="6"  fill="rgba(255,255,255,.06)"/>
  <circle cx="62" cy="67" r="8.5" fill="rgba(0,0,0,.11)"/>
  <circle cx="34" cy="70" r="6"  fill="rgba(0,0,0,.10)"/>
  <!-- Dizzy spiral eyes -->
  <circle cx="38" cy="48" r="9" fill="rgba(0,0,0,.15)"/>
  <path d="M38 43 Q43 43 43 48 Q43 53 38 53 Q33 53 33 48 Q33 45 36 44" stroke="white" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <circle cx="38" cy="48" r="2.5" fill="#222"/>
  <circle cx="62" cy="48" r="9" fill="rgba(0,0,0,.15)"/>
  <path d="M62 43 Q67 43 67 48 Q67 53 62 53 Q57 53 57 48 Q57 45 60 44" stroke="white" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <circle cx="62" cy="48" r="2.5" fill="#222"/>
  <!-- Stars (dizzy) -->
  <text x="18" y="26" font-size="11" fill="#FFD700">&#9733;</text>
  <text x="72" y="23" font-size="9"  fill="#FFD700">&#9733;</text>
  <!-- Wavy mouth -->
  <path d="M39 63 Q44 67 50 63 Q56 59 61 63" stroke="#555" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Shine -->
  <ellipse cx="27" cy="27" rx="11" ry="7.5" fill="rgba(255,255,255,.28)" transform="rotate(-30,27,27)"/>
</svg>`],

// ── 3. MARS ──────────────────────────────────────────────────────────────────
['mars', 400, 400, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="400" height="400">
  <defs>
    <radialGradient id="g" cx="38%" cy="32%" r="65%">
      <stop offset="0%" stop-color="#FF8A80"/>
      <stop offset="100%" stop-color="#C62828"/>
    </radialGradient>
  </defs>
  <circle cx="50" cy="50" r="47" fill="url(#g)"/>
  <!-- Surface texture -->
  <circle cx="30" cy="38" r="7" fill="rgba(180,30,20,.2)"/>
  <circle cx="68" cy="32" r="5" fill="rgba(180,30,20,.18)"/>
  <circle cx="72" cy="65" r="6" fill="rgba(180,30,20,.18)"/>
  <!-- Polar ice cap -->
  <ellipse cx="50" cy="12" rx="14" ry="7" fill="rgba(255,255,255,.82)"/>
  <!-- Angry V brows -->
  <path d="M30 43 L40 38 L46 42" stroke="#7B1010" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M54 42 L60 38 L70 43" stroke="#7B1010" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Eyes -->
  <circle cx="38" cy="52" r="9" fill="white"/>
  <circle cx="62" cy="52" r="9" fill="white"/>
  <circle cx="38" cy="53" r="6" fill="#FF5252"/>
  <circle cx="62" cy="53" r="6" fill="#FF5252"/>
  <circle cx="39" cy="52" r="3.2" fill="#1A0000"/>
  <circle cx="63" cy="52" r="3.2" fill="#1A0000"/>
  <circle cx="40.5" cy="50.5" r="1.3" fill="white"/>
  <circle cx="64.5" cy="50.5" r="1.3" fill="white"/>
  <!-- Angry half-lid -->
  <path d="M29 49 Q38 44 47 49" fill="#C62828"/>
  <path d="M53 49 Q62 44 71 49" fill="#C62828"/>
  <!-- Blush -->
  <ellipse cx="26" cy="61" rx="10" ry="7.5" fill="rgba(255,160,130,.45)"/>
  <ellipse cx="74" cy="61" rx="10" ry="7.5" fill="rgba(255,160,130,.45)"/>
  <!-- Grumpy mouth -->
  <path d="M38 68 Q50 63 62 68" stroke="#8B1010" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <!-- Shine -->
  <ellipse cx="27" cy="27" rx="12" ry="8" fill="rgba(255,255,255,.28)" transform="rotate(-30,27,27)"/>
</svg>`],

// ── 4. VENUS ─────────────────────────────────────────────────────────────────
['venus', 400, 400, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="400" height="400">
  <defs>
    <radialGradient id="g" cx="38%" cy="32%" r="65%">
      <stop offset="0%" stop-color="#FFE57F"/>
      <stop offset="100%" stop-color="#FF8F00"/>
    </radialGradient>
  </defs>
  <circle cx="50" cy="50" r="47" fill="url(#g)"/>
  <!-- Cloud swirls -->
  <path d="M20 35 Q35 28 50 35 Q65 42 80 35" stroke="rgba(255,255,255,.5)" stroke-width="3" fill="none"/>
  <path d="M15 50 Q35 43 55 50 Q70 57 85 50" stroke="rgba(255,255,255,.4)" stroke-width="2.5" fill="none"/>
  <path d="M22 65 Q40 58 58 65 Q72 72 80 65" stroke="rgba(255,255,255,.45)" stroke-width="2" fill="none"/>
  <!-- Heart eyes -->
  <path d="M33 44 Q33 39 38 39 Q43 39 43 44 Q43 49 38 53 Q33 49 33 44Z" fill="#E91E63"/>
  <path d="M57 44 Q57 39 62 39 Q67 39 67 44 Q67 49 62 53 Q57 49 57 44Z" fill="#E91E63"/>
  <circle cx="36.5" cy="41" r="2.5" fill="rgba(255,255,255,.6)"/>
  <circle cx="60.5" cy="41" r="2.5" fill="rgba(255,255,255,.6)"/>
  <!-- Star sparkles -->
  <text x="72" y="32" font-size="10" fill="#FFF59D">&#10022;</text>
  <text x="20" y="28" font-size="8"  fill="#FFF59D">&#10022;</text>
  <text x="78" y="62" font-size="7"  fill="#FFF59D">&#10022;</text>
  <!-- Big smile -->
  <path d="M37 63 Q50 75 63 63" stroke="#E65100" stroke-width="3" fill="rgba(255,160,0,.3)" stroke-linecap="round"/>
  <!-- Blush -->
  <ellipse cx="28" cy="56" rx="9" ry="5.5" fill="rgba(255,100,50,.35)"/>
  <ellipse cx="72" cy="56" rx="9" ry="5.5" fill="rgba(255,100,50,.35)"/>
  <!-- Shine -->
  <ellipse cx="27" cy="27" rx="13" ry="8.5" fill="rgba(255,255,255,.32)" transform="rotate(-30,27,27)"/>
</svg>`],

// ── 5. EARTH ─────────────────────────────────────────────────────────────────
['earth', 400, 400, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="400" height="400">
  <defs>
    <radialGradient id="g" cx="38%" cy="32%" r="65%">
      <stop offset="0%" stop-color="#64B5F6"/>
      <stop offset="100%" stop-color="#1565C0"/>
    </radialGradient>
  </defs>
  <circle cx="50" cy="50" r="47" fill="url(#g)"/>
  <!-- Continents -->
  <path d="M28 35 Q35 28 45 32 Q50 35 48 43 Q44 48 38 46 Q30 44 28 35Z" fill="#4CAF50" opacity=".9"/>
  <path d="M52 30 Q62 25 70 33 Q75 40 70 48 Q63 52 56 48 Q50 44 52 30Z" fill="#4CAF50" opacity=".85"/>
  <path d="M35 55 Q42 50 50 54 Q55 58 52 68 Q46 73 38 68 Q32 62 35 55Z" fill="#66BB6A" opacity=".85"/>
  <path d="M60 58 Q67 54 73 60 Q76 66 70 72 Q63 75 58 69 Q56 63 60 58Z" fill="#4CAF50" opacity=".8"/>
  <!-- Clouds -->
  <ellipse cx="30" cy="28" rx="10" ry="5"   fill="rgba(255,255,255,.7)"/>
  <ellipse cx="65" cy="24" rx="8"  ry="4.5" fill="rgba(255,255,255,.65)"/>
  <ellipse cx="50" cy="75" rx="9"  ry="4"   fill="rgba(255,255,255,.6)"/>
  <!-- Eyes -->
  <circle cx="38" cy="47" r="7.5" fill="white"/>
  <circle cx="62" cy="47" r="7.5" fill="white"/>
  <circle cx="39.5" cy="48" r="5" fill="#1E88E5"/>
  <circle cx="63.5" cy="48" r="5" fill="#1E88E5"/>
  <circle cx="40.5" cy="47" r="2.5" fill="#111"/>
  <circle cx="64.5" cy="47" r="2.5" fill="#111"/>
  <circle cx="41.5" cy="46" r="1.2" fill="white"/>
  <circle cx="65.5" cy="46" r="1.2" fill="white"/>
  <!-- Happy smile -->
  <path d="M39 62 Q50 72 61 62" stroke="#0D47A1" stroke-width="3" fill="rgba(100,200,255,.2)" stroke-linecap="round"/>
  <!-- Blush -->
  <ellipse cx="28" cy="56" rx="8" ry="5" fill="rgba(200,230,255,.5)"/>
  <ellipse cx="72" cy="56" rx="8" ry="5" fill="rgba(200,230,255,.5)"/>
  <!-- Shine -->
  <ellipse cx="27" cy="27" rx="13" ry="8" fill="rgba(255,255,255,.3)" transform="rotate(-30,27,27)"/>
</svg>`],

// ── 6. NEPTUNE ───────────────────────────────────────────────────────────────
['neptune', 400, 400, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="400" height="400">
  <defs>
    <radialGradient id="g" cx="38%" cy="32%" r="65%">
      <stop offset="0%" stop-color="#7986CB"/>
      <stop offset="100%" stop-color="#1A237E"/>
    </radialGradient>
  </defs>
  <circle cx="50" cy="50" r="47" fill="url(#g)"/>
  <!-- Storm bands -->
  <path d="M8 40 Q30 35 50 40 Q70 45 92 40" stroke="rgba(100,120,220,.5)" stroke-width="4" fill="none"/>
  <path d="M8 55 Q30 60 50 55 Q70 50 92 55" stroke="rgba(80,100,200,.45)" stroke-width="3" fill="none"/>
  <path d="M15 68 Q35 65 55 68 Q72 71 85 68" stroke="rgba(90,110,210,.4)" stroke-width="2.5" fill="none"/>
  <!-- Storm spot -->
  <ellipse cx="65" cy="48" rx="14" ry="9" fill="rgba(120,140,240,.45)"/>
  <ellipse cx="65" cy="48" rx="9"  ry="6" fill="rgba(150,160,255,.35)"/>
  <!-- Half-closed mysterious eyes -->
  <ellipse cx="37" cy="47" rx="9" ry="7" fill="#1A237E"/>
  <ellipse cx="37" cy="47" rx="6" ry="5" fill="white"/>
  <path d="M28 47 Q37 41 46 47" fill="#3949AB"/>
  <circle cx="37" cy="49" r="3"   fill="#0D1366"/>
  <circle cx="38" cy="48" r="1.2" fill="white"/>
  <ellipse cx="63" cy="47" rx="9" ry="7" fill="#1A237E"/>
  <ellipse cx="63" cy="47" rx="6" ry="5" fill="white"/>
  <path d="M54 47 Q63 41 72 47" fill="#3949AB"/>
  <circle cx="63" cy="49" r="3"   fill="#0D1366"/>
  <circle cx="64" cy="48" r="1.2" fill="white"/>
  <!-- Smug smile -->
  <path d="M40 63 Q50 68 60 63" stroke="#3949AB" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Blush sparkles -->
  <text x="24" y="60" font-size="9" fill="rgba(150,180,255,.7)">&#10022;</text>
  <text x="68" y="60" font-size="9" fill="rgba(150,180,255,.7)">&#10022;</text>
  <!-- Shine -->
  <ellipse cx="27" cy="27" rx="13" ry="8" fill="rgba(255,255,255,.25)" transform="rotate(-30,27,27)"/>
</svg>`],

// ── 7. URANUS ────────────────────────────────────────────────────────────────
['uranus', 400, 400, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="400" height="400">
  <defs>
    <radialGradient id="g" cx="38%" cy="32%" r="65%">
      <stop offset="0%" stop-color="#80DEEA"/>
      <stop offset="100%" stop-color="#00838F"/>
    </radialGradient>
  </defs>
  <circle cx="50" cy="50" r="47" fill="url(#g)"/>
  <!-- Horizontal rings -->
  <ellipse cx="50" cy="50" rx="60" ry="16" fill="none" stroke="rgba(200,240,245,.5)"  stroke-width="4"/>
  <ellipse cx="50" cy="50" rx="65" ry="18" fill="none" stroke="rgba(180,230,240,.35)" stroke-width="2.5"/>
  <!-- Bands -->
  <path d="M10 42 Q35 38 50 42 Q65 46 90 42" stroke="rgba(0,150,160,.3)" stroke-width="3" fill="none"/>
  <path d="M10 58 Q35 62 50 58 Q65 54 90 58" stroke="rgba(0,150,160,.3)" stroke-width="2.5" fill="none"/>
  <!-- Big silly eyes -->
  <circle cx="36" cy="46" r="9.5" fill="white"/>
  <circle cx="64" cy="46" r="9.5" fill="white"/>
  <circle cx="37.5" cy="47" r="6.5" fill="#00838F"/>
  <circle cx="65.5" cy="47" r="6.5" fill="#00838F"/>
  <circle cx="38" cy="46" r="3.5" fill="#003"/>
  <circle cx="66" cy="46" r="3.5" fill="#003"/>
  <circle cx="39.5" cy="44.5" r="1.5" fill="white"/>
  <circle cx="67.5" cy="44.5" r="1.5" fill="white"/>
  <!-- Googly effect -->
  <circle cx="35" cy="48" r="2" fill="rgba(0,100,110,.4)"/>
  <!-- Tongue -->
  <path d="M43 62 Q50 57 57 62" stroke="#006064" stroke-width="2.5" fill="rgba(0,160,170,.2)" stroke-linecap="round"/>
  <ellipse cx="50" cy="65" rx="6" ry="4.5" fill="#FF6090"/>
  <line x1="50" y1="62" x2="50" y2="69" stroke="#CC3060" stroke-width="1.5"/>
  <!-- Blush -->
  <ellipse cx="24" cy="55" rx="8" ry="5" fill="rgba(200,250,255,.45)"/>
  <ellipse cx="76" cy="55" rx="8" ry="5" fill="rgba(200,250,255,.45)"/>
  <!-- Shine -->
  <ellipse cx="27" cy="27" rx="13" ry="8" fill="rgba(255,255,255,.28)" transform="rotate(-30,27,27)"/>
</svg>`],

// ── 8. SATURN (2:1 → 800×400, viewBox 200×100) ───────────────────────────────
['saturn', 800, 400, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="800" height="400">
  <defs>
    <radialGradient id="g" cx="40%" cy="34%" r="62%">
      <stop offset="0%"   stop-color="#FFF59D"/>
      <stop offset="55%"  stop-color="#FFD54F"/>
      <stop offset="100%" stop-color="#E65100"/>
    </radialGradient>
  </defs>
  <!-- Ring BACK (upper half, behind planet) -->
  <path d="M 58 53 A 58 12 0 0 0 142 53 L 128 53 A 44 9 0 0 1 72 53 L 58 53 Z" fill="#FFE082" opacity=".9"/>
  <path d="M 6 53 A 94 20 0 0 0 194 53 L 180 53 A 80 17 0 0 1 20 53 L 6 53 Z"  fill="#C49A00" opacity=".8"/>
  <path d="${GAP_BACK}" fill="rgba(40,20,0,.7)"/>
  <!-- Planet body -->
  <circle cx="100" cy="50" r="44" fill="url(#g)"/>
  <!-- Bands -->
  <path d="M58 42 Q80 38 100 42 Q120 46 142 42" stroke="rgba(200,100,0,.28)" stroke-width="4"   fill="none"/>
  <path d="M58 50 Q80 54 100 50 Q120 46 142 50" stroke="rgba(200,120,0,.22)" stroke-width="3"   fill="none"/>
  <path d="M60 58 Q80 62 100 58 Q120 54 140 58" stroke="rgba(200,100,0,.22)" stroke-width="2.5" fill="none"/>
  <!-- Sunglasses frame -->
  <rect x="76"  y="38" width="21" height="15" rx="6" ry="6" fill="#1A1A2E"/>
  <rect x="103" y="38" width="21" height="15" rx="6" ry="6" fill="#1A1A2E"/>
  <line x1="97" y1="45.5" x2="103" y2="45.5" stroke="#333" stroke-width="2.5"/>
  <rect x="78"  y="40" width="17" height="11" rx="5" ry="5" fill="#1565C0" opacity=".9"/>
  <rect x="105" y="40" width="17" height="11" rx="5" ry="5" fill="#1565C0" opacity=".9"/>
  <ellipse cx="83"  cy="43" rx="4" ry="3" fill="rgba(255,255,255,.28)"/>
  <ellipse cx="110" cy="43" rx="4" ry="3" fill="rgba(255,255,255,.28)"/>
  <!-- Smile -->
  <path d="M86 64 Q100 74 114 64" stroke="#8D3500" stroke-width="3.5" fill="rgba(255,180,80,.25)" stroke-linecap="round"/>
  <!-- Shine -->
  <ellipse cx="78" cy="28" rx="14" ry="9" fill="rgba(255,255,255,.32)" transform="rotate(-30,78,28)"/>
  <!-- Ring FRONT (lower half, in front of planet) -->
  <path d="M 58 53 A 58 12 0 0 1 142 53 L 128 53 A 44 9 0 0 0 72 53 L 58 53 Z" fill="#FFD600" opacity=".92"/>
  <path d="M 6 53 A 94 20 0 0 1 194 53 L 180 53 A 80 17 0 0 0 20 53 L 6 53 Z"  fill="#E6AC00" opacity=".85"/>
  <path d="${GAP_FRONT}" fill="rgba(40,20,0,.65)"/>
</svg>`],

// ── 9. JUPITER ───────────────────────────────────────────────────────────────
['jupiter', 400, 400, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="400" height="400">
  <defs>
    <radialGradient id="g" cx="38%" cy="32%" r="65%">
      <stop offset="0%" stop-color="#FFAB91"/>
      <stop offset="100%" stop-color="#BF360C"/>
    </radialGradient>
  </defs>
  <circle cx="50" cy="50" r="47" fill="url(#g)"/>
  <!-- Bands -->
  <path d="M4 35 Q30 30 50 35 Q70 40 96 35"  stroke="rgba(180,60,20,.4)"  stroke-width="5.5" fill="none"/>
  <path d="M4 44 Q30 49 50 44 Q70 39 96 44"  stroke="rgba(220,120,60,.35)" stroke-width="4"   fill="none"/>
  <path d="M4 54 Q30 49 50 54 Q70 59 96 54"  stroke="rgba(180,60,20,.4)"  stroke-width="5"   fill="none"/>
  <path d="M4 64 Q30 69 50 64 Q70 59 96 64"  stroke="rgba(200,90,40,.35)"  stroke-width="4"   fill="none"/>
  <path d="M8 74 Q30 70 50 74 Q70 78 92 74"  stroke="rgba(180,60,20,.3)"  stroke-width="3.5" fill="none"/>
  <!-- Great Red Spot -->
  <ellipse cx="68" cy="57" rx="13" ry="9" fill="rgba(200,50,20,.6)"/>
  <ellipse cx="68" cy="57" rx="9"  ry="6" fill="rgba(230,80,40,.5)"/>
  <ellipse cx="68" cy="57" rx="5"  ry="3" fill="rgba(255,120,60,.5)"/>
  <!-- Eyes -->
  <ellipse cx="36" cy="44" rx="9" ry="8" fill="white"/>
  <ellipse cx="64" cy="44" rx="9" ry="8" fill="white"/>
  <!-- Determined brows -->
  <path d="M27 37 Q36 34 45 38" stroke="#7B1A00" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M55 38 Q64 34 73 37" stroke="#7B1A00" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="37" cy="46" r="5.5" fill="#BF360C"/>
  <circle cx="38" cy="44.5" r="2.5" fill="#111"/>
  <circle cx="39.5" cy="43.5" r="1.2" fill="white"/>
  <circle cx="65" cy="46" r="5.5" fill="#BF360C"/>
  <circle cx="66" cy="44.5" r="2.5" fill="#111"/>
  <circle cx="67.5" cy="43.5" r="1.2" fill="white"/>
  <!-- Determined grin -->
  <path d="M36 62 Q50 70 64 62" stroke="#7B1A00" stroke-width="3.5" fill="rgba(255,140,80,.3)" stroke-linecap="round"/>
  <path d="M40 62 L44 66 M56 66 L60 62" stroke="#7B1A00" stroke-width="1.5" stroke-linecap="round"/>
  <!-- Blush -->
  <ellipse cx="24" cy="54" rx="8" ry="5" fill="rgba(255,160,120,.4)"/>
  <ellipse cx="76" cy="54" rx="8" ry="5" fill="rgba(255,160,120,.4)"/>
  <!-- Shine -->
  <ellipse cx="27" cy="26" rx="15" ry="9.5" fill="rgba(255,255,255,.28)" transform="rotate(-30,27,26)"/>
</svg>`],

// ── 10. SUN (440×440, 110×110 viewBox) ───────────────────────────────────────
['sun', 440, 440, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 110" width="440" height="440">
  <defs>
    <radialGradient id="g" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#FFF9C4"/>
      <stop offset="50%"  stop-color="#FFD600"/>
      <stop offset="100%" stop-color="#FF8F00"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#FFD600" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#FF8F00" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Outer glow -->
  <circle cx="55" cy="55" r="54" fill="url(#glow)"/>
  <!-- Corona rays + ellipses -->
  ${sunRays()}
  ${sunCorona()}
  <!-- Body -->
  <circle cx="55" cy="55" r="43" fill="url(#g)"/>
  <!-- Surface texture -->
  <circle cx="38" cy="42" r="6" fill="rgba(255,200,0,.3)"/>
  <circle cx="72" cy="38" r="5" fill="rgba(255,180,0,.3)"/>
  <circle cx="75" cy="68" r="7" fill="rgba(255,160,0,.25)"/>
  <!-- Sparkle eyes -->
  <circle cx="40" cy="50" r="10" fill="white"/>
  <circle cx="70" cy="50" r="10" fill="white"/>
  <circle cx="41" cy="51" r="7" fill="#FF8F00"/>
  <circle cx="71" cy="51" r="7" fill="#FF8F00"/>
  <circle cx="42" cy="50" r="4" fill="#E65100"/>
  <circle cx="72" cy="50" r="4" fill="#E65100"/>
  <text x="36.5" y="53.5" font-size="8" fill="white">&#9733;</text>
  <text x="66.5" y="53.5" font-size="8" fill="white">&#9733;</text>
  <circle cx="44" cy="47.5" r="2" fill="rgba(255,255,255,.8)"/>
  <circle cx="74" cy="47.5" r="2" fill="rgba(255,255,255,.8)"/>
  <!-- Ecstatic smile -->
  <path d="M36 67 Q55 82 74 67" stroke="#E65100" stroke-width="4" fill="rgba(255,200,100,.4)" stroke-linecap="round"/>
  <!-- Teeth -->
  <path d="M41 70 L45 74 M50 74 L54 74 M59 74 L63 70" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>
  <!-- Blush -->
  <ellipse cx="24" cy="60" rx="10" ry="6.5" fill="rgba(255,150,50,.45)"/>
  <ellipse cx="86" cy="60" rx="10" ry="6.5" fill="rgba(255,150,50,.45)"/>
  <!-- Shine -->
  <ellipse cx="32" cy="30" rx="16" ry="10" fill="rgba(255,255,255,.35)" transform="rotate(-30,32,30)"/>
</svg>`],

];

async function main() {
  console.log('Generating planet PNGs (original style)...\n');
  for (const [name, w, h, svg] of PLANETS) {
    const out = path.join(OUT, `${name}.png`);
    await sharp(Buffer.from(svg)).png().resize(w, h).toFile(out);
    console.log(`  v ${name}.png  (${w}x${h})`);
  }
  console.log('\nDone! Images saved to assets/planets/');
}

main().catch(err => { console.error(err); process.exit(1); });
