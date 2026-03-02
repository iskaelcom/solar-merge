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
  DANGER_HEIGHT,
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
  private mergeCallbacks: MergeCallback[] = [];
  private starUpgradeCallbacks: StarUpgradeCallback[] = [];
  private blackHoleSuckCallbacks: BlackHoleSuckCallback[] = [];
  private virusInfectCallbacks: VirusInfectCallback[] = [];
  private sunMergeCallbacks: SunMergeCallback[] = [];
  private pendingMergeKeys: Set<string> = new Set();
  private pendingRemovalIds: Set<string> = new Set();
  private pendingStarRemovalIds: Set<string> = new Set();
  private pendingBlackHoleRemovalIds: Set<string> = new Set();
  private pendingVirusRemovalIds: Set<string> = new Set();
  // Shield
  private shieldActive: boolean = false;
  private shieldPassedPlanetIds: Set<string> = new Set();
  private shieldRecentlyHitIds: Set<string> = new Set();
  private shieldHitCallbacks: Array<() => void> = [];
  width: number;
  height: number;

  constructor(width: number = GAME_WIDTH, height: number = GAME_HEIGHT) {
    this.width = width;
    this.height = height;

    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: GRAVITY },
      enableSleeping: true,
      positionIterations: 4,    // default 6 — reduced for lower CPU
      velocityIterations: 3,    // default 4 — reduced for lower CPU
      constraintIterations: 1,  // default 2 — no constraints in this game
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

        // ── Virus-planet collision (infect & virus vanishes) ─────────────
        const virA = this.getVirusByBodyId(bodyA.id);
        const virB = this.getVirusByBodyId(bodyB.id);

        if (virA || virB) {
          const vir = virA || virB!;
          const otherBody = virA ? bodyB : bodyA;
          const planet = this.getByBodyId(otherBody.id);

          if (
            planet &&
            !this.pendingVirusRemovalIds.has(vir.id) &&
            !this.pendingRemovalIds.has(planet.id)
          ) {
            this.pendingVirusRemovalIds.add(vir.id);

            const px = planet.body.position.x;
            const py = planet.body.position.y;

            setTimeout(() => {
              this.removeVirus(vir.id);
              this.virusInfectCallbacks.forEach((cb) =>
                cb({ virusId: vir.id, planetId: planet.id, planetTypeId: planet.planetId, x: px, y: py })
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
        if (this.pendingRemovalIds.has(pA.id) || this.pendingRemovalIds.has(pB.id)) return;

        const key = [pA.id, pB.id].sort().join('|');
        if (this.pendingMergeKeys.has(key)) return;
        this.pendingMergeKeys.add(key);
        this.pendingRemovalIds.add(pA.id);
        this.pendingRemovalIds.add(pB.id);

        const midX = (bodyA.position.x + bodyB.position.x) / 2;
        const midY = (bodyA.position.y + bodyB.position.y) / 2;

        // ── Two Suns merged → collapse into a Black Hole ─────────────────
        if (pA.planetId >= PLANETS.length) {
          setTimeout(() => {
            if (this.planets.has(pA.id)) this.removePlanet(pA.id);
            if (this.planets.has(pB.id)) this.removePlanet(pB.id);

            const bhId = `sun_bh_${Date.now()}`;
            this.addBlackHole(bhId, midX, midY);

            this.sunMergeCallbacks.forEach((cb) =>
              cb({ id1: pA.id, id2: pB.id, blackHoleId: bhId, x: midX, y: midY })
            );
            this.pendingMergeKeys.delete(key);
          }, 0);
          return;
        }

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
    const entry: StarPhysicsBody = { id, body };
    this.stars.set(id, entry);
    this.bodyIdToStar.set(body.id, entry);
    Matter.Composite.add(this.engine.world, body);
  }

  removeStar(id: string): void {
    const s = this.stars.get(id);
    if (s) {
      Matter.Composite.remove(this.engine.world, s.body);
      this.stars.delete(id);
      this.bodyIdToStar.delete(s.body.id);
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
    const entry: BlackHolePhysicsBody = { id, body };
    this.blackHoles.set(id, entry);
    this.bodyIdToBlackHole.set(body.id, entry);
    Matter.Composite.add(this.engine.world, body);
  }

  removeBlackHole(id: string): void {
    const bh = this.blackHoles.get(id);
    if (bh) {
      Matter.Composite.remove(this.engine.world, bh.body);
      this.blackHoles.delete(id);
      this.bodyIdToBlackHole.delete(bh.body.id);
      this.pendingBlackHoleRemovalIds.delete(id);
    }
  }

  getAllBlackHoles(): BlackHolePhysicsBody[] {
    return Array.from(this.blackHoles.values());
  }

  onBlackHoleSuck(cb: BlackHoleSuckCallback): void {
    this.blackHoleSuckCallbacks.push(cb);
  }

  onSunMerge(cb: SunMergeCallback): void {
    this.sunMergeCallbacks.push(cb);
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
    const entry: VirusPhysicsBody = { id, body };
    this.viruses.set(id, entry);
    this.bodyIdToVirus.set(body.id, entry);
    Matter.Composite.add(this.engine.world, body);
  }

  removeVirus(id: string): void {
    const v = this.viruses.get(id);
    if (v) {
      Matter.Composite.remove(this.engine.world, v.body);
      this.viruses.delete(id);
      this.bodyIdToVirus.delete(v.body.id);
      this.pendingVirusRemovalIds.delete(id);
    }
  }

  getAllViruses(): VirusPhysicsBody[] {
    return Array.from(this.viruses.values());
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

    const entry: PhysicsPlanet = { id, planetId, body };
    this.planets.set(id, entry);
    this.bodyIdToPlanet.set(body.id, entry);
    Matter.Composite.add(this.engine.world, body);
    // Ensure the body is awake and starts falling immediately.
    // enableSleeping can cause a freshly-dropped planet to go to sleep on
    // contact with an existing body, making it appear stuck at the top.
    Matter.Body.setVelocity(body, { x: 0, y: 1 });
    if ((body as any).isSleeping) (body as any).isSleeping = false;
  }

  removePlanet(id: string): void {
    const p = this.planets.get(id);
    if (p) {
      Matter.Composite.remove(this.engine.world, p.body);
      this.planets.delete(id);
      this.bodyIdToPlanet.delete(p.body.id);
      this.pendingRemovalIds.delete(id);
      this.shieldPassedPlanetIds.delete(id);
      this.shieldRecentlyHitIds.delete(id);
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
    // Scaling factor: larger planets create significantly more impact
    // We use a base multiplier that grows with planet size
    const intensity = Math.sqrt(mergedPlanetSize / 15); // normalized intensity factor
    const maxKick = mergedPlanetSize * 0.12 * intensity;
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
    Matter.Engine.update(this.engine, Math.min(delta, 33));
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
    this.pendingMergeKeys.clear();
    this.pendingRemovalIds.clear();
    this.pendingStarRemovalIds.clear();
    this.pendingBlackHoleRemovalIds.clear();
    this.pendingVirusRemovalIds.clear();
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
    this.pendingMergeKeys.clear();
    this.pendingRemovalIds.clear();
    this.pendingStarRemovalIds.clear();
    this.pendingBlackHoleRemovalIds.clear();
    this.pendingVirusRemovalIds.clear();
    this.mergeCallbacks = [];
    this.starUpgradeCallbacks = [];
    this.blackHoleSuckCallbacks = [];
    this.virusInfectCallbacks = [];
    this.sunMergeCallbacks = [];
  }
}
