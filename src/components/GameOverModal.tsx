import React from 'react';
import { Home, RotateCcw, Trophy } from 'lucide-react';
import { LiveStats } from '../game/types';

interface GameOverModalProps {
  stats: LiveStats;
  bestScore: number;
  bestDistance: number;
  isNewBest: boolean;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  bestScore,
  bestDistance,
  isNewBest,
  onRestart,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 bg-slate-950/60">
      <div
        className="w-full max-w-md rounded-2xl border border-white/15 shadow-2xl p-6 space-y-5"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)' }}
      >
        <div className="text-center space-y-1.5">
          {isNewBest && (
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Trophy className="w-4 h-4" />
              <span>New Personal Best</span>
            </div>
          )}
          <h2 className="font-display text-3xl font-bold text-white">
            Caught by {stats.caughtBy || 'a Friend'}!
          </h2>
          <p className="text-sm text-slate-300">
            They finally tagged you after {stats.distance.toLocaleString()} meters.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900/90 border border-white/10 text-center">
          <div>
            <div className="text-xs text-slate-400">Final Score</div>
            <div className="mt-0.5 font-display text-xl font-bold text-white font-mono-num">
              {stats.score.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Distance</div>
            <div className="mt-0.5 font-display text-xl font-bold text-cyan-400 font-mono-num">
              {stats.distance.toLocaleString()}m
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Coins</div>
            <div className="mt-0.5 font-display text-xl font-bold text-amber-400 font-mono-num">
              {stats.coins}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 text-xs text-slate-400 font-mono-num">
          <span>Best Score {bestScore.toLocaleString()}</span>
          <span aria-hidden="true">/</span>
          <span>Best Distance {bestDistance.toLocaleString()}m</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMainMenu}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-semibold transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Main Menu</span>
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Run</span>
          </button>
        </div>
      </div>
    </div>
  );
};
