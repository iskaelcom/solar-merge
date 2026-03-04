export interface RenderPlanet {
  id: string;
  planetId: number; // 1-10 based on PLANETS array
  x: number;
  y: number;
  angle: number;
  spawnTime: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

export interface Explosion {
  id: string;
  x: number;
  y: number;
  particles: Particle[];
}

export interface RenderStar {
  id: string;
  x: number;
  y: number;
  angle: number;
}

export interface RenderBlackHole {
  id: string;
  x: number;
  y: number;
}

export interface RenderVirus {
  id: string;
  x: number;
  y: number;
}

export interface GameState {
  planets: RenderPlanet[];
  stars: RenderStar[];
  blackHoles: RenderBlackHole[];
  viruses: RenderVirus[];
  score: number;
  highScore: number;
  checksum: string;
  dropCount: number;
  currentPlanetId: number;     // planet to drop (ignored when holding a special)
  nextPlanetId: number;        // planet after current (or after the special)
  currentIsStar: boolean;      // true → user is holding a star to drop
  currentIsBlackHole: boolean; // true → user is holding a black hole to drop
  currentIsVirus: boolean;     // true → user is holding a virus planet to drop
  pointerX: number;
  isDropping: boolean;
  gameOver: boolean;
  comboDisplay: number; // UI-only; actual multiplier lives in a ref (not editable via DevTools)
  showCombo: boolean;
  explosions: Explosion[];
  mergeSpawnIds: string[]; // IDs of planets freshly spawned from a merge (for pop animation)
  sickPlanetIds: string[]; // IDs of planets currently infected by a virus
  shieldLayers: number;    // 0 = no shield, 1-3 = active layers
}
