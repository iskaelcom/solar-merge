/**
 * Cute hand-drawn style SVG planets for Solar Merge.
 * Each planet is drawn on a 100×100 viewBox; the parent passes the final size.
 */
import React from 'react';
import Svg, {
  Circle,
  Ellipse,
  Path,
  G,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Text as SvgText,
  Rect,
  Line,
} from 'react-native-svg';

interface P { size: number; opacity?: number }

// ─── 1. MOON ───────────────────────────────────────────────────────────────
export function MoonSVG({ size, opacity = 1 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity }}>
      <Defs>
        <RadialGradient id="mg1" cx="38%" cy="32%" r="65%">
          <Stop offset="0%" stopColor="#F8F8FF" />
          <Stop offset="100%" stopColor="#B0B0C8" />
        </RadialGradient>
      </Defs>
      {/* Body */}
      <Circle cx="50" cy="50" r="47" fill="url(#mg1)" />
      {/* Craters */}
      <Circle cx="28" cy="37" r="11" fill="rgba(0,0,0,0.10)" />
      <Circle cx="26" cy="35" r="8.5" fill="rgba(255,255,255,0.07)" />
      <Circle cx="67" cy="27" r="7.5" fill="rgba(0,0,0,0.09)" />
      <Circle cx="65" cy="25" r="6" fill="rgba(255,255,255,0.06)" />
      <Circle cx="72" cy="65" r="9" fill="rgba(0,0,0,0.09)" />
      <Circle cx="70" cy="63" r="7" fill="rgba(255,255,255,0.06)" />
      <Circle cx="42" cy="72" r="5" fill="rgba(0,0,0,0.08)" />
      {/* Closed sleepy eyes */}
      <Path d="M35 49 Q40 44 45 49" stroke="#7878B0" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Path d="M55 49 Q60 44 65 49" stroke="#7878B0" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Eyelashes */}
      <Line x1="38" y1="46" x2="37" y2="43" stroke="#7878B0" strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="58" y1="46" x2="57" y2="43" stroke="#7878B0" strokeWidth="1.5" strokeLinecap="round" />
      {/* zzz */}
      <SvgText x="70" y="44" fontSize="10" fill="#A0A0CC" fontWeight="bold">z</SvgText>
      <SvgText x="76" y="37" fontSize="8" fill="#A0A0CC" fontWeight="bold">z</SvgText>
      {/* Smile */}
      <Path d="M42 61 Q50 68 58 61" stroke="#8080B0" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Blush */}
      <Ellipse cx="33" cy="58" rx="7" ry="4.5" fill="rgba(255,160,160,0.35)" />
      <Ellipse cx="67" cy="58" rx="7" ry="4.5" fill="rgba(255,160,160,0.35)" />
      {/* Shine */}
      <Ellipse cx="27" cy="27" rx="11" ry="7.5" fill="rgba(255,255,255,0.32)" transform="rotate(-30,27,27)" />
    </Svg>
  );
}

// ─── 2. MERCURY ────────────────────────────────────────────────────────────
export function MercurySVG({ size, opacity = 1 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity }}>
      <Defs>
        <RadialGradient id="mg2" cx="38%" cy="32%" r="65%">
          <Stop offset="0%" stopColor="#D0D0D8" />
          <Stop offset="100%" stopColor="#686870" />
        </RadialGradient>
      </Defs>
      <Circle cx="50" cy="50" r="47" fill="url(#mg2)" />
      {/* Surface craters */}
      <Circle cx="30" cy="35" r="10" fill="rgba(0,0,0,0.13)" />
      <Circle cx="28" cy="33" r="8" fill="rgba(255,255,255,0.07)" />
      <Circle cx="65" cy="30" r="7.5" fill="rgba(0,0,0,0.12)" />
      <Circle cx="63" cy="28" r="6" fill="rgba(255,255,255,0.06)" />
      <Circle cx="62" cy="67" r="8.5" fill="rgba(0,0,0,0.11)" />
      <Circle cx="34" cy="70" r="6" fill="rgba(0,0,0,0.10)" />
      {/* Dizzy spiral eyes */}
      <Circle cx="38" cy="48" r="9" fill="rgba(0,0,0,0.15)" />
      <Path d="M38 43 Q43 43 43 48 Q43 53 38 53 Q33 53 33 48 Q33 45 36 44" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <Circle cx="38" cy="48" r="2.5" fill="#222" />
      <Circle cx="62" cy="48" r="9" fill="rgba(0,0,0,0.15)" />
      <Path d="M62 43 Q67 43 67 48 Q67 53 62 53 Q57 53 57 48 Q57 45 60 44" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <Circle cx="62" cy="48" r="2.5" fill="#222" />
      {/* Stars (dizzy) */}
      <SvgText x="18" y="26" fontSize="11" fill="#FFD700">★</SvgText>
      <SvgText x="72" y="23" fontSize="9" fill="#FFD700">★</SvgText>
      {/* Wavy mouth */}
      <Path d="M39 63 Q44 67 50 63 Q56 59 61 63" stroke="#555" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Shine */}
      <Ellipse cx="27" cy="27" rx="11" ry="7.5" fill="rgba(255,255,255,0.28)" transform="rotate(-30,27,27)" />
    </Svg>
  );
}

