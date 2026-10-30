import * as THREE from 'three';
import { sounds } from '../audio/soundManager';

export interface ActiveTracer {
  mesh: THREE.Line;
  start: THREE.Vector3;
  target: THREE.Vector3;
  progress: number;
  speed: number;
}

export interface ActiveParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  fadeColor?: boolean;
}

export interface ActiveGrenade {
  mesh: THREE.Group;
  velocity: THREE.Vector3;
  timer: number;
  throwerId: string;
  isAlly: boolean;
}

export class EffectsManager {
  private scene: THREE.Scene;
  private tracers: ActiveTracer[] = [];
  private particles: ActiveParticle[] = [];
  public grenades: ActiveGrenade[] = [];
  private muzzleFlashLight: THREE.PointLight;
  private flashDuration = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Dynamic Muzzle Flash light
    this.muzzleFlashLight = new THREE.PointLight(0xffaa44, 0, 8);
    this.scene.add(this.muzzleFlashLight);
  }

  public triggerMuzzleFlash(position: THREE.Vector3) {
    this.muzzleFlashLight.position.copy(position);
    this.muzzleFlashLight.intensity = 3.5;
    this.flashDuration = 0.05;
  }

  public addBulletTracer(origin: THREE.Vector3, target: THREE.Vector3) {
    const points = [origin.clone(), origin.clone()];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0xffe066,
      linewidth: 2,
      transparent: true,
      opacity: 0.9
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);

    this.tracers.push({
      mesh: line,
      start: origin.clone(),
      target: target.clone(),
      progress: 0,
      speed: 90
    });
  }

  public addImpactSparks(position: THREE.Vector3, normal: THREE.Vector3) {
    const count = 5;
    for (let i = 0; i < count; i++) {
      const geo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffaa22 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);

      const vel = normal.clone().multiplyScalar(3 + Math.random() * 2);
      vel.x += (Math.random() - 0.5) * 4;
      vel.y += Math.random() * 3;
      vel.z += (Math.random() - 0.5) * 4;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.15
      });
    }
  }

  public addBloodSplat(position: THREE.Vector3) {
    const count = 7;
    for (let i = 0; i < count; i++) {
      const geo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
      const mat = new THREE.MeshBasicMaterial({ color: 0x990000 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 2 + 1,
        (Math.random() - 0.5) * 3
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.2
      });
    }
  }

  public spawnGrenade(origin: THREE.Vector3, direction: THREE.Vector3, throwerId: string, isAlly: boolean) {
    sounds.playGrenadePin();

    const group = new THREE.Group();
    // Olive cylindrical grenade body
    const bodyGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.18, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3d4a36, roughness: 0.8 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Pin cap
    const capGeo = new THREE.BoxGeometry(0.05, 0.06, 0.05);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.11;
    group.add(cap);

    group.position.copy(origin);
    this.scene.add(group);

    const initialVelocity = direction.clone().multiplyScalar(16);
    initialVelocity.y += 4.5; // upward arc

    this.grenades.push({
      mesh: group,
      velocity: initialVelocity,
      timer: 3.2,
      throwerId,
      isAlly
    });
  }

  public spawnExplosion(position: THREE.Vector3) {
    sounds.playExplosion();

    // 1. Shockwave Fireball
    const fireGeo = new THREE.SphereGeometry(1.2, 12, 12);
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.95 });
    const fireball = new THREE.Mesh(fireGeo, fireMat);
    fireball.position.copy(position);
    this.scene.add(fireball);

    this.particles.push({
      mesh: fireball,
      velocity: new THREE.Vector3(0, 0.8, 0),
      life: 0,
      maxLife: 0.45,
      fadeColor: true
    });

    // 2. Smoke debris debris chunks
    for (let i = 0; i < 18; i++) {
      const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const col = Math.random() > 0.5 ? 0x222222 : 0x555555;
      const mat = new THREE.MeshBasicMaterial({ color: col });
      const chunk = new THREE.Mesh(geo, mat);
      chunk.position.copy(position);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        Math.random() * 8 + 3,
        (Math.random() - 0.5) * 12
      );

      this.scene.add(chunk);
      this.particles.push({
        mesh: chunk,
        velocity: vel,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.4
      });
    }
  }

  public update(
    delta: number,
    onGrenadeExplode?: (g: ActiveGrenade, pos: THREE.Vector3) => void
  ) {
    // 1. Muzzle Flash decay
    if (this.flashDuration > 0) {
      this.flashDuration -= delta;
      if (this.flashDuration <= 0) {
        this.muzzleFlashLight.intensity = 0;
      }
    }

    // 2. Update Tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.progress += delta * t.speed;
      const dist = t.start.distanceTo(t.target);
      if (t.progress >= dist) {
        this.scene.remove(t.mesh);
        t.mesh.geometry.dispose();
        (t.mesh.material as THREE.Material).dispose();
        this.tracers.splice(i, 1);
      } else {
        const head = t.start.clone().lerp(t.target, Math.min(1, t.progress / dist));
        const tailProgress = Math.max(0, (t.progress - 4) / dist);
        const tail = t.start.clone().lerp(t.target, tailProgress);

        const positions = (t.mesh.geometry as THREE.BufferGeometry).attributes.position;
        positions.setXYZ(0, tail.x, tail.y, tail.z);
        positions.setXYZ(1, head.x, head.y, head.z);
        positions.needsUpdate = true;
      }
    }

    // 3. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;
      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.velocity.y -= 15 * delta; // gravity
      p.mesh.position.addScaledVector(p.velocity, delta);

      // Bounce on ground
      if (p.mesh.position.y <= 0.05) {
        p.mesh.position.y = 0.05;
        p.velocity.y *= -0.3;
        p.velocity.x *= 0.6;
        p.velocity.z *= 0.6;
      }

      // Scale down or fade
      const scale = 1 - p.life / p.maxLife;
      p.mesh.scale.set(scale, scale, scale);
    }

    // 4. Update Grenades
    for (let i = this.grenades.length - 1; i >= 0; i--) {
      const g = this.grenades[i];
      g.timer -= delta;

      // Gravity & air resistance
      g.velocity.y -= 19.6 * delta;
      g.mesh.position.addScaledVector(g.velocity, delta);
      g.mesh.rotation.x += delta * 10;
      g.mesh.rotation.z += delta * 8;

      // Ground bounce
      if (g.mesh.position.y <= 0.1) {
        g.mesh.position.y = 0.1;
        if (Math.abs(g.velocity.y) > 2) {
          sounds.playGrenadeBounce();
        }
        g.velocity.y *= -0.45;
        g.velocity.x *= 0.7;
        g.velocity.z *= 0.7;
      }

      // Explode
      if (g.timer <= 0) {
        const explodePos = g.mesh.position.clone();
        this.scene.remove(g.mesh);
        this.spawnExplosion(explodePos);
        if (onGrenadeExplode) {
          onGrenadeExplode(g, explodePos);
        }
        this.grenades.splice(i, 1);
      }
    }
  }

  public dispose() {
    this.tracers.forEach((t) => {
      this.scene.remove(t.mesh);
      t.mesh.geometry.dispose();
      (t.mesh.material as THREE.Material).dispose();
    });
    this.tracers = [];

    this.particles.forEach((p) => {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    });
    this.particles = [];

    this.grenades.forEach((g) => {
      this.scene.remove(g.mesh);
    });
    this.grenades = [];

    this.scene.remove(this.muzzleFlashLight);
  }
}
