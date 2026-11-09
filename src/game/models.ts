/**
 * Procedural 3D composite models (3-12 part THREE.Group hierarchies),
 * recognizable 3D platform geometries (Waffle, Donut, Marshmallow, Toy Block, Cookie, Star),
 * Three.js Pivot-Group 360° Orbital Circular Obstacles around the central tower axis,
 * 3D Character Selection Showcase Stage & unique per-character idle animations,
 * and multi-color pooled particle systems for BOUNCY POP: Spiral Tower 3D.
 */
import * as THREE from 'three';
import {
  ActiveRoundObstacle,
  MonsterSkin,
  PlatformStyle,
  SliceType,
  TOWER_CONSTANTS,
} from './rules';

export const VIBRANT_CONFETTI_COLORS = [
  0xff3b9a, // Hot pink
  0x00d4ff, // Electric blue
  0xffe600, // Lemon yellow
  0xff7b00, // Bright orange
  0xa855f7, // Purple
  0x10b981, // Mint green
  0x2dd4bf, // Turquoise
  0xff4757, // Coral red
];

/**
 * Generates a vibrant, glossy toy-striped CanvasTexture for the central spiral tower cylinder.
 */
export function createPillarTexture(
  renderer: THREE.WebGLRenderer,
  baseHex: number,
  stripeHex: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const baseColor = new THREE.Color(baseHex);
  const stripeColor = new THREE.Color(stripeHex);

  ctx.fillStyle = `#${baseColor.getHexString()}`;
  ctx.fillRect(0, 0, 256, 256);

  // Diagonal / vertical playful candy-toy ribs
  ctx.fillStyle = `#${stripeColor.getHexString()}`;
  for (let x = 0; x < 256; x += 32) {
    ctx.fillRect(x, 0, 14, 256);
  }

  // Glossy specular highlight bands
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  for (let y = 0; y < 256; y += 64) {
    ctx.fillRect(0, y, 256, 6);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 12);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

/**
 * Generates a colorful festive checkered finish texture for the bottom victory pedestal.
 */
export function createFinishCheckeredTexture(
  renderer: THREE.WebGLRenderer
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const size = 32;
  for (let y = 0; y < 128; y += size) {
    for (let x = 0; x < 128; x += size) {
      const isEven = ((x + y) / size) % 2 === 0;
      ctx.fillStyle = isEven ? '#ffe600' : '#ff3b9a';
      ctx.fillRect(x, y, size, size);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

/**
 * Shared Geometry & Material Cache for the 6 distinct 3D Platform Styles
 * and 360° Orbital Circular Obstacles so we maintain 60 FPS on mobile browsers.
 */
export interface SharedPlatformAssets {
  baseWedgeGeo: THREE.ExtrudeGeometry;
  puffyWedgeGeo: THREE.ExtrudeGeometry;
  starWedgeGeo: THREE.ExtrudeGeometry;
  icingCapGeo: THREE.ExtrudeGeometry;
  waffleRadialBarGeo: THREE.BoxGeometry;
  waffleArcBarGeo: THREE.BoxGeometry;
  butterPatGeo: THREE.BoxGeometry;
  sprinkleGeo: THREE.CylinderGeometry;
  toyStudGeo: THREE.CylinderGeometry;
  chocoChipGeo: THREE.DodecahedronGeometry;
  crackLineGeo: THREE.BoxGeometry;
  starCrystalGeo: THREE.OctahedronGeometry;
  spikeGeo: THREE.ConeGeometry;
  radialSpikeGeo: THREE.ConeGeometry;
  spinningDonutGeo: THREE.TorusGeometry;
  spinningDonutIcingGeo: THREE.TorusGeometry;
  roundOrbGeo: THREE.SphereGeometry;
  roundOrbSmallGeo: THREE.SphereGeometry;
  roundOrbRingGeo: THREE.TorusGeometry;
  orbitTrackGeo: THREE.TorusGeometry;
  motionGhostGeo: THREE.SphereGeometry;
  clusterArmGeo: THREE.CylinderGeometry;
  springCoilGeo: THREE.CylinderGeometry;
  gemGeo: THREE.OctahedronGeometry;
    candyBarGeo: THREE.CylinderGeometry;
    candyStripeGeo: THREE.CylinderGeometry;
    bladeArmGeo: THREE.BoxGeometry;
    bladeHubGeo: THREE.CylinderGeometry;
    boostOrbCoreGeo: THREE.SphereGeometry;
    boostOrbHaloGeo: THREE.TorusGeometry;
    materials: {
      waffleGolden: THREE.MeshStandardMaterial;
      waffleRim: THREE.MeshStandardMaterial;
      butter: THREE.MeshStandardMaterial;
      donutDough: THREE.MeshStandardMaterial;
      cookieDough: THREE.MeshStandardMaterial;
      breakableCookie: THREE.MeshStandardMaterial;
      chocoChip: THREE.MeshStandardMaterial;
      crackDark: THREE.MeshStandardMaterial;
      sprinkleMats: THREE.MeshStandardMaterial[];
      whiteCream: THREE.MeshStandardMaterial;
      hazardBase: THREE.MeshStandardMaterial;
      hazardOrange: THREE.MeshStandardMaterial;
      hazardPurple: THREE.MeshStandardMaterial;
      hazardSpike: THREE.MeshStandardMaterial;
      orbitTrackMat: THREE.MeshBasicMaterial;
      motionTrailPink: THREE.MeshBasicMaterial;
      motionTrailOrange: THREE.MeshBasicMaterial;
      springGold: THREE.MeshStandardMaterial;
      gemCyan: THREE.MeshStandardMaterial;
      boostOrbCore: THREE.MeshStandardMaterial;
      boostOrbHalo: THREE.MeshStandardMaterial;
    };
    dispose: () => void;
  }

export function createSharedPlatformAssets(): SharedPlatformAssets {
  const slices = TOWER_CONSTANTS.SLICE_COUNT;
  const arc = (Math.PI * 2) / slices;
  const gapMargin = 0.024;
  const startAngle = gapMargin;
  const endAngle = arc - gapMargin;
  const innerR = TOWER_CONSTANTS.INNER_RADIUS;
  const outerR = TOWER_CONSTANTS.OUTER_RADIUS;
  const midR = (innerR + outerR) * 0.5;

  // 1. Standard bevelled wedge
  const stdShape = new THREE.Shape();
  stdShape.moveTo(innerR * Math.cos(startAngle), innerR * Math.sin(startAngle));
  stdShape.lineTo(outerR * Math.cos(startAngle), outerR * Math.sin(startAngle));
  stdShape.absarc(0, 0, outerR, startAngle, endAngle, false);
  stdShape.lineTo(innerR * Math.cos(endAngle), innerR * Math.sin(endAngle));
  stdShape.absarc(0, 0, innerR, endAngle, startAngle, true);

  const baseWedgeGeo = new THREE.ExtrudeGeometry(stdShape, {
    steps: 1,
    depth: 0.34,
    bevelEnabled: true,
    bevelThickness: 0.07,
    bevelSize: 0.06,
    bevelSegments: 2,
    curveSegments: 12,
  });
  baseWedgeGeo.rotateX(Math.PI / 2);
  baseWedgeGeo.translate(0, 0.18, 0);
  baseWedgeGeo.computeVertexNormals();

  // 2. Soft Puffy Marshmallow / Donut Wedge
  const puffyWedgeGeo = new THREE.ExtrudeGeometry(stdShape, {
    steps: 1,
    depth: 0.28,
    bevelEnabled: true,
    bevelThickness: 0.13,
    bevelSize: 0.1,
    bevelSegments: 3,
    curveSegments: 12,
  });
  puffyWedgeGeo.rotateX(Math.PI / 2);
  puffyWedgeGeo.translate(0, 0.14, 0);
  puffyWedgeGeo.computeVertexNormals();

  // 3. Star-Point Outer Contour Wedge
  const starShape = new THREE.Shape();
  const midA = (startAngle + endAngle) * 0.5;
  const starTipR = outerR + 0.42;
  const starValleyR = outerR - 0.22;
  starShape.moveTo(innerR * Math.cos(startAngle), innerR * Math.sin(startAngle));
  starShape.lineTo(
    starValleyR * Math.cos(startAngle),
    starValleyR * Math.sin(startAngle)
  );
  starShape.lineTo(starTipR * Math.cos(midA), starTipR * Math.sin(midA));
  starShape.lineTo(
    starValleyR * Math.cos(endAngle),
    starValleyR * Math.sin(endAngle)
  );
  starShape.lineTo(innerR * Math.cos(endAngle), innerR * Math.sin(endAngle));
  starShape.absarc(0, 0, innerR, endAngle, startAngle, true);

  const starWedgeGeo = new THREE.ExtrudeGeometry(starShape, {
    steps: 1,
    depth: 0.32,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.07,
    bevelSegments: 2,
    curveSegments: 8,
  });
  starWedgeGeo.rotateX(Math.PI / 2);
  starWedgeGeo.translate(0, 0.17, 0);
  starWedgeGeo.computeVertexNormals();

  // 4. Donut Frosting / Icing Top Layer
  const icingInR = innerR + 0.15;
  const icingOutR = outerR - 0.12;
  const icingShape = new THREE.Shape();
  icingShape.moveTo(
    icingInR * Math.cos(startAngle + 0.02),
    icingInR * Math.sin(startAngle + 0.02)
  );
  icingShape.lineTo(
    icingOutR * Math.cos(startAngle + 0.02),
    icingOutR * Math.sin(startAngle + 0.02)
  );
  icingShape.absarc(0, 0, icingOutR, startAngle + 0.02, endAngle - 0.02, false);
  icingShape.lineTo(
    icingInR * Math.cos(endAngle - 0.02),
    icingInR * Math.sin(endAngle - 0.02)
  );
  icingShape.absarc(0, 0, icingInR, endAngle - 0.02, startAngle + 0.02, true);

  const icingCapGeo = new THREE.ExtrudeGeometry(icingShape, {
    steps: 1,
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 2,
    curveSegments: 10,
  });
  icingCapGeo.rotateX(Math.PI / 2);
  icingCapGeo.translate(0, 0.27, 0);
  icingCapGeo.computeVertexNormals();

  // 5. 3D Sub-detail geometries
  const radialLen = outerR - innerR - 0.25;
  const waffleRadialBarGeo = new THREE.BoxGeometry(radialLen, 0.07, 0.09);
  const waffleArcBarGeo = new THREE.BoxGeometry(
    0.09,
    0.07,
    midR * (endAngle - startAngle) * 0.86
  );
  const butterPatGeo = new THREE.BoxGeometry(0.42, 0.12, 0.42);
  const sprinkleGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.24, 8);
  sprinkleGeo.rotateZ(Math.PI / 2);
  const toyStudGeo = new THREE.CylinderGeometry(0.24, 0.25, 0.14, 14);
  const chocoChipGeo = new THREE.DodecahedronGeometry(0.14, 1);
  const crackLineGeo = new THREE.BoxGeometry(radialLen * 0.85, 0.06, 0.06);
  const starCrystalGeo = new THREE.OctahedronGeometry(0.18, 0);

  const spikeGeo = new THREE.ConeGeometry(0.17, 0.44, 8);
  spikeGeo.translate(0, 0.22, 0);

  const radialSpikeGeo = new THREE.ConeGeometry(0.11, 0.28, 8);
  radialSpikeGeo.translate(0, 0.14, 0);

  const spinningDonutGeo = new THREE.TorusGeometry(0.36, 0.15, 12, 20);
  const spinningDonutIcingGeo = new THREE.TorusGeometry(0.37, 0.125, 10, 20);

  const roundOrbGeo = new THREE.SphereGeometry(0.36, 18, 16);
  const roundOrbSmallGeo = new THREE.SphereGeometry(0.28, 14, 12);
  const roundOrbRingGeo = new THREE.TorusGeometry(0.42, 0.055, 10, 22);
  roundOrbRingGeo.rotateX(Math.PI / 2);

  // Subtle glowing circular orbital path track ring around the central tower axis
  const orbitTrackGeo = new THREE.TorusGeometry(
    TOWER_CONSTANTS.MONSTER_Z,
    0.022,
    8,
    48
  );
  orbitTrackGeo.rotateX(Math.PI / 2);

  const motionGhostGeo = new THREE.SphereGeometry(0.18, 10, 8);
  const clusterArmGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.06, 10);
  clusterArmGeo.rotateZ(Math.PI / 2);

  const springCoilGeo = new THREE.CylinderGeometry(0.38, 0.42, 0.2, 16);
  springCoilGeo.translate(0, 0.1, 0);

  const gemGeo = new THREE.OctahedronGeometry(0.3, 0);

  // Rotating Candy Bar & Blade Obstacles
  const barLen = outerR - innerR + 0.5;
  const candyBarGeo = new THREE.CylinderGeometry(0.16, 0.16, barLen, 14);
  candyBarGeo.rotateZ(Math.PI / 2);
  const candyStripeGeo = new THREE.CylinderGeometry(0.175, 0.175, 0.28, 14);
  candyStripeGeo.rotateZ(Math.PI / 2);

  const bladeArmGeo = new THREE.BoxGeometry((outerR + 0.2) * 2, 0.14, 0.34);
  const bladeHubGeo = new THREE.CylinderGeometry(
    innerR + 0.22,
    innerR + 0.22,
    0.32,
    18
  );

  const boostOrbCoreGeo = new THREE.SphereGeometry(0.24, 16, 14);
  const boostOrbHaloGeo = new THREE.TorusGeometry(0.36, 0.045, 10, 24);

  // Glossy Toy & Candy PBR Materials
  const materials = {
    waffleGolden: new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.42,
      metalness: 0.08,
    }),
    waffleRim: new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.32,
      metalness: 0.1,
    }),
    butter: new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfacc15,
      emissiveIntensity: 0.18,
      roughness: 0.2,
      metalness: 0.05,
    }),
    donutDough: new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.45,
      metalness: 0.05,
    }),
    cookieDough: new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.52,
      metalness: 0.05,
    }),
    breakableCookie: new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.15,
      roughness: 0.48,
      metalness: 0.05,
    }),
    chocoChip: new THREE.MeshStandardMaterial({
      color: 0x3e1f0d,
      roughness: 0.25,
      metalness: 0.15,
    }),
    crackDark: new THREE.MeshStandardMaterial({
      color: 0x451a03,
      roughness: 0.8,
      metalness: 0,
    }),
    sprinkleMats: VIBRANT_CONFETTI_COLORS.map(
      (hex) =>
        new THREE.MeshStandardMaterial({
          color: hex,
          roughness: 0.18,
          metalness: 0.1,
        })
    ),
    whiteCream: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.08,
    }),
    hazardBase: new THREE.MeshStandardMaterial({
      color: 0xff2a55,
      emissive: 0x9f1239,
      emissiveIntensity: 0.38,
      roughness: 0.2,
      metalness: 0.22,
    }),
    hazardOrange: new THREE.MeshStandardMaterial({
      color: 0xff7b00,
      emissive: 0xc2410c,
      emissiveIntensity: 0.38,
      roughness: 0.2,
      metalness: 0.22,
    }),
    hazardPurple: new THREE.MeshStandardMaterial({
      color: 0xd946ef,
      emissive: 0x86198f,
      emissiveIntensity: 0.42,
      roughness: 0.18,
      metalness: 0.25,
    }),
    hazardSpike: new THREE.MeshStandardMaterial({
      color: 0xffe4e6,
      emissive: 0xff2a55,
      emissiveIntensity: 0.45,
      roughness: 0.16,
      metalness: 0.55,
    }),
    orbitTrackMat: new THREE.MeshBasicMaterial({
      color: 0xff3b9a,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    }),
    motionTrailPink: new THREE.MeshBasicMaterial({
      color: 0xff3b9a,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
    motionTrailOrange: new THREE.MeshBasicMaterial({
      color: 0xff9f1c,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
    springGold: new THREE.MeshStandardMaterial({
      color: 0xffe600,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.45,
      roughness: 0.18,
      metalness: 0.55,
    }),
    gemCyan: new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      emissive: 0x00bbf9,
      emissiveIntensity: 0.65,
      roughness: 0.1,
      metalness: 0.7,
    }),
    boostOrbCore: new THREE.MeshStandardMaterial({
      color: 0xffe600,
      emissive: 0xff3b9a,
      emissiveIntensity: 0.95,
      roughness: 0.12,
      metalness: 0.45,
    }),
    boostOrbHalo: new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.5,
    }),
  };

  return {
    baseWedgeGeo,
    puffyWedgeGeo,
    starWedgeGeo,
    icingCapGeo,
    waffleRadialBarGeo,
    waffleArcBarGeo,
    butterPatGeo,
    sprinkleGeo,
    toyStudGeo,
    chocoChipGeo,
    crackLineGeo,
    starCrystalGeo,
    spikeGeo,
    radialSpikeGeo,
    spinningDonutGeo,
    spinningDonutIcingGeo,
    roundOrbGeo,
    roundOrbSmallGeo,
    roundOrbRingGeo,
    orbitTrackGeo,
    motionGhostGeo,
    clusterArmGeo,
    springCoilGeo,
    gemGeo,
    candyBarGeo,
    candyStripeGeo,
    bladeArmGeo,
    bladeHubGeo,
    boostOrbCoreGeo,
    boostOrbHaloGeo,
    materials,
    dispose: () => {
      baseWedgeGeo.dispose();
      puffyWedgeGeo.dispose();
      starWedgeGeo.dispose();
      icingCapGeo.dispose();
      waffleRadialBarGeo.dispose();
      waffleArcBarGeo.dispose();
      butterPatGeo.dispose();
      sprinkleGeo.dispose();
      toyStudGeo.dispose();
      chocoChipGeo.dispose();
      crackLineGeo.dispose();
      starCrystalGeo.dispose();
      spikeGeo.dispose();
      radialSpikeGeo.dispose();
      spinningDonutGeo.dispose();
      spinningDonutIcingGeo.dispose();
      roundOrbGeo.dispose();
      roundOrbSmallGeo.dispose();
      roundOrbRingGeo.dispose();
      orbitTrackGeo.dispose();
      motionGhostGeo.dispose();
      clusterArmGeo.dispose();
      springCoilGeo.dispose();
      gemGeo.dispose();
      candyBarGeo.dispose();
      candyStripeGeo.dispose();
      bladeArmGeo.dispose();
      bladeHubGeo.dispose();
      boostOrbCoreGeo.dispose();
      boostOrbHaloGeo.dispose();
    },
  };
}

