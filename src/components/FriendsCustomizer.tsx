import React from 'react';
import { ArrowLeft, Play, Shuffle } from 'lucide-react';
import { AccessoryType, ChaserConfig } from '../game/types';
import {
  FRIEND_NAME_POOL,
  HAIR_SWATCHES,
  PANTS_SWATCHES,
  SHIRT_SWATCHES,
  SHOE_SWATCHES,
  SKIN_SWATCHES,
} from '../game/storage';
import { CharacterEditorForm } from './CharacterEditorForm';

interface FriendsCustomizerProps {
  chasers: ChaserConfig[];
  chaserCount: 3 | 4;
  selectedIndex: number;
  onSelectIndex: (idx: number) => void;
  onChangeCount: (count: 3 | 4) => void;
  onChangeChasers: (chasers: ChaserConfig[]) => void;
  onBack: () => void;
  onStartRun: () => void;
}

const PERSONALITY_LABELS: Record<ChaserConfig['personality'], string> = {
  sprinter: 'Sprinter · Tracks your lane closely',
  flanker: 'Flanker · Cuts off side lanes',
  tank: 'Tank · Steady center pressure',
  wildcard: 'Wildcard · Unpredictable lane weaves',
};

const ACCESSORIES: AccessoryType[] = ['cap', 'headphones', 'backpack', 'bandana', 'none'];

export const FriendsCustomizer: React.FC<FriendsCustomizerProps> = ({
  chasers,
  chaserCount,
  selectedIndex,
  onSelectIndex,
  onChangeCount,
  onChangeChasers,
  onBack,
  onStartRun,
}) => {
  const safeIndex = Math.min(selectedIndex, chaserCount - 1);
  const activeFriend = chasers[safeIndex];

  const handleUpdateFriend = (updated: ChaserConfig) => {
    const next = chasers.map((c, idx) => (idx === safeIndex ? updated : c));
    onChangeChasers(next);
  };

  const handleRandomizeSquad = () => {
    const shuffledNames = [...FRIEND_NAME_POOL].sort(() => Math.random() - 0.5);
    const next = chasers.map((c, idx) => ({
      ...c,
      name: shuffledNames[idx % shuffledNames.length],
      shirtColor: SHIRT_SWATCHES[Math.floor(Math.random() * SHIRT_SWATCHES.length)],
      pantsColor: PANTS_SWATCHES[Math.floor(Math.random() * PANTS_SWATCHES.length)],
      hairColor: HAIR_SWATCHES[Math.floor(Math.random() * HAIR_SWATCHES.length)],
      skinTone: SKIN_SWATCHES[Math.floor(Math.random() * SKIN_SWATCHES.length)],
      shoeColor: SHOE_SWATCHES[Math.floor(Math.random() * SHOE_SWATCHES.length)],
      accessory: ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)],
    }));
    onChangeChasers(next);
  };

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex justify-end p-4 sm:p-6">
      <div
        className="pointer-events-auto w-full max-w-md h-full flex flex-col rounded-2xl border border-white/15 shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.92)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              aria-label="Back to main menu"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                Friends Squad
              </h2>
              <p className="text-xs text-slate-400">
                Name and style your 3–4 chasers
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRandomizeSquad}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Randomize</span>
          </button>
        </div>

        {/* Squad Count + Friend Tabs */}
        <div className="px-5 pt-4 pb-3 space-y-3 border-b border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">
              Chasers Behind You
            </span>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950/80 border border-white/10">
              {([3, 4] as const).map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => onChangeCount(cnt)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    chaserCount === cnt
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cnt} Friends
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {chasers.slice(0, chaserCount).map((friend, idx) => {
              const active = idx === safeIndex;
              return (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => onSelectIndex(idx)}
                  className={`px-2 py-2 rounded-lg text-xs font-semibold border transition-colors truncate cursor-pointer ${
                    active
                      ? 'bg-slate-800 text-white border-amber-400'
                      : 'bg-slate-900/70 text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  {friend.name || `Friend ${idx + 1}`}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-400">
            Role: {PERSONALITY_LABELS[activeFriend.personality]}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll p-5">
          <CharacterEditorForm
            value={activeFriend}
            onChange={(charCfg) =>
              handleUpdateFriend({ ...activeFriend, ...charCfg })
            }
            nameLabel={`Friend ${safeIndex + 1} Name`}
            placeholder="Friend name"
          />
        </div>

        <div className="p-4 border-t border-white/10 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Save & Back
          </button>
          <button
            type="button"
            onClick={onStartRun}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Run</span>
          </button>
        </div>
      </div>
    </div>
  );
};
