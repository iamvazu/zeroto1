// zeroto1.academy — API Route: Parent Dashboard Insights (GET /api/parent/dashboard)
// Provides calm, comprehensive summaries of finished work, gentle stuck points, allowance usage, and kid profiles.

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getHouseholdAllowance } from '@/lib/ai/ratelimit';

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

    const household = await prisma.household.findUnique({
      where: { id: householdId },
      include: {
        subscription: true,
        kidProfiles: {
          include: {
            lessonProgress: {
              include: {
                lesson: {
                  include: {
                    unit: {
                      include: {
                        subject: true,
                      },
                    },
                  },
                },
              },
              orderBy: { updatedAt: 'desc' },
            },
            practiceSessions: {
              orderBy: { createdAt: 'desc' },
            },
            customLessons: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 });
    }

    const allowance = await getHouseholdAllowance(householdId);
    const usedAllowance = Math.max(0, 75 - allowance.remaining);

    // Compute Per-Kid Finished Work, Stuck Points & Stats
    const kidsData = household.kidProfiles.map((kid) => {
      const finishedLessons = kid.lessonProgress
        .filter((lp) => lp.status === 'COMPLETED')
        .map((lp) => ({
          id: lp.lesson.id,
          title: lp.lesson.title,
          slug: lp.lesson.slug,
          subject: lp.lesson.unit.subject.name,
          unitTitle: lp.lesson.unit.title,
          completedAt: lp.completedAt || lp.updatedAt,
          quizScore: lp.quizScore,
        }));

      const inProgressLessons = kid.lessonProgress
        .filter((lp) => lp.status !== 'COMPLETED')
        .map((lp) => ({
          id: lp.lesson.id,
          title: lp.lesson.title,
          slug: lp.lesson.slug,
          subject: lp.lesson.unit.subject.name,
          currentStepOrder: lp.currentStepOrder,
          updatedAt: lp.updatedAt,
        }));

      // Generate calm, encouraging stuck points
      const stuckPoints: Array<{
        type: 'quiz_challenge' | 'paused_lesson' | 'repeated_practice';
        title: string;
        lessonSlug?: string;
        gentleInsight: string;
      }> = [];

      // 1. Check for quiz scores that needed extra practice
      for (const lp of kid.lessonProgress) {
        if (lp.quizScore !== null && lp.quizScore !== undefined && lp.quizScore < 70) {
          stuckPoints.push({
            type: 'quiz_challenge',
            title: `Exploration Check: ${lp.lesson.title}`,
            lessonSlug: lp.lesson.slug,
            gentleInsight: `Encountered a few tricky questions in the Practice step (${lp.quizScore}% score). Our gentle re-explainer provided analogies, but discussing "${lp.lesson.title}" over dinner could be fun!`,
          });
        }
      }

      // 2. Check for lessons paused mid-way
      for (const lp of inProgressLessons) {
        const stepLabels: Record<number, string> = {
          1: 'Hook (Intro Story)',
          2: 'Video Discovery',
          3: 'Read & Reflect',
          4: 'Interactive Activity',
          5: 'Practice Quiz',
          6: 'Deep Dive',
        };
        const pausedStep = stepLabels[lp.currentStepOrder] || `Step ${lp.currentStepOrder}`;

        stuckPoints.push({
          type: 'paused_lesson',
          title: `Paused Exploration: ${lp.title}`,
          lessonSlug: lp.slug,
          gentleInsight: `Paused at ${pausedStep}. No worries at all—curiosity is self-paced and can be resumed anytime from the home screen.`,
        });
      }

      // 3. Math & Typing Practice Stats
      const mathSessions = kid.practiceSessions.filter((s) => s.type === 'MATH');
      const typingSessions = kid.practiceSessions.filter((s) => s.type === 'TYPING');

      let highestWpm = 0;
      for (const t of typingSessions) {
        if (t.wpm && t.wpm > highestWpm) highestWpm = t.wpm;
      }

      return {
        id: kid.id,
        displayName: kid.displayName,
        avatar: kid.avatar || '🌟',
        ageBand: kid.ageBand,
        finishedLessons,
        inProgressLessons,
        stuckPoints,
        practiceStats: {
          totalMathSessions: mathSessions.length,
          totalTypingSessions: typingSessions.length,
          highestWpm,
        },
        customLessons: kid.customLessons.map((cl) => ({
          id: cl.id,
          question: cl.question,
          subject: cl.subject,
          createdAt: cl.createdAt,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      household: {
        id: household.id,
        name: household.name,
        region: household.region,
        subscription: household.subscription,
      },
      allowance: {
        total: 75,
        remaining: allowance.remaining,
        used: usedAllowance,
        resetAt: allowance.resetAt,
      },
      kids: kidsData,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