/**
 * Builds a glowing 3D collectible Boost Energy Orb mesh group.
 */
export function createBoostOrbMesh(assets: SharedPlatformAssets): THREE.Group {
  const orbGroup = new THREE.Group();
  const core = new THREE.Mesh(
    assets.boostOrbCoreGeo,
    assets.materials.boostOrbCore
  );
  const halo1 = new THREE.Mesh(
    assets.boostOrbHaloGeo,
    assets.materials.boostOrbHalo
  );
  halo1.rotation.x = Math.PI / 3;
  const halo2 = new THREE.Mesh(
    assets.boostOrbHaloGeo,
    assets.materials.springGold
  );
  halo2.rotation.y = Math.PI / 3;
  orbGroup.add(core, halo1, halo2);
  return orbGroup;
}

/**
 * Builds a single 3D platform slice with recognizable 3D surface geometry:
 * - 'waffle': Golden waffle wedge + 3D raised grid bars + melting butter pat
 * - 'donut': Rounded dough base + glossy colorful icing cap + 3D candy sprinkles
 * - 'marshmallow': Puffy dual-tone marshmallow cushion
 * - 'toyblock': Vibrant glossy plastic brick + 4 raised 3D cylindrical LEGO studs
 * - 'cookie': Golden cookie wedge + 3D chocolate chips
 * - 'star': Star-tipped 3D wedge + glowing star crystal
 * Plus 'breakable' (cracked cookie wafer), 'hazard' (red/orange spikes), and 'spring'.
 */
