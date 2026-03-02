import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../useGame';
import { PLANETS, DANGER_HEIGHT, STAR_RADIUS, BLACK_HOLE_RADIUS, VIRUS_RADIUS } from '../constants';
import { PlanetView, PlanetThumb } from './PlanetView';
import { StarView, StarThumb } from './StarView';
import { BlackHoleView, BlackHoleThumb } from './BlackHoleView';
import { VirusPlanetView, VirusPlanetThumb } from './VirusPlanetView';
import { GameOverModal } from './GameOverModal';
import { GameLogo } from './GameLogo';
import { ExplosionEffect } from './ExplosionEffect';
import { TutorialOverlay, isTutorialSeen } from './TutorialOverlay';

const WALL_THICKNESS = 6;

export function GameScreen() {
  const { width: screenW, height: screenH } = useWindowDimensions();

  // Game area dimensions — leave room for header, sub-header, evo-bar and safe areas
  const topPad = Platform.OS === 'ios' ? 50 : 30;
  const reservedVertical = topPad + 42 + 56 + 36 + 12; // header + logoRow + evoBar + bottomPad
  const gameWidth = Math.min(screenW - WALL_THICKNESS * 2, 400);
  const gameHeight = Math.max(350, screenH - reservedVertical);

  const { state, setPointerX, dropPlanet, restart, removeExplosion, isDroppingRef } = useGame(gameWidth, gameHeight);

  const [showTutorial, setShowTutorial] = useState(() => !isTutorialSeen());

  const isPointerActive = useRef(false);
  const currentPointerX = useRef(gameWidth / 2);

  // ── Touch / Mouse handlers ──────────────────────────────────────────────
  const handleTouchStart = (e: any) => {
    if (state.gameOver || state.isDropping || isDroppingRef.current) return;
    isPointerActive.current = true;
    const x = e.nativeEvent.locationX ?? e.nativeEvent.clientX;
    currentPointerX.current = x;
    setPointerX(x);
  };

  const handleTouchMove = (e: any) => {
    if (!isPointerActive.current || state.gameOver) return;
    const x = e.nativeEvent.locationX ?? e.nativeEvent.clientX;
    currentPointerX.current = x;
    setPointerX(x);
  };

  const handleTouchEnd = () => {
    if (!isPointerActive.current || state.gameOver || state.isDropping || isDroppingRef.current) return;
    isPointerActive.current = false;
    dropPlanet(currentPointerX.current);
  };

  const currentPlanet = PLANETS[state.currentPlanetId - 1];

  // Clamp preview by item radius (virus / star / black hole / planet)
  const previewRadius = state.currentIsVirus
    ? VIRUS_RADIUS
    : state.currentIsStar
      ? STAR_RADIUS
      : state.currentIsBlackHole
        ? BLACK_HOLE_RADIUS
        : currentPlanet.size;
  const previewX = Math.max(
    previewRadius + 2,
    Math.min(gameWidth - previewRadius - 2, state.pointerX)
  );
  const previewY = previewRadius + 2;

  // "After" slot: when holding a special, currentPlanetId is the planet after it
  const holdingSpecial = state.currentIsStar || state.currentIsBlackHole || state.currentIsVirus;
  const afterPlanetId = holdingSpecial ? state.currentPlanetId : state.nextPlanetId;

  return (
    <LinearGradient colors={['#0a0a2e', '#12124a', '#1a1a5e']} style={styles.root}>
      {/* ── Stars background ─────────────────────────────────── */}
      <Stars />

      {/* ── Row 1: BEST | SCORE | ? ───────────────────────────── */}
      <View style={[styles.header, { width: gameWidth + WALL_THICKNESS * 2 }]}>
        <View style={styles.bestBox}>
          <Text style={styles.bestLabel}>BEST</Text>
          <Text style={styles.bestValue}>{state.highScore.toLocaleString()}</Text>
        </View>

        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{state.score.toLocaleString()}</Text>
        </View>

        <TouchableOpacity style={styles.helpBtn} onPress={() => setShowTutorial(true)}>
          <Text style={styles.helpText}>?</Text>
        </TouchableOpacity>
      </View>

      {/* ── Row 2: Next | Logo (fixed center) | After ────────── */}
      <View style={[styles.subHeader, { width: gameWidth + WALL_THICKNESS * 2 }]}>
        {/* Left — fixed width so logo never shifts */}
        <View style={styles.nextBox}>
          <Text style={styles.nextLabel}>Next</Text>
          {state.currentIsVirus
            ? <VirusPlanetThumb size={36} />
            : state.currentIsStar
              ? <StarThumb size={36} />
              : state.currentIsBlackHole
                ? <BlackHoleThumb size={36} />
                : <PlanetThumb planetId={state.currentPlanetId} size={36} />}
        </View>

        {/* Center logo — absolutely positioned so side boxes can't push it */}
        <View style={styles.subHeaderCenter} pointerEvents="none">
          {state.showCombo ? (
            <View style={styles.comboBox}>
              <Text style={styles.comboText}>🔥 x{state.combo} COMBO!</Text>
            </View>
          ) : (
            <GameLogo width={110} />
          )}
        </View>

        {/* Right — same fixed width as left */}
        <View style={styles.nextBox}>
          <Text style={styles.nextLabel}>After</Text>
          <PlanetThumb planetId={afterPlanetId} size={28} />
        </View>
      </View>

      {/* ── Game container: walls + play area ────────────────── */}
      <View
        style={[
          styles.gameWrapper,
          { width: gameWidth + WALL_THICKNESS * 2 },
        ]}
      >
        {/* Left wall */}
        <View style={[styles.wall, styles.leftWall, { height: gameHeight + WALL_THICKNESS }]} />
        {/* Right wall */}
        <View style={[styles.wall, styles.rightWall, { height: gameHeight + WALL_THICKNESS }]} />
        {/* Floor */}
        <View style={[styles.floor, { width: gameWidth + WALL_THICKNESS * 2 }]} />

        {/* Play area */}
        <View
          style={[styles.gameArea, { width: gameWidth, height: gameHeight }]}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={handleTouchStart}
          onResponderMove={handleTouchMove}
          onResponderRelease={handleTouchEnd}
        >
          {/* Danger line */}
          <View style={[styles.dangerLine, { top: DANGER_HEIGHT }]} />
          <Text style={[styles.dangerLabel, { top: DANGER_HEIGHT - 16 }]}>
            ⚠️ Danger zone
          </Text>

          {/* Shield bars — 3 stacked layers just below the danger line */}
          {state.shieldLayers > 0 && (
            <>
              {/* Layer 1 (top, last standing) — red */}
              <View pointerEvents="none" style={[styles.shieldBar, { top: DANGER_HEIGHT + 2, backgroundColor: '#FF3D00', shadowColor: '#FF3D00' }]} />
              {/* Layer 2 (middle) — yellow */}
              {state.shieldLayers >= 2 && (
                <View pointerEvents="none" style={[styles.shieldBar, { top: DANGER_HEIGHT + 8, backgroundColor: '#FFD600', shadowColor: '#FFD600' }]} />
              )}
              {/* Layer 3 (bottom, outermost, first hit) — cyan */}
              {state.shieldLayers >= 3 && (
                <View pointerEvents="none" style={[styles.shieldBar, { top: DANGER_HEIGHT + 14, backgroundColor: '#00E5FF', shadowColor: '#00E5FF' }]} />
              )}
            </>
          )}

          {/* Drop guide line */}
          {!state.isDropping && (
            <View
              style={[
                styles.dropLine,
                {
                  left: previewX - 1,
                  top: previewY * 2,
                  height: gameHeight - previewY * 2,
                },
              ]}
            />
          )}

          {/* Ghost / preview — virus, black hole, star, or planet */}
          {!state.isDropping && (
            state.currentIsVirus
              ? <VirusPlanetView x={previewX} y={previewY} ghost />
              : state.currentIsBlackHole
                ? <BlackHoleView x={previewX} y={previewY} ghost />
                : state.currentIsStar
                  ? <StarView x={previewX} y={previewY} ghost />
                  : <PlanetView planetId={state.currentPlanetId} x={previewX} y={previewY} ghost />
          )}

          {/* All live planets */}
          {state.planets.map((p) => (
            <PlanetView
              key={p.id}
              planetId={p.planetId}
              x={p.x}
              y={p.y}
              angle={p.angle}
              isMergeSpawn={state.mergeSpawnIds.includes(p.id)}
              isSick={state.sickPlanetIds.includes(p.id)}
            />
          ))}

          {/* Star power-ups */}
          {state.stars.map((s) => (
            <StarView key={s.id} x={s.x} y={s.y} />
          ))}

          {/* Black holes */}
          {state.blackHoles.map((bh) => (
            <BlackHoleView key={bh.id} x={bh.x} y={bh.y} />
          ))}

          {/* Virus planets */}
          {state.viruses.map((v) => (
            <VirusPlanetView key={v.id} x={v.x} y={v.y} />
          ))}

          {/* Merge explosions */}
          {state.explosions.map((exp) => (
            <ExplosionEffect
              key={exp.id}
              x={exp.x}
              y={exp.y}
              planetSize={exp.planetSize}
              color={exp.color}
              scale={exp.scale}
              onDone={() => removeExplosion(exp.id)}
            />
          ))}
        </View>
      </View>

      {/* ── Planet evolution guide ────────────────────────────── */}
      <EvolutionBar />

      {/* ── Game Over overlay ─────────────────────────────────── */}
      {state.gameOver && (
        <GameOverModal score={state.score} highScore={state.highScore} onRestart={restart} />
      )}

      {/* ── Tutorial overlay ──────────────────────────────────── */}
      <TutorialOverlay visible={showTutorial} onDone={() => setShowTutorial(false)} />
    </LinearGradient>
  );
}

