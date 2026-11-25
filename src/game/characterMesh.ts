import * as THREE from 'three';
import { AccessoryType, CharacterConfig } from './types';
import { createContactShadowTexture, drawNameplateToCanvas } from './textures';

export type CharacterPose = 'idle' | 'run' | 'jump' | 'slide' | 'stumble' | 'caught' | 'tag';

export interface CharacterRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  headGroup: THREE.Group;
  leftShoulder: THREE.Group;
  leftElbow: THREE.Group;
  rightShoulder: THREE.Group;
  rightElbow: THREE.Group;
  leftHip: THREE.Group;
  leftKnee: THREE.Group;
  rightHip: THREE.Group;
  rightKnee: THREE.Group;
  contactShadow: THREE.Mesh;
  nameplateSprite: THREE.Sprite;
  nameCanvas: HTMLCanvasElement;
  nameTexture: THREE.CanvasTexture;
  materials: {
    shirt: THREE.MeshStandardMaterial;
    shirtAccent: THREE.MeshStandardMaterial;
    pants: THREE.MeshStandardMaterial;
    skin: THREE.MeshStandardMaterial;
    hair: THREE.MeshStandardMaterial;
    shoe: THREE.MeshStandardMaterial;
    accessory: THREE.MeshStandardMaterial;
  };
  accessories: Record<Exclude<AccessoryType, 'none'>, THREE.Group>;
  isPlayer: boolean;
}

let sharedShadowTexture: THREE.CanvasTexture | null = null;

function getShadowTexture(): THREE.CanvasTexture {
  if (!sharedShadowTexture) {
    sharedShadowTexture = createContactShadowTexture();
  }
  return sharedShadowTexture;
}

