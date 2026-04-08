import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';

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
  const VISIBLE_DURATION_MS = 800;
  const FLOAT_UP_DURATION_MS = 800;
  const FADE_OUT_DURATION_MS = 600;

  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(translateY, {
        toValue: -50,
        duration: FLOAT_UP_DURATION_MS,
        useNativeDriver: true,
      }),
      Animated.delay(VISIBLE_DURATION_MS),
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_OUT_DURATION_MS,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDoneRef.current();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scoreText = isNegative ? `-${Math.abs(score)}` : `+${score}`;

  return (
    <View
      style={{ position: 'absolute', left: x, top: y, width: 0, height: 0, overflow: 'visible', zIndex: 9999, elevation: 9999 }}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY }, { translateX: -50 }],
            opacity,
          },
        ]}
      >
        <Text style={[styles.text, isNegative ? styles.textNegative : styles.textPositive]}>
          {scoreText}
        </Text>
      </Animated.View>
    </View>
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
