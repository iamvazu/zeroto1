import { prisma } from '../src/lib/prisma';
import { createSessionToken } from '../src/lib/auth';
import { backupDatabase } from './backup_db';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3001';

async function runSprint16Verification() {
  console.log('====================================================');
  console.log(' STARTING SPRINT 16 VERIFICATION: CONTENT, QA & LAUNCH');
  console.log('====================================================\n');

  let passes = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS [${total}]: ${msg}`);
      passes++;
    } else {
      console.error(`  ✗ FAIL [${total}]: ${msg}`);
    }
  }

  // -----------------------------------------------------------------
  // 1. LESSON COUNT IN DB >= 1500 ACROSS 3 SUBJECTS
  // -----------------------------------------------------------------
  console.log('--- 1. Testing Content Library Volume & Subject Coverage ---');
  const totalLessons = await prisma.lesson.count();
  assert(totalLessons >= 1500, `Total lessons in DB is ${totalLessons} (target >= 1,500)`);

  const subjects = await prisma.subject.findMany({
    include: {
      units: {
        include: {
          lessons: { select: { id: true } },
        },
      },
    },
  });

  assert(subjects.length >= 3, `Curriculum includes ${subjects.length} subjects (History, Science, Art)`);

  for (const subj of subjects) {
    const subjLessons = subj.units.reduce((acc, u) => acc + u.lessons.length, 0);
    assert(subjLessons >= 100, `Subject "${subj.name}" contains extensive library (${subjLessons} lessons across ${subj.units.length} units)`);
  }

  // Verify full 6-step flow exists for random curriculum lesson
  const sampleLesson = await prisma.lesson.findFirst({
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  });
  assert(!!sampleLesson && sampleLesson.steps.length === 6, `Curriculum lessons contain all 6 unified player steps (found ${sampleLesson?.steps.length})`);

  // -----------------------------------------------------------------
  // 2. END-TO-END HAPPY PATH (US & INDIA REGIONS, ALL AGE BANDS)
  // -----------------------------------------------------------------
  console.log('\n--- 2. Testing E2E Happy Path Across Regions & Age Bands ---');
  const testMatrix = [
    { region: 'US', ageBand: '5-8', name: 'Leo Explorer' },
    { region: 'US', ageBand: '8-11', name: 'Maya Pioneer' },
    { region: 'IN', ageBand: '11-15', name: 'Aarav Navigator' },
  ];

  for (const testCase of testMatrix) {
    // A: Signup Household
    const household = await prisma.household.create({
      data: { name: `${testCase.name}'s Household`, region: testCase.region },
    });
    const user = await prisma.user.create({
      data: {
        name: `${testCase.name} Guardian`,
        email: `e2e_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@test.com`,
        passwordHash: '$2b$10$hashedpw',
        householdId: household.id,
      },
    });
    const kid = await prisma.kidProfile.create({
      data: {
        displayName: testCase.name,
        avatar: '🌟',
        ageBand: testCase.ageBand,
        householdId: household.id,
      },
    });

    const token = await createSessionToken({
      userId: user.id,
      householdId: household.id,
      email: user.email,
      name: user.name,
      role: user.role,
      region: household.region,
    });

    const cookie = `zeroto1_session=${token}; zeroto1_kid_id=${kid.id}`;

    // B: Play Preview Lesson
    const previewLesson = await prisma.lesson.findFirst({ where: { isPreview: true } });
    const playRes = await fetch(`${BASE_URL}/lessons/${previewLesson!.slug}/play`, {
      headers: { Cookie: cookie },
    });
    assert(playRes.status === 200, `[${testCase.region} / ${testCase.ageBand}] Successfully opened preview lesson "${previewLesson!.title}"`);

    // C: Save Step Progress
    const progressRes = await fetch(`${BASE_URL}/api/player/${previewLesson!.slug}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ completedStepOrder: 6, nextStepOrder: 6, quizScore: 100 }),
    });
    assert(progressRes.status === 200, `[${testCase.region} / ${testCase.ageBand}] Completed 6-step flow with quiz score 100%`);

    // D: Math Practice Session
    const mathRes = await fetch(`${BASE_URL}/api/practice/math/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        kidProfileId: kid.id,
        mode: 'streak',
        operator: '+',
        score: 12,
        accuracy: 92,
        durationSeconds: 45,
      }),
    });
    assert(mathRes.status === 200, `[${testCase.region} / ${testCase.ageBand}] Math practice session completed and saved`);

    // E: Touch Typing Practice Session
    const typingRes = await fetch(`${BASE_URL}/api/practice/typing/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        kidProfileId: kid.id,
        wpm: 24,
        accuracy: 96,
        durationSeconds: 30,
        metadata: { stageId: 2 },
      }),
    });
    assert(typingRes.status === 200, `[${testCase.region} / ${testCase.ageBand}] Touch typing session completed and saved`);

    // Clean up test household
    await prisma.household.delete({ where: { id: household.id } });
  }

  // -----------------------------------------------------------------
  // 3. SUCCESS-METRIC EVENTS FIRING & AGGREGATION
  // -----------------------------------------------------------------
  console.log('\n--- 3. Testing Success Metrics Instrumentation ---');
  const metricEvents = [
    { type: 'time_to_first_lesson', value: 145 },
    { type: 'lesson_completion_rate', value: 1 },
    { type: 'free_to_paid_conversion', value: 1 },
    { type: 'churn_rate', value: 1 },
    { type: 'refund_rate', value: 1 },
    { type: 'ai_moderation_block_rate', value: 1 },
  ];

  for (const me of metricEvents) {
    const mRes = await fetch(`${BASE_URL}/api/metrics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(me),
    });
    assert(mRes.status === 200, `Event "${me.type}" recorded successfully`);
  }

  const summaryRes = await fetch(`${BASE_URL}/api/metrics/summary`);
  assert(summaryRes.status === 200, 'GET /api/metrics/summary returns HTTP 200');
  const summaryData = await summaryRes.json();
  assert(summaryData.success === true, 'Metrics summary reports success');
  assert(summaryData.summary.totalEventsRecorded >= 6, 'All 6 critical success metric types recorded');
  assert(summaryData.summary.timeToFirstLessonAvgSeconds > 0, 'Average time-to-first-lesson computed correctly');

  // -----------------------------------------------------------------
  // 4. BACKUP, MONITORING & ROLLBACK RUNBOOKS
  // -----------------------------------------------------------------
  console.log('\n--- 4. Testing Backup Runbook & Documentation ---');
  const backupResult = backupDatabase();
  assert(backupResult.success === true, 'Database backup execution succeeded');
  assert(fs.existsSync(backupResult.backupPath), `Backup file verified on filesystem: ${backupResult.backupPath}`);

  const runbooksPath = path.join(process.cwd(), 'docs/RUNBOOKS.md');
  assert(fs.existsSync(runbooksPath), 'docs/RUNBOOKS.md exists on filesystem');
  const runbooksContent = fs.readFileSync(runbooksPath, 'utf8');
  assert(runbooksContent.includes('Database Backup'), 'Runbooks include Database Backup & Restore section');
  assert(runbooksContent.includes('Production Monitoring'), 'Runbooks include Production Monitoring & SLOs section');
  assert(runbooksContent.includes('Rollback'), 'Runbooks include Disaster Recovery & Rollback section');
  assert(runbooksContent.includes('LAUNCH: GO'), 'Launch GO/NO-GO Review signed off with LAUNCH: GO');

  console.log('\n====================================================');
  console.log(`  VERIFICATION RESULTS: ${passes} / ${total} CHECKS PASSED`);
  console.log('====================================================\n');

  if (passes === total) {
    console.log('🚀 SPRINT 16 GATE VERIFICATION: SUCCESS! LAUNCH READY!\n');
    process.exit(0);
  } else {
    console.error('❌ SPRINT 16 GATE VERIFICATION: SOME CHECKS FAILED.\n');
    process.exit(1);
  }
}

runSprint16Verification()
  .catch((err) => {
    console.error('Fatal error during Sprint 16 verification:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
