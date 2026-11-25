import React from 'react';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';
import { CharacterConfig } from '../game/types';
import { DEFAULT_PLAYER } from '../game/storage';
import { CharacterEditorForm } from './CharacterEditorForm';

interface CharacterCustomizerProps {
  player: CharacterConfig;
  onChange: (player: CharacterConfig) => void;
  onBack: () => void;
  onStartRun: () => void;
}

export const CharacterCustomizer: React.FC<CharacterCustomizerProps> = ({
  player,
  onChange,
  onBack,
  onStartRun,
}) => {
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
                Customize Runner
              </h2>
              <p className="text-xs text-slate-400">
                Changes update your 3D character live
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onChange({ ...DEFAULT_PLAYER })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll p-5">
          <CharacterEditorForm
            value={player}
            onChange={onChange}
            nameLabel="Your Runner Name"
            placeholder="Enter your name"
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