export function populateSliceMeshGroup(
  sliceHolder: THREE.Group,
  sliceType: SliceType,
  style: PlatformStyle,
  sliceIndex: number,
  ringIndex: number,
  primaryMat: THREE.MeshStandardMaterial,
  secondaryMat: THREE.MeshStandardMaterial,
  finishMat: THREE.MeshStandardMaterial,
  assets: SharedPlatformAssets,
  castShadows: boolean
): void {
  const slices = TOWER_CONSTANTS.SLICE_COUNT;
  const arc = (Math.PI * 2) / slices;
  const midA = arc * 0.5;
  const innerR = TOWER_CONSTANTS.INNER_RADIUS;
  const outerR = TOWER_CONSTANTS.OUTER_RADIUS;
  const midR = (innerR + outerR) * 0.5;

  if (sliceType === 'finish') {
    const mesh = new THREE.Mesh(assets.baseWedgeGeo, finishMat);
    mesh.receiveShadow = castShadows;
    sliceHolder.add(mesh);
    return;
  }

  if (sliceType === 'hazard') {
    const hazMat =
      (sliceIndex + ringIndex) % 2 === 0
        ? assets.materials.hazardBase
        : assets.materials.hazardOrange;
    const base = new THREE.Mesh(assets.baseWedgeGeo, hazMat);
    base.castShadow = castShadows;
    base.receiveShadow = castShadows;
    sliceHolder.add(base);

    // 3 composite hazard spikes
    for (const rOffset of [-0.6, 0, 0.6]) {
      const rPos = midR + rOffset;
      const spike = new THREE.Mesh(
        assets.spikeGeo,
        assets.materials.hazardSpike
      );
      spike.position.set(Math.cos(midA) * rPos, 0.24, Math.sin(midA) * rPos);
      sliceHolder.add(spike);
    }
    return;
  }

  if (sliceType === 'spring') {
    const base = new THREE.Mesh(assets.baseWedgeGeo, primaryMat);
    base.receiveShadow = castShadows;
    sliceHolder.add(base);

    const pad = new THREE.Mesh(
      assets.springCoilGeo,
      assets.materials.springGold
    );
    pad.position.set(Math.cos(midA) * midR, 0.24, Math.sin(midA) * midR);
    sliceHolder.add(pad);
    return;
  }

  if (sliceType === 'breakable') {
    const base = new THREE.Mesh(
      assets.baseWedgeGeo,
      assets.materials.breakableCookie
    );
    base.castShadow = castShadows;
    base.receiveShadow = castShadows;
    sliceHolder.add(base);

    const crack1 = new THREE.Mesh(
      assets.crackLineGeo,
      assets.materials.crackDark
    );
    crack1.position.set(Math.cos(midA) * midR, 0.26, Math.sin(midA) * midR);
    crack1.rotation.y = -midA + 0.22;
    sliceHolder.add(crack1);

    const crack2 = new THREE.Mesh(
      assets.crackLineGeo,
      assets.materials.crackDark
    );
    crack2.position.set(Math.cos(midA) * midR, 0.26, Math.sin(midA) * midR);
    crack2.rotation.y = -midA - 0.35;
    crack2.scale.set(0.65, 1, 1);
    sliceHolder.add(crack2);

    for (const rOff of [-0.45, 0.45]) {
      const chip = new THREE.Mesh(
        assets.chocoChipGeo,
        assets.materials.chocoChip
      );
      chip.position.set(
        Math.cos(midA + rOff * 0.15) * (midR + rOff),
        0.27,
        Math.sin(midA + rOff * 0.15) * (midR + rOff)
      );
      chip.scale.set(1, 0.55, 1);
      sliceHolder.add(chip);
    }
    return;
  }

  // Normal platform slice: build 3D geometry according to PlatformStyle!
  if (style === 'waffle') {
    const base = new THREE.Mesh(
      assets.baseWedgeGeo,
      assets.materials.waffleGolden
    );
    base.castShadow = castShadows;
    base.receiveShadow = castShadows;
    sliceHolder.add(base);

    for (const aOff of [-0.09, 0.09]) {
      const a = midA + aOff;
      const rRib = new THREE.Mesh(
        assets.waffleRadialBarGeo,
        assets.materials.waffleRim
      );
      rRib.position.set(Math.cos(a) * midR, 0.26, Math.sin(a) * midR);
      rRib.rotation.y = -a;
      sliceHolder.add(rRib);
    }
    for (const rPos of [innerR + 0.55, midR, outerR - 0.55]) {
      const cRib = new THREE.Mesh(
        assets.waffleArcBarGeo,
        assets.materials.waffleRim
      );
      cRib.position.set(Math.cos(midA) * rPos, 0.26, Math.sin(midA) * rPos);
      cRib.rotation.y = -midA;
      sliceHolder.add(cRib);
    }

    if ((sliceIndex + ringIndex) % 3 === 0) {
      const butter = new THREE.Mesh(
        assets.butterPatGeo,
        assets.materials.butter
      );
      butter.position.set(Math.cos(midA) * midR, 0.3, Math.sin(midA) * midR);
      butter.rotation.y = -midA + 0.3;
      sliceHolder.add(butter);
    }
  } else if (style === 'donut') {
    const dough = new THREE.Mesh(
      assets.puffyWedgeGeo,
      assets.materials.donutDough
    );
    dough.castShadow = castShadows;
    dough.receiveShadow = castShadows;
    sliceHolder.add(dough);

    const icingMat = sliceIndex % 2 === 0 ? primaryMat : secondaryMat;
    const icing = new THREE.Mesh(assets.icingCapGeo, icingMat);
    sliceHolder.add(icing);

    const sprinkleOffsets = [
      { r: innerR + 0.65, a: midA - 0.08, rot: 0.4 },
      { r: midR, a: midA + 0.09, rot: -0.7 },
      { r: outerR - 0.65, a: midA - 0.06, rot: 1.1 },
      { r: outerR - 0.45, a: midA + 0.08, rot: -0.2 },
    ];
    sprinkleOffsets.forEach((sp, idx) => {
      const spMat =
        assets.materials.sprinkleMats[
          (sliceIndex + idx) % assets.materials.sprinkleMats.length
        ];
      const spMesh = new THREE.Mesh(assets.sprinkleGeo, spMat);
      spMesh.position.set(
        Math.cos(sp.a) * sp.r,
        0.34,
        Math.sin(sp.a) * sp.r
      );
      spMesh.rotation.y = sp.rot;
      sliceHolder.add(spMesh);
    });
  } else if (style === 'marshmallow') {
    const mMat = sliceIndex % 2 === 0 ? primaryMat : secondaryMat;
    const puff = new THREE.Mesh(assets.puffyWedgeGeo, mMat);
    puff.castShadow = castShadows;
    puff.receiveShadow = castShadows;
    sliceHolder.add(puff);

    const topCream = new THREE.Mesh(
      assets.icingCapGeo,
      assets.materials.whiteCream
    );
    topCream.scale.set(0.96, 0.85, 0.96);
    sliceHolder.add(topCream);
  } else if (style === 'toyblock') {
    const bMat = sliceIndex % 2 === 0 ? primaryMat : secondaryMat;
    const block = new THREE.Mesh(assets.baseWedgeGeo, bMat);
    block.castShadow = castShadows;
    block.receiveShadow = castShadows;
    sliceHolder.add(block);

    const studCoords = [
      { r: innerR + 0.68, a: midA - 0.09 },
      { r: innerR + 0.68, a: midA + 0.09 },
      { r: outerR - 0.68, a: midA - 0.09 },
      { r: outerR - 0.68, a: midA + 0.09 },
    ];
    for (const sc of studCoords) {
      const stud = new THREE.Mesh(assets.toyStudGeo, bMat);
      stud.position.set(Math.cos(sc.a) * sc.r, 0.31, Math.sin(sc.a) * sc.r);
      stud.castShadow = castShadows;
      sliceHolder.add(stud);
    }
  } else if (style === 'cookie') {
    const cookie = new THREE.Mesh(
      assets.puffyWedgeGeo,
      assets.materials.cookieDough
    );
    cookie.castShadow = castShadows;
    cookie.receiveShadow = castShadows;
    sliceHolder.add(cookie);

    const chipCoords = [
      { r: innerR + 0.6, a: midA - 0.07 },
      { r: midR - 0.1, a: midA + 0.08 },
      { r: midR + 0.35, a: midA - 0.09 },
      { r: outerR - 0.55, a: midA + 0.06 },
    ];
    for (const cc of chipCoords) {
      const chip = new THREE.Mesh(
        assets.chocoChipGeo,
        assets.materials.chocoChip
      );
      chip.position.set(Math.cos(cc.a) * cc.r, 0.28, Math.sin(cc.a) * cc.r);
      chip.scale.set(1.1, 0.65, 1.1);
      sliceHolder.add(chip);
    }
  } else {
    const sMat = sliceIndex % 2 === 0 ? primaryMat : secondaryMat;
    const starMesh = new THREE.Mesh(assets.starWedgeGeo, sMat);
    starMesh.castShadow = castShadows;
    starMesh.receiveShadow = castShadows;
    sliceHolder.add(starMesh);

    if ((sliceIndex + ringIndex) % 2 === 0) {
      const crystal = new THREE.Mesh(
        assets.starCrystalGeo,
        assets.materials.springGold
      );
      crystal.position.set(
        Math.cos(midA) * (outerR - 0.25),
        0.34,
        Math.sin(midA) * (outerR - 0.25)
      );
      sliceHolder.add(crystal);
    }
  }
}

