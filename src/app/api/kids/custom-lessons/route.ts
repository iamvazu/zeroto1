// zeroto1.academy — API Route: List Kid's Custom Lessons (GET /api/kids/custom-lessons)

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    let householdId = session?.householdId;

    if (!householdId) {
      const firstHousehold = await prisma.household.findFirst();
      householdId = firstHousehold?.id;
    }

    if (!householdId) {
      return NextResponse.json({ lessons: [] });
    }

    const lessons = await prisma.customLesson.findMany({
      where: { householdId, status: 'READY' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        question: true,
        subject: true,
        ageBand: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, lessons });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
