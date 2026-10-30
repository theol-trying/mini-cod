import React, { useState } from 'react';
import { MatchFormat, MapId, RoomState, Team } from '../types/game';
import { MAPS } from '../game/maps/mapData';
import { Users, Shield, Zap, Copy, Check, Play, UserCheck, ArrowRight, X } from 'lucide-react';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomState: RoomState | null;
  isHost: boolean;
  localPlayerName: string;
  onUpdatePlayerName: (name: string) => void;
  onCreateRoom: (format: MatchFormat, mapId: MapId) => void;
  onJoinRoom: (code: string) => void;
  onStartMatch: () => void;
  onToggleReady: (ready: boolean) => void;
  onSelectTeam: (team: Team) => void;
}

export const RoomModal: React.FC<RoomModalProps> = ({
  isOpen,
  onClose,
  roomState,
  isHost,
  localPlayerName,
  onUpdatePlayerName,
  onCreateRoom,
  onJoinRoom,
  onStartMatch,
  onToggleReady,
  onSelectTeam
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [inputCode, setInputCode] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<MatchFormat>('teams');
  const [selectedMap, setSelectedMap] = useState<MapId>('nuketown');
  const [copied, setCopied] = useState(false);
  const [isReady, setIsReady] = useState(true);

  if (!isOpen) return null;

  const copyRoomCode = () => {
    if (!roomState) return;
    navigator.clipboard.writeText(roomState.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = () => {
    onCreateRoom(selectedFormat, selectedMap);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim().length >= 3) {
      onJoinRoom(inputCode.trim());
    }
  };

  const toggleReady = () => {
    const next = !isReady;
    setIsReady(next);
    onToggleReady(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 font-mono select-none">
      <div className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-neutral-900 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                {roomState ? 'SALON D\'ATTENTE MULTIJOUEUR' : 'SALON MULTIJOUEUR (CODE PRIVÉ)'}
              </h2>
              <p className="text-xs text-neutral-400">
                P2P WebRTC Direct • Zéro lag serveur • Gratuit via Cloudflare
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

        {/* Pseudo Name Config */}
        <div className="px-6 py-3 bg-neutral-900/60 border-b border-neutral-850 flex items-center justify-between gap-4">
          <span className="text-xs text-neutral-400 font-bold uppercase">Votre Pseudo :</span>
          <input
            type="text"
            value={localPlayerName}
            onChange={(e) => onUpdatePlayerName(e.target.value)}
            maxLength={16}
            className="px-3 py-1.5 rounded bg-neutral-950 border border-neutral-700 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400"
            placeholder="Opérateur"
          />
        </div>

        {/* View 1: Room Creation & Join Forms (When not yet inside a room) */}
        {!roomState ? (
          <div className="p-6 space-y-6">
            {/* Tabs Create / Join */}
            <div className="grid grid-cols-2 rounded-xl bg-neutral-900 p-1 border border-neutral-800">
              <button
                onClick={() => setTab('create')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  tab === 'create' ? 'bg-amber-500 text-black font-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Créer un Salon
              </button>
              <button
                onClick={() => setTab('join')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  tab === 'join' ? 'bg-amber-500 text-black font-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Rejoindre avec un Code
              </button>
            </div>

            {tab === 'create' ? (
              <div className="space-y-5">
                {/* Format choice: Teams vs FFA */}
                <div>
                  <label className="text-xs text-amber-400 font-bold uppercase tracking-wider block mb-2">
                    Format de la Partie
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedFormat('teams')}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                        selectedFormat === 'teams'
                          ? 'bg-blue-500/20 border-blue-400 text-white shadow-lg shadow-blue-500/10'
                          : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-black text-sm">
                        <Shield className="w-4 h-4 text-blue-400" />
                        <span>FACE À FACE EN ÉQUIPE</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Alliés (Bleu) vs Ennemis (Rouge) avec score d'équipe combiné.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedFormat('ffa')}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                        selectedFormat === 'ffa'
                          ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                          : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-black text-sm">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span>CHACUN POUR SOI (FFA)</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Tout le monde contre tout le monde. Le meilleur tireur l'emporte.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Map choice */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-amber-400 font-bold uppercase tracking-wider block">
                      Choix de la Carte (100% Équilibrées)
                    </label>
                    <span className="text-[10px] text-emerald-400 font-bold">5 Cartes 5v5</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {(Object.keys(MAPS) as MapId[]).map((mId) => {
                      const m = MAPS[mId];
                      const isSel = selectedMap === mId;
                      return (
                        <button
                          key={mId}
                          type="button"
                          onClick={() => setSelectedMap(mId)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            isSel
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10'
                              : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                          }`}
                        >
                          <div className="font-black text-xs text-white">{m.name}</div>
                          <div className="text-[10px] text-neutral-400 mt-0.5">{m.size.width}x{m.size.depth}m • Équilibré</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleCreate}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm shadow-xl shadow-amber-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>CRÉER LE SALON DÉDIÉ</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="text-xs text-amber-400 font-bold uppercase tracking-wider block mb-2">
                    Code du Salon Privé
                  </label>
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="EX: COD-7892"
                    className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-mono font-black text-lg text-center tracking-widest focus:outline-none focus:border-amber-400"
                    autoFocus
                  />
                  <p className="text-[11px] text-neutral-500 mt-1.5 text-center">
                    Entrez le code à 4-8 caractères donné par l'hôte de la partie.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={inputCode.trim().length < 3}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black text-sm shadow-xl shadow-amber-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <span>REJOINDRE LE SALON</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        ) : (
          /* View 2: Inside Waiting Lobby */
          <div className="p-6 space-y-6">
            {/* Room Code Display Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-neutral-900 to-amber-500/15 border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">
                  CODE D'INVITATION DU SALON
                </span>
                <div className="text-3xl font-black text-white tracking-widest mt-0.5">
                  {roomState.code}
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Format : <strong className="text-amber-300">{roomState.format === 'teams' ? 'Équipe Face à Face' : 'Chacun pour Soi'}</strong> • Carte : <strong className="text-white">{MAPS[roomState.mapId]?.name}</strong>
                </p>
              </div>

              <button
                onClick={copyRoomCode}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-bold text-xs cursor-pointer transition-all border border-neutral-700"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Code Copié !' : 'Copier le Code'}</span>
              </button>
            </div>

            {/* Connected Players List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                  Combattants Connectés ({roomState.peers.length})
                </span>
                {roomState.format === 'teams' && (
                  <span className="text-[11px] text-neutral-500">
                    Cliquez sur Bleu ou Rouge pour choisir votre camp
                  </span>
                )}
              </div>

              <div className="divide-y divide-neutral-850 rounded-xl bg-neutral-900/60 border border-neutral-800 overflow-hidden">
                {roomState.peers.map((peer) => (
                  <div
                    key={peer.id}
                    className="p-3.5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          peer.team === 'allies' ? 'bg-blue-500' : 'bg-red-500'
                        }`}
                      />
                      <span className="font-bold text-white">
                        {peer.name} {peer.isHost && <span className="text-amber-400 text-[10px] ml-1">(HÔTE)</span>}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {roomState.format === 'teams' && (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectTeam('allies')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                              peer.team === 'allies'
                                ? 'bg-blue-600 text-white font-black'
                                : 'bg-neutral-800 text-neutral-400'
                            }`}
                          >
                            Bleu
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectTeam('enemies')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                              peer.team === 'enemies'
                                ? 'bg-red-600 text-white font-black'
                                : 'bg-neutral-800 text-neutral-400'
                            }`}
                          >
                            Rouge
                          </button>
                        </div>
                      )}

                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" /> Prêt
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Launch Action */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={toggleReady}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                  isReady
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                }`}
              >
                {isReady ? 'Statut : Prêt au Combat' : 'Non Prêt'}
              </button>

              {isHost ? (
                <button
                  type="button"
                  onClick={onStartMatch}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-xl shadow-amber-500/20 cursor-pointer transition-all flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>LANCER LA PARTIE POUR TOUS</span>
                </button>
              ) : (
                <span className="text-xs text-neutral-400">
                  En attente que l'hôte lance la partie...
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
