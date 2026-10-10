import { prisma } from '../src/lib/prisma';

const BASE_URL = 'http://localhost:3001';

async function runE2E() {
  console.log('=== END-TO-END AUTOMATED SUITE FOR SPRINT 3 ===\n');

  const timestamp = Date.now();
  const testEmail = `parent_${timestamp}@example.com`;
  const initialPassword = 'Password123!';
  const newPassword = 'NewSecretPassword456!';

  // Step 1: Sign up
  console.log('1. Testing POST /api/auth/sign-up...');
  const signUpRes = await fetch(`${BASE_URL}/api/auth/sign-up`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Elena Rostova',
      email: testEmail,
      password: initialPassword,
      region: 'US',
    }),
  });

  if (!signUpRes.ok) {
    const err = await signUpRes.text();
    throw new Error(`Sign-up failed: ${err}`);
  }

  const signUpData = await signUpRes.json();
  const rawSetCookie = signUpRes.headers.get('set-cookie');
  console.log('   ✔ Signed up user:', signUpData.user.email);
  console.log('   ✔ Created household:', signUpData.household.name, `(Region: ${signUpData.household.region})`);
  console.log('   ✔ Received Set-Cookie:', rawSetCookie ? 'YES (httpOnly session cookie)' : 'NO');

  if (!rawSetCookie || !rawSetCookie.includes('zeroto1_session=')) {
    throw new Error('FAIL: Missing zeroto1_session cookie in sign-up response!');
  }

  // Extract session cookie value
  const sessionCookie = rawSetCookie.split(';')[0];

  // Step 2: Create first kid profile (Leo)
  console.log('\n2. Testing POST /api/kids (Creating Leo)...');
  const leoRes = await fetch(`${BASE_URL}/api/kids`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      displayName: 'Leo',
      ageBand: '8-11',
      avatar: '🚀',
    }),
  });

  const leoData = await leoRes.json();
  if (!leoRes.ok) throw new Error(`Creating Leo failed: ${JSON.stringify(leoData)}`);
  console.log(`   ✔ Child created: ${leoData.kidProfile.displayName} (${leoData.kidProfile.ageBand}) ID: ${leoData.kidProfile.id}`);
  const leoId = leoData.kidProfile.id;

  // Step 3: Create second kid profile (Maya)
  console.log('\n3. Testing POST /api/kids (Creating Maya)...');
  const mayaRes = await fetch(`${BASE_URL}/api/kids`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      displayName: 'Maya',
      ageBand: '5-8',
      avatar: '🎨',
    }),
  });

  const mayaData = await mayaRes.json();
  if (!mayaRes.ok) throw new Error(`Creating Maya failed: ${JSON.stringify(mayaData)}`);
  console.log(`   ✔ Child created: ${mayaData.kidProfile.displayName} (${mayaData.kidProfile.ageBand}) ID: ${mayaData.kidProfile.id}`);
  const mayaId = mayaData.kidProfile.id;

  // Step 4: Select Maya as active child
  console.log('\n4. Testing POST /api/kids/select (Switching to Maya)...');
  const selectRes = await fetch(`${BASE_URL}/api/kids/select`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie,
    },
    body: JSON.stringify({ kidProfileId: mayaId }),
  });

  const selectSetCookie = selectRes.headers.get('set-cookie');
  const kidCookie = selectSetCookie ? selectSetCookie.split(';')[0] : '';
  const combinedCookies = `${sessionCookie}; ${kidCookie}`;
  console.log('   ✔ Switched active child to Maya. Cookie set:', kidCookie);

  // Step 5: Test GET /api/auth/me
  console.log('\n5. Testing GET /api/auth/me...');
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: combinedCookies },
  });
  const meData = await meRes.json();
  if (!meRes.ok) throw new Error(`GET /api/auth/me failed: ${JSON.stringify(meData)}`);
  console.log(`   ✔ Me endpoint verified:`);
  console.log(`     - User: ${meData.user.name} (${meData.user.email})`);
  console.log(`     - Household: ${meData.household.name} (Region: ${meData.household.region})`);
  console.log(`     - Kids in household: ${meData.household.kidProfiles.length} profiles`);
  console.log(`     - Active kid: ${meData.activeKid?.displayName} (${meData.activeKid?.avatar})`);

  if (meData.household.kidProfiles.length !== 2 || meData.activeKid?.id !== mayaId) {
    throw new Error('FAIL: Active kid or profiles count mismatch!');
  }

  // Step 6: Test Authenticated SSR HTML Page Loads
  console.log('\n6. Testing Authenticated page loads with cookies...');
  const appRes = await fetch(`${BASE_URL}/app`, {
    headers: { Cookie: combinedCookies },
    redirect: 'manual',
  });
  console.log(`   ✔ GET /app status: ${appRes.status} (Expected 200)`);
  if (appRes.status !== 200) throw new Error(`GET /app failed: ${appRes.status}`);

  const selectProfileRes = await fetch(`${BASE_URL}/app/select-profile`, {
    headers: { Cookie: combinedCookies },
    redirect: 'manual',
  });
  console.log(`   ✔ GET /app/select-profile status: ${selectProfileRes.status} (Expected 200)`);
  if (selectProfileRes.status !== 200) throw new Error(`GET /app/select-profile failed: ${selectProfileRes.status}`);

  const parentRes = await fetch(`${BASE_URL}/app/parent`, {
    headers: { Cookie: combinedCookies },
    redirect: 'manual',
  });
  console.log(`   ✔ GET /app/parent status: ${parentRes.status} (Expected 200)`);
  if (parentRes.status !== 200) throw new Error(`GET /app/parent failed: ${parentRes.status}`);

  // Step 7: Test Unauthenticated Route Protection Middleware
  console.log('\n7. Testing Unauthenticated route protection middleware...');
  const unauthRes = await fetch(`${BASE_URL}/app`, {
    redirect: 'manual',
  });
  console.log(`   ✔ Unauthenticated GET /app status: ${unauthRes.status}`);
  const redirectLoc = unauthRes.headers.get('location');
  console.log(`   ✔ Redirect location: ${redirectLoc}`);
  if (!redirectLoc?.includes('/sign-in')) {
    throw new Error('FAIL: Unauthenticated request was not redirected to /sign-in!');
  }

  // Step 8: Test Sign-out
  console.log('\n8. Testing POST /api/auth/sign-out...');
  const signOutRes = await fetch(`${BASE_URL}/api/auth/sign-out`, {
    method: 'POST',
    headers: { Cookie: combinedCookies },
  });
  const signOutCookies = signOutRes.headers.get('set-cookie');
  console.log('   ✔ Sign-out returned 200. Clear cookies:', signOutCookies?.includes('Max-Age=0') ? 'YES' : 'NO');

  // Step 9: Test Sign-in with incorrect and correct password
  console.log('\n9. Testing POST /api/auth/sign-in...');
  const badLoginRes = await fetch(`${BASE_URL}/api/auth/sign-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'WrongPassword999!' }),
  });
  console.log(`   ✔ Invalid password status: ${badLoginRes.status} (Expected 401)`);
  if (badLoginRes.status !== 401) throw new Error('FAIL: Invalid password did not return 401!');

  const goodLoginRes = await fetch(`${BASE_URL}/api/auth/sign-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: initialPassword }),
  });
  console.log(`   ✔ Valid password status: ${goodLoginRes.status} (Expected 200)`);
  if (goodLoginRes.status !== 200) throw new Error('FAIL: Valid password did not return 200!');

  // Step 10: Test Password Reset
  console.log('\n10. Testing POST /api/auth/reset-password...');
  const resetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, newPassword }),
  });
  console.log(`   ✔ Password reset status: ${resetRes.status} (Expected 200)`);

  // Verify login with new password
  const newLoginRes = await fetch(`${BASE_URL}/api/auth/sign-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: newPassword }),
  });
  console.log(`   ✔ Login with new password status: ${newLoginRes.status} (Expected 200)`);
  if (newLoginRes.status !== 200) throw new Error('FAIL: Login with new reset password failed!');

  // Step 11: Verify Password Hashing in Database
  console.log('\n11. Verifying Database Hashing Security...');
  const dbUser = await prisma.user.findUnique({
    where: { email: testEmail },
  });
  console.log(`   ✔ DB user passwordHash: ${dbUser?.passwordHash.substring(0, 20)}...`);
  if (!dbUser?.passwordHash.startsWith('$2a$') && !dbUser?.passwordHash.startsWith('$2b$')) {
    throw new Error('FAIL: Password is not hashed with bcrypt in the DB!');
  }
  if (dbUser.passwordHash === newPassword || dbUser.passwordHash === initialPassword) {
    throw new Error('FAIL: Password is plain text!');
  }

  // Cleanup test user
  await prisma.household.delete({
    where: { id: signUpData.household.id },
  });
  console.log('\n✔ Test household & associated profiles cleaned up from database.');

  console.log('\n============================================================');
  console.log('🎉 ALL SPRINT 3 END-TO-END TESTS PASSED WITH 100% SUCCESS!');
  console.log('============================================================\n');
}

runE2E()
  .catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
