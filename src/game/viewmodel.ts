import * as THREE from 'three';
import { WeaponId, CamoId } from '../types/game';
import { CAMOS } from './weapons';

export class ViewModel {
  public root: THREE.Group;
  private weaponMeshGroup: THREE.Group;
  private currentWeaponId: WeaponId = 'm4a1';
  private currentCamoId: CamoId = 'standard';

  // Animation states
  private idleTime = 0;
  private walkTime = 0;
  private recoilPitch = 0;
  private recoilPush = 0;
  private adsProgress = 0; // 0 = Hip, 1 = ADS
  private isSprinting = false;
  private isReloading = false;
  private reloadProgress = 0; // 0 to 1

  // Base position offsets (Hipfire & ADS)
  private readonly defaultPos = new THREE.Vector3(0.22, -0.21, -0.42);
  private readonly adsPos = new THREE.Vector3(0.0, -0.158, -0.32);

  constructor() {
    this.root = new THREE.Group();
    this.weaponMeshGroup = new THREE.Group();
    this.root.add(this.weaponMeshGroup);
    this.root.position.copy(this.defaultPos);

    this.rebuildWeapon('m4a1', 'standard');
  }

  public rebuildWeapon(weaponId: WeaponId, camoId: CamoId) {
    this.currentWeaponId = weaponId;
    this.currentCamoId = camoId;

    // Clear previous mesh
    while (this.weaponMeshGroup.children.length > 0) {
      const child = this.weaponMeshGroup.children[0];
      this.weaponMeshGroup.remove(child);
    }

    const camo = CAMOS[camoId] || CAMOS.standard;

    // High quality PBR materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: camo.primaryColor,
      roughness: camo.roughness,
      metalness: camo.metalness
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: camo.accentColor,
      roughness: Math.min(1, camo.roughness + 0.15),
      metalness: Math.max(0, camo.metalness - 0.1)
    });

    const darkGunMetal = new THREE.MeshStandardMaterial({
      color: 0x18191c,
      roughness: 0.35,
      metalness: 0.85
    });

    const brushedSteel = new THREE.MeshStandardMaterial({
      color: 0x8a929a,
      roughness: 0.25,
      metalness: 0.95
    });

    // 1. Tactical Combat Hands / Forearms
    this.buildTacticalHands();

    // 2. High-Fidelity Weapon Geometry (3-12 Detailed Subcomponents)
    if (weaponId === 'm4a1') {
      this.buildRealisticM4A1(bodyMat, accentMat, darkGunMetal);
    } else if (weaponId === 'mp5') {
      this.buildRealisticMP5(bodyMat, accentMat, darkGunMetal);
    } else if (weaponId === 'shotgun') {
      this.buildRealisticShotgun(bodyMat, accentMat, darkGunMetal);
    } else if (weaponId === 'sniper') {
      this.buildRealisticSniper(bodyMat, accentMat, darkGunMetal);
    } else if (weaponId === 'deagle') {
      this.buildRealisticDeagle(brushedSteel, darkGunMetal);
    } else {
      this.buildRealisticKnife(darkGunMetal, accentMat);
    }
  }

  private buildTacticalHands() {
    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0x22262a, // Mil-spec tactical combat glove
      roughness: 0.85,
      metalness: 0.1
    });

    const knucklePlateMat = new THREE.MeshStandardMaterial({
      color: 0x111315, // Hard carbon-fiber knuckle protector
      roughness: 0.4,
      metalness: 0.5
    });

    // Left Arm & Forearm holding barrel / foregrip
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.17, -0.12, 0.14);
    leftArmGroup.rotation.set(0.65, 0.42, -0.68);

    const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.048, 0.34, 10), gloveMat);
    leftArmGroup.add(leftForearm);

    const leftKnuckle = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.025, 0.06), knucklePlateMat);
    leftKnuckle.position.set(0, 0.14, 0.02);
    leftArmGroup.add(leftKnuckle);
    this.weaponMeshGroup.add(leftArmGroup);

    // Right Arm & Forearm on trigger
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.15, -0.15, 0.16);
    rightArmGroup.rotation.set(0.82, -0.32, 0.52);

    const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.048, 0.34, 10), gloveMat);
    rightArmGroup.add(rightForearm);

    const rightKnuckle = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.025, 0.06), knucklePlateMat);
    rightKnuckle.position.set(0, 0.14, 0.02);
    rightArmGroup.add(rightKnuckle);
    this.weaponMeshGroup.add(rightArmGroup);
  }

  private buildRealisticM4A1(bodyMat: THREE.Material, accentMat: THREE.Material, metalMat: THREE.Material) {
    // 1. Lower & Upper Receiver with Ejection Port
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.076, 0.29), bodyMat);
    this.weaponMeshGroup.add(receiver);

    // 2. Fluted Outer Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 12), metalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.014, -0.32);
    this.weaponMeshGroup.add(barrel);

    // Birdcage Flash Hider Muzzle Brake
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.014, 0.06, 10), metalMat);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 0.014, -0.51);
    this.weaponMeshGroup.add(muzzle);

    // 3. Picatinny Quad-Rail Handguard with Ventilation Slots
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.054, 0.22), accentMat);
    handguard.position.set(0, 0.014, -0.22);
    this.weaponMeshGroup.add(handguard);

    // 4. Tactical Vertical Foregrip
    const vGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.017, 0.11, 8), metalMat);
    vGrip.position.set(0, -0.065, -0.22);
    this.weaponMeshGroup.add(vGrip);

    // 5. Curved STANAG 30-Round Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.18, 0.075), metalMat);
    mag.rotation.x = 0.24;
    mag.position.set(0, -0.11, -0.06);
    this.weaponMeshGroup.add(mag);

    // 6. Ergonomic Pistol Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.13, 0.052), accentMat);
    grip.rotation.x = -0.42;
    grip.position.set(0, -0.088, 0.08);
    this.weaponMeshGroup.add(grip);

    // 7. Multi-Position Crane Tactical Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.095, 0.2), accentMat);
    stock.position.set(0, -0.005, 0.22);
    this.weaponMeshGroup.add(stock);

    // Buffer tube connecting receiver to stock
    const bufferTube = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.12, 8), metalMat);
    bufferTube.rotation.x = Math.PI / 2;
    bufferTube.position.set(0, 0.014, 0.16);
    this.weaponMeshGroup.add(bufferTube);

    // 8. EOTech-Style Holographic Sight with Glowing Red Dot Reticle
    const opticBase = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.032, 0.09), metalMat);
    opticBase.position.set(0, 0.052, -0.03);
    this.weaponMeshGroup.add(opticBase);

    // Optic Hood
    const opticHood = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.04, 0.08), metalMat);
    opticHood.position.set(0, 0.068, -0.03);
    this.weaponMeshGroup.add(opticHood);

    // Glowing Holographic Red Dot in center of glass
    const redDotMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const redDot = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 8, 8), redDotMat);
    redDot.position.set(0, 0.068, -0.03);
    this.weaponMeshGroup.add(redDot);
  }

  private buildRealisticMP5(bodyMat: THREE.Material, accentMat: THREE.Material, metalMat: THREE.Material) {
    // 1. Stamped Steel Upper Receiver
    const rec = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.068, 0.26), bodyMat);
    this.weaponMeshGroup.add(rec);

    // 2. Cocking Tube on Top-Left
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.28, 8), metalMat);
    tube.rotation.x = Math.PI / 2;
    tube.position.set(0, 0.038, -0.12);
    this.weaponMeshGroup.add(tube);

    // 3. Compact Submachine Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.22, 8), metalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.008, -0.22);
    this.weaponMeshGroup.add(barrel);

    // 4. Ribbed Polymer Handguard
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.052, 0.16), accentMat);
    handguard.position.set(0, 0.008, -0.16);
    this.weaponMeshGroup.add(handguard);

    // 5. Curved 9mm Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.17, 0.05), metalMat);
    mag.rotation.x = 0.35;
    mag.position.set(0, -0.1, -0.04);
    this.weaponMeshGroup.add(mag);

    // 6. Pistol Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.12, 0.045), accentMat);
    grip.rotation.x = -0.38;
    grip.position.set(0, -0.08, 0.07);
    this.weaponMeshGroup.add(grip);

    // 7. Retractable Wire Stock Struts
    const stockStrut = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.015, 0.22), metalMat);
    stockStrut.position.set(0, 0.015, 0.2);
    this.weaponMeshGroup.add(stockStrut);

    // 8. Hooded Ring Front Sight
    const frontSight = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.003, 6, 12), metalMat);
    frontSight.position.set(0, 0.05, -0.3);
    this.weaponMeshGroup.add(frontSight);
  }

  private buildRealisticShotgun(bodyMat: THREE.Material, accentMat: THREE.Material, metalMat: THREE.Material) {
    // 1. Heavy Steel Receiver
    const rec = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.082, 0.32), metalMat);
    this.weaponMeshGroup.add(rec);

    // 2. 12-Gauge Bore Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.44, 10), metalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.022, -0.34);
    this.weaponMeshGroup.add(barrel);

    // 3. Under-Barrel Tubular Magazine
    const underMag = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.38, 10), metalMat);
    underMag.rotation.x = Math.PI / 2;
    underMag.position.set(0, -0.012, -0.3);
    this.weaponMeshGroup.add(underMag);

    // 4. Ribbed Pump Action Forend Slide
    const pumpSlide = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.058, 0.18), accentMat);
    pumpSlide.position.set(0, -0.008, -0.28);
    this.weaponMeshGroup.add(pumpSlide);

    // 5. Side-Saddle Shell Carrier with 4 Red Shells
    const shellMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.2, roughness: 0.4 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.2 });

    [-0.08, -0.03, 0.03, 0.08].forEach((sz) => {
      const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.065, 8), shellMat);
      shell.rotation.z = Math.PI / 2;
      shell.position.set(-0.036, 0.015, sz);
      this.weaponMeshGroup.add(shell);

      const brassRim = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.015, 8), brassMat);
      brassRim.rotation.z = Math.PI / 2;
      brassRim.position.set(-0.046, 0.015, sz);
      this.weaponMeshGroup.add(brassRim);
    });

    // 6. Solid Tactical Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.11, 0.24), bodyMat);
    stock.position.set(0, -0.025, 0.25);
    this.weaponMeshGroup.add(stock);

    // 7. Tactical Ghost-Ring Sight
    const rearSight = new THREE.Mesh(new THREE.TorusGeometry(0.009, 0.0025, 6, 12), metalMat);
    rearSight.position.set(0, 0.052, 0.08);
    this.weaponMeshGroup.add(rearSight);
  }

  private buildRealisticSniper(bodyMat: THREE.Material, accentMat: THREE.Material, metalMat: THREE.Material) {
    // 1. Long Heavy Receiver
    const rec = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.085, 0.38), bodyMat);
    this.weaponMeshGroup.add(rec);

    // 2. Extra Long .50cal Fluted Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.58, 10), metalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.018, -0.44);
    this.weaponMeshGroup.add(barrel);

    // Massive Arrowhead Muzzle Brake
    const muzzleBrake = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.032, 0.095), metalMat);
    muzzleBrake.position.set(0, 0.018, -0.74);
    this.weaponMeshGroup.add(muzzleBrake);

    // 3. High-Power Variable Zoom Scope
    const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.26, 12), metalMat);
    scopeTube.rotation.x = Math.PI / 2;
    scopeTube.position.set(0, 0.078, -0.04);
    this.weaponMeshGroup.add(scopeTube);

    // Scope Mount Rings
    const ring1 = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.03, 0.02), metalMat);
    ring1.position.set(0, 0.056, -0.11);
    this.weaponMeshGroup.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.03, 0.02), metalMat);
    ring2.position.set(0, 0.056, 0.03);
    this.weaponMeshGroup.add(ring2);

    // 4. Heavy .50 BMG Box Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.16, 0.11), metalMat);
    mag.position.set(0, -0.11, -0.02);
    this.weaponMeshGroup.add(mag);

    // 5. Heavy Sniper Stock with Adjustable Cheek Pad
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.12, 0.26), accentMat);
    stock.position.set(0, -0.01, 0.28);
    this.weaponMeshGroup.add(stock);

    // Cheek pad
    const cheekPad = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.035, 0.12), metalMat);
    cheekPad.position.set(0, 0.065, 0.24);
    this.weaponMeshGroup.add(cheekPad);

    // 6. Folding Front Bipod
    const bipodL = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.16, 6), metalMat);
    bipodL.rotation.z = -0.4;
    bipodL.position.set(-0.04, -0.06, -0.38);
    this.weaponMeshGroup.add(bipodL);

    const bipodR = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.16, 6), metalMat);
    bipodR.rotation.z = 0.4;
    bipodR.position.set(0.04, -0.06, -0.38);
    this.weaponMeshGroup.add(bipodR);
  }

  private buildRealisticDeagle(steelMat: THREE.Material, gripMat: THREE.Material) {
    // 1. Brushed Chrome Slide
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.058, 0.26), steelMat);
    slide.position.set(0, 0.032, -0.06);
    this.weaponMeshGroup.add(slide);

    // 2. Barrel Bore (.50 AE)
    const bore = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 10), gripMat);
    bore.rotation.x = Math.PI / 2;
    bore.position.set(0, 0.042, -0.19);
    this.weaponMeshGroup.add(bore);

    // 3. Heavy Pistol Frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.035, 0.22), steelMat);
    frame.position.set(0, -0.01, -0.05);
    this.weaponMeshGroup.add(frame);

    // 4. Textured Grip Handle
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.14, 0.062), gripMat);
    handle.rotation.x = -0.32;
    handle.position.set(0, -0.08, 0.03);
    this.weaponMeshGroup.add(handle);

    // 5. Trigger Guard & Trigger
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.06), steelMat);
    guard.position.set(0, -0.045, -0.04);
    this.weaponMeshGroup.add(guard);

    // 6. Target Sights
    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.012, 0.01), gripMat);
    frontSight.position.set(0, 0.065, -0.18);
    this.weaponMeshGroup.add(frontSight);

    const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.012, 0.01), gripMat);
    rearSight.position.set(0, 0.065, 0.06);
    this.weaponMeshGroup.add(rearSight);
  }

  private buildRealisticKnife(bladeMat: THREE.Material, handleMat: THREE.Material) {
    // 1. Blackened Tanto Blade with Serrated Spine
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.052, 0.26), bladeMat);
    blade.position.set(0, 0.01, -0.12);
    this.weaponMeshGroup.add(blade);

    // 2. Steel Crossguard
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.075, 0.018), bladeMat);
    guard.position.set(0, 0.01, 0.01);
    this.weaponMeshGroup.add(guard);

    // 3. Ergonomic Paracord-Wrapped Handle
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.15, 8), handleMat);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0, 0.01, 0.09);
    this.weaponMeshGroup.add(handle);

    // 4. Tactical Skull Crusher Pommel
    const pommel = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.03, 6), bladeMat);
    pommel.rotation.x = -Math.PI / 2;
    pommel.position.set(0, 0.01, 0.17);
    this.weaponMeshGroup.add(pommel);
  }

  public triggerRecoil(kickAmount: number) {
    this.recoilPitch += kickAmount * 0.06;
    this.recoilPush += kickAmount * 0.04;
  }

  public setSprinting(sprinting: boolean) {
    this.isSprinting = sprinting;
  }

  public startReload(_reloadTimeMs?: number) {
    this.isReloading = true;
    this.reloadProgress = 0;
  }

  public update(
    delta: number,
    isMoving: boolean,
    isAiming: boolean,
    isSprinting?: boolean
  ) {
    if (isSprinting !== undefined) {
      this.isSprinting = isSprinting;
    }

    // Smooth ADS transition
    const adsSpeed = isAiming ? 10 : 12;
    const targetAds = isAiming ? 1.0 : 0.0;
    this.adsProgress = THREE.MathUtils.lerp(this.adsProgress, targetAds, delta * adsSpeed);

    // Recoil recovery
    this.recoilPitch = THREE.MathUtils.lerp(this.recoilPitch, 0, delta * 18);
    this.recoilPush = THREE.MathUtils.lerp(this.recoilPush, 0, delta * 16);

    // Breathing & walk bobbing
    this.idleTime += delta * 2;
    if (isMoving) {
      this.walkTime += delta * (isSprinting ? 14 : 9);
    }

    const idleBobX = Math.cos(this.idleTime) * 0.003;
    const idleBobY = Math.sin(this.idleTime * 2) * 0.003;

    const walkBobX = isMoving ? Math.cos(this.walkTime * 0.5) * (isSprinting ? 0.035 : 0.014) : 0;
    const walkBobY = isMoving ? Math.abs(Math.sin(this.walkTime)) * (isSprinting ? 0.04 : 0.016) : 0;

    // Interpolate base position
    const targetPos = new THREE.Vector3().lerpVectors(this.defaultPos, this.adsPos, this.adsProgress);

    // Apply movement offsets
    targetPos.x += (idleBobX + walkBobX) * (1 - this.adsProgress * 0.85);
    targetPos.y += (idleBobY - walkBobY) * (1 - this.adsProgress * 0.85);
    targetPos.z += this.recoilPush;

    // Sprint tilt
    if (isSprinting && this.adsProgress < 0.2) {
      targetPos.y -= 0.08;
      targetPos.x += 0.04;
    }

    this.root.position.copy(targetPos);

    // Pitch recoil rotation
    this.root.rotation.x = this.recoilPitch;
    this.root.rotation.y = isSprinting ? -0.35 : 0;
    this.root.rotation.z = 0; // Strictly 0 to prevent horizon tilt
  }
}
