import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import Svg, { Polygon, Defs, RadialGradient, Stop } from 'react-native-svg';
import { RegisterBodyTransform, usePhysicsTransform } from '../hooks/usePhysicsTransform';
import { PlanetSkinId } from '../constants/cosmetics';

const STAR_SOURCES = {
  neon: require('../../assets/skins/neon/star.png'),
  pixel: require('../../assets/skins/pixel/star.png'),
  candy: require('../../assets/skins/candy/star.png'),
  mecha: require('../../assets/skins/mecha/star.png'),
  pastel: require('../../assets/skins/pastel/star.png'),
} as const;

const DIAMETER = 34; // visual diameter (physics radius = 15, a bit larger for visual flair)
const PASTEL_SPECIAL_VISUAL_SCALE = 1.09;

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
  id?: string;
  x: number;
  y: number;
  size: number;
  angle?: number;
  isDropped?: boolean;
  ghost?: boolean;  // true → semi-transparent drop preview
  registerTransform?: RegisterBodyTransform;
  skinId?: PlanetSkinId;
}

/** Full physics star rendered in the game area. */
export const StarView = React.memo(({ id, x, y, size, angle = 0, isDropped = true, ghost = false, registerTransform, skinId = 'classic' }: Props) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { positionRef, translateX, translateY, rotate: physicsRotate } = usePhysicsTransform({
    id,
    x,
    y,
    angle,
    offsetX: size,
    offsetY: size,
    registerTransform,
  });

  useEffect(() => {
    // Continuous clockwise spin
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();

    // Gentle pulse: scale 1.0 → 1.18 → 1.0 (only for live stars, not preview)
    const pulse = !ghost
      ? Animated.loop(
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
      )
      : null;
    pulse?.start();
    return () => {
      spin.stop();
      pulse?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotate = ghost ? spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  }) : physicsRotate;

  const diameter = size * 2;
  const half = size;
  const outerR = half - 1;
  const innerR = outerR * 0.42;

  const mainPts = starPoints(half, half, outerR, innerR);
  const glowPts = starPoints(half, half, outerR + 4, innerR + 3);

  return (
    <Animated.View
      ref={positionRef}
      style={{
        position: 'absolute',
        width: diameter,
        height: diameter,
        left: 0,
        top: 0,
        opacity: ghost ? 0.5 : 1,
        transform: [{ translateX }, { translateY }],
      }}
    >
      <Animated.View style={[{ width: diameter, height: diameter, transform: [{ rotate }] }]}>
      <Animated.View style={[{ width: diameter, height: diameter, transform: [{ scale: pulseAnim }] }]}>
      {skinId !== 'classic' ? (
        <Image source={STAR_SOURCES[skinId]} fadeDuration={0} resizeMode="contain" style={{ width: diameter, height: diameter, transform: [{ scale: skinId === 'pastel' ? PASTEL_SPECIAL_VISUAL_SCALE : 1 }] }} />
      ) : <>
      {/* Outer glow (soft aura) — hidden on ghost preview */}
      {!ghost && (
        <Svg width={diameter} height={diameter} style={{ position: 'absolute' }}>
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
      <Svg width={diameter} height={diameter}>
        <Polygon
          points={mainPts}
          fill="#FFD600"
          stroke="#FFFDE7"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </Svg>
      </>}
      </Animated.View>
      </Animated.View>
    </Animated.View>
  );
});

/** Small inline star thumbnail for the drop-queue preview panel. */
export const StarThumb = React.memo(({ size = 36, skinId = 'classic' }: { size?: number; skinId?: PlanetSkinId }) => {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
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
        {skinId !== 'classic' ? (
          <Image source={STAR_SOURCES[skinId]} fadeDuration={0} resizeMode="contain" style={{ width: size, height: size, transform: [{ scale: skinId === 'pastel' ? PASTEL_SPECIAL_VISUAL_SCALE : 1 }] }} />
        ) : <Svg width={size} height={size}>
          <Polygon
            points={pts}
            fill="#FFD600"
            stroke="#FFFDE7"
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        </Svg>}
      </View>
    </Animated.View>
  );
});
