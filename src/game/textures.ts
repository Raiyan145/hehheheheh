import * as THREE from 'three';
import { ThemeId, ThemePalette } from './types';

export const THEME_PALETTES: Record<ThemeId, ThemePalette> = {
  suburbia: {
    id: 'suburbia',
    label: 'Sunny Suburbia',
    skyTop: '#38BDF8',
    skyBottom: '#E0F2FE',
    fogColor: 0xcbe8f6,
    fogDensity: 0.0095,
    sunColor: 0xfff5dc,
    sunIntensity: 2.1,
    hemiSky: 0x93c5fd,
    hemiGround: 0x4d7c0f,
    hemiIntensity: 0.85,
    roadBase: '#334155',
    roadStripe: '#F8FAFC',
    curbColor: '#CBD5E1',
    sidewalkColor: '#E2E8F0',
    grassColor: '#4D7C0F',
    treeFoliage: [0x22c55e, 0x16a34a, 0x65a30d, 0x15803d],
    buildingColors: [0xe2d5c3, 0xd4a373, 0xcbd5e1, 0xf1f5f9, 0xe7c6a5],
    windowColor: 0x38bdf8,
    windowEmissive: 0x0ea5e9,
    windowEmissiveIntensity: 0.15,
    lampEmissive: 0xfef3c7,
    lampEmissiveIntensity: 0.25,
  },
  sunset: {
    id: 'sunset',
    label: 'Sunset Boulevard',
    skyTop: '#7C2D12',
    skyBottom: '#FDBA74',
    fogColor: 0xf6a979,
    fogDensity: 0.0105,
    sunColor: 0xffb36b,
    sunIntensity: 2.2,
    hemiSky: 0xfb923c,
    hemiGround: 0x7c2d12,
    hemiIntensity: 0.8,
    roadBase: '#292524',
    roadStripe: '#FDE68A',
    curbColor: '#D6D3D1',
    sidewalkColor: '#E7E5E4',
    grassColor: '#847228',
    treeFoliage: [0x65a30d, 0xca8a04, 0x4d7c0f, 0xd97706],
    buildingColors: [0xfed7aa, 0xfecaca, 0xfde68a, 0xe7e5e4, 0xfdba74],
    windowColor: 0xfef08a,
    windowEmissive: 0xf59e0b,
    windowEmissiveIntensity: 0.65,
    lampEmissive: 0xfbbf24,
    lampEmissiveIntensity: 1.2,
  },
  night: {
    id: 'night',
    label: 'Neon Night District',
    skyTop: '#020617',
    skyBottom: '#1E293B',
    fogColor: 0x0f172a,
    fogDensity: 0.0115,
    sunColor: 0x93c5fd,
    sunIntensity: 1.35,
    hemiSky: 0x38bdf8,
    hemiGround: 0x1e1b4b,
    hemiIntensity: 0.75,
    roadBase: '#0F172A',
    roadStripe: '#38BDF8',
    curbColor: '#475569',
    sidewalkColor: '#334155',
    grassColor: '#1E293B',
    treeFoliage: [0x0f766e, 0x115e59, 0x047857, 0x065f46],
    buildingColors: [0x1e293b, 0x334155, 0x1e1b4b, 0x27272a, 0x0f172a],
    windowColor: 0xfde047,
    windowEmissive: 0x38bdf8,
    windowEmissiveIntensity: 1.4,
    lampEmissive: 0x7dd3fc,
    lampEmissiveIntensity: 2.2,
  },
  metro: {
    id: 'metro',
    label: 'Metro Rail',
    skyTop: '#0B1220',
    skyBottom: '#1E293B',
    fogColor: 0x0b1220,
    fogDensity: 0.024,
    sunColor: 0xcfe0ff,
    sunIntensity: 0.9,
    hemiSky: 0x9fb8d8,
    hemiGround: 0x1e293b,
    hemiIntensity: 0.95,
    roadBase: '#1B2330',
    roadStripe: '#FACC15',
    curbColor: '#FACC15',
    sidewalkColor: '#CBD5E1',
    grassColor: '#0F172A',
    treeFoliage: [0x0f766e],
    buildingColors: [0x1e293b],
    windowColor: 0xfde047,
    windowEmissive: 0x38bdf8,
    windowEmissiveIntensity: 1.0,
    lampEmissive: 0xe0f2fe,
    lampEmissiveIntensity: 2.4,
  },
};

