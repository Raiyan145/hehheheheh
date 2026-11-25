import * as THREE from 'three';
import { ThemeId, ThemePalette } from './types';
import {
  THEME_PALETTES,
  createGrassTexture,
  createHazardStripeTexture,
  createMetroSignTexture,
  createMetroWallTexture,
  createRoadTexture,
  createSidewalkTexture,
} from './textures';

export const LANE_X = [-2.6, 0, 2.6] as const;
export const CHUNK_LENGTH = 24;
export const NUM_CHUNKS = 10;

export type ObstacleKind = 'barrier' | 'overhead' | 'cones' | 'van' | 'trap';
export type CollectibleKind = 'coin' | 'boost';

export interface ObstacleInstance {
  mesh: THREE.Group;
  kind: ObstacleKind;
  lane: number; // 0, 1, 2
  localZ: number; // -24 .. 0
  minY: number;
  maxY: number;
  halfW: number;
  halfD: number;
  hit: boolean;
}

export interface CollectibleInstance {
  mesh: THREE.Group;
  kind: CollectibleKind;
  lane: number;
  localZ: number;
  baseY: number;
  collected: boolean;
}

export interface TrackChunk {
  group: THREE.Group;
  obstacles: ObstacleInstance[];
  collectibles: CollectibleInstance[];
  trees: THREE.Group[];
  buildings: THREE.Group[];
  lampLights: THREE.Mesh[];
  outdoor: THREE.Object3D[];
  metro: THREE.Group;
}

export class EndlessEnvironment {
  public readonly group = new THREE.Group();
  public chunks: TrackChunk[] = [];
  private palette: ThemePalette;
  private maxAnisotropy: number;

  // Shared materials & textures
  private roadMat!: THREE.MeshStandardMaterial;
  private sidewalkMat!: THREE.MeshStandardMaterial;
  private grassMat!: THREE.MeshStandardMaterial;
  private curbMat!: THREE.MeshStandardMaterial;
  private hazardMat!: THREE.MeshStandardMaterial;
  private woodMat!: THREE.MeshStandardMaterial;
  private metalDarkMat!: THREE.MeshStandardMaterial;
  private metalSilverMat!: THREE.MeshStandardMaterial;
  private coneOrangeMat!: THREE.MeshStandardMaterial;
  private coneWhiteMat!: THREE.MeshStandardMaterial;
  private coinMat!: THREE.MeshStandardMaterial;
  private boostMat!: THREE.MeshStandardMaterial;
  private boostCoreMat!: THREE.MeshStandardMaterial;
  private trunkMat!: THREE.MeshStandardMaterial;
  private fenceMat!: THREE.MeshStandardMaterial;
  private windowMat!: THREE.MeshStandardMaterial;
  private lampGlowMat!: THREE.MeshStandardMaterial;
  private metroWallMat!: THREE.MeshStandardMaterial;
  private metroCeilMat!: THREE.MeshStandardMaterial;
  private metroPillarMat!: THREE.MeshStandardMaterial;
  private metroLightMat!: THREE.MeshStandardMaterial;
  private metroSignMat!: THREE.MeshBasicMaterial;
  private metroWallTex!: THREE.CanvasTexture;
  private metroSignTex!: THREE.CanvasTexture;
  private trapSpikeMat!: THREE.MeshStandardMaterial;
  private trapBaseGeo = new THREE.BoxGeometry(1.7, 0.1, 0.7);
  private trapSpikeGeo = new THREE.ConeGeometry(0.1, 0.42, 6);
  private trainBodyGeo = new THREE.BoxGeometry(1.9, 2.2, 4.5);
  private trainWindowGeo = new THREE.BoxGeometry(1.94, 0.7, 3.9);
  private trainSkirtGeo = new THREE.BoxGeometry(1.8, 0.4, 4.4);
  private trainRoofGeo = new THREE.BoxGeometry(1.7, 0.16, 4.3);
  private trainLampGeo = new THREE.BoxGeometry(0.4, 0.28, 0.06);
  private vanBodyMats: THREE.MeshStandardMaterial[] = [];
  private foliageMats: THREE.MeshStandardMaterial[] = [];
  private buildingMats: THREE.MeshStandardMaterial[] = [];

  private roadTex!: THREE.CanvasTexture;
  private sidewalkTex!: THREE.CanvasTexture;
  private grassTex!: THREE.CanvasTexture;
  private hazardTex!: THREE.CanvasTexture;

  constructor(themeId: ThemeId, maxAnisotropy: number) {
    this.palette = THEME_PALETTES[themeId];
    this.maxAnisotropy = maxAnisotropy;
    this.initMaterials();
    this.buildChunks();
  }

