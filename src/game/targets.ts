import * as THREE from 'three';
import { MapId } from '../types/game';
import { sounds } from '../audio/soundManager';
import { EffectsManager } from './effects';

export interface TargetEntity {
  id: string;
  group: THREE.Group;
  hinge: THREE.Group;
  headMesh: THREE.Mesh;
  bodyMesh: THREE.Mesh;
  bullseyeMesh: THREE.Mesh;
  position: THREE.Vector3;
  baseRotationY: number;
  isKnockedDown: boolean;
  knockDownTimer: number;
  health: number;
  maxHealth: number;
  isMoving: boolean;
  moveAxis: 'x' | 'z';
  moveRange: number;
  moveSpeed: number;
  moveProgress: number;
}

export class TargetManager {
  public targets: TargetEntity[] = [];
  private scene: THREE.Scene;
  private mapId: MapId;
  private effects: EffectsManager;

  constructor(scene: THREE.Scene, mapId: MapId, effects: EffectsManager) {
    this.scene = scene;
    this.mapId = mapId;
    this.effects = effects;
    this.spawnMapTargets();
  }

  private spawnMapTargets() {
    // Generate tactical target positions for each map
    const targetSpawns: Array<{
      pos: [number, number, number];
      rotY: number;
      isMoving?: boolean;
      axis?: 'x' | 'z';
      range?: number;
      speed?: number;
    }> = [];

    if (this.mapId === 'nuketown') {
      targetSpawns.push(
        // West Green House front and backyard
        { pos: [-12, 0, -1], rotY: Math.PI / 2 },
        { pos: [-16, 0, 8], rotY: Math.PI / 2 },
        { pos: [-16, 0, -8], rotY: Math.PI / 2 },
        // West House 2nd floor window target
        { pos: [-12, 2.5, 0], rotY: Math.PI / 2 },

        // East Yellow House front and backyard
        { pos: [12, 0, 1], rotY: -Math.PI / 2 },
        { pos: [16, 0, -8], rotY: -Math.PI / 2 },
        { pos: [16, 0, 8], rotY: -Math.PI / 2 },
        // East House 2nd floor window target
        { pos: [12, 2.5, 0], rotY: -Math.PI / 2 },

        // Mid Bus and truck choke points
        { pos: [-3, 0, -3.5], rotY: 0 },
        { pos: [3, 0, -3.5], rotY: Math.PI },
        { pos: [-2, 0, 3.5], rotY: 0 },
        { pos: [2, 0, 3.5], rotY: Math.PI },

        // Moving targets traversing the central street
        { pos: [0, 0, -9], rotY: 0, isMoving: true, axis: 'x', range: 7, speed: 3.5 },
        { pos: [0, 0, 9], rotY: Math.PI, isMoving: true, axis: 'x', range: 7, speed: 3.5 }
      );
    } else if (this.mapId === 'shipment') {
      targetSpawns.push(
        // Four corners
        { pos: [-10, 0, -10], rotY: Math.PI / 4 },
        { pos: [10, 0, -10], rotY: -Math.PI / 4 },
        { pos: [-10, 0, 10], rotY: 3 * Math.PI / 4 },
        { pos: [10, 0, 10], rotY: -3 * Math.PI / 4 },

        // Container corridors
        { pos: [-4, 0, -6], rotY: 0 },
        { pos: [4, 0, -6], rotY: Math.PI },
        { pos: [-4, 0, 6], rotY: 0 },
        { pos: [4, 0, 6], rotY: Math.PI },

        // Center crossfire
        { pos: [-1.8, 0, 0], rotY: Math.PI / 2 },
        { pos: [1.8, 0, 0], rotY: -Math.PI / 2 },
        { pos: [0, 0, -1.8], rotY: 0 },
        { pos: [0, 0, 1.8], rotY: Math.PI },

        // Elevated container snipers
        { pos: [-6, 2.7, -6.8], rotY: Math.PI / 4 },
        { pos: [6, 2.7, 6.8], rotY: -3 * Math.PI / 4 },

        // Moving lane targets
        { pos: [-12, 0, 0], rotY: Math.PI / 2, isMoving: true, axis: 'z', range: 8, speed: 4.2 },
        { pos: [12, 0, 0], rotY: -Math.PI / 2, isMoving: true, axis: 'z', range: 8, speed: 4.2 }
      );
    } else if (this.mapId === 'rust') {
      // Rust Refinery
      targetSpawns.push(
        // Central Watchtower upper catwalk
        { pos: [0, 6.8, -1.8], rotY: 0 },
        { pos: [0, 6.8, 1.8], rotY: Math.PI },
        { pos: [-1.8, 6.8, 0], rotY: Math.PI / 2 },
        { pos: [1.8, 6.8, 0], rotY: -Math.PI / 2 },

        // Base legs
        { pos: [-3, 0, -3], rotY: Math.PI / 4 },
        { pos: [3, 0, 3], rotY: -3 * Math.PI / 4 },

        // Fuel Silos platforms
        { pos: [-14, 0, -14], rotY: Math.PI / 4 },
        { pos: [14, 0, -14], rotY: -Math.PI / 4 },
        { pos: [-14, 0, 14], rotY: 3 * Math.PI / 4 },
        { pos: [14, 0, 14], rotY: -3 * Math.PI / 4 },

        // Moving perimeter target
        { pos: [0, 0, -13], rotY: 0, isMoving: true, axis: 'x', range: 9, speed: 3.8 },
        { pos: [0, 0, 13], rotY: Math.PI, isMoving: true, axis: 'x', range: 9, speed: 3.8 }
      );
    } else if (this.mapId === 'terminal') {
      // Terminal Concourse
      targetSpawns.push(
        // West Departure Gate
        { pos: [-18, 0, -5], rotY: Math.PI / 2 },
        { pos: [-18, 0, 5], rotY: Math.PI / 2 },
        { pos: [-19, 3.8, 0], rotY: Math.PI / 2 }, // Mezzanine sniper

        // East Arrival Gate
        { pos: [18, 0, -5], rotY: -Math.PI / 2 },
        { pos: [18, 0, 5], rotY: -Math.PI / 2 },
        { pos: [19, 3.8, 0], rotY: -Math.PI / 2 }, // Mezzanine sniper

        // Central Luggage Carousels
        { pos: [-3, 0, -3.5], rotY: 0 },
        { pos: [3, 0, -3.5], rotY: Math.PI },
        { pos: [-3, 0, 3.5], rotY: 0 },
        { pos: [3, 0, 3.5], rotY: Math.PI },

        // Duty-Free corridor moving targets
        { pos: [0, 0, -14], rotY: 0, isMoving: true, axis: 'x', range: 10, speed: 4.0 },
        { pos: [0, 0, 14], rotY: Math.PI, isMoving: true, axis: 'x', range: 10, speed: 4.0 }
      );
    } else {
      // Raid Estate
      targetSpawns.push(
        // North Villa Terrace & Balcony
        { pos: [0, 0, -14], rotY: Math.PI },
        { pos: [-6, 0, -14], rotY: Math.PI },
        { pos: [6, 0, -14], rotY: Math.PI },
        { pos: [0, 3.8, -17], rotY: Math.PI }, // Balcony sniper

        // South Guest Villa Terrace & Balcony
        { pos: [0, 0, 14], rotY: 0 },
        { pos: [-6, 0, 14], rotY: 0 },
        { pos: [6, 0, 14], rotY: 0 },
        { pos: [0, 3.8, 17], rotY: 0 }, // Balcony sniper

        // Roman Pool Edge Covers
        { pos: [-5, 0, 0], rotY: Math.PI / 2 },
        { pos: [5, 0, 0], rotY: -Math.PI / 2 },

        // Colonnade & Garage moving targets
        { pos: [-18, 0, 0], rotY: Math.PI / 2, isMoving: true, axis: 'z', range: 8, speed: 3.8 },
        { pos: [18, 0, 0], rotY: -Math.PI / 2, isMoving: true, axis: 'z', range: 8, speed: 3.8 }
      );
    }

    targetSpawns.forEach((spawn, idx) => {
      const target = this.createTacticalTarget(
        `target_${idx + 1}`,
        new THREE.Vector3(...spawn.pos),
        spawn.rotY,
        spawn.isMoving,
        spawn.axis,
        spawn.range,
        spawn.speed
      );
      this.targets.push(target);
    });
  }

