import React, { useEffect, useRef } from 'react';
import { Animated, Image } from 'react-native';

interface Props {
  width?: number;
}

export function GameLogo({ width = 200 }: Props) {
  // Original PNG is 600×252 (3× of 200×84 viewBox)
  const height = Math.round(width * (84 / 200));
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <Image
        source={require('../../assets/logo.png')}
        style={{ width, height }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}
