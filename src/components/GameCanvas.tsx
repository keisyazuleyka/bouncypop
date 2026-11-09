import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  GameState,
  MonsterSkin,
  TowerLevel,
  PhysicsState,
  WorldId,
  TOWER_CONSTANTS,
  generateTowerLevel,
  createInitialPhysicsState,
  stepGamePhysics,
  calculateTowerProgress,
  calculateRemainingFloors,
  activateBoost,
  canActivateBoost,
  getSliceUnderMonster,
  computeGameplayCameraFraming,
  GameplayCameraFraming,
} from '../game/rules';
import {
  createMonsterCharacter,
  applyMonsterSkin,
  updateMonsterShowcaseAnimation,
  updateMonsterSpiralEffect,
  createShowcaseStage,
  createSharedPlatformAssets,
  populateSliceMeshGroup,
  createBoostOrbMesh,
  createActiveRoundObstacleMesh,
  BuiltActiveObstacleMesh,
  createRingRotatingObstacle,
  createPillarTexture,
  createFinishCheckeredTexture,
  PooledParticleSystem,
} from '../game/models';
import { soundManager } from '../game/audio';

export interface EndOfRunStats {
  outcome: 'victory' | 'defeat';
  level: number;
  score: number;
  bestScore: number;
  progress: number;
  maxCombo: number;
  gemsCollected: number;
}

export interface HudDomRefs {
  scoreEl: React.RefObject<HTMLSpanElement | null>;
  bestScoreEl: React.RefObject<HTMLSpanElement | null>;
  floorsRemainingEl: React.RefObject<HTMLSpanElement | null>;
  comboEl: React.RefObject<HTMLDivElement | null>;
  progressFillEl: React.RefObject<HTMLDivElement | null>;
  progressTextEl: React.RefObject<HTMLSpanElement | null>;
  boostFillEl: React.RefObject<HTMLDivElement | null>;
  boostStatusEl: React.RefObject<HTMLSpanElement | null>;
  boostBtnEl: React.RefObject<HTMLButtonElement | null>;
  feverBannerEl: React.RefObject<HTMLDivElement | null>;
  calloutEl: React.RefObject<HTMLDivElement | null>;
}

interface GameCanvasProps {
  gameState: GameState;
  levelNumber: number;
  selectedWorldId: WorldId | null;
  runKey: number;
  selectedSkin: MonsterSkin;
  showcaseActive: boolean;
  showcaseSkin: MonsterSkin;
  showcaseResetKey: number;
  bestScore: number;
  hudRefs: HudDomRefs;
  triggerBoostRef: React.MutableRefObject<(() => void) | null>;
  onTutorialDismiss: () => void;
  onRunComplete: (stats: EndOfRunStats) => void;
}

interface BuiltRingGroup {
  group: THREE.Group;
  sliceHolders: Map<number, THREE.Group>;
  gemMeshes: Map<number, THREE.Mesh>;
  boostOrbMeshes: Map<number, THREE.Group>;
  activeObstacleMeshes: BuiltActiveObstacleMesh[];
  rotatingObstacleGroup: THREE.Group | null;
  primaryMat: THREE.MeshStandardMaterial;
  secondaryMat: THREE.MeshStandardMaterial;
  fadeOutProgress: number;
  isFading: boolean;
}

