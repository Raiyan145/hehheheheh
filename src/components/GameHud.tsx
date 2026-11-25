import React, { useEffect, useState } from 'react';
import { Pause, Volume2, VolumeX, Zap, Wind } from 'lucide-react';
import { LiveStats } from '../game/types';

interface GameHudProps {
  stats: LiveStats;
  soundEnabled: boolean;
  onPause: () => void;
  onToggleSound: () => void;
  onPower: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  stats,
  soundEnabled,
  onPause,
  onToggleSound,
  onPower,
}) => {
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowHint(false), 5500);
    return () => window.clearTimeout(timer);
  }, []);

  const gapPct = Math.round(stats.chaseGap * 100);
  const barColor =
    stats.alertLevel === 'danger'
      ? 'bg-red-500'
      : stats.alertLevel === 'close'
      ? 'bg-amber-400'
      : 'bg-emerald-400';

  const statusText =
    stats.alertLevel === 'danger'
      ? `Danger · ${stats.closestChaserName} is right behind (${stats.closestChaserDist}m)`
      : stats.alertLevel === 'close'
      ? `Closing in · ${stats.closestChaserName} at ${stats.closestChaserDist}m`
      : `Lead safe · ${stats.closestChaserName} at ${stats.closestChaserDist}m`;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
      {/* Top HUD Row */}
      <div className="flex items-start justify-between gap-3">
        {/* Top-Left: Score, Distance, Coins, Speed */}
        <div
          className="rounded-xl px-4 py-2.5 border border-white/12 shadow-lg min-w-[170px]"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.84)' }}
        >
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-xs font-medium text-slate-400">Score</span>
            <span className="font-display text-2xl font-bold text-white font-mono-num leading-none">
              {stats.score.toLocaleString()}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2.5 text-xs text-slate-300 font-mono-num">
            <span>{stats.distance.toLocaleString()}m</span>
            <span aria-hidden="true" className="text-slate-600">/</span>
            <span className="text-amber-400 font-semibold">{stats.coins} coins</span>
            <span aria-hidden="true" className="text-slate-600">/</span>
            <span>{stats.speed} km/h</span>
          </div>
          {stats.boostActive && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Sprint Boost Active</span>
            </div>
          )}
        </div>

        {/* Top-Center: Chase Proximity Meter (Hidden on very narrow screens to avoid crowding, shown cleanly below on mobile) */}
        <div
          className="hidden md:flex flex-col items-center rounded-xl px-4 py-2.5 border border-white/12 shadow-lg min-w-[260px]"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.84)' }}
        >
          <div className="w-full flex items-center justify-between text-xs font-semibold text-slate-200 mb-1.5">
            <span>{statusText}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-150 ${barColor}`}
              style={{ width: `${Math.max(5, gapPct)}%` }}
            />
          </div>
        </div>

        {/* Top-Right: Audio & Pause */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
            className="p-2.5 rounded-xl border border-white/12 text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.84)' }}
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-cyan-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-400" />
            )}
          </button>

          <button
            type="button"
            onClick={onPause}
            aria-label="Pause game"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-white/12 text-slate-100 hover:bg-slate-800 text-sm font-semibold transition-colors cursor-pointer"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.84)' }}
          >
            <Pause className="w-4 h-4" />
            <span className="hidden sm:inline">Pause</span>
          </button>
        </div>
      </div>

      {/* Compact Mobile Chase Bar */}
      <div className="md:hidden self-center w-full max-w-xs mt-1">
        <div
          className="rounded-lg px-3 py-1.5 border border-white/10"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)' }}
        >
          <div className="text-[11px] font-semibold text-slate-200 text-center mb-1 truncate">
            {statusText}
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-150 ${barColor}`}
              style={{ width: `${Math.max(5, gapPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Voice subtitle */}
      {stats.subtitle && (
        <div className="self-center mt-2 rounded-xl px-4 py-2 border border-pink-400/40 text-sm font-semibold text-pink-200"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.88)' }}>
          {stats.subtitle}
        </div>
      )}

      {/* Modi's Power button (Premium mode) */}
      {stats.powerAvailable && (
        <div className="pointer-events-auto absolute right-3 sm:right-5 bottom-24 sm:bottom-10 flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={onPower}
            disabled={!stats.powerReady}
            aria-label="Use Modi's Power"
            className={`relative overflow-hidden w-24 h-24 rounded-full border-2 flex flex-col items-center justify-center text-center font-bold transition-all ${
              stats.powerReady
                ? 'border-pink-300 bg-pink-500 text-white shadow-[0_0_28px_rgba(236,72,153,0.8)] animate-pulse cursor-pointer'
                : stats.flying
                ? 'border-cyan-300 bg-cyan-500/80 text-white'
                : 'border-white/20 bg-slate-900/85 text-slate-400'
            }`}
          >
            {!stats.powerReady && !stats.flying && (
              <div
                className="absolute bottom-0 left-0 right-0 bg-pink-500/35"
                style={{ height: `${Math.round(stats.powerCharge * 100)}%` }}
              />
            )}
            <Wind className="relative w-6 h-6" />
            <span className="relative text-[11px] leading-tight px-1">
              {stats.flying
                ? `Flying ${stats.powerSecondsLeft}s`
                : stats.powerReady
                ? "Modi's Power!"
                : `${Math.max(0, Math.ceil((1 - stats.powerCharge) * 20))}s`}
            </span>
          </button>
          <span className="text-[10px] text-slate-300 hidden sm:block">Press E</span>
        </div>
      )}

      {/* Bottom Transient Hint (auto-fades after 5.5s so center & bottom remain clear) */}
      <div className="flex justify-center">
        {showHint && (
          <div
            className="rounded-lg px-4 py-2 border border-white/10 text-xs font-medium text-slate-200 transition-opacity duration-300"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.78)' }}
          >
            Arrows / WASD or Swipe to Dodge, Jump, and Slide
          </div>
        )}
      </div>
    </div>
  );
};
