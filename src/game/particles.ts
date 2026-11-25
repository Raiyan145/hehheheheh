import * as THREE from 'three';

interface ParticleItem {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  gravity: number;
  startScale: number;
  active: boolean;
}

const POOL_SIZE = 72;

export class ParticleSystem {
  public readonly group = new THREE.Group();
  private pool: ParticleItem[] = [];
  private sharedGeo: THREE.BoxGeometry;

  constructor() {
    this.sharedGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
    for (let i = 0; i < POOL_SIZE; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.4,
        metalness: 0.1,
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(this.sharedGeo, mat);
      mesh.visible = false;
      this.group.add(mesh);
      this.pool.push({
        mesh,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 0.4,
        gravity: 9.8,
        startScale: 1,
        active: false,
      });
    }
  }

  private spawnOne(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    colorHex: number,
    scale: number,
    maxLife: number,
    gravity: number,
    emissiveHex = 0x000000
  ): void {
    const slot = this.pool.find((p) => !p.active);
    if (!slot) return;

    slot.active = true;
    slot.life = maxLife;
    slot.maxLife = maxLife;
    slot.vx = vx;
    slot.vy = vy;
    slot.vz = vz;
    slot.gravity = gravity;
    slot.startScale = scale;

    slot.mesh.position.set(x, y, z);
    slot.mesh.scale.setScalar(scale);
    slot.mesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    slot.mesh.visible = true;

    const mat = slot.mesh.material as THREE.MeshStandardMaterial;
    mat.color.setHex(colorHex);
    mat.emissive.setHex(emissiveHex);
    mat.emissiveIntensity = emissiveHex ? 0.9 : 0;
    mat.opacity = 1;
  }

  public emitDust(x: number, y: number, z: number, count = 2): void {
    for (let i = 0; i < count; i++) {
      this.spawnOne(
        x + (Math.random() - 0.5) * 0.3,
        y + 0.08,
        z + (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 1.4,
        0.9 + Math.random() * 1.1,
        2.5 + Math.random() * 2.0,
        0xe2e8f0,
        0.55 + Math.random() * 0.35,
        0.28 + Math.random() * 0.14,
        2.5
      );
    }
  }

  public emitCoinBurst(x: number, y: number, z: number): void {
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const spd = 2.4 + Math.random() * 2.2;
      this.spawnOne(
        x,
        y,
        z,
        Math.cos(angle) * spd,
        2.5 + Math.random() * 2.8,
        Math.sin(angle) * spd,
        0xfacc15,
        0.75 + Math.random() * 0.4,
        0.42 + Math.random() * 0.16,
        10.5,
        0xf59e0b
      );
    }
  }

  public emitBoostBurst(x: number, y: number, z: number): void {
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const spd = 2.8 + Math.random() * 2.5;
      this.spawnOne(
        x,
        y,
        z,
        Math.cos(angle) * spd,
        2.8 + Math.random() * 3.0,
        Math.sin(angle) * spd,
        0x22d3ee,
        0.9,
        0.5,
        8.0,
        0x06b6d4
      );
    }
  }

  public emitImpactBurst(x: number, y: number, z: number): void {
    for (let i = 0; i < 12; i++) {
      this.spawnOne(
        x,
        y,
        z,
        (Math.random() - 0.5) * 5.5,
        2.0 + Math.random() * 4.0,
        (Math.random() - 0.5) * 5.5,
        i % 2 === 0 ? 0xef4444 : 0xf97316,
        0.95,
        0.48,
        14.0,
        0xef4444
      );
    }
  }

  public update(dt: number): void {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      p.vy -= p.gravity * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.rotation.x += dt * 6;
      p.mesh.rotation.y += dt * 7;

      const t = p.life / p.maxLife;
      p.mesh.scale.setScalar(p.startScale * t);
      (p.mesh.material as THREE.MeshStandardMaterial).opacity = t;
    }
  }

  public clear(): void {
    for (const p of this.pool) {
      p.active = false;
      p.mesh.visible = false;
    }
  }

  public dispose(): void {
    this.sharedGeo.dispose();
    for (const p of this.pool) {
      (p.mesh.material as THREE.Material).dispose();
    }
  }
}