// ─── 3. MARS ───────────────────────────────────────────────────────────────
export function MarsSVG({ size, opacity = 1 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity }}>
      <Defs>
        <RadialGradient id="mg3" cx="38%" cy="32%" r="65%">
          <Stop offset="0%" stopColor="#FF8A80" />
          <Stop offset="100%" stopColor="#C62828" />
        </RadialGradient>
      </Defs>
      <Circle cx="50" cy="50" r="47" fill="url(#mg3)" />
      {/* Subtle surface texture */}
      <Circle cx="30" cy="38" r="7" fill="rgba(180,30,20,0.2)" />
      <Circle cx="68" cy="32" r="5" fill="rgba(180,30,20,0.18)" />
      <Circle cx="72" cy="65" r="6" fill="rgba(180,30,20,0.18)" />
      {/* North polar ice cap (small, at very top) */}
      <Ellipse cx="50" cy="12" rx="14" ry="7" fill="rgba(255,255,255,0.82)" />
      {/* Angry V-shaped brows */}
      <Path d="M30 43 L40 38 L46 42" stroke="#7B1010" strokeWidth="4" fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M54 42 L60 38 L70 43" stroke="#7B1010" strokeWidth="4" fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Eyes — white base + coloured iris + dark pupil */}
      <Circle cx="38" cy="52" r="9" fill="white" />
      <Circle cx="62" cy="52" r="9" fill="white" />
      <Circle cx="38" cy="53" r="6" fill="#FF5252" />
      <Circle cx="62" cy="53" r="6" fill="#FF5252" />
      <Circle cx="39" cy="52" r="3.2" fill="#1A0000" />
      <Circle cx="63" cy="52" r="3.2" fill="#1A0000" />
      <Circle cx="40.5" cy="50.5" r="1.3" fill="white" />
      <Circle cx="64.5" cy="50.5" r="1.3" fill="white" />
      {/* Angry half-lid */}
      <Path d="M29 49 Q38 44 47 49" fill="#C62828" />
      <Path d="M53 49 Q62 44 71 49" fill="#C62828" />
      {/* Puffed cheeks */}
      <Ellipse cx="26" cy="61" rx="10" ry="7.5" fill="rgba(255,160,130,0.45)" />
      <Ellipse cx="74" cy="61" rx="10" ry="7.5" fill="rgba(255,160,130,0.45)" />
      {/* Grumpy downturned mouth */}
      <Path d="M38 68 Q50 63 62 68" stroke="#8B1010" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {/* Shine */}
      <Ellipse cx="27" cy="27" rx="12" ry="8" fill="rgba(255,255,255,0.28)" transform="rotate(-30,27,27)" />
    </Svg>
  );
}

