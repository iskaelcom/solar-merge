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
  VIRUS_RADIUS,
  MYSTERY_PLANET_RADIUS,
  DANGER_HEIGHT,
} from './constants';

export interface PhysicsPlanet {
  id: string;
  planetId: number;
  body: Matter.Body;
  isMystery?: boolean;
  truePlanetId?: number;
  mysteryRevealDrops?: number;
}

/**
 * Uniform spatial grid for broadphase radius queries.
 * Build once per query call (O(n)), then query is O(k) where k = planets in range.
 * Pays off when query radius covers only a fraction of the world.
 */
class SpatialGrid {
  private cells: Map<number, PhysicsPlanet[]> = new Map();
  private cols: number;
  readonly cellSize: number;

  constructor(cellSize: number, worldWidth: number) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(worldWidth / cellSize) + 1;
  }

  build(planets: Iterable<PhysicsPlanet>): void {
    this.cells.clear();
    for (const p of planets) {
      const col = Math.floor(p.body.position.x / this.cellSize);
      const row = Math.floor(p.body.position.y / this.cellSize);
      const key = row * this.cols + col;
      let cell = this.cells.get(key);
      if (!cell) { cell = []; this.cells.set(key, cell); }
      cell.push(p);
    }
  }

  query(cx: number, cy: number, radius: number, cb: (p: PhysicsPlanet) => void): void {
    const cs = this.cellSize;
    const minCol = Math.floor((cx - radius) / cs);
    const maxCol = Math.floor((cx + radius) / cs);
    const minRow = Math.floor((cy - radius) / cs);
    const maxRow = Math.floor((cy + radius) / cs);
    const rSq = radius * radius;
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const cell = this.cells.get(row * this.cols + col);
        if (!cell) continue;
        for (const p of cell) {
          const dx = p.body.position.x - cx;
          const dy = p.body.position.y - cy;
          if (dx * dx + dy * dy <= rSq) cb(p);
        }
      }
    }
  }
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
  vx: number; // averaged velocity of the two merged bodies
  vy: number;
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

export interface VirusPhysicsBody {
  id: string;
  body: Matter.Body;
}

export interface VirusInfectEvent {
  virusId: string;
  planetId: string;   // physics id of the infected planet
  planetTypeId: number;
  x: number;
  y: number;
}

export interface SunMergeEvent {
  id1: string;        // physics id of first sun
  id2: string;        // physics id of second sun
  blackHoleId: string; // physics id of the spawned black hole
  x: number;
  y: number;
}

type MergeCallback = (event: MergeEvent) => void;
type StarUpgradeCallback = (event: StarUpgradeEvent) => void;
type BlackHoleSuckCallback = (event: BlackHoleSuckEvent) => void;
type VirusInfectCallback = (event: VirusInfectEvent) => void;
type SunMergeCallback = (event: SunMergeEvent) => void;

