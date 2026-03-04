import { useEffect, useRef, useCallback, useState } from 'react';
import { SolarPhysics } from './physics';
import {
  PLANETS,
  GAME_WIDTH,
  GAME_HEIGHT,
  DANGER_HEIGHT,
  DROP_DELAY,
  MAX_SPAWN_LEVEL,
  COMBO_RESET_TIME,
  STAR_RADIUS,
  STAR_SPAWN_INTERVAL,
  BLACK_HOLE_RADIUS,
  BLACK_HOLE_SPAWN_INTERVAL,
  VIRUS_RADIUS,
  VIRUS_SPAWN_INTERVAL,
  SHIELD_MAX_LAYERS,
  SHIELD_THRESHOLD_DEFAULT,
  SHIELD_THRESHOLD_MIN,
  SHIELD_THRESHOLD_ADAPT_DROPS,
} from './constants';
import { GameState, RenderPlanet, RenderStar, RenderBlackHole, RenderVirus, Explosion, Particle } from './types';

let idCounter = 0;
const genId = () => `p_${++idCounter}`;

const HIGH_SCORE_KEY = 'solar-merge-highscore';

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

const storage = {
  get: (): { score: number; dropCount: number; checksum: string } => {
    try {
      const val = typeof localStorage !== 'undefined' ? localStorage.getItem(HIGH_SCORE_KEY) : null;
      if (!val) return { score: 0, dropCount: 0, checksum: calculateChecksum(0, 0) };
      const data = JSON.parse(val);
      if (data.checksum === calculateChecksum(data.score, data.dropCount)) {
        return data;
      }
    } catch { }
    return { score: 0, dropCount: 0, checksum: calculateChecksum(0, 0) };
  },
  set: (score: number, dropCount: number) => {
    try {
      if (typeof localStorage !== 'undefined') {
        const checksum = calculateChecksum(score, dropCount);
        localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify({ score, dropCount, checksum }));
      }
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

const createExplosionParticles = (x: number, y: number, color: string, count = 10): Particle[] => {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 3;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 5 + 3,
      color,
    };
  });
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
  pointerX: GAME_WIDTH / 2,
  isDropping: false,
  gameOver: false,
  comboDisplay: 1,
  showCombo: false,
  explosions: [],
  mergeSpawnIds: [],
  sickPlanetIds: [],
  shieldLayers: 0,
};

