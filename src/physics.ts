import {
  PLANETS,
  GAME_WIDTH,
  GAME_HEIGHT,
  GRAVITY,
  RESTITUTION,
  FRICTION,
  STAR_RADIUS,
  BLACK_HOLE_RADIUS,
  VIRUS_RADIUS,
  DANGER_HEIGHT,
} from './constants';

export interface PhysicsBody {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  radius: number;
  isStatic: boolean;
  restitution: number;
  friction: number;
  mass: number;
  invMass: number;
  label?: string;
  spawnTime: number;
}

export interface PhysicsPlanet extends PhysicsBody {
  planetId: number;
}

export interface StarPhysicsBody extends PhysicsBody { }
export interface BlackHolePhysicsBody extends PhysicsBody { }
export interface VirusPhysicsBody extends PhysicsBody { }

export interface MergeEvent {
  id1: string;
  id2: string;
  planetId: number;
  x: number;
  y: number;
}

export interface StarUpgradeEvent {
  starId: string;
  planetId: string;
  planetTypeId: number;
  x: number;
  y: number;
}

export interface BlackHoleSuckEvent {
  blackHoleId: string;
  planetId: string;
  planetTypeId: number;
  x: number;
  y: number;
}

export interface VirusInfectEvent {
  virusId: string;
  planetId: string;
  planetTypeId: number;
  x: number;
  y: number;
}

export interface SunMergeEvent {
  id1: string;
  id2: string;
  blackHoleId: string;
  x: number;
  y: number;
}

type MergeCallback = (event: MergeEvent) => void;
type StarUpgradeCallback = (event: StarUpgradeEvent) => void;
type BlackHoleSuckCallback = (event: BlackHoleSuckEvent) => void;
type VirusInfectCallback = (event: VirusInfectEvent) => void;
type SunMergeCallback = (event: SunMergeEvent) => void;

export class SolarPhysics {
  private planets: Map<string, PhysicsPlanet> = new Map();
  private stars: Map<string, StarPhysicsBody> = new Map();
  private blackHoles: Map<string, BlackHolePhysicsBody> = new Map();
  private viruses: Map<string, VirusPhysicsBody> = new Map();

  private mergeCallbacks: MergeCallback[] = [];
  private starUpgradeCallbacks: StarUpgradeCallback[] = [];
  private blackHoleSuckCallbacks: BlackHoleSuckCallback[] = [];
  private virusInfectCallbacks: VirusInfectCallback[] = [];
  private sunMergeCallbacks: SunMergeCallback[] = [];

  private pendingMergeKeys: Set<string> = new Set();
  private pendingRemovalIds: Set<string> = new Set();

  private shieldActive: boolean = false;
  private shieldPassedPlanetIds: Set<string> = new Set();
  private shieldRecentlyHitIds: Set<string> = new Set();
  private shieldHitCallbacks: Array<() => void> = [];

  width: number;
  height: number;

  constructor(width: number = GAME_WIDTH, height: number = GAME_HEIGHT) {
    this.width = width;
    this.height = height;
  }

  addPlanet(id: string, planetId: number, x: number, y: number): void {
    const planet = PLANETS[planetId - 1];
    const radius = planet.size * planet.hitboxRatio;
    const mass = radius * radius * Math.PI * 0.002;

    this.planets.set(id, {
      id,
      planetId,
      x: x + (Math.random() - 0.5) * 3.5, // Increased Jitter to prevent perfect center stacks
      y,
      vx: 0,
      vy: 1,
      angle: 0,
      angularVelocity: 0,
      radius,
      isStatic: false,
      restitution: RESTITUTION,
      friction: FRICTION,
      mass,
      invMass: 1 / mass,
      label: id,
      spawnTime: Date.now(),
    });
  }

  addStar(id: string, x: number, y: number): void {
    const radius = STAR_RADIUS;
    const mass = radius * radius * Math.PI * 0.001;
    this.stars.set(id, {
      id,
      x: x + (Math.random() - 0.5) * 0.1,
      y,
      vx: 0,
      vy: 1,
      angle: 0,
      angularVelocity: 0,
      radius,
      isStatic: false,
      restitution: 0.5,
      friction: FRICTION,
      mass,
      invMass: 1 / mass,
      label: 'star_' + id,
      spawnTime: Date.now(),
    });
  }