export function createCharacterRig(
  config: CharacterConfig,
  isPlayer: boolean
): CharacterRig {
  const root = new THREE.Group();

  // Grounded contact shadow disc at y = 0.02
  const shadowGeo = new THREE.PlaneGeometry(1.15, 1.15);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: getShadowTexture(),
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.025;
  root.add(contactShadow);

  // Materials with calibrated PBR roughness differences >= 0.25 across adjacent parts
  const materials = {
    shirt: new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.shirtColor),
      roughness: 0.78,
      metalness: 0.04,
    }),
    shirtAccent: new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.shirtColor).offsetHSL(0, 0, -0.18),
      roughness: 0.45,
      metalness: 0.12,
    }),
    pants: new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.pantsColor),
      roughness: 0.84,
      metalness: 0.02,
    }),
    skin: new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.skinTone),
      roughness: 0.55,
      metalness: 0.02,
    }),
    hair: new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.hairColor),
      roughness: 0.85,
      metalness: 0.04,
    }),
    shoe: new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.shoeColor),
      roughness: 0.38,
      metalness: 0.12,
    }),
    accessory: new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.shirtColor).offsetHSL(0.08, 0.05, 0.05),
      roughness: 0.35,
      metalness: 0.25,
    }),
  };

  const soleMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.65,
    metalness: 0.02,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.2,
    metalness: 0.1,
  });
  const eyeWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.0,
  });

  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  // Hips pivot at leg top (y = 0.84)
  const hips = new THREE.Group();
  hips.position.y = 0.84;
  bodyGroup.add(hips);

  const pelvisMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.16, 0.26),
    materials.pants
  );
  pelvisMesh.position.y = 0.02;
  pelvisMesh.castShadow = true;
  hips.add(pelvisMesh);

  // Torso
  const torso = new THREE.Group();
  torso.position.y = 0.1;
  hips.add(torso);

  const chestMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.5, 0.28),
    materials.shirt
  );
  chestMesh.position.y = 0.25;
  chestMesh.castShadow = true;
  chestMesh.receiveShadow = true;
  torso.add(chestMesh);

  // Sport chest stripe & collar detail
  const stripeMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.47, 0.09, 0.295),
    materials.shirtAccent
  );
  stripeMesh.position.y = 0.32;
  torso.add(stripeMesh);

  const collarMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.13, 0.08, 12),
    materials.shirtAccent
  );
  collarMesh.position.y = 0.52;
  torso.add(collarMesh);

  // Head Group
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.55;
  torso.add(headGroup);

  const neckMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.085, 0.1, 10),
    materials.skin
  );
  neckMesh.position.y = 0.03;
  headGroup.add(neckMesh);

  const headMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.34, 0.31),
    materials.skin
  );
  headMesh.position.y = 0.22;
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Ears
  const earGeo = new THREE.BoxGeometry(0.05, 0.1, 0.07);
  const leftEar = new THREE.Mesh(earGeo, materials.skin);
  leftEar.position.set(-0.175, 0.22, 0);
  const rightEar = new THREE.Mesh(earGeo, materials.skin);
  rightEar.position.set(0.175, 0.22, 0);
  headGroup.add(leftEar, rightEar);

  // Eyes (facing -Z forward when running, so back of head faces camera +Z)
  const eyeWhiteGeo = new THREE.BoxGeometry(0.065, 0.065, 0.02);
  const pupilGeo = new THREE.BoxGeometry(0.035, 0.04, 0.025);
  const leftEyeW = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  leftEyeW.position.set(-0.075, 0.24, -0.155);
  const rightEyeW = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  rightEyeW.position.set(0.075, 0.24, -0.155);
  const leftPupil = new THREE.Mesh(pupilGeo, eyeMat);
  leftPupil.position.set(-0.075, 0.24, -0.16);
  const rightPupil = new THREE.Mesh(pupilGeo, eyeMat);
  rightPupil.position.set(0.075, 0.24, -0.16);
  headGroup.add(leftEyeW, rightEyeW, leftPupil, rightPupil);

  // Hair Crown + Back Hair
  const hairTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.11, 0.33),
    materials.hair
  );
  hairTop.position.set(0, 0.39, 0.005);
  hairTop.castShadow = true;
  const hairBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.335, 0.22, 0.08),
    materials.hair
  );
  hairBack.position.set(0, 0.26, 0.135);
  headGroup.add(hairTop, hairBack);

  // Accessories (toggled by config.accessory)
  // 1. Baseball Cap
  const capGroup = new THREE.Group();
  const capDome = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.12, 0.35),
    materials.accessory
  );
  capDome.position.set(0, 0.41, 0);
  const capVisor = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.035, 0.18),
    materials.shirtAccent
  );
  // Reverse cap style for cool runner look or forward visor
  capVisor.position.set(0, 0.37, -0.22);
  capGroup.add(capDome, capVisor);
  headGroup.add(capGroup);

  // 2. Headphones
  const headphonesGroup = new THREE.Group();
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(0.195, 0.025, 8, 18, Math.PI),
    materials.accessory
  );
  band.position.set(0, 0.26, 0);
  const cupGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.05, 12);
  const leftCup = new THREE.Mesh(cupGeo, materials.accessory);
  leftCup.rotation.z = Math.PI / 2;
  leftCup.position.set(-0.19, 0.22, 0);
  const rightCup = new THREE.Mesh(cupGeo, materials.accessory);
  rightCup.rotation.z = Math.PI / 2;
  rightCup.position.set(0.19, 0.22, 0);
  headphonesGroup.add(band, leftCup, rightCup);
  headGroup.add(headphonesGroup);

  // 3. Bandana
  const bandanaGroup = new THREE.Group();
  const bandStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.345, 0.07, 0.335),
    materials.accessory
  );
  bandStrip.position.set(0, 0.33, 0);
  const tail1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.18, 0.03),
    materials.accessory
  );
  tail1.position.set(-0.04, 0.28, 0.2);
  tail1.rotation.set(0.35, 0, -0.2);
  const tail2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.14, 0.03),
    materials.accessory
  );
  tail2.position.set(0.04, 0.29, 0.2);
  tail2.rotation.set(0.45, 0, 0.25);
  bandanaGroup.add(bandStrip, tail1, tail2);
  headGroup.add(bandanaGroup);

  // 4. Backpack (attached to torso!)
  const backpackGroup = new THREE.Group();
  const packMain = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.42, 0.18),
    materials.accessory
  );
  packMain.position.set(0, 0.26, 0.22);
  packMain.castShadow = true;
  const packPocket = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.18, 0.06),
    materials.shirtAccent
  );
  packPocket.position.set(0, 0.17, 0.32);
  backpackGroup.add(packMain, packPocket);
  torso.add(backpackGroup);

  const accessories: Record<Exclude<AccessoryType, 'none'>, THREE.Group> = {
    cap: capGroup,
    headphones: headphonesGroup,
    backpack: backpackGroup,
    bandana: bandanaGroup,
  };

  // Arms helper
  function buildArm(side: -1 | 1): { shoulder: THREE.Group; elbow: THREE.Group } {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.3, 0.44, 0);
    torso.add(shoulder);

    const upperArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.28, 0.13),
      materials.shirt
    );
    upperArm.position.y = -0.12;
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    const elbow = new THREE.Group();
    elbow.position.y = -0.25;
    shoulder.add(elbow);

    const forearm = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.25, 0.11),
      materials.skin
    );
    forearm.position.y = -0.12;
    forearm.castShadow = true;
    elbow.add(forearm);

    const hand = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.09, 0.1),
      materials.skin
    );
    hand.position.y = -0.26;
    elbow.add(hand);

    return { shoulder, elbow };
  }

  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);

  // Legs helper (total leg length = 0.84 so feet rest cleanly at y = 0!)
  function buildLeg(side: -1 | 1): { hip: THREE.Group; knee: THREE.Group } {
    const hip = new THREE.Group();
    hip.position.set(side * 0.125, -0.02, 0);
    hips.add(hip);

    const thigh = new THREE.Mesh(
      new THREE.BoxGeometry(0.17, 0.38, 0.18),
      materials.pants
    );
    thigh.position.y = -0.18;
    thigh.castShadow = true;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.37;
    hip.add(knee);

    const shin = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.36, 0.16),
      materials.pants
    );
    shin.position.y = -0.17;
    shin.castShadow = true;
    knee.add(shin);

    // Sneaker upper + white sole
    const shoeUpper = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.1, 0.26),
      materials.shoe
    );
    shoeUpper.position.set(0, -0.37, -0.04);
    shoeUpper.castShadow = true;
    knee.add(shoeUpper);

    const shoeSole = new THREE.Mesh(
      new THREE.BoxGeometry(0.17, 0.04, 0.28),
      soleMat
    );
    shoeSole.position.set(0, -0.43, -0.04);
    knee.add(shoeSole);

    return { hip, knee };
  }

  const leftLeg = buildLeg(-1);
  const rightLeg = buildLeg(1);

  // Floating Nameplate Sprite above character head
  const nameCanvas = document.createElement('canvas');
  nameCanvas.width = 512;
  nameCanvas.height = 128;
  drawNameplateToCanvas(nameCanvas, config.name, config.shirtColor, isPlayer);

  const nameTexture = new THREE.CanvasTexture(nameCanvas);
  nameTexture.colorSpace = THREE.SRGBColorSpace;
  nameTexture.minFilter = THREE.LinearFilter;

  const spriteMat = new THREE.SpriteMaterial({
    map: nameTexture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
  });
  const nameplateSprite = new THREE.Sprite(spriteMat);
  nameplateSprite.position.set(0, 2.28, 0);
  nameplateSprite.scale.set(2.35, 0.59, 1);
  root.add(nameplateSprite);

  const rig: CharacterRig = {
    root,
    bodyGroup,
    hips,
    torso,
    headGroup,
    leftShoulder: leftArm.shoulder,
    leftElbow: leftArm.elbow,
    rightShoulder: rightArm.shoulder,
    rightElbow: rightArm.elbow,
    leftHip: leftLeg.hip,
    leftKnee: leftLeg.knee,
    rightHip: rightLeg.hip,
    rightKnee: rightLeg.knee,
    contactShadow,
    nameplateSprite,
    nameCanvas,
    nameTexture,
    materials,
    accessories,
    isPlayer,
  };

  updateCharacterRigConfig(rig, config);
  return rig;
}

