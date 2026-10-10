// zeroto1.academy — Verification Script for Sprint 9 (Custom Lesson UX & Deep Dive)
// Tests: Make Your Own Lesson, Live Deep Dive follow-ups, Re-asking cached lesson,
// Allowance counter display & decrement, and Exhausted allowance handling.

import { prisma } from '../src/lib/prisma';
import { getHouseholdAllowance } from '../src/lib/ai/ratelimit';

async function runSprint9Verification() {
  console.log('====================================================');
  console.log(' STARTING SPRINT 9 VERIFICATION: CUSTOM LESSON UX & DEEP DIVE');
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

  // Ensure test household
  let household = await prisma.household.findFirst({
    include: { kidProfiles: true },
  });

  if (!household) {
    household = await prisma.household.create({
      data: {
        name: 'Sprint 9 Family',
        region: 'US',
        customLessonAllowance: 75,
      },
      include: { kidProfiles: true },
    });
  }

  // Ensure allowance is at least 5 for testing
  if (household.customLessonAllowance < 5) {
    household = await prisma.household.update({
      where: { id: household.id },
      data: { customLessonAllowance: 70 },
      include: { kidProfiles: true },
    });
  }

  const initialAllowance = await getHouseholdAllowance(household.id);
  console.log(`Initial allowance: ${initialAllowance.remaining}/75\n`);

  // -----------------------------------------------------------------
  // 1. LIVE DEEP DIVE GENERATION
  // -----------------------------------------------------------------
  console.log('--- 1. Testing Live Deep Dive Generation Endpoint ---');
  const ddRes = await fetch('http://localhost:3001/api/ai/deep-dive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lessonTopic: 'Why do stars twinkle at night?',
      kidCuriosity: 'Do planets twinkle too, or only distant stars?',
    }),
  });

  assert(ddRes.status === 200, 'Deep Dive API returned HTTP 200');
  const ddData = await ddRes.json();
  assert(ddData.success === true, 'Deep Dive succeeded');
  assert(Array.isArray(ddData.data?.followUpPrompts) && ddData.data.followUpPrompts.length > 0, 'Returned follow-up prompts');
  assert(typeof ddData.data?.deeperFact === 'string' && ddData.data.deeperFact.length > 0, 'Returned deeper fact');
  assert(Array.isArray(ddData.data?.relatedTopics) && ddData.data.relatedTopics.length > 0, 'Returned related topics list');

  // -----------------------------------------------------------------
  // 2. GENERATE NEW CUSTOM LESSON VIA API & VERIFY ALLOWANCE DECREMENT
  // -----------------------------------------------------------------
  console.log('\n--- 2. Testing Custom Lesson Generation via API ---');
  const testQuestion = 'Why do stars twinkle at night in the sky?';

  // Clean previous duplicate for this test question
  await prisma.customLesson.deleteMany({
    where: { question: testQuestion },
  });

  const allowanceBefore = (await getHouseholdAllowance(household.id)).remaining;

  const genRes = await fetch('http://localhost:3001/api/lessons/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: testQuestion }),
  });

  assert(genRes.status === 200, 'Generate custom lesson API returned HTTP 200');
  const genData = await genRes.json();
  assert(genData.success === true, 'Generate custom lesson response succeeded');
  assert(!!genData.customLessonId, 'Returned customLessonId');

  const allowanceAfter = (await getHouseholdAllowance(household.id)).remaining;
  assert(
    allowanceAfter === allowanceBefore - 1,
    `Allowance decremented from ${allowanceBefore} to ${allowanceAfter}`
  );

  // -----------------------------------------------------------------
  // 3. VERIFY PLAYABILITY IN UNIFIED LESSON PLAYER
  // -----------------------------------------------------------------
  console.log('\n--- 3. Testing Playability in Unified Lesson Player ---');
  const playRes = await fetch(`http://localhost:3001/custom-lessons/${genData.customLessonId}/play`);
  assert(playRes.status === 200, 'Custom lesson player page returned HTTP 200');
  const playHtml = await playRes.text();
  assert(playHtml.includes('Step 1') || playHtml.includes('Hook'), 'Player renders Step 1 (Hook)');
  assert(playHtml.includes('Curious Explorer') || playHtml.includes('Maya') || playHtml.includes('Curious Kid'), 'Player binds kid profile');

  // -----------------------------------------------------------------
  // 4. RE-ASKING SAME QUESTION RETURNS CACHED LESSON (NO EXTRA ALLOWANCE DEDUCTION)
  // -----------------------------------------------------------------
  console.log('\n--- 4. Testing Re-asking Same Question (Cache Reuse) ---');
  const allowanceBeforeReask = (await getHouseholdAllowance(household.id)).remaining;

  const reaskRes = await fetch('http://localhost:3001/api/lessons/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: testQuestion }),
  });

  assert(reaskRes.status === 200, 'Re-ask API returned HTTP 200');
  const reaskData = await reaskRes.json();
  assert(reaskData.customLessonId === genData.customLessonId, 'Re-asking returned same cached customLessonId');

  const allowanceAfterReask = (await getHouseholdAllowance(household.id)).remaining;
  assert(
    allowanceAfterReask === allowanceBeforeReask,
    `Allowance was NOT decremented on cache reuse (${allowanceAfterReask} remaining)`
  );

  // -----------------------------------------------------------------
  // 5. EXHAUSTED ALLOWANCE HANDLING
  // -----------------------------------------------------------------
  console.log('\n--- 5. Testing Exhausted Allowance Handling ---');
  // Temporarily set allowance to 0
  const savedAllowance = household.customLessonAllowance;
  await prisma.household.update({
    where: { id: household.id },
    data: { customLessonAllowance: 0 },
  });

  const exhaustedRes = await fetch('http://localhost:3001/api/lessons/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'A completely new never-asked question about mars rovers' }),
  });

  assert(exhaustedRes.status === 403, 'Exhausted allowance returned HTTP 403 Forbidden');
  const exhaustedData = await exhaustedRes.json();
  assert(exhaustedData.error === 'ALLOWANCE_EXHAUSTED', 'Returned ALLOWANCE_EXHAUSTED error code');

  // Restore allowance
  await prisma.household.update({
    where: { id: household.id },
    data: { customLessonAllowance: savedAllowance },
  });
  console.log('Restored household allowance.');

  console.log('\n====================================================');
  console.log(`  VERIFICATION RESULTS: ${passes} / ${total} CHECKS PASSED`);
  console.log('====================================================\n');

  if (passes === total) {
    console.log('🎉 SPRINT 9 GATE VERIFICATION: SUCCESS!\n');
    process.exit(0);
  } else {
    console.error('❌ SPRINT 9 GATE VERIFICATION: SOME CHECKS FAILED.\n');
    process.exit(1);
  }
}

runSprint9Verification()
  .catch((err) => {
    console.error('Fatal error during Sprint 9 verification:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
