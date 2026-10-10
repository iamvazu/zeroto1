// zeroto1.academy — Touch Typing Practice Engine (PRD §5.5, Sprint 11)
// Curriculum progression from single keys (j, f) up to full words ("pretzels").

export type FingerName =
  | 'left-pinky'
  | 'left-ring'
  | 'left-middle'
  | 'left-index'
  | 'thumb'
  | 'right-index'
  | 'right-middle'
  | 'right-ring'
  | 'right-pinky';

export interface TypingLesson {
  id: string;
  stage: number;
  title: string;
  description: string;
  targetKeys: string[];
  practiceText: string;
}

export const FINGER_MAPPING: Record<string, FingerName> = {
  // Left Hand
  q: 'left-pinky',
  a: 'left-pinky',
  z: 'left-pinky',
  w: 'left-ring',
  s: 'left-ring',
  x: 'left-ring',
  e: 'left-middle',
  d: 'left-middle',
  c: 'left-middle',
  r: 'left-index',
  t: 'left-index',
  f: 'left-index',
  g: 'left-index',
  v: 'left-index',
  b: 'left-index',

  // Thumbs
  ' ': 'thumb',

  // Right Hand
  y: 'right-index',
  u: 'right-index',
  h: 'right-index',
  j: 'right-index',
  n: 'right-index',
  m: 'right-index',
  i: 'right-middle',
  k: 'right-middle',
  ',': 'right-middle',
  o: 'right-ring',
  l: 'right-ring',
  '.': 'right-ring',
  p: 'right-pinky',
  ';': 'right-pinky',
  '/': 'right-pinky',
};

export const FINGER_FRIENDLY_NAMES: Record<FingerName, string> = {
  'left-pinky': 'Left Pinky',
  'left-ring': 'Left Ring Finger',
  'left-middle': 'Left Middle Finger',
  'left-index': 'Left Index Finger',
  thumb: 'Either Thumb (Spacebar)',
  'right-index': 'Right Index Finger',
  'right-middle': 'Right Middle Finger',
  'right-ring': 'Right Ring Finger',
  'right-pinky': 'Right Pinky',
};

export const KEYBOARD_LAYOUT: string[][] = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
  [' '],
];

export const TYPING_CURRICULUM: TypingLesson[] = [
  {
    id: 'type-1-jf',
    stage: 1,
    title: 'Stage 1: Home Keys (J & F)',
    description: 'Feel the tactile bumps on J and F. Rest your index fingers here.',
    targetKeys: ['j', 'f', ' '],
    practiceText: 'j f j f jj ff jf fj j f j j f f jf',
  },
  {
    id: 'type-2-dk',
    stage: 2,
    title: 'Stage 2: Middle Home Row (D & K)',
    description: 'Add your middle fingers on D and K next to J and F.',
    targetKeys: ['d', 'k', 'j', 'f', ' '],
    practiceText: 'd k d k dk kd f j d k fjdk kdfj',
  },
  {
    id: 'type-3-home-row',
    stage: 3,
    title: 'Stage 3: Full Home Row (A, S, D, F, J, K, L, ;)',
    description: 'Use all fingers along the central home row.',
    targetKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';', ' '],
    practiceText: 'asdf jkl; a s d f j k l ; ask dad lad fall flash',
  },
  {
    id: 'type-4-top-row',
    stage: 4,
    title: 'Stage 4: Reaching Up (Top Row)',
    description: 'Reach up from home row to type E, R, T, U, I, O.',
    targetKeys: ['e', 'r', 't', 'u', 'i', 'o'],
    practiceText: 'tree fire tie kite ride outer fruit quiet water',
  },
  {
    id: 'type-5-bottom-row',
    stage: 5,
    title: 'Stage 5: Reaching Down (Bottom Row)',
    description: 'Reach down with precision to type C, V, B, N, M.',
    targetKeys: ['c', 'v', 'b', 'n', 'm'],
    practiceText: 'cave ocean moon climb beam bench comic beacon vanish',
  },
  {
    id: 'type-6-words-pretzels',
    stage: 6,
    title: 'Stage 6: Word Mastery (Pretzels Challenge)',
    description: 'Combine all rows to type fluid words, culminating in pretzels!',
    targetKeys: ['all'],
    practiceText: 'curious galaxy wonder dolphin science discovery puzzle pretzels',
  },
];

/**
 * Standard WPM computation: 1 word = 5 characters.
 * WPM = (correctChars / 5) / (elapsedSeconds / 60)
 */
export function calculateWpm(correctChars: number, elapsedSeconds: number): number {
  if (elapsedSeconds <= 0 || correctChars <= 0) return 0;
  const minutes = elapsedSeconds / 60;
  const words = correctChars / 5;
  return Math.round(words / minutes);
}

/**
 * Standard Accuracy computation:
 * Accuracy % = ((totalTyped - errors) / totalTyped) * 100
 */
export function calculateAccuracy(totalTyped: number, errors: number): number {
  if (totalTyped <= 0) return 100;
  const correct = Math.max(0, totalTyped - errors);
  return Math.round((correct / totalTyped) * 100);
}
