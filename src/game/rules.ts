/**
 * Pure decoupled game rules, 4 Worlds, 6 3D platform geometry types,
 * Scalable Level Difficulty System (Levels 1, 2, 3, 4, 5–7, 8–10, 11–15, 16+),
 * Continuous 360° Orbital Circular Obstacles around the central tower axis,
 * real-time 3D world-space collision math, and bounce physics for BOUNCY POP: Spiral Tower 3D.
 */

export type GameState = 'title' | 'playing' | 'paused' | 'gameover';

export type SliceType =
  | 'normal'
  | 'gap'
  | 'hazard'
  | 'breakable'
  | 'spring'
  | 'finish';

export type PlatformStyle =
  | 'waffle'
  | 'donut'
  | 'marshmallow'
  | 'toyblock'
  | 'cookie'
  | 'star';

export type RingObstacleType =
  | 'none'
  | 'candy_bar'
  | 'spinning_donut'
  | 'rotating_blade';

export type RoundObstacleBehavior =
  | 'rotating'
  | 'orbiting'
  | 'patrol'
  | 'bouncing'
  | 'spinning_group';

export type RoundObstacleVisualKind =
  | 'donut_roller'
  | 'spiked_orb'
  | 'bouncing_sphere'
  | 'bumper_disc'
  | 'cluster_group';

export type ObstaclePatternType =
  | 'none'
  | 'single_rotator'
  | 'dual_speed_rotators'
  | 'patrol_narrow_gap'
  | 'orbit_ring_pack'
  | 'bouncing_patrol'
  | 'opposite_directions'
  | 'spinning_cluster';

export interface ActiveRoundObstacle {
  id: string;
  behavior: RoundObstacleBehavior;
  visualKind: RoundObstacleVisualKind;
  // Current dynamic state updated every frame
  currentAngle: number; // radians [0, 2*PI) around the central vertical tower axis
  currentRadius: number; // orbital radius from tower center (default 2.65)
  currentYOffset: number; // vertical offset relative to ring.y
  selfRotation: number; // radians spin around its own center
  groupSpinAngle: number; // radians spin of satellite balls in 'spinning_group'
  direction: 1 | -1; // orbital direction (+1 counterclockwise, -1 clockwise)
  reverseTimer: number; // timer for optional periodic direction flips
  // Real-time 3D world-space position updated every frame for collision & rendering sync
  worldX: number;
  worldY: number;
  worldZ: number;
  // Movement parameters configured by the level's difficulty system
  baseAngle: number;
  angularSpeed: number; // rad/s orbital angular velocity around the central tower axis
  selfSpinSpeed: number; // rad/s spin around its own center
  patrolRange: number; // max angular excursion from baseAngle when behavior === 'patrol'
  baseRadius: number;
  radiusAmplitude: number; // radial in/out wave amplitude (0 for constant circular orbit)
  radiusFreq: number;
  baseYOffset: number;
  bounceAmplitude: number; // vertical bounce height for 'bouncing'
  bounceFreq: number;
  bouncePhase: number;
  reverseInterval: number; // if > 0, flips direction every N seconds
  memberCount: number; // 1 for single round obstacle, 2..3 for 'spinning_group'
  groupSpreadRadius: number; // distance of sub-orbs from cluster center
  groupSpinSpeed: number;
  hitRadius: number; // 3D spherical hitbox radius
  accentColor: number;
}

export interface LevelDifficultyConfig {
  level: number;
  tierLabel: string;
  minGapSlices: number;
  maxGapSlices: number;
  secondGapChance: number;
  maxHazardSlicesPerRing: number;
  breakableSliceChance: number;
  movingRingChance: number;
  ringSpinSpeedRange: [number, number];
  activeObstacleRingChance: number; // fraction of rings with orbiting circular obstacles
  minActiveObstaclesPerRing: number;
  maxActiveObstaclesPerRing: number;
  orbitSpeedMultiplier: number;
  bounceFrequencyMultiplier: number;
  directionReverseChance: number;
  allowedPatterns: ObstaclePatternType[];
}

export type WorldId = 'candy' | 'toy' | 'dessert' | 'fantasy';

export interface WorldTheme {
  id: WorldId;
  index: number;
  name: string;
  subtitle: string;
  platformStyles: PlatformStyle[];
  sliceColors: number[];
  hazardColor: number;
  hazardAccentColor: number;
  springColor: number;
  pillarBaseColor: number;
  pillarStripeColor: number;
  skyTopCss: string;
  skyMidCss: string;
  skyBottomCss: string;
  fogHex: number;
  ambientHex: number;
}

export const WORLD_THEMES: WorldTheme[] = [
  {
    id: 'candy',
    index: 1,
    name: 'Candy World',
    subtitle: 'Waffles, Frosted Donuts & Marshmallows',
    platformStyles: ['waffle', 'donut', 'marshmallow'],
    sliceColors: [0xff3b9a, 0x00d4ff, 0xffd60a, 0xa855f7, 0x2dd4bf],
    hazardColor: 0xff2a55,
    hazardAccentColor: 0xff7b00,
    springColor: 0xffe600,
    pillarBaseColor: 0x7c3aed,
    pillarStripeColor: 0xa855f7,
    skyTopCss: '#4c1d95',
    skyMidCss: '#9333ea',
    skyBottomCss: '#f472b6',
    fogHex: 0x7e22ce,
    ambientHex: 0xfbcfe8,
  },
  {
    id: 'toy',
    index: 2,
    name: 'Toy World',
    subtitle: 'Colorful Plastic Bricks & Playroom Blocks',
    platformStyles: ['toyblock', 'marshmallow', 'star'],
    sliceColors: [0x00bbff, 0xffcc00, 0x10b981, 0xff477e, 0x8b5cf6],
    hazardColor: 0xff3333,
    hazardAccentColor: 0xff8800,
    springColor: 0xfacc15,
    pillarBaseColor: 0x1d4ed8,
    pillarStripeColor: 0x38bdf8,
    skyTopCss: '#1e3a8a',
    skyMidCss: '#0284c7',
    skyBottomCss: '#38bdf8',
    fogHex: 0x0369a1,
    ambientHex: 0xbae6fd,
  },
  {
    id: 'dessert',
    index: 3,
    name: 'Dessert World',
    subtitle: 'Crunchy Choco-Chip Cookies & Sweet Wafers',
    platformStyles: ['cookie', 'waffle', 'donut'],
    sliceColors: [0xf59e0b, 0xff4d94, 0x2dd4bf, 0xfbbf24, 0xc084fc],
    hazardColor: 0xe11d48,
    hazardAccentColor: 0xf97316,
    springColor: 0xfde047,
    pillarBaseColor: 0x78350f,
    pillarStripeColor: 0xb45309,
    skyTopCss: '#701a75',
    skyMidCss: '#be185d',
    skyBottomCss: '#fb923c',
    fogHex: 0x9d174d,
    ambientHex: 0xfde68a,
  },
  {
    id: 'fantasy',
    index: 4,
    name: 'Fantasy World',
    subtitle: 'Glowing Star Platforms & Magic Crystals',
    platformStyles: ['star', 'donut', 'marshmallow'],
    sliceColors: [0xa855f7, 0x06b6d4, 0xfacc15, 0xff3b9a, 0x34d399],
    hazardColor: 0xff1e56,
    hazardAccentColor: 0xff9f1c,
    springColor: 0x38bdf8,
    pillarBaseColor: 0x31107f,
    pillarStripeColor: 0x6366f1,
    skyTopCss: '#1e1b4b',
    skyMidCss: '#4f46e5',
    skyBottomCss: '#ec4899',
    fogHex: 0x3730a3,
    ambientHex: 0xe0e7ff,
  },
];

export type MonsterSkinId =
  | 'berry'
  | 'minty'
  | 'sunny'
  | 'zappy'
  | 'gloop'
  | 'jello';

export interface MonsterSkin {
  id: MonsterSkinId;
  name: string;
  tagline: string;
  description: string;
  rarity: 'EPIC' | 'RARE' | 'SUPER' | 'LEGEND';
  unlockedByDefault: boolean;
  primaryColor: number;
  secondaryColor: number;
  accentColor: number;
  eyeColor: number;
  badgeHex: string;
  bodyStyle: 'horned' | 'antenna' | 'cube' | 'fluffy' | 'cyclops' | 'jelly';
  stats: {
    speed: number;
    jump: number;
    pop: number;
  };
}

