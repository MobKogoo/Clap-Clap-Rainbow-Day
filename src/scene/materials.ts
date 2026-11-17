import * as THREE from 'three';

export interface GardenTextures {
  grass: THREE.CanvasTexture;
  wood: THREE.CanvasTexture;
  wicker: THREE.CanvasTexture;
  blanket: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  sky: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  return [c, ctx];
}

export function createGardenTextures(maxAnisotropy: number): GardenTextures {
  // 1. Storybook Grass Texture
  const [grassC, gCtx] = makeCanvas(512, 512);
  gCtx.fillStyle = '#7ec86c';
  gCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2400; i++) {
    const x = (Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1 * 512;
    const y = (Math.sin(i * 78.233) * 19341.123 % 1 + 1) % 1 * 512;
    gCtx.fillStyle = i % 3 === 0 ? '#8bd478' : i % 3 === 1 ? '#70bc5e' : '#96dc82';
    gCtx.beginPath();
    gCtx.ellipse(x, y, 4 + (i % 5), 2 + (i % 3), (i % 6) * 0.5, 0, Math.PI * 2);
    gCtx.fill();
  }
  const grass = new THREE.CanvasTexture(grassC);
  grass.colorSpace = THREE.SRGBColorSpace;
  grass.wrapS = THREE.RepeatWrapping;
  grass.wrapT = THREE.RepeatWrapping;
  grass.repeat.set(14, 14);
  grass.anisotropy = maxAnisotropy;

  // 2. Warm Storybook Wood Grain
  const [woodC, wCtx] = makeCanvas(256, 256);
  wCtx.fillStyle = '#c88d58';
  wCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 6) {
    wCtx.fillStyle = y % 12 === 0 ? 'rgba(130,78,36,0.16)' : 'rgba(245,205,155,0.12)';
    wCtx.fillRect(0, y, 256, 3);
  }
  const wood = new THREE.CanvasTexture(woodC);
  wood.colorSpace = THREE.SRGBColorSpace;
  wood.wrapS = THREE.RepeatWrapping;
  wood.wrapT = THREE.RepeatWrapping;
  wood.anisotropy = maxAnisotropy;

  // 3. Woven Wicker Basket Texture
  const [wickC, wkCtx] = makeCanvas(256, 256);
  wkCtx.fillStyle = '#d7a467';
  wkCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 16) {
    for (let x = 0; x < 256; x += 32) {
      const offset = (y / 16) % 2 === 0 ? 0 : 16;
      wkCtx.fillStyle = '#b98245';
      wkCtx.fillRect((x + offset) % 256, y + 2, 24, 10);
      wkCtx.fillStyle = '#e5b980';
      wkCtx.fillRect((x + offset + 2) % 256, y + 3, 20, 4);
    }
  }
  const wicker = new THREE.CanvasTexture(wickC);
  wicker.colorSpace = THREE.SRGBColorSpace;
  wicker.wrapS = THREE.RepeatWrapping;
  wicker.wrapT = THREE.RepeatWrapping;
  wicker.repeat.set(3, 2);
  wicker.anisotropy = maxAnisotropy;

  // 4. Red-and-White Checkered Picnic Blanket
  const [blC, bCtx] = makeCanvas(512, 512);
  bCtx.fillStyle = '#fff9f5';
  bCtx.fillRect(0, 0, 512, 512);
  const cell = 64;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 0) {
        bCtx.fillStyle = '#ef5350';
      } else if (r % 2 === 0 || c % 2 === 0) {
        bCtx.fillStyle = 'rgba(239, 83, 80, 0.38)';
      } else {
        continue;
      }
      bCtx.fillRect(c * cell, r * cell, cell, cell);
    }
  }
  // Soft cream stitched border
  bCtx.strokeStyle = '#fff3e0';
  bCtx.lineWidth = 14;
  bCtx.strokeRect(7, 7, 498, 498);
  const blanket = new THREE.CanvasTexture(blC);
  blanket.colorSpace = THREE.SRGBColorSpace;
  blanket.anisotropy = maxAnisotropy;

  // 5. Soft Radial Contact Shadow
  const [shC, sCtx] = makeCanvas(128, 128);
  const grad = sCtx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(26, 48, 28, 0.45)');
  grad.addColorStop(0.6, 'rgba(26, 48, 28, 0.16)');
  grad.addColorStop(1, 'rgba(26, 48, 28, 0.0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 128, 128);
  const contactShadow = new THREE.CanvasTexture(shC);

  // 6. Soft Morning Sky Dome Gradient
  const [skyC, skyCtx] = makeCanvas(64, 512);
  const skyGrad = skyCtx.createLinearGradient(0, 0, 0, 512);
  skyGrad.addColorStop(0.0, '#72c5f8'); // Zenith soft sky blue
  skyGrad.addColorStop(0.42, '#a7defc');
  skyGrad.addColorStop(0.62, '#dcf2fe');
  skyGrad.addColorStop(0.75, '#fff6df'); // Warm morning horizon glow
  skyGrad.addColorStop(1.0, '#d8f0c8');
  skyCtx.fillStyle = skyGrad;
  skyCtx.fillRect(0, 0, 64, 512);
  const sky = new THREE.CanvasTexture(skyC);
  sky.colorSpace = THREE.SRGBColorSpace;

  return {
    grass,
    wood,
    wicker,
    blanket,
    contactShadow,
    sky,
    dispose: () => {
      grass.dispose();
      wood.dispose();
      wicker.dispose();
      blanket.dispose();
      contactShadow.dispose();
      sky.dispose();
    },
  };
}