export interface BuiltActiveObstacleMesh {
  /**
   * Pivot group positioned at the tower's central vertical axis (0, 0, 0).
   * Rotating `pivotGroup.rotation.y` orbits the attached obstacle 360° around the tower!
   */
  pivotGroup: THREE.Group;
  /**
   * Obstacle mesh carrier attached to `pivotGroup` at `(0, localY, obs.currentRadius)`.
   */
  obstacleHolder: THREE.Group;
  spinTarget: THREE.Object3D;
  clusterTarget: THREE.Group | null;
  trailGroup: THREE.Group;
}

/**
 * Builds a 3D Orbital Circular Obstacle using a Three.js `pivotGroup` positioned
 * at the central vertical axis of the tower `(0, ringY, 0)`, with `obstacleHolder`
 * attached at the orbital radius `(0, 0.25 + obs.currentYOffset, obs.currentRadius)`.
 * Rotating `pivotGroup.rotation.y` physically orbits the entire obstacle 360° around the tower!
 */
export function createActiveRoundObstacleMesh(
  obs: ActiveRoundObstacle,
  ringY: number,
  assets: SharedPlatformAssets
): BuiltActiveObstacleMesh {
  const pivotGroup = new THREE.Group();
  pivotGroup.position.set(0, ringY, 0);
  pivotGroup.rotation.y = obs.currentAngle;

  const obstacleHolder = new THREE.Group();
  obstacleHolder.position.set(
    0,
    0.25 + obs.currentYOffset,
    obs.currentRadius
  );
  pivotGroup.add(obstacleHolder);

  const spinTarget = new THREE.Group();
  const trailGroup = new THREE.Group();
  trailGroup.visible = false; // Obstacles are static in Helix Jump style
  obstacleHolder.add(spinTarget);
  obstacleHolder.add(trailGroup);

  const isAltColor = obs.id.endsWith('-1') || obs.id.endsWith('-3');
  const mainMat = isAltColor
    ? assets.materials.hazardOrange
    : assets.materials.hazardBase;

  let clusterTarget: THREE.Group | null = null;

  if (obs.visualKind === 'bumper_disc') {
    // Glossy two-tier circular arcade bumper disc (inspired by the floating pink/blue circular bumpers!)
    const baseDisc = new THREE.Mesh(
      assets.springCoilGeo,
      assets.materials.gemCyan
    );
    baseDisc.scale.set(1.22, 0.72, 1.22);
    baseDisc.position.set(0, -0.08, 0);

    const topButton = new THREE.Mesh(assets.springCoilGeo, mainMat);
    topButton.scale.set(0.95, 0.75, 0.95);
    topButton.position.set(0, 0.04, 0);

    const rimTorus = new THREE.Mesh(
      assets.roundOrbRingGeo,
      assets.materials.springGold
    );
    rimTorus.scale.setScalar(1.06);

    const topStar = new THREE.Mesh(
      assets.starCrystalGeo,
      assets.materials.whiteCream
    );
    topStar.position.set(0, 0.24, 0);

    spinTarget.add(baseDisc, topButton, rimTorus, topStar);
  } else if (obs.visualKind === 'donut_roller') {
    const dough = new THREE.Mesh(
      assets.spinningDonutGeo,
      assets.materials.donutDough
    );
    const icingFront = new THREE.Mesh(assets.spinningDonutIcingGeo, mainMat);
    icingFront.position.z = 0.032;
    const icingBack = new THREE.Mesh(assets.spinningDonutIcingGeo, mainMat);
    icingBack.position.z = -0.032;

    const core = new THREE.Mesh(
      assets.motionGhostGeo,
      assets.materials.springGold
    );
    core.scale.setScalar(0.95);

    spinTarget.add(dough, icingFront, icingBack, core);
  } else if (obs.visualKind === 'spiked_orb') {
    const orb = new THREE.Mesh(assets.roundOrbGeo, mainMat);
    const eqRing = new THREE.Mesh(
      assets.roundOrbRingGeo,
      assets.materials.springGold
    );
    spinTarget.add(orb, eqRing);

    const spikeDirs: [number, number, number, number, number][] = [
      [0, 0.32, 0, 0, 0],
      [0, -0.32, 0, Math.PI, 0],
      [0.32, 0, 0, 0, -Math.PI / 2],
      [-0.32, 0, 0, 0, Math.PI / 2],
      [0, 0, 0.32, Math.PI / 2, 0],
      [0, 0, -0.32, -Math.PI / 2, 0],
    ];
    for (const [sx, sy, sz, rx, rz] of spikeDirs) {
      const sp = new THREE.Mesh(
        assets.radialSpikeGeo,
        assets.materials.hazardSpike
      );
      sp.position.set(sx, sy, sz);
      sp.rotation.set(rx, 0, rz);
      spinTarget.add(sp);
    }
  } else if (obs.visualKind === 'bouncing_sphere') {
    const sphere = new THREE.Mesh(
      assets.roundOrbGeo,
      assets.materials.hazardPurple
    );
    const belt = new THREE.Mesh(
      assets.roundOrbRingGeo,
      assets.materials.springGold
    );
    const crown = new THREE.Mesh(
      assets.radialSpikeGeo,
      assets.materials.springGold
    );
    crown.position.set(0, 0.3, 0);
    spinTarget.add(sphere, belt, crown);
  } else {
    // 'cluster_group': Multiple round obstacles rotating together around a central hub!
    clusterTarget = new THREE.Group();
    obstacleHolder.add(clusterTarget);

    const centerHub = new THREE.Mesh(
      assets.motionGhostGeo,
      assets.materials.springGold
    );
    centerHub.scale.setScalar(1.15);
    clusterTarget.add(centerHub);

    const count = Math.max(2, obs.memberCount);
    for (let m = 0; m < count; m++) {
      const mAngle = (m * Math.PI * 2) / count;
      const mx = Math.sin(mAngle) * obs.groupSpreadRadius;
      const mz = Math.cos(mAngle) * obs.groupSpreadRadius;

      const memberGroup = new THREE.Group();
      memberGroup.position.set(mx, 0, mz);

      const subOrb = new THREE.Mesh(
        assets.roundOrbSmallGeo,
        m % 2 === 0 ? assets.materials.hazardBase : assets.materials.hazardOrange
      );
      const subRing = new THREE.Mesh(
        assets.roundOrbRingGeo,
        assets.materials.springGold
      );
      subRing.scale.setScalar(0.76);
      memberGroup.add(subOrb, subRing);
      clusterTarget.add(memberGroup);
    }

    const connector = new THREE.Mesh(
      assets.clusterArmGeo,
      assets.materials.springGold
    );
    clusterTarget.add(connector);
  }

  return {
    pivotGroup,
    obstacleHolder,
    spinTarget,
    clusterTarget,
    trailGroup,
  };
}

/**
 * Builds a 3D Rotating Candy Bar or Rotating Blade obstacle attached to a ring.
 */
export function createRingRotatingObstacle(
  type: 'candy_bar' | 'rotating_blade' | 'spinning_donut',
  assets: SharedPlatformAssets
): THREE.Group {
  const group = new THREE.Group();
  const innerR = TOWER_CONSTANTS.INNER_RADIUS;
  const outerR = TOWER_CONSTANTS.OUTER_RADIUS;
  const midR = (innerR + outerR) * 0.5;

  if (type === 'candy_bar') {
    const barHolder = new THREE.Group();
    barHolder.rotation.y = -Math.PI / 2;

    const bar = new THREE.Mesh(
      assets.candyBarGeo,
      assets.materials.whiteCream
    );
    bar.position.set(midR, 0.46, 0);
    barHolder.add(bar);

    for (const rOff of [-0.85, -0.28, 0.28, 0.85]) {
      const stripe = new THREE.Mesh(
        assets.candyStripeGeo,
        assets.materials.hazardBase
      );
      stripe.position.set(midR + rOff, 0.46, 0);
      barHolder.add(stripe);
    }

    group.add(barHolder);
  } else {
    const bladeHolder = new THREE.Group();
    bladeHolder.rotation.y = -Math.PI / 2;

    const hub = new THREE.Mesh(
      assets.bladeHubGeo,
      assets.materials.springGold
    );
    hub.position.set(0, 0.42, 0);
    bladeHolder.add(hub);

    const arm = new THREE.Mesh(
      assets.bladeArmGeo,
      assets.materials.hazardOrange
    );
    arm.position.set(0, 0.44, 0);
    bladeHolder.add(arm);

    group.add(bladeHolder);
  }

  return group;
}

