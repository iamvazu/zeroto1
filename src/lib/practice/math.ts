// zeroto1.academy — Math Practice Engine (PRD §5.4, Sprint 10)
// Adaptive difficulty, 4 operators (+ − × ÷), 3 modes (free, clock, streak), and guided tracks.

export type MathOperator = '+' | '-' | '*' | '/' | 'mixed';
export type MathMode = 'free' | 'clock' | 'streak';
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export interface MathProblem {
  id: string;
  num1: number;
  operator: '+' | '-' | '*' | '/';
  num2: number;
  answer: number;
  level: DifficultyLevel;
}

export interface GuidedTrackStage {
  id: string;
  name: string;
  description: string;
  operator: MathOperator;
  level: DifficultyLevel;
  targetCount: number;
  isBonus?: boolean;
}

export const GUIDED_TRACKS: Record<string, GuidedTrackStage[]> = {
  addition: [
    { id: 'add-1', name: 'Plus within 10', description: 'Master sums up to 10', operator: '+', level: 1, targetCount: 10 },
    { id: 'add-2', name: 'Sums to 20', description: 'Crossing the 10 threshold with confidence', operator: '+', level: 2, targetCount: 10 },
    { id: 'add-3', name: 'Double Digit Power', description: 'Add 2-digit numbers without paper', operator: '+', level: 3, targetCount: 10 },
  ],
  subtraction: [
    { id: 'sub-1', name: 'Minus within 10', description: 'Quick take-aways from 1 to 10', operator: '-', level: 1, targetCount: 10 },
    { id: 'sub-2', name: 'Minus from 20', description: 'Subtracting across the tens barrier', operator: '-', level: 2, targetCount: 10 },
    { id: 'sub-3', name: 'Two-Digit Subtraction', description: 'Subtracting larger numbers mentally', operator: '-', level: 3, targetCount: 10 },
  ],
  multiplication: [
    { id: 'mul-1', name: '2s, 5s & 10s Tables', description: 'The foundation patterns of multiplication', operator: '*', level: 1, targetCount: 10 },
    { id: 'mul-2', name: '3s, 4s & 6s Tables', description: 'Intermediate mental times tables', operator: '*', level: 2, targetCount: 10 },
    { id: 'mul-3', name: '7s, 8s, 9s & 12s Tables', description: 'Master the trickiest times tables', operator: '*', level: 3, targetCount: 10 },
  ],
  division: [
    { id: 'div-1', name: 'Halves & 5s Division', description: 'Dividing evenly by 2, 5, and 10', operator: '/', level: 1, targetCount: 10 },
    { id: 'div-2', name: 'Core Division Facts', description: 'Dividing within 50 without remainders', operator: '/', level: 2, targetCount: 10 },
    { id: 'div-3', name: 'Master Division', description: 'Dividing larger numbers cleanly', operator: '/', level: 3, targetCount: 10 },
  ],
  bonus: [
    { id: 'bonus-grandmaster', name: 'The Grand Master Challenge', description: 'All 4 operators (+ − × ÷) at high speed!', operator: 'mixed', level: 4, targetCount: 15, isBonus: true },
  ],
};

/**
 * Generate a random integer between min and max inclusive.
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a clean, age-tailored mental math problem.
 */
export function generateMathProblem(
  chosenOperator: MathOperator = '+',
  level: DifficultyLevel = 1
): MathProblem {
  let op: '+' | '-' | '*' | '/';

  if (chosenOperator === 'mixed') {
    const ops: Array<'+' | '-' | '*' | '/'> = ['+', '-', '*', '/'];
    op = ops[Math.floor(Math.random() * ops.length)];
  } else {
    op = chosenOperator;
  }

  let num1 = 0;
  let num2 = 0;
  let answer = 0;

  switch (op) {
    case '+': {
      if (level === 1) {
        num1 = randomInt(1, 9);
        num2 = randomInt(1, 9);
      } else if (level === 2) {
        num1 = randomInt(6, 18);
        num2 = randomInt(5, 15);
      } else if (level === 3) {
        num1 = randomInt(15, 50);
        num2 = randomInt(12, 45);
      } else if (level === 4) {
        num1 = randomInt(35, 99);
        num2 = randomInt(25, 95);
      } else {
        num1 = randomInt(100, 450);
        num2 = randomInt(50, 350);
      }
      answer = num1 + num2;
      break;
    }

    case '-': {
      if (level === 1) {
        num2 = randomInt(1, 8);
        num1 = randomInt(num2, 10);
      } else if (level === 2) {
        num2 = randomInt(4, 12);
        num1 = randomInt(num2 + 1, 25);
      } else if (level === 3) {
        num2 = randomInt(12, 35);
        num1 = randomInt(num2 + 5, 75);
      } else if (level === 4) {
        num2 = randomInt(25, 65);
        num1 = randomInt(num2 + 10, 120);
      } else {
        num2 = randomInt(50, 250);
        num1 = randomInt(num2 + 20, 500);
      }
      answer = num1 - num2;
      break;
    }

    case '*': {
      if (level === 1) {
        const table = [2, 5, 10][Math.floor(Math.random() * 3)];
        num1 = randomInt(1, 10);
        num2 = table;
      } else if (level === 2) {
        num1 = randomInt(2, 9);
        num2 = randomInt(3, 6);
      } else if (level === 3) {
        num1 = randomInt(4, 12);
        num2 = randomInt(6, 11);
      } else if (level === 4) {
        num1 = randomInt(11, 15);
        num2 = randomInt(4, 12);
      } else {
        num1 = randomInt(15, 25);
        num2 = randomInt(6, 15);
      }
      answer = num1 * num2;
      break;
    }

    case '/': {
      // Division always creates whole numbers without remainders: num1 = answer * num2
      let divisor = 2;
      let quotient = 2;

      if (level === 1) {
        divisor = [2, 5, 10][Math.floor(Math.random() * 3)];
        quotient = randomInt(1, 10);
      } else if (level === 2) {
        divisor = randomInt(2, 6);
        quotient = randomInt(2, 9);
      } else if (level === 3) {
        divisor = randomInt(3, 9);
        quotient = randomInt(4, 12);
      } else if (level === 4) {
        divisor = randomInt(6, 12);
        quotient = randomInt(6, 15);
      } else {
        divisor = randomInt(8, 16);
        quotient = randomInt(12, 25);
      }

      num1 = divisor * quotient;
      num2 = divisor;
      answer = quotient;
      break;
    }
  }

  return {
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    num1,
    operator: op,
    num2,
    answer,
    level,
  };
}

/**
 * Evaluates adaptive difficulty based on recent answer streaks.
 * Rule: 3 consecutive correct answers -> level + 1 (max 5)
 *       2 consecutive incorrect answers -> level - 1 (min 1)
 */
export function computeAdaptiveDifficulty(
  currentLevel: DifficultyLevel,
  recentHistory: boolean[] // true = correct, false = incorrect
): DifficultyLevel {
  if (recentHistory.length >= 3) {
    const last3 = recentHistory.slice(-3);
    if (last3.every((res) => res === true)) {
      return Math.min(5, currentLevel + 1) as DifficultyLevel;
    }
  }

  if (recentHistory.length >= 2) {
    const last2 = recentHistory.slice(-2);
    if (last2.every((res) => res === false)) {
      return Math.max(1, currentLevel - 1) as DifficultyLevel;
    }
  }

  return currentLevel;
}
