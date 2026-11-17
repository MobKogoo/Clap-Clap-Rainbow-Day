import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  MessageSquare,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { MusicEngine } from './audio/MusicEngine';
import {
  getActiveLyricAtTime,
  getSceneAtTime,
  SCENES,
  TOTAL_DURATION_SECONDS,
} from './data/scriptData';
import { CameraMode, StorybookStage } from './scene/StorybookStage';

function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, '0')}`;
}

const SCENE_SHORT_LABELS = [
  '1. Gate',
  '2. Red',
  '3. Chorus',
  '4. Yellow',
  '5. Blue',
  '6. Chorus',
  '7. Green',
  '8. Orange',
  '9. Chorus',
  '10. Purple',
  '11. Wheel',
  '12. Finale',
];

export default function App() {
  const musicRef = useRef<MusicEngine | null>(null);
  const currentTimeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const lastFramePerfRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [displayTime, setDisplayTime] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [subtitlesOn, setSubtitlesOn] = useState(true);
  const [readAlongOn, setReadAlongOn] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('director');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Initialize MusicEngine once
  useEffect(() => {
    const engine = new MusicEngine();
    musicRef.current = engine;
    return () => {
      engine.dispose();
      musicRef.current = null;
    };
  }, []);

  // Playback clock synchronized cleanly with MusicEngine
  useEffect(() => {
    let rafId = 0;
    const updateClock = () => {
      if (isPlayingRef.current) {
        const now = performance.now();
        const engineTime = musicRef.current?.getCurrentTime();
        let nextT =
          engineTime !== undefined
            ? engineTime
            : currentTimeRef.current + (now - lastFramePerfRef.current) / 1000;
        lastFramePerfRef.current = now;

        if (nextT >= TOTAL_DURATION_SECONDS) {
          nextT = TOTAL_DURATION_SECONDS;
          currentTimeRef.current = nextT;
          setDisplayTime(nextT);
          isPlayingRef.current = false;
          setIsPlaying(false);
          musicRef.current?.pause();
        } else {
          currentTimeRef.current = nextT;
          setDisplayTime(nextT);
        }
      }
      rafId = requestAnimationFrame(updateClock);
    };
    rafId = requestAnimationFrame(updateClock);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handlePlayPause = useCallback(async () => {
    if (!musicRef.current) return;
    await musicRef.current.resume();

    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      musicRef.current.pause();
    } else {
      if (currentTimeRef.current >= TOTAL_DURATION_SECONDS - 0.1) {
        currentTimeRef.current = 0;
        setDisplayTime(0);
      }
      setHasStarted(true);
      lastFramePerfRef.current = performance.now();
      isPlayingRef.current = true;
      setIsPlaying(true);
      musicRef.current.play(currentTimeRef.current);
    }
  }, []);

  const handleSeek = useCallback(async (newTime: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_DURATION_SECONDS, newTime));
    currentTimeRef.current = clamped;
    setDisplayTime(clamped);
    setHasStarted(true);
    if (musicRef.current) {
      await musicRef.current.resume();
      musicRef.current.seek(clamped);
    }
  }, []);

  const handleRestart = useCallback(async () => {
    currentTimeRef.current = 0;
    setDisplayTime(0);
    setHasStarted(true);
    setCameraMode('director');
    if (musicRef.current) {
      await musicRef.current.resume();
      lastFramePerfRef.current = performance.now();
      isPlayingRef.current = true;
      setIsPlaying(true);
      musicRef.current.play(0);
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      musicRef.current?.setMuted(next);
      return next;
    });
  }, []);

  const handleToggleReadAlong = useCallback(() => {
    setReadAlongOn((prev) => {
      const next = !prev;
      musicRef.current?.setReadAlong(next);
      return next;
    });
  }, []);

  // Keyboard shortcuts: Space (Play/Pause), H (Hide/Show Controls)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        void handlePlayPause();
      } else if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlePlayPause]);

  const activeScene = getSceneAtTime(displayTime);
  const activeLyric = getActiveLyricAtTime(displayTime);
  const isFinished = displayTime >= TOTAL_DURATION_SECONDS - 0.05 && !isPlaying;

  // Opening title visibility in upper frame (0.4s to 6.8s)
  let openingTitleOpacity = 0;
  if (displayTime >= 0.3 && displayTime <= 6.8) {
    if (displayTime < 1.1) openingTitleOpacity = (displayTime - 0.3) / 0.8;
    else if (displayTime > 5.8) openingTitleOpacity = (6.8 - displayTime) / 1.0;
    else openingTitleOpacity = 1;
  }

  // Smooth ending fade-out (142.8s to 144.0s)
  const endingFadeOpacity =
    displayTime > 142.8 ? Math.min(1, (displayTime - 142.8) / 1.15) : 0;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0e1b30]">
      {/* Full-Viewport 3D Storybook Stage */}
      <div className="w-full h-full">
        <StorybookStage
          currentTimeRef={currentTimeRef}
          cameraMode={cameraMode}
          prefersReducedMotion={prefersReducedMotion}
        />
      </div>

      {/* Smooth Ending Fade Curtain */}
      {endingFadeOpacity > 0 && (
        <div
          className="pointer-events-none absolute inset-0 bg-[#fff9ec]"
          style={{ opacity: endingFadeOpacity * 0.92 }}
        />
      )}

      {/* Minimal Top-Left Header Context (Clean Unboxed Typography) */}
      <div className="pointer-events-none absolute top-4 left-5 z-10 flex items-center gap-2.5 text-sm font-medium text-white drop-shadow-[0_2px_6px_rgba(15,29,50,0.65)]">
        <span className="font-storybook text-base font-bold tracking-tight">
          Clap, Clap, Rainbow Day!
        </span>
        <span aria-hidden="true" className="opacity-70">
          ·
        </span>
        <span className="text-white/95">
          Scene {activeScene.scene} of 12
        </span>
        <span aria-hidden="true" className="opacity-70">
          ·
        </span>
        <span className="text-white/95">{activeScene.section}</span>
      </div>

      {/* Scene 1 Opening Title in Upper Frame */}
      {openingTitleOpacity > 0 && (
        <div
          className="pointer-events-none absolute inset-x-0 top-14 z-10 flex flex-col items-center px-6 text-center"
          style={{ opacity: openingTitleOpacity }}
        >
          <h1 className="title-outline text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
            Clap, Clap, Rainbow Day!
          </h1>
        </div>
      )}

      {/* First-Load Friendly Start Prompt (Non-occluding, positioned cleanly above dock) */}
      {!hasStarted && !isPlaying && (
        <div className="pointer-events-auto absolute inset-x-0 bottom-36 z-20 flex justify-center px-4">
          <button
            type="button"
            onClick={handlePlayPause}
            className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] active:scale-95 text-slate-950 font-storybook text-xl font-bold shadow-lg transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer whitespace-nowrap"
          >
            <Play className="w-6 h-6 fill-current" />
            Play Music Video
          </button>
        </div>
      )}

      {/* Warm Ending Replay Prompt */}
      {isFinished && (
        <div className="pointer-events-auto absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center">
          <h2 className="font-storybook text-4xl sm:text-5xl font-bold text-[#1b3b73] mb-3">
            Happy Rainbow Day!
          </h2>
          <p className="text-slate-700 text-base sm:text-lg max-w-md mb-6">
            Bella, Milo, and Pip enjoyed their rainbow picnic beneath the apple tree.
          </p>
          <button
            type="button"
            onClick={handleRestart}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#1b3b73] hover:bg-[#152e59] text-white font-storybook text-lg font-semibold shadow-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b3b73] cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-5 h-5" />
            Watch Again
          </button>
        </div>
      )}

      {/* Synchronized Subtitles (Bottom Center Safe Margin, White with Dark-Blue Outline) */}
      {subtitlesOn && activeLyric && !isFinished && (
        <div
          className={`pointer-events-none absolute inset-x-0 z-10 flex justify-center px-6 transition-transform duration-200 ${
            dockCollapsed ? 'bottom-12' : 'bottom-36'
          }`}
        >
          <p className="subtitle-outline text-center text-2xl sm:text-3xl md:text-4xl font-bold leading-snug max-w-3xl">
            {activeLyric.text}
          </p>
        </div>
      )}

      {/* Collapsible Bottom Control Dock (Zero Backdrop-Blur Over WebGL) */}
      <div
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[min(940px,94vw)] transition-transform duration-200 ease-out ${
          dockCollapsed ? 'translate-y-[calc(100%+12px)]' : 'translate-y-0'
        }`}
      >
        {/* Dock Collapse / Expand Handle */}
        <div className="flex justify-center mb-1.5">
          <button
            type="button"
            onClick={() => setDockCollapsed((v) => !v)}
            aria-label={dockCollapsed ? 'Show Controls' : 'Hide Controls'}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-lg bg-[#122038]/95 border border-white/15 text-xs font-medium text-slate-200 hover:text-white hover:bg-[#1a2e4f] transition-colors cursor-pointer whitespace-nowrap ${
              dockCollapsed ? '-translate-y-12' : ''
            }`}
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Show Controls
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                Hide Controls
              </>
            )}
          </button>
        </div>

        {/* Main Control Surface */}
        <div className="bg-[#122038]/95 border border-white/15 rounded-2xl px-4 py-3 shadow-2xl">
          {/* Row 1: Playback, Scrubber, Audio, Subtitles, Camera */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors shrink-0 cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={handleRestart}
              aria-label="Restart"
              title="Restart from beginning"
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Timeline Scrubber */}
            <div className="flex-1 min-w-[180px] flex items-center gap-3">
              <span className="text-xs font-medium text-slate-200 tabular-nums shrink-0 w-10 text-right">
                {formatClock(displayTime)}
              </span>
              <input
                type="range"
                min={0}
                max={TOTAL_DURATION_SECONDS}
                step={0.1}
                value={displayTime}
                onChange={(e) => void handleSeek(Number(e.target.value))}
                aria-label="Video timeline"
                className="w-full h-2 accent-amber-400 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-400 tabular-nums shrink-0 w-10">
                {formatClock(TOTAL_DURATION_SECONDS)}
              </span>
            </div>

            {/* Utility Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleToggleMute}
                aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-300" />
                ) : (
                  <Volume2 className="w-4 h-4 text-sky-300" />
                )}
                <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSubtitlesOn((v) => !v)}
                aria-label={subtitlesOn ? 'Hide Subtitles' : 'Show Subtitles'}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  subtitlesOn
                    ? 'bg-sky-500/25 text-sky-200 border border-sky-400/40'
                    : 'bg-white/10 hover:bg-white/20 text-slate-300'
                }`}
              >
                {subtitlesOn ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span className="hidden sm:inline">Lyrics</span>
              </button>

              <button
                type="button"
                onClick={handleToggleReadAlong}
                aria-label="Toggle Read-Along Voice"
                title="Optional spoken read-along voice"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  readAlongOn
                    ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
                    : 'bg-white/10 hover:bg-white/20 text-slate-300'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden md:inline">Read-Along</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setCameraMode((m) => (m === 'director' ? 'explore' : 'director'))
                }
                aria-label="Switch Camera Mode"
                title={
                  cameraMode === 'director'
                    ? 'Switch to Explore Garden Orbit Camera'
                    : 'Return to Director Camera'
                }
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  cameraMode === 'explore'
                    ? 'bg-amber-400/25 text-amber-200 border border-amber-400/40'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span className="hidden md:inline">
                  {cameraMode === 'director' ? 'Director Cam' : 'Explore 3D'}
                </span>
              </button>
            </div>
          </div>

          {/* Row 2: 12-Scene Chapter Strip */}
          <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center gap-1 overflow-x-auto">
            {SCENES.map((sc, idx) => {
              const isActive = activeScene.scene === sc.scene;
              return (
                <button
                  key={sc.scene}
                  type="button"
                  onClick={() => void handleSeek(sc.startSec)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-white text-slate-950 font-semibold'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: sc.accentHex }}
                    aria-hidden="true"
                  />
                  {SCENE_SHORT_LABELS[idx]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
