import Link from "next/link";

export default function Footer() {
  const footerLinks = [
    { href: "/", label: "Home" },
    { href: "/pricing", label: "Pricing" },
    { href: "/try-a-lesson", label: "Try a lesson" },
    { href: "/contact", label: "Contact" },
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/sign-in", label: "Sign in" },
  ];

  return (
    <footer className="mt-20 pt-10 pb-12 border-t border-[#0f3a52]/10 bg-white/50 relative overflow-hidden">
      <div className="w-full flex justify-center mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/local/footer-land.png"
          alt=""
          className="w-full max-w-[1750px] h-auto object-contain opacity-90"
        />
      </div>

      <div className="max-w-[1080px] mx-auto px-6 flex flex-wrap items-center justify-between gap-6">
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1fa7e1] to-[#63c5f1] text-white flex items-center justify-center font-black text-sm tracking-tight shadow-md shadow-[#1fa7e1]/30">
            0→1
          </span>
          <div>
            <strong className="block font-black text-[#0f3a52] text-[15px] leading-tight">
              Zeroto1 Academy
            </strong>
            <span className="text-[12px] font-bold text-[#6b8494]">
              Lessons for curious kids.
            </span>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-5">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] font-extrabold text-[#3d5a6c] hover:text-[#0f3a52] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="max-w-[1080px] mx-auto px-6 mt-8 pt-6 border-t border-[#0f3a52]/5 text-center text-[12px] font-bold text-[#6b8494]">
        © 2026 Zeroto1 Academy. Made for curious kids.
      </div>
    </footer>
  );
}