export class SolarPhysics {
  engine: Matter.Engine;
  private planets: Map<string, PhysicsPlanet> = new Map();
  private stars: Map<string, StarPhysicsBody> = new Map();
  private blackHoles: Map<string, BlackHolePhysicsBody> = new Map();
  private viruses: Map<string, VirusPhysicsBody> = new Map();
  // Reverse maps: Matter body.id → entity — O(1) lookup instead of O(n) scan
  private bodyIdToPlanet: Map<number, PhysicsPlanet> = new Map();
  private bodyIdToStar: Map<number, StarPhysicsBody> = new Map();
  private bodyIdToBlackHole: Map<number, BlackHolePhysicsBody> = new Map();
  private bodyIdToVirus: Map<number, VirusPhysicsBody> = new Map();
  // Cached arrays — rebuilt lazily only when collection changes (avoids Array.from() every frame)
  private _planetsCache: PhysicsPlanet[] | null = null;
  private _starsCache: StarPhysicsBody[] | null = null;
  private _blackHolesCache: BlackHolePhysicsBody[] | null = null;
  private _virusesCache: VirusPhysicsBody[] | null = null;
  private mergeCallbacks: MergeCallback[] = [];
  private starUpgradeCallbacks: StarUpgradeCallback[] = [];
  private blackHoleSuckCallbacks: BlackHoleSuckCallback[] = [];
  private virusInfectCallbacks: VirusInfectCallback[] = [];
  private sunMergeCallbacks: SunMergeCallback[] = [];
  private mysteryRevealCallbacks: Array<(data: { id: string, x: number, y: number, planetSize: number }) => void> = [];
  private pendingMergeKeys: Set<string> = new Set();
  private pendingRemovalIds: Set<string> = new Set();
  private pendingStarRemovalIds: Set<string> = new Set();
  private pendingBlackHoleRemovalIds: Set<string> = new Set();
  private pendingVirusRemovalIds: Set<string> = new Set();
  // Deferred operations: replaces setTimeout(0) — flushed at end of each step()
  private deferredOps: Array<() => void> = [];
  // Max speed cap to prevent runaway bodies after merges/shockwaves
  private static readonly MAX_SPEED = 32;
  private static readonly MAX_SPEED_SQ = 32 * 32;
  // Spatial grid for broadphase radius queries in shockwave/suction (cell = 120px)
  private spatialGrid: SpatialGrid;
  // Shield
  private shieldActive: boolean = false;
  private shieldPassedPlanetIds: Set<string> = new Set();
  private shieldRecentlyHitIds: Set<string> = new Set();
  private shieldHitCallbacks: Array<() => void> = [];
  // Wizard bonuses
  private shrinkActive: boolean = false;
  private shrinkScale: number = 1.0;
  private sleepLockTicks: number = 0;
  width: number;
  height: number;

