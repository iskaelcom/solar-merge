import Matter from 'matter-js';
import {
  PLANETS,
  GAME_WIDTH,
  GAME_HEIGHT,
  GRAVITY,
  RESTITUTION,
  FRICTION,
  FRICTION_AIR,
  STAR_RADIUS,
  BLACK_HOLE_RADIUS,
} from './constants';

export interface PhysicsPlanet {
  id: string;
  planetId: number;
  body: Matter.Body;
}

export interface StarPhysicsBody {
  id: string;
  body: Matter.Body;
}

export interface MergeEvent {
  id1: string;
  id2: string;
  planetId: number; // planet type that merged
  x: number;
  y: number;
}

export interface StarUpgradeEvent {
  starId: string;
  planetId: string;   // physics id of the planet that got upgraded
  planetTypeId: number;
  x: number;
  y: number;
}

export interface BlackHolePhysicsBody {
  id: string;
  body: Matter.Body;
}

export interface BlackHoleSuckEvent {
  blackHoleId: string;
  planetId: string;
  planetTypeId: number;
  x: number;
  y: number;
}

type MergeCallback = (event: MergeEvent) => void;
type StarUpgradeCallback = (event: StarUpgradeEvent) => void;
type BlackHoleSuckCallback = (event: BlackHoleSuckEvent) => void;

export class SolarPhysics {
  engine: Matter.Engine;
  private planets: Map<string, PhysicsPlanet> = new Map();
  private stars: Map<string, StarPhysicsBody> = new Map();
  private blackHoles: Map<string, BlackHolePhysicsBody> = new Map();
  private mergeCallbacks: MergeCallback[] = [];
  private starUpgradeCallbacks: StarUpgradeCallback[] = [];
  private blackHoleSuckCallbacks: BlackHoleSuckCallback[] = [];
  private pendingMergeKeys: Set<string> = new Set();
  private pendingRemovalIds: Set<string> = new Set();
  private pendingStarRemovalIds: Set<string> = new Set();
  private pendingBlackHoleRemovalIds: Set<string> = new Set();
  width: number;
  height: number;

  constructor(width: number = GAME_WIDTH, height: number = GAME_HEIGHT) {
    this.width = width;
    this.height = height;

    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: GRAVITY },
      enableSleeping: true,
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

        // ── Black hole-planet collision (suck/destroy) ───────────────────
        const bhA = this.getBlackHoleByBodyId(bodyA.id);
        const bhB = this.getBlackHoleByBodyId(bodyB.id);

        if (bhA || bhB) {
          const bh = bhA || bhB!;
          const otherBody = bhA ? bodyB : bodyA;
          const planet = this.getByBodyId(otherBody.id);

          if (
            planet &&
            !this.pendingBlackHoleRemovalIds.has(bh.id) &&
            !this.pendingRemovalIds.has(planet.id)
          ) {
            this.pendingBlackHoleRemovalIds.add(bh.id);
            this.pendingRemovalIds.add(planet.id);

            const px = planet.body.position.x;
            const py = planet.body.position.y;

            setTimeout(() => {
              this.removeBlackHole(bh.id);
              if (this.planets.has(planet.id)) this.removePlanet(planet.id);
              this.blackHoleSuckCallbacks.forEach((cb) =>
                cb({ blackHoleId: bh.id, planetId: planet.id, planetTypeId: planet.planetId, x: px, y: py })
              );
            }, 0);
          }
          return; // don't process as star or planet-planet
        }

        // ── Star-planet collision ────────────────────────────────────────
        const starA = this.getStarByBodyId(bodyA.id);
        const starB = this.getStarByBodyId(bodyB.id);

        if (starA || starB) {
          const star = starA || starB!;
          const otherBody = starA ? bodyB : bodyA;
          const planet = this.getByBodyId(otherBody.id);

          if (
            planet &&
            !this.pendingStarRemovalIds.has(star.id) &&
            !this.pendingRemovalIds.has(planet.id)
          ) {
            this.pendingStarRemovalIds.add(star.id);
            this.pendingRemovalIds.add(planet.id);

            const px = planet.body.position.x;
            const py = planet.body.position.y;

            setTimeout(() => {
              this.removeStar(star.id);
              if (this.planets.has(planet.id)) this.removePlanet(planet.id);

              this.starUpgradeCallbacks.forEach((cb) =>
                cb({ starId: star.id, planetId: planet.id, planetTypeId: planet.planetId, x: px, y: py })
              );
            }, 0);
          }
          return; // don't process as planet-planet merge
        }

        // ── Planet-planet merge ──────────────────────────────────────────
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

  private getBlackHoleByBodyId(bodyId: number): BlackHolePhysicsBody | undefined {
    for (const bh of this.blackHoles.values()) {
      if (bh.body.id === bodyId) return bh;
    }
    return undefined;
  }

  private getStarByBodyId(bodyId: number): StarPhysicsBody | undefined {
    for (const s of this.stars.values()) {
      if (s.body.id === bodyId) return s;
    }
    return undefined;
  }

  private getByBodyId(bodyId: number): PhysicsPlanet | undefined {
    for (const p of this.planets.values()) {
      if (p.body.id === bodyId) return p;
    }
    return undefined;
  }

