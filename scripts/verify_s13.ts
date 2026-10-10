// zeroto1.academy — Verification Script for Sprint 13 (Region & Localization)
// Tests: US first-class region setting, currency/pricing mapping, account region persistence,
// and legal compliance copy (COPPA & Children's privacy).

import { prisma } from '../src/lib/prisma';
import { getPricingForRegion, formatPrice } from '../src/lib/region';

async function runSprint13Verification() {
  console.log('====================================================');
  console.log(' STARTING SPRINT 13 VERIFICATION: REGION & LOCALIZATION');
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
  // 1. REGION PRICING & CURRENCY FORMULAS
  // -----------------------------------------------------------------
  console.log('--- 1. Testing Region Pricing Calculation ---');
  const usPricing = getPricingForRegion('US');
  assert(usPricing.currency === 'USD', 'US currency is USD');
  assert(usPricing.monthly === 19, 'US monthly plan is $19');
  assert(usPricing.yearly === 99, 'US yearly plan is $99');
  assert(formatPrice(19, 'US') === '$19', 'formatPrice outputs $19');
  assert(formatPrice(99, 'US') === '$99', 'formatPrice outputs $99');

  const inPricing = getPricingForRegion('IN');
  assert(inPricing.currency === 'INR', 'IN currency is INR');
  assert(inPricing.monthly === 999, 'IN monthly plan is ₹999');
  assert(inPricing.yearly === 7999, 'IN yearly plan is ₹7,999');

  // Default fallback to US
  const defaultPricing = getPricingForRegion('unknown');
  assert(defaultPricing.currency === 'USD', 'Unknown region defaults to USD/US');

  // -----------------------------------------------------------------
  // 2. REGION PERSISTENCE ON HOUSEHOLD TABLE
  // -----------------------------------------------------------------
  console.log('\n--- 2. Testing Account-Level Region Persistence ---');
  let household = await prisma.household.findFirst();
  if (!household) {
    household = await prisma.household.create({
      data: {
        name: 'The Curie Family',
        region: 'US',
      },
    });
  }

  // Update region to US
  const updatedHousehold = await prisma.household.update({
    where: { id: household.id },
    data: { region: 'US' },
  });
  assert(updatedHousehold.region === 'US', 'Household region set to US in database');

  // Verify GET /api/household/region API
  const getRes = await fetch('http://localhost:3001/api/household/region');
  assert(getRes.status === 200, 'GET /api/household/region returned HTTP 200');
  const getData = await getRes.json();
  assert(getData.success === true, 'Region API returned success');
  assert(getData.pricing?.currency === 'USD', 'API returned USD pricing for household');

  // Verify PUT /api/household/region API
  const putRes = await fetch('http://localhost:3001/api/household/region', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ region: 'US' }),
  });
  assert(putRes.status === 200, 'PUT /api/household/region returned HTTP 200');
  const putData = await putRes.json();
  assert(putData.region === 'US', 'Updated region confirmed as US');

  // -----------------------------------------------------------------
  // 3. PRICING PAGE RENDERS US CURRENCY & DESCRIPTOR
  // -----------------------------------------------------------------
  console.log('\n--- 3. Testing Pricing Page Render ---');
  const pricingRes = await fetch('http://localhost:3001/pricing');
  assert(pricingRes.status === 200, 'GET /pricing returned HTTP 200');
  const pricingHtml = await pricingRes.text();
  assert(pricingHtml.includes('$99') && pricingHtml.includes('$19'), 'Pricing page displays $99 and $19');
  assert(pricingHtml.includes('ZEROTO1'), 'Pricing page notes ZEROTO1 card descriptor');
  assert(pricingHtml.includes('Household Plan'), 'Pricing page includes Household Plan');

  // -----------------------------------------------------------------
  // 4. LEGAL COMPLIANCE & COPPA COPY
  // -----------------------------------------------------------------
  console.log('\n--- 4. Testing Legal & Privacy Copy ---');
  const privacyRes = await fetch('http://localhost:3001/privacy');
  assert(privacyRes.status === 200, 'GET /privacy returned HTTP 200');
  const privacyHtml = await privacyRes.text();
  assert(privacyHtml.includes('COPPA'), 'Privacy policy includes COPPA compliance section');
  assert(privacyHtml.includes('Children'), 'Privacy policy covers Children\'s privacy');
  assert(privacyHtml.includes('hello@zeroto1.academy'), 'Contact email provided');

  console.log('\n====================================================');
  console.log(`  VERIFICATION RESULTS: ${passes} / ${total} CHECKS PASSED`);
  console.log('====================================================\n');

  if (passes === total) {
    console.log('🎉 SPRINT 13 GATE VERIFICATION: SUCCESS!\n');
    process.exit(0);
  } else {
    console.error('❌ SPRINT 13 GATE VERIFICATION: SOME CHECKS FAILED.\n');
    process.exit(1);
  }
}

runSprint13Verification()
  .catch((err) => {
    console.error('Fatal error during Sprint 13 verification:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
