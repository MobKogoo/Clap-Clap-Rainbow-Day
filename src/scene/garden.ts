import * as THREE from 'three';
import { GardenTextures } from './materials';

export interface GardenProps {
  gateDoor: THREE.Group;
  gatePostPos: THREE.Vector3;
  basket: THREE.Group;
  basketLid: THREE.Group;
  blanketFolded: THREE.Mesh;
  blanketOpen: THREE.Mesh;
  napkins: THREE.Mesh[];
  cups: THREE.Group[];
  wateringCan: THREE.Group;
  waterDrops: THREE.Group;
  colorWheel: THREE.Group;
  wheelSegmentMats: THREE.MeshStandardMaterial[];
  redFlowerTargets: THREE.Vector3[];
  yellowFlowerCluster: THREE.Group;
  purpleFlowerAnchor: THREE.Vector3;
  clouds: THREE.Group[];
  pondWater: THREE.Mesh;
  flowerGroups: THREE.Group[];
}

function createFlower(
  petalColor: number,
  centerColor: number,
  scale = 1.0,
  isDaisy = false
): THREE.Group {
  const g = new THREE.Group();
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x55a648, roughness: 0.8 });
  const petalMat = new THREE.MeshStandardMaterial({ color: petalColor, roughness: 0.55 });
  const centerMat = new THREE.MeshStandardMaterial({ color: centerColor, roughness: 0.6 });

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.34, 8), stemMat);
  stem.position.y = 0.17;
  g.add(stem);

  // Two soft leaves
  const leafGeo = new THREE.SphereGeometry(0.08, 8, 6);
  const leafL = new THREE.Mesh(leafGeo, stemMat);
  leafL.scale.set(1.4, 0.25, 0.7);
  leafL.position.set(-0.07, 0.11, 0);
  leafL.rotation.z = 0.4;
  const leafR = new THREE.Mesh(leafGeo, stemMat);
  leafR.scale.set(1.4, 0.25, 0.7);
  leafR.position.set(0.07, 0.14, 0);
  leafR.rotation.z = -0.4;
  g.add(leafL, leafR);

  const head = new THREE.Group();
  head.position.y = 0.35;
  head.rotation.x = -0.2;
  g.add(head);

  const count = isDaisy ? 8 : 6;
  const petalGeo = new THREE.SphereGeometry(isDaisy ? 0.055 : 0.075, 10, 8);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const p = new THREE.Mesh(petalGeo, petalMat);
    p.scale.set(isDaisy ? 1.5 : 1.1, 0.3, isDaisy ? 0.65 : 0.9);
    const dist = isDaisy ? 0.11 : 0.085;
    p.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
    p.rotation.y = -angle;
    head.add(p);
  }

  const center = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), centerMat);
  center.scale.y = 0.6;
  center.position.y = 0.015;
  head.add(center);

  g.scale.setScalar(scale);
  return g;
}

function createFlowerBed(
  x: number,
  z: number,
  petalColor: number,
  centerColor: number,
  count: number,
  spread: number,
  isDaisy = false
): { group: THREE.Group; flowerPositions: THREE.Vector3[] } {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  // Soft soil mound
  const moundMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.95 });
  const mound = new THREE.Mesh(
    new THREE.CylinderGeometry(spread * 0.95, spread * 1.1, 0.08, 20),
    moundMat
  );
  mound.position.y = 0.03;
  mound.receiveShadow = true;
  group.add(mound);

  const flowerPositions: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const angle = i * 2.39996;
    const r = Math.sqrt((i + 0.5) / count) * spread * 0.85;
    const fx = Math.cos(angle) * r;
    const fz = Math.sin(angle) * r;
    const scale = 0.85 + ((i * 37) % 10) * 0.035;
    const flower = createFlower(petalColor, centerColor, scale, isDaisy);
    flower.position.set(fx, 0.04, fz);
    flower.rotation.y = (i * 1.1) % (Math.PI * 2);
    flower.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    group.add(flower);
    flowerPositions.push(new THREE.Vector3(x + fx, 0.38 * scale + 0.04, z + fz));
  }

  return { group, flowerPositions };
}

