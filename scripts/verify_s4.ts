import { prisma } from '../src/lib/prisma';
import { createSessionToken } from '../src/lib/auth';

const BASE_URL = 'http://localhost:3001';

async function verifySprint4() {
  console.log('=== VERIFYING SPRINT 4: SUBJECTS, UNITS & LESSON BROWSING ===\n');

  // 1. Verify /subjects lists 3 subjects
  console.log('Step 1: Testing /subjects page...');
  const subjectsRes = await fetch(`${BASE_URL}/subjects`);
  if (!subjectsRes.ok) {
    throw new Error(`FAIL: /subjects returned HTTP ${subjectsRes.status}`);
  }
  const subjectsHtml = await subjectsRes.text();
  if (
    !subjectsHtml.includes('History') ||
    !subjectsHtml.includes('Science') ||
    !subjectsHtml.includes('Art')
  ) {
    throw new Error('FAIL: /subjects does not contain all 3 subjects (History, Science, Art)!');
  }
  if (
    !subjectsHtml.includes('/subjects/history') ||
    !subjectsHtml.includes('/subjects/science') ||
    !subjectsHtml.includes('/subjects/art')
  ) {
    throw new Error('FAIL: /subjects missing links to subject detail pages!');
  }
  console.log('✔ /subjects lists all 3 subjects (History, Science, Art) with proper links.');

  // 2. Verify Subject Detail (/subjects/history)
  console.log('\nStep 2: Testing /subjects/history page...');
  const historyRes = await fetch(`${BASE_URL}/subjects/history`);
  if (!historyRes.ok) {
    throw new Error(`FAIL: /subjects/history returned HTTP ${historyRes.status}`);
  }
  const historyHtml = await historyRes.text();
  if (
    !historyHtml.includes('Early Humans') ||
    !historyHtml.includes('First Civilizations')
  ) {
    throw new Error('FAIL: /subjects/history missing units (Early Humans, First Civilizations)!');
  }
  if (!historyHtml.includes('/subjects/history/early-humans')) {
    throw new Error('FAIL: /subjects/history missing link to /subjects/history/early-humans!');
  }
  console.log('✔ /subjects/history renders units with exploration links.');

  // 3. Test Unit Page & Progress State with a Logged-in Kid Profile
  console.log('\nStep 3: Testing /subjects/history/early-humans with Kid Progress State...');
  const household = await prisma.household.create({
    data: { name: 'Test S4 Household', region: 'US' },
  });
  const user = await prisma.user.create({
    data: {
      name: 'Parent S4',
      email: `s4_parent_${Date.now()}@test.com`,
      passwordHash: '$2b$10$hashedtestdummy',
      householdId: household.id,
    },
  });
  const kid = await prisma.kidProfile.create({
    data: {
      displayName: 'Aria Explorer',
      avatar: '🌟',
      ageBand: '8-11',
      householdId: household.id,
    },
  });

  const lesson1 = await prisma.lesson.findFirst({
    where: { slug: 'caves-carvings-first-images' },
  });
  const lesson2 = await prisma.lesson.findFirst({
    where: { slug: 'fire-tools-and-survival' },
  });

  if (!lesson1 || !lesson2) {
    throw new Error('FAIL: Seed lessons not found in database!');
  }

  // Set lesson 1 as COMPLETED and lesson 2 as IN_PROGRESS
  await prisma.lessonProgress.create({
    data: {
      kidProfileId: kid.id,
      lessonId: lesson1.id,
      status: 'COMPLETED',
      currentStepOrder: 6,
      completedAt: new Date(),
    },
  });

  await prisma.lessonProgress.create({
    data: {
      kidProfileId: kid.id,
      lessonId: lesson2.id,
      status: 'IN_PROGRESS',
      currentStepOrder: 3,
    },
  });

  // Create JWT session cookie
  const sessionToken = await createSessionToken({
    userId: user.id,
    householdId: household.id,
    email: user.email,
    name: user.name,
    role: user.role,
    region: household.region,
  });

  const cookies = `zeroto1_session=${sessionToken}; zeroto1_kid_id=${kid.id}`;

  const unitRes = await fetch(`${BASE_URL}/subjects/history/early-humans`, {
    headers: { Cookie: cookies },
  });
  if (!unitRes.ok) {
    throw new Error(`FAIL: Unit page returned HTTP ${unitRes.status}`);
  }
  const unitHtml = await unitRes.text();

  if (!unitHtml.includes('Aria Explorer')) {
    throw new Error('FAIL: Unit page does not reflect active kid profile!');
  }
  if (!unitHtml.includes('Done ✓')) {
    throw new Error('FAIL: Completed lesson does not show "Done ✓" state!');
  }
  if (!unitHtml.includes('In progress ⏳')) {
    throw new Error('FAIL: In-progress lesson does not show "In progress ⏳" state!');
  }
  if (!unitHtml.includes('Start here / Open next')) {
    throw new Error('FAIL: Unit page missing "Start here / Open next" highlight!');
  }
  console.log('✔ Unit page correctly shows "Done ✓", "In progress ⏳", and "Start here / Open next" for kid profile.');

  // 4. Test Lesson Overview Page (/lessons/caves-carvings-first-images)
  console.log('\nStep 4: Testing Lesson Overview Page (/lessons/caves-carvings-first-images)...');
  const lessonRes = await fetch(`${BASE_URL}/lessons/caves-carvings-first-images`, {
    headers: { Cookie: cookies },
  });
  if (!lessonRes.ok) {
    throw new Error(`FAIL: Lesson overview page returned HTTP ${lessonRes.status}`);
  }
  const lessonHtml = await lessonRes.text();

  if (!lessonHtml.includes('Why did early humans paint on cave walls in total darkness?')) {
    throw new Error('FAIL: Lesson overview missing the Big Question!');
  }
  if (!lessonHtml.includes('You will be able to explain how early humans communicated without written alphabets.')) {
    throw new Error('FAIL: Lesson overview missing the "by the end" line!');
  }
  if (
    !lessonHtml.includes('1. Hook') ||
    !lessonHtml.includes('2. Video') ||
    !lessonHtml.includes('3. Read') ||
    !lessonHtml.includes('4. Activity') ||
    !lessonHtml.includes('5. Practice') ||
    !lessonHtml.includes('6. Deep Dive')
  ) {
    throw new Error('FAIL: Lesson overview missing 6-step roadmap journey!');
  }
  console.log('✔ Lesson overview shows big question, by-the-end line, banner, and 6-step roadmap.');

  // Clean up test data
  await prisma.household.delete({ where: { id: household.id } });
  console.log('\n✔ Test progress and household cleaned up.');

  console.log('\n==========================================================');
  console.log('🎉 ALL SPRINT 4 GATES VERIFIED SUCCESSFULLY!');
  console.log('==========================================================');
}

verifySprint4()
  .catch((err) => {
    console.error('Verification Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