// ─── 4. VENUS ──────────────────────────────────────────────────────────────
export function VenusSVG({ size, opacity = 1 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity }}>
      <Defs>
        <RadialGradient id="mg4" cx="38%" cy="32%" r="65%">
          <Stop offset="0%" stopColor="#FFE57F" />
          <Stop offset="100%" stopColor="#FF8F00" />
        </RadialGradient>
      </Defs>
      <Circle cx="50" cy="50" r="47" fill="url(#mg4)" />
      {/* Cloud swirls */}
      <Path d="M20 35 Q35 28 50 35 Q65 42 80 35" stroke="rgba(255,255,255,0.5)" strokeWidth="3" fill="none" />
      <Path d="M15 50 Q35 43 55 50 Q70 57 85 50" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" fill="none" />
      <Path d="M22 65 Q40 58 58 65 Q72 72 80 65" stroke="rgba(255,255,255,0.45)" strokeWidth="2" fill="none" />
      {/* Heart eyes */}
      <Path d="M33 44 Q33 39 38 39 Q43 39 43 44 Q43 49 38 53 Q33 49 33 44Z" fill="#E91E63" />
      <Path d="M57 44 Q57 39 62 39 Q67 39 67 44 Q67 49 62 53 Q57 49 57 44Z" fill="#E91E63" />
      <Circle cx="36.5" cy="41" r="2.5" fill="rgba(255,255,255,0.6)" />
      <Circle cx="60.5" cy="41" r="2.5" fill="rgba(255,255,255,0.6)" />
      {/* Star sparkles */}
      <SvgText x="72" y="32" fontSize="10" fill="#FFF59D">✦</SvgText>
      <SvgText x="20" y="28" fontSize="8" fill="#FFF59D">✦</SvgText>
      <SvgText x="78" y="62" fontSize="7" fill="#FFF59D">✦</SvgText>
      {/* Big smile */}
      <Path d="M37 63 Q50 75 63 63" stroke="#E65100" strokeWidth="3" fill="rgba(255,160,0,0.3)" strokeLinecap="round" />
      {/* Blush */}
      <Ellipse cx="28" cy="56" rx="9" ry="5.5" fill="rgba(255,100,50,0.35)" />
      <Ellipse cx="72" cy="56" rx="9" ry="5.5" fill="rgba(255,100,50,0.35)" />
      {/* Shine */}
      <Ellipse cx="27" cy="27" rx="13" ry="8.5" fill="rgba(255,255,255,0.32)" transform="rotate(-30,27,27)" />
    </Svg>
  );
}

// ─── 5. EARTH ──────────────────────────────────────────────────────────────
export function EarthSVG({ size, opacity = 1 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity }}>
      <Defs>
        <RadialGradient id="mg5" cx="38%" cy="32%" r="65%">
          <Stop offset="0%" stopColor="#64B5F6" />
          <Stop offset="100%" stopColor="#1565C0" />
        </RadialGradient>
      </Defs>
      <Circle cx="50" cy="50" r="47" fill="url(#mg5)" />
      {/* Continents */}
      <Path d="M28 35 Q35 28 45 32 Q50 35 48 43 Q44 48 38 46 Q30 44 28 35Z" fill="#4CAF50" opacity="0.9" />
      <Path d="M52 30 Q62 25 70 33 Q75 40 70 48 Q63 52 56 48 Q50 44 52 30Z" fill="#4CAF50" opacity="0.85" />
      <Path d="M35 55 Q42 50 50 54 Q55 58 52 68 Q46 73 38 68 Q32 62 35 55Z" fill="#66BB6A" opacity="0.85" />
      <Path d="M60 58 Q67 54 73 60 Q76 66 70 72 Q63 75 58 69 Q56 63 60 58Z" fill="#4CAF50" opacity="0.8" />
      {/* Cloud wisps */}
      <Ellipse cx="30" cy="28" rx="10" ry="5" fill="rgba(255,255,255,0.7)" />
      <Ellipse cx="65" cy="24" rx="8" ry="4.5" fill="rgba(255,255,255,0.65)" />
      <Ellipse cx="50" cy="75" rx="9" ry="4" fill="rgba(255,255,255,0.6)" />
      {/* Eyes */}
      <Circle cx="38" cy="47" r="7.5" fill="white" />
      <Circle cx="62" cy="47" r="7.5" fill="white" />
      <Circle cx="39.5" cy="48" r="5" fill="#1E88E5" />
      <Circle cx="63.5" cy="48" r="5" fill="#1E88E5" />
      <Circle cx="40.5" cy="47" r="2.5" fill="#111" />
      <Circle cx="64.5" cy="47" r="2.5" fill="#111" />
      <Circle cx="41.5" cy="46" r="1.2" fill="white" />
      <Circle cx="65.5" cy="46" r="1.2" fill="white" />
      {/* Happy smile */}
      <Path d="M39 62 Q50 72 61 62" stroke="#0D47A1" strokeWidth="3" fill="rgba(100,200,255,0.2)" strokeLinecap="round" />
      {/* Blush */}
      <Ellipse cx="28" cy="56" rx="8" ry="5" fill="rgba(200,230,255,0.5)" />
      <Ellipse cx="72" cy="56" rx="8" ry="5" fill="rgba(200,230,255,0.5)" />
      {/* Shine */}
      <Ellipse cx="27" cy="27" rx="13" ry="8" fill="rgba(255,255,255,0.3)" transform="rotate(-30,27,27)" />
    </Svg>
  );
}

