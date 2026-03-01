export const PLANETS = [
  {
    id: 1,
    name: 'Moon',
    diameter: 3474,
    size: 25,
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
    size: 30,
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
    size: 35,
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
    size: 45,
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
    size: 47,
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
    size: 60,
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
    size: 63,
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
    size: 85,
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
    size: 100,
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
    size: 130,
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
export const DANGER_HEIGHT = 80;

// Time (ms) a planet must be above danger line before game over
export const DANGER_TIME = 2500;

// Delay (ms) before next planet appears after dropping
export const DROP_DELAY = 650;

// Max planet level to randomly spawn (1-based index)
export const MAX_SPAWN_LEVEL = 6;

// Physics settings
export const GRAVITY = 1.25;
export const RESTITUTION = 0.22; // bounciness reduced slightly
export const FRICTION = 0.6;     // increased friction for stability
export const FRICTION_AIR = 0.01;

// Score combo reset time (ms)
export const COMBO_RESET_TIME = 2500;
