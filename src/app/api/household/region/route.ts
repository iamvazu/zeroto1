// zeroto1.academy — API Route: Household Region Setting (GET, PUT /api/household/region)

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPricingForRegion } from '@/lib/region';

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    let householdId = session?.householdId;

    if (!householdId) {
      const firstHousehold = await prisma.household.findFirst();
      householdId = firstHousehold?.id;
    }

    if (!householdId) {
      return NextResponse.json({ region: 'US', pricing: getPricingForRegion('US') });
    }

    const household = await prisma.household.findUnique({
      where: { id: householdId },
      select: { id: true, region: true },
    });

    const region = household?.region || 'US';
    return NextResponse.json({
      success: true,
      region,
      pricing: getPricingForRegion(region),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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

    const body = await req.json();
    const { region } = body;

    const validatedRegion = region?.toUpperCase() === 'IN' ? 'IN' : 'US';

    const updated = await prisma.household.update({
      where: { id: householdId },
      data: { region: validatedRegion },
      select: { id: true, region: true },
    });

    const response = NextResponse.json({
      success: true,
      region: updated.region,
      pricing: getPricingForRegion(updated.region),
    });

    // Also persist in cookie
    response.cookies.set('zeroto1_region', updated.region, {
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
