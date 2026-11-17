export type ColorTheme =
  | 'rainbow'
  | 'red'
  | 'yellow'
  | 'blue'
  | 'green'
  | 'orange'
  | 'purple';

export interface VocalNote {
  /** Beat offset from the start of the 2-second bar (0 to 4) */
  beat: number;
  /** Duration in beats (at 120 BPM, 1 beat = 0.5s) */
  dur: number;
  /** MIDI note number (C4 = 60, C5 = 72) */
  midi: number;
  /** Vowel shape for formant filter & mouth openness */
  vowel: 'a' | 'e' | 'i' | 'o' | 'u';
  /** Optional soft consonant burst at onset */
  cons?: 'h' | 'k' | 's' | 't' | 'p' | 'm';
}

export interface LyricLine {
  text: string;
  startSec: number;
  endSec: number;
  notes: VocalNote[];
}

export interface SceneSpec {
  scene: number;
  startSec: number;
  endSec: number;
  section: string;
  colorTheme: ColorTheme;
  accentHex: string;
  lyrics: LyricLine[];
  /** Chord progression for the 6 bars (2s per bar) */
  chords: [string, string, string, string, string, string];
}

export const TOTAL_DURATION_SECONDS = 144;
export const BPM = 120;
export const BEAT_SEC = 60 / BPM; // 0.5s
export const BAR_SEC = BEAT_SEC * 4; // 2.0s

// Reusable catchy C-major Chorus melody (4 bars: 8 seconds)
const CHORUS_LINE_1_NOTES: VocalNote[] = [
  // "Clap, clap, one, two, three!"
  { beat: 0.0, dur: 0.5, midi: 72, vowel: 'a', cons: 'k' }, // Clap
  { beat: 0.75, dur: 0.5, midi: 74, vowel: 'a', cons: 'k' }, // clap
  { beat: 1.5, dur: 0.5, midi: 76, vowel: 'a', cons: 'm' }, // one
  { beat: 2.25, dur: 0.5, midi: 79, vowel: 'u', cons: 't' }, // two
  { beat: 3.0, dur: 0.9, midi: 76, vowel: 'i', cons: 't' }, // three!
];

const CHORUS_LINE_2_NOTES: VocalNote[] = [
  // "Colors shine for you and me."
  { beat: 0.0, dur: 0.45, midi: 77, vowel: 'a', cons: 'k' }, // Col-
  { beat: 0.5, dur: 0.45, midi: 76, vowel: 'e' }, // -ors
  { beat: 1.0, dur: 0.75, midi: 74, vowel: 'a', cons: 's' }, // shine
  { beat: 1.75, dur: 0.45, midi: 72, vowel: 'o' }, // for
  { beat: 2.25, dur: 0.5, midi: 74, vowel: 'u' }, // you
  { beat: 2.75, dur: 0.4, midi: 76, vowel: 'a' }, // and
  { beat: 3.25, dur: 0.7, midi: 72, vowel: 'i', cons: 'm' }, // me.
];

const CHORUS_LINE_3_NOTES: VocalNote[] = [
  // "Step, step, side to side,"
  { beat: 0.0, dur: 0.5, midi: 76, vowel: 'e', cons: 's' }, // Step
  { beat: 0.75, dur: 0.5, midi: 76, vowel: 'e', cons: 's' }, // step
  { beat: 1.5, dur: 0.65, midi: 79, vowel: 'a', cons: 's' }, // side
  { beat: 2.25, dur: 0.45, midi: 76, vowel: 'u', cons: 't' }, // to
  { beat: 2.75, dur: 1.0, midi: 74, vowel: 'a', cons: 's' }, // side
];

const CHORUS_LINE_4_NOTES: VocalNote[] = [
  // "Friends together, smiles so wide!"
  { beat: 0.0, dur: 0.5, midi: 72, vowel: 'e' }, // Friends
  { beat: 0.5, dur: 0.4, midi: 74, vowel: 'u', cons: 't' }, // to-
  { beat: 1.0, dur: 0.45, midi: 76, vowel: 'e' }, // -ge-
  { beat: 1.5, dur: 0.45, midi: 74, vowel: 'e' }, // -ther
  { beat: 2.0, dur: 0.6, midi: 76, vowel: 'a', cons: 's' }, // smiles
  { beat: 2.65, dur: 0.45, midi: 74, vowel: 'o', cons: 's' }, // so
  { beat: 3.15, dur: 0.85, midi: 72, vowel: 'a' }, // wide!
];