  addBlackHole(id: string, x: number, y: number): void {
    const radius = BLACK_HOLE_RADIUS;
    const mass = radius * radius * Math.PI * 0.004;
    this.blackHoles.set(id, {
      id,
      x: x + (Math.random() - 0.5) * 0.1,
      y,
      vx: 0,
      vy: 1,
      angle: 0,
      angularVelocity: 0,
      radius,
      isStatic: false,
      restitution: 0.3,
      friction: FRICTION,
      mass,
      invMass: 1 / mass,
      label: 'bh_' + id,
      spawnTime: Date.now(),
    });
  }

  addVirus(id: string, x: number, y: number): void {
    const radius = VIRUS_RADIUS;
    const mass = radius * radius * Math.PI * 0.002;
    this.viruses.set(id, {
      id,
      x: x + (Math.random() - 0.5) * 0.1,
      y,
      vx: 0,
      vy: 1,
      angle: 0,
      angularVelocity: 0,
      radius,
      isStatic: false,
      restitution: 0.4,
      friction: FRICTION,
      mass,
      invMass: 1 / mass,
      label: 'virus_' + id,
      spawnTime: Date.now(),
    });
  }

  removePlanet(id: string): void {
    this.planets.delete(id);
    this.pendingRemovalIds.delete(id);
    this.shieldPassedPlanetIds.delete(id);
    this.shieldRecentlyHitIds.delete(id);
  }

  removeStar(id: string): void {
    this.stars.delete(id);
  }

  removeBlackHole(id: string): void {
    this.blackHoles.delete(id);
  }

  removeVirus(id: string): void {
    this.viruses.delete(id);
  }

  getAllPlanets(): PhysicsPlanet[] {
    return Array.from(this.planets.values());
  }

  getAllStars(): StarPhysicsBody[] {
    return Array.from(this.stars.values());
  }

  getAllBlackHoles(): BlackHolePhysicsBody[] {
    return Array.from(this.blackHoles.values());
  }

  getAllViruses(): VirusPhysicsBody[] {
    return Array.from(this.viruses.values());
  }

  step(delta: number): void {
    const dt = Math.min(delta, 33) / 1000;
    const subSteps = 8;
    const sdt = dt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      this.applyGravity(sdt);
      this.integrate(sdt);
      this.resolveCollisions();
      this.constrainToWorld();
    }

    // Process pending removals
    for (const id of this.pendingRemovalIds) {
      this.removePlanet(id);
      this.removeStar(id);
      this.removeBlackHole(id);
      this.removeVirus(id);
    }
    this.pendingRemovalIds.clear();
    this.pendingMergeKeys.clear();

