// zeroto1.academy — API Route: Save Math Practice Session (POST /api/practice/math/session)

import { NextRequest, NextResponse } from 'next/server';
import { getSession, getActiveKidId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    let kidProfileId = await getActiveKidId();

    // Fallback for development if not logged in
    if (!kidProfileId) {
      if (session) {
        const kid = await prisma.kidProfile.findFirst({
          where: { householdId: session.householdId },
        });
        kidProfileId = kid?.id || null;
      } else {
        const anyKid = await prisma.kidProfile.findFirst();
        kidProfileId = anyKid?.id || null;
      }
    }

    if (!kidProfileId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No kid profile found to associate practice session.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { mode, operator, score, accuracy, durationSeconds, metadata } = body;

    const savedSession = await prisma.practiceSession.create({
      data: {
        kidProfileId,
        type: 'MATH',
        mode: mode || 'free',
        operator: operator || '+',
        score: typeof score === 'number' ? score : 0,
        accuracy: typeof accuracy === 'number' ? accuracy : 100,
        durationSeconds: typeof durationSeconds === 'number' ? durationSeconds : 0,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return NextResponse.json({ success: true, session: savedSession });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
