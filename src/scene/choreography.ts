import * as THREE from 'three';
import {
  getColorWheelHighlightIndex,
  getSingingMouthWeight,
} from '../data/scriptData';
import {
  BellaRig,
  ButterflyRig,
  MiloRig,
  PipRig,
  LadybugRig,
} from './characters';
import { GardenProps } from './garden';

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp01(t);
}

/** Shared chorus choreography over local scene time 0..8s */
function applyChorusDance(
  localT: number,
  bella: BellaRig,
  milo: MiloRig,
  pip: PipRig,
  baseXBella: number,
  baseXMilo: number,
  baseZ: number
): void {
  // 0..2s: "Clap, clap, one, two, three!" -> 3 gentle claps at 0s, 0.375s, 0.75s..1.4s
  if (localT < 2.0) {
    const clapPulse =
      Math.exp(-Math.pow((localT - 0.15) * 9, 2)) +
      Math.exp(-Math.pow((localT - 0.52) * 9, 2)) +
      Math.exp(-Math.pow((localT - 0.92) * 9, 2));
    const clapAmt = Math.min(1, clapPulse);

    // Bring arms forward & inward to clap
    bella.armL.rotation.set(-0.95, 0, 0.55 - clapAmt * 0.48);
    bella.armR.rotation.set(-0.95, 0, -0.55 + clapAmt * 0.48);
    milo.armL.rotation.set(-0.95, 0, 0.55 - clapAmt * 0.48);
    milo.armR.rotation.set(-0.95, 0, -0.55 + clapAmt * 0.48);

    // Pip taps wingtips together cheerfully
    pip.wingL.rotation.z = -0.35 + clapAmt * 0.55;
    pip.wingR.rotation.z = 0.35 - clapAmt * 0.55;

    const hop = Math.abs(Math.sin(localT * Math.PI * 2)) * 0.05;
    bella.root.position.set(baseXBella, hop, baseZ);
    milo.root.position.set(baseXMilo, hop, baseZ);
    pip.root.position.set((baseXBella + baseXMilo) * 0.5, 0.95 + hop * 1.4, baseZ + 0.1);
  }
  // 2..4s: "Colors shine for you and me." -> point outward to surrounding colors
  else if (localT < 4.0) {
    const p = smoothstep(2.0, 2.5, localT) * (1 - smoothstep(3.6, 4.0, localT));
    bella.armL.rotation.set(-0.8 * p, 0, 0.95 * p + 0.15);
    bella.armR.rotation.set(-0.5 * p, 0, -0.25);
    milo.armR.rotation.set(-0.8 * p, 0, -0.95 * p - 0.15);
    milo.armL.rotation.set(-0.5 * p, 0, 0.25);

    bella.head.rotation.y = -0.25 * p;
    milo.head.rotation.y = 0.25 * p;
    pip.wingL.rotation.z = -0.6 * p;
    pip.wingR.rotation.z = 0.6 * p;

    bella.root.position.set(baseXBella, 0, baseZ);
    milo.root.position.set(baseXMilo, 0, baseZ);
    pip.root.position.set((baseXBella + baseXMilo) * 0.5, 0.98 + Math.sin(localT * 4) * 0.06, baseZ + 0.1);
  }
  // 4..6s: "Step, step, side to side," -> gentle step left then right
  else if (localT < 6.0) {
    const stepOsc = Math.sin((localT - 4.0) * Math.PI);
    const offset = stepOsc * 0.32;
    const stepLift = Math.abs(Math.sin((localT - 4.0) * Math.PI * 2)) * 0.08;

    bella.root.position.set(baseXBella + offset, stepLift, baseZ);
    milo.root.position.set(baseXMilo + offset, stepLift, baseZ);
    pip.root.position.set((baseXBella + baseXMilo) * 0.5 + offset, 0.98 + stepLift * 1.3, baseZ + 0.1);

    bella.legL.rotation.x = Math.sin((localT - 4.0) * Math.PI * 2) * 0.28;
    bella.legR.rotation.x = -bella.legL.rotation.x;
    milo.legL.rotation.x = bella.legL.rotation.x;
    milo.legR.rotation.x = bella.legR.rotation.x;

    bella.armL.rotation.set(-0.3, 0, 0.35);
    bella.armR.rotation.set(-0.3, 0, -0.35);
    milo.armL.rotation.set(-0.3, 0, 0.35);
    milo.armR.rotation.set(-0.3, 0, -0.35);
  }
  // 6..8s: "Friends together, smiles so wide!" -> happy sway & look at one another
  else if (localT < 8.0) {
    const s = smoothstep(6.0, 6.5, localT);
    const sway = Math.sin((localT - 6.0) * Math.PI * 2) * 0.06;
    bella.root.position.set(baseXBella, Math.abs(sway), baseZ);
    milo.root.position.set(baseXMilo, Math.abs(sway), baseZ);
    pip.root.position.set((baseXBella + baseXMilo) * 0.5, 0.96 + Math.abs(sway) * 1.5, baseZ + 0.1);

    bella.head.rotation.y = 0.28 * s;
    milo.head.rotation.y = -0.28 * s;
    bella.armL.rotation.set(-0.4, 0, 0.55);
    bella.armR.rotation.set(-0.85, 0, -0.4);
    milo.armL.rotation.set(-0.85, 0, 0.4);
    milo.armR.rotation.set(-0.4, 0, -0.55);
    pip.wingL.rotation.z = -0.45 * Math.sin(localT * 6);
    pip.wingR.rotation.z = -pip.wingL.rotation.z;
  } else {
    // 8..12s instrumental bounce
    const bounce = Math.abs(Math.sin(localT * Math.PI * 2)) * 0.04;
    bella.root.position.set(baseXBella, bounce, baseZ);
    milo.root.position.set(baseXMilo, bounce, baseZ);
    pip.root.position.set((baseXBella + baseXMilo) * 0.5, 0.95 + bounce, baseZ + 0.1);
    bella.armL.rotation.set(0, 0, 0.25);
    bella.armR.rotation.set(0, 0, -0.25);
    milo.armL.rotation.set(0, 0, 0.25);
    milo.armR.rotation.set(0, 0, -0.25);
  }
}

