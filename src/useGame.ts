import { useEffect, useRef, useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SolarPhysics } from './physics';
import { playSound } from './utils/SoundManager';
import {
  PLANETS,
  GAME_WIDTH,
  GAME_HEIGHT,
  DANGER_HEIGHT,
  DROP_DELAY,
  MAX_SPAWN_LEVEL,
  COMBO_RESET_TIME,
  STAR_RADIUS_RATIO,
  STAR_SPAWN_INTERVAL,
  BLACK_HOLE_RADIUS_RATIO,
  BLACK_HOLE_SPAWN_INTERVAL,
  VIRUS_RADIUS_RATIO,
  VIRUS_SPAWN_INTERVAL,
  MYSTERY_PLANET_RADIUS_RATIO,
  MYSTERY_PLANET_REVEAL_DROPS,
  MYSTERY_PLANET_SPAWN_INTERVAL,
  SHIELD_MAX_LAYERS,
  SHIELD_THRESHOLD_DEFAULT,
  SHIELD_THRESHOLD_MIN,
  SHIELD_THRESHOLD_ADAPT_DROPS,
  MAX_SESSION_DIAMONDS,
  DIAMONDS_PER_MINUTE,
  WIZARD_SHRINK_DURATION,
  WIZARD_SHRINK_BASE_COST,
  WIZARD_SHRINK_COST_INCREMENT,
  WIZARD_SHRINK_SCALE,
  WIZARD_SHIELD_COST,
} from './constants';
import { GameState, RenderPlanet, RenderStar, RenderBlackHole, RenderVirus, Explosion } from './types';
import { REDEEM_CODES } from './constants/redeemCodes';

let idCounter = 0;
const genId = () => `p_${++idCounter}`;

const HIGH_SCORE_KEY = 'solar-merge-highscore';
const DIAMONDS_KEY = 'solar-merge-diamonds';
const STREAK_KEY = 'solar-merge-streak';
const LAST_STREAK_DATE_KEY = 'solar-merge-last-streak-date';
const SHRINK_STATE_KEY = 'solar-merge-shrink-state';
const REDEEMED_CODES_KEY = 'solar-merge-redeemed-codes';

const SALT = 'sm-v2-secure';

