import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLessonBySlug } from '@/lib/content';
import { prisma } from '@/lib/prisma';
import LessonPlayer from '@/components/player/LessonPlayer';

export const revalidate = 0;

interface Props {
  params: Promise<{ lessonSlug: string }>;
}

export default async function PlayLessonPage({ params }: Props) {
  const { lessonSlug } = await params;
  const data = await getLessonBySlug(lessonSlug);

  if (!data) {
    notFound();
  }

  const { lesson, progress, activeKidId, isLocked, isLoggedIn } = data;

  // Gating check: Block logged-out users from non-preview lessons
  if (isLocked) {
    return (
      <div className="min-h-screen bg-[#fff8f0] flex items-center justify-center p-6">
        <div className="max-w-[540px] w-full bg-white rounded-[28px] p-8 sm:p-12 text-center border border-[#0f3a52]/10 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[#fff8f0] text-[#e0a322] text-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            🔒
          </div>

          <span className="px-3.5 py-1 rounded-full bg-[#eff8ff] text-[#1fa7e1] text-xs font-black uppercase tracking-wider inline-block mb-3">
            Member-Only Lesson
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-[#0f3a52] tracking-tight mb-3">
            This lesson requires a family account
          </h1>

          <p className="text-sm font-semibold text-[#6b8494] mb-8 leading-relaxed">
            &ldquo;{lesson.title}&rdquo; is part of the full curriculum. Start a free trial to unlock all 1,500+ lessons across History, Science, and Art.
          </p>

          <div className="space-y-3">
            {isLoggedIn ? (
              <Link
                href="/pricing"
                className="w-full py-4 rounded-full bg-[#1fa7e1] hover:bg-[#0d7fb0] text-white font-black text-sm transition-all shadow-md shadow-[#1fa7e1]/25 block cursor-pointer"
              >
                Upgrade to Family Plan →
              </Link>
            ) : (
              <Link
                href={`/sign-up?from=/lessons/${lesson.slug}/play`}
                className="w-full py-4 rounded-full bg-[#1fa7e1] hover:bg-[#0d7fb0] text-white font-black text-sm transition-all shadow-md shadow-[#1fa7e1]/25 block cursor-pointer"
              >
                Start Free Trial →
              </Link>
            )}

            <Link
              href="/try-a-lesson"
              className="w-full py-3.5 rounded-full border border-[#0f3a52]/15 text-[#0f3a52] hover:bg-slate-50 font-black text-xs transition-colors block cursor-pointer"
            >
              Play a Free Preview Lesson Instead
            </Link>
          </div>
        </div>
      </div>
    );
  }

  let activeKid = null;
  if (activeKidId) {
    activeKid = await prisma.kidProfile.findUnique({
      where: { id: activeKidId },
    });
  }

  // Parse completed steps
  let completedStepsList: number[] = [];
  if (progress?.completedSteps) {
    try {
      completedStepsList = JSON.parse(progress.completedSteps);
    } catch {
      completedStepsList = [];
    }
  }

  // If completed, initial step can be 1 or 6
  const initialStepOrder = progress?.currentStepOrder || 1;

  return (
    <LessonPlayer
      lesson={lesson}
      initialStepOrder={initialStepOrder}
      completedStepsList={completedStepsList}
      activeKidName={activeKid?.displayName}
      activeKidAvatar={activeKid?.avatar}
      isGuestPreview={!isLoggedIn && lesson.isPreview}
    />
  );
}