  addStar(id: string, x: number, y: number): void {
    const body = Matter.Bodies.circle(x, y, STAR_RADIUS, {
      restitution: 0.5,
      friction: FRICTION,
      frictionAir: FRICTION_AIR,
      density: 0.001,
      label: 'star_' + id,
      collisionFilter: { category: 0x0001, mask: 0x0001 | 0x0002 },
    });
    this.stars.set(id, { id, body });
    Matter.Composite.add(this.engine.world, body);
  }

  removeStar(id: string): void {
    const s = this.stars.get(id);
    if (s) {
      Matter.Composite.remove(this.engine.world, s.body);
      this.stars.delete(id);
      this.pendingStarRemovalIds.delete(id);
    }
  }

  getAllStars(): StarPhysicsBody[] {
    return Array.from(this.stars.values());
  }

  onStarUpgrade(cb: StarUpgradeCallback): void {
    this.starUpgradeCallbacks.push(cb);
  }

  addBlackHole(id: string, x: number, y: number): void {
    const body = Matter.Bodies.circle(x, y, BLACK_HOLE_RADIUS, {
      restitution: 0.3,
      friction: FRICTION,
      frictionAir: FRICTION_AIR,
      density: 0.004, // slightly denser → sinks through other bodies
      label: 'bh_' + id,
      collisionFilter: { category: 0x0001, mask: 0x0001 | 0x0002 },
    });
    this.blackHoles.set(id, { id, body });
    Matter.Composite.add(this.engine.world, body);
  }

  removeBlackHole(id: string): void {
    const bh = this.blackHoles.get(id);
    if (bh) {
      Matter.Composite.remove(this.engine.world, bh.body);
      this.blackHoles.delete(id);
      this.pendingBlackHoleRemovalIds.delete(id);
    }
  }

  getAllBlackHoles(): BlackHolePhysicsBody[] {
    return Array.from(this.blackHoles.values());
  }

  onBlackHoleSuck(cb: BlackHoleSuckCallback): void {
    this.blackHoleSuckCallbacks.push(cb);
  }

  /**
   * Inward gravitational suction: pull all nearby planets toward (x, y).
   * Opposite of applyMergeShockwave — velocity is directed INWARD.
   * Called when a black hole absorbs a planet so surrounding bodies react.
   */
  applyBlackHoleSuction(x: number, y: number, suckedPlanetSize: number): void {
    const intensity = Math.sqrt(suckedPlanetSize / 15);
    const maxKick = suckedPlanetSize * 0.2 * intensity;
    const suckRadius = suckedPlanetSize * 4.5 * intensity;

    this.planets.forEach((p) => {
      if (this.pendingRemovalIds.has(p.id)) return;

      // Vector FROM planet TOWARD the black hole center — inward pull
      const dx = x - p.body.position.x;
      const dy = y - p.body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1 || dist > suckRadius) return;

      const falloff = 1 - dist / suckRadius;
      const kick = maxKick * falloff;
      const nx = dx / dist;
      const ny = dy / dist;

      Matter.Body.setVelocity(p.body, {
        x: p.body.velocity.x + nx * kick,
        y: p.body.velocity.y + ny * kick,
      });

      // Wake sleeping bodies so they respond to the pull
      if ((p.body as any).isSleeping) {
        (p.body as any).isSleeping = false;
      }
    });
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

  /**
   * Returns true if any planet is NOT sleeping.
   * Useful to skip React renders when the scene is static.
   */
  hasActiveBodies(): boolean {
    if (this.planets.size === 0 && this.stars.size === 0 && this.blackHoles.size === 0) return false;
    for (const p of this.planets.values()) {
      if (!p.body.isSleeping) return true;
    }
    for (const s of this.stars.values()) {
      if (!s.body.isSleeping) return true;
    }
    for (const bh of this.blackHoles.values()) {
      if (!bh.body.isSleeping) return true;
    }
    return false;
  }

  /** 
   * Returns the minimum Y value (top edge) of all settled planets 
   * Only considers planets that are not falling fast (settled/overflowing).
   */
  getHighestPoint(): { y: number; vy: number } | null {
    let minY = this.height + 1;
    let velocityAtMinY = 0;

    if (this.planets.size === 0) return null;

    this.planets.forEach((p) => {
      const planet = PLANETS[p.planetId - 1];
      const topY = p.body.position.y - planet.size;
      if (topY < minY) {
        minY = topY;
        velocityAtMinY = p.body.velocity.y;
      }
    });

    return { y: minY, vy: velocityAtMinY };
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
    this.stars.clear();
    this.blackHoles.clear();
    this.pendingMergeKeys.clear();
    this.pendingRemovalIds.clear();
    this.pendingStarRemovalIds.clear();
    this.pendingBlackHoleRemovalIds.clear();
    Matter.World.clear(this.engine.world, false);
    this.engine.gravity.y = GRAVITY;
    this.createWalls();
    this.setupCollisionHandler();
  }

  destroy(): void {
    Matter.Engine.clear(this.engine);
    this.planets.clear();
    this.stars.clear();
    this.blackHoles.clear();
  }
}
