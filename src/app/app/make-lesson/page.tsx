"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

interface AllowanceData {
  remaining: number;
  resetAt: string;
  canGenerate: boolean;
}

interface CustomLessonSummary {
  id: string;
  question: string;
  subject: string;
  ageBand: string;
  createdAt: string;
}

const EXAMPLE_SUGGESTIONS = [
  "How do blue whales talk across the ocean?",
  "Why do stars twinkle at night?",
  "How did the ancient Egyptians build the pyramids?",
  "Why do chameleons change colors?",
  "How do giant airplanes stay up in the air?",
  "What causes earthquakes and glowing volcanoes?",
];

const PROGRESS_STAGES = [
  { step: 1, text: "🧠 Thinking about your big question..." },
  { step: 2, text: "🛡️ Running kid-safety guardrails..." },
  { step: 3, text: "🔬 Gathering stories, experiments & videos..." },
  { step: 4, text: "🚀 Assembling your 6-step interactive adventure!" },
];

function MakeLessonContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const [question, setQuestion] = useState(initialQ);
  const [allowance, setAllowance] = useState<AllowanceData | null>(null);
  const [loadingAllowance, setLoadingAllowance] = useState(true);
  const [myLessons, setMyLessons] = useState<CustomLessonSummary[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [blockedResult, setBlockedResult] = useState<{ reason: string; suggestions: string[] } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [allowanceRes, meRes] = await Promise.all([
          fetch("/api/ai/allowance"),
          fetch("/api/auth/me"),
        ]);

        if (allowanceRes.ok) {
          const json = await allowanceRes.json();
          setAllowance(json.data);
        }

        if (!meRes.ok) {
          // If not signed in, redirect to sign in
          router.push("/sign-in?from=/app/make-lesson");
          return;
        }

        // Fetch recent custom lessons
        const customRes = await fetch("/api/kids/custom-lessons");
        if (customRes.ok) {
          const data = await customRes.json();
          setMyLessons(data.lessons || []);
        }
      } catch (err) {
        console.error("Error loading allowance:", err);
      } finally {
        setLoadingAllowance(false);
      }
    }

    loadData();
  }, [router]);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = question.trim();
    if (!query || isGenerating) return;

    if (allowance && allowance.remaining <= 0) {
      setErrorMsg("You have used all 75 custom lessons for this 30-day period.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setBlockedResult(null);
    setCurrentStage(0);

    // Progress animation timers
    const timer1 = setTimeout(() => setCurrentStage(1), 1200);
    const timer2 = setTimeout(() => setCurrentStage(2), 2600);
    const timer3 = setTimeout(() => setCurrentStage(3), 4200);

    try {
      const res = await fetch("/api/lessons/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      const data = await res.json();

      if (data.status === "BLOCKED") {
        setIsGenerating(false);
        setBlockedResult({
          reason: data.reason,
          suggestions: data.safeRedirectSuggestions || EXAMPLE_SUGGESTIONS.slice(0, 3),
        });
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to generate lesson");
      }

      // Success! Update allowance and navigate to play page
      if (typeof data.remainingAllowance === "number" && allowance) {
        setAllowance({
          ...allowance,
          remaining: data.remainingAllowance,
          canGenerate: data.remainingAllowance > 0,
        });
      }

      // Open in unified player
      router.push(`/custom-lessons/${data.customLessonId}/play`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Generation failed. Please try again.";
      setErrorMsg(msg);
      setIsGenerating(false);
    }
  };

  const remainingCount = allowance ? allowance.remaining : 75;
  const isExhausted = allowance ? allowance.remaining <= 0 : false;

  return (
    <div className="max-w-[1080px] mx-auto px-6 py-8">
      {/* Header Breadcrumb */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/app"
          className="text-xs font-black text-[#1fa7e1] hover:underline flex items-center gap-1.5"
        >
          ← Back to Dashboard
        </Link>

        {/* Live Allowance Badge */}
        <div className="flex items-center gap-2">
          {loadingAllowance ? (
            <span className="text-xs font-bold text-[#6b8494]">Checking allowance...</span>
          ) : (
            <div
              className={`px-4 py-1.5 rounded-full text-xs font-black border flex items-center gap-2 ${
                isExhausted
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-[#eff8ff] text-[#1fa7e1] border-[#1fa7e1]/20 shadow-xs"
              }`}
            >
              <span>⚡</span>
              <span>
                <strong>{remainingCount}</strong> of 75 custom lessons left this month
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Generator Card */}
      <div className="bg-white rounded-[28px] p-6 sm:p-12 border border-[#0f3a52]/10 shadow-xl mb-12 relative overflow-hidden">
        <div className="max-w-2xl mx-auto text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#eff8ff] text-[#1fa7e1] text-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            🪄
          </div>
          <span className="px-3.5 py-1 rounded-full bg-[#fff8f0] text-[#e0a322] text-xs font-black uppercase tracking-wider inline-block mb-2 border border-[#ffb356]/30">
            AI Lesson Maker
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0f3a52] tracking-tight">
            What are you curious about today?
          </h1>
          <p className="text-sm font-semibold text-[#6b8494] mt-2">
            Ask any question. Our AI pedagogical engine will weave it into a complete, kid-safe 6-step interactive adventure!
          </p>
        </div>

        {/* Exhausted Allowance Alert */}
        {isExhausted && (
          <div className="max-w-xl mx-auto mb-8 p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-center">
            <span className="text-2xl block mb-1">⏳</span>
            <h3 className="text-sm font-black text-amber-900 mb-1">
              Monthly Custom Lesson Allowance Reached
            </h3>
            <p className="text-xs font-semibold text-amber-800 mb-3">
              You&apos;ve used all 75 custom lessons for this 30-day period. Your allowance resets on{" "}
              {allowance?.resetAt ? new Date(allowance.resetAt).toLocaleDateString() : "next billing cycle"}.
            </p>
            <Link
              href="/pricing"
              className="inline-block px-5 py-2 rounded-full bg-[#1fa7e1] text-white font-black text-xs hover:bg-[#0d7fb0] transition-colors shadow-sm"
            >
              Explore Family Plans →
            </Link>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleGenerate} className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              value={question}
              disabled={isGenerating || isExhausted}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. How do whales talk across the ocean?"
              className="w-full px-5 py-4 sm:py-5 pr-32 rounded-2xl bg-[#eff8ff]/40 border-2 border-[#1fa7e1]/30 text-base font-bold text-[#0f3a52] placeholder:text-[#6b8494]/60 focus:outline-none focus:border-[#1fa7e1] focus:bg-white transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isGenerating || isExhausted || !question.trim()}
              className="absolute right-2.5 top-2.5 bottom-2.5 px-6 rounded-xl bg-[#1fa7e1] hover:bg-[#0d7fb0] text-white font-black text-sm transition-all shadow-md shadow-[#1fa7e1]/25 hover:scale-105 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin">🌀</span>
                  <span>Making...</span>
                </>
              ) : (
                <>
                  <span>Create 🚀</span>
                </>
              )}
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs font-bold text-red-600 mt-2 text-center">
              ⚠️ {errorMsg}
            </p>
          )}
        </form>

        {/* Friendly Async Generation Progress UI */}
        {isGenerating && (
          <div className="max-w-md mx-auto mb-8 p-6 rounded-2xl bg-[#eff8ff] border border-[#1fa7e1]/20 text-center animate-pulse">
            <span className="text-3xl block mb-3 animate-bounce">⚡</span>
            <h3 className="text-sm font-black text-[#0f3a52] mb-3">
              Crafting Your Custom Lesson...
            </h3>
            <div className="space-y-2 text-left">
              {PROGRESS_STAGES.map((s, idx) => (
                <div
                  key={s.step}
                  className={`flex items-center gap-2.5 text-xs font-bold transition-all ${
                    idx <= currentStage ? "text-[#0f3a52] font-black" : "text-[#6b8494]/50"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-white border border-[#1fa7e1]/30">
                    {idx < currentStage ? "✓" : idx === currentStage ? "•" : "○"}
                  </span>
                  <span>{s.text}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] font-semibold text-[#6b8494] mt-4">
              Usually takes under 15 seconds. Please don&apos;t close this page.
            </p>
          </div>
        )}

        {/* Blocked Guardrail Safe Redirect Card */}
        {blockedResult && (
          <div className="max-w-xl mx-auto mb-8 p-6 rounded-2xl bg-[#fff8f0] border-2 border-[#ffb356]/50 text-center animate-fadeIn">
            <span className="text-3xl block mb-2">🌱</span>
            <h3 className="text-sm font-black text-[#0f3a52] mb-1">
              Let&apos;s Explore Something Wonderfully Inspiring!
            </h3>
            <p className="text-xs font-semibold text-[#6b8494] mb-4">
              {blockedResult.reason}
            </p>

            <div className="text-left mb-4">
              <span className="text-[11px] font-black text-[#e0a322] uppercase tracking-wider block mb-2 text-center">
                ✨ Curious Ideas You Might Love:
              </span>
              <div className="space-y-2">
                {blockedResult.suggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuestion(sug);
                      setBlockedResult(null);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-white border border-[#0f3a52]/10 hover:border-[#1fa7e1] text-xs font-bold text-[#0f3a52] hover:text-[#1fa7e1] transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span>&ldquo;{sug}&rdquo;</span>
                    <span>→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Example Suggestions Chips */}
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs font-black text-[#6b8494] uppercase tracking-wider block mb-3">
            💡 Or click an idea to get started:
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_SUGGESTIONS.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isGenerating || isExhausted}
                onClick={() => setQuestion(sug)}
                className="px-3.5 py-1.5 rounded-full bg-[#eff8ff] hover:bg-[#1fa7e1] text-[#0f3a52] hover:text-white font-bold text-xs transition-colors border border-[#1fa7e1]/20 cursor-pointer disabled:opacity-50"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kid's Custom Lessons Library */}
      {myLessons.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-[#0f3a52] tracking-tight">
              My Created Lessons ({myLessons.length})
            </h2>
            <span className="text-xs font-bold text-[#6b8494]">
              Re-asking any question opens your saved lesson instantly!
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myLessons.map((les) => (
              <div
                key={les.id}
                className="bg-white rounded-[24px] p-6 border border-[#0f3a52]/10 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#eff8ff] text-[#1fa7e1] text-[10px] font-black uppercase tracking-wider">
                      {les.subject}
                    </span>
                    <span className="text-[11px] font-bold text-[#6b8494]">
                      Ages {les.ageBand}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-[#0f3a52] mb-2 leading-snug">
                    {les.question}
                  </h3>
                </div>

                <div className="pt-4 mt-2 border-t border-[#0f3a52]/5 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#6b8494]">
                    6 Steps • Interactive
                  </span>
                  <Link
                    href={`/custom-lessons/${les.id}/play`}
                    className="px-4 py-1.5 rounded-full bg-[#1fa7e1] text-white hover:bg-[#0d7fb0] text-xs font-black transition-colors"
                  >
                    Play →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MakeLessonPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm font-bold text-[#6b8494]">Loading lesson maker...</div>}>
      <MakeLessonContent />
    </Suspense>
  );
}
