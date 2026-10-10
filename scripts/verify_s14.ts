import { prisma } from '../src/lib/prisma';
import { createSessionToken } from '../src/lib/auth';
import { isHouseholdEntitled, getHouseholdEntitlement } from '../src/lib/billing/entitlements';
import { STATEMENT_DESCRIPTOR } from '../src/lib/billing/stripe';

const BASE_URL = 'http://localhost:3001';

async function runSprint14Verification() {
  console.log('====================================================');
  console.log(' STARTING SPRINT 14 VERIFICATION: STRIPE BILLING');
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
  // 1. SETUP TEST HOUSEHOLDS & USERS
  // -----------------------------------------------------------------
  console.log('--- 1. Setting up Test Data ---');
  const usHousehold = await prisma.household.create({
    data: { name: 'US Stripe Family', region: 'US' },
  });
  const usUser = await prisma.user.create({
    data: {
      name: 'US Parent',
      email: `us_parent_${Date.now()}@test.com`,
      passwordHash: '$2b$10$hasheddummy',
      householdId: usHousehold.id,
    },
  });
  const usKid = await prisma.kidProfile.create({
    data: {
      displayName: 'Alex Learner',
      avatar: '🚀',
      ageBand: '8-11',
      householdId: usHousehold.id,
    },
  });

  const usSessionToken = await createSessionToken({
    userId: usUser.id,
    householdId: usHousehold.id,
    email: usUser.email,
    name: usUser.name,
    role: usUser.role,
    region: usHousehold.region,
  });

  const usCookie = `zeroto1_session=${usSessionToken}; zeroto1_kid_id=${usKid.id}`;

  const nonPreviewLesson = await prisma.lesson.findFirst({
    where: { isPreview: false },
  });
  assert(!!nonPreviewLesson, 'Non-preview curriculum lesson exists in database');

  // -----------------------------------------------------------------
  // 2. UNPAID HOUSEHOLD CANNOT ACCESS PAID FEATURES
  // -----------------------------------------------------------------
  console.log('\n--- 2. Testing Unpaid Household Gating ---');
  const unpaidEntitled = await isHouseholdEntitled(usHousehold.id);
  assert(unpaidEntitled === false, 'Fresh unpaid household has isEntitled === false');

  const statusRes = await fetch(`${BASE_URL}/api/billing/status?householdId=${usHousehold.id}`);
  assert(statusRes.status === 200, 'GET /api/billing/status returned HTTP 200');
  const statusData = await statusRes.json();
  assert(statusData.isEntitled === false, 'Billing status confirms unpaid household is not entitled');
  assert(statusData.status === 'INACTIVE', 'Billing status reports INACTIVE');
  assert(statusData.statementDescriptor === 'ZEROTO1', `Statement descriptor is "${STATEMENT_DESCRIPTOR}"`);

  // Unpaid attempt to save progress on paid lesson must be rejected (403)
  const lockedProgressRes = await fetch(`${BASE_URL}/api/player/${nonPreviewLesson!.slug}/progress`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: usCookie,
    },
    body: JSON.stringify({ completedStepOrder: 1, nextStepOrder: 2 }),
  });
  assert(
    lockedProgressRes.status === 403,
    `Unpaid household blocked from saving progress on paid lesson (HTTP 403: ${lockedProgressRes.status})`
  );

  // -----------------------------------------------------------------
  // 3. CHECKOUT SESSION CREATION (US: $19, IN: ₹7,999)
  // -----------------------------------------------------------------
  console.log('\n--- 3. Testing Checkout Session Creation (US + India) ---');
  // US Monthly ($19)
  const usCheckoutRes = await fetch(`${BASE_URL}/api/billing/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: usCookie },
    body: JSON.stringify({ plan: 'MONTHLY', region: 'US' }),
  });
  assert(usCheckoutRes.status === 200, 'POST /api/billing/checkout for US returned HTTP 200');
  const usCheckoutData = await usCheckoutRes.json();
  assert(usCheckoutData.success === true, 'US checkout initiated successfully');
  assert(typeof usCheckoutData.url === 'string' && usCheckoutData.url.length > 0, 'US checkout returns redirect URL');
  assert(usCheckoutData.statementDescriptor === 'ZEROTO1', 'US checkout specifies ZEROTO1 statement descriptor');

  // India Yearly (₹7,999)
  const inCheckoutRes = await fetch(`${BASE_URL}/api/billing/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: usCookie },
    body: JSON.stringify({ plan: 'YEARLY', region: 'IN' }),
  });
  assert(inCheckoutRes.status === 200, 'POST /api/billing/checkout for India returned HTTP 200');
  const inCheckoutData = await inCheckoutRes.json();
  assert(inCheckoutData.success === true, 'India checkout initiated successfully');
  assert(inCheckoutData.statementDescriptor === 'ZEROTO1', 'India checkout specifies ZEROTO1 statement descriptor');

  // -----------------------------------------------------------------
  // 4. STRIPE WEBHOOK & ENTITLEMENT UNLOCK
  // -----------------------------------------------------------------
  console.log('\n--- 4. Testing Stripe Webhook Processing & Entitlement Unlock ---');
  const webhookRes = await fetch(`${BASE_URL}/api/billing/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_us_monthly',
          customer: 'cus_test_us_123',
          subscription: 'sub_test_us_123',
          client_reference_id: usHousehold.id,
          metadata: {
            householdId: usHousehold.id,
            plan: 'MONTHLY',
            region: 'US',
          },
        },
      },
    }),
  });
  assert(webhookRes.status === 200, 'POST /api/billing/webhook returned HTTP 200');

  // Verify entitlement unlocked
  const entitledAfterWebhook = await isHouseholdEntitled(usHousehold.id);
  assert(entitledAfterWebhook === true, 'Household entitlement unlocked after checkout webhook');

  const subInDb = await prisma.subscription.findUnique({
    where: { householdId: usHousehold.id },
  });
  assert(subInDb !== null && subInDb.status === 'ACTIVE', 'Subscription record in database is ACTIVE');
  assert(subInDb?.plan === 'MONTHLY', 'Subscription plan is MONTHLY');
  assert(subInDb?.currency === 'USD', 'Subscription currency is USD');
  assert(
    subInDb?.currentPeriodEnd !== null && subInDb!.currentPeriodEnd! > new Date(),
    'Subscription currentPeriodEnd is set in the future'
  );

  // Paid features now accessible
  const unlockedProgressRes = await fetch(`${BASE_URL}/api/player/${nonPreviewLesson!.slug}/progress`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: usCookie,
    },
    body: JSON.stringify({ completedStepOrder: 1, nextStepOrder: 2 }),
  });
  assert(
    unlockedProgressRes.status === 200,
    'Paid household can now save progress on curriculum lessons (HTTP 200)'
  );

  // -----------------------------------------------------------------
  // 5. CANCEL SUBSCRIPTION (ACCESS RETAINED UNTIL PERIOD END)
  // -----------------------------------------------------------------
  console.log('\n--- 5. Testing Cancel Anytime (Access Retained Until Period End) ---');
  const cancelRes = await fetch(`${BASE_URL}/api/billing/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: usCookie },
  });
  assert(cancelRes.status === 200, 'POST /api/billing/cancel returned HTTP 200');
  const cancelData = await cancelRes.json();
  assert(cancelData.cancelAtPeriodEnd === true, 'cancelAtPeriodEnd flagged as true');

  // Verify access is STILL retained because period end is in the future
  const entitledWhileCanceled = await isHouseholdEntitled(usHousehold.id);
  assert(
    entitledWhileCanceled === true,
    'Entitlement is retained while canceled when periodEnd is in the future'
  );

  const statusAfterCancel = await getHouseholdEntitlement(usHousehold.id);
  assert(statusAfterCancel.cancelAtPeriodEnd === true, 'Billing status reports cancelAtPeriodEnd === true');
  assert(statusAfterCancel.isEntitled === true, 'Billing status confirms user remains entitled until period end');

  // -----------------------------------------------------------------
  // 6. EXPIRED SUBSCRIPTION GATING
  // -----------------------------------------------------------------
  console.log('\n--- 6. Testing Expired Subscription Access Removal ---');
  await prisma.subscription.update({
    where: { householdId: usHousehold.id },
    data: {
      currentPeriodEnd: new Date(Date.now() - 3600 * 1000), // 1 hour ago
    },
  });

  const entitledExpired = await isHouseholdEntitled(usHousehold.id);
  assert(entitledExpired === false, 'Expired subscription revokes active entitlement');

  // -----------------------------------------------------------------
  // 7. 30-DAY MONEY-BACK GUARANTEE REFUND REQUEST FLOW
  // -----------------------------------------------------------------
  console.log('\n--- 7. Testing 30-Day Money-Back Refund Request Flow ---');
  // Reset subscription to active for refund test
  await prisma.subscription.update({
    where: { householdId: usHousehold.id },
    data: {
      status: 'ACTIVE',
      cancelAtPeriodEnd: false,
      createdAt: new Date(), // Created today (within 30 days)
    },
  });

  const refundRes = await fetch(`${BASE_URL}/api/billing/refund-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: usCookie },
    body: JSON.stringify({ reason: 'Family decided to pause lessons for summer' }),
  });
  assert(refundRes.status === 200, 'POST /api/billing/refund-request returned HTTP 200');
  const refundData = await refundRes.json();
  assert(refundData.success === true, 'Refund request submitted successfully');
  assert(
    refundData.recipient === 'hello@zeroto1.academy',
    'Refund request routed to hello@zeroto1.academy'
  );
  assert(
    refundData.descriptor === 'ZEROTO1',
    'Refund receipt references ZEROTO1 statement descriptor'
  );

  // Test refund exceeding 30-day window
  await prisma.subscription.update({
    where: { householdId: usHousehold.id },
    data: {
      createdAt: new Date(Date.now() - 45 * 24 * 3600 * 1000), // 45 days ago
    },
  });

  const staleRefundRes = await fetch(`${BASE_URL}/api/billing/refund-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: usCookie },
    body: JSON.stringify({ reason: 'Request after window' }),
  });
  assert(
    staleRefundRes.status === 400,
    'Refund request after 30-day window appropriately rejected with HTTP 400'
  );

  // -----------------------------------------------------------------
  // 8. INDIA TEST-MODE CHECKOUT & WEBHOOK CYCLE
  // -----------------------------------------------------------------
  console.log('\n--- 8. Testing India Full Lifecycle (INR, ₹7,999/yr) ---');
  const inHousehold = await prisma.household.create({
    data: { name: 'India Family Test', region: 'IN' },
  });

  // India webhook simulation
  const inWebhookRes = await fetch(`${BASE_URL}/api/billing/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_in_yearly',
          customer: 'cus_test_in_456',
          subscription: 'sub_test_in_456',
          client_reference_id: inHousehold.id,
          metadata: {
            householdId: inHousehold.id,
            plan: 'YEARLY',
            region: 'IN',
          },
        },
      },
    }),
  });
  assert(inWebhookRes.status === 200, 'India webhook returned HTTP 200');

  const inSub = await prisma.subscription.findUnique({
    where: { householdId: inHousehold.id },
  });
  assert(inSub !== null && inSub.status === 'ACTIVE', 'India subscription is ACTIVE');
  assert(inSub?.currency === 'INR', 'India subscription currency is INR');
  assert(inSub?.plan === 'YEARLY', 'India subscription plan is YEARLY');
  const inEntitled = await isHouseholdEntitled(inHousehold.id);
  assert(inEntitled === true, 'India household has active entitlement unlocked');

  // Clean up
  await prisma.household.delete({ where: { id: usHousehold.id } });
  await prisma.household.delete({ where: { id: inHousehold.id } });

  console.log('\n====================================================');
  console.log(`  VERIFICATION RESULTS: ${passes} / ${total} CHECKS PASSED`);
  console.log('====================================================\n');

  if (passes === total) {
    console.log('🎉 SPRINT 14 GATE VERIFICATION: SUCCESS!\n');
    process.exit(0);
  } else {
    console.error('❌ SPRINT 14 GATE VERIFICATION: SOME CHECKS FAILED.\n');
    process.exit(1);
  }
}

runSprint14Verification()
  .catch((err) => {
    console.error('Fatal error during Sprint 14 verification:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
