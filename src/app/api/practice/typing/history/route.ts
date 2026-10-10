// zeroto1.academy — API Route: Typing Practice History (GET /api/practice/typing/history)

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
      return NextResponse.json({ sessions: [], stats: { totalWords: 0, highestWpm: 0, avgAccuracy: 0 } });
    }

    const sessions = await prisma.practiceSession.findMany({
      where: { kidProfileId, type: 'TYPING' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    let highestWpm = 0;
    let sumAccuracy = 0;
    let totalChars = 0;

    for (const s of sessions) {
      if (s.wpm && s.wpm > highestWpm) highestWpm = s.wpm;
      sumAccuracy += s.accuracy || 0;
      totalChars += s.score || 0;
    }

    const avgAccuracy = sessions.length > 0 ? Math.round(sumAccuracy / sessions.length) : 0;
    const totalWords = Math.round(totalChars / 5);

    return NextResponse.json({
      success: true,
      sessions,
      stats: {
        totalSessions: sessions.length,
        totalWords,
        highestWpm,
        avgAccuracy,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
