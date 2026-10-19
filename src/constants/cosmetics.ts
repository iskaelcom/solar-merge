export type PlanetSkinId = 'classic' | 'neon' | 'pixel' | 'candy';
export type GalaxyThemeId = 'deep-space' | 'nebula' | 'aurora';

export interface PlanetSkinDefinition {
  id: PlanetSkinId;
  name: string;
  description: string;
  price: number;
  previewPlanetId: number;
}

export interface GalaxyThemeDefinition {
  id: GalaxyThemeId;
  name: string;
  description: string;
  price: number;
  gradient: readonly [string, string, string];
  starColor: string;
  accentColor: string;
  boardColor: string;
  wallColor: string;
}

export const PLANET_SKINS: readonly PlanetSkinDefinition[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'The original Solar Merge planets.',
    price: 0,
    previewPlanetId: 5,
  },
  {
    id: 'neon',
    name: 'Neon Nova',
    description: 'Glossy planets with electric arcade glow.',
    price: 150,
    previewPlanetId: 5,
  },
  {
    id: 'pixel',
    name: 'Pixel Cosmos',
    description: 'Crisp 16-bit planets from a retro galaxy.',
    price: 250,
    previewPlanetId: 5,
  },
  {
    id: 'candy',
    name: 'Candy Galaxy',
    description: 'Glossy gummy planets from a deliciously sweet galaxy.',
    price: 350,
    previewPlanetId: 5,
  },
];

export const GALAXY_THEMES: readonly GalaxyThemeDefinition[] = [
  {
    id: 'deep-space',
    name: 'Deep Space',
    description: 'The original calm blue galaxy.',
    price: 0,
    gradient: ['#0a0a2e', '#12124a', '#1a1a5e'],
    starColor: '#FFFFFF',
    accentColor: '#00E5FF',
    boardColor: 'rgba(5,5,30,0.70)',
    wallColor: '#6464FF',
  },
  {
    id: 'nebula',
    name: 'Purple Nebula',
    description: 'A rich violet cloud lit by pink stars.',
    price: 100,
    gradient: ['#160724', '#4A125E', '#120526'],
    starColor: '#FFB8FF',
    accentColor: '#E040FB',
    boardColor: 'rgba(30,4,42,0.76)',
    wallColor: '#D44CFF',
  },
  {
    id: 'aurora',
    name: 'Cosmic Aurora',
    description: 'Emerald and cyan light across deep space.',
    price: 180,
    gradient: ['#031A20', '#063D48', '#10184A'],
    starColor: '#B8FFF1',
    accentColor: '#00F5C8',
    boardColor: 'rgba(2,25,34,0.76)',
    wallColor: '#00D8B4',
  },
];

export const DEFAULT_PLANET_SKIN: PlanetSkinId = 'classic';
export const DEFAULT_GALAXY_THEME: GalaxyThemeId = 'deep-space';

export function isPlanetSkinId(value: unknown): value is PlanetSkinId {
  return PLANET_SKINS.some((skin) => skin.id === value);
}

export function isGalaxyThemeId(value: unknown): value is GalaxyThemeId {
  return GALAXY_THEMES.some((theme) => theme.id === value);
}

export function getGalaxyTheme(id: GalaxyThemeId): GalaxyThemeDefinition {
  return GALAXY_THEMES.find((theme) => theme.id === id) ?? GALAXY_THEMES[0];
}
