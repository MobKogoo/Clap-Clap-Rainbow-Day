import * as THREE from 'three';

export interface BellaRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  head: THREE.Group;
  earL: THREE.Group;
  earR: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  mouth: THREE.Mesh;
  eyelidL: THREE.Mesh;
  eyelidR: THREE.Mesh;
  handAnchorR: THREE.Object3D;
  handAnchorL: THREE.Object3D;
}

export interface MiloRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  head: THREE.Group;
  earL: THREE.Group;
  earR: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  tail: THREE.Group;
  mouth: THREE.Mesh;
  eyelidL: THREE.Mesh;
  eyelidR: THREE.Mesh;
  handAnchorR: THREE.Object3D;
  handAnchorL: THREE.Object3D;
}

export interface PipRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  head: THREE.Group;
  wingL: THREE.Group;
  wingR: THREE.Group;
  beakBottom: THREE.Mesh;
  tail: THREE.Mesh;
}

export interface LadybugRig {
  root: THREE.Group;
  wingCoverL: THREE.Group;
  wingCoverR: THREE.Group;
  innerWingL: THREE.Mesh;
  innerWingR: THREE.Mesh;
}

export interface ButterflyRig {
  root: THREE.Group;
  wingL: THREE.Group;
  wingR: THREE.Group;
}

function addShadowCircle(parent: THREE.Group, shadowTex: THREE.Texture, radius: number): void {
  const mat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.55,
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), mat);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = 0.015;
  parent.add(plane);
}

function enableShadows(group: THREE.Object3D): void {
  group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
}