// ─── 6. NEPTUNE ────────────────────────────────────────────────────────────
export function NeptuneSVG({ size, opacity = 1 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity }}>
      <Defs>
        <RadialGradient id="mg6" cx="38%" cy="32%" r="65%">
          <Stop offset="0%" stopColor="#7986CB" />
          <Stop offset="100%" stopColor="#1A237E" />
        </RadialGradient>
      </Defs>
      <Circle cx="50" cy="50" r="47" fill="url(#mg6)" />
      {/* Storm bands */}
      <Path d="M8 40 Q30 35 50 40 Q70 45 92 40" stroke="rgba(100,120,220,0.5)" strokeWidth="4" fill="none" />
      <Path d="M8 55 Q30 60 50 55 Q70 50 92 55" stroke="rgba(80,100,200,0.45)" strokeWidth="3" fill="none" />
      <Path d="M15 68 Q35 65 55 68 Q72 71 85 68" stroke="rgba(90,110,210,0.4)" strokeWidth="2.5" fill="none" />
      {/* Large storm spot */}
      <Ellipse cx="65" cy="48" rx="14" ry="9" fill="rgba(120,140,240,0.45)" />
      <Ellipse cx="65" cy="48" rx="9" ry="6" fill="rgba(150,160,255,0.35)" />
      {/* Mysterious half-closed eyes */}
      <Ellipse cx="37" cy="47" rx="9" ry="7" fill="#1A237E" />
      <Ellipse cx="37" cy="47" rx="6" ry="5" fill="white" />
      {/* Half lid */}
      <Path d="M28 47 Q37 41 46 47" fill="#3949AB" />
      <Circle cx="37" cy="49" r="3" fill="#0D1366" />
      <Circle cx="38" cy="48" r="1.2" fill="white" />
      <Ellipse cx="63" cy="47" rx="9" ry="7" fill="#1A237E" />
      <Ellipse cx="63" cy="47" rx="6" ry="5" fill="white" />
      <Path d="M54 47 Q63 41 72 47" fill="#3949AB" />
      <Circle cx="63" cy="49" r="3" fill="#0D1366" />
      <Circle cx="64" cy="48" r="1.2" fill="white" />
      {/* Smug smile */}
      <Path d="M40 63 Q50 68 60 63" stroke="#3949AB" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Blush stars */}
      <SvgText x="24" y="60" fontSize="9" fill="rgba(150,180,255,0.7)">✦</SvgText>
      <SvgText x="68" y="60" fontSize="9" fill="rgba(150,180,255,0.7)">✦</SvgText>
      {/* Shine */}
      <Ellipse cx="27" cy="27" rx="13" ry="8" fill="rgba(255,255,255,0.25)" transform="rotate(-30,27,27)" />
    </Svg>
  );
}

