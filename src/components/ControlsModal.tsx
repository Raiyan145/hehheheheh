import React from 'react';
import { ArrowLeft, Play } from 'lucide-react';

interface ControlsModalProps {
  onBack: () => void;
  onStartRun: () => void;
}

export const ControlsModal: React.FC<ControlsModalProps> = ({
  onBack,
  onStartRun,
}) => {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 bg-slate-950/65">
      <div
        className="w-full max-w-lg rounded-2xl border border-white/15 shadow-2xl p-6 space-y-5"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.96)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-white">
            Controls & Chase Rules
          </h2>
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            aria-label="Close controls"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 space-y-2.5">
            <div className="font-semibold text-amber-400">Desktop Keyboard</div>
            <div className="flex justify-between text-slate-300">
              <span>Move Left</span>
              <span className="font-mono-num text-white">A / Left Arrow</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Move Right</span>
              <span className="font-mono-num text-white">D / Right Arrow</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Jump</span>
              <span className="font-mono-num text-white">Space / W / Up</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Slide</span>
              <span className="font-mono-num text-white">S / Down Arrow</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Pause</span>
              <span className="font-mono-num text-white">Esc / P</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 space-y-2.5">
            <div className="font-semibold text-cyan-400">Touch & Mobile</div>
            <div className="flex justify-between text-slate-300">
              <span>Switch Lanes</span>
              <span className="text-white">Swipe Left / Right</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Jump</span>
              <span className="text-white">Swipe Up</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Slide</span>
              <span className="text-white">Swipe Down</span>
            </div>
            <p className="pt-2 text-xs text-slate-400 leading-relaxed">
              Swipe down mid-air to drop quickly into a slide under overhead barriers.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-white/10 text-xs text-slate-300 space-y-1.5 leading-relaxed">
          <div className="font-semibold text-white text-sm">How the Friends Chase Works</div>
          <p>
            Your 3–4 friends sprint dynamically behind you, leaping over barriers and dodging vans. Hitting an obstacle slows you down and lets them surge closer. Clean running, coin combos, and cyan Sprint Boosts push them back. If any friend catches up and tags you, the run ends!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-semibold transition-colors cursor-pointer"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onStartRun}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Run</span>
          </button>
        </div>
      </div>
    </div>
  );
};
