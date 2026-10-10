// zeroto1.academy — Verification Script for Sprint 10 (Math Practice Engine)
// Tests: 4 operators (+ − × ÷), 3 modes (free, clock, streak), adaptive difficulty algorithm,
// guided tracks + bonus challenge, integer division safety, and practice_sessions DB persistence.

import { prisma } from '../src/lib/prisma';
import {
  generateMathProblem,
  computeAdaptiveDifficulty,
  GUIDED_TRACKS,
  DifficultyLevel,
} from '../src/lib/practice/math';

async function runSprint10Verification() {
  console.log('====================================================');
  console.log(' STARTING SPRINT 10 VERIFICATION: MATH PRACTICE ENGINE');
  console.log('====================================================\n');

  let passes = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS [${total}]: ${desc}`);
      passes++;
    } else {
      console.error(`  ✗ FAIL [${total}]: ${desc}`);
    }
  }

  // -----------------------------------------------------------------
  // 1. ALL 4 OPERATORS & INTEGER/NON-NEGATIVE SAFETY
  // -----------------------------------------------------------------
  console.log('--- 1. Testing Math Problem Generation & Operator Rules ---');

  // Addition
  const addProb = generateMathProblem('+', 2);
  assert(addProb.operator === '+', 'Addition problem operator is +');
  assert(addProb.answer === addProb.num1 + addProb.num2, 'Addition answer is correct');

  // Subtraction
  const subProb = generateMathProblem('-', 2);
  assert(subProb.operator === '-', 'Subtraction problem operator is -');
  assert(subProb.answer === subProb.num1 - subProb.num2, 'Subtraction answer is correct');
  assert(subProb.answer >= 0, 'Subtraction result is non-negative');

  // Multiplication
  const mulProb = generateMathProblem('*', 3);
  assert(mulProb.operator === '*', 'Multiplication problem operator is *');
  assert(mulProb.answer === mulProb.num1 * mulProb.num2, 'Multiplication answer is correct');

  // Division (Must be integer quotient without remainder)
  const divProb = generateMathProblem('/', 3);
  assert(divProb.operator === '/', 'Division problem operator is /');
  assert(divProb.answer === divProb.num1 / divProb.num2, 'Division answer is exact quotient');
  assert(Number.isInteger(divProb.answer), 'Division answer has no decimal/remainder');
  assert(divProb.num1 % divProb.num2 === 0, 'Clean zero remainder division guaranteed');

  // Mixed operator
  const mixedProb = generateMathProblem('mixed', 2);
  assert(['+', '-', '*', '/'].includes(mixedProb.operator), 'Mixed operator picked a valid operation');

  // -----------------------------------------------------------------
  // 2. ADAPTIVE DIFFICULTY ALGORITHM
  // -----------------------------------------------------------------
  console.log('\n--- 2. Testing Adaptive Difficulty Dynamics ---');
  let level: DifficultyLevel = 2;

  // 3 consecutive correct -> level increases
  const upLevel = computeAdaptiveDifficulty(level, [true, true, true]);
  assert(upLevel === 3, '3 correct answers adaptively scales level from 2 to 3');

  // Cap at Level 5
  const maxLevel = computeAdaptiveDifficulty(5, [true, true, true]);
  assert(maxLevel === 5, 'Level caps cleanly at 5');

  // 2 consecutive wrong -> level decreases
  const downLevel = computeAdaptiveDifficulty(3, [false, false]);
  assert(downLevel === 2, '2 wrong answers gently scales level from 3 to 2');

  // Floor at Level 1
  const minLevel = computeAdaptiveDifficulty(1, [false, false]);
  assert(minLevel === 1, 'Level floors cleanly at 1');

  // Alternating -> maintains level
  const sameLevel = computeAdaptiveDifficulty(3, [true, false, true]);
  assert(sameLevel === 3, 'Mixed results maintain current level');

  // -----------------------------------------------------------------
  // 3. GUIDED TRACKS & BONUS CHALLENGE
  // -----------------------------------------------------------------
  console.log('\n--- 3. Testing Guided Tracks & Bonus Challenge Structure ---');
  assert(GUIDED_TRACKS.addition.length === 3, 'Addition guided track has 3 stages');
  assert(GUIDED_TRACKS.subtraction.length === 3, 'Subtraction guided track has 3 stages');
  assert(GUIDED_TRACKS.multiplication.length === 3, 'Multiplication guided track has 3 stages');
  assert(GUIDED_TRACKS.division.length === 3, 'Division guided track has 3 stages');
  assert(GUIDED_TRACKS.bonus.length === 1, 'Bonus challenge track is present');
  assert(GUIDED_TRACKS.bonus[0].isBonus === true, 'Bonus Grand Master challenge marked correctly');
  assert(GUIDED_TRACKS.bonus[0].operator === 'mixed', 'Bonus Grand Master uses mixed operators');

  // -----------------------------------------------------------------
  // 4. PRACTICE SESSIONS DB PERSISTENCE & HISTORY API
  // -----------------------------------------------------------------
  console.log('\n--- 4. Testing Session Persistence & History API ---');
  let testKid = await prisma.kidProfile.findFirst();
  if (!testKid) {
    const household = await prisma.household.findFirst();
    testKid = await prisma.kidProfile.create({
      data: {
        householdId: household!.id,
        displayName: 'Math Explorer',
        ageBand: '8-11',
      },
    });
  }

  // Post session via API
  const saveRes = await fetch('http://localhost:3001/api/practice/math/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'streak',
      operator: 'mixed',
      score: 12,
      accuracy: 92.3,
      durationSeconds: 45,
      metadata: { streak: 12, level: 3, trackId: 'bonus-grandmaster' },
    }),
  });

  assert(saveRes.status === 200, 'POST /api/practice/math/session returned HTTP 200');
  const saveData = await saveRes.json();
  assert(saveData.success === true, 'Session successfully saved to DB');
  assert(saveData.session?.type === 'MATH', 'Session type recorded as MATH');
  assert(saveData.session?.mode === 'streak', 'Session mode recorded as streak');

  // Fetch history via API
  const histRes = await fetch('http://localhost:3001/api/practice/math/history');
  assert(histRes.status === 200, 'GET /api/practice/math/history returned HTTP 200');
  const histData = await histRes.json();
  assert(histData.success === true, 'History fetch succeeded');
  assert(Array.isArray(histData.sessions) && histData.sessions.length > 0, 'Found saved sessions in history');
  assert(histData.stats.totalProblems >= 12, 'Stats accurately tally total solved problems');

  // -----------------------------------------------------------------
  // 5. TEST PRACTICE PAGE ROUTE ACCESSIBILITY
  // -----------------------------------------------------------------
  console.log('\n--- 5. Testing Practice Web Page Route ---');
  const pageRes = await fetch('http://localhost:3001/practice/math');
  assert(pageRes.status === 200, 'GET /practice/math returned HTTP 200');
  const pageHtml = await pageRes.text();
  assert(pageHtml.includes('Math Practice Engine'), 'Page rendered Math Practice Engine header');
  assert(pageHtml.includes('Guided Tracks'), 'Page rendered Guided Tracks navigation');
  assert(pageHtml.includes('Grand Master Challenge'), 'Page rendered Grand Master Challenge');

  console.log('\n====================================================');
  console.log(`  VERIFICATION RESULTS: ${passes} / ${total} CHECKS PASSED`);
  console.log('====================================================\n');

  if (passes === total) {
    console.log('🎉 SPRINT 10 GATE VERIFICATION: SUCCESS!\n');
    process.exit(0);
  } else {
    console.error('❌ SPRINT 10 GATE VERIFICATION: SOME CHECKS FAILED.\n');
    process.exit(1);
  }
}

runSprint10Verification()
  .catch((err) => {
    console.error('Fatal error during Sprint 10 verification:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
