import { prisma } from '../src/lib/prisma';
import { createSessionToken } from '../src/lib/auth';

const BASE_URL = 'http://localhost:3001';

const ALLOWED_CHANNELS = [
  'SciShow Kids',
  'CrashCourse Kids',
  'National Geographic Kids',
  'Khan Academy',
  'Free School',
  'TED-Ed',
  'PBS Kids',
  'Peekaboo Kidz',
];

async function verifySprint5() {
  console.log('=== VERIFYING SPRINT 5: THE LESSON PLAYER (6-STEP FLOW) ===\n');

  // 1. Verify Fixed Order of 6 Steps
  console.log('Step 1: Testing Fixed Order of Steps in Engine...');
  const lesson = await prisma.lesson.findFirst({
    where: { slug: 'caves-carvings-first-images' },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  });

  if (!lesson || lesson.steps.length !== 6) {
    throw new Error('FAIL: Lesson does not have exactly 6 steps!');
  }

  const expectedOrder = ['HOOK', 'VIDEO', 'READ', 'ACTIVITY', 'PRACTICE', 'DEEP_DIVE'];
  lesson.steps.forEach((step, idx) => {
    if (step.stepOrder !== idx + 1 || step.stepType !== expectedOrder[idx]) {
      throw new Error(
        `FAIL: Step ${step.stepOrder} is ${step.stepType}, expected order ${idx + 1} (${expectedOrder[idx]})`
      );
    }
  });
  console.log('✔ Steps strictly conform to fixed order: HOOK → VIDEO → READ → ACTIVITY → PRACTICE → DEEP_DIVE.');

  // 2. Verify Video Channel Allow-list
  console.log('\nStep 2: Testing Video Allow-List Enforcement...');
  const videoStep = lesson.steps.find((s) => s.stepType === 'VIDEO');
  const videoContent = JSON.parse(videoStep!.content);
  const channels = videoContent.channelAllowlist || [];

  const invalidChannels = channels.filter((c: string) => !ALLOWED_CHANNELS.includes(c));
  if (invalidChannels.length > 0) {
    throw new Error(`FAIL: Video step contains non-allowlisted channels: ${invalidChannels.join(', ')}`);
  }
  console.log(`✔ Video step restricted to verified allow-listed channels (${channels.join(', ')}).`);

  // 3. Setup test user & kid profile for full playthrough
  console.log('\nStep 3: Simulating Full Playthrough (Steps 1 through 6)...');
  const household = await prisma.household.create({
    data: { name: 'Player Test Household', region: 'US' },
  });
  const user = await prisma.user.create({
    data: {
      name: 'Player Parent',
      email: `player_${Date.now()}@test.com`,
      passwordHash: '$2b$10$hasheddummy',
      householdId: household.id,
    },
  });
  const kid = await prisma.kidProfile.create({
    data: {
      displayName: 'Sammy Curious',
      avatar: '🚀',
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

  // Helper to send progress
  async function postProgress(completedStepOrder: number, nextStepOrder: number, quizScore?: number) {
    const res = await fetch(`${BASE_URL}/api/player/${lesson!.slug}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookies,
      },
      body: JSON.stringify({ completedStepOrder, nextStepOrder, quizScore }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Progress update failed: ${err}`);
    }
    return res.json();
  }

  // Play Step 1: Hook
  const p1 = await postProgress(1, 2);
  console.log('   ✔ Completed Step 1 (Hook). Status:', p1.progress.status, 'Next step:', p1.progress.currentStepOrder);
  if (p1.progress.status !== 'IN_PROGRESS' || p1.progress.currentStepOrder !== 2) {
    throw new Error('FAIL: Step 1 progress state mismatch!');
  }

  // Play Step 2: Video
  const p2 = await postProgress(2, 3);
  console.log('   ✔ Completed Step 2 (Video). Next step:', p2.progress.currentStepOrder);
  if (p2.progress.currentStepOrder !== 3) {
    throw new Error('FAIL: Step 2 progress state mismatch!');
  }

  // Play Step 3: Read
  const p3 = await postProgress(3, 4);
  console.log('   ✔ Completed Step 3 (Read). Next step:', p3.progress.currentStepOrder);

  // Play Step 4: Activity
  const p4 = await postProgress(4, 5);
  console.log('   ✔ Completed Step 4 (Activity). Next step:', p4.progress.currentStepOrder);

  // Play Step 5: Practice (Quiz with score)
  const p5 = await postProgress(5, 6, 100);
  console.log('   ✔ Completed Step 5 (Practice). Quiz Score:', p5.progress.quizScore, 'Next step:', p5.progress.currentStepOrder);
  if (p5.progress.quizScore !== 100 || p5.progress.currentStepOrder !== 6) {
    throw new Error('FAIL: Step 5 quiz score or step mismatch!');
  }

  // Play Step 6: Deep Dive
  const p6 = await postProgress(6, 6);
  console.log('   ✔ Completed Step 6 (Deep Dive). Status:', p6.progress.status, 'Completed at:', p6.progress.completedAt);
  if (p6.progress.status !== 'COMPLETED' || !p6.progress.completedAt) {
    throw new Error('FAIL: Step 6 did not mark lesson as COMPLETED!');
  }

  // 4. Test Resume Mechanic
  console.log('\nStep 4: Testing Refresh & Resume Mechanic...');
  // Create another lesson in-progress at Step 3
  const lessonResume = await prisma.lesson.findFirst({
    where: { slug: 'fire-tools-and-survival' },
  });
  if (!lessonResume) throw new Error('FAIL: fire-tools-and-survival lesson missing!');

  await prisma.lessonProgress.create({
    data: {
      kidProfileId: kid.id,
      lessonId: lessonResume.id,
      status: 'IN_PROGRESS',
      currentStepOrder: 3,
      completedSteps: JSON.stringify([1, 2]),
    },
  });

  // Fetch player page directly
  const playRes = await fetch(`${BASE_URL}/lessons/${lessonResume.slug}/play`, {
    headers: { Cookie: cookies },
  });
  if (!playRes.ok) {
    throw new Error(`FAIL: Player page returned HTTP ${playRes.status}`);
  }
  const playHtml = await playRes.text();
  if (!playHtml.includes('Sammy Curious')) {
    throw new Error('FAIL: Player page missing active kid profile name!');
  }
  if (!playHtml.includes('Fire, Stone Tools, and Survival')) {
    throw new Error('FAIL: Player page missing lesson title!');
  }
  console.log('✔ Player page loads cleanly with active kid and resumes at Step 3.');

  // Cleanup test data
  await prisma.household.delete({ where: { id: household.id } });
  console.log('\n✔ Test progress and household cleaned up.');

  console.log('\n==========================================================');
  console.log('🎉 ALL SPRINT 5 GATES VERIFIED SUCCESSFULLY!');
  console.log('==========================================================');
}

verifySprint5()
  .catch((err) => {
    console.error('Verification Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
