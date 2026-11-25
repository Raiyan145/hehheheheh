import React from 'react';
import { Play, Users, UserCog, HelpCircle, Volume2, VolumeX, Crown, Laugh, Wrench, ArrowLeft } from 'lucide-react';
import { GameMode, PlayerSettings, ScreenOverlay, ThemeId } from '../game/types';
import { THEME_PALETTES } from '../game/textures';

interface MainMenuProps {
  settings: PlayerSettings;
  view: 'main' | 'custom';
  onStartMode: (mode: GameMode) => void;
  onNavigate: (overlay: ScreenOverlay) => void;
  onChangeTheme: (theme: ThemeId) => void;
  onToggleSound: () => void;
}

const THEMES: ThemeId[] = ['suburbia', 'sunset', 'night', 'metro'];

export const MainMenu: React.FC<MainMenuProps> = ({
  settings,
  view,
  onStartMode,
  onNavigate,
  onChangeTheme,
  onToggleSound,
}) => {
  const activeNames = settings.chasers
    .slice(0, settings.chaserCount)
    .map((c) => c.name || 'Friend')
    .join(', ');

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar: Brand Title + Personal Best + Sound */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div
          className="pointer-events-auto rounded-xl px-5 py-4 border border-white/12 max-w-md"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.86)' }}
        >
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
            FRIENDS CHASE
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Outrun {activeNames} across endless city blocks.
          </p>
          <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 font-mono-num">
            <span>Best Score {settings.bestScore.toLocaleString()}</span>
            <span aria-hidden="true" className="text-slate-500">/</span>
            <span>Best Distance {settings.bestDistance.toLocaleString()}m</span>
            <span aria-hidden="true" className="text-slate-500">/</span>
            <span>Banked Coins {settings.totalCoins.toLocaleString()}</span>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('controls')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/15 text-sm font-semibold text-slate-100 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.86)' }}
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Controls</span>
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            aria-label={settings.soundEnabled ? 'Mute audio' : 'Enable audio'}
            className="p-2.5 rounded-lg border border-white/15 text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.86)' }}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-5 h-5 text-cyan-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {view === 'main' && (
        <div className="flex flex-col items-center gap-3 pb-1">
          <div className="pointer-events-auto w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([
              { mode: 'premium' as GameMode, title: 'Premium', sub: 'Story mode · Metro Rail · Modi\'s Power', Icon: Crown, color: 'bg-pink-500 hover:bg-pink-400 text-white' },
              { mode: 'hilol' as GameMode, title: 'Hi Lol', sub: 'Classic chase · jump the traps', Icon: Laugh, color: 'bg-amber-500 hover:bg-amber-400 text-slate-950' },
            ]).map(({ mode, title, sub, Icon, color }) => (
              <button
                key={mode}
                type="button"
                onClick={() => onStartMode(mode)}
                className={`rounded-2xl p-4 text-left shadow-2xl border border-white/15 transition-colors cursor-pointer ${color}`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <div className="font-display text-xl font-bold">{title}</div>
                <div className="text-xs opacity-90">{sub}</div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => onNavigate('custom')}
              className="rounded-2xl p-4 text-left shadow-2xl border border-white/15 bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
            >
              <Wrench className="w-6 h-6 mb-1 text-cyan-400" />
              <div className="font-display text-xl font-bold">Custom</div>
              <div className="text-xs text-slate-300">Customize runner &amp; friends before you start</div>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Action Dock: Unobstructed 3D Center Showcase */}
      {view === 'custom' && (
      <div className="flex flex-col items-center gap-3 pb-1">
        <div
          className="pointer-events-auto w-full max-w-3xl rounded-2xl p-3 sm:p-4 border border-white/12 shadow-2xl"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}
        >
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onNavigate('main')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold border border-white/10 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            {/* Theme Selector */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950/80 border border-white/10">
              {THEMES.map((tid) => {
                const active = settings.theme === tid;
                return (
                  <button
                    key={tid}
                    type="button"
                    onClick={() => onChangeTheme(tid)}
                    className={`flex-1 md:flex-initial px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-slate-800 text-amber-400 border border-white/10'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {THEME_PALETTES[tid].label}
                  </button>
                );
              })}
            </div>

            {/* Customize & Start Actions */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('customize-player')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-semibold border border-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <UserCog className="w-4 h-4 text-cyan-400" />
                <span>Runner ({settings.player.name})</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('customize-friends')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-semibold border border-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Users className="w-4 h-4 text-pink-400" />
                <span>Friends ({settings.chaserCount})</span>
              </button>

              <button
                type="button"
                onClick={() => onStartMode('custom')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold tracking-wide transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Run</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