export function createBella(shadowTex: THREE.Texture): BellaRig {
  const root = new THREE.Group();
  addShadowCircle(root, shadowTex, 0.44);

  const creamMat = new THREE.MeshStandardMaterial({ color: 0xfaf0dc, roughness: 0.82, metalness: 0.0 });
  const dressMat = new THREE.MeshStandardMaterial({ color: 0xffd54f, roughness: 0.68, metalness: 0.02 });
  const pocketMat = new THREE.MeshStandardMaterial({ color: 0xffb300, roughness: 0.72, metalness: 0.02 });
  const pinkMat = new THREE.MeshStandardMaterial({ color: 0xf48fb1, roughness: 0.65 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.25 });
  const glossMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0xd85b7a, roughness: 0.55 });

  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.32;
  root.add(bodyGroup);

  // Legs (pivoted at hip)
  const legGeo = new THREE.CapsuleGeometry(0.08, 0.14, 8, 12);
  const footGeo = new THREE.SphereGeometry(0.11, 14, 12);

  const legL = new THREE.Group();
  legL.position.set(-0.14, 0.02, 0);
  const legMeshL = new THREE.Mesh(legGeo, creamMat);
  legMeshL.position.y = -0.11;
  const footL = new THREE.Mesh(footGeo, creamMat);
  footL.scale.set(1.0, 0.65, 1.35);
  footL.position.set(0, -0.25, 0.05);
  legL.add(legMeshL, footL);

  const legR = new THREE.Group();
  legR.position.set(0.14, 0.02, 0);
  const legMeshR = new THREE.Mesh(legGeo, creamMat);
  legMeshR.position.y = -0.11;
  const footR = new THREE.Mesh(footGeo, creamMat);
  footR.scale.set(1.0, 0.65, 1.35);
  footR.position.set(0, -0.25, 0.05);
  legR.add(legMeshR, footR);
  bodyGroup.add(legL, legR);

  // Overall Dress Skirt + Bib + Straps + One Front Pocket
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 0.36, 20), dressMat);
  skirt.position.y = 0.18;
  bodyGroup.add(skirt);

  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.23, 18, 16), creamMat);
  torso.scale.set(1, 1.15, 0.92);
  torso.position.y = 0.42;
  bodyGroup.add(torso);

  const bib = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.08), dressMat);
  bib.position.set(0, 0.42, 0.17);
  bodyGroup.add(bib);

  // One front pocket on the yellow overall dress
  const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.04), pocketMat);
  pocket.position.set(0, 0.38, 0.215);
  bodyGroup.add(pocket);

  // Shoulder straps
  const strapGeo = new THREE.BoxGeometry(0.055, 0.24, 0.22);
  const strapL = new THREE.Mesh(strapGeo, dressMat);
  strapL.position.set(-0.11, 0.52, 0.05);
  strapL.rotation.x = 0.15;
  const strapR = new THREE.Mesh(strapGeo, dressMat);
  strapR.position.set(0.11, 0.52, 0.05);
  strapR.rotation.x = 0.15;
  bodyGroup.add(strapL, strapR);

  // Cute fluffy bunny tail
  const bunnyTail = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), creamMat);
  bunnyTail.position.set(0, 0.18, -0.3);
  bodyGroup.add(bunnyTail);

  // Arms
  const armGeo = new THREE.CapsuleGeometry(0.068, 0.22, 8, 12);
  const armL = new THREE.Group();
  armL.position.set(-0.25, 0.5, 0.02);
  const armMeshL = new THREE.Mesh(armGeo, creamMat);
  armMeshL.position.y = -0.14;
  armL.add(armMeshL);
  const handAnchorL = new THREE.Object3D();
  handAnchorL.position.set(0, -0.26, 0.05);
  armL.add(handAnchorL);

  const armR = new THREE.Group();
  armR.position.set(0.25, 0.5, 0.02);
  const armMeshR = new THREE.Mesh(armGeo, creamMat);
  armMeshR.position.y = -0.14;
  armR.add(armMeshR);
  const handAnchorR = new THREE.Object3D();
  handAnchorR.position.set(0, -0.26, 0.05);
  armR.add(handAnchorR);
  bodyGroup.add(armL, armR);

  // Head
  const head = new THREE.Group();
  head.position.set(0, 0.72, 0.02);
  bodyGroup.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.28, 22, 20), creamMat);
  skull.scale.set(1.06, 0.96, 0.98);
  skull.position.y = 0.2;
  head.add(skull);

  // Soft cheeks
  const cheekGeo = new THREE.SphereGeometry(0.065, 12, 10);
  const cheekMat = new THREE.MeshStandardMaterial({ color: 0xf8bbd0, roughness: 0.85 });
  const cheekL = new THREE.Mesh(cheekGeo, cheekMat);
  cheekL.scale.set(1.2, 0.7, 0.5);
  cheekL.position.set(-0.17, 0.14, 0.22);
  const cheekR = new THREE.Mesh(cheekGeo, cheekMat);
  cheekR.scale.set(1.2, 0.7, 0.5);
  cheekR.position.set(0.17, 0.14, 0.22);
  head.add(cheekL, cheekR);

  // Pink nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 10), pinkMat);
  nose.scale.set(1.2, 0.9, 0.9);
  nose.position.set(0, 0.18, 0.275);
  head.add(nose);

  // Round brown eyes + catchlights + eyelids
  const eyeGeo = new THREE.SphereGeometry(0.044, 14, 12);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.105, 0.24, 0.245);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.105, 0.24, 0.245);

  const catchGeo = new THREE.SphereGeometry(0.014, 8, 8);
  const catchL = new THREE.Mesh(catchGeo, glossMat);
  catchL.position.set(-0.09, 0.258, 0.282);
  const catchR = new THREE.Mesh(catchGeo, glossMat);
  catchR.position.set(0.12, 0.258, 0.282);

  const lidGeo = new THREE.SphereGeometry(0.048, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.52);
  const eyelidL = new THREE.Mesh(lidGeo, creamMat);
  eyelidL.position.copy(eyeL.position);
  eyelidL.rotation.x = -Math.PI * 0.45;
  const eyelidR = new THREE.Mesh(lidGeo, creamMat);
  eyelidR.position.copy(eyeR.position);
  eyelidR.rotation.x = -Math.PI * 0.45;

  head.add(eyeL, eyeR, catchL, catchR, eyelidL, eyelidR);

  // Singing Mouth
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 10), mouthMat);
  mouth.scale.set(1.2, 0.25, 0.5);
  mouth.position.set(0, 0.105, 0.262);
  head.add(mouth);

  // Long Floppy Ears
  const earOuterGeo = new THREE.CapsuleGeometry(0.075, 0.34, 8, 14);
  const earInnerGeo = new THREE.CapsuleGeometry(0.045, 0.26, 6, 10);

  const earL = new THREE.Group();
  earL.position.set(-0.14, 0.44, -0.02);
  const earOutL = new THREE.Mesh(earOuterGeo, creamMat);
  earOutL.position.y = 0.22;
  const earInL = new THREE.Mesh(earInnerGeo, pinkMat);
  earInL.position.set(0, 0.21, 0.036);
  earL.add(earOutL, earInL);
  earL.rotation.z = 0.24;
  earL.rotation.x = 0.14;

  const earR = new THREE.Group();
  earR.position.set(0.14, 0.44, -0.02);
  const earOutR = new THREE.Mesh(earOuterGeo, creamMat);
  earOutR.position.y = 0.22;
  const earInR = new THREE.Mesh(earInnerGeo, pinkMat);
  earInR.position.set(0, 0.21, 0.036);
  earR.add(earOutR, earInR);
  earR.rotation.z = -0.24;
  earR.rotation.x = 0.14;

  head.add(earL, earR);

  enableShadows(bodyGroup);
  return {
    root,
    bodyGroup,
    head,
    earL,
    earR,
    armL,
    armR,
    legL,
    legR,
    mouth,
    eyelidL,
    eyelidR,
    handAnchorR,
    handAnchorL,
  };
}

