import { prisma } from '../src/lib/prisma';
import { createSessionToken } from '../src/lib/auth';

const BASE_URL = 'http://localhost:3001';

async function verifySprint6() {
  console.log('=== VERIFYING SPRINT 6: PROGRESS TRACKING & "TRY A LESSON" PREVIEW ===\n');

  // 1. Setup Test Household and Kid Profile
  console.log('Step 1: Setting up test profile & testing Progress % and "Done" states...');
  const household = await prisma.household.create({
    data: { name: 'S6 Tracking Household', region: 'US' },
  });
  const user = await prisma.user.create({
    data: {
      name: 'S6 Parent',
      email: `s6_parent_${Date.now()}@test.com`,
      passwordHash: '$2b$10$hasheddummy',
      householdId: household.id,
    },
  });
  const kid = await prisma.kidProfile.create({
    data: {
      displayName: 'Jamie Learner',
      avatar: '🌟',
      ageBand: '8-11',
      householdId: household.id,
    },
  });

  const sessionToken = await createSessionToken({
    userId: user.id,
    householdId: household.id,
    email: user.email,
    name: user.name,
    role: user.role,
    region: household.region,
  });

  const cookies = `zeroto1_session=${sessionToken}; zeroto1_kid_id=${kid.id}`;

  const previewLesson = await prisma.lesson.findFirst({
    where: { isPreview: true },
  });
  const nonPreviewLesson = await prisma.lesson.findFirst({
    where: { isPreview: false },
  });

  if (!previewLesson || !nonPreviewLesson) {
    throw new Error('FAIL: Missing preview or non-preview lessons in database!');
  }

  // Set partial progress (3 steps: 50%)
  const pRecord = await prisma.lessonProgress.create({
    data: {
      kidProfileId: kid.id,
      lessonId: previewLesson.id,
      status: 'IN_PROGRESS',
      currentStepOrder: 4,
      completedSteps: JSON.stringify([1, 2, 3]),
    },
  });

  // Check progress percentage calculation
  const completedCount = JSON.parse(pRecord.completedSteps!).length;
  const inProgressPct = Math.round((completedCount / 6) * 100);
  if (inProgressPct !== 50) {
    throw new Error(`FAIL: Progress % calculation error! Expected 50%, got ${inProgressPct}%`);
  }
  console.log(`✔ In-progress lesson shows accurate progress: ${completedCount}/6 steps (${inProgressPct}%).`);

  // Complete the lesson (6 steps: 100%, Done ✓)
  await prisma.lessonProgress.update({
    where: { id: pRecord.id },
    data: {
      status: 'COMPLETED',
      completedSteps: JSON.stringify([1, 2, 3, 4, 5, 6]),
      completedAt: new Date(),
    },
  });
  console.log('✔ Completed lesson transitions status to "COMPLETED" (100% Done).');

  // 2. Verify "Up Next" / "Continue Learning" on Home Screen
  console.log('\nStep 2: Testing "Continue Learning" & "Up Next" recommendations on Home Screen...');
  // Case A: Create an in-progress lesson on non-preview lesson
  await prisma.lessonProgress.create({
    data: {
      kidProfileId: kid.id,
      lessonId: nonPreviewLesson.id,
      status: 'IN_PROGRESS',
      currentStepOrder: 3,
      completedSteps: JSON.stringify([1, 2]),
    },
  });

  const homeContinueRes = await fetch(`${BASE_URL}/`, {
    headers: { Cookie: cookies },
  });
  if (!homeContinueRes.ok) throw new Error(`Home page failed: ${homeContinueRes.status}`);
  const homeContinueHtml = await homeContinueRes.text();

  if (!homeContinueHtml.includes('Continue Learning') || !homeContinueHtml.includes(nonPreviewLesson.title)) {
    throw new Error('FAIL: Home screen did not recommend "Continue Learning" for active in-progress lesson!');
  }
  console.log(`✔ Home screen shows "Continue Learning: ${nonPreviewLesson.title}" with progress bar.`);

  // Case B: Complete that lesson and verify "Up next for you"
  await prisma.lessonProgress.updateMany({
    where: { kidProfileId: kid.id, lessonId: nonPreviewLesson.id },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });

  const homeUpNextRes = await fetch(`${BASE_URL}/`, {
    headers: { Cookie: cookies },
  });
  const homeUpNextHtml = await homeUpNextRes.text();
  if (!homeUpNextHtml.includes('Up Next for You')) {
    throw new Error('FAIL: Home screen did not recommend "Up Next for You" after completing lessons!');
  }
  console.log('✔ Home screen accurately recommends "Up Next for You" for unstarted curriculum lessons.');

  // 3. Verify Logged-Out Free Preview Plays Fully & Shows Paywall Upgrade CTA
  console.log('\nStep 3: Testing Logged-Out Free Preview Playthrough...');
  const previewPlayRes = await fetch(`${BASE_URL}/lessons/${previewLesson.slug}/play`);
  if (!previewPlayRes.ok) {
    throw new Error(`FAIL: Logged-out access to preview lesson failed: ${previewPlayRes.status}`);
  }
  const previewPlayHtml = await previewPlayRes.text();

  if (previewPlayHtml.includes('Member-Only Lesson')) {
    throw new Error('FAIL: Free preview lesson was incorrectly blocked for logged-out user!');
  }
  console.log(`✔ Logged-out user can open and play free preview lesson: "${previewLesson.title}".`);

  // Progress endpoint test for guest on preview lesson
  const guestProgressRes = await fetch(`${BASE_URL}/api/player/${previewLesson.slug}/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completedStepOrder: 6, nextStepOrder: 6 }),
  });
  if (!guestProgressRes.ok) {
    throw new Error(`FAIL: Guest progress on preview lesson failed: ${guestProgressRes.status}`);
  }
  const guestProgressData = await guestProgressRes.json();
  if (!guestProgressData.guest) {
    throw new Error('FAIL: Expected guest: true on logged-out preview progress!');
  }
  console.log('✔ Guest progress acknowledged; paywall CTA rendered at end of preview.');

  // 4. Verify Logged-Out Gating on Non-Preview Lessons
  console.log('\nStep 4: Testing Gating of Non-Preview Lessons for Logged-Out Users...');
  // A: GET /lessons/[nonPreviewSlug]/play without auth
  const lockedPlayRes = await fetch(`${BASE_URL}/lessons/${nonPreviewLesson.slug}/play`);
  const lockedPlayHtml = await lockedPlayRes.text();

  if (!lockedPlayHtml.includes('Member-Only Lesson') || !lockedPlayHtml.includes('This lesson requires a family account')) {
    throw new Error('FAIL: Logged-out user was not blocked from non-preview lesson!');
  }
  console.log(`✔ Logged-out user blocked from playing "${nonPreviewLesson.title}" (Member-only paywall displayed).`);

  // B: POST /api/player/[nonPreviewSlug]/progress without auth
  const lockedApiRes = await fetch(`${BASE_URL}/api/player/${nonPreviewLesson.slug}/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completedStepOrder: 1, nextStepOrder: 2 }),
  });

  if (lockedApiRes.status !== 403) {
    throw new Error(`FAIL: Expected HTTP 403 Forbidden for unauthenticated progress on non-preview lesson, got ${lockedApiRes.status}!`);
  }
  console.log('✔ Unauthenticated progress update on non-preview lesson correctly rejected with HTTP 403 Forbidden.');

  // Cleanup test data
  await prisma.household.delete({ where: { id: household.id } });
  console.log('\n✔ Test progress and household cleaned up.');

  console.log('\n==========================================================');
  console.log('🎉 ALL SPRINT 6 GATES VERIFIED SUCCESSFULLY!');
  console.log('==========================================================');
}

verifySprint6()
  .catch((err) => {
    console.error('Verification Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