  constructor(width: number = GAME_WIDTH, height: number = GAME_HEIGHT) {
    this.width = width;
    this.height = height;

    this.spatialGrid = new SpatialGrid(120, width);

    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: GRAVITY },
      enableSleeping: true,
      positionIterations: 4,    // balanced (reduced from 8 for battery/heat)
      velocityIterations: 2,    // balanced (reduced from 6 for battery/heat)
      constraintIterations: 2,
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
    const handleCollisions = (event: Matter.IEventCollision<Matter.Engine>) => {
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
            !planet.isMystery &&
            !this.pendingBlackHoleRemovalIds.has(bh.id) &&
            !this.pendingRemovalIds.has(planet.id)
          ) {
            this.pendingBlackHoleRemovalIds.add(bh.id);
            this.pendingRemovalIds.add(planet.id);

            const px = planet.body.position.x;
            const py = planet.body.position.y;

            this.defer(() => {
              this.removeBlackHole(bh.id);
              if (this.planets.has(planet.id)) this.removePlanet(planet.id);
              this.blackHoleSuckCallbacks.forEach((cb) =>
                cb({ blackHoleId: bh.id, planetId: planet.id, planetTypeId: planet.planetId, x: px, y: py })
              );
            });
          }
          return; // don't process as star or planet-planet
        }

        // ── Virus-planet collision (infect & virus vanishes) ─────────────
        const virA = this.getVirusByBodyId(bodyA.id);
        const virB = this.getVirusByBodyId(bodyB.id);

        if (virA || virB) {
          const vir = virA || virB!;
          const otherBody = virA ? bodyB : bodyA;
          const planet = this.getByBodyId(otherBody.id);

          if (
            planet &&
            !planet.isMystery &&
            !this.pendingVirusRemovalIds.has(vir.id) &&
            !this.pendingRemovalIds.has(planet.id)
          ) {
            this.pendingVirusRemovalIds.add(vir.id);

            const px = planet.body.position.x;
            const py = planet.body.position.y;

            this.defer(() => {
              this.removeVirus(vir.id);
              this.virusInfectCallbacks.forEach((cb) =>
                cb({ virusId: vir.id, planetId: planet.id, planetTypeId: planet.planetId, x: px, y: py })
              );
            });
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
            !planet.isMystery &&
            !this.pendingStarRemovalIds.has(star.id) &&
            !this.pendingRemovalIds.has(planet.id)
          ) {
            this.pendingStarRemovalIds.add(star.id);
            this.pendingRemovalIds.add(planet.id);

            const px = planet.body.position.x;
            const py = planet.body.position.y;

            this.defer(() => {
              this.removeStar(star.id);
              if (this.planets.has(planet.id)) this.removePlanet(planet.id);

              this.starUpgradeCallbacks.forEach((cb) =>
                cb({ starId: star.id, planetId: planet.id, planetTypeId: planet.planetId, x: px, y: py })
              );
            });
          }
          return; // don't process as planet-planet merge
        }

        // ── Planet-planet merge ──────────────────────────────────────────
        const pA = this.getByBodyId(bodyA.id);
        const pB = this.getByBodyId(bodyB.id);

        if (!pA || !pB) return;
        this.processPlanetMerge(pA, pB);
      });
    };

    Matter.Events.on(this.engine, 'collisionStart', handleCollisions);
    // Note: We avoid collisionActive globally as it prevents efficient sleeping 
    // and adds overhead. Special reveal merges are handled in tickMysteryPlanets.
  }

  /**
   * Internal logic to check if two planets should merge and then orchestrate the removal/spawn.
   */
  private processPlanetMerge(pA: PhysicsPlanet, pB: PhysicsPlanet): void {
    if (pA.isMystery || pB.isMystery) return; // Mystery planets cannot merge
    if (pA.planetId !== pB.planetId) return;
    if (this.pendingRemovalIds.has(pA.id) || this.pendingRemovalIds.has(pB.id)) return;

    const key = [pA.id, pB.id].sort().join('|');
    if (this.pendingMergeKeys.has(key)) return;

    this.pendingMergeKeys.add(key);
    this.pendingRemovalIds.add(pA.id);
    this.pendingRemovalIds.add(pB.id);

    const midX = (pA.body.position.x + pB.body.position.x) / 2;
    const midY = (pA.body.position.y + pB.body.position.y) / 2;
    // Capture averaged velocity NOW (bodies still alive) for inheritance by spawn
    const vAvgX = (pA.body.velocity.x + pB.body.velocity.x) / 2;
    const vAvgY = (pA.body.velocity.y + pB.body.velocity.y) / 2;

    // ── Two Suns merged → collapse into a Black Hole ─────────────────
    if (pA.planetId >= PLANETS.length) {
      this.defer(() => {
        if (this.planets.has(pA.id)) this.removePlanet(pA.id);
        if (this.planets.has(pB.id)) this.removePlanet(pB.id);

        const bhId = `sun_bh_${Date.now()}`;
        this.addBlackHole(bhId, midX, midY);

        this.sunMergeCallbacks.forEach((cb) =>
          cb({ id1: pA.id, id2: pB.id, blackHoleId: bhId, x: midX, y: midY })
        );
        this.pendingMergeKeys.delete(key);
      });
      return;
    }

    // Defer to end of step() so we don't mutate during collision processing
    this.defer(() => {
      if (this.planets.has(pA.id)) this.removePlanet(pA.id);
      if (this.planets.has(pB.id)) this.removePlanet(pB.id);

      this.mergeCallbacks.forEach((cb) =>
        cb({ id1: pA.id, id2: pB.id, planetId: pA.planetId, x: midX, y: midY, vx: vAvgX, vy: vAvgY })
      );

      this.pendingMergeKeys.delete(key);
    });
  }

  /** Queue an operation to run after the current physics step (replaces setTimeout 0). */
  private defer(fn: () => void): void {
    this.deferredOps.push(fn);
  }

  /** Execute all queued deferred operations and clear the queue. */
  private flushDeferred(): void {
    if (this.deferredOps.length === 0) return;
    const ops = this.deferredOps.splice(0);
    for (const fn of ops) fn();
  }

  private getVirusByBodyId(bodyId: number): VirusPhysicsBody | undefined {
    return this.bodyIdToVirus.get(bodyId);
  }

  private getBlackHoleByBodyId(bodyId: number): BlackHolePhysicsBody | undefined {
    return this.bodyIdToBlackHole.get(bodyId);
  }

  private getStarByBodyId(bodyId: number): StarPhysicsBody | undefined {
    return this.bodyIdToStar.get(bodyId);
  }

  private getByBodyId(bodyId: number): PhysicsPlanet | undefined {
    return this.bodyIdToPlanet.get(bodyId);
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
    // Dampen rotation 2× so stars spin slowly instead of flipping wildly
    Matter.Body.setInertia(body, body.inertia * 2);
    const entry: StarPhysicsBody = { id, body };
    this.stars.set(id, entry);
    this.bodyIdToStar.set(body.id, entry);
    this._starsCache = null;
    Matter.Composite.add(this.engine.world, body);
  }

  removeStar(id: string): void {
    const s = this.stars.get(id);
    if (s) {
      Matter.Composite.remove(this.engine.world, s.body);
      this.stars.delete(id);
      this.bodyIdToStar.delete(s.body.id);
      this._starsCache = null;
      this.pendingStarRemovalIds.delete(id);
    }
  }

  getAllStars(): StarPhysicsBody[] {
    if (!this._starsCache) this._starsCache = Array.from(this.stars.values());
    return this._starsCache;
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
    Matter.Body.setInertia(body, body.inertia * 2);
    const entry: BlackHolePhysicsBody = { id, body };
    this.blackHoles.set(id, entry);
    this.bodyIdToBlackHole.set(body.id, entry);
    this._blackHolesCache = null;
    Matter.Composite.add(this.engine.world, body);
  }

  removeBlackHole(id: string): void {
    const bh = this.blackHoles.get(id);
    if (bh) {
      Matter.Composite.remove(this.engine.world, bh.body);
      this.blackHoles.delete(id);
      this.bodyIdToBlackHole.delete(bh.body.id);
      this._blackHolesCache = null;
      this.pendingBlackHoleRemovalIds.delete(id);
    }
  }

  getAllBlackHoles(): BlackHolePhysicsBody[] {
    if (!this._blackHolesCache) this._blackHolesCache = Array.from(this.blackHoles.values());
    return this._blackHolesCache;
  }

  onBlackHoleSuck(cb: BlackHoleSuckCallback): void {
    this.blackHoleSuckCallbacks.push(cb);
  }

  onSunMerge(cb: SunMergeCallback): void {
    this.sunMergeCallbacks.push(cb);
  }

  onMysteryReveal(cb: (data: { id: string, x: number, y: number, planetSize: number }) => void): void {
    this.mysteryRevealCallbacks.push(cb);
  }

  addVirus(id: string, x: number, y: number): void {
    const body = Matter.Bodies.circle(x, y, VIRUS_RADIUS, {
      restitution: 0.4,
      friction: FRICTION,
      frictionAir: FRICTION_AIR,
      density: 0.002,
      label: 'virus_' + id,
      collisionFilter: { category: 0x0001, mask: 0x0001 | 0x0002 },
    });
    Matter.Body.setInertia(body, body.inertia * 2);
    const entry: VirusPhysicsBody = { id, body };
    this.viruses.set(id, entry);
    this.bodyIdToVirus.set(body.id, entry);
    this._virusesCache = null;
    Matter.Composite.add(this.engine.world, body);
  }

  removeVirus(id: string): void {
    const v = this.viruses.get(id);
    if (v) {
      Matter.Composite.remove(this.engine.world, v.body);
      this.viruses.delete(id);
      this.bodyIdToVirus.delete(v.body.id);
      this._virusesCache = null;
      this.pendingVirusRemovalIds.delete(id);
    }
  }

  getAllViruses(): VirusPhysicsBody[] {
    if (!this._virusesCache) this._virusesCache = Array.from(this.viruses.values());
    return this._virusesCache;
  }

  onVirusInfect(cb: VirusInfectCallback): void {
    this.virusInfectCallbacks.push(cb);
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

    // Build spatial grid then query only cells that overlap the suck radius
    this.spatialGrid.build(this.planets.values());
    this.spatialGrid.query(x, y, suckRadius, (p) => {
      if (this.pendingRemovalIds.has(p.id)) return;

      // Vector FROM planet TOWARD the black hole center — inward pull
      const dx = x - p.body.position.x;
      const dy = y - p.body.position.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < 1) return;

      const dist = Math.sqrt(distSq);
      const falloff = 1 - dist / suckRadius;
      const kick = maxKick * falloff;
      const nx = dx / dist;
      const ny = dy / dist;

      // Wake sleeping bodies so they respond to the pull
      if ((p.body as any).isSleeping) {
        (p.body as any).isSleeping = false;
      }

      Matter.Body.setVelocity(p.body, {
        x: p.body.velocity.x + nx * kick,
        y: p.body.velocity.y + ny * kick,
      });
    });
  }

  addPlanet(id: string, planetId: number, x: number, y: number, vx = 0, vy = 3): void {
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
    // Dampen rotation 2× — planets still spin naturally but won't flip wildly on collision
    Matter.Body.setInertia(body, body.inertia * 2);

    const entry: PhysicsPlanet = { id, planetId, body };
    this.planets.set(id, entry);
    this.bodyIdToPlanet.set(body.id, entry);
    this._planetsCache = null;
    Matter.Composite.add(this.engine.world, body);

    // Apply shrink if active and planet is ID >= 4
    if (this.shrinkActive && planetId >= 4) {
      Matter.Body.scale(body, this.shrinkScale, this.shrinkScale);
    }

    // Ensure the body is awake and starts falling immediately.
    // enableSleeping can cause a freshly-dropped planet to go to sleep on
    // contact with an existing body, making it appear stuck at the top.
    Matter.Body.setVelocity(body, { x: vx, y: vy });
    if ((body as any).isSleeping) (body as any).isSleeping = false;
  }

  addMysteryPlanet(id: string, truePlanetId: number, mysteryRevealDrops: number, x: number, y: number, vx = 0, vy = 3): void {
    const radius = MYSTERY_PLANET_RADIUS; // Disguise radius

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
    // Dampen rotation 2×
    Matter.Body.setInertia(body, body.inertia * 2);

    const entry: PhysicsPlanet = { id, planetId: 1, isMystery: true, truePlanetId, mysteryRevealDrops, body };
    this.planets.set(id, entry);
    this.bodyIdToPlanet.set(body.id, entry);
    this._planetsCache = null;
    Matter.Composite.add(this.engine.world, body);

    if (vx !== 0 || vy !== 0) {
      Matter.Body.setVelocity(body, { x: vx, y: vy });
    }
  }

  tickMysteryPlanets(): void {
    let triggered = false;
    this.planets.forEach((p) => {
      if (p.isMystery && p.mysteryRevealDrops !== undefined && p.mysteryRevealDrops > 0) {
        p.mysteryRevealDrops--;
        if (p.mysteryRevealDrops === 0) {
          // Reveal the planet
          p.isMystery = false;
          p.planetId = p.truePlanetId!;
          
          const targetPlanet = PLANETS[p.planetId - 1];
          const trueRadius = targetPlanet.size * targetPlanet.hitboxRatio;
          const scaleMultiplier = trueRadius / MYSTERY_PLANET_RADIUS;
          
          Matter.Body.scale(p.body, scaleMultiplier, scaleMultiplier);
          
          // Apply active shrink if it qualifies
          if (this.shrinkActive && p.planetId >= 4) {
             Matter.Body.scale(p.body, this.shrinkScale, this.shrinkScale);
          }
          
          // Awaken body for resolution
          Matter.Sleeping.set(p.body, false);
          Matter.Body.setVelocity(p.body, { x: p.body.velocity.x, y: p.body.velocity.y + 0.1 });
          (p.body as any).sleepCounter = 0;
          triggered = true;

          // Dispatch visually
          this.mysteryRevealCallbacks.forEach(cb => cb({
            id: p.id,
            x: p.body.position.x,
            y: p.body.position.y,
            planetSize: targetPlanet.size,
          }));

          // ── INSTANT MERGE CHECK ──
          // Since we scale the body while it might be resting against others,
          // collisionStart won't necessarily fire. We manually query overlaps here.
          const otherBodies = Array.from(this.planets.values())
            .filter(other => other.id !== p.id && !other.isMystery)
            .map(other => other.body);

          const immediateOverlaps = Matter.Query.collides(p.body, otherBodies);
          for (const collision of immediateOverlaps) {
            const bodyB = collision.bodyA === p.body ? collision.bodyB : collision.bodyA;
            const pB = this.getByBodyId(bodyB.id);
            if (pB) {
              this.processPlanetMerge(p, pB);
            }
          }
        }
      }
    });

    if (triggered) {
      this.sleepLockTicks = 60; // Keep engine alive to push overlapping bodies apart
      this.engine.enableSleeping = false;
    }
  }

  removePlanet(id: string): void {
    const p = this.planets.get(id);
    if (p) {
      Matter.Composite.remove(this.engine.world, p.body);
      this.planets.delete(id);
      this.bodyIdToPlanet.delete(p.body.id);
      this._planetsCache = null;
      this.pendingRemovalIds.delete(id);
      this.shieldPassedPlanetIds.delete(id);
      this.shieldRecentlyHitIds.delete(id);
    }
  }

  setPlanetShrink(active: boolean, scaleMultiplier: number): void {
    const wasActive = this.shrinkActive;
    const oldScale = this.shrinkScale;
    this.shrinkActive = active;
    this.shrinkScale = scaleMultiplier;

    // Apply scale to ALL existing planets with ID >= 4
    this.planets.forEach((p) => {
      if (p.planetId >= 4) {
        if (active && !wasActive) {
          // Normal activation
          Matter.Body.scale(p.body, scaleMultiplier, scaleMultiplier);
        } else if (!active && wasActive) {
          // Deactivation: Return to normal (1.0) by scaling by (1 / current_scale)
          const reverseScale = 1 / oldScale;
          Matter.Body.scale(p.body, reverseScale, reverseScale);
        } else if (active && wasActive && scaleMultiplier !== oldScale) {
          // Renewal with different scale: scale by (new / old)
          const adjustScale = scaleMultiplier / oldScale;
          Matter.Body.scale(p.body, adjustScale, adjustScale);
        }
      }
    });

      // Unconditionally wake up ALL bodies (planets, stars, black holes, viruses)
      // so the entire physics partition re-evaluates collisions and nothing stays frozen.
      const wakeUpBody = (body: Matter.Body) => {
        Matter.Sleeping.set(body, false);
        Matter.Body.setVelocity(body, { 
          x: body.velocity.x, 
          y: body.velocity.y + 0.1 
        });
        (body as any).sleepCounter = 0;
      };

      this.planets.forEach(p => wakeUpBody(p.body));
      this.stars.forEach(s => wakeUpBody(s.body));
      this.blackHoles.forEach(bh => wakeUpBody(bh.body));
      this.viruses.forEach(v => wakeUpBody(v.body));

      // Matter.js SAT collision solver needs time to resolve deep penetrations 
      // without prematurely determining the bodies are 'resting' and putting them to sleep.
      this.sleepLockTicks = 60; // Approx 1.5 - 2 seconds of physics simulation
      this.engine.enableSleeping = false;
  }

  getPlanet(id: string): PhysicsPlanet | undefined {
    return this.planets.get(id);
  }

  getAllPlanets(): PhysicsPlanet[] {
    if (!this._planetsCache) this._planetsCache = Array.from(this.planets.values());
    return this._planetsCache;
  }

  /**
   * Returns true if any planet is NOT sleeping.
   * Useful to skip React renders when the scene is static.
   */
  hasActiveBodies(): boolean {
    if (this.planets.size === 0 && this.stars.size === 0 && this.blackHoles.size === 0 && this.viruses.size === 0) return false;
    for (const p of this.planets.values()) {
      if (!p.body.isSleeping) return true;
    }
    for (const s of this.stars.values()) {
      if (!s.body.isSleeping) return true;
    }
    for (const bh of this.blackHoles.values()) {
      if (!bh.body.isSleeping) return true;
    }
    for (const v of this.viruses.values()) {
      if (!v.body.isSleeping) return true;
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
    const intensity = Math.sqrt(mergedPlanetSize / 15);
    const maxKick = mergedPlanetSize * 0.05 * intensity;
    const shockRadius = mergedPlanetSize * 2.5 * intensity;

    // Build spatial grid then query only cells that overlap the shock radius
    this.spatialGrid.build(this.planets.values());
    this.spatialGrid.query(x, y, shockRadius, (p) => {
      if (p.id === excludeId) return;
      if (this.pendingRemovalIds.has(p.id)) return;
      // Skip sleeping bodies — they're not moving, kick is wasted
      if ((p.body as any).isSleeping) return;

      const dx = p.body.position.x - x;
      const dy = p.body.position.y - y;
      const distSq = dx * dx + dy * dy;
      if (distSq < 1) return;

      const dist = Math.sqrt(distSq);
      const falloff = 1 - dist / shockRadius;
      const kick = maxKick * falloff;
      const nx = dx / dist;
      const ny = dy / dist;

      const newVx = p.body.velocity.x + nx * kick;
      const newVy = p.body.velocity.y + ny * kick * 0.8;
      // Clamp to MAX_SPEED so merges never launch planets at ridiculous speeds
      const speedSq = newVx * newVx + newVy * newVy;
      if (speedSq > SolarPhysics.MAX_SPEED_SQ) {
        const scale = SolarPhysics.MAX_SPEED / Math.sqrt(speedSq);
        Matter.Body.setVelocity(p.body, { x: newVx * scale, y: newVy * scale });
      } else {
        Matter.Body.setVelocity(p.body, { x: newVx, y: newVy });
      }
    });
  }

  // ── Shield ──────────────────────────────────────────────────────────────

  setShieldActive(active: boolean): void {
    this.shieldActive = active;
    if (!active) {
      this.shieldPassedPlanetIds.clear();
      this.shieldRecentlyHitIds.clear();
    }
  }

  onShieldHit(cb: () => void): void {
    this.shieldHitCallbacks.push(cb);
  }

  /**
   * Called each physics step. Deflects upward-moving planets at the danger
   * line when the shield is active, then fires the hit callbacks.
   */
  private checkShield(): void {
    if (!this.shieldActive) return;

    this.planets.forEach((pb) => {
      const body = pb.body;
      const planet = PLANETS[pb.planetId - 1];
      const radius = planet.size;

      // Mark planets that have settled into the game area (below the shield line)
      if (body.position.y > DANGER_HEIGHT + 40) {
        this.shieldPassedPlanetIds.add(pb.id);
      }

      if (!this.shieldPassedPlanetIds.has(pb.id)) return;
      if (this.pendingRemovalIds.has(pb.id)) return;
      if (this.shieldRecentlyHitIds.has(pb.id)) return;

      // Planet top edge crossing the danger line while moving upward
      if (body.position.y - radius < DANGER_HEIGHT && body.velocity.y < -0.5) {
        // Debounce: ignore this planet for 600 ms after a hit
        this.shieldRecentlyHitIds.add(pb.id);
        setTimeout(() => this.shieldRecentlyHitIds.delete(pb.id), 600);

        // Bounce the planet back downward
        Matter.Body.setVelocity(body, {
          x: body.velocity.x * 0.7,
          y: Math.abs(body.velocity.y) * 0.5,
        });

        // Clamp position just inside the shield
        Matter.Body.setPosition(body, {
          x: body.position.x,
          y: DANGER_HEIGHT + radius + 2,
        });

        this.shieldHitCallbacks.forEach((cb) => cb());
      }
    });
  }

  step(delta: number): void {
    if (this.sleepLockTicks > 0) {
      this.sleepLockTicks--;
      if (this.sleepLockTicks === 0) {
        this.engine.enableSleeping = true;
      }
    }

    // Balanced ~45fps cap (22ms) for better battery/thermal life while keeping it smooth.
    // Clamping protects against large tunneling on lag.
    Matter.Engine.update(this.engine, Math.min(delta, 22));
    // Flush merges/removals queued during collision events — same frame, no macrotask
    this.flushDeferred();
    this.checkShield();
  }

  reset(): void {
    Matter.Engine.clear(this.engine);
    this.planets.clear();
    this.stars.clear();
    this.blackHoles.clear();
    this.viruses.clear();
    this.bodyIdToPlanet.clear();
    this.bodyIdToStar.clear();
    this.bodyIdToBlackHole.clear();
    this.bodyIdToVirus.clear();
    this._planetsCache = null;
    this._starsCache = null;
    this._blackHolesCache = null;
    this._virusesCache = null;
    this.pendingMergeKeys.clear();
    this.pendingRemovalIds.clear();
    this.pendingStarRemovalIds.clear();
    this.pendingBlackHoleRemovalIds.clear();
    this.pendingVirusRemovalIds.clear();
    this.deferredOps = [];
    this.shieldActive = false;
    this.shieldPassedPlanetIds.clear();
    this.shieldRecentlyHitIds.clear();
    this.shieldHitCallbacks = [];
    Matter.World.clear(this.engine.world, false);
    this.engine.gravity.y = GRAVITY;
    this.createWalls();
    this.setupCollisionHandler();
  }

  destroy(): void {
    Matter.World.clear(this.engine.world, false);
    Matter.Engine.clear(this.engine);
    this.planets.clear();
    this.stars.clear();
    this.blackHoles.clear();
    this.viruses.clear();
    this.bodyIdToPlanet.clear();
    this.bodyIdToStar.clear();
    this.bodyIdToBlackHole.clear();
    this.bodyIdToVirus.clear();
    this._planetsCache = null;
    this._starsCache = null;
    this._blackHolesCache = null;
    this._virusesCache = null;
    this.pendingMergeKeys.clear();
    this.pendingRemovalIds.clear();
    this.pendingStarRemovalIds.clear();
    this.pendingBlackHoleRemovalIds.clear();
    this.pendingVirusRemovalIds.clear();
    this.deferredOps = [];
    this.mergeCallbacks = [];
    this.starUpgradeCallbacks = [];
    this.blackHoleSuckCallbacks = [];
    this.virusInfectCallbacks = [];
    this.sunMergeCallbacks = [];
  }

  /**
   * Removes all planets, stars, black holes, and viruses that are 
   * above the specified Y threshold (e.g. they are in the danger zone).
   */
  clearTop(yThreshold: number): void {
    const toRemove: string[] = [];
    this.planets.forEach((p, id) => {
      if (p.body.position.y < yThreshold) toRemove.push(id);
    });
    toRemove.forEach(id => this.removePlanet(id));

    const starsToRemove: string[] = [];
    this.stars.forEach((s, id) => {
      if (s.body.position.y < yThreshold) starsToRemove.push(id);
    });
    starsToRemove.forEach(id => this.removeStar(id));

    const bhToRemove: string[] = [];
    this.blackHoles.forEach((bh, id) => {
      if (bh.body.position.y < yThreshold) bhToRemove.push(id);
    });
    bhToRemove.forEach(id => this.removeBlackHole(id));

    const virToRemove: string[] = [];
    this.viruses.forEach((v, id) => {
      if (v.body.position.y < yThreshold) virToRemove.push(id);
    });
    virToRemove.forEach(id => this.removeVirus(id));
  }
}
