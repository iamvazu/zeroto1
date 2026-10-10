// zeroto1.academy — Verification Script for Sprint 12 (Parent Dashboard & Household Management)
// Tests: Calm parent dashboard API, finished lessons tally per kid, gentle stuck-points insights,
// custom-lesson allowance tracking, and profile CRUD persistence.

import { prisma } from '../src/lib/prisma';
import { getHouseholdAllowance } from '../src/lib/ai/ratelimit';
import { createSessionToken } from '../src/lib/auth';

async function runSprint12Verification() {
  console.log('====================================================');
  console.log(' STARTING SPRINT 12 VERIFICATION: PARENT DASHBOARD');
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

  // Ensure household
  let household = await prisma.household.findFirst({
    include: { kidProfiles: true },
  });

  if (!household) {
    household = await prisma.household.create({
      data: {
        name: 'The Curie Family',
        region: 'US',
        customLessonAllowance: 68,
      },
      include: { kidProfiles: true },
    });
  }

  // Ensure test kid
  let testKid = household.kidProfiles[0];
  if (!testKid) {
    testKid = await prisma.kidProfile.create({
      data: {
        householdId: household.id,
        displayName: 'Eva Curie',
        ageBand: '8-11',
        avatar: '🎨',
      },
    });
  }

  // Ensure at least 1 completed lesson progress
  const sampleLesson = await prisma.lesson.findFirst();
  if (sampleLesson) {
    await prisma.lessonProgress.upsert({
      where: {
        kidProfileId_lessonId: {
          kidProfileId: testKid.id,
          lessonId: sampleLesson.id,
        },
      },
      update: {
        status: 'COMPLETED',
        currentStepOrder: 6,
        completedSteps: JSON.stringify([1, 2, 3, 4, 5, 6]),
        completedAt: new Date(),
        quizScore: 90,
      },
      create: {
        kidProfileId: testKid.id,
        lessonId: sampleLesson.id,
        status: 'COMPLETED',
        currentStepOrder: 6,
        completedSteps: JSON.stringify([1, 2, 3, 4, 5, 6]),
        completedAt: new Date(),
        quizScore: 90,
      },
    });
  }

  // Ensure a paused lesson with tricky quiz to test gentle stuck point
  const secondLesson = await prisma.lesson.findFirst({
    where: { id: { not: sampleLesson?.id } },
  });

  if (secondLesson) {
    await prisma.lessonProgress.upsert({
      where: {
        kidProfileId_lessonId: {
          kidProfileId: testKid.id,
          lessonId: secondLesson.id,
        },
      },
      update: {
        status: 'IN_PROGRESS',
        currentStepOrder: 3,
        completedSteps: JSON.stringify([1, 2]),
        quizScore: 60, // Tricky quiz triggers gentle insight
      },
      create: {
        kidProfileId: testKid.id,
        lessonId: secondLesson.id,
        status: 'IN_PROGRESS',
        currentStepOrder: 3,
        completedSteps: JSON.stringify([1, 2]),
        quizScore: 60,
      },
    });
  }

  // -----------------------------------------------------------------
  // 1. PARENT DASHBOARD API CALL
  // -----------------------------------------------------------------
  console.log('--- 1. Testing Parent Dashboard API Endpoint ---');
  const dashRes = await fetch('http://localhost:3001/api/parent/dashboard');
  assert(dashRes.status === 200, 'GET /api/parent/dashboard returned HTTP 200');

  const dashData = await dashRes.json();
  assert(dashData.success === true, 'Parent dashboard API response succeeded');
  assert(!!dashData.household, 'Household metadata present in response');

  // -----------------------------------------------------------------
  // 2. FINISHED LESSONS ACCURACY PER KID
  // -----------------------------------------------------------------
  console.log('\n--- 2. Testing Finished Lessons Accuracy Per Kid ---');
  const kidSummary = dashData.kids?.find((k: any) => k.id === testKid.id);
  assert(!!kidSummary, 'Found target kid profile in dashboard payload');
  assert(
    Array.isArray(kidSummary?.finishedLessons) && kidSummary.finishedLessons.length >= 1,
    'Finished lessons correctly tallied and present'
  );
  assert(kidSummary.finishedLessons[0].title === sampleLesson?.title, 'Correct finished lesson title rendered');

  // -----------------------------------------------------------------
  // 3. GENTLE STUCK POINTS INSIGHTS (NO SHAME)
  // -----------------------------------------------------------------
  console.log('\n--- 3. Testing Gentle Stuck Points Insights ---');
  assert(
    Array.isArray(kidSummary?.stuckPoints) && kidSummary.stuckPoints.length > 0,
    'Stuck points detected and populated'
  );

  const quizStuck = kidSummary.stuckPoints.find((s: any) => s.type === 'quiz_challenge');
  assert(!!quizStuck, 'Detected tricky quiz challenge stuck point');
  assert(
    quizStuck?.gentleInsight.includes('dinner') || quizStuck?.gentleInsight.includes('re-explainer'),
    'Stuck point provides gentle conversational framing instead of harsh grades'
  );

  const pausedStuck = kidSummary.stuckPoints.find((s: any) => s.type === 'paused_lesson');
  assert(!!pausedStuck, 'Detected paused exploration stuck point');
  assert(
    pausedStuck?.gentleInsight.includes('self-paced') || pausedStuck?.gentleInsight.includes('anytime'),
    'Paused lesson framed as self-paced exploration'
  );

  // -----------------------------------------------------------------
  // 4. CUSTOM LESSON ALLOWANCE TRACKING
  // -----------------------------------------------------------------
  console.log('\n--- 4. Testing Allowance Usage Accuracy ---');
  const allowance = await getHouseholdAllowance(household.id);
  assert(dashData.allowance.total === 75, 'Total monthly allowance is 75');
  assert(dashData.allowance.remaining === allowance.remaining, 'Remaining allowance matches live DB allowance');
  assert(dashData.allowance.used === 75 - allowance.remaining, 'Used allowance matches formula');
  assert(!!dashData.allowance.resetAt, 'Reset date clearly specified');

  // -----------------------------------------------------------------
  // 5. PROFILE MANAGEMENT (ADD / EDIT / DELETE)
  // -----------------------------------------------------------------
  console.log('\n--- 5. Testing Kid Profile Management Persistence ---');

  // Create kid
  const newKid = await prisma.kidProfile.create({
    data: {
      householdId: household.id,
      displayName: 'Temporary Test Kid',
      avatar: '🦖',
      ageBand: '5-8',
    },
  });
  assert(!!newKid.id, 'Created new kid profile successfully');

  // Update kid
  const updatedKid = await prisma.kidProfile.update({
    where: { id: newKid.id },
    data: {
      displayName: 'Updated Test Kid',
      ageBand: '11-15',
    },
  });
  assert(updatedKid.displayName === 'Updated Test Kid', 'Updated kid profile name persists');
  assert(updatedKid.ageBand === '11-15', 'Updated kid profile age band persists');

  // Delete kid
  await prisma.kidProfile.delete({
    where: { id: newKid.id },
  });
  const checkDeleted = await prisma.kidProfile.findUnique({
    where: { id: newKid.id },
  });
  assert(checkDeleted === null, 'Deleted kid profile removed cleanly from DB');

  // -----------------------------------------------------------------
  // 6. PARENT WEB PAGE ROUTE (AUTHENTICATED)
  // -----------------------------------------------------------------
  console.log('\n--- 6. Testing Parent Web Page Route ---');
  let testUser = await prisma.user.findFirst();
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        householdId: household.id,
        email: 'parent.test@zeroto1.academy',
        passwordHash: 'dummy',
        name: 'Parent Tester',
        role: 'PARENT',
      },
    });
  }

  const token = await createSessionToken({
    userId: testUser.id,
    householdId: household.id,
    email: testUser.email,
    name: testUser.name,
    role: testUser.role,
    region: household.region,
  });

  const pageRes = await fetch('http://localhost:3001/app/parent', {
    headers: {
      Cookie: `zeroto1_session=${token}`,
    },
  });
  assert(pageRes.status === 200, 'GET /app/parent with session cookie returned HTTP 200');
  const pageHtml = await pageRes.text();
  assert(
    pageHtml.includes('Parent') || pageHtml.includes('Loading your calm parent dashboard'),
    'Parent dashboard shell rendered successfully'
  );

  console.log('\n====================================================');
  console.log(`  VERIFICATION RESULTS: ${passes} / ${total} CHECKS PASSED`);
  console.log('====================================================\n');

  if (passes === total) {
    console.log('🎉 SPRINT 12 GATE VERIFICATION: SUCCESS!\n');
    process.exit(0);
  } else {
    console.error('❌ SPRINT 12 GATE VERIFICATION: SOME CHECKS FAILED.\n');
    process.exit(1);
  }
}

runSprint12Verification()
  .catch((err) => {
    console.error('Fatal error during Sprint 12 verification:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
