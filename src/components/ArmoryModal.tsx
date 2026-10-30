import React, { useState } from 'react';
import { ProgressionState, WeaponId, CamoId } from '../types/game';
import { WEAPONS, CAMOS } from '../game/weapons';
import { RANKS, getRankForLevel } from '../game/progression';
import { Shield, Lock, Check, Zap, Target, Award, Sparkles, X } from 'lucide-react';

interface ArmoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  progression: ProgressionState;
  onUpdateLoadout: (primary: WeaponId, secondary: WeaponId, camo: CamoId) => void;
}

export const ArmoryModal: React.FC<ArmoryModalProps> = ({
  isOpen,
  onClose,
  progression,
  onUpdateLoadout
}) => {
  const [activeTab, setActiveTab] = useState<'weapons' | 'camos' | 'ranks'>('weapons');
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponId>(progression.selectedPrimary);
  const [selectedSecondary, setSelectedSecondary] = useState<WeaponId>(progression.selectedSecondary);
  const [selectedCamo, setSelectedCamo] = useState<CamoId>(progression.selectedCamo);

  if (!isOpen) return null;

  const handleEquipWeapon = (wId: WeaponId) => {
    const w = WEAPONS[wId];
    if (w.category === 'pistol' || w.category === 'melee') {
      setSelectedSecondary(wId);
      onUpdateLoadout(selectedWeapon, wId, selectedCamo);
    } else {
      setSelectedWeapon(wId);
      onUpdateLoadout(wId, selectedSecondary, selectedCamo);
    }
  };

  const handleEquipCamo = (cId: CamoId) => {
    setSelectedCamo(cId);
    onUpdateLoadout(selectedWeapon, selectedSecondary, cId);
  };

  const inspectedWeapon = WEAPONS[selectedWeapon];
  const inspectedCamo = CAMOS[selectedCamo];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-mono select-none">
      <div className="w-full max-w-4xl max-h-[90vh] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-neutral-900 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">ARMURERIE & PROGRESSION TACTIQUE</h2>
              <p className="text-xs text-neutral-400">
                Grade : <span className="text-amber-400 font-bold">{getRankForLevel(progression.level).title} (Niv. {progression.level})</span> • {progression.xp} XP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tabs */}
            <div className="flex rounded-lg bg-neutral-950 p-1 border border-neutral-800">
              <button
                onClick={() => setActiveTab('weapons')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'weapons' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Armes
              </button>
              <button
                onClick={() => setActiveTab('camos')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'camos' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Camouflages
              </button>
              <button
                onClick={() => setActiveTab('ranks')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'ranks' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Grades (1-20)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Weapons Arsenal */}
        {activeTab === 'weapons' && (
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Weapon List */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(WEAPONS) as WeaponId[]).map((wId) => {
                const w = WEAPONS[wId];
                const isUnlocked = progression.unlockedWeapons.includes(wId) || progression.level >= w.unlockLevel;
                const isEquippedPrimary = selectedWeapon === wId;
                const isEquippedSecondary = selectedSecondary === wId;

                return (
                  <div
                    key={wId}
                    onClick={() => isUnlocked && handleEquipWeapon(wId)}
                    className={`relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      !isUnlocked
                        ? 'bg-neutral-900/40 border-neutral-800/80 opacity-60 cursor-not-allowed'
                        : isEquippedPrimary || isEquippedSecondary
                        ? 'bg-amber-500/10 border-amber-400 shadow-lg shadow-amber-500/10'
                        : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                          {w.category.toUpperCase()}
                        </span>
                        {!isUnlocked ? (
                          <div className="flex items-center gap-1 text-[10px] text-red-400 font-bold">
                            <Lock className="w-3 h-3" /> Niv. {w.unlockLevel}
                          </div>
                        ) : isEquippedPrimary ? (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-black">
                            ÉQUIPÉE PRINCIPALE
                          </span>
                        ) : isEquippedSecondary ? (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-400 text-black">
                            ÉQUIPÉE SECONDAIRE
                          </span>
                        ) : null}
                      </div>

                      <h3 className="text-base font-black text-white">{w.name}</h3>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1">{w.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-300 pt-3 mt-3 border-t border-neutral-800">
                      <span>Dégâts : <strong className="text-white">{w.damage * (w.pellets || 1)}</strong></span>
                      <span>Chargeur : <strong className="text-white">{w.magazineSize}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Weapon Detail Card */}
            <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  STATISTIQUES BALISTIQUES
                </span>
                <h3 className="text-xl font-black text-white mt-1">{inspectedWeapon.name}</h3>
                <p className="text-xs text-neutral-400 mt-2">{inspectedWeapon.description}</p>

                {/* Progress bars */}
                <div className="space-y-3 mt-6 text-xs">
                  <div>
                    <div className="flex justify-between text-neutral-400 mb-1">
                      <span>Dégâts</span>
                      <span className="font-bold text-white">{inspectedWeapon.damage}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${Math.min(100, inspectedWeapon.damage * 0.9)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-400 mb-1">
                      <span>Cadence de tir</span>
                      <span className="font-bold text-white">
                        {Math.round(60000 / inspectedWeapon.fireDelayMs)} RPM
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${Math.min(100, (60000 / inspectedWeapon.fireDelayMs) / 9)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-400 mb-1">
                      <span>Contrôle du recul</span>
                      <span className="font-bold text-white">{inspectedWeapon.recoilRecovery * 6}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, inspectedWeapon.recoilRecovery * 6)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-400 mb-1">
                      <span>Précision au jugé</span>
                      <span className="font-bold text-white">
                        {Math.round((1 - inspectedWeapon.spreadHip * 5) * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(100, (1 - inspectedWeapon.spreadHip * 5) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800">
                <span className="text-[11px] text-neutral-400">
                  Déblocage : {inspectedWeapon.unlockLevel === 1 ? 'Disponible dès le départ' : `Niveau ${inspectedWeapon.unlockLevel}`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Weapon Camos */}
        {activeTab === 'camos' && (
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {(Object.keys(CAMOS) as CamoId[]).map((cId) => {
              const camo = CAMOS[cId];
              const isUnlocked = progression.unlockedCamos.includes(cId) || progression.totalKills >= camo.unlockKills;
              const isEquipped = selectedCamo === cId;

              return (
                <div
                  key={cId}
                  onClick={() => isUnlocked && handleEquipCamo(cId)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    !isUnlocked
                      ? 'bg-neutral-900/40 border-neutral-800/80 opacity-60 cursor-not-allowed'
                      : isEquipped
                      ? 'bg-amber-500/10 border-amber-400 shadow-lg shadow-amber-500/10'
                      : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div>
                    {/* Visual Color Preview Swatch */}
                    <div
                      className="w-full h-24 rounded-lg mb-3 shadow-inner flex items-center justify-center border border-white/10"
                      style={{
                        background: `linear-gradient(135deg, ${camo.primaryColor} 0%, ${camo.accentColor} 100%)`
                      }}
                    >
                      {cId === 'gold' && <Sparkles className="w-8 h-8 text-black/50" />}
                    </div>

                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-black text-white">{camo.name}</h4>
                      {isEquipped && <Check className="w-4 h-4 text-amber-400" />}
                    </div>

                    <p className="text-xs text-neutral-400 mt-1">
                      Condition : <strong className="text-neutral-200">{camo.unlockRequirement}</strong>
                    </p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-neutral-800 flex justify-between text-xs">
                    <span className="text-neutral-400">Progression</span>
                    <span className="font-bold text-amber-400">
                      {Math.min(camo.unlockKills, progression.totalKills)} / {camo.unlockKills} kills
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: 20 Military Ranks Progression */}
        {activeTab === 'ranks' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {RANKS.map((rank) => {
                const isReached = progression.level >= rank.level;
                const isCurrent = progression.level === rank.level;

                return (
                  <div
                    key={rank.level}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                      isCurrent
                        ? 'bg-amber-500/20 border-amber-400 shadow-md shadow-amber-500/20'
                        : isReached
                        ? 'bg-neutral-900/90 border-neutral-700'
                        : 'bg-neutral-950/60 border-neutral-900 opacity-50'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs ${
                        isCurrent
                          ? 'bg-amber-400 text-black font-black'
                          : isReached
                          ? 'bg-neutral-800 text-amber-300'
                          : 'bg-neutral-900 text-neutral-600'
                      }`}
                    >
                      {rank.level}
                    </div>

                    <div className="truncate">
                      <h4 className={`text-xs font-black truncate ${isCurrent ? 'text-amber-300' : 'text-white'}`}>
                        {rank.title}
                      </h4>
                      <p className="text-[10px] text-neutral-400">{rank.xpRequired} XP Requis</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <span>Kills totaux : {progression.totalKills} • Victoires : {progression.totalWins}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black cursor-pointer transition-all"
          >
            Confirmer l'Armement
          </button>
        </div>
      </div>
    </div>
  );
};
