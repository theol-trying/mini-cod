export type WeaponId = 'm4a1' | 'mp5' | 'shotgun' | 'sniper' | 'deagle' | 'knife';

export type WeaponCategory = 'assault' | 'smg' | 'shotgun' | 'sniper' | 'pistol' | 'melee';

export type CamoId = 'standard' | 'woodland' | 'desert' | 'digital' | 'gold' | 'damascus';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  category: WeaponCategory;
  damage: number;
  pellets?: number;
  headshotMultiplier: number;
  fireDelayMs: number;
  magazineSize: number;
  reserveAmmo: number;
  reloadTimeMs: number;
  recoilKick: number;
  recoilRecovery: number;
  spreadHip: number;
  spreadAds: number;
  adsZoom: number; // FOV multiplier (e.g. 0.75 for AR, 0.4 for sniper)
  isAutomatic: boolean;
  unlockLevel: number;
  upgradeKills: number; // Kills required to auto-upgrade to this weapon
  description: string;
  color: string;
}

export type MatchFormat = 'teams' | 'ffa'; // Face-à-Face en Équipe vs Chacun pour Soi

export type GameMode = 'shootout' | 'gun_game' | 'time_trial' | 'free_shoot' | 'tdm' | 'dom' | 'ffa';

export type MapId = 'nuketown' | 'shipment' | 'rust' | 'terminal' | 'raid';

export type Team = 'allies' | 'enemies';

export interface WeaponPickupDef {
  id: string;
  weaponId: WeaponId | 'ammo_crate';
  position: [number, number, number];
  name: string;
  respawnTimeSeconds: number;
}

export interface ActiveWeaponPickup {
  id: string;
  weaponId: WeaponId | 'ammo_crate';
  position: [number, number, number];
  name: string;
  isAvailable: boolean;
  respawnTimer: number;
  respawnTimeSeconds: number;
}

export interface KillfeedEntry {
  id: string;
  killer: string;
  killerTeam?: Team;
  victim: string;
  victimTeam?: Team;
  weapon: WeaponId | string;
  isHeadshot: boolean;
  time: number;
}

export type KillstreakId = 'uav' | 'airstrike' | 'chopper' | 'nuke';

export interface KillstreakDef {
  id: KillstreakId;
  name: string;
  cost: number;
  description: string;
  key: string;
}

export interface DominationFlag {
  id: 'A' | 'B' | 'C';
  name: string;
  position: [number, number, number];
  radius: number;
  owner: Team | null;
  captureProgress: number; // -100 (enemies) to 100 (allies)
  capturingTeam: Team | null;
}

export interface PlayerStats {
  id: string;
  name: string;
  team: Team;
  isBot?: boolean;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  streak: number;
  highestStreak: number;
  ping: number;
}

export interface NetworkPeerInfo {
  id: string;
  name: string;
  team: Team;
  isHost: boolean;
  isReady: boolean;
  selectedWeapon: WeaponId;
  selectedCamo: CamoId;
  ping: number;
}

export interface RoomState {
  code: string;
  format: MatchFormat;
  mapId: MapId;
  isStarted: boolean;
  hostId: string;
  peers: NetworkPeerInfo[];
}

export interface ProgressionState {
  level: number;
  xp: number;
  prestige: number;
  totalKills: number;
  totalDeaths: number;
  totalWins: number;
  totalMatches: number;
  headshots: number;
  unlockedWeapons: WeaponId[];
  unlockedCamos: CamoId[];
  selectedPrimary: WeaponId;
  selectedSecondary: WeaponId;
  selectedCamo: CamoId;
}

export interface RankInfo {
  level: number;
  title: string;
  xpRequired: number;
  iconName: string;
}

export interface Hitmarker {
  id: string;
  isFatal: boolean;
  isHeadshot: boolean;
  time: number;
}

export interface GameSettings {
  mouseSensitivity: number;
  fov: number;
  masterVolume: number;
  sfxVolume: number;
  invertY: boolean;
  botDifficulty: 'recruit' | 'regular' | 'veteran';
  graphicsQuality: 'retro' | 'standard' | 'high';
}
