export type GameState = 'menu' | 'playing' | 'paused' | 'caught' | 'gameover';

export type ScreenOverlay =
  | 'main'
  | 'custom'
  | 'customize-player'
  | 'customize-friends'
  | 'controls'
  | 'none';

export type ThemeId = 'suburbia' | 'sunset' | 'night' | 'metro';

export type GameMode = 'premium' | 'hilol' | 'custom';

export type AccessoryType = 'cap' | 'headphones' | 'backpack' | 'bandana' | 'none';

export type ChaserPersonality = 'sprinter' | 'flanker' | 'tank' | 'wildcard';

export interface CharacterConfig {
  name: string;
  shirtColor: string;
  pantsColor: string;
  hairColor: string;
  skinTone: string;
  shoeColor: string;
  accessory: AccessoryType;
}

export interface ChaserConfig extends CharacterConfig {
  id: string;
  personality: ChaserPersonality;
}

export interface PlayerSettings {
  player: CharacterConfig;
  chasers: ChaserConfig[];
  chaserCount: 3 | 4;
  theme: ThemeId;
  soundEnabled: boolean;
  bestScore: number;
  bestDistance: number;
  totalCoins: number;
}

export interface ChaserTelemetry {
  id: string;
  name: string;
  color: string;
  dist: number;
  lane: number;
}

export interface LiveStats {
  score: number;
  distance: number;
  coins: number;
  speed: number;
  chaseGap: number; // 0 (caught) to 1 (max lead)
  closestChaserDist: number;
  closestChaserName: string;
  chaserDistances: ChaserTelemetry[];
  combo: number;
  alertLevel: 'safe' | 'close' | 'danger';
  boostActive: boolean;
  caughtBy?: string;
  powerAvailable: boolean; // Modi's Power exists in this mode
  powerReady: boolean;
  powerCharge: number; // 0..1 toward ready
  powerSecondsLeft: number; // seconds of flight remaining (0 if not flying)
  flying: boolean;
  subtitle: string;
}

export interface ThemePalette {
  id: ThemeId;
  label: string;
  skyTop: string;
  skyBottom: string;
  fogColor: number;
  fogDensity: number;
  sunColor: number;
  sunIntensity: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  roadBase: string;
  roadStripe: string;
  curbColor: string;
  sidewalkColor: string;
  grassColor: string;
  treeFoliage: number[];
  buildingColors: number[];
  windowColor: number;
  windowEmissive: number;
  windowEmissiveIntensity: number;
  lampEmissive: number;
  lampEmissiveIntensity: number;
}
