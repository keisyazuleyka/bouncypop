import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateTowerLevel,
  createInitialPhysicsState,
  getSliceUnderMonster,
  calculateRingScore,
  calculateTowerProgress,
  calculateRemainingFloors,
  getTotalFloorsForLevel,
  canActivateBoost,
  activateBoost,
  stepGamePhysics,
  normalizeAngle,
  shortestAngleDist,
  getWorldForLevel,
  getComboCallout,
  getLevelDifficultyConfig,
  updateRingActiveObstacles,
  isActiveRoundObstacleHittingMonster,
  isRotatingObstacleHittingMonster,
  computeGameplayCameraFraming,
  TOWER_CONSTANTS,
} from './rules';

test('normalizeAngle wraps negative and large angles into [0, 2*PI)', () => {
  const twoPi = Math.PI * 2;
  assert.ok(Math.abs(normalizeAngle(0) - 0) < 1e-6);
  assert.ok(Math.abs(normalizeAngle(-Math.PI / 2) - (3 * Math.PI) / 2) < 1e-6);
  assert.ok(Math.abs(normalizeAngle(twoPi + 1.2) - 1.2) < 1e-6);
});

test('longer tower floor progression matches exact floor counts for Levels 1–11+ and updates finish & remaining floors', () => {
  const expectedFloors: Record<number, number> = {
    1: 25,
    2: 30,
    3: 35,
    4: 40,
    5: 45,
    6: 50,
    7: 55,
    8: 60,
    9: 65,
    10: 70,
    11: 75,
    12: 80,
  };

  for (const [lvlStr, expected] of Object.entries(expectedFloors)) {
    const lvl = Number(lvlStr);
    assert.equal(
      getTotalFloorsForLevel(lvl),
      expected,
      `Level ${lvl} must have ${expected} playable floors`
    );
    const tower = generateTowerLevel(lvl);
    assert.equal(tower.totalRings, expected);
    assert.equal(tower.rings.length, expected);
    // Bottom ring (index totalRings - 1) is the finish line at y = 0
    assert.equal(tower.rings[expected - 1].y, 0);
    assert.equal(tower.rings[expected - 1].slices[0].type, 'finish');
    assert.equal(calculateRemainingFloors(0, expected), expected - 1);
    assert.equal(calculateRemainingFloors(expected - 1, expected), 0);
  }
});

test('progressive difficulty system scales smoothly across Levels 1–2 (Easy), 3–4 (Normal), 5–7 (Medium/Medium-Hard), 8–10 (Hard/Very Hard), and 11+ (Expert)', () => {
  const d1 = getLevelDifficultyConfig(1);
  const d2 = getLevelDifficultyConfig(2);
  const d3 = getLevelDifficultyConfig(3);
  const d4 = getLevelDifficultyConfig(4);
  const d5 = getLevelDifficultyConfig(5);
  const d7 = getLevelDifficultyConfig(7);
  const d8 = getLevelDifficultyConfig(8);
  const d10 = getLevelDifficultyConfig(10);
  const d11 = getLevelDifficultyConfig(11);
  const d16 = getLevelDifficultyConfig(16);

  // Tier labels match the progression spec
  assert.equal(d1.tierLabel, 'EASY');
  assert.equal(d2.tierLabel, 'EASY');
  assert.equal(d3.tierLabel, 'NORMAL');
  assert.equal(d4.tierLabel, 'NORMAL');
  assert.equal(d5.tierLabel, 'MEDIUM');
  assert.equal(d7.tierLabel, 'MEDIUM-HARD');
  assert.equal(d8.tierLabel, 'HARD');
  assert.equal(d10.tierLabel, 'VERY HARD');
  assert.equal(d11.tierLabel, 'EXPERT');

  // Reduced obstacle density on early & normal levels (0 obstacles on Levels 1–2, 1 max on Levels 3–5)
  assert.equal(d1.maxActiveObstaclesPerRing, 0);
  assert.equal(d2.maxActiveObstaclesPerRing, 0);
  assert.equal(d3.maxActiveObstaclesPerRing, 1);
  assert.equal(d4.maxActiveObstaclesPerRing, 1);
  assert.equal(d5.maxActiveObstaclesPerRing, 1);
  assert.equal(d8.maxActiveObstaclesPerRing, 2);
  assert.equal(d11.maxActiveObstaclesPerRing, 2);

  // Wide Helix Jump gaps across all levels (4-5 slices on Level 1, 4 slices on Levels 2-3, >= 3 slices on Levels 4+)
  assert.ok(d1.minGapSlices >= 4);
  assert.ok(d2.minGapSlices >= 4);
  assert.ok(d3.minGapSlices >= 4);
  for (const cfg of [d4, d5, d7, d8, d10, d11, d16]) {
    assert.ok(
      cfg.minGapSlices >= 3,
      `Level ${cfg.level} minGapSlices must be at least 3 slices (90 deg)`
    );
  }

  // All obstacles and platforms are configured with zero movement speeds across all levels
  for (const cfg of [d1, d2, d3, d4, d5, d7, d8, d10, d11, d16]) {
    assert.equal(cfg.movingRingChance, 0);
    assert.equal(cfg.orbitSpeedMultiplier, 0);
    assert.equal(cfg.bounceFrequencyMultiplier, 0);
  }
});