  private initMaterials(): void {
    this.roadTex = createRoadTexture(this.palette, this.maxAnisotropy);
    this.sidewalkTex = createSidewalkTexture(this.palette, this.maxAnisotropy);
    this.grassTex = createGrassTexture(this.palette, this.maxAnisotropy);
    this.hazardTex = createHazardStripeTexture(this.maxAnisotropy);

    this.roadMat = new THREE.MeshStandardMaterial({
      map: this.roadTex,
      roughness: 0.88,
      metalness: 0.05,
    });
    this.sidewalkMat = new THREE.MeshStandardMaterial({
      map: this.sidewalkTex,
      roughness: 0.82,
      metalness: 0.02,
    });
    this.grassMat = new THREE.MeshStandardMaterial({
      map: this.grassTex,
      roughness: 0.95,
      metalness: 0.0,
    });
    this.curbMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.palette.curbColor),
      roughness: 0.78,
      metalness: 0.04,
    });
    this.hazardMat = new THREE.MeshStandardMaterial({
      map: this.hazardTex,
      roughness: 0.5,
      metalness: 0.1,
    });
    this.woodMat = new THREE.MeshStandardMaterial({
      color: 0x92400e,
      roughness: 0.85,
      metalness: 0.02,
    });
    this.metalDarkMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.42,
      metalness: 0.65,
    });
    this.metalSilverMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.28,
      metalness: 0.82,
    });
    this.coneOrangeMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.45,
      metalness: 0.05,
    });
    this.coneWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.35,
      metalness: 0.05,
    });
    this.coinMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xca8a04,
      emissiveIntensity: 0.25,
      roughness: 0.18,
      metalness: 0.9,
    });
    this.boostMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x22d3ee,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.4,
      transparent: true,
      opacity: 0.9,
    });
    this.boostCoreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x67e8f9,
      emissiveIntensity: 1.3,
      roughness: 0.1,
      metalness: 0.2,
    });
    this.trunkMat = new THREE.MeshStandardMaterial({
      color: 0x6b4423,
      roughness: 0.92,
      metalness: 0.0,
    });
    this.fenceMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.72,
      metalness: 0.04,
    });
    this.windowMat = new THREE.MeshStandardMaterial({
      color: this.palette.windowColor,
      emissive: this.palette.windowEmissive,
      emissiveIntensity: this.palette.windowEmissiveIntensity,
      roughness: 0.15,
      metalness: 0.4,
    });
    this.lampGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: this.palette.lampEmissive,
      emissiveIntensity: this.palette.lampEmissiveIntensity,
      roughness: 0.2,
      metalness: 0.1,
    });

    this.metroWallTex = createMetroWallTexture(this.maxAnisotropy);
    this.metroSignTex = createMetroSignTexture();
    this.metroWallMat = new THREE.MeshStandardMaterial({ map: this.metroWallTex, roughness: 0.3, metalness: 0.12 });
    this.metroCeilMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.7, metalness: 0.2 });
    this.metroPillarMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.35, metalness: 0.55 });
    this.metroLightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xf0f9ff,
      emissiveIntensity: 2.8,
      roughness: 0.2,
    });
    this.metroSignMat = new THREE.MeshBasicMaterial({ map: this.metroSignTex });
    this.trapSpikeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      emissive: 0xef4444,
      emissiveIntensity: 0.35,
      roughness: 0.25,
      metalness: 0.85,
    });

    this.vanBodyMats = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b].map(
      (c) =>
        new THREE.MeshStandardMaterial({
          color: c,
          roughness: 0.35,
          metalness: 0.25,
        })
    );

    this.foliageMats = this.palette.treeFoliage.map(
      (c) =>
        new THREE.MeshStandardMaterial({
          color: c,
          roughness: 0.88,
          metalness: 0.0,
        })
    );

    this.buildingMats = this.palette.buildingColors.map(
      (c) =>
        new THREE.MeshStandardMaterial({
          color: c,
          roughness: 0.82,
          metalness: 0.04,
        })
    );
  }

  public setTheme(themeId: ThemeId): void {
    this.palette = THEME_PALETTES[themeId];

    const newRoad = createRoadTexture(this.palette, this.maxAnisotropy);
    this.roadTex.dispose();
    this.roadTex = newRoad;
    this.roadMat.map = newRoad;
    this.roadMat.needsUpdate = true;

    const newSidewalk = createSidewalkTexture(this.palette, this.maxAnisotropy);
    this.sidewalkTex.dispose();
    this.sidewalkTex = newSidewalk;
    this.sidewalkMat.map = newSidewalk;
    this.sidewalkMat.needsUpdate = true;

    const newGrass = createGrassTexture(this.palette, this.maxAnisotropy);
    this.grassTex.dispose();
    this.grassTex = newGrass;
    this.grassMat.map = newGrass;
    this.grassMat.needsUpdate = true;

    const isMetro = this.palette.id === 'metro';
    for (const chunk of this.chunks) {
      chunk.metro.visible = isMetro;
      for (const o of chunk.outdoor) o.visible = !isMetro;
    }

    this.curbMat.color.set(this.palette.curbColor);
    this.windowMat.color.setHex(this.palette.windowColor);
    this.windowMat.emissive.setHex(this.palette.windowEmissive);
    this.windowMat.emissiveIntensity = this.palette.windowEmissiveIntensity;
    this.lampGlowMat.emissive.setHex(this.palette.lampEmissive);
    this.lampGlowMat.emissiveIntensity = this.palette.lampEmissiveIntensity;

    this.foliageMats.forEach((mat, i) => {
      mat.color.setHex(this.palette.treeFoliage[i % this.palette.treeFoliage.length]);
    });
    this.buildingMats.forEach((mat, i) => {
      mat.color.setHex(this.palette.buildingColors[i % this.palette.buildingColors.length]);
    });
  }

  private buildChunks(): void {
    for (let i = 0; i < NUM_CHUNKS; i++) {
      const chunk = this.createChunk(i);
      // Place chunk 0 covering [z = +24 to z = 0], chunk 1 [0 to -24], etc.
      chunk.group.position.z = CHUNK_LENGTH - i * CHUNK_LENGTH;
      this.group.add(chunk.group);
      this.chunks.push(chunk);

      // Keep first 2 chunks clean for an unobstructed launch!
      if (i >= 3) {
        this.populateObstacles(chunk, 0.35);
      }
    }
  }

  private createChunk(index: number): TrackChunk {
    const group = new THREE.Group();

    // 1. Main 3-lane Asphalt Road (y = 0)
    const roadGeo = new THREE.PlaneGeometry(8.6, CHUNK_LENGTH);
    const road = new THREE.Mesh(roadGeo, this.roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -CHUNK_LENGTH / 2);
    road.receiveShadow = true;
    group.add(road);

    // 2. Curbs (raised +0.07 above road)
    const curbGeo = new THREE.BoxGeometry(0.36, 0.14, CHUNK_LENGTH);
    const leftCurb = new THREE.Mesh(curbGeo, this.curbMat);
    leftCurb.position.set(-4.48, 0.07, -CHUNK_LENGTH / 2);
    leftCurb.receiveShadow = true;
    const rightCurb = new THREE.Mesh(curbGeo, this.curbMat);
    rightCurb.position.set(4.48, 0.07, -CHUNK_LENGTH / 2);
    rightCurb.receiveShadow = true;
    group.add(leftCurb, rightCurb);

    // 3. Sidewalks (y = 0.05)
    const sidewalkGeo = new THREE.BoxGeometry(3.8, 0.1, CHUNK_LENGTH);
    const leftWalk = new THREE.Mesh(sidewalkGeo, this.sidewalkMat);
    leftWalk.position.set(-6.55, 0.05, -CHUNK_LENGTH / 2);
    leftWalk.receiveShadow = true;
    const rightWalk = new THREE.Mesh(sidewalkGeo, this.sidewalkMat);
    rightWalk.position.set(6.55, 0.05, -CHUNK_LENGTH / 2);
    rightWalk.receiveShadow = true;
    group.add(leftWalk, rightWalk);

    // 4. Outer Grass / Horizon Ground (y = -0.02 to prevent Z-fighting)
    const grassGeo = new THREE.PlaneGeometry(75, CHUNK_LENGTH);
    const leftGrass = new THREE.Mesh(grassGeo, this.grassMat);
    leftGrass.rotation.x = -Math.PI / 2;
    leftGrass.position.set(-45.95, -0.02, -CHUNK_LENGTH / 2);
    leftGrass.receiveShadow = true;
    const rightGrass = new THREE.Mesh(grassGeo, this.grassMat);
    rightGrass.rotation.x = -Math.PI / 2;
    rightGrass.position.set(45.95, -0.02, -CHUNK_LENGTH / 2);
    rightGrass.receiveShadow = true;
    group.add(leftGrass, rightGrass);
    const outdoor: THREE.Object3D[] = [leftGrass, rightGrass];

    const trees: THREE.Group[] = [];
    const buildings: THREE.Group[] = [];
    const lampLights: THREE.Mesh[] = [];

    // 5. Roadside Scenery: Streetlamps, Picket Fences, Multi-part Trees & Buildings
    for (const side of [-1, 1] as const) {
      // Streetlamp every chunk on alternating sides
      const lamp = this.createStreetLamp(side);
      lamp.position.set(side * 4.9, 0.1, -CHUNK_LENGTH * 0.5);
      group.add(lamp);
      outdoor.push(lamp);

      // Picket fence stretch
      const fence = this.createFenceSegment();
      fence.position.set(side * 8.35, 0.1, -CHUNK_LENGTH * 0.5);
      group.add(fence);
      outdoor.push(fence);

      // 2 Multi-part Trees per side
      for (let t = 0; t < 2; t++) {
        const tree = this.createTree((index + t + (side > 0 ? 1 : 0)) % this.foliageMats.length);
        const zPos = -4.5 - t * 12 + (Math.random() - 0.5) * 2;
        tree.position.set(side * (9.8 + Math.random() * 1.4), 0, zPos);
        const s = 0.88 + Math.random() * 0.28;
        tree.scale.setScalar(s);
        group.add(tree);
        trees.push(tree);
        outdoor.push(tree);
      }

      // 2 Multi-part Buildings / Townhouses set back beyond the parkway
      for (let b = 0; b < 2; b++) {
        const bldg = this.createBuilding((index * 2 + b + (side > 0 ? 2 : 0)) % this.buildingMats.length, side);
        bldg.position.set(side * (15.5 + Math.random() * 1.6), 0, -6 - b * 12);
        group.add(bldg);
        buildings.push(bldg);
        outdoor.push(bldg);
      }
    }

    const metro = this.createMetroSegment();
    group.add(metro);
    const isMetro = this.palette.id === 'metro';
    metro.visible = isMetro;
    for (const o of outdoor) o.visible = !isMetro;

    return {
      group,
      obstacles: [],
      collectibles: [],
      trees,
      buildings,
      lampLights,
      outdoor,
      metro,
    };
  }

  private createMetroSegment(): THREE.Group {
    const g = new THREE.Group();
    const L = CHUNK_LENGTH;

    for (const side of [-1, 1] as const) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 9, L), this.metroWallMat);
      wall.position.set(side * 8.6, 4.5, -L / 2);
      g.add(wall);

      const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), this.metroSignMat);
      sign.position.set(side * 8.29, 4.2, -L * 0.5);
      sign.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      g.add(sign);

      for (const z of [-L * 0.25, -L * 0.75]) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 9, 0.7), this.metroPillarMat);
        pillar.position.set(side * 6.2, 4.5, z);
        g.add(pillar);
      }
    }

    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(18, 0.5, L), this.metroCeilMat);
    ceiling.position.set(0, 9.1, -L / 2);
    g.add(ceiling);

    for (const lx of [-4.6, 0, 4.6]) {
      const tube = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, L - 1.2), this.metroLightMat);
      tube.position.set(lx, 8.78, -L / 2);
      g.add(tube);
    }

    // Steel rails along each of the 3 lanes
    const railGeo = new THREE.BoxGeometry(0.12, 0.16, L);
    for (const lx of LANE_X) {
      for (const dx of [-0.55, 0.55]) {
        const rail = new THREE.Mesh(railGeo, this.metalSilverMat);
        rail.position.set(lx + dx, 0.08, -L / 2);
        g.add(rail);
      }
    }
    return g;
  }

  private createTrapMesh(): THREE.Group {
    const g = new THREE.Group();
    const base = new THREE.Mesh(this.trapBaseGeo, this.hazardMat);
    base.position.y = 0.05;
    g.add(base);
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 6; i++) {
        const spike = new THREE.Mesh(this.trapSpikeGeo, this.trapSpikeMat);
        spike.position.set(-0.7 + i * 0.28, 0.31, row === 0 ? -0.15 : 0.15);
        spike.castShadow = true;
        g.add(spike);
      }
    }
    return g;
  }

  private createTrainMesh(colorIdx: number): THREE.Group {
    const g = new THREE.Group();
    const body = new THREE.Mesh(this.trainBodyGeo, this.vanBodyMats[colorIdx % this.vanBodyMats.length]);
    body.position.y = 1.45;
    body.castShadow = true;
    const windows = new THREE.Mesh(this.trainWindowGeo, this.windowMat);
    windows.position.y = 1.85;
    const skirt = new THREE.Mesh(this.trainSkirtGeo, this.metalDarkMat);
    skirt.position.y = 0.28;
    const roof = new THREE.Mesh(this.trainRoofGeo, this.metalSilverMat);
    roof.position.y = 2.62;
    g.add(body, windows, skirt, roof);
    for (const lx of [-0.55, 0.55]) {
      const lamp = new THREE.Mesh(this.trainLampGeo, this.lampGlowMat);
      lamp.position.set(lx, 0.95, 2.27);
      g.add(lamp);
    }
    return g;
  }

  private createStreetLamp(side: -1 | 1): THREE.Group {
    const g = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.18, 0.35, 8),
      this.metalDarkMat
    );
    base.position.y = 0.175;

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 4.4, 8),
      this.metalDarkMat
    );
    pole.position.y = 2.35;
    pole.castShadow = true;

    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.08, 0.08),
      this.metalDarkMat
    );
    arm.position.set(-side * 0.5, 4.5, 0);

    const hood = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 0.18, 8),
      this.metalDarkMat
    );
    hood.position.set(-side * 0.95, 4.42, 0);

    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 10, 10),
      this.lampGlowMat
    );
    bulb.position.set(-side * 0.95, 4.3, 0);

    g.add(base, pole, arm, hood, bulb);
    return g;
  }

  private createFenceSegment(): THREE.Group {
    const g = new THREE.Group();
    const railTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.09, CHUNK_LENGTH - 0.6),
      this.fenceMat
    );
    railTop.position.y = 0.72;
    const railBot = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.09, CHUNK_LENGTH - 0.6),
      this.fenceMat
    );
    railBot.position.y = 0.3;
    g.add(railTop, railBot);

    const postGeo = new THREE.BoxGeometry(0.12, 0.92, 0.12);
    for (let z = -CHUNK_LENGTH / 2 + 1.5; z <= CHUNK_LENGTH / 2 - 1.5; z += 3.5) {
      const post = new THREE.Mesh(postGeo, this.fenceMat);
      post.position.set(0, 0.46, z);
      post.castShadow = true;
      g.add(post);
    }
    return g;
  }

  private createTree(matIdx: number): THREE.Group {
    const g = new THREE.Group();
    const foliageMat = this.foliageMats[matIdx];

    // Root flare + Trunk
    const rootFlare = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.42, 0.45, 7),
      this.trunkMat
    );
    rootFlare.position.y = 0.22;

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.28, 2.3, 8),
      this.trunkMat
    );
    trunk.position.y = 1.25;
    trunk.castShadow = true;

    // 3-tier composite foliage crown
    const crownBot = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.35, 0),
      foliageMat
    );
    crownBot.position.set(0, 2.7, 0);
    crownBot.castShadow = true;

    const crownMid = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.05, 0),
      foliageMat
    );
    crownMid.position.set(0.28, 3.6, -0.2);
    crownMid.castShadow = true;

    const crownTop = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.75, 0),
      foliageMat
    );
    crownTop.position.set(-0.2, 4.25, 0.15);
    crownTop.castShadow = true;

    g.add(rootFlare, trunk, crownBot, crownMid, crownTop);
    return g;
  }

  private createBuilding(matIdx: number, side: -1 | 1): THREE.Group {
    const g = new THREE.Group();
    const wallMat = this.buildingMats[matIdx];
    const width = 5.4 + Math.random() * 1.4;
    const depth = 8.5 + Math.random() * 1.8;
    const height = 6.0 + Math.random() * 5.0;

    // Plinth foundation
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.3, 0.5, depth + 0.3),
      this.curbMat
    );
    plinth.position.y = 0.25;

    // Main building volume
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      wallMat
    );
    body.position.y = height / 2 + 0.4;
    body.castShadow = true;
    body.receiveShadow = true;

    // Roof cornice / parapet
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.35, 0.45, depth + 0.35),
      this.metalDarkMat
    );
    roof.position.y = height + 0.55;

    // Storefront awning facing road (-side * X)
    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.22, depth * 0.65),
      this.vanBodyMats[matIdx % this.vanBodyMats.length]
    );
    awning.position.set(-side * (width / 2 + 0.45), 2.5, 0);
    awning.rotation.z = side * 0.22;

    g.add(plinth, body, roof, awning);

    // Road-facing windows
    const winGeo = new THREE.BoxGeometry(0.12, 1.05, 1.25);
    const floors = Math.max(1, Math.floor((height - 2) / 2.6));
    for (let f = 0; f < floors; f++) {
      for (let wz = -depth * 0.28; wz <= depth * 0.28; wz += depth * 0.56) {
        const win = new THREE.Mesh(winGeo, this.windowMat);
        win.position.set(-side * (width / 2 + 0.03), 3.6 + f * 2.5, wz);
        g.add(win);
      }
    }

    return g;
  }

  private createBarrierMesh(): THREE.Group {
    const g = new THREE.Group();
    // Sawhorse legs
    const legGeo = new THREE.BoxGeometry(0.12, 1.0, 0.14);
    for (const lx of [-0.85, 0.85]) {
      const legF = new THREE.Mesh(legGeo, this.woodMat);
      legF.position.set(lx, 0.48, -0.18);
      legF.rotation.x = 0.24;
      legF.castShadow = true;
      const legB = new THREE.Mesh(legGeo, this.woodMat);
      legB.position.set(lx, 0.48, 0.18);
      legB.rotation.x = -0.24;
      legB.castShadow = true;
      g.add(legF, legB);
    }

    // Striped top board (height ~ 1.05)
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.42, 0.14),
      this.hazardMat
    );
    board.position.y = 0.84;
    board.castShadow = true;
    board.receiveShadow = true;
    g.add(board);

    // Warning beacons on top corners
    const beaconGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.14, 10);
    for (const bx of [-0.8, 0.8]) {
      const b = new THREE.Mesh(beaconGeo, this.coneOrangeMat);
      b.position.set(bx, 1.12, 0);
      g.add(b);
    }
    return g;
  }

  private createOverheadMesh(): THREE.Group {
    const g = new THREE.Group();
    // Two side support posts (positioned at lane edges so player slides cleanly through middle!)
    const postGeo = new THREE.CylinderGeometry(0.09, 0.11, 2.75, 8);
    const leftPost = new THREE.Mesh(postGeo, this.metalSilverMat);
    leftPost.position.set(-1.05, 1.375, 0);
    leftPost.castShadow = true;
    const rightPost = new THREE.Mesh(postGeo, this.metalSilverMat);
    rightPost.position.set(1.05, 1.375, 0);
    rightPost.castShadow = true;

    // Foot plates
    const plateGeo = new THREE.BoxGeometry(0.35, 0.08, 0.35);
    const lp = new THREE.Mesh(plateGeo, this.metalDarkMat);
    lp.position.set(-1.05, 0.04, 0);
    const rp = new THREE.Mesh(plateGeo, this.metalDarkMat);
    rp.position.set(1.05, 0.04, 0);

    // Overhead clearance bar (bottom at y = 1.18 so standing hits it, sliding passes cleanly underneath!)
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(2.35, 1.25, 0.32),
      this.hazardMat
    );
    bar.position.y = 1.82;
    bar.castShadow = true;

    const topCap = new THREE.Mesh(
      new THREE.BoxGeometry(2.45, 0.16, 0.4),
      this.metalDarkMat
    );
    topCap.position.y = 2.52;

    g.add(leftPost, rightPost, lp, rp, bar, topCap);
    return g;
  }

  private createConesMesh(): THREE.Group {
    const g = new THREE.Group();
    const offsets = [-0.55, 0, 0.55];
    for (let i = 0; i < offsets.length; i++) {
      const cg = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.07, 0.46),
        this.coneOrangeMat
      );
      base.position.y = 0.035;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.78, 12),
        this.coneOrangeMat
      );
      cone.position.y = 0.44;
      cone.castShadow = true;
      const collar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.105, 0.145, 0.18, 12),
        this.coneWhiteMat
      );
      collar.position.y = 0.46;
      cg.add(base, cone, collar);
      cg.position.set(offsets[i], 0, i === 1 ? -0.18 : 0.14);
      g.add(cg);
    }
    return g;
  }

  private createVanMesh(colorIdx: number): THREE.Group {
    const g = new THREE.Group();
    const bodyMat = this.vanBodyMats[colorIdx % this.vanBodyMats.length];

    // Cargo box + Cab
    const cargo = new THREE.Mesh(
      new THREE.BoxGeometry(2.05, 1.95, 3.3),
      bodyMat
    );
    cargo.position.set(0, 1.38, 0.35);
    cargo.castShadow = true;
    cargo.receiveShadow = true;

    const cab = new THREE.Mesh(
      new THREE.BoxGeometry(1.92, 1.35, 1.35),
      bodyMat
    );
    cab.position.set(0, 1.08, -1.75);
    cab.castShadow = true;

    // Windshield facing player (+Z? Wait: van faces player, so front of van is at +Z!)
    // Actually let's orient the van facing toward +Z (coming/parked facing the player) or -Z:
    // Let's make cab at +Z facing the player so windshield & headlights are visible!
    cab.position.set(0, 1.08, 1.75);
    cargo.position.set(0, 1.38, -0.35);

    const windshield = new THREE.Mesh(
      new THREE.BoxGeometry(1.68, 0.62, 0.1),
      this.windowMat
    );
    windshield.position.set(0, 1.34, 2.41);

    const bumper = new THREE.Mesh(
      new THREE.BoxGeometry(2.04, 0.25, 0.22),
      this.metalDarkMat
    );
    bumper.position.set(0, 0.42, 2.42);

    const roofRack = new THREE.Mesh(
      new THREE.BoxGeometry(1.75, 0.12, 2.9),
      this.metalSilverMat
    );
    roofRack.position.set(0, 2.41, -0.35);

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 14);
    const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 10);
    const wheelPos: [number, number][] = [
      [-0.95, 1.45],
      [0.95, 1.45],
      [-0.95, -1.35],
      [0.95, -1.35],
    ];
    for (const [wx, wz] of wheelPos) {
      const wheel = new THREE.Mesh(wheelGeo, this.metalDarkMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.38, wz);
      const hub = new THREE.Mesh(hubGeo, this.metalSilverMat);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(wx, 0.38, wz);
      g.add(wheel, hub);
    }

    // Headlights
    const lightGeo = new THREE.BoxGeometry(0.32, 0.2, 0.08);
    for (const lx of [-0.68, 0.68]) {
      const hl = new THREE.Mesh(lightGeo, this.lampGlowMat);
      hl.position.set(lx, 0.72, 2.43);
      g.add(hl);
    }

    g.add(cargo, cab, windshield, bumper, roofRack);
    return g;
  }

  private createCoinMesh(): THREE.Group {
    const g = new THREE.Group();
    const coin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.1, 16),
      this.coinMat
    );
    coin.rotation.x = Math.PI / 2;
    coin.castShadow = true;

    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.04, 6, 16),
      this.coinMat
    );
    innerRing.position.z = 0.04;

    g.add(coin, innerRing);
    return g;
  }

  private createBoostMesh(): THREE.Group {
    const g = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.42, 0),
      this.boostCoreMat
    );
    const shell = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.06, 8, 20),
      this.boostMat
    );
    g.add(core, shell);
    return g;
  }

  private clearChunkEntities(chunk: TrackChunk): void {
    for (const obs of chunk.obstacles) {
      chunk.group.remove(obs.mesh);
    }
    for (const col of chunk.collectibles) {
      chunk.group.remove(col.mesh);
    }
    chunk.obstacles = [];
    chunk.collectibles = [];
  }

  public populateObstacles(chunk: TrackChunk, difficulty: number): void {
    this.clearChunkEntities(chunk);

    // Two rows per 24-unit chunk: z = -6 and z = -18
    const rowZs = [-6, -18];

    for (const rowZ of rowZs) {
      const numBlockers = Math.random() < 0.38 + difficulty * 0.3 ? 2 : 1;
      const lanes = [0, 1, 2];
      // Shuffle lanes
      for (let i = lanes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
      }

      const blockedLanes = lanes.slice(0, numBlockers);
      const freeLane = lanes[numBlockers] ?? lanes[2];

      let vanUsedInRow = false;

      for (const lane of blockedLanes) {
        const roll = Math.random();
        let kind: ObstacleKind;
        if (roll < 0.26) kind = 'barrier';
        else if (roll < 0.5) kind = 'overhead';
        else if (roll < 0.64) kind = 'cones';
        else if (roll < 0.86 || vanUsedInRow) kind = 'trap';
        else {
          kind = 'van';
          vanUsedInRow = true;
        }

        let mesh: THREE.Group;
        let minY = 0;
        let maxY = 1.05;
        let halfW = 0.88;
        let halfD = 0.45;

        if (kind === 'barrier') {
          mesh = this.createBarrierMesh();
          maxY = 1.02;
        } else if (kind === 'overhead') {
          mesh = this.createOverheadMesh();
          minY = 1.15; // Player stands at 1.85m, slides at 0.88m!
          maxY = 2.6;
          halfW = 0.9;
        } else if (kind === 'cones') {
          mesh = this.createConesMesh();
          maxY = 0.85;
          halfW = 0.78;
        } else if (kind === 'trap') {
          mesh = this.createTrapMesh();
          maxY = 0.5;
          halfW = 0.85;
          halfD = 0.38;
        } else {
          const vi = Math.floor(Math.random() * 4);
          mesh = this.palette.id === 'metro' ? this.createTrainMesh(vi) : this.createVanMesh(vi);
          maxY = 2.45;
          halfW = 0.92;
          halfD = 2.25;
        }

        mesh.position.set(LANE_X[lane], 0, rowZ);
        chunk.group.add(mesh);
        chunk.obstacles.push({
          mesh,
          kind,
          lane,
          localZ: rowZ,
          minY,
          maxY,
          halfW,
          halfD,
          hit: false,
        });

        // Add rewarding arc of coins over barriers or low line under overhead gates!
        if ((kind === 'barrier' || kind === 'trap') && Math.random() < 0.65) {
          for (let k = -1; k <= 1; k++) {
            const coin = this.createCoinMesh();
            const cz = rowZ + k * 1.4;
            const cy = k === 0 ? 2.05 : 1.55;
            coin.position.set(LANE_X[lane], cy, cz);
            chunk.group.add(coin);
            chunk.collectibles.push({
              mesh: coin,
              kind: 'coin',
              lane,
              localZ: cz,
              baseY: cy,
              collected: false,
            });
          }
        } else if (kind === 'overhead' && Math.random() < 0.65) {
          for (let k = -1; k <= 1; k++) {
            const coin = this.createCoinMesh();
            const cz = rowZ + k * 1.5;
            coin.position.set(LANE_X[lane], 0.55, cz);
            chunk.group.add(coin);
            chunk.collectibles.push({
              mesh: coin,
              kind: 'coin',
              lane,
              localZ: cz,
              baseY: 0.55,
              collected: false,
            });
          }
        }
      }

      // Coin line or rare Sprint Boost in the open free lane
      if (Math.random() < 0.11) {
        const boost = this.createBoostMesh();
        boost.position.set(LANE_X[freeLane], 1.1, rowZ);
        chunk.group.add(boost);
        chunk.collectibles.push({
          mesh: boost,
          kind: 'boost',
          lane: freeLane,
          localZ: rowZ,
          baseY: 1.1,
          collected: false,
        });
      } else if (Math.random() < 0.72) {
        for (let k = -1; k <= 1; k++) {
          const coin = this.createCoinMesh();
          const cz = rowZ + k * 1.65;
          coin.position.set(LANE_X[freeLane], 0.95, cz);
          chunk.group.add(coin);
          chunk.collectibles.push({
            mesh: coin,
            kind: 'coin',
            lane: freeLane,
            localZ: cz,
            baseY: 0.95,
            collected: false,
          });
        }
      }
    }
  }

  public reset(): void {
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      chunk.group.position.z = CHUNK_LENGTH - i * CHUNK_LENGTH;
      if (i >= 3) {
        this.populateObstacles(chunk, 0.25);
      } else {
        this.clearChunkEntities(chunk);
      }
    }
  }

  public update(dt: number, speed: number, elapsed: number, difficulty: number, allowObstacles = true): void {
    const moveZ = speed * dt;

    // Move all chunks toward +Z (so player effectively sprints toward -Z)
    let minZ = Infinity;
    for (const chunk of this.chunks) {
      chunk.group.position.z += moveZ;
      if (chunk.group.position.z < minZ) {
        minZ = chunk.group.position.z;
      }
    }

    // Recycle chunks that passed behind the camera (+Z > CHUNK_LENGTH * 1.35)
    for (const chunk of this.chunks) {
      if (chunk.group.position.z > CHUNK_LENGTH * 1.35) {
        chunk.group.position.z = minZ - CHUNK_LENGTH;
        minZ = chunk.group.position.z;
        if (allowObstacles) {
          this.populateObstacles(chunk, difficulty);
        } else {
          this.clearChunkEntities(chunk);
        }
      }

      // Spin & bob collectibles
      for (const col of chunk.collectibles) {
        if (col.collected) continue;
        col.mesh.rotation.y += dt * 3.2;
        col.mesh.position.y = col.baseY + Math.sin(elapsed * 4.5 + col.localZ) * 0.12;
      }
    }
  }

  public dispose(): void {
    this.roadTex.dispose();
    this.sidewalkTex.dispose();
    this.grassTex.dispose();
    this.hazardTex.dispose();
    this.metroWallTex.dispose();
    this.metroSignTex.dispose();

    const mats = [
      this.roadMat,
      this.sidewalkMat,
      this.grassMat,
      this.curbMat,
      this.hazardMat,
      this.woodMat,
      this.metalDarkMat,
      this.metalSilverMat,
      this.coneOrangeMat,
      this.coneWhiteMat,
      this.coinMat,
      this.boostMat,
      this.boostCoreMat,
      this.trunkMat,
      this.fenceMat,
      this.windowMat,
      this.lampGlowMat,
      this.metroWallMat,
      this.metroCeilMat,
      this.metroPillarMat,
      this.metroLightMat,
      this.metroSignMat,
      this.trapSpikeMat,
      ...this.vanBodyMats,
      ...this.foliageMats,
      ...this.buildingMats,
    ];
    mats.forEach((m) => m.dispose());

    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
      }
    });
  }
}
