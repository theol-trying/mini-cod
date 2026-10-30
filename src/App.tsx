import React, { useState, useEffect, useRef } from 'react';
import {
  GameMode,
  MapId,
  WeaponId,
  CamoId,
  KillfeedEntry,
  Hitmarker,
  PlayerStats,
  GameSettings,
  MatchFormat,
  RoomState,
  Team
} from './types/game';
import { MAPS } from './game/maps/mapData';
import { WEAPONS, CAMOS } from './game/weapons';
import {
  loadProgression,
  saveProgression,
  recordMatchResult,
  getXpProgress,
  getRankForLevel,
  MatchEarnedRewards
} from './game/progression';
import { GameEngine } from './game/GameEngine';
import { MultiplayerNetwork } from './network/multiplayer';
import { HUD } from './components/HUD';
import { Scoreboard } from './components/Scoreboard';
import { PostMatchModal } from './components/PostMatchModal';
import { ArmoryModal } from './components/ArmoryModal';
import { SettingsModal } from './components/SettingsModal';
import { DeployModal } from './components/DeployModal';
import { RoomModal } from './components/RoomModal';
import { sounds } from './audio/soundManager';
import {
  Play,
  Crosshair,
  Shield,
  Trophy,
  Settings,
  Cloud,
  Flame,
  Award,
  Target,
  Users,
  Volume2,
  VolumeX,
  Zap,
  Radio
} from 'lucide-react';

