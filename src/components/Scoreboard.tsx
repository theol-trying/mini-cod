import React from 'react';
import { PlayerStats } from '../types/game';
import { Trophy, Target, Award, Flame, X } from 'lucide-react';

interface ScoreboardProps {
  isOpen: boolean;
  onClose: () => void;
  playerStats: PlayerStats[];
  score: number;
  targetCount: number;
  mapName: string;
  modeName: string;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  isOpen,
  onClose,
  playerStats,
  score,
  targetCount,
  mapName,
  modeName
}) => {
  if (!isOpen) return null;

  const player = playerStats[0] || {
    kills: targetCount,
    deaths: 0,
    score: score,
    highestStreak: 0,
    ping: 12
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-mono select-none">
      <div className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-neutral-900 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                TABLEAU DE BORD TACTIQUE
              </h2>
              <p className="text-xs text-neutral-400">
                {mapName} • <span className="text-amber-400 font-semibold">{modeName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="text-[10px] text-neutral-400 uppercase font-bold flex items-center justify-center gap-1">
                <Target className="w-3.5 h-3.5 text-amber-400" /> Cibles
              </span>
              <p className="text-2xl font-black text-white mt-1">{targetCount}</p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="text-[10px] text-neutral-400 uppercase font-bold flex items-center justify-center gap-1">
                <Award className="w-3.5 h-3.5 text-blue-400" /> Score XP
              </span>
              <p className="text-2xl font-black text-blue-300 mt-1">{score}</p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="text-[10px] text-neutral-400 uppercase font-bold flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" /> Série Max
              </span>
              <p className="text-2xl font-black text-orange-300 mt-1">{player.highestStreak}</p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="text-[10px] text-neutral-400 uppercase font-bold">Latence</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{player.ping}ms</p>
            </div>
          </div>

          {/* Tactical Tips */}
          <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 text-xs text-neutral-300 space-y-2">
            <h4 className="font-bold text-amber-400 uppercase text-[11px]">Conseils Balistiques :</h4>
            <ul className="list-disc list-inside space-y-1 text-neutral-400">
              <li>Visez la pastille jaune sur la tête des cibles pour un tir à la tête critique (+150 XP).</li>
              <li>Activez le viseur ADS (Clic Droit) pour éliminer toute dispersion de balle.</li>
              <li>Atteignez 3, 5, 7 ou 10 éliminations consécutives pour débloquer le Drone UAV, la Frappe d'Artillerie, l'Hélico et la Bombe Nucléaire.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-900 border-t border-neutral-800 flex justify-between items-center text-xs text-neutral-400">
          <span>Appuyez sur [TAB] pour fermer</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black cursor-pointer transition-all"
          >
            Reprendre le Tir
          </button>
        </div>
      </div>
    </div>
  );
};