export function createMilo(shadowTex: THREE.Texture): MiloRig {
  const root = new THREE.Group();
  addShadowCircle(root, shadowTex, 0.44);

  const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf48444, roughness: 0.8 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xfff3e0, roughness: 0.82 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x64b5f6, roughness: 0.72 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.3 });
  const glossMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0xc84b62, roughness: 0.55 });

  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.32;
  root.add(bodyGroup);

  // Legs
  const legGeo = new THREE.CapsuleGeometry(0.078, 0.15, 8, 12);
  const footGeo = new THREE.SphereGeometry(0.105, 14, 12);

  const legL = new THREE.Group();
  legL.position.set(-0.13, 0.02, 0);
  const legMeshL = new THREE.Mesh(legGeo, orangeMat);
  legMeshL.position.y = -0.11;
  const footL = new THREE.Mesh(footGeo, darkMat);
  footL.scale.set(1.0, 0.65, 1.35);
  footL.position.set(0, -0.25, 0.05);
  legL.add(legMeshL, footL);

  const legR = new THREE.Group();
  legR.position.set(0.13, 0.02, 0);
  const legMeshR = new THREE.Mesh(legGeo, orangeMat);
  legMeshR.position.y = -0.11;
  const footR = new THREE.Mesh(footGeo, darkMat);
  footR.scale.set(1.0, 0.65, 1.35);
  footR.position.set(0, -0.25, 0.05);
  legR.add(legMeshR, footR);
  bodyGroup.add(legL, legR);

  // Shorts / lower torso
  const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 14), orangeMat);
  pelvis.scale.set(1, 0.9, 0.95);
  pelvis.position.y = 0.14;
  bodyGroup.add(pelvis);

  // Sky-blue T-shirt torso + collar
  const shirt = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.38, 18), shirtMat);
  shirt.position.y = 0.38;
  bodyGroup.add(shirt);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 10, 18), shirtMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.56;
  bodyGroup.add(collar);

  // Fluffy orange tail with cream tail tip
  const tail = new THREE.Group();
  tail.position.set(0, 0.16, -0.2);
  const tailBase = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.34, 8, 14), orangeMat);
  tailBase.rotation.x = -0.95;
  tailBase.position.set(0, 0.14, -0.2);
  const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.115, 14, 12), creamMat);
  tailTip.position.set(0, 0.27, -0.37);
  tail.add(tailBase, tailTip);
  bodyGroup.add(tail);

  // Arms with sky-blue short sleeves
  const sleeveGeo = new THREE.CylinderGeometry(0.085, 0.095, 0.14, 12);
  const armGeo = new THREE.CapsuleGeometry(0.065, 0.2, 8, 12);

  const armL = new THREE.Group();
  armL.position.set(-0.25, 0.5, 0.02);
  const sleeveL = new THREE.Mesh(sleeveGeo, shirtMat);
  sleeveL.position.y = -0.04;
  const armMeshL = new THREE.Mesh(armGeo, orangeMat);
  armMeshL.position.y = -0.15;
  armL.add(sleeveL, armMeshL);
  const handAnchorL = new THREE.Object3D();
  handAnchorL.position.set(0, -0.26, 0.05);
  armL.add(handAnchorL);

  const armR = new THREE.Group();
  armR.position.set(0.25, 0.5, 0.02);
  const sleeveR = new THREE.Mesh(sleeveGeo, shirtMat);
  sleeveR.position.y = -0.04;
  const armMeshR = new THREE.Mesh(armGeo, orangeMat);
  armMeshR.position.y = -0.15;
  armR.add(sleeveR, armMeshR);
  const handAnchorR = new THREE.Object3D();
  handAnchorR.position.set(0, -0.26, 0.05);
  armR.add(handAnchorR);
  bodyGroup.add(armL, armR);

  // Fox Head
  const head = new THREE.Group();
  head.position.set(0, 0.72, 0.02);
  bodyGroup.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.27, 22, 20), orangeMat);
  skull.scale.set(1.12, 0.94, 0.98);
  skull.position.y = 0.2;
  head.add(skull);

  // Cream muzzle & cheeks
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 14), creamMat);
  muzzle.scale.set(1.15, 0.85, 1.05);
  muzzle.position.set(0, 0.13, 0.21);
  head.add(muzzle);

  const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), creamMat);
  cheekL.scale.set(1.1, 0.65, 0.7);
  cheekL.position.set(-0.18, 0.12, 0.12);
  const cheekR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), creamMat);
  cheekR.scale.set(1.1, 0.65, 0.7);
  cheekR.position.set(0.18, 0.12, 0.12);
  head.add(cheekL, cheekR);

  // Fox nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), darkMat);
  nose.scale.set(1.15, 0.85, 0.9);
  nose.position.set(0, 0.165, 0.34);
  head.add(nose);

  // Round brown eyes + catchlights + eyelids
  const eyeGeo = new THREE.SphereGeometry(0.042, 14, 12);
  const eyeL = new THREE.Mesh(eyeGeo, darkMat);
  eyeL.position.set(-0.11, 0.24, 0.24);
  const eyeR = new THREE.Mesh(eyeGeo, darkMat);
  eyeR.position.set(0.11, 0.24, 0.24);

  const catchGeo = new THREE.SphereGeometry(0.013, 8, 8);
  const catchL = new THREE.Mesh(catchGeo, glossMat);
  catchL.position.set(-0.096, 0.256, 0.275);
  const catchR = new THREE.Mesh(catchGeo, glossMat);
  catchR.position.set(0.124, 0.256, 0.275);

  const lidGeo = new THREE.SphereGeometry(0.046, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.52);
  const eyelidL = new THREE.Mesh(lidGeo, orangeMat);
  eyelidL.position.copy(eyeL.position);
  eyelidL.rotation.x = -Math.PI * 0.45;
  const eyelidR = new THREE.Mesh(lidGeo, orangeMat);
  eyelidR.position.copy(eyeR.position);
  eyelidR.rotation.x = -Math.PI * 0.45;
  head.add(eyeL, eyeR, catchL, catchR, eyelidL, eyelidR);

  // Singing mouth
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 10), mouthMat);
  mouth.scale.set(1.15, 0.25, 0.5);
  mouth.position.set(0, 0.085, 0.305);
  head.add(mouth);

  // Pointed Fox Ears
  const earConeGeo = new THREE.ConeGeometry(0.105, 0.24, 14);
  const earInGeo = new THREE.ConeGeometry(0.06, 0.16, 12);

  const earL = new THREE.Group();
  earL.position.set(-0.18, 0.41, 0.0);
  const earOutL = new THREE.Mesh(earConeGeo, orangeMat);
  earOutL.position.y = 0.08;
  const earInL = new THREE.Mesh(earInGeo, creamMat);
  earInL.position.set(0, 0.07, 0.035);
  earL.add(earOutL, earInL);
  earL.rotation.z = 0.34;

  const earR = new THREE.Group();
  earR.position.set(0.18, 0.41, 0.0);
  const earOutR = new THREE.Mesh(earConeGeo, orangeMat);
  earOutR.position.y = 0.08;
  const earInR = new THREE.Mesh(earInGeo, creamMat);
  earInR.position.set(0, 0.07, 0.035);
  earR.add(earOutR, earInR);
  earR.rotation.z = -0.34;
  head.add(earL, earR);

  enableShadows(bodyGroup);
  return {
    root,
    bodyGroup,
    head,
    earL,
    earR,
    armL,
    armR,
    legL,
    legR,
    tail,
    mouth,
    eyelidL,
    eyelidR,
    handAnchorR,
    handAnchorL,
  };
}