export const MONSTER_SKINS: MonsterSkin[] = [
  {
    id: 'berry',
    name: 'Popo',
    tagline: 'Bouncy Horned Rascal',
    description:
      'Loves sweet berry waffles and cheerful double-bounces down the spiral tower!',
    rarity: 'EPIC',
    unlockedByDefault: true,
    primaryColor: 0xff3b9a,
    secondaryColor: 0xff94c8,
    accentColor: 0x9333ea,
    eyeColor: 0x2e1065,
    badgeHex: '#ff3b9a',
    bodyStyle: 'horned',
    stats: { speed: 86, jump: 82, pop: 78 },
  },
  {
    id: 'minty',
    name: 'Bubu',
    tagline: 'Turquoise Polka Hopper',
    description:
      'Equipped with glowing radar antennae to spot narrow spiral gaps from above!',
    rarity: 'EPIC',
    unlockedByDefault: true,
    primaryColor: 0x06b6d4,
    secondaryColor: 0xd946ef,
    accentColor: 0x22d3ee,
    eyeColor: 0x1e1b4b,
    badgeHex: '#06b6d4',
    bodyStyle: 'antenna',
    stats: { speed: 84, jump: 90, pop: 85 },
  },
  {
    id: 'sunny',
    name: 'Blocky',
    tagline: 'Toy Cube Bouncer',
    description:
      'Built from glossy yellow playroom bricks with extra-crisp smash power!',
    rarity: 'RARE',
    unlockedByDefault: true,
    primaryColor: 0xfacc15,
    secondaryColor: 0xfef08a,
    accentColor: 0xf97316,
    eyeColor: 0x1e293b,
    badgeHex: '#facc15',
    bodyStyle: 'cube',
    stats: { speed: 78, jump: 85, pop: 94 },
  },
  {
    id: 'zappy',
    name: 'Zappy',
    tagline: 'Electric Fuzz Hopper',
    description:
      'Crackles with sky-blue static energy and flutters through multi-ring drops!',
    rarity: 'SUPER',
    unlockedByDefault: true,
    primaryColor: 0x38bdf8,
    secondaryColor: 0xf472b6,
    accentColor: 0xfde047,
    eyeColor: 0x0f172a,
    badgeHex: '#38bdf8',
    bodyStyle: 'fluffy',
    stats: { speed: 95, jump: 84, pop: 80 },
  },
  {
    id: 'gloop',
    name: 'Gloop',
    tagline: 'Cosmic Three-Eyed Blob',
    description:
      'Uses three mystical star-gazing eyes to time opposite-spinning orbital orbs!',
    rarity: 'SUPER',
    unlockedByDefault: false,
    primaryColor: 0xa855f7,
    secondaryColor: 0xe879f9,
    accentColor: 0x38bdf8,
    eyeColor: 0x1e1b4b,
    badgeHex: '#a855f7',
    bodyStyle: 'cyclops',
    stats: { speed: 80, jump: 92, pop: 90 },
  },
  {
    id: 'jello',
    name: 'Jello',
    tagline: 'Mint Candy Slime',
    description:
      'Ultra-bouncy emerald jelly crown mascot with maximum Fever Smash pop!',
    rarity: 'LEGEND',
    unlockedByDefault: false,
    primaryColor: 0x10b981,
    secondaryColor: 0x6ee7b7,
    accentColor: 0xfacc15,
    eyeColor: 0x064e3b,
    badgeHex: '#10b981',
    bodyStyle: 'jelly',
    stats: { speed: 92, jump: 94, pop: 96 },
  },
];

export interface PlatformSlice {
  index: number;
  type: SliceType;
  startAngle: number; // radians [0, 2*PI)
  endAngle: number;
  broken?: boolean; // true once a breakable cookie slice has been bounced on
  hasGem?: boolean;
  gemCollected?: boolean;
  hasBoostOrb?: boolean;
  boostOrbCollected?: boolean;
}

export interface PlatformRing {
  id: number;
  ringIndex: number;
  y: number;
  style: PlatformStyle;
  slices: PlatformSlice[];
  passed: boolean;
  shattered: boolean;
  rotationOffset: number; // current base rotation of this ring in radians
  initialRotationOffset: number;
  spinSpeed: number; // radians/sec
  oscillateAmplitude: number; // if > 0, ring oscillates back and forth
  oscillatePhase: number;
  obstacleType: RingObstacleType;
  obstacleAngle: number; // local angle on ring where rotating obstacle bar/blade sits
  obstacleSpeed: number; // angular speed of the obstacle relative to ring
  patternType: ObstaclePatternType;
  activeObstacles: ActiveRoundObstacle[]; // Dynamic 360° orbiting circular obstacles on this ring!
  themeColor: number;
  secondaryColor: number;
}

export interface TowerLevel {
  level: number;
  world: WorldTheme;
  difficulty: LevelDifficultyConfig;
  totalRings: number;
  ringSpacing: number;
  topY: number;
  slicesPerRing: number;
  rings: PlatformRing[];
  palette: {
    normalHex: number;
    hazardHex: number;
    hazardAccentHex: number;
    springHex: number;
    pillarHex: number;
    pillarStripeHex: number;
    skyTopHex: string;
    skyMidHex: string;
    skyBottomHex: string;
  };
}

export interface PhysicsState {
  monsterY: number;
  monsterVy: number;
  towerRotation: number; // radians
  towerAngularVelocity: number;
  currentRingIndex: number; // index in level.rings (0 = top ring)
  ringsPassedInFall: number;
  combo: number;
  maxCombo: number;
  score: number;
  gems: number;
  isFever: boolean; // true when ringsPassedInFall >= FEVER_RING_THRESHOLD
  // Active Boost System State
  boostEnergy: number; // 0..100
  isBoosting: boolean; // true while active turbo speed boost is running
  boostTimer: number; // remaining seconds of active boost
  boostCooldown: number; // remaining seconds of cooldown before next boost
  boostOrbsCollected: number;
  lastMilestoneFloor: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  hitstopTimer: number;
  elapsedTime: number;
  lastCallout: string;
  outcome: 'none' | 'victory' | 'defeat';
}

export const TOWER_CONSTANTS = {
  SLICE_COUNT: 12,
  RING_SPACING: 3.3,
  INNER_RADIUS: 1.35,
  OUTER_RADIUS: 3.78,
  MONSTER_RADIUS: 0.56,
  MONSTER_Z: 2.65, // sits on the front (+Z) of the tower at world angle = 0
  GRAVITY: -32.0,
  MAX_FALL_SPEED: -22.5,
  BOUNCE_VELOCITY: 12.6,
  SPRING_VELOCITY: 17.8,
  FEVER_RING_THRESHOLD: 3, // passing 3+ rings in one drop ignites Fever Smash
  // Boost System Constants
  BOOST_MAX_ENERGY: 100,
  BOOST_MIN_ACTIVATE_ENERGY: 40,
  BOOST_DURATION: 1.55,
  BOOST_COOLDOWN: 2.5,
  BOOST_GRAVITY: -50.0,
  BOOST_FALL_SPEED: -34.0,
};

/**
 * Returns the exact number of playable tower floors for a given level:
 * - Level 1: 25 floors
 * - Level 2: 30 floors
 * - Level 3: 35 floors
 * - Level 4: 40 floors
 * - Level 5: 45 floors
 * - Level 6: 50 floors
 * - Level 7: 55 floors
 * - Level 8: 60 floors
 * - Level 9: 65 floors
 * - Level 10: 70 floors
 * - Level 11+: 75+ floors (increases by 5 floors per level, capped at 125)
 */
export function getTotalFloorsForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  return Math.min(125, 20 + safeLevel * 5);
}

/**
 * Returns the balanced difficulty configuration for any level number:
 * - Level 1–2 (Easy): 25–30 floors, wide gaps, slow circular obstacle rotation, introduce boost
 * - Level 3–4 (Normal): 35–40 floors, moderate circular obstacle speed, 1 major obstacle per section
 * - Level 5–7 (Medium / Medium-Hard): 45–55 floors, multiple patterns, strategic boost usage
 * - Level 8–10 (Hard / Very Hard): 60–70 floors, opposite directions & varied speeds, precise timing
 * - Level 11+ (Expert): 75+ floors, complex obstacle combinations, multiple circular obstacles
 */
