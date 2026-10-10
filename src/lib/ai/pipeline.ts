// zeroto1.academy — Safe AI Lesson Generation Pipeline (PRD §6.3, §6.4, Sprint 8)
// Pipeline: Classify → Moderate(input) → Generate Lesson → Moderate(output)

import { prisma } from '../prisma';
import { aiService } from './service';
import { decrementHouseholdAllowance, getHouseholdAllowance } from './ratelimit';
import { GeneratedLessonSchema } from './types';
import { logAiEvent } from './logger';

export interface PipelineBlockedResult {
  status: 'BLOCKED';
  reason: string;
  safeRedirectSuggestions: string[];
}

export interface PipelineSuccessResult {
  status: 'SUCCESS';
  customLessonId: string;
  lesson: GeneratedLessonSchema;
  remainingAllowance: number;
  usedFallback: boolean;
}

export type PipelineResult = PipelineBlockedResult | PipelineSuccessResult;

/**
 * Curated kid-safe fallback lesson when output moderation fails or needs recovery.
 * Conforms 100% to PRD §6.3 JSON schema.
 */
export function getSafeFallbackLesson(topic: string, subject: string = 'Science'): GeneratedLessonSchema {
  return {
    title: `The Great Wonder of ${topic || 'Curiosity & Discovery'}`,
    subject: subject || 'Science',
    ageBand: '8-11',
    summary: 'A special exploration into the amazing power of asking big questions and how human curious minds explore our world.',
    bigQuestion: 'How does curiosity help us uncover the greatest secrets of nature and the universe?',
    byTheEnd: 'You will discover how asking questions leads to incredible inventions and scientific breakthroughs.',
    steps: {
      hook: {
        text: 'Every giant discovery — from flying airplanes to peering inside distant stars — started with a simple question asked by someone just like you.',
        imagePrompt: 'A glowing golden compass resting on an open book under starry night skies, kid-friendly vector art.',
      },
      video: {
        query: 'The power of curiosity and scientific discovery for kids',
        channelAllowlist: ['SciShow Kids', 'CrashCourse Kids', 'National Geographic Kids', 'TED-Ed'],
      },
      read: {
        paragraphs: [
          'Throughout history, curious kids who wondered "why?" grew up to solve humanity’s most puzzling mysteries.',
          'Scientists use the scientific method: they observe something weird, ask a big question, test their idea, and share what they learned.',
          'Even when an experiment doesn\'t work out the way they expected, they learn something brand new that helps everyone take the next step.',
        ],
      },
      activity: {
        instruction: 'Look around your room or out the window. Find one object or creature and write down three questions you have never asked about it before!',
        interactionType: 'observe',
      },
      practice: {
        questions: [
          {
            prompt: 'What is the very first step in making a scientific discovery?',
            choices: [
              'Noticing something curious and asking a question',
              'Writing a 500-page book immediately',
              'Guessing the answer and never testing it',
              'Waiting for an adult to do it for you',
            ],
            answerIndex: 0,
            explanation: 'Observation and asking questions are the spark plugs of every great discovery!',
          },
          {
            prompt: 'What do great explorers do when an experiment gives an unexpected result?',
            choices: [
              'They analyze what happened and learn something new',
              'They give up forever and hide their notes',
              'They pretend it never happened',
              'They throw away all their tools',
            ],
            answerIndex: 0,
            explanation: 'Unexpected results often lead to the most surprising and wonderful new breakthroughs.',
          },
        ],
      },
      deepDive: {
        followUps: [
          'How did Isaac Newton discover gravity by simply watching an apple fall?',
          'What are the most exciting unanswered questions in science today?',
          'How do deep-sea explorers find creatures nobody has ever seen before?',
        ],
      },
    },
  };
}

export const SAFE_REDIRECT_SUGGESTIONS = [
  'How do blue whales sing to each other across the ocean?',
  'Why does the moon change its shape in the night sky?',
  'How did ancient Egyptians build the Great Pyramids?',
  'Why do leaves turn bright red and yellow in autumn?',
  'How do electric cars turn battery energy into speed?',
];

/**
 * Execute the 4-stage guarded pipeline:
 * 1. Classify(question)
 * 2. Moderate(input)
 * 3. Generate Lesson
 * 4. Moderate(output)
 */
