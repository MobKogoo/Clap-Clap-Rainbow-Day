import {
  BAR_SEC,
  BEAT_SEC,
  SCENES,
  TOTAL_DURATION_SECONDS,
  VocalNote,
} from '../data/scriptData';

const CHORD_NOTES: Record<string, { bass: number; triad: number[] }> = {
  C: { bass: 48, triad: [60, 64, 67, 72] },
  F: { bass: 41, triad: [53, 57, 60, 65] },
  G: { bass: 43, triad: [55, 59, 62, 67] },
  Am: { bass: 45, triad: [57, 60, 64, 69] },
};

const VOWEL_FORMANTS: Record<VocalNote['vowel'], [number, number]> = {
  a: [750, 1200],
  e: [520, 1850],
  i: [340, 2250],
  o: [480, 900],
  u: [360, 820],
};

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export class MusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private vocalBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private isPlaying = false;
  private isMuted = false;
  private readAlongEnabled = false;
  private volume = 0.85;

  private currentSongTime = 0;
  private scheduledUntilSongTime = 0;
  private schedulerTimer: number | null = null;
  private lastTickPerf = 0;
  private lastSpokenLineKey = '';

  private initContext(): void {
    if (this.ctx) return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.ctx = new AudioCtx();

    const compressor = this.ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 18;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.01;
    compressor.release.value = 0.2;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.isMuted ? 0 : this.volume;

    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 0.52;

    this.vocalBus = this.ctx.createGain();
    this.vocalBus.gain.value = 0.92; // Prominent vocals

    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = 0.45; // Gentle SFX

    this.musicBus.connect(compressor);
    this.vocalBus.connect(compressor);
    this.sfxBus.connect(compressor);
    compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // Precompute soft pink-ish noise buffer for shaker, claps, breeze, leaves
    const sampleRate = this.ctx.sampleRate;
    const len = sampleRate * 2;
    this.noiseBuffer = this.ctx.createBuffer(1, len, sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.95 * b2 + white * 0.048;
      data[i] = (b0 + b1 + b2 + white * 0.18) * 0.35;
    }
  }

  public async resume(): Promise<void> {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public play(fromSongTime: number): void {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    this.isPlaying = true;
    this.currentSongTime = Math.max(0, Math.min(TOTAL_DURATION_SECONDS, fromSongTime));
    this.scheduledUntilSongTime = this.currentSongTime;
    this.lastTickPerf = performance.now();
    this.lastSpokenLineKey = '';

    if (this.schedulerTimer !== null) {
      window.clearInterval(this.schedulerTimer);
    }
    this.scheduleWindow();
    this.schedulerTimer = window.setInterval(() => this.scheduleWindow(), 60);
  }

  public pause(): void {
    this.isPlaying = false;
    if (this.schedulerTimer !== null) {
      window.clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public seek(songTime: number): void {
    const wasPlaying = this.isPlaying;
    this.pause();
    this.currentSongTime = Math.max(0, Math.min(TOTAL_DURATION_SECONDS, songTime));
    if (wasPlaying) {
      this.play(this.currentSongTime);
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        muted ? 0 : this.volume,
        this.ctx.currentTime,
        0.04
      );
    }
    if (muted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.04);
    }
  }

  public setReadAlong(enabled: boolean): void {
    this.readAlongEnabled = enabled;
    if (!enabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public getCurrentTime(): number {
    if (!this.isPlaying) return this.currentSongTime;
    const now = performance.now();
    const dt = (now - this.lastTickPerf) / 1000;
    return Math.min(TOTAL_DURATION_SECONDS, this.currentSongTime + dt);
  }

  public dispose(): void {
    this.pause();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }

  private scheduleWindow(): void {
    if (!this.isPlaying || !this.ctx) return;

    const nowPerf = performance.now();
    const dt = (nowPerf - this.lastTickPerf) / 1000;
    this.lastTickPerf = nowPerf;
    this.currentSongTime = Math.min(TOTAL_DURATION_SECONDS, this.currentSongTime + dt);

    if (this.currentSongTime >= TOTAL_DURATION_SECONDS) {
      this.pause();
      return;
    }

    const lookAhead = 0.25;
    const targetEnd = Math.min(TOTAL_DURATION_SECONDS, this.currentSongTime + lookAhead);
    const ctxNow = this.ctx.currentTime;

    // Schedule eighth-note grid steps (0.25s = half beat at 120 BPM)
    const step = 0.25;
    const firstStepIdx = Math.ceil(this.scheduledUntilSongTime / step);
    const lastStepIdx = Math.floor(targetEnd / step);

    for (let idx = firstStepIdx; idx <= lastStepIdx; idx++) {
      const songT = idx * step;
      if (songT >= TOTAL_DURATION_SECONDS - 0.05) continue;
      const audioT = ctxNow + (songT - this.currentSongTime);
      this.scheduleGridStep(songT, audioT, idx);
    }

    // Schedule continuous vocal & SFX events within [scheduledUntilSongTime, targetEnd]
    this.scheduleEventsInRange(this.scheduledUntilSongTime, targetEnd, ctxNow);

    this.scheduledUntilSongTime = Math.max(this.scheduledUntilSongTime, targetEnd);
  }

  private scheduleGridStep(songT: number, audioT: number, stepIdx: number): void {
    const sceneIdx = Math.min(SCENES.length - 1, Math.floor(songT / 12));
    const scene = SCENES[sceneIdx];
    const barInScene = Math.floor((songT - scene.startSec) / BAR_SEC);
    const chordName = scene.chords[Math.min(5, Math.max(0, barInScene))];
    const chord = CHORD_NOTES[chordName] || CHORD_NOTES.C;
    const eighthInBar = stepIdx % 8;

    // Final bar of Scene 12 (142..144s): resolve on gentle decaying C chord and let it ring
    if (songT >= 142.0) {
      if (Math.abs(songT - 142.0) < 0.05) {
        this.playPianoChord(audioT, CHORD_NOTES.C.triad, 2.2, 0.28);
        this.playBassNote(audioT, CHORD_NOTES.C.bass, 2.0, 0.26);
        this.playGlockenspiel(audioT, 72, 1.8, 0.16);
        this.playGlockenspiel(audioT + 0.15, 76, 1.8, 0.14);
        this.playGlockenspiel(audioT + 0.3, 79, 2.0, 0.18);
      }
      return;
    }

    // Gentle Bass on beat 1 (eighth 0) and beat 3 (eighth 4)
    if (eighthInBar === 0) {
      this.playBassNote(audioT, chord.bass, 0.48, 0.24);
    } else if (eighthInBar === 4) {
      this.playBassNote(audioT, chord.bass + 7, 0.45, 0.19);
    }

    // Soft Piano warm pad on beat 1 of each bar
    if (eighthInBar === 0) {
      this.playPianoChord(audioT, chord.triad.slice(0, 3), 1.6, 0.14);
    }

    // Ukulele friendly strum pattern: Down (0), Down-Up (2, 3), Up (5), Down-Up (6, 7)
    if (eighthInBar === 0 || eighthInBar === 2 || eighthInBar === 4 || eighthInBar === 6) {
      this.playUkuleleStrum(audioT, chord.triad, 0.18, eighthInBar === 0 ? 0.17 : 0.12);
    } else if (eighthInBar === 3 || eighthInBar === 7) {
      this.playUkuleleStrum(audioT, [...chord.triad].reverse(), 0.13, 0.09);
    }

    // Light Shaker on eighth notes
    this.playShaker(audioT, eighthInBar % 2 === 0 ? 0.032 : 0.018);

    // Instrumental response glockenspiel sparkle in bars 5 & 6 (8..12s of each scene)
    if (barInScene >= 4 && (eighthInBar === 0 || eighthInBar === 2 || eighthInBar === 4 || eighthInBar === 6)) {
      const melodyPattern = [72, 76, 79, 76, 77, 76, 74, 72];
      const note = melodyPattern[(barInScene * 4 + eighthInBar / 2) % melodyPattern.length];
      this.playGlockenspiel(audioT, note, 0.45, 0.13);
    }
  }

  private scheduleEventsInRange(fromT: number, toT: number, ctxNow: number): void {
    const inRange = (t: number) => t >= fromT && t < toT;

    // 1. Vocal notes & optional read-along
    for (const scene of SCENES) {
      if (scene.endSec < fromT || scene.startSec > toT) continue;
      const isChorus = scene.section.toLowerCase().includes('chorus');

      for (const line of scene.lyrics) {
        if (inRange(line.startSec)) {
          this.maybeSpeakLine(line.text, `${scene.scene}-${line.startSec}`);
        }
        for (const n of line.notes) {
          const noteStart = line.startSec + n.beat * BEAT_SEC;
          if (inRange(noteStart)) {
            const audioT = ctxNow + (noteStart - this.currentSongTime);
            const durSec = n.dur * BEAT_SEC;
            this.playVocalNote(audioT, n.midi, durSec, n.vowel, n.cons);
            if (isChorus) {
              // Sweet gentle Pip harmony a third above
              this.playVocalNote(audioT, n.midi + 4, durSec, n.vowel, undefined, 0.055);
            }
          }
        }
      }

      // 2. Scene-specific gentle sound effects & handclaps
      const s = scene.startSec;
      if (scene.scene === 1) {
        if (inRange(s + 0.4)) this.playBirdChirp(ctxNow + (s + 0.4 - this.currentSongTime), 1850);
        if (inRange(s + 9.0)) this.playBirdChirp(ctxNow + (s + 9.0 - this.currentSongTime), 2100);
        if (inRange(s + 9.5)) this.playBirdChirp(ctxNow + (s + 9.5 - this.currentSongTime), 2350);
      } else if (scene.scene === 2) {
        // Ladybug wing glockenspiel sparkle
        if (inRange(s + 6.5)) this.playGlockenspiel(ctxNow + (s + 6.5 - this.currentSongTime), 84, 0.6, 0.18);
        if (inRange(s + 6.7)) this.playGlockenspiel(ctxNow + (s + 6.7 - this.currentSongTime), 88, 0.6, 0.16);
        if (inRange(s + 6.9)) this.playGlockenspiel(ctxNow + (s + 6.9 - this.currentSongTime), 91, 0.8, 0.18);
      } else if (scene.scene === 4) {
        // Trickling water droplets during watering
        for (let k = 0; k < 10; k++) {
          const wt = s + 4.2 + k * 0.35;
          if (inRange(wt)) {
            this.playWaterDrop(ctxNow + (wt - this.currentSongTime), 950 + (k % 4) * 180);
          }
        }
      } else if (scene.scene === 5) {
        // Wing flutters + musical chirp
        if (inRange(s + 6.2)) this.playSoftBreeze(ctxNow + (s + 6.2 - this.currentSongTime), 0.35, 0.08);
        if (inRange(s + 7.0)) this.playSoftBreeze(ctxNow + (s + 7.0 - this.currentSongTime), 0.35, 0.08);
        if (inRange(s + 5.2)) this.playBirdChirp(ctxNow + (s + 5.2 - this.currentSongTime), 2200);
      } else if (scene.scene === 7) {
        // Quiet rustling leaves & fabric spread
        if (inRange(s + 0.6)) this.playSoftBreeze(ctxNow + (s + 0.6 - this.currentSongTime), 0.9, 0.06);
        if (inRange(s + 6.3)) this.playSoftBreeze(ctxNow + (s + 6.3 - this.currentSongTime), 1.1, 0.07);
      } else if (scene.scene === 8) {
        // Three gentle musical notes, one for each napkin
        if (inRange(s + 2.1)) this.playGlockenspiel(ctxNow + (s + 2.1 - this.currentSongTime), 72, 0.5, 0.18);
        if (inRange(s + 2.8)) this.playGlockenspiel(ctxNow + (s + 2.8 - this.currentSongTime), 76, 0.5, 0.18);
        if (inRange(s + 3.5)) this.playGlockenspiel(ctxNow + (s + 3.5 - this.currentSongTime), 79, 0.6, 0.2);
      } else if (scene.scene === 10) {
        // Soft breeze and delicate bell accent
        if (inRange(s + 4.2)) this.playSoftBreeze(ctxNow + (s + 4.2 - this.currentSongTime), 1.2, 0.06);
        if (inRange(s + 2.4)) this.playGlockenspiel(ctxNow + (s + 2.4 - this.currentSongTime), 84, 0.9, 0.15);
      } else if (scene.scene === 11) {
        // Six soft chimes for each highlighted color in exact lyric order
        const chimeTimes = [0.05, 0.55, 1.05, 1.55, 2.05, 2.55];
        const chimeMidis = [72, 74, 76, 77, 79, 84];
        chimeTimes.forEach((ct, idx) => {
          if (inRange(s + ct)) {
            this.playGlockenspiel(
              ctxNow + (s + ct - this.currentSongTime),
              chimeMidis[idx],
              0.55,
              0.17
            );
          }
        });
      }

      // Soft handclaps on every chorus ("Clap, clap, one, two, three!")
      if (isChorus) {
        // Three soft handclaps synchronized to "Clap, clap, [one]" / beats 0, 0.75, 1.5
        const clapBeats = [0.0, 0.75, 1.5];
        for (const cb of clapBeats) {
          const ct = s + cb * BEAT_SEC;
          if (inRange(ct)) {
            this.playHandClap(ctxNow + (ct - this.currentSongTime));
          }
        }
      }

      // Scene 12 closing chirp after final sung line
      if (scene.scene === 12 && inRange(s + 8.6)) {
        this.playBirdChirp(ctxNow + (s + 8.6 - this.currentSongTime), 2150);
      }
    }
  }

  private maybeSpeakLine(text: string, key: string): void {
    if (!this.readAlongEnabled || this.isMuted) return;
    if (this.lastSpokenLineKey === key) return;
    this.lastSpokenLineKey = key;
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.08;
    utter.pitch = 1.25;
    utter.volume = Math.min(1, this.volume * 0.8);
    window.speechSynthesis.speak(utter);
  }

  private playUkuleleStrum(audioT: number, midis: number[], dur: number, gainAmt: number): void {
    if (!this.ctx || !this.musicBus) return;
    midis.forEach((m, i) => {
      const t = audioT + i * 0.012;
      const osc = this.ctx!.createOscillator();
      const filter = this.ctx!.createBiquadFilter();
      const g = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(midiToFreq(m + 12), t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, t);
      filter.frequency.exponentialRampToValueAtTime(650, t + dur);

      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(gainAmt * 0.35, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.18);

      osc.connect(filter);
      filter.connect(g);
      g.connect(this.musicBus!);
      osc.start(t);
      osc.stop(t + dur + 0.22);
    });
  }

  private playPianoChord(audioT: number, midis: number[], dur: number, gainAmt: number): void {
    if (!this.ctx || !this.musicBus) return;
    midis.forEach((m) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(midiToFreq(m), audioT);

      g.gain.setValueAtTime(0.0001, audioT);
      g.gain.linearRampToValueAtTime(gainAmt * 0.28, audioT + 0.025);
      g.gain.exponentialRampToValueAtTime(0.0001, audioT + dur);

      osc.connect(g);
      g.connect(this.musicBus!);
      osc.start(audioT);
      osc.stop(audioT + dur + 0.05);
    });
  }

  private playBassNote(audioT: number, midi: number, dur: number, gainAmt: number): void {
    if (!this.ctx || !this.musicBus) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(midiToFreq(midi), audioT);

    g.gain.setValueAtTime(0.0001, audioT);
    g.gain.linearRampToValueAtTime(gainAmt, audioT + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, audioT + dur);

    osc.connect(g);
    g.connect(this.musicBus);
    osc.start(audioT);
    osc.stop(audioT + dur + 0.05);
  }

  private playGlockenspiel(audioT: number, midi: number, dur: number, gainAmt: number): void {
    if (!this.ctx || !this.musicBus) return;
    const freq = midiToFreq(midi + 12);
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, audioT);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.75, audioT);

    const g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(0.16, audioT);
    g2.gain.exponentialRampToValueAtTime(0.001, audioT + 0.09);

    g.gain.setValueAtTime(0.0001, audioT);
    g.gain.linearRampToValueAtTime(gainAmt, audioT + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, audioT + dur);

    osc1.connect(g);
    osc2.connect(g2);
    g2.connect(g);
    g.connect(this.musicBus);

    osc1.start(audioT);
    osc2.start(audioT);
    osc1.stop(audioT + dur + 0.04);
    osc2.stop(audioT + dur + 0.04);
  }

  private playVocalNote(
    audioT: number,
    midi: number,
    dur: number,
    vowel: VocalNote['vowel'],
    cons?: VocalNote['cons'],
    gainAmt = 0.16
  ): void {
    if (!this.ctx || !this.vocalBus) return;
    const freq = midiToFreq(midi);
    const [f1, f2] = VOWEL_FORMANTS[vowel];

    // Warm glottal source (filtered triangle + fundamental sine)
    const oscCore = this.ctx.createOscillator();
    const oscSub = this.ctx.createOscillator();
    oscCore.type = 'triangle';
    oscCore.frequency.setValueAtTime(freq, audioT);

    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(freq, audioT);

    // Gentle vibrato
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 5.2;
    lfoGain.gain.value = 3.2;
    lfo.connect(lfoGain);
    lfoGain.connect(oscCore.frequency);
    lfoGain.connect(oscSub.frequency);

    // Dual vowel formant filters
    const filt1 = this.ctx.createBiquadFilter();
    filt1.type = 'bandpass';
    filt1.frequency.setValueAtTime(f1, audioT);
    filt1.Q.value = 4.5;

    const filt2 = this.ctx.createBiquadFilter();
    filt2.type = 'bandpass';
    filt2.frequency.setValueAtTime(f2, audioT);
    filt2.Q.value = 6.0;

    const env = this.ctx.createGain();
    const safeDur = Math.max(0.12, dur);
    env.gain.setValueAtTime(0.0001, audioT);
    env.gain.linearRampToValueAtTime(gainAmt, audioT + 0.035);
    env.gain.setValueAtTime(gainAmt * 0.88, audioT + safeDur * 0.72);
    env.gain.exponentialRampToValueAtTime(0.0001, audioT + safeDur + 0.05);

    const subGain = this.ctx.createGain();
    subGain.gain.value = 0.55;

    oscCore.connect(filt1);
    oscCore.connect(filt2);
    filt1.connect(env);
    filt2.connect(env);
    oscSub.connect(subGain);
    subGain.connect(env);
    env.connect(this.vocalBus);

    lfo.start(audioT);
    oscCore.start(audioT);
    oscSub.start(audioT);
    lfo.stop(audioT + safeDur + 0.08);
    oscCore.stop(audioT + safeDur + 0.08);
    oscSub.stop(audioT + safeDur + 0.08);

    // Subtle consonant puff for syllable clarity
    if (cons && this.noiseBuffer) {
      const nSrc = this.ctx.createBufferSource();
      nSrc.buffer = this.noiseBuffer;
      const nFilt = this.ctx.createBiquadFilter();
      nFilt.type = 'bandpass';
      nFilt.frequency.value = cons === 's' ? 4200 : cons === 't' ? 3200 : 1800;
      nFilt.Q.value = 2.0;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.0001, audioT);
      nGain.gain.linearRampToValueAtTime(0.035, audioT + 0.008);
      nGain.gain.exponentialRampToValueAtTime(0.0001, audioT + 0.045);

      nSrc.connect(nFilt);
      nFilt.connect(nGain);
      nGain.connect(this.vocalBus);
      nSrc.start(audioT);
      nSrc.stop(audioT + 0.06);
    }
  }

  private playShaker(audioT: number, gainAmt: number): void {
    if (!this.ctx || !this.musicBus || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'highpass';
    filt.frequency.value = 4800;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, audioT);
    g.gain.linearRampToValueAtTime(gainAmt, audioT + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, audioT + 0.055);
    src.connect(filt);
    filt.connect(g);
    g.connect(this.musicBus);
    src.start(audioT);
    src.stop(audioT + 0.07);
  }

  private playHandClap(audioT: number): void {
    if (!this.ctx || !this.sfxBus || !this.noiseBuffer) return;
    // Soft double-tap children's handclap
    [0, 0.018].forEach((offset, idx) => {
      const t = audioT + offset;
      const src = this.ctx!.createBufferSource();
      src.buffer = this.noiseBuffer!;
      const filt = this.ctx!.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.value = 1450;
      filt.Q.value = 1.2;
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(idx === 0 ? 0.28 : 0.2, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
      src.connect(filt);
      filt.connect(g);
      g.connect(this.sfxBus!);
      src.start(t);
      src.stop(t + 0.14);
    });
  }

  private playBirdChirp(audioT: number, baseFreq: number): void {
    if (!this.ctx || !this.sfxBus) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, audioT);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.45, audioT + 0.08);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.1, audioT + 0.16);
    g.gain.setValueAtTime(0.0001, audioT);
    g.gain.linearRampToValueAtTime(0.16, audioT + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audioT + 0.18);
    osc.connect(g);
    g.connect(this.sfxBus);
    osc.start(audioT);
    osc.stop(audioT + 0.2);
  }

  private playWaterDrop(audioT: number, freq: number): void {
    if (!this.ctx || !this.sfxBus) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioT);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.55, audioT + 0.07);
    g.gain.setValueAtTime(0.0001, audioT);
    g.gain.linearRampToValueAtTime(0.09, audioT + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, audioT + 0.09);
    osc.connect(g);
    g.connect(this.sfxBus);
    osc.start(audioT);
    osc.stop(audioT + 0.11);
  }

  private playSoftBreeze(audioT: number, dur: number, gainAmt: number): void {
    if (!this.ctx || !this.sfxBus || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 650;
    filt.Q.value = 0.8;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, audioT);
    g.gain.linearRampToValueAtTime(gainAmt, audioT + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, audioT + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(this.sfxBus);
    src.start(audioT);
    src.stop(audioT + dur + 0.05);
  }
}
