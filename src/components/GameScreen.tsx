import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Platform,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame, calculateChecksum } from '../useGame';
import { PLANETS, DANGER_HEIGHT, STAR_RADIUS, BLACK_HOLE_RADIUS, VIRUS_RADIUS, GAME_WIDTH, GAME_HEIGHT, WIZARD_SHRINK_SCALE, WIZARD_SHIELD_COST } from '../constants';
import { PlanetView, PlanetThumb } from './PlanetView';
import { StarView } from './StarView';
import { BlackHoleView } from './BlackHoleView';
import { VirusPlanetView } from './VirusPlanetView';
import { MysteryPlanetView } from './MysteryPlanetView';
import { GameOverModal } from './GameOverModal';
import { GameLogo } from './GameLogo';
import { ExplosionEffect } from './ExplosionEffect';
import { TutorialOverlay, isTutorialSeen } from './TutorialOverlay';
import { LeaderboardModal } from './LeaderboardModal';
import { SettingsModal } from './SettingsModal';
import { StreakRewardModal } from './StreakRewardModal';
import { WizardModal } from './WizardModal';
import { useAuth } from '../hooks/useAuth';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { showInterstitialAd } from '../utils/InterstitialAdManager';
import { formatCompactNumber } from '../utils/format';
import { AdMobBanner } from './AdMobBanner';

const WALL_THICKNESS = 6;

const MemoizedPlanetView = React.memo(PlanetView);
const MemoizedStarView = React.memo(StarView);
const MemoizedBlackHoleView = React.memo(BlackHoleView);
const MemoizedVirusPlanetView = React.memo(VirusPlanetView);
const MemoizedMysteryPlanetView = React.memo(MysteryPlanetView);

// ── Outer shell: computes + debounces dimensions, remounts GameView on change ─
export function GameScreen() {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const topPad = Math.max(insets.top, Platform.OS === 'ios' ? 50 : 30);
  const bottomPad = 12;
  const bannerH = Platform.OS === 'android' ? 60 : 0; // Approximate banner height
  //const bannerH = 60;
  const reservedVertical = topPad + 42 + 56 + 36 + bottomPad + bannerH; // header + logoRow + evoBar + padding + banner
  const rawW = Math.min(screenW - WALL_THICKNESS * 2, 400);
  const rawH = Math.max(350, Math.min(
    Math.round(rawW * GAME_HEIGHT / GAME_WIDTH), // enforce natural aspect ratio
    screenH - reservedVertical,
  ));

  // Debounce so rapid resize doesn't spam remounts (300 ms settle time)
  const [dims, setDims] = useState({ w: rawW, h: rawH });
  useEffect(() => {
    const t = setTimeout(() => setDims({ w: rawW, h: rawH }), 300);
    return () => clearTimeout(t);
  }, [rawW, rawH]);

  return <GameView key={`${dims.w}x${dims.h}`} gameWidth={dims.w} gameHeight={dims.h} />;
}

