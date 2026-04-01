import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Easing, Image } from 'react-native';
import { MYSTERY_PLANET_RADIUS } from '../constants';

interface Props {
  x: number;
  y: number;
  angle?: number;
  ghost?: boolean;
}

export const MysteryPlanetView: React.FC<Props> = React.memo(({ x, y, angle = 0, ghost = false }) => {
  const rotation = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(1)).current;

  // Use the pre-baked PNG asset
  const source = require('../../assets/planets/mystery.png');

  useEffect(() => {
    // Continuous subtle breathing glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1.15, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 1.0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();

    if (ghost) {
      // Gentle floating rotation for the preview ghost
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotation, { toValue: -1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(rotation, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
        ])
      ).start();
    }
  }, [ghost, glow, rotation]);

  const animatedStyle = {
      left: x - MYSTERY_PLANET_RADIUS,
      top: y - MYSTERY_PLANET_RADIUS,
      transform: [
        { 
          rotate: ghost ? rotation.interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] }) : `${(angle * 180) / Math.PI}deg`
        },
        { scale: glow }
      ],
      opacity: ghost ? 0.6 : 1,
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Animated.Image source={source} style={styles.image} />
    </Animated.View>
  );
});

export const MysteryPlanetThumb: React.FC<{ size: number }> = ({ size }) => {
  const source = require('../../assets/planets/mystery.png');
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
    width: MYSTERY_PLANET_RADIUS * 2,
    height: MYSTERY_PLANET_RADIUS * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: MYSTERY_PLANET_RADIUS * 2,
    height: MYSTERY_PLANET_RADIUS * 2,
    resizeMode: 'contain',
  },
});