// Gentle, friendly verse melody motifs in C major
const VERSE_A_1: VocalNote[] = [
  { beat: 0.0, dur: 0.45, midi: 72, vowel: 'e', cons: 'h' },
  { beat: 0.5, dur: 0.45, midi: 74, vowel: 'o' },
  { beat: 1.0, dur: 0.75, midi: 76, vowel: 'a', cons: 's' },
  { beat: 1.85, dur: 0.4, midi: 72, vowel: 'e', cons: 'h' },
  { beat: 2.35, dur: 0.45, midi: 74, vowel: 'o' },
  { beat: 2.9, dur: 0.95, midi: 76, vowel: 'e' },
];

const VERSE_A_2: VocalNote[] = [
  { beat: 0.0, dur: 0.45, midi: 77, vowel: 'a', cons: 'k' },
  { beat: 0.5, dur: 0.45, midi: 76, vowel: 'i' },
  { beat: 1.0, dur: 0.45, midi: 74, vowel: 'a' },
  { beat: 1.5, dur: 0.45, midi: 72, vowel: 'a' },
  { beat: 2.0, dur: 0.55, midi: 74, vowel: 'i', cons: 's' },
  { beat: 2.6, dur: 0.4, midi: 76, vowel: 'a' },
  { beat: 3.05, dur: 0.85, midi: 74, vowel: 'e', cons: 'p' },
];

const VERSE_A_3: VocalNote[] = [
  { beat: 0.0, dur: 0.4, midi: 76, vowel: 'i' },
  { beat: 0.45, dur: 0.4, midi: 76, vowel: 'u' },
  { beat: 0.95, dur: 0.55, midi: 79, vowel: 'i' },
  { beat: 1.55, dur: 0.45, midi: 77, vowel: 'a' },
  { beat: 2.05, dur: 0.45, midi: 76, vowel: 'o' },
  { beat: 2.55, dur: 0.4, midi: 74, vowel: 'e' },
  { beat: 3.0, dur: 0.9, midi: 76, vowel: 'e' },
];

const VERSE_A_4: VocalNote[] = [
  { beat: 0.0, dur: 0.45, midi: 74, vowel: 'e' },
  { beat: 0.5, dur: 0.45, midi: 72, vowel: 'u' },
  { beat: 1.0, dur: 0.45, midi: 74, vowel: 'u' },
  { beat: 1.5, dur: 0.5, midi: 76, vowel: 'e' },
  { beat: 2.05, dur: 0.5, midi: 74, vowel: 'o' },
  { beat: 2.65, dur: 1.15, midi: 72, vowel: 'e' },
];

function makeLyrics(
  sceneStart: number,
  lines: [string, string, string, string],
  notesSet: [VocalNote[], VocalNote[], VocalNote[], VocalNote[]]
): LyricLine[] {
  return lines.map((text, idx) => ({
    text,
    startSec: sceneStart + idx * BAR_SEC,
    endSec: sceneStart + (idx + 1) * BAR_SEC,
    notes: notesSet[idx],
  }));
}

