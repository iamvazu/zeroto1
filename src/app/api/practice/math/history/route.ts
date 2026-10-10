// zeroto1.academy — API Route: Math Practice History (GET /api/practice/math/history)

import { NextRequest, NextResponse } from 'next/server';
import { getSession, getActiveKidId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    let kidProfileId = await getActiveKidId();

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
      return NextResponse.json({ sessions: [], stats: { totalProblems: 0, bestStreak: 0, avgAccuracy: 0 } });
    }

    const sessions = await prisma.practiceSession.findMany({
      where: { kidProfileId, type: 'MATH' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    let totalProblems = 0;
    let sumAccuracy = 0;
    let bestStreak = 0;

    for (const s of sessions) {
      totalProblems += s.score || 0;
      sumAccuracy += s.accuracy || 0;
      if (s.metadata) {
        try {
          const meta = JSON.parse(s.metadata);
          if (meta.streak && meta.streak > bestStreak) {
            bestStreak = meta.streak;
          }
        } catch {
          // ignore
        }
      }
    }

    const avgAccuracy = sessions.length > 0 ? Math.round(sumAccuracy / sessions.length) : 0;

    return NextResponse.json({
      success: true,
      sessions,
      stats: {
        totalSessions: sessions.length,
        totalProblems,
        bestStreak,
        avgAccuracy,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