// ─── 7. URANUS ─────────────────────────────────────────────────────────────
export function UranusSVG({ size, opacity = 1 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity }}>
      <Defs>
        <RadialGradient id="mg7" cx="38%" cy="32%" r="65%">
          <Stop offset="0%" stopColor="#80DEEA" />
          <Stop offset="100%" stopColor="#00838F" />
        </RadialGradient>
      </Defs>
      <Circle cx="50" cy="50" r="47" fill="url(#mg7)" />
      {/* Horizontal rings (Uranus tilted 98°) */}
      <Ellipse cx="50" cy="50" rx="60" ry="16" fill="none" stroke="rgba(200,240,245,0.5)" strokeWidth="4" />
      <Ellipse cx="50" cy="50" rx="65" ry="18" fill="none" stroke="rgba(180,230,240,0.35)" strokeWidth="2.5" />
      {/* Subtle bands */}
      <Path d="M10 42 Q35 38 50 42 Q65 46 90 42" stroke="rgba(0,150,160,0.3)" strokeWidth="3" fill="none" />
      <Path d="M10 58 Q35 62 50 58 Q65 54 90 58" stroke="rgba(0,150,160,0.3)" strokeWidth="2.5" fill="none" />
      {/* Silly big eyes */}
      <Circle cx="36" cy="46" r="9.5" fill="white" />
      <Circle cx="64" cy="46" r="9.5" fill="white" />
      <Circle cx="37.5" cy="47" r="6.5" fill="#00838F" />
      <Circle cx="65.5" cy="47" r="6.5" fill="#00838F" />
      <Circle cx="38" cy="46" r="3.5" fill="#003" />
      <Circle cx="66" cy="46" r="3.5" fill="#003" />
      <Circle cx="39.5" cy="44.5" r="1.5" fill="white" />
      <Circle cx="67.5" cy="44.5" r="1.5" fill="white" />
      {/* Googly effect (one pupil off center) */}
      <Circle cx="35" cy="48" r="2" fill="rgba(0,100,110,0.4)" />
      {/* Tongue sticking out (silly) */}
      <Path d="M43 62 Q50 57 57 62" stroke="#006064" strokeWidth="2.5" fill="rgba(0,160,170,0.2)" strokeLinecap="round" />
      <Ellipse cx="50" cy="65" rx="6" ry="4.5" fill="#FF6090" />
      <Line x1="50" y1="62" x2="50" y2="69" stroke="#CC3060" strokeWidth="1.5" />
      {/* Blush */}
      <Ellipse cx="24" cy="55" rx="8" ry="5" fill="rgba(200,250,255,0.45)" />
      <Ellipse cx="76" cy="55" rx="8" ry="5" fill="rgba(200,250,255,0.45)" />
      {/* Shine */}
      <Ellipse cx="27" cy="27" rx="13" ry="8" fill="rgba(255,255,255,0.28)" transform="rotate(-30,27,27)" />
    </Svg>
  );
}