export function getLevelDifficultyConfig(level: number): LevelDifficultyConfig {
  const safeLevel = Math.max(1, Math.floor(level));

  if (safeLevel === 1) {
    return {
      level: 1,
      tierLabel: 'EASY',
      minGapSlices: 4,
      maxGapSlices: 5,
      secondGapChance: 0.75,
      maxHazardSlicesPerRing: 1,
      breakableSliceChance: 0.25,
      movingRingChance: 0,
      ringSpinSpeedRange: [0, 0],
      activeObstacleRingChance: 0,
      minActiveObstaclesPerRing: 0,
      maxActiveObstaclesPerRing: 0,
      orbitSpeedMultiplier: 0,
      bounceFrequencyMultiplier: 0,
      directionReverseChance: 0,
      allowedPatterns: ['single_rotator'],
    };
  }

  if (safeLevel === 2) {
    return {
      level: 2,
      tierLabel: 'EASY',
      minGapSlices: 4,
      maxGapSlices: 4,
      secondGapChance: 0.65,
      maxHazardSlicesPerRing: 1,
      breakableSliceChance: 0.25,
      movingRingChance: 0,
      ringSpinSpeedRange: [0, 0],
      activeObstacleRingChance: 0,
      minActiveObstaclesPerRing: 0,
      maxActiveObstaclesPerRing: 0,
      orbitSpeedMultiplier: 0,
      bounceFrequencyMultiplier: 0,
      directionReverseChance: 0,
      allowedPatterns: ['single_rotator', 'bouncing_patrol'],
    };
  }

  if (safeLevel === 3) {
    return {
      level: 3,
      tierLabel: 'NORMAL',
      minGapSlices: 4,
      maxGapSlices: 4,
      secondGapChance: 0.55,
      maxHazardSlicesPerRing: 1,
      breakableSliceChance: 0.28,
      movingRingChance: 0,
      ringSpinSpeedRange: [0, 0],
      activeObstacleRingChance: 0.35,
      minActiveObstaclesPerRing: 0,
      maxActiveObstaclesPerRing: 1,
      orbitSpeedMultiplier: 0,
      bounceFrequencyMultiplier: 0,
      directionReverseChance: 0,
      allowedPatterns: ['single_rotator', 'bouncing_patrol'],
    };
  }

  if (safeLevel === 4) {
    return {
      level: 4,
      tierLabel: 'NORMAL',
      minGapSlices: 3,
      maxGapSlices: 4,
      secondGapChance: 0.5,
      maxHazardSlicesPerRing: 2,
      breakableSliceChance: 0.32,
      movingRingChance: 0,
      ringSpinSpeedRange: [0, 0],
      activeObstacleRingChance: 0.4,
      minActiveObstaclesPerRing: 0,
      maxActiveObstaclesPerRing: 1,
      orbitSpeedMultiplier: 0,
      bounceFrequencyMultiplier: 0,
      directionReverseChance: 0,
      allowedPatterns: [
        'single_rotator',
        'bouncing_patrol',
        'patrol_narrow_gap',
      ],
    };
  }

  if (safeLevel <= 7) {
    return {
      level: safeLevel,
      tierLabel: safeLevel === 7 ? 'MEDIUM-HARD' : 'MEDIUM',
      minGapSlices: 3,
      maxGapSlices: 4,
      secondGapChance: 0.42,
      maxHazardSlicesPerRing: 2,
      breakableSliceChance: 0.36,
      movingRingChance: 0,
      ringSpinSpeedRange: [0, 0],
      activeObstacleRingChance: 0.45,
      minActiveObstaclesPerRing: 0,
      maxActiveObstaclesPerRing: 1,
      orbitSpeedMultiplier: 0,
      bounceFrequencyMultiplier: 0,
      directionReverseChance: 0,
      allowedPatterns: [
        'single_rotator',
        'bouncing_patrol',
        'dual_speed_rotators',
        'patrol_narrow_gap',
      ],
    };
  }

  if (safeLevel <= 10) {
    return {
      level: safeLevel,
      tierLabel: safeLevel === 10 ? 'VERY HARD' : 'HARD',
      minGapSlices: 3,
      maxGapSlices: 4,
      secondGapChance: 0.35,
      maxHazardSlicesPerRing: 2,
      breakableSliceChance: 0.42,
      movingRingChance: 0,
      ringSpinSpeedRange: [0, 0],
      activeObstacleRingChance: 0.5,
      minActiveObstaclesPerRing: 0,
      maxActiveObstaclesPerRing: 2,
      orbitSpeedMultiplier: 0,
      bounceFrequencyMultiplier: 0,
      directionReverseChance: 0,
      allowedPatterns: [
        'dual_speed_rotators',
        'opposite_directions',
        'bouncing_patrol',
        'orbit_ring_pack',
        'single_rotator',
      ],
    };
  }

  if (safeLevel <= 15) {
    return {
      level: safeLevel,
      tierLabel: 'EXPERT',
      minGapSlices: 3,
      maxGapSlices: 3,
      secondGapChance: 0.3,
      maxHazardSlicesPerRing: 3,
      breakableSliceChance: 0.46,
      movingRingChance: 0,
      ringSpinSpeedRange: [0, 0],
      activeObstacleRingChance: 0.55,
      minActiveObstaclesPerRing: 0,
      maxActiveObstaclesPerRing: 2,
      orbitSpeedMultiplier: 0,
      bounceFrequencyMultiplier: 0,
      directionReverseChance: 0,
      allowedPatterns: [
        'opposite_directions',
        'orbit_ring_pack',
        'spinning_cluster',
        'dual_speed_rotators',
      ],
    };
  }

  return {
    level: safeLevel,
    tierLabel: 'EXPERT',
    minGapSlices: 3,
    maxGapSlices: 3,
    secondGapChance: 0.3,
    maxHazardSlicesPerRing: 3,
    breakableSliceChance: 0.48,
    movingRingChance: 0,
    ringSpinSpeedRange: [0, 0],
    activeObstacleRingChance: 0.55,
    minActiveObstaclesPerRing: 0,
    maxActiveObstaclesPerRing: 2,
    orbitSpeedMultiplier: 0,
    bounceFrequencyMultiplier: 0,
    directionReverseChance: 0,
    allowedPatterns: [
      'spinning_cluster',
      'opposite_directions',
      'orbit_ring_pack',
      'dual_speed_rotators',
    ],
  };
}

/**
 * Returns the WorldTheme for a given level (cycles every 3 levels or uses override).
 */
export function getWorldForLevel(
  level: number,
  overrideWorldId?: WorldId | null
): WorldTheme {
  if (overrideWorldId) {
    const found = WORLD_THEMES.find((w) => w.id === overrideWorldId);
    if (found) return found;
  }
  const worldIdx =
    Math.floor((Math.max(1, level) - 1) / 3) % WORLD_THEMES.length;
  return WORLD_THEMES[worldIdx];
}

/**
 * Returns an exciting arcade callout label for a given combo/drop count.
 */
export function getComboCallout(
  ringsPassedInFall: number,
  combo: number,
  isSmash: boolean
): string {
  if (isSmash) return 'MEGA POP!';
  if (combo >= 8 || ringsPassedInFall >= 5) return 'CRAZY COMBO!';
  if (ringsPassedInFall >= 3) return 'ABSOLUTE!';
  if (combo >= 5) return 'SUPER DROP!';
  if (ringsPassedInFall >= 2 || combo >= 3) return 'GREAT!';
  return 'NICE!';
}

/**
 * Deterministic pseudo-random generator for reproducible level design.
 */
