import Link from "next/link";
import { getLessonRecommendation } from "@/lib/content";

export const revalidate = 0;

export default async function HomePage() {
  const recommendation = await getLessonRecommendation();

  return (
    <div className="w-full">
      {/* ============ HERO ============ */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        <div className="max-w-[1080px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="z-10">
            {/* Smiling Star */}
            <svg
              className="w-16 h-16 mb-4"
              viewBox="0 0 64 64"
              aria-hidden="true"
            >
              <g stroke="#f2c14b" strokeWidth="2.4" strokeLinecap="round">
                <line x1="32" y1="2" x2="32" y2="10" />
                <line x1="14" y1="12" x2="19" y2="17" />
                <line x1="50" y1="12" x2="45" y2="17" />
                <line x1="8" y1="30" x2="15" y2="30" />
                <line x1="56" y1="30" x2="49" y2="30" />
              </g>
              <path
                d="M32 14l4.6 11.2 12.2 1-9.2 7.6 2.8 11.8L32 39.6 21.6 45.6l2.8-11.8-9.2-7.6 12.2-1L32 14z"
                fill="#f6c445"
              />
              <circle cx="27" cy="32" r="1.5" fill="#123044" />
              <circle cx="37" cy="32" r="1.5" fill="#123044" />
              <path
                d="M27 37c1.8 2.2 8.2 2.2 10 0"
                fill="none"
                stroke="#123044"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>

            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black text-[#0f3a52] leading-[1.08] tracking-tight mb-4">
              Curious kids don&apos;t wait for lessons.
            </h1>
            <p className="text-xl sm:text-2xl font-bold text-[#3d5a6c] mb-8 leading-snug">
              Zeroto1 Academy is a place for kids to learn without pressure
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/sign-up"
                className="px-7 py-3.5 rounded-full font-black text-[16px] bg-[#1fa7e1] text-white hover:bg-[#0d7fb0] transition-transform hover:-translate-y-0.5 shadow-lg shadow-[#1fa7e1]/30 flex items-center gap-2"
              >
                Start a free trial →
              </Link>
              <Link
                href="/try-a-lesson"
                className="px-6 py-3.5 rounded-full font-black text-[16px] bg-white text-[#0f3a52] hover:bg-white/80 border border-[#0f3a52]/10 transition-colors shadow-sm"
              >
                Try a preview
              </Link>
            </div>
          </div>

          {/* Hero Stage / Visual */}
          <div className="relative flex items-center justify-center">
            {/* Soft decorative blob */}
            <div
              className="absolute -inset-4 bg-gradient-to-tr from-[#63c5f1]/25 to-[#ffb356]/20 rounded-full blur-3xl -z-10"
              aria-hidden="true"
            />

            {/* Hero Card */}
            <div className="relative bg-white/90 backdrop-blur-sm rounded-[28px] p-6 shadow-2xl border border-white/60 w-full max-w-[540px]">
              <div className="mb-4">
                <p className="text-[17px] font-black text-[#0f3a52] tracking-tight">
                  What do you want to learn today, Riley?
                </p>
              </div>
              <div className="relative rounded-2xl overflow-hidden shadow-inner border border-[#0f3a52]/5 bg-[#f8fbfe]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/img/learn-home-ui.webp"
                  alt="Zeroto1 Academy Learn home. Up next is Plant Parts Work Together."
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* Decorative Kid */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/local/hero-kid.png"
                alt=""
                className="absolute -bottom-8 -right-8 w-44 sm:w-52 pointer-events-none drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============ RECOMMENDATION: UP NEXT / CONTINUE LEARNING ============ */}
      {recommendation && (
        <section className="py-4 -mt-8 mb-6 relative z-20">
          <div className="max-w-[1080px] mx-auto px-6">
            <div className="bg-white rounded-[28px] p-6 sm:p-8 border-2 border-[#1fa7e1]/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-14 h-14 rounded-2xl bg-[#eff8ff] flex items-center justify-center text-3xl shrink-0 shadow-inner">
                  {recommendation.type === 'CONTINUE'
                    ? '⏳'
                    : recommendation.type === 'UP_NEXT'
                    ? '🎯'
                    : '✨'}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="px-3 py-0.5 rounded-full bg-[#1fa7e1] text-white text-[11px] font-black uppercase tracking-wider">
                      {recommendation.type === 'CONTINUE'
                        ? 'Continue Learning'
                        : recommendation.type === 'UP_NEXT'
                        ? 'Up Next for You'
                        : 'Recommended Free Preview'}
                    </span>
                    <span className="text-xs font-bold text-[#6b8494]">
                      {recommendation.lesson.subjectName} • {recommendation.lesson.unitTitle}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#0f3a52]">
                    {recommendation.lesson.title}
                  </h3>
                  <p className="text-xs font-semibold text-[#6b8494] mt-1 line-clamp-1">
                    &ldquo;{recommendation.lesson.bigQuestion}&rdquo;
                  </p>
                  {recommendation.type === 'CONTINUE' && typeof recommendation.percent === 'number' && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="w-48 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-[#1fa7e1] h-2.5 rounded-full"
                          style={{ width: `${recommendation.percent}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[#1fa7e1]">
                        {recommendation.percent}% completed • Step {recommendation.currentStep} of 6
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                <Link
                  href={`/lessons/${recommendation.lesson.slug}/play`}
                  className="px-8 py-4 rounded-full bg-[#1fa7e1] hover:bg-[#0d7fb0] text-white font-black text-sm transition-all shadow-md shadow-[#1fa7e1]/25 hover:scale-105 inline-block text-center cursor-pointer"
                >
                  {recommendation.type === 'CONTINUE'
                    ? 'Resume Lesson →'
                    : recommendation.type === 'UP_NEXT'
                    ? 'Start Next Lesson →'
                    : 'Try Free Preview →'}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============ PICK A SUBJECT ============ */}
      <section id="subjects" className="py-20 relative">
        <div className="max-w-[1080px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <h2 className="text-3xl sm:text-4xl font-black text-[#0f3a52] tracking-tight mb-4">
              Pick a subject
            </h2>
            <p className="text-lg font-bold text-[#3d5a6c] mb-2 leading-relaxed">
              There are over 1500+ built in lessons across History, Science, and Art.
            </p>
            <p className="text-[15px] font-semibold text-[#6b8494] mb-8 leading-relaxed">
              Each subject is built out logically. A subject is made of units. A unit is a series of lessons.
            </p>

            <ul className="space-y-4">
              <li className="flex items-start gap-4 p-4 rounded-2xl bg-white/70 border border-[#0f3a52]/5 shadow-sm">
                <span className="w-11 h-11 rounded-xl bg-[#fff4de] flex items-center justify-center shrink-0">
                  <svg width="24" height="24" viewBox="0 0 28 28">
                    <path
                      d="M4 22h20M7 22V12h4v10M12 22V8h4v14M17 22V14h4v8"
                      fill="none"
                      stroke="#e0a322"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M6 12l8-6 8 6"
                      fill="none"
                      stroke="#e0a322"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div>
                  <strong className="block text-[#0f3a52] text-base font-black">
                    History
                  </strong>
                  <span className="text-[#3d5a6c] text-[14px] font-semibold">
                    Ranging from earliest civilizations to US history to modern times.
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-4 p-4 rounded-2xl bg-white/70 border border-[#0f3a52]/5 shadow-sm">
                <span className="w-11 h-11 rounded-xl bg-[#e7f4fb] flex items-center justify-center shrink-0">
                  <svg width="24" height="24" viewBox="0 0 28 28">
                    <path
                      d="M11 4h6M12.2 5.2v6.2L7.4 20.2A3.2 3.2 0 0 0 10.2 25h7.6a3.2 3.2 0 0 0 2.8-4.8l-4.8-8.8V5.2"
                      fill="none"
                      stroke="#1fa7e1"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10.2 17h7.6"
                      stroke="#1fa7e1"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <div>
                  <strong className="block text-[#0f3a52] text-base font-black">
                    Science
                  </strong>
                  <span className="text-[#3d5a6c] text-[14px] font-semibold">
                    Explores everything from life sciences to outer space.
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-4 p-4 rounded-2xl bg-white/70 border border-[#0f3a52]/5 shadow-sm">
                <span className="w-11 h-11 rounded-xl bg-[#eef8ed] flex items-center justify-center shrink-0">
                  <svg width="24" height="24" viewBox="0 0 28 28">
                    <path
                      d="M14 5a9 9 0 1 0 0 18h1.4a2.2 2.2 0 0 0 2.1-2.9 1.6 1.6 0 0 1 1.5-2.1H20a5 5 0 0 0 5-5A9 9 0 0 0 14 5z"
                      fill="none"
                      stroke="#3aaa4a"
                      strokeWidth="2"
                    />
                    <circle cx="10" cy="12" r="1.3" fill="#3aaa4a" />
                    <circle cx="14" cy="9.5" r="1.3" fill="#e0a322" />
                    <circle cx="18" cy="12" r="1.3" fill="#1fa7e1" />
                  </svg>
                </span>
                <div>
                  <strong className="block text-[#0f3a52] text-base font-black">
                    Art
                  </strong>
                  <span className="text-[#3d5a6c] text-[14px] font-semibold">
                    Runs from art appreciation to music and theater.
                  </span>
                </div>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white rounded-[28px] p-6 shadow-xl border border-[#0f3a52]/10 space-y-5">
              <div>
                <h3 className="text-xl font-black text-[#0f3a52]">Choose a subject</h3>
                <p className="text-[14px] font-bold text-[#6b8494]">
                  Pick a subject to explore its units and lessons.
                </p>
              </div>

              {/* Subject Cards image */}
              <div className="rounded-2xl overflow-hidden border border-[#0f3a52]/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/local/subject-cards.webp"
                  alt="Subject cards"
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* History Units image */}
              <div className="rounded-2xl overflow-hidden border border-[#0f3a52]/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/local/history-units.webp"
                  alt="History units"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW LESSONS WORK ============ */}
      <section id="lesson" className="py-20 bg-white/60 border-y border-[#0f3a52]/5">
        <div className="max-w-[1080px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0f3a52] tracking-tight mb-4">
              How do Zeroto1 Academy lessons work?
            </h2>
            <p className="text-lg font-bold text-[#3d5a6c] mb-8">
              Every lesson follows the same friendly flow, so kids always know what&apos;s next — and never feel rushed.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: "Hook", desc: "Grab attention with a fun, surprising fact." },
                { name: "Video", desc: "Watch approved, kid-friendly videos." },
                { name: "Read", desc: "Learn more with guided reading." },
                { name: "Activity", desc: "Reinforce learning with a hands-on activity." },
                { name: "Practice", desc: "Check understanding with a short quiz." },
                { name: "Deep Dive", desc: "Explore more with AI-generated follow-ups." },
              ].map((step, idx) => (
                <div key={step.name} className="p-4 rounded-2xl bg-white border border-[#0f3a52]/5 shadow-sm">
                  <div className="text-[12px] font-black text-[#1fa7e1] uppercase tracking-wider mb-1">
                    Step {idx + 1}
                  </div>
                  <strong className="block text-[#0f3a52] font-black text-base">{step.name}</strong>
                  <p className="text-[13px] font-semibold text-[#6b8494] mt-1">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden shadow-lg border border-[#0f3a52]/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/local/lesson-banner.webp"
                alt="Lesson banner"
                className="w-full h-auto"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/local/step-hook.webp" alt="Hook step" className="rounded-xl border border-[#0f3a52]/5 shadow-sm" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/local/step-read.webp" alt="Read step" className="rounded-xl border border-[#0f3a52]/5 shadow-sm" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/local/step-activity.webp" alt="Activity step" className="rounded-xl border border-[#0f3a52]/5 shadow-sm" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/local/step-practice.webp" alt="Practice step" className="rounded-xl border border-[#0f3a52]/5 shadow-sm" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRICING CTA ============ */}
      <section className="py-20 text-center">
        <div className="max-w-[640px] mx-auto px-6">
          <span className="inline-block px-3 py-1 rounded-full bg-[#eff8ff] text-[#1fa7e1] text-xs font-black uppercase tracking-wider mb-3">
            Simple Family Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0f3a52] tracking-tight mb-4">
            One price for the whole family.
          </h2>
          <p className="text-lg font-bold text-[#3d5a6c] mb-8">
            No per-student math. One subscription covers all your kids with full access to lessons, AI generation, and practice tools.
          </p>
          <Link
            href="/pricing"
            className="inline-flex px-8 py-4 rounded-full font-black text-base bg-[#0f3a52] text-white hover:bg-[#1fa7e1] transition-transform hover:-translate-y-0.5 shadow-lg shadow-[#0f3a52]/20"
          >
            See pricing →
          </Link>
        </div>
      </section>
    </div>
  );
}
