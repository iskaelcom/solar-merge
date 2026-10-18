import { useEffect, useMemo, useRef } from 'react';
import { Animated } from 'react-native';

export type BodyTransformUpdater = (x: number, y: number, angle: number) => void;
export type RegisterBodyTransform = (
  id: string,
  updater: BodyTransformUpdater,
) => () => void;

interface Options {
  id?: string;
  x: number;
  y: number;
  angle?: number;
  offsetX: number;
  offsetY: number;
  registerTransform?: RegisterBodyTransform;
}

/**
 * Keeps high-frequency physics coordinates outside React state. Animated values
 * update native transforms on Android and CSS transforms on web without
 * re-rendering the component tree.
 */
export function usePhysicsTransform({
  id,
  x,
  y,
  angle = 0,
  offsetX,
  offsetY,
  registerTransform,
}: Options) {
  const translateX = useRef(new Animated.Value(x - offsetX)).current;
  const translateY = useRef(new Animated.Value(y - offsetY)).current;
  const rotation = useRef(new Animated.Value(angle)).current;

  const updater = useMemo<BodyTransformUpdater>(() => (nextX, nextY, nextAngle) => {
    translateX.setValue(nextX - offsetX);
    translateY.setValue(nextY - offsetY);
    rotation.setValue(nextAngle);
  }, [offsetX, offsetY, rotation, translateX, translateY]);

  useEffect(() => {
    if (!id || !registerTransform) return;
    updater(x, y, angle);
    return registerTransform(id, updater);
    // x/y/angle are intentionally initial values. Live coordinates arrive via
    // the registry and must not be reset by unrelated React renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, registerTransform, updater]);

  const rotate = rotation.interpolate({
    inputRange: [-Math.PI * 100, Math.PI * 100],
    outputRange: ['-314.159rad', '314.159rad'],
    extrapolate: 'extend',
  });

  return {
    translateX,
    translateY,
    positionStyle: {
      transform: [{ translateX }, { translateY }],
    },
    rotate,
  };
}
