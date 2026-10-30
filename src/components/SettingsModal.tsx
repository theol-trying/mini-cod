import React from 'react';
import { GameSettings } from '../types/game';
import { Settings, Volume2, Sliders, Keyboard, X } from 'lucide-react';
import { sounds } from '../audio/soundManager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) => {
  if (!isOpen) return null;

  const handleVolumeChange = (vol: number) => {
    onUpdateSettings({ ...settings, masterVolume: vol });
    sounds.setVolume(vol);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-mono select-none">
      <div className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-neutral-900 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-amber-400" />
            <h2 className="text-lg font-black text-white uppercase tracking-wider">PARAMÈTRES DU JEU</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6">
          {/* Sliders */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4" /> Sensibilité & Affichage
            </h3>

            {/* Mouse Sensitivity */}
            <div>
              <div className="flex justify-between text-xs text-neutral-300 mb-1">
                <span>Sensibilité de la souris</span>
                <span className="font-bold text-white">{settings.mouseSensitivity.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="4.0"
                step="0.1"
                value={settings.mouseSensitivity}
                onChange={(e) => onUpdateSettings({ ...settings, mouseSensitivity: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Field of View */}
            <div>
              <div className="flex justify-between text-xs text-neutral-300 mb-1">
                <span>Champ de vision (FOV)</span>
                <span className="font-bold text-white">{settings.fov}°</span>
              </div>
              <input
                type="range"
                min="70"
                max="105"
                step="1"
                value={settings.fov}
                onChange={(e) => onUpdateSettings({ ...settings, fov: parseInt(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Volume */}
            <div>
              <div className="flex justify-between text-xs text-neutral-300 mb-1">
                <span>Volume Audio Général</span>
                <span className="font-bold text-white">{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.masterVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Keybindings Reference */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Keyboard className="w-4 h-4" /> Commandes Clavier & Souris
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300">
              <div className="flex justify-between p-2 rounded bg-neutral-900/60 border border-neutral-850">
                <span className="text-neutral-400">Avancer :</span>
                <span className="font-bold text-amber-300">Z ou W</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-neutral-900/60 border border-neutral-850">
                <span className="text-neutral-400">Reculer :</span>
                <span className="font-bold text-amber-300">S</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-neutral-900/60 border border-neutral-850">
                <span className="text-neutral-400">Gauche / Droite :</span>
                <span className="font-bold text-amber-300">Q / D ou A / D</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-neutral-900/60 border border-neutral-850">
                <span className="text-neutral-400">Tir Principal :</span>
                <span className="font-bold text-white">Clic Gauche</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-neutral-900/60 border border-neutral-850">
                <span className="text-neutral-400">Visée ADS :</span>
                <span className="font-bold text-white">Clic Droit</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-neutral-900/60 border border-neutral-850">
                <span className="text-neutral-400">Recharger :</span>
                <span className="font-bold text-white">[R]</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-neutral-900/60 border border-neutral-850">
                <span className="text-neutral-400">Sprint Rapide :</span>
                <span className="font-bold text-white">Shift</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-neutral-900/60 border border-neutral-850">
                <span className="text-neutral-400">Sauter :</span>
                <span className="font-bold text-white">Espace</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-neutral-900/60 border border-neutral-850">
                <span className="text-neutral-400">S'accroupir :</span>
                <span className="font-bold text-amber-300">[C] ou Ctrl</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-neutral-900/60 border border-neutral-850">
                <span className="text-neutral-400">Glissade Tactique :</span>
                <span className="font-bold text-amber-300">[C] pendant Sprint</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-neutral-900/60 border border-neutral-850">
                <span className="text-neutral-400">Coup de Couteau :</span>
                <span className="font-bold text-white">[V] ou [F]</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-neutral-900/60 border border-neutral-850">
                <span className="text-neutral-400">Grenade Frag :</span>
                <span className="font-bold text-white">[G]</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-neutral-900/60 border border-neutral-850">
                <span className="text-neutral-400">Séries Killstreaks :</span>
                <span className="font-bold text-white">[3], [4], [5], [6]</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-900 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs cursor-pointer transition-all"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};