const SHOWCASE_STAGE_Y = 50.0;

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  levelNumber,
  selectedWorldId,
  runKey,
  selectedSkin,
  showcaseActive,
  showcaseSkin,
  showcaseResetKey,
  bestScore,
  hudRefs,
  triggerBoostRef,
  onTutorialDismiss,
  onRunComplete,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const bgGradientRef = useRef<HTMLDivElement | null>(null);

  const gameStateRef = useRef<GameState>(gameState);
  gameStateRef.current = gameState;

  const levelNumberRef = useRef<number>(levelNumber);
  levelNumberRef.current = levelNumber;

  const selectedWorldIdRef = useRef<WorldId | null>(selectedWorldId);
  selectedWorldIdRef.current = selectedWorldId;

  const bestScoreRef = useRef<number>(bestScore);
  bestScoreRef.current = bestScore;

  const onTutorialDismissRef = useRef(onTutorialDismiss);
  onTutorialDismissRef.current = onTutorialDismiss;

  const onRunCompleteRef = useRef(onRunComplete);
  onRunCompleteRef.current = onRunComplete;

  const skinRef = useRef<MonsterSkin>(selectedSkin);
  skinRef.current = selectedSkin;

  const showcaseActiveRef = useRef<boolean>(showcaseActive);
  showcaseActiveRef.current = showcaseActive;

  const showcaseSkinRef = useRef<MonsterSkin>(showcaseSkin);
  showcaseSkinRef.current = showcaseSkin;

  const rebuildTowerRef = useRef<
    ((lvl: number, worldOverride: WorldId | null, preserveScore?: number) => void) | null
  >(null);
  const applySkinFnRef = useRef<
    ((skin: MonsterSkin, triggerShowcaseBurst?: boolean) => void) | null
  >(null);
  const resetShowcaseAngleFnRef = useRef<(() => void) | null>(null);
  const cumulativeScoreRef = useRef<number>(0);

  // Update active monster skin (uses showcaseSkin while in Showcase mode, otherwise selectedSkin)
  const effectiveSkin = showcaseActive ? showcaseSkin : selectedSkin;
  useEffect(() => {
    if (applySkinFnRef.current) {
      applySkinFnRef.current(effectiveSkin, showcaseActive);
    }
  }, [effectiveSkin, showcaseActive]);

  useEffect(() => {
    if (resetShowcaseAngleFnRef.current) {
      resetShowcaseAngleFnRef.current();
    }
  }, [showcaseResetKey]);

  useEffect(() => {
    if (rebuildTowerRef.current) {
      const keepScore = levelNumber > 1 ? cumulativeScoreRef.current : 0;
      rebuildTowerRef.current(levelNumber, selectedWorldId, keepScore);
    }
  }, [levelNumber, selectedWorldId, runKey]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect software WebGL from GPU renderer string
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.setAttribute('data-testid', 'bouncy-pop-canvas');
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x7e22ce, 0.009);

    // Studio reflection environment map for glossy toy materials (hardware GPU only)
    if (!isSoftwareGl) {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(
        new RoomEnvironment(),
        0.04
      ).texture;
      pmremGenerator.dispose();
    }

    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 160);

    // Vibrant 3-point arcade studio lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xf472b6, 1.15);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.05);
    keyLight.position.set(8, 18, 14);
    keyLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 80;
      const d = 14;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);
    scene.add(keyLight.target);

    const rimLight = new THREE.DirectionalLight(0x00f5d4, 1.0);
    rimLight.position.set(-10, 8, -10);
    scene.add(rimLight);

    // Shared 3D geometries and materials for all 6 platform styles & active obstacles
    const sharedAssets = createSharedPlatformAssets();

    const finishTexture = createFinishCheckeredTexture(renderer);
    const finishMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: finishTexture,
      roughness: 0.25,
      metalness: 0.15,
    });

    // Fluffy white clouds & floating candy stars in the background
    const bgGroup = new THREE.Group();
    scene.add(bgGroup);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.65,
      metalness: 0.05,
    });
    const starDecoMat = new THREE.MeshStandardMaterial({
      color: 0xffe600,
      emissive: 0xff9f1c,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.3,
    });
    const cloudGeo = new THREE.SphereGeometry(1.5, 14, 12);
    const starDecoGeo = new THREE.OctahedronGeometry(0.65, 0);

    for (let i = 0; i < 16; i++) {
      const puff = new THREE.Group();
      const mainOrb = new THREE.Mesh(cloudGeo, cloudMat);
      mainOrb.scale.set(1.7, 0.72, 1.0);
      puff.add(mainOrb);

      const leftOrb = new THREE.Mesh(cloudGeo, cloudMat);
      leftOrb.position.set(-1.3, -0.15, 0.15);
      leftOrb.scale.set(1.1, 0.58, 0.85);
      puff.add(leftOrb);

      const rightOrb = new THREE.Mesh(cloudGeo, cloudMat);
      rightOrb.position.set(1.3, -0.1, 0.1);
      rightOrb.scale.set(1.15, 0.62, 0.85);
      puff.add(rightOrb);

      const angle = (i / 16) * Math.PI * 2 + 0.25;
      const dist = 26 + (i % 3) * 5;
      puff.position.set(
        Math.cos(angle) * dist,
        i * 5.2 - 8,
        Math.sin(angle) * dist - 10
      );
      puff.rotation.y = -angle;
      bgGroup.add(puff);

      if (i % 2 === 0) {
        const star = new THREE.Mesh(starDecoGeo, starDecoMat);
        star.position.set(
          Math.cos(angle + 0.2) * (dist - 3),
          i * 5.2 - 5,
          Math.sin(angle + 0.2) * (dist - 3) - 6
        );
        bgGroup.add(star);
      }
    }

    // Tower root group (rotates around Y when user drags horizontally)
    const towerRoot = new THREE.Group();
    scene.add(towerRoot);

    // Dedicated 3D Character Selection Showcase Stage (Pedestal + Neon Rings + Studio Props)
    const showcaseStage = createShowcaseStage();
    showcaseStage.group.position.set(0, SHOWCASE_STAGE_Y, 0);
    showcaseStage.group.visible = false;
    scene.add(showcaseStage.group);

    let pillarMesh: THREE.Mesh | null = null;
    let pillarTexture: THREE.CanvasTexture | null = null;
    let builtRings: BuiltRingGroup[] = [];

    // Monster character rig (used both in gameplay and in the 3D Character Selection Showcase!)
    const monsterRig = createMonsterCharacter(skinRef.current);
    monsterRig.root.position.set(0, 10, TOWER_CONSTANTS.MONSTER_Z);
    scene.add(monsterRig.root);

    // Contact shadow disc directly beneath the monster
    const shadowDiscGeo = new THREE.CircleGeometry(0.56, 24);
    shadowDiscGeo.rotateX(-Math.PI / 2);
    const shadowDiscMat = new THREE.MeshBasicMaterial({
      color: 0x1e1b4b,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowDiscGeo, shadowDiscMat);
    scene.add(contactShadow);

    // Bounce splash ring decal on platform impact
    const splashRingGeo = new THREE.RingGeometry(0.25, 0.72, 24);
    splashRingGeo.rotateX(-Math.PI / 2);
    const splashRingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const splashRing = new THREE.Mesh(splashRingGeo, splashRingMat);
    scene.add(splashRing);
    let splashTimer = 0;

    // Zero-GC pooled particle system
    const particles = new PooledParticleSystem(120);
    scene.add(particles.mesh);

    let showcaseYaw = 0;
    let showcaseAngularVel = 0;
    let showcaseTransitionTimer = 0;

    const renderShowcaseImmediate = (skinToRender: MonsterSkin) => {
      towerRoot.visible = false;
      splashRing.visible = false;
      showcaseStage.group.visible = true;
      monsterRig.root.position.set(0, SHOWCASE_STAGE_Y + 0.68, 0);
      monsterRig.root.rotation.set(0, showcaseYaw, 0);
      monsterRig.root.scale.setScalar(1.36);
      monsterRig.feverHalo.visible = false;
      monsterRig.boostTrailGroup.visible = false;
      monsterRig.spiralEffectGroup.visible = false;
      monsterRig.primaryMat.emissive.setHex(0x000000);
      monsterRig.primaryMat.emissiveIntensity = 0;
      updateMonsterShowcaseAnimation(
        monsterRig,
        skinToRender,
        totalElapsed,
        showcaseTransitionTimer
      );
      showcaseStage.pedestalSpinGroup.rotation.y = showcaseYaw;
      contactShadow.position.set(0, SHOWCASE_STAGE_Y + 0.068, 0);
      contactShadow.scale.setScalar(1.3);
      shadowDiscMat.opacity = 0.38;
      const isPortrait = camera.aspect < 0.85;
      if (isPortrait) {
        camera.position.set(0, SHOWCASE_STAGE_Y + 0.55, 6.2);
        camera.lookAt(0, SHOWCASE_STAGE_Y - 0.55, 0);
      } else {
        camera.position.set(0, SHOWCASE_STAGE_Y + 0.55, 5.8);
        camera.lookAt(0, SHOWCASE_STAGE_Y - 0.25, 0);
      }
      keyLight.position.set(6, SHOWCASE_STAGE_Y + 8, 10);
      keyLight.target.position.set(0, SHOWCASE_STAGE_Y + 0.5, 0);
      renderer.render(scene, camera);
    };

    applySkinFnRef.current = (
      newSkin: MonsterSkin,
      triggerShowcaseBurst?: boolean
    ) => {
      applyMonsterSkin(monsterRig, newSkin);
      if (triggerShowcaseBurst) {
        showcaseTransitionTimer = 0.28;
        particles.spawnBurst(
          0,
          SHOWCASE_STAGE_Y + 0.75,
          0,
          newSkin.primaryColor,
          16,
          1.15,
          0.92,
          true
        );
        renderShowcaseImmediate(newSkin);
      }
    };

    resetShowcaseAngleFnRef.current = () => {
      showcaseYaw = 0;
      showcaseAngularVel = 0;
      showcaseTransitionTimer = 0.24;
      if (showcaseActiveRef.current) {
        renderShowcaseImmediate(showcaseSkinRef.current);
      }
    };

    const initialAspect =
      (container.clientWidth || window.innerWidth) /
      Math.max(1, container.clientHeight || window.innerHeight);
    let cameraFraming: GameplayCameraFraming =
      computeGameplayCameraFraming(initialAspect);

    let currentLevel: TowerLevel = generateTowerLevel(
      levelNumberRef.current,
      selectedWorldIdRef.current
    );
    let physState: PhysicsState = createInitialPhysicsState(currentLevel);
    let cameraMinTargetY =
      physState.monsterY + cameraFraming.targetMonsterYOffset;
    let cameraCurrentY = cameraMinTargetY + cameraFraming.camYOffset;
    let cameraTrauma = 0;
    let cameraLandingDip = 0;
    let defeatDelayTimer = 0;
    let calloutFadeTimer = 0;
    let scorePopTimer = 0;
    let lastDisplayedScore = 0;
    let runCompletedDispatched = false;

    const triggerCallout = (text: string) => {
      calloutFadeTimer = 0.92;
      if (hudRefs.calloutEl.current) {
        hudRefs.calloutEl.current.textContent = text;
        hudRefs.calloutEl.current.style.opacity = '1';
        hudRefs.calloutEl.current.style.transform = 'scale(1.22)';
      }
    };

    const syncHudDom = () => {
      const roundedScore = Math.round(physState.score);
      if (hudRefs.scoreEl.current) {
        hudRefs.scoreEl.current.textContent = roundedScore.toLocaleString();
        if (roundedScore > lastDisplayedScore) {
          scorePopTimer = 0.22;
          hudRefs.scoreEl.current.style.transform = 'scale(1.18)';
        }
        lastDisplayedScore = roundedScore;
      }
      if (hudRefs.bestScoreEl.current) {
        const liveBest = Math.max(bestScoreRef.current, roundedScore);
        hudRefs.bestScoreEl.current.textContent = liveBest.toLocaleString();
      }
      if (hudRefs.floorsRemainingEl.current) {
        const floorsLeft = calculateRemainingFloors(
          physState.currentRingIndex,
          currentLevel.totalRings
        );
        hudRefs.floorsRemainingEl.current.textContent = String(floorsLeft);
      }
      if (hudRefs.comboEl.current) {
        if (physState.combo > 1) {
          hudRefs.comboEl.current.textContent = `${physState.combo}x COMBO`;
          hudRefs.comboEl.current.style.opacity = '1';
          hudRefs.comboEl.current.style.transform =
            physState.isFever || physState.isBoosting
              ? 'scale(1.14)'
              : 'scale(1)';
        } else {
          hudRefs.comboEl.current.style.opacity = '0';
        }
      }
      const prog = calculateTowerProgress(
        physState.monsterY,
        currentLevel.topY
      );
      if (hudRefs.progressFillEl.current) {
        hudRefs.progressFillEl.current.style.width = `${prog}%`;
      }
      if (hudRefs.progressTextEl.current) {
        hudRefs.progressTextEl.current.textContent = `${prog}%`;
      }
      const energyPct = Math.round(
        Math.max(0, Math.min(100, physState.boostEnergy))
      );
      if (hudRefs.boostFillEl.current) {
        hudRefs.boostFillEl.current.style.width = `${energyPct}%`;
      }
      const boostReady = canActivateBoost(physState);
      if (hudRefs.boostStatusEl.current) {
        if (physState.isBoosting) {
          hudRefs.boostStatusEl.current.textContent = 'BOOSTING! ⚡';
        } else if (physState.boostCooldown > 0.05) {
          hudRefs.boostStatusEl.current.textContent = `CD ${physState.boostCooldown.toFixed(1)}s`;
        } else if (boostReady) {
          hudRefs.boostStatusEl.current.textContent = `READY ${energyPct}%`;
        } else {
          hudRefs.boostStatusEl.current.textContent = `${energyPct}%`;
        }
      }
      if (hudRefs.boostBtnEl.current) {
        const stateTag = physState.isBoosting
          ? 'active'
          : boostReady
          ? 'ready'
          : 'charging';
        hudRefs.boostBtnEl.current.dataset.boostState = stateTag;
        hudRefs.boostBtnEl.current.disabled =
          !boostReady && !physState.isBoosting;
      }
      if (hudRefs.feverBannerEl.current) {
        if (physState.isBoosting) {
          hudRefs.feverBannerEl.current.textContent = 'TURBO BOOST! ⚡';
          hudRefs.feverBannerEl.current.style.opacity = '1';
        } else if (physState.isFever) {
          hudRefs.feverBannerEl.current.textContent = 'ABSOLUTE DROP! ★';
          hudRefs.feverBannerEl.current.style.opacity = '1';
        } else {
          hudRefs.feverBannerEl.current.style.opacity = '0';
        }
      }
    };

    const handleTriggerBoost = () => {
      if (gameStateRef.current !== 'playing') return;
      soundManager.unlockAudio();
      if (activateBoost(physState)) {
        soundManager.playBoost();
        triggerCallout('TURBO BOOST!');
        cameraTrauma = Math.min(1, cameraTrauma + 0.55);
        particles.spawnBurst(
          0,
          physState.monsterY,
          TOWER_CONSTANTS.MONSTER_Z,
          0x00f5d4,
          24,
          1.45,
          1.15,
          true
        );
        syncHudDom();
      }
    };
    triggerBoostRef.current = handleTriggerBoost;

    const tempWorldPos = new THREE.Vector3();

    /**
     * Updates the Three.js `pivotGroup` rotation around the central vertical Y-axis
     * (`pivotGroup.rotation.y = obs.currentAngle`), updates the radial/vertical carrier offset,
     * and synchronizes the obstacle's world-space position from its Three.js world matrix.
     */
    const syncActiveObstacleMeshTransforms = (
      ringData: TowerLevel['rings'][number],
      obstacleMeshes: BuiltActiveObstacleMesh[]
    ) => {
      for (let k = 0; k < ringData.activeObstacles.length; k++) {
        const obs = ringData.activeObstacles[k];
        const meshObj = obstacleMeshes[k];
        if (!meshObj) continue;

        // Position pivotGroup on the central tower axis at ring height and rotate around Y!
        meshObj.pivotGroup.position.set(0, ringData.y, 0);
        meshObj.pivotGroup.rotation.y = obs.currentAngle;

        // Keep obstacleHolder at its orbital radius & height
        meshObj.obstacleHolder.position.set(
          0,
          0.25 + obs.currentYOffset,
          obs.currentRadius
        );

        meshObj.spinTarget.rotation.z = obs.selfRotation;
        meshObj.spinTarget.rotation.x = obs.selfRotation * 0.45;
        meshObj.trailGroup.scale.x = obs.direction;

        if (meshObj.clusterTarget) {
          meshObj.clusterTarget.rotation.y = obs.groupSpinAngle;
        }

        // Update Three.js world matrix and synchronize exact world-space position
        meshObj.pivotGroup.updateMatrixWorld(true);
        meshObj.obstacleHolder.getWorldPosition(tempWorldPos);
        obs.worldX = tempWorldPos.x;
        obs.worldY = tempWorldPos.y;
        obs.worldZ = tempWorldPos.z;
      }
    };

    const ringMaterialPool = new Map<number, THREE.MeshStandardMaterial>();
    const getPooledRingMaterial = (colorHex: number, roughness = 0.22) => {
      const key = colorHex * 100 + Math.round(roughness * 100);
      let mat = ringMaterialPool.get(key);
      if (!mat) {
        mat = new THREE.MeshStandardMaterial({
          color: colorHex,
          roughness,
          metalness: 0.1,
        });
        ringMaterialPool.set(key, mat);
      }
      return mat;
    };

    const buildTowerScene = (
      lvlNum: number,
      worldOverride: WorldId | null,
      preserveScore = 0
    ) => {
      for (const br of builtRings) {
        towerRoot.remove(br.group);
        for (const obsMesh of br.activeObstacleMeshes) {
          towerRoot.remove(obsMesh.pivotGroup);
        }
      }
      builtRings = [];

      if (pillarMesh) {
        towerRoot.remove(pillarMesh);
        pillarMesh.geometry.dispose();
        (pillarMesh.material as THREE.Material).dispose();
        pillarMesh = null;
      }
      if (pillarTexture) {
        pillarTexture.dispose();
        pillarTexture = null;
      }

      currentLevel = generateTowerLevel(lvlNum, worldOverride);
      physState = createInitialPhysicsState(currentLevel);
      physState.score = preserveScore;
      lastDisplayedScore = Math.round(preserveScore);
      scorePopTimer = 0;
      cameraMinTargetY =
        physState.monsterY + cameraFraming.targetMonsterYOffset;
      cameraCurrentY = cameraMinTargetY + cameraFraming.camYOffset;
      cameraTrauma = 0;
      cameraLandingDip = 0;
      defeatDelayTimer = 0;
      calloutFadeTimer = 0;
      runCompletedDispatched = false;

      if (hudRefs.calloutEl.current) {
        hudRefs.calloutEl.current.style.opacity = '0';
      }

      if (bgGradientRef.current) {
        bgGradientRef.current.style.background = `linear-gradient(180deg, ${currentLevel.palette.skyTopHex} 0%, ${currentLevel.palette.skyMidHex} 52%, ${currentLevel.palette.skyBottomHex} 100%)`;
      }
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.setHex(currentLevel.world.fogHex);
      }
      hemiLight.groundColor.setHex(currentLevel.world.ambientHex);

      // Build central fluted candy/toy column (extended upward for the wider Helix Jump camera view)
      const towerHeight = currentLevel.topY + 48;
      const pillarGeo = new THREE.CylinderGeometry(
        TOWER_CONSTANTS.INNER_RADIUS - 0.04,
        TOWER_CONSTANTS.INNER_RADIUS - 0.04,
        towerHeight,
        28,
        1
      );
      pillarTexture = createPillarTexture(
        renderer,
        currentLevel.palette.pillarHex,
        currentLevel.palette.pillarStripeHex
      );
      pillarTexture.repeat.set(
        2,
        Math.max(14, Math.round((currentLevel.totalRings + 6) * 0.85))
      );
      const pillarMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: pillarTexture,
        roughness: 0.35,
        metalness: 0.12,
      });
      pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
      pillarMesh.position.set(0, currentLevel.topY / 2 + 6, 0);
      pillarMesh.receiveShadow = !isSoftwareGl;
      towerRoot.add(pillarMesh);

      const sliceArc = (Math.PI * 2) / currentLevel.slicesPerRing;
      const midR =
        (TOWER_CONSTANTS.INNER_RADIUS + TOWER_CONSTANTS.OUTER_RADIUS) * 0.5;

      for (const ring of currentLevel.rings) {
        const ringGroup = new THREE.Group();
        ringGroup.position.set(0, ring.y, 0);
        ringGroup.rotation.y = ring.rotationOffset;

        const sliceHolders = new Map<number, THREE.Group>();
        const gemMeshes = new Map<number, THREE.Mesh>();
        const boostOrbMeshes = new Map<number, THREE.Group>();
        const activeObstacleMeshes: BuiltActiveObstacleMesh[] = [];

        const primaryMat = getPooledRingMaterial(ring.themeColor, 0.22);
        const secondaryMat = getPooledRingMaterial(ring.secondaryColor, 0.24);

        for (const slice of ring.slices) {
          const sliceHolder = new THREE.Group();
          sliceHolder.rotation.y =
            (slice.index + 1) * sliceArc - Math.PI / 2;
          const midA = sliceArc * 0.5;

          if (slice.type === 'gap') {
            let addedGapItem = false;
            if (slice.hasGem) {
              const gem = new THREE.Mesh(
                sharedAssets.gemGeo,
                sharedAssets.materials.gemCyan
              );
              gem.position.set(
                Math.cos(midA) * midR,
                0.55,
                Math.sin(midA) * midR
              );
              sliceHolder.add(gem);
              gemMeshes.set(slice.index, gem);
              addedGapItem = true;
            }
            if (slice.hasBoostOrb) {
              const orb = createBoostOrbMesh(sharedAssets);
              orb.position.set(
                Math.cos(midA) * midR,
                0.58,
                Math.sin(midA) * midR
              );
              sliceHolder.add(orb);
              boostOrbMeshes.set(slice.index, orb);
              addedGapItem = true;
            }
            if (addedGapItem) {
              ringGroup.add(sliceHolder);
            }
            continue;
          }

          populateSliceMeshGroup(
            sliceHolder,
            slice.type,
            ring.style,
            slice.index,
            ring.ringIndex,
            primaryMat,
            secondaryMat,
            finishMat,
            sharedAssets,
            !isSoftwareGl
          );

          if (slice.hasBoostOrb) {
            const orb = createBoostOrbMesh(sharedAssets);
            orb.position.set(
              Math.cos(midA) * midR,
              0.68,
              Math.sin(midA) * midR
            );
            sliceHolder.add(orb);
            boostOrbMeshes.set(slice.index, orb);
          }

          ringGroup.add(sliceHolder);
          sliceHolders.set(slice.index, sliceHolder);
        }

        // Attach 360° Orbital Circular Obstacles via their central `pivotGroup` directly to `towerRoot`!
        for (const obs of ring.activeObstacles) {
          const builtObs = createActiveRoundObstacleMesh(
            obs,
            ring.y,
            sharedAssets
          );
          towerRoot.add(builtObs.pivotGroup);
          activeObstacleMeshes.push(builtObs);
        }
        towerRoot.updateMatrixWorld(true);
        syncActiveObstacleMeshTransforms(ring, activeObstacleMeshes);

        // Attach 3D Rotating Candy Bar or Rotating Blade obstacle if present on this ring
        let rotatingObstacleGroup: THREE.Group | null = null;
        if (ring.obstacleType !== 'none') {
          rotatingObstacleGroup = createRingRotatingObstacle(
            ring.obstacleType,
            sharedAssets
          );
          rotatingObstacleGroup.rotation.y = ring.obstacleAngle;
          ringGroup.add(rotatingObstacleGroup);
        }

        towerRoot.add(ringGroup);
        builtRings.push({
          group: ringGroup,
          sliceHolders,
          gemMeshes,
          boostOrbMeshes,
          activeObstacleMeshes,
          rotatingObstacleGroup,
          primaryMat,
          secondaryMat,
          fadeOutProgress: 0,
          isFading: false,
        });
      }

      towerRoot.rotation.y = physState.towerRotation;
      monsterRig.root.position.set(
        0,
        physState.monsterY,
        TOWER_CONSTANTS.MONSTER_Z
      );
      syncHudDom();
    };

    rebuildTowerRef.current = buildTowerScene;
    buildTowerScene(levelNumberRef.current, selectedWorldIdRef.current, 0);

    (window as unknown as Record<string, unknown>).__BOUNCY_POP_DEBUG__ = {
      getPhysicsState: () => physState,
      getLevelData: () => currentLevel,
      getMonsterRig: () => monsterRig,
      getCamera: () => camera,
      getCameraFraming: () => cameraFraming,
    };

    let currentBoostFovOffset = 0;

    // Responsive Helix Jump-style camera sizing tuned separately for mobile portrait (9:16) and desktop
    const updateSize = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      const aspect = width / Math.max(1, height);

      cameraFraming = computeGameplayCameraFraming(aspect);
      camera.fov = cameraFraming.baseFov + currentBoostFovOffset;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    updateSize();
    const resizeObserver = new ResizeObserver(() => updateSize());
    resizeObserver.observe(container);
    window.addEventListener('resize', updateSize);

    // Touch & Pointer horizontal drag controls (for both Tower Spin and 3D Character Showcase Spin!)
    let isDragging = false;
    let lastPointerX = 0;
    const keysHeld = new Set<string>();

    const getRotationSensitivity = () => {
      const width = container.clientWidth || window.innerWidth;
      return (Math.PI * 1.48) / Math.max(280, Math.min(520, width));
    };

    const handlePointerDown = (e: PointerEvent) => {
      soundManager.unlockAudio();
      isDragging = true;
      lastPointerX = e.clientX;
      if (showcaseActiveRef.current) {
        showcaseAngularVel = 0;
      } else {
        physState.towerAngularVelocity = 0;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastPointerX;
      lastPointerX = e.clientX;

      if (showcaseActiveRef.current) {
        // Dragging horizontally rotates the showcased 3D monster & pedestal!
        const deltaYaw = dx * getRotationSensitivity() * 1.35;
        showcaseYaw += deltaYaw;
        showcaseAngularVel = deltaYaw * 35;
        return;
      }

      const st = gameStateRef.current;
      if (st !== 'playing' && st !== 'title') return;

      if (Math.abs(dx) > 0.5 && st === 'playing') {
        onTutorialDismissRef.current();
      }

      const deltaRot = dx * getRotationSensitivity();
      physState.towerRotation += deltaRot;
      physState.towerAngularVelocity = deltaRot * 45;
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const preventTouchScroll = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      } else if (
        gameStateRef.current === 'playing' ||
        showcaseActiveRef.current
      ) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      keysHeld.add(e.code);
      if (
        (e.code === 'ArrowLeft' ||
          e.code === 'ArrowRight' ||
          e.code === 'KeyA' ||
          e.code === 'KeyD') &&
        gameStateRef.current === 'playing'
      ) {
        onTutorialDismissRef.current();
      }
      if (
        (e.code === 'ShiftLeft' ||
          e.code === 'ShiftRight' ||
          e.code === 'KeyB') &&
        gameStateRef.current === 'playing'
      ) {
        e.preventDefault();
        handleTriggerBoost();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysHeld.delete(e.code);
    };

    const clearInputs = () => {
      isDragging = false;
      keysHeld.clear();
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    domElem.addEventListener('touchstart', preventTouchScroll, {
      passive: false,
    });
    domElem.addEventListener('touchmove', preventTouchScroll, {
      passive: false,
    });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearInputs);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let isUnmounted = false;
    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (isUnmounted) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 20);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 20);
      }
    }

    let lastTime = performance.now();
    let totalElapsed = 0;
    let prevActiveState: GameState = gameStateRef.current;
    let appliedSkinId = skinRef.current.id;

    function tick() {
      if (isUnmounted) return;
      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0.001), isSoftwareGl ? 0.24 : 0.05);
      totalElapsed += dt;

      const isShowcase = showcaseActiveRef.current;
      const activeState = gameStateRef.current;
      const targetSkin = isShowcase ? showcaseSkinRef.current : skinRef.current;
      if (targetSkin.id !== appliedSkinId) {
        appliedSkinId = targetSkin.id;
        applyMonsterSkin(monsterRig, targetSkin);
      }

      if (isShowcase) {
        // ===================================================================
        // 3D CHARACTER SELECTION SHOWCASE STAGE MODE
        // ===================================================================
        towerRoot.visible = false;
        splashRing.visible = false;
        showcaseStage.group.visible = true;

        if (!isDragging) {
          if (keysHeld.has('ArrowLeft') || keysHeld.has('KeyA')) {
            showcaseYaw -= 2.4 * dt;
          } else if (keysHeld.has('ArrowRight') || keysHeld.has('KeyD')) {
            showcaseYaw += 2.4 * dt;
          } else {
            showcaseYaw += showcaseAngularVel * dt;
            showcaseAngularVel *= Math.exp(-8 * dt);
          }
        }

        if (showcaseTransitionTimer > 0) {
          showcaseTransitionTimer = Math.max(0, showcaseTransitionTimer - dt);
        }

        // Position large 3D monster prominently on the circular display pedestal
        monsterRig.root.position.set(0, SHOWCASE_STAGE_Y + 0.68, 0);
        monsterRig.root.rotation.set(0, showcaseYaw, 0);
        monsterRig.root.scale.setScalar(1.36);
        monsterRig.feverHalo.visible = false;
        monsterRig.boostTrailGroup.visible = false;
        monsterRig.spiralEffectGroup.visible = false;
        monsterRig.primaryMat.emissive.setHex(0x000000);
        monsterRig.primaryMat.emissiveIntensity = 0;

        updateMonsterShowcaseAnimation(
          monsterRig,
          showcaseSkinRef.current,
          totalElapsed,
          showcaseTransitionTimer
        );

        showcaseStage.pedestalSpinGroup.rotation.y = showcaseYaw;
        const ringPulse = 1 + Math.sin(totalElapsed * 4.5) * 0.03;
        showcaseStage.neonRingOuter.scale.setScalar(ringPulse);
        showcaseStage.neonRingInner.scale.setScalar(2 - ringPulse);

        // Animate floating 3D stars & orbs behind the character
        showcaseStage.floatingProps.forEach((prop, idx) => {
          prop.rotation.y = totalElapsed * 1.8 + idx;
          prop.rotation.x = totalElapsed * 1.1 + idx;
          prop.position.y +=
            Math.sin(totalElapsed * 3.0 + idx * 1.2) * 0.0025;
        });

        contactShadow.position.set(0, SHOWCASE_STAGE_Y + 0.068, 0);
        contactShadow.scale.setScalar(1.3);
        shadowDiscMat.opacity = 0.38;

        particles.update(dt);

        // Frame camera so the 3D monster & pedestal sit prominently in the upper-center showcase window
        const isPortrait = camera.aspect < 0.85;
        const showcaseFov = isPortrait ? 52 : 46;
        if (Math.abs(camera.fov - showcaseFov) > 0.05) {
          camera.fov = showcaseFov;
          camera.updateProjectionMatrix();
        }
        if (isPortrait) {
          camera.position.set(0, SHOWCASE_STAGE_Y + 0.55, 6.2);
          camera.lookAt(0, SHOWCASE_STAGE_Y - 0.55, 0);
        } else {
          camera.position.set(0, SHOWCASE_STAGE_Y + 0.55, 5.8);
          camera.lookAt(0, SHOWCASE_STAGE_Y - 0.25, 0);
        }

        keyLight.position.set(6, SHOWCASE_STAGE_Y + 8, 10);
        keyLight.target.position.set(0, SHOWCASE_STAGE_Y + 0.5, 0);

        renderer.render(scene, camera);
        if (isSoftwareGl) {
          afterDraw(tick);
        } else {
          frameId = requestAnimationFrame(tick);
        }
        return;
      }

      // =====================================================================
      // STANDARD SPIRAL TOWER GAMEPLAY & TITLE MODE
      // =====================================================================
      towerRoot.visible = true;
      splashRing.visible = true;
      showcaseStage.group.visible = false;
      monsterRig.root.rotation.set(0, 0, 0);
      monsterRig.root.scale.setScalar(1.0);
      monsterRig.bodyGroup.position.set(0, 0, 0);
      monsterRig.bodyGroup.rotation.set(0, 0, 0);
      monsterRig.leftEyeGroup.scale.setScalar(1);
      monsterRig.rightEyeGroup.scale.setScalar(1);
      if (monsterRig.thirdEyeGroup.visible) {
        monsterRig.thirdEyeGroup.scale.setScalar(0.82);
      }
      contactShadow.scale.setScalar(1.0);

      if (prevActiveState === 'title' && activeState === 'playing') {
        physState.towerRotation = 0;
        physState.towerAngularVelocity = 0;
      }
      prevActiveState = activeState;

      if (activeState === 'playing' || activeState === 'title') {
        const keyTurnSpeed = 3.2;
        if (keysHeld.has('ArrowLeft') || keysHeld.has('KeyA')) {
          physState.towerRotation -= keyTurnSpeed * dt;
          physState.towerAngularVelocity = -keyTurnSpeed;
        } else if (keysHeld.has('ArrowRight') || keysHeld.has('KeyD')) {
          physState.towerRotation += keyTurnSpeed * dt;
          physState.towerAngularVelocity = keyTurnSpeed;
        } else if (!isDragging) {
          physState.towerRotation += physState.towerAngularVelocity * dt;
          physState.towerAngularVelocity *= Math.exp(-10 * dt);
        }
      }

      if (activeState === 'title') {
        if (!isDragging && keysHeld.size === 0) {
          physState.towerRotation += 0.38 * dt;
        }
        const savedRot = physState.towerRotation;
        physState.towerRotation = 0;
        const events = stepGamePhysics(physState, currentLevel, dt);
        physState.towerRotation = savedRot;
        if (events.bounced) {
          splashRing.position.set(
            0,
            currentLevel.topY + 0.27,
            TOWER_CONSTANTS.MONSTER_Z
          );
          splashTimer = 0.22;
          particles.spawnBurst(
            0,
            currentLevel.topY + 0.3,
            TOWER_CONSTANTS.MONSTER_Z,
            skinRef.current.primaryColor,
            5,
            0.7,
            0.65,
            true
          );
        }
      } else if (activeState === 'playing') {
        const events = stepGamePhysics(physState, currentLevel, dt);

        if (events.calloutText) {
          triggerCallout(events.calloutText);
        }

        if (events.bounced) {
          const ringY =
            currentLevel.rings[
              Math.min(
                currentLevel.rings.length - 1,
                physState.currentRingIndex
              )
            ].y;
          splashRing.position.set(0, ringY + 0.27, TOWER_CONSTANTS.MONSTER_Z);
          splashRingMat.color.setHex(skinRef.current.primaryColor);
          splashTimer = 0.28;

          if (events.landingImpactFloors >= 1) {
            soundManager.playLandingImpact(
              events.landingImpactFloors,
              physState.combo
            );
            cameraLandingDip = Math.min(
              0.28,
              0.12 + events.landingImpactFloors * 0.04
            );
            particles.spawnBurst(
              0,
              ringY + 0.3,
              TOWER_CONSTANTS.MONSTER_Z,
              skinRef.current.primaryColor,
              10 + Math.min(18, events.landingImpactFloors * 4),
              1.05,
              0.88,
              true
            );
          } else {
            soundManager.playBounce(physState.combo);
            cameraLandingDip = 0.1;
            particles.spawnBurst(
              0,
              ringY + 0.3,
              TOWER_CONSTANTS.MONSTER_Z,
              skinRef.current.primaryColor,
              7,
              0.8,
              0.72,
              true
            );
          }
        }

        if (events.brokeSlice) {
          const br = builtRings[events.brokeSlice.ringIndex];
          const holder = br?.sliceHolders.get(events.brokeSlice.sliceIndex);
          if (holder) {
            holder.visible = false;
          }
          cameraTrauma = Math.min(1, cameraTrauma + 0.28);
          particles.spawnBurst(
            0,
            physState.monsterY - 0.2,
            TOWER_CONSTANTS.MONSTER_Z,
            0xd97706,
            16,
            1.2,
            0.95,
            false
          );
        }

        if (events.springBounced) {
          soundManager.playSpringBounce();
          cameraTrauma = Math.min(1, cameraTrauma + 0.38);
          particles.spawnBurst(
            0,
            physState.monsterY - 0.3,
            TOWER_CONSTANTS.MONSTER_Z,
            0xffe600,
            16,
            1.2,
            0.95,
            true
          );
        }

        if (events.gemsCollected > 0) {
          soundManager.playGemPickup();
          particles.spawnBurst(
            0,
            physState.monsterY,
            TOWER_CONSTANTS.MONSTER_Z,
            0x00f5d4,
            12,
            1.05,
            0.85,
            true
          );
        }

        if (events.boostOrbsCollected > 0) {
          soundManager.playBoostOrbPickup();
          particles.spawnBurst(
            0,
            physState.monsterY,
            TOWER_CONSTANTS.MONSTER_Z,
            0xffe600,
            16,
            1.25,
            1.0,
            true
          );
        }

        if (
          (physState.isBoosting || physState.ringsPassedInFall >= 1) &&
          Math.random() < (physState.isFever || physState.isBoosting ? 0.85 : 0.45)
        ) {
          const spiralParticleAngle = totalElapsed * 14;
          const spX = Math.cos(spiralParticleAngle) * 0.55;
          const spZ =
            TOWER_CONSTANTS.MONSTER_Z + Math.sin(spiralParticleAngle) * 0.55;
          particles.spawnBurst(
            spX,
            physState.monsterY + 0.25,
            spZ,
            physState.isFever ? 0xffe600 : 0x00f5d4,
            physState.isFever || physState.isBoosting ? 2 : 1,
            0.55,
            0.72,
            true
          );
        }

        if (events.ringsPassed.length > 0) {
          soundManager.playRingPass(physState.ringsPassedInFall);
          for (const rIdx of events.ringsPassed) {
            const br = builtRings[rIdx];
            if (br && !br.isFading) {
              br.isFading = true;
              particles.spawnBurst(
                0,
                currentLevel.rings[rIdx].y + 0.2,
                TOWER_CONSTANTS.MONSTER_Z,
                currentLevel.rings[rIdx].themeColor,
                14,
                1.2,
                0.98,
                true
              );
            }
          }
        }

        if (events.ringsShattered.length > 0) {
          soundManager.playSmash();
          cameraTrauma = Math.min(1, cameraTrauma + 0.78);
          for (const rIdx of events.ringsShattered) {
            const br = builtRings[rIdx];
            if (br) {
              br.isFading = true;
              for (const obsMesh of br.activeObstacleMeshes) {
                obsMesh.pivotGroup.visible = false;
              }
              particles.spawnBurst(
                0,
                currentLevel.rings[rIdx].y + 0.2,
                TOWER_CONSTANTS.MONSTER_Z,
                0xff3b9a,
                30,
                1.65,
                1.25,
                true
              );
            }
          }
        }

        if (events.hitHazard) {
          soundManager.playHazardHit();
          cameraTrauma = Math.min(1, cameraTrauma + 0.85);
          defeatDelayTimer = 0.45;
          particles.spawnBurst(
            0,
            physState.monsterY,
            TOWER_CONSTANTS.MONSTER_Z,
            0xff2a55,
            24,
            1.35,
            1.1,
            false
          );
        }

        if (events.reachedFinish && !runCompletedDispatched) {
          runCompletedDispatched = true;
          soundManager.playVictory();
          cumulativeScoreRef.current = physState.score;
          particles.spawnBurst(
            0,
            physState.monsterY,
            TOWER_CONSTANTS.MONSTER_Z,
            0xffe600,
            36,
            1.7,
            1.25,
            true
          );
          const newBest = Math.max(
            bestScoreRef.current,
            Math.round(physState.score)
          );
          onRunCompleteRef.current({
            outcome: 'victory',
            level: currentLevel.level,
            score: Math.round(physState.score),
            bestScore: newBest,
            progress: 100,
            maxCombo: physState.maxCombo,
            gemsCollected: physState.gems,
          });
        }

        if (physState.outcome === 'defeat' && !runCompletedDispatched) {
          defeatDelayTimer -= dt;
          if (defeatDelayTimer <= 0) {
            runCompletedDispatched = true;
            cumulativeScoreRef.current = 0;
            const prog = calculateTowerProgress(
              physState.monsterY,
              currentLevel.topY
            );
            const newBest = Math.max(
              bestScoreRef.current,
              Math.round(physState.score)
            );
            onRunCompleteRef.current({
              outcome: 'defeat',
              level: currentLevel.level,
              score: Math.round(physState.score),
              bestScore: newBest,
              progress: prog,
              maxCombo: physState.maxCombo,
              gemsCollected: physState.gems,
            });
          }
        }

        syncHudDom();
      }

      if (calloutFadeTimer > 0) {
        calloutFadeTimer = Math.max(0, calloutFadeTimer - dt);
        if (hudRefs.calloutEl.current) {
          const ratio = calloutFadeTimer / 0.92;
          hudRefs.calloutEl.current.style.opacity = String(
            Math.min(1, ratio * 1.65)
          );
          hudRefs.calloutEl.current.style.transform = `scale(${
            0.94 + ratio * 0.28
          }) translateY(${(1 - ratio) * -14}px)`;
        }
      }

      if (scorePopTimer > 0) {
        scorePopTimer = Math.max(0, scorePopTimer - dt);
        if (hudRefs.scoreEl.current) {
          const p = scorePopTimer / 0.22;
          hudRefs.scoreEl.current.style.transform = `scale(${1 + p * 0.18})`;
        }
      }

      // Update visual transforms of tower, static rings, static obstacles, gems, boost orbs, monster, spiral trail, shadow, and particles
      bgGroup.rotation.y = totalElapsed * 0.12;
      bgGroup.position.y = cameraCurrentY - 36;
      towerRoot.rotation.y = physState.towerRotation;
      towerRoot.updateMatrixWorld(false);

      for (let i = 0; i < builtRings.length; i++) {
        const br = builtRings[i];
        const ringData = currentLevel.rings[i];

        if (ringData.activeObstacles.length > 0) {
          syncActiveObstacleMeshTransforms(
            ringData,
            br.activeObstacleMeshes
          );
        }

        br.gemMeshes.forEach((gemMesh, sliceIdx) => {
          const slice = ringData.slices[sliceIdx];
          if (slice && slice.gemCollected) {
            gemMesh.visible = false;
          } else {
            gemMesh.rotation.y = totalElapsed * 3.2;
            gemMesh.position.y =
              0.55 + Math.sin(totalElapsed * 4 + sliceIdx) * 0.1;
          }
        });

        br.boostOrbMeshes.forEach((orbGroup, sliceIdx) => {
          const slice = ringData.slices[sliceIdx];
          if (slice && slice.boostOrbCollected) {
            orbGroup.visible = false;
          } else {
            orbGroup.rotation.y = totalElapsed * 4.5 + sliceIdx;
            orbGroup.rotation.z = Math.sin(totalElapsed * 3.5 + sliceIdx) * 0.35;
            const baseOrbY = slice?.type === 'gap' ? 0.58 : 0.68;
            orbGroup.position.y =
              baseOrbY + Math.sin(totalElapsed * 5 + sliceIdx) * 0.12;
          }
        });

        if (br.isFading && br.group.visible) {
          br.fadeOutProgress += dt * 4.2;
          const s = 1 + br.fadeOutProgress * 0.45;
          br.group.scale.set(s, Math.max(0.01, 1 - br.fadeOutProgress), s);
          br.group.position.y = ringData.y - br.fadeOutProgress * 1.2;
          if (br.fadeOutProgress >= 1) {
            br.group.visible = false;
          }
        }
      }

      monsterRig.root.position.set(
        0,
        physState.monsterY,
        TOWER_CONSTANTS.MONSTER_Z
      );
      monsterRig.bodyGroup.scale.set(
        physState.scaleX,
        physState.scaleY,
        physState.scaleZ
      );
      const flapAngle = THREE.MathUtils.clamp(
        physState.monsterVy * 0.04,
        -0.5,
        0.6
      );
      monsterRig.leftArm.rotation.z = 0.65 + flapAngle;
      monsterRig.rightArm.rotation.z = -0.65 - flapAngle;
      monsterRig.leftEar.rotation.z = 0.42 - flapAngle * 0.4;
      monsterRig.rightEar.rotation.z = -0.42 + flapAngle * 0.4;

      const showHalo = physState.isFever || physState.isBoosting;
      monsterRig.feverHalo.visible = showHalo;
      if (showHalo) {
        monsterRig.feverHalo.rotation.z = totalElapsed * 9;
        const pulse = 1 + Math.sin(totalElapsed * 18) * 0.14;
        monsterRig.feverHalo.scale.setScalar(pulse);
      }

      monsterRig.boostTrailGroup.visible = physState.isBoosting;
      if (physState.isBoosting) {
        monsterRig.boostTrailGroup.rotation.y = totalElapsed * 14;
        const trailStretch = 1 + Math.sin(totalElapsed * 24) * 0.15;
        monsterRig.boostTrailGroup.scale.set(1, trailStretch, 1);
      }

      // Update 3D Helix Jump-style Curved Spiral Trail & ABSOLUTE DROP Vortex around the monster
      updateMonsterSpiralEffect(
        monsterRig,
        skinRef.current,
        activeState === 'playing' ? physState.ringsPassedInFall : 0,
        activeState === 'playing' ? physState.monsterVy : 0,
        activeState === 'playing' && physState.isFever,
        activeState === 'playing' && physState.isBoosting,
        totalElapsed
      );

      // Subtle, smooth camera FOV response during ABSOLUTE DROP or active Boost (avoids sudden zooming or distortion)
      const targetBoostFov = physState.isBoosting
        ? 2.5
        : physState.isFever
        ? 1.5
        : physState.ringsPassedInFall >= 2
        ? 0.8
        : 0;
      currentBoostFovOffset +=
        (targetBoostFov - currentBoostFovOffset) * Math.min(1, dt * 6);
      const desiredFov = cameraFraming.baseFov + currentBoostFovOffset;
      if (Math.abs(camera.fov - desiredFov) > 0.02) {
        camera.fov = desiredFov;
        camera.updateProjectionMatrix();
      }

      const activeRingIdx = Math.min(
        currentLevel.rings.length - 1,
        physState.currentRingIndex
      );
      const activeRing = currentLevel.rings[activeRingIdx];
      const sliceUnder = getSliceUnderMonster(
        activeRing,
        physState.towerRotation
      );
      if (
        (sliceUnder.type === 'gap' ||
          (sliceUnder.type === 'breakable' && sliceUnder.broken)) &&
        activeRingIdx + 1 < currentLevel.rings.length
      ) {
        const nextRing = currentLevel.rings[activeRingIdx + 1];
        contactShadow.position.set(
          0,
          nextRing.y + 0.265,
          TOWER_CONSTANTS.MONSTER_Z
        );
        shadowDiscMat.opacity = 0.25;
      } else {
        contactShadow.position.set(
          0,
          activeRing.y + 0.265,
          TOWER_CONSTANTS.MONSTER_Z
        );
        const heightAbove = Math.max(0, physState.monsterY - activeRing.y);
        shadowDiscMat.opacity = THREE.MathUtils.clamp(
          0.55 - heightAbove * 0.08,
          0.15,
          0.52
        );
      }

      if (splashTimer > 0) {
        splashTimer = Math.max(0, splashTimer - dt);
        const prog = 1 - splashTimer / 0.28;
        splashRing.scale.setScalar(0.62 + prog * 1.25);
        splashRingMat.opacity = (1 - prog) * 0.6;
      } else {
        splashRingMat.opacity = 0;
      }

      particles.update(dt);

      // Smooth Helix Jump-style camera follow with gentle descent lead & restrained landing dip
      cameraLandingDip = Math.max(0, cameraLandingDip - 1.8 * dt);
      const fallLeadOffset =
        physState.ringsPassedInFall >= 1
          ? -Math.min(0.95, physState.ringsPassedInFall * 0.24)
          : 0;
      cameraMinTargetY = Math.min(
        cameraMinTargetY,
        physState.monsterY +
          cameraFraming.targetMonsterYOffset +
          fallLeadOffset
      );
      const desiredCamY =
        cameraMinTargetY +
        cameraFraming.camYOffset -
        cameraLandingDip * 0.28;
      const camDamp = 1 - Math.exp(-9.0 * dt);
      cameraCurrentY += (desiredCamY - cameraCurrentY) * camDamp;

      cameraTrauma = Math.max(0, cameraTrauma - 2.8 * dt);
      const shakeMag = cameraTrauma * cameraTrauma * 0.14;
      const shakeX = (Math.random() - 0.5) * 2 * shakeMag;
      const shakeY = (Math.random() - 0.5) * 2 * shakeMag;

      camera.position.set(
        shakeX,
        cameraCurrentY + shakeY,
        cameraFraming.camZ
      );
      camera.lookAt(
        0,
        cameraCurrentY + cameraFraming.lookAtYOffset,
        0
      );

      keyLight.position.set(8, cameraCurrentY + 12, 14);
      keyLight.target.position.set(0, cameraCurrentY - 3, 0);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      isUnmounted = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
      domElem.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      domElem.removeEventListener('touchstart', preventTouchScroll);
      domElem.removeEventListener('touchmove', preventTouchScroll);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearInputs);

      particles.dispose();
      showcaseStage.dispose();
      sharedAssets.dispose();
      finishTexture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={bgGradientRef}
      style={{
        background:
          'linear-gradient(180deg, #4c1d95 0%, #9333ea 52%, #f472b6 100%)',
      }}
      className="fixed inset-0 w-full h-full overflow-hidden touch-none select-none z-0"
    >
      <div
        ref={mountRef}
        className="w-full h-full overflow-hidden touch-none select-none"
      />
    </div>
  );
};
