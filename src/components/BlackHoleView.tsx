import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { RegisterBodyTransform, usePhysicsTransform } from '../hooks/usePhysicsTransform';
import { PlanetSkinId } from '../constants/cosmetics';

const BLACK_HOLE_SOURCES = {
  neon: require('../../assets/skins/neon/blackhole.png'),
  pixel: require('../../assets/skins/pixel/blackhole.png'),
  candy: require('../../assets/skins/candy/blackhole.png'),
  mecha: require('../../assets/skins/mecha/blackhole.png'),
  pastel: require('../../assets/skins/pastel/blackhole.png'),
} as const;

// Visual diameter is larger than physics radius (30) to show the glow aura
const DIAMETER = 75;

interface Props {
  id?: string;
  x: number;
  y: number;
  size: number;
  ghost?: boolean;
  registerTransform?: RegisterBodyTransform;
  skinId?: PlanetSkinId;
}

/** Live black hole rendered in the game area. */
export const BlackHoleView = React.memo(({ id, x, y, size, ghost = false, registerTransform, skinId = 'classic' }: Props) => {
  const diskRotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const visualDiameter = size * 2.5;
  const half = visualDiameter / 2;
  const { positionRef, translateX, translateY } = usePhysicsTransform({
    id,
    x,
    y,
    offsetX: half,
    offsetY: half,
    registerTransform,
  });

  useEffect(() => {
    // Slow rotation for the accretion disk ring
    const rotation = Animated.loop(
      Animated.timing(diskRotateAnim, {
        toValue: 1,
        duration: 2800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotation.start();

    // Subtle ominous pulse (only for live, not ghost preview)
    const pulse = !ghost
      ? Animated.loop(
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
      )
      : null;
    pulse?.start();
    return () => {
      rotation.stop();
      pulse?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const diskRotate = diskRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      ref={positionRef}
      style={{
        position: 'absolute',
        width: visualDiameter,
        height: visualDiameter,
        left: 0,
        top: 0,
        opacity: ghost ? 0.5 : 1,
        transform: [{ translateX }, { translateY }],
      }}
    >
      <Animated.View style={{ width: visualDiameter, height: visualDiameter, transform: [{ scale: pulseAnim }] }}>
      {skinId !== 'classic' ? (
        <Animated.View style={{ width: visualDiameter, height: visualDiameter, transform: [{ rotate: diskRotate }] }}>
          <Image source={BLACK_HOLE_SOURCES[skinId]} fadeDuration={0} resizeMode="contain" style={{ width: visualDiameter, height: visualDiameter }} />
        </Animated.View>
      ) : <>
      {/* Outer radial glow */}
      <Svg width={visualDiameter} height={visualDiameter} style={{ position: 'absolute' }}>
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
          width: visualDiameter,
          height: visualDiameter,
          transform: [{ rotate: diskRotate }],
        }}
      >
        <Svg width={visualDiameter} height={visualDiameter}>
          <Circle
            cx={half}
            cy={half}
            r={half * 0.6}
            fill="none"
            stroke="#9900ff"
            strokeWidth={2.5 * (size / 30)}
            strokeDasharray={`${5 * (size / 30)} ${5 * (size / 30)}`}
            strokeOpacity={ghost ? 0.4 : 0.75}
          />
        </Svg>
      </Animated.View>

      {/* Event horizon — pure black core */}
      <Svg width={visualDiameter} height={visualDiameter} style={{ position: 'absolute' }}>
        <Circle cx={half} cy={half} r={half * 0.38} fill="#000000" />
      </Svg>
      </>}
      </Animated.View>
    </Animated.View>
  );
});

/** Small black hole thumbnail for the drop-queue preview panel. */
export const BlackHoleThumb = React.memo(({ size = 36, skinId = 'classic' }: { size?: number; skinId?: PlanetSkinId }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const half = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      {skinId !== 'classic' ? (
        <Animated.View style={{ width: size, height: size, transform: [{ rotate }] }}>
          <Image source={BLACK_HOLE_SOURCES[skinId]} fadeDuration={0} resizeMode="contain" style={{ width: size, height: size }} />
        </Animated.View>
      ) : <>
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
      </>}
    </View>
  );
});
