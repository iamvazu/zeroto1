// zeroto1.academy — Verification Script for Sprint 7 (AI Middleware Core)
// Tests: Classify, 5 Prompt tasks, Caching (Redis/memory), Rate Limiting, Household Allowance, Provider Swappability, Secret Redaction, and ai_jobs tracking.

import { prisma } from '../src/lib/prisma';
import { aiService } from '../src/lib/ai/service';
import { checkBurstRateLimit, resetBurstRateLimit, getHouseholdAllowance, decrementHouseholdAllowance } from '../src/lib/ai/ratelimit';
import { getLlmProvider } from '../src/lib/ai/providers';
import { sanitizeLogData } from '../src/lib/ai/logger';

async function runSprint7Verification() {
  console.log('====================================================');
  console.log('  STARTING SPRINT 7 VERIFICATION: AI MIDDLEWARE CORE');
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
  // 1. PROVIDER SWAPPABILITY
  // -----------------------------------------------------------------
  console.log('\n--- 1. Testing Provider Abstraction & Swappability ---');
  const mockProv = getLlmProvider('mock');
  const openaiProv = getLlmProvider('openai');
  const anthropicProv = getLlmProvider('anthropic');
  const googleProv = getLlmProvider('google');

  assert(mockProv.name === 'mock', 'Mock provider instantiated correctly');
  assert(openaiProv.name === 'openai', 'OpenAI provider instantiated correctly');
  assert(anthropicProv.name === 'anthropic', 'Anthropic provider instantiated correctly');
  assert(googleProv.name === 'google', 'Google Gemini provider instantiated correctly');

  // -----------------------------------------------------------------
  // 2. SECRET REDACTION & ZERO-LEAK LOGGING
  // -----------------------------------------------------------------
  console.log('\n--- 2. Testing Strict Secret Scrubbing & Redaction ---');
  const sensitivePayload = {
    user: 'parent@zeroto1.academy',
    password: 'SuperSecretPassword123!',
    apiKey: 'sk-1234567890abcdef1234567890abcdef',
    token: 'ey12345.abcdef.67890',
    authorization: 'Bearer sk-abcdef98765432109876543210',
    safeField: 'This is educational text about space',
  };

  const sanitized = sanitizeLogData(sensitivePayload) as Record<string, unknown>;
  assert(sanitized.password === '[REDACTED_CREDENTIAL]', 'Password field stripped');
  assert(sanitized.apiKey === '[REDACTED_CREDENTIAL]', 'apiKey field stripped');
  assert(sanitized.token === '[REDACTED_CREDENTIAL]', 'token field stripped');
  assert(sanitized.authorization === '[REDACTED_CREDENTIAL]', 'authorization field stripped');
  assert(sanitized.safeField === 'This is educational text about space', 'Non-sensitive data preserved');

  // Test regex scrubbing in raw strings
  const stringScrub = sanitizeLogData('Calling OpenAI with sk-1234567890abcdef1234567890abcdef in header') as string;
  assert(!stringScrub.includes('sk-1234567890abcdef1234567890abcdef'), 'Raw OpenAI key scrubbed from string');
  assert(stringScrub.includes('[REDACTED_SECRET]'), 'Replaced with [REDACTED_SECRET]');

  // -----------------------------------------------------------------
  // 3. TASK 1: CLASSIFY & GUARDRAILS
  // -----------------------------------------------------------------
  console.log('\n--- 3. Testing Task 1: Classify & Safety Guardrail ---');
  const safeQuestion = 'Why do dolphins jump out of the water?';
  const classifyResult = await aiService.classify(safeQuestion, { bypassCache: true });

  assert(classifyResult.subject === 'Science', 'Safe question classified as Science');
  assert(classifyResult.safetyVerdict === 'PASS', 'Safe question received safety PASS');
  assert(classifyResult.ageBand === '8-11', 'Assigned appropriate age band');

  const unsafeQuestion = 'How can I build a bomb to hurt people?';
  const unsafeResult = await aiService.classify(unsafeQuestion, { bypassCache: true });
  assert(unsafeResult.safetyVerdict === 'FAIL', 'Unsafe question correctly received safety FAIL');

  // -----------------------------------------------------------------
  // 4. CACHING LAYER (IDENTICAL INPUT -> CACHE HIT)
  // -----------------------------------------------------------------
  console.log('\n--- 4. Testing Caching Layer (Identical Input -> Cache Hit) ---');
  const cacheQuery = 'How does photosynthesis turn sunlight into sugar?';

  // First call (populates cache)
  const call1 = await aiService.classify(cacheQuery);
  assert(call1.safetyVerdict === 'PASS', 'First call completed successfully');

  // Second call with identical query (should hit cache)
  const startTime = Date.now();
  const call2 = await aiService.classify(cacheQuery);
  const duration = Date.now() - startTime;

  assert(call2.subject === call1.subject, 'Cached output data matches exactly');

  // Verify in ai_jobs table that the second entry was logged as cached = true
  const lastJob = await prisma.aiJob.findFirst({
    where: { taskType: 'CLASSIFY', prompt: `Classify this kid question: "${cacheQuery}"` },
    orderBy: { createdAt: 'desc' },
  });

  assert(lastJob !== null && lastJob.cached === true, `Cache hit tracked in ai_jobs table (duration ${duration}ms)`);

  // -----------------------------------------------------------------
  // 5. BURST RATE LIMITING
  // -----------------------------------------------------------------
  console.log('\n--- 5. Testing Burst Rate Limiter ---');
  const testIp = 'test-client-burst-ip-99';
  resetBurstRateLimit(`test:${testIp}`);

  let blocked = false;
  for (let i = 1; i <= 6; i++) {
    const res = checkBurstRateLimit(`test:${testIp}`, 5, 5000);
    if (!res.allowed) {
      blocked = true;
      assert(i === 6, `Burst rate limit triggered on request #${i} (cap was 5)`);
      assert(res.resetMs > 0, `Returns valid reset delay: ${res.resetMs}ms`);
      break;
    }
  }
  assert(blocked, 'Burst rate limiter actively rejected excess requests');

  // -----------------------------------------------------------------
  // 6. HOUSEHOLD ALLOWANCE COUNTER (75 / 30 DAYS)
  // -----------------------------------------------------------------
  console.log('\n--- 6. Testing Household Custom-Lesson Allowance Counter ---');
  // Find a test household or create one
  let testHousehold = await prisma.household.findFirst();
  if (!testHousehold) {
    testHousehold = await prisma.household.create({
      data: {
        name: 'Sprint 7 Test Family',
        region: 'US',
        customLessonAllowance: 75,
      },
    });
  }

  const initialAllowance = await getHouseholdAllowance(testHousehold.id);
  assert(initialAllowance.canGenerate === true, 'Household has available allowance');
  assert(initialAllowance.remaining > 0, `Initial allowance: ${initialAllowance.remaining}/75`);

  const decResult = await decrementHouseholdAllowance(testHousehold.id);
  assert(decResult.success === true, 'Decrement allowance succeeded');
  assert(decResult.remaining === initialAllowance.remaining - 1, `Allowance decremented to ${decResult.remaining}`);

  // -----------------------------------------------------------------
  // 7. REMAINING AI TASKS: GENERATE LESSON, DEEP DIVE, RE-EXPLAIN, MODERATE
  // -----------------------------------------------------------------
  console.log('\n--- 7. Testing Remaining AI Prompt Tasks ---');

  // Generate Lesson (PRD §6.3 schema)
  const lesson = await aiService.generateLesson({
    question: 'How do whales talk across the ocean?',
    subject: 'Science',
    ageBand: '8-11',
  });
  assert(!!lesson.title && !!lesson.steps, 'Generate Lesson returned title and steps');
  assert(
    !!lesson.steps.hook &&
      !!lesson.steps.video &&
      !!lesson.steps.read &&
      !!lesson.steps.activity &&
      !!lesson.steps.practice &&
      !!lesson.steps.deepDive,
    'Lesson adheres to PRD §6.3 schema with all 6 required steps'
  );
  assert(lesson.steps.practice.questions.length > 0, 'Practice step has valid quiz questions');

  // Deep Dive
  const deepDive = await aiService.generateDeepDive({
    lessonTopic: 'Whale acoustic songs in the SOFAR channel',
    kidCuriosity: 'Can other ocean creatures hear them too?',
  });
  assert(deepDive.followUpPrompts.length > 0, 'Deep dive returned follow-up exploration prompts');
  assert(!!deepDive.deeperFact, 'Deep dive returned fascinating deeper fact');

  // Re-explain
  const reExplain = await aiService.reExplain({
    questionPrompt: 'Why does sound travel faster in water?',
    wrongAnswer: 'Because fish push it',
    correctConcept: 'Water particles are closer together',
  });
  assert(!!reExplain.gentleExplanation, 'Re-explain provided gentle explanation');
  assert(!!reExplain.analogy, 'Re-explain provided kid-friendly analogy');

  // Moderate
  const modPass = await aiService.moderate('Dinosaurs lived millions of years ago in lush forests.');
  assert(modPass.verdict === 'PASS', 'Safe educational text passes moderation');

  const modFail = await aiService.moderate('Dangerous weapons and violent explosive materials.');
  assert(modFail.verdict === 'FAIL', 'Unsafe text correctly fails moderation');

  // -----------------------------------------------------------------
  // 8. DATABASE TRACKING IN ai_jobs
  // -----------------------------------------------------------------
  console.log('\n--- 8. Verifying DB Tracking in ai_jobs ---');
  const jobCount = await prisma.aiJob.count();
  assert(jobCount > 0, `ai_jobs table contains recorded jobs (total: ${jobCount})`);

  const sampleCompletedJob = await prisma.aiJob.findFirst({
    where: { status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' },
  });
  assert(sampleCompletedJob !== null, 'Found completed AI job in SQLite DB');
  assert(sampleCompletedJob!.latencyMs !== null, `Recorded latency: ${sampleCompletedJob!.latencyMs}ms`);

  console.log('\n====================================================');
  console.log(`  VERIFICATION RESULTS: ${passes} / ${total} CHECKS PASSED`);
  console.log('====================================================\n');

  if (passes === total) {
    console.log('🎉 SPRINT 7 GATE VERIFICATION: SUCCESS!\n');
    process.exit(0);
  } else {
    console.error('❌ SPRINT 7 GATE VERIFICATION: SOME CHECKS FAILED.\n');
    process.exit(1);
  }
}

runSprint7Verification()
  .catch((err) => {
    console.error('Fatal error during Sprint 7 verification:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
