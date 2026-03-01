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

export interface GameState {
  planets: RenderPlanet[];
  score: number;
  highScore: number;
  currentPlanetId: number;
  nextPlanetId: number;
  pointerX: number;
  isDropping: boolean;
  gameOver: boolean;
  combo: number;
  showCombo: boolean;
  dangerProgress: number; // 0-1 progress toward game over
  explosions: Explosion[];
  mergeSpawnIds: string[]; // IDs of planets freshly spawned from a merge (for pop animation)
}
