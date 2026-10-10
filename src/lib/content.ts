import { prisma } from '@/lib/prisma';
import { getCurrentSession, getActiveKidId } from '@/lib/auth';
import { isHouseholdEntitled } from '@/lib/billing/entitlements';

export interface SubjectWithCounts {
  id: string;
  slug: string;
  name: string;
  description: string;
  color: string | null;
  unitsCount: number;
  lessonsCount: number;
}

export async function getSubjects(): Promise<SubjectWithCounts[]> {
  const subjects = await prisma.subject.findMany({
    orderBy: { orderIndex: 'asc' },
    include: {
      units: {
        include: {
          lessons: {
            where: { isPublished: true },
            select: { id: true },
          },
        },
      },
    },
  });

  return subjects.map((sub) => {
    const lessonsCount = sub.units.reduce((acc, u) => acc + u.lessons.length, 0);
    return {
      id: sub.id,
      slug: sub.slug,
      name: sub.name,
      description: sub.description,
      color: sub.color,
      unitsCount: sub.units.length,
      lessonsCount,
    };
  });
}

export async function getSubjectBySlug(slug: string) {
  return prisma.subject.findUnique({
    where: { slug },
    include: {
      units: {
        orderBy: { orderIndex: 'asc' },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { orderIndex: 'asc' },
          },
        },
      },
    },
  });
}

