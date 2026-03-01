import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Polygon, Defs, RadialGradient, Stop } from 'react-native-svg';

const DIAMETER = 34; // visual diameter (physics radius = 15, a bit larger for visual flair)

/** Compute points string for a 5-pointed star centered at (cx, cy). */
function starPoints(cx: number, cy: number, outerR: number, innerR: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * 36 - 90) * (Math.PI / 180);
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

interface Props {
  x: number;
  y: number;
  ghost?: boolean;  // true → semi-transparent drop preview
}

/** Full physics star rendered in the game area. */
export const StarView = React.memo(({ x, y, ghost = false }: Props) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Continuous clockwise spin
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Gentle pulse: scale 1.0 → 1.18 → 1.0 (only for live stars, not preview)
    if (!ghost) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.18,
            duration: 650,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 650,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const half = DIAMETER / 2;
  const outerR = half - 1;
  const innerR = outerR * 0.42;

  const mainPts = starPoints(half, half, outerR, innerR);
  const glowPts = starPoints(half, half, outerR + 4, innerR + 3);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: DIAMETER,
        height: DIAMETER,
        left: x - half,
        top: y - half,
        opacity: ghost ? 0.5 : 1,
        transform: [{ rotate }, { scale: pulseAnim }],
      }}
    >
      {/* Outer glow (soft aura) — hidden on ghost preview */}
      {!ghost && (
        <Svg width={DIAMETER} height={DIAMETER} style={{ position: 'absolute' }}>
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFD600" stopOpacity="0.55" />
              <Stop offset="100%" stopColor="#FF8F00" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Polygon points={glowPts} fill="url(#glow)" />
        </Svg>
      )}

      {/* Main star body */}
      <Svg width={DIAMETER} height={DIAMETER}>
        <Polygon
          points={mainPts}
          fill="#FFD600"
          stroke="#FFFDE7"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
});

/** Small inline star thumbnail for the drop-queue preview panel. */
export const StarThumb = React.memo(({ size = 36 }: { size?: number }) => {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const half = size / 2;
  const outerR = half - 1;
  const innerR = outerR * 0.42;
  const pts = starPoints(half, half, outerR, innerR);

  return (
    <Animated.View
      style={{ width: size, height: size, transform: [{ rotate }] }}
    >
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Polygon
            points={pts}
            fill="#FFD600"
            stroke="#FFFDE7"
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </Animated.View>
  );
});
