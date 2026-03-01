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

function randomPlanetId(): number {
  return Math.floor(Math.random() * MAX_SPAWN_LEVEL) + 1;
}

const INITIAL_STATE: GameState = {
  planets: [],
  score: 0,
  highScore: 0,
  currentPlanetId: randomPlanetId(),
  nextPlanetId: randomPlanetId(),
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

    engine.onMerge(({ id1, id2, planetId, x, y }) => {
      const newId = genId();
      const nextPlanetId = planetId + 1;

      const planet = PLANETS[planetId - 1];

      if (nextPlanetId <= PLANETS.length) {
        engine.addPlanet(newId, nextPlanetId, x, Math.max(y, PLANETS[nextPlanetId - 1].size));
        pendingSpawnsRef.current.push({ id: newId, planetId: nextPlanetId, x, y });
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
      if (prev.isDropping || prev.gameOver || !physicsRef.current) return prev;

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
        nextPlanetId: randomPlanetId(),
        pointerX: clampedX,
        isDropping: true,
      };
    });

    setTimeout(() => {
      // Clear the combo banner when the player gets control back — banner
      // should only show during the settling phase, not while aiming.
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

    setState((prev) => ({
      ...INITIAL_STATE,
      highScore: Math.max(prev.highScore, prev.score),
      currentPlanetId: randomPlanetId(),
      nextPlanetId: randomPlanetId(),
      pointerX: gameWidth / 2,
      explosions: [],
      mergeSpawnIds: [],
    }));

    // Re-init physics then restart loop
    setTimeout(() => {
      initPhysics();
      startLoop();
    }, 50);
  }, [gameWidth, initPhysics, startLoop]);

  return { state, setPointerX, dropPlanet, restart, removeExplosion };
}
