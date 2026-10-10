import Link from "next/link";

export default function TryALessonPage() {
  const previewLessons = [
    {
      subject: "Science",
      title: "Light, Shadows, and Color",
      description:
        "Light travels in straight lines until it hits matter. Transparent, translucent, and opaque materials affect how light passes and where shadows form.",
      badgeColor: "bg-[#e7f4fb] text-[#1fa7e1]",
      href: "/lessons/light-shadows-and-color/play",
    },
    {
      subject: "History",
      title: "Caves, Carvings, and First Images",
      description:
        "The oldest images do not come with labels, so viewers have to reason carefully from marks, materials, places, and patterns.",
      badgeColor: "bg-[#fff4de] text-[#e0a322]",
      href: "/lessons/caves-carvings-first-images/play",
    },
    {
      subject: "Art",
      title: "Color Theory and Mixing",
      description:
        "Primary pigments, color wheels, and optical mixing. Discover how human eyes perceive combinations of light and color.",
      badgeColor: "bg-[#eef8ed] text-[#3aaa4a]",
      href: "/lessons/color-theory-and-mixing/play",
    },
  ];

  return (
    <div className="max-w-[1080px] mx-auto px-6 py-16">
      <div className="text-center max-w-[620px] mx-auto mb-14">
        <span className="inline-block px-3 py-1 rounded-full bg-[#eff8ff] text-[#1fa7e1] text-xs font-black uppercase tracking-wider mb-3">
          Curated preview
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-[#0f3a52] tracking-tight mb-4">
          Try a lesson freely.
        </h1>
        <p className="text-lg font-bold text-[#3d5a6c]">
          Experience a full 6-step Zeroto1 Academy lesson with no account or credit card required.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {previewLessons.map((item) => (
          <div
            key={item.title}
            className="bg-white rounded-[28px] p-6 shadow-xl border border-[#0f3a52]/10 flex flex-col justify-between hover:-translate-y-1 transition-transform"
          >
            <div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${item.badgeColor} mb-3`}
              >
                {item.subject}
              </span>
              <h2 className="text-xl font-black text-[#0f3a52] mb-3">
                {item.title}
              </h2>
              <p className="text-sm font-semibold text-[#3d5a6c] leading-relaxed mb-6">
                {item.description}
              </p>
            </div>
            <Link
              href={item.href}
              className="w-full py-3 rounded-full bg-[#0f3a52] text-white font-extrabold text-center text-sm hover:bg-[#1fa7e1] transition-colors block shadow-sm"
            >
              Start lesson preview →
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center bg-white/70 rounded-[28px] p-8 border border-[#0f3a52]/5 max-w-[640px] mx-auto">
        <h3 className="text-xl font-black text-[#0f3a52] mb-2">
          Want full access to all 1,500+ lessons?
        </h3>
        <p className="text-sm font-bold text-[#3d5a6c] mb-6">
          Start a free trial for your family to unlock the full library, AI lesson generation, and practice labs.
        </p>
        <Link
          href="/sign-up"
          className="inline-flex px-7 py-3.5 rounded-full font-black text-sm bg-[#1fa7e1] text-white hover:bg-[#0d7fb0] transition-colors shadow-lg shadow-[#1fa7e1]/20"
        >
          Start full free trial →
        </Link>
      </div>
    </div>
  );
}
