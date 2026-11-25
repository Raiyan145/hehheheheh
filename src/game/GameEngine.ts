import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  CharacterPose,
  CharacterRig,
  animateCharacterRig,
  createCharacterRig,
  disposeCharacterRig,
  updateCharacterRigConfig,
} from './characterMesh';
import { EndlessEnvironment, LANE_X } from './environment';
import { ParticleSystem } from './particles';
import { THEME_PALETTES, createSkyGradientTexture } from './textures';
import { soundEngine } from './audio';
import { PREMIUM_CHASERS, PREMIUM_PLAYER } from './storage';
import {
  ChaserConfig,
  GameMode,
  GameState,
  LiveStats,
  PlayerSettings,
  ScreenOverlay,
} from './types';

// Reusable module-scope math helpers (zero GC inside tick loop)
const _camTargetPos = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();
const _currentLookAt = new THREE.Vector3(0, 1.4, -6);

interface ChaserRuntime {
  config: ChaserConfig;
  rig: CharacterRig;
  lane: number;
  x: number;
  y: number;
  vy: number;
  z: number;
  slideTimer: number;
  phase: number;
  baseZOffset: number;
  laneTimer: number;
}

export interface EngineCallbacks {
  onLiveStats: (stats: LiveStats) => void;
  onGameStateChange: (state: GameState) => void;
  onContextLostChange?: (lost: boolean) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private settings: PlayerSettings;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private sunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private envTex: THREE.Texture | null = null;
  private skyTex: THREE.CanvasTexture | null = null;

  private environment!: EndlessEnvironment;
  private particles!: ParticleSystem;
  private playerRig!: CharacterRig;
  private chasers: ChaserRuntime[] = [];

  private isSoftwareGl = false;
  private frameId = 0;
  private disposed = false;
  private contextLost = false;
  private lastTime = performance.now();
  private elapsed = 0;

  // Game State
  public gameState: GameState = 'menu';
  public overlay: ScreenOverlay = 'main';
  private focusFriendIndex = 0;
  private mode: GameMode = 'custom';
  private appliedTheme: PlayerSettings['theme'] | null = null;
  private metroLight!: THREE.PointLight;

  // Modi's Power (Premium mode)
  private static readonly POWER_COOLDOWN = 20;
  private static readonly FLY_DURATION = 6;
  private static readonly FLY_HEIGHT = 4.4;
  private powerTimer = GameEngine.POWER_COOLDOWN; // counts down to ready
  private flyTimer = 0;
  private runTime = 0;
  private subtitle = '';
  private subtitleTimer = 0;
  private nextTauntAt = 14;

  // Player Physics
  private playerLane = 1; // 0, 1, 2
  private playerX = 0;
  private playerY = 0;
  private playerVy = 0;
  private slideTimer = 0;
  private stumbleTimer = 0;
  private invulnTimer = 0;
  private boostTimer = 0;
  private playerPhase = 0;
  private footstepAccum = 0;
  private jumpBufferTimer = 0;
  private slideBufferTimer = 0;

  // Run Metrics
  private speed = 15.5;
  private distance = 0;
  private score = 0;
  private coins = 0;
  private combo = 0;
  private comboTimer = 0;
  private chaseGap = 0.68; // 0 = caught, 1 = max lead
  private cameraShake = 0;
  private caughtTimer = 0;
  private caughtByName = '';
  private catcherIndex = 0;
  private statsThrottle = 0;

  /** Settings after applying the current mode (Premium forces fixed characters + metro). */
  private get look(): PlayerSettings {
    if (this.mode !== 'premium') return this.settings;
    return {
      ...this.settings,
      player: PREMIUM_PLAYER,
      chasers: PREMIUM_CHASERS,
      chaserCount: 4,
      theme: 'metro',
    };
  }

  public setMode(mode: GameMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    this.refreshLooks();
  }

  private refreshLooks(): void {
    const look = this.look;
    soundEngine.enabled = this.settings.soundEnabled;
    updateCharacterRigConfig(this.playerRig, look.player);

    if (look.chaserCount !== this.chasers.length) {
      this.rebuildChasers();
    } else {
      for (let i = 0; i < this.chasers.length; i++) {
        this.chasers[i].config = look.chasers[i];
        updateCharacterRigConfig(this.chasers[i].rig, look.chasers[i]);
      }
    }

    if (look.theme !== this.appliedTheme) {
      this.applyTheme(look.theme);
    }
  }

  constructor(
    container: HTMLElement,
    initialSettings: PlayerSettings,
    callbacks: EngineCallbacks
  ) {
    this.container = container;
    this.settings = initialSettings;
    this.callbacks = callbacks;

    this.initRenderer();
    this.initScene();
    this.initActors();
    this.applyTheme(this.look.theme);

    window.addEventListener('resize', this.handleResize);
    this.startLoop();
  }