  private createTacticalTarget(
    id: string,
    pos: THREE.Vector3,
    rotY: number,
    isMoving = false,
    moveAxis: 'x' | 'z' = 'x',
    moveRange = 6,
    moveSpeed = 3
  ): TargetEntity {
    const root = new THREE.Group();
    root.position.copy(pos);
    root.rotation.y = rotY;

    // Metal Base stand
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.4 });
    const basePlate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.8), baseMat);
    basePlate.position.y = 0.04;
    basePlate.receiveShadow = true;
    root.add(basePlate);

    // Vertical Stand Pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), baseMat);
    pole.position.y = 0.28;
    root.add(pole);

    // Hinge Group (rotates down when hit)
    const hinge = new THREE.Group();
    hinge.position.y = 0.52; // hinge pivot height
    root.add(hinge);

    // Target materials
    const targetMat = new THREE.MeshStandardMaterial({
      color: 0x3d4349, // Tactical dark grey
      roughness: 0.6,
      metalness: 0.2
    });

    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x24272c, // Plate carrier
      roughness: 0.8
    });

    const headMat = new THREE.MeshStandardMaterial({
      color: 0xd49b6a, // Target head dummy
      roughness: 0.8
    });

    const bullseyeMat = new THREE.MeshBasicMaterial({
      color: 0xe03131 // Red center bullseye
    });

    // 1. Torso Silhouette Body
    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.72, 0.08), targetMat);
    bodyMesh.position.set(0, 0.42, 0);
    bodyMesh.castShadow = true;
    (bodyMesh as any).isTargetPart = true;
    (bodyMesh as any).targetId = id;
    (bodyMesh as any).isHead = false;
    hinge.add(bodyMesh);

    // Tactical vest plate
    const vestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.52, 0.1), plateMat);
    vestPlate.position.set(0, 0.44, 0.01);
    (vestPlate as any).isTargetPart = true;
    (vestPlate as any).targetId = id;
    (vestPlate as any).isHead = false;
    hinge.add(vestPlate);

    // Red Center Bullseye Ring
    const bullseyeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.11, 16), bullseyeMat);
    bullseyeMesh.rotation.x = Math.PI / 2;
    bullseyeMesh.position.set(0, 0.46, 0.02);
    (bullseyeMesh as any).isTargetPart = true;
    (bullseyeMesh as any).targetId = id;
    (bullseyeMesh as any).isHead = false;
    hinge.add(bullseyeMesh);

    // 2. Head Silhouette
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.1), headMat);
    headMesh.position.set(0, 0.94, 0);
    headMesh.castShadow = true;
    (headMesh as any).isTargetPart = true;
    (headMesh as any).targetId = id;
    (headMesh as any).isHead = true;
    hinge.add(headMesh);

    // Tactical Helmet on top of head
    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.14, 0.12), baseMat);
    helmet.position.set(0, 1.05, 0);
    (helmet as any).isTargetPart = true;
    (helmet as any).targetId = id;
    (helmet as any).isHead = true;
    hinge.add(helmet);

    // Yellow Headshot Bullseye
    const headBullseye = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.13, 12),
      new THREE.MeshBasicMaterial({ color: 0xffd43b })
    );
    headBullseye.rotation.x = Math.PI / 2;
    headBullseye.position.set(0, 0.94, 0.02);
    (headBullseye as any).isTargetPart = true;
    (headBullseye as any).targetId = id;
    (headBullseye as any).isHead = true;
    hinge.add(headBullseye);

    this.scene.add(root);

    return {
      id,
      group: root,
      hinge,
      headMesh,
      bodyMesh,
      bullseyeMesh,
      position: pos.clone(),
      baseRotationY: rotY,
      isKnockedDown: false,
      knockDownTimer: 0,
      health: 100,
      maxHealth: 100,
      isMoving,
      moveAxis,
      moveRange,
      moveSpeed,
      moveProgress: Math.random() * Math.PI * 2
    };
  }

  public getTargetMeshes(): THREE.Object3D[] {
    const list: THREE.Object3D[] = [];
    this.targets.forEach((t) => {
      if (!t.isKnockedDown) {
        t.hinge.traverse((child) => {
          if ((child as any).isTargetPart) {
            list.push(child);
          }
        });
      }
    });
    return list;
  }

  public hitTarget(
    targetId: string,
    damage: number,
    isHeadshot: boolean,
    hitPoint: THREE.Vector3
  ): { killed: boolean } {
    const target = this.targets.find((t) => t.id === targetId);
    if (!target || target.isKnockedDown) return { killed: false };

    // Metal hit sparks
    this.effects.addImpactSparks(hitPoint, new THREE.Vector3(0, 1, 0));

    target.health -= damage;

    if (isHeadshot || target.health <= 0) {
      // Knock down target
      target.isKnockedDown = true;
      target.knockDownTimer = 1.8; // Pop back up after 1.8s
      target.health = target.maxHealth;
      return { killed: true };
    }

    return { killed: false };
  }

  public update(delta: number) {
    this.targets.forEach((t) => {
      // 1. Moving target kinematics
      if (t.isMoving && !t.isKnockedDown) {
        t.moveProgress += delta * (t.moveSpeed / t.moveRange);
        const offset = Math.sin(t.moveProgress) * t.moveRange;
        if (t.moveAxis === 'x') {
          t.group.position.x = t.position.x + offset;
        } else {
          t.group.position.z = t.position.z + offset;
        }
      }

      // 2. Knockdown / Pop-up physics animation
      if (t.isKnockedDown) {
        // Drop backward smoothly
        t.hinge.rotation.x = THREE.MathUtils.damp(t.hinge.rotation.x, -Math.PI / 2, 18, delta);
        t.knockDownTimer -= delta;

        if (t.knockDownTimer <= 0) {
          // Reset target
          t.isKnockedDown = false;
        }
      } else {
        // Pop upright smoothly
        t.hinge.rotation.x = THREE.MathUtils.damp(t.hinge.rotation.x, 0, 14, delta);
      }
    });
  }

  public resetAll() {
    this.targets.forEach((t) => {
      t.isKnockedDown = false;
      t.hinge.rotation.x = 0;
      t.health = t.maxHealth;
    });
  }

  public dispose() {
    this.targets.forEach((t) => {
      this.scene.remove(t.group);
      t.group.traverse((c) => {
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
    this.targets = [];
  }
}