export function updateCharacterRigConfig(
  rig: CharacterRig,
  config: CharacterConfig
): void {
  rig.materials.shirt.color.set(config.shirtColor);
  rig.materials.shirtAccent.color.set(config.shirtColor).offsetHSL(0, 0, -0.18);
  rig.materials.pants.color.set(config.pantsColor);
  rig.materials.hair.color.set(config.hairColor);
  rig.materials.skin.color.set(config.skinTone);
  rig.materials.shoe.color.set(config.shoeColor);
  rig.materials.accessory.color.set(config.shirtColor).offsetHSL(0.08, 0.05, 0.08);

  (Object.keys(rig.accessories) as Exclude<AccessoryType, 'none'>[]).forEach((key) => {
    rig.accessories[key].visible = config.accessory === key;
  });

  drawNameplateToCanvas(rig.nameCanvas, config.name, config.shirtColor, rig.isPlayer);
  rig.nameTexture.needsUpdate = true;
}

export function animateCharacterRig(
  rig: CharacterRig,
  pose: CharacterPose,
  phase: number,
  airHeight = 0,
  stumbleIntensity = 0
): void {
  // Contact shadow shrinks and fades with jump height
  const shadowScale = THREE.MathUtils.clamp(1 - airHeight * 0.22, 0.45, 1);
  rig.contactShadow.scale.setScalar(shadowScale);
  (rig.contactShadow.material as THREE.MeshBasicMaterial).opacity =
    THREE.MathUtils.clamp(0.55 - airHeight * 0.14, 0.12, 0.55);

  if (pose === 'idle') {
    const breath = Math.sin(phase * 2.5);
    rig.bodyGroup.position.y = Math.abs(breath) * 0.025;
    rig.bodyGroup.rotation.set(0, 0, 0);
    rig.hips.position.y = 0.84;
    rig.hips.rotation.set(0, 0, 0);
    rig.torso.rotation.set(0.04, Math.sin(phase * 1.2) * 0.04, 0);
    rig.headGroup.rotation.set(breath * 0.03, Math.sin(phase * 0.8) * 0.08, 0);

    rig.leftHip.rotation.x = 0.05;
    rig.rightHip.rotation.x = -0.05;
    rig.leftKnee.rotation.x = 0.05;
    rig.rightKnee.rotation.x = 0.05;

    rig.leftShoulder.rotation.set(0.1, 0, 0.12);
    rig.rightShoulder.rotation.set(-0.1, 0, -0.12);
    rig.leftElbow.rotation.x = -0.35;
    rig.rightElbow.rotation.x = -0.35;
    rig.nameplateSprite.position.y = 2.28;
    return;
  }

  if (pose === 'run') {
    const s = Math.sin(phase);
    const c = Math.cos(phase);
    const bounce = Math.abs(c) * 0.09;

    rig.bodyGroup.position.y = bounce;
    rig.bodyGroup.rotation.set(0, 0, 0);
    rig.hips.position.y = 0.84;
    rig.hips.rotation.set(0, s * 0.08, 0);

    // Athletic forward sprint lean
    rig.torso.rotation.set(-0.22, -s * 0.1, 0);
    rig.headGroup.rotation.set(0.18, s * 0.04, 0);

    // Legs (right-handed: -X rotation swings leg forward toward -Z!)
    const leftLegAngle = s * 0.95;
    const rightLegAngle = -s * 0.95;
    rig.leftHip.rotation.x = leftLegAngle;
    rig.rightHip.rotation.x = rightLegAngle;

    // Knee bends backward (+X) on backswing & tuck
    rig.leftKnee.rotation.x = Math.max(0.1, -c * 0.85 + 0.35);
    rig.rightKnee.rotation.x = Math.max(0.1, c * 0.85 + 0.35);

    // Opposite arms pump vigorously
    rig.leftShoulder.rotation.set(-s * 1.0, 0, 0.12);
    rig.rightShoulder.rotation.set(s * 1.0, 0, -0.12);
    rig.leftElbow.rotation.x = -1.25;
    rig.rightElbow.rotation.x = -1.25;

    rig.nameplateSprite.position.y = 2.28 + bounce;
    return;
  }

  if (pose === 'jump') {
    rig.bodyGroup.position.y = 0;
    rig.bodyGroup.rotation.set(0, 0, 0);
    rig.hips.position.y = 0.84;
    rig.hips.rotation.set(0, 0, 0);
    rig.torso.rotation.set(-0.18, 0, 0);
    rig.headGroup.rotation.set(0.1, 0, 0);

    // Split tuck mid-air
    rig.leftHip.rotation.x = -0.75;
    rig.leftKnee.rotation.x = 1.15;
    rig.rightHip.rotation.x = 0.45;
    rig.rightKnee.rotation.x = 0.7;

    rig.leftShoulder.rotation.set(-1.35, 0, 0.35);
    rig.rightShoulder.rotation.set(-1.15, 0, -0.35);
    rig.leftElbow.rotation.x = -0.6;
    rig.rightElbow.rotation.x = -0.6;

    rig.nameplateSprite.position.y = 2.25;
    return;
  }

  if (pose === 'slide') {
    // Low baseball/parkour slide under overhead barrier
    rig.bodyGroup.position.y = -0.52;
    rig.bodyGroup.rotation.set(0, 0, 0);
    rig.hips.position.y = 0.84;
    rig.hips.rotation.set(1.08, 0.12, 0); // Recline torso & hips backward!
    rig.torso.rotation.set(0.15, 0, 0);
    rig.headGroup.rotation.set(-0.65, 0, 0); // Keep eyes looking forward

    // One leg extended forward (-Z), one tucked
    rig.leftHip.rotation.x = -0.2;
    rig.leftKnee.rotation.x = 0.1;
    rig.rightHip.rotation.x = -0.75;
    rig.rightKnee.rotation.x = 1.35;

    // Arms wide for balance
    rig.leftShoulder.rotation.set(0.3, 0, 0.75);
    rig.rightShoulder.rotation.set(-0.2, 0, -0.75);
    rig.leftElbow.rotation.x = -0.4;
    rig.rightElbow.rotation.x = -0.4;

    rig.nameplateSprite.position.y = 1.48;
    return;
  }

  if (pose === 'stumble') {
    const wobble = Math.sin(phase * 2.2) * stumbleIntensity;
    rig.bodyGroup.position.y = Math.abs(Math.cos(phase)) * 0.05;
    rig.bodyGroup.rotation.set(0.12, 0, wobble * 0.28);
    rig.hips.position.y = 0.82;
    rig.torso.rotation.set(0.15, wobble * 0.25, wobble * 0.2);
    rig.headGroup.rotation.set(-0.1, -wobble * 0.2, 0);

    rig.leftHip.rotation.x = Math.sin(phase) * 0.65;
    rig.rightHip.rotation.x = -Math.sin(phase) * 0.65;
    rig.leftKnee.rotation.x = 0.5;
    rig.rightKnee.rotation.x = 0.5;

    // Arms flailing for balance
    rig.leftShoulder.rotation.set(-0.6 + wobble, 0, 0.85);
    rig.rightShoulder.rotation.set(-0.6 - wobble, 0, -0.85);
    rig.leftElbow.rotation.x = -0.5;
    rig.rightElbow.rotation.x = -0.5;
    rig.nameplateSprite.position.y = 2.25;
    return;
  }

  if (pose === 'caught') {
    // Surrendered / knocked down pose when friend tags you
    rig.bodyGroup.position.y = -0.1;
    rig.bodyGroup.rotation.set(0, 0, 0);
    rig.hips.position.y = 0.76;
    rig.torso.rotation.set(0.18, Math.sin(phase * 1.5) * 0.08, 0);
    rig.headGroup.rotation.set(0.2, Math.sin(phase * 2) * 0.15, 0);

    rig.leftHip.rotation.x = -0.25;
    rig.leftKnee.rotation.x = 0.55;
    rig.rightHip.rotation.x = 0.15;
    rig.rightKnee.rotation.x = 0.35;

    // Hands up in "Got me!" surrender
    rig.leftShoulder.rotation.set(-2.35, 0, 0.4);
    rig.rightShoulder.rotation.set(-2.35, 0, -0.4);
    rig.leftElbow.rotation.x = -0.4;
    rig.rightElbow.rotation.x = -0.4;
    rig.nameplateSprite.position.y = 2.15;
    return;
  }

  if (pose === 'tag') {
    // Chaser reaching forward to tag player!
    const pulse = Math.sin(phase * 4) * 0.08;
    rig.bodyGroup.position.y = Math.abs(pulse) * 0.2;
    rig.bodyGroup.rotation.set(0, 0, 0);
    rig.hips.position.y = 0.84;
    rig.torso.rotation.set(-0.32, 0.15, 0);
    rig.headGroup.rotation.set(0.22, -0.1, 0);

    rig.leftHip.rotation.x = -0.4;
    rig.leftKnee.rotation.x = 0.45;
    rig.rightHip.rotation.x = 0.5;
    rig.rightKnee.rotation.x = 0.35;

    // Right arm lunges forward to tap shoulder
    rig.rightShoulder.rotation.set(-1.55 + pulse, 0, -0.1);
    rig.rightElbow.rotation.x = -0.15;
    rig.leftShoulder.rotation.set(0.55, 0, 0.3);
    rig.leftElbow.rotation.x = -0.8;
    rig.nameplateSprite.position.y = 2.28;
  }
}

export function disposeCharacterRig(rig: CharacterRig): void {
  rig.nameTexture.dispose();
  (rig.contactShadow.material as THREE.Material).dispose();
  rig.contactShadow.geometry.dispose();
  Object.values(rig.materials).forEach((m) => m.dispose());
  rig.root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
    }
  });
}
