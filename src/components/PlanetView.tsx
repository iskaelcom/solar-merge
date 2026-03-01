import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { PLANETS } from '../constants';
import { PLANET_SVG_MAP } from './PlanetSVG';

interface Props {
  planetId: number;
  x: number;
  y: number;
  angle?: number;
  ghost?: boolean;
  isMergeSpawn?: boolean;
  style?: object;
}

// Saturn's SVG is 2× wider than tall (viewBox 200×100) to show its ring system.
// For every other planet, SVG is square (viewBox 100×100).
const SATURN_ID = 8;

/** A planet rendered as an absolutely-positioned SVG circle. */
export function PlanetView({ planetId, x, y, angle = 0, ghost = false, isMergeSpawn = false, style }: Props) {
  const planet = PLANETS[planetId - 1];
  if (!planet) return null;

  const PlanetSVGComponent = PLANET_SVG_MAP[planetId];
  const diameter = planet.size * 2;
  const r = planet.size;

  const isSaturn = planetId === SATURN_ID;
  const svgW = isSaturn ? diameter * 2 : diameter;
  const svgH = diameter;
  const leftExtra = isSaturn ? r : 0;

  // Spring "pop" only for merge-spawned planets; dropped planets and ghost appear normally
  const scaleAnim = useRef(new Animated.Value(isMergeSpawn ? 0.1 : 1)).current;

  useEffect(() => {
    if (!isMergeSpawn) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,    // low friction = bouncy overshoot
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
          width: svgW,
          height: svgH,
          left: x - r - leftExtra,
          top: y - r,
          opacity: ghost ? 0.5 : 1,
        },
        style,
      ]}
    >
      {/* Inner animated wrapper handles scale + rotate so the outer
          View only owns position — keeps transforms clean */}
      <Animated.View
        style={{
          width: svgW,
          height: svgH,
          transform: [
            { rotate: `${angle}rad` },
            { scale: scaleAnim },
          ],
        }}
      >
        {PlanetSVGComponent ? (
          <PlanetSVGComponent size={diameter} />
        ) : (
          <View
            style={{
              width: diameter,
              height: diameter,
              borderRadius: r,
              backgroundColor: planet.color,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: leftExtra,
            }}
          >
            <Text style={{ fontSize: r * 0.8 }}>{planet.face}</Text>
          </View>
        )}

        {/* Glow ring — only on the planet body, not the ring wings */}
        {!ghost && (
          <View
            style={[
              styles.glow,
              {
                width: diameter + 8,
                height: diameter + 8,
                borderRadius: r + 4,
                left: leftExtra - 4,
                top: -4,
                borderColor: planet.color,
              },
            ]}
          />
        )}
      </Animated.View>
    </View>
  );
}

/** Small inline planet thumbnail (for next-planet preview / evo bar) */
export function PlanetThumb({ planetId, size = 40 }: { planetId: number; size?: number }) {
  const planet = PLANETS[planetId - 1];
  if (!planet) return null;

  const PlanetSVGComponent = PLANET_SVG_MAP[planetId];

  const isSaturn = planetId === SATURN_ID;
  const thumbW = isSaturn ? size * 1.8 : size;

  return (
    <View style={{ width: thumbW, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {PlanetSVGComponent ? (
        <PlanetSVGComponent size={size} />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: planet.color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: size * 0.45 }}>{planet.face}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    overflow: 'visible',
  },
  glow: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'solid',
    opacity: 0.3,
  },
});
