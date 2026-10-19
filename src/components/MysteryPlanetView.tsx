import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Easing, Image } from 'react-native';
import { RegisterBodyTransform, usePhysicsTransform } from '../hooks/usePhysicsTransform';
import { PlanetSkinId } from '../constants/cosmetics';

const MYSTERY_SOURCES = {
  classic: require('../../assets/planets/mystery.png'),
  neon: require('../../assets/skins/neon/mystery.png'),
  pixel: require('../../assets/skins/pixel/mystery.png'),
  candy: require('../../assets/skins/candy/mystery.png'),
  mecha: require('../../assets/skins/mecha/mystery.png'),
} as const;
interface Props {
  id?: string;
  x: number;
  y: number;
  size: number;
  angle?: number;
  ghost?: boolean;
  registerTransform?: RegisterBodyTransform;
  skinId?: PlanetSkinId;
}

export const MysteryPlanetView: React.FC<Props> = React.memo(({ id, x, y, size, angle = 0, ghost = false, registerTransform, skinId = 'classic' }) => {
  const rotation = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(1)).current;

  // Use the pre-baked PNG asset
  const source = MYSTERY_SOURCES[skinId];
  const { positionRef, translateX, translateY, rotate } = usePhysicsTransform({
    id,
    x,
    y,
    angle,
    offsetX: size,
    offsetY: size,
    registerTransform,
  });

  useEffect(() => {
    // Continuous subtle breathing glow
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1.15, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 1.0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    );
    glowAnimation.start();

    const rotationAnimation = ghost
      ? Animated.loop(
        Animated.sequence([
          Animated.timing(rotation, { toValue: -1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(rotation, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
        ])
      )
      : null;
    rotationAnimation?.start();
    return () => {
      glowAnimation.stop();
      rotationAnimation?.stop();
    };
  }, [ghost, glow, rotation]);

  const positionStyle = {
      left: 0,
      top: 0,
      width: size * 2,
      height: size * 2,
      transform: [{ translateX }, { translateY }],
      opacity: ghost ? 0.6 : 1,
  };
  const displayRotate = ghost
    ? rotation.interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] })
    : rotate;

  return (
    <Animated.View ref={positionRef} style={[styles.container, positionStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: displayRotate }] }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: glow }] }]}>
          <Image source={source} style={styles.image} />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
});

export const MysteryPlanetThumb: React.FC<{ size: number; skinId?: PlanetSkinId }> = ({ size, skinId = 'classic' }) => {
  const source = MYSTERY_SOURCES[skinId];
  return (
    <Image 
      source={source} 
      style={{ width: size, height: size, resizeMode: 'contain' }} 
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});