export function applyTimelineToWorld(
  t: number,
  bella: BellaRig,
  milo: MiloRig,
  pip: PipRig,
  ladybug: LadybugRig,
  blueButterfly: ButterflyRig,
  purpleButterfly: ButterflyRig,
  garden: GardenProps,
  camPos: THREE.Vector3,
  camTarget: THREE.Vector3
): void {
  // Reset character defaults cleanly every frame before scene pose
  const resetPose = () => {
    bella.root.rotation.set(0, 0, 0);
    bella.bodyGroup.position.set(0, 0.32, 0);
    bella.bodyGroup.rotation.set(0, 0, 0);
    bella.head.rotation.set(0, 0, 0);
    bella.armL.rotation.set(0, 0, 0.18);
    bella.armR.rotation.set(0, 0, -0.18);
    bella.legL.rotation.set(0, 0, 0);
    bella.legR.rotation.set(0, 0, 0);

    milo.root.rotation.set(0, 0, 0);
    milo.bodyGroup.position.set(0, 0.32, 0);
    milo.bodyGroup.rotation.set(0, 0, 0);
    milo.head.rotation.set(0, 0, 0);
    milo.armL.rotation.set(0, 0, 0.18);
    milo.armR.rotation.set(0, 0, -0.18);
    milo.legL.rotation.set(0, 0, 0);
    milo.legR.rotation.set(0, 0, 0);
    milo.tail.rotation.y = Math.sin(t * 5.0) * 0.28;

    pip.root.rotation.set(0, 0, 0);
    pip.bodyGroup.rotation.set(0, 0, 0);
    pip.head.rotation.set(0, 0, 0);
    pip.wingL.rotation.set(0, 0, -0.12);
    pip.wingR.rotation.set(0, 0, 0.12);
  };
  resetPose();

  // Ambient natural motion: clouds, flowers, floppy ears, eyelids, singing mouths
  garden.clouds.forEach((c, idx) => {
    c.position.x += Math.sin(t * 0.05 + idx) * 0.002;
  });
  garden.flowerGroups.forEach((fg, idx) => {
    fg.rotation.z = Math.sin(t * 1.4 + idx) * 0.015;
  });

  // Gentle blinking every ~3.4s
  const blinkCycle = (t * 0.31) % 1;
  const blinkAmt = blinkCycle > 0.94 ? Math.sin(((blinkCycle - 0.94) / 0.06) * Math.PI) : 0;
  bella.eyelidL.rotation.x = lerp(-Math.PI * 0.45, 0.05, blinkAmt);
  bella.eyelidR.rotation.x = bella.eyelidL.rotation.x;
  milo.eyelidL.rotation.x = bella.eyelidL.rotation.x;
  milo.eyelidR.rotation.x = bella.eyelidL.rotation.x;

  // Singing mouth sync
  const mouthOpen = getSingingMouthWeight(t);
  bella.mouth.scale.set(1.15, 0.28 + mouthOpen * 0.95, 0.6);
  milo.mouth.scale.set(1.1, 0.25 + mouthOpen * 0.72, 0.55);
  pip.beakBottom.rotation.x = Math.PI / 2 + 0.12 + mouthOpen * 0.38;

  // Soft floppy bunny ear bounce
  bella.earL.rotation.z = 0.24 + Math.sin(t * 4.2) * 0.06;
  bella.earR.rotation.z = -0.24 - Math.sin(t * 4.2 + 0.4) * 0.06;

  // Default prop visibility & states
  garden.gateDoor.rotation.y = t < 2.2 ? lerp(0, -1.25, smoothstep(0.3, 2.0, t)) : -1.25;
  garden.basketLid.rotation.x = 0;
  garden.waterDrops.visible = false;
  garden.wateringCan.position.set(2.5, 0, 3.2);
  garden.wateringCan.rotation.set(0, 0.4, 0);

  // Blanket state: folded until Scene 7 (76s), then open!
  const blanketIsOpen = t >= 76.5;
  garden.blanketFolded.visible = !blanketIsOpen;
  garden.blanketOpen.visible = blanketIsOpen;
  if (t >= 76.0 && t < 79.0) {
    const unfold = smoothstep(76.5, 79.0, t);
    garden.blanketOpen.scale.set(lerp(0.25, 1, unfold), lerp(0.25, 1, unfold), 1);
  } else {
    garden.blanketOpen.scale.set(1, 1, 1);
  }

  // Napkins & Cups visibility (Scene 8+)
  garden.napkins[0].visible = t >= 86.1;
  garden.napkins[1].visible = t >= 86.8;
  garden.napkins[2].visible = t >= 87.5;
  garden.cups[0].visible = t >= 89.0;
  garden.cups[1].visible = t >= 90.2;
  garden.cups[2].visible = t >= 91.2;

  // Color Wheel soft highlight (Scene 11)
  const wheelHighlight = getColorWheelHighlightIndex(t);
  garden.wheelSegmentMats.forEach((mat, idx) => {
    mat.emissiveIntensity = idx === wheelHighlight ? 0.58 : 0.0;
  });

  // Ladybug default resting on red flower 0
  const r0 = garden.redFlowerTargets[0] || new THREE.Vector3(-3.6, 0.42, 6.4);
  const r1 = garden.redFlowerTargets[3] || new THREE.Vector3(-2.9, 0.44, 6.7);
  ladybug.root.position.copy(r0);
  ladybug.root.position.y += 0.03;
  ladybug.wingCoverL.rotation.z = 0;
  ladybug.wingCoverR.rotation.z = 0;
  ladybug.innerWingL.visible = false;
  ladybug.innerWingR.visible = false;

  // Butterflies default
  blueButterfly.root.visible = t >= 55.0 && t < 61.5;
  purpleButterfly.root.visible = t >= 106.0 && t < 122.0;

  // =========================================================================
  // SCENE-BY-SCENE CHOREOGRAPHY & CAMERA DIRECTION (12 Scenes x 12 Seconds)
  // =========================================================================

  // SCENE 1 (0..12s): Opening verse at Wooden Gate
  if (t < 12) {
    const lt = t;
    // Bella opens gate and waves on "Hello!"
    const walk1 = smoothstep(8.0, 11.8, lt);
    bella.root.position.set(lerp(-0.4, -0.9, walk1), 0, lerp(11.3, 8.8, walk1));
    bella.root.rotation.y = lerp(0.1, Math.PI, smoothstep(7.8, 9.0, lt));
    if (lt < 3.5) {
      bella.armR.rotation.set(-2.2, 0, -0.3 + Math.sin(lt * 10) * 0.32);
    }

    // Milo walks in with two small steps carrying wicker basket
    const miloStep = smoothstep(2.0, 5.5, lt);
    const walk2 = smoothstep(8.0, 11.8, lt);
    const mx = lerp(0.5, 0.2, walk2);
    const mz = lerp(12.2, 11.2, miloStep) - walk2 * 2.4;
    milo.root.position.set(mx, Math.abs(Math.sin(lt * 6)) * (walk2 > 0 || miloStep > 0.1 && miloStep < 0.9 ? 0.05 : 0), mz);
    milo.root.rotation.y = lerp(-0.1, Math.PI, smoothstep(7.8, 9.0, lt));
    milo.armL.rotation.set(-0.75, 0, 0.15);
    milo.armR.rotation.set(-0.75, 0, -0.15);
    if (walk2 > 0.05 || (miloStep > 0.05 && miloStep < 0.95)) {
      milo.legL.rotation.x = Math.sin(lt * 7) * 0.35;
      milo.legR.rotation.x = -milo.legL.rotation.x;
    }

    // Basket in Milo's hands
    garden.basket.position.set(mx, 0.42, mz + (walk2 > 0.5 ? -0.36 : 0.36));

    // Pip lands on gatepost and opens both wings
    const land = smoothstep(0.2, 2.2, lt);
    if (lt < 8.0) {
      pip.root.position.set(
        lerp(2.4, garden.gatePostPos.x, land),
        lerp(2.6, garden.gatePostPos.y, land),
        lerp(11.6, garden.gatePostPos.z, land)
      );
      if (lt >= 4.0 && lt < 7.5) {
        pip.wingL.rotation.z = -1.15;
        pip.wingR.rotation.z = 1.15;
      }
    } else {
      const f = smoothstep(8.0, 11.8, lt);
      pip.root.position.set(lerp(garden.gatePostPos.x, -0.3, f), 1.6 + Math.sin(lt * 8) * 0.15, lerp(10.8, 8.6, f));
      pip.wingL.rotation.z = -0.7 + Math.sin(lt * 18) * 0.6;
      pip.wingR.rotation.z = -pip.wingL.rotation.z;
    }

    // Camera: Wide shot of Rainbow Garden, slow push toward three friends
    const push = smoothstep(0, 11.5, lt);
    camPos.set(lerp(0.6, 0.2, push), lerp(2.8, 1.85, push), lerp(17.5, 13.8, push));
    camTarget.set(0, 0.85, lerp(10.8, 9.6, push));
  }

  // SCENE 2 (12..24s): Red verse at Red Flower Bed with Ladybug
  else if (t < 24) {
    const lt = t - 12;
    bella.root.position.set(-2.1, 0, 6.4);
    bella.root.rotation.y = -0.85;
    // Bella kneels gently beside flowers without picking them
    bella.bodyGroup.position.y = 0.22;
    bella.legL.rotation.x = -0.5;
    bella.legR.rotation.x = -0.5;
    // Point to red petals
    bella.armL.rotation.set(-1.1, 0.2, 0.2);

    milo.root.position.set(-1.45, 0, 7.1);
    milo.root.rotation.y = -0.65;
    garden.basket.position.set(-0.9, 0, 7.35);
    // Milo waves slowly on "Wave your hands, nice and slow"
    if (lt >= 4.0 && lt < 8.0) {
      milo.armR.rotation.set(-2.0, 0, -0.35 + Math.sin(lt * 3.5) * 0.4);
    }

    pip.root.position.set(-2.5, 0.95 + Math.sin(lt * 3) * 0.05, 5.5);
    pip.root.rotation.y = 0.4;

    // Ladybug opens wings and flies a short distance onto another red flower
    if (lt >= 6.0 && lt < 11.0) {
      const flyP = smoothstep(6.5, 10.2, lt);
      const arcY = Math.sin(flyP * Math.PI) * 0.55;
      ladybug.root.position.set(lerp(r0.x, r1.x, flyP), lerp(r0.y, r1.y, flyP) + 0.04 + arcY, lerp(r0.z, r1.z, flyP));
      ladybug.wingCoverL.rotation.z = 0.75;
      ladybug.wingCoverR.rotation.z = -0.75;
      ladybug.innerWingL.visible = true;
      ladybug.innerWingR.visible = true;
      ladybug.innerWingL.rotation.z = Math.sin(lt * 26) * 0.4;
      ladybug.innerWingR.rotation.z = -ladybug.innerWingL.rotation.z;
    } else if (lt >= 11.0) {
      ladybug.root.position.copy(r1);
      ladybug.root.position.y += 0.03;
    }

    // Camera: Medium shot followed by gentle close-up of red petals & ladybug
    const zoom = smoothstep(5.0, 9.5, lt);
    camPos.set(lerp(-0.4, -2.1, zoom), lerp(1.65, 1.05, zoom), lerp(9.8, 8.1, zoom));
    camTarget.set(lerp(-2.5, r0.x * (1 - zoom) + r1.x * zoom, zoom), lerp(0.55, 0.42, zoom), lerp(6.5, 6.45, zoom));
  }

  // SCENE 3 (24..36s): Chorus on Grassy Patch
  else if (t < 36) {
    const lt = t - 24;
    garden.basket.position.set(1.85, 0, 4.35);
    applyChorusDance(lt, bella, milo, pip, -0.78, 0.78, 4.0);
    camPos.set(0, 1.55, 8.5);
    camTarget.set(0, 0.65, 4.0);
  }

  // SCENE 4 (36..48s): Yellow verse - Watering yellow daisies
  else if (t < 48) {
    const lt = t - 36;
    garden.basket.position.set(1.6, 0, 3.6);
    bella.root.position.set(2.15, 0, 3.15);
    bella.root.rotation.y = 1.25;
    milo.root.position.set(2.4, 0, 3.85);
    milo.root.rotation.y = 1.75;
    pip.root.position.set(3.4, 1.25, 2.0);
    pip.root.rotation.y = -0.3;

    if (lt < 3.0) {
      bella.armL.rotation.set(-1.1, 0, 0.25);
    } else {
      // Bella & Milo lift and tip watering can together
      const lift = smoothstep(2.5, 4.0, lt) * (1 - smoothstep(9.5, 11.2, lt));
      const tip = smoothstep(4.0, 5.2, lt) * (1 - smoothstep(8.8, 10.2, lt));
      garden.wateringCan.position.set(2.75, lerp(0, 0.48, lift), 3.35);
      garden.wateringCan.rotation.set(0, 0.1, lerp(0, -0.58, tip));

      milo.armR.rotation.set(-0.95 * lift, 0, -0.2);
      bella.armL.rotation.set(-0.95 * lift, 0, 0.2);

      // Animated water trickle drops
      if (tip > 0.35) {
        garden.waterDrops.visible = true;
        garden.waterDrops.children.forEach((drop, idx) => {
          const p = ((lt * 2.4 + idx * 0.12) % 1);
          drop.position.set(
            3.12 + p * 0.45 + Math.sin(idx * 2) * 0.04,
            0.72 - p * 0.55,
            3.35 + Math.cos(idx * 3) * 0.06
          );
        });
      }
    }

    // Slow pan from yellow flowers to friends watering them
    const pan = smoothstep(0.5, 7.0, lt);
    camPos.set(lerp(5.2, 1.8, pan), 1.6, lerp(6.6, 6.8, pan));
    camTarget.set(lerp(3.8, 2.9, pan), 0.55, 3.3);
  }

  // SCENE 5 (48..60s): Blue verse by Shallow Pond & Blue Flowers
  else if (t < 60) {
    const lt = t - 48;
    garden.basket.position.set(0.9, 0, -0.3);
    // Keep friends safely on wide grassy path away from water's edge
    bella.root.position.set(-0.55, 0, -0.6);
    bella.root.rotation.y = -0.4;
    milo.root.position.set(0.45, 0, -0.75);
    milo.root.rotation.y = -0.35;

    if (lt < 3.5) {
      // Bella points up to sky
      bella.armR.rotation.set(-2.35, 0, -0.2);
      bella.head.rotation.x = -0.35;
    } else if (lt >= 5.5 && lt < 9.5) {
      // Bella & Milo stand still and gently flap their arms
      const flap = Math.sin((lt - 5.5) * 6.5) * 0.65;
      bella.armL.rotation.set(0, 0, 0.85 + flap);
      bella.armR.rotation.set(0, 0, -0.85 - flap);
      milo.armL.rotation.set(0, 0, 0.85 + flap);
      milo.armR.rotation.set(0, 0, -0.85 - flap);
    }

    // Pip circles slowly above the path
    const ang = lt * 0.85;
    pip.root.position.set(Math.cos(ang) * 1.15, 1.55 + Math.sin(lt * 2.5) * 0.12, -0.7 + Math.sin(ang) * 0.8);
    pip.root.rotation.y = -ang;
    pip.wingL.rotation.z = -0.5 + Math.sin(lt * 16) * 0.65;
    pip.wingR.rotation.z = -pip.wingL.rotation.z;

    // Blue butterfly flies toward pond at end
    if (blueButterfly.root.visible) {
      const bf = smoothstep(55.5, 60.0, t);
      blueButterfly.root.position.set(lerp(-1.2, -3.5, bf), 0.75 + Math.sin(lt * 4) * 0.15, lerp(-0.8, -1.1, bf));
      blueButterfly.wingL.rotation.z = Math.sin(lt * 20) * 0.7;
      blueButterfly.wingR.rotation.z = -blueButterfly.wingL.rotation.z;
    }

    const tilt = smoothstep(3.5, 8.5, lt);
    camPos.set(lerp(-2.2, -0.8, tilt), lerp(2.1, 1.6, tilt), lerp(4.2, 3.6, tilt));
    camTarget.set(lerp(-2.5, -0.2, tilt), lerp(0.5, 1.1, tilt), -0.9);
  }

  // SCENE 6 (60..72s): Second Chorus + Carry Basket Together
  else if (t < 72) {
    const lt = t - 60;
    if (lt < 8.2) {
      garden.basket.position.set(1.85, 0, 4.35);
      applyChorusDance(lt, bella, milo, pip, -0.78, 0.78, 4.0);
    } else {
      // Bars 5-6: Milo offers Bella basket handle & they carry it together toward tree
      const walk = smoothstep(8.2, 11.8, lt);
      const zPos = lerp(4.0, 1.2, walk);
      const stepOsc = Math.sin(lt * 7) * 0.32;
      bella.root.position.set(-0.42, Math.abs(Math.sin(lt * 7)) * 0.04, zPos);
      bella.root.rotation.y = Math.PI;
      bella.armR.rotation.set(-0.7, 0, -0.25);
      bella.legL.rotation.x = stepOsc;
      bella.legR.rotation.x = -stepOsc;

      milo.root.position.set(0.42, Math.abs(Math.sin(lt * 7)) * 0.04, zPos);
      milo.root.rotation.y = Math.PI;
      milo.armL.rotation.set(-0.7, 0, 0.25);
      milo.legL.rotation.x = -stepOsc;
      milo.legR.rotation.x = stepOsc;

      garden.basket.position.set(0, 0.36, zPos - 0.15);
      pip.root.position.set(0, 1.35 + Math.sin(lt * 5) * 0.08, zPos);
      pip.wingL.rotation.z = -0.5 + Math.sin(lt * 16) * 0.5;
      pip.wingR.rotation.z = -pip.wingL.rotation.z;
    }

    const push = smoothstep(0, 11.0, lt);
    camPos.set(0, 1.55, lerp(8.6, 7.6, push));
    camTarget.set(0, 0.65, lerp(4.0, 3.2, push));
  }

  // SCENE 7 (72..84s): Green verse beneath Apple Tree + Spread Blanket
  else if (t < 84) {
    const lt = t - 72;
    garden.basket.position.set(-1.35, 0, -4.65);

    bella.root.position.set(-1.0, 0, -5.4);
    bella.root.rotation.y = 1.4;
    milo.root.position.set(1.0, 0, -5.4);
    milo.root.rotation.y = -1.4;

    if (lt < 3.5) {
      // Pip points a wing toward the green leaves above
      pip.root.position.set(0.1, 1.55, -5.2);
      pip.wingR.rotation.z = 1.25;
      bella.head.rotation.x = -0.35;
      milo.head.rotation.x = -0.35;
    } else {
      // Bella & Milo carefully unfold blanket together and smooth corners
      const bend = smoothstep(3.8, 5.0, lt) * (1 - smoothstep(9.5, 11.0, lt));
      bella.bodyGroup.rotation.x = 0.45 * bend;
      bella.armL.rotation.set(-1.0 * bend, 0, 0.2);
      bella.armR.rotation.set(-1.0 * bend, 0, -0.2);
      milo.bodyGroup.rotation.x = 0.45 * bend;
      milo.armL.rotation.set(-1.0 * bend, 0, 0.2);
      milo.armR.rotation.set(-1.0 * bend, 0, -0.2);
      pip.root.position.set(0, 1.15, -6.2);
    }

    // Gentle tilt down from leafy apple-tree branches to the friends
    const tilt = smoothstep(0.5, 6.5, lt);
    camPos.set(0.4, lerp(3.4, 2.0, tilt), lerp(-0.5, -1.1, tilt));
    camTarget.set(0, lerp(3.2, 0.55, tilt), lerp(-7.2, -5.4, tilt));
  }

  // SCENE 8 (84..96s): Orange verse - Open basket, 3 orange napkins & 3 cups
  else if (t < 96) {
    const lt = t - 84;
    garden.basket.position.set(-1.35, 0, -4.65);
    // Open basket lid
    garden.basketLid.rotation.x = -smoothstep(0.0, 1.5, lt) * 1.45;

    milo.root.position.set(1.45, 0, -4.85);
    milo.root.rotation.y = 0.85;
    if (lt < 2.2) {
      // Milo points to orange flowers by the tree
      milo.armL.rotation.set(-1.1, 0, 0.45);
    }

    bella.root.position.set(-1.05, 0, -5.0);
    bella.root.rotation.y = 0.65;
    if (lt >= 1.8 && lt < 4.5) {
      bella.bodyGroup.rotation.x = 0.28;
      bella.armR.rotation.set(-0.9, 0, -0.2);
    }

    // Pip places a lightweight cup beside the smallest napkin
    const pipMove = smoothstep(4.0, 6.5, lt);
    pip.root.position.set(
      lerp(-0.9, 0.86, pipMove),
      lerp(0.65, 0.24, pipMove) + Math.sin(pipMove * Math.PI) * 0.45,
      lerp(-4.65, -4.85, pipMove)
    );
    if (lt >= 4.0 && lt < 6.8) {
      pip.wingL.rotation.z = -0.6 + Math.sin(lt * 18) * 0.55;
      pip.wingR.rotation.z = -pip.wingL.rotation.z;
    }

    const pan = smoothstep(0.5, 6.0, lt);
    camPos.set(lerp(-0.9, 1.2, pan), 1.45, lerp(-2.3, -2.1, pan));
    camTarget.set(lerp(-0.7, 0.7, pan), 0.35, -5.0);
  }

  // SCENE 9 (96..108s): Third Chorus beside blanket
  else if (t < 108) {
    const lt = t - 96;
    garden.basket.position.set(-1.35, 0, -4.65);
    // Clear grassy patch beside the blanket (z = -3.0), no cups/props underfoot
    applyChorusDance(lt, bella, milo, pip, -0.65, 0.95, -3.0);

    if (lt >= 8.2) {
      // Pip notices purple flowers nearby and gestures toward them
      const fly = smoothstep(8.2, 11.0, lt);
      pip.root.position.set(lerp(0.15, -2.3, fly), 1.05 + Math.sin(lt * 6) * 0.1, lerp(-3.0, -5.2, fly));
      pip.root.rotation.y = -0.85;
      pip.wingL.rotation.z = -0.9;
    }

    camPos.set(0.15, 1.55, 1.4);
    camTarget.set(0.15, 0.6, -3.2);
  }

  // SCENE 10 (108..120s): Purple verse with Purple Butterfly
  else if (t < 120) {
    const lt = t - 108;
    garden.basket.position.set(-1.35, 0, -4.65);
    const sway = Math.sin(lt * 2.2) * 0.06;

    bella.root.position.set(-2.3, 0, -4.85);
    bella.root.rotation.y = -0.95;
    bella.bodyGroup.rotation.z = sway;

    // Milo smiles and keeps hands by his sides
    milo.root.position.set(-1.75, 0, -4.35);
    milo.root.rotation.y = -0.85;
    milo.bodyGroup.rotation.z = -sway;

    // Relaxed breath on "Take a breath and smell the air" (4..6s)
    if (lt >= 4.0 && lt < 6.5) {
      const breath = Math.sin(((lt - 4.0) / 2.5) * Math.PI);
      bella.bodyGroup.scale.set(1 + breath * 0.04, 1 + breath * 0.04, 1 + breath * 0.04);
      bella.head.rotation.x = -0.18 * breath;
    } else {
      bella.bodyGroup.scale.set(1, 1, 1);
    }

    pip.root.position.set(-2.6, 0.95, -4.3);
    pip.root.rotation.y = -0.6;

    // Purple butterfly rests on leaf (0..2s) then flutters gently above purple flowers
    if (lt < 2.0) {
      purpleButterfly.root.position.set(-3.4, 0.42, -5.8);
      purpleButterfly.wingL.rotation.z = 0.25;
      purpleButterfly.wingR.rotation.z = -0.25;
    } else {
      const f = lt - 2.0;
      purpleButterfly.root.position.set(
        -3.4 + Math.sin(f * 1.1) * 0.45,
        0.78 + Math.sin(f * 2.2) * 0.16,
        -5.8 + Math.cos(f * 0.9) * 0.35
      );
      purpleButterfly.root.rotation.y = Math.cos(f * 1.1) * 0.6;
      purpleButterfly.wingL.rotation.z = Math.sin(lt * 16) * 0.72;
      purpleButterfly.wingR.rotation.z = -purpleButterfly.wingL.rotation.z;
    }

    const pull = smoothstep(1.5, 7.5, lt);
    camPos.set(lerp(-2.8, -0.7, pull), lerp(0.95, 1.45, pull), lerp(-4.2, -2.0, pull));
    camTarget.set(lerp(-3.4, -2.5, pull), lerp(0.55, 0.6, pull), lerp(-5.8, -5.1, pull));
  }

  // SCENE 11 (120..132s): Color review with Six-Section Wooden Color Wheel
  else if (t < 132) {
    const lt = t - 120;
    garden.basket.position.set(-1.35, 0, -4.65);

    // Friends gathered warmly beside the wooden color wheel & blanket
    bella.root.position.set(-1.15, 0, -5.0);
    bella.root.rotation.y = -0.65;
    if (lt < 4.5) {
      // Bella points to each color section on the wheel in lyric order
      const sweep = clamp01(lt / 4.0);
      bella.armL.rotation.set(-1.15 - Math.sin(sweep * Math.PI) * 0.35, 0.3 - sweep * 0.6, 0.45);
    }

    milo.root.position.set(0.45, 0, -4.9);
    milo.root.rotation.y = -0.35;
    if (lt >= 4.0 && lt < 8.0) {
      milo.armL.rotation.set(-0.7, 0, 0.45);
      milo.armR.rotation.set(-0.7, 0, -0.45);
    }

    // Pip settles comfortably beside the smallest cup
    pip.root.position.set(1.0, 0.04, -5.05);
    pip.root.rotation.y = -0.4;

    const pull = smoothstep(4.2, 8.0, lt);
    camPos.set(lerp(-1.55, -0.45, pull), lerp(1.05, 1.35, pull), lerp(-3.1, -2.1, pull));
    camTarget.set(lerp(-1.85, -0.65, pull), lerp(0.75, 0.6, pull), -5.15);
  }

  // SCENE 12 (132..144s): Final chorus & warm goodbye beneath Apple Tree
  else {
    const lt = t - 132;
    garden.basket.position.set(-1.35, 0, -4.65);

    if (lt < 8.0) {
      // Repeat final chorus dance clearly beside blanket
      applyChorusDance(lt, bella, milo, pip, -0.65, 0.95, -3.1);
    } else if (lt < 10.2) {
      // Wave goodbye gently
      const wave = Math.sin(lt * 8) * 0.35;
      bella.root.position.set(-0.65, 0, -3.1);
      bella.armR.rotation.set(-2.25, 0, -0.3 + wave);

      milo.root.position.set(0.95, 0, -3.1);
      milo.armL.rotation.set(-2.25, 0, 0.3 - wave);

      pip.root.position.set(0.15, 0.95 + Math.sin(lt * 4) * 0.06, -3.0);
      pip.wingR.rotation.z = 0.8 + wave;
    } else {
      // Sit together happily on the red-and-white picnic blanket
      bella.root.position.set(-0.42, -0.14, -5.2);
      bella.legL.rotation.x = -1.35;
      bella.legR.rotation.x = -1.35;
      bella.armR.rotation.set(-1.6, 0, -0.2 + Math.sin(lt * 5) * 0.15);

      milo.root.position.set(0.45, -0.14, -5.2);
      milo.legL.rotation.x = -1.35;
      milo.legR.rotation.x = -1.35;
      milo.armL.rotation.set(-1.6, 0, 0.2 - Math.sin(lt * 5) * 0.15);

      pip.root.position.set(0.02, 0.12, -5.05);
    }

    // Begin with familiar front-facing dance framing, then slowly pull back to peaceful garden-wide shot
    const pullBack = smoothstep(7.5, 11.8, lt);
    camPos.set(
      lerp(0.15, 0.4, pullBack),
      lerp(1.55, 3.2, pullBack),
      lerp(1.4, 3.8, pullBack)
    );
    camTarget.set(
      lerp(0.15, 0.0, pullBack),
      lerp(0.6, 0.8, pullBack),
      lerp(-3.2, -5.3, pullBack)
    );
  }
}