function GameView({ gameWidth, gameHeight }: { gameWidth: number; gameHeight: number }) {
  const { state, setPointerX, dropPlanet, restart, continueGame, removeExplosion, buyShrinkBonus, buyShield, redeemCode, isDroppingRef, scoreRef, dropCountRef } = useGame(gameWidth, gameHeight);

  const gameAreaRef = useRef<View>(null);
  const layoutXRef = useRef(0);

  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    isTutorialSeen().then((seen) => {
      if (!seen) setShowTutorial(true);
    });
  }, []);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStreakReward, setShowStreakReward] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (state.streakReward !== null && !showTutorial) {
      setShowStreakReward(true);
    }
  }, [state.streakReward, showTutorial]);

  const { user, loading: authLoading, error: authError, signIn, signOut, deleteAccount } = useAuth();
  const { entries, loading: lbLoading, fetchError: lbError, userRank, submitScore } = useLeaderboard(user);

  // Submit score + show interstitial whenever the game ends.
  // Use refs (not state) so DevTools tampering of state.score has zero effect.
  useEffect(() => {
    if (state.gameOver) {
      if (user) {
        const realScore = scoreRef.current;
        const realDropCount = dropCountRef.current;
        submitScore(realScore, calculateChecksum(realScore, realDropCount), realDropCount);
      }
      showInterstitialAd();
    }
  }, [state.gameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  const isPointerActive = useRef(false);
  const currentPointerX = useRef(gameWidth / 2);

  const currentPlanet = PLANETS[state.currentPlanetId - 1];

  // Clamp preview by item radius (virus / star / black hole / planet)
  const previewRadius = state.currentIsVirus
    ? VIRUS_RADIUS
    : state.currentIsStar
      ? STAR_RADIUS
      : state.currentIsBlackHole
        ? BLACK_HOLE_RADIUS
        : currentPlanet.size;
  const previewY = previewRadius + 2;

  // Animated value drives the drop line + ghost position WITHOUT re-renders.
  const pointerXAnim = useRef(new Animated.Value(gameWidth / 2)).current;
  const previewRadiusRef = useRef(previewRadius);
  previewRadiusRef.current = previewRadius;

  const clampPointerX = (x: number) =>
    Math.max(previewRadiusRef.current + 2, Math.min(gameWidth - previewRadiusRef.current - 2, x));

  // ── Touch / Mouse handlers ──────────────────────────────────────────────
  const handleTouchStart = (e: any) => {
    if (state.gameOver || state.isDropping || isDroppingRef.current) return;
    isPointerActive.current = true;

    const pageX = e.nativeEvent.pageX || e.nativeEvent.clientX;
    const x = pageX - layoutXRef.current;

    currentPointerX.current = x;
    pointerXAnim.setValue(clampPointerX(x));
  };

  const handleTouchMove = (e: any) => {
    if (!isPointerActive.current || state.gameOver) return;

    const pageX = e.nativeEvent.pageX || e.nativeEvent.clientX;
    const x = pageX - layoutXRef.current;

    currentPointerX.current = x;
    pointerXAnim.setValue(clampPointerX(x));
  };

  const handleMouseMove = (e: any) => {
    if (state.gameOver || isPointerActive.current) return;

    const clientX = e.nativeEvent.clientX || e.nativeEvent.pageX;
    const x = clientX - layoutXRef.current;

    if (x == null || isNaN(x)) return;
    currentPointerX.current = x;
    pointerXAnim.setValue(clampPointerX(x));
  };

  const handleTouchEnd = () => {
    if (!isPointerActive.current || state.gameOver || state.isDropping || isDroppingRef.current) return;
    isPointerActive.current = false;

    setPointerX(currentPointerX.current);
    dropPlanet(currentPointerX.current);
  };

  // "After" slot: when holding a special, currentPlanetId is the planet after it
  const holdingSpecial = state.currentIsStar || state.currentIsBlackHole || state.currentIsVirus || state.currentIsMystery;
  const afterPlanetId = holdingSpecial ? state.currentPlanetId : state.nextPlanetId;

  // Pre-compute Sets once per render — O(1) lookup per planet instead of O(n) .includes()
  const mergeSpawnSet = new Set(state.mergeSpawnIds);
  const sickPlanetSet = new Set(state.sickPlanetIds);

  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state.shrinkTimeLeft > 0 && state.shrinkTimeLeft <= 30) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.2,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      blinkAnim.stopAnimation();
      blinkAnim.setValue(1);
    }
  }, [state.shrinkTimeLeft <= 30, state.shrinkTimeLeft > 0]);

  const insets = useSafeAreaInsets();
  const isShrinkWarning = state.shrinkTimeLeft > 0 && state.shrinkTimeLeft <= 30;

  return (
    <LinearGradient
      colors={['#0a0a2e', '#12124a', '#1a1a5e']}
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 50 : 30),
        }
      ]}
    >
      {/* ── Stars background ─────────────────────────────────── */}
      <Stars />

      {/* ── Row 1: ⚙️ | BEST | SCORE | 🏆 ──────────────────────── */}
      <View style={[styles.header, { width: gameWidth + WALL_THICKNESS * 2 }]}>
        <TouchableOpacity style={styles.helpBtn} onPress={() => setShowSettings(true)}>
          <Text style={styles.helpText}>⚙️</Text>
        </TouchableOpacity>

        <View style={styles.bestBox}>
          <Text style={styles.bestLabel}>BEST</Text>
          <Text style={styles.bestValue}>{state.highScore.toLocaleString()}</Text>
        </View>

        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{state.score.toLocaleString()}</Text>
        </View>

        <TouchableOpacity style={styles.helpBtn} onPress={() => setShowLeaderboard(true)}>
          <Text style={styles.helpText}>🏆</Text>
        </TouchableOpacity>
      </View>

      {/* ── Row 2: Help | Logo (fixed center) | After ────────── */}
      <View style={[styles.subHeader, { width: gameWidth + WALL_THICKNESS * 2 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.helpBox} onPress={() => setShowTutorial(true)}>
            <Text style={styles.helpLabel}>Help</Text>
            <Text style={styles.helpIcon}>?</Text>
          </TouchableOpacity>

          <View style={styles.streakBox}>
            <View style={styles.streakRow}>
              <Text style={styles.streakValue}>🔥 {state.streak}</Text>
            </View>
          </View>
        </View>

        <View style={styles.subHeaderCenter} pointerEvents="none">
          {state.showCombo ? (
            <View style={styles.comboBox}>
              <Text style={styles.comboText}>🔥 x{state.comboDisplay} COMBO!</Text>
            </View>
          ) : (
            <GameLogo width={110} />
          )}
        </View>

        <View style={styles.headerRight}>
          <View style={styles.diamondBox}>
            <View style={styles.diamondRow}>
              <Text style={styles.diamondValue}>💎 {formatCompactNumber(state.diamonds)}</Text>
            </View>
          </View>

          <View style={styles.nextBox}>
            <Text style={styles.nextLabel}>Next</Text>
            <PlanetThumb planetId={afterPlanetId} size={28} />
          </View>
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
          ref={gameAreaRef}
          style={[styles.gameArea, { width: gameWidth, height: gameHeight }]}
          onLayout={() => {
            gameAreaRef.current?.measure((_x, _y, _w, _h, pageX) => {
              if (pageX != null) layoutXRef.current = pageX;
            });
          }}
        >
          {/* Danger line */}
          <View style={[styles.dangerLine, { top: DANGER_HEIGHT }]} />
          <Text style={[styles.dangerLabel, { top: DANGER_HEIGHT - 16 }]}>
            ⚠️ Danger zone
          </Text>

          {/* Shield bars */}
          {state.shieldLayers > 0 && (
            <>
              <View pointerEvents="none" style={[styles.shieldBar, { top: DANGER_HEIGHT + 2, backgroundColor: '#FF3D00', shadowColor: '#FF3D00' }]} />
              {state.shieldLayers >= 2 && (
                <View pointerEvents="none" style={[styles.shieldBar, { top: DANGER_HEIGHT + 8, backgroundColor: '#FFD600', shadowColor: '#FFD600' }]} />
              )}
              {state.shieldLayers >= 3 && (
                <View pointerEvents="none" style={[styles.shieldBar, { top: DANGER_HEIGHT + 14, backgroundColor: '#00E5FF', shadowColor: '#00E5FF' }]} />
              )}
            </>
          )}

          {/* Drop guide line */}
          {!state.isDropping && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.dropLine,
                {
                  transform: [{ translateX: pointerXAnim }],
                  top: previewY * 2,
                  height: gameHeight - previewY * 2,
                },
              ]}
            />
          )}

          {/* Ghost / preview */}
          {!state.isDropping && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: previewY,
                transform: [
                  { translateX: pointerXAnim },
                  { translateY: -previewRadius }, // offset by radius so it's centered on X
                ],
              }}
            >
              <View style={{ transform: [{ translateX: -previewRadius }] }}>
                {state.currentIsVirus
                  ? <VirusPlanetView x={previewRadius} y={previewRadius} ghost />
                  : state.currentIsMystery
                    ? <MysteryPlanetView x={previewRadius} y={previewRadius} ghost />
                    : state.currentIsBlackHole
                      ? <BlackHoleView x={previewRadius} y={previewRadius} ghost />
                      : state.currentIsStar
                        ? <StarView x={previewRadius} y={previewRadius} ghost />
                        : <PlanetView
                          planetId={state.currentPlanetId}
                          x={previewRadius}
                          y={previewRadius}
                          ghost
                          scale={(state.currentPlanetId >= 4 && state.shrinkTimeLeft > 0) ? WIZARD_SHRINK_SCALE : 1}
                        />
                }
              </View>
            </Animated.View>
          )}

          {/* Shrink Timer HUD */}
          {state.shrinkTimeLeft > 0 && (
            <Animated.View style={[
              styles.shrinkTimerHud,
              isShrinkWarning && styles.shrinkTimerHudWarning,
              { opacity: blinkAnim }
            ]}>
              <Text style={[styles.shrinkTimerLabel, isShrinkWarning && styles.shrinkTimerLabelWarning]}>🧪 SHRINK:</Text>
              <Text style={[styles.shrinkTimerValue, isShrinkWarning && styles.shrinkTimerValueWarning]}>
                {Math.floor(state.shrinkTimeLeft / 60)}:{(state.shrinkTimeLeft % 60).toString().padStart(2, '0')}
              </Text>
            </Animated.View>
          )}

          {/* All live planets */}
          {state.planets.map((p) => (
            p.isMystery ? (
              <MemoizedMysteryPlanetView
                key={p.id}
                x={p.x}
                y={p.y}
                angle={p.angle}
              />
            ) : (
              <MemoizedPlanetView
                key={p.id}
                planetId={p.planetId}
                x={p.x}
                y={p.y}
                angle={p.angle}
                scale={p.scale}
                isMergeSpawn={mergeSpawnSet.has(p.id)}
                isSick={sickPlanetSet.has(p.id)}
              />
            )
          ))}

          {/* Star power-ups */}
          {state.stars.map((s) => (
            <MemoizedStarView key={s.id} x={s.x} y={s.y} />
          ))}

          {/* Black holes */}
          {state.blackHoles.map((bh) => (
            <MemoizedBlackHoleView key={bh.id} x={bh.x} y={bh.y} />
          ))}

          {/* Virus planets */}
          {state.viruses.map((v) => (
            <MemoizedVirusPlanetView key={v.id} x={v.x} y={v.y} />
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

          {/* Event interceptor — captures all pointer events */}
          <View
            style={StyleSheet.absoluteFill}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={handleTouchStart}
            onResponderMove={handleTouchMove}
            onResponderRelease={handleTouchEnd}
            {...(Platform.OS === 'web' ? { onMouseMove: handleMouseMove } : {})}
          />

          {/* Floating Wizard Button */}
          <TouchableOpacity
            style={[styles.wizardBtn, { left: gameWidth - 45, top: 45 }]}
            onPress={() => setShowWizard(true)}
            activeOpacity={0.7}
          >
            <View style={styles.wizardInner}>
              <Text style={styles.wizardEmoji}>🪄</Text>
            </View>
            {state.shrinkTimeLeft > 0 && <View style={styles.wizardActiveDot} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Planet evolution guide ────────────────────────────── */}
      <EvolutionBar />

      {/* ── Banner Ad ─────────────────────────────────────────── */}
      <AdMobBanner />

      {/* ── Game Over overlay ─────────────────────────────────── */}
      {state.gameOver && (
        <GameOverModal
          score={state.score}
          highScore={state.highScore}
          onRestart={restart}
          onContinue={continueGame}
          userRank={userRank}
          isSignedIn={!!user}
          onShowLeaderboard={() => setShowLeaderboard(true)}
          diamonds={state.diamonds}
          sessionDiamonds={state.sessionDiamonds}
        />
      )}

      {/* ── Tutorial overlay ──────────────────────────────────── */}
      <TutorialOverlay
        visible={showTutorial}
        onDone={() => setShowTutorial(false)}
        user={user}
        onSignIn={signIn}
      />

      {/* ── Leaderboard overlay ───────────────────────────────── */}
      <LeaderboardModal
        visible={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        user={user}
        authLoading={authLoading}
        authError={authError}
        entries={entries}
        lbLoading={lbLoading}
        lbError={lbError}
        userRank={userRank}
        onSignIn={signIn}
        onSignOut={signOut}
        onDeleteAccount={deleteAccount}
      />

      {/* ── Settings overlay ──────────────────────────────────── */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        user={user}
        onDeleteAccount={deleteAccount}
        onRedeemCode={redeemCode}
      />

      {/* ── Streak Reward overlay ────────────────────────────── */}
      <StreakRewardModal
        visible={showStreakReward}
        streak={state.streak}
        reward={state.streakReward || 0}
        onClose={() => setShowStreakReward(false)}
      />

      <WizardModal
        visible={showWizard}
        onClose={() => setShowWizard(false)}
        diamonds={state.diamonds}
        shrinkCost={state.shrinkCost}
        shrinkTimeLeft={state.shrinkTimeLeft}
        onBuyShrink={buyShrinkBonus}
        shieldLayers={state.shieldLayers}
        shieldCost={WIZARD_SHIELD_COST}
        onBuyShield={buyShield}
      />
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
    paddingHorizontal: 6,
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
    gap: 2,
    zIndex: 1,
  },
  nextLabel: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  diamondBox: {
    justifyContent: 'center',
    zIndex: 1,
    marginTop: 16,
  },
  diamondRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  diamondValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 229, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  streakBox: {
    justifyContent: 'center',
    zIndex: 1,
    marginTop: 16,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 102, 0, 0.2)',
  },
  streakValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    textShadowColor: 'rgba(255, 102, 0, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helpBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    fontSize: 16,
    lineHeight: 20,
  },
  helpBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: 48,
  },
  helpIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 32,
  },
  helpLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  dropLine: {
    position: 'absolute',
    width: 2,
    left: -1, // center of the line on X=0
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
  wizardBtn: {
    position: 'absolute',
    width: 48,
    height: 48,
    zIndex: 100,
    opacity: 1,
  },
  wizardInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardEmoji: {
    fontSize: 16,
  },
  wizardActiveDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF85',
    borderWidth: 1,
    borderColor: '#1E1E2E',
  },
  shrinkTimerHud: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    zIndex: 10,
  },
  shrinkTimerLabel: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '900',
    marginRight: 4,
  },
  shrinkTimerValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  shrinkTimerHudWarning: {
    borderColor: 'rgba(255, 45, 85, 0.5)',
    backgroundColor: 'rgba(50, 0, 0, 0.7)',
  },
  shrinkTimerLabelWarning: {
    color: '#FF2D55',
  },
  shrinkTimerValueWarning: {
    color: '#FFD1D9',
  },
});