// ─── 8. SATURN ─────────────────────────────────────────────────────────────
// viewBox is 200×100 (2:1). Planet body at center (100,50) r=44.
// Ring center (100,53). Outer rx=94,ry=20; Inner rx=58,ry=12.
// PlanetView renders this with svgWidth = diameter*2, svgHeight = diameter.
//
// Arc directions (screen-coords, y-down):
//   From LEFT endpoint CCW (sweep=0) → goes UP through TOP → UPPER arc
//   From LEFT endpoint CW  (sweep=1) → goes DOWN through BOTTOM → LOWER arc
//   From RIGHT endpoint CW  (sweep=1) → goes UP through TOP → UPPER arc (reverse)
//   From RIGHT endpoint CCW (sweep=0) → goes DOWN through BOTTOM → LOWER arc (reverse)
//
// BACK ring  (upper half, drawn BEFORE planet):
//   Outer L→R via TOP:  M 6 53  A 94 20 0 0 0 194 53
//   Inner R→L via TOP:  L 142 53 A 58 12 0 0 1 58 53  L 6 53 Z
//
// FRONT ring (lower half, drawn AFTER planet):
//   Outer L→R via BTM:  M 6 53  A 94 20 0 0 1 194 53
//   Inner R→L via BTM:  L 142 53 A 58 12 0 0 0 58 53  L 6 53 Z
export function SaturnSVG({ size, opacity = 1 }: P) {
  const svgW = size * 2;   // caller (PlanetView) passes diameter as size; SVG is 2× wide
  const svgH = size;

  // Cassini-division gap ring paths (thin dark band between A and B rings)
  // Gap: outer rx=77,ry=16.5; inner rx=73,ry=15.5 — endpoints: L=(23,53) R=(177,53)
  const GAP_BACK  = 'M 23 53 A 77 16.5 0 0 0 177 53 L 173 53 A 73 15.5 0 0 1 27 53 L 23 53 Z';
  const GAP_FRONT = 'M 23 53 A 77 16.5 0 0 1 177 53 L 173 53 A 73 15.5 0 0 0 27 53 L 23 53 Z';

  return (
    <Svg width={svgW} height={svgH} viewBox="0 0 200 100" style={{ opacity }}>
      <Defs>
        <RadialGradient id="mg8" cx="40%" cy="34%" r="62%">
          <Stop offset="0%" stopColor="#FFF59D" />
          <Stop offset="55%" stopColor="#FFD54F" />
          <Stop offset="100%" stopColor="#E65100" />
        </RadialGradient>
      </Defs>

      {/* ══ BACK RING — upper half, behind planet ══ */}
      {/* B-ring (inner, bright) */}
      <Path d="M 58 53 A 58 12 0 0 0 142 53 L 128 53 A 44 9 0 0 1 72 53 L 58 53 Z"
        fill="#FFE082" opacity="0.9" />
      {/* A-ring (outer, golden) */}
      <Path d="M 6 53 A 94 20 0 0 0 194 53 L 180 53 A 80 17 0 0 1 20 53 L 6 53 Z"
        fill="#C49A00" opacity="0.8" />
      {/* Cassini gap (dark) */}
      <Path d={GAP_BACK} fill="rgba(40,20,0,0.7)" />

      {/* ══ PLANET BODY ══ */}
      <Circle cx="100" cy="50" r="44" fill="url(#mg8)" />
      {/* Bands */}
      <Path d="M58 42 Q80 38 100 42 Q120 46 142 42" stroke="rgba(200,100,0,0.28)" strokeWidth="4" fill="none" />
      <Path d="M58 50 Q80 54 100 50 Q120 46 142 50" stroke="rgba(200,120,0,0.22)" strokeWidth="3" fill="none" />
      <Path d="M60 58 Q80 62 100 58 Q120 54 140 58" stroke="rgba(200,100,0,0.22)" strokeWidth="2.5" fill="none" />

      {/* Sunglasses frame */}
      <Rect x="76" y="38" width="21" height="15" rx="6" ry="6" fill="#1A1A2E" />
      <Rect x="103" y="38" width="21" height="15" rx="6" ry="6" fill="#1A1A2E" />
      <Line x1="97" y1="45.5" x2="103" y2="45.5" stroke="#333" strokeWidth="2.5" />
      <Rect x="78" y="40" width="17" height="11" rx="5" ry="5" fill="#1565C0" opacity="0.9" />
      <Rect x="105" y="40" width="17" height="11" rx="5" ry="5" fill="#1565C0" opacity="0.9" />
      <Ellipse cx="83" cy="43" rx="4" ry="3" fill="rgba(255,255,255,0.28)" />
      <Ellipse cx="110" cy="43" rx="4" ry="3" fill="rgba(255,255,255,0.28)" />
      {/* Smile */}
      <Path d="M86 64 Q100 74 114 64" stroke="#8D3500" strokeWidth="3.5"
        fill="rgba(255,180,80,0.25)" strokeLinecap="round" />
      {/* Shine */}
      <Ellipse cx="78" cy="28" rx="14" ry="9" fill="rgba(255,255,255,0.32)" transform="rotate(-30,78,28)" />

      {/* ══ FRONT RING — lower half, in front of planet ══ */}
      {/* B-ring front */}
      <Path d="M 58 53 A 58 12 0 0 1 142 53 L 128 53 A 44 9 0 0 0 72 53 L 58 53 Z"
        fill="#FFD600" opacity="0.92" />
      {/* A-ring front */}
      <Path d="M 6 53 A 94 20 0 0 1 194 53 L 180 53 A 80 17 0 0 0 20 53 L 6 53 Z"
        fill="#E6AC00" opacity="0.85" />
      {/* Cassini gap front */}
      <Path d={GAP_FRONT} fill="rgba(40,20,0,0.65)" />
    </Svg>
  );
}

