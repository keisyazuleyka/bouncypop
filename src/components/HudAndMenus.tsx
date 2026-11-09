import React from 'react';
import {
  GameState,
  MonsterSkin,
  MonsterSkinId,
  MONSTER_SKINS,
  WorldId,
  WORLD_THEMES,
  getWorldForLevel,
  getLevelDifficultyConfig,
  getTotalFloorsForLevel,
} from '../game/rules';
import { EndOfRunStats, HudDomRefs } from './GameCanvas';

export type SubModalType = 'none' | 'monsters' | 'worlds' | 'settings';

interface HudAndMenusProps {
  gameState: GameState;
  activeSubModal: SubModalType;
  levelNumber: number;
  selectedWorldId: WorldId | null;
  bestScore: number;
  selectedSkin: MonsterSkin;
  showcaseSkin: MonsterSkin;
  unlockedSkinIds: MonsterSkinId[];
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showTutorial: boolean;
  endStats: EndOfRunStats | null;
  hudRefs: HudDomRefs;
  onSetActiveSubModal: (modal: SubModalType) => void;
  onStartGame: () => void;
  onPauseGame: () => void;
  onResumeGame: () => void;
  onRestartLevel: () => void;
  onNextLevel: () => void;
  onReturnTitle: () => void;
  onPreviewSkin: (skin: MonsterSkin) => void;
  onSelectSkin: (skin: MonsterSkin) => void;
  onUnlockSkin: (skin: MonsterSkin) => void;
  onResetShowcaseAngle: () => void;
  onSelectWorld: (worldId: WorldId | null, startLevel?: number) => void;
  onToggleSound: () => void;
  onToggleVibration: () => void;
  onOpenTutorial: () => void;
  onActivateBoost: () => void;
}

const QUICK_STAGE_PRESETS = [
  { level: 1, tag: '25 FLOORS' },
  { level: 2, tag: '30 FLOORS' },
  { level: 3, tag: '35 FLOORS' },
  { level: 5, tag: '45 FLOORS' },
  { level: 7, tag: '55 FLOORS' },
  { level: 8, tag: '60 FLOORS' },
  { level: 10, tag: '70 FLOORS' },
  { level: 11, tag: '75 FLOORS' },
];

/**
 * Stacked 2-Line Bubbly SVG Title Lockup matching the BOUNCY POP reference art:
 * Glossy hot-pink "BOUNCY" on top, yellow & turquoise "POP" below, chunky dark outline,
 * and floating candy stars.
 */
const BouncyPopTitleSvg: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <svg
    viewBox="0 0 380 156"
    className={
      compact
        ? 'w-32 sm:w-36 h-auto mx-auto drop-shadow-[0_3px_0_rgba(15,10,40,0.9)]'
        : 'w-full max-w-[310px] sm:max-w-[335px] h-auto mx-auto drop-shadow-[0_7px_0_rgba(15,10,40,0.9)]'
    }
    role="img"
    aria-label="BOUNCY POP"
  >
    <defs>
      <linearGradient id="pinkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ff85c8" />
        <stop offset="45%" stopColor="#ff3b9a" />
        <stop offset="100%" stopColor="#d90479" />
      </linearGradient>
      <linearGradient id="yellowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#facc15" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
      <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#67e8f9" />
        <stop offset="50%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
    </defs>

    {/* Decorative Floating Candy Stars */}
    <polygon
      points="44,24 49,34 60,35 52,42 54,53 44,47 34,53 36,42 28,35 39,34"
      fill="#ffe600"
      stroke="#1e1b4b"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    <polygon
      points="336,28 340,36 349,37 342,43 344,52 336,47 328,52 330,43 323,37 332,36"
      fill="#2dd4bf"
      stroke="#1e1b4b"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    <polygon
      points="66,118 71,126 80,127 73,133 75,142 66,137 57,142 59,133 52,127 61,126"
      fill="#2dd4bf"
      stroke="#1e1b4b"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    <polygon
      points="316,112 321,121 331,122 323,129 325,139 316,133 307,139 309,129 301,122 311,121"
      fill="#ffe600"
      stroke="#1e1b4b"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />

    {/* Line 1: BOUNCY (Hot Pink) */}
    <text
      x="190"
      y="74"
      textAnchor="middle"
      fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
      fontWeight="700"
      fontSize="62"
      fill="#1e1b4b"
      stroke="#1e1b4b"
      strokeWidth="18"
      strokeLinejoin="round"
      paintOrder="stroke fill"
      letterSpacing="2"
    >
      BOUNCY
    </text>
    <text
      x="190"
      y="70"
      textAnchor="middle"
      fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
      fontWeight="700"
      fontSize="62"
      fill="url(#pinkGrad)"
      stroke="#ffffff"
      strokeWidth="3"
      paintOrder="stroke fill"
      letterSpacing="2"
    >
      BOUNCY
    </text>

    {/* Line 2: POP (Yellow + Cyan Accent) */}
    <text
      x="190"
      y="138"
      textAnchor="middle"
      fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
      fontWeight="700"
      fontSize="68"
      fill="#1e1b4b"
      stroke="#1e1b4b"
      strokeWidth="18"
      strokeLinejoin="round"
      paintOrder="stroke fill"
      letterSpacing="2"
    >
      POP
    </text>
    <text
      x="190"
      y="134"
      textAnchor="middle"
      fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
      fontWeight="700"
      fontSize="68"
      stroke="#ffffff"
      strokeWidth="3"
      paintOrder="stroke fill"
      letterSpacing="2"
    >
      <tspan fill="url(#yellowGrad)">PO</tspan>
      <tspan fill="url(#cyanGrad)">P</tspan>
    </text>
  </svg>
);

