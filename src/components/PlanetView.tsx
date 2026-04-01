import React, { useEffect, useRef } from 'react';
import { Animated, View, Image, StyleSheet } from 'react-native';
import { PLANETS } from '../constants';

interface Props {
  planetId: number;
  x: number;
  y: number;
  angle?: number;
  ghost?: boolean;
  isMergeSpawn?: boolean;
  isSick?: boolean;
  scale?: number;
  style?: object;
}

const SATURN_ID = 8;

// Static PNG requires — bundled at build time, zero runtime SVG overhead
const PLANET_IMAGES: Record<number, ReturnType<typeof require>> = {
  1: require('../../assets/planets/moon.png'),
  2: require('../../assets/planets/mercury.png'),
  3: require('../../assets/planets/mars.png'),
  4: require('../../assets/planets/venus.png'),
  5: require('../../assets/planets/earth.png'),
  6: require('../../assets/planets/neptune.png'),
  7: require('../../assets/planets/uranus.png'),
  8: require('../../assets/planets/saturn.png'),
  9: require('../../assets/planets/jupiter.png'),
  10: require('../../assets/planets/sun.png'),
};

// Sick variants — sad face baked into the PNG
const SICK_PLANET_IMAGES: Record<number, ReturnType<typeof require>> = {
  1: require('../../assets/planets/moon-sick.png'),
  2: require('../../assets/planets/mercury-sick.png'),
  3: require('../../assets/planets/mars-sick.png'),
  4: require('../../assets/planets/venus-sick.png'),
  5: require('../../assets/planets/earth-sick.png'),
  6: require('../../assets/planets/neptune-sick.png'),
  7: require('../../assets/planets/uranus-sick.png'),
  8: require('../../assets/planets/saturn-sick.png'),
  9: require('../../assets/planets/jupiter-sick.png'),
  10: require('../../assets/planets/sun-sick.png'),
};

/** A planet rendered as an absolutely-positioned PNG image. */
export const PlanetView = React.memo(({ planetId, x, y, angle = 0, ghost = false, isMergeSpawn = false, isSick = false, scale = 1, style }: Props) => {
  const planet = PLANETS[planetId - 1];
  if (!planet) return null;

  const diameter = planet.size * 2;
  const r = planet.size;

  // Saturn PNG is 2:1 — rendered wider so rings show
  const isSaturn = planetId === SATURN_ID;
  const imgW = isSaturn ? diameter * 2 : diameter;
  const imgH = diameter;
  const leftExtra = isSaturn ? r : 0;

  // Spring "pop" only for merge-spawned planets
  const scaleAnim = useRef(new Animated.Value(isMergeSpawn ? 0.1 : 1)).current;
  const bonusScaleAnim = useRef(new Animated.Value(scale)).current;

  useEffect(() => {
    Animated.spring(bonusScaleAnim, {
      toValue: scale,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  useEffect(() => {
    if (!isMergeSpawn) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 280,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          width: imgW,
          height: imgH,
          left: x - r - leftExtra,
          top: y - r,
          opacity: ghost ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: imgW,
          height: imgH,
          transform: [
            { scale: Animated.multiply(scaleAnim, bonusScaleAnim) },
          ],
        }}
      >
        <Animated.View
          style={{
            width: imgW,
            height: imgH,
            transform: [{ rotate: `${angle}rad` }],
          }}
        >
          <Image
            source={isSick ? SICK_PLANET_IMAGES[planetId] : PLANET_IMAGES[planetId]}
            style={{ width: imgW, height: imgH }}
            resizeMode="contain"
            fadeDuration={0}
          />
        </Animated.View>

        {/* Purple sick ring — centered on the planet body */}
        {isSick && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: diameter + 10,
              height: diameter + 10,
              left: leftExtra - 5,
              top: -5,
              borderRadius: (diameter + 10) / 2,
              borderWidth: 3,
              borderColor: '#CC00FF',
              backgroundColor: 'rgba(170,0,255,0.08)',
            }}
          />
        )}
      </Animated.View>
    </View>
  );
});

/** Small inline planet thumbnail (for next-planet preview / evo bar) */
export const PlanetThumb = React.memo(({ planetId, size = 40 }: { planetId: number; size?: number }) => {
  const planet = PLANETS[planetId - 1];
  if (!planet) return null;

  const isSaturn = planetId === SATURN_ID;
  const thumbW = isSaturn ? size * 1.8 : size;

  return (
    <View style={{ width: thumbW, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={PLANET_IMAGES[planetId]}
        style={{ width: thumbW, height: size }}
        resizeMode="contain"
        fadeDuration={0}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    overflow: 'visible',
  },
});
