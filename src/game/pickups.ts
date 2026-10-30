import * as THREE from 'three';
import { WeaponId, WeaponPickupDef, ActiveWeaponPickup } from '../types/game';
import { WEAPONS } from './weapons';
import { sounds } from '../audio/soundManager';

export class PickupManager {
  private scene: THREE.Scene;
  public pickups: Array<ActiveWeaponPickup & { meshGroup: THREE.Group; light: THREE.PointLight }>;

  constructor(scene: THREE.Scene, pickupDefs: WeaponPickupDef[]) {
    this.scene = scene;
    this.pickups = pickupDefs.map((def) => {
      const group = new THREE.Group();
      group.position.set(...def.position);

      // Base Pedestal Pad
      const padGeo = new THREE.CylinderGeometry(0.7, 0.8, 0.12, 16);
      const padMat = new THREE.MeshStandardMaterial({
        color: 0x1f2329,
        metalness: 0.8,
        roughness: 0.3
      });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.y = 0.06;
      group.add(pad);

      // Glowing Hologram Ring
      const ringGeo = new THREE.RingGeometry(0.5, 0.65, 24);
      const isAmmo = def.weaponId === 'ammo_crate';
      const glowColor = isAmmo ? 0x22c55e : 0xf59e0b;

      const ringMat = new THREE.MeshBasicMaterial({
        color: glowColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.14;
      group.add(ring);

      // Floating Weapon or Ammo Crate Model
      const modelGroup = new THREE.Group();
      modelGroup.position.y = 0.7;

      if (isAmmo) {
        // Green Ammo Supply Crate with stenciled military trim
        const crateGeo = new THREE.BoxGeometry(0.5, 0.35, 0.35);
        const crateMat = new THREE.MeshStandardMaterial({
          color: 0x2e4a2c,
          roughness: 0.7,
          metalness: 0.2
        });
        const crate = new THREE.Mesh(crateGeo, crateMat);
        modelGroup.add(crate);

        const bandGeo = new THREE.BoxGeometry(0.52, 0.08, 0.37);
        const bandMat = new THREE.MeshStandardMaterial({ color: 0x1a2419, roughness: 0.9 });
        const band = new THREE.Mesh(bandGeo, bandMat);
        modelGroup.add(band);
      } else {
        // Stylized 3D Gun Silhouette floating
        const wDef = WEAPONS[def.weaponId as WeaponId] || WEAPONS.m4a1;
        const gunMat = new THREE.MeshStandardMaterial({
          color: wDef.color,
          metalness: 0.8,
          roughness: 0.2
        });
        const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.65), gunMat);
        modelGroup.add(gunBody);

        const barrel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8),
          new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 })
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, -0.4);
        modelGroup.add(barrel);
      }

      group.add(modelGroup);

      // Beacon Light
      const light = new THREE.PointLight(glowColor, 2.5, 4);
      light.position.y = 0.8;
      group.add(light);

      this.scene.add(group);

      return {
        ...def,
        isAvailable: true,
        respawnTimer: 0,
        meshGroup: group,
        light
      };
    });
  }

  public checkProximity(
    playerPos: THREE.Vector3
  ): { pickup: ActiveWeaponPickup; distance: number } | null {
    let closest: { pickup: ActiveWeaponPickup; distance: number } | null = null;
    let minDist = 2.4; // 2.4 meters pickup range

    for (const p of this.pickups) {
      if (!p.isAvailable) continue;
      const pickupPos = new THREE.Vector3(...p.position);
      const d = playerPos.distanceTo(pickupPos);
      if (d < minDist) {
        minDist = d;
        closest = { pickup: p, distance: d };
      }
    }
    return closest;
  }

  public takePickup(pickupId: string): { weaponId: WeaponId | 'ammo_crate'; name: string } | null {
    const p = this.pickups.find((item) => item.id === pickupId);
    if (!p || !p.isAvailable) return null;

    p.isAvailable = false;
    p.respawnTimer = p.respawnTimeSeconds;
    p.meshGroup.visible = false;
    p.light.intensity = 0;

    sounds.playLevelUp();

    return {
      weaponId: p.weaponId,
      name: p.name
    };
  }

  public update(delta: number) {
    this.pickups.forEach((p) => {
      if (p.isAvailable) {
        // Spin and gentle hover
        const model = p.meshGroup.children[2];
        if (model) {
          model.rotation.y += delta * 1.8;
          model.position.y = 0.7 + Math.sin(Date.now() * 0.003) * 0.08;
        }
      } else {
        p.respawnTimer -= delta;
        if (p.respawnTimer <= 0) {
          p.isAvailable = true;
          p.meshGroup.visible = true;
          p.light.intensity = p.weaponId === 'ammo_crate' ? 2.5 : 3.0;
        }
      }
    });
  }

  public dispose() {
    this.pickups.forEach((p) => {
      this.scene.remove(p.meshGroup);
      p.meshGroup.traverse((c) => {
        if (c instanceof THREE.Mesh) {
          c.geometry.dispose();
          if (Array.isArray(c.material)) {
            c.material.forEach((m) => m.dispose());
          } else {
            c.material.dispose();
          }
        }
      });
    });
    this.pickups = [];
  }
}
