"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface KidProfile {
  id: string;
  displayName: string;
  avatar: string | null;
  ageBand: string;
}

interface HouseholdData {
  id: string;
  name: string;
  region: string;
  customLessonAllowance: number;
  kidProfiles: KidProfile[];
}

export default function AppDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [household, setHousehold] = useState<HouseholdData | null>(null);
  const [activeKid, setActiveKid] = useState<KidProfile | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/sign-in");
          return;
        }
        const data = await res.json();
        setHousehold(data.household);

        const kids = data.household.kidProfiles || [];
        if (kids.length === 0) {
          router.push("/app/select-profile");
          return;
        }

        if (data.activeKid) {
          setActiveKid(data.activeKid);
        } else if (kids.length > 0) {
          // Select first kid automatically
          await fetch("/api/kids/select", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kidProfileId: kids[0].id }),
          });
          setActiveKid(kids[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const handleSignOut = async () => {
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="max-w-[1080px] mx-auto px-6 py-20 text-center">
        <p className="text-base font-bold text-[#6b8494]">Loading your learning space...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1080px] mx-auto px-6 py-8">
      {/* Top App Bar */}
      <div className="bg-white rounded-[24px] p-4 sm:p-5 border border-[#0f3a52]/10 shadow-sm flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#eff8ff] flex items-center justify-center text-2xl shadow-inner">
            {activeKid?.avatar || "🌟"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-[#0f3a52]">
                {activeKid?.displayName || "Explorer"}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#eff8ff] text-[#1fa7e1] text-[11px] font-black">
                Ages {activeKid?.ageBand || "8-11"}
              </span>
            </div>
            <p className="text-xs font-semibold text-[#6b8494]">
              {household?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/app/select-profile"
            className="px-4 py-2 rounded-full bg-[#eff8ff] text-[#1fa7e1] hover:bg-[#1fa7e1] hover:text-white font-black text-xs transition-colors"
          >
            Switch Profile 🔄
          </Link>

          <Link
            href="/app/parent"
            className="px-4 py-2 rounded-full border border-[#0f3a52]/15 text-[#0f3a52] hover:bg-slate-50 font-black text-xs transition-colors"
          >
            Parent View ⚙️
          </Link>

          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-full text-[#6b8494] hover:text-red-600 hover:bg-red-50 font-black text-xs transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Hero Welcome */}
      <div className="bg-[#0f3a52] text-white rounded-[28px] p-8 sm:p-12 mb-10 relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3.5 py-1 rounded-full bg-[#1fa7e1] text-white text-xs font-black uppercase tracking-wider mb-3">
            Self-directed learning
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Ready to dive in, {activeKid?.displayName}?
          </h1>
          <p className="text-sm sm:text-base text-slate-200 mt-2 font-semibold">
            Explore 1,500+ bite-sized lessons across History, Science, and Art. No tests, no pressure.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              href="/try-a-lesson"
              className="px-6 py-3 rounded-full bg-[#1fa7e1] hover:bg-[#0d7fb0] text-white font-black text-sm transition-colors shadow-md"
            >
              Continue Learning →
            </Link>
            <Link
              href="/app/select-profile"
              className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors"
            >
              Family Profiles
            </Link>
          </div>
        </div>
      </div>

      {/* Learning Subjects Grid */}
      <div className="mb-12">
        <h2 className="text-2xl font-black text-[#0f3a52] tracking-tight mb-6">
          Explore by Subject
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* History */}
          <Link
            href="/subjects/history"
            className="group bg-white rounded-[28px] p-6 border border-[#0f3a52]/10 shadow-sm hover:shadow-md hover:border-[#e0a322] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#eff8ff] flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                🏛️
              </div>
              <h3 className="text-lg font-black text-[#0f3a52] group-hover:text-[#e0a322] transition-colors">
                History
              </h3>
              <p className="text-xs font-semibold text-[#6b8494] mt-1 mb-4">
                Early Civilizations, Ancient Egypt, Roman Engineering, Explorers & Revolutions.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-black text-[#e0a322]">
              <span className="px-3 py-1 rounded-full bg-[#eff8ff]">
                Explore Units
              </span>
              <span>→</span>
            </div>
          </Link>

          {/* Science */}
          <Link
            href="/subjects/science"
            className="group bg-white rounded-[28px] p-6 border border-[#0f3a52]/10 shadow-sm hover:shadow-md hover:border-[#1fa7e1] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#eff8ff] flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                🧬
              </div>
              <h3 className="text-lg font-black text-[#0f3a52] group-hover:text-[#1fa7e1] transition-colors">
                Science
              </h3>
              <p className="text-xs font-semibold text-[#6b8494] mt-1 mb-4">
                Solar System, Deep Oceans, Photosynthesis, Genetics, Physics of flight.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-black text-[#1fa7e1]">
              <span className="px-3 py-1 rounded-full bg-[#eff8ff]">
                Explore Units
              </span>
              <span>→</span>
            </div>
          </Link>

          {/* Art */}
          <Link
            href="/subjects/art"
            className="group bg-white rounded-[28px] p-6 border border-[#0f3a52]/10 shadow-sm hover:shadow-md hover:border-[#3aaa4a] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#eff8ff] flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                🎨
              </div>
              <h3 className="text-lg font-black text-[#0f3a52] group-hover:text-[#3aaa4a] transition-colors">
                Art & Culture
              </h3>
              <p className="text-xs font-semibold text-[#6b8494] mt-1 mb-4">
                Color Theory, Renaissance Masters, Sculpture, World Architecture.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-black text-[#3aaa4a]">
              <span className="px-3 py-1 rounded-full bg-[#eff8ff]">
                Explore Units
              </span>
              <span>→</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Practice & Custom Lesson Affordances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/app/make-lesson"
          className="group bg-gradient-to-br from-[#eff8ff] to-white rounded-[28px] p-8 border border-[#1fa7e1]/20 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🪄</div>
            <h3 className="text-xl font-black text-[#0f3a52] group-hover:text-[#1fa7e1] transition-colors">
              Make Your Own Lesson
            </h3>
            <p className="text-xs font-bold text-[#6b8494] mt-1 mb-4">
              Got a curious question? Turn any wonder into a 6-step interactive AI adventure.
            </p>
          </div>
          <div className="flex items-center justify-between text-xs font-black text-[#1fa7e1] pt-3 border-t border-[#1fa7e1]/10">
            <span>⚡ {household?.customLessonAllowance ?? 75} custom lessons left</span>
            <span>Create Lesson →</span>
          </div>
        </Link>

        <Link
          href="/practice/math"
          className="group bg-gradient-to-br from-[#eff8ff] to-white rounded-[28px] p-8 border border-[#1fa7e1]/20 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🎯</div>
            <h3 className="text-xl font-black text-[#0f3a52] group-hover:text-[#1fa7e1] transition-colors">
              Math Practice Lab
            </h3>
            <p className="text-xs font-bold text-[#6b8494] mt-1 mb-4">
              Adaptive mental arithmetic (+ − × ÷), 60-second speed challenges & streak runs.
            </p>
          </div>
          <div className="flex items-center justify-between text-xs font-black text-[#1fa7e1] pt-3 border-t border-[#1fa7e1]/10">
            <span>Adaptive Levels 1–5</span>
            <span>Start Math →</span>
          </div>
        </Link>

        <Link
          href="/practice/typing"
          className="group bg-gradient-to-br from-[#eff8ff] to-white rounded-[28px] p-8 border border-[#1fa7e1]/20 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">⌨️</div>
            <h3 className="text-xl font-black text-[#0f3a52] group-hover:text-[#1fa7e1] transition-colors">
              Touch Typing Lab
            </h3>
            <p className="text-xs font-bold text-[#6b8494] mt-1 mb-4">
              Learn proper finger placement from home keys (J & F) to full words like pretzels.
            </p>
          </div>
          <div className="flex items-center justify-between text-xs font-black text-[#1fa7e1] pt-3 border-t border-[#1fa7e1]/10">
            <span>Stages 1–6</span>
            <span>Start Typing →</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