export async function getUnitWithLessons(subjectSlug: string, unitSlug: string) {
  const subject = await prisma.subject.findUnique({
    where: { slug: subjectSlug },
  });

  if (!subject) return null;

  const unit = await prisma.unit.findFirst({
    where: {
      subjectId: subject.id,
      slug: unitSlug,
    },
    include: {
      subject: true,
      lessons: {
        where: { isPublished: true },
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  if (!unit) return null;

  // Check if kid profile is logged in
  const kidId = await getActiveKidId();
  let progressMap: Record<
    string,
    { status: string; currentStepOrder: number; percent: number; completedCount: number }
  > = {};

  if (kidId) {
    const progressList = await prisma.lessonProgress.findMany({
      where: {
        kidProfileId: kidId,
        lessonId: { in: unit.lessons.map((l) => l.id) },
      },
    });

    progressMap = progressList.reduce(
      (acc, p) => {
        let completedCount = 0;
        if (p.completedSteps) {
          try {
            completedCount = JSON.parse(p.completedSteps).length;
          } catch {
            completedCount = 0;
          }
        }
        const percent =
          p.status === 'COMPLETED' ? 100 : Math.round((completedCount / 6) * 100);

        acc[p.lessonId] = {
          status: p.status,
          currentStepOrder: p.currentStepOrder,
          percent,
          completedCount,
        };
        return acc;
      },
      {} as Record<
        string,
        { status: string; currentStepOrder: number; percent: number; completedCount: number }
      >
    );
  }

  // Find next lesson to start / open
  let nextLessonId: string | null = null;
  for (const lesson of unit.lessons) {
    const p = progressMap[lesson.id];
    if (!p || p.status !== 'COMPLETED') {
      nextLessonId = lesson.id;
      break;
    }
  }

  return {
    unit,
    subject,
    progressMap,
    nextLessonId,
    activeKidId: kidId,
  };
}

export async function getLessonBySlug(slug: string) {
  const lesson = await prisma.lesson.findFirst({
    where: { slug, isPublished: true },
    include: {
      unit: {
        include: {
          subject: true,
        },
      },
      steps: {
        orderBy: { stepOrder: 'asc' },
      },
    },
  });

  if (!lesson) return null;

  const session = await getCurrentSession();
  const kidId = await getActiveKidId();

  let progress = null;
  let progressPercent = 0;

  if (kidId) {
    progress = await prisma.lessonProgress.findUnique({
      where: {
        kidProfileId_lessonId: {
          kidProfileId: kidId,
          lessonId: lesson.id,
        },
      },
    });

    if (progress) {
      if (progress.status === 'COMPLETED') {
        progressPercent = 100;
      } else {
        let count = 0;
        try {
          count = progress.completedSteps ? JSON.parse(progress.completedSteps).length : 0;
        } catch {
          count = 0;
        }
        progressPercent = Math.round((count / 6) * 100);
      }
    }
  }

  // Gating rule: Logged out users CANNOT access non-preview lessons; unpaid households require active entitlement
  let isLocked = false;
  if (!lesson.isPreview) {
    if (!session) {
      isLocked = true;
    } else {
      const entitled = await isHouseholdEntitled(session.householdId);
      isLocked = !entitled;
    }
  }

  return {
    lesson,
    progress,
    progressPercent,
    isLoggedIn: !!session,
    activeKidId: kidId,
    isLocked,
  };
}

export interface Recommendation {
  type: 'CONTINUE' | 'UP_NEXT' | 'PREVIEW';
  lesson: {
    id: string;
    slug: string;
    title: string;
    bigQuestion: string;
    unitTitle: string;
    subjectName: string;
    subjectSlug: string;
    isPreview: boolean;
  };
  percent?: number;
  currentStep?: number;
}

export async function getLessonRecommendation(): Promise<Recommendation | null> {
  const kidId = await getActiveKidId();

  if (kidId) {
    // 1. Check for any in-progress lesson
    const inProgress = await prisma.lessonProgress.findFirst({
      where: {
        kidProfileId: kidId,
        status: 'IN_PROGRESS',
      },
      include: {
        lesson: {
          include: {
            unit: {
              include: { subject: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (inProgress) {
      let count = 0;
      try {
        count = inProgress.completedSteps ? JSON.parse(inProgress.completedSteps).length : 0;
      } catch {
        count = 0;
      }
      const percent = Math.max(17, Math.round((count / 6) * 100));

      return {
        type: 'CONTINUE',
        lesson: {
          id: inProgress.lesson.id,
          slug: inProgress.lesson.slug,
          title: inProgress.lesson.title,
          bigQuestion: inProgress.lesson.bigQuestion,
          unitTitle: inProgress.lesson.unit.title,
          subjectName: inProgress.lesson.unit.subject.name,
          subjectSlug: inProgress.lesson.unit.subject.slug,
          isPreview: inProgress.lesson.isPreview,
        },
        percent,
        currentStep: inProgress.currentStepOrder,
      };
    }

    // 2. Otherwise recommend the first uncompleted lesson
    const completedProgress = await prisma.lessonProgress.findMany({
      where: {
        kidProfileId: kidId,
        status: 'COMPLETED',
      },
      select: { lessonId: true },
    });
    const completedIds = completedProgress.map((c) => c.lessonId);

    const nextLesson = await prisma.lesson.findFirst({
      where: {
        isPublished: true,
        id: { notIn: completedIds },
      },
      include: {
        unit: {
          include: { subject: true },
        },
      },
      orderBy: [{ unit: { orderIndex: 'asc' } }, { orderIndex: 'asc' }],
    });

    if (nextLesson) {
      return {
        type: 'UP_NEXT',
        lesson: {
          id: nextLesson.id,
          slug: nextLesson.slug,
          title: nextLesson.title,
          bigQuestion: nextLesson.bigQuestion,
          unitTitle: nextLesson.unit.title,
          subjectName: nextLesson.unit.subject.name,
          subjectSlug: nextLesson.unit.subject.slug,
          isPreview: nextLesson.isPreview,
        },
        percent: 0,
        currentStep: 1,
      };
    }
  }

  // 3. Fallback for logged-out users: Curated Preview Lesson
  const previewLesson = await prisma.lesson.findFirst({
    where: { isPublished: true, isPreview: true },
    include: {
      unit: {
        include: { subject: true },
      },
    },
    orderBy: { orderIndex: 'asc' },
  });

  if (previewLesson) {
    return {
      type: 'PREVIEW',
      lesson: {
        id: previewLesson.id,
        slug: previewLesson.slug,
        title: previewLesson.title,
        bigQuestion: previewLesson.bigQuestion,
        unitTitle: previewLesson.unit.title,
        subjectName: previewLesson.unit.subject.name,
        subjectSlug: previewLesson.unit.subject.slug,
        isPreview: true,
      },
      percent: 0,
      currentStep: 1,
    };
  }

  return null;
}
