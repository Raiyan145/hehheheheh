import { CharacterConfig, ChaserConfig, PlayerSettings, ThemeId } from './types';

const STORAGE_KEY = 'friends_chase_settings_v2';
const LEGACY_STORAGE_KEY = 'friends_chase_settings_v1';

export const SHIRT_SWATCHES = [
  '#F97316', // Vibrant Orange
  '#06B6D4', // Electric Cyan
  '#EF4444', // Racing Red
  '#10B981', // Emerald
  '#3B82F6', // Cobalt Blue
  '#FACC15', // Solar Yellow
  '#EC4899', // Hot Pink
  '#8B5CF6', // Violet
];

export const PANTS_SWATCHES = [
  '#1E293B', // Slate Denim
  '#1D4ED8', // Classic Jeans
  '#374151', // Charcoal Joggers
  '#78350F', // Khaki Brown
  '#0F172A', // Midnight Black
  '#475569', // Heather Gray
];

export const HAIR_SWATCHES = [
  '#1C1917', // Espresso Black
  '#57371D', // Chestnut Brown
  '#CA8A04', // Golden Blonde
  '#B45309', // Auburn Copper
  '#64748B', // Silver Frost
  '#DC2626', // Dyed Crimson
];

export const SKIN_SWATCHES = [
  '#FDE2C8', // Fair Warm
  '#F3C6A5', // Light Peach
  '#D99B72', // Medium Tan
  '#B6774E', // Warm Bronze
  '#7D4B2B', // Rich Umber
  '#4A2B18', // Deep Espresso
];

export const SHOE_SWATCHES = [
  '#FFFFFF', // Crisp White
  '#EF4444', // Red Runners
  '#06B6D4', // Cyan Kicks
  '#F59E0B', // Amber Gold
  '#1E293B', // Stealth Black
];

export const DEFAULT_PLAYER: CharacterConfig = {
  name: 'Adpi',
  shirtColor: '#F97316',
  pantsColor: '#1E293B',
  hairColor: '#1C1917',
  skinTone: '#D99B72',
  shoeColor: '#FFFFFF',
  accessory: 'cap',
};

export const DEFAULT_CHASERS: ChaserConfig[] = [
  {
    id: 'friend-1',
    name: 'Scorpii',
    shirtColor: '#06B6D4',
    pantsColor: '#1E293B',
    hairColor: '#57371D',
    skinTone: '#F3C6A5',
    shoeColor: '#FFFFFF',
    accessory: 'headphones',
    personality: 'sprinter',
  },
  {
    id: 'friend-2',
    name: 'Wobble Wobble',
    shirtColor: '#EC4899',
    pantsColor: '#0F172A',
    hairColor: '#1C1917',
    skinTone: '#B6774E',
    shoeColor: '#F59E0B',
    accessory: 'bandana',
    personality: 'flanker',
  },
  {
    id: 'friend-3',
    name: 'Florence',
    shirtColor: '#10B981',
    pantsColor: '#374151',
    hairColor: '#CA8A04',
    skinTone: '#FDE2C8',
    shoeColor: '#1E293B',
    accessory: 'backpack',
    personality: 'tank',
  },
  {
    id: 'friend-4',
    name: 'Awwww',
    shirtColor: '#8B5CF6',
    pantsColor: '#1D4ED8',
    hairColor: '#1C1917',
    skinTone: '#7D4B2B',
    shoeColor: '#06B6D4',
    accessory: 'cap',
    personality: 'wildcard',
  },
];

export const DEFAULT_SETTINGS: PlayerSettings = {
  player: { ...DEFAULT_PLAYER },
  chasers: DEFAULT_CHASERS.map((c) => ({ ...c })),
  chaserCount: 4,
  theme: 'suburbia',
  soundEnabled: true,
  bestScore: 0,
  bestDistance: 0,
  totalCoins: 0,
};

function sanitizeCharacter(raw: Partial<CharacterConfig> | undefined, fallback: CharacterConfig): CharacterConfig {
  if (!raw || typeof raw !== 'object') return { ...fallback };
  return {
    name: typeof raw.name === 'string' && raw.name.trim().length > 0 ? raw.name.trim().slice(0, 18) : fallback.name,
    shirtColor: typeof raw.shirtColor === 'string' ? raw.shirtColor : fallback.shirtColor,
    pantsColor: typeof raw.pantsColor === 'string' ? raw.pantsColor : fallback.pantsColor,
    hairColor: typeof raw.hairColor === 'string' ? raw.hairColor : fallback.hairColor,
    skinTone: typeof raw.skinTone === 'string' ? raw.skinTone : fallback.skinTone,
    shoeColor: typeof raw.shoeColor === 'string' ? raw.shoeColor : fallback.shoeColor,
    accessory:
      raw.accessory === 'cap' ||
      raw.accessory === 'headphones' ||
      raw.accessory === 'backpack' ||
      raw.accessory === 'bandana' ||
      raw.accessory === 'none'
        ? raw.accessory
        : fallback.accessory,
  };
}