export const calculateChecksum = (score: number, dropCount: number): string => {
  const str = `${score}:${dropCount}:${SALT}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

const getStreakReward = (streak: number): number => {
  if (streak % 50 === 0) return 100;
  const dayInCycle = streak % 10 === 0 ? 10 : streak % 10;
  if (dayInCycle === 1) return 5;
  if (dayInCycle <= 3) return 10;
  if (dayInCycle <= 5) return 15;
  if (dayInCycle === 6) return 20;
  if (dayInCycle <= 9) return 25;
  return 50; // day 10
};

const storage = {
  get: async (): Promise<{ score: number; dropCount: number; checksum: string; diamonds: number; streak: number; lastStreakDate: string | null; redeemedCodes: string[] }> => {
    try {
      const [scoreVal, diamondsVal, streakVal, lastDateVal, redeemedCodesVal] = await Promise.all([
        AsyncStorage.getItem(HIGH_SCORE_KEY),
        AsyncStorage.getItem(DIAMONDS_KEY),
        AsyncStorage.getItem(STREAK_KEY),
        AsyncStorage.getItem(LAST_STREAK_DATE_KEY),
        AsyncStorage.getItem(REDEEMED_CODES_KEY),
      ]);

      let scoreData = { score: 0, dropCount: 0, checksum: calculateChecksum(0, 0) };
      if (scoreVal) {
        const data = JSON.parse(scoreVal);
        if (data.checksum === calculateChecksum(data.score, data.dropCount)) {
          scoreData = data;
        }
      }

      return {
        ...scoreData,
        diamonds: diamondsVal ? parseInt(diamondsVal, 10) : 0,
        streak: streakVal ? parseInt(streakVal, 10) : 0,
        lastStreakDate: lastDateVal,
        redeemedCodes: redeemedCodesVal ? JSON.parse(redeemedCodesVal) : [],
      };
    } catch { }
    return { score: 0, dropCount: 0, checksum: calculateChecksum(0, 0), diamonds: 0, streak: 0, lastStreakDate: null, redeemedCodes: [] };
  },
  setScore: async (score: number, dropCount: number) => {
    try {
      const checksum = calculateChecksum(score, dropCount);
      await AsyncStorage.setItem(HIGH_SCORE_KEY, JSON.stringify({ score, dropCount, checksum }));
    } catch { }
  },
  setDiamonds: async (total: number) => {
    try {
      await AsyncStorage.setItem(DIAMONDS_KEY, total.toString());
    } catch { }
  },
  setStreak: async (streak: number, lastDate: string) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STREAK_KEY, streak.toString()),
        AsyncStorage.setItem(LAST_STREAK_DATE_KEY, lastDate),
      ]);
    } catch { }
  },
  setRedeemedCodes: async (codes: string[]) => {
    try {
      await AsyncStorage.setItem(REDEEMED_CODES_KEY, JSON.stringify(codes));
    } catch { }
  },
};

const shuffle = (array: number[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const INITIAL_STATE: GameState = {
  planets: [],
  stars: [],
  blackHoles: [],
  viruses: [],
  score: 0,
  highScore: 0,
  checksum: calculateChecksum(0, 0),
  dropCount: 0,
  currentPlanetId: 1,
  nextPlanetId: 2,
  currentIsStar: false,
  currentIsBlackHole: false,
  currentIsVirus: false,
  currentIsMystery: false,
  mysteryPlanetId: 1,
  pointerX: GAME_WIDTH / 2,
  isDropping: false,
  gameOver: false,
  comboDisplay: 1,
  showCombo: false,
  explosions: [],
  mergeSpawnIds: [],
  sickPlanetIds: [],
  shieldLayers: 0,
  diamonds: 0,
  sessionDiamonds: 0,
  streak: 1,
  lastStreakDate: '',
  streakReward: null,
  shrinkTimeLeft: 0,
  shrinkCost: WIZARD_SHRINK_BASE_COST,
  redeemedCodes: [],
};

export function useGame(gameWidth: number = GAME_WIDTH, gameHeight: number = GAME_HEIGHT) {
  const pRadii = PLANETS.map(p => p.radiusRatio * gameWidth);
  const sRadius = STAR_RADIUS_RATIO * gameWidth;
  const bhRadius = BLACK_HOLE_RADIUS_RATIO * gameWidth;
  const vRadius = VIRUS_RADIUS_RATIO * gameWidth;
  const mRadius = MYSTERY_PLANET_RADIUS_RATIO * gameWidth;

  const physicsRef = useRef<SolarPhysics | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const comboTimerShowRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Combo multiplier lives in a ref — invisible to React DevTools, cannot be tampered via state
  const comboRef = useRef<number>(1);
  // Actual score lives in a ref — display-only copy goes to state, tampering state has no effect
  const scoreRef = useRef<number>(0);
  // Track merge-spawned planets that need to be added to render state
  const pendingSpawnsRef = useRef<Array<{ id: string; planetId: number; x: number; y: number; isMystery?: boolean }>>([]);
  // Track explosions triggered by merges
  const pendingExplosionsRef = useRef<Explosion[]>([]);
  // Track IDs of planets spawned from a merge (for pop animation)
  const pendingMergeSpawnIdsRef = useRef<string[]>([]);
  // Robust drop lock to prevent race conditions with multiple rapid taps
  const isDroppingRef = useRef<boolean>(false);
  // Shuffle bag for levels 1–MAX_SPAWN_LEVEL variety
  const bagRef = useRef<number[]>([]);
  // Star / Black Hole / Virus power-up tracking
  const pendingStarSpawnsRef = useRef<Array<{ id: string; x: number; y: number }>>([]);
  const pendingBlackHoleSpawnsRef = useRef<Array<{ id: string; x: number; y: number }>>([]);
  const pendingVirusSpawnsRef = useRef<Array<{ id: string; x: number; y: number }>>([]);
  const dropCountRef = useRef<number>(0);
  // Set of planet IDs currently infected by a virus
  const sickPlanetIdsRef = useRef<Set<string>>(new Set());
  // Shield layer count (source of truth for physics calls)
  const shieldLayersRef = useRef<number>(0);
  // Adaptive threshold: starts at 5, drops to min 3 after 30 drops with no merge
  const currentThresholdMinRef = useRef<number>(SHIELD_THRESHOLD_DEFAULT);
  const dropsSinceLastMergeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const totalDiamondsRef = useRef<number>(0);

  const refillBag = useCallback(() => {
    bagRef.current = shuffle(Array.from({ length: MAX_SPAWN_LEVEL }, (_, i) => i + 1));
  }, []);

  const getFromBag = useCallback((excludeId?: number): number => {
    if (bagRef.current.length === 0) refillBag();

    // If the next planet is the same as excluded, swap with another or reshuffle
    if (excludeId !== undefined && bagRef.current[0] === excludeId) {
      if (bagRef.current.length > 1) {
        // Swap with the next one
        const temp = bagRef.current[0];
        bagRef.current[0] = bagRef.current[1];
        bagRef.current[1] = temp;
      } else {
        // Only one left and it's the excludeId? Reshuffle.
        refillBag();
        return getFromBag(excludeId);
      }
    }

    return bagRef.current.shift()!;
  }, [refillBag]);

  const [state, setState] = useState<GameState>(() => ({
    ...INITIAL_STATE,
    pointerX: gameWidth / 2,
  }));

  const stateRef = useRef<GameState>(state);
  stateRef.current = state;

  // ─── Physics init ─────────────────────────────────────────────────────────
  const initPhysics = useCallback(() => {
    if (physicsRef.current) physicsRef.current.destroy();

    const engine = new SolarPhysics(gameWidth, gameHeight);

    engine.onMerge(({ id1, id2, planetId, x, y, vx, vy }) => {
      playSound('merge');
      const planet = PLANETS[planetId - 1];
      const newId = genId();

      const isSickMerge =
        sickPlanetIdsRef.current.has(id1) || sickPlanetIdsRef.current.has(id2);
      sickPlanetIdsRef.current.delete(id1);
      sickPlanetIdsRef.current.delete(id2);

      if (isSickMerge) {
        // ── Sick merge: downgrade by 1 level ────────────────────────────
        const downPlanetId = planetId - 1;
        if (downPlanetId >= 1) {
          const downSize = pRadii[downPlanetId - 1];
          const spawnY = Math.max(y, downSize + 10);
          engine.addPlanet(newId, downPlanetId, x, spawnY, vx, vy);
          pendingSpawnsRef.current.push({ id: newId, planetId: downPlanetId, x, y: spawnY });
          pendingMergeSpawnIdsRef.current.push(newId);
          sickPlanetIdsRef.current.add(newId); // sickness spreads to result
          engine.applyMergeShockwave(x, y, pRadii[planetId - 1], newId);
        }
        // level 1 sick + level 1 → both vanish (downPlanetId === 0, no spawn)

        // Purple sick explosion
        pendingExplosionsRef.current.push({
          id: `exp_sick_${Date.now()}_${Math.random()}`,
          x, y,
          planetSize: pRadii[planetId - 1],
          color: '#AA00FF',
          scale: Math.max(0.8, pRadii[planetId - 1] / 30),
        });

        // Subtract score (no combo) — write through ref first
        setState((prev) => {
          const penalty = planet.score;
          scoreRef.current = Math.max(0, scoreRef.current - penalty);
          const newScore = scoreRef.current;
          return {
            ...prev,
            score: newScore,
            checksum: calculateChecksum(newScore, dropCountRef.current),
            sickPlanetIds: Array.from(sickPlanetIdsRef.current),
            planets: prev.planets.filter((p) => p.id !== id1 && p.id !== id2),
          };
        });

      } else {
        // ── Normal merge: upgrade by 1 level ────────────────────────────
        const nextPlanetId = planetId + 1;

        if (nextPlanetId <= PLANETS.length) {
          const nextSize = pRadii[nextPlanetId - 1];
          const spawnY = Math.max(y, nextSize + 10);
          engine.addPlanet(newId, nextPlanetId, x, spawnY, vx, vy);
          pendingSpawnsRef.current.push({ id: newId, planetId: nextPlanetId, x, y: spawnY });
          pendingMergeSpawnIdsRef.current.push(newId);
          engine.applyMergeShockwave(x, y, pRadii[planetId - 1], newId);
        }

        pendingExplosionsRef.current.push({
          id: `exp_${Date.now()}_${Math.random()}`,
          x, y,
          planetSize: pRadii[planetId - 1],
          color: planet.color,
          scale: Math.max(0.8, pRadii[planetId - 1] / 30),
        });

        // Read & increment the secure ref — not accessible via React DevTools
        const combo = comboRef.current;
        const newCombo = combo + 1;
        comboRef.current = newCombo;

        if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
        comboTimerRef.current = setTimeout(() => {
          comboRef.current = 1;
          setState((s) => ({ ...s, comboDisplay: 1, showCombo: false }));
        }, COMBO_RESET_TIME);

        if (comboTimerShowRef.current) clearTimeout(comboTimerShowRef.current);
        comboTimerShowRef.current = setTimeout(() => {
          setState((s) => ({ ...s, showCombo: false }));
        }, 1200);

        // Reset the "no-merge" drop counter on every merge
        dropsSinceLastMergeRef.current = 0;

        // Grant a fresh shield at each milestone: min, min+2, min+4
        // (default: 5, 7, 9 — lowers if player struggles for 30 drops)
        const min = currentThresholdMinRef.current;
        if (newCombo === min || newCombo === min + 2 || newCombo === min + 4) {
          shieldLayersRef.current = SHIELD_MAX_LAYERS;
          physicsRef.current?.setShieldActive(true);
        }

        setState((prev) => {
          const earned = planet.score * combo;
          scoreRef.current += earned;
          const newScore = scoreRef.current;
          const newHighScore = Math.max(prev.highScore, newScore);

          if (newHighScore > prev.highScore) {
            storage.setScore(newHighScore, dropCountRef.current);
          }

          return {
            ...prev,
            score: newScore,
            highScore: newHighScore,
            checksum: calculateChecksum(newScore, dropCountRef.current),
            comboDisplay: newCombo,
            showCombo: newCombo > 1,
            shieldLayers: shieldLayersRef.current,
            planets: prev.planets.filter((p) => p.id !== id1 && p.id !== id2),
          };
        });
      }
    });

    // ── Star upgrade handler ─────────────────────────────────────────────
    engine.onStarUpgrade(({ starId, planetId, planetTypeId, x, y }) => {
      playSound('star');
      const planet = PLANETS[planetTypeId - 1];
      const isSick = sickPlanetIdsRef.current.has(planetId);
      sickPlanetIdsRef.current.delete(planetId);

      if (isSick) {
        // ── Healing: star cures the sick planet (same level, no score) ───
        // Physics already removed the planet — re-add it at the same level
        const healId = genId();
        const spawnY = Math.max(y, pRadii[planetTypeId - 1] + 10);
        engine.addPlanet(healId, planetTypeId, x, spawnY);
        pendingSpawnsRef.current.push({ id: healId, planetId: planetTypeId, x, y: spawnY });
        pendingMergeSpawnIdsRef.current.push(healId);

        // Cyan healing burst
        pendingExplosionsRef.current.push({
          id: `exp_heal_${Date.now()}_${Math.random()}`,
          x, y,
          planetSize: pRadii[planetTypeId - 1],
          color: '#00E5FF',
          scale: Math.max(0.8, pRadii[planetTypeId - 1] / 30),
        });

        setState((prev) => ({
          ...prev,
          sickPlanetIds: Array.from(sickPlanetIdsRef.current),
          planets: prev.planets.filter((p) => p.id !== planetId),
          stars: prev.stars.filter((s) => s.id !== starId),
        }));

      } else {
        // ── Normal star: level up + score ─────────────────────────────────
        const newId = genId();
        const nextPlanetTypeId = Math.min(planetTypeId + 1, PLANETS.length);

        if (planetTypeId < PLANETS.length) {
          const nextSize = pRadii[nextPlanetTypeId - 1];
          const spawnY = Math.max(y, nextSize + 10);
          engine.addPlanet(newId, nextPlanetTypeId, x, spawnY);
          pendingSpawnsRef.current.push({ id: newId, planetId: nextPlanetTypeId, x: x, y: spawnY });
          pendingMergeSpawnIdsRef.current.push(newId);
          engine.applyMergeShockwave(x, spawnY, pRadii[planetTypeId - 1], newId);
        }

        // ── Star + Sun: gravitational collapse — suck surrounding objects ──
        const isSunHit = planetTypeId === PLANETS.length;
        if (isSunHit) {
          engine.applyBlackHoleSuction(x, y, pRadii[planetTypeId - 1]);
        }

        // Explosion: dramatic dark-gold implosion for Sun, normal gold otherwise
        pendingExplosionsRef.current.push({
          id: `exp_star_${Date.now()}_${Math.random()}`,
          x, y,
          planetSize: pRadii[planetTypeId - 1],
          color: isSunHit ? '#FF6600' : '#FFD600',
          scale: isSunHit ? Math.max(2.0, pRadii[planetTypeId - 1] / 15) : Math.max(0.8, pRadii[planetTypeId - 1] / 30),
        });

        setState((prev) => {
          const earned = planet.score;
          scoreRef.current += earned;
          const newScore = scoreRef.current;
          const newHighScore = Math.max(prev.highScore, newScore);
          if (newHighScore > prev.highScore) {
            storage.setScore(newHighScore, dropCountRef.current);
          }

          return {
            ...prev,
            score: newScore,
            highScore: newHighScore,
            checksum: calculateChecksum(newScore, dropCountRef.current),
            planets: prev.planets.filter((p) => p.id !== planetId),
            stars: prev.stars.filter((s) => s.id !== starId),
          };
        });
      }
    });

    // ── Black hole suck handler ──────────────────────────────────────────
    engine.onBlackHoleSuck(({ blackHoleId, planetId, planetTypeId, x, y }) => {
      playSound('blackhole');
      sickPlanetIdsRef.current.delete(planetId); // clean up if sick planet gets sucked
      const planet = PLANETS[planetTypeId - 1];

      // Pull surrounding planets inward — they should react, not stand still
      engine.applyBlackHoleSuction(x, y, pRadii[planetTypeId - 1]);

      // Dark implosion explosion at the planet's position
      pendingExplosionsRef.current.push({
        id: `exp_bh_${Date.now()}_${Math.random()}`,
        x,
        y,
        planetSize: pRadii[planetTypeId - 1],
        color: '#6a00cc',  // dark purple vortex
        scale: Math.max(0.6, pRadii[planetTypeId - 1] / 40),
      });

      // Remove planet & black hole from render state (no score — black hole is a utility)
      setState((prev) => ({
        ...prev,
        planets: prev.planets.filter((p) => p.id !== planetId),
        blackHoles: prev.blackHoles.filter((bh) => bh.id !== blackHoleId),
      }));
    });

    // ── Virus infect handler ─────────────────────────────────────────────
    engine.onVirusInfect(({ virusId, planetId, planetTypeId, x, y }) => {
      playSound('virus');
      sickPlanetIdsRef.current.add(planetId);

      const planet = PLANETS[planetTypeId - 1];
      pendingExplosionsRef.current.push({
        id: `exp_virus_${Date.now()}_${Math.random()}`,
        x, y,
        planetSize: pRadii[planetTypeId - 1],
        color: '#76FF03', // neon green infection burst
        scale: Math.max(0.6, pRadii[planetTypeId - 1] / 40),
      });

      setState((prev) => ({
        ...prev,
        sickPlanetIds: Array.from(sickPlanetIdsRef.current),
        viruses: prev.viruses.filter((v) => v.id !== virusId),
      }));
    });

    // ── Sun + Sun → Black Hole handler ───────────────────────────────────
    engine.onSunMerge(({ id1, id2, blackHoleId, x, y }) => {
      const sun = PLANETS[PLANETS.length - 1]; // Sun is the last planet (id 10)

      // Clean up sick state for both suns if needed
      sickPlanetIdsRef.current.delete(id1);
      sickPlanetIdsRef.current.delete(id2);

      // Flag the newly-spawned black hole so the game loop picks it up
      pendingBlackHoleSpawnsRef.current.push({ id: blackHoleId, x, y });

      // Strong suction — neighbouring planets get pulled toward the collapse point
      engine.applyBlackHoleSuction(x, y, pRadii[PLANETS.length - 1]);

      // Supernova explosion — large, golden-orange
      pendingExplosionsRef.current.push({
        id: `exp_sunbh_${Date.now()}_${Math.random()}`,
        x,
        y,
        planetSize: pRadii[PLANETS.length - 1],
        color: '#FF6600',
        scale: Math.max(2.0, pRadii[PLANETS.length - 1] / 15),
      });

      // Combo accounting (same logic as a normal merge)
      const combo = comboRef.current;
      const newCombo = combo + 1;
      comboRef.current = newCombo;

      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = setTimeout(() => {
        comboRef.current = 1;
        setState((s) => ({ ...s, comboDisplay: 1, showCombo: false }));
      }, COMBO_RESET_TIME);

      if (comboTimerShowRef.current) clearTimeout(comboTimerShowRef.current);
      comboTimerShowRef.current = setTimeout(() => {
        setState((s) => ({ ...s, showCombo: false }));
      }, 1200);

      dropsSinceLastMergeRef.current = 0;

      setState((prev) => {
        const earned = sun.score * 2 * combo; // both suns worth of score
        scoreRef.current += earned;
        const newScore = scoreRef.current;
        const newHighScore = Math.max(prev.highScore, newScore);

        if (newHighScore > prev.highScore) {
          storage.setScore(newHighScore, dropCountRef.current);
        }

        return {
          ...prev,
          score: newScore,
          highScore: newHighScore,
          checksum: calculateChecksum(newScore, dropCountRef.current),
          comboDisplay: newCombo,
          showCombo: newCombo > 1,
          planets: prev.planets.filter((p) => p.id !== id1 && p.id !== id2),
        };
      });
    });

    // ── Shield hit handler ───────────────────────────────────────────────
    engine.onShieldHit(() => {
      shieldLayersRef.current = Math.max(0, shieldLayersRef.current - 1);
      if (shieldLayersRef.current === 0) {
        engine.setShieldActive(false);
      }
      setState((prev) => ({ ...prev, shieldLayers: shieldLayersRef.current }));
    });

    engine.onMysteryReveal(({ id, x, y, planetSize }) => {
      playSound('buy');
      const newExplosion: Explosion = {
        id: `reveal_${id}_${Date.now()}`,
        x,
        y,
        planetSize,
        color: '#DDA0DD', // Plum / Magical purple
        scale: 0.1,
      };
      
      setState((s) => ({
        ...s,
        explosions: [...s.explosions, newExplosion],
        mergeSpawnIds: [...s.mergeSpawnIds, id],
      }));
    });

    physicsRef.current = engine;
  }, [gameWidth, gameHeight]);

  // ─── Game loop ────────────────────────────────────────────────────────────
  const loopActiveRef = useRef(false);

  const startLoop = useCallback(() => {
    if (loopActiveRef.current) return; // already running
    loopActiveRef.current = true;
    lastTimeRef.current = performance.now();

    const loop = (time: number) => {
      if (!physicsRef.current) {
        loopActiveRef.current = false;
        return;
      }

      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      physicsRef.current.step(delta);

      // Collect positions
      const allPlanets = physicsRef.current.getAllPlanets();

      // Game over check
      const highest = physicsRef.current.getHighestPoint();

      if (highest && highest.y < DANGER_HEIGHT && !isDroppingRef.current) {
        // Only Game Over if the planet is NOT falling fast (vY > -0.5 and vY < 2)
        if (Math.abs(highest.vy) < 1.0) {
          // Capture the final snapshot of planets at full scale BEFORE we destroy physics
          const finalPlanets: RenderPlanet[] = (physicsRef.current?.getAllPlanets() || []).map((p) => ({
            id: p.id,
            planetId: p.planetId,
            x: p.body.position.x,
            y: p.body.position.y,
            angle: p.body.angle,
            size: pRadii[p.planetId - 1],
            scale: 1.0, 
            isMystery: p.isMystery,
          }));

          // Reset shrink logic immediately in the engine
          physicsRef.current?.setPlanetShrink(false, 1.0);

          setState((prev) => {
            const newHighScore = Math.max(prev.highScore, scoreRef.current);
            const elapsedMs = Date.now() - startTimeRef.current;
            const finalSessionDiamonds = Math.min(
              MAX_SESSION_DIAMONDS,
              Math.floor(elapsedMs / 60000) * DIAMONDS_PER_MINUTE
            );
            const newTotalDiamonds = prev.diamonds + finalSessionDiamonds;

            if (newHighScore > prev.highScore) {
              storage.setScore(newHighScore, dropCountRef.current);
            }
            if (finalSessionDiamonds > 0) {
              storage.setDiamonds(newTotalDiamonds);
            }

            return {
              ...prev,
              gameOver: true,
              highScore: newHighScore,
              diamonds: newTotalDiamonds,
              shrinkTimeLeft: 0,
              shrinkCost: WIZARD_SHRINK_BASE_COST,
              sessionDiamonds: finalSessionDiamonds,
              planets: finalPlanets,
              checksum: calculateChecksum(scoreRef.current, dropCountRef.current),
            };
          });
          playSound('gameover');
          loopActiveRef.current = false;
          cancelAnimationFrame(rafRef.current);

          // Immediately free all physics + pending queues so CPU/memory drops to zero
          pendingSpawnsRef.current = [];
          pendingExplosionsRef.current = [];
          pendingMergeSpawnIdsRef.current = [];
          pendingStarSpawnsRef.current = [];
          pendingBlackHoleSpawnsRef.current = [];
          pendingVirusSpawnsRef.current = [];
          if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
          if (comboTimerShowRef.current) clearTimeout(comboTimerShowRef.current);
          // physicsRef.current?.destroy(); // Optimization: Keep alive for "Continue"
          // physicsRef.current = null;

          return;
        }
      }

      // Collect pending spawns, explosions, merge spawn IDs, star/BH/virus spawns
      const spawns = pendingSpawnsRef.current.splice(0);
      const newExplosions = pendingExplosionsRef.current.splice(0);
      const freshMergeIds = pendingMergeSpawnIdsRef.current.splice(0);
      const starSpawns = pendingStarSpawnsRef.current.splice(0);
      const bhSpawns = pendingBlackHoleSpawnsRef.current.splice(0);
      const virusSpawns = pendingVirusSpawnsRef.current.splice(0);

      // Sync positions from physics (source of truth)
      const allStars = physicsRef.current.getAllStars();
      const allBlackHoles = physicsRef.current.getAllBlackHoles();
      const allViruses = physicsRef.current.getAllViruses();

      // Skip React state updates if the physics world is stable and no new events happened.
      const hasEvents = spawns.length > 0 || newExplosions.length > 0 || freshMergeIds.length > 0
        || starSpawns.length > 0 || bhSpawns.length > 0 || virusSpawns.length > 0;
      const isSceneActive = physicsRef.current.hasActiveBodies();

      if (hasEvents || isSceneActive || stateRef.current.gameOver) {
        setState((prev) => {
          if (prev.gameOver) return prev;

          const spawnIdSet = spawns.length > 0 ? new Set(spawns.map((s) => s.id)) : null;
          const updated: RenderPlanet[] = allPlanets
            .filter((p) => spawnIdSet === null || !spawnIdSet.has(p.id)) // O(1) lookup
            .map((p) => {
              const pos = p.body.position;
              return {
                id: p.id,
                planetId: p.planetId,
                x: pos.x,
                y: pos.y,
                angle: p.body.angle,
                size: pRadii[p.planetId - 1],
                isMystery: p.isMystery,
              } as RenderPlanet;
            });

          // Add newly merged spawns
          spawns.forEach((s) => {
            updated.push({ id: s.id, planetId: s.planetId, x: s.x, y: s.y, angle: 0, size: pRadii[s.planetId - 1], isMystery: s.isMystery });
          });

          // Remove stale IDs (merged/destroyed planets) from sick + mergeSpawn lists
          const livePlanetIdSet = new Set(updated.map((p) => p.id));
          const cleanSickIds = prev.sickPlanetIds.filter((id) => livePlanetIdSet.has(id));
          const cleanMergeSpawnIds = prev.mergeSpawnIds.filter((id) => livePlanetIdSet.has(id));

          // Sync stars from physics
          const updatedStars: RenderStar[] = allStars.map((s) => ({
            id: s.id,
            x: s.body.position.x,
            y: s.body.position.y,
            angle: s.body.angle,
            size: sRadius,
          }));

          // Sync black holes from physics
          const updatedBlackHoles: RenderBlackHole[] = allBlackHoles.map((bh) => ({
            id: bh.id,
            x: bh.body.position.x,
            y: bh.body.position.y,
            size: bhRadius,
          }));

          // Sync viruses from physics
          const updatedViruses: RenderVirus[] = allViruses.map((v) => ({
            id: v.id,
            x: v.body.position.x,
            y: v.body.position.y,
            size: vRadius,
          }));

            // Update session diamonds based on playtime
            const elapsedMs = Date.now() - startTimeRef.current;
            const sessionDots = Math.min(
              MAX_SESSION_DIAMONDS,
              Math.floor(elapsedMs / 60000) * DIAMONDS_PER_MINUTE
            );

            const shrinkScale = prev.shrinkTimeLeft > 0 ? WIZARD_SHRINK_SCALE : 1.0;

            return {
              ...prev,
              planets: updated.map(p => ({
                ...p,
                scale: (p.planetId >= 4 && prev.shrinkTimeLeft > 0) ? shrinkScale : 1.0
              })),
              stars: updatedStars,
              blackHoles: updatedBlackHoles,
              viruses: updatedViruses,
              sickPlanetIds: cleanSickIds,
              sessionDiamonds: sessionDots,
              explosions: [...prev.explosions, ...newExplosions],
              mergeSpawnIds: freshMergeIds.length > 0
                ? [...cleanMergeSpawnIds, ...freshMergeIds]
                : cleanMergeSpawnIds,
            };
        });
      }

      // Clear merge spawn IDs after pop animation finishes (~900ms)
      if (freshMergeIds.length > 0) {
        const freshMergeIdSet = new Set(freshMergeIds);
        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            mergeSpawnIds: prev.mergeSpawnIds.filter((id) => !freshMergeIdSet.has(id)),
          }));
        }, 900);
      }

      // Pause loop when scene is fully idle — restarts automatically on next drop
      if (!hasEvents && !isSceneActive && !stateRef.current.gameOver) {
        loopActiveRef.current = false;
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  // ─── Init on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    refillBag();
    const current = getFromBag();
    const next = getFromBag(current);

    // ─── Streak & Score Init ───────────────────────────────────────────
    storage.get().then(({ score, diamonds, streak: sStreak, lastStreakDate: sDate, redeemedCodes: sCodes }) => {
      scoreRef.current = 0;
      dropCountRef.current = 0;

      // Calculate streak tracking via local time YYYY-MM-DD
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      const lastVisit = sDate ? sDate.split('T')[0] : null;
      const isToday = lastVisit === todayStr;
      const isYesterday = lastVisit === yesterdayStr;

      let finalStreak = sStreak || 0;
      let finalDate = sDate || null;
      let rewardGranted: number | null = null;

      if (!lastVisit) {
        // First play
        finalStreak = 1;
        finalDate = todayStr;
        rewardGranted = getStreakReward(1);
        storage.setStreak(1, todayStr);
      } else if (!isToday) {
        if (isYesterday) {
          finalStreak += 1;
        } else {
          finalStreak = 1;
        }
        finalDate = todayStr;
        rewardGranted = getStreakReward(finalStreak);
        storage.setStreak(finalStreak, todayStr);
      }

      if (rewardGranted !== null) {
        totalDiamondsRef.current = diamonds + rewardGranted;
        storage.setDiamonds(totalDiamondsRef.current);
      } else {
        totalDiamondsRef.current = diamonds;
      }

      setState(s => {
        // Only set the initial planets if the board is still empty (brand new game).
        // This prevents the sequence from "resetting to 1" if storage.get() resolves mid-play.
        const isFreshGame = s.planets.length === 0 && s.dropCount === 0;
        
        return {
          ...s,
          highScore: score,
          diamonds: totalDiamondsRef.current,
          streak: finalStreak,
          lastStreakDate: finalDate || todayStr,
          streakReward: rewardGranted,
          redeemedCodes: sCodes || [],
          currentPlanetId: isFreshGame ? current : s.currentPlanetId,
          nextPlanetId: isFreshGame ? next : s.nextPlanetId,
          // Reset shrink on reload as requested
          shrinkTimeLeft: 0,
          shrinkCost: WIZARD_SHRINK_BASE_COST,
        };
      });
    });

    initPhysics();
    startLoop();

    return () => {
      cancelAnimationFrame(rafRef.current);
      physicsRef.current?.destroy();
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      if (comboTimerShowRef.current) clearTimeout(comboTimerShowRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Wizard Bonus Timer ───────────────────────────────────────────
  useEffect(() => {
    if (state.shrinkTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setState((prev) => {
        const nextTime = Math.max(0, prev.shrinkTimeLeft - 1);
        if (nextTime === 0 && prev.shrinkTimeLeft > 0) {
          physicsRef.current?.setPlanetShrink(false, 1.0);
          
          // Force immediate visual synchronization of all planets to reflect full size (1.0)
          const refreshedPlanets: RenderPlanet[] = (physicsRef.current?.getAllPlanets() || []).map((p) => ({
            id: p.id,
            planetId: p.planetId,
            x: p.body.position.x,
            y: p.body.position.y,
            angle: p.body.angle,
            size: pRadii[p.planetId - 1],
            scale: 1.0,
            isMystery: p.isMystery,
          }));

          // Kickstart the loop outside this updater tick. Wait for physics side-effects.
          // This ensures that if the physics engine has gone to sleep due to inactivity,
          // it turns back on immediately to push the resized planets away from each other.
          setTimeout(() => {
            startLoop();
          }, 0);

          return { 
            ...prev, 
            shrinkTimeLeft: 0, 
            // Do NOT reset cost here, so sequence is preserved
            planets: refreshedPlanets 
          };
        }
        
        return { ...prev, shrinkTimeLeft: nextTime };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state.shrinkTimeLeft > 0]); // restart when bonus starts or restarts

  // ─── Actions ──────────────────────────────────────────────────────────────
  const setPointerX = useCallback((x: number) => {
    setState((prev) => {
      if (prev.isDropping || prev.gameOver) return prev;
      return { ...prev, pointerX: x };
    });
  }, []);

  const dropPlanet = useCallback((x: number) => {
    if (isDroppingRef.current || stateRef.current.gameOver || !physicsRef.current) return;
    isDroppingRef.current = true;

    const prev = stateRef.current;

    playSound('drop');

    // ── Drop a virus ───────────────────────────────────────────────────
    if (prev.currentIsVirus) {
      const clampedX = Math.max(vRadius + 2, Math.min(gameWidth - vRadius - 2, x));
      const startY = vRadius + 2;
      const id = genId();
      physicsRef.current.addVirus(id, clampedX, startY);
      pendingVirusSpawnsRef.current.push({ id, x: clampedX, y: startY });

      setState((s) => ({
        ...s,
        currentIsVirus: false,
        pointerX: clampedX,
        isDropping: true,
      }));
    }
    // ── Drop a star ────────────────────────────────────────────────────
    else if (prev.currentIsStar) {
      const clampedX = Math.max(sRadius + 2, Math.min(gameWidth - sRadius - 2, x));
      const startY = sRadius + 2;
      const id = genId();
      physicsRef.current.addStar(id, clampedX, startY);
      pendingStarSpawnsRef.current.push({ id, x: clampedX, y: startY });

      setState((s) => {
        const dropCount = dropCountRef.current;
        return {
          ...s,
          currentIsStar: false,
          pointerX: clampedX,
          isDropping: true,
          dropCount,
          checksum: calculateChecksum(s.score, dropCount),
        };
      });
    }
    // ── Drop a black hole ──────────────────────────────────────────────
    else if (prev.currentIsBlackHole) {
      const clampedX = Math.max(bhRadius + 2, Math.min(gameWidth - bhRadius - 2, x));
      const startY = bhRadius + 2;
      const id = genId();
      physicsRef.current.addBlackHole(id, clampedX, startY);
      pendingBlackHoleSpawnsRef.current.push({ id, x: clampedX, y: startY });

      setState((s) => {
        const dropCount = dropCountRef.current;
        return {
          ...s,
          currentIsBlackHole: false,
          pointerX: clampedX,
          isDropping: true,
          dropCount,
          checksum: calculateChecksum(s.score, dropCount),
        };
      });
    }
    // ── Drop a mystery planet ──────────────────────────────────────────
    else if (prev.currentIsMystery) {
      const clampedX = Math.max(mRadius + 2, Math.min(gameWidth - mRadius - 2, x));
      const startY = mRadius + 2;
      const id = genId();
      physicsRef.current.addMysteryPlanet(id, prev.mysteryPlanetId, MYSTERY_PLANET_REVEAL_DROPS, clampedX, startY);

      const newPlanet: RenderPlanet = {
        id,
        planetId: prev.mysteryPlanetId,
        x: clampedX,
        y: startY,
        angle: 0,
        size: pRadii[prev.mysteryPlanetId - 1],
        isMystery: true,
      };

      pendingSpawnsRef.current.push(newPlanet);

      setState((s) => {
        const dropCount = dropCountRef.current;
        return {
          ...s,
          currentIsMystery: false,
          pointerX: clampedX,
          isDropping: true,
          dropCount,
          checksum: calculateChecksum(s.score, dropCount),
        };
      });
    }
    // ── Drop a normal planet ───────────────────────────────────────────
    else {
      const radius = pRadii[prev.currentPlanetId - 1];
      const clampedX = Math.max(radius + 2, Math.min(gameWidth - radius - 2, x));
      const startY = radius + 2;

      const id = genId();
      physicsRef.current.addPlanet(id, prev.currentPlanetId, clampedX, startY);

      const newPlanet: RenderPlanet = {
        id,
        planetId: prev.currentPlanetId,
        x: clampedX,
        y: startY,
        angle: 0,
        size: radius,
      };

      // Determine special injection. Priority: BH > Virus > Star > Mystery.
      // Increment OUTSIDE setState to avoid double-triggers in React Dev mode.
      dropCountRef.current += 1;

      // Adaptive shield threshold: lower if player hasn't merged in 30 drops
      dropsSinceLastMergeRef.current += 1;
      if (
        dropsSinceLastMergeRef.current >= SHIELD_THRESHOLD_ADAPT_DROPS &&
        currentThresholdMinRef.current > SHIELD_THRESHOLD_MIN
      ) {
        currentThresholdMinRef.current = Math.max(
          SHIELD_THRESHOLD_MIN,
          currentThresholdMinRef.current - 2,
        );
        dropsSinceLastMergeRef.current = 0;
      }

      const injectBlackHole = dropCountRef.current % BLACK_HOLE_SPAWN_INTERVAL === 0;
      const injectVirus = !injectBlackHole && dropCountRef.current % VIRUS_SPAWN_INTERVAL === 0;
      const injectStar = !injectBlackHole && !injectVirus && dropCountRef.current % STAR_SPAWN_INTERVAL === 0;
      const injectMystery = !injectBlackHole && !injectVirus && !injectStar && dropCountRef.current % MYSTERY_PLANET_SPAWN_INTERVAL === 0;

      const nextMysteryId = injectMystery ? Math.floor(Math.random() * 4) + 1 : prev.mysteryPlanetId;

      const dropCount = dropCountRef.current;
      setState((s) => ({
        ...s,
        planets: [...s.planets, newPlanet],
        currentIsBlackHole: injectBlackHole,
        currentIsVirus: injectVirus,
        currentIsStar: injectStar,
        currentIsMystery: injectMystery,
        mysteryPlanetId: nextMysteryId,
        currentPlanetId: s.nextPlanetId,
        nextPlanetId: getFromBag(s.nextPlanetId),
        pointerX: clampedX,
        isDropping: true,
        dropCount,
        checksum: calculateChecksum(s.score, dropCount),
      }));
    }

    // Tick mystery planets reveal drops DOWN visually for any planet that dropped right now
    physicsRef.current.tickMysteryPlanets();

    // Wake the RAF loop in case it was paused while the scene was idle
    startLoop();

    setTimeout(() => {
      // Clear the combo banner when the player gets control back — banner
      // should only show during the settling phase, not while aiming.
      isDroppingRef.current = false;
      setState((s) => ({ ...s, isDropping: false, showCombo: false }));
    }, DROP_DELAY);
  }, [gameWidth, startLoop]);

  const removeExplosion = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      explosions: prev.explosions.filter((e) => e.id !== id),
    }));
  }, []);

  const restart = useCallback(() => {
    isDroppingRef.current = false;
    startTimeRef.current = Date.now();
    loopActiveRef.current = false;
    cancelAnimationFrame(rafRef.current);
    pendingSpawnsRef.current = [];
    pendingExplosionsRef.current = [];
    pendingMergeSpawnIdsRef.current = [];
    pendingStarSpawnsRef.current = [];
    pendingBlackHoleSpawnsRef.current = [];
    pendingVirusSpawnsRef.current = [];
    dropCountRef.current = 0;
    sickPlanetIdsRef.current.clear();
    shieldLayersRef.current = 0;
    currentThresholdMinRef.current = SHIELD_THRESHOLD_DEFAULT;
    dropsSinceLastMergeRef.current = 0;
    physicsRef.current?.setShieldActive(false);
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    comboRef.current = 1;
    scoreRef.current = 0;

    // Reset shrink bonus on manual restart
    physicsRef.current?.setPlanetShrink(false, 1.0);

    setState((prev) => {
      refillBag();
      const current = getFromBag();
      const next = getFromBag(current);
      return {
        ...INITIAL_STATE,
        highScore: Math.max(prev.highScore, prev.score),
        diamonds: prev.diamonds,
        sessionDiamonds: 0,
        currentPlanetId: current,
        nextPlanetId: next,
        currentIsStar: false,
        currentIsBlackHole: false,
        currentIsVirus: false,
        pointerX: gameWidth / 2,
        explosions: [],
        mergeSpawnIds: [],
        stars: [],
        blackHoles: [],
        viruses: [],
        sickPlanetIds: [],
        shieldLayers: 0,
        // Ensure shrink state is fully cleared even if INITIAL_STATE was mutated (safety)
        shrinkTimeLeft: 0,
        shrinkCost: WIZARD_SHRINK_BASE_COST,
      };
    });

    // Re-init physics then restart loop
    setTimeout(() => {
      initPhysics();
      startLoop();
    }, 50);
  }, [gameWidth, initPhysics, startLoop]);

  const continueGame = useCallback(() => {
    const cost = Math.ceil(scoreRef.current / 5000) * 10;
    if (stateRef.current.diamonds < cost || !physicsRef.current) return false;

    const newTotal = stateRef.current.diamonds - cost;
    totalDiamondsRef.current = newTotal;
    storage.setDiamonds(newTotal);

    // Reset drop lock
    isDroppingRef.current = false;

    // Clear top area to give space (160px from top)
    physicsRef.current.clearTop(160);

    setState((s) => ({
      ...s,
      gameOver: false,
      isDropping: false,
      showCombo: false,
      diamonds: newTotal,
      // Sync state with physics after clearing
      planets: physicsRef.current!.getAllPlanets().map(p => ({
        id: p.id,
        planetId: p.planetId,
        x: p.body.position.x,
        y: p.body.position.y,
        angle: p.body.angle,
        size: pRadii[p.planetId - 1],
        scale: (p.planetId >= 4 && stateRef.current.shrinkTimeLeft > 0) ? WIZARD_SHRINK_SCALE : 1,
        isMystery: p.isMystery,
      })),
      stars: physicsRef.current!.getAllStars().map(s => ({
        id: s.id,
        x: s.body.position.x,
        y: s.body.position.y,
        angle: s.body.angle,
        size: sRadius,
      })),
      blackHoles: physicsRef.current!.getAllBlackHoles().map(bh => ({
        id: bh.id,
        x: bh.body.position.x,
        y: bh.body.position.y,
        size: bhRadius,
      })),
      viruses: physicsRef.current!.getAllViruses().map(v => ({
        id: v.id,
        x: v.body.position.x,
        y: v.body.position.y,
        size: vRadius,
      })),
    }));

    // Restart the loop
    startLoop();
    return true;
  }, [startLoop, pRadii, sRadius, bhRadius, vRadius]);

  const buyShrinkBonus = useCallback(() => {
    setState((prev) => {
      const cost = prev.shrinkCost;
      if (prev.diamonds < cost) {
        playSound('error');
        return prev;
      }

      playSound('buy');
      const newTotal = prev.diamonds - cost;
      totalDiamondsRef.current = newTotal;
      storage.setDiamonds(newTotal);

      // Wake up physics and loop
      physicsRef.current?.setPlanetShrink(true, WIZARD_SHRINK_SCALE);
      startLoop();

      const nextCost = cost + WIZARD_SHRINK_COST_INCREMENT;
      const nextTime = prev.shrinkTimeLeft + WIZARD_SHRINK_DURATION;
      
      return {
        ...prev,
        diamonds: newTotal,
        shrinkTimeLeft: nextTime,
        shrinkCost: nextCost,
      };
    });
  }, [playSound, startLoop]);

  const buyShield = useCallback(() => {
    setState((prev) => {
      const cost = WIZARD_SHIELD_COST;
      if (prev.diamonds < cost || prev.shieldLayers === SHIELD_MAX_LAYERS) {
        playSound('error');
        return prev;
      }

      playSound('buy');
      const newTotal = prev.diamonds - cost;
      totalDiamondsRef.current = newTotal;
      storage.setDiamonds(newTotal);

      shieldLayersRef.current = SHIELD_MAX_LAYERS;
      physicsRef.current?.setShieldActive(true);
      startLoop();

      return {
        ...prev,
        diamonds: newTotal,
        shieldLayers: SHIELD_MAX_LAYERS,
      };
    });
  }, [playSound, startLoop]);

  const redeemCode = useCallback((code: string): { success: boolean; message: string; amount?: number } => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return { success: false, message: 'Please enter a code' };

    if (stateRef.current.redeemedCodes.includes(normalized)) {
      return { success: false, message: 'Already redeemed' };
    }

    const amount = REDEEM_CODES[normalized];
    if (amount) {
      playSound('buy');
      const newRedeemed = [...stateRef.current.redeemedCodes, normalized];
      const newDiamonds = stateRef.current.diamonds + amount;
      
      totalDiamondsRef.current = newDiamonds;
      storage.setDiamonds(newDiamonds);
      storage.setRedeemedCodes(newRedeemed);

      setState(prev => ({
        ...prev,
        diamonds: newDiamonds,
        redeemedCodes: newRedeemed,
      }));

      return { success: true, message: `Redeemed! +${amount} 💎`, amount };
    }

    return { success: false, message: 'Invalid code' };
  }, [playSound]);

  return { state, setPointerX, dropPlanet, restart, continueGame, removeExplosion, buyShrinkBonus, buyShield, redeemCode, isDroppingRef, scoreRef, dropCountRef };
}
