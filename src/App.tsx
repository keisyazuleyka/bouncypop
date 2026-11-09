/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameState,
  MonsterSkin,
  MonsterSkinId,
  MONSTER_SKINS,
  WorldId,
} from './game/rules';
import { soundManager } from './game/audio';
import { GameCanvas, EndOfRunStats, HudDomRefs } from './components/GameCanvas';
import { HudAndMenus, SubModalType } from './components/HudAndMenus';

const STORAGE_KEYS = {
  BEST_SCORE: 'bouncy_pop_best_score_v1',
  LEVEL: 'bouncy_pop_level_v1',
  SKIN: 'bouncy_pop_skin_v1',
  UNLOCKED_SKINS: 'bouncy_pop_unlocked_skins_v1',
  WORLD: 'bouncy_pop_world_v1',
};

const DEFAULT_UNLOCKED_IDS: MonsterSkinId[] = MONSTER_SKINS.filter(
  (s) => s.unlockedByDefault
).map((s) => s.id);

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        return 'playing';
      }
    }
    return 'title';
  });

  const [activeSubModal, setActiveSubModal] = useState<SubModalType>('none');

  const [levelNumber, setLevelNumber] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlLvl = parseInt(params.get('level') || '', 10);
      if (!Number.isNaN(urlLvl) && urlLvl >= 1) {
        return urlLvl;
      }
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LEVEL);
      return saved ? Math.max(1, parseInt(saved, 10) || 1) : 1;
    } catch {
      return 1;
    }
  });

  const [selectedWorldId, setSelectedWorldId] = useState<WorldId | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WORLD) as WorldId | null;
      return saved || null;
    } catch {
      return null;
    }
  });

  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BEST_SCORE);
      return saved ? Math.max(0, parseInt(saved, 10) || 0) : 0;
    } catch {
      return 0;
    }
  });

  const [unlockedSkinIds, setUnlockedSkinIds] = useState<MonsterSkinId[]>(
    () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.UNLOCKED_SKINS);
        if (raw) {
          const parsed = JSON.parse(raw) as MonsterSkinId[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            return Array.from(new Set([...DEFAULT_UNLOCKED_IDS, ...parsed]));
          }
        }
      } catch {
        // ignore
      }
      return DEFAULT_UNLOCKED_IDS;
    }
  );

  const [selectedSkin, setSelectedSkin] = useState<MonsterSkin>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEYS.SKIN);
      return MONSTER_SKINS.find((s) => s.id === savedId) || MONSTER_SKINS[0];
    } catch {
      return MONSTER_SKINS[0];
    }
  });

  const [showcaseSkin, setShowcaseSkin] = useState<MonsterSkin>(selectedSkin);
  const [showcaseResetKey, setShowcaseResetKey] = useState<number>(0);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(true);
  const [showTutorial, setShowTutorial] = useState<boolean>(true);
  const [runKey, setRunKey] = useState<number>(0);
  const [endStats, setEndStats] = useState<EndOfRunStats | null>(null);

  // High-frequency HUD DOM refs updated directly from the 60Hz loop
  const scoreEl = useRef<HTMLSpanElement | null>(null);
  const bestScoreEl = useRef<HTMLSpanElement | null>(null);
  const floorsRemainingEl = useRef<HTMLSpanElement | null>(null);
  const comboEl = useRef<HTMLDivElement | null>(null);
  const progressFillEl = useRef<HTMLDivElement | null>(null);
  const progressTextEl = useRef<HTMLSpanElement | null>(null);
  const boostFillEl = useRef<HTMLDivElement | null>(null);
  const boostStatusEl = useRef<HTMLSpanElement | null>(null);
  const boostBtnEl = useRef<HTMLButtonElement | null>(null);
  const feverBannerEl = useRef<HTMLDivElement | null>(null);
  const calloutEl = useRef<HTMLDivElement | null>(null);
  const triggerBoostRef = useRef<(() => void) | null>(null);

  const hudRefs: HudDomRefs = {
    scoreEl,
    bestScoreEl,
    floorsRemainingEl,
    comboEl,
    progressFillEl,
    progressTextEl,
    boostFillEl,
    boostStatusEl,
    boostBtnEl,
    feverBannerEl,
    calloutEl,
  };

  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  const handleSetActiveSubModal = useCallback(
    (modal: SubModalType) => {
      soundManager.unlockAudio();
      soundManager.playClick();
      if (modal === 'monsters') {
        setShowcaseSkin(selectedSkin);
      }
      setActiveSubModal(modal);
    },
    [selectedSkin]
  );

  const handleStartGame = useCallback(() => {
    soundManager.unlockAudio();
    soundManager.playClick();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setActiveSubModal('none');
    document.body.dataset.state = 'playing';
    setEndStats(null);
    setGameState('playing');
  }, []);

  const handlePauseGame = useCallback(() => {
    soundManager.playClick();
    document.body.dataset.state = 'paused';
    setGameState('paused');
  }, []);

  const handleResumeGame = useCallback(() => {
    soundManager.playClick();
    document.body.dataset.state = 'playing';
    setGameState('playing');
  }, []);

  const handleRestartLevel = useCallback(() => {
    soundManager.unlockAudio();
    soundManager.playClick();
    setEndStats(null);
    setRunKey((k) => k + 1);
    document.body.dataset.state = 'playing';
    setGameState('playing');
  }, []);

  const handleNextLevel = useCallback(() => {
    soundManager.unlockAudio();
    soundManager.playClick();
    setSelectedWorldId(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.WORLD);
    } catch {
      // ignore
    }
    setLevelNumber((prev) => {
      const next = prev + 1;
      try {
        localStorage.setItem(STORAGE_KEYS.LEVEL, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
    setEndStats(null);
    setRunKey((k) => k + 1);
    document.body.dataset.state = 'playing';
    setGameState('playing');
  }, []);

  const handleReturnTitle = useCallback(() => {
    soundManager.playClick();
    setEndStats(null);
    setActiveSubModal('none');
    setRunKey((k) => k + 1);
    document.body.dataset.state = 'title';
    setGameState('title');
  }, []);

  const handlePreviewSkin = useCallback((skin: MonsterSkin) => {
    soundManager.unlockAudio();
    soundManager.playClick();
    setShowcaseSkin(skin);
  }, []);

  const handleSelectSkin = useCallback((skin: MonsterSkin) => {
    soundManager.unlockAudio();
    soundManager.playClick();
    setSelectedSkin(skin);
    setShowcaseSkin(skin);
    try {
      localStorage.setItem(STORAGE_KEYS.SKIN, skin.id);
    } catch {
      // ignore
    }
  }, []);

  const handleUnlockSkin = useCallback((skin: MonsterSkin) => {
    soundManager.unlockAudio();
    soundManager.playGemPickup();
    setUnlockedSkinIds((prev) => {
      const next = Array.from(new Set([...prev, skin.id]));
      try {
        localStorage.setItem(STORAGE_KEYS.UNLOCKED_SKINS, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    setSelectedSkin(skin);
    setShowcaseSkin(skin);
    try {
      localStorage.setItem(STORAGE_KEYS.SKIN, skin.id);
    } catch {
      // ignore
    }
  }, []);

  const handleResetShowcaseAngle = useCallback(() => {
    soundManager.unlockAudio();
    soundManager.playClick();
    setShowcaseResetKey((k) => k + 1);
  }, []);

  const handleSelectWorld = useCallback(
    (worldId: WorldId | null, startLevel?: number) => {
      soundManager.unlockAudio();
      soundManager.playClick();
      setSelectedWorldId(worldId);
      if (typeof startLevel === 'number') {
        setLevelNumber(startLevel);
        try {
          localStorage.setItem(STORAGE_KEYS.LEVEL, String(startLevel));
        } catch {
          // ignore
        }
      }
      try {
        if (worldId) {
          localStorage.setItem(STORAGE_KEYS.WORLD, worldId);
        } else {
          localStorage.removeItem(STORAGE_KEYS.WORLD);
        }
      } catch {
        // ignore
      }
      setRunKey((k) => k + 1);
    },
    []
  );

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundManager.soundEnabled = next;
      if (next) {
        soundManager.unlockAudio();
        soundManager.playClick();
      }
      return next;
    });
  }, []);

  const handleToggleVibration = useCallback(() => {
    setVibrationEnabled((prev) => {
      const next = !prev;
      soundManager.vibrationEnabled = next;
      if (next) {
        soundManager.vibrate(15);
      }
      soundManager.playClick();
      return next;
    });
  }, []);

  const handleDismissTutorial = useCallback(() => {
    setShowTutorial(false);
  }, []);

  const handleOpenTutorial = useCallback(() => {
    setShowTutorial(true);
  }, []);

  const handleActivateBoost = useCallback(() => {
    if (triggerBoostRef.current) {
      triggerBoostRef.current();
    }
  }, []);

  const handleRunComplete = useCallback((stats: EndOfRunStats) => {
    setBestScore((prev) => {
      const updated = Math.max(prev, stats.bestScore);
      try {
        localStorage.setItem(STORAGE_KEYS.BEST_SCORE, String(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    setEndStats(stats);
    document.body.dataset.state = 'gameover';
    setGameState('gameover');
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        if (gameState === 'title' && activeSubModal === 'none') {
          e.preventDefault();
          handleStartGame();
        } else if (gameState === 'gameover' && endStats) {
          e.preventDefault();
          if (endStats.outcome === 'victory') {
            handleNextLevel();
          } else {
            handleRestartLevel();
          }
        }
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        if (gameState === 'title' && activeSubModal !== 'none') {
          e.preventDefault();
          setActiveSubModal('none');
        } else if (gameState === 'playing') {
          e.preventDefault();
          handlePauseGame();
        } else if (gameState === 'paused') {
          e.preventDefault();
          handleResumeGame();
        }
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleSound();
      } else if (
        e.code === 'KeyR' &&
        (gameState === 'playing' || gameState === 'paused')
      ) {
        e.preventDefault();
        handleRestartLevel();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    gameState,
    activeSubModal,
    endStats,
    handleStartGame,
    handleNextLevel,
    handleRestartLevel,
    handlePauseGame,
    handleResumeGame,
    handleToggleSound,
  ]);

  const showcaseActive = gameState === 'title' && activeSubModal === 'monsters';

  return (
    <main className="relative w-full h-full overflow-hidden select-none touch-none bg-indigo-950">
      <GameCanvas
        gameState={gameState}
        levelNumber={levelNumber}
        selectedWorldId={selectedWorldId}
        runKey={runKey}
        selectedSkin={selectedSkin}
        showcaseActive={showcaseActive}
        showcaseSkin={showcaseSkin}
        showcaseResetKey={showcaseResetKey}
        bestScore={bestScore}
        hudRefs={hudRefs}
        triggerBoostRef={triggerBoostRef}
        onTutorialDismiss={handleDismissTutorial}
        onRunComplete={handleRunComplete}
      />

      <HudAndMenus
        gameState={gameState}
        activeSubModal={activeSubModal}
        levelNumber={levelNumber}
        selectedWorldId={selectedWorldId}
        bestScore={bestScore}
        selectedSkin={selectedSkin}
        showcaseSkin={showcaseSkin}
        unlockedSkinIds={unlockedSkinIds}
        soundEnabled={soundEnabled}
        vibrationEnabled={vibrationEnabled}
        showTutorial={showTutorial}
        endStats={endStats}
        hudRefs={hudRefs}
        onSetActiveSubModal={handleSetActiveSubModal}
        onStartGame={handleStartGame}
        onPauseGame={handlePauseGame}
        onResumeGame={handleResumeGame}
        onRestartLevel={handleRestartLevel}
        onNextLevel={handleNextLevel}
        onReturnTitle={handleReturnTitle}
        onPreviewSkin={handlePreviewSkin}
        onSelectSkin={handleSelectSkin}
        onUnlockSkin={handleUnlockSkin}
        onResetShowcaseAngle={handleResetShowcaseAngle}
        onSelectWorld={handleSelectWorld}
        onToggleSound={handleToggleSound}
        onToggleVibration={handleToggleVibration}
        onOpenTutorial={handleOpenTutorial}
        onActivateBoost={handleActivateBoost}
      />
    </main>
  );
}
