"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface FinishedLesson {
  id: string;
  title: string;
  slug: string;
  subject: string;
  unitTitle: string;
  completedAt: string;
  quizScore?: number | null;
}

interface StuckPoint {
  type: "quiz_challenge" | "paused_lesson" | "repeated_practice";
  title: string;
  lessonSlug?: string;
  gentleInsight: string;
}

interface KidDashboardData {
  id: string;
  displayName: string;
  avatar: string;
  ageBand: string;
  finishedLessons: FinishedLesson[];
  inProgressLessons: Array<{ id: string; title: string; slug: string; subject: string; currentStepOrder: number }>;
  stuckPoints: StuckPoint[];
  practiceStats: {
    totalMathSessions: number;
    totalTypingSessions: number;
    highestWpm: number;
  };
  customLessons: Array<{ id: string; question: string; subject: string; createdAt: string }>;
}

interface ParentDashboardResponse {
  household: {
    id: string;
    name: string;
    region: string;
    subscription?: any;
  };
  allowance: {
    total: number;
    remaining: number;
    used: number;
    resetAt: string;
  };
  kids: KidDashboardData[];
}

export default function ParentDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ParentDashboardResponse | null>(null);
  const [selectedKidId, setSelectedKidId] = useState<string>("all");

  // Profile Management Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingKid, setEditingKid] = useState<KidDashboardData | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [avatarInput, setAvatarInput] = useState("🌟");
  const [ageBandInput, setAgeBandInput] = useState("8-11");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetch("/api/parent/dashboard");
      if (!res.ok) {
        if (res.status === 401) router.push("/sign-in");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Parent dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [router]);

  const handleSignOut = async () => {
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const handleCreateKid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setIsSavingProfile(true);

    try {
      const res = await fetch("/api/kids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: nameInput.trim(),
          avatar: avatarInput,
          ageBand: ageBandInput,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNameInput("");
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdateKid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKid || !nameInput.trim()) return;
    setIsSavingProfile(true);

    try {
      const res = await fetch(`/api/kids/${editingKid.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: nameInput.trim(),
          avatar: avatarInput,
          ageBand: ageBandInput,
        }),
      });

      if (res.ok) {
        setEditingKid(null);
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteKid = async (kidId: string) => {
    if (!confirm("Are you sure you want to remove this profile? Progress history will be removed.")) return;

    try {
      const res = await fetch(`/api/kids/${kidId}`, { method: "DELETE" });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1080px] mx-auto px-6 py-20 text-center">
        <p className="text-base font-bold text-[#6b8494]">Loading your calm parent dashboard...</p>
      </div>
    );
  }

  const kids = data?.kids || [];
  const filteredKids = selectedKidId === "all" ? kids : kids.filter((k) => k.id === selectedKidId);

  // Aggregated totals
  let totalFinishedCount = 0;
  let allStuckPoints: Array<{ kidName: string; kidAvatar: string; stuck: StuckPoint }> = [];

  for (const k of filteredKids) {
    totalFinishedCount += k.finishedLessons.length;
    for (const s of k.stuckPoints) {
      allStuckPoints.push({ kidName: k.displayName, kidAvatar: k.avatar, stuck: s });
    }
  }

  const allowanceUsed = data?.allowance?.used ?? 0;
  const allowanceRemaining = data?.allowance?.remaining ?? 75;
  const resetDate = data?.allowance?.resetAt
    ? new Date(data.allowance.resetAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "Next cycle";

  return (
    <div className="max-w-[1080px] mx-auto px-6 py-10">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#1fa7e1] block mb-1">
            Parent & Guardian Sanctuary
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0f3a52] tracking-tight">
            {data?.household?.name || "Family Overview"}
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#6b8494] mt-0.5">
            A calm, informative window into what your children are discovering. No pressure, no letter grades.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/app/parent/billing"
            className="px-4 py-2.5 rounded-full border border-[#0f3a52]/15 text-[#0f3a52] hover:bg-slate-50 font-black text-xs transition-colors cursor-pointer"
          >
            💳 Billing & Plan
          </Link>
          <Link
            href="/app"
            className="px-5 py-2.5 rounded-full bg-[#1fa7e1] text-white hover:bg-[#0d7fb0] font-black text-xs transition-colors shadow-sm cursor-pointer"
          >
            ← Kid Learning Space
          </Link>
          <button
            onClick={handleSignOut}
            className="px-4 py-2.5 rounded-full border border-[#0f3a52]/15 text-[#6b8494] hover:text-red-600 hover:bg-red-50 font-black text-xs transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Top 3 Summary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Card 1: Finished Lessons */}
        <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-[#0f3a52]/10 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#6b8494]">
                Finished Work
              </span>
              <span className="text-2xl">🌱</span>
            </div>
            <p className="text-4xl font-black text-[#0f3a52] mb-1">
              {totalFinishedCount}
            </p>
            <p className="text-xs font-semibold text-[#6b8494] leading-relaxed">
              Total lessons explored start-to-finish across all 6 steps.
            </p>
          </div>
          <div className="pt-4 border-t border-[#0f3a52]/5 text-xs font-bold text-[#1fa7e1]">
            Self-directed curiosity ✓
          </div>
        </div>

        {/* Card 2: Custom Lesson Allowance Tracker */}
        <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-[#0f3a52]/10 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#6b8494]">
                AI Lesson Allowance
              </span>
              <span className="text-2xl">🪄</span>
            </div>
            <p className="text-4xl font-black text-[#1fa7e1] mb-1">
              {allowanceRemaining} <span className="text-base text-[#6b8494] font-bold">/ 75 left</span>
            </p>
            <p className="text-xs font-semibold text-[#6b8494] leading-relaxed">
              {allowanceUsed} of 75 used this cycle. Resets on <strong>{resetDate}</strong>.
            </p>
          </div>
          <div className="pt-4 border-t border-[#0f3a52]/5">
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-[#1fa7e1] rounded-full transition-all"
                style={{ width: `${Math.min(100, (allowanceUsed / 75) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Subscription & Region */}
        <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-[#0f3a52]/10 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#6b8494]">
                Household Plan
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-black">
                Active Member
              </span>
            </div>
            <p className="text-2xl font-black text-[#0f3a52] mb-1">
              {data?.household?.region === "IN" ? "₹7,999 / year" : "$99 / year"}
            </p>
            <p className="text-xs font-semibold text-[#6b8494] leading-relaxed">
              Full unlimited access for all family profiles. Descriptor: <strong>ZEROTO1</strong>.
            </p>
          </div>
          <div className="pt-4 border-t border-[#0f3a52]/5">
            <Link href="/pricing" className="text-xs font-black text-[#1fa7e1] hover:underline">
              Manage billing & receipts →
            </Link>
          </div>
        </div>
      </div>

      {/* Kid Profile Selector & Management */}
      <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#0f3a52]/10 shadow-sm mb-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-[#0f3a52]">Child Profiles</h2>
            <p className="text-xs font-semibold text-[#6b8494] mt-0.5">
              Select a child to view their personalized learning path, or add/edit family profiles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setNameInput("");
                setAvatarInput("🌟");
                setAgeBandInput("8-11");
                setShowAddModal(true);
              }}
              className="px-4 py-2 rounded-full bg-[#eff8ff] hover:bg-[#1fa7e1] text-[#1fa7e1] hover:text-white font-black text-xs transition-colors cursor-pointer"
            >
              + Add Child Profile
            </button>
          </div>
        </div>

        {/* Profile Filter Pills */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setSelectedKidId("all")}
            className={`px-4 py-2 rounded-full font-black text-xs transition-all cursor-pointer ${
              selectedKidId === "all"
                ? "bg-[#0f3a52] text-white shadow-xs"
                : "bg-slate-100 text-[#6b8494] hover:bg-slate-200"
            }`}
          >
            All Children ({kids.length})
          </button>

          {kids.map((kid) => (
            <div key={kid.id} className="inline-flex items-center rounded-full bg-slate-100 p-1">
              <button
                onClick={() => setSelectedKidId(kid.id)}
                className={`px-3 py-1 rounded-full font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedKidId === kid.id
                    ? "bg-[#1fa7e1] text-white shadow-xs"
                    : "text-[#0f3a52] hover:text-[#1fa7e1]"
                }`}
              >
                <span>{kid.avatar}</span>
                <span>{kid.displayName}</span>
                <span className="text-[10px] opacity-75">({kid.ageBand})</span>
              </button>

              <button
                title="Edit profile"
                onClick={() => {
                  setEditingKid(kid);
                  setNameInput(kid.displayName);
                  setAvatarInput(kid.avatar);
                  setAgeBandInput(kid.ageBand);
                }}
                className="px-2 text-xs text-[#6b8494] hover:text-[#0f3a52] cursor-pointer"
              >
                ✏️
              </button>

              <button
                title="Delete profile"
                onClick={() => handleDeleteKid(kid.id)}
                className="pr-2 text-xs text-[#6b8494] hover:text-red-600 cursor-pointer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Gentle Stuck Points Section */}
      <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#0f3a52]/10 shadow-sm mb-10">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="text-2xl">💡</span>
          <h2 className="text-xl font-black text-[#0f3a52]">
            Gentle Curiosity Insights &amp; Stuck Points
          </h2>
        </div>
        <p className="text-xs font-semibold text-[#6b8494] mb-6">
          Where a child encountered a tricky concept or paused an activity. We share these to spark conversation, never for grading.
        </p>

        {allStuckPoints.length === 0 ? (
          <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-center">
            <span className="text-2xl block mb-1">🌈</span>
            <p className="text-sm font-black text-emerald-900">
              Smooth sailing! No friction or stuck points observed.
            </p>
            <p className="text-xs font-semibold text-emerald-700 mt-1">
              Your children are exploring topics at their own natural pace.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {allStuckPoints.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#fff8f0] border border-[#ffb356]/40 flex items-start gap-4"
              >
                <span className="text-2xl shrink-0 mt-0.5">🌱</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-white text-[#0f3a52] text-[10px] font-black border border-[#ffb356]/30">
                      {item.kidAvatar} {item.kidName}
                    </span>
                    <h4 className="text-xs font-black text-[#0f3a52]">
                      {item.stuck.title}
                    </h4>
                  </div>
                  <p className="text-xs font-semibold text-[#6b8494] leading-relaxed">
                    {item.stuck.gentleInsight}
                  </p>
                </div>
                {item.stuck.lessonSlug && (
                  <Link
                    href={`/lessons/${item.stuck.lessonSlug}`}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#1fa7e1] text-[#1fa7e1] hover:text-white text-xs font-black transition-colors shrink-0 shadow-xs border border-[#1fa7e1]/20"
                  >
                    View Topic →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Finished Lessons & Practice History Per Kid */}
      <div className="space-y-8">
        {filteredKids.map((kid) => (
          <div key={kid.id} className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#0f3a52]/10 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#0f3a52]/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#eff8ff] flex items-center justify-center text-2xl shadow-inner">
                  {kid.avatar}
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0f3a52]">
                    {kid.displayName}&apos;s Exploration Record
                  </h3>
                  <p className="text-xs font-semibold text-[#6b8494]">
                    Ages {kid.ageBand} • {kid.finishedLessons.length} finished lessons • {kid.customLessons.length} custom AI lessons
                  </p>
                </div>
              </div>

              {/* Mini Practice Badges */}
              <div className="flex items-center gap-2 text-xs font-black">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">
                  🎯 {kid.practiceStats.totalMathSessions} Math Sessions
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700">
                  ⌨️ {kid.practiceStats.totalTypingSessions} Typing (Best: {kid.practiceStats.highestWpm} WPM)
                </span>
              </div>
            </div>

            {/* Finished Lessons Grid */}
            <div className="mb-6">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#6b8494] mb-3">
                Completed Lessons ({kid.finishedLessons.length})
              </h4>
              {kid.finishedLessons.length === 0 ? (
                <p className="text-xs font-semibold text-[#6b8494] py-3 italic">
                  No completed lessons recorded yet for this profile.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {kid.finishedLessons.map((l) => (
                    <div
                      key={l.id}
                      className="p-3.5 rounded-2xl bg-[#eff8ff]/50 border border-[#1fa7e1]/15 flex items-center justify-between"
                    >
                      <div>
                        <span className="px-2 py-0.5 rounded-full bg-white text-[#1fa7e1] text-[10px] font-black uppercase">
                          {l.subject}
                        </span>
                        <h5 className="text-xs font-black text-[#0f3a52] mt-1 leading-snug">
                          {l.title}
                        </h5>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 shrink-0">
                        ✓ Done
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Custom Lessons Asked by this Kid */}
            {kid.customLessons.length > 0 && (
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-[#6b8494] mb-3">
                  AI Custom Curiosities Asked ({kid.customLessons.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {kid.customLessons.map((cl) => (
                    <div
                      key={cl.id}
                      className="p-3.5 rounded-2xl bg-[#fff8f0] border border-[#ffb356]/20 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-black text-[#e0a322] uppercase">
                          🪄 {cl.subject}
                        </span>
                        <h5 className="text-xs font-bold text-[#0f3a52] mt-0.5">
                          &ldquo;{cl.question}&rdquo;
                        </h5>
                      </div>
                      <Link
                        href={`/custom-lessons/${cl.id}/play`}
                        className="px-2.5 py-1 rounded-lg bg-white text-[#1fa7e1] text-[11px] font-black shadow-xs hover:bg-[#1fa7e1] hover:text-white transition-colors"
                      >
                        Play →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ADD / EDIT KID MODAL */}
      {(showAddModal || editingKid) && (
        <div className="fixed inset-0 z-50 bg-[#0f3a52]/40 backdrop-blur-xs flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[28px] p-8 border border-[#0f3a52]/10 shadow-2xl max-w-md w-full">
            <h3 className="text-xl font-black text-[#0f3a52] mb-1">
              {editingKid ? "Edit Child Profile" : "Add Child Profile"}
            </h3>
            <p className="text-xs font-semibold text-[#6b8494] mb-6">
              Kids use a profile picker to enter their space—no passwords needed.
            </p>

            <form onSubmit={editingKid ? handleUpdateKid : handleCreateKid} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#0f3a52] mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Leo, Maya, Sam"
                  className="w-full px-4 py-3 rounded-xl border border-[#0f3a52]/15 text-sm font-bold text-[#0f3a52] focus:outline-none focus:border-[#1fa7e1]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#0f3a52] mb-1.5">
                  Choose Avatar Emoji
                </label>
                <div className="flex gap-2">
                  {["🌟", "🐬", "🚀", "🎨", "🦁", "🦖", "⚡"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatarInput(emoji)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                        avatarInput === emoji
                          ? "bg-[#1fa7e1] text-white shadow-sm scale-110"
                          : "bg-slate-100 hover:bg-slate-200"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#0f3a52] mb-1.5">
                  Age Band (Curiosity Level)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["5-8", "8-11", "11-15"].map((band) => (
                    <button
                      key={band}
                      type="button"
                      onClick={() => setAgeBandInput(band)}
                      className={`py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                        ageBandInput === band
                          ? "bg-[#0f3a52] text-white"
                          : "bg-slate-100 text-[#6b8494] hover:bg-slate-200"
                      }`}
                    >
                      Ages {band}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isSavingProfile || !nameInput.trim()}
                  className="flex-1 py-3.5 rounded-xl bg-[#1fa7e1] hover:bg-[#0d7fb0] text-white font-black text-xs transition-all shadow-md shadow-[#1fa7e1]/25 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingProfile ? "Saving..." : editingKid ? "Save Changes" : "Create Profile"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingKid(null);
                  }}
                  className="px-5 py-3.5 rounded-xl border border-[#0f3a52]/15 text-[#6b8494] font-black text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