export function createPip(shadowTex: THREE.Texture): PipRig {
  const root = new THREE.Group();
  addShadowCircle(root, shadowTex, 0.2);

  const blueMat = new THREE.MeshStandardMaterial({ color: 0x4fc3f7, roughness: 0.65 });
  const paleBellyMat = new THREE.MeshStandardMaterial({ color: 0xe1f5fe, roughness: 0.72 });
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xffca28, roughness: 0.45 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.2 });
  const glossMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.14;
  root.add(bodyGroup);

  // Tiny legs
  const legGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.09, 8);
  const pLegL = new THREE.Mesh(legGeo, beakMat);
  pLegL.position.set(-0.045, -0.09, 0);
  const pLegR = new THREE.Mesh(legGeo, beakMat);
  pLegR.position.set(0.045, -0.09, 0);
  bodyGroup.add(pLegL, pLegR);

  // Round body
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 16), blueMat);
  body.scale.set(1.0, 1.05, 1.08);
  bodyGroup.add(body);

  // Pale-blue belly
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.115, 14, 12), paleBellyMat);
  belly.position.set(0, -0.015, 0.055);
  bodyGroup.add(belly);

  // Head
  const head = new THREE.Group();
  head.position.set(0, 0.14, 0.03);
  bodyGroup.add(head);

  const headSphere = new THREE.Mesh(new THREE.SphereGeometry(0.105, 16, 14), blueMat);
  head.add(headSphere);

  // Short feather tuft
  const tuft1 = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.075, 10), blueMat);
  tuft1.position.set(0, 0.115, -0.01);
  tuft1.rotation.x = -0.25;
  const tuft2 = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.055, 10), blueMat);
  tuft2.position.set(-0.02, 0.105, -0.03);
  tuft2.rotation.x = -0.45;
  head.add(tuft1, tuft2);

  // Eyes
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), eyeMat);
  eyeL.position.set(-0.052, 0.025, 0.082);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), eyeMat);
  eyeR.position.set(0.052, 0.025, 0.082);
  const cL = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), glossMat);
  cL.position.set(-0.046, 0.034, 0.102);
  const cR = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), glossMat);
  cR.position.set(0.058, 0.034, 0.102);
  head.add(eyeL, eyeR, cL, cR);

  // Small yellow beak (upper + lower)
  const beakTop = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.075, 10), beakMat);
  beakTop.rotation.x = Math.PI / 2;
  beakTop.position.set(0, 0.005, 0.125);
  const beakBottom = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.06, 10), beakMat);
  beakBottom.rotation.x = Math.PI / 2 + 0.15;
  beakBottom.position.set(0, -0.012, 0.115);
  head.add(beakTop, beakBottom);

  // Wings
  const wingGeo = new THREE.SphereGeometry(0.08, 12, 10);
  const wingL = new THREE.Group();
  wingL.position.set(-0.13, 0.02, 0);
  const wMeshL = new THREE.Mesh(wingGeo, blueMat);
  wMeshL.scale.set(0.42, 0.9, 1.35);
  wMeshL.position.set(-0.02, -0.03, -0.02);
  wingL.add(wMeshL);

  const wingR = new THREE.Group();
  wingR.position.set(0.13, 0.02, 0);
  const wMeshR = new THREE.Mesh(wingGeo, blueMat);
  wMeshR.scale.set(0.42, 0.9, 1.35);
  wMeshR.position.set(0.02, -0.03, -0.02);
  wingR.add(wMeshR);
  bodyGroup.add(wingL, wingR);

  // Tail
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 10), blueMat);
  tail.rotation.x = -Math.PI * 0.65;
  tail.position.set(0, -0.02, -0.15);
  bodyGroup.add(tail);

  enableShadows(bodyGroup);
  return { root, bodyGroup, head, wingL, wingR, beakBottom, tail };
}