export function loadSettings(): PlayerSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw) as Partial<PlayerSettings>;
        const validThemes: ThemeId[] = ['suburbia', 'sunset', 'night', 'metro'];
        return {
          ...structuredClone(DEFAULT_SETTINGS),
          chaserCount: legacy.chaserCount === 3 ? 3 : 4,
          theme: validThemes.includes(legacy.theme as ThemeId)
            ? (legacy.theme as ThemeId)
            : DEFAULT_SETTINGS.theme,
          soundEnabled: typeof legacy.soundEnabled === 'boolean' ? legacy.soundEnabled : true,
          bestScore: typeof legacy.bestScore === 'number' && Number.isFinite(legacy.bestScore) ? Math.max(0, Math.floor(legacy.bestScore)) : 0,
          bestDistance: typeof legacy.bestDistance === 'number' && Number.isFinite(legacy.bestDistance) ? Math.max(0, Math.floor(legacy.bestDistance)) : 0,
          totalCoins: typeof legacy.totalCoins === 'number' && Number.isFinite(legacy.totalCoins) ? Math.max(0, Math.floor(legacy.totalCoins)) : 0,
        };
      }
      return structuredClone(DEFAULT_SETTINGS);
    }
    const parsed = JSON.parse(raw) as Partial<PlayerSettings>;
    const validThemes: ThemeId[] = ['suburbia', 'sunset', 'night', 'metro'];
    const theme: ThemeId = validThemes.includes(parsed.theme as ThemeId)
      ? (parsed.theme as ThemeId)
      : DEFAULT_SETTINGS.theme;

    const chasers: ChaserConfig[] = DEFAULT_CHASERS.map((def, idx) => {
      const saved = Array.isArray(parsed.chasers) ? parsed.chasers[idx] : undefined;
      return {
        ...sanitizeCharacter(saved, def),
        id: def.id,
        personality: def.personality,
      };
    });

    return {
      player: sanitizeCharacter(parsed.player, DEFAULT_PLAYER),
      chasers,
      chaserCount: parsed.chaserCount === 3 ? 3 : 4,
      theme,
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
      bestScore: typeof parsed.bestScore === 'number' && Number.isFinite(parsed.bestScore) ? Math.max(0, Math.floor(parsed.bestScore)) : 0,
      bestDistance: typeof parsed.bestDistance === 'number' && Number.isFinite(parsed.bestDistance) ? Math.max(0, Math.floor(parsed.bestDistance)) : 0,
      totalCoins: typeof parsed.totalCoins === 'number' && Number.isFinite(parsed.totalCoins) ? Math.max(0, Math.floor(parsed.totalCoins)) : 0,
    };
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function saveSettings(settings: PlayerSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors in restricted browsing contexts
  }
}

export const FRIEND_NAME_POOL = [
  'Scorpii', 'Wobble Wobble', 'Florence', 'Awwww', 'Kai', 'Noah', 'Chloe', 'Milo', 'Nadia', 'Eli', 'Ruby', 'Toby'
];

// ---------------------------------------------------------------
// PREMIUM STORY MODE: fixed characters (player cannot change these).
// To rename the chasers, just edit the `name` fields below.
// ---------------------------------------------------------------
export const PREMIUM_PLAYER: CharacterConfig = {
  name: 'Apaaaa',
  shirtColor: '#EC4899',
  pantsColor: '#312E81',
  hairColor: '#1C1917',
  skinTone: '#D99B72',
  shoeColor: '#FACC15',
  accessory: 'bandana',
};

export const PREMIUM_CHASERS: ChaserConfig[] = [
  { id: 'prem-1', name: 'Blaze', shirtColor: '#EF4444', pantsColor: '#1E293B', hairColor: '#1C1917', skinTone: '#F3C6A5', shoeColor: '#FFFFFF', accessory: 'cap', personality: 'sprinter' },
  { id: 'prem-2', name: 'Zig', shirtColor: '#06B6D4', pantsColor: '#0F172A', hairColor: '#57371D', skinTone: '#B6774E', shoeColor: '#F59E0B', accessory: 'headphones', personality: 'flanker' },
  { id: 'prem-3', name: 'Tank', shirtColor: '#10B981', pantsColor: '#374151', hairColor: '#CA8A04', skinTone: '#FDE2C8', shoeColor: '#1E293B', accessory: 'backpack', personality: 'tank' },
  { id: 'prem-4', name: 'Rocket', shirtColor: '#8B5CF6', pantsColor: '#1D4ED8', hairColor: '#DC2626', skinTone: '#7D4B2B', shoeColor: '#06B6D4', accessory: 'bandana', personality: 'wildcard' },
];