/**
 * Compact Monster Card Thumbnail Icon for the 6-Monster Selection Grid
 * (while the main centerpiece is the live interactive 3D Monster Showcase!)
 */
const MonsterCardThumbSvg: React.FC<{ skin: MonsterSkin }> = ({ skin }) => (
  <svg viewBox="0 0 80 80" className="w-10 h-10 mx-auto drop-shadow">
    {skin.bodyStyle !== 'cube' && (
      <>
        <path
          d="M22 24 L14 8 L30 18 Z"
          fill="#facc15"
          stroke="#1e1b4b"
          strokeWidth="2.5"
        />
        <path
          d="M58 24 L66 8 L50 18 Z"
          fill="#facc15"
          stroke="#1e1b4b"
          strokeWidth="2.5"
        />
      </>
    )}
    <rect
      x="14"
      y="18"
      width="52"
      height="48"
      rx={skin.bodyStyle === 'cube' ? '10' : '24'}
      fill={skin.badgeHex}
      stroke="#1e1b4b"
      strokeWidth="3"
    />
    <ellipse
      cx="40"
      cy="50"
      rx="16"
      ry="11"
      fill="rgba(255,255,255,0.28)"
    />
    <circle
      cx="30"
      cy="36"
      r="7.5"
      fill="#ffffff"
      stroke="#1e1b4b"
      strokeWidth="2"
    />
    <circle
      cx="50"
      cy="36"
      r="7.5"
      fill="#ffffff"
      stroke="#1e1b4b"
      strokeWidth="2"
    />
    {skin.bodyStyle === 'cyclops' && (
      <circle
        cx="40"
        cy="24"
        r="5.5"
        fill="#ffffff"
        stroke="#1e1b4b"
        strokeWidth="1.8"
      />
    )}
    <circle cx="31" cy="36" r="4" fill="#1e1b4b" />
    <circle cx="49" cy="36" r="4" fill="#1e1b4b" />
    {skin.bodyStyle === 'cyclops' && (
      <circle cx="40" cy="24" r="2.8" fill="#1e1b4b" />
    )}
    <path
      d="M34 46 Q40 52 46 46 Z"
      fill="#881337"
      stroke="#1e1b4b"
      strokeWidth="1.8"
    />
  </svg>
);

