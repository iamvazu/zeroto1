import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLessonBySlug } from '@/lib/content';
import { prisma } from '@/lib/prisma';

export const revalidate = 0;

interface Props {
  params: Promise<{ lessonSlug: string }>;
}

const STEP_LABELS: Record<string, { label: string; icon: string; desc: string }> = {
  HOOK: {
    label: '1. Hook',
    icon: '💡',
    desc: 'Surprising fact to spark your curiosity',
  },
  VIDEO: {
    label: '2. Video',
    icon: '🎬',
    desc: 'Curated kid-safe explainer video',
  },
  READ: {
    label: '3. Read',
    icon: '📖',
    desc: 'Bite-sized, chunked guided passage',
  },
  ACTIVITY: {
    label: '4. Activity',
    icon: '✨',
    desc: 'Interactive observation and hands-on thinking',
  },
  PRACTICE: {
    label: '5. Practice',
    icon: '🎯',
    desc: 'Gentle check quiz with zero penalty',
  },
  DEEP_DIVE: {
    label: '6. Deep Dive',
    icon: '🚀',
    desc: 'Curious questions to take your learning further',
  },
};

export default async function LessonOverviewPage({ params }: Props) {
  const { lessonSlug } = await params;
  const data = await getLessonBySlug(lessonSlug);

  if (!data) {
    notFound();
  }

  const { lesson, progress, activeKidId } = data;

  let activeKid = null;
  if (activeKidId) {
    activeKid = await prisma.kidProfile.findUnique({
      where: { id: activeKidId },
    });
  }

  const isCompleted = progress?.status === 'COMPLETED';
  const isInProgress = progress?.status === 'IN_PROGRESS';
  const currentStep = progress?.currentStepOrder || 1;

  return (
    <div className="max-w-[1080px] mx-auto px-6 py-10">
      {/* Breadcrumbs */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-black text-[#6b8494] mb-6">
        <Link href="/subjects" className="hover:text-[#0f3a52] transition-colors">
          Subjects
        </Link>
        <span>›</span>
        <Link
          href={`/subjects/${lesson.unit.subject.slug}`}
          className="hover:text-[#0f3a52] transition-colors"
        >
          {lesson.unit.subject.name}
        </Link>
        <span>›</span>
        <Link
          href={`/subjects/${lesson.unit.subject.slug}/${lesson.unit.slug}`}
          className="hover:text-[#0f3a52] transition-colors"
        >
          {lesson.unit.title}
        </Link>
        <span>›</span>
        <span className="text-[#0f3a52]">{lesson.title}</span>
      </div>

      {/* Main Lesson Hero Card */}
      <div className="bg-white rounded-[28px] overflow-hidden border border-[#0f3a52]/10 shadow-lg mb-10">
        {/* Banner area */}
        <div className="bg-gradient-to-r from-[#0f3a52] via-[#1fa7e1] to-[#63c5f1] p-8 sm:p-12 text-white relative">
          <div className="max-w-2xl relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-black uppercase tracking-wider">
                {lesson.unit.subject.name} • {lesson.unit.title}
              </span>
              {lesson.isPreview && (
                <span className="px-3 py-1 rounded-full bg-[#ffb356] text-[#0f3a52] text-xs font-black uppercase tracking-wider">
                  Free Preview
                </span>
              )}
              {isCompleted && (
                <span className="px-3 py-1 rounded-full bg-[#75d06a] text-white text-xs font-black">
                  Completed ✓
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
              {lesson.title}
            </h1>

            {activeKid && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs font-bold">
                <span>{activeKid.avatar || '🌟'}</span>
                <span>Active explorer: {activeKid.displayName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Big Question & By The End Section */}
        <div className="p-8 sm:p-10 space-y-8 bg-white">
          {/* Big Question Callout */}
          <div className="p-6 sm:p-8 rounded-[24px] bg-[#eff8ff] border border-[#1fa7e1]/20">
            <span className="text-xs font-black uppercase tracking-wider text-[#1fa7e1] block mb-2">
              The Big Question
            </span>
            <p className="text-2xl sm:text-3xl font-black text-[#0f3a52] leading-snug">
              &ldquo;{lesson.bigQuestion}&rdquo;
            </p>
          </div>

          {/* By The End */}
          <div className="p-6 rounded-[24px] bg-[#fff8f0] border border-[#ffb356]/30">
            <span className="text-xs font-black uppercase tracking-wider text-[#e0a322] block mb-2">
              By the end of this lesson
            </span>
            <p className="text-base sm:text-lg font-bold text-[#0f3a52] leading-relaxed">
              {lesson.byTheEnd}
            </p>
          </div>

          {/* 6-Step Roadmap */}
          <div>
            <h2 className="text-xl font-black text-[#0f3a52] tracking-tight mb-4">
              Lesson Journey (6 Steps)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {lesson.steps.map((step) => {
                const info = STEP_LABELS[step.stepType] || {
                  label: step.stepType,
                  icon: '📌',
                  desc: '',
                };
                const isStepCompleted = isCompleted || step.stepOrder < currentStep;
                const isCurrentStep = isInProgress && step.stepOrder === currentStep;

                return (
                  <div
                    key={step.id}
                    className={`rounded-2xl p-4 border text-center transition-all ${
                      isStepCompleted
                        ? 'bg-emerald-50 border-emerald-200'
                        : isCurrentStep
                        ? 'bg-[#eff8ff] border-[#1fa7e1] ring-2 ring-[#1fa7e1]/20'
                        : 'bg-white border-[#0f3a52]/10'
                    }`}
                  >
                    <span className="text-2xl block mb-2">{info.icon}</span>
                    <h3 className="text-xs font-black text-[#0f3a52] mb-1">
                      {info.label}
                    </h3>
                    <p className="text-[11px] font-semibold text-[#6b8494] line-clamp-2">
                      {info.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Start / Resume Action Bar */}
          <div className="pt-6 border-t border-[#0f3a52]/10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#6b8494]">
                Estimated time: ~10–12 minutes • Self-paced • No grading
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/subjects/${lesson.unit.subject.slug}/${lesson.unit.slug}`}
                className="px-5 py-3 rounded-full border border-[#0f3a52]/15 text-[#0f3a52] hover:bg-slate-50 font-black text-xs transition-colors"
              >
                ← Back to Unit
              </Link>

              {data.isLocked ? (
                <Link
                  href={`/sign-up?from=/lessons/${lesson.slug}/play`}
                  className="px-8 py-3.5 rounded-full bg-[#0f3a52] hover:bg-[#1fa7e1] text-white font-black text-sm transition-all shadow-md hover:scale-105"
                >
                  Start Free Trial to Unlock 🔒
                </Link>
              ) : (
                <Link
                  href={`/lessons/${lesson.slug}/play`}
                  className="px-8 py-3.5 rounded-full bg-[#1fa7e1] hover:bg-[#0d7fb0] text-white font-black text-sm transition-all shadow-md shadow-[#1fa7e1]/25 hover:scale-105"
                >
                  {isCompleted
                    ? 'Replay Lesson →'
                    : isInProgress
                    ? `Resume Step ${currentStep} →`
                    : 'Start Lesson →'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
