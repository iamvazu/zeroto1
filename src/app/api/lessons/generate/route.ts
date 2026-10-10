// zeroto1.academy — API Route: Generate Custom Lesson (POST /api/lessons/generate)
// Safe AI lesson generation pipeline conforming strictly to PRD §6.3 JSON schema

import { NextRequest, NextResponse } from 'next/server';
import { getSession, getActiveKidId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { runLessonGenerationPipeline } from '@/lib/ai/pipeline';
import { checkBurstRateLimit } from '@/lib/ai/ratelimit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkBurstRateLimit(`generate:${ip}`, 10, 10000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests', message: 'Please wait a moment before generating another lesson.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { question, forceFailOutputMod, householdId: customHouseholdId } = body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const session = await getSession();
    let householdId = customHouseholdId || session?.householdId;
    let kidProfileId = await getActiveKidId();

    // Fallback for development/testing if no session cookie provided
    if (!householdId) {
      const firstHousehold = await prisma.household.findFirst({
        include: { kidProfiles: true },
      });
      if (firstHousehold) {
        householdId = firstHousehold.id;
        kidProfileId = firstHousehold.kidProfiles[0]?.id;
      }
    }

    if (!householdId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to generate custom lessons.' },
        { status: 401 }
      );
    }

    // Ensure we have a valid kidProfileId under this household
    if (!kidProfileId) {
      let defaultKid = await prisma.kidProfile.findFirst({
        where: { householdId },
      });

      if (!defaultKid) {
        defaultKid = await prisma.kidProfile.create({
          data: {
            householdId,
            displayName: 'Curious Kid',
            ageBand: '8-11',
            avatar: '🚀',
          },
        });
      }
      kidProfileId = defaultKid.id;
    }

    const result = await runLessonGenerationPipeline({
      question: question.trim(),
      householdId,
      kidProfileId,
      forceFailOutputMod: !!forceFailOutputMod,
    });

    if (result.status === 'BLOCKED') {
      return NextResponse.json(
        {
          success: false,
          status: 'BLOCKED',
          reason: result.reason,
          safeRedirectSuggestions: result.safeRedirectSuggestions,
        },
        { status: 200 } // return 200 with safe redirect so client displays friendly guidance
      );
    }

    return NextResponse.json({
      success: true,
      status: 'SUCCESS',
      customLessonId: result.customLessonId,
      lesson: result.lesson,
      remainingAllowance: result.remainingAllowance,
      usedFallback: result.usedFallback,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';

    if (message.includes('ALLOWANCE_EXHAUSTED')) {
      return NextResponse.json(
        {
          error: 'ALLOWANCE_EXHAUSTED',
          message: 'You have used all 75 custom lessons for this 30-day period.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
