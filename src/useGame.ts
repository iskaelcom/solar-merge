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
} from './constants';
import { GameState, RenderPlanet, RenderStar, RenderBlackHole, Explosion } from './types';

let idCounter = 0;
const genId = () => `p_${++idCounter}`;

const HIGH_SCORE_KEY = 'solar-merge-highscore';

const storage = {
  get: (): number => {
    try {
      const val = typeof localStorage !== 'undefined' ? localStorage.getItem(HIGH_SCORE_KEY) : null;
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  },
  set: (score: number) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(HIGH_SCORE_KEY, score.toString());
      }
    } catch {
      // Ignore storage errors
    }
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
  score: 0,
  highScore: 0,
  currentPlanetId: 1,
  nextPlanetId: 2,
  currentIsStar: false,
  currentIsBlackHole: false,
  pointerX: GAME_WIDTH / 2,
  isDropping: false,
  gameOver: false,
  combo: 1,
  showCombo: false,
  explosions: [],
  mergeSpawnIds: [],
};

export function useGame(gameWidth: number = GAME_WIDTH, gameHeight: number = GAME_HEIGHT) {
  const physicsRef = useRef<SolarPhysics | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const comboTimerShowRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track merge-spawned planets that need to be added to render state
  const pendingSpawnsRef = useRef<Array<{ id: string; planetId: number; x: number; y: number }>>([]);
  // Track explosions triggered by merges
  const pendingExplosionsRef = useRef<Explosion[]>([]);
  // Track IDs of planets spawned from a merge (for pop animation)
  const pendingMergeSpawnIdsRef = useRef<string[]>([]);
  // Robust drop lock to prevent race conditions with multiple rapid taps
  const isDroppingRef = useRef<boolean>(false);
  // Shuffle bag for levels 1-6 variety
  const bagRef = useRef<number[]>([]);
  // Star / Black Hole power-up tracking
  const pendingStarSpawnsRef = useRef<Array<{ id: string; x: number; y: number }>>([]);
  const pendingBlackHoleSpawnsRef = useRef<Array<{ id: string; x: number; y: number }>>([]);
  const dropCountRef = useRef<number>(0);

  const refillBag = useCallback(() => {
    bagRef.current = shuffle([1, 2, 3, 4, 5, 6]);
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
    // Basic init, will be properly shuffled in useEffect or initial call
    return {
      ...INITIAL_STATE,
      highScore: storage.get(),
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
      const newId = genId();
      const nextPlanetId = planetId + 1;

      const planet = PLANETS[planetId - 1];

      if (nextPlanetId <= PLANETS.length) {
        const nextSize = PLANETS[nextPlanetId - 1].size;
        // Ensure the new planet doesn't spawn too high or get stuck in walls
        const spawnY = Math.max(y, nextSize + 10);
        engine.addPlanet(newId, nextPlanetId, x, spawnY);
        pendingSpawnsRef.current.push({ id: newId, planetId: nextPlanetId, x, y: spawnY });
        pendingMergeSpawnIdsRef.current.push(newId);

        // Shockwave — push all surrounding planets outward from the merge point
        engine.applyMergeShockwave(x, y, planet.size, newId);
      }

      // Queue an explosion at the merge point
      const newExplosion: Explosion = {
        id: `exp_${Date.now()}_${Math.random()}`,
        x,
        y,
        planetSize: planet.size,
        color: planet.color,
        scale: Math.max(0.8, planet.size / 30),
      };
      pendingExplosionsRef.current.push(newExplosion);

      // Score & combo
      setState((prev) => {
        const planet = PLANETS[planetId - 1];
        const combo = prev.combo;
        const earned = planet.score * combo;
        const newCombo = combo + 1;
        const newScore = prev.score + earned;
        const newHighScore = Math.max(prev.highScore, newScore);

        if (newHighScore > prev.highScore) {
          storage.set(newHighScore);
        }

        if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
        comboTimerRef.current = setTimeout(() => {
          setState((s) => ({ ...s, combo: 1, showCombo: false }));
        }, COMBO_RESET_TIME);

        if (comboTimerShowRef.current) clearTimeout(comboTimerShowRef.current);
        comboTimerShowRef.current = setTimeout(() => {
          setState((s) => ({ ...s, showCombo: false }));
        }, 1200);

        return {
          ...prev,
          score: newScore,
          highScore: newHighScore,
          combo: newCombo,
          showCombo: newCombo > 1,
          // Remove merged planets, merged-spawn added in game loop
          planets: prev.planets.filter((p) => p.id !== id1 && p.id !== id2),
        };
      });
    });

    // ── Star upgrade handler ─────────────────────────────────────────────
    engine.onStarUpgrade(({ starId, planetId, planetTypeId, x, y }) => {
      const newId = genId();
      const nextPlanetTypeId = Math.min(planetTypeId + 1, PLANETS.length);

      if (planetTypeId < PLANETS.length) {
        const nextSize = PLANETS[nextPlanetTypeId - 1].size;
        const spawnY = Math.max(y, nextSize + 10);
        engine.addPlanet(newId, nextPlanetTypeId, x, spawnY);
        pendingSpawnsRef.current.push({ id: newId, planetId: nextPlanetTypeId, x, y: spawnY });
        pendingMergeSpawnIdsRef.current.push(newId);

        const planet = PLANETS[planetTypeId - 1];
        engine.applyMergeShockwave(x, spawnY, planet.size, newId);
      }

      // Gold explosion at the hit point
      const planet = PLANETS[planetTypeId - 1];
      pendingExplosionsRef.current.push({
        id: `exp_star_${Date.now()}_${Math.random()}`,
        x,
        y,
        planetSize: planet.size,
        color: '#FFD600',
        scale: Math.max(0.8, planet.size / 30),
      });

      // Score + remove old planet & star from render state
      setState((prev) => {
        const earned = planet.score;
        const newScore = prev.score + earned;
        const newHighScore = Math.max(prev.highScore, newScore);
        if (newHighScore > prev.highScore) storage.set(newHighScore);

        return {
          ...prev,
          score: newScore,
          highScore: newHighScore,
          planets: prev.planets.filter((p) => p.id !== planetId),
          stars: prev.stars.filter((s) => s.id !== starId),
        };
      });
    });

    // ── Black hole suck handler ──────────────────────────────────────────
    engine.onBlackHoleSuck(({ blackHoleId, planetId, planetTypeId, x, y }) => {
      // Dark implosion explosion at the planet's position
      const planet = PLANETS[planetTypeId - 1];
      pendingExplosionsRef.current.push({
        id: `exp_bh_${Date.now()}_${Math.random()}`,
        x,
        y,
        planetSize: planet.size,
        color: '#6a00cc',  // dark purple vortex
        scale: Math.max(0.6, planet.size / 40),
      });

      // Remove planet & black hole from render state (no score — black hole is a utility)
      setState((prev) => ({
        ...prev,
        planets: prev.planets.filter((p) => p.id !== planetId),
        blackHoles: prev.blackHoles.filter((bh) => bh.id !== blackHoleId),
      }));
    });

    physicsRef.current = engine;
  }, [gameWidth, gameHeight]);

  // ─── Game loop ────────────────────────────────────────────────────────────
  const startLoop = useCallback(() => {
    lastTimeRef.current = performance.now();

    const loop = (time: number) => {
      if (!physicsRef.current) return;

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
          setState((prev) => {
            const newHighScore = Math.max(prev.highScore, prev.score);
            if (newHighScore > prev.highScore) {
              storage.set(newHighScore);
            }
            return {
              ...prev,
              gameOver: true,
              highScore: newHighScore,
            };
          });
          cancelAnimationFrame(rafRef.current);
          return;
        }
      }

      // Collect pending spawns, explosions, merge spawn IDs, star/BH spawns
      const spawns = pendingSpawnsRef.current.splice(0);
      const newExplosions = pendingExplosionsRef.current.splice(0);
      const freshMergeIds = pendingMergeSpawnIdsRef.current.splice(0);
      const starSpawns = pendingStarSpawnsRef.current.splice(0);
      const bhSpawns = pendingBlackHoleSpawnsRef.current.splice(0);

      // Sync positions from physics (source of truth)
      const allStars = physicsRef.current.getAllStars();
      const allBlackHoles = physicsRef.current.getAllBlackHoles();

      // Skip React state updates if the physics world is stable and no new events happened.
      const hasEvents = spawns.length > 0 || newExplosions.length > 0 || freshMergeIds.length > 0
        || starSpawns.length > 0 || bhSpawns.length > 0;
      const isSceneActive = physicsRef.current.hasActiveBodies();

      if (hasEvents || isSceneActive || stateRef.current.gameOver) {
        setState((prev) => {
          if (prev.gameOver) return prev;

          const updated: RenderPlanet[] = allPlanets
            .filter((p) => !spawns.some((s) => s.id === p.id)) // exclude brand-new spawns (added below)
            .map((p) => {
              const pos = p.body.position;
              return {
                id: p.id,
                planetId: p.planetId,
                x: pos.x,
                y: pos.y,
                angle: p.body.angle,
              } as RenderPlanet;
            });

          // Add newly merged spawns
          spawns.forEach((s) => {
            updated.push({ id: s.id, planetId: s.planetId, x: s.x, y: s.y, angle: 0 });
          });

          // Sync stars from physics
          const updatedStars: RenderStar[] = allStars.map((s) => ({
            id: s.id,
            x: s.body.position.x,
            y: s.body.position.y,
            angle: s.body.angle,
          }));

          // Sync black holes from physics
          const updatedBlackHoles: RenderBlackHole[] = allBlackHoles.map((bh) => ({
            id: bh.id,
            x: bh.body.position.x,
            y: bh.body.position.y,
          }));

          return {
            ...prev,
            planets: updated,
            stars: updatedStars,
            blackHoles: updatedBlackHoles,
            explosions: [...prev.explosions, ...newExplosions],
            mergeSpawnIds: freshMergeIds.length > 0
              ? [...prev.mergeSpawnIds, ...freshMergeIds]
              : prev.mergeSpawnIds,
          };
        });
      }

      // Clear merge spawn IDs after pop animation finishes (~900ms)
      if (freshMergeIds.length > 0) {
        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            mergeSpawnIds: prev.mergeSpawnIds.filter((id) => !freshMergeIds.includes(id)),
          }));
        }, 900);
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
    setState((prev) => {
      if (isDroppingRef.current || prev.gameOver || !physicsRef.current) return prev;
      isDroppingRef.current = true;

      // ── Drop a star ────────────────────────────────────────────────────
      if (prev.currentIsStar) {
        const clampedX = Math.max(STAR_RADIUS + 2, Math.min(gameWidth - STAR_RADIUS - 2, x));
        const startY = STAR_RADIUS + 2;
        const id = genId();
        physicsRef.current.addStar(id, clampedX, startY);
        pendingStarSpawnsRef.current.push({ id, x: clampedX, y: startY });

        return {
          ...prev,
          currentIsStar: false,
          // currentPlanetId already holds the planet that comes after the star
          pointerX: clampedX,
          isDropping: true,
        };
      }

      // ── Drop a black hole ──────────────────────────────────────────────
      if (prev.currentIsBlackHole) {
        const clampedX = Math.max(BLACK_HOLE_RADIUS + 2, Math.min(gameWidth - BLACK_HOLE_RADIUS - 2, x));
        const startY = BLACK_HOLE_RADIUS + 2;
        const id = genId();
        physicsRef.current.addBlackHole(id, clampedX, startY);
        pendingBlackHoleSpawnsRef.current.push({ id, x: clampedX, y: startY });

        return {
          ...prev,
          currentIsBlackHole: false,
          // currentPlanetId already holds the planet that comes after the black hole
          pointerX: clampedX,
          isDropping: true,
        };
      }

      // ── Drop a planet ──────────────────────────────────────────────────
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
      };

      // Determine special injection: black hole every 10, star every 6 (BH takes priority)
      dropCountRef.current += 1;
      const injectBlackHole = dropCountRef.current % BLACK_HOLE_SPAWN_INTERVAL === 0;
      const injectStar = !injectBlackHole && dropCountRef.current % STAR_SPAWN_INTERVAL === 0;

      return {
        ...prev,
        planets: [...prev.planets, newPlanet],
        currentIsBlackHole: injectBlackHole,
        currentIsStar: injectStar,
        // currentPlanetId stores the planet held AFTER the special (or just the next planet)
        currentPlanetId: prev.nextPlanetId,
        nextPlanetId: getFromBag(prev.nextPlanetId),
        pointerX: clampedX,
        isDropping: true,
      };
    });

    setTimeout(() => {
      // Clear the combo banner when the player gets control back — banner
      // should only show during the settling phase, not while aiming.
      isDroppingRef.current = false;
      setState((s) => ({ ...s, isDropping: false, showCombo: false }));
    }, DROP_DELAY);
  }, [gameWidth]);

  const removeExplosion = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      explosions: prev.explosions.filter((e) => e.id !== id),
    }));
  }, []);

  const restart = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    pendingSpawnsRef.current = [];
    pendingExplosionsRef.current = [];
    pendingMergeSpawnIdsRef.current = [];
    pendingStarSpawnsRef.current = [];
    pendingBlackHoleSpawnsRef.current = [];
    dropCountRef.current = 0;
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);

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
        pointerX: gameWidth / 2,
        explosions: [],
        mergeSpawnIds: [],
        stars: [],
        blackHoles: [],
      };
    });

    // Re-init physics then restart loop
    setTimeout(() => {
      initPhysics();
      startLoop();
    }, 50);
  }, [gameWidth, initPhysics, startLoop]);

  return { state, setPointerX, dropPlanet, restart, removeExplosion, isDroppingRef };
}