export function createSeededRng(seed: number): () => number {
  let state = (seed * 1664525 + 1013904223) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

/**
 * Normalizes any angle in radians into [0, 2*PI).
 */
export function normalizeAngle(angle: number): number {
  const twoPi = Math.PI * 2;
  return ((angle % twoPi) + twoPi) % twoPi;
}

/**
 * Shortest signed angular distance between two angles in radians [-PI, PI].
 */
export function shortestAngleDist(a: number, b: number): number {
  const diff = normalizeAngle(a - b + Math.PI) - Math.PI;
  return diff;
}

/**
 * Builds the 360-degree orbiting circular obstacles for a ring based on its chosen pattern
 * and the level's balanced difficulty config.
 * - Keeps circular obstacles moving smoothly around the tower at readable speeds.
 * - Avoids sudden direction reversals.
 * - Caps obstacle count per ring to `diff.maxActiveObstaclesPerRing` and spaces multiple
 *   obstacles wide apart (>= 150°–180°) so they never block every safe path.
 */
function buildActiveObstaclesForRing(
  ringIndex: number,
  ringY: number,
  pattern: ObstaclePatternType,
  primaryGapAngle: number,
  diff: LevelDifficultyConfig,
  world: WorldTheme,
  _rng: () => number
): ActiveRoundObstacle[] {
  if (pattern === 'none') return [];

  const obstacles: ActiveRoundObstacle[] = [];
  const maxAllowed = Math.max(1, diff.maxActiveObstaclesPerRing);

  const makeObstacle = (
    subIdx: number,
    behavior: RoundObstacleBehavior,
    visualKind: RoundObstacleVisualKind,
    startAngle: number,
    _speed: number,
    dir: 1 | -1,
    opts?: Partial<ActiveRoundObstacle>
  ): ActiveRoundObstacle => {
    const angle = normalizeAngle(startAngle);
    const radius = opts?.baseRadius ?? TOWER_CONSTANTS.MONSTER_Z;
    const yOff = opts?.baseYOffset ?? 0.56;
    return {
      id: `ring-${ringIndex}-obs-${subIdx}`,
      behavior,
      visualKind,
      currentAngle: angle,
      currentRadius: radius,
      currentYOffset: yOff,
      selfRotation: 0,
      groupSpinAngle: 0,
      direction: dir,
      reverseTimer: 0,
      worldX: Math.sin(angle) * radius,
      worldY: ringY + 0.25 + yOff,
      worldZ: Math.cos(angle) * radius,
      baseAngle: angle,
      angularSpeed: 0,
      selfSpinSpeed: 0,
      patrolRange: opts?.patrolRange ?? Math.PI * 2,
      baseRadius: radius,
      radiusAmplitude: 0,
      radiusFreq: 0,
      baseYOffset: yOff,
      bounceAmplitude: 0,
      bounceFreq: 0,
      bouncePhase: 0,
      reverseInterval: 0,
      memberCount: opts?.memberCount ?? 1,
      groupSpreadRadius: opts?.groupSpreadRadius ?? 0.46,
      groupSpinSpeed: 0,
      hitRadius: opts?.hitRadius ?? 0.34,
      accentColor:
        subIdx % 2 === 0 ? world.hazardColor : world.hazardAccentColor,
    };
  };

  // Place static obstacles on safe solid slices away from both primaryGapAngle (0 offset) and secondGapAngle (+PI offset)
  const safeAngle1 = normalizeAngle(primaryGapAngle + Math.PI * 0.62);
  const safeAngle2 = normalizeAngle(primaryGapAngle - Math.PI * 0.62);
  const safeAngle3 = normalizeAngle(primaryGapAngle + Math.PI * 1.32);

  const pickVisualKind = (idx: number): RoundObstacleVisualKind => {
    const kinds: RoundObstacleVisualKind[] = [
      'bumper_disc',
      'donut_roller',
      'bouncing_sphere',
      'spiked_orb',
    ];
    return kinds[(ringIndex + idx) % kinds.length];
  };

  const dir: 1 | -1 = ringIndex % 2 === 0 ? 1 : -1;

  switch (pattern) {
    case 'single_rotator': {
      obstacles.push(
        makeObstacle(0, 'orbiting', pickVisualKind(0), safeAngle1, 0, dir)
      );
      break;
    }

    case 'bouncing_patrol': {
      obstacles.push(
        makeObstacle(0, 'bouncing', 'bouncing_sphere', safeAngle1, 0, dir)
      );
      if (maxAllowed >= 2 && diff.level >= 6 && ringIndex % 3 === 0) {
        obstacles.push(
          makeObstacle(1, 'orbiting', 'bumper_disc', safeAngle2, 0, dir)
        );
      }
      break;
    }

    case 'patrol_narrow_gap': {
      obstacles.push(
        makeObstacle(0, 'orbiting', 'donut_roller', safeAngle1, 0, dir)
      );
      if (maxAllowed >= 2 && diff.level >= 5 && ringIndex % 2 === 0) {
        obstacles.push(
          makeObstacle(1, 'orbiting', 'bumper_disc', safeAngle2, 0, dir)
        );
      }
      break;
    }

    case 'dual_speed_rotators': {
      obstacles.push(
        makeObstacle(0, 'orbiting', 'donut_roller', safeAngle1, 0, dir)
      );
      if (maxAllowed >= 2) {
        obstacles.push(
          makeObstacle(1, 'orbiting', 'bumper_disc', safeAngle2, 0, dir)
        );
      }
      break;
    }

    case 'opposite_directions': {
      obstacles.push(
        makeObstacle(0, 'orbiting', 'spiked_orb', safeAngle1, 0, 1)
      );
      if (maxAllowed >= 2) {
        obstacles.push(
          makeObstacle(1, 'orbiting', 'donut_roller', safeAngle2, 0, -1)
        );
      }
      break;
    }

    case 'orbit_ring_pack': {
      const angles = [safeAngle1, safeAngle2, safeAngle3];
      const count =
        diff.level >= 12 ? Math.min(3, maxAllowed) : Math.min(2, maxAllowed);
      for (let i = 0; i < count; i++) {
        obstacles.push(
          makeObstacle(i, 'orbiting', pickVisualKind(i), angles[i], 0, dir)
        );
      }
      break;
    }

    case 'spinning_cluster': {
      obstacles.push(
        makeObstacle(0, 'spinning_group', 'cluster_group', safeAngle1, 0, dir, {
          memberCount: 2,
          groupSpreadRadius: 0.42,
          groupSpinSpeed: 0,
          hitRadius: 0.28,
        })
      );
      if (maxAllowed >= 2 && diff.level >= 11) {
        obstacles.push(
          makeObstacle(1, 'orbiting', 'bumper_disc', safeAngle2, 0, dir)
        );
      }
      break;
    }
  }

  return obstacles.slice(0, maxAllowed);
}

/**
 * Generates a complete spiral tower level using the Balanced Difficulty System.
 */
export function generateTowerLevel(
  level: number,
  overrideWorldId?: WorldId | null
): TowerLevel {
  const safeLevel = Math.max(1, Math.floor(level));
  const world = getWorldForLevel(safeLevel, overrideWorldId);
  const difficulty = getLevelDifficultyConfig(safeLevel);
  const rng = createSeededRng(safeLevel * 7919 + world.index * 131 + 42);
  const slicesPerRing = TOWER_CONSTANTS.SLICE_COUNT;
  const sliceArc = (Math.PI * 2) / slicesPerRing;

  const totalRings = getTotalFloorsForLevel(safeLevel);
  const ringSpacing = TOWER_CONSTANTS.RING_SPACING;
  const topY = (totalRings - 1) * ringSpacing;

  const rings: PlatformRing[] = [];
  let prevGapSlice = 4; // Start first gap away from slice 0 so player always spawns on a safe platform

  for (let r = 0; r < totalRings; r++) {
    const isTopRing = r === 0;
    const isFinishRing = r === totalRings - 1;
    const y = (totalRings - 1 - r) * ringSpacing;
    const slices: PlatformSlice[] = [];

    const style =
      world.platformStyles[r % world.platformStyles.length] || 'waffle';
    const themeColor = world.sliceColors[r % world.sliceColors.length];
    const secondaryColor =
      world.sliceColors[(r + 1) % world.sliceColors.length];

    let spinSpeed = 0;
    const oscillateAmplitude = 0;
    const oscillatePhase = r * 0.9;
    let obstacleType: RingObstacleType = 'none';
    let obstacleAngle = Math.PI;
    let obstacleSpeed = 0;
    let patternType: ObstaclePatternType = 'none';
    let activeObstacles: ActiveRoundObstacle[] = [];

    if (isFinishRing) {
      for (let s = 0; s < slicesPerRing; s++) {
        slices.push({
          index: s,
          type: 'finish',
          startAngle: s * sliceArc,
          endAngle: (s + 1) * sliceArc,
        });
      }
    } else if (isTopRing) {
      // Top spawn ring: 100% safe normal platforms with a wide 4-slice primary gap + 3-slice secondary gap
      // Slice 0, 1, 2 are safe landing slices under the monster spawn position
      const gapStart = 3;
      const gapWidth = 4;
      for (let s = 0; s < slicesPerRing; s++) {
        const isPrimaryGap = s >= gapStart && s < gapStart + gapWidth;
        const isSecondGap = s >= 8 && s <= 10;
        slices.push({
          index: s,
          type: isPrimaryGap || isSecondGap ? 'gap' : 'normal',
          startAngle: s * sliceArc,
          endAngle: (s + 1) * sliceArc,
        });
      }
      prevGapSlice = gapStart;
    } else {
      // Wide Helix Jump gaps determined by balanced difficulty config (minimum 3 slices = 90° across all levels!)
      const gapSpanRange =
        difficulty.maxGapSlices - difficulty.minGapSlices + 1;
      const rawGapWidth =
        difficulty.minGapSlices + Math.floor(rng() * gapSpanRange);
      const primaryGapWidth = Math.max(3, rawGapWidth);

      // Create natural Helix Jump multi-floor straight-down drop corridors!
      // Rings 1 and 2 align with the top ring's gap so the first turn triggers a rewarding 3-floor straight-down drop.
      // Across the tower, ~62% of rings shift by 0 or ±1 slice (overlapping wide vertical drop corridors),
      // while ~38% shift by ±2 slices so the player rotates the tower to align the next vertical drop chain.
      let shift = 0;
      if (r === 1) {
        shift = 0;
      } else if (r === 2) {
        shift = rng() < 0.65 ? 0 : 1;
      } else {
        const continueDropChain =
          safeLevel <= 2 ? r % 3 !== 0 : rng() < 0.62;
        if (continueDropChain) {
          shift = rng() < 0.55 ? 0 : rng() < 0.5 ? 1 : -1;
        } else {
          shift = rng() < 0.5 ? 2 : -2;
        }
      }
      const primaryGapStart =
        (prevGapSlice + shift + slicesPerRing) % slicesPerRing;

      const hasSecondGap = rng() < difficulty.secondGapChance;
      const secondGapStart = (primaryGapStart + 6) % slicesPerRing;
      const secondGapWidth = safeLevel <= 3 ? 3 : 2;

      const depthRatio = r / totalRings;
      // Early floors on Levels 1–3 have zero hazard slices for a smooth, welcoming start
      const isHazardFreeIntro =
        (safeLevel === 1 && r <= 4) ||
        (safeLevel === 2 && r <= 2) ||
        (safeLevel <= 4 && r === 1);
      const maxHazards = isHazardFreeIntro
        ? 0
        : Math.min(
            difficulty.maxHazardSlicesPerRing,
            Math.floor(depthRatio * difficulty.maxHazardSlicesPerRing + 0.6)
          );

      const types: SliceType[] = new Array(slicesPerRing).fill('normal');

      for (let w = 0; w < primaryGapWidth; w++) {
        types[(primaryGapStart + w) % slicesPerRing] = 'gap';
      }

      if (hasSecondGap) {
        for (let w = 0; w < secondGapWidth; w++) {
          const idx = (secondGapStart + w) % slicesPerRing;
          // Keep at least 5 solid slices per ring so platforms remain recognizable
          if (types.filter((t) => t !== 'gap').length > 5) {
            types[idx] = 'gap';
          }
        }
      }

      // Protect slices immediately bordering the primary gap so the player always has a clean safe margin around the gap
      const gapBufferLeft =
        (primaryGapStart - 1 + slicesPerRing) % slicesPerRing;
      const gapBufferRight = (primaryGapStart + primaryGapWidth) % slicesPerRing;

      // Place hazard slices conservatively while guaranteeing >= 5 safe landing slices per ring
      let hazardsPlaced = 0;
      const hazardIndices: number[] = [];
      for (
        let attempt = 0;
        attempt < 24 && hazardsPlaced < maxHazards;
        attempt++
      ) {
        const candidate = Math.floor(rng() * slicesPerRing);
        if (types[candidate] !== 'normal') continue;

        // Never place a hazard slice directly adjacent to any gap slice
        const left = (candidate - 1 + slicesPerRing) % slicesPerRing;
        const right = (candidate + 1) % slicesPerRing;
        if (
          candidate === gapBufferLeft ||
          candidate === gapBufferRight ||
          types[left] === 'gap' ||
          types[right] === 'gap'
        ) {
          continue;
        }

        const normalRemaining = types.filter((t) => t === 'normal').length;
        if (normalRemaining <= 5) break;

        // Never place two hazard slices directly next to each other on Levels 1–8
        if (
          safeLevel <= 8 &&
          (types[left] === 'hazard' || types[right] === 'hazard')
        ) {
          continue;
        }
        if (types[left] === 'hazard' && types[right] === 'hazard') continue;

        types[candidate] = 'hazard';
        hazardIndices.push(candidate);
        hazardsPlaced++;
      }

      // Add Breakable Cookie / Wafer slices (guaranteed on every 3rd ring and via breakableSliceChance)
      if (r % 3 === 2 || rng() < difficulty.breakableSliceChance) {
        const count = safeLevel >= 5 ? 2 : 1;
        const preferredIdx = (gapBufferRight + 1) % slicesPerRing;
        if (types[preferredIdx] === 'normal') {
          types[preferredIdx] = 'breakable';
        }
        for (let b = 1; b < count; b++) {
          const candidate = Math.floor(rng() * slicesPerRing);
          if (types[candidate] === 'normal') {
            types[candidate] = 'breakable';
          }
        }
      }

      // Add Golden Spring boost pads
      if (r > 2 && r < totalRings - 3 && rng() < 0.14) {
        const candidate = Math.floor(rng() * slicesPerRing);
        if (types[candidate] === 'normal') {
          types[candidate] = 'spring';
        }
      }

      // All platforms and obstacles remain 100% static (classic Helix Jump style)
      spinSpeed = 0;
      obstacleType = 'none';
      obstacleSpeed = 0;

      // Only place a static 3D obstacle topper directly centered on an existing 'hazard' slice (never on normal or gap slices!)
      if (
        hazardIndices.length > 0 &&
        safeLevel >= 3 &&
        rng() < difficulty.activeObstacleRingChance
      ) {
        const pool = difficulty.allowedPatterns;
        patternType = pool[(r + safeLevel) % pool.length];
        const targetHazardSlice = hazardIndices[0];
        const exactHazardCenterAngle = normalizeAngle(
          (targetHazardSlice + 0.5) * sliceArc
        );
        const rawObstacles = buildActiveObstaclesForRing(
          r,
          y,
          'single_rotator',
          exactHazardCenterAngle,
          difficulty,
          world,
          rng
        );
        if (rawObstacles.length > 0) {
          const obs = rawObstacles[0];
          obs.currentAngle = exactHazardCenterAngle;
          obs.baseAngle = exactHazardCenterAngle;
          obs.worldX = Math.sin(exactHazardCenterAngle) * obs.currentRadius;
          obs.worldZ = Math.cos(exactHazardCenterAngle) * obs.currentRadius;
          activeObstacles = [obs];
        }
      }

      // Collectible Glowing Boost Orbs on every 3rd ring (in the gap or safe buffer slice)
      const boostOrbSlice =
        r % 3 === 1
          ? (primaryGapStart + Math.floor(primaryGapWidth / 2)) % slicesPerRing
          : r % 4 === 2
          ? gapBufferLeft
          : -1;
      const gemSlice =
        boostOrbSlice === -1 && rng() < 0.55 ? primaryGapStart : -1;

      for (let s = 0; s < slicesPerRing; s++) {
        slices.push({
          index: s,
          type: types[s],
          startAngle: s * sliceArc,
          endAngle: (s + 1) * sliceArc,
          broken: false,
          hasGem: s === gemSlice,
          gemCollected: false,
          hasBoostOrb: s === boostOrbSlice,
          boostOrbCollected: false,
        });
      }

      prevGapSlice = primaryGapStart;
    }

    rings.push({
      id: r,
      ringIndex: r,
      y,
      style,
      slices,
      passed: false,
      shattered: false,
      rotationOffset: 0,
      initialRotationOffset: 0,
      spinSpeed,
      oscillateAmplitude,
      oscillatePhase,
      obstacleType,
      obstacleAngle,
      obstacleSpeed,
      patternType,
      activeObstacles,
      themeColor,
      secondaryColor,
    });
  }

  return {
    level: safeLevel,
    world,
    difficulty,
    totalRings,
    ringSpacing,
    topY,
    slicesPerRing,
    rings,
    palette: {
      normalHex: world.sliceColors[0],
      hazardHex: world.hazardColor,
      hazardAccentHex: world.hazardAccentColor,
      springHex: world.springColor,
      pillarHex: world.pillarBaseColor,
      pillarStripeHex: world.pillarStripeColor,
      skyTopHex: world.skyTopCss,
      skyMidHex: world.skyMidCss,
      skyBottomHex: world.skyBottomCss,
    },
  };
}

/**
 * Creates a fresh physics state positioned on the top ring of the given level.
 * Player starts with full Boost Energy (100) so the Boost mechanic can be used right away
 * and recharged throughout the tower via Boost Orbs, combos, breakable platforms, and milestones.
 */
export function createInitialPhysicsState(level: TowerLevel): PhysicsState {
  return {
    monsterY: level.topY + TOWER_CONSTANTS.MONSTER_RADIUS + 0.8,
    monsterVy: 0,
    towerRotation: 0,
    towerAngularVelocity: 0,
    currentRingIndex: 0,
    ringsPassedInFall: 0,
    combo: 1,
    maxCombo: 1,
    score: 0,
    gems: 0,
    isFever: false,
    boostEnergy: TOWER_CONSTANTS.BOOST_MAX_ENERGY,
    isBoosting: false,
    boostTimer: 0,
    boostCooldown: 0,
    boostOrbsCollected: 0,
    lastMilestoneFloor: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    hitstopTimer: 0,
    elapsedTime: 0,
    lastCallout: '',
    outcome: 'none',
  };
}

/**
 * Returns true if the player has enough Boost Energy, is not currently boosting,
 * and is not on Boost Cooldown.
 */
export function canActivateBoost(state: PhysicsState): boolean {
  return (
    state.outcome === 'none' &&
    !state.isBoosting &&
    state.boostCooldown <= 0 &&
    state.boostEnergy >= TOWER_CONSTANTS.BOOST_MIN_ACTIVATE_ENERGY
  );
}

/**
 * Activates the monster's temporary turbo speed boost.
 * Accelerates downward immediately, enables smashing through breakable platforms,
 * and starts the boost duration timer.
 */
export function activateBoost(state: PhysicsState): boolean {
  if (!canActivateBoost(state)) return false;

  state.isBoosting = true;
  state.boostTimer = TOWER_CONSTANTS.BOOST_DURATION;
  state.boostEnergy = Math.max(0, state.boostEnergy - 25);
  state.monsterVy = Math.min(state.monsterVy, -26.5);
  state.scaleX = 0.8;
  state.scaleY = 1.32;
  state.scaleZ = 0.8;
  state.lastCallout = 'TURBO BOOST!';
  return true;
}

/**
 * Determines which slice of a ring is directly beneath the monster,
 * incorporating Helix Jump-style gap edge forgiveness (so the monster slips smoothly
 * into gaps when mostly over an opening) and hazard edge fairness (so grazing the outer
 * border of a hazard never causes a cheap hit).
 */
export function getSliceUnderMonster(
  ring: PlatformRing,
  towerRotation: number
): PlatformSlice {
  const slicesCount = ring.slices.length;
  const sliceArc = (Math.PI * 2) / slicesCount;
  const totalRot = towerRotation + ring.rotationOffset;
  const localAngle = normalizeAngle(-totalRot);
  const index = Math.min(slicesCount - 1, Math.floor(localAngle / sliceArc));
  const currentSlice = ring.slices[index];
  const offsetInSlice = localAngle - index * sliceArc;
  const prevSlice = ring.slices[(index - 1 + slicesCount) % slicesCount];
  const nextSlice = ring.slices[(index + 1) % slicesCount];

  const isOpenSlice = (s: PlatformSlice | undefined) =>
    Boolean(s && (s.type === 'gap' || (s.type === 'breakable' && s.broken)));

  // Gap edge forgiveness (~8 degrees): if monster is on a solid slice lip right next to an open gap, slip into the gap!
  const gapEdgeForgiveness = 0.14;
  if (
    currentSlice.type === 'normal' ||
    (currentSlice.type === 'breakable' && !currentSlice.broken)
  ) {
    if (offsetInSlice < gapEdgeForgiveness && isOpenSlice(prevSlice)) {
      return prevSlice;
    }
    if (
      sliceArc - offsetInSlice < gapEdgeForgiveness &&
      isOpenSlice(nextSlice)
    ) {
      return nextSlice;
    }
  }

  // Hazard edge fairness (~6.5 degrees): forgive slight edge grazes when bordering a safe or gap slice
  const hazardEdgeForgiveness = 0.115;
  if (currentSlice.type === 'hazard') {
    if (
      offsetInSlice < hazardEdgeForgiveness &&
      prevSlice &&
      prevSlice.type !== 'hazard'
    ) {
      return prevSlice;
    }
    if (
      sliceArc - offsetInSlice < hazardEdgeForgiveness &&
      nextSlice &&
      nextSlice.type !== 'hazard'
    ) {
      return nextSlice;
    }
  }

  return currentSlice;
}

/**
 * Synchronizes the 3D world-space coordinates (`worldX`, `worldY`, `worldZ`) of a ring's
 * static obstacles based on the player's current `towerRotation`.
 * Obstacles remain completely static relative to their ring throughout the level.
 */
export function updateRingActiveObstacles(
  ring: PlatformRing,
  _dt: number,
  _elapsedTime: number,
  towerRotation = 0
): void {
  for (let i = 0; i < ring.activeObstacles.length; i++) {
    const obs = ring.activeObstacles[i];
    obs.currentRadius = obs.baseRadius;
    obs.currentYOffset = obs.baseYOffset;
    const worldYaw = towerRotation + obs.currentAngle;
    obs.worldX = Math.sin(worldYaw) * obs.currentRadius;
    obs.worldY = ring.y + 0.25 + obs.currentYOffset;
    obs.worldZ = Math.cos(worldYaw) * obs.currentRadius;
  }
}

/**
 * Synchronizes world-space coordinates for all static obstacles across the tower
 * when the player rotates the tower. Platforms and obstacles never move on their own.
 */
export function updateCircularObstacles(
  level: TowerLevel,
  towerRotation: number,
  dt: number,
  elapsedTime: number
): void {
  for (let i = 0; i < level.rings.length; i++) {
    const ring = level.rings[i];
    if (ring.shattered) continue;
    if (ring.activeObstacles.length > 0) {
      updateRingActiveObstacles(ring, dt, elapsedTime, towerRotation);
    }
  }
}

/**
 * Computes the exact 3D world-space collision check between the monster at
 * (worldX = 0, worldY = monsterY, worldZ = +MONSTER_Z)
 * and all active circular obstacles attached to their Three.js `pivotGroup` on the central tower axis.
 *
 * Because `pivotGroup` is positioned on the central tower axis (0, ring.y, 0) inside `towerRoot`
 * (`towerRoot.rotation.y = towerRotation`) with `pivotGroup.rotation.y = obs.currentAngle`,
 * the obstacle holder at `(0, 0.25 + obs.currentYOffset, +obs.currentRadius)` has exact world coordinates:
 *   worldYaw = towerRotation + obs.currentAngle
 *   obs.worldX = Math.sin(worldYaw) * obs.currentRadius
 *   obs.worldY = ring.y + 0.25 + obs.currentYOffset
 *   obs.worldZ = Math.cos(worldYaw) * obs.currentRadius
 */
export function isActiveRoundObstacleHittingMonster(
  ring: PlatformRing,
  towerRotation: number,
  monsterY: number
): boolean {
  if (ring.activeObstacles.length === 0) return false;

  const monsterWorldX = 0;
  const monsterWorldZ = TOWER_CONSTANTS.MONSTER_Z;

  for (let i = 0; i < ring.activeObstacles.length; i++) {
    const obs = ring.activeObstacles[i];
    const worldYaw = towerRotation + obs.currentAngle;
    const hubWorldX = Math.sin(worldYaw) * obs.currentRadius;
    const centerWorldY = ring.y + 0.25 + obs.currentYOffset;
    const hubWorldZ = Math.cos(worldYaw) * obs.currentRadius;

    // Keep obs world coordinates synchronized for inspection & debug
    obs.worldX = hubWorldX;
    obs.worldY = centerWorldY;
    obs.worldZ = hubWorldZ;

    const dy = monsterY - centerWorldY;

    // Fast vertical bounding reject
    if (Math.abs(dy) > TOWER_CONSTANTS.MONSTER_RADIUS + obs.hitRadius + 0.25) {
      continue;
    }

    if (obs.behavior === 'spinning_group' && obs.memberCount > 1) {
      // Check each satellite round obstacle in the spinning group in world space!
      for (let m = 0; m < obs.memberCount; m++) {
        const subWorldYaw =
          worldYaw + obs.groupSpinAngle + (m * Math.PI * 2) / obs.memberCount;
        const memberWorldX =
          hubWorldX + Math.sin(subWorldYaw) * obs.groupSpreadRadius;
        const memberWorldZ =
          hubWorldZ + Math.cos(subWorldYaw) * obs.groupSpreadRadius;
        const dx = monsterWorldX - memberWorldX;
        const dz = monsterWorldZ - memberWorldZ;
        const distSq = dx * dx + dy * dy + dz * dz;
        const minDist = TOWER_CONSTANTS.MONSTER_RADIUS + obs.hitRadius;
        if (distSq <= minDist * minDist) {
          return true;
        }
      }
    } else {
      const dx = monsterWorldX - hubWorldX;
      const dz = monsterWorldZ - hubWorldZ;
      const distSq = dx * dx + dy * dy + dz * dz;
      const minDist = TOWER_CONSTANTS.MONSTER_RADIUS + obs.hitRadius;
      if (distSq <= minDist * minDist) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks if a ring's rotating 3D obstacle bar/blade is sweeping into the monster's angular zone.
 */
export function isRotatingObstacleHittingMonster(
  ring: PlatformRing,
  towerRotation: number
): boolean {
  if (ring.obstacleType === 'none') return false;
  const monsterLocalAngle = normalizeAngle(
    -(towerRotation + ring.rotationOffset)
  );
  const barAngle1 = normalizeAngle(ring.obstacleAngle);
  const d1 = Math.abs(shortestAngleDist(monsterLocalAngle, barAngle1));
  if (d1 < 0.22) return true;

  if (ring.obstacleType === 'rotating_blade') {
    const barAngle2 = normalizeAngle(ring.obstacleAngle + Math.PI);
    const d2 = Math.abs(shortestAngleDist(monsterLocalAngle, barAngle2));
    if (d2 < 0.22) return true;
  }

  return false;
}

/**
 * Calculates points awarded when passing through a ring gap or smashing a ring.
 */
export function calculateRingScore(
  ringsPassedInFall: number,
  combo: number,
  isSmash: boolean
): number {
  const base = isSmash ? 45 : 15;
  const fallMultiplier = Math.max(1, ringsPassedInFall);
  const safeCombo = Math.max(1, Math.min(12, combo));
  return base * fallMultiplier * safeCombo;
}

/**
 * Calculates percentage progress from top of tower (0%) to finish base (100%).
 */
export function calculateTowerProgress(
  monsterY: number,
  topY: number
): number {
  if (topY <= 0) return 100;
  const clampedY = Math.max(0, Math.min(topY, monsterY));
  return Math.round(((topY - clampedY) / topY) * 100);
}

/**
 * Calculates the exact number of playable floors remaining above the finish line.
 */
export function calculateRemainingFloors(
  currentRingIndex: number,
  totalRings: number
): number {
  return Math.max(0, totalRings - 1 - Math.max(0, currentRingIndex));
}

export interface StepEvents {
  bounced: boolean;
  springBounced: boolean;
  brokeSlice: { ringIndex: number; sliceIndex: number } | null;
  ringsPassed: number[]; // indices of rings passed through cleanly
  ringsShattered: number[]; // indices of rings smashed via Fever or Boost
  landingImpactFloors: number; // number of consecutive floors passed right before landing
  gemsCollected: number;
  boostOrbsCollected: number;
  boostEnded: boolean;
  calloutText: string | null;
  hitHazard: boolean;
  reachedFinish: boolean;
}

/**
 * Advances monster bounce physics, static platforms & obstacles,
 * breakable cookie platforms, active Boost system, and ring collisions by `dt` seconds.
 * Automatically sub-steps if `dt > 0.045s` so physics remain real-time and tunnel-free.
 */
export function stepGamePhysics(
  state: PhysicsState,
  level: TowerLevel,
  dt: number
): StepEvents {
  const merged: StepEvents = {
    bounced: false,
    springBounced: false,
    brokeSlice: null,
    ringsPassed: [],
    ringsShattered: [],
    landingImpactFloors: 0,
    gemsCollected: 0,
    boostOrbsCollected: 0,
    boostEnded: false,
    calloutText: null,
    hitHazard: false,
    reachedFinish: false,
  };

  let remaining = Math.min(Math.max(dt, 0), 0.25);
  while (remaining > 0.00001 && state.outcome === 'none') {
    const subDt = Math.min(remaining, 0.04);
    remaining -= subDt;
    const ev = stepGamePhysicsSingle(state, level, subDt);
    if (ev.bounced) merged.bounced = true;
    if (ev.springBounced) merged.springBounced = true;
    if (ev.brokeSlice) merged.brokeSlice = ev.brokeSlice;
    if (ev.ringsPassed.length > 0) merged.ringsPassed.push(...ev.ringsPassed);
    if (ev.ringsShattered.length > 0)
      merged.ringsShattered.push(...ev.ringsShattered);
    if (ev.landingImpactFloors > merged.landingImpactFloors) {
      merged.landingImpactFloors = ev.landingImpactFloors;
    }
    merged.gemsCollected += ev.gemsCollected;
    merged.boostOrbsCollected += ev.boostOrbsCollected;
    if (ev.boostEnded) merged.boostEnded = true;
    if (ev.calloutText) merged.calloutText = ev.calloutText;
    if (ev.hitHazard) merged.hitHazard = true;
    if (ev.reachedFinish) merged.reachedFinish = true;
  }

  return merged;
}

function stepGamePhysicsSingle(
  state: PhysicsState,
  level: TowerLevel,
  dt: number
): StepEvents {
  const events: StepEvents = {
    bounced: false,
    springBounced: false,
    brokeSlice: null,
    ringsPassed: [],
    ringsShattered: [],
    landingImpactFloors: 0,
    gemsCollected: 0,
    boostOrbsCollected: 0,
    boostEnded: false,
    calloutText: null,
    hitHazard: false,
    reachedFinish: false,
  };

  const clampedDt = Math.min(Math.max(dt, 0), 0.05);
  state.elapsedTime += clampedDt;

  // ALWAYS update all 360° Orbital Circular Obstacles and moving rings every frame!
  updateCircularObstacles(
    level,
    state.towerRotation,
    clampedDt,
    state.elapsedTime
  );

  if (state.outcome !== 'none') {
    return events;
  }

  // Update Active Boost Timer & Cooldown
  if (state.isBoosting) {
    state.boostTimer = Math.max(0, state.boostTimer - clampedDt);
    state.boostEnergy = Math.max(0, state.boostEnergy - 32 * clampedDt);
    if (state.boostTimer <= 0) {
      state.isBoosting = false;
      state.boostCooldown = TOWER_CONSTANTS.BOOST_COOLDOWN;
      events.boostEnded = true;
    }
  } else if (state.boostCooldown > 0) {
    state.boostCooldown = Math.max(0, state.boostCooldown - clampedDt);
  }

  if (state.hitstopTimer > 0) {
    state.hitstopTimer = Math.max(0, state.hitstopTimer - clampedDt);
    return events;
  }

  // Smoothly damp squash-and-stretch back to (1, 1, 1)
  const dampFactor = 1 - Math.exp(-14 * clampedDt);
  state.scaleX += (1 - state.scaleX) * dampFactor;
  state.scaleY += (1 - state.scaleY) * dampFactor;
  state.scaleZ += (1 - state.scaleZ) * dampFactor;

  const prevY = state.monsterY;
  // Smooth downward acceleration that gradually intensifies during consecutive multi-floor drops
  const consecutiveDropBoost =
    state.ringsPassedInFall >= 1
      ? 1 + Math.min(0.32, state.ringsPassedInFall * 0.09)
      : 1;
  const activeGravity = state.isBoosting
    ? TOWER_CONSTANTS.BOOST_GRAVITY
    : TOWER_CONSTANTS.GRAVITY * consecutiveDropBoost;
  const activeMaxFall = state.isBoosting
    ? TOWER_CONSTANTS.BOOST_FALL_SPEED
    : state.isFever
    ? -28.5
    : state.ringsPassedInFall >= 2
    ? -25.5
    : TOWER_CONSTANTS.MAX_FALL_SPEED;

  state.monsterVy = Math.max(
    activeMaxFall,
    state.monsterVy + activeGravity * clampedDt
  );
  state.monsterY += state.monsterVy * clampedDt;

  if (state.isBoosting || state.isFever) {
    state.scaleX = 0.82;
    state.scaleY = 1.26;
    state.scaleZ = 0.82;
  } else if (state.monsterVy < -14) {
    state.scaleX = 0.88;
    state.scaleY = 1.18;
    state.scaleZ = 0.88;
  }

  // Check real-time 3D collision against active orbiting circular obstacles on nearby rings
  const checkStartIdx = Math.max(0, state.currentRingIndex - 1);
  const checkEndIdx = Math.min(
    level.rings.length - 1,
    state.currentRingIndex + 1
  );
  for (let rIdx = checkStartIdx; rIdx <= checkEndIdx; rIdx++) {
    const nearbyRing = level.rings[rIdx];
    if (nearbyRing.shattered) continue;

    if (
      isActiveRoundObstacleHittingMonster(
        nearbyRing,
        state.towerRotation,
        state.monsterY
      )
    ) {
      if (state.isFever || state.isBoosting) {
        // Fever Smash or Active Turbo Boost obliterates the ring & its obstacles!
        nearbyRing.shattered = true;
        nearbyRing.passed = true;
        state.score += calculateRingScore(
          state.ringsPassedInFall,
          state.combo,
          true
        );
        events.ringsShattered.push(nearbyRing.ringIndex);
        events.calloutText = state.isBoosting ? 'TURBO SMASH!' : 'MEGA POP!';
        state.lastCallout = events.calloutText;
        state.currentRingIndex = Math.max(
          state.currentRingIndex,
          nearbyRing.ringIndex + 1
        );
        state.monsterVy = TOWER_CONSTANTS.BOUNCE_VELOCITY * 0.95;
        state.ringsPassedInFall = 0;
        state.isFever = false;
        if (state.isBoosting) {
          state.isBoosting = false;
          state.boostTimer = 0;
          state.boostCooldown = TOWER_CONSTANTS.BOOST_COOLDOWN;
          events.boostEnded = true;
        }
        state.hitstopTimer = 0.045;
        state.scaleX = 1.35;
        state.scaleY = 0.65;
        state.scaleZ = 1.35;
        return events;
      } else {
        state.monsterVy = 0;
        state.outcome = 'defeat';
        state.hitstopTimer = 0.06;
        state.scaleX = 1.45;
        state.scaleY = 0.52;
        state.scaleZ = 1.45;
        events.hitHazard = true;
        return events;
      }
    }
  }

  // Check collisions with active rings while descending
  while (state.currentRingIndex < level.rings.length) {
    const ring = level.rings[state.currentRingIndex];
    const surfaceY = ring.y + 0.25 + TOWER_CONSTANTS.MONSTER_RADIUS;

    if (
      !state.isFever &&
      !state.isBoosting &&
      ring.obstacleType !== 'none' &&
      Math.abs(state.monsterY - surfaceY) < 0.55 &&
      isRotatingObstacleHittingMonster(ring, state.towerRotation)
    ) {
      state.monsterY = surfaceY;
      state.monsterVy = 0;
      state.outcome = 'defeat';
      state.hitstopTimer = 0.06;
      state.scaleX = 1.45;
      state.scaleY = 0.52;
      state.scaleZ = 1.45;
      events.hitHazard = true;
      break;
    }

    if (prevY >= surfaceY - 0.35 && state.monsterY <= surfaceY) {
      const slice = getSliceUnderMonster(ring, state.towerRotation);
      const slicesCount = ring.slices.length;
      const leftSlice =
        ring.slices[(slice.index - 1 + slicesCount) % slicesCount];
      const rightSlice = ring.slices[(slice.index + 1) % slicesCount];

      if (slice.hasGem && !slice.gemCollected) {
        slice.gemCollected = true;
        state.gems += 1;
        state.score += 25;
        events.gemsCollected += 1;
      }

      // Collect glowing Boost Orb on current or immediately adjacent slice
      for (const candidateSlice of [slice, leftSlice, rightSlice]) {
        if (
          candidateSlice &&
          candidateSlice.hasBoostOrb &&
          !candidateSlice.boostOrbCollected
        ) {
          candidateSlice.boostOrbCollected = true;
          state.boostOrbsCollected += 1;
          state.boostEnergy = Math.min(
            TOWER_CONSTANTS.BOOST_MAX_ENERGY,
            state.boostEnergy + 30
          );
          state.score += 35;
          events.boostOrbsCollected += 1;
          events.calloutText = 'BOOST ORB +30%!';
          state.lastCallout = 'BOOST ORB +30%!';
        }
      }

      if (slice.type === 'finish') {
        state.monsterY = surfaceY;
        state.monsterVy = TOWER_CONSTANTS.BOUNCE_VELOCITY;
        state.isBoosting = false;
        state.boostTimer = 0;
        state.outcome = 'victory';
        state.score += 100 * level.level;
        state.scaleX = 1.32;
        state.scaleY = 0.68;
        state.scaleZ = 1.32;
        events.reachedFinish = true;
        events.calloutText = 'MEGA POP!';
        break;
      }

      // Active Boost smashes straight through breakable platforms!
      if (state.isBoosting && slice.type === 'breakable' && !slice.broken) {
        slice.broken = true;
        ring.passed = true;
        state.ringsPassedInFall += 1;
        state.combo = Math.min(12, state.combo + 1);
        state.maxCombo = Math.max(state.maxCombo, state.combo);
        state.boostEnergy = Math.min(
          TOWER_CONSTANTS.BOOST_MAX_ENERGY,
          state.boostEnergy + 20
        );
        state.score += calculateRingScore(
          state.ringsPassedInFall,
          state.combo,
          true
        );
        events.brokeSlice = {
          ringIndex: ring.ringIndex,
          sliceIndex: slice.index,
        };
        events.ringsPassed.push(ring.ringIndex);
        events.calloutText = 'BOOST SMASH!';
        state.lastCallout = 'BOOST SMASH!';
        state.currentRingIndex += 1;
        continue;
      }

      if (
        slice.type === 'gap' ||
        (slice.type === 'breakable' && slice.broken)
      ) {
        if (!ring.passed) {
          ring.passed = true;
          state.ringsPassedInFall += 1;
          state.combo = Math.min(12, state.combo + 1);
          state.maxCombo = Math.max(state.maxCombo, state.combo);
          if (
            state.ringsPassedInFall >= TOWER_CONSTANTS.FEVER_RING_THRESHOLD
          ) {
            state.isFever = true;
            // ABSOLUTE DROP acceleration: monster accelerates downward when passing 3+ consecutive gaps!
            state.monsterVy = Math.min(state.monsterVy - 3.8, -26.5);
          } else if (state.ringsPassedInFall === 2) {
            state.monsterVy = Math.min(state.monsterVy - 2.0, -21.5);
          }
          // Recharge Boost Energy from combo drops!
          const comboEnergyGain = state.ringsPassedInFall >= 2 ? 18 : 12;
          state.boostEnergy = Math.min(
            TOWER_CONSTANTS.BOOST_MAX_ENERGY,
            state.boostEnergy + comboEnergyGain
          );
          const baseRingPts = calculateRingScore(
            state.ringsPassedInFall,
            state.combo,
            false
          );
          const absoluteDropBonus =
            state.ringsPassedInFall >= 3 ? state.ringsPassedInFall * 25 : 0;
          state.score += baseRingPts + absoluteDropBonus;
          events.ringsPassed.push(ring.ringIndex);
          const callout = getComboCallout(
            state.ringsPassedInFall,
            state.combo,
            false
          );
          state.lastCallout = callout;
          if (!events.calloutText) {
            events.calloutText = callout;
          }
        }
        state.currentRingIndex += 1;
        // Milestone Boost Energy bonus every 5 floors descended
        if (
          state.currentRingIndex > 0 &&
          state.currentRingIndex % 5 === 0 &&
          state.lastMilestoneFloor !== state.currentRingIndex
        ) {
          state.lastMilestoneFloor = state.currentRingIndex;
          state.boostEnergy = Math.min(
            TOWER_CONSTANTS.BOOST_MAX_ENERGY,
            state.boostEnergy + 20
          );
        }
        continue;
      }

      if (state.isFever || state.isBoosting) {
        events.landingImpactFloors = state.ringsPassedInFall;
        ring.shattered = true;
        ring.passed = true;
        state.score += calculateRingScore(
          state.ringsPassedInFall,
          state.combo,
          true
        );
        events.ringsShattered.push(ring.ringIndex);
        events.calloutText = state.isBoosting ? 'BOOST SMASH!' : 'MEGA POP!';
        state.lastCallout = events.calloutText;
        state.currentRingIndex += 1;
        state.monsterY = surfaceY;
        state.monsterVy = TOWER_CONSTANTS.BOUNCE_VELOCITY * 0.95;
        state.ringsPassedInFall = 0;
        state.isFever = false;
        if (state.isBoosting) {
          state.isBoosting = false;
          state.boostTimer = 0;
          state.boostCooldown = TOWER_CONSTANTS.BOOST_COOLDOWN;
          events.boostEnded = true;
        }
        state.hitstopTimer = 0.045;
        state.scaleX = 1.35;
        state.scaleY = 0.65;
        state.scaleZ = 1.35;
        break;
      }

      if (
        slice.type === 'hazard' ||
        isRotatingObstacleHittingMonster(ring, state.towerRotation)
      ) {
        state.monsterY = surfaceY;
        state.monsterVy = 0;
        state.outcome = 'defeat';
        state.hitstopTimer = 0.06;
        state.scaleX = 1.45;
        state.scaleY = 0.52;
        state.scaleZ = 1.45;
        events.hitHazard = true;
        break;
      }

      if (slice.type === 'spring') {
        events.landingImpactFloors = state.ringsPassedInFall;
        state.monsterY = surfaceY;
        state.monsterVy = TOWER_CONSTANTS.SPRING_VELOCITY;
        state.ringsPassedInFall = 0;
        state.isFever = false;
        state.boostEnergy = Math.min(
          TOWER_CONSTANTS.BOOST_MAX_ENERGY,
          state.boostEnergy + 20
        );
        state.score += 30;
        state.scaleX = 1.35;
        state.scaleY = 0.65;
        state.scaleZ = 1.35;
        events.springBounced = true;
        events.calloutText = 'SUPER DROP!';
        break;
      }

      if (slice.type === 'breakable' && !slice.broken) {
        events.landingImpactFloors = state.ringsPassedInFall;
        slice.broken = true;
        state.monsterY = surfaceY;
        state.monsterVy = TOWER_CONSTANTS.BOUNCE_VELOCITY;
        state.ringsPassedInFall = 0;
        state.isFever = false;
        // Breaking a special cookie platform recharges Boost Energy!
        state.boostEnergy = Math.min(
          TOWER_CONSTANTS.BOOST_MAX_ENERGY,
          state.boostEnergy + 25
        );
        state.score += 20;
        state.scaleX = 1.28;
        state.scaleY = 0.7;
        state.scaleZ = 1.28;
        events.bounced = true;
        events.brokeSlice = {
          ringIndex: ring.ringIndex,
          sliceIndex: slice.index,
        };
        break;
      }

      // Normal platform bounce
      events.landingImpactFloors = state.ringsPassedInFall;
      state.monsterY = surfaceY;
      state.monsterVy = TOWER_CONSTANTS.BOUNCE_VELOCITY;
      state.ringsPassedInFall = 0;
      state.combo = 1;
      state.isFever = false;
      state.scaleX = 1.26;
      state.scaleY = 0.72;
      state.scaleZ = 1.26;
      events.bounced = true;
      break;
    } else {
      break;
    }
  }

  return events;
}

export interface GameplayCameraFraming {
  /** Base vertical field of view in degrees (wider Helix Jump style) */
  baseFov: number;
  /** Camera Z distance from the central tower axis (zoomed out to show full tower width + multiple upcoming floors) */
  camZ: number;
  /** Camera Y height offset above the tracked vertical target (slightly elevated Helix Jump viewing angle) */
  camYOffset: number;
  /** Camera lookAt Y offset relative to cameraCurrentY (looks slightly downward along the spiral tower) */
  lookAtYOffset: number;
  /** Target Y offset relative to monsterY so upcoming platforms below the monster remain in view */
  targetMonsterYOffset: number;
}

/**
 * Computes responsive Helix Jump-style camera framing parameters for portrait mobile, tablet, and desktop screens.
 * Ensures the full circular platform width and 3–4 upcoming floors are comfortably visible without shrinking 3D models.
 */
export function computeGameplayCameraFraming(
  aspect: number
): GameplayCameraFraming {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 0.56;

  if (safeAspect < 0.75) {
    // Portrait mobile (e.g. 360x800 to 430x932): wider FOV + adaptive zoom-out so the 3.78-radius tower never feels cramped or cropped
    const clampedPortraitAspect = Math.max(0.42, safeAspect);
    const adaptiveCamZ = Number(
      Math.min(21.5, Math.max(18.2, 9.25 / clampedPortraitAspect)).toFixed(2)
    );
    return {
      baseFov: 60,
      camZ: adaptiveCamZ,
      camYOffset: 7.0,
      lookAtYOffset: -8.2,
      targetMonsterYOffset: -0.45,
    };
  }

  if (safeAspect < 1.15) {
    // Tablet / square viewports
    return {
      baseFov: 56,
      camZ: 17.6,
      camYOffset: 6.5,
      lookAtYOffset: -7.6,
      targetMonsterYOffset: -0.4,
    };
  }

  // Desktop landscape viewports (e.g. 1280x720, 1440x900, 1920x1080)
  return {
    baseFov: 54,
    camZ: 16.8,
    camYOffset: 6.2,
    lookAtYOffset: -7.2,
    targetMonsterYOffset: -0.4,
  };
}

