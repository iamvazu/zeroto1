// zeroto1.academy — Verification Script for Sprint 11 (Touch Typing)
// Tests: Curriculum progression (j/f to pretzels), WPM/Accuracy formulas,
// next-key finger mapping, practice_sessions DB persistence, and typing web routes.

import { prisma } from '../src/lib/prisma';
import {
  TYPING_CURRICULUM,
  FINGER_MAPPING,
  FINGER_FRIENDLY_NAMES,
  calculateWpm,
  calculateAccuracy,
} from '../src/lib/practice/typing';

async function runSprint11Verification() {
  console.log('====================================================');
  console.log(' STARTING SPRINT 11 VERIFICATION: TOUCH TYPING');
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
  // 1. CURRICULUM PROGRESSION: j/f to "pretzels"
  // -----------------------------------------------------------------
  console.log('--- 1. Testing Curriculum Progression ---');
  assert(TYPING_CURRICULUM.length === 6, 'Curriculum contains 6 structured stages');

  const stage1 = TYPING_CURRICULUM[0];
  assert(stage1.practiceText.includes('j') && stage1.practiceText.includes('f'), 'Stage 1 starts with home keys j and f');

  const stage6 = TYPING_CURRICULUM[5];
  assert(stage6.practiceText.includes('pretzels'), 'Stage 6 culminates in "pretzels" challenge word');
  assert(stage6.practiceText.includes('curious') && stage6.practiceText.includes('discovery'), 'Stage 6 contains rich vocabulary words');

  // -----------------------------------------------------------------
  // 2. ON-SCREEN KEYBOARD HIGHLIGHTING & FINGER MAPPING
  // -----------------------------------------------------------------
  console.log('\n--- 2. Testing Key to Finger Mapping & Highlighting ---');
  assert(FINGER_MAPPING['j'] === 'right-index', 'Key "j" maps to right-index finger');
  assert(FINGER_MAPPING['f'] === 'left-index', 'Key "f" maps to left-index finger');
  assert(FINGER_MAPPING['a'] === 'left-pinky', 'Key "a" maps to left-pinky finger');
  assert(FINGER_MAPPING[';'] === 'right-pinky', 'Key ";" maps to right-pinky finger');
  assert(FINGER_MAPPING[' '] === 'thumb', 'Spacebar maps to thumb');

  // Verify finger friendly descriptions
  assert(FINGER_FRIENDLY_NAMES['left-index'] === 'Left Index Finger', 'Friendly finger names present');
  assert(FINGER_FRIENDLY_NAMES['right-index'] === 'Right Index Finger', 'Friendly finger names present');

  // -----------------------------------------------------------------
  // 3. WPM & ACCURACY METRICS COMPUTATION
  // -----------------------------------------------------------------
  console.log('\n--- 3. Testing WPM and Accuracy Formulas ---');
  // 50 characters in 30 seconds = 10 words in 0.5 minutes = 20 WPM
  const wpm1 = calculateWpm(50, 30);
  assert(wpm1 === 20, `50 chars in 30s calculates to 20 WPM (got: ${wpm1})`);

  // 250 characters in 60 seconds = 50 words in 1 minute = 50 WPM
  const wpm2 = calculateWpm(250, 60);
  assert(wpm2 === 50, `250 chars in 60s calculates to 50 WPM (got: ${wpm2})`);

  // Zero handling
  assert(calculateWpm(0, 30) === 0, 'Zero chars returns 0 WPM');
  assert(calculateWpm(50, 0) === 0, 'Zero seconds returns 0 WPM');

  // Accuracy: 100 typed, 5 errors = 95%
  const acc1 = calculateAccuracy(100, 5);
  assert(acc1 === 95, `100 typed with 5 errors calculates to 95% (got: ${acc1}%)`);

  // Accuracy: 50 typed, 0 errors = 100%
  const acc2 = calculateAccuracy(50, 0);
  assert(acc2 === 100, `50 typed with 0 errors calculates to 100% (got: ${acc2}%)`);

  // -----------------------------------------------------------------
  // 4. PRACTICE SESSIONS DB PERSISTENCE & HISTORY API
  // -----------------------------------------------------------------
  console.log('\n--- 4. Testing Session Persistence & History API ---');
  const saveRes = await fetch('http://localhost:3001/api/practice/typing/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wpm: 42,
      accuracy: 98,
      durationSeconds: 35,
      score: 145, // chars
      metadata: { lessonId: 'type-6-words-pretzels', stage: 6 },
    }),
  });

  assert(saveRes.status === 200, 'POST /api/practice/typing/session returned HTTP 200');
  const saveData = await saveRes.json();
  assert(saveData.success === true, 'Typing session successfully saved');
  assert(saveData.session?.type === 'TYPING', 'Session type is TYPING');
  assert(saveData.session?.wpm === 42, 'Recorded correct WPM in DB');

  // Fetch history
  const histRes = await fetch('http://localhost:3001/api/practice/typing/history');
  assert(histRes.status === 200, 'GET /api/practice/typing/history returned HTTP 200');
  const histData = await histRes.json();
  assert(histData.success === true, 'History fetch succeeded');
  assert(Array.isArray(histData.sessions) && histData.sessions.length > 0, 'Found typing sessions in DB history');
  assert(histData.stats.highestWpm >= 42, 'Recorded highest WPM in stats');

  // -----------------------------------------------------------------
  // 5. WEB PAGE ROUTE ACCESSIBILITY
  // -----------------------------------------------------------------
  console.log('\n--- 5. Testing Touch Typing Web Route ---');
  const pageRes = await fetch('http://localhost:3001/practice/typing');
  assert(pageRes.status === 200, 'GET /practice/typing returned HTTP 200');
  const pageHtml = await pageRes.text();
  assert(pageHtml.includes('Touch Typing Trainer'), 'Page rendered Touch Typing Trainer title');
  assert(pageHtml.includes('pretzels') || pageHtml.includes('Pretzels'), 'Page includes pretzels curriculum');
  assert(pageHtml.includes('SPACEBAR'), 'Page renders interactive on-screen keyboard');

  console.log('\n====================================================');
  console.log(`  VERIFICATION RESULTS: ${passes} / ${total} CHECKS PASSED`);
  console.log('====================================================\n');

  if (passes === total) {
    console.log('🎉 SPRINT 11 GATE VERIFICATION: SUCCESS!\n');
    process.exit(0);
  } else {
    console.error('❌ SPRINT 11 GATE VERIFICATION: SOME CHECKS FAILED.\n');
    process.exit(1);
  }
}

runSprint11Verification()
  .catch((err) => {
    console.error('Fatal error during Sprint 11 verification:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
