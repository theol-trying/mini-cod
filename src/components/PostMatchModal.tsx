import React from 'react';
import { MatchEarnedRewards } from '../game/progression';
import { getRankForLevel } from '../game/progression';
import { Trophy, Award, Zap, ArrowRight, RotateCcw, Home, Sparkles } from 'lucide-react';

interface PostMatchModalProps {
  victory: boolean;
  rewards: MatchEarnedRewards;
  currentXp: number;
  stats: {
    kills: number;
    deaths: number;
    headshots: number;
    streak: number;
  };
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
}

export const PostMatchModal: React.FC<PostMatchModalProps> = ({
  victory,
  rewards,
  currentXp,
  stats,
  onPlayAgain,
  onReturnToMenu
}) => {
  const currentRank = getRankForLevel(rewards.newLevel);
  const kdRatio = stats.deaths > 0 ? (stats.kills / stats.deaths).toFixed(2) : stats.kills.toString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 font-mono select-none">
      <div className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Top Banner */}
        <div
          className={`py-6 px-8 text-center border-b ${
            victory
              ? 'bg-gradient-to-b from-blue-900/60 to-neutral-950 border-blue-600/40'
              : 'bg-gradient-to-b from-red-900/60 to-neutral-950 border-red-600/40'
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Trophy className={`w-8 h-8 ${victory ? 'text-amber-400' : 'text-neutral-500'}`} />
          </div>
          <h1
            className={`text-4xl font-black tracking-widest uppercase ${
              victory ? 'text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]' : 'text-red-500'
            }`}
          >
            {victory ? 'VICTOIRE TACTIQUE' : 'DÉFAITE'}
          </h1>
          <p className="text-xs text-neutral-400 mt-1 uppercase font-semibold">
            {victory ? 'Mission accomplie - L\'ennemi a été neutralisé' : 'Replanification requise - Échec de la mission'}
          </p>
        </div>

        {/* Level Up Celebration Alert */}
        {rewards.leveledUp && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center gap-4 animate-bounce">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-black text-amber-400 uppercase tracking-widest">PROMOTION DE GRADE !</span>
              <h3 className="text-lg font-black text-white">
                NIVEAU {rewards.newLevel} : {currentRank.title}
              </h3>
              {rewards.newUnlocks.length > 0 && (
                <p className="text-xs text-amber-200 mt-0.5">
                  Débloqué : {rewards.newUnlocks.join(', ')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* XP Breakdown and Match Stats */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* XP Breakdown */}
          <div className="flex flex-col gap-3 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> GAIN D'EXPÉRIENCE (XP)
              </span>
              <span className="text-base font-black text-amber-300">+{rewards.totalXp} XP</span>
            </div>

            <div className="space-y-1.5 text-xs text-neutral-300">
              <div className="flex justify-between">
                <span className="text-neutral-400">Participation à la partie</span>
                <span>+{rewards.baseXp} XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Éliminations ({stats.kills})</span>
                <span>+{rewards.killsXp} XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Tirs à la tête ({stats.headshots})</span>
                <span>+{rewards.headshotsXp} XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Bonus Série ({stats.streak})</span>
                <span>+{rewards.streakBonusXp} XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">{victory ? 'Prime de Victoire' : 'Prime de Défaite'}</span>
                <span>+{rewards.victoryBonusXp} XP</span>
              </div>
            </div>

            {/* Current Military Rank Badge */}
            <div className="mt-2 pt-2 border-t border-neutral-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-neutral-300">{currentRank.title} (Niv. {rewards.newLevel})</span>
              </div>
              <span className="text-neutral-400">{currentXp} XP Total</span>
            </div>
          </div>

          {/* Match Performance */}
          <div className="flex flex-col gap-3 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="text-xs font-black text-blue-400 uppercase tracking-wider">
                RAPPORT DE COMBAT
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-2.5 rounded bg-neutral-950/60 border border-neutral-800">
                <span className="text-[10px] text-neutral-500 font-bold uppercase">Éliminations</span>
                <p className="text-2xl font-black text-white">{stats.kills}</p>
              </div>
              <div className="p-2.5 rounded bg-neutral-950/60 border border-neutral-800">
                <span className="text-[10px] text-neutral-500 font-bold uppercase">Morts</span>
                <p className="text-2xl font-black text-neutral-300">{stats.deaths}</p>
              </div>
              <div className="p-2.5 rounded bg-neutral-950/60 border border-neutral-800">
                <span className="text-[10px] text-neutral-500 font-bold uppercase">Ratio K/D</span>
                <p className="text-2xl font-black text-amber-400">{kdRatio}</p>
              </div>
              <div className="p-2.5 rounded bg-neutral-950/60 border border-neutral-800">
                <span className="text-[10px] text-neutral-500 font-bold uppercase">Meilleure Série</span>
                <p className="text-2xl font-black text-emerald-400">{stats.streak}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0 flex items-center justify-end gap-3">
          <button
            onClick={onReturnToMenu}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 font-bold text-xs border border-neutral-700 cursor-pointer transition-all"
          >
            <Home className="w-4 h-4" /> Menu Principal
          </button>
          <button
            onClick={onPlayAgain}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-black text-xs shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Rejouer Immédiatement
          </button>
        </div>
      </div>
    </div>
  );
};
