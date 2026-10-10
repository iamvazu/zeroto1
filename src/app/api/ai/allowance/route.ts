// zeroto1.academy — API Route: Household Allowance (GET /api/ai/allowance)

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getHouseholdAllowance } from '@/lib/ai/ratelimit';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    let householdId = session?.householdId;

    if (!householdId) {
      const firstHousehold = await prisma.household.findFirst();
      householdId = firstHousehold?.id;
    }

    if (!householdId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowance = await getHouseholdAllowance(householdId);
    return NextResponse.json({ success: true, data: allowance });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