export interface MonsterRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  leftEyeGroup: THREE.Group;
  rightEyeGroup: THREE.Group;
  thirdEyeGroup: THREE.Group;
  leftEar: THREE.Mesh;
  rightEar: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftFoot: THREE.Mesh;
  rightFoot: THREE.Mesh;
  roundTorso: THREE.Mesh;
  cubeTorso: THREE.Group;
  fluffyWingsGroup: THREE.Group;
  jellyCrownGroup: THREE.Group;
  feverHalo: THREE.Mesh;
  boostTrailGroup: THREE.Group;
  spiralEffectGroup: THREE.Group;
  spiralNodes: THREE.Mesh[];
  speedLinesGroup: THREE.Group;
  vortexRibbonMesh: THREE.Mesh;
  spiralRibbonMaterials: THREE.MeshBasicMaterial[];
  primaryMat: THREE.MeshStandardMaterial;
  secondaryMat: THREE.MeshStandardMaterial;
  accentMat: THREE.MeshStandardMaterial;
  pupilMat: THREE.MeshStandardMaterial;
}

/**
 * 3D Parametric Helix Curve for the curved spiral particle & ribbon trail
 * wrapping around the falling monster.
 */
class SpiralHelixCurve extends THREE.Curve<THREE.Vector3> {
  private readonly phaseOffset: number;
  private readonly turns: number;
  private readonly heightSpan: number;
  private readonly baseRadius: number;

  constructor(
    phaseOffset = 0,
    turns = 2.2,
    heightSpan = 2.35,
    baseRadius = 0.64
  ) {
    super();
    this.phaseOffset = phaseOffset;
    this.turns = turns;
    this.heightSpan = heightSpan;
    this.baseRadius = baseRadius;
  }

  getPoint(t: number, optionalTarget = new THREE.Vector3()): THREE.Vector3 {
    const angle = t * Math.PI * 2 * this.turns + this.phaseOffset;
    const radius = this.baseRadius + t * 0.28;
    const x = Math.cos(angle) * radius;
    const y = -0.18 + t * this.heightSpan;
    const z = Math.sin(angle) * radius;
    return optionalTarget.set(x, y, z);
  }
}

/**
 * Builds the hero Bouncy Monster as a rich multi-part glossy toy-like 3D character
 * with customizable 3D body styles ('horned', 'antenna', 'cube', 'fluffy', 'cyclops', 'jelly'),
 * blinking eye groups, waving arms, stubby feet, and Fever Comet halo.
 */