// ── Stars decoration ──────────────────────────────────────────────────────────
const Stars = React.memo(() => {
  const stars = React.useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        key: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: Math.random() * 2.5 + 1,
        opacity: Math.random() * 0.5 + 0.3,
      })),
    []
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((s) => (
        <View
          key={s.key}
          style={{
            position: 'absolute',
            top: s.top as any,
            left: s.left as any,
            width: s.size,
            height: s.size,
            borderRadius: s.size / 2,
            backgroundColor: '#fff',
            opacity: s.opacity,
          }}
        />
      ))}
    </View>
  );
});

// ── Evolution progress bar at bottom ─────────────────────────────────────────
const EvolutionBar = React.memo(() => {
  return (
    <View style={styles.evoBar}>
      {PLANETS.map((p, i) => (
        <View key={p.id} style={styles.evoItem}>
          <PlanetThumb planetId={p.id} size={18} />
          {i < PLANETS.length - 1 && <Text style={styles.evoArrow}>›</Text>}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 12,
  },
  header: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
    gap: 8,
  },
  bestBox: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    flex: 1,
  },
  bestLabel: {
    color: '#888',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
  },
  bestValue: {
    color: '#aaa',
    fontSize: 15,
    fontWeight: '800',
  },
  scoreBox: {
    backgroundColor: 'rgba(255,214,0,0.10)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,214,0,0.25)',
    flex: 1,
  },
  scoreLabel: {
    color: '#FFD600',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
    opacity: 0.8,
  },
  scoreValue: {
    color: '#FFD600',
    fontSize: 18,
    fontWeight: '900',
  },
  subHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
    minHeight: 58,
  },
  subHeaderCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBox: {
    alignItems: 'center',
    gap: 4,
    width: 68, // fixed width — prevents Saturn's wide thumb from pushing the logo
    zIndex: 1,
  },
  nextLabel: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  levelText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  comboBox: {
    backgroundColor: 'rgba(255,80,0,0.25)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,120,0,0.5)',
  },
  comboText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: '800',
  },
  gameWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  wall: {
    position: 'absolute',
    width: WALL_THICKNESS,
    backgroundColor: 'rgba(100,150,255,0.4)',
    borderRadius: 3,
    top: 0,
  },
  leftWall: { left: 0 },
  rightWall: { right: 0 },
  floor: {
    position: 'absolute',
    bottom: 0,
    height: WALL_THICKNESS,
    backgroundColor: 'rgba(100,150,255,0.4)',
    borderRadius: 3,
  },
  gameArea: {
    backgroundColor: 'rgba(5,5,30,0.7)',
    overflow: 'hidden',
    position: 'relative',
    marginHorizontal: WALL_THICKNESS,
  },
  dangerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,50,50,0.35)',
  },
  dangerFill: {
    height: '100%',
    backgroundColor: '#FF3333',
    borderRadius: 1,
  },
  dangerLabel: {
    position: 'absolute',
    left: 8,
    color: 'rgba(255,80,80,0.6)',
    fontSize: 9,
    fontWeight: '600',
  },
  shieldBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 6,
    elevation: 4,
  },
  helpBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 18,
  },
  dropLine: {
    position: 'absolute',
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
  },
  evoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    paddingVertical: 4,
  },
  evoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  evoArrow: {
    color: '#555',
    fontSize: 12,
    marginHorizontal: 1,
  },
});