export function createRoadTexture(
  palette: ThemePalette,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Asphalt base
  ctx.fillStyle = palette.roadBase;
  ctx.fillRect(0, 0, 512, 512);

  if (palette.id === 'metro') {
    // Rail bed: gravel ballast + concrete sleepers under each of the 3 tracks
    for (let i = 0; i < 6000; i++) {
      const px = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1) * 512;
      const py = Math.abs((Math.sin(i * 78.233) * 43758.5453) % 1) * 512;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.25)';
      ctx.fillRect(px, py, 3, 3);
    }
    const laneCenters = [85, 256, 427];
    for (const cx of laneCenters) {
      for (let y = 6; y < 512; y += 64) {
        ctx.fillStyle = '#4B5563';
        ctx.fillRect(cx - 62, y, 124, 24);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(cx - 62, y, 124, 4);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(cx - 62, y + 20, 124, 4);
      }
    }
    const metroTex = new THREE.CanvasTexture(canvas);
    metroTex.colorSpace = THREE.SRGBColorSpace;
    metroTex.wrapS = THREE.RepeatWrapping;
    metroTex.wrapT = THREE.RepeatWrapping;
    metroTex.repeat.set(1, 3);
    metroTex.anisotropy = maxAnisotropy;
    return metroTex;
  }

  // Subtle asphalt aggregate speckles
  for (let i = 0; i < 3500; i++) {
    const x = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const y = (Math.sin(i * 78.233) * 43758.5453) % 1;
    const px = Math.abs(x) * 512;
    const py = Math.abs(y) * 512;
    const shade = i % 2 === 0 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.08)';
    ctx.fillStyle = shade;
    ctx.fillRect(px, py, 2, 2);
  }

  // Outer shoulder lines
  ctx.fillStyle = palette.roadStripe;
  ctx.globalAlpha = 0.75;
  ctx.fillRect(18, 0, 10, 512);
  ctx.fillRect(484, 0, 10, 512);

  // Dashed lane dividers between 3 lanes (1/3 and 2/3 across 512)
  ctx.globalAlpha = 0.9;
  const dividerXs = [171, 341];
  for (const dx of dividerXs) {
    for (let y = 16; y < 512; y += 64) {
      ctx.fillRect(dx - 4, y, 8, 34);
    }
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 3);
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export function createSidewalkTexture(
  palette: ThemePalette,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = palette.sidewalkColor;
  ctx.fillRect(0, 0, 256, 256);
  if (palette.id === 'metro') {
    // Polished station tiles with a subtle checker sheen
    for (let ty = 0; ty < 4; ty++) {
      for (let tx = 0; tx < 4; tx++) {
        ctx.fillStyle = (tx + ty) % 2 === 0 ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.10)';
        ctx.fillRect(tx * 64, ty * 64, 64, 64);
      }
    }
  }

  // Paving stone joints
  ctx.strokeStyle = 'rgba(0,0,0,0.14)';
  ctx.lineWidth = 3;
  for (let y = 0; y <= 256; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  for (let x = 0; x <= 256; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 6);
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export function createGrassTexture(
  palette: ThemePalette,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = palette.grassColor;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 1600; i++) {
    const px = Math.abs((Math.sin(i * 45.164) * 9321.13) % 1) * 256;
    const py = Math.abs((Math.sin(i * 19.832) * 5132.77) % 1) * 256;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
    ctx.fillRect(px, py, 3, 6);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export function createHazardStripeTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FACC15';
  ctx.fillRect(0, 0, 256, 128);

  ctx.fillStyle = '#1E293B';
  for (let x = -128; x < 384; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 24, 0);
    ctx.lineTo(x + 88, 128);
    ctx.lineTo(x + 64, 128);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createSkyGradientTexture(topHex: string, bottomHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, topHex);
  grad.addColorStop(0.65, bottomHex);
  grad.addColorStop(1, bottomHex);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 16, 512);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function drawNameplateToCanvas(
  canvas: HTMLCanvasElement,
  name: string,
  accentColor: string,
  isPlayer: boolean
): void {
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const label = name.trim() || (isPlayer ? 'Runner' : 'Friend');
  ctx.font = '700 44px "Plus Jakarta Sans", system-ui, sans-serif';
  const metrics = ctx.measureText(label);
  const padX = 34;
  const boxW = Math.min(w - 24, Math.max(140, metrics.width + padX * 2));
  const boxH = 74;
  const boxX = (w - boxW) / 2;
  const boxY = 16;
  const r = 18;

  // Backing box
  ctx.fillStyle = isPlayer ? 'rgba(15, 23, 42, 0.92)' : 'rgba(15, 23, 42, 0.84)';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, r);
  ctx.fill();

  // Accent border
  ctx.lineWidth = isPlayer ? 5 : 4;
  ctx.strokeStyle = accentColor;
  ctx.stroke();

  // Bottom pointer triangle
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 11, boxY + boxH);
  ctx.lineTo(w / 2 + 11, boxY + boxH);
  ctx.lineTo(w / 2, boxY + boxH + 14);
  ctx.closePath();
  ctx.fill();

  // Name text
  ctx.fillStyle = '#F8FAFC';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, w / 2, boxY + boxH / 2 + 1, boxW - 24);
}

export function createMetroWallTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(0, 0, 256, 256);
  for (let ty = 0; ty < 4; ty++) {
    for (let tx = 0; tx < 4; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? 'rgba(255,255,255,0.35)' : 'rgba(100,116,139,0.10)';
      ctx.fillRect(tx * 64, ty * 64, 64, 64);
    }
  }
  ctx.strokeStyle = 'rgba(71,85,105,0.45)';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 256; i += 64) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
  }
  // Dark blue lower band like a real station wall
  ctx.fillStyle = 'rgba(30,58,138,0.55)';
  ctx.fillRect(0, 192, 256, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 2);
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export function createMetroSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0B2A5B';
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = '#FACC15';
  ctx.fillRect(0, 0, 512, 10);
  ctx.fillRect(0, 118, 512, 10);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 58px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('METRO RAIL', 256, 60);
  ctx.font = 'bold 26px sans-serif';
  ctx.fillStyle = '#7DD3FC';
  ctx.fillText('MIND THE GAP', 256, 100);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
