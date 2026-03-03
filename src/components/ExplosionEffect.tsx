import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

interface Props {
  x: number;
  y: number;
  planetSize: number;
  color: string;
  scale: number;
  onDone: () => void;
}

const NUM_DEBRIS   = 6;
const NUM_SPARKLES = 4;
const BASE_R       = 16;

export function ExplosionEffect({ x, y, color, scale, onDone }: Props) {
  const s = scale;

  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Pre-compute particle data once per mount
  const debrisData = useRef(
    Array.from({ length: NUM_DEBRIS }, (_, i) => ({
      angle: (i / NUM_DEBRIS) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
      dist:  (28 + Math.random() * 22) * s,
      size:  3 + Math.random() * 2.5,
      colorIdx: i % 3, // planet color / white / gold
    }))
  ).current;

  const sparkleData = useRef(
    Array.from({ length: NUM_SPARKLES }, (_, i) => ({
      angle: (i / NUM_SPARKLES) * Math.PI * 2 + 0.3,
      dist:  (12 + Math.random() * 8) * s,
    }))
  ).current;

  // ── 1 value per particle (instead of 2) ───────────────────────────────────
  const flashProg   = useRef(new Animated.Value(0)).current; // 1 value
  const ringProg    = useRef(new Animated.Value(0)).current; // 1 value
  const debrisProgs = useRef(
    Array.from({ length: NUM_DEBRIS },   () => new Animated.Value(0)) // 6 values
  ).current;
  const sparkleProgs = useRef(
    Array.from({ length: NUM_SPARKLES }, () => new Animated.Value(0)) // 4 values
  ).current;
  // Total: 12 Animated.Values  (was 28)

  useEffect(() => {
    const easeOut = Easing.out(Easing.quad);
    Animated.parallel([
      Animated.timing(flashProg,  { toValue: 1, duration: 220, easing: easeOut, useNativeDriver: true }),
      Animated.timing(ringProg,   { toValue: 1, duration: 400, easing: easeOut, useNativeDriver: true }),
      ...debrisProgs.map((p) =>
        Animated.timing(p, { toValue: 1, duration: 380 + Math.random() * 80, easing: easeOut, useNativeDriver: true })
      ),
      ...sparkleProgs.map((p) =>
        Animated.timing(p, { toValue: 1, duration: 200, easing: easeOut, useNativeDriver: true })
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
      {/* White flash */}
      <Animated.View
        style={{
          position: 'absolute',
          width: ringSide * 0.6,
          height: ringSide * 0.6,
          borderRadius: BASE_R * 0.6,
          backgroundColor: '#ffffff',
          left: -BASE_R * 0.6,
          top:  -BASE_R * 0.6,
          opacity: flashProg.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
          transform: [{ scale: flashProg.interpolate({ inputRange: [0, 1], outputRange: [0.4, 2.8 * s] }) }],
        }}
      />

      {/* Colored ring */}
      <Animated.View
        style={{
          position: 'absolute',
          width: ringSide,
          height: ringSide,
          borderRadius: BASE_R,
          borderWidth: 2.5,
          borderColor: color,
          backgroundColor: 'transparent',
          left: -BASE_R,
          top:  -BASE_R,
          opacity: ringProg.interpolate({ inputRange: [0, 0.08, 1], outputRange: [0, 0.9, 0] }),
          transform: [{ scale: ringProg.interpolate({ inputRange: [0, 1], outputRange: [0.3, 4.5 * s] }) }],
        }}
      />

      {/* Debris particles */}
      {debrisProgs.map((prog, i) => {
        const d = debrisData[i];
        const pSize = Math.max(3, d.size);
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
              top:  -pSize / 2,
              opacity: prog.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 0.7, 0] }),
              transform: [
                { translateX: prog.interpolate({ inputRange: [0, 1], outputRange: [0, d.dist * Math.cos(d.angle)] }) },
                { translateY: prog.interpolate({ inputRange: [0, 1], outputRange: [0, d.dist * Math.sin(d.angle)] }) },
              ],
            }}
          />
        );
      })}

      {/* Sparkles */}
      {sparkleProgs.map((prog, i) => {
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
              top:  -2,
              opacity: prog.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, 0] }),
              transform: [
                { translateX: prog.interpolate({ inputRange: [0, 1], outputRange: [0, sd.dist * Math.cos(sd.angle)] }) },
                { translateY: prog.interpolate({ inputRange: [0, 1], outputRange: [0, sd.dist * Math.sin(sd.angle)] }) },
              ],
            }}
          />
        );
      })}
    </View>
  );
}