export const HudAndMenus: React.FC<HudAndMenusProps> = ({
  gameState,
  activeSubModal,
  levelNumber,
  selectedWorldId,
  bestScore,
  selectedSkin,
  showcaseSkin,
  unlockedSkinIds,
  soundEnabled,
  vibrationEnabled,
  showTutorial,
  endStats,
  hudRefs,
  onSetActiveSubModal,
  onStartGame,
  onPauseGame,
  onResumeGame,
  onRestartLevel,
  onNextLevel,
  onReturnTitle,
  onPreviewSkin,
  onSelectSkin,
  onUnlockSkin,
  onResetShowcaseAngle,
  onSelectWorld,
  onToggleSound,
  onToggleVibration,
  onOpenTutorial,
  onActivateBoost,
}) => {
  const activeWorld = getWorldForLevel(levelNumber, selectedWorldId);
  const difficultyConfig = getLevelDifficultyConfig(levelNumber);
  const totalFloors = getTotalFloorsForLevel(levelNumber);
  const isShowcaseUnlocked = unlockedSkinIds.includes(showcaseSkin.id);
  const isShowcaseEquipped = showcaseSkin.id === selectedSkin.id;

  return (
    <div className="fixed inset-0 pointer-events-none z-10 flex flex-col justify-between safe-top safe-bottom safe-x">
      {/* =====================================================================
          PLAYING HUD (Colorful Glossy 3D Toy Theme, >= 85% clear playfield)
         ===================================================================== */}
      {gameState === 'playing' && (
        <>
          {/* Compact Top Toy HUD Container */}
          <div className="w-full max-w-[440px] mx-auto flex flex-col gap-1.5 pt-0.5">
            {/* Row 1: Glossy Hero Score Card (Left/Center Focus) + Glossy Toy Utility Buttons (Right) */}
            <div className="w-full flex items-start justify-between gap-2">
              {/* Main Visual Focus: Glossy Toy Score Panel + Best Score Pill */}
              <div className="relative flex items-center gap-2.5 bg-gradient-to-b from-purple-600/95 via-indigo-800/95 to-indigo-950/95 border-2 border-pink-400/90 rounded-3xl px-3.5 py-1.5 shadow-[0_5px_0_#311068,0_10px_20px_rgba(0,0,0,0.45)] overflow-hidden">
                {/* Top Glossy Specular Highlight */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-2 top-0.5 h-2 rounded-full bg-gradient-to-b from-white/45 to-transparent"
                />

                {/* Current Score Hero Display */}
                <div className="relative flex items-baseline gap-1.5">
                  <span
                    aria-hidden="true"
                    className="text-base sm:text-lg leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)]"
                  >
                    ⭐
                  </span>
                  <span
                    ref={hudRefs.scoreEl}
                    data-testid="hud-score"
                    className="inline-block font-display font-bold text-3xl sm:text-4xl text-white hud-stroke font-mono-num leading-none tracking-tight transition-transform duration-75 origin-center drop-shadow-[0_3px_0_#581c87]"
                  >
                    0
                  </span>
                  <span className="text-[10px] font-extrabold tracking-wider text-yellow-300 uppercase hud-stroke">
                    PTS
                  </span>
                </div>

                {/* Divider */}
                <div
                  aria-hidden="true"
                  className="h-6 w-[2px] rounded-full bg-gradient-to-b from-pink-400/70 via-purple-300/40 to-transparent"
                />

                {/* Compact Readable BEST SCORE Section */}
                <div className="relative flex flex-col justify-center bg-indigo-950/90 border border-yellow-400/70 rounded-2xl px-2.5 py-0.5 shadow-inner">
                  <span className="text-[8px] font-extrabold tracking-widest text-yellow-300 uppercase leading-tight">
                    👑 BEST
                  </span>
                  <span
                    ref={hudRefs.bestScoreEl}
                    data-testid="hud-best-score"
                    className="text-xs font-extrabold text-white font-mono-num leading-tight"
                  >
                    {bestScore.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Right Cluster: Glossy 3D Toy Utility Buttons (Sound + Pause) */}
              <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={soundEnabled ? 'Mute Sound' : 'Unmute Sound'}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onToggleSound();
                  }}
                  className="relative min-w-[44px] min-h-[44px] w-11 h-11 rounded-2xl bg-gradient-to-b from-cyan-400 via-sky-500 to-indigo-700 hover:from-cyan-300 hover:to-indigo-600 active:scale-95 border-2 border-cyan-200 shadow-[0_4px_0_#1e3a8a,0_6px_12px_rgba(0,0,0,0.4)] flex items-center justify-center text-white transition-transform cursor-pointer overflow-hidden"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-1.5 top-0.5 h-1.5 rounded-full bg-white/45"
                  />
                  {soundEnabled ? (
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 drop-shadow"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11 5L6 9H2v6h4l5 4V5z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"
                      />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 text-pink-200 drop-shadow"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11 5L6 9H2v6h4l5 4V5z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M23 9l-6 6M17 9l6 6"
                      />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Pause Game"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onPauseGame();
                  }}
                  className="relative min-w-[44px] min-h-[44px] w-11 h-11 rounded-2xl bg-gradient-to-b from-yellow-300 via-orange-500 to-pink-600 hover:from-yellow-200 hover:to-pink-500 active:scale-95 border-2 border-yellow-200 shadow-[0_4px_0_#9d174d,0_6px_12px_rgba(0,0,0,0.4)] flex items-center justify-center text-white transition-transform cursor-pointer overflow-hidden"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-1.5 top-0.5 h-1.5 rounded-full bg-white/50"
                  />
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 drop-shadow"
                    fill="currentColor"
                  >
                    <rect x="6" y="5" width="4" height="14" rx="1.5" />
                    <rect x="14" y="5" width="4" height="14" rx="1.5" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Row 2: Stylish Level & Descent Progress Bar + Animated Combo Multiplier Pill */}
            <div className="w-full flex items-center justify-between gap-1.5">
              <div className="relative flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-indigo-950/95 via-purple-950/95 to-indigo-950/95 border-2 border-cyan-400/80 rounded-2xl px-2.5 py-1 shadow-[0_4px_0_#1e1b4b,0_6px_14px_rgba(0,0,0,0.35)] overflow-hidden">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-2 top-0.5 h-1 rounded-full bg-white/30"
                />
                {/* Level Badge */}
                <span
                  data-testid="hud-level-label"
                  className="bg-gradient-to-b from-pink-500 to-purple-700 border border-pink-300 rounded-xl px-2 py-0.5 text-[11px] font-extrabold text-yellow-200 font-mono-num whitespace-nowrap shadow-sm"
                >
                  LVL {levelNumber}
                </span>

                {/* Glossy Descent Progress Bar */}
                <div className="relative w-16 sm:w-28 h-3 bg-indigo-950 rounded-full overflow-hidden border border-purple-500/80 p-0.5 shadow-inner">
                  <div
                    ref={hudRefs.progressFillEl}
                    className="h-full bg-gradient-to-r from-pink-500 via-yellow-400 to-cyan-400 rounded-full transition-[width] duration-75"
                    style={{ width: '0%' }}
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-1 top-0.5 h-1 rounded-full bg-white/40"
                  />
                </div>

                {/* Progress Percentage */}
                <span
                  ref={hudRefs.progressTextEl}
                  data-testid="hud-progress-text"
                  className="text-[11px] font-extrabold text-white font-mono-num w-8 text-right hud-stroke"
                >
                  0%
                </span>

                {/* Compact Remaining Floors Badge */}
                <div className="flex items-baseline gap-1 bg-indigo-900/90 border border-cyan-400/60 rounded-xl px-2 py-0.5 whitespace-nowrap">
                  <span
                    ref={hudRefs.floorsRemainingEl}
                    data-testid="hud-floors-remaining"
                    className="text-xs font-extrabold text-cyan-300 font-mono-num"
                  >
                    {totalFloors - 1}
                  </span>
                  <span className="text-[9px] font-extrabold text-purple-200 uppercase tracking-wider">
                    FL LEFT
                  </span>
                </div>
              </div>

              {/* Animated Combo Multiplier Indicator */}
              <div
                ref={hudRefs.comboEl}
                data-testid="hud-combo"
                className="bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400 border-2 border-white rounded-full px-2.5 py-0.5 text-xs font-extrabold text-white hud-stroke shadow-[0_3px_0_#9d174d] transition-transform duration-100 opacity-0 whitespace-nowrap shrink-0"
              >
                2x COMBO
              </div>
            </div>

            {/* Row 3: Compact Boost Bar + Difficulty Tier & ABSOLUTE DROP Banner */}
            <div className="w-full flex items-center justify-between gap-1.5 min-h-[26px]">
              {/* Boost Energy Pill */}
              <div className="relative flex items-center gap-1.5 bg-indigo-950/90 border-2 border-yellow-400/75 rounded-2xl px-2.5 py-0.5 shadow-[0_3px_0_#311068]">
                <span className="text-[10px] font-extrabold text-cyan-300 uppercase tracking-wider whitespace-nowrap">
                  ⚡ BOOST
                </span>
                <div className="w-14 sm:w-20 h-2 bg-indigo-900 rounded-full overflow-hidden border border-indigo-700">
                  <div
                    ref={hudRefs.boostFillEl}
                    data-testid="hud-boost-fill"
                    className="h-full bg-gradient-to-r from-cyan-400 via-yellow-300 to-pink-500 rounded-full transition-[width] duration-75"
                    style={{ width: '100%' }}
                  />
                </div>
                <span
                  ref={hudRefs.boostStatusEl}
                  data-testid="hud-boost-status"
                  className="text-[10px] font-extrabold text-yellow-300 font-mono-num whitespace-nowrap"
                >
                  READY 100%
                </span>
              </div>

              {/* Right Cluster: Difficulty Tier + ABSOLUTE DROP / TURBO BOOST Banner */}
              <div className="relative flex items-center gap-1.5 shrink-0">
                <span
                  data-testid="hud-difficulty-tier"
                  className="hidden sm:inline-block bg-indigo-950/90 border border-purple-400/60 rounded-xl px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-cyan-300 hud-stroke whitespace-nowrap"
                >
                  {difficultyConfig.tierLabel}
                </span>
                <div
                  ref={hudRefs.feverBannerEl}
                  className="bg-gradient-to-r from-yellow-400 via-pink-500 to-cyan-400 border-2 border-white rounded-full px-2.5 py-0.5 text-[10px] font-extrabold text-white hud-stroke tracking-wider shadow-[0_3px_0_#9d174d] opacity-0 whitespace-nowrap pointer-events-none"
                >
                  ABSOLUTE DROP! ★
                </div>
              </div>
            </div>
          </div>

          {/* Center-Top Floating Combo Callout (NICE!, GREAT!, SUPER DROP!, ABSOLUTE!) */}
          <div className="w-full flex justify-center pointer-events-none -mt-10">
            <div
              ref={hudRefs.calloutEl}
              data-testid="combo-callout"
              className="font-display font-bold text-3xl sm:text-4xl text-yellow-300 hud-stroke tracking-wide drop-shadow-[0_4px_0_#9d174d] opacity-0 transition-transform duration-75"
            >
              ABSOLUTE!
            </div>
          </div>

          {/* Bottom Safe Area: Dedicated Mobile BOOST Button + Drag Tutorial Cue */}
          <div className="w-full max-w-[440px] mx-auto flex flex-col gap-2 pb-1">
            {/* Dedicated Mobile BOOST Action Button (Right Thumb Zone, never interferes with tower drag) */}
            <div className="w-full flex items-center justify-end px-1">
              <button
                ref={hudRefs.boostBtnEl}
                type="button"
                tabIndex={-1}
                data-testid="boost-button"
                data-boost-state="ready"
                aria-label="Activate Speed Boost"
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.currentTarget.blur();
                  onActivateBoost();
                }}
                className="pointer-events-auto min-h-[54px] px-5 py-2.5 rounded-full bg-gradient-to-b from-cyan-400 via-sky-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 disabled:from-indigo-950 disabled:to-indigo-900 disabled:opacity-60 active:scale-95 border-3 border-yellow-300 shadow-[0_5px_0_#1e3a8a] flex items-center gap-2 text-white font-display font-bold text-lg tracking-wider cursor-pointer transition-transform"
              >
                <span className="text-xl leading-none">⚡</span>
                <span className="hud-stroke">BOOST!</span>
              </button>
            </div>

            <div className="w-full flex flex-col items-center">
              {showTutorial ? (
                <div
                  data-testid="tutorial-banner"
                  className="bg-indigo-950/90 border-2 border-cyan-400 rounded-2xl px-4 py-2.5 text-center shadow-xl max-w-[345px]"
                >
                  <div className="flex items-center justify-center gap-3 mb-1 text-cyan-300">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 16l-4-4m0 0l4-4m-4 4h18"
                      />
                    </svg>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                      Drag Left or Right to Rotate
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-purple-100 leading-snug">
                    Align <strong className="text-cyan-300">Wide Gaps</strong>{' '}
                    for multi-floor drops · Tap{' '}
                    <strong className="text-yellow-300">⚡ BOOST</strong> to
                    smash!
                  </p>
                </div>
              ) : (
                <p className="text-xs font-bold text-white hud-stroke text-center">
                  {activeWorld.name} ({totalFloors} Floors) · Drag to Spin · Tap
                  ⚡ Boost
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* =====================================================================
          TITLE SCREEN (Matches Mobile_game_menu_UI_design reference layout)
         ===================================================================== */}
      {gameState === 'title' && activeSubModal === 'none' && (
        <div className="w-full h-full max-w-[430px] mx-auto flex flex-col justify-between py-1 pointer-events-none">
          {/* Top Header Bar: Circular LVL Badge | Score/Coin Pill | Orange Settings Button */}
          <div className="flex flex-col items-center gap-1 pointer-events-auto">
            <div className="w-full flex items-center justify-between gap-2 px-1">
              {/* Circular Blue LVL Badge */}
              <button
                type="button"
                aria-label={`Level ${levelNumber} - Choose Stage`}
                onClick={() => onSetActiveSubModal('worlds')}
                className="w-14 h-14 rounded-full bg-gradient-to-b from-sky-400 to-blue-600 hover:from-sky-300 hover:to-blue-500 active:scale-95 border-3 border-white shadow-lg flex flex-col items-center justify-center leading-none cursor-pointer transition-transform"
              >
                <span className="text-[10px] font-extrabold text-sky-100 uppercase">
                  LVL
                </span>
                <span className="font-display font-bold text-xl text-white font-mono-num">
                  {levelNumber}
                </span>
              </button>

              {/* Center Best Score / Coin Pill */}
              <div className="flex items-center gap-2 bg-purple-900/75 border-2 border-purple-300/60 rounded-full pl-4 pr-2 py-1.5 shadow-lg">
                <span className="font-display font-bold text-lg text-white font-mono-num hud-stroke">
                  {bestScore.toLocaleString()}
                </span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 border-2 border-yellow-100 flex items-center justify-center shadow">
                  <span className="font-display font-bold text-xs text-amber-950">
                    ★
                  </span>
                </div>
              </div>

              {/* Circular Orange Settings Gear Button */}
              <button
                type="button"
                aria-label="Settings"
                onClick={() => onSetActiveSubModal('settings')}
                className="min-w-[52px] min-h-[52px] w-13 h-13 rounded-full bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-300 hover:to-orange-500 active:scale-95 border-3 border-white shadow-lg flex items-center justify-center text-white cursor-pointer transition-transform"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
                  />
                </svg>
              </button>
            </div>

            {/* Stacked Bubbly BOUNCY POP Logo */}
            <BouncyPopTitleSvg />

            {/* Current World, Monster, Floors & Difficulty Kicker */}
            <div className="flex items-center gap-2 text-xs font-extrabold text-white hud-stroke">
              <span>{activeWorld.name}</span>
              <span aria-hidden="true">·</span>
              <span className="text-yellow-300">{selectedSkin.name}</span>
              <span aria-hidden="true">·</span>
              <span className="text-cyan-300">
                {totalFloors}F ({difficultyConfig.tierLabel})
              </span>
            </div>
          </div>

          {/* Center Negative Space: leaves open view of the bouncing 3D monster & colorful platforms */}
          <div className="flex-1" />

          {/* Bottom Thumb Zone: Glossy Lime-Green PLAY! CTA + WORLDS & MONSTERS Buttons */}
          <div className="flex flex-col items-center gap-3 pb-1 pointer-events-auto">
            <button
              type="button"
              data-start="true"
              onClick={(e) => {
                e.currentTarget.blur();
                onStartGame();
              }}
              className="w-full max-w-[300px] min-h-[62px] py-3 px-8 rounded-full bg-gradient-to-b from-lime-400 via-green-500 to-green-600 hover:from-lime-300 hover:to-green-500 active:scale-[0.98] border-4 border-yellow-300 shadow-[0_6px_0_#15803d] text-white font-display font-bold text-3xl tracking-wider cursor-pointer transition-transform flex items-center justify-center gap-3"
            >
              <span className="hud-stroke">PLAY!</span>
              <svg
                viewBox="0 0 24 24"
                className="w-7 h-7 fill-white drop-shadow"
              >
                <polygon points="6,4 20,12 6,20" />
              </svg>
            </button>

            <div className="w-full max-w-[340px] grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onSetActiveSubModal('worlds')}
                className="min-h-[52px] px-4 py-2.5 rounded-full bg-gradient-to-b from-sky-400 to-blue-600 hover:from-sky-300 hover:to-blue-500 active:scale-95 border-3 border-sky-200 shadow-[0_5px_0_#1e3a8a] text-white font-display font-bold text-base tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-transform"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
                <span>WORLDS</span>
              </button>

              <button
                type="button"
                onClick={() => onSetActiveSubModal('monsters')}
                className="relative min-h-[52px] px-4 py-2.5 rounded-full bg-gradient-to-b from-purple-400 to-purple-700 hover:from-purple-300 hover:to-purple-600 active:scale-95 border-3 border-purple-200 shadow-[0_5px_0_#4c1d95] text-white font-display font-bold text-base tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-transform"
              >
                <span>MONSTERS</span>
              </button>
            </div>

            {/* Quick Monster Switcher Strip for 1-Tap Access */}
            <div className="flex items-center justify-center gap-2">
              {MONSTER_SKINS.slice(0, 4).map((skin) => {
                const isSelected = skin.id === selectedSkin.id;
                return (
                  <button
                    key={skin.id}
                    type="button"
                    onClick={() => onSelectSkin(skin)}
                    className={`min-h-[44px] px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer border-2 ${
                      isSelected
                        ? 'bg-indigo-950/95 text-white border-yellow-300 shadow-md'
                        : 'bg-indigo-950/65 text-purple-100 border-purple-400/40 hover:border-purple-300'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 border border-white"
                      style={{ backgroundColor: skin.badgeHex }}
                    />
                    <span>{skin.name}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] font-bold text-white hud-stroke text-center whitespace-nowrap">
              Drag Left/Right to Spin · Space/Enter Play · P Pause
            </p>
          </div>
        </div>
      )}

      {/* =====================================================================
          CHARACTER SELECTION 3D SHOWCASE SCREEN
          (Large 3D Monster on Circular Pedestal + Interactive Drag Rotation +
           Character Name, Description, Stats, 6-Card Grid, and Select/Unlock CTA)
         ===================================================================== */}
      {gameState === 'title' && activeSubModal === 'monsters' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Character Selection Showcase"
          className="w-full h-full max-w-[440px] mx-auto flex flex-col justify-between py-1 pointer-events-none"
        >
          {/* Top Bar: BACK Button | Compact BOUNCY POP Logo | Star Counter */}
          <div className="w-full flex items-center justify-between gap-2 px-1 pointer-events-auto">
            <button
              type="button"
              onClick={() => onSetActiveSubModal('none')}
              className="min-h-[44px] px-4 py-2 rounded-full bg-purple-600/95 hover:bg-purple-500 border-2 border-purple-200 text-white font-display font-bold text-sm shadow-lg cursor-pointer active:scale-95"
            >
              BACK
            </button>

            <BouncyPopTitleSvg compact />

            <div className="flex items-center gap-1.5 bg-indigo-950/85 border-2 border-purple-300/60 rounded-full px-3 py-1.5 shadow-lg">
              <span className="text-yellow-300 font-bold text-sm">★</span>
              <span className="font-display font-bold text-sm text-white font-mono-num">
                {bestScore.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Dedicated 3D Showcase Viewport Area:
              Pointer events pass through to the Three.js canvas so dragging horizontally
              rotates the 3D monster & pedestal! */}
          <div
            data-testid="monster-showcase-stage"
            className="relative flex-1 min-h-[195px] sm:min-h-[235px] flex flex-col justify-end items-center pb-1 pointer-events-none"
          >
            {/* Interactive Controls Overlay at Base of 3D Pedestal */}
            <div className="w-full flex items-center justify-between px-2">
              <span className="text-[11px] font-extrabold text-cyan-200 hud-stroke bg-indigo-950/70 border border-purple-300/40 rounded-full px-2.5 py-1">
                ↔ Drag 3D Monster to Rotate
              </span>

              <button
                type="button"
                data-testid="reset-showcase-angle"
                onClick={onResetShowcaseAngle}
                className="min-h-[36px] px-3 py-1 rounded-full bg-indigo-950/85 hover:bg-indigo-900 border-2 border-cyan-300/70 text-cyan-200 font-bold text-xs shadow cursor-pointer pointer-events-auto active:scale-95"
              >
                ↺ Reset Angle
              </button>
            </div>
          </div>

          {/* Bottom Showcase Info & Selection Card */}
          <div className="w-full bg-gradient-to-b from-indigo-900/95 via-purple-950/95 to-indigo-950/98 border-3 border-purple-300/80 rounded-3xl p-3 sm:p-3.5 shadow-2xl flex flex-col gap-2.5 pointer-events-auto">
            {/* Character Name, Rarity Pill, Description & Compact Stat Bars */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2
                    data-testid="showcase-monster-name"
                    className="font-display font-bold text-2xl sm:text-3xl text-white hud-stroke leading-none"
                  >
                    {showcaseSkin.name.toUpperCase()}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-pink-500/90 border border-pink-200 text-[10px] font-extrabold uppercase tracking-wider text-white">
                    {showcaseSkin.rarity}
                  </span>
                </div>

                {/* Compact Stat Bars (SPEED, JUMP, POP) */}
                <div className="grid grid-cols-3 gap-1.5 w-[168px] shrink-0">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-extrabold text-pink-200 uppercase">
                      SPD {showcaseSkin.stats.speed}
                    </span>
                    <div className="h-2 bg-indigo-950 rounded-full overflow-hidden border border-purple-400/40">
                      <div
                        className="h-full bg-pink-400 rounded-full"
                        style={{ width: `${showcaseSkin.stats.speed}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-extrabold text-lime-200 uppercase">
                      JMP {showcaseSkin.stats.jump}
                    </span>
                    <div className="h-2 bg-indigo-950 rounded-full overflow-hidden border border-purple-400/40">
                      <div
                        className="h-full bg-lime-400 rounded-full"
                        style={{ width: `${showcaseSkin.stats.jump}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-extrabold text-amber-200 uppercase">
                      POP {showcaseSkin.stats.pop}
                    </span>
                    <div className="h-2 bg-indigo-950 rounded-full overflow-hidden border border-purple-400/40">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${showcaseSkin.stats.pop}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <p
                data-testid="showcase-monster-description"
                className="text-xs text-purple-100 leading-snug"
              >
                {showcaseSkin.description}
              </p>
            </div>

            {/* 6-Monster Selection Grid */}
            <div className="grid grid-cols-3 gap-2">
              {MONSTER_SKINS.map((skin) => {
                const isPreviewing = skin.id === showcaseSkin.id;
                const isEquipped = skin.id === selectedSkin.id;
                const isUnlocked = unlockedSkinIds.includes(skin.id);
                return (
                  <button
                    key={skin.id}
                    type="button"
                    data-testid={`monster-card-${skin.id}`}
                    onClick={() => onPreviewSkin(skin)}
                    className={`p-1.5 rounded-2xl border-2 flex flex-col items-center gap-0.5 transition-transform active:scale-95 cursor-pointer ${
                      isPreviewing
                        ? 'bg-purple-600/90 border-yellow-300 shadow-lg scale-[1.02]'
                        : 'bg-indigo-950/75 border-purple-300/40 hover:border-purple-200'
                    }`}
                  >
                    <MonsterCardThumbSvg skin={skin} />
                    <span className="font-display font-bold text-xs text-white leading-tight">
                      {skin.name}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold uppercase ${
                        isEquipped
                          ? 'text-yellow-300'
                          : isUnlocked
                          ? 'text-lime-300'
                          : 'text-pink-300'
                      }`}
                    >
                      {isEquipped
                        ? 'EQUIPPED ★'
                        : isUnlocked
                        ? 'UNLOCKED ✓'
                        : 'LOCKED 🔒'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom SELECT / EQUIP / UNLOCK Action Button */}
            {isShowcaseUnlocked ? (
              <button
                type="button"
                data-testid="showcase-select-btn"
                onClick={() => {
                  onSelectSkin(showcaseSkin);
                  onSetActiveSubModal('none');
                }}
                className="w-full min-h-[50px] py-2 px-6 rounded-full bg-gradient-to-b from-lime-400 via-green-500 to-green-600 hover:from-lime-300 hover:to-green-500 border-3 border-yellow-300 shadow-[0_4px_0_#15803d] text-white font-display font-bold text-xl tracking-wide cursor-pointer active:scale-95"
              >
                {isShowcaseEquipped
                  ? `EQUIPPED (${showcaseSkin.name.toUpperCase()}) ✓`
                  : `SELECT ${showcaseSkin.name.toUpperCase()}`}
              </button>
            ) : (
              <button
                type="button"
                data-testid="showcase-unlock-btn"
                onClick={() => onUnlockSkin(showcaseSkin)}
                className="w-full min-h-[50px] py-2 px-6 rounded-full bg-gradient-to-b from-amber-400 via-orange-500 to-pink-600 hover:from-amber-300 hover:to-pink-500 border-3 border-yellow-200 shadow-[0_4px_0_#9d174d] text-white font-display font-bold text-xl tracking-wide cursor-pointer active:scale-95"
              >
                UNLOCK & EQUIP {showcaseSkin.name.toUpperCase()} ★
              </button>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          WORLDS & DIFFICULTY STAGE SELECTION MODAL
         ===================================================================== */}
      {gameState === 'title' && activeSubModal === 'worlds' && (
        <div className="fixed inset-0 bg-indigo-950/75 flex items-center justify-center p-3 sm:p-4 pointer-events-auto">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="worlds-modal-title"
            className="w-full max-w-[420px] bg-gradient-to-b from-indigo-600 via-purple-700 to-indigo-950 border-4 border-purple-200 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3.5"
          >
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onSetActiveSubModal('none')}
                className="min-h-[44px] px-4 py-2 rounded-full bg-purple-500 hover:bg-purple-400 border-2 border-purple-200 text-white font-display font-bold text-sm cursor-pointer shrink-0"
              >
                BACK
              </button>
              <h2
                id="worlds-modal-title"
                className="font-display font-bold text-xl sm:text-2xl text-white hud-stroke whitespace-nowrap text-center"
              >
                SELECT WORLD
              </h2>
              <div className="w-16 shrink-0" />
            </div>

            {/* 4 Worlds */}
            <div className="flex flex-col gap-2">
              {WORLD_THEMES.map((world) => {
                const isCurrent = activeWorld.id === world.id;
                const worldStartLevel = (world.index - 1) * 3 + 1;
                return (
                  <button
                    key={world.id}
                    type="button"
                    onClick={() => {
                      onSelectWorld(world.id, worldStartLevel);
                      onSetActiveSubModal('none');
                    }}
                    className={`w-full p-3 rounded-2xl border-2 text-left flex items-center justify-between gap-3 transition-transform active:scale-[0.98] cursor-pointer ${
                      isCurrent
                        ? 'bg-purple-500/80 border-yellow-300 shadow-lg'
                        : 'bg-indigo-900/75 border-purple-300/40 hover:border-purple-200'
                    }`}
                  >
                    <div>
                      <div className="font-display font-bold text-base sm:text-lg text-white">
                        World {world.index}: {world.name}
                      </div>
                      <p className="text-[11px] text-purple-100 mt-0.5">
                        {world.subtitle}
                      </p>
                    </div>
                    <span className="font-display font-bold text-xs text-yellow-300 shrink-0">
                      {isCurrent ? 'ACTIVE ★' : `LVL ${worldStartLevel}+`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Challenge Stage / Level Jump (Levels 1, 2, 3, 4, 5, 8, 11, 16) */}
            <div className="bg-indigo-950/60 border-2 border-purple-300/40 rounded-2xl p-2.5 flex flex-col gap-2">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-300 text-center">
                Jump to Stage Difficulty
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {QUICK_STAGE_PRESETS.map((preset) => {
                  const isActiveLvl = levelNumber === preset.level;
                  return (
                    <button
                      key={preset.level}
                      type="button"
                      data-testid={`select-level-${preset.level}`}
                      onClick={() => {
                        onSelectWorld(selectedWorldId, preset.level);
                        onSetActiveSubModal('none');
                      }}
                      className={`min-h-[44px] py-1 px-1.5 rounded-xl border-2 flex flex-col items-center justify-center leading-tight cursor-pointer transition-transform active:scale-95 ${
                        isActiveLvl
                          ? 'bg-pink-500 border-yellow-300 text-white shadow'
                          : 'bg-indigo-900/80 border-purple-300/40 text-white hover:border-purple-200'
                      }`}
                    >
                      <span className="font-display font-bold text-xs font-mono-num">
                        LVL {preset.level}
                      </span>
                      <span className="text-[9px] font-extrabold text-yellow-300">
                        {preset.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SETTINGS MODAL (Sound, Haptics, Controls Help)
         ===================================================================== */}
      {gameState === 'title' && activeSubModal === 'settings' && (
        <div className="fixed inset-0 bg-indigo-950/75 flex items-center justify-center p-4 pointer-events-auto">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
            className="w-full max-w-[360px] bg-gradient-to-b from-indigo-600 to-indigo-950 border-4 border-purple-200 rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
          >
            <h2
              id="settings-modal-title"
              className="font-display font-bold text-3xl text-white text-center hud-stroke"
            >
              SETTINGS
            </h2>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={onToggleSound}
                className="w-full min-h-[50px] rounded-2xl bg-indigo-900 hover:bg-indigo-800 border-2 border-purple-300/60 text-white font-bold text-sm cursor-pointer"
              >
                Sound Effects: {soundEnabled ? 'ON' : 'OFF'}
              </button>

              <button
                type="button"
                onClick={onToggleVibration}
                className="w-full min-h-[50px] rounded-2xl bg-indigo-900 hover:bg-indigo-800 border-2 border-purple-300/60 text-white font-bold text-sm cursor-pointer"
              >
                Vibration / Haptics: {vibrationEnabled ? 'ON' : 'OFF'}
              </button>

              <button
                type="button"
                onClick={() => onSetActiveSubModal('none')}
                className="w-full min-h-[52px] rounded-full bg-gradient-to-b from-lime-400 to-green-600 border-3 border-yellow-300 text-white font-display font-bold text-lg cursor-pointer"
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PAUSE MODAL (Single focused modal card, >= 48px buttons)
         ===================================================================== */}
      {gameState === 'paused' && (
        <div className="fixed inset-0 bg-indigo-950/75 flex items-center justify-center p-4 pointer-events-auto">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pause-modal-title"
            className="w-full max-w-[360px] bg-gradient-to-b from-indigo-600 via-purple-700 to-indigo-950 border-4 border-purple-200 rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
          >
            <div className="text-center">
              <h2
                id="pause-modal-title"
                className="font-display font-bold text-3xl text-white hud-stroke"
              >
                GAME PAUSED
              </h2>
              <p className="text-xs font-bold text-yellow-300 mt-1">
                {activeWorld.name} · Level {levelNumber} ({difficultyConfig.tierLabel})
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onResumeGame}
                className="w-full min-h-[52px] rounded-full bg-gradient-to-b from-lime-400 to-green-600 border-3 border-yellow-300 text-white font-display font-bold text-xl cursor-pointer transition-transform active:scale-95"
              >
                Resume Game
              </button>

              <button
                type="button"
                onClick={onRestartLevel}
                className="w-full min-h-[48px] rounded-2xl bg-sky-500 hover:bg-sky-400 border-2 border-sky-200 text-white font-bold text-sm cursor-pointer transition-transform active:scale-95"
              >
                Restart Level
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={onToggleSound}
                  className="min-h-[48px] rounded-2xl bg-indigo-900 hover:bg-indigo-800 border-2 border-purple-300/60 text-xs font-bold text-white cursor-pointer"
                >
                  Sound: {soundEnabled ? 'ON' : 'OFF'}
                </button>
                <button
                  type="button"
                  onClick={onToggleVibration}
                  className="min-h-[48px] rounded-2xl bg-indigo-900 hover:bg-indigo-800 border-2 border-purple-300/60 text-xs font-bold text-white cursor-pointer"
                >
                  Haptics: {vibrationEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onOpenTutorial();
                  onResumeGame();
                }}
                className="w-full min-h-[46px] rounded-2xl bg-indigo-900/80 hover:bg-indigo-800 border border-purple-300/50 text-xs font-bold text-cyan-300 cursor-pointer"
              >
                Show Controls Tip
              </button>

              <button
                type="button"
                onClick={onReturnTitle}
                className="w-full min-h-[46px] rounded-2xl bg-indigo-950 hover:bg-indigo-900 border border-purple-400/40 text-xs font-bold text-purple-200 cursor-pointer"
              >
                Back to Title Screen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          GAME OVER / VICTORY MODAL (Single focused modal card with run stats)
         ===================================================================== */}
      {gameState === 'gameover' && endStats && (
        <div className="fixed inset-0 bg-indigo-950/80 flex items-center justify-center p-4 pointer-events-auto">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="gameover-modal-title"
            className="w-full max-w-[360px] bg-gradient-to-b from-indigo-600 via-purple-700 to-indigo-950 border-4 border-purple-200 rounded-3xl p-6 shadow-2xl flex flex-col gap-5"
          >
            <div className="text-center">
              <p className="text-xs font-extrabold uppercase tracking-widest text-yellow-300 mb-1">
                {endStats.outcome === 'victory'
                  ? `${activeWorld.name} · Stage ${endStats.level} Cleared!`
                  : `Stage ${endStats.level} · Progress ${endStats.progress}%`}
              </p>
              <h2
                id="gameover-modal-title"
                className="font-display font-bold text-3xl text-white hud-stroke"
              >
                {endStats.outcome === 'victory'
                  ? 'SWEET VICTORY!'
                  : 'SPLATTED!'}
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-indigo-950/85 border-2 border-purple-400/50 rounded-2xl p-3 text-center">
                <div className="text-[11px] font-bold text-purple-200 uppercase">
                  Score
                </div>
                <div
                  data-testid="modal-final-score"
                  className="font-display font-bold text-xl text-white font-mono-num mt-0.5"
                >
                  {endStats.score}
                </div>
              </div>

              <div className="bg-indigo-950/85 border-2 border-purple-400/50 rounded-2xl p-3 text-center">
                <div className="text-[11px] font-bold text-purple-200 uppercase">
                  Best
                </div>
                <div className="font-display font-bold text-xl text-yellow-300 font-mono-num mt-0.5">
                  {endStats.bestScore}
                </div>
              </div>

              <div className="bg-indigo-950/85 border-2 border-purple-400/50 rounded-2xl p-3 text-center">
                <div className="text-[11px] font-bold text-purple-200 uppercase">
                  Max Combo
                </div>
                <div className="font-display font-bold text-xl text-cyan-300 font-mono-num mt-0.5">
                  {endStats.maxCombo}x
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {endStats.outcome === 'victory' ? (
                <button
                  type="button"
                  data-start="true"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onNextLevel();
                  }}
                  className="w-full min-h-[56px] rounded-full bg-gradient-to-b from-lime-400 to-green-600 border-3 border-yellow-300 shadow-[0_5px_0_#15803d] text-white font-display font-bold text-xl cursor-pointer transition-transform active:scale-95"
                >
                  Next Level (Stage {endStats.level + 1})
                </button>
              ) : (
                <button
                  type="button"
                  data-start="true"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onRestartLevel();
                  }}
                  className="w-full min-h-[56px] rounded-full bg-gradient-to-b from-lime-400 to-green-600 border-3 border-yellow-300 shadow-[0_5px_0_#15803d] text-white font-display font-bold text-xl cursor-pointer transition-transform active:scale-95"
                >
                  Try Again
                </button>
              )}

              <button
                type="button"
                onClick={onReturnTitle}
                className="w-full min-h-[48px] rounded-2xl bg-indigo-900 hover:bg-indigo-800 border-2 border-purple-300/60 text-xs font-bold text-white cursor-pointer"
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
