import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Text as SvgText,
  Circle,
  Ellipse,
  Path,
  G,
} from 'react-native-svg';

interface Props {
  width?: number;
}

export function GameLogo({ width = 200 }: Props) {
  const height = width * 0.42;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const vw = 200;
  const vh = 84;

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <Svg width={width} height={height} viewBox={`0 0 ${vw} ${vh}`}>
        <Defs>
          {/* Gold gradient for SOLAR */}
          <LinearGradient id="grad_solar" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFF9C4" />
            <Stop offset="40%" stopColor="#FFD600" />
            <Stop offset="100%" stopColor="#FF8F00" />
          </LinearGradient>
          {/* Cyan gradient for MERGE */}
          <LinearGradient id="grad_merge" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#E0F7FA" />
            <Stop offset="40%" stopColor="#26C6DA" />
            <Stop offset="100%" stopColor="#006064" />
          </LinearGradient>
          {/* Sun glow */}
          <RadialGradient id="sun_glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFD600" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#FF8F00" stopOpacity="0" />
          </RadialGradient>
          {/* Text shadow / glow layer */}
          <LinearGradient id="grad_solar_glow" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FF8F00" stopOpacity="0" />
            <Stop offset="100%" stopColor="#FF8F00" stopOpacity="0.6" />
          </LinearGradient>
        </Defs>

        {/* ── Decorative orbit ring ─────────────────────────── */}
        <Ellipse cx="100" cy="42" rx="94" ry="22" fill="none"
          stroke="rgba(255,214,0,0.12)" strokeWidth="1" />
        <Ellipse cx="100" cy="42" rx="94" ry="22" fill="none"
          stroke="rgba(38,198,218,0.10)" strokeWidth="0.5" strokeDasharray="4 6" />

        {/* ── Small orbiting planets ────────────────────────── */}
        {/* Left mini moon */}
        <Circle cx="12" cy="42" r="5" fill="#C8C8D8" />
        <Circle cx="10.5" cy="40.5" r="2" fill="rgba(255,255,255,0.4)" />
        {/* Right mini sun */}
        <Circle cx="188" cy="42" r="7" fill="#FFD600" />
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <Path
            key={i}
            d={`M188 42 L${188 + 10 * Math.cos((deg * Math.PI) / 180)} ${42 + 10 * Math.sin((deg * Math.PI) / 180)}`}
            stroke="#FF8F00"
            strokeWidth={i % 2 === 0 ? 1.8 : 1.2}
            strokeLinecap="round"
            opacity="0.5"
          />
        ))}
        <Circle cx="188" cy="42" r="5.5" fill="#FFD600" />
        <Circle cx="186" cy="40" r="2" fill="rgba(255,255,255,0.5)" />

        {/* Top sparkles */}
        <SvgText x="22" y="16" fontSize="9" fill="#FFD600" opacity="0.8">✦</SvgText>
        <SvgText x="160" y="12" fontSize="7" fill="#26C6DA" opacity="0.7">✦</SvgText>
        <SvgText x="175" y="22" fontSize="5" fill="#FFD600" opacity="0.6">✦</SvgText>
        <SvgText x="10" y="22" fontSize="6" fill="#26C6DA" opacity="0.5">✦</SvgText>

        {/* ── Drop shadow layer for SOLAR ──────────────────── */}
        <SvgText
          x="101" y="48"
          fontSize="34"
          fontWeight="900"
          textAnchor="middle"
          fill="rgba(180,80,0,0.4)"
          letterSpacing="3"
        >
          SOLAR
        </SvgText>

        {/* ── SOLAR main text ───────────────────────────────── */}
        <SvgText
          x="100" y="46"
          fontSize="34"
          fontWeight="900"
          textAnchor="middle"
          fill="url(#grad_solar)"
          letterSpacing="3"
        >
          SOLAR
        </SvgText>

        {/* ── Drop shadow for MERGE ─────────────────────────── */}
        <SvgText
          x="101" y="72"
          fontSize="22"
          fontWeight="900"
          textAnchor="middle"
          fill="rgba(0,80,90,0.45)"
          letterSpacing="8"
        >
          MERGE
        </SvgText>

        {/* ── MERGE main text ───────────────────────────────── */}
        <SvgText
          x="100" y="70"
          fontSize="22"
          fontWeight="900"
          textAnchor="middle"
          fill="url(#grad_merge)"
          letterSpacing="8"
        >
          MERGE
        </SvgText>

        {/* ── Underline glow bar ────────────────────────────── */}
        <Ellipse cx="100" cy="76" rx="55" ry="3" fill="url(#grad_solar)" opacity="0.35" />
      </Svg>
    </Animated.View>
  );
}
