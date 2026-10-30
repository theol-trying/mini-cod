import * as THREE from 'three';
import {
  GameMode,
  MapId,
  Team,
  WeaponId,
  CamoId,
  KillstreakId,
  KillfeedEntry,
  DominationFlag,
  PlayerStats,
  Hitmarker
} from '../types/game';
import { MAPS, MapConfig } from './maps/mapData';
import { buildMap3D } from './maps/mapBuilder';
import { ViewModel } from './viewmodel';
import { EffectsManager } from './effects';
import { TargetManager } from './targets';
import { PickupManager } from './pickups';
import { WEAPONS, KILLSTREAKS, getWeaponForKills } from './weapons';
import { sounds } from '../audio/soundManager';

const _moveDir = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _rayDir = new THREE.Vector3();

export interface GameEngineCallbacks {
  onHealthChange: (hp: number, maxHp: number) => void;
  onAmmoChange: (mag: number, reserve: number) => void;
  onWeaponChange: (weapon: WeaponId) => void;
  onKillfeed: (entry: KillfeedEntry) => void;
  onHitmarker: (hit: Hitmarker) => void;
  onScoreChange: (score: number, targetCount: number) => void;
  onStreakChange: (streak: number) => void;
  onPlayerStatsChange: (stats: PlayerStats[]) => void;
  onMatchEnd: (victory: boolean, stats: { kills: number; deaths: number; headshots: number; streak: number }) => void;
  onUAVScan: (active: boolean) => void;
  onNukeTriggered: (countdown: number) => void;
  onFlagUpdate: (flags: DominationFlag[]) => void;
  onPickupPrompt: (prompt: string | null) => void;
  onWeaponUpgrade: (weaponName: string) => void;
  onRemoteFire?: (origin: [number, number, number], dir: [number, number, number], weapon: WeaponId) => void;
  onPlayerDamage?: (targetId: string, damage: number, isHeadshot: boolean, weapon: WeaponId) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock!: THREE.Clock;
  private frameId: number = 0;
  private isRunning: boolean = false;
  private isSoftwareGl: boolean = false;

  // Game config
  public mapId: MapId;
  public mode: GameMode;
  public mapConfig: MapConfig;

  // Subsystems
  private viewModel!: ViewModel;
  private effects!: EffectsManager;
  public targetManager!: TargetManager;
  public pickupManager!: PickupManager;
  private raycaster = new THREE.Raycaster();

  // Remote Players 3D Meshes (WebRTC P2P)
  private remotePlayerMeshes = new Map<string, THREE.Group>();

  // Player state
  public playerHealth = 100;
  public maxHealth = 100;
  public playerTeam: Team = 'allies';
  public currentWeaponId: WeaponId = 'm4a1';
  public secondaryWeaponId: WeaponId = 'deagle';
  public currentCamoId: CamoId = 'standard';
  public currentAmmo = 30;
  public reserveAmmo = 120;
  public grenadeCount = 3;
  public isDead = false;
  public respawnTimer = 0;

  // Player match stats
  public kills = 0;
  public deaths = 0;
  public assists = 0;
  public headshots = 0;
  public currentStreak = 0;
  public highestStreak = 0;
  public score = 0;

  // Match state
  public matchScore = 0;
  public targetEliminations = 0;
  public matchTimeRemaining = 300;
  public isMatchOver = false;

  // Killstreaks active
  public isUavActive = false;
  private uavTimer = 0;
  public chopperActive = false;
  private chopperTimer = 0;
  private chopperMesh: THREE.Group | null = null;
  public nukeActive = false;
  public nukeCountdown = 10;

  // Gun Game tiers
  private readonly gunGameOrder: WeaponId[] = ['deagle', 'shotgun', 'mp5', 'm4a1', 'sniper', 'knife'];
  private gunGameTier = 0;

  // Movement & physics (Strictly level FPS without roll)
  public playerPos = new THREE.Vector3(0, 1.7, 0);
  private playerVel = new THREE.Vector3();
  public pitch = 0;
  public yaw = 0;
  public isGrounded = true;
  public isAiming = false;
  public isSprinting = false;
  public isCrouching = false;
  public isSliding = false;
  private slideTimer = 0;
  private readonly slideDuration = 0.85;
  private slideVelocity = new THREE.Vector3();
  private currentEyeHeight = 1.7;
  private keys: Record<string, boolean> = {};
  public isPointerLocked = false;
  public mouseSensitivity = 0.0022;
  public isFiring = false;
  private fireTimer = 0;
  private reloadTimer = 0;

  // Touch controls
  private touchMoveX = 0;
  private touchMoveY = 0;

  constructor(
    container: HTMLElement,
    mapId: MapId,
    mode: GameMode,
    primaryWeapon: WeaponId,
    secondaryWeapon: WeaponId,
    camo: CamoId,
    callbacks: GameEngineCallbacks
  ) {
    this.container = container;
    this.mapId = mapId;
    this.mode = mode;
    this.mapConfig = MAPS[mapId];
    this.currentWeaponId = mode === 'gun_game' ? this.gunGameOrder[0] : primaryWeapon;
    this.secondaryWeaponId = secondaryWeapon;
    this.currentCamoId = camo;
    this.callbacks = callbacks;

    const wDef = WEAPONS[this.currentWeaponId];
    this.currentAmmo = wDef.magazineSize;
    this.reserveAmmo = wDef.reserveAmmo;

    this.initThree();
    this.initMapAndSystems();
    this.initControls();
    this.spawnPlayer();

    this.startLoop();
  }