export function createMonsterCharacter(skin: MonsterSkin): MonsterRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const primaryMat = new THREE.MeshStandardMaterial({
    color: skin.primaryColor,
    roughness: 0.22,
    metalness: 0.08,
  });

  const secondaryMat = new THREE.MeshStandardMaterial({
    color: skin.secondaryColor,
    roughness: 0.3,
    metalness: 0.06,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: skin.accentColor,
    roughness: 0.2,
    metalness: 0.25,
    emissive: skin.accentColor,
    emissiveIntensity: 0.16,
  });

  const eyeWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.08,
    metalness: 0.05,
  });

  const pupilMat = new THREE.MeshStandardMaterial({
    color: skin.eyeColor,
    roughness: 0.05,
    metalness: 0.15,
  });

  const mouthMat = new THREE.MeshStandardMaterial({
    color: 0x881337,
    roughness: 0.35,
    metalness: 0.05,
  });

  // 1A. Primary glossy rounded monster torso
  const torsoGeo = new THREE.SphereGeometry(0.55, 28, 24);
  const roundTorso = new THREE.Mesh(torsoGeo, primaryMat);
  roundTorso.scale.set(1.06, 0.97, 1.0);
  roundTorso.castShadow = true;
  bodyGroup.add(roundTorso);

  // 1B. Toy-Block Cube torso variant (for 'sunny' Blocky!)
  const cubeTorso = new THREE.Group();
  const boxGeo = new THREE.BoxGeometry(0.92, 0.84, 0.78);
  const boxMesh = new THREE.Mesh(boxGeo, primaryMat);
  boxMesh.castShadow = true;
  cubeTorso.add(boxMesh);
  const blockStudGeo = new THREE.CylinderGeometry(0.14, 0.15, 0.1, 14);
  for (const [sx, sz] of [
    [-0.22, -0.18],
    [0.22, -0.18],
    [-0.22, 0.18],
    [0.22, 0.18],
  ]) {
    const stud = new THREE.Mesh(blockStudGeo, secondaryMat);
    stud.position.set(sx, 0.45, sz);
    cubeTorso.add(stud);
  }
  bodyGroup.add(cubeTorso);

  // 1C. Fluffy Side Ear-Wings + Electric Crest (for 'zappy' Zappy!)
  const fluffyWingsGroup = new THREE.Group();
  const earWingGeo = new THREE.ConeGeometry(0.24, 0.56, 12);
  const leftWing = new THREE.Mesh(earWingGeo, secondaryMat);
  leftWing.position.set(-0.56, 0.32, 0.02);
  leftWing.rotation.z = 0.95;
  fluffyWingsGroup.add(leftWing);
  const rightWing = new THREE.Mesh(earWingGeo, secondaryMat);
  rightWing.position.set(0.56, 0.32, 0.02);
  rightWing.rotation.z = -0.95;
  fluffyWingsGroup.add(rightWing);
  const crestGeo = new THREE.OctahedronGeometry(0.18, 0);
  const crest = new THREE.Mesh(crestGeo, accentMat);
  crest.position.set(0, 0.62, 0.08);
  fluffyWingsGroup.add(crest);
  bodyGroup.add(fluffyWingsGroup);

  // 1D. Jelly Crown Droplet (for 'jello' Jello!)
  const jellyCrownGroup = new THREE.Group();
  const dropletGeo = new THREE.SphereGeometry(0.18, 14, 12);
  const droplet = new THREE.Mesh(dropletGeo, accentMat);
  droplet.position.set(0, 0.58, 0.05);
  droplet.scale.set(0.85, 1.3, 0.85);
  jellyCrownGroup.add(droplet);
  bodyGroup.add(jellyCrownGroup);

  // 2. Soft belly & playful polka-dot spots
  const bellyGeo = new THREE.SphereGeometry(0.38, 18, 16);
  const belly = new THREE.Mesh(bellyGeo, secondaryMat);
  belly.position.set(0, -0.1, 0.24);
  belly.scale.set(0.95, 0.82, 0.62);
  bodyGroup.add(belly);

  const spotGeo = new THREE.SphereGeometry(0.11, 12, 10);
  const spotCoords = [
    { x: 0, y: 0.38, z: 0.38, s: 0.9 },
    { x: -0.34, y: 0.22, z: 0.36, s: 0.75 },
    { x: 0.34, y: 0.22, z: 0.36, s: 0.75 },
    { x: -0.28, y: -0.2, z: 0.42, s: 0.85 },
    { x: 0.28, y: -0.2, z: 0.42, s: 0.85 },
  ];
  for (const sc of spotCoords) {
    const spot = new THREE.Mesh(spotGeo, secondaryMat);
    spot.position.set(sc.x, sc.y, sc.z);
    spot.scale.set(sc.s, sc.s, 0.35);
    bodyGroup.add(spot);
  }

  // 3 & 4. Curved horns / bulb antennae on top
  const hornGroupGeo = new THREE.ConeGeometry(0.14, 0.4, 14);
  hornGroupGeo.translate(0, 0.16, 0);
  const tipBulbGeo = new THREE.SphereGeometry(0.085, 10, 10);

  const leftEar = new THREE.Mesh(hornGroupGeo, accentMat);
  leftEar.position.set(-0.27, 0.38, 0.04);
  leftEar.rotation.z = 0.42;
  leftEar.rotation.x = -0.12;
  leftEar.castShadow = true;
  const leftBulb = new THREE.Mesh(tipBulbGeo, accentMat);
  leftBulb.position.set(0, 0.34, 0);
  leftEar.add(leftBulb);
  bodyGroup.add(leftEar);

  const rightEar = new THREE.Mesh(hornGroupGeo, accentMat);
  rightEar.position.set(0.27, 0.38, 0.04);
  rightEar.rotation.z = -0.42;
  rightEar.rotation.x = -0.12;
  rightEar.castShadow = true;
  const rightBulb = new THREE.Mesh(tipBulbGeo, accentMat);
  rightBulb.position.set(0, 0.34, 0);
  rightEar.add(rightBulb);
  bodyGroup.add(rightEar);

  // 5 & 6. Expressive oversized glossy eyes with double catchlights + 3rd forehead eye for Gloop
  const eyeGeo = new THREE.SphereGeometry(0.16, 18, 16);
  const pupilGeo = new THREE.SphereGeometry(0.105, 14, 14);
  const glintBigGeo = new THREE.SphereGeometry(0.038, 8, 8);
  const glintSmallGeo = new THREE.SphereGeometry(0.02, 8, 8);

  const buildEye = (side: -1 | 0 | 1, scale = 1.0) => {
    const eyeGroup = new THREE.Group();
    if (side === 0) {
      eyeGroup.position.set(0, 0.32, 0.44);
    } else {
      eyeGroup.position.set(side * 0.2, 0.1, 0.45);
    }
    eyeGroup.scale.setScalar(scale);

    const sclera = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    sclera.scale.set(1, 1.12, 0.65);
    eyeGroup.add(sclera);

    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(-side * 0.015, 0.01, 0.065);
    pupil.scale.set(1, 1.1, 0.58);
    eyeGroup.add(pupil);

    const glintBig = new THREE.Mesh(glintBigGeo, eyeWhiteMat);
    glintBig.position.set((side || 1) * 0.032, 0.055, 0.12);
    eyeGroup.add(glintBig);

    const glintSmall = new THREE.Mesh(glintSmallGeo, eyeWhiteMat);
    glintSmall.position.set(-(side || 1) * 0.03, -0.035, 0.115);
    eyeGroup.add(glintSmall);

    return eyeGroup;
  };

  const leftEyeGroup = buildEye(-1, 1.0);
  const rightEyeGroup = buildEye(1, 1.0);
  const thirdEyeGroup = buildEye(0, 0.82);

  bodyGroup.add(leftEyeGroup);
  bodyGroup.add(rightEyeGroup);
  bodyGroup.add(thirdEyeGroup);

  // 7. Cute happy open mouth + two tiny white teeth
  const mouthGeo = new THREE.SphereGeometry(0.11, 14, 12);
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.set(0, -0.07, 0.51);
  mouth.scale.set(1.2, 0.78, 0.35);
  bodyGroup.add(mouth);

  const toothGeo = new THREE.BoxGeometry(0.042, 0.045, 0.03);
  const toothL = new THREE.Mesh(toothGeo, eyeWhiteMat);
  toothL.position.set(-0.028, -0.03, 0.54);
  bodyGroup.add(toothL);
  const toothR = new THREE.Mesh(toothGeo, eyeWhiteMat);
  toothR.position.set(0.028, -0.03, 0.54);
  bodyGroup.add(toothR);

  // 8 & 9. Chubby flapping side arms
  const armGeo = new THREE.CapsuleGeometry(0.1, 0.17, 6, 10);
  const leftArm = new THREE.Mesh(armGeo, primaryMat);
  leftArm.position.set(-0.54, -0.02, 0.08);
  leftArm.rotation.z = 0.65;
  bodyGroup.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, primaryMat);
  rightArm.position.set(0.54, -0.02, 0.08);
  rightArm.rotation.z = -0.65;
  bodyGroup.add(rightArm);

  // 10 & 11. Cute stubby bottom feet
  const footGeo = new THREE.SphereGeometry(0.13, 12, 10);
  const leftFoot = new THREE.Mesh(footGeo, primaryMat);
  leftFoot.position.set(-0.22, -0.46, 0.12);
  leftFoot.scale.set(1.0, 0.65, 1.25);
  bodyGroup.add(leftFoot);

  const rightFoot = new THREE.Mesh(footGeo, primaryMat);
  rightFoot.position.set(0.22, -0.46, 0.12);
  rightFoot.scale.set(1.0, 0.65, 1.25);
  bodyGroup.add(rightFoot);

  // 12. Fever Smash Comet Halo Ring (visible when isFever is active)
  const haloGeo = new THREE.TorusGeometry(0.75, 0.06, 10, 28);
  const haloMat = new THREE.MeshStandardMaterial({
    color: 0xffe600,
    emissive: 0xff3b9a,
    emissiveIntensity: 1.5,
    roughness: 0.15,
    metalness: 0.5,
    transparent: true,
    opacity: 0.92,
  });
  const feverHalo = new THREE.Mesh(haloGeo, haloMat);
  feverHalo.rotation.x = Math.PI / 2;
  feverHalo.visible = false;
  root.add(feverHalo);

  // 13. 3D Turbo Boost Speed Trail & Aura Group (visible when isBoosting is active)
  const boostTrailGroup = new THREE.Group();
  boostTrailGroup.visible = false;
  const trailRingColors = [0x00f5d4, 0xffe600, 0xff3b9a];
  for (let i = 0; i < 3; i++) {
    const rGeo = new THREE.TorusGeometry(0.62 - i * 0.11, 0.045, 8, 24);
    rGeo.rotateX(Math.PI / 2);
    const rMat = new THREE.MeshBasicMaterial({
      color: trailRingColors[i],
      transparent: true,
      opacity: 0.78 - i * 0.18,
      depthWrite: false,
    });
    const rMesh = new THREE.Mesh(rGeo, rMat);
    rMesh.position.set(0, 0.45 + i * 0.42, 0);
    boostTrailGroup.add(rMesh);
  }
  const streakConeGeo = new THREE.ConeGeometry(0.58, 1.85, 16, 1, true);
  streakConeGeo.translate(0, 0.9, 0);
  const streakConeMat = new THREE.MeshBasicMaterial({
    color: 0x00f5d4,
    transparent: true,
    opacity: 0.34,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const streakCone = new THREE.Mesh(streakConeGeo, streakConeMat);
  boostTrailGroup.add(streakCone);
  root.add(boostTrailGroup);

  // 14. Helix Jump-Style 3D Curved Spiral Trail & ABSOLUTE DROP Vortex Group (100% visual effect)
  const spiralEffectGroup = new THREE.Group();
  spiralEffectGroup.visible = false;

  const spiralMatCyan = new THREE.MeshBasicMaterial({
    color: 0x00f5d4,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  const spiralMatPink = new THREE.MeshBasicMaterial({
    color: 0xff3b9a,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
  });
  const spiralMatGold = new THREE.MeshBasicMaterial({
    color: 0xffe600,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  });
  const spiralRibbonMaterials = [spiralMatCyan, spiralMatPink, spiralMatGold];

  const helixGeo1 = new THREE.TubeGeometry(
    new SpiralHelixCurve(0, 2.1, 2.2, 0.62),
    32,
    0.042,
    8,
    false
  );
  const helixMesh1 = new THREE.Mesh(helixGeo1, spiralMatCyan);
  spiralEffectGroup.add(helixMesh1);

  const helixGeo2 = new THREE.TubeGeometry(
    new SpiralHelixCurve(Math.PI, 2.1, 2.2, 0.62),
    32,
    0.036,
    8,
    false
  );
  const helixMesh2 = new THREE.Mesh(helixGeo2, spiralMatPink);
  spiralEffectGroup.add(helixMesh2);

  // Outer Golden Spiral Vortex Ribbon (visible during combo / ABSOLUTE DROP)
  const vortexGeo = new THREE.TubeGeometry(
    new SpiralHelixCurve(Math.PI * 0.5, 2.6, 2.6, 0.78),
    36,
    0.052,
    8,
    false
  );
  const vortexRibbonMesh = new THREE.Mesh(vortexGeo, spiralMatGold);
  vortexRibbonMesh.visible = false;
  spiralEffectGroup.add(vortexRibbonMesh);

  // 12 Glowing Spiral Particle Nodes wrapping around the falling monster
  const spiralNodes: THREE.Mesh[] = [];
  const nodeGeo = new THREE.OctahedronGeometry(0.11, 0);
  for (let i = 0; i < 12; i++) {
    const nodeMat = new THREE.MeshBasicMaterial({
      color: VIBRANT_CONFETTI_COLORS[i % VIBRANT_CONFETTI_COLORS.length],
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
    spiralEffectGroup.add(nodeMesh);
    spiralNodes.push(nodeMesh);
  }

  // Vertical Speed Lines around the monster during fast / ABSOLUTE drops
  const speedLinesGroup = new THREE.Group();
  speedLinesGroup.visible = false;
  const speedLineGeo = new THREE.BoxGeometry(0.032, 1.55, 0.032);
  for (let i = 0; i < 8; i++) {
    const lineAngle = (i / 8) * Math.PI * 2;
    const lineRadius = 0.84 + (i % 2) * 0.14;
    const lineMat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0x00f5d4 : 0xffe600,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const lineMesh = new THREE.Mesh(speedLineGeo, lineMat);
    lineMesh.position.set(
      Math.cos(lineAngle) * lineRadius,
      0.85 + (i % 3) * 0.35,
      Math.sin(lineAngle) * lineRadius
    );
    speedLinesGroup.add(lineMesh);
  }
  spiralEffectGroup.add(speedLinesGroup);
  root.add(spiralEffectGroup);

  const rig: MonsterRig = {
    root,
    bodyGroup,
    leftEyeGroup,
    rightEyeGroup,
    thirdEyeGroup,
    leftEar,
    rightEar,
    leftArm,
    rightArm,
    leftFoot,
    rightFoot,
    roundTorso,
    cubeTorso,
    fluffyWingsGroup,
    jellyCrownGroup,
    feverHalo,
    boostTrailGroup,
    spiralEffectGroup,
    spiralNodes,
    speedLinesGroup,
    vortexRibbonMesh,
    spiralRibbonMaterials,
    primaryMat,
    secondaryMat,
    accentMat,
    pupilMat,
  };

  applyMonsterSkin(rig, skin);
  return rig;
}

/**
 * Updates the 3D Helix Jump-style curved spiral trail, glowing spiral particles,
 * speed lines, and ABSOLUTE DROP vortex around the falling monster.
 */
export function updateMonsterSpiralEffect(
  rig: MonsterRig,
  skin: MonsterSkin,
  ringsPassedInFall: number,
  monsterVy: number,
  isFever: boolean,
  isBoosting: boolean,
  elapsedTime: number
): void {
  const isFallingFast = monsterVy < -11.0;
  const isPassingGaps = ringsPassedInFall >= 1;
  const isAbsoluteDrop = ringsPassedInFall >= 2 || isFever || isBoosting;

  if (!isFallingFast && !isPassingGaps && !isBoosting) {
    rig.spiralEffectGroup.visible = false;
    rig.primaryMat.emissive.setHex(0x000000);
    rig.primaryMat.emissiveIntensity = 0;
    return;
  }

  rig.spiralEffectGroup.visible = true;

  // Intensity scales smoothly with downward speed and consecutive gaps passed
  const fallFactor = THREE.MathUtils.clamp((-monsterVy - 3.0) / 22.0, 0.2, 1.0);
  const comboFactor = THREE.MathUtils.clamp(ringsPassedInFall / 3.0, 0, 1.0);
  const intensity = Math.max(
    fallFactor * 0.72,
    comboFactor,
    isAbsoluteDrop ? 1.0 : 0.35
  );

  // Rotate the 3D curved spiral ribbons around the falling monster
  const spinRate = isAbsoluteDrop ? 14.5 : 8.5 + ringsPassedInFall * 2.0;
  rig.spiralEffectGroup.rotation.y = elapsedTime * spinRate;

  // Stretch spiral trail vertically as downward speed increases
  const verticalStretch = 0.75 + intensity * 0.55;
  const radialScale = isAbsoluteDrop ? 1.12 : 0.96;
  rig.spiralEffectGroup.scale.set(radialScale, verticalStretch, radialScale);

  // Fade ribbon opacities smoothly
  rig.spiralRibbonMaterials[0].opacity = 0.32 + intensity * 0.48;
  rig.spiralRibbonMaterials[1].opacity = 0.28 + intensity * 0.48;
  rig.spiralRibbonMaterials[2].opacity = isAbsoluteDrop ? 0.82 : 0.0;

  rig.vortexRibbonMesh.visible = isAbsoluteDrop;
  rig.speedLinesGroup.visible = isAbsoluteDrop || monsterVy < -16.5;

  if (rig.speedLinesGroup.visible) {
    rig.speedLinesGroup.rotation.y = -elapsedTime * 6.0;
    rig.speedLinesGroup.children.forEach((child, idx) => {
      const cycle = (elapsedTime * 7.5 + idx * 0.25) % 1.0;
      child.position.y = 0.2 + cycle * 1.9;
    });
  }

  // Animate the 12 glowing spiral particle nodes along the helical path around the monster
  const nodeCount = rig.spiralNodes.length;
  for (let i = 0; i < nodeCount; i++) {
    const node = rig.spiralNodes[i];
    // Travel upward relative to the falling monster and fade out naturally at the top of the trail
    const t = ((i / nodeCount) + elapsedTime * (isAbsoluteDrop ? 2.2 : 1.35)) % 1.0;
    const spiralAngle = t * Math.PI * 4.2 + (i % 2) * Math.PI;
    const radius = 0.62 + t * 0.34;
    node.position.set(
      Math.cos(spiralAngle) * radius,
      -0.15 + t * 2.25,
      Math.sin(spiralAngle) * radius
    );
    node.rotation.y = elapsedTime * 6 + i;
    node.rotation.x = elapsedTime * 4 + i;
    const fadeScale = Math.sin(t * Math.PI) * (0.7 + intensity * 0.65);
    node.scale.setScalar(Math.max(0.01, fadeScale));
  }

  // Stronger character glow during ABSOLUTE DROP / multi-gap combos
  if (isAbsoluteDrop) {
    rig.primaryMat.emissive.setHex(skin.primaryColor);
    rig.primaryMat.emissiveIntensity =
      0.38 + Math.sin(elapsedTime * 16) * 0.14;
  } else if (isPassingGaps) {
    rig.primaryMat.emissive.setHex(skin.primaryColor);
    rig.primaryMat.emissiveIntensity = 0.16;
  } else {
    rig.primaryMat.emissive.setHex(0x000000);
    rig.primaryMat.emissiveIntensity = 0;
  }
}

/**
 * Updates the MonsterRig materials and distinct 3D geometry attachments in-place
 * when switching character skins.
 */
export function applyMonsterSkin(rig: MonsterRig, skin: MonsterSkin): void {
  rig.primaryMat.color.setHex(skin.primaryColor);
  rig.secondaryMat.color.setHex(skin.secondaryColor);
  rig.accentMat.color.setHex(skin.accentColor);
  rig.accentMat.emissive.setHex(skin.accentColor);
  rig.pupilMat.color.setHex(skin.eyeColor);

  const isCube = skin.bodyStyle === 'cube';
  rig.roundTorso.visible = !isCube;
  rig.cubeTorso.visible = isCube;

  rig.fluffyWingsGroup.visible = skin.bodyStyle === 'fluffy';
  rig.jellyCrownGroup.visible = skin.bodyStyle === 'jelly';
  rig.thirdEyeGroup.visible = skin.bodyStyle === 'cyclops';

  rig.leftEar.visible =
    skin.bodyStyle === 'horned' ||
    skin.bodyStyle === 'antenna' ||
    skin.bodyStyle === 'cyclops';
  rig.rightEar.visible = rig.leftEar.visible;
}

/**
 * Animates the showcased 3D monster with blinking eyes, looking around,
 * waving tiny arms, gentle bouncing, and unique personality animations per character.
 */
export function updateMonsterShowcaseAnimation(
  rig: MonsterRig,
  skin: MonsterSkin,
  elapsedTime: number,
  transitionTimer: number
): void {
  // 1. Periodic Eye Blink (every 2.8 seconds, 0.16s blink duration)
  const blinkCycle = elapsedTime % 2.8;
  let eyeScaleY = 1.0;
  if (blinkCycle > 2.62) {
    const t = (blinkCycle - 2.62) / 0.18;
    eyeScaleY = Math.max(0.08, Math.abs(Math.cos(t * Math.PI)));
  }
  rig.leftEyeGroup.scale.set(1, eyeScaleY, 1);
  rig.rightEyeGroup.scale.set(1, eyeScaleY, 1);
  if (rig.thirdEyeGroup.visible) {
    rig.thirdEyeGroup.scale.set(0.82, 0.82 * eyeScaleY, 0.82);
  }

  // 2. Unique Idle Personality per Character Skin
  let bounceY = 0;
  let squashX = 1;
  let stretchY = 1;
  let bodyTiltZ = 0;
  let bodyLookY = 0;
  let bodyPitchX = 0;
  let leftArmZ = 0.65;
  let rightArmZ = -0.65;

  if (skin.id === 'berry') {
    // Popo: Cheerful rhythmic bounce + friendly high right-arm wave & looking around
    const hopSin = Math.abs(Math.sin(elapsedTime * 3.4));
    bounceY = hopSin * 0.28;
    squashX = 1 + (0.5 - hopSin) * 0.08;
    stretchY = 1 + (hopSin - 0.5) * 0.1;
    bodyLookY = Math.sin(elapsedTime * 1.6) * 0.16;
    bodyTiltZ = Math.sin(elapsedTime * 2.2) * 0.07;
    rightArmZ = -1.85 + Math.sin(elapsedTime * 9.5) * 0.35; // Waving tiny right arm!
    leftArmZ = 0.55 + Math.cos(elapsedTime * 3.4) * 0.2;
  } else if (skin.id === 'minty') {
    // Bubu: Playful side-to-side hip dance + alternating arm waves & antenna bob
    bounceY = Math.abs(Math.sin(elapsedTime * 4.0)) * 0.22;
    bodyTiltZ = Math.sin(elapsedTime * 4.0) * 0.14;
    bodyLookY = Math.cos(elapsedTime * 2.0) * 0.18;
    leftArmZ = 0.9 + Math.sin(elapsedTime * 6.0) * 0.45;
    rightArmZ = -0.9 + Math.sin(elapsedTime * 6.0) * 0.45;
  } else if (skin.id === 'sunny') {
    // Blocky: Snappy toy-cube hop + crisp head glances & dual arm pump
    const snap = Math.max(0, Math.sin(elapsedTime * 4.5));
    bounceY = snap * 0.28;
    squashX = 1 - snap * 0.06;
    stretchY = 1 + snap * 0.1;
    bodyLookY = Math.sin(elapsedTime * 1.8) * 0.15;
    leftArmZ = 0.4 + snap * 0.85;
    rightArmZ = -0.4 - snap * 0.85;
  } else if (skin.id === 'zappy') {
    // Zappy: Energetic hover-flutter + rapid wing/arm flap
    bounceY = 0.18 + Math.sin(elapsedTime * 6.5) * 0.14;
    bodyPitchX = Math.sin(elapsedTime * 3.2) * 0.08;
    bodyLookY = Math.sin(elapsedTime * 2.4) * 0.2;
    leftArmZ = 0.7 + Math.sin(elapsedTime * 14) * 0.45;
    rightArmZ = -0.7 - Math.sin(elapsedTime * 14) * 0.45;
  } else if (skin.id === 'gloop') {
    // Gloop: Cosmic zero-gravity float + curious 3-eyed head roll
    bounceY = 0.2 + Math.sin(elapsedTime * 2.4) * 0.16;
    bodyTiltZ = Math.sin(elapsedTime * 1.8) * 0.14;
    bodyLookY = Math.sin(elapsedTime * 1.5) * 0.2;
    leftArmZ = 1.2 + Math.sin(elapsedTime * 4.2) * 0.3;
    rightArmZ = -0.6 - Math.cos(elapsedTime * 3.0) * 0.25;
  } else {
    // Jello: Gelatinous squash-and-stretch wobble + joyful spin-wave
    const wobble = Math.sin(elapsedTime * 5.2);
    bounceY = Math.abs(wobble) * 0.25;
    squashX = 1 + wobble * 0.11;
    stretchY = 1 - wobble * 0.11;
    bodyLookY = Math.sin(elapsedTime * 2.0) * 0.18;
    leftArmZ = 1.5 + Math.sin(elapsedTime * 8.0) * 0.35;
    rightArmZ = -1.5 - Math.cos(elapsedTime * 8.0) * 0.35;
  }

  // 3. Smooth Character Switching Front-Facing Elastic Pop-Jump Transition
  let transitionScale = 1.0;
  let transitionHopY = 0;
  let transitionWiggleY = 0;
  if (transitionTimer > 0) {
    const p = 1 - Math.min(1, transitionTimer / 0.28); // 0 -> 1
    transitionHopY = Math.sin(p * Math.PI) * 0.32;
    transitionWiggleY = Math.sin(p * Math.PI * 2) * 0.28;
    transitionScale = 0.8 + Math.sin(p * Math.PI) * 0.28 + p * 0.2;
  }

  rig.bodyGroup.position.set(0, bounceY + transitionHopY, 0);
  rig.bodyGroup.rotation.set(
    bodyPitchX,
    bodyLookY + transitionWiggleY,
    bodyTiltZ
  );
  rig.bodyGroup.scale.set(
    squashX * transitionScale,
    stretchY * transitionScale,
    squashX * transitionScale
  );

  rig.leftArm.rotation.z = leftArmZ;
  rig.rightArm.rotation.z = rightArmZ;
  rig.leftEar.rotation.z = 0.42 + Math.sin(elapsedTime * 5.0) * 0.12;
  rig.rightEar.rotation.z = -0.42 - Math.sin(elapsedTime * 5.0) * 0.12;
  rig.leftFoot.rotation.x = Math.sin(elapsedTime * 4.0) * 0.22;
  rig.rightFoot.rotation.x = -Math.sin(elapsedTime * 4.0) * 0.22;
}

export interface ShowcaseStageAssets {
  group: THREE.Group;
  pedestalSpinGroup: THREE.Group;
  neonRingOuter: THREE.Mesh;
  neonRingInner: THREE.Mesh;
  floatingProps: THREE.Object3D[];
  dispose: () => void;
}

/**
 * Builds the 3D Character Selection Showcase Pedestal & Studio Backdrop
 * matching the reference Character Selection illustration (glossy purple/lilac
 * circular stage platform, glowing neon pink & cyan LED rings, and floating 3D stars).
 */
export function createShowcaseStage(): ShowcaseStageAssets {
  const group = new THREE.Group();
  const pedestalSpinGroup = new THREE.Group();
  group.add(pedestalSpinGroup);

  const baseGeo = new THREE.CylinderGeometry(1.52, 1.72, 0.26, 36);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x4c1d95,
    roughness: 0.25,
    metalness: 0.35,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.set(0, -0.26, 0);
  baseMesh.receiveShadow = true;
  pedestalSpinGroup.add(baseMesh);

  const midGeo = new THREE.CylinderGeometry(1.32, 1.46, 0.16, 36);
  const midMat = new THREE.MeshStandardMaterial({
    color: 0x7c3aed,
    roughness: 0.2,
    metalness: 0.3,
  });
  const midMesh = new THREE.Mesh(midGeo, midMat);
  midMesh.position.set(0, -0.08, 0);
  midMesh.receiveShadow = true;
  pedestalSpinGroup.add(midMesh);

  const topPlateGeo = new THREE.CylinderGeometry(1.16, 1.24, 0.08, 36);
  const topPlateMat = new THREE.MeshStandardMaterial({
    color: 0xc084fc,
    roughness: 0.16,
    metalness: 0.25,
  });
  const topPlate = new THREE.Mesh(topPlateGeo, topPlateMat);
  topPlate.position.set(0, 0.02, 0);
  topPlate.receiveShadow = true;
  pedestalSpinGroup.add(topPlate);

  // Glowing Neon Pink & Cyan Pedestal Rings
  const outerRingGeo = new THREE.TorusGeometry(1.48, 0.055, 12, 48);
  outerRingGeo.rotateX(Math.PI / 2);
  const outerRingMat = new THREE.MeshStandardMaterial({
    color: 0xff3b9a,
    emissive: 0xff3b9a,
    emissiveIntensity: 1.2,
    roughness: 0.15,
    metalness: 0.4,
  });
  const neonRingOuter = new THREE.Mesh(outerRingGeo, outerRingMat);
  neonRingOuter.position.set(0, -0.12, 0);
  pedestalSpinGroup.add(neonRingOuter);

  const innerRingGeo = new THREE.TorusGeometry(1.18, 0.04, 12, 48);
  innerRingGeo.rotateX(Math.PI / 2);
  const innerRingMat = new THREE.MeshStandardMaterial({
    color: 0x00f5d4,
    emissive: 0x00f5d4,
    emissiveIntensity: 1.1,
    roughness: 0.15,
    metalness: 0.4,
  });
  const neonRingInner = new THREE.Mesh(innerRingGeo, innerRingMat);
  neonRingInner.position.set(0, 0.06, 0);
  pedestalSpinGroup.add(neonRingInner);

  // Floating 3D Candy Stars & Orbs framing the showcased character
  const floatingProps: THREE.Object3D[] = [];
  const starGeo = new THREE.OctahedronGeometry(0.22, 0);
  const orbGeo = new THREE.SphereGeometry(0.16, 14, 12);
  const starMat = new THREE.MeshStandardMaterial({
    color: 0xffe600,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.45,
    roughness: 0.18,
    metalness: 0.3,
  });
  const pinkOrbMat = new THREE.MeshStandardMaterial({
    color: 0xff3b9a,
    roughness: 0.18,
    metalness: 0.15,
  });
  const cyanOrbMat = new THREE.MeshStandardMaterial({
    color: 0x00d4ff,
    roughness: 0.18,
    metalness: 0.15,
  });

  const propPositions: [number, number, number, 'star' | 'pink' | 'cyan'][] = [
    [-1.75, 1.45, -0.6, 'star'],
    [1.75, 1.55, -0.6, 'star'],
    [-1.45, 0.55, -0.8, 'pink'],
    [1.5, 0.65, -0.8, 'cyan'],
    [-1.1, 2.05, -0.9, 'cyan'],
    [1.15, 2.1, -0.9, 'pink'],
  ];

  for (const [px, py, pz, kind] of propPositions) {
    const mesh = new THREE.Mesh(
      kind === 'star' ? starGeo : orbGeo,
      kind === 'star' ? starMat : kind === 'pink' ? pinkOrbMat : cyanOrbMat
    );
    mesh.position.set(px, py, pz);
    group.add(mesh);
    floatingProps.push(mesh);
  }

  return {
    group,
    pedestalSpinGroup,
    neonRingOuter,
    neonRingInner,
    floatingProps,
    dispose: () => {
      baseGeo.dispose();
      baseMat.dispose();
      midGeo.dispose();
      midMat.dispose();
      topPlateGeo.dispose();
      topPlateMat.dispose();
      outerRingGeo.dispose();
      outerRingMat.dispose();
      innerRingGeo.dispose();
      innerRingMat.dispose();
      starGeo.dispose();
      orbGeo.dispose();
      starMat.dispose();
      pinkOrbMat.dispose();
      cyanOrbMat.dispose();
    },
  };
}

/**
 * Zero-GC pooled particle system using a single InstancedMesh for flying shatter shards,
 * cookie crumbs, and rainbow confetti bursts.
 */
export interface ParticleData {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  scale: number;
  life: number;
  maxLife: number;
}

export class PooledParticleSystem {
  public readonly mesh: THREE.InstancedMesh;
  private readonly pool: ParticleData[] = [];
  private readonly capacity: number;
  private cursor = 0;
  private readonly dummy = new THREE.Object3D();
  private readonly tempColor = new THREE.Color();

  constructor(capacity = 120) {
    this.capacity = capacity;
    const geo = new THREE.DodecahedronGeometry(0.18, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.12,
    });

    this.mesh = new THREE.InstancedMesh(geo, mat, capacity);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;

    for (let i = 0; i < capacity; i++) {
      this.pool.push({
        active: false,
        x: 0,
        y: -999,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        rx: 0,
        ry: 0,
        rz: 0,
        scale: 0,
        life: 0,
        maxLife: 1,
      });
      this.dummy.position.set(0, -999, 0);
      this.dummy.scale.setScalar(0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
      this.mesh.setColorAt(i, this.tempColor.setHex(0xffffff));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  public spawnBurst(
    x: number,
    y: number,
    z: number,
    colorHex: number,
    count: number,
    speedScale = 1.0,
    sizeScale = 1.0,
    rainbowConfetti = false
  ): void {
    for (let i = 0; i < count; i++) {
      const idx = this.cursor;
      const p = this.pool[idx];
      this.cursor = (this.cursor + 1) % this.capacity;

      const angle = Math.random() * Math.PI * 2;
      const radialSpeed = (2.2 + Math.random() * 5.4) * speedScale;

      p.active = true;
      p.x = x + (Math.random() - 0.5) * 0.45;
      p.y = y + (Math.random() - 0.5) * 0.22;
      p.z = z + (Math.random() - 0.5) * 0.45;
      p.vx = Math.cos(angle) * radialSpeed;
      p.vy = (2.8 + Math.random() * 6.8) * speedScale;
      p.vz = Math.sin(angle) * radialSpeed;
      p.rx = Math.random() * 6;
      p.ry = Math.random() * 6;
      p.rz = Math.random() * 6;
      p.scale = (0.65 + Math.random() * 0.8) * sizeScale;
      p.maxLife = 0.42 + Math.random() * 0.3;
      p.life = p.maxLife;

      const chosenHex = rainbowConfetti
        ? VIBRANT_CONFETTI_COLORS[i % VIBRANT_CONFETTI_COLORS.length]
        : colorHex;
      this.tempColor.setHex(chosenHex);
      this.mesh.setColorAt(idx, this.tempColor);
    }
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }

  public update(dt: number): void {
    let anyUpdated = false;
    for (let i = 0; i < this.capacity; i++) {
      const p = this.pool[i];
      if (!p.active) continue;
      anyUpdated = true;

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        this.dummy.position.set(0, -999, 0);
        this.dummy.scale.setScalar(0);
        this.dummy.updateMatrix();
        this.mesh.setMatrixAt(i, this.dummy.matrix);
        continue;
      }

      p.vy -= 24 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.rx += 8 * dt;
      p.ry += 10 * dt;

      const lifeRatio = Math.max(0, p.life / p.maxLife);
      this.dummy.position.set(p.x, p.y, p.z);
      this.dummy.rotation.set(p.rx, p.ry, p.rz);
      this.dummy.scale.setScalar(p.scale * lifeRatio);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }

    if (anyUpdated) {
      this.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
