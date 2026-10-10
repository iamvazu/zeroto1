// zeroto1.academy — Custom Lesson Play Page
// Plays AI-generated custom lessons through the unified 6-step LessonPlayer

import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import LessonPlayer from '@/components/player/LessonPlayer';
import { mapCustomLessonToPlayerData } from '@/lib/lessons/customLessonMapper';

export const revalidate = 0;

interface Props {
  params: Promise<{ customLessonId: string }>;
}

export default async function CustomLessonPlayPage({ params }: Props) {
  const { customLessonId } = await params;

  const customLesson = await prisma.customLesson.findUnique({
    where: { id: customLessonId },
    include: { kidProfile: true },
  });

  if (!customLesson) {
    notFound();
  }

  const playerData = mapCustomLessonToPlayerData(customLesson);

  return (
    <LessonPlayer
      lesson={playerData}
      initialStepOrder={1}
      completedStepsList={[]}
      activeKidName={customLesson.kidProfile?.displayName || 'Curious Explorer'}
      activeKidAvatar={customLesson.kidProfile?.avatar || '🚀'}
      isGuestPreview={false}
    />
  );
}