// ─── 9. JUPITER ────────────────────────────────────────────────────────────
export function JupiterSVG({ size, opacity = 1 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity }}>
      <Defs>
        <RadialGradient id="mg9" cx="38%" cy="32%" r="65%">
          <Stop offset="0%" stopColor="#FFAB91" />
          <Stop offset="100%" stopColor="#BF360C" />
        </RadialGradient>
      </Defs>
      <Circle cx="50" cy="50" r="47" fill="url(#mg9)" />
      {/* Horizontal bands */}
      <Path d="M4 35 Q30 30 50 35 Q70 40 96 35" stroke="rgba(180,60,20,0.4)" strokeWidth="5.5" fill="none" />
      <Path d="M4 44 Q30 49 50 44 Q70 39 96 44" stroke="rgba(220,120,60,0.35)" strokeWidth="4" fill="none" />
      <Path d="M4 54 Q30 49 50 54 Q70 59 96 54" stroke="rgba(180,60,20,0.4)" strokeWidth="5" fill="none" />
      <Path d="M4 64 Q30 69 50 64 Q70 59 96 64" stroke="rgba(200,90,40,0.35)" strokeWidth="4" fill="none" />
      <Path d="M8 74 Q30 70 50 74 Q70 78 92 74" stroke="rgba(180,60,20,0.3)" strokeWidth="3.5" fill="none" />
      {/* Great Red Spot */}
      <Ellipse cx="68" cy="57" rx="13" ry="9" fill="rgba(200,50,20,0.6)" />
      <Ellipse cx="68" cy="57" rx="9" ry="6" fill="rgba(230,80,40,0.5)" />
      <Ellipse cx="68" cy="57" rx="5" ry="3" fill="rgba(255,120,60,0.5)" />
      {/* Strong/flex eyes */}
      <Ellipse cx="36" cy="44" rx="9" ry="8" fill="white" />
      <Ellipse cx="64" cy="44" rx="9" ry="8" fill="white" />
      {/* Determined brows */}
      <Path d="M27 37 Q36 34 45 38" stroke="#7B1A00" strokeWidth="4" fill="none" strokeLinecap="round" />
      <Path d="M55 38 Q64 34 73 37" stroke="#7B1A00" strokeWidth="4" fill="none" strokeLinecap="round" />
      <Circle cx="37" cy="46" r="5.5" fill="#BF360C" />
      <Circle cx="38" cy="44.5" r="2.5" fill="#111" />
      <Circle cx="39.5" cy="43.5" r="1.2" fill="white" />
      <Circle cx="65" cy="46" r="5.5" fill="#BF360C" />
      <Circle cx="66" cy="44.5" r="2.5" fill="#111" />
      <Circle cx="67.5" cy="43.5" r="1.2" fill="white" />
      {/* Determined grin */}
      <Path d="M36 62 Q50 70 64 62" stroke="#7B1A00" strokeWidth="3.5" fill="rgba(255,140,80,0.3)" strokeLinecap="round" />
      <Path d="M40 62 L44 66 M56 66 L60 62" stroke="#7B1A00" strokeWidth="1.5" strokeLinecap="round" />
      {/* Blush */}
      <Ellipse cx="24" cy="54" rx="8" ry="5" fill="rgba(255,160,120,0.4)" />
      <Ellipse cx="76" cy="54" rx="8" ry="5" fill="rgba(255,160,120,0.4)" />
      {/* Shine */}
      <Ellipse cx="27" cy="26" rx="15" ry="9.5" fill="rgba(255,255,255,0.28)" transform="rotate(-30,27,26)" />
    </Svg>
  );
}

