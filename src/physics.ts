import Matter from 'matter-js';
import {
  PLANETS,
  GAME_WIDTH,
  GAME_HEIGHT,
  GRAVITY,
  RESTITUTION,
  FRICTION,
  FRICTION_AIR,
} from './constants';

export interface PhysicsPlanet {
  id: string;
  planetId: number;
  body: Matter.Body;
}

export interface MergeEvent {
  id1: string;
  id2: string;
  planetId: number; // planet type that merged
  x: number;
  y: number;
}

type MergeCallback = (event: MergeEvent) => void;

export class SolarPhysics {
  engine: Matter.Engine;
  private planets: Map<string, PhysicsPlanet> = new Map();
  private mergeCallbacks: MergeCallback[] = [];
  private pendingMergeKeys: Set<string> = new Set();
  private pendingRemovalIds: Set<string> = new Set();
  width: number;
  height: number;

  constructor(width: number = GAME_WIDTH, height: number = GAME_HEIGHT) {
    this.width = width;
    this.height = height;

    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: GRAVITY },
    });

    this.createWalls();
    this.setupCollisionHandler();
  }

  private createWalls() {
    const thickness = 60;
    const opts: Matter.IBodyDefinition = {
      isStatic: true,
      restitution: 0.2,
      friction: 1,
      frictionStatic: 1,
      label: 'wall',
    };

    const walls = [
      // Floor
      Matter.Bodies.rectangle(
        this.width / 2,
        this.height + thickness / 2,
        this.width + thickness * 2,
        thickness,
        { ...opts, label: 'floor' }
      ),
      // Left wall
      Matter.Bodies.rectangle(
        -thickness / 2,
        this.height / 2,
        thickness,
        this.height * 3,
        opts
      ),
      // Right wall
      Matter.Bodies.rectangle(
        this.width + thickness / 2,
        this.height / 2,
        thickness,
        this.height * 3,
        opts
      ),
    ];

    Matter.Composite.add(this.engine.world, walls);
  }

  private setupCollisionHandler() {
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        const pA = this.getByBodyId(bodyA.id);
        const pB = this.getByBodyId(bodyB.id);

        if (!pA || !pB) return;
        if (pA.planetId !== pB.planetId) return;
        if (pA.planetId >= PLANETS.length) return; // max level
        if (this.pendingRemovalIds.has(pA.id) || this.pendingRemovalIds.has(pB.id)) return;

        const key = [pA.id, pB.id].sort().join('|');
        if (this.pendingMergeKeys.has(key)) return;
        this.pendingMergeKeys.add(key);
        this.pendingRemovalIds.add(pA.id);
        this.pendingRemovalIds.add(pB.id);

        const midX = (bodyA.position.x + bodyB.position.x) / 2;
        const midY = (bodyA.position.y + bodyB.position.y) / 2;

        // Defer to next tick so we don't mutate during collision processing
        setTimeout(() => {
          if (this.planets.has(pA.id)) this.removePlanet(pA.id);
          if (this.planets.has(pB.id)) this.removePlanet(pB.id);

          this.mergeCallbacks.forEach((cb) =>
            cb({ id1: pA.id, id2: pB.id, planetId: pA.planetId, x: midX, y: midY })
          );

          this.pendingMergeKeys.delete(key);
        }, 0);
      });
    });
  }

  private getByBodyId(bodyId: number): PhysicsPlanet | undefined {
    for (const p of this.planets.values()) {
      if (p.body.id === bodyId) return p;
    }
    return undefined;
  }

  addPlanet(id: string, planetId: number, x: number, y: number): void {
    const planet = PLANETS[planetId - 1];
    const radius = planet.size * planet.hitboxRatio;

    const body = Matter.Bodies.circle(x, y, radius, {
      restitution: RESTITUTION,
      friction: FRICTION,
      frictionAir: FRICTION_AIR,
      density: 0.002,
      label: id,
      collisionFilter: {
        category: 0x0001,
        mask: 0x0001 | 0x0002,
      },
    });

    this.planets.set(id, { id, planetId, body });
    Matter.Composite.add(this.engine.world, body);
  }

  removePlanet(id: string): void {
    const p = this.planets.get(id);
    if (p) {
      Matter.Composite.remove(this.engine.world, p.body);
      this.planets.delete(id);
      this.pendingRemovalIds.delete(id);
    }
  }

  getPlanet(id: string): PhysicsPlanet | undefined {
    return this.planets.get(id);
  }

  getAllPlanets(): PhysicsPlanet[] {
    return Array.from(this.planets.values());
  }

  /** Returns the minimum Y value (top edge) of all settled planets */
  getHighestY(): number {
    let minY = this.height + 1;
    this.planets.forEach((p) => {
      const planet = PLANETS[p.planetId - 1];
      const topY = p.body.position.y - planet.size;
      if (topY < minY) minY = topY;
    });
    return minY;
  }

  onMerge(cb: MergeCallback): void {
    this.mergeCallbacks.push(cb);
  }

  /**
   * Radial shockwave: push all nearby planets away from (x, y).
   * Kick velocity scales with mergedPlanetSize and falls off with distance.
   * excludeId = the newly-spawned planet (shouldn't push itself).
   */
  applyMergeShockwave(x: number, y: number, mergedPlanetSize: number, excludeId?: string): void {
    // Scaling factor: larger planets create significantly more impact
    // We use a base multiplier that grows with planet size
    const intensity = Math.sqrt(mergedPlanetSize / 15); // normalized intensity factor
    const maxKick = mergedPlanetSize * 0.25 * intensity;
    const shockRadius = mergedPlanetSize * 5.5 * intensity;

    this.planets.forEach((p) => {
      if (p.id === excludeId) return;
      if (this.pendingRemovalIds.has(p.id)) return;

      const dx = p.body.position.x - x;
      const dy = p.body.position.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1 || dist > shockRadius) return;

      const falloff = 1 - dist / shockRadius;
      const kick = maxKick * falloff;

      const nx = dx / dist;
      const ny = dy / dist;

      Matter.Body.setVelocity(p.body, {
        x: p.body.velocity.x + nx * kick,
        y: p.body.velocity.y + ny * kick * 0.8, // slightly less vertical kick to keep them in flow
      });
    });
  }

  step(delta: number): void {
    Matter.Engine.update(this.engine, Math.min(delta, 33));
  }

  reset(): void {
    Matter.Engine.clear(this.engine);
    this.planets.clear();
    this.pendingMergeKeys.clear();
    this.pendingRemovalIds.clear();
    this.mergeCallbacks = [];
    Matter.World.clear(this.engine.world, false);
    this.engine.gravity.y = GRAVITY;
    this.createWalls();
    this.setupCollisionHandler();
  }

  destroy(): void {
    Matter.Engine.clear(this.engine);
    this.planets.clear();
  }
}
