import React from 'react';
import { WeaponId, KillfeedEntry, Hitmarker, MatchFormat } from '../types/game';
import { WEAPONS, KILLSTREAKS } from '../game/weapons';
import {
  Crosshair,
  Shield,
  Radio,
  Bomb,
  Plane,
  AlertTriangle,
  RotateCcw,
  Target,
  Sparkles,
  Hand
} from 'lucide-react';

interface HUDProps {
  health: number;
  maxHealth: number;
  currentAmmo: number;
  reserveAmmo: number;
  weaponId: WeaponId;
  score: number;
  targetCount: number;
  matchTime: number;
  streak: number;
  killfeed: KillfeedEntry[];
  hitmarkers: Hitmarker[];
  isUavActive: boolean;
  nukeCountdown: number | null;
  isAiming: boolean;
  playerPos: { x: number; z: number };
  playerYaw: number;
  targetPositions: Array<{ x: number; z: number; isKnockedDown?: boolean }>;
  pickupPrompt: string | null;
  weaponUpgradeBanner: string | null;
  matchFormat: MatchFormat;
  onFireTouch: (down: boolean) => void;
  onAdsTouch: () => void;
  onJumpTouch: () => void;
  onReloadTouch: () => void;
  onGrenadeTouch: () => void;
  onSwitchTouch: () => void;
  onPickupTouch: () => void;
  onStreakTouch: (id: string) => void;
  isTouchDevice: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  health,
  maxHealth,
  currentAmmo,
  reserveAmmo,
  weaponId,
  score,
  targetCount,
  matchTime,
  streak,
  killfeed,
  hitmarkers,
  isUavActive,
  nukeCountdown,
  isAiming,
  playerPos,
  playerYaw,
  targetPositions,
  pickupPrompt,
  weaponUpgradeBanner,
  matchFormat,
  onFireTouch,
  onAdsTouch,
  onJumpTouch,
  onReloadTouch,
  onGrenadeTouch,
  onSwitchTouch,
  onPickupTouch,
  onStreakTouch,
  isTouchDevice
}) => {
  const currentWeapon = WEAPONS[weaponId] || WEAPONS.m4a1;
  const recentHit = hitmarkers[hitmarkers.length - 1];

  const minutes = Math.floor(matchTime / 60);
  const seconds = Math.floor(matchTime % 60);
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const radarRadius = 60;
  const radarWorldScale = 1.4;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-mono text-white">
      {/* 1. Top-Left: Tactical Radar */}
      <div className="absolute top-4 left-4 flex flex-col gap-1">
        <div className="relative w-36 h-36 rounded-full bg-black/70 border-2 border-emerald-500/60 shadow-lg overflow-hidden backdrop-blur-sm">
          <div className="absolute inset-3 rounded-full border border-emerald-500/20" />
          <div className="absolute inset-8 rounded-full border border-emerald-500/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-[1px] bg-emerald-500/20" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-full w-[1px] bg-emerald-500/20" />
          </div>

          {/* Sweeping radar line if UAV active */}
          {isUavActive && (
            <div className="absolute inset-0 animate-spin origin-center duration-1000 bg-gradient-to-r from-emerald-500/25 to-transparent" />
          )}

          {/* Center Player Direction Marker */}
          <div
            className="absolute left-1/2 top-1/2 w-0 h-0 -ml-1.5 -mt-2 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[12px] border-b-emerald-400 z-10"
            style={{ transform: `rotate(${(-playerYaw * 180) / Math.PI}deg)` }}
          />

          {/* Target Blips */}
          {targetPositions.map((tgt, i) => {
            if (tgt.isKnockedDown && !isUavActive) return null;
            const dx = (tgt.x - playerPos.x) * radarWorldScale;
            const dz = (tgt.z - playerPos.z) * radarWorldScale;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist > radarRadius - 6) return null;

            return (
              <div
                key={`target-${i}`}
                className={`absolute w-2 h-2 rounded-full border border-white/80 shadow-md ${
                  tgt.isKnockedDown ? 'bg-neutral-500' : 'bg-red-500 animate-pulse'
                }`}
                style={{
                  left: `calc(50% + ${dx}px - 4px)`,
                  top: `calc(50% + ${dz}px - 4px)`
                }}
              />
            );
          })}
        </div>

        {/* UAV Active Indicator */}
        {isUavActive && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500 text-[11px] text-emerald-300 font-bold uppercase tracking-wider">
            <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
            <span>Radar UAV Déployé</span>
          </div>
        )}
      </div>

      {/* 2. Top-Center: Score & Match Mode Status */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className="flex items-center bg-black/75 border border-neutral-700/80 rounded-xl px-5 py-2 shadow-2xl backdrop-blur-md gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-amber-400 tracking-wider">ÉLIMINATIONS</span>
            <span className="text-2xl font-black text-white leading-none">
              {targetCount} <span className="text-sm text-neutral-500">/ 30</span>
            </span>
          </div>

          <div className="flex flex-col items-center px-4 border-x border-neutral-700">
            <span className="text-[10px] text-neutral-400 font-semibold uppercase">TEMPS</span>
            <span className="text-sm font-bold text-amber-300 tracking-wider">{formattedTime}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-blue-400 tracking-wider">SCORE</span>
            <span className="text-2xl font-black text-blue-300 leading-none">{score}</span>
          </div>
        </div>

        {/* Format Badge */}
        <div className="mt-1.5 px-3 py-0.5 rounded-full bg-neutral-900/80 border border-neutral-700 text-[10px] text-neutral-300 font-bold tracking-wider">
          {matchFormat === 'teams' ? 'FACE À FACE EN ÉQUIPE' : 'CHACUN POUR SOI (FFA)'}
        </div>
      </div>

      {/* 3. Top-Right: Killfeed */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5 pointer-events-none">
        {killfeed.slice(-5).map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-2 px-2.5 py-1 rounded bg-black/70 border border-neutral-800 text-xs backdrop-blur-sm shadow"
          >
            <span className="font-bold text-blue-400">{entry.killer}</span>
            <span className="text-neutral-400 text-[10px] uppercase font-mono px-1 bg-neutral-900 rounded">
              {entry.weapon.toString().toUpperCase()}
            </span>
            {entry.isHeadshot && <Target className="w-3.5 h-3.5 text-amber-400" />}
            <span className="font-bold text-neutral-300">{entry.victim}</span>
          </div>
        ))}
      </div>

      {/* 4. Center: Interactive Weapon Pickup Prompt */}
      {pickupPrompt && (
        <div className="absolute left-1/2 top-[58%] -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border-2 border-amber-400 shadow-2xl backdrop-blur-md animate-bounce pointer-events-auto">
          <Hand className="w-4 h-4 text-amber-400" />
          <span className="font-black text-xs text-amber-300 tracking-wider uppercase">
            {pickupPrompt}
          </span>
          <button
            onClick={onPickupTouch}
            className="px-2 py-0.5 rounded bg-amber-400 text-black font-black text-[10px] cursor-pointer"
          >
            ACTION
          </button>
        </div>
      )}

      {/* 5. Center: Dynamic Weapon Upgrade Banner */}
      {weaponUpgradeBanner && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/30 via-black to-amber-500/30 border-2 border-amber-400 shadow-2xl backdrop-blur-md animate-pulse">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="font-black text-sm text-amber-300 tracking-wider uppercase">
            {weaponUpgradeBanner}
          </span>
        </div>
      )}

      {/* 6. Center: Dynamic Crosshair & Exact Hitmarkers */}
      {!isAiming && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-[2px] h-2 bg-white/90" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[2px] h-2 bg-white/90" />
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 h-[2px] w-2 bg-white/90" />
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 h-[2px] w-2 bg-white/90" />
          </div>
        </div>
      )}

      {/* Sniper Scoped Sight */}
      {isAiming && weaponId === 'sniper' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-[500px] h-[500px] rounded-full border-4 border-neutral-800 shadow-[0_0_0_9999px_rgba(0,0,0,0.96)]">
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1.5px] bg-red-600/90" />
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-red-600/90" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-red-500" />
          </div>
        </div>
      )}

      {/* Hitmarker */}
      {recentHit && Date.now() - recentHit.time < 120 && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div
            className={`font-black flex items-center justify-center ${
              recentHit.isHeadshot
                ? 'text-amber-400 text-3xl scale-150 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                : recentHit.isFatal
                ? 'text-red-500 text-2xl scale-125'
                : 'text-white text-xl'
            }`}
          >
            {recentHit.isHeadshot ? '☠' : '✕'}
          </div>
        </div>
      )}

      {/* Tactical Nuke Warning */}
      {nukeCountdown !== null && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-2.5 rounded-lg bg-red-950/90 border-2 border-red-500 shadow-2xl animate-pulse">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <span className="text-red-200 font-black text-lg tracking-wider uppercase">
            BOMBE NUCLÉAIRE DANS {nukeCountdown}S
          </span>
        </div>
      )}

      {/* 7. Bottom-Left: Operator Status & Streak */}
      <div className="absolute bottom-5 left-5 flex items-end gap-3 pointer-events-auto">
        <div className="flex flex-col gap-1 bg-black/75 border border-neutral-800 rounded-xl p-3 backdrop-blur-md shadow-xl min-w-[150px]">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="uppercase font-bold tracking-wider">OPÉRATEUR</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">{Math.round(health)}</span>
            <span className="text-xs text-neutral-500 font-bold">/ 100</span>
          </div>

          <div className="w-36 h-2 rounded-full bg-neutral-800 overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${(health / maxHealth) * 100}%` }} />
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-800 text-neutral-400">
            <span>SÉRIE ACTIVE :</span>
            <span className="font-bold text-amber-400">{streak} KILLS</span>
          </div>
        </div>
      </div>

      {/* 8. Bottom-Center: Killstreaks Quickbar */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto">
        {KILLSTREAKS.map((streakDef) => {
          const isReady = streak >= streakDef.cost;
          return (
            <button
              key={streakDef.id}
              onClick={() => onStreakTouch(streakDef.id)}
              disabled={!isReady}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-md ${
                isReady
                  ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-amber-500/20 scale-105 active:scale-95 cursor-pointer'
                  : 'bg-black/60 border-neutral-800 text-neutral-500 opacity-60 cursor-not-allowed'
              }`}
            >
              {streakDef.id === 'uav' && <Radio className="w-3.5 h-3.5" />}
              {streakDef.id === 'airstrike' && <Bomb className="w-3.5 h-3.5" />}
              {streakDef.id === 'chopper' && <Plane className="w-3.5 h-3.5" />}
              {streakDef.id === 'nuke' && <AlertTriangle className="w-3.5 h-3.5" />}
              <span>[{streakDef.key}]</span>
              <span className="hidden sm:inline">{streakDef.name.split(' ')[0]}</span>
              <span className="text-[10px] px-1 py-0.2 bg-black/40 rounded">({streakDef.cost})</span>
            </button>
          );
        })}
      </div>

      {/* 9. Bottom-Right: Weapon & Ammo */}
      <div className="absolute bottom-5 right-5 flex flex-col items-end gap-1 pointer-events-auto">
        <div className="bg-black/75 border border-neutral-800 rounded-xl p-3 backdrop-blur-md shadow-xl min-w-[160px] text-right">
          <div className="text-xs font-black text-amber-400 tracking-wider uppercase mb-1">
            {currentWeapon.name}
          </div>

          <div className="flex items-baseline justify-end gap-2">
            <span className={`text-4xl font-black ${currentAmmo <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {currentAmmo}
            </span>
            <span className="text-sm font-bold text-neutral-500">/ {reserveAmmo}</span>
          </div>

          <div className="flex items-center justify-end gap-3 mt-1 pt-1 border-t border-neutral-800 text-[11px] text-neutral-400">
            <span className="uppercase font-semibold">
              {currentWeapon.isAutomatic ? 'AUTO' : currentWeapon.category === 'shotgun' ? 'POMPE' : 'SEMI'}
            </span>
            <button
              onClick={onReloadTouch}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] cursor-pointer"
            >
              [R] RECHARGE
            </button>
          </div>
        </div>
      </div>

      {/* 10. Mobile Touch Buttons */}
      {isTouchDevice && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-24 right-6 flex flex-col gap-3 pointer-events-auto">
            <button
              onTouchStart={() => onFireTouch(true)}
              onTouchEnd={() => onFireTouch(false)}
              className="w-16 h-16 rounded-full bg-red-600/85 active:bg-red-500 text-white font-black text-lg border-2 border-red-300 shadow-xl flex items-center justify-center cursor-pointer"
            >
              TIR
            </button>

            <div className="flex gap-2">
              <button
                onClick={onAdsTouch}
                className="w-12 h-12 rounded-full bg-neutral-800/80 active:bg-neutral-700 text-amber-400 border border-neutral-600 flex items-center justify-center cursor-pointer shadow-lg"
              >
                <Crosshair className="w-6 h-6" />
              </button>

              <button
                onClick={onJumpTouch}
                className="w-12 h-12 rounded-full bg-neutral-800/80 active:bg-neutral-700 text-white border border-neutral-600 flex items-center justify-center cursor-pointer shadow-lg font-bold text-xs"
              >
                SAUT
              </button>

              <button
                onClick={onSwitchTouch}
                className="w-12 h-12 rounded-full bg-neutral-800/80 active:bg-neutral-700 text-white border border-neutral-600 flex items-center justify-center cursor-pointer shadow-lg font-bold text-xs"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
