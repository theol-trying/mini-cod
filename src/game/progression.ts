import { ProgressionState, RankInfo, WeaponId, CamoId } from '../types/game';
import { WEAPONS, CAMOS } from './weapons';

const STORAGE_KEY = 'mini_cod_progression_v1';

export const RANKS: RankInfo[] = [
  { level: 1, title: 'Recrue', xpRequired: 0, iconName: 'Shield' },
  { level: 2, title: 'Soldat', xpRequired: 300, iconName: 'ShieldAlert' },
  { level: 3, title: 'Caporal', xpRequired: 700, iconName: 'Award' },
  { level: 4, title: 'Caporal-Chef', xpRequired: 1200, iconName: 'Medal' },
  { level: 5, title: 'Sergent', xpRequired: 1800, iconName: 'ChevronUp' },
  { level: 6, title: 'Sergent-Chef', xpRequired: 2500, iconName: 'ChevronsUp' },
  { level: 7, title: 'Adjudant', xpRequired: 3300, iconName: 'Crosshair' },
  { level: 8, title: 'Major', xpRequired: 4200, iconName: 'Target' },
  { level: 9, title: 'Aspirant', xpRequired: 5200, iconName: 'Zap' },
  { level: 10, title: 'Sous-Lieutenant', xpRequired: 6300, iconName: 'Star' },
  { level: 11, title: 'Lieutenant', xpRequired: 7500, iconName: 'Star' },
  { level: 12, title: 'Capitaine', xpRequired: 8800, iconName: 'ShieldCheck' },
  { level: 13, title: 'Commandant', xpRequired: 10200, iconName: 'Crown' },
  { level: 14, title: 'Lieutenant-Colonel', xpRequired: 11700, iconName: 'Crown' },
  { level: 15, title: 'Colonel', xpRequired: 13300, iconName: 'Flame' },
  { level: 16, title: 'Général de Brigade', xpRequired: 15000, iconName: 'Flame' },
  { level: 17, title: 'Général de Division', xpRequired: 17000, iconName: 'Sparkles' },
  { level: 18, title: 'Général de Corps', xpRequired: 19200, iconName: 'Sparkles' },
  { level: 19, title: 'Général d\'Armée', xpRequired: 21600, iconName: 'Trophy' },
  { level: 20, title: 'Maître du Prestige', xpRequired: 25000, iconName: 'Trophy' }
];

export const DEFAULT_PROGRESSION: ProgressionState = {
  level: 1,
  xp: 0,
  prestige: 0,
  totalKills: 0,
  totalDeaths: 0,
  totalWins: 0,
  totalMatches: 0,
  headshots: 0,
  unlockedWeapons: ['m4a1', 'deagle', 'knife'],
  unlockedCamos: ['standard'],
  selectedPrimary: 'm4a1',
  selectedSecondary: 'deagle',
  selectedCamo: 'standard'
};

export function loadProgression(): ProgressionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESSION;
    const data = JSON.parse(raw);
    return {
      ...DEFAULT_PROGRESSION,
      ...data,
      unlockedWeapons: Array.isArray(data.unlockedWeapons) ? data.unlockedWeapons : DEFAULT_PROGRESSION.unlockedWeapons,
      unlockedCamos: Array.isArray(data.unlockedCamos) ? data.unlockedCamos : DEFAULT_PROGRESSION.unlockedCamos
    };
  } catch {
    return DEFAULT_PROGRESSION;
  }
}

export function saveProgression(prog: ProgressionState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prog));
  } catch {
    // ignore
  }
}

export function getRankForLevel(level: number): RankInfo {
  const clamped = Math.max(1, Math.min(20, level));
  return RANKS[clamped - 1] || RANKS[0];
}

export function getXpProgress(xp: number): { currentLevel: number; progressPercent: number; nextXp: number; curXp: number } {
  let currentLevel = 1;
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].xpRequired) {
      currentLevel = RANKS[i].level;
      break;
    }
  }

  if (currentLevel >= 20) {
    return { currentLevel: 20, progressPercent: 100, nextXp: 25000, curXp: xp };
  }

  const currentLevelXp = RANKS[currentLevel - 1].xpRequired;
  const nextLevelXp = RANKS[currentLevel].xpRequired;
  const range = nextLevelXp - currentLevelXp;
  const inLevel = Math.max(0, xp - currentLevelXp);
  const percent = Math.min(100, Math.round((inLevel / range) * 100));

  return {
    currentLevel,
    progressPercent: percent,
    nextXp: nextLevelXp,
    curXp: xp
  };
}

export interface MatchEarnedRewards {
  baseXp: number;
  killsXp: number;
  headshotsXp: number;
  streakBonusXp: number;
  victoryBonusXp: number;
  totalXp: number;
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  newUnlocks: string[];
}

export function recordMatchResult(
  current: ProgressionState,
  stats: {
    kills: number;
    deaths: number;
    headshots: number;
    highestStreak: number;
    won: boolean;
  }
): { updatedState: ProgressionState; rewards: MatchEarnedRewards } {
  const killsXp = stats.kills * 100;
  const headshotsXp = stats.headshots * 50;
  const streakBonusXp = stats.highestStreak * 40;
  const victoryBonusXp = stats.won ? 500 : 150;
  const baseXp = 200; // participation
  const totalEarned = baseXp + killsXp + headshotsXp + streakBonusXp + victoryBonusXp;

  const newTotalXp = current.xp + totalEarned;
  const newTotalKills = current.totalKills + stats.kills;
  const newTotalDeaths = current.totalDeaths + stats.deaths;
  const newTotalWins = current.totalWins + (stats.won ? 1 : 0);
  const newTotalMatches = current.totalMatches + 1;
  const newHeadshots = current.headshots + stats.headshots;

  const { currentLevel: newLevel } = getXpProgress(newTotalXp);
  const oldLevel = current.level;
  const leveledUp = newLevel > oldLevel;

  const newUnlocks: string[] = [];

  // Check weapon unlocks
  const unlockedWeapons = [...current.unlockedWeapons];
  (Object.keys(WEAPONS) as WeaponId[]).forEach((wId) => {
    const w = WEAPONS[wId];
    if (newLevel >= w.unlockLevel && !unlockedWeapons.includes(wId)) {
      unlockedWeapons.push(wId);
      newUnlocks.push(`Arme : ${w.name}`);
    }
  });

  // Check camo unlocks based on total kills
  const unlockedCamos = [...current.unlockedCamos];
  (Object.keys(CAMOS) as CamoId[]).forEach((cId) => {
    const c = CAMOS[cId];
    if (newTotalKills >= c.unlockKills && !unlockedCamos.includes(cId)) {
      unlockedCamos.push(cId);
      newUnlocks.push(`Camouflage : ${c.name}`);
    }
  });

  const updatedState: ProgressionState = {
    ...current,
    xp: newTotalXp,
    level: newLevel,
    totalKills: newTotalKills,
    totalDeaths: newTotalDeaths,
    totalWins: newTotalWins,
    totalMatches: newTotalMatches,
    headshots: newHeadshots,
    unlockedWeapons,
    unlockedCamos
  };

  saveProgression(updatedState);

  return {
    updatedState,
    rewards: {
      baseXp,
      killsXp,
      headshotsXp,
      streakBonusXp,
      victoryBonusXp,
      totalXp: totalEarned,
      leveledUp,
      oldLevel,
      newLevel,
      newUnlocks
    }
  };
}
