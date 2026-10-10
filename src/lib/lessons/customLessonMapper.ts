// zeroto1.academy — Custom Lesson to LessonPlayer Data Mapper
// Adapts schema-compliant AI generated lessons to render in the unified LessonPlayer

import { LessonPlayerData, StepData } from '@/components/player/LessonPlayer';
import { GeneratedLessonSchema } from '../ai/types';

interface CustomLessonEntity {
  id: string;
  question: string;
  subject: string;
  ageBand: string;
  lessonData: string;
}

export function mapCustomLessonToPlayerData(customLesson: CustomLessonEntity): LessonPlayerData {
  let parsed: GeneratedLessonSchema;
  try {
    parsed = JSON.parse(customLesson.lessonData);
  } catch {
    throw new Error('Invalid JSON in custom lessonData');
  }

  const steps: StepData[] = [
    {
      id: `${customLesson.id}-step-1`,
      stepType: 'HOOK',
      stepOrder: 1,
      content: JSON.stringify(parsed.steps.hook),
    },
    {
      id: `${customLesson.id}-step-2`,
      stepType: 'VIDEO',
      stepOrder: 2,
      content: JSON.stringify(parsed.steps.video),
    },
    {
      id: `${customLesson.id}-step-3`,
      stepType: 'READ',
      stepOrder: 3,
      content: JSON.stringify(parsed.steps.read),
    },
    {
      id: `${customLesson.id}-step-4`,
      stepType: 'ACTIVITY',
      stepOrder: 4,
      content: JSON.stringify(parsed.steps.activity),
    },
    {
      id: `${customLesson.id}-step-5`,
      stepType: 'PRACTICE',
      stepOrder: 5,
      content: JSON.stringify(parsed.steps.practice),
    },
    {
      id: `${customLesson.id}-step-6`,
      stepType: 'DEEP_DIVE',
      stepOrder: 6,
      content: JSON.stringify(parsed.steps.deepDive),
    },
  ];

  return {
    id: customLesson.id,
    slug: `custom-${customLesson.id}`,
    title: parsed.title,
    bigQuestion: parsed.bigQuestion,
    unit: {
      slug: 'custom-inquiry',
      title: 'Curiosity Sparks',
      subject: {
        slug: parsed.subject.toLowerCase(),
        name: parsed.subject,
      },
    },
    steps,
  };
}
