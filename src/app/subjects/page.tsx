import Link from 'next/link';
import { getSubjects } from '@/lib/content';
import { getCurrentSession, getActiveKidId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const revalidate = 0; // dynamic data for progress

const SUBJECT_ICONS: Record<string, string> = {
  history: '🏛️',
  science: '🧬',
  art: '🎨',
};

export default async function SubjectsIndexPage() {
  const subjects = await getSubjects();
  const session = await getCurrentSession();
  const kidId = await getActiveKidId();

  let activeKid = null;
  if (kidId) {
    activeKid = await prisma.kidProfile.findUnique({
      where: { id: kidId },
    });
  }

  return (
    <div className="max-w-[1080px] mx-auto px-6 py-12">
      {/* Header bar / Greeting */}
      <div className="mb-10 text-center max-w-2xl mx-auto">
        {activeKid && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#eff8ff] text-[#1fa7e1] text-xs font-black mb-4 border border-[#1fa7e1]/20">
            <span>{activeKid.avatar || '🌟'}</span>
            <span>Exploring as {activeKid.displayName} (Ages {activeKid.ageBand})</span>
          </div>
        )}
        <h1 className="text-3xl sm:text-4xl font-black text-[#0f3a52] tracking-tight">
          Explore Subjects
        </h1>
        <p className="text-sm sm:text-base font-bold text-[#6b8494] mt-2">
          Self-directed learning with zero pressure. Choose a subject below to dive into themed units and interactive lessons.
        </p>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {subjects.map((sub) => {
          const icon = SUBJECT_ICONS[sub.slug] || '📚';
          return (
            <Link
              key={sub.id}
              href={`/subjects/${sub.slug}`}
              className="group bg-white rounded-[28px] p-8 border border-[#0f3a52]/10 shadow-sm hover:shadow-xl hover:border-[#1fa7e1] transition-all flex flex-col justify-between"
            >
              <div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${sub.color || '#1fa7e1'}15` }}
                >
                  {icon}
                </div>

                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-black text-[#0f3a52] group-hover:text-[#1fa7e1] transition-colors">
                    {sub.name}
                  </h2>
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: sub.color || '#1fa7e1' }}
                  />
                </div>

                <p className="text-xs font-semibold text-[#6b8494] leading-relaxed mb-6">
                  {sub.description}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 pt-6 border-t border-[#0f3a52]/10 text-xs font-black text-[#0f3a52]">
                  <span className="px-3 py-1 rounded-full bg-[#eff8ff] text-[#1fa7e1]">
                    {sub.unitsCount} Units
                  </span>
                  <span className="text-[#6b8494]">
                    {sub.lessonsCount} Lessons
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between text-xs font-black text-[#1fa7e1] group-hover:translate-x-1 transition-transform">
                  <span>Browse Units</span>
                  <span>→</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Exploration Footer banner */}
      <div className="mt-14 p-8 rounded-[28px] bg-[#eff8ff] border border-[#1fa7e1]/20 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-[#0f3a52]">
            Looking for something specific?
          </h3>
          <p className="text-xs font-semibold text-[#6b8494] mt-1">
            Kids can ask any question to generate custom 6-step lessons on demand.
          </p>
        </div>
        <Link
          href={session ? "/app" : "/sign-up"}
          className="px-5 py-2.5 rounded-full bg-[#0f3a52] hover:bg-[#1fa7e1] text-white font-black text-xs transition-colors"
        >
          {session ? "Ask a Question in App →" : "Start Free Trial →"}
        </Link>
      </div>
    </div>
  );
}