test('all circular obstacles and platforms remain completely static throughout gameplay, have wide gaps, and never block gap or normal slices across Levels 1–10', () => {
  for (let lvl = 1; lvl <= 10; lvl++) {
    const levelData = generateTowerLevel(lvl);
    // Top spawn ring is 100% safe without surface obstacles
    assert.equal(
      levelData.rings[0].activeObstacles.length,
      0,
      `Level ${lvl} top spawn ring must be safe`
    );

    for (let r = 0; r < levelData.rings.length - 1; r++) {
      const ring = levelData.rings[r];
      // Every platform ring is static (no auto-rotation or oscillation)
      assert.equal(ring.spinSpeed, 0, `Level ${lvl} ring ${r} spinSpeed must be 0`);
      assert.equal(ring.oscillateAmplitude, 0, `Level ${lvl} ring ${r} oscillateAmplitude must be 0`);
      assert.equal(ring.obstacleSpeed, 0, `Level ${lvl} ring ${r} obstacleSpeed must be 0`);

      // Every playable ring has generous gap slices (>= 4 on Levels 1-3, >= 3 on Levels 4+)
      const gapSlices = ring.slices.filter((s) => s.type === 'gap');
      const expectedMinGaps = lvl <= 3 ? 4 : 3;
      assert.ok(
        gapSlices.length >= expectedMinGaps,
        `Level ${lvl} ring ${r} must have at least ${expectedMinGaps} gap slices, got ${gapSlices.length}`
      );

      // Obstacle count never exceeds level max
      assert.ok(
        ring.activeObstacles.length <= levelData.difficulty.maxActiveObstaclesPerRing,
        `Level ${lvl} ring ${r} exceeded max obstacles`
      );

      // Every obstacle has zero movement speed and is centered strictly on an existing hazard slice (never blocking a gap or normal slice)
      const sliceArc = (Math.PI * 2) / TOWER_CONSTANTS.SLICE_COUNT;
      for (const obs of ring.activeObstacles) {
        assert.equal(obs.angularSpeed, 0);
        assert.equal(obs.selfSpinSpeed, 0);
        assert.equal(obs.groupSpinSpeed, 0);
        assert.equal(obs.bounceAmplitude, 0);
        assert.equal(obs.radiusAmplitude, 0);
        const sIdx =
          Math.floor(normalizeAngle(obs.currentAngle) / sliceArc) %
          TOWER_CONSTANTS.SLICE_COUNT;
        assert.equal(
          ring.slices[sIdx].type,
          'hazard',
          `Static obstacle on Level ${lvl} ring ${r} must sit strictly on a hazard slice, got ${ring.slices[sIdx].type}`
        );
      }
    }
  }

  // Verify obstacles and platforms remain 100% stationary over 9 seconds of gameplay physics when towerRotation is constant
  let openRing = generateTowerLevel(3).rings.find(
    (r, idx) => idx > 0 && r.activeObstacles.length > 0
  );
  for (let attempt = 0; attempt < 10 && !openRing; attempt++) {
    openRing = generateTowerLevel(5).rings.find(
      (r, idx) => idx > 0 && r.activeObstacles.length > 0
    );
  }
  assert.ok(openRing, 'Should find a ring with a static obstacle on Level 3–5');
  const obsOpen = openRing.activeObstacles[0];

  const initialAngle = obsOpen.currentAngle;
  const initialRingOffset = openRing.rotationOffset;
  const initialWorldX = obsOpen.worldX;
  const initialWorldY = obsOpen.worldY;
  const initialWorldZ = obsOpen.worldZ;

  for (let i = 0; i < 540; i++) {
    updateRingActiveObstacles(openRing, 1 / 60, (i + 1) / 60, 0);
  }

  assert.equal(
    obsOpen.currentAngle,
    initialAngle,
    'Static obstacle angle must not change over time'
  );
  assert.equal(
    openRing.rotationOffset,
    initialRingOffset,
    'Static ring rotationOffset must not change over time'
  );
  assert.equal(obsOpen.worldX, initialWorldX);
  assert.equal(obsOpen.worldY, initialWorldY);
  assert.equal(obsOpen.worldZ, initialWorldZ);
});

