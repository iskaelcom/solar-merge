import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

// Visual diameter is larger than physics radius (30) to show the glow aura
const DIAMETER = 75;

interface Props {
  x: number;
  y: number;
  ghost?: boolean;
}

/** Live black hole rendered in the game area. */
export const BlackHoleView = React.memo(({ x, y, ghost = false }: Props) => {
  const diskRotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Slow rotation for the accretion disk ring
    Animated.loop(
      Animated.timing(diskRotateAnim, {
        toValue: 1,
        duration: 2800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Subtle ominous pulse (only for live, not ghost preview)
    if (!ghost) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const diskRotate = diskRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const half = DIAMETER / 2;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: DIAMETER,
        height: DIAMETER,
        left: x - half,
        top: y - half,
        opacity: ghost ? 0.5 : 1,
        transform: [{ scale: pulseAnim }],
      }}
    >
      {/* Outer radial glow */}
      <Svg width={DIAMETER} height={DIAMETER} style={{ position: 'absolute' }}>
        <Defs>
          <RadialGradient id="bh_outer" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#000000" stopOpacity="1" />
            <Stop offset="38%" stopColor="#1a003a" stopOpacity="1" />
            <Stop offset="62%" stopColor="#5500aa" stopOpacity="0.7" />
            <Stop offset="85%" stopColor="#8800ff" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#aa00ff" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={half} cy={half} r={half} fill="url(#bh_outer)" />
      </Svg>

      {/* Rotating accretion disk (dashed ring) */}
      <Animated.View
        style={{
          position: 'absolute',
          width: DIAMETER,
          height: DIAMETER,
          transform: [{ rotate: diskRotate }],
        }}
      >
        <Svg width={DIAMETER} height={DIAMETER}>
          <Circle
            cx={half}
            cy={half}
            r={half * 0.6}
            fill="none"
            stroke="#9900ff"
            strokeWidth={2.5}
            strokeDasharray="5 5"
            strokeOpacity={ghost ? 0.4 : 0.75}
          />
        </Svg>
      </Animated.View>

      {/* Event horizon — pure black core */}
      <Svg width={DIAMETER} height={DIAMETER} style={{ position: 'absolute' }}>
        <Circle cx={half} cy={half} r={half * 0.38} fill="#000000" />
      </Svg>
    </Animated.View>
  );
});

/** Small black hole thumbnail for the drop-queue preview panel. */
export const BlackHoleThumb = React.memo(({ size = 36 }: { size?: number }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const half = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      {/* Glow */}
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <RadialGradient id="bht_glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#000000" stopOpacity="1" />
            <Stop offset="55%" stopColor="#3d0080" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#7700cc" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={half} cy={half} r={half} fill="url(#bht_glow)" />
      </Svg>

      {/* Rotating dashed ring */}
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          transform: [{ rotate }],
        }}
      >
        <Svg width={size} height={size}>
          <Circle
            cx={half}
            cy={half}
            r={half * 0.6}
            fill="none"
            stroke="#9900ff"
            strokeWidth={2}
            strokeDasharray="4 4"
            strokeOpacity={0.8}
          />
        </Svg>
      </Animated.View>

      {/* Event horizon */}
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={half} cy={half} r={half * 0.38} fill="#000000" />
      </Svg>
    </View>
  );
});
