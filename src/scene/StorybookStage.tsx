import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  createBella,
  createButterfly,
  createLadybug,
  createMilo,
  createPip,
} from './characters';
import { applyTimelineToWorld } from './choreography';
import { createRainbowGarden } from './garden';
import { createGardenTextures } from './materials';

export type CameraMode = 'director' | 'explore';

interface StorybookStageProps {
  currentTimeRef: React.MutableRefObject<number>;
  cameraMode: CameraMode;
  prefersReducedMotion: boolean;
}

const _desiredCamPos = new THREE.Vector3();
const _desiredCamTarget = new THREE.Vector3();
const _smoothCamTarget = new THREE.Vector3(0, 0.85, 10.5);

export const StorybookStage: React.FC<StorybookStageProps> = ({
  currentTimeRef,
  cameraMode,
  prefersReducedMotion,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const cameraModeRef = useRef<CameraMode>(cameraMode);
  const reducedMotionRef = useRef<boolean>(prefersReducedMotion);
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    cameraModeRef.current = cameraMode;
  }, [cameraMode]);

  useEffect(() => {
    reducedMotionRef.current = prefersReducedMotion;
  }, [prefersReducedMotion]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    const handleContextRestored = () => {
      setWebglError(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdbf0fe);
    scene.fog = new THREE.FogExp2(0xdbf0fe, 0.011);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      44,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      140
    );
    camera.position.set(0.6, 2.8, 17.5);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.minDistance = 2.0;
    controls.maxDistance = 28.0;
    controls.enabled = false;

    // Warm Morning Sunshine + Cool Sky Fill + Soft Rim Light
    const hemiLight = new THREE.HemisphereLight(0xa7defc, 0x73aa52, 0.9);
    hemiLight.position.set(0, 30, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff1d0, 1.65);
    sunLight.position.set(12, 18, 14);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 52;
    const d = 18;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0xffefd6, 0.42);
    rimLight.position.set(-10, 8, -14);
    scene.add(rimLight);

    // Procedural Textures, Garden World & Articulated Characters
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const textures = createGardenTextures(maxAniso);
    const garden = createRainbowGarden(scene, textures);

    const bella = createBella(textures.contactShadow);
    const milo = createMilo(textures.contactShadow);
    const pip = createPip(textures.contactShadow);
    const ladybug = createLadybug();
    const blueButterfly = createButterfly(0x4fc3f7, 0xe1f5fe);
    const purpleButterfly = createButterfly(0xab47bc, 0xf3e5f5);

    scene.add(
      bella.root,
      milo.root,
      pip.root,
      ladybug.root,
      blueButterfly.root,
      purpleButterfly.root
    );

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let frameId = 0;
    let disposed = false;
    let lastClockMs = performance.now();
    let prevSceneIdx = -1;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const nowMs = performance.now();
      const delta = Math.min(0.1, (nowMs - lastClockMs) / 1000);
      lastClockMs = nowMs;

      const t = currentTimeRef.current;
      const sceneIdx = Math.floor(Math.min(143.99, Math.max(0, t)) / 12);

      applyTimelineToWorld(
        t,
        bella,
        milo,
        pip,
        ladybug,
        blueButterfly,
        purpleButterfly,
        garden,
        _desiredCamPos,
        _desiredCamTarget
      );

      if (cameraModeRef.current === 'director') {
        controls.enabled = false;
        // Soft cut on scene transition vs gentle damp within scene
        const jumpCut = prevSceneIdx !== -1 && Math.abs(sceneIdx - prevSceneIdx) >= 1;
        if (jumpCut || reducedMotionRef.current) {
          camera.position.copy(_desiredCamPos);
          _smoothCamTarget.copy(_desiredCamTarget);
        } else {
          const lambda = 4.2;
          camera.position.x = THREE.MathUtils.damp(camera.position.x, _desiredCamPos.x, lambda, delta);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, _desiredCamPos.y, lambda, delta);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, _desiredCamPos.z, lambda, delta);

          _smoothCamTarget.x = THREE.MathUtils.damp(_smoothCamTarget.x, _desiredCamTarget.x, lambda, delta);
          _smoothCamTarget.y = THREE.MathUtils.damp(_smoothCamTarget.y, _desiredCamTarget.y, lambda, delta);
          _smoothCamTarget.z = THREE.MathUtils.damp(_smoothCamTarget.z, _desiredCamTarget.z, lambda, delta);
        }
        camera.lookAt(_smoothCamTarget);
      } else {
        controls.enabled = true;
        controls.update();
      }

      prevSceneIdx = sceneIdx;
      renderer.render(scene, camera);

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      controls.dispose();
      textures.dispose();
      envTex.dispose();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
          else mesh.material.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [currentTimeRef]);

  if (webglError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-sky-200 to-emerald-200 text-slate-800 p-8 text-center">
        <h2 className="font-storybook text-3xl font-bold text-slate-900 mb-2">
          Clap, Clap, Rainbow Day!
        </h2>
        <p className="text-base text-slate-700 max-w-md">
          3D WebGL graphics are currently unavailable in this browser context. Please enable hardware acceleration or reload to view Rainbow Garden.
        </p>
      </div>
    );
  }

  return <div ref={mountRef} className="w-full h-full" />;
};