test('Helix Jump straight-down falling: aligning tower with top gap on Level 1 drops monster straight through 3+ consecutive floors and reports landingImpactFloors', () => {
  const level1 = generateTowerLevel(1);
  const state = createInitialPhysicsState(level1);

  // Slice 4 is near the center of the top ring's wide primary gap (slices 3, 4, 5, 6)
  const sliceArc = (Math.PI * 2) / TOWER_CONSTANTS.SLICE_COUNT;
  const gapCenterLocalAngle = 4.5 * sliceArc;
  state.towerRotation = -gapCenterLocalAngle - level1.rings[0].rotationOffset;

  let maxRingsInSingleFall = 0;
  let recordedLandingImpactFloors = 0;

  for (let frame = 0; frame < 240; frame++) {
    const events = stepGamePhysics(state, level1, 1 / 60);
    if (state.ringsPassedInFall > maxRingsInSingleFall) {
      maxRingsInSingleFall = state.ringsPassedInFall;
    }
    if (events.landingImpactFloors > 0) {
      recordedLandingImpactFloors = events.landingImpactFloors;
      break;
    }
  }

  assert.ok(
    maxRingsInSingleFall >= 3,
    `Monster should fall straight down through at least 3 consecutive floors on Level 1 opening drop, got ${maxRingsInSingleFall}`
  );
  assert.equal(recordedLandingImpactFloors, maxRingsInSingleFall);
  assert.equal(state.outcome, 'none');
});

test('gap edge forgiveness slips monster smoothly into adjacent gap slice when grazing the lip', () => {
  const level1 = generateTowerLevel(1);
  const ring = level1.rings[0];
  ring.rotationOffset = 0;
  // Slice 2 is normal, Slice 3 is gap. Boundary is at localAngle = 3 * sliceArc
  assert.equal(ring.slices[2].type, 'normal');
  assert.equal(ring.slices[3].type, 'gap');

  const sliceArc = (Math.PI * 2) / TOWER_CONSTANTS.SLICE_COUNT;
  const boundaryAngle = 3 * sliceArc;
  // Place monster just 0.08 rad (~4.5 deg) inside the normal slice next to the gap
  const slightlyInsideNormalNearGap = boundaryAngle - 0.08;
  const resolvedSlice = getSliceUnderMonster(ring, -slightlyInsideNormalNearGap);
  assert.equal(
    resolvedSlice.type,
    'gap',
    'Monster grazing within 8 degrees of a gap edge should slip smoothly into the gap'
  );
});