export default function App() {
  const [progression, setProgression] = useState(loadProgression);

  const [settings, setSettings] = useState<GameSettings>({
    mouseSensitivity: 1.8,
    fov: 82,
    masterVolume: 0.75,
    sfxVolume: 0.9,
    invertY: false,
    botDifficulty: 'regular',
    graphicsQuality: 'standard'
  });

  // Game & Lobby state
  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');
  const [selectedMap, setSelectedMap] = useState<MapId>('nuketown');
  const [selectedMode, setSelectedMode] = useState<GameMode>('shootout');
  const [matchFormat, setMatchFormat] = useState<MatchFormat>('teams');
  const [playerName, setPlayerName] = useState('Opérateur_1');

  // Modals
  const [isArmoryOpen, setIsArmoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isScoreboardOpen, setIsScoreboardOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Networking state
  const networkRef = useRef<MultiplayerNetwork | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [isNetworkHost, setIsNetworkHost] = useState(false);

  // Live in-game HUD states
  const [health, setHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [currentAmmo, setCurrentAmmo] = useState(30);
  const [reserveAmmo, setReserveAmmo] = useState(120);
  const [activeWeapon, setActiveWeapon] = useState<WeaponId>(progression.selectedPrimary);
  const [matchScore, setMatchScore] = useState(0);
  const [targetCount, setTargetCount] = useState(0);
  const [matchTime, setMatchTime] = useState(300);
  const [streak, setStreak] = useState(0);
  const [killfeed, setKillfeed] = useState<KillfeedEntry[]>([]);
  const [hitmarkers, setHitmarkers] = useState<Hitmarker[]>([]);
  const [isUavActive, setIsUavActive] = useState(false);
  const [nukeCountdown, setNukeCountdown] = useState<number | null>(null);
  const [isAiming, setIsAiming] = useState(false);
  const [playerPos, setPlayerPos] = useState({ x: 0, z: 0 });
  const [playerYaw, setPlayerYaw] = useState(0);
  const [targetPositions, setTargetPositions] = useState<Array<{ x: number; z: number; isKnockedDown?: boolean }>>([]);
  const [scoreboardPlayers, setScoreboardPlayers] = useState<PlayerStats[]>([]);
  const [pickupPrompt, setPickupPrompt] = useState<string | null>(null);
  const [weaponUpgradeBanner, setWeaponUpgradeBanner] = useState<string | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const [postMatchData, setPostMatchData] = useState<{
    victory: boolean;
    rewards: MatchEarnedRewards;
    stats: { kills: number; deaths: number; headshots: number; streak: number };
  } | null>(null);

  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        setIsScoreboardOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Initialize Network Manager
  useEffect(() => {
    const net = new MultiplayerNetwork(playerName);
    networkRef.current = net;

    net.setOnEvent((packet) => {
      if (packet.type === 'ROOM_STATE') {
        setRoomState(packet.payload);
      } else if (packet.type === 'START_MATCH') {
        setSelectedMap(packet.payload.mapId);
        setMatchFormat(packet.payload.format);
        setIsRoomModalOpen(false);
        launchGame(packet.payload.mapId, packet.payload.format);
      } else if (packet.type === 'PLAYER_STATE') {
        if (engineRef.current && packet.senderId !== net.localPeerId) {
          const peer = net.roomState?.peers.find((p) => p.id === packet.senderId);
          engineRef.current.updateRemotePeer(
            packet.senderId,
            peer?.name || 'Joueur',
            peer?.team || 'enemies',
            packet.payload.pos,
            packet.payload.rot[0]
          );
        }
      }
    });

    return () => {
      net.disconnect();
    };
  }, []);

  // Room actions
  const handleCreateRoom = async (format: MatchFormat, mapId: MapId) => {
    const randomCode = 'COD-' + Math.floor(1000 + Math.random() * 9000);
    setMatchFormat(format);
    setSelectedMap(mapId);

    if (networkRef.current) {
      networkRef.current.localPlayerName = playerName;
      await networkRef.current.createRoom(randomCode, format, mapId);
      setRoomState(networkRef.current.roomState);
      setIsNetworkHost(true);
    }
  };

  const handleJoinRoom = async (code: string) => {
    if (networkRef.current) {
      networkRef.current.localPlayerName = playerName;
      await networkRef.current.joinRoom(code);
      setRoomState(networkRef.current.roomState);
      setIsNetworkHost(false);
    }
  };

  const handleStartRoomMatch = () => {
    if (networkRef.current && isNetworkHost && roomState) {
      networkRef.current.startGame();
      setIsRoomModalOpen(false);
      launchGame(roomState.mapId, roomState.format);
    }
  };

  const launchGame = (mapId: MapId, format: MatchFormat) => {
    sounds.playClick();
    setGameState('playing');
    setPostMatchData(null);
    setIsScoreboardOpen(false);

    setTimeout(() => {
      if (!canvasMountRef.current) return;

      if (engineRef.current) {
        engineRef.current.dispose();
      }

      const engine = new GameEngine(
        canvasMountRef.current,
        mapId,
        selectedMode,
        progression.selectedPrimary,
        progression.selectedSecondary,
        progression.selectedCamo,
        {
          onHealthChange: (hp, maxHp) => {
            setHealth(hp);
            setMaxHealth(maxHp);
          },
          onAmmoChange: (mag, res) => {
            setCurrentAmmo(mag);
            setReserveAmmo(res);
          },
          onWeaponChange: (w) => {
            setActiveWeapon(w);
          },
          onKillfeed: (entry) => {
            setKillfeed((prev) => [...prev.slice(-8), entry]);
          },
          onHitmarker: (hit) => {
            setHitmarkers((prev) => [...prev.slice(-3), hit]);
          },
          onScoreChange: (count, _total) => {
            setTargetCount(count);
          },
          onStreakChange: (s) => {
            setStreak(s);
          },
          onPlayerStatsChange: (stats) => {
            setScoreboardPlayers(stats);
            const p = engineRef.current;
            if (p) {
              setPlayerPos({ x: p.playerPos.x, z: p.playerPos.z });
              setPlayerYaw(p.yaw || 0);
              setMatchTime(p.matchTimeRemaining);
              setIsAiming(p.isAiming);
              setMatchScore(p.score);

              if (p.targetManager) {
                setTargetPositions(
                  p.targetManager.targets.map((t) => ({
                    x: t.group.position.x,
                    z: t.group.position.z,
                    isKnockedDown: t.isKnockedDown
                  }))
                );
              }

              // Send network position packet to peers
              if (networkRef.current && roomState) {
                networkRef.current.sendPlayerState({
                  pos: [p.playerPos.x, p.playerPos.y, p.playerPos.z],
                  rot: [p.yaw, p.pitch],
                  weapon: p.currentWeaponId,
                  isAiming: p.isAiming,
                  isSprinting: p.isSprinting,
                  isFiring: p.isFiring
                });
              }
            }
          },
          onMatchEnd: (victory, stats) => {
            const { updatedState, rewards } = recordMatchResult(progression, {
              kills: stats.kills,
              deaths: stats.deaths,
              headshots: stats.headshots,
              highestStreak: stats.streak,
              won: victory
            });
            setProgression(updatedState);
            setPostMatchData({ victory, rewards, stats });
          },
          onUAVScan: (active) => {
            setIsUavActive(active);
          },
          onNukeTriggered: (countdown) => {
            setNukeCountdown(countdown);
          },
          onFlagUpdate: () => {},
          onPickupPrompt: (prompt) => {
            setPickupPrompt(prompt);
          },
          onWeaponUpgrade: (bannerText) => {
            setWeaponUpgradeBanner(bannerText);
            setTimeout(() => setWeaponUpgradeBanner(null), 3000);
          }
        }
      );

      engine.mouseSensitivity = settings.mouseSensitivity * 0.0014;
      engineRef.current = engine;
    }, 50);
  };

  const handleReturnToMenu = () => {
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }
    setGameState('menu');
    setPostMatchData(null);
  };

  const handleUpdateLoadout = (primary: WeaponId, secondary: WeaponId, camo: CamoId) => {
    const nextProg = {
      ...progression,
      selectedPrimary: primary,
      selectedSecondary: secondary,
      selectedCamo: camo
    };
    setProgression(nextProg);
    saveProgression(nextProg);
  };

  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    if (engineRef.current) {
      engineRef.current.mouseSensitivity = newSettings.mouseSensitivity * 0.0014;
    }
  };

  const toggleSoundMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sounds.setMuted(next);
  };

  const currentRankInfo = getRankForLevel(progression.level);
  const xpProg = getXpProgress(progression.xp);

  return (
    <div className="relative w-full h-screen bg-neutral-950 text-white font-mono overflow-hidden select-none">
      {/* 1. MAIN MENU LOBBY */}
      {gameState === 'menu' && (
        <div className="relative w-full h-full flex flex-col justify-between p-6 md:p-8 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 overflow-y-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                <Crosshair className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-white tracking-widest uppercase flex items-center gap-2">
                  MINI OPS <span className="text-amber-400 text-xs px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">RETRO COD MULTIPLAYER</span>
                </h1>
                <p className="text-[11px] text-neutral-400">
                  Salons privés avec code • Équipe ou FFA • WebRTC gratuit via Cloudflare
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleSoundMute}
                className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 cursor-pointer"
                title={isMuted ? 'Activer le son' : 'Couper le son'}
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-bold cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Paramètres</span>
              </button>
              <button
                onClick={() => setIsDeployOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/40 text-orange-300 text-xs font-black cursor-pointer shadow-sm"
              >
                <Cloud className="w-4 h-4" />
                <span>Cloudflare Pages</span>
              </button>
            </div>
          </div>

          {/* Central Grid */}
          <div className="my-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Multiplayer Salons Banner (Highlight) */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-neutral-900 to-blue-500/20 border-2 border-amber-400/60 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-amber-300 font-black uppercase tracking-wider">
                      SALONS MULTIJOUEUR EN LIGNE
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-1">
                    Rejoindre ou Créer une Partie avec un Code
                  </h3>
                  <p className="text-xs text-neutral-300 mt-1 max-w-lg">
                    Jouez en face-à-face par équipe (Bleu vs Rouge) ou en Chacun pour Soi (FFA) avec vos amis sans aucun lag serveur.
                  </p>
                </div>

                <button
                  onClick={() => setIsRoomModalOpen(true)}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-lg shadow-amber-500/20 cursor-pointer transition-all flex items-center gap-2 shrink-0"
                >
                  <Users className="w-4 h-4" />
                  <span>OUVRIR LES SALONS</span>
                </button>
              </div>

              {/* Match Format Selection (Teams vs FFA) */}
              <div>
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Flame className="w-4 h-4" /> FORMAT DU MATCH
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMatchFormat('teams')}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      matchFormat === 'teams'
                        ? 'bg-blue-600/20 border-blue-400 text-white shadow-lg shadow-blue-500/10'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-sm text-white">
                      <Shield className="w-4 h-4 text-blue-400" />
                      <span>MATCH EN ÉQUIPE (FACE À FACE)</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Équipe Alliés Bleue contre Équipe Ennemis Rouge.
                    </p>
                  </button>

                  <button
                    onClick={() => setMatchFormat('ffa')}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      matchFormat === 'ffa'
                        ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-sm text-white">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>CHACUN POUR SOI (FFA)</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Tous les tireurs s'affrontent. Le meilleur remporte la manche.
                    </p>
                  </button>
                </div>
              </div>

              {/* Map Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-4 h-4" /> 5 CARTES TACTIQUES ÉQUILIBRÉES (5v5)
                  </span>
                  <span className="text-[10px] font-black text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                    SYMÉTRIE PARFAITE
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(Object.keys(MAPS) as MapId[]).map((mId) => {
                    const m = MAPS[mId];
                    const isSelected = selectedMap === mId;
                    return (
                      <div
                        key={mId}
                        onClick={() => setSelectedMap(mId)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10'
                            : 'bg-neutral-900/70 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-white">{m.name}</h3>
                            {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />}
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">{m.subtitle}</p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-neutral-800 flex items-center justify-between text-[10px]">
                          <span className="text-neutral-400 font-mono">
                            {m.size.width}m × {m.size.depth}m
                          </span>
                          <span className="text-amber-400/90 font-bold uppercase tracking-tight">
                            Armes au sol
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Armory & Upgrade Info */}
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold">
                    Arme Active + Upgrade Automatique aux Kills
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm font-black text-white">
                      {WEAPONS[progression.selectedPrimary]?.name}
                    </span>
                    <span className="text-xs text-neutral-500">+</span>
                    <span className="text-sm font-black text-neutral-300">
                      {WEAPONS[progression.selectedSecondary]?.name}
                    </span>
                    <span className="text-xs text-amber-400 font-bold px-2 py-0.5 rounded bg-neutral-800">
                      {CAMOS[progression.selectedCamo]?.name}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsArmoryOpen(true)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-black cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Armurerie & Camouflages</span>
                </button>
              </div>
            </div>

            {/* Right Col: Military Progression */}
            <div className="p-5 rounded-xl bg-neutral-900/70 border border-neutral-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4" /> DOSSIER OPÉRATEUR
                  </span>
                  <span className="text-xs font-black text-neutral-400">NIVEAU {progression.level}</span>
                </div>

                <div className="my-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase">{currentRankInfo.title}</h3>
                    <p className="text-xs text-amber-400 font-semibold">{progression.xp} XP Accumulée</p>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-neutral-400 text-[11px]">
                    <span>Prochain Grade</span>
                    <span>{xpProg.progressPercent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 transition-all duration-300"
                      style={{ width: `${xpProg.progressPercent}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-right text-neutral-500">
                    {xpProg.curXp} / {xpProg.nextXp} XP
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-5 text-center">
                  <div className="p-2 rounded bg-neutral-950/60 border border-neutral-850">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold">Kills Totaux</span>
                    <p className="text-lg font-black text-white">{progression.totalKills}</p>
                  </div>
                  <div className="p-2 rounded bg-neutral-950/60 border border-neutral-850">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold">Victoires</span>
                    <p className="text-lg font-black text-amber-400">{progression.totalWins}</p>
                  </div>
                  <div className="p-2 rounded bg-neutral-950/60 border border-neutral-850">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold">Tirs Tête</span>
                    <p className="text-lg font-black text-red-400">{progression.headshots}</p>
                  </div>
                  <div className="p-2 rounded bg-neutral-950/60 border border-neutral-850">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold">Armes Débloquées</span>
                    <p className="text-lg font-black text-blue-400">{progression.unlockedWeapons.length} / 6</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800 text-[11px] text-neutral-400 flex justify-between">
                <span>Contrôles :</span>
                <span className="text-white font-bold">Z, Q, S, D ou W, A, S, D • [E] Ramasser</span>
              </div>
            </div>
          </div>

          {/* Launch Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-800">
            <div className="text-xs text-neutral-400">
              Prêt pour l'engagement : <strong className="text-white">{MAPS[selectedMap].name}</strong> •{' '}
              <span className="text-amber-400 font-bold">
                {matchFormat === 'teams' ? 'ÉQUIPE (FACE À FACE)' : 'CHACUN POUR SOI'}
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setIsRoomModalOpen(true)}
                className="flex-1 sm:flex-none px-6 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-black text-xs cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4 text-amber-400" />
                <span>Salons & Codes Privés</span>
              </button>

              <button
                onClick={() => launchGame(selectedMap, matchFormat)}
                className="flex-1 sm:flex-none px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-black text-base shadow-xl shadow-amber-500/25 flex items-center justify-center gap-3 cursor-pointer transition-all"
              >
                <Play className="w-5 h-5 fill-black" />
                <span>LANCER LA PARTIE IMMÉDIATE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ACTIVE 3D GAMEPLAY VIEW */}
      {gameState === 'playing' && (
        <div className="relative w-full h-full">
          <div
            ref={canvasMountRef}
            className="w-full h-full cursor-crosshair"
            onClick={() => engineRef.current?.requestPointerLock()}
          />

          <HUD
            health={health}
            maxHealth={maxHealth}
            currentAmmo={currentAmmo}
            reserveAmmo={reserveAmmo}
            weaponId={activeWeapon}
            score={matchScore}
            targetCount={targetCount}
            matchTime={matchTime}
            streak={streak}
            killfeed={killfeed}
            hitmarkers={hitmarkers}
            isUavActive={isUavActive}
            nukeCountdown={nukeCountdown}
            isAiming={isAiming}
            playerPos={playerPos}
            playerYaw={playerYaw}
            targetPositions={targetPositions}
            pickupPrompt={pickupPrompt}
            weaponUpgradeBanner={weaponUpgradeBanner}
            matchFormat={matchFormat}
            onFireTouch={(down) => engineRef.current?.touchFire(down)}
            onAdsTouch={() => engineRef.current?.touchAdsToggle()}
            onJumpTouch={() => engineRef.current?.touchJump()}
            onReloadTouch={() => engineRef.current?.touchReload()}
            onGrenadeTouch={() => engineRef.current?.touchGrenade()}
            onSwitchTouch={() => engineRef.current?.switchWeapon()}
            onPickupTouch={() => engineRef.current?.tryTakeNearbyPickup()}
            onStreakTouch={(id) => engineRef.current?.activateKillstreak(id as any)}
            isTouchDevice={isTouchDevice}
          />

          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setIsScoreboardOpen((p) => !p)}
              className="px-2.5 py-1 rounded bg-black/60 hover:bg-black/80 border border-neutral-700 text-[11px] text-neutral-300 font-bold backdrop-blur cursor-pointer shadow"
            >
              [TAB] Tableau des Scores
            </button>
            <button
              onClick={handleReturnToMenu}
              className="px-2.5 py-1 rounded bg-red-950/60 hover:bg-red-900 border border-red-700/60 text-[11px] text-red-300 font-bold backdrop-blur cursor-pointer shadow"
            >
              Quitter
            </button>
          </div>
        </div>
      )}

      {/* 3. MODALS */}
      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        roomState={roomState}
        isHost={isNetworkHost}
        localPlayerName={playerName}
        onUpdatePlayerName={setPlayerName}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onStartMatch={handleStartRoomMatch}
        onToggleReady={(ready) => networkRef.current?.setReady(ready)}
        onSelectTeam={(team) => networkRef.current?.setTeam(team)}
      />

      <Scoreboard
        isOpen={isScoreboardOpen}
        onClose={() => setIsScoreboardOpen(false)}
        playerStats={scoreboardPlayers}
        score={matchScore}
        targetCount={targetCount}
        mapName={MAPS[selectedMap]?.name || 'Nuketown'}
        modeName={matchFormat === 'teams' ? 'ÉQUIPE FACE À FACE' : 'CHACUN POUR SOI'}
      />

      {postMatchData && (
        <PostMatchModal
          victory={postMatchData.victory}
          rewards={postMatchData.rewards}
          currentXp={progression.xp}
          stats={postMatchData.stats}
          onPlayAgain={() => launchGame(selectedMap, matchFormat)}
          onReturnToMenu={handleReturnToMenu}
        />
      )}

      <ArmoryModal
        isOpen={isArmoryOpen}
        onClose={() => setIsArmoryOpen(false)}
        progression={progression}
        onUpdateLoadout={handleUpdateLoadout}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      <DeployModal
        isOpen={isDeployOpen}
        onClose={() => setIsDeployOpen(false)}
      />
    </div>
  );
}
