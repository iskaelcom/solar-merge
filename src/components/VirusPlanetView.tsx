import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Line, Path, Defs, RadialGradient, Stop, G } from 'react-native-svg';

// Visual diameter — larger than physics radius (22) to show spikes
const DIAMETER = 60;

interface Props {
  x: number;
  y: number;
  ghost?: boolean;
}

// Pre-compute 8 spike positions on a circle
function buildSpikes(cx: number, cy: number, coreR: number, spikeCenterR: number) {
  return Array.from({ length: 8 }, (_, i) => {
    const angle = (2 * Math.PI * i) / 8;
    return {
      x1: cx + coreR * Math.cos(angle),
      y1: cy + coreR * Math.sin(angle),
      x2: cx + spikeCenterR * Math.cos(angle),
      y2: cy + spikeCenterR * Math.sin(angle),
    };
  });
}

/** Live virus planet rendered in the game area. */
export const VirusPlanetView = React.memo(({ x, y, ghost = false }: Props) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    if (!ghost) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const half = DIAMETER / 2;
  const coreR = 16;
  const spikeCenterR = 24;
  const spikeR = 5.5;
  const spikes = buildSpikes(half, half, coreR, spikeCenterR);

  const lEX = half - 6; // left eye x
  const rEX = half + 6; // right eye x
  const eY  = half - 2; // eye y

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
      {/* Rotating spike layer */}
      <Animated.View
        style={{
          position: 'absolute',
          width: DIAMETER,
          height: DIAMETER,
          transform: [{ rotate }],
        }}
      >
        <Svg width={DIAMETER} height={DIAMETER}>
          {spikes.map((s, i) => (
            <G key={i}>
              <Line
                x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                stroke="#33691E" strokeWidth={2.5} strokeLinecap="round"
              />
              <Circle cx={s.x2} cy={s.y2} r={spikeR} fill="#F9A825" opacity={ghost ? 0.6 : 0.95} />
              <Circle cx={s.x2 - 1.5} cy={s.y2 - 1.5} r={1.8} fill="rgba(255,255,255,0.45)" />
            </G>
          ))}
        </Svg>
      </Animated.View>

      {/* Static core body + face */}
      <Svg width={DIAMETER} height={DIAMETER} style={{ position: 'absolute' }}>
        <Defs>
          <RadialGradient id="vg_core" cx="38%" cy="32%" r="65%">
            <Stop offset="0%"   stopColor="#E6FF4D" />
            <Stop offset="55%"  stopColor="#76C442" />
            <Stop offset="100%" stopColor="#1B5E20" />
          </RadialGradient>
        </Defs>

        {/* Core */}
        <Circle cx={half} cy={half} r={coreR} fill="url(#vg_core)" />
        {/* Shine */}
        <Circle cx={half - 5} cy={half - 5} r={5} fill="rgba(255,255,255,0.22)" />

        {/* Left eye */}
        <Circle cx={lEX} cy={eY} r={4} fill="rgba(0,30,0,0.7)" />
        <Circle cx={lEX + 0.5} cy={eY - 0.5} r={1.8} fill="#CCFF00" />
        {/* Left sinister lid */}
        <Path
          d={`M${lEX - 4} ${eY - 1} Q${lEX} ${eY - 4.5} ${lEX + 4} ${eY - 1}`}
          fill="#1B5E20"
        />

        {/* Right eye */}
        <Circle cx={rEX} cy={eY} r={4} fill="rgba(0,30,0,0.7)" />
        <Circle cx={rEX + 0.5} cy={eY - 0.5} r={1.8} fill="#CCFF00" />
        {/* Right sinister lid */}
        <Path
          d={`M${rEX - 4} ${eY - 1} Q${rEX} ${eY - 4.5} ${rEX + 4} ${eY - 1}`}
          fill="#1B5E20"
        />

        {/* Jagged evil grin */}
        <Path
          d={`M${half - 7} ${half + 5} L${half - 4} ${half + 9} L${half - 1} ${half + 5} L${half + 2} ${half + 9} L${half + 5} ${half + 5} L${half + 7} ${half + 8}`}
          stroke="#1B5E20"
          strokeWidth={2}
          fill="rgba(0,40,0,0.3)"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
});

/** Small virus thumbnail for the drop-queue preview panel. */
export const VirusPlanetThumb = React.memo(({ size = 36 }: { size?: number }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
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

  const half     = size / 2;
  const coreR    = half * 0.60;
  const spikeR   = half * 0.85;
  const ballR    = half * 0.18;
  const spikes   = buildSpikes(half, half, coreR, spikeR);

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={{ position: 'absolute', width: size, height: size, transform: [{ rotate }] }}>
        <Svg width={size} height={size}>
          {spikes.map((s, i) => (
            <G key={i}>
              <Line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#33691E" strokeWidth={1.5} strokeLinecap="round" />
              <Circle cx={s.x2} cy={s.y2} r={ballR} fill="#F9A825" />
            </G>
          ))}
        </Svg>
      </Animated.View>

      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <RadialGradient id="vgt_core" cx="38%" cy="32%" r="65%">
            <Stop offset="0%"   stopColor="#E6FF4D" />
            <Stop offset="100%" stopColor="#1B5E20" />
          </RadialGradient>
        </Defs>
        <Circle cx={half} cy={half} r={coreR} fill="url(#vgt_core)" />
        <Circle cx={half - 2} cy={half - 2} r={coreR * 0.28} fill="rgba(255,255,255,0.2)" />
      </Svg>
    </View>
  );
});
