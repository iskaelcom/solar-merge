import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

interface FloatingScoreEffectProps {
  x: number;
  y: number;
  score: number;
  isNegative: boolean;
  onDone: () => void;
}

export const FloatingScoreEffect: React.FC<FloatingScoreEffectProps> = ({
  x,
  y,
  score,
  isNegative,
  onDone,
}) => {
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -50,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDone();
    });
  }, [opacity, translateY, onDone]);

  const scoreText = isNegative ? `-${Math.abs(score)}` : `+${score}`;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          left: x,
          top: y,
          transform: [{ translateY }, { translateX: -50 }],
          opacity,
        },
      ]}
    >
      <Text style={[styles.text, isNegative ? styles.textNegative : styles.textPositive]}>
        {scoreText}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
    elevation: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 40,
    overflow: 'visible',
  },
  text: {
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  textPositive: {
    color: '#00E5FF',
  },
  textNegative: {
    color: '#FF3D00',
  },
});
