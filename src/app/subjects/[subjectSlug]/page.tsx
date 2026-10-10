import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSubjectBySlug } from '@/lib/content';
import { getActiveKidId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const revalidate = 0;

interface Props {
  params: Promise<{ subjectSlug: string }>;
}

export default async function SubjectDetailPage({ params }: Props) {
  const { subjectSlug } = await params;
  const subject = await getSubjectBySlug(subjectSlug);

  if (!subject) {
    notFound();
  }

  const kidId = await getActiveKidId();
  let activeKid = null;
  if (kidId) {
    activeKid = await prisma.kidProfile.findUnique({
      where: { id: kidId },
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
        <span className="text-[#0f3a52]">{subject.name}</span>
      </div>

      {/* Subject Header */}
      <div className="bg-white rounded-[28px] p-8 sm:p-10 border border-[#0f3a52]/10 shadow-sm mb-10 flex flex-wrap items-center justify-between gap-6">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 mb-2">
            <span
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: subject.color || '#1fa7e1' }}
            />
            <span className="text-xs font-black uppercase tracking-wider text-[#6b8494]">
              Curated Curriculum
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0f3a52] tracking-tight">
            {subject.name}
          </h1>
          <p className="text-sm font-semibold text-[#6b8494] mt-2 leading-relaxed">
            {subject.description}
          </p>

          {activeKid && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eff8ff] text-[#1fa7e1] text-xs font-black mt-4">
              <span>{activeKid.avatar || '🌟'}</span>
              <span>Learning as {activeKid.displayName}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-center">
          <div className="p-4 rounded-2xl bg-[#eff8ff] min-w-[100px]">
            <span className="text-2xl font-black text-[#0f3a52] block">
              {subject.units.length}
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#6b8494]">
              Units
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-[#eff8ff] min-w-[100px]">
            <span className="text-2xl font-black text-[#0f3a52] block">
              {subject.units.reduce((acc, u) => acc + u.lessons.length, 0)}
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#6b8494]">
              Lessons
            </span>
          </div>
        </div>
      </div>

      {/* Units List */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-[#0f3a52] tracking-tight mb-6">
          Themed Units in {subject.name}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subject.units.map((unit, idx) => (
            <div
              key={unit.id}
              className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#0f3a52]/10 shadow-sm hover:shadow-md hover:border-[#1fa7e1] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full bg-[#eff8ff] text-[#1fa7e1] text-xs font-black">
                    Unit {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-[#6b8494]">
                    {unit.lessons.length} Lessons
                  </span>
                </div>

                <h3 className="text-xl font-black text-[#0f3a52] mb-2">
                  {unit.title}
                </h3>
                <p className="text-xs font-semibold text-[#6b8494] leading-relaxed mb-6">
                  {unit.description || 'Explore this topic with guided interactive lessons.'}
                </p>
              </div>

              <div className="pt-4 border-t border-[#0f3a52]/10 flex items-center justify-between">
                <div className="flex -space-x-1 text-xs">
                  {unit.lessons.slice(0, 3).map((l, i) => (
                    <span
                      key={l.id}
                      className="w-6 h-6 rounded-full bg-slate-100 border border-white flex items-center justify-center font-black text-[10px] text-[#0f3a52]"
                      title={l.title}
                    >
                      {i + 1}
                    </span>
                  ))}
                  {unit.lessons.length > 3 && (
                    <span className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center font-black text-[10px] text-[#6b8494]">
                      +{unit.lessons.length - 3}
                    </span>
                  )}
                </div>

                <Link
                  href={`/subjects/${subject.slug}/${unit.slug}`}
                  className="px-5 py-2.5 rounded-full bg-[#0f3a52] text-white hover:bg-[#1fa7e1] font-black text-xs transition-colors shadow-sm"
                >
                  Explore Unit →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