export const SCENES: SceneSpec[] = [
  {
    scene: 1,
    startSec: 0,
    endSec: 12,
    section: 'Opening verse',
    colorTheme: 'rainbow',
    accentHex: '#F59E0B',
    chords: ['C', 'G', 'Am', 'F', 'C', 'G'],
    lyrics: makeLyrics(
      0,
      [
        'Hello, sun! Hello, day!',
        'Come with us and sing and play.',
        'Little feet along the way,',
        'Welcome to our rainbow day!',
      ],
      [VERSE_A_1, VERSE_A_2, VERSE_A_3, VERSE_A_4]
    ),
  },
  {
    scene: 2,
    startSec: 12,
    endSec: 24,
    section: 'Red verse',
    colorTheme: 'red',
    accentHex: '#EF5350',
    chords: ['C', 'F', 'G', 'C', 'F', 'G'],
    lyrics: makeLyrics(
      12,
      [
        'Red, red, flowers grow,',
        'Little ladybug says hello.',
        'Wave your hands, nice and slow,',
        'Watch those little red wings go!',
      ],
      [VERSE_A_1, VERSE_A_2, VERSE_A_3, VERSE_A_4]
    ),
  },
  {
    scene: 3,
    startSec: 24,
    endSec: 36,
    section: 'Chorus',
    colorTheme: 'rainbow',
    accentHex: '#F59E0B',
    chords: ['C', 'F', 'G', 'C', 'F', 'G'],
    lyrics: makeLyrics(
      24,
      [
        'Clap, clap, one, two, three!',
        'Colors shine for you and me.',
        'Step, step, side to side,',
        'Friends together, smiles so wide!',
      ],
      [CHORUS_LINE_1_NOTES, CHORUS_LINE_2_NOTES, CHORUS_LINE_3_NOTES, CHORUS_LINE_4_NOTES]
    ),
  },
  {
    scene: 4,
    startSec: 36,
    endSec: 48,
    section: 'Yellow verse',
    colorTheme: 'yellow',
    accentHex: '#FBC02D',
    chords: ['F', 'C', 'G', 'C', 'F', 'G'],
    lyrics: makeLyrics(
      36,
      [
        'Yellow petals in the light,',
        'Like the sunshine, warm and bright.',
        'Give a little drink today,',
        'Help our flowers on their way.',
      ],
      [VERSE_A_1, VERSE_A_2, VERSE_A_3, VERSE_A_4]
    ),
  },
  {
    scene: 5,
    startSec: 48,
    endSec: 60,
    section: 'Blue verse',
    colorTheme: 'blue',
    accentHex: '#29B6F6',
    chords: ['C', 'Am', 'F', 'G', 'C', 'G'],
    lyrics: makeLyrics(
      48,
      [
        'Blue, blue, up so high,',
        'Soft white clouds across the sky.',
        'Pip the bird is blue, too,',
        "Flap your wings; I'll flap with you!",
      ],
      [VERSE_A_1, VERSE_A_2, VERSE_A_3, VERSE_A_4]
    ),
  },
  {
    scene: 6,
    startSec: 60,
    endSec: 72,
    section: 'Chorus',
    colorTheme: 'rainbow',
    accentHex: '#F59E0B',
    chords: ['C', 'F', 'G', 'C', 'F', 'G'],
    lyrics: makeLyrics(
      60,
      [
        'Clap, clap, one, two, three!',
        'Colors shine for you and me.',
        'Step, step, side to side,',
        'Friends together, smiles so wide!',
      ],
      [CHORUS_LINE_1_NOTES, CHORUS_LINE_2_NOTES, CHORUS_LINE_3_NOTES, CHORUS_LINE_4_NOTES]
    ),
  },
  {
    scene: 7,
    startSec: 72,
    endSec: 84,
    section: 'Green verse',
    colorTheme: 'green',
    accentHex: '#66BB6A',
    chords: ['C', 'F', 'Am', 'G', 'F', 'C'],
    lyrics: makeLyrics(
      72,
      [
        'Green, green, leaves above,',
        'Shade our picnic place with love.',
        'Green, green, grass below,',
        'Spread our blanket, nice and slow.',
      ],
      [VERSE_A_1, VERSE_A_2, VERSE_A_3, VERSE_A_4]
    ),
  },
  {
    scene: 8,
    startSec: 84,
    endSec: 96,
    section: 'Orange verse',
    colorTheme: 'orange',
    accentHex: '#FFA726',
    chords: ['F', 'G', 'Am', 'C', 'F', 'G'],
    lyrics: makeLyrics(
      84,
      [
        'Orange flowers by the tree,',
        'Orange napkins, one, two, three.',
        'Set a place for every friend,',
        'Kindness is the thing we send.',
      ],
      [VERSE_A_1, VERSE_A_2, VERSE_A_3, VERSE_A_4]
    ),
  },
  {
    scene: 9,
    startSec: 96,
    endSec: 108,
    section: 'Chorus',
    colorTheme: 'rainbow',
    accentHex: '#F59E0B',
    chords: ['C', 'F', 'G', 'C', 'F', 'G'],
    lyrics: makeLyrics(
      96,
      [
        'Clap, clap, one, two, three!',
        'Colors shine for you and me.',
        'Step, step, side to side,',
        'Friends together, smiles so wide!',
      ],
      [CHORUS_LINE_1_NOTES, CHORUS_LINE_2_NOTES, CHORUS_LINE_3_NOTES, CHORUS_LINE_4_NOTES]
    ),
  },
  {
    scene: 10,
    startSec: 108,
    endSec: 120,
    section: 'Purple verse',
    colorTheme: 'purple',
    accentHex: '#AB47BC',
    chords: ['Am', 'F', 'C', 'G', 'F', 'G'],
    lyrics: makeLyrics(
      108,
      [
        'Purple flowers gently sway,',
        'Purple butterfly, come play.',
        'Take a breath and smell the air,',
        'Lovely colors everywhere!',
      ],
      [VERSE_A_1, VERSE_A_2, VERSE_A_3, VERSE_A_4]
    ),
  },
  {
    scene: 11,
    startSec: 120,
    endSec: 132,
    section: 'Color review',
    colorTheme: 'rainbow',
    accentHex: '#EC4899',
    chords: ['C', 'F', 'G', 'Am', 'F', 'G'],
    lyrics: makeLyrics(
      120,
      [
        'Red and yellow, blue and green,',
        'Orange, purple—what a scene!',
        'Every color, every friend,',
        'Happy moments that we spend.',
      ],
      [
        [
          { beat: 0.0, dur: 0.55, midi: 72, vowel: 'e' }, // Red
          { beat: 0.65, dur: 0.4, midi: 74, vowel: 'a' }, // and
          { beat: 1.1, dur: 0.45, midi: 76, vowel: 'e' }, // yel-
          { beat: 1.55, dur: 0.45, midi: 74, vowel: 'o' }, // -low
          { beat: 2.1, dur: 0.6, midi: 77, vowel: 'u' }, // blue
          { beat: 2.75, dur: 0.4, midi: 76, vowel: 'a' }, // and
          { beat: 3.2, dur: 0.75, midi: 74, vowel: 'i' }, // green
        ],
        [
          { beat: 0.0, dur: 0.45, midi: 76, vowel: 'o' }, // Or-
          { beat: 0.45, dur: 0.45, midi: 74, vowel: 'e' }, // -ange
          { beat: 1.0, dur: 0.45, midi: 72, vowel: 'u' }, // pur-
          { beat: 1.45, dur: 0.45, midi: 74, vowel: 'e' }, // -ple
          { beat: 2.0, dur: 0.5, midi: 76, vowel: 'a' }, // what
          { beat: 2.55, dur: 0.4, midi: 79, vowel: 'a' }, // a
          { beat: 3.0, dur: 0.9, midi: 76, vowel: 'i' }, // scene!
        ],
        VERSE_A_3,
        VERSE_A_4,
      ]
    ),
  },
  {
    scene: 12,
    startSec: 132,
    endSec: 144,
    section: 'Final chorus & goodbye',
    colorTheme: 'rainbow',
    accentHex: '#F59E0B',
    chords: ['C', 'F', 'G', 'C', 'F', 'C'],
    lyrics: makeLyrics(
      132,
      [
        'Clap, clap, one, two, three!',
        'Colors shine for you and me.',
        'Step, step, side to side,',
        'Friends together, smiles so wide!',
      ],
      [CHORUS_LINE_1_NOTES, CHORUS_LINE_2_NOTES, CHORUS_LINE_3_NOTES, CHORUS_LINE_4_NOTES]
    ),
  },
];