export function createLadybug(): LadybugRig {
  const root = new THREE.Group();
  const redMat = new THREE.MeshStandardMaterial({ color: 0xef5350, roughness: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.4 });
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xfff8e1,
    transparent: true,
    opacity: 0.72,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 12), darkMat);
  body.scale.set(1.0, 0.65, 1.25);
  root.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), darkMat);
  head.position.set(0, 0.015, 0.075);
  root.add(head);

  const halfShellGeo = new THREE.SphereGeometry(0.078, 14, 12, 0, Math.PI, 0, Math.PI * 0.55);
  const spotGeo = new THREE.SphereGeometry(0.016, 8, 8);

  const wingCoverL = new THREE.Group();
  wingCoverL.position.set(0, 0.015, 0.03);
  const shellL = new THREE.Mesh(halfShellGeo, redMat);
  shellL.rotation.y = Math.PI / 2;
  const spotL1 = new THREE.Mesh(spotGeo, darkMat);
  spotL1.position.set(-0.045, 0.048, -0.015);
  const spotL2 = new THREE.Mesh(spotGeo, darkMat);
  spotL2.position.set(-0.035, 0.038, -0.055);
  wingCoverL.add(shellL, spotL1, spotL2);

  const wingCoverR = new THREE.Group();
  wingCoverR.position.set(0, 0.015, 0.03);
  const shellR = new THREE.Mesh(halfShellGeo, redMat);
  shellR.rotation.y = -Math.PI / 2;
  const spotR1 = new THREE.Mesh(spotGeo, darkMat);
  spotR1.position.set(0.045, 0.048, -0.015);
  const spotR2 = new THREE.Mesh(spotGeo, darkMat);
  spotR2.position.set(0.035, 0.038, -0.055);
  wingCoverR.add(shellR, spotR1, spotR2);

  const innerGeo = new THREE.PlaneGeometry(0.09, 0.12);
  const innerWingL = new THREE.Mesh(innerGeo, wingMat);
  innerWingL.rotation.x = -Math.PI / 2;
  innerWingL.position.set(-0.05, 0.04, -0.02);
  innerWingL.visible = false;

  const innerWingR = new THREE.Mesh(innerGeo, wingMat);
  innerWingR.rotation.x = -Math.PI / 2;
  innerWingR.position.set(0.05, 0.04, -0.02);
  innerWingR.visible = false;

  root.add(wingCoverL, wingCoverR, innerWingL, innerWingR);
  return { root, wingCoverL, wingCoverR, innerWingL, innerWingR };
}

export function createButterfly(colorHex: number, accentHex: number): ButterflyRig {
  const root = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.6 });
  const wingMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.45,
    side: THREE.DoubleSide,
  });
  const spotMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    roughness: 0.45,
    side: THREE.DoubleSide,
  });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, 0.09, 6, 8), bodyMat);
  body.rotation.x = Math.PI / 2;
  root.add(body);

  const makeWing = (sign: number) => {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.CircleGeometry(0.085, 14), wingMat);
    top.rotation.x = -Math.PI / 2;
    top.scale.set(1.15, 1.0, 1.0);
    top.position.set(sign * 0.08, 0, 0.035);

    const bot = new THREE.Mesh(new THREE.CircleGeometry(0.06, 12), wingMat);
    bot.rotation.x = -Math.PI / 2;
    bot.position.set(sign * 0.06, 0, -0.045);

    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.026, 10), spotMat);
    dot.rotation.x = -Math.PI / 2;
    dot.position.set(sign * 0.09, 0.002, 0.035);

    g.add(top, bot, dot);
    return g;
  };

  const wingL = makeWing(-1);
  const wingR = makeWing(1);
  root.add(wingL, wingR);

  return { root, wingL, wingR };
}