export function createRainbowGarden(
  scene: THREE.Scene,
  textures: GardenTextures
): GardenProps {
  // 1. Sky Dome
  const skyGeo = new THREE.SphereGeometry(85, 32, 24);
  const skyMat = new THREE.MeshBasicMaterial({
    map: textures.sky,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyDome);

  // Soft drifting morning clouds
  const clouds: THREE.Group[] = [];
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.95,
    emissive: 0xfff8e7,
    emissiveIntensity: 0.15,
  });
  const cloudPositions: [number, number, number, number][] = [
    [-18, 16, -26, 1.3],
    [14, 18, -30, 1.5],
    [-4, 20, -38, 1.7],
    [28, 15, -18, 1.2],
    [-28, 14, -14, 1.1],
  ];
  cloudPositions.forEach(([cx, cy, cz, sc]) => {
    const cg = new THREE.Group();
    cg.position.set(cx, cy, cz);
    const puffOffsets: [number, number, number, number][] = [
      [0, 0, 0, 1.6],
      [-1.4, -0.2, 0.1, 1.2],
      [1.4, -0.15, -0.1, 1.25],
      [0.5, 0.5, 0.2, 1.1],
      [-0.6, 0.4, -0.1, 1.0],
    ];
    puffOffsets.forEach(([px, py, pz, r]) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), cloudMat);
      puff.scale.set(1.3, 0.72, 0.95);
      puff.position.set(px, py, pz);
      cg.add(puff);
    });
    cg.scale.setScalar(sc);
    scene.add(cg);
    clouds.push(cg);
  });

  // 2. Meadow Ground & Surrounding Rolling Hills (no void edges!)
  const groundMat = new THREE.MeshStandardMaterial({
    map: textures.grass,
    roughness: 0.92,
    metalness: 0.0,
  });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(75, 64), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const hillMat = new THREE.MeshStandardMaterial({ color: 0x85cf73, roughness: 0.95 });
  const hillSpecs: [number, number, number, number][] = [
    [-26, -28, 18, 4.5],
    [22, -32, 20, 5.2],
    [0, -40, 26, 6.0],
    [-36, 4, 16, 3.8],
    [34, 6, 17, 4.0],
  ];
  hillSpecs.forEach(([hx, hz, hr, hh]) => {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(hr, 24, 16), hillMat);
    hill.scale.set(1.3, hh / hr, 1.1);
    hill.position.set(hx, -0.8, hz);
    hill.receiveShadow = true;
    scene.add(hill);
  });

  // Distant Storybook Perimeter Trees
  const distTrunkMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.9 });
  const distLeafMat = new THREE.MeshStandardMaterial({ color: 0x68b85d, roughness: 0.85 });
  const treeCoords: [number, number, number][] = [
    [-16, -15, 1.2],
    [-21, -7, 1.0],
    [16, -14, 1.3],
    [20, -4, 1.1],
    [-15, 14, 0.95],
    [16, 13, 1.05],
    [11, -22, 1.4],
    [-11, -24, 1.35],
  ];
  treeCoords.forEach(([tx, tz, sc]) => {
    const tg = new THREE.Group();
    tg.position.set(tx, 0, tz);
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 2.2, 10), distTrunkMat);
    tr.position.y = 1.1;
    const crown1 = new THREE.Mesh(new THREE.SphereGeometry(1.4, 14, 12), distLeafMat);
    crown1.position.y = 2.7;
    const crown2 = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 10), distLeafMat);
    crown2.position.set(0.7, 2.3, 0.4);
    tg.add(tr, crown1, crown2);
    tg.scale.setScalar(sc);
    scene.add(tg);
  });

  // 3. Winding Garden Path (from gate at z=11 through clearing at z=-5)
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xead7b7, roughness: 0.88 });
  const pathPoints = [
    new THREE.Vector3(0, 0.02, 12.2),
    new THREE.Vector3(-0.2, 0.02, 10.5),
    new THREE.Vector3(-0.8, 0.02, 8.8),
    new THREE.Vector3(-1.3, 0.02, 7.2),
    new THREE.Vector3(-1.0, 0.02, 5.6),
    new THREE.Vector3(0.0, 0.02, 4.0),
    new THREE.Vector3(1.1, 0.02, 2.4),
    new THREE.Vector3(0.9, 0.02, 0.7),
    new THREE.Vector3(-0.3, 0.02, -1.0),
    new THREE.Vector3(-0.7, 0.02, -2.8),
    new THREE.Vector3(-0.2, 0.02, -4.3),
  ];
  pathPoints.forEach((pt, idx) => {
    const stone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.74, 0.04, 16),
      stoneMat
    );
    stone.scale.set(1.15, 1, 0.88);
    stone.position.copy(pt);
    stone.rotation.y = idx * 0.4;
    stone.receiveShadow = true;
    scene.add(stone);
  });

  // 4. Little Wooden Gate & Picket Fence at Garden Entrance (z = 10.8)
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.wood,
    color: 0xf4d3a1,
    roughness: 0.82,
  });
  const fenceGroup = new THREE.Group();
  fenceGroup.position.set(0, 0, 10.8);
  scene.add(fenceGroup);

  const postGeo = new THREE.CylinderGeometry(0.14, 0.16, 1.35, 12);
  const capGeo = new THREE.SphereGeometry(0.16, 12, 10);

  // Left & Right gateposts
  const postL = new THREE.Mesh(postGeo, woodMat);
  postL.position.set(-1.1, 0.675, 0);
  const capL = new THREE.Mesh(capGeo, woodMat);
  capL.position.set(-1.1, 1.38, 0);

  const postR = new THREE.Mesh(postGeo, woodMat);
  postR.position.set(1.1, 0.675, 0);
  const capR = new THREE.Mesh(capGeo, woodMat);
  capR.position.set(1.1, 1.38, 0);
  fenceGroup.add(postL, capL, postR, capR);

  // Side fence pickets extending outward
  [-1, 1].forEach((side) => {
    for (let i = 1; i <= 14; i++) {
      const px = side * (1.1 + i * 0.9);
      const picket = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.95, 0.08), woodMat);
      picket.position.set(px, 0.475, 0);
      picket.castShadow = true;
      picket.receiveShadow = true;
      fenceGroup.add(picket);
    }
    const railTop = new THREE.Mesh(new THREE.BoxGeometry(13, 0.1, 0.08), woodMat);
    railTop.position.set(side * 7.6, 0.72, 0.02);
    const railBot = new THREE.Mesh(new THREE.BoxGeometry(13, 0.1, 0.08), woodMat);
    railBot.position.set(side * 7.6, 0.3, 0.02);
    fenceGroup.add(railTop, railBot);
  });

  // Swinging Wooden Gate Door (pivoted at postL: x = -0.95)
  const gateDoor = new THREE.Group();
  gateDoor.position.set(-0.95, 0, 0);
  for (let i = 0; i < 5; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.95, 0.07), woodMat);
    slat.position.set(0.24 + i * 0.36, 0.5, 0);
    slat.castShadow = true;
    gateDoor.add(slat);
  }
  const gRail1 = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.11, 0.08), woodMat);
  gRail1.position.set(0.95, 0.78, 0.02);
  const gRail2 = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.11, 0.08), woodMat);
  gRail2.position.set(0.95, 0.28, 0.02);
  gateDoor.add(gRail1, gRail2);
  fenceGroup.add(gateDoor);

  const gatePostPos = new THREE.Vector3(1.1, 1.52, 10.8);

  // 5. Six Flower Beds (Red, Yellow, Blue, Orange, Purple + Extra Rainbow Border)
  const flowerGroups: THREE.Group[] = [];

  // Red flower bed (Scene 2)
  const redBed = createFlowerBed(-3.6, 6.4, 0xef5350, 0xffd54f, 11, 1.35, false);
  scene.add(redBed.group);
  flowerGroups.push(redBed.group);

  // Yellow daisy bed (Scene 4)
  const yellowBed = createFlowerBed(3.8, 3.2, 0xfdd835, 0xf57f17, 12, 1.4, true);
  scene.add(yellowBed.group);
  flowerGroups.push(yellowBed.group);

  // Shallow Pond & Blue Flower Bed (Scene 5)
  const pondGroup = new THREE.Group();
  pondGroup.position.set(-5.6, 0, -1.2);
  scene.add(pondGroup);

  const rimMat = new THREE.MeshStandardMaterial({ color: 0xbcb09e, roughness: 0.9 });
  const pondRim = new THREE.Mesh(new THREE.TorusGeometry(1.95, 0.22, 10, 28), rimMat);
  pondRim.rotation.x = Math.PI / 2;
  pondRim.scale.set(1.2, 0.9, 0.5);
  pondRim.position.y = 0.04;
  pondRim.receiveShadow = true;
  pondGroup.add(pondRim);

  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x7fd8f8,
    roughness: 0.08,
    metalness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  });
  const pondWater = new THREE.Mesh(new THREE.CircleGeometry(1.95, 32), waterMat);
  pondWater.rotation.x = -Math.PI / 2;
  pondWater.scale.set(1.2, 0.9, 1);
  pondWater.position.y = 0.04;
  pondWater.receiveShadow = true;
  pondGroup.add(pondWater);

  // Lily pads on pond
  const padMat = new THREE.MeshStandardMaterial({ color: 0x66bb6a, roughness: 0.7 });
  [
    [-0.6, 0.3, 0.28],
    [0.7, -0.4, 0.22],
  ].forEach(([lx, lz, lr]) => {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(lr, lr, 0.02, 16), padMat);
    pad.position.set(lx, 0.055, lz);
    pondGroup.add(pad);
  });

  // Blue flowers beside the shallow pond
  const blueBed = createFlowerBed(-2.7, -0.9, 0x42a5f5, 0xfff59d, 11, 1.25, false);
  scene.add(blueBed.group);
  flowerGroups.push(blueBed.group);

  // Orange flowers beside the picnic clearing (Scene 8)
  const orangeBed = createFlowerBed(3.6, -4.8, 0xff9800, 0xfff176, 11, 1.3, false);
  scene.add(orangeBed.group);
  flowerGroups.push(orangeBed.group);

  // Purple flowers beside the apple tree (Scene 10)
  const purpleBed = createFlowerBed(-3.4, -5.8, 0xab47bc, 0xfff59d, 11, 1.3, false);
  scene.add(purpleBed.group);
  flowerGroups.push(purpleBed.group);

  // Colorful border accent flowers around the dance patch (x=0, z=4.0)
  const borderColors = [0xef5350, 0xfdd835, 0x42a5f5, 0xff9800, 0xab47bc];
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2;
    if (Math.abs(ang - Math.PI * 0.5) < 0.6 || Math.abs(ang - Math.PI * 1.5) < 0.6) continue;
    const fl = createFlower(borderColors[i % borderColors.length], 0xfff59d, 0.9, i % 2 === 0);
    fl.position.set(Math.cos(ang) * 3.1, 0, 4.0 + Math.sin(ang) * 2.4);
    scene.add(fl);
  }

  // 6. Grand Apple Tree (x = 0.5, z = -8.4) shading the picnic clearing (z = -5.4)
  const treeGroup = new THREE.Group();
  treeGroup.position.set(0.5, 0, -8.4);
  scene.add(treeGroup);

  const barkMat = new THREE.MeshStandardMaterial({ color: 0x7b5438, roughness: 0.92 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.82, 3.6, 16), barkMat);
  trunk.position.y = 1.8;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  treeGroup.add(trunk);

  // Spreading branches
  const branchL = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 2.2, 12), barkMat);
  branchL.position.set(-0.9, 3.3, 0.2);
  branchL.rotation.z = 0.7;
  branchL.castShadow = true;
  const branchR = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 2.2, 12), barkMat);
  branchR.position.set(0.9, 3.4, 0.3);
  branchR.rotation.z = -0.65;
  branchR.castShadow = true;
  treeGroup.add(branchL, branchR);

  // Lush Green Leaf Canopy
  const canopyMat1 = new THREE.MeshStandardMaterial({ color: 0x5eb857, roughness: 0.82 });
  const canopyMat2 = new THREE.MeshStandardMaterial({ color: 0x74cb68, roughness: 0.8 });
  const canopySpecs: [number, number, number, number, boolean][] = [
    [0, 4.7, 0, 2.3, false],
    [-1.7, 4.1, 0.5, 1.75, true],
    [1.7, 4.2, 0.4, 1.8, false],
    [0.1, 4.3, 1.6, 1.85, true],
    [0.0, 5.7, 0.1, 1.65, true],
    [-0.9, 4.9, -1.1, 1.5, false],
    [1.0, 4.9, -1.0, 1.5, true],
  ];
  canopySpecs.forEach(([cx, cy, cz, cr, alt]) => {
    const blob = new THREE.Mesh(
      new THREE.SphereGeometry(cr, 18, 16),
      alt ? canopyMat2 : canopyMat1
    );
    blob.scale.set(1.12, 0.88, 1.08);
    blob.position.set(cx, cy, cz);
    blob.castShadow = true;
    blob.receiveShadow = true;
    treeGroup.add(blob);
  });

  // Bright Red Apples in the canopy
  const appleMat = new THREE.MeshStandardMaterial({ color: 0xe53935, roughness: 0.35 });
  const appleCoords: [number, number, number][] = [
    [-1.4, 3.7, 1.7],
    [1.1, 4.1, 1.9],
    [-0.3, 4.6, 2.2],
    [1.9, 3.6, 1.3],
    [-2.1, 3.5, 0.8],
  ];
  appleCoords.forEach(([ax, ay, az]) => {
    const apple = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), appleMat);
    apple.position.set(ax, ay, az);
    apple.castShadow = true;
    treeGroup.add(apple);
  });

  // 7. Recurring Props

  // A. Small Wicker Basket (with openable lid)
  const basket = new THREE.Group();
  const wickerMat = new THREE.MeshStandardMaterial({
    map: textures.wicker,
    roughness: 0.85,
  });
  const basketBody = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.26, 18), wickerMat);
  basketBody.position.y = 0.13;
  basketBody.castShadow = true;
  const basketRim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.03, 10, 20), wickerMat);
  basketRim.rotation.x = Math.PI / 2;
  basketRim.position.y = 0.26;
  const basketHandle = new THREE.Mesh(
    new THREE.TorusGeometry(0.27, 0.025, 10, 20, Math.PI),
    wickerMat
  );
  basketHandle.position.y = 0.26;

  const basketLid = new THREE.Group();
  basketLid.position.set(0, 0.26, -0.22);
  const lidMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.035, 18), wickerMat);
  lidMesh.position.set(0, 0.015, 0.22);
  basketLid.add(lidMesh);

  basket.add(basketBody, basketRim, basketHandle, basketLid);
  scene.add(basket);

  // B. Red-and-White Checkered Picnic Blanket (Folded vs Open)
  const blanketMat = new THREE.MeshStandardMaterial({
    map: textures.blanket,
    roughness: 0.88,
    side: THREE.DoubleSide,
  });
  const blanketFolded = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.09, 0.35), blanketMat);
  blanketFolded.position.set(-0.9, 0.05, -5.4);
  blanketFolded.castShadow = true;
  scene.add(blanketFolded);

  const blanketOpen = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 2.1), blanketMat);
  blanketOpen.rotation.x = -Math.PI / 2;
  blanketOpen.position.set(0, 0.025, -5.4);
  blanketOpen.receiveShadow = true;
  blanketOpen.visible = false;
  scene.add(blanketOpen);

  // C. Three Orange Cloth Napkins + Three Reusable Picnic Cups (Scene 8+)
  const napkinMat = new THREE.MeshStandardMaterial({ color: 0xffa726, roughness: 0.85 });
  const napkinPositions: [number, number][] = [
    [-0.75, -5.25],
    [0.0, -5.05],
    [0.75, -5.25],
  ];
  const napkins: THREE.Mesh[] = napkinPositions.map(([nx, nz]) => {
    const n = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.025, 0.32), napkinMat);
    n.position.set(nx, 0.04, nz);
    n.rotation.y = 0.12;
    n.castShadow = true;
    n.receiveShadow = true;
    n.visible = false;
    scene.add(n);
    return n;
  });

  const cupColors = [0xffd54f, 0x64b5f6, 0x81c784];
  const cupPositions: [number, number][] = [
    [-0.62, -5.0],
    [0.14, -4.8],
    [0.86, -5.0],
  ];
  const cups: THREE.Group[] = cupPositions.map(([cx, cz], idx) => {
    const cg = new THREE.Group();
    const cMat = new THREE.MeshStandardMaterial({
      color: cupColors[idx],
      roughness: 0.38,
      metalness: 0.05,
    });
    const cupBody = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.058, 0.16, 14), cMat);
    cupBody.position.y = 0.08;
    cupBody.castShadow = true;
    const cupRim = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 8, 16), cMat);
    cupRim.rotation.x = Math.PI / 2;
    cupRim.position.y = 0.16;
    cg.add(cupBody, cupRim);
    cg.position.set(cx, 0.03, cz);
    cg.visible = false;
    scene.add(cg);
    return cg;
  });

  // D. Watering Can (Scene 4)
  const wateringCan = new THREE.Group();
  const canMat = new THREE.MeshStandardMaterial({
    color: 0x4dd0e1,
    roughness: 0.38,
    metalness: 0.25,
  });
  const canBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.21, 0.32, 16), canMat);
  canBody.position.y = 0.16;
  canBody.castShadow = true;
  const canSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.32, 10), canMat);
  canSpout.position.set(0.22, 0.24, 0);
  canSpout.rotation.z = -0.85;
  const canRose = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.03, 0.06, 12), canMat);
  canRose.position.set(0.35, 0.34, 0);
  canRose.rotation.z = -0.85;
  const canHandle = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.025, 10, 18, Math.PI * 1.15),
    canMat
  );
  canHandle.position.set(-0.08, 0.28, 0);
  canHandle.rotation.z = 0.4;
  wateringCan.add(canBody, canSpout, canRose, canHandle);
  wateringCan.position.set(2.5, 0, 3.2);
  scene.add(wateringCan);

  // Water droplets for Scene 4
  const waterDrops = new THREE.Group();
  const dropMat = new THREE.MeshStandardMaterial({
    color: 0x81d4fa,
    roughness: 0.1,
    transparent: true,
    opacity: 0.85,
  });
  for (let i = 0; i < 8; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), dropMat);
    d.scale.set(0.8, 1.4, 0.8);
    waterDrops.add(d);
  }
  waterDrops.visible = false;
  scene.add(waterDrops);

  // E. Wooden Color Wheel with Six Colored Sections (beside the blanket)
  const colorWheel = new THREE.Group();
  colorWheel.position.set(-1.9, 0, -5.2);
  colorWheel.rotation.y = 0.32;
  scene.add(colorWheel);

  // Wooden Easel Stand
  const standL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.25, 0.08), woodMat);
  standL.position.set(-0.34, 0.6, -0.05);
  standL.rotation.z = -0.14;
  standL.rotation.x = 0.12;
  const standR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.25, 0.08), woodMat);
  standR.position.set(0.34, 0.6, -0.05);
  standR.rotation.z = 0.14;
  standR.rotation.x = 0.12;
  const standBack = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.08), woodMat);
  standBack.position.set(0, 0.56, -0.32);
  standBack.rotation.x = -0.35;
  colorWheel.add(standL, standR, standBack);

  const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.05, 12, 32), woodMat);
  wheelRim.position.set(0, 0.86, 0.04);
  wheelRim.castShadow = true;
  colorWheel.add(wheelRim);

  // Six colored sections in exact lyric order: Red, Yellow, Blue, Green, Orange, Purple
  const segmentColors = [0xef5350, 0xfdd835, 0x42a5f5, 0x66bb6a, 0xff9800, 0xab47bc];
  const wheelSegmentMats: THREE.MeshStandardMaterial[] = [];
  const sliceAngle = (Math.PI * 2) / 6;
  for (let i = 0; i < 6; i++) {
    const segMat = new THREE.MeshStandardMaterial({
      color: segmentColors[i],
      emissive: segmentColors[i],
      emissiveIntensity: 0.0,
      roughness: 0.55,
    });
    wheelSegmentMats.push(segMat);

    // Start from top-left clockwise for clean reading
    const thetaStart = Math.PI / 2 - i * sliceAngle;
    const segGeo = new THREE.CircleGeometry(0.51, 16, thetaStart - sliceAngle, sliceAngle - 0.03);
    const segMesh = new THREE.Mesh(segGeo, segMat);
    segMesh.position.set(0, 0.86, 0.05);
    colorWheel.add(segMesh);
  }

  const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 16), woodMat);
  wheelHub.rotation.x = Math.PI / 2;
  wheelHub.position.set(0, 0.86, 0.05);
  colorWheel.add(wheelHub);

  return {
    gateDoor,
    gatePostPos,
    basket,
    basketLid,
    blanketFolded,
    blanketOpen,
    napkins,
    cups,
    wateringCan,
    waterDrops,
    colorWheel,
    wheelSegmentMats,
    redFlowerTargets: redBed.flowerPositions,
    yellowFlowerCluster: yellowBed.group,
    purpleFlowerAnchor: new THREE.Vector3(-3.4, 0.45, -5.8),
    clouds,
    pondWater,
    flowerGroups,
  };
}