export function getSceneAtTime(t: number): SceneSpec {
  const clamped = Math.max(0, Math.min(TOTAL_DURATION_SECONDS - 0.001, t));
  const idx = Math.floor(clamped / 12);
  return SCENES[Math.min(SCENES.length - 1, Math.max(0, idx))];
}

export function getActiveLyricAtTime(t: number): LyricLine | null {
  const scene = getSceneAtTime(t);
  for (const line of scene.lyrics) {
    if (t >= line.startSec && t < line.endSec) {
      return line;
    }
  }
  return null;
}

/** Returns 0..1 mouth openness driven by current singing notes at time t */
export function getSingingMouthWeight(t: number): number {
  const line = getActiveLyricAtTime(t);
  if (!line) return 0;
  const barBeat = ((t - line.startSec) / BEAT_SEC);
  for (const n of line.notes) {
    if (barBeat >= n.beat && barBeat <= n.beat + n.dur) {
      const p = (barBeat - n.beat) / n.dur;
      // Smooth syllable envelope
      return Math.sin(Math.min(1, p) * Math.PI) * 0.85 + 0.15;
    }
  }
  return 0.05;
}

/** Returns which color section (0..5) is highlighted in Scene 11, or -1 */
export function getColorWheelHighlightIndex(t: number): number {
  if (t < 120 || t >= 124) return -1;
  // 120..122: "Red and yellow, blue and green,"
  // 122..124: "Orange, purple—what a scene!"
  const dt = t - 120;
  if (dt < 0.55) return 0; // Red
  if (dt < 1.05) return 1; // Yellow
  if (dt < 1.6) return 2; // Blue
  if (dt < 2.0) return 3; // Green
  if (dt < 2.5) return 4; // Orange
  if (dt < 3.5) return 5; // Purple
  return -1;
}
