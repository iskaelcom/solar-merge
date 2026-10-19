export type PlanetSkinId = 'classic' | 'neon' | 'pixel' | 'candy' | 'mecha' | 'pastel';
export type GalaxyThemeId =
  | 'deep-space'
  | 'nebula'
  | 'aurora'
  | 'starlit-milky-way'
  | 'pastel-dreamscape'
  | 'mecha-space-station'
  | 'candy-wonderland';

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
  {
    id: 'mecha',
    name: 'Mecha Cosmos',
    description: 'Armored robot worlds with glowing digital expressions.',
    price: 500,
    previewPlanetId: 5,
  },
  {
    id: 'pastel',
    name: 'Cute Pastel',
    description: 'Soft chibi worlds with dreamy colors and unique expressions.',
    price: 650,
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
  {
    id: 'starlit-milky-way',
    name: 'Starlit Milky Way',
    description: 'A serene panorama of our galaxy beneath countless stars.',
    price: 300,
    gradient: ['#02040D', '#10183A', '#24143D'],
    starColor: '#F8F1DC',
    accentColor: '#D9B8FF',
    boardColor: 'rgba(2,5,18,0.70)',
    wallColor: '#8E9BFF',
  },
  {
    id: 'pastel-dreamscape',
    name: 'Pastel Dreamscape',
    description: 'Soft cosmic clouds drift through a sparkling pastel sky.',
    price: 400,
    gradient: ['#77B8F5', '#B8A4E8', '#F6B9D3'],
    starColor: '#FFF7FC',
    accentColor: '#F4A9D1',
    boardColor: 'rgba(42,35,92,0.58)',
    wallColor: '#D4B9FF',
  },
  {
    id: 'mecha-space-station',
    name: 'Mecha Space Station',
    description: 'A precision-built orbital deck lit by cyan holograms.',
    price: 500,
    gradient: ['#07111C', '#112A3A', '#183A4C'],
    starColor: '#C7F8FF',
    accentColor: '#23DFFF',
    boardColor: 'rgba(3,14,24,0.70)',
    wallColor: '#20CDEB',
  },
  {
    id: 'candy-wonderland',
    name: 'Candy Wonderland',
    description: 'A sugar-crystal nebula sprinkled with candy-colored stars.',
    price: 600,
    gradient: ['#371064', '#A53AAE', '#F58FC5'],
    starColor: '#FFF3C4',
    accentColor: '#71F1E2',
    boardColor: 'rgba(55,12,82,0.64)',
    wallColor: '#FF8DCE',
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
