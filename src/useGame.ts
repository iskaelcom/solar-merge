import { useEffect, useRef, useCallback, useState } from 'react';
import { SolarPhysics } from './physics';
import {
  PLANETS,
  GAME_WIDTH,
  GAME_HEIGHT,
  DANGER_HEIGHT,
  DANGER_TIME,
  DROP_DELAY,
  MAX_SPAWN_LEVEL,
  COMBO_RESET_TIME,
} from './constants';
import { GameState, RenderPlanet, Explosion } from './types';

let idCounter = 0;
const genId = () => `p_${++idCounter}`;

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
  score: 0,
  highScore: 0,
  currentPlanetId: 1,
  nextPlanetId: 2,
  pointerX: GAME_WIDTH / 2,
  isDropping: false,
  gameOver: false,
  combo: 1,
  showCombo: false,
  dangerProgress: 0,
  explosions: [],
  mergeSpawnIds: [],
};

export function useGame(gameWidth: number = GAME_WIDTH, gameHeight: number = GAME_HEIGHT) {
  const physicsRef = useRef<SolarPhysics | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const dangerStartRef = useRef<number | null>(null);
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
      pendingExplosionsRef.current.push({
        id: genId(),
        x,
        y,
        planetSize: planet.size,
        color: planet.color,
      });

      // Score & combo
      setState((prev) => {
        const planet = PLANETS[planetId - 1];
        const combo = prev.combo;
        const earned = planet.score * combo;
        const newCombo = combo + 1;
        const newScore = prev.score + earned;

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
          combo: newCombo,
          showCombo: newCombo > 1,
          // Remove merged planets, merged-spawn added in game loop
          planets: prev.planets.filter((p) => p.id !== id1 && p.id !== id2),
        };
      });
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
      const highestY = physicsRef.current.getHighestY();
      let dangerProgress = 0;

      if (highestY < DANGER_HEIGHT && allPlanets.length > 0) {
        if (!dangerStartRef.current) dangerStartRef.current = time;
        const elapsed = time - dangerStartRef.current;
        dangerProgress = Math.min(elapsed / DANGER_TIME, 1);
        if (elapsed >= DANGER_TIME) {
          setState((prev) => ({
            ...prev,
            gameOver: true,
            highScore: Math.max(prev.highScore, prev.score),
          }));
          cancelAnimationFrame(rafRef.current);
          return;
        }
      } else {
        dangerStartRef.current = null;
      }

      // Collect pending spawns, explosions, and merge spawn IDs
      const spawns = pendingSpawnsRef.current.splice(0);
      const newExplosions = pendingExplosionsRef.current.splice(0);
      const freshMergeIds = pendingMergeSpawnIdsRef.current.splice(0);

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

        return {
          ...prev,
          planets: updated,
          dangerProgress,
          explosions: [...prev.explosions, ...newExplosions],
          mergeSpawnIds: freshMergeIds.length > 0
            ? [...prev.mergeSpawnIds, ...freshMergeIds]
            : prev.mergeSpawnIds,
        };
      });

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

      return {
        ...prev,
        planets: [...prev.planets, newPlanet],
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
    dangerStartRef.current = null;
    pendingSpawnsRef.current = [];
    pendingExplosionsRef.current = [];
    pendingMergeSpawnIdsRef.current = [];
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
        pointerX: gameWidth / 2,
        explosions: [],
        mergeSpawnIds: [],
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