  private initThree() {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      this.isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } else {
      this.isSoftwareGl = true;
    }

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      80,
      this.container.clientWidth / this.container.clientHeight,
      0.08,
      160
    );
    this.camera.rotation.order = 'YXZ';
    this.camera.position.copy(this.playerPos);
    this.scene.add(this.camera);

    this.clock = new THREE.Clock();
  }

  private initMapAndSystems() {
    buildMap3D(this.scene, this.mapConfig);
    this.effects = new EffectsManager(this.scene);

    this.viewModel = new ViewModel();
    this.viewModel.rebuildWeapon(this.currentWeaponId, this.currentCamoId);
    this.camera.add(this.viewModel.root);

    this.targetManager = new TargetManager(this.scene, this.mapId, this.effects);
    this.pickupManager = new PickupManager(this.scene, this.mapConfig.weaponPickups);
  }

  private initControls() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onResize = () => {
    if (!this.container || !this.renderer) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public requestPointerLock() {
    if (this.renderer.domElement.requestPointerLock) {
      this.renderer.domElement.requestPointerLock();
    }
  }

  private onMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement !== this.renderer.domElement) {
      this.isPointerLocked = false;
      return;
    }
    this.isPointerLocked = true;

    if (this.isDead || this.isMatchOver) return;

    const adsFactor = this.isAiming ? 0.6 : 1.0;
    this.yaw -= e.movementX * this.mouseSensitivity * adsFactor;
    this.pitch -= e.movementY * this.mouseSensitivity * adsFactor;
    this.pitch = Math.max(-Math.PI / 2 + 0.04, Math.min(Math.PI / 2 - 0.04, this.pitch));
  };

  private isKeyActive(code: string, char: string): boolean {
    return !!(this.keys[code] || this.keys[char] || this.keys[char.toUpperCase()]);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;
    this.keys[e.key.toLowerCase()] = true;

    if (this.isDead || this.isMatchOver) return;

    if (e.code === 'KeyE' || e.key.toLowerCase() === 'e') {
      this.tryTakeNearbyPickup();
    } else if (e.code === 'KeyR' || e.key.toLowerCase() === 'r') {
      this.reloadWeapon();
    } else if (e.code === 'KeyC' || e.key.toLowerCase() === 'c' || e.code === 'ControlLeft') {
      this.handleCrouchOrSlide();
    } else if (e.code === 'KeyQ' || e.key.toLowerCase() === 'q') {
      if (!this.keys['KeyA']) {
        this.switchWeapon();
      }
    } else if (e.code === 'Digit1') {
      this.equipWeapon(this.mode === 'gun_game' ? this.gunGameOrder[this.gunGameTier] : 'm4a1');
    } else if (e.code === 'Digit2') {
      this.equipWeapon(this.secondaryWeaponId);
    } else if (e.code === 'KeyV' || e.code === 'KeyF') {
      this.performMelee();
    } else if (e.code === 'KeyG') {
      this.throwGrenade();
    } else if (e.code === 'Digit3') {
      this.activateKillstreak('uav');
    } else if (e.code === 'Digit4') {
      this.activateKillstreak('airstrike');
    } else if (e.code === 'Digit5') {
      this.activateKillstreak('chopper');
    } else if (e.code === 'Digit6') {
      this.activateKillstreak('nuke');
    }
  };

  public handleCrouchOrSlide() {
    if (this.isDead || this.isMatchOver) return;

    if (this.isSliding) {
      // Cancel slide directly into crouch
      this.isSliding = false;
      this.isCrouching = true;
    } else if (this.isSprinting && this.isGrounded) {
      // Tactical slide in current sprint direction!
      this.isSliding = true;
      this.isCrouching = true;
      this.slideTimer = this.slideDuration;
      _forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
      this.slideVelocity.copy(_forward);
      sounds.playSlide();
    } else {
      // Toggle crouch
      this.isCrouching = !this.isCrouching;
    }
  }

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
    this.keys[e.key.toLowerCase()] = false;
  };

  private onMouseDown = (e: MouseEvent) => {
    if (document.pointerLockElement !== this.renderer.domElement) {
      this.requestPointerLock();
      return;
    }

    if (e.button === 0) {
      this.isFiring = true;
    } else if (e.button === 2) {
      this.isAiming = true;
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isFiring = false;
    } else if (e.button === 2) {
      this.isAiming = false;
    }
  };

  public setTouchMove(x: number, y: number) {
    this.touchMoveX = x;
    this.touchMoveY = y;
  }

  public setTouchLook(dx: number, dy: number) {
    const adsFactor = this.isAiming ? 0.6 : 1.0;
    this.yaw -= dx * 0.004 * adsFactor;
    this.pitch -= dy * 0.004 * adsFactor;
    this.pitch = Math.max(-Math.PI / 2 + 0.04, Math.min(Math.PI / 2 - 0.04, this.pitch));
  }

  public touchFire(down: boolean) {
    this.isFiring = down;
  }

  public touchAdsToggle() {
    this.isAiming = !this.isAiming;
  }

  public touchJump() {
    if (this.isGrounded && !this.isDead) {
      if (this.isSliding) {
        this.isSliding = false;
      }
      this.isCrouching = false;
      this.playerVel.y = 8.5;
      this.isGrounded = false;
    }
  }

  public touchCrouchToggle() {
    this.handleCrouchOrSlide();
  }

  public touchReload() {
    this.reloadWeapon();
  }

  public touchGrenade() {
    this.throwGrenade();
  }

  private spawnPlayer() {
    this.playerHealth = 100;
    this.isDead = false;
    this.isSliding = false;
    this.isCrouching = false;
    this.currentEyeHeight = 1.7;
    this.respawnTimer = 0;
    const spawns = this.playerTeam === 'allies' ? this.mapConfig.alliesSpawns : this.mapConfig.enemiesSpawns;
    const sp = spawns[0] || this.mapConfig.alliesSpawns[0];
    this.playerPos.set(...sp.position);
    this.yaw = sp.rotationY;
    this.pitch = 0;
    this.playerVel.set(0, 0, 0);

    const wDef = WEAPONS[this.currentWeaponId];
    this.currentAmmo = wDef.magazineSize;
    this.reserveAmmo = wDef.reserveAmmo;
    this.callbacks.onAmmoChange(this.currentAmmo, this.reserveAmmo);
    this.callbacks.onHealthChange(this.playerHealth, this.maxHealth);
  }

  public equipWeapon(id: WeaponId) {
    if (this.currentWeaponId === id) return;
    this.currentWeaponId = id;
    const wDef = WEAPONS[id];
    this.currentAmmo = wDef.magazineSize;
    this.reserveAmmo = wDef.reserveAmmo;
    this.viewModel.rebuildWeapon(id, this.currentCamoId);
    this.callbacks.onWeaponChange(id);
    this.callbacks.onAmmoChange(this.currentAmmo, this.reserveAmmo);
    sounds.playReload('clip_in');
  }

  public switchWeapon() {
    if (this.mode === 'gun_game') return;
    if (this.currentWeaponId === this.secondaryWeaponId) {
      this.equipWeapon('m4a1');
    } else {
      this.equipWeapon(this.secondaryWeaponId);
    }
  }

  public tryTakeNearbyPickup() {
    const nearby = this.pickupManager.checkProximity(this.playerPos);
    if (!nearby) return;

    const taken = this.pickupManager.takePickup(nearby.pickup.id);
    if (!taken) return;

    if (taken.weaponId === 'ammo_crate') {
      const wDef = WEAPONS[this.currentWeaponId];
      this.currentAmmo = wDef.magazineSize;
      this.reserveAmmo = wDef.reserveAmmo;
      this.grenadeCount = 3;
      this.callbacks.onAmmoChange(this.currentAmmo, this.reserveAmmo);
      this.callbacks.onWeaponUpgrade('Ravitaillement de Munitions Réussi !');
    } else {
      this.equipWeapon(taken.weaponId);
      this.callbacks.onWeaponUpgrade(`Arme Ramassée : ${taken.name}`);
    }
  }

  public reloadWeapon() {
    if (this.reloadTimer > 0) return;
    const wDef = WEAPONS[this.currentWeaponId];
    if (this.currentAmmo >= wDef.magazineSize || this.reserveAmmo <= 0) return;

    this.reloadTimer = wDef.reloadTimeMs / 1000;
    this.viewModel.startReload(wDef.reloadTimeMs);
    sounds.playReload('start');

    setTimeout(() => {
      sounds.playReload('clip_in');
    }, wDef.reloadTimeMs * 0.45);

    setTimeout(() => {
      sounds.playReload('bolt');
    }, wDef.reloadTimeMs * 0.8);
  }

  public performMelee() {
    if (this.isDead) return;
    sounds.playKnifeSlash();

    this.camera.getWorldDirection(_forward);
    this.raycaster.set(this.camera.position, _forward);
    this.raycaster.far = 2.8;

    const targets = this.targetManager.getTargetMeshes();
    const hits = this.raycaster.intersectObjects(targets, false);

    if (hits.length > 0) {
      const hit = hits[0];
      const targetId = (hit.object as any).targetId;
      const { killed } = this.targetManager.hitTarget(targetId, 120, false, hit.point);
      if (killed) {
        this.handleTargetDestroyed(false, 'knife');
      }
    }
  }

  public throwGrenade() {
    if (this.grenadeCount <= 0 || this.isDead) return;
    this.grenadeCount--;

    this.camera.getWorldDirection(_forward);
    const origin = this.camera.position.clone().addScaledVector(_forward, 0.4);
    this.effects.spawnGrenade(origin, _forward, 'player', true);
  }

  private handleGrenadeExplode = (pos: THREE.Vector3) => {
    const maxDamageRadius = 6.8;
    this.targetManager.targets.forEach((target) => {
      if (!target.isKnockedDown) {
        const d = target.group.position.distanceTo(pos);
        if (d < maxDamageRadius) {
          const dmg = (1 - d / maxDamageRadius) * 140;
          const { killed } = this.targetManager.hitTarget(target.id, dmg, false, target.group.position);
          if (killed) {
            this.handleTargetDestroyed(false, 'm4a1');
          }
        }
      }
    });
  };

  public activateKillstreak(type: KillstreakId) {
    const streak = KILLSTREAKS.find((k) => k.id === type);
    if (!streak || this.currentStreak < streak.cost) return;

    if (type === 'uav') {
      this.isUavActive = true;
      this.uavTimer = 25;
      sounds.playUAVSound();
      this.callbacks.onUAVScan(true);
    } else if (type === 'airstrike') {
      sounds.playUAVSound();
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const targetX = (Math.random() - 0.5) * this.mapConfig.size.width * 0.7;
          const targetZ = (Math.random() - 0.5) * this.mapConfig.size.depth * 0.7;
          const strikePos = new THREE.Vector3(targetX, 0.2, targetZ);
          this.effects.spawnExplosion(strikePos);
          this.handleGrenadeExplode(strikePos);
        }, i * 400);
      }
    } else if (type === 'chopper') {
      this.chopperActive = true;
      this.chopperTimer = 28;
      this.spawnAttackChopper();
    } else if (type === 'nuke') {
      this.nukeActive = true;
      this.nukeCountdown = 10;
      sounds.playNukeSiren();
      this.callbacks.onNukeTriggered(10);
    }
  }

  private spawnAttackChopper() {
    sounds.playUAVSound();
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1.8, 6),
      new THREE.MeshStandardMaterial({ color: 0x2e3630, roughness: 0.7, metalness: 0.3 })
    );
    group.add(body);

    const rotor = new THREE.Mesh(
      new THREE.BoxGeometry(9, 0.08, 0.5),
      new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    rotor.position.y = 1.3;
    group.add(rotor);

    group.position.set(0, 18, 0);
    this.scene.add(group);
    this.chopperMesh = group;
  }

  private handleTargetDestroyed(isHeadshot: boolean, weapon: WeaponId) {
    this.kills++;
    this.targetEliminations++;
    this.score += isHeadshot ? 150 : 100;
    this.currentStreak++;
    if (this.currentStreak > this.highestStreak) {
      this.highestStreak = this.currentStreak;
    }
    this.callbacks.onStreakChange(this.currentStreak);

    if (isHeadshot) this.headshots++;

    sounds.playHitmarker(isHeadshot, true);
    this.callbacks.onHitmarker({
      id: Math.random().toString(),
      isFatal: true,
      isHeadshot,
      time: Date.now()
    });

    const feed: KillfeedEntry = {
      id: Math.random().toString(),
      killer: 'Opérateur (Vous)',
      killerTeam: this.playerTeam,
      victim: isHeadshot ? 'Cible (Tir Tête)' : 'Cible Tactique',
      victimTeam: 'enemies',
      weapon,
      isHeadshot,
      time: Date.now()
    };
    this.callbacks.onKillfeed(feed);

    this.matchScore += isHeadshot ? 150 : 100;
    this.callbacks.onScoreChange(this.targetEliminations, 30);

    // Dynamic Weapon Upgrade based on Kills (Requested feature!)
    if (this.mode !== 'gun_game') {
      const nextWeapon = getWeaponForKills(this.kills);
      if (nextWeapon !== this.currentWeaponId) {
        this.equipWeapon(nextWeapon);
        sounds.playLevelUp();
        this.callbacks.onWeaponUpgrade(`NOUVELLE ARME DÉBLOQUÉE : ${WEAPONS[nextWeapon].name.toUpperCase()}`);
      }
    } else {
      // Gun Game Mode progression
      this.gunGameTier++;
      if (this.gunGameTier >= this.gunGameOrder.length) {
        this.endMatch(true);
      } else {
        const nextW = this.gunGameOrder[this.gunGameTier];
        this.equipWeapon(nextW);
        sounds.playLevelUp();
      }
    }

    if (this.targetEliminations >= 30) {
      this.endMatch(true);
    }
  }

  private shootWeapon() {
    const wDef = WEAPONS[this.currentWeaponId];
    if (this.currentAmmo <= 0) {
      sounds.playDryFire();
      this.fireTimer = 0.25;
      this.reloadWeapon();
      return;
    }

    this.currentAmmo--;
    this.callbacks.onAmmoChange(this.currentAmmo, this.reserveAmmo);
    this.fireTimer = wDef.fireDelayMs / 1000;

    this.viewModel.triggerRecoil(wDef.recoilKick);
    sounds.playGunshot(this.currentWeaponId === 'knife' ? 'm4a1' : this.currentWeaponId);

    this.camera.getWorldDirection(_forward);
    const muzzlePos = this.camera.position.clone().addScaledVector(_forward, 0.45);
    this.effects.triggerMuzzleFlash(muzzlePos);

    if (this.callbacks.onRemoteFire) {
      this.callbacks.onRemoteFire(
        [muzzlePos.x, muzzlePos.y, muzzlePos.z],
        [_forward.x, _forward.y, _forward.z],
        this.currentWeaponId
      );
    }

    const spread = this.isAiming ? wDef.spreadAds : wDef.spreadHip;
    const pellets = wDef.pellets || 1;

    const targetObjects = this.targetManager.getTargetMeshes();
    const remoteObjects = this.getRemotePlayerMeshes();
    const shootableObjects = [...targetObjects, ...remoteObjects];

    for (let p = 0; p < pellets; p++) {
      _rayDir.copy(_forward);
      if (spread > 0.001) {
        _rayDir.x += (Math.random() - 0.5) * spread;
        _rayDir.y += (Math.random() - 0.5) * spread;
        _rayDir.z += (Math.random() - 0.5) * spread;
        _rayDir.normalize();
      }

      this.raycaster.set(this.camera.position, _rayDir);
      this.raycaster.far = 100;

      const hits = this.raycaster.intersectObjects(shootableObjects, false);
      let impactPoint: THREE.Vector3;

      if (hits.length > 0) {
        const hit = hits[0];
        impactPoint = hit.point;
        const targetPart = hit.object as any;
        const isHead = !!targetPart.isHead;

        if (targetPart.peerId) {
          const targetPeerId = targetPart.peerId as string;
          const dmg = (wDef.damage / pellets) * (isHead ? wDef.headshotMultiplier : 1.0);
          sounds.playHitmarker(isHead, false);
          this.callbacks.onHitmarker({
            id: Math.random().toString(),
            isFatal: false,
            isHeadshot: isHead,
            time: Date.now()
          });

          if (this.callbacks.onPlayerDamage) {
            this.callbacks.onPlayerDamage(targetPeerId, dmg, isHead, this.currentWeaponId);
          }
        } else if (targetPart.targetId) {
          const targetId = targetPart.targetId;
          const dmg = (wDef.damage / pellets) * (isHead ? wDef.headshotMultiplier : 1.0);
          const { killed } = this.targetManager.hitTarget(targetId, dmg, isHead, hit.point);

          sounds.playHitmarker(isHead, killed);
          this.callbacks.onHitmarker({
            id: Math.random().toString(),
            isFatal: killed,
            isHeadshot: isHead,
            time: Date.now()
          });

          if (killed) {
            this.handleTargetDestroyed(isHead, this.currentWeaponId);
          }
        }
      } else {
        impactPoint = this.camera.position.clone().addScaledVector(_rayDir, 60);
      }

      this.effects.addBulletTracer(muzzlePos, impactPoint);
    }
  }

  private createNameSprite(name: string, team: Team): THREE.Sprite {
    const nameCanvas = document.createElement('canvas');
    nameCanvas.width = 256;
    nameCanvas.height = 64;
    const nCtx = nameCanvas.getContext('2d')!;
    nCtx.fillStyle = 'rgba(0,0,0,0.75)';
    nCtx.roundRect(10, 10, 236, 44, 8);
    nCtx.fill();
    nCtx.fillStyle = team === 'allies' ? '#60a5fa' : '#f87171';
    nCtx.font = 'bold 22px sans-serif';
    nCtx.textAlign = 'center';
    nCtx.fillText((name || 'Opérateur').slice(0, 14), 128, 38);

    const nameTex = new THREE.CanvasTexture(nameCanvas);
    const nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: nameTex }));
    nameSprite.position.y = 2.15;
    nameSprite.scale.set(1.4, 0.35, 1);
    return nameSprite;
  }

  public getRemotePlayerMeshes(): THREE.Object3D[] {
    const meshes: THREE.Object3D[] = [];
    this.remotePlayerMeshes.forEach((group) => {
      group.traverse((child) => {
        if ((child as any).peerId) {
          meshes.push(child);
        }
      });
    });
    return meshes;
  }

  // Update peer player 3D avatars for WebRTC P2P multiplayer with realistic tactical operator model
  public updateRemotePeer(
    peerId: string,
    name: string,
    team: Team,
    pos: [number, number, number],
    yaw: number
  ) {
    let mesh = this.remotePlayerMeshes.get(peerId);
    if (!mesh) {
      mesh = new THREE.Group();
      mesh.userData.name = name;
      mesh.userData.team = team;

      const teamColor = team === 'allies' ? 0x2563eb : 0xdc2626;

      const camoMat = new THREE.MeshStandardMaterial({
        color: team === 'allies' ? 0x334155 : 0x44403c, // Urban Navy vs Desert SpecOps
        roughness: 0.85
      });

      const vestMat = new THREE.MeshStandardMaterial({
        color: 0x18181b, // Black tactical plate carrier
        roughness: 0.75,
        metalness: 0.15
      });

      const teamPatchMat = new THREE.MeshStandardMaterial({
        color: teamColor,
        roughness: 0.5,
        metalness: 0.2
      });

      const skinMat = new THREE.MeshStandardMaterial({
        color: 0xd4a373,
        roughness: 0.8
      });

      const metalMat = new THREE.MeshStandardMaterial({
        color: 0x18191c,
        metalness: 0.85,
        roughness: 0.35
      });

      // 1. Combat Boots & Legs
      const bootMat = new THREE.MeshStandardMaterial({ color: 0x111215, roughness: 0.9 });
      [-0.18, 0.18].forEach((bx) => {
        const boot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.3), bootMat);
        boot.position.set(bx, 0.11, 0.04);
        boot.castShadow = true;
        (boot as any).peerId = peerId;
        mesh!.add(boot);

        // Legs with kneepads
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.65, 8), camoMat);
        leg.position.set(bx, 0.48, 0);
        leg.castShadow = true;
        (leg as any).peerId = peerId;
        mesh!.add(leg);

        const kneepad = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.08), vestMat);
        kneepad.position.set(bx, 0.48, 0.1);
        mesh!.add(kneepad);
      });

      // 2. Torso with Tactical Plate Carrier
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.66, 0.34), camoMat);
      torso.position.y = 1.12;
      torso.castShadow = true;
      (torso as any).peerId = peerId;
      mesh.add(torso);

      const vest = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.52, 0.38), vestMat);
      vest.position.y = 1.18;
      vest.castShadow = true;
      (vest as any).peerId = peerId;
      mesh.add(vest);

      // Mag Pouches on Chest
      [-0.14, 0, 0.14].forEach((px) => {
        const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.16, 0.08), vestMat);
        pouch.position.set(px, 1.08, 0.22);
        mesh!.add(pouch);
      });

      // Team Armbands on Shoulders
      [-0.31, 0.31].forEach((ax) => {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.52, 8), camoMat);
        arm.position.set(ax, 1.15, 0.05);
        arm.rotation.x = 0.5;
        arm.castShadow = true;
        (arm as any).peerId = peerId;
        mesh!.add(arm);

        const armband = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.098, 0.14, 8), teamPatchMat);
        armband.position.set(ax, 1.25, 0.05);
        armband.rotation.x = 0.5;
        mesh!.add(armband);
      });

      // Radio Antenna on Left Shoulder
      const radio = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.06), vestMat);
      radio.position.set(-0.22, 1.45, 0.12);
      mesh.add(radio);

      const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.28, 6), metalMat);
      antenna.position.set(-0.22, 1.62, 0.12);
      mesh.add(antenna);

      // 3. Head with Kevlar Tactical Helmet & NVG Shroud
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.25), skinMat);
      head.position.y = 1.62;
      head.castShadow = true;
      (head as any).peerId = peerId;
      (head as any).isHead = true;
      mesh.add(head);

      const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10, 0, Math.PI * 2, 0, Math.PI / 1.7), camoMat);
      helmet.position.set(0, 1.68, 0);
      helmet.castShadow = true;
      (helmet as any).peerId = peerId;
      (helmet as any).isHead = true;
      mesh.add(helmet);

      // NVG Mount Plate on Helmet Forehead
      const nvgMount = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), metalMat);
      nvgMount.position.set(0, 1.75, 0.19);
      mesh.add(nvgMount);

      // Ballistic Goggles
      const goggleMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.1, metalness: 0.9 });
      const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.07, 0.06), goggleMat);
      goggles.position.set(0, 1.65, 0.15);
      mesh.add(goggles);

      // 4. Primary Weapon Held in Hands
      const gunGroup = new THREE.Group();
      gunGroup.position.set(0.12, 1.05, 0.35);

      const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.55), metalMat);
      gunGroup.add(gunBody);

      const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.28, 8), metalMat);
      gunBarrel.rotation.x = Math.PI / 2;
      gunBarrel.position.set(0, 0.02, -0.38);
      gunGroup.add(gunBarrel);

      const gunMag = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.15, 0.07), metalMat);
      gunMag.rotation.x = 0.25;
      gunMag.position.set(0, -0.09, -0.06);
      gunGroup.add(gunMag);

      gunGroup.castShadow = true;
      mesh.add(gunGroup);

      // 5. Overhead 3D Name Tag Canvas Billboard
      const nameSprite = this.createNameSprite(name, team);
      mesh.add(nameSprite);
      mesh.userData.nameSprite = nameSprite;

      this.scene.add(mesh);
      this.remotePlayerMeshes.set(peerId, mesh);
    } else {
      // Dynamic update of overhead nameplate if name or team changed
      if (mesh.userData.name !== name || mesh.userData.team !== team) {
        if (mesh.userData.nameSprite) {
          mesh.remove(mesh.userData.nameSprite);
        }
        const updatedSprite = this.createNameSprite(name, team);
        mesh.add(updatedSprite);
        mesh.userData.nameSprite = updatedSprite;
        mesh.userData.name = name;
        mesh.userData.team = team;
      }
    }

    mesh.visible = true;
    mesh.position.set(pos[0], Math.max(0, pos[1] - 1.7), pos[2]);
    mesh.rotation.y = yaw;
    if (pos[1] < 1.35) {
      mesh.scale.set(1, 0.65, 1);
    } else {
      mesh.scale.set(1, 1, 1);
    }
  }

  public takeDamage(
    amount: number,
    isHeadshot: boolean,
    weapon: WeaponId,
    attackerId?: string,
    attackerName?: string
  ) {
    if (this.isDead || this.isMatchOver) return;

    this.playerHealth = Math.max(0, this.playerHealth - amount);
    this.callbacks.onHealthChange(this.playerHealth, this.maxHealth);
    sounds.playHurt();

    if (this.playerHealth <= 0) {
      this.isDead = true;
      this.isSliding = false;
      this.isCrouching = false;
      this.deaths++;
      this.currentStreak = 0;
      this.callbacks.onStreakChange(0);
      sounds.playDeath();

      const feed: KillfeedEntry = {
        id: Math.random().toString(),
        killer: attackerName || 'Opérateur Ennemi',
        killerTeam: this.playerTeam === 'allies' ? 'enemies' : 'allies',
        victim: 'Opérateur (Vous)',
        victimTeam: this.playerTeam,
        weapon,
        isHeadshot,
        time: Date.now()
      };
      this.callbacks.onKillfeed(feed);

      setTimeout(() => {
        if (!this.isMatchOver) {
          this.spawnPlayer();
        }
      }, 3000);
    }
  }

  public handleRemotePlayerFire(
    peerId: string,
    origin: [number, number, number],
    direction: [number, number, number],
    weapon: WeaponId
  ) {
    const originVec = new THREE.Vector3(...origin);
    const dirVec = new THREE.Vector3(...direction).normalize();
    const impactPoint = originVec.clone().addScaledVector(dirVec, 40);

    sounds.playGunshot(weapon === 'knife' ? 'm4a1' : weapon);
    this.effects.triggerMuzzleFlash(originVec);
    this.effects.addBulletTracer(originVec, impactPoint);
  }

  public removeRemotePeer(peerId: string) {
    const mesh = this.remotePlayerMeshes.get(peerId);
    if (mesh) {
      this.scene.remove(mesh);
      this.remotePlayerMeshes.delete(peerId);
    }
  }

  private updatePlayerMovement(delta: number) {
    if (this.isDead || this.isMatchOver) return;

    let moveF = 0;
    let moveR = 0;

    const isForward = this.isKeyActive('KeyW', 'w') || this.isKeyActive('KeyZ', 'z') || !!this.keys['ArrowUp'];
    const isBackward = this.isKeyActive('KeyS', 's') || !!this.keys['ArrowDown'];
    const isLeft = this.isKeyActive('KeyA', 'a') || this.isKeyActive('KeyQ', 'q') || !!this.keys['ArrowLeft'];
    const isRight = this.isKeyActive('KeyD', 'd') || !!this.keys['ArrowRight'];

    if (isForward) moveF += 1;
    if (isBackward) moveF -= 1;
    if (isRight) moveR += 1;
    if (isLeft) moveR -= 1;

    if (this.touchMoveY !== 0) moveF = -this.touchMoveY;
    if (this.touchMoveX !== 0) moveR = this.touchMoveX;

    const hasSprintKey = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']);
    const isMovingForward = moveF > 0;

    // Sprinting breaks crouch (natural tactical movement)
    if (this.isCrouching && !this.isSliding && hasSprintKey && isMovingForward) {
      this.isCrouching = false;
    }

    this.isSprinting = hasSprintKey && isMovingForward && !this.isAiming && !this.isCrouching && !this.isSliding;

    _forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    _right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

    // Smooth eye-height interpolation: slide (0.85m), crouch (1.05m), stand (1.7m)
    const targetEyeHeight = this.isSliding ? 0.85 : this.isCrouching ? 1.05 : 1.7;
    this.currentEyeHeight = THREE.MathUtils.damp(this.currentEyeHeight, targetEyeHeight, 14, delta);

    if (this.isSliding) {
      this.slideTimer -= delta;
      // Exponential falloff from 13.0 m/s down to crouch speed 3.5 m/s
      const t = Math.max(0, this.slideTimer / this.slideDuration);
      const slideSpeed = 3.5 + 9.5 * (t * t);

      this.playerVel.x = this.slideVelocity.x * slideSpeed;
      this.playerVel.z = this.slideVelocity.z * slideSpeed;

      if (this.slideTimer <= 0) {
        this.isSliding = false;
        this.isCrouching = true;
      }
    } else {
      const baseSpeed = this.isSprinting ? 9.5 : this.isCrouching ? 3.5 : 6.2;
      _moveDir.set(0, 0, 0);
      _moveDir.addScaledVector(_forward, moveF);
      _moveDir.addScaledVector(_right, moveR);
      if (_moveDir.lengthSq() > 1) _moveDir.normalize();

      this.playerVel.x = _moveDir.x * baseSpeed;
      this.playerVel.z = _moveDir.z * baseSpeed;
    }

    if (this.keys['Space'] && this.isGrounded) {
      if (this.isSliding) {
        // Slide-cancel jump (tactical COD momentum jump)
        this.isSliding = false;
      }
      this.isCrouching = false;
      this.playerVel.y = 8.5;
      this.isGrounded = false;
    }

    this.playerVel.y -= 22 * delta;
    this.playerPos.addScaledVector(this.playerVel, delta);

    if (this.playerPos.y <= this.currentEyeHeight) {
      this.playerPos.y = this.currentEyeHeight;
      this.playerVel.y = 0;
      this.isGrounded = true;
    }

    // Map obstacle collision resolution
    const radius = 0.45;
    let hitObstacle = false;
    for (const box of this.mapConfig.collisionBoxes) {
      if (
        this.playerPos.x + radius > box.minX &&
        this.playerPos.x - radius < box.maxX &&
        this.playerPos.z + radius > box.minZ &&
        this.playerPos.z - radius < box.maxZ &&
        this.playerPos.y < box.maxY
      ) {
        hitObstacle = true;
        const dx1 = this.playerPos.x - box.minX;
        const dx2 = box.maxX - this.playerPos.x;
        const dz1 = this.playerPos.z - box.minZ;
        const dz2 = box.maxZ - this.playerPos.z;

        const minPen = Math.min(dx1, dx2, dz1, dz2);
        if (minPen === dx1) this.playerPos.x = box.minX - radius;
        else if (minPen === dx2) this.playerPos.x = box.maxX + radius;
        else if (minPen === dz1) this.playerPos.z = box.minZ - radius;
        else this.playerPos.z = box.maxZ + radius;
      }
    }

    if (hitObstacle && this.isSliding) {
      this.isSliding = false;
      this.isCrouching = true;
    }

    this.camera.position.copy(this.playerPos);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.set(0, 0, 0);
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    this.camera.rotation.z = this.isSliding ? -0.035 : 0;

    const wDef = WEAPONS[this.currentWeaponId];
    let targetFov = this.isAiming ? 80 * wDef.adsZoom : 80;
    if (this.isSliding) {
      targetFov += 4;
    }
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 16, delta);
    this.camera.updateProjectionMatrix();

    const isMoving = (this.isSliding || _moveDir.lengthSq() > 0.05) && this.isGrounded;
    this.viewModel.setSprinting(this.isSprinting && !this.isSliding);
    this.viewModel.update(delta, isMoving, this.isAiming);
  }

  private endMatch(victory: boolean) {
    if (this.isMatchOver) return;
    this.isMatchOver = true;
    sounds.playLevelUp();
    this.callbacks.onMatchEnd(victory, {
      kills: this.kills,
      deaths: this.deaths,
      headshots: this.headshots,
      streak: this.highestStreak
    });
  }

  private tick = () => {
    if (!this.isRunning) return;

    const delta = Math.min(0.08, this.clock.getDelta());

    if (!this.isMatchOver) {
      this.matchTimeRemaining -= delta;
      if (this.matchTimeRemaining <= 0) {
        this.endMatch(this.targetEliminations >= 15);
      }
    }

    if (this.isUavActive) {
      this.uavTimer -= delta;
      if (this.uavTimer <= 0) {
        this.isUavActive = false;
        this.callbacks.onUAVScan(false);
      }
    }

    if (this.chopperActive && this.chopperMesh) {
      this.chopperTimer -= delta;
      this.chopperMesh.rotation.y += delta * 2.0;
      const angle = Date.now() * 0.0008;
      this.chopperMesh.position.x = Math.cos(angle) * 18;
      this.chopperMesh.position.z = Math.sin(angle) * 18;

      if (Math.random() < 0.12) {
        const available = this.targetManager.targets.filter((t) => !t.isKnockedDown);
        if (available.length > 0) {
          const t = available[Math.floor(Math.random() * available.length)];
          this.effects.addBulletTracer(this.chopperMesh.position, t.group.position);
          const { killed } = this.targetManager.hitTarget(t.id, 50, false, t.group.position);
          if (killed) {
            this.handleTargetDestroyed(false, 'm4a1');
          }
        }
      }

      if (this.chopperTimer <= 0) {
        this.chopperActive = false;
        this.scene.remove(this.chopperMesh);
        this.chopperMesh = null;
      }
    }

    if (this.nukeActive) {
      this.nukeCountdown -= delta;
      this.callbacks.onNukeTriggered(Math.ceil(this.nukeCountdown));
      if (this.nukeCountdown <= 0) {
        this.nukeActive = false;
        this.targetManager.targets.forEach((t) => {
          this.targetManager.hitTarget(t.id, 999, false, t.group.position);
        });
        this.effects.spawnExplosion(new THREE.Vector3(0, 5, 0));
        this.endMatch(true);
      }
    }

    if (this.fireTimer > 0) this.fireTimer -= delta;
    if (this.reloadTimer > 0) {
      this.reloadTimer -= delta;
      if (this.reloadTimer <= 0) {
        const wDef = WEAPONS[this.currentWeaponId];
        const needed = wDef.magazineSize - this.currentAmmo;
        const take = Math.min(needed, this.reserveAmmo);
        this.currentAmmo += take;
        this.reserveAmmo -= take;
        this.callbacks.onAmmoChange(this.currentAmmo, this.reserveAmmo);
      }
    } else if (this.isFiring && this.fireTimer <= 0 && !this.isDead) {
      const wDef = WEAPONS[this.currentWeaponId];
      this.shootWeapon();
      if (!wDef.isAutomatic) {
        this.isFiring = false;
      }
    }

    // Player Movement
    this.updatePlayerMovement(delta);

    // Targets & Pickups
    this.targetManager.update(delta);
    this.pickupManager.update(delta);

    // Nearby pickup prompt check
    const nearbyPickup = this.pickupManager.checkProximity(this.playerPos);
    if (nearbyPickup) {
      this.callbacks.onPickupPrompt(`[E] Ramasser ${nearbyPickup.pickup.name}`);
    } else {
      this.callbacks.onPickupPrompt(null);
    }

    // Effects
    this.effects.update(delta, (g, pos) => this.handleGrenadeExplode(pos));

    // Stats
    const stats: PlayerStats[] = [
      {
        id: 'player',
        name: 'Opérateur (Vous)',
        team: this.playerTeam,
        kills: this.kills,
        deaths: this.deaths,
        assists: this.assists,
        score: this.score,
        streak: this.currentStreak,
        highestStreak: this.highestStreak,
        ping: 12
      }
    ];
    this.callbacks.onPlayerStatsChange(stats);

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  public startLoop() {
    this.isRunning = true;
    this.clock.start();
    this.tick();
  }

  public stopLoop() {
    this.isRunning = false;
    if (this.isSoftwareGl) {
      clearTimeout(this.frameId);
    } else {
      cancelAnimationFrame(this.frameId);
    }
  }

  public dispose() {
    this.stopLoop();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('mousemove', this.onMouseMove);

    this.effects.dispose();
    this.targetManager.dispose();
    this.pickupManager.dispose();

    this.remotePlayerMeshes.forEach((mesh) => {
      this.scene.remove(mesh);
    });
    this.remotePlayerMeshes.clear();

    if (this.renderer && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
  }
}