// ─── 10. SUN ───────────────────────────────────────────────────────────────
export function SunSVG({ size, opacity = 1 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110" style={{ opacity }}>
      <Defs>
        <RadialGradient id="mg10" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFF9C4" />
          <Stop offset="50%" stopColor="#FFD600" />
          <Stop offset="100%" stopColor="#FF8F00" />
        </RadialGradient>
        <RadialGradient id="glow10" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFD600" stopOpacity="0.6" />
          <Stop offset="100%" stopColor="#FF8F00" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      {/* Outer glow */}
      <Circle cx="55" cy="55" r="54" fill="url(#glow10)" />
      {/* Corona rays */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
        <Path
          key={i}
          d={`M55 55 L${55 + 48 * Math.cos((deg * Math.PI) / 180)} ${55 + 48 * Math.sin((deg * Math.PI) / 180)}`}
          stroke="#FF8F00"
          strokeWidth={i % 2 === 0 ? 5 : 3}
          strokeLinecap="round"
          opacity="0.6"
        />
      ))}
      {/* Wavy corona */}
      {[15, 75, 135, 195, 255, 315].map((deg, i) => (
        <Ellipse
          key={i}
          cx={55 + 48 * Math.cos((deg * Math.PI) / 180)}
          cy={55 + 48 * Math.sin((deg * Math.PI) / 180)}
          rx="8"
          ry="4"
          fill="#FFD600"
          opacity="0.45"
          transform={`rotate(${deg + 90}, ${55 + 48 * Math.cos((deg * Math.PI) / 180)}, ${55 + 48 * Math.sin((deg * Math.PI) / 180)})`}
        />
      ))}
      {/* Body */}
      <Circle cx="55" cy="55" r="43" fill="url(#mg10)" />
      {/* Solar surface texture */}
      <Circle cx="38" cy="42" r="6" fill="rgba(255,200,0,0.3)" />
      <Circle cx="72" cy="38" r="5" fill="rgba(255,180,0,0.3)" />
      <Circle cx="75" cy="68" r="7" fill="rgba(255,160,0,0.25)" />
      {/* Sparkle eyes */}
      <Circle cx="40" cy="50" r="10" fill="white" />
      <Circle cx="70" cy="50" r="10" fill="white" />
      <Circle cx="41" cy="51" r="7" fill="#FF8F00" />
      <Circle cx="71" cy="51" r="7" fill="#FF8F00" />
      <Circle cx="42" cy="50" r="4" fill="#E65100" />
      <Circle cx="72" cy="50" r="4" fill="#E65100" />
      {/* Star pupils */}
      <SvgText x="36.5" y="53.5" fontSize="8" fill="white">★</SvgText>
      <SvgText x="66.5" y="53.5" fontSize="8" fill="white">★</SvgText>
      <Circle cx="44" cy="47.5" r="2" fill="rgba(255,255,255,0.8)" />
      <Circle cx="74" cy="47.5" r="2" fill="rgba(255,255,255,0.8)" />
      {/* Ecstatic huge smile */}
      <Path d="M36 67 Q55 82 74 67" stroke="#E65100" strokeWidth="4" fill="rgba(255,200,100,0.4)" strokeLinecap="round" />
      {/* Teeth */}
      <Path d="M41 70 L45 74 M50 74 L54 74 M59 74 L63 70" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      {/* Blush */}
      <Ellipse cx="24" cy="60" rx="10" ry="6.5" fill="rgba(255,150,50,0.45)" />
      <Ellipse cx="86" cy="60" rx="10" ry="6.5" fill="rgba(255,150,50,0.45)" />
      {/* Shine */}
      <Ellipse cx="32" cy="30" rx="16" ry="10" fill="rgba(255,255,255,0.35)" transform="rotate(-30,32,30)" />
    </Svg>
  );
}

// ─── Lookup map ─────────────────────────────────────────────────────────────
export const PLANET_SVG_MAP: Record<number, React.ComponentType<P>> = {
  1: MoonSVG,
  2: MercurySVG,
  3: MarsSVG,
  4: VenusSVG,
  5: EarthSVG,
  6: NeptuneSVG,
  7: UranusSVG,
  8: SaturnSVG,
  9: JupiterSVG,
  10: SunSVG,
};
