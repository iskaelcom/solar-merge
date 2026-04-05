export const PLANETS = [
  {
    id: 1,
    name: 'Moon',
    diameter: 3474,
    radiusRatio: 0.055, // Base radius / 360px
    color: '#E8E8F0',
    darkColor: '#9090A8',
    emoji: '🌙',
    score: 10,
    face: '😴',
    hitboxRatio: 0.94,
  },
  {
    id: 2,
    name: 'Mercury',
    diameter: 4879,
    radiusRatio: 0.083,
    color: '#B0B0B8',
    darkColor: '#606068',
    emoji: '⚫',
    score: 20,
    face: '😵',
    hitboxRatio: 0.94,
  },
  {
    id: 3,
    name: 'Mars',
    diameter: 6779,
    radiusRatio: 0.097,
    color: '#FF6B6B',
    darkColor: '#C0392B',
    emoji: '🔴',
    score: 40,
    face: '😤',
    hitboxRatio: 0.94,
  },
  {
    id: 4,
    name: 'Venus',
    diameter: 12104,
    radiusRatio: 0.125,
    color: '#FFD93D',
    darkColor: '#E67E22',
    emoji: '⭐',
    score: 80,
    face: '😍',
    hitboxRatio: 0.94,
  },
  {
    id: 5,
    name: 'Earth',
    diameter: 12742,
    radiusRatio: 0.152,
    color: '#4ECDC4',
    darkColor: '#1A6B8A',
    emoji: '🌍',
    score: 150,
    face: '😊',
    hitboxRatio: 0.94,
  },
  {
    id: 6,
    name: 'Neptune',
    diameter: 49244,
    radiusRatio: 0.180,
    color: '#5C6BC0',
    darkColor: '#283593',
    emoji: '💙',
    score: 250,
    face: '😏',
    hitboxRatio: 0.94,
  },
  {
    id: 7,
    name: 'Uranus',
    diameter: 50724,
    radiusRatio: 0.205,
    color: '#26C6DA',
    darkColor: '#00838F',
    emoji: '🩵',
    score: 400,
    face: '🤪',
    hitboxRatio: 0.94,
  },
  {
    id: 8,
    name: 'Saturn',
    diameter: 116460,
    radiusRatio: 0.241,
    color: '#FFD54F',
    darkColor: '#E65100',
    emoji: '🪐',
    score: 600,
    face: '😎',
    hasRings: true,
    hitboxRatio: 0.88,
  },
  {
    id: 9,
    name: 'Jupiter',
    diameter: 139820,
    radiusRatio: 0.284, // Recalculated for Sun Area = 2.5 * Jupiter Area
    color: '#FF8A65',
    darkColor: '#BF360C',
    emoji: '🟠',
    score: 900,
    face: '💪',
    hasStripes: true,
    hitboxRatio: 0.94,
  },
  {
    id: 10,
    name: 'Sun',
    diameter: 1391000,
    radiusRatio: 0.450, // Approx 0.284 * 1.58
    color: '#FFD600',
    darkColor: '#FF6F00',
    emoji: '☀️',
    score: 1500,
    face: '🤩',
    hasRays: true,
    hitboxRatio: 0.86,
  },
];

export type PlanetData = (typeof PLANETS)[number] & { hasRings?: boolean; hasStripes?: boolean; hasRays?: boolean; hitboxRatio: number };

// Game area dimensions (logical pixels)
export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 580;

// Danger zone height from top of game area (game over if planet above this for too long)
export const DANGER_HEIGHT = 30;

// Delay (ms) before next planet appears after dropping
export const DROP_DELAY = 450;

// Max planet level to randomly spawn (1-based index)
export const MAX_SPAWN_LEVEL = 4;

// Physics settings
export const GRAVITY = 2;
export const RESTITUTION = 0.28; // slightly more lively
export const FRICTION = 0.1;     // even smoother for faster rolling/sliding
export const FRICTION_AIR = 0.01;

// Planet sizes relative to Jupiter (Dynamic scaling base)
export const PLANET_SIZE_FACTORS = [0.20, 0.30, 0.35, 0.45, 0.55, 0.65, 0.74, 0.86, 1.0, 2.0];

// Score combo reset time (ms)
export const COMBO_RESET_TIME = 2500;

// Star power-up
export const STAR_RADIUS_RATIO = 0.15;
export const STAR_SPAWN_INTERVAL = 59;   // spawn a star every N planet drops

// Black Hole power-up
export const BLACK_HOLE_RADIUS_RATIO = 0.30;
export const BLACK_HOLE_SPAWN_INTERVAL = 29; // spawn a black hole every N planet drops

// Virus Planet power-up
export const VIRUS_RADIUS_RATIO = 0.22;
export const VIRUS_SPAWN_INTERVAL = 23;  // spawn a virus every N planet drops

// Mystery Planet feature
export const MYSTERY_PLANET_RADIUS_RATIO = 0.20;
export const MYSTERY_PLANET_REVEAL_DROPS = 5;    // number of planet drops until it reveals itself
export const MYSTERY_PLANET_SPAWN_INTERVAL = 14; // spawn a mystery planet every N drops

// Shield
export const SHIELD_MAX_LAYERS = 3;          // total shield layers granted at once
export const SHIELD_THRESHOLD_DEFAULT = 5;   // starting minimum combo for first milestone
export const SHIELD_THRESHOLD_MIN = 3;        // floor — threshold never drops below this
export const SHIELD_THRESHOLD_ADAPT_DROPS = 30; // drops with no merge before threshold is lowered

// Diamonds
export const MAX_SESSION_DIAMONDS = 10;
export const DIAMONDS_PER_MINUTE = 1;
// Wizard Bonus Spells
export const WIZARD_SHRINK_BASE_COST = 20;
export const WIZARD_SHRINK_COST_INCREMENT = 10;
export const WIZARD_SHRINK_DURATION = 300;     // 5 minutes in seconds
export const WIZARD_SHRINK_SCALE = 0.8;        // shrink to 80% size
export const WIZARD_SHRINK_MIN_PLANET_ID = 4;  // starts from Venus
export const WIZARD_SHIELD_COST = 10;
export const WIZARD_ANTIDOTE_COST = 10;