export function useGame(gameWidth: number = GAME_WIDTH, gameHeight: number = GAME_HEIGHT) {
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
  const pendingSpawnsRef = useRef<Array<{ id: string; planetId: number; x: number; y: number }>>([]);
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

  const [state, setState] = useState<GameState>(() => {
    const saved = storage.get();
    return {
      ...INITIAL_STATE,
      highScore: saved.score,
      checksum: calculateChecksum(0, 0),
      currentPlanetId: 1,
      nextPlanetId: 2,
      pointerX: gameWidth / 2,
    };
  });
  const stateRef = useRef<GameState>(state);
  stateRef.current = state;

  // ─── Physics init ─────────────────────────────────────────────────────────
  const initPhysics = useCallback(() => {
    if (physicsRef.current) physicsRef.current.destroy();

    const engine = new SolarPhysics(gameWidth, gameHeight);

    engine.onMerge(({ id1, id2, planetId, x, y }) => {
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
          engine.addPlanet(newId, downPlanetId, x, y);
          pendingSpawnsRef.current.push({ id: newId, planetId: downPlanetId, x, y });
          pendingMergeSpawnIdsRef.current.push(newId);
          engine.applyMergeShockwave(x, y, planet.size, newId);
        }
        // level 1 sick + level 1 → both vanish (downPlanetId === 0, no spawn)

        // Purple sick explosion
        pendingExplosionsRef.current.push({
          id: `exp_sick_${Date.now()}_${Math.random()}`,
          x, y,
          particles: createExplosionParticles(x, y, '#AA00FF', 12),
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
          engine.addPlanet(newId, nextPlanetId, x, y);
          pendingSpawnsRef.current.push({ id: newId, planetId: nextPlanetId, x, y });
          pendingMergeSpawnIdsRef.current.push(newId);
          engine.applyMergeShockwave(x, y, planet.size, newId);
        }

        pendingExplosionsRef.current.push({
          id: `exp_${Date.now()}_${Math.random()}`,
          x, y,
          particles: createExplosionParticles(x, y, planet.color, 12),
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
            storage.set(newHighScore, dropCountRef.current);
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
      const planet = PLANETS[planetTypeId - 1];
      const isSick = sickPlanetIdsRef.current.has(planetId);
      sickPlanetIdsRef.current.delete(planetId);

      if (isSick) {
        // ── Healing: star cures the sick planet (same level, no score) ───
        // Physics already removed the planet — re-add it at the same level
        const healId = genId();
        engine.addPlanet(healId, planetTypeId, x, y);
        pendingSpawnsRef.current.push({ id: healId, planetId: planetTypeId, x, y });
        pendingMergeSpawnIdsRef.current.push(healId);

        // Cyan healing burst
        pendingExplosionsRef.current.push({
          id: `exp_heal_${Date.now()}_${Math.random()}`,
          x, y,
          particles: createExplosionParticles(x, y, '#00E5FF', 15),
        });

        // Healing also creates a small physical burst
        engine.applyMergeShockwave(x, y, planet.size * 0.5, healId);

        setState((prev) => ({
          ...prev,
          sickPlanetIds: Array.from(sickPlanetIdsRef.current),
          planets: prev.planets.filter((p) => p.id !== planetId),
          stars: prev.stars.filter((s) => s.id !== starId),
        }));

      } else {
        // ── Normal star: level up + score ─────────────────────────────────
        const newId = genId();
        const nextPlanetTypeId = planetTypeId + 1;

        if (nextPlanetTypeId <= PLANETS.length) {
          engine.addPlanet(newId, nextPlanetTypeId, x, y);
          pendingSpawnsRef.current.push({ id: newId, planetId: nextPlanetTypeId, x, y });
          pendingMergeSpawnIdsRef.current.push(newId);
          engine.applyMergeShockwave(x, y, planet.size, newId);
        }

        // ── Star + Sun: gravitational collapse — suck surrounding objects ──
        const isSunHit = planetTypeId === PLANETS.length;
        if (isSunHit) {
          engine.applyBlackHoleSuction(x, y, planet.size);
        }

        // Explosion: dramatic dark-gold implosion for Sun, normal gold otherwise
        pendingExplosionsRef.current.push({
          id: `exp_star_${Date.now()}_${Math.random()}`,
          x, y,
          particles: createExplosionParticles(x, y, isSunHit ? '#FF6600' : '#FFD600', 15),
        });

        setState((prev) => {
          const earned = planet.score;
          scoreRef.current += earned;
          const newScore = scoreRef.current;
          const newHighScore = Math.max(prev.highScore, newScore);
          if (newHighScore > prev.highScore) {
            storage.set(newHighScore, dropCountRef.current);
          }

          return {
            ...prev,
            score: newScore,
            highScore: newHighScore,
            checksum: calculateChecksum(newScore, dropCountRef.current),
            planets: isSunHit ? prev.planets : prev.planets.filter((p) => p.id !== planetId),
            stars: prev.stars.filter((s) => s.id !== starId),
          };
        });
      }
    });

    // ── Black hole suck handler ──────────────────────────────────────────
    engine.onBlackHoleSuck(({ blackHoleId, planetId, planetTypeId, x, y }) => {
      sickPlanetIdsRef.current.delete(planetId); // clean up if sick planet gets sucked
      const planet = PLANETS[planetTypeId - 1];

      // Pull ALL surrounding planets inward
      engine.applyBlackHoleSuction(x, y, planet.size, true);

      // Dark implosion explosion at the planet's position
      pendingExplosionsRef.current.push({
        id: `exp_bh_${Date.now()}_${Math.random()}`,
        x, y,
        particles: createExplosionParticles(x, y, '#6a00cc', 15),
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
      sickPlanetIdsRef.current.add(planetId);

      const planet = PLANETS[planetTypeId - 1];
      pendingExplosionsRef.current.push({
        id: `exp_virus_${Date.now()}_${Math.random()}`,
        x, y,
        particles: createExplosionParticles(x, y, '#76FF03', 15),
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

      // Supernova explosion: outward blast followed by intense global collapse
      engine.applyMergeShockwave(x, y, sun.size * 2);
      engine.applyBlackHoleSuction(x, y, sun.size, true);

      // Supernova explosion — large, golden-orange
      pendingExplosionsRef.current.push({
        id: `exp_sunbh_${Date.now()}_${Math.random()}`,
        x, y,
        particles: createExplosionParticles(x, y, '#FF6600', 25),
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
          storage.set(newHighScore, dropCountRef.current);
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

      if (highest && highest.y < DANGER_HEIGHT) {
        // Condition: Any planet that has been on the board for > 800ms 
        // crossing the danger line triggers an INSTANT Game Over.
        // This gives new drops/merges a grace period but handles "pushed" planets immediately.
        const isOld = (Date.now() - highest.spawnTime) > 800;

        if (isOld) {
          setState((prev) => {
            const newHighScore = Math.max(prev.highScore, scoreRef.current);
            if (newHighScore > prev.highScore) {
              storage.set(newHighScore, dropCountRef.current);
            }
            return {
              ...prev,
              gameOver: true,
              highScore: newHighScore,
              checksum: calculateChecksum(scoreRef.current, dropCountRef.current),
            };
          });
          loopActiveRef.current = false;
          cancelAnimationFrame(rafRef.current);

          // ... cleanup
          pendingSpawnsRef.current = [];
          pendingExplosionsRef.current = [];
          pendingMergeSpawnIdsRef.current = [];
          pendingStarSpawnsRef.current = [];
          pendingBlackHoleSpawnsRef.current = [];
          pendingVirusSpawnsRef.current = [];
          if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
          if (comboTimerShowRef.current) clearTimeout(comboTimerShowRef.current);
          physicsRef.current?.destroy();
          physicsRef.current = null;

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
              return {
                id: p.id,
                planetId: p.planetId,
                x: p.x,
                y: p.y,
                angle: p.angle,
                spawnTime: p.spawnTime || Date.now(),
              } as RenderPlanet;
            });

          // Add newly merged spawns
          spawns.forEach((s) => {
            const physicsPlanet = allPlanets.find(p => p.id === s.id);
            updated.push({
              id: s.id,
              planetId: s.planetId,
              x: s.x,
              y: s.y,
              angle: 0,
              spawnTime: physicsPlanet?.spawnTime || Date.now()
            });
          });

          // Remove stale IDs (merged/destroyed planets) from sick + mergeSpawn lists
          const livePlanetIdSet = new Set(updated.map((p) => p.id));
          const cleanSickIds = prev.sickPlanetIds.filter((id) => livePlanetIdSet.has(id));
          const cleanMergeSpawnIds = prev.mergeSpawnIds.filter((id) => livePlanetIdSet.has(id));

          // Sync stars from physics
          const updatedStars: RenderStar[] = allStars.map((s) => ({
            id: s.id,
            x: s.x,
            y: s.y,
            angle: s.angle,
          }));

          // Sync black holes from physics
          const updatedBlackHoles: RenderBlackHole[] = allBlackHoles.map((bh) => ({
            id: bh.id,
            x: bh.x,
            y: bh.y,
          }));

          // Sync viruses from physics
          const updatedViruses: RenderVirus[] = allViruses.map((v) => ({
            id: v.id,
            x: v.x,
            y: v.y,
          }));

          // Update existing particles motion
          const updatedExplosions = prev.explosions.map((exp) => ({
            ...exp,
            particles: exp.particles.map((p) => ({
              ...p,
              x: p.x + p.vx,
              y: p.y + p.vy,
            })),
          }));

          return {
            ...prev,
            planets: updated,
            stars: updatedStars,
            blackHoles: updatedBlackHoles,
            viruses: updatedViruses,
            sickPlanetIds: cleanSickIds,
            explosions: [...updatedExplosions, ...newExplosions],
            mergeSpawnIds: freshMergeIds.length > 0
              ? [...cleanMergeSpawnIds, ...freshMergeIds]
              : cleanMergeSpawnIds,
          };
        });
      }

      // Clear merge spawn IDs after pop animation finishes (100ms per user request)
      if (freshMergeIds.length > 0) {
        const freshMergeIdSet = new Set(freshMergeIds);
        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            mergeSpawnIds: prev.mergeSpawnIds.filter((id) => !freshMergeIdSet.has(id)),
          }));
        }, 100);
      }

      // Clear explosions after they finish (100ms per user request)
      if (newExplosions.length > 0) {
        newExplosions.forEach(exp => {
          setTimeout(() => {
            setState(prev => ({
              ...prev,
              explosions: prev.explosions.filter(e => e.id !== exp.id)
            }));
          }, 100);
        });
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
    setState(s => ({ ...s, currentPlanetId: current, nextPlanetId: next }));

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

    // ── Drop a virus ───────────────────────────────────────────────────
    if (prev.currentIsVirus) {
      const clampedX = Math.max(VIRUS_RADIUS + 2, Math.min(gameWidth - VIRUS_RADIUS - 2, x));
      const startY = VIRUS_RADIUS + 2;
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
      const clampedX = Math.max(STAR_RADIUS + 2, Math.min(gameWidth - STAR_RADIUS - 2, x));
      const startY = STAR_RADIUS + 2;
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
      const clampedX = Math.max(BLACK_HOLE_RADIUS + 2, Math.min(gameWidth - BLACK_HOLE_RADIUS - 2, x));
      const startY = BLACK_HOLE_RADIUS + 2;
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
    // ── Drop a planet ──────────────────────────────────────────────────
    else {
      const planet = PLANETS[prev.currentPlanetId - 1];
      const clampedX = Math.max(planet.size + 2, Math.min(gameWidth - planet.size - 2, x));
      const startY = planet.size + 2;

      const id = genId();
      physicsRef.current.addPlanet(id, prev.currentPlanetId, clampedX, startY);

      const newPlanet: RenderPlanet = {
        id,
        planetId: prev.currentPlanetId,
        x: clampedX,
        y: startY,
        angle: 0,
        spawnTime: Date.now(),
      };

      // Determine special injection. Priority: BH > Virus > Star.
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

      const dropCount = dropCountRef.current;
      setState((s) => ({
        ...s,
        planets: [...s.planets, newPlanet],
        currentIsBlackHole: injectBlackHole,
        currentIsVirus: injectVirus,
        currentIsStar: injectStar,
        currentPlanetId: s.nextPlanetId,
        nextPlanetId: getFromBag(s.nextPlanetId),
        pointerX: clampedX,
        isDropping: true,
        dropCount,
        checksum: calculateChecksum(s.score, dropCount),
      }));
    }

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

    setState((prev) => {
      refillBag();
      const current = getFromBag();
      const next = getFromBag(current);
      return {
        ...INITIAL_STATE,
        highScore: Math.max(prev.highScore, prev.score),
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
      };
    });

    // Re-init physics then restart loop
    setTimeout(() => {
      initPhysics();
      startLoop();
    }, 50);
  }, [gameWidth, initPhysics, startLoop]);

  return { state, setPointerX, dropPlanet, restart, removeExplosion, isDroppingRef, scoreRef, dropCountRef };
}
