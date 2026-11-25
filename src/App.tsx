import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { loadSettings, saveSettings } from './game/storage';
import {
  CharacterConfig,
  ChaserConfig,
  GameMode,
  GameState,
  LiveStats,
  PlayerSettings,
  ScreenOverlay,
  ThemeId,
} from './game/types';
import { MainMenu } from './components/MainMenu';
import { CharacterCustomizer } from './components/CharacterCustomizer';
import { FriendsCustomizer } from './components/FriendsCustomizer';
import { ControlsModal } from './components/ControlsModal';
import { GameHud } from './components/GameHud';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';

const INITIAL_STATS: LiveStats = {
  score: 0,
  distance: 0,
  coins: 0,
  speed: 35,
  chaseGap: 0.68,
  closestChaserDist: 3.6,
  closestChaserName: 'Scorpii',
  chaserDistances: [],
  combo: 0,
  alertLevel: 'safe',
  boostActive: false,
  powerAvailable: false,
  powerReady: false,
  powerCharge: 0,
  powerSecondsLeft: 0,
  flying: false,
  subtitle: '',
};

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [settings, setSettings] = useState<PlayerSettings>(() => loadSettings());
  const settingsRef = useRef<PlayerSettings>(settings);

  const [gameState, setGameState] = useState<GameState>('menu');
  const gameStateRef = useRef<GameState>('menu');

  const [overlay, setOverlay] = useState<ScreenOverlay>('main');
  const [mode, setMode] = useState<GameMode>('custom');
  const [focusFriendIdx, setFocusFriendIdx] = useState(0);
  const [liveStats, setLiveStats] = useState<LiveStats>(INITIAL_STATS);
  const liveStatsRef = useRef<LiveStats>(INITIAL_STATS);
  const [isNewBest, setIsNewBest] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  // Touch swipe tracking
  const touchStartRef = useRef<{ x: number; y: number; handled: boolean } | null>(null);

  const commitSettings = useCallback((updater: (prev: PlayerSettings) => PlayerSettings) => {
    setSettings((prev) => {
      const next = updater(prev);
      settingsRef.current = next;
      saveSettings(next);
      engineRef.current?.updateSettings(next);
      return next;
    });
  }, []);

  // Mount Three.js GameEngine once
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const engine = new GameEngine(el, settingsRef.current, {
      onLiveStats: (stats) => {
        liveStatsRef.current = stats;
        setLiveStats(stats);
      },
      onGameStateChange: (nextState) => {
        gameStateRef.current = nextState;
        setGameState(nextState);

        if (nextState === 'gameover') {
          const finalStats = liveStatsRef.current;
          const prevBest = settingsRef.current.bestScore;
          const beatBest = finalStats.score > prevBest && finalStats.score > 0;
          setIsNewBest(beatBest);

          commitSettings((prev) => ({
            ...prev,
            bestScore: Math.max(prev.bestScore, finalStats.score),
            bestDistance: Math.max(prev.bestDistance, finalStats.distance),
            totalCoins: prev.totalCoins + finalStats.coins,
          }));
        }
      },
      onContextLostChange: (lost) => setContextLost(lost),
    });

    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [commitSettings]);

  // Sync overlay & focused friend camera target
  useEffect(() => {
    engineRef.current?.setOverlayContext(overlay, focusFriendIdx);
  }, [overlay, focusFriendIdx]);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts while typing in name input fields
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const state = gameStateRef.current;
      const engine = engineRef.current;
      if (!engine) return;

      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (state === 'playing') {
          e.preventDefault();
          engine.pauseGame();
        } else if (state === 'paused') {
          e.preventDefault();
          engine.resumeGame();
        }
        return;
      }

      if (state !== 'playing') return;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          engine.moveLeft();
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          engine.moveRight();
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          e.preventDefault();
          engine.jump();
          break;
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          engine.slide();
          break;
        case 'KeyE':
          e.preventDefault();
          engine.usePower();
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameStateRef.current !== 'playing') return;
    if (e.touches.length === 0) return;
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, handled: false };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (gameStateRef.current !== 'playing') return;
    const start = touchStartRef.current;
    if (!start || start.handled || e.touches.length === 0) return;

    const t = e.touches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const threshold = 28;

    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

    start.handled = true;
    const engine = engineRef.current;
    if (!engine) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) engine.moveLeft();
      else engine.moveRight();
    } else {
      if (dy < 0) engine.jump();
      else engine.slide();
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  const startMode = (m: GameMode) => {
    setMode(m);
    setIsNewBest(false);
    setOverlay('none');
    engineRef.current?.setMode(m);
    engineRef.current?.startRun();
  };

  // Restart in whichever mode is currently active
  const handleStartRun = () => startMode(mode);

  const handleMainMenu = () => {
    setOverlay('main');
    engineRef.current?.setMode('custom');
    engineRef.current?.returnToMenu();
  };

  const handleNavigate = (next: ScreenOverlay) => {
    if (next === 'custom') engineRef.current?.setMode('custom');
    setOverlay(next);
  };

  const handleToggleSound = () => {
    commitSettings((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  };

  const handleChangeTheme = (theme: ThemeId) => {
    commitSettings((prev) => ({ ...prev, theme }));
  };

  const handleUpdatePlayer = (player: CharacterConfig) => {
    commitSettings((prev) => ({ ...prev, player }));
  };

  const handleUpdateChasers = (chasers: ChaserConfig[]) => {
    commitSettings((prev) => ({ ...prev, chasers }));
  };

  const handleChangeChaserCount = (chaserCount: 3 | 4) => {
    commitSettings((prev) => ({ ...prev, chaserCount }));
    if (focusFriendIdx >= chaserCount) {
      setFocusFriendIdx(chaserCount - 1);
    }
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-slate-950"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dedicated Isolated WebGL Canvas Container */}
      <div ref={mountRef} className="fixed inset-0 w-full h-full" />

      {contextLost && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/90 p-6 text-center">
          <div className="max-w-sm space-y-2">
            <h2 className="font-display text-2xl font-bold text-white">
              Graphics Context Paused
            </h2>
            <p className="text-sm text-slate-300">
              Restoring 3D rendering resources automatically...
            </p>
          </div>
        </div>
      )}

      {/* Menu & Customization Screens */}
      {gameState === 'menu' && (overlay === 'main' || overlay === 'custom') && (
        <MainMenu
          settings={settings}
          view={overlay === 'custom' ? 'custom' : 'main'}
          onStartMode={startMode}
          onNavigate={handleNavigate}
          onChangeTheme={handleChangeTheme}
          onToggleSound={handleToggleSound}
        />
      )}

      {gameState === 'menu' && overlay === 'customize-player' && (
        <CharacterCustomizer
          player={settings.player}
          onChange={handleUpdatePlayer}
          onBack={() => setOverlay('custom')}
          onStartRun={() => startMode('custom')}
        />
      )}

      {gameState === 'menu' && overlay === 'customize-friends' && (
        <FriendsCustomizer
          chasers={settings.chasers}
          chaserCount={settings.chaserCount}
          selectedIndex={focusFriendIdx}
          onSelectIndex={setFocusFriendIdx}
          onChangeCount={handleChangeChaserCount}
          onChangeChasers={handleUpdateChasers}
          onBack={() => setOverlay('custom')}
          onStartRun={() => startMode('custom')}
        />
      )}

      {gameState === 'menu' && overlay === 'controls' && (
        <ControlsModal
          onBack={() => setOverlay('main')}
          onStartRun={() => startMode('hilol')}
        />
      )}

      {/* Active Gameplay HUD */}
      {gameState === 'playing' && (
        <GameHud
          stats={liveStats}
          soundEnabled={settings.soundEnabled}
          onPause={() => engineRef.current?.pauseGame()}
          onToggleSound={handleToggleSound}
          onPower={() => engineRef.current?.usePower()}
        />
      )}

      {/* Brief Dramatic Tag Banner during Caught Animation */}
      {gameState === 'caught' && (
        <div className="fixed inset-x-0 top-12 z-20 flex justify-center pointer-events-none px-4">
          <div
            className="rounded-xl px-6 py-3 border border-red-400/50 shadow-2xl text-center"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.92)' }}
          >
            <div className="font-display text-2xl sm:text-3xl font-bold text-red-400">
              Tagged by {liveStats.caughtBy || 'a Friend'}!
            </div>
          </div>
        </div>
      )}

      {/* Pause Overlay */}
      {gameState === 'paused' && (
        <PauseModal
          stats={liveStats}
          soundEnabled={settings.soundEnabled}
          onResume={() => engineRef.current?.resumeGame()}
          onRestart={handleStartRun}
          onMainMenu={handleMainMenu}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* Game Over Overlay */}
      {gameState === 'gameover' && (
        <GameOverModal
          stats={liveStats}
          bestScore={settings.bestScore}
          bestDistance={settings.bestDistance}
          isNewBest={isNewBest}
          onRestart={handleStartRun}
          onMainMenu={handleMainMenu}
        />
      )}
    </div>
  );
}