    if (this.shieldActive) {
      this.checkShield();
    }
  }

  private applyGravity(dt: number) {
    const g = GRAVITY * 600; // Adjusted for pseudo physics scaling
    for (const p of this.planets.values()) p.vy += g * dt;
    for (const s of this.stars.values()) s.vy += g * dt;
    for (const bh of this.blackHoles.values()) bh.vy += g * dt;
    for (const v of this.viruses.values()) v.vy += g * dt;
  }

  private integrate(dt: number) {
    const now = Date.now();
    for (const p of this.planets.values()) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += p.angularVelocity * dt;
      if (now - p.spawnTime > 100) p.angularVelocity = 0;
    }
    for (const s of this.stars.values()) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.angle += s.angularVelocity * dt;
      if (now - s.spawnTime > 100) s.angularVelocity = 0;
    }
    for (const bh of this.blackHoles.values()) {
      bh.x += bh.vx * dt;
      bh.y += bh.vy * dt;
    }
    for (const v of this.viruses.values()) {
      v.x += v.vx * dt;
      v.y += v.vy * dt;
    }
  }

  private resolveCollisions() {
    const all = [
      ...Array.from(this.planets.values()),
      ...Array.from(this.stars.values()),
      ...Array.from(this.blackHoles.values()),
      ...Array.from(this.viruses.values()),
    ];

    for (let i = 0; i < all.length; i++) {
      const a = all[i];
      for (let j = i + 1; j < all.length; j++) {
        const b = all[j];
        this.checkAndResolvePair(a, b);
      }
    }
  }

  private checkAndResolvePair(a: PhysicsBody, b: PhysicsBody) {
    if (this.pendingRemovalIds.has(a.id) || this.pendingRemovalIds.has(b.id)) return;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distSq = dx * dx + dy * dy;
    const minDist = a.radius + b.radius;

    if (distSq < minDist * minDist) {
      const dist = Math.sqrt(distSq) || 0.1;
      // If perfectly aligned vertically (or very close), add a forced horizontal push to ensure imbalance
      let nx = dx / dist;
      if (Math.abs(dx) < 0.5) {
        nx = Math.random() > 0.5 ? 0.15 : -0.15;
      }
      const ny = dy / dist;

      // Special interactions
      if (this.handleSpecialInteraction(a, b, nx, ny)) return;

      // Standard elastic collision
      const overlap = minDist - dist;
      const totalInvMass = a.invMass + b.invMass;

      // Position correction
      const percent = 0.8; // Increased from 0.4 for snappier separation
      const slop = 0.01;
      const correction = (Math.max(overlap - slop, 0) / totalInvMass) * percent;

      a.x -= nx * correction * a.invMass;
      a.y -= ny * correction * a.invMass;
      b.x += nx * correction * b.invMass;
      b.y += ny * correction * b.invMass;

      // Velocity resolution
      const rvx = b.vx - a.vx;
      const rvy = b.vy - a.vy;
      const velAlongNormal = rvx * nx + rvy * ny;

      if (velAlongNormal > 0) return;

      // Use the maximum restitution for a "pop" effect
      const e = Math.max(a.restitution, b.restitution);
      let j = -(1 + e) * velAlongNormal;
      j /= totalInvMass;

      const impulseX = j * nx;
      const impulseY = j * ny;

      a.vx -= impulseX * a.invMass;
      a.vy -= impulseY * a.invMass;
      b.vx += impulseX * b.invMass;
      b.vy += impulseY * b.invMass;

      // Friction
      const tangentX = rvx - (velAlongNormal * nx);
      const tangentY = rvy - (velAlongNormal * ny);
      const tl = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
      if (tl > 0.001) {
        const tx = tangentX / tl;
        const ty = tangentY / tl;
        const mu = Math.sqrt(a.friction * b.friction);
        let jt = -(rvx * tx + rvy * ty);
        jt /= totalInvMass;
        jt = Math.max(-j * mu, Math.min(j * mu, jt));

        a.vx -= jt * tx * a.invMass;
        a.vy -= jt * ty * a.invMass;
        b.vx += jt * tx * b.invMass;
        b.vy += jt * ty * b.invMass;

        // Simple angular reaction
        a.angularVelocity += jt * 0.01;
        b.angularVelocity -= jt * 0.01;
      }
    }
  }

  private handleSpecialInteraction(a: PhysicsBody, b: PhysicsBody, nx: number, ny: number): boolean {
    const isPlanet = (body: PhysicsBody): body is PhysicsPlanet => 'planetId' in body;
    const isStar = (id: string) => this.stars.has(id);
    const isBlackHole = (id: string) => this.blackHoles.has(id);
    const isVirus = (id: string) => this.viruses.has(id);

    // ── Black Hole ─────────────────────────────────
    if (isBlackHole(a.id) || isBlackHole(b.id)) {
      const bh = isBlackHole(a.id) ? (a as BlackHolePhysicsBody) : (b as BlackHolePhysicsBody);
      const other = isBlackHole(a.id) ? b : a;
      if (isPlanet(other)) {
        if (!this.pendingRemovalIds.has(other.id)) {
          this.pendingRemovalIds.add(other.id);
          this.pendingRemovalIds.add(bh.id);
          this.blackHoleSuckCallbacks.forEach(cb => cb({
            blackHoleId: bh.id,
            planetId: other.id,
            planetTypeId: other.planetId,
            x: other.x,
            y: other.y
          }));
        }
        return true;
      }
    }

    // ── Virus ──────────────────────────────────────
    if (isVirus(a.id) || isVirus(b.id)) {
      const v = isVirus(a.id) ? (a as VirusPhysicsBody) : (b as VirusPhysicsBody);
      const other = isVirus(a.id) ? b : a;
      if (isPlanet(other)) {
        if (!this.pendingRemovalIds.has(other.id) && !this.pendingRemovalIds.has(v.id)) {
          this.pendingRemovalIds.add(v.id);
          this.virusInfectCallbacks.forEach(cb => cb({
            virusId: v.id,
            planetId: other.id,
            planetTypeId: other.planetId,
            x: other.x,
            y: other.y
          }));
        }
        return true;
      }
    }

    // ── Star ───────────────────────────────────────
    if (isStar(a.id) || isStar(b.id)) {
      const s = isStar(a.id) ? (a as StarPhysicsBody) : (b as StarPhysicsBody);
      const other = isStar(a.id) ? b : a;
      if (isPlanet(other)) {
        if (!this.pendingRemovalIds.has(other.id)) {
          // Only remove the planet if it's NOT the final level (Sun)
          if (other.planetId < PLANETS.length) {
            this.pendingRemovalIds.add(other.id);
          }
          this.pendingRemovalIds.add(s.id);
          this.starUpgradeCallbacks.forEach(cb => cb({
            starId: s.id,
            planetId: other.id,
            planetTypeId: other.planetId,
            x: other.x,
            y: other.y
          }));
        }
        return true;
      }
    }

    // ── Planet Merge ───────────────────────────────
    if (isPlanet(a) && isPlanet(b)) {
      if (a.planetId === b.planetId) {
        if (this.pendingRemovalIds.has(a.id) || this.pendingRemovalIds.has(b.id)) return true;

        const key = [a.id, b.id].sort().join('|');
        if (this.pendingMergeKeys.has(key)) return true;
        this.pendingMergeKeys.add(key);
        this.pendingRemovalIds.add(a.id);
        this.pendingRemovalIds.add(b.id);

        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;

        if (a.planetId >= PLANETS.length) {
          const bhId = `sun_bh_${Date.now()}`;
          this.sunMergeCallbacks.forEach(cb => cb({ id1: a.id, id2: b.id, blackHoleId: bhId, x: midX, y: midY }));
        } else {
          this.mergeCallbacks.forEach(cb => cb({ id1: a.id, id2: b.id, planetId: a.planetId, x: midX, y: midY }));
        }
        return true;
      }
    }

    return false;
  }

  private constrainToWorld() {
    const wallDamping = 0.3;
    const all = [
      ...Array.from(this.planets.values()),
      ...Array.from(this.stars.values()),
      ...Array.from(this.blackHoles.values()),
      ...Array.from(this.viruses.values()),
    ];

    for (const p of all) {
      // Left Wall
      if (p.x - p.radius < 0) {
        p.x = p.radius;
        p.vx = Math.abs(p.vx) * RESTITUTION;
      }
      // Right Wall
      if (p.x + p.radius > this.width) {
        p.x = this.width - p.radius;
        p.vx = -Math.abs(p.vx) * RESTITUTION;
      }
      // Floor
      if (p.y + p.radius > this.height) {
        p.y = this.height - p.radius;
        p.vy = -Math.abs(p.vy) * RESTITUTION;
        p.vx *= 0.95; // Ground friction
      }
    }
  }

  private checkShield() {
    for (const p of this.planets.values()) {
      if (p.y > DANGER_HEIGHT + 40) {
        this.shieldPassedPlanetIds.add(p.id);
      }

      if (this.shieldPassedPlanetIds.has(p.id) && !this.shieldRecentlyHitIds.has(p.id)) {
        if (p.y - p.radius < DANGER_HEIGHT && p.vy < -0.5) {
          this.shieldRecentlyHitIds.add(p.id);
          setTimeout(() => this.shieldRecentlyHitIds.delete(p.id), 600);

          p.vy = Math.abs(p.vy) * 0.5;
          p.y = DANGER_HEIGHT + p.radius + 2;
          this.shieldHitCallbacks.forEach(cb => cb());
        }
      }
    }
  }

  applyMergeShockwave(x: number, y: number, size: number, excludeId?: string) {
    const shockRadius = size * 6.5; // Increased range
    const intensity = Math.sqrt(size / 15);
    const maxKick = size * 3.8 * intensity; // Increased force (from 0.25 to 0.8)

    // Apply to all physical entities
    const collections = [this.planets, this.stars, this.blackHoles, this.viruses];

    for (const collection of collections) {
      for (const p of collection.values()) {
        if (p.id === excludeId) continue;
        const dx = p.x - x;
        const dy = p.y - y;
        const distSq = dx * dx + dy * dy;
        const shockRadiusSq = shockRadius * shockRadius;

        if (distSq < 1 || distSq > shockRadiusSq) continue;

        const dist = Math.sqrt(distSq);
        const f = 1 - dist / shockRadius;
        // Stronger kick for lighter (smaller) objects
        const massFactor = p.invMass || 1;

        p.vx += (dx / dist) * maxKick * f * massFactor;
        p.vy += (dy / dist) * maxKick * f * massFactor;

        // Add a bit of angular kick too
        p.angularVelocity += (Math.random() - 0.5) * 0.2 * f;
      }
    }
  }

  applyBlackHoleSuction(x: number, y: number, size: number, isGlobal?: boolean) {
    const radius = isGlobal ? 2000 : size * 6.0; // Global covers the logical board area
    const force = size * 0.75; // Increased force (from 0.45 to 0.75)

    const collections = [this.planets, this.stars, this.blackHoles, this.viruses];

    for (const collection of collections) {
      for (const p of collection.values()) {
        const dx = x - p.x;
        const dy = y - p.y;
        const distSq = dx * dx + dy * dy;
        const radiusSq = radius * radius;

        if (distSq < 1 || distSq > radiusSq) continue;

        const dist = Math.sqrt(distSq);
        const f = 1 - dist / radius;
        p.vx += (dx / dist) * force * f;
        p.vy += (dy / dist) * force * f;
      }
    }
  }

  setShieldActive(active: boolean) {
    this.shieldActive = active;
    if (!active) {
      this.shieldPassedPlanetIds.clear();
      this.shieldRecentlyHitIds.clear();
    }
  }

  onMerge(cb: MergeCallback) { this.mergeCallbacks.push(cb); }
  onStarUpgrade(cb: StarUpgradeCallback) { this.starUpgradeCallbacks.push(cb); }
  onBlackHoleSuck(cb: BlackHoleSuckCallback) { this.blackHoleSuckCallbacks.push(cb); }
  onVirusInfect(cb: VirusInfectCallback) { this.virusInfectCallbacks.push(cb); }
  onSunMerge(cb: SunMergeCallback) { this.sunMergeCallbacks.push(cb); }
  onShieldHit(cb: () => void) { this.shieldHitCallbacks.push(cb); }

  getHighestPoint() {
    let minY = this.height + 1;
    let vy = 0;
    if (this.planets.size === 0) return null;
    for (const p of this.planets.values()) {
      const top = p.y - p.radius;
      if (top < minY) {
        minY = top;
        vy = p.vy;
      }
    }
    return { y: minY, vy };
  }

  hasActiveBodies() {
    return this.planets.size > 0 || this.stars.size > 0 || this.blackHoles.size > 0 || this.viruses.size > 0;
  }

  reset() {
    this.planets.clear();
    this.stars.clear();
    this.blackHoles.clear();
    this.viruses.clear();
    this.pendingMergeKeys.clear();
    this.pendingRemovalIds.clear();
  }

  destroy() {
    this.reset();
    this.mergeCallbacks = [];
    this.starUpgradeCallbacks = [];
    this.blackHoleSuckCallbacks = [];
    this.virusInfectCallbacks = [];
    this.sunMergeCallbacks = [];
  }
}
