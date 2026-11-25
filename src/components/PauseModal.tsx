import React from 'react';
import { Home, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { LiveStats } from '../game/types';

interface PauseModalProps {
  stats: LiveStats;
  soundEnabled: boolean;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onToggleSound: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  stats,
  soundEnabled,
  onResume,
  onRestart,
  onMainMenu,
  onToggleSound,
}) => {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 bg-slate-950/65">
      <div
        className="w-full max-w-sm rounded-2xl border border-white/15 shadow-2xl p-6 space-y-5"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.96)' }}
      >
        <div className="text-center space-y-1">
          <h2 className="font-display text-3xl font-bold text-white">
            Run Paused
          </h2>
          <p className="text-xs text-slate-400">
            Your friends are waiting right behind you
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/10 text-center">
          <div>
            <div className="text-xs text-slate-400">Score</div>
            <div className="font-mono-num text-base font-bold text-white">
              {stats.score.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Distance</div>
            <div className="font-mono-num text-base font-bold text-white">
              {stats.distance.toLocaleString()}m
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Coins</div>
            <div className="font-mono-num text-base font-bold text-amber-400">
              {stats.coins}
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume Run</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Run</span>
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-semibold transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>Sound: On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span>Sound: Off</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onMainMenu}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 text-sm font-semibold transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