  private detectSoftwareGl(): boolean {
    try {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      return true;
    }
  }

  private initRenderer(): void {
    this.isSoftwareGl = this.detectSoftwareGl();
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);

    const canvas = this.renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.addEventListener('webglcontextlost', this.handleContextLost);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored);

    this.container.innerHTML = '';
    this.container.appendChild(canvas);
  }

  private initScene(): void {
    this.scene = new THREE.Scene();

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envTex;
    pmremGenerator.dispose();

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 220);
    this.camera.position.set(0, 5.1, 10.6);
    this.camera.lookAt(0, 1.4, -6);

    // Balanced outdoor 3-point/sky rig: warm key sun + cool hemisphere fill
    this.hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x4d7c0f, 0.85);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff5dc, 2.1);
    this.sunLight.position.set(16, 26, 12);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 2;
    this.sunLight.shadow.camera.far = 75;
    const d = 22;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.sunLight.target.position.set(0, 0, -6);
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.environment = new EndlessEnvironment(this.settings.theme, maxAniso);
    this.scene.add(this.environment.group);

    this.particles = new ParticleSystem();
    this.scene.add(this.particles.group);

    // Warm station light that follows the action in the Metro Rail scene
    this.metroLight = new THREE.PointLight(0xbfdbfe, 38, 26, 1.6);
    this.metroLight.position.set(0, 6.2, 3);
    this.metroLight.visible = false;
    this.scene.add(this.metroLight);
  }

  private initActors(): void {
    this.playerRig = createCharacterRig(this.look.player, true);
    this.playerRig.root.position.set(0, 0, 0);
    this.scene.add(this.playerRig.root);

    this.rebuildChasers();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
  }

  private rebuildChasers(): void {
    for (const c of this.chasers) {
      this.scene.remove(c.rig.root);
      disposeCharacterRig(c.rig);
    }
    this.chasers = [];

    const count = this.look.chaserCount;
    const baseOffsets = count === 3 ? [0.0, 0.55, 1.1] : [0.0, 0.45, 0.9, 1.35];
    const startLanes = count === 3 ? [1, 0, 2] : [1, 0, 2, 1];

    for (let i = 0; i < count; i++) {
      const cfg = this.look.chasers[i];
      const rig = createCharacterRig(cfg, false);
      const lane = startLanes[i];
      const z = 3.2 + baseOffsets[i];
      rig.root.position.set(LANE_X[lane], 0, z);
      this.scene.add(rig.root);

      this.chasers.push({
        config: cfg,
        rig,
        lane,
        x: LANE_X[lane],
        y: 0,
        vy: 0,
        z,
        slideTimer: 0,
        phase: i * 1.4,
        baseZOffset: baseOffsets[i],
        laneTimer: 0.4 + i * 0.35,
      });
    }
  }

  public updateSettings(newSettings: PlayerSettings): void {
    this.settings = newSettings;
    this.refreshLooks();
  }

  public setOverlayContext(overlay: ScreenOverlay, focusFriendIndex = 0): void {
    this.overlay = overlay;
    this.focusFriendIndex = focusFriendIndex;
  }

  public applyTheme(themeId: PlayerSettings['theme']): void {
    const pal = THEME_PALETTES[themeId];
    this.appliedTheme = themeId;
    if (this.metroLight) this.metroLight.visible = themeId === 'metro';
    if (this.skyTex) this.skyTex.dispose();
    this.skyTex = createSkyGradientTexture(pal.skyTop, pal.skyBottom);
    this.scene.background = this.skyTex;
    this.scene.fog = new THREE.FogExp2(pal.fogColor, pal.fogDensity);

    this.sunLight.color.setHex(pal.sunColor);
    this.sunLight.intensity = pal.sunIntensity;
    this.hemiLight.color.setHex(pal.hemiSky);
    this.hemiLight.groundColor.setHex(pal.hemiGround);
    this.hemiLight.intensity = pal.hemiIntensity;

    this.environment.setTheme(themeId);
  }

  public startRun(): void {
    soundEngine.unlock();
    this.environment.reset();
    this.particles.clear();

    this.playerLane = 1;
    this.playerX = 0;
    this.playerY = 0;
    this.playerVy = 0;
    this.slideTimer = 0;
    this.stumbleTimer = 0;
    this.invulnTimer = 0;
    this.boostTimer = 0;
    this.jumpBufferTimer = 0;
    this.slideBufferTimer = 0;
    this.powerTimer = GameEngine.POWER_COOLDOWN;
    this.flyTimer = 0;
    this.runTime = 0;
    this.subtitle = '';
    this.subtitleTimer = 0;
    this.nextTauntAt = 14;
    soundEngine.stopSpeech();

    this.speed = 16.0;
    this.distance = 0;
    this.score = 0;
    this.coins = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.chaseGap = 0.68;
    this.cameraShake = 0;
    this.caughtTimer = 0;
    this.caughtByName = '';

    this.playerRig.root.position.set(0, 0, 0);
    this.playerRig.root.rotation.set(0, 0, 0);

    const startLanes = this.chasers.length === 3 ? [1, 0, 2] : [1, 0, 2, 1];
    this.chasers.forEach((c, idx) => {
      c.lane = startLanes[idx];
      c.x = LANE_X[c.lane];
      c.y = 0;
      c.vy = 0;
      c.slideTimer = 0;
      c.z = 3.6 + c.baseZOffset;
      c.rig.root.position.set(c.x, 0, c.z);
      c.rig.root.rotation.set(0, 0, 0);
    });

    this.gameState = 'playing';
    this.callbacks.onGameStateChange('playing');
    if (this.mode === 'premium') {
      this.say('Apaaaa is here! Catch me if you can!');
    }
    this.emitLiveStats();
  }

  /** Whether Modi's Power exists in the current mode. */
  private get powerAvailable(): boolean {
    return this.mode === 'premium';
  }

  private say(text: string): void {
    this.subtitle = text;
    this.subtitleTimer = 3.2;
    soundEngine.speak(text);
  }

  public usePower(): void {
    if (this.gameState !== 'playing' || !this.powerAvailable) return;
    if (this.powerTimer > 0 || this.flyTimer > 0) return;
    this.flyTimer = GameEngine.FLY_DURATION;
    this.slideTimer = 0;
    this.playerVy = 0;
    this.invulnTimer = Math.max(this.invulnTimer, GameEngine.FLY_DURATION + 1.2);
    this.cameraShake = 0.35;
    this.particles.emitBoostBurst(this.playerX, this.playerY + 1, 0);
    soundEngine.playPower();
    this.say("Modi's Power! Let's fly!");
  }

  public pauseGame(): void {
    if (this.gameState !== 'playing') return;
    this.gameState = 'paused';
    soundEngine.stopSpeech();
    this.callbacks.onGameStateChange('paused');
  }

  public resumeGame(): void {
    if (this.gameState !== 'paused') return;
    this.lastTime = performance.now();
    this.gameState = 'playing';
    this.callbacks.onGameStateChange('playing');
  }

  public returnToMenu(): void {
    this.environment.reset();
    this.particles.clear();
    this.playerLane = 1;
    this.playerX = 0;
    this.playerY = 0;
    this.playerVy = 0;
    this.slideTimer = 0;
    this.stumbleTimer = 0;
    this.boostTimer = 0;
    this.flyTimer = 0;
    soundEngine.stopSpeech();
    this.playerRig.root.position.set(0, 0, 0);
    this.playerRig.root.rotation.set(0, 0, 0);

    const startLanes = this.chasers.length === 3 ? [1, 0, 2] : [1, 0, 2, 1];
    this.chasers.forEach((c, idx) => {
      c.lane = startLanes[idx];
      c.x = LANE_X[c.lane];
      c.y = 0;
      c.vy = 0;
      c.slideTimer = 0;
      c.z = 3.4 + c.baseZOffset;
      c.rig.root.position.set(c.x, 0, c.z);
      c.rig.root.rotation.set(0, 0, 0);
    });

    this.gameState = 'menu';
    this.callbacks.onGameStateChange('menu');
  }

  // Player Input Actions
  public moveLeft(): void {
    if (this.gameState !== 'playing') return;
    if (this.playerLane > 0) {
      this.playerLane -= 1;
      soundEngine.playLaneSwitch();
    }
  }

  public moveRight(): void {
    if (this.gameState !== 'playing') return;
    if (this.playerLane < 2) {
      this.playerLane += 1;
      soundEngine.playLaneSwitch();
    }
  }

  public jump(): void {
    if (this.gameState !== 'playing') return;
    this.jumpBufferTimer = 0.14;
  }

  public slide(): void {
    if (this.gameState !== 'playing') return;
    this.slideBufferTimer = 0.14;
    // Fast-fall slam into slide if currently airborne!
    if (this.playerY > 0.05) {
      this.playerVy = Math.min(this.playerVy, -26);
    }
  }

  private executeJump(): void {
    this.playerVy = 13.8;
    this.slideTimer = 0;
    this.jumpBufferTimer = 0;
    this.particles.emitDust(this.playerX, 0, 0, 5);
    soundEngine.playJump();
  }

  private executeSlide(): void {
    this.slideTimer = 0.68;
    this.slideBufferTimer = 0;
    this.particles.emitDust(this.playerX, 0, 0, 4);
    soundEngine.playSlide();
  }

  private triggerStumble(gapDrop: number): void {
    this.chaseGap = Math.max(0, this.chaseGap - gapDrop);
    this.combo = 0;
    this.cameraShake = 0.55;
    this.particles.emitImpactBurst(this.playerX, this.playerY + 0.9, -0.3);

    if (this.chaseGap <= 0.001) {
      this.triggerCaught();
    } else {
      this.stumbleTimer = 0.55;
      this.invulnTimer = 0.8;
      this.boostTimer = 0;
      soundEngine.playStumble();
    }
  }

  private triggerCaught(): void {
    if (this.gameState === 'caught' || this.gameState === 'gameover') return;

    // Closest chaser gets the tag!
    let bestIdx = 0;
    let bestZ = Infinity;
    for (let i = 0; i < this.chasers.length; i++) {
      if (this.chasers[i].z < bestZ) {
        bestZ = this.chasers[i].z;
        bestIdx = i;
      }
    }
    this.catcherIndex = bestIdx;
    this.caughtByName = this.chasers[bestIdx]?.config.name || 'Friend';
    this.chaseGap = 0;
    this.caughtTimer = 0;
    this.cameraShake = 0.7;
    this.gameState = 'caught';
    soundEngine.playCaught();
    if (this.powerAvailable) this.say('Oh no! You got me!');
    this.callbacks.onGameStateChange('caught');
    this.emitLiveStats();
  }

  private handleResize = (): void => {
    if (this.disposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
  };

  private handleContextLost = (e: Event): void => {
    e.preventDefault();
    this.contextLost = true;
    this.callbacks.onContextLostChange?.(true);
  };

  private handleContextRestored = (): void => {
    this.contextLost = false;
    this.callbacks.onContextLostChange?.(false);
    this.lastTime = performance.now();
  };

  private startLoop(): void {
    const tick = () => {
      if (this.disposed) return;

      const now = performance.now();
      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      if (!this.contextLost) {
        this.update(dt);
        this.renderer.render(this.scene, this.camera);
      }

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private update(dt: number): void {
    this.elapsed += dt;
    this.particles.update(dt);

    if (this.gameState === 'menu') {
      this.updateMenuShowcase(dt);
      return;
    }

    if (this.gameState === 'paused') {
      return;
    }

    if (this.gameState === 'caught') {
      this.updateCaughtSequence(dt);
      return;
    }

    if (this.gameState === 'gameover') {
      this.updateGameOverIdle(dt);
      return;
    }

    // === PLAYING STATE ===
    this.updatePlaying(dt);
  }

  private updateMenuShowcase(dt: number): void {
    // Gentle scenic jog on clean track while in menu or customization screens
    const showcaseSpeed = 8.5;
    this.environment.update(dt, showcaseSpeed, this.elapsed, 0, false);

    this.playerPhase += dt * 9.5;
    this.playerRig.root.position.set(0, 0, 0);
    // In customization screen, face the runner toward the camera so player sees outfit & face!
    const targetRotY =
      this.overlay === 'customize-player' || this.overlay === 'customize-friends'
        ? Math.PI
        : 0;
    this.playerRig.root.rotation.y = THREE.MathUtils.damp(
      this.playerRig.root.rotation.y,
      targetRotY,
      8,
      dt
    );
    animateCharacterRig(
      this.playerRig,
      this.overlay === 'customize-player' ? 'idle' : 'run',
      this.playerPhase
    );

    const showcaseSlots =
      this.chasers.length === 3
        ? [
            { x: -2.3, z: 3.1 },
            { x: 0, z: 3.8 },
            { x: 2.3, z: 3.1 },
          ]
        : [
            { x: -2.6, z: 3.1 },
            { x: -0.9, z: 3.8 },
            { x: 0.9, z: 3.8 },
            { x: 2.6, z: 3.1 },
          ];

    this.chasers.forEach((c, idx) => {
      c.phase += dt * 9.8;
      const slot = showcaseSlots[idx] || { x: 0, z: 3.5 };
      c.x = THREE.MathUtils.damp(c.x, slot.x, 7, dt);
      c.z = THREE.MathUtils.damp(c.z, slot.z, 7, dt);
      c.rig.root.position.set(c.x, 0, c.z);
      c.rig.root.rotation.y = THREE.MathUtils.damp(
        c.rig.root.rotation.y,
        this.overlay === 'customize-friends' ? Math.PI : 0,
        8,
        dt
      );
      const isFocusedFriend =
        this.overlay === 'customize-friends' && idx === this.focusFriendIndex;
      animateCharacterRig(
        c.rig,
        isFocusedFriend ? 'idle' : 'run',
        c.phase
      );
    });

    // Camera choreography per overlay
    if (this.overlay === 'customize-player') {
      _camTargetPos.set(-1.35, 1.9, 3.6);
      _camLookTarget.set(-0.35, 1.2, 0);
    } else if (this.overlay === 'customize-friends') {
      const targetFriend = this.chasers[this.focusFriendIndex] || this.chasers[0];
      const fx = targetFriend ? targetFriend.x : 0;
      const fz = targetFriend ? targetFriend.z : 3.5;
      _camTargetPos.set(fx - 1.1, 1.9, fz + 3.4);
      _camLookTarget.set(fx - 0.25, 1.15, fz);
    } else {
      const sway = Math.sin(this.elapsed * 0.45) * 1.1;
      _camTargetPos.set(sway, 4.6, 10.2);
      _camLookTarget.set(0, 1.35, -3.5);
    }

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _camTargetPos.x, 4.5, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _camTargetPos.y, 4.5, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _camTargetPos.z, 4.5, dt);
    _currentLookAt.lerp(_camLookTarget, 1 - Math.exp(-5 * dt));
    this.camera.lookAt(_currentLookAt);
  }

  private updatePlaying(dt: number): void {
    // 1. Speed progression & difficulty
    const baseTargetSpeed = Math.min(34, 16.0 + this.distance * 0.014);
    const boostAdd = this.boostTimer > 0 ? 7.5 : 0;
    const stumbleMult = this.stumbleTimer > 0 ? 0.62 : 1.0;
    const desiredSpeed = (baseTargetSpeed + boostAdd) * stumbleMult;
    this.speed = THREE.MathUtils.damp(this.speed, desiredSpeed, 6, dt);

    const difficulty = THREE.MathUtils.clamp(this.distance / 750, 0, 1);

    // Run clock, Modi's Power cooldown, voice taunts
    this.runTime += dt;
    if (this.subtitleTimer > 0) {
      this.subtitleTimer -= dt;
      if (this.subtitleTimer <= 0) this.subtitle = '';
    }
    if (this.powerAvailable) {
      if (this.flyTimer > 0) {
        this.flyTimer -= dt;
        if (this.flyTimer <= 0) {
          this.flyTimer = 0;
          this.powerTimer = GameEngine.POWER_COOLDOWN; // repeatable every 20s
          this.invulnTimer = Math.max(this.invulnTimer, 1.2); // safe landing
          this.say('Phew! See you at the finish line!');
        }
      } else if (this.powerTimer > 0) {
        this.powerTimer -= dt;
        if (this.powerTimer <= 0) {
          this.powerTimer = 0;
          this.say("Modi's Power is ready!");
        }
      }
      if (this.runTime >= this.nextTauntAt && this.flyTimer <= 0) {
        const lines = ['Too slow!', 'Keep up, boys!', 'Apaaaa never gets caught!', 'Is that all you got?'];
        this.say(lines[Math.floor(Math.random() * lines.length)]);
        this.nextTauntAt = this.runTime + 16 + Math.random() * 6;
      }
    }

    if (this.boostTimer > 0) this.boostTimer = Math.max(0, this.boostTimer - dt);
    if (this.stumbleTimer > 0) this.stumbleTimer = Math.max(0, this.stumbleTimer - dt);
    if (this.invulnTimer > 0) this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    // Gradually recover chase gap when running cleanly
    const recoveryRate = this.boostTimer > 0 ? 0.24 : 0.036;
    if (this.stumbleTimer <= 0) {
      this.chaseGap = Math.min(1.0, this.chaseGap + recoveryRate * dt);
    }

    // Distance & Score
    const deltaDist = this.speed * dt;
    this.distance += deltaDist;
    this.score += deltaDist * (this.boostTimer > 0 ? 15 : 10);

    // 2. Scroll endless environment
    this.environment.update(dt, this.speed, this.elapsed, difficulty, true);

    // 3. Player lane + jump/slide kinematics
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= dt;
    if (this.slideBufferTimer > 0) this.slideBufferTimer -= dt;

    if (this.flyTimer > 0) {
      this.jumpBufferTimer = 0;
      this.slideBufferTimer = 0;
    }
    if (this.jumpBufferTimer > 0 && this.playerY <= 0.02) {
      this.executeJump();
    }
    if (this.slideBufferTimer > 0 && this.playerY <= 0.05 && this.slideTimer <= 0) {
      this.executeSlide();
    }

    const targetX = LANE_X[this.playerLane];
    const prevX = this.playerX;
    this.playerX = THREE.MathUtils.damp(this.playerX, targetX, 16, dt);
    const lateralTilt = THREE.MathUtils.clamp((prevX - this.playerX) * 2.2, -0.25, 0.25);

    if (this.flyTimer > 0) {
      // Modi's Power: glide up into the sky and hover
      const hover = Math.sin(this.elapsed * 5) * 0.18;
      this.playerY = THREE.MathUtils.damp(this.playerY, GameEngine.FLY_HEIGHT + hover, 5, dt);
      this.playerVy = 0;
      this.chaseGap = Math.min(1.0, this.chaseGap + 0.1 * dt);
      this.score += this.speed * dt * 5;
      this.particles.emitDust(this.playerX, this.playerY, 0.2, 2);
    } else if (this.playerY > 0 || this.playerVy > 0) {
      this.playerVy -= 36 * dt;
      this.playerY += this.playerVy * dt;
      if (this.playerY <= 0) {
        this.playerY = 0;
        this.playerVy = 0;
        this.particles.emitDust(this.playerX, 0, 0, 4);
        if (this.slideBufferTimer > 0) {
          this.executeSlide();
        }
      }
    }

    if (this.slideTimer > 0) {
      this.slideTimer = Math.max(0, this.slideTimer - dt);
      if (Math.random() < 0.45) {
        this.particles.emitDust(this.playerX, 0, 0.25, 1);
      }
    }

    // Player pose & footsteps
    this.playerPhase += dt * (this.speed * 0.72);
    let pose: CharacterPose = 'run';
    if (this.stumbleTimer > 0) pose = 'stumble';
    else if (this.playerY > 0.08) pose = 'jump';
    else if (this.slideTimer > 0) pose = 'slide';

    this.playerRig.root.position.set(this.playerX, this.playerY, 0);
    this.playerRig.root.rotation.set(0, 0, lateralTilt);
    animateCharacterRig(
      this.playerRig,
      pose,
      this.playerPhase,
      this.playerY,
      this.stumbleTimer > 0 ? 1 : 0
    );

    if (pose === 'run') {
      this.footstepAccum += dt * (this.speed * 0.23);
      if (this.footstepAccum >= 1) {
        this.footstepAccum = 0;
        this.particles.emitDust(this.playerX, 0, 0.2, 1);
        soundEngine.playFootstep();
      }
    }

    // 4. Collision Detection (Player vs Obstacles & Collectibles)
    this.checkCollisions();

    // 5. Update AI Friends Chase System
    this.updateChasers(dt);

    // 6. Dynamic Chase Camera
    if (this.cameraShake > 0) {
      this.cameraShake = Math.max(0, this.cameraShake - dt * 1.9);
    }
    const rumble = this.appliedTheme === 'metro' ? 0.035 : 0; // subtle train-rumble
    const shakeX = (Math.random() - 0.5) * (this.cameraShake * 0.45 + rumble);
    const shakeY = (Math.random() - 0.5) * (this.cameraShake * 0.35 + rumble);
    this.metroLight.position.set(this.playerX * 0.5, 6.2, 3.5);
    this.metroLight.intensity = 38 + Math.sin(this.elapsed * 23) * 1.5; // faint fluorescent flicker

    const targetFov = this.boostTimer > 0 ? 68 : 60 + ((this.speed - 16) / 18) * 5;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 5, dt);
      this.camera.updateProjectionMatrix();
    }

    _camTargetPos.set(
      this.playerX * 0.42 + shakeX,
      5.15 + this.playerY * 0.35 + shakeY,
      10.8
    );
    _camLookTarget.set(this.playerX * 0.35, 1.35 + this.playerY * 0.25, -7.5);

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _camTargetPos.x, 9, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _camTargetPos.y, 9, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _camTargetPos.z, 9, dt);
    _currentLookAt.lerp(_camLookTarget, 1 - Math.exp(-10 * dt));
    this.camera.lookAt(_currentLookAt);

    // 7. Throttled HUD telemetry update (~15Hz so React UI stays silky smooth)
    this.statsThrottle += dt;
    if (this.statsThrottle >= 0.066) {
      this.statsThrottle = 0;
      this.emitLiveStats();
    }
  }

  private checkCollisions(): void {
    const pMinY = this.playerY;
    const pMaxY = this.playerY + (this.slideTimer > 0 ? 0.85 : 1.75);
    const pHalfW = 0.34;
    const pHalfD = 0.34;

    for (const chunk of this.environment.chunks) {
      const chunkZ = chunk.group.position.z;
      // Skip chunks nowhere near z = 0
      if (chunkZ < -8 || chunkZ > 32) continue;

      // Check collectibles
      for (const col of chunk.collectibles) {
        if (col.collected) continue;
        const wz = chunkZ + col.localZ;
        if (Math.abs(wz) > 1.15) continue;
        const wx = LANE_X[col.lane];
        if (Math.abs(this.playerX - wx) > 0.95) continue;
        if (pMaxY < col.baseY - 0.55 || pMinY > col.baseY + 0.75) continue;

        col.collected = true;
        col.mesh.visible = false;

        if (col.kind === 'coin') {
          this.coins += 1;
          this.combo += 1;
          this.comboTimer = 2.4;
          this.score += 25 + Math.min(this.combo, 10) * 5;
          this.chaseGap = Math.min(1.0, this.chaseGap + 0.02);
          this.particles.emitCoinBurst(wx, col.baseY, 0);
          soundEngine.playCoin(this.combo);
        } else {
          this.boostTimer = 3.2;
          this.chaseGap = Math.min(1.0, this.chaseGap + 0.25);
          this.score += 150;
          this.particles.emitBoostBurst(wx, col.baseY, 0);
          soundEngine.playBoost();
        }
      }

      // Check obstacles
      if (this.invulnTimer > 0 || this.flyTimer > 0) continue;

      for (const obs of chunk.obstacles) {
        if (obs.hit) continue;
        const wz = chunkZ + obs.localZ;
        if (Math.abs(wz) > obs.halfD + pHalfD) continue;

        const wx = LANE_X[obs.lane];
        if (Math.abs(this.playerX - wx) > obs.halfW + pHalfW) continue;

        // Vertical overlap check
        if (pMaxY <= obs.minY || pMinY >= obs.maxY) continue;

        // Collision occurred!
        obs.hit = true;
        const gapPenalty = obs.kind === 'van' ? 0.72 : 0.42;
        this.triggerStumble(gapPenalty);
        return;
      }
    }
  }

  private updateChasers(dt: number): void {
    // Map chaseGap (0..1) -> distance behind player (1.1m to 5.4m)
    const minBehind = 1.15 + (1 - this.chaseGap) * 0.0;
    const baseBehind = minBehind + this.chaseGap * 4.2;

    for (let i = 0; i < this.chasers.length; i++) {
      const c = this.chasers[i];
      c.laneTimer -= dt;

      // Personality-driven lane target
      let desiredLane = c.lane;
      if (c.laneTimer <= 0) {
        if (c.config.personality === 'sprinter') {
          desiredLane = this.playerLane;
          c.laneTimer = 0.28;
        } else if (c.config.personality === 'flanker') {
          desiredLane = this.playerLane === 1 ? (i % 2 === 0 ? 0 : 2) : 1;
          c.laneTimer = 0.45;
        } else if (c.config.personality === 'tank') {
          desiredLane = 1;
          c.laneTimer = 0.7;
        } else {
          // Wildcard weaves dynamically
          desiredLane = Math.floor(Math.random() * 3);
          c.laneTimer = 0.65;
        }
      }

      // Obstacle awareness for AI chasers (they dodge vans, jump barriers, slide under gates!)
      for (const chunk of this.environment.chunks) {
        const chunkZ = chunk.group.position.z;
        if (chunkZ < -4 || chunkZ > 36) continue;

        for (const obs of chunk.obstacles) {
          const wz = chunkZ + obs.localZ;
          // Upcoming obstacle just ahead of this chaser (chaser is at +c.z, obstacles approach from -Z toward +Z)
          const distAhead = c.z - wz;
          if (obs.lane === desiredLane && distAhead > 0.2 && distAhead < 4.5) {
            if (obs.kind === 'van') {
              // Steer into a safe adjacent lane
              desiredLane = desiredLane === 1 ? (i % 2 === 0 ? 0 : 2) : 1;
            } else if ((obs.kind === 'barrier' || obs.kind === 'cones' || obs.kind === 'trap') && c.y <= 0.02 && distAhead < 2.2) {
              c.vy = 12.2;
              c.slideTimer = 0;
            } else if (obs.kind === 'overhead' && c.slideTimer <= 0 && c.y <= 0.05 && distAhead < 2.3) {
              c.slideTimer = 0.55;
            }
          }
        }
      }

      c.lane = desiredLane;
      const targetX = LANE_X[c.lane];
      c.x = THREE.MathUtils.damp(c.x, targetX, 9.5, dt);

      // Chaser jump & slide physics
      if (c.y > 0 || c.vy > 0) {
        c.vy -= 34 * dt;
        c.y += c.vy * dt;
        if (c.y <= 0) {
          c.y = 0;
          c.vy = 0;
        }
      }
      if (c.slideTimer > 0) {
        c.slideTimer = Math.max(0, c.slideTimer - dt);
      }

      // Target Z behind player
      const personalitySpread =
        c.config.personality === 'sprinter'
          ? 0
          : c.config.personality === 'flanker'
          ? 0.55
          : c.config.personality === 'wildcard'
          ? 0.85 + Math.sin(this.elapsed * 2.1 + i) * 0.35
          : 1.15;
      const targetZ = Math.min(6.4, baseBehind + personalitySpread);
      c.z = THREE.MathUtils.damp(c.z, targetZ, 5.5, dt);

      c.phase += dt * (this.speed * 0.75 + 1.2);
      let cPose: CharacterPose = 'run';
      if (c.y > 0.08) cPose = 'jump';
      else if (c.slideTimer > 0) cPose = 'slide';

      c.rig.root.position.set(c.x, c.y, c.z);
      animateCharacterRig(c.rig, cPose, c.phase, c.y);
    }
  }

  private updateCaughtSequence(dt: number): void {
    this.caughtTimer += dt;

    // Player staggers/surrenders
    this.playerY = THREE.MathUtils.damp(this.playerY, 0, 12, dt);
    this.playerRig.root.position.set(this.playerX, this.playerY, 0);
    this.playerRig.root.rotation.y = THREE.MathUtils.damp(
      this.playerRig.root.rotation.y,
      Math.PI * 0.15,
      6,
      dt
    );
    animateCharacterRig(this.playerRig, 'caught', this.elapsed * 3);

    // Catcher sprints right up to tag shoulder; others gather in celebration
    this.chasers.forEach((c, idx) => {
      c.y = THREE.MathUtils.damp(c.y, 0, 12, dt);
      const isCatcher = idx === this.catcherIndex;
      const targetX = isCatcher
        ? this.playerX + (this.playerX > 0 ? -0.55 : 0.55)
        : LANE_X[idx % 3] + (idx === 3 ? 0.9 : 0);
      const targetZ = isCatcher ? 0.82 : 1.7 + idx * 0.35;

      c.x = THREE.MathUtils.damp(c.x, targetX, 8, dt);
      c.z = THREE.MathUtils.damp(c.z, targetZ, 8, dt);
      c.rig.root.position.set(c.x, c.y, c.z);
      animateCharacterRig(c.rig, isCatcher ? 'tag' : 'idle', this.elapsed * 4 + idx);
    });

    // Dramatic 3/4 side angle framing the tag!
    _camTargetPos.set(this.playerX + 4.2, 2.5, 5.2);
    _camLookTarget.set(this.playerX, 1.15, 0.6);
    this.camera.position.lerp(_camTargetPos, 1 - Math.exp(-4.5 * dt));
    _currentLookAt.lerp(_camLookTarget, 1 - Math.exp(-5.5 * dt));
    this.camera.lookAt(_currentLookAt);

    if (this.caughtTimer >= 1.35) {
      this.gameState = 'gameover';
      this.callbacks.onGameStateChange('gameover');
      this.emitLiveStats();
    }
  }

  private updateGameOverIdle(dt: number): void {
    animateCharacterRig(this.playerRig, 'caught', this.elapsed * 2);
    this.chasers.forEach((c, idx) => {
      animateCharacterRig(
        c.rig,
        idx === this.catcherIndex ? 'tag' : 'idle',
        this.elapsed * 2.5 + idx
      );
    });
    const orbit = Math.sin(this.elapsed * 0.4) * 1.4;
    _camTargetPos.set(this.playerX + 3.8 + orbit, 2.5, 5.4);
    _camLookTarget.set(this.playerX, 1.1, 0.5);
    this.camera.position.lerp(_camTargetPos, 1 - Math.exp(-3 * dt));
    _currentLookAt.lerp(_camLookTarget, 1 - Math.exp(-3 * dt));
    this.camera.lookAt(_currentLookAt);
  }

  private emitLiveStats(): void {
    let closestDist = 99;
    let closestName = '';
    const chaserDistances = this.chasers.map((c) => {
      const d = Math.max(0, Number(c.z.toFixed(1)));
      if (d < closestDist) {
        closestDist = d;
        closestName = c.config.name;
      }
      return {
        id: c.config.id,
        name: c.config.name,
        color: c.config.shirtColor,
        dist: d,
        lane: c.lane,
      };
    });

    let alertLevel: LiveStats['alertLevel'] = 'safe';
    if (this.chaseGap < 0.36) alertLevel = 'danger';
    else if (this.chaseGap < 0.62) alertLevel = 'close';

    this.callbacks.onLiveStats({
      score: Math.floor(this.score),
      distance: Math.floor(this.distance),
      coins: this.coins,
      speed: Math.round(this.speed * 2.2),
      chaseGap: this.chaseGap,
      closestChaserDist: closestDist === 99 ? 0 : closestDist,
      closestChaserName: closestName,
      chaserDistances,
      combo: this.combo,
      alertLevel,
      boostActive: this.boostTimer > 0,
      caughtBy: this.caughtByName || undefined,
      powerAvailable: this.powerAvailable,
      powerReady: this.powerAvailable && this.powerTimer <= 0 && this.flyTimer <= 0,
      powerCharge: this.flyTimer > 0 ? 0 : 1 - this.powerTimer / GameEngine.POWER_COOLDOWN,
      powerSecondsLeft: Math.ceil(this.flyTimer),
      flying: this.flyTimer > 0,
      subtitle: this.subtitle,
    });
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.handleResize);

    const canvas = this.renderer.domElement;
    canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);

    disposeCharacterRig(this.playerRig);
    for (const c of this.chasers) {
      disposeCharacterRig(c.rig);
    }
    this.environment.dispose();
    this.particles.dispose();
    if (this.envTex) this.envTex.dispose();
    if (this.skyTex) this.skyTex.dispose();
    this.renderer.dispose();
  }
}
