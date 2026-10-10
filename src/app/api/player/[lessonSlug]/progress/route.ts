import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveKidId } from '@/lib/auth';

import { isHouseholdEntitled } from '@/lib/billing/entitlements';

interface RouteContext {
  params: Promise<{ lessonSlug: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { lessonSlug } = await context.params;
    const body = await req.json();
    const { completedStepOrder, nextStepOrder, quizScore } = body;

    const lesson = await prisma.lesson.findFirst({
      where: { slug: lessonSlug },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    const kidId = await getActiveKidId();

    // If guest/unauthenticated user:
    if (!kidId) {
      if (!lesson.isPreview) {
        return NextResponse.json(
          { error: 'Forbidden. This lesson requires an active household subscription.' },
          { status: 403 }
        );
      }
      return NextResponse.json({
        ok: true,
        guest: true,
        completedStepOrder,
        nextStepOrder,
        quizScore,
      });
    }

    // Entitlement gating for non-preview lessons
    if (!lesson.isPreview) {
      const kid = await prisma.kidProfile.findUnique({
        where: { id: kidId },
        select: { householdId: true },
      });
      if (kid) {
        const entitled = await isHouseholdEntitled(kid.householdId);
        if (!entitled) {
          return NextResponse.json(
            { error: 'Forbidden. This lesson requires an active household subscription.', code: 'PAYMENT_REQUIRED' },
            { status: 403 }
          );
        }
      }
    }

    // Existing progress
    const existing = await prisma.lessonProgress.findUnique({
      where: {
        kidProfileId_lessonId: {
          kidProfileId: kidId,
          lessonId: lesson.id,
        },
      },
    });

    let completedStepsList: number[] = [];
    if (existing?.completedSteps) {
      try {
        completedStepsList = JSON.parse(existing.completedSteps);
      } catch {
        completedStepsList = [];
      }
    }
    if (!completedStepsList.includes(completedStepOrder)) {
      completedStepsList.push(completedStepOrder);
    }

    const isFullyCompleted = completedStepOrder === 6 || completedStepsList.length >= 6;
    const newStatus = isFullyCompleted ? 'COMPLETED' : 'IN_PROGRESS';
    const newCurrentStep = isFullyCompleted ? 6 : Math.min(6, nextStepOrder || completedStepOrder + 1);

    const progress = await prisma.lessonProgress.upsert({
      where: {
        kidProfileId_lessonId: {
          kidProfileId: kidId,
          lessonId: lesson.id,
        },
      },
      update: {
        status: newStatus,
        currentStepOrder: newCurrentStep,
        completedSteps: JSON.stringify(completedStepsList),
        quizScore: typeof quizScore === 'number' ? quizScore : existing?.quizScore,
        completedAt: isFullyCompleted ? new Date() : existing?.completedAt,
      },
      create: {
        kidProfileId: kidId,
        lessonId: lesson.id,
        status: newStatus,
        currentStepOrder: newCurrentStep,
        completedSteps: JSON.stringify(completedStepsList),
        quizScore: typeof quizScore === 'number' ? quizScore : null,
        completedAt: isFullyCompleted ? new Date() : null,
      },
    });

    return NextResponse.json({ ok: true, progress });
  } catch (error) {
    console.error('Progress update error:', error);
    return NextResponse.json(
      { error: 'Failed to update lesson progress' },
      { status: 500 }
    );
  }
}
