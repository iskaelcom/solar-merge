export interface RenderPlanet {
  id: string;
  planetId: number; // 1-10 based on PLANETS array
  x: number;
  y: number;
  angle: number;
  size: number; // radius in pixels
  scale?: number;
  isMystery?: boolean;
}

export interface Explosion {
  id: string;
  x: number;
  y: number;
  planetSize: number; // radius of the merged planet
  color: string;
  scale: number;
}

export interface RenderStar {
  id: string;
  x: number;
  y: number;
  angle: number;
  size: number;
}

export interface RenderBlackHole {
  id: string;
  x: number;
  y: number;
  size: number;
}

export interface RenderVirus {
  id: string;
  x: number;
  y: number;
  size: number;
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
  currentIsMystery: boolean;   // true → user is holding a mystery planet to drop
  mysteryPlanetId: number;     // The hidden identity (1-4) of the currently held mystery planet
  pointerX: number;
  isDropping: boolean;
  gameOver: boolean;
  comboDisplay: number; // UI-only; actual multiplier lives in a ref (not editable via DevTools)
  showCombo: boolean;
  explosions: Explosion[];
  mergeSpawnIds: string[]; // IDs of planets freshly spawned from a merge (for pop animation)
  sickPlanetIds: string[]; // IDs of planets currently infected by a virus
  shieldLayers: number;    // 0 = no shield, 1-3 = active layers
  diamonds: number;        // total persistent diamonds
  sessionDiamonds: number; // diamonds earned in the current active session
  streak: number;          // current login streak
  lastStreakDate: string;  // ISO date string of last activity
  streakReward: number | null; // diamonds earned today from streak
  shrinkTimeLeft: number;      // seconds left for the shrink bonus
  shrinkCost: number;          // current cost for the shrink bonus
  redeemedCodes: string[];     // list of codes already used by the player
}