test('active round obstacle 3D collision accurately triggers when obstacle orbits into monster position', () => {
  const level3 = generateTowerLevel(3);
  const state = createInitialPhysicsState(level3);
  const ring = level3.rings[1];
  const obstacleY = ring.y + 0.25 + 0.56;

  ring.rotationOffset = 0;
  ring.activeObstacles = [
    {
      id: 'test-hit',
      behavior: 'orbiting',
      visualKind: 'donut_roller',
      currentAngle: 0, // angle 0 places the pivotGroup child at (0, y, +MONSTER_Z) when towerRotation = 0
      currentRadius: TOWER_CONSTANTS.MONSTER_Z,
      currentYOffset: 0.56,
      selfRotation: 0,
      groupSpinAngle: 0,
      direction: 1,
      reverseTimer: 0,
      worldX: 0,
      worldY: obstacleY,
      worldZ: TOWER_CONSTANTS.MONSTER_Z,
      baseAngle: 0,
      angularSpeed: 1.5,
      selfSpinSpeed: 4.0,
      patrolRange: Math.PI * 2,
      baseRadius: TOWER_CONSTANTS.MONSTER_Z,
      radiusAmplitude: 0,
      radiusFreq: 0,
      baseYOffset: 0.56,
      bounceAmplitude: 0,
      bounceFreq: 0,
      bouncePhase: 0,
      reverseInterval: 0,
      memberCount: 1,
      groupSpreadRadius: 0.5,
      groupSpinSpeed: 3.0,
      hitRadius: 0.42,
      accentColor: 0xff2a55,
    },
  ];

  // Collides when monster is at angle 0 and height obstacleY
  assert.equal(
    isActiveRoundObstacleHittingMonster(ring, 0, obstacleY),
    true
  );

  // Does not collide when tower is rotated away by 90 degrees
  assert.equal(
    isActiveRoundObstacleHittingMonster(ring, Math.PI / 2, obstacleY),
    false
  );

  // Also test stepGamePhysics triggering defeat when monster hits active obstacle
  state.currentRingIndex = 1;
  state.monsterY = obstacleY + 0.1;
  state.towerRotation = 0;
  const events = stepGamePhysics(state, level3, 1 / 60);
  assert.equal(events.hitHazard, true);
  assert.equal(state.outcome, 'defeat');
});

test('monster survives initial spawn without input and bounces on top ring', () => {
  const level = generateTowerLevel(1);
  const state = createInitialPhysicsState(level);

  let bouncedCount = 0;
  for (let frame = 0; frame < 180; frame++) {
    const events = stepGamePhysics(state, level, 1 / 60);
    if (events.bounced) bouncedCount++;
  }

  assert.equal(state.outcome, 'none');
  assert.equal(state.currentRingIndex, 0);
  assert.ok(
    bouncedCount >= 2,
    'Monster should bounce repeatedly on safe spawn slice'
  );
});

test('breakable cookie slice bounces monster once then breaks open for next drop', () => {
  const level = generateTowerLevel(2);
  const state = createInitialPhysicsState(level);

  level.rings[0].slices[0].type = 'breakable';
  level.rings[0].slices[0].broken = false;
  level.rings[1].activeObstacles = [];
  state.towerRotation = -0.05;

  let brokeFirstBounce = false;
  let passedOnSecondFall = false;

  for (let frame = 0; frame < 180; frame++) {
    const events = stepGamePhysics(state, level, 1 / 60);
    if (events.brokeSlice && events.brokeSlice.ringIndex === 0) {
      brokeFirstBounce = true;
    }
    if (events.ringsPassed.includes(0)) {
      passedOnSecondFall = true;
      break;
    }
  }

  assert.equal(brokeFirstBounce, true);
  assert.equal(passedOnSecondFall, true);
});

test('world progression and combo callout helpers return expected values', () => {
  assert.equal(getWorldForLevel(1).id, 'candy');
  assert.equal(getWorldForLevel(4).id, 'toy');
  assert.equal(getWorldForLevel(7).id, 'dessert');
  assert.equal(getWorldForLevel(10).id, 'fantasy');
  assert.equal(getComboCallout(1, 2, false), 'NICE!');
  assert.equal(getComboCallout(2, 3, false), 'GREAT!');
  assert.equal(getComboCallout(2, 5, false), 'SUPER DROP!');
  assert.equal(getComboCallout(3, 5, false), 'ABSOLUTE!');
  assert.equal(getComboCallout(4, 8, false), 'CRAZY COMBO!');
  assert.equal(getComboCallout(3, 4, true), 'MEGA POP!');
  assert.equal(calculateTowerProgress(25, 50), 50);
  assert.ok(calculateRingScore(3, 4, true) > calculateRingScore(1, 1, false));
  const ring = generateTowerLevel(5).rings[2];
  ring.obstacleType = 'candy_bar';
  ring.rotationOffset = 0;
  ring.obstacleAngle = 0;
  assert.equal(isRotatingObstacleHittingMonster(ring, 0), true);
  assert.equal(
    getSliceUnderMonster(generateTowerLevel(1).rings[0], 0).type,
    'normal'
  );
});

