import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-[540px] mx-auto px-6 py-24 text-center">
      <span className="w-12 h-12 rounded-2xl bg-[#eff8ff] text-[#1fa7e1] inline-flex items-center justify-center font-black text-xl mb-4">
        🔍
      </span>
      <h1 className="text-3xl sm:text-4xl font-black text-[#0f3a52] tracking-tight mb-3">
        Page Not Found
      </h1>
      <p className="text-sm font-bold text-[#6b8494] mb-8">
        We couldn&apos;t find the lesson or page you were looking for.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-full bg-[#1fa7e1] text-white font-black text-sm hover:bg-[#0d7fb0] transition-colors shadow-md"
      >
        Back to Home →
      </Link>
    </div>
  );
}
