import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

interface Props {
  x: number;
  y: number;
  /** Radius of the planet that merged — drives explosion scale */
  planetSize: number;
  /** Primary colour of the planet */
  color: string;
  scale: number;
  onDone: () => void;
}

const BASE_PARTICLES = 12;
const NUM_SPARKLES = 8;
const BASE_R = 16;

export function ExplosionEffect({ x, y, planetSize, color, scale, onDone }: Props) {
  const s = scale;
  const numDebris = Math.floor(BASE_PARTICLES * Math.sqrt(s));

  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // ── Pre-compute random particle data once ──────────────────────────────────
  const debrisData = useRef(
    Array.from({ length: numDebris }, (_, i) => ({
      angle: (i / numDebris) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
      dist: (32 + Math.random() * 28) * s,
      size: 3 + Math.random() * 3,
      // 3 colour variants: planet, white, warm gold
      colorIdx: i % 3,
    }))
  ).current;

  const sparkleData = useRef(
    Array.from({ length: NUM_SPARKLES }, (_, i) => ({
      angle: (i / NUM_SPARKLES) * Math.PI * 2 + 0.2,
      dist: (14 + Math.random() * 10) * s,
    }))
  ).current;

  // ── Animation values ───────────────────────────────────────────────────────
  const flashScale = useRef(new Animated.Value(0.1)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;

  const glowScale = useRef(new Animated.Value(0.1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  const ring1Scale = useRef(new Animated.Value(0.2)).current;
  const ring1Opacity = useRef(new Animated.Value(0.9)).current;

  const ring2Scale = useRef(new Animated.Value(0.2)).current;
  const ring2Opacity = useRef(new Animated.Value(0.7)).current;

  const debrisAnims = useRef(
    Array.from({ length: numDebris }, () => ({
      progress: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  const sparkleAnims = useRef(
    Array.from({ length: NUM_SPARKLES }, () => ({
      progress: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // ── Run animation on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const easeOut = Easing.out(Easing.quad);

    Animated.parallel([
      // White flash — fastest, sharpest
      Animated.parallel([
        Animated.timing(flashScale, {
          toValue: 2.8 * s,
          duration: 320,
          easing: easeOut,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(flashOpacity, { toValue: 1, duration: 50, useNativeDriver: true }),
          Animated.timing(flashOpacity, { toValue: 0, duration: 270, useNativeDriver: true }),
        ]),
      ]),

      // Coloured glow — slightly slower
      Animated.parallel([
        Animated.timing(glowScale, {
          toValue: 2.2 * s,
          duration: 480,
          easing: easeOut,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 0.85, duration: 70, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0, duration: 410, useNativeDriver: true }),
        ]),
      ]),

      // Shockwave ring 1 (planet colour)
      Animated.parallel([
        Animated.timing(ring1Scale, {
          toValue: 4.5 * s,
          duration: 650,
          easing: easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(ring1Opacity, { toValue: 0, duration: 650, useNativeDriver: true }),
      ]),

      // Shockwave ring 2 (white, delayed)
      Animated.sequence([
        Animated.delay(90),
        Animated.parallel([
          Animated.timing(ring2Scale, {
            toValue: 3.5 * s,
            duration: 560,
            easing: easeOut,
            useNativeDriver: true,
          }),
          Animated.timing(ring2Opacity, { toValue: 0, duration: 560, useNativeDriver: true }),
        ]),
      ]),

      // Debris particles
      ...debrisAnims.map((anim) =>
        Animated.parallel([
          Animated.timing(anim.progress, {
            toValue: 1,
            duration: 580 + Math.random() * 120,
            easing: easeOut,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(anim.opacity, { toValue: 1, duration: 60, useNativeDriver: true }),
            Animated.timing(anim.opacity, { toValue: 0, duration: 520, useNativeDriver: true }),
          ]),
        ])
      ),

      // Sparkles (fast, tiny)
      ...sparkleAnims.map((anim) =>
        Animated.parallel([
          Animated.timing(anim.progress, {
            toValue: 1,
            duration: 300,
            easing: easeOut,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(anim.opacity, { toValue: 1, duration: 40, useNativeDriver: true }),
            Animated.timing(anim.opacity, { toValue: 0, duration: 260, useNativeDriver: true }),
          ]),
        ])
      ),
    ]).start(() => onDoneRef.current());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ringSide = BASE_R * 2;
  const particleColors = [color, '#ffffff', '#FFD600'];

  return (
    <View
      style={{ position: 'absolute', left: x, top: y, width: 0, height: 0, overflow: 'visible' }}
      pointerEvents="none"
    >
      {/* ── Coloured glow disk ──────────────────────────────────── */}
      <Animated.View
        style={{
          position: 'absolute',
          width: ringSide,
          height: ringSide,
          borderRadius: BASE_R,
          backgroundColor: color,
          left: -BASE_R,
          top: -BASE_R,
          opacity: glowOpacity,
          transform: [{ scale: glowScale }],
        }}
      />

      {/* ── White flash disk ────────────────────────────────────── */}
      <Animated.View
        style={{
          position: 'absolute',
          width: ringSide * 0.55,
          height: ringSide * 0.55,
          borderRadius: BASE_R * 0.55,
          backgroundColor: '#ffffff',
          left: -BASE_R * 0.55,
          top: -BASE_R * 0.55,
          opacity: flashOpacity,
          transform: [{ scale: flashScale }],
        }}
      />

      {/* ── Shockwave ring 1 — planet colour ────────────────────── */}
      <Animated.View
        style={{
          position: 'absolute',
          width: ringSide,
          height: ringSide,
          borderRadius: BASE_R,
          borderWidth: 3,
          borderColor: color,
          backgroundColor: 'transparent',
          left: -BASE_R,
          top: -BASE_R,
          opacity: ring1Opacity,
          transform: [{ scale: ring1Scale }],
        }}
      />

      {/* ── Shockwave ring 2 — white ─────────────────────────────── */}
      <Animated.View
        style={{
          position: 'absolute',
          width: ringSide,
          height: ringSide,
          borderRadius: BASE_R,
          borderWidth: 1.5,
          borderColor: '#ffffff',
          backgroundColor: 'transparent',
          left: -BASE_R,
          top: -BASE_R,
          opacity: ring2Opacity,
          transform: [{ scale: ring2Scale }],
        }}
      />

      {/* ── Debris particles ────────────────────────────────────── */}
      {debrisAnims.map((anim, i) => {
        const d = debrisData[i];
        const pSize = Math.max(3, d.size * Math.min(s, 3));
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              width: pSize,
              height: pSize,
              borderRadius: pSize / 2,
              backgroundColor: particleColors[d.colorIdx],
              left: -pSize / 2,
              top: -pSize / 2,
              opacity: anim.opacity,
              transform: [
                {
                  translateX: anim.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, d.dist * Math.cos(d.angle)],
                  }),
                },
                {
                  translateY: anim.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, d.dist * Math.sin(d.angle)],
                  }),
                },
              ],
            }}
          />
        );
      })}

      {/* ── Sparkles ────────────────────────────────────────────── */}
      {sparkleAnims.map((anim, i) => {
        const sd = sparkleData[i];
        return (
          <Animated.View
            key={`sp${i}`}
            style={{
              position: 'absolute',
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#ffffff',
              left: -2,
              top: -2,
              opacity: anim.opacity,
              transform: [
                {
                  translateX: anim.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, sd.dist * Math.cos(sd.angle)],
                  }),
                },
                {
                  translateY: anim.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, sd.dist * Math.sin(sd.angle)],
                  }),
                },
              ],
            }}
          />
        );
      })}
    </View>
  );
}