test('boost system activates speed boost, smashes through breakable platforms, applies cooldown, and recharges via Boost Orbs and milestones', () => {
  const level = generateTowerLevel(3);
  const state = createInitialPhysicsState(level);

  // Initially starts with 100% Boost Energy and ready to activate
  assert.equal(state.boostEnergy, 100);
  assert.equal(canActivateBoost(state), true);

  const activated = activateBoost(state);
  assert.equal(activated, true);
  assert.equal(state.isBoosting, true);
  assert.ok(state.monsterVy < TOWER_CONSTANTS.MAX_FALL_SPEED);

  // Place a breakable cookie slice directly under monster on ring 0 and clear ring 1 obstacles
  level.rings[0].slices[0].type = 'breakable';
  level.rings[0].slices[0].broken = false;
  level.rings[1].activeObstacles = [];
  state.towerRotation = -0.05;

  // Step physics while boosting: monster should smash straight through the breakable slice on the first pass!
  let smashedThroughOnFirstPass = false;
  for (let i = 0; i < 40; i++) {
    const events = stepGamePhysics(state, level, 1 / 60);
    if (events.ringsPassed.includes(0) || events.ringsShattered.includes(0)) {
      smashedThroughOnFirstPass = true;
      break;
    }
  }
  assert.equal(
    smashedThroughOnFirstPass,
    true,
    'Boosting monster must smash straight through breakable platform without bouncing up'
  );

  // Advance until boost ends and verify cooldown prevents immediate re-activation
  for (const r of level.rings) {
    r.activeObstacles = [];
    r.obstacleType = 'none';
  }
  for (let i = 0; i < 120; i++) {
    stepGamePhysics(state, level, 1 / 60);
  }
  assert.equal(state.isBoosting, false);
  assert.ok(state.boostCooldown > 0, 'Boost cooldown should be active after boost expires');
  assert.equal(canActivateBoost(state), false);

  // Collecting a Boost Orb recharges Boost Energy by +30%
  state.outcome = 'none';
  state.boostEnergy = 20;
  const targetRing = level.rings[state.currentRingIndex];
  targetRing.spinSpeed = 0;
  targetRing.oscillateAmplitude = 0;
  const sliceUnder = getSliceUnderMonster(targetRing, state.towerRotation);
  sliceUnder.hasBoostOrb = true;
  sliceUnder.boostOrbCollected = false;
  state.monsterY = targetRing.y + 0.5;
  state.monsterVy = 0;
  const orbEvents = stepGamePhysics(state, level, 1 / 60);
  assert.equal(orbEvents.boostOrbsCollected, 1);
  assert.ok(state.boostEnergy >= 45, 'Collecting a Boost Orb must recharge Boost Energy');
});

test('computeGameplayCameraFraming provides wider Helix Jump-style FOV and camera distance for mobile portrait and desktop screens', () => {
  const mobileNarrow = computeGameplayCameraFraming(360 / 800); // 0.45
  const mobileStandard = computeGameplayCameraFraming(390 / 844); // 0.462
  const tablet = computeGameplayCameraFraming(768 / 1024); // 0.75
  const desktop = computeGameplayCameraFraming(1440 / 900); // 1.6

  // Wider FOV and zoomed-out camera Z distance so full circular platform width + 3-4 upcoming floors are visible
  assert.equal(mobileNarrow.baseFov, 60);
  assert.equal(mobileStandard.baseFov, 60);
  assert.ok(mobileNarrow.camZ >= 20.0);
  assert.ok(mobileStandard.camZ >= 19.5);
  assert.ok(mobileNarrow.camZ >= mobileStandard.camZ);

  assert.equal(tablet.baseFov, 56);
  assert.equal(desktop.baseFov, 54);
  assert.equal(desktop.camZ, 16.8);

  // Verify horizontal half-frustum at tower center (z = 0) on 390x844 mobile portrait comfortably exceeds OUTER_RADIUS (3.78)
  const vFovRad = (mobileStandard.baseFov * Math.PI) / 180;
  const hHalfSpanAtTowerCenter =
    mobileStandard.camZ * Math.tan(vFovRad / 2) * (390 / 844);
  assert.ok(
    hHalfSpanAtTowerCenter > TOWER_CONSTANTS.OUTER_RADIUS + 1.0,
    `Horizontal half-span (${hHalfSpanAtTowerCenter.toFixed(2)}) must comfortably exceed tower outer radius (${TOWER_CONSTANTS.OUTER_RADIUS})`
  );
});


