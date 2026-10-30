import { WeaponDef, WeaponId, CamoId, KillstreakDef } from '../types/game';

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  m4a1: {
    id: 'm4a1',
    name: 'M4A1 Carbine',
    category: 'assault',
    damage: 34,
    headshotMultiplier: 1.6,
    fireDelayMs: 110,
    magazineSize: 30,
    reserveAmmo: 120,
    reloadTimeMs: 1800,
    recoilKick: 0.045,
    recoilRecovery: 12,
    spreadHip: 0.042,
    spreadAds: 0.006,
    adsZoom: 0.75,
    isAutomatic: true,
    unlockLevel: 1,
    upgradeKills: 3,
    description: 'Fusil d\'assaut polyvalent et équilibré, cadence de tir fiable à moyenne et longue portée.',
    color: '#383b42'
  },
  mp5: {
    id: 'mp5',
    name: 'MP5 Submachine',
    category: 'smg',
    damage: 26,
    headshotMultiplier: 1.5,
    fireDelayMs: 78,
    magazineSize: 30,
    reserveAmmo: 150,
    reloadTimeMs: 1500,
    recoilKick: 0.032,
    recoilRecovery: 14,
    spreadHip: 0.032,
    spreadAds: 0.009,
    adsZoom: 0.82,
    isAutomatic: true,
    unlockLevel: 3,
    upgradeKills: 1,
    description: 'Pistolet-mitrailleur ultra rapide, mobilité maximale et dévastateur en combat rapproché (CQC).',
    color: '#2a2e35'
  },
  shotgun: {
    id: 'shotgun',
    name: 'Trench 12G',
    category: 'shotgun',
    damage: 18,
    pellets: 8,
    headshotMultiplier: 1.4,
    fireDelayMs: 720,
    magazineSize: 8,
    reserveAmmo: 32,
    reloadTimeMs: 2200,
    recoilKick: 0.12,
    recoilRecovery: 8,
    spreadHip: 0.095,
    spreadAds: 0.05,
    adsZoom: 0.85,
    isAutomatic: false,
    unlockLevel: 5,
    upgradeKills: 6,
    description: 'Fusil à pompe lourd à dispersion de plombs. Élimination garantie à bout portant.',
    color: '#423b32'
  },
  sniper: {
    id: 'sniper',
    name: 'Barrett .50cal',
    category: 'sniper',
    damage: 110,
    headshotMultiplier: 2.0,
    fireDelayMs: 1150,
    magazineSize: 5,
    reserveAmmo: 20,
    reloadTimeMs: 2500,
    recoilKick: 0.16,
    recoilRecovery: 6,
    spreadHip: 0.16,
    spreadAds: 0.001,
    adsZoom: 0.35,
    isAutomatic: false,
    unlockLevel: 7,
    upgradeKills: 9,
    description: 'Fusil de précision lourd à verrou. Lunette optique haute portée, neutralisation en un tir.',
    color: '#242b26'
  },
  deagle: {
    id: 'deagle',
    name: 'Desert Falcon .50',
    category: 'pistol',
    damage: 52,
    headshotMultiplier: 1.9,
    fireDelayMs: 220,
    magazineSize: 7,
    reserveAmmo: 35,
    reloadTimeMs: 1350,
    recoilKick: 0.075,
    recoilRecovery: 10,
    spreadHip: 0.038,
    spreadAds: 0.008,
    adsZoom: 0.8,
    isAutomatic: false,
    unlockLevel: 1,
    upgradeKills: 0,
    description: 'Arme de poing de secours gros calibre. 2 balles dans le torse ou 1 tir à la tête.',
    color: '#525459'
  },
  knife: {
    id: 'knife',
    name: 'Tactical Combat Knife',
    category: 'melee',
    damage: 100,
    headshotMultiplier: 1.0,
    fireDelayMs: 450,
    magazineSize: 1,
    reserveAmmo: 0,
    reloadTimeMs: 0,
    recoilKick: 0.02,
    recoilRecovery: 15,
    spreadHip: 0.01,
    spreadAds: 0.01,
    adsZoom: 1.0,
    isAutomatic: false,
    unlockLevel: 2,
    upgradeKills: 13,
    description: 'Couteau tactique de combat rapproché. Coup mortel instantané.',
    color: '#1a1a1a'
  }
};

export function getWeaponForKills(kills: number): WeaponId {
  if (kills >= 13) return 'knife';
  if (kills >= 9) return 'sniper';
  if (kills >= 6) return 'shotgun';
  if (kills >= 3) return 'm4a1';
  if (kills >= 1) return 'mp5';
  return 'deagle';
}

export interface CamoDef {
  id: CamoId;
  name: string;
  unlockRequirement: string;
  unlockKills: number;
  primaryColor: string;
  accentColor: string;
  roughness: number;
  metalness: number;
}

export const CAMOS: Record<CamoId, CamoDef> = {
  standard: {
    id: 'standard',
    name: 'Noir Tactique',
    unlockRequirement: 'Débloqué par défaut',
    unlockKills: 0,
    primaryColor: '#2b2d30',
    accentColor: '#1e2022',
    roughness: 0.6,
    metalness: 0.3
  },
  woodland: {
    id: 'woodland',
    name: 'Camouflage Forêt',
    unlockRequirement: '15 Éliminations',
    unlockKills: 15,
    primaryColor: '#3d4d33',
    accentColor: '#2a3622',
    roughness: 0.7,
    metalness: 0.1
  },
  desert: {
    id: 'desert',
    name: 'Tempête des Sables',
    unlockRequirement: '30 Éliminations',
    unlockKills: 30,
    primaryColor: '#c2a67a',
    accentColor: '#8a7350',
    roughness: 0.65,
    metalness: 0.15
  },
  digital: {
    id: 'digital',
    name: 'Urbain Digital',
    unlockRequirement: '50 Éliminations',
    unlockKills: 50,
    primaryColor: '#5a626e',
    accentColor: '#8c95a3',
    roughness: 0.5,
    metalness: 0.4
  },
  gold: {
    id: 'gold',
    name: 'Or Massif',
    unlockRequirement: '80 Éliminations',
    unlockKills: 80,
    primaryColor: '#ffd700',
    accentColor: '#ccac00',
    roughness: 0.2,
    metalness: 0.95
  },
  damascus: {
    id: 'damascus',
    name: 'Damas Mythique',
    unlockRequirement: '120 Éliminations',
    unlockKills: 120,
    primaryColor: '#8a2be2',
    accentColor: '#00ffff',
    roughness: 0.15,
    metalness: 0.9
  }
};

export const KILLSTREAKS: KillstreakDef[] = [
  {
    id: 'uav',
    name: 'Drone de Reconnaissance (UAV)',
    cost: 3,
    description: 'Révèle tous les ennemis sur la mini-carte pendant 25 secondes.',
    key: '3'
  },
  {
    id: 'airstrike',
    name: 'Frappe de Mortier',
    cost: 5,
    description: 'Pilonne la position ennemie avec une salve d\'obus dévastatrice.',
    key: '4'
  },
  {
    id: 'chopper',
    name: 'Hélicoptère d\'Attaque',
    cost: 7,
    description: 'Survole la carte et neutralise automatiquement les hostiles.',
    key: '5'
  },
  {
    id: 'nuke',
    name: 'Bombe Nucléaire Tactique',
    cost: 10,
    description: 'Compte à rebours de 10s puis anéantissement total : victoire immédiate !',
    key: '6'
  }
];
