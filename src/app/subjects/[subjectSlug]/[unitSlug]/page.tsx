import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getUnitWithLessons } from '@/lib/content';
import { prisma } from '@/lib/prisma';

export const revalidate = 0;

interface Props {
  params: Promise<{ subjectSlug: string; unitSlug: string }>;
}

export default async function UnitDetailPage({ params }: Props) {
  const { subjectSlug, unitSlug } = await params;
  const data = await getUnitWithLessons(subjectSlug, unitSlug);

  if (!data) {
    notFound();
  }

  const { unit, subject, progressMap, nextLessonId, activeKidId } = data;

  let activeKid = null;
  if (activeKidId) {
    activeKid = await prisma.kidProfile.findUnique({
      where: { id: activeKidId },
    });
  }

  return (
    <div className="max-w-[1080px] mx-auto px-6 py-10">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-black text-[#6b8494] mb-6">
        <Link href="/subjects" className="hover:text-[#0f3a52] transition-colors">
          Subjects
        </Link>
        <span>›</span>
        <Link
          href={`/subjects/${subject.slug}`}
          className="hover:text-[#0f3a52] transition-colors"
        >
          {subject.name}
        </Link>
        <span>›</span>
        <span className="text-[#0f3a52]">{unit.title}</span>
      </div>

      {/* Unit Header Card */}
      <div className="bg-white rounded-[28px] p-8 sm:p-10 border border-[#0f3a52]/10 shadow-sm mb-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-white mb-3"
              style={{ backgroundColor: subject.color || '#1fa7e1' }}
            >
              {subject.name} Unit
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-[#0f3a52] tracking-tight">
              {unit.title}
            </h1>
            <p className="text-sm font-semibold text-[#6b8494] mt-2 leading-relaxed">
              {unit.description || 'Explore lessons in this unit at your own pace.'}
            </p>

            {activeKid && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eff8ff] text-[#1fa7e1] text-xs font-black mt-4">
                <span>{activeKid.avatar || '🌟'}</span>
                <span>Tracking progress for {activeKid.displayName}</span>
              </div>
            )}
          </div>

          <div className="px-5 py-3 rounded-2xl bg-[#eff8ff] text-center min-w-[120px]">
            <span className="text-2xl font-black text-[#0f3a52] block">
              {unit.lessons.length}
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#6b8494]">
              Lessons
            </span>
          </div>
        </div>
      </div>

      {/* Lessons List with Progress States */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-[#0f3a52] tracking-tight">
            Lessons in this Unit
          </h2>
          <span className="text-xs font-bold text-[#6b8494]">
            {activeKid ? 'Saved to profile' : 'Explore any lesson'}
          </span>
        </div>

        <div className="space-y-4">
          {unit.lessons.map((lesson, idx) => {
            const progress = progressMap[lesson.id];
            const isCompleted = progress?.status === 'COMPLETED';
            const isInProgress = progress?.status === 'IN_PROGRESS';
            const isNext = lesson.id === nextLessonId;

            let statusLabel = 'Not started';
            let statusColor = 'bg-slate-100 text-[#6b8494]';
            if (isCompleted) {
              statusLabel = 'Done ✓';
              statusColor = 'bg-emerald-100 text-emerald-700';
            } else if (isInProgress) {
              statusLabel = 'In progress ⏳';
              statusColor = 'bg-amber-100 text-amber-800';
            }

            return (
              <div
                key={lesson.id}
                className={`bg-white rounded-[24px] p-6 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                  isNext
                    ? 'border-[#1fa7e1] shadow-lg ring-2 ring-[#1fa7e1]/20'
                    : 'border-[#0f3a52]/10 hover:border-[#1fa7e1] shadow-sm'
                }`}
              >
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-inner ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isNext
                        ? 'bg-[#1fa7e1] text-white'
                        : 'bg-[#eff8ff] text-[#0f3a52]'
                    }`}
                  >
                    {isCompleted ? '✓' : idx + 1}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${statusColor}`}>
                        {statusLabel}
                      </span>
                      {lesson.isPreview && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#eff8ff] text-[#1fa7e1] text-[11px] font-black">
                          Free Preview
                        </span>
                      )}
                      {isNext && (
                        <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#1fa7e1] to-[#ffb356] text-white text-[11px] font-black animate-pulse">
                          Start here / Open next
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-black text-[#0f3a52] hover:text-[#1fa7e1] transition-colors">
                      <Link href={`/lessons/${lesson.slug}`}>
                        {lesson.title}
                      </Link>
                    </h3>

                    <p className="text-xs font-semibold text-[#6b8494] mt-1 line-clamp-2">
                      <span className="font-bold text-[#0f3a52]">Big Question:</span> {lesson.bigQuestion}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <Link
                    href={`/lessons/${lesson.slug}`}
                    className={`px-6 py-3 rounded-full text-xs font-black transition-all shadow-sm ${
                      isNext
                        ? 'bg-[#1fa7e1] hover:bg-[#0d7fb0] text-white shadow-md shadow-[#1fa7e1]/25'
                        : isCompleted
                        ? 'bg-[#eff8ff] hover:bg-slate-200 text-[#0f3a52]'
                        : 'bg-[#0f3a52] hover:bg-[#1fa7e1] text-white'
                    }`}
                  >
                    {isCompleted
                      ? 'Review Lesson →'
                      : isInProgress
                      ? 'Resume Lesson →'
                      : isNext
                      ? 'Open Next Lesson →'
                      : 'View Overview →'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
