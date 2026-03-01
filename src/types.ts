export interface RenderPlanet {
  id: string;
  planetId: number; // 1-10 based on PLANETS array
  x: number;
  y: number;
  angle: number;
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
}

export interface RenderBlackHole {
  id: string;
  x: number;
  y: number;
}

export interface GameState {
  planets: RenderPlanet[];
  stars: RenderStar[];
  blackHoles: RenderBlackHole[];
  score: number;
  highScore: number;
  currentPlanetId: number;     // planet to drop (ignored when holding a special)
  nextPlanetId: number;        // planet after current (or after the special)
  currentIsStar: boolean;      // true → user is holding a star to drop
  currentIsBlackHole: boolean; // true → user is holding a black hole to drop
  pointerX: number;
  isDropping: boolean;
  gameOver: boolean;
  combo: number;
  showCombo: boolean;
  explosions: Explosion[];
  mergeSpawnIds: string[]; // IDs of planets freshly spawned from a merge (for pop animation)
}