export async function runLessonGenerationPipeline(params: {
  question: string;
  householdId: string;
  kidProfileId: string;
  forceFailOutputMod?: boolean; // For testing gate S8 output-moderation fallback
}): Promise<PipelineResult> {
  const { question, householdId, kidProfileId, forceFailOutputMod } = params;

  logAiEvent({
    level: 'info',
    event: 'pipeline_started',
    metadata: { question: question.slice(0, 80), householdId, kidProfileId },
  });

  // Stage 1: Classify
  const classification = await aiService.classify(question);

  // Stage 2: Moderate Input
  const inputModeration = await aiService.moderate(question);

  // Check if Input is Unsafe
  if (classification.safetyVerdict === 'FAIL' || inputModeration.verdict === 'FAIL') {
    logAiEvent({
      level: 'warn',
      event: 'pipeline_input_blocked',
      metadata: {
        question: question.slice(0, 80),
        reason: inputModeration.reason || classification.reasoning,
      },
    });

    return {
      status: 'BLOCKED',
      reason:
        inputModeration.reason ||
        'At Zeroto1 Academy, all lessons are crafted for safe and inspiring kid curiosity. Let\'s explore something awesome together instead!',
      safeRedirectSuggestions: SAFE_REDIRECT_SUGGESTIONS,
    };
  }

  // Check Household Allowance before generation
  const allowance = await getHouseholdAllowance(householdId);

  // Re-asking the same question returns the cached lesson without deducting allowance
  const existingCustomLesson = await prisma.customLesson.findFirst({
    where: {
      householdId,
      status: 'READY',
      question: question.trim(),
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existingCustomLesson && !forceFailOutputMod) {
    try {
      const parsed = JSON.parse(existingCustomLesson.lessonData) as GeneratedLessonSchema;
      logAiEvent({
        level: 'info',
        event: 'lesson_reused_from_cache',
        metadata: { customLessonId: existingCustomLesson.id, question },
      });
      return {
        status: 'SUCCESS',
        customLessonId: existingCustomLesson.id,
        lesson: parsed,
        remainingAllowance: allowance.remaining,
        usedFallback: false,
      };
    } catch {
      // If parsing fails, fall through to fresh generation
    }
  }

  if (!allowance.canGenerate) {
    throw new Error('ALLOWANCE_EXHAUSTED: You have used all 75 custom lessons this month.');
  }

  // Stage 3: Generate Lesson
  let generatedLesson: GeneratedLessonSchema;
  try {
    generatedLesson = await aiService.generateLesson({
      question,
      subject: classification.subject,
      ageBand: classification.ageBand,
    });
  } catch (err: unknown) {
    // If provider fails, fallback to safe curated lesson instead of failing with 500
    logAiEvent({
      level: 'error',
      event: 'generation_fallback_triggered',
      error: String(err),
    });
    generatedLesson = getSafeFallbackLesson(question, classification.subject);
  }

  // Stage 4: Moderate Output
  const fullLessonText = `${generatedLesson.title} ${generatedLesson.summary} ${generatedLesson.steps.read.paragraphs.join(' ')}`;
  const outputModeration = forceFailOutputMod
    ? { verdict: 'FAIL' as const, reason: 'Simulated output guardrail breach' }
    : await aiService.moderate(fullLessonText);

  let usedFallback = false;
  if (outputModeration.verdict === 'FAIL') {
    logAiEvent({
      level: 'warn',
      event: 'pipeline_output_blocked_using_fallback',
      metadata: { reason: outputModeration.reason },
    });
    // Replace with guaranteed safe fallback lesson
    generatedLesson = getSafeFallbackLesson(question, classification.subject);
    usedFallback = true;
  }

  // Decrement Household Allowance
  const decRes = await decrementHouseholdAllowance(householdId);

  // Persist to custom_lessons table
  const customLesson = await prisma.customLesson.create({
    data: {
      householdId,
      kidProfileId,
      question,
      subject: generatedLesson.subject,
      ageBand: generatedLesson.ageBand,
      lessonData: JSON.stringify(generatedLesson),
      status: 'READY',
    },
  });

  logAiEvent({
    level: 'info',
    event: 'pipeline_completed_success',
    metadata: {
      customLessonId: customLesson.id,
      remainingAllowance: decRes.remaining,
      usedFallback,
    },
  });

  return {
    status: 'SUCCESS',
    customLessonId: customLesson.id,
    lesson: generatedLesson,
    remainingAllowance: decRes.remaining,
    usedFallback,
  };
}
