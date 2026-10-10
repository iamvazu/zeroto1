"use client";

import Link from "next/link";
import { useState } from "react";

interface DeepDiveStepProps {
  content: string; // JSON string
  lessonTitle: string;
  unitSlug: string;
  subjectSlug: string;
  isGuestPreview?: boolean;
  onComplete: () => void;
}

interface DeepDiveLiveResult {
  followUpPrompts: string[];
  deeperFact: string;
  relatedTopics: string[];
}

export default function DeepDiveStep({
  content,
  lessonTitle,
  unitSlug,
  subjectSlug,
  isGuestPreview,
  onComplete,
}: DeepDiveStepProps) {
  let initialFollowUps: string[] = [];
  try {
    const parsed = JSON.parse(content);
    initialFollowUps = parsed.followUps || [];
  } catch {
    initialFollowUps = [];
  }

  if (initialFollowUps.length === 0) {
    initialFollowUps = [
      "What surprised you the most about this topic?",
      "If you could ask an expert one question right now, what would it be?",
      "Can you find an example of this concept around your home or neighborhood?",
    ];
  }

  const [followUps, setFollowUps] = useState<string[]>(initialFollowUps);
  const [kidQuestion, setKidQuestion] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [liveResult, setLiveResult] = useState<DeepDiveLiveResult | null>(null);
  const [isCompletedState, setIsCompletedState] = useState(false);

  const handleAskDeepDive = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!kidQuestion.trim() && !lessonTitle) return;

    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/deep-dive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonTopic: lessonTitle,
          kidCuriosity: kidQuestion.trim() || undefined,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setLiveResult(json.data);
          if (json.data.followUpPrompts?.length > 0) {
            setFollowUps(json.data.followUpPrompts);
          }
        }
      }
    } catch (err) {
      console.error("Deep Dive fetch error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinish = () => {
    setIsCompletedState(true);
    onComplete();
  };

  if (isCompletedState) {
    return (
      <div className="bg-white rounded-[28px] p-8 sm:p-14 border border-[#0f3a52]/10 shadow-2xl text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 text-4xl flex items-center justify-center mx-auto mb-6 shadow-md animate-bounce">
          🎉
        </div>

        <span className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider inline-block mb-3 border border-emerald-200">
          {isGuestPreview ? "Free Preview Completed!" : "Lesson Completed!"}
        </span>

        <h2 className="text-3xl sm:text-4xl font-black text-[#0f3a52] tracking-tight mb-3">
          Way to go, curious thinker!
        </h2>

        <p className="text-sm font-semibold text-[#6b8494] max-w-md mx-auto mb-8">
          {isGuestPreview
            ? `You completed the free preview of "${lessonTitle}". Unlock all 1,500+ lessons across History, Science, and Art with a free family trial!`
            : `You completed all 6 steps of "${lessonTitle}". Your progress is saved to your family account.`}
        </p>

        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#eff8ff] mb-8 text-center">
          <div>
            <span className="text-lg font-black text-[#0f3a52] block">6 of 6</span>
            <span className="text-[11px] font-bold text-[#6b8494]">Steps Finished</span>
          </div>
          <div>
            <span className="text-lg font-black text-[#1fa7e1] block">100%</span>
            <span className="text-[11px] font-bold text-[#6b8494]">Explored</span>
          </div>
          <div>
            <span className="text-lg font-black text-emerald-600 block">
              {isGuestPreview ? "Free Preview" : "✓ Saved"}
            </span>
            <span className="text-[11px] font-bold text-[#6b8494]">
              {isGuestPreview ? "Completed" : "To Profile"}
            </span>
          </div>
        </div>

        {/* Upgrade Paywall CTA if Guest Preview */}
        {isGuestPreview ? (
          <div className="p-6 rounded-2xl bg-[#fff8f0] border-2 border-[#ffb356]/40 mb-8 text-center">
            <h3 className="text-base font-black text-[#0f3a52] mb-1.5">
              Ready to unlock all 1,500+ lessons?
            </h3>
            <p className="text-xs font-semibold text-[#6b8494] mb-4">
              Get unlimited access for the whole family, custom AI lessons, and math/typing labs.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex px-8 py-3.5 rounded-full bg-[#1fa7e1] hover:bg-[#0d7fb0] text-white font-black text-sm transition-all shadow-md shadow-[#1fa7e1]/25 hover:scale-105"
            >
              Start Free Trial →
            </Link>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href={`/subjects/${subjectSlug}/${unitSlug}`}
            className="px-6 py-3.5 rounded-full bg-[#0f3a52] hover:bg-[#1fa7e1] text-white font-black text-xs transition-colors shadow-sm"
          >
            ← Return to Unit
          </Link>
          <Link
            href="/subjects"
            className="px-6 py-3.5 rounded-full bg-[#1fa7e1] hover:bg-[#0d7fb0] text-white font-black text-xs transition-colors shadow-md shadow-[#1fa7e1]/25"
          >
            Explore Next Topic →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[28px] p-6 sm:p-12 border border-[#0f3a52]/10 shadow-lg max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <span className="px-3.5 py-1 rounded-full bg-[#eff8ff] text-[#1fa7e1] text-xs font-black uppercase tracking-wider inline-block mb-3">
          Step 6 • Deep Dive
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-[#0f3a52] tracking-tight">
          Keep Your Curiosity Going
        </h2>
        <p className="text-sm font-semibold text-[#6b8494] mt-2 max-w-lg mx-auto">
          Learning never truly ends. Ponder these big questions, or ask the AI to dig into what you are curious about!
        </p>
      </div>

      {/* Interactive Kid Curiosity Input for Live Deep Dive */}
      <form onSubmit={handleAskDeepDive} className="mb-8 p-5 rounded-2xl bg-[#eff8ff]/50 border border-[#1fa7e1]/20">
        <label htmlFor="kidQuestionInput" className="block text-xs font-black uppercase tracking-wider text-[#0f3a52] mb-2">
          ✨ What are you wondering about &ldquo;{lessonTitle}&rdquo;?
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="kidQuestionInput"
            type="text"
            value={kidQuestion}
            onChange={(e) => setKidQuestion(e.target.value)}
            placeholder="e.g. Why does this happen? Tell me something wild!"
            className="flex-1 px-4 py-3 rounded-xl bg-white border border-[#0f3a52]/15 text-sm font-semibold text-[#0f3a52] focus:outline-none focus:border-[#1fa7e1]"
          />
          <button
            type="submit"
            disabled={isGenerating}
            className="px-6 py-3 rounded-xl bg-[#1fa7e1] hover:bg-[#0d7fb0] text-white font-black text-xs transition-all shadow-sm shrink-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <span className="animate-spin text-sm">🌀</span>
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <span>Explore Deep Dive ✨</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Mind-Blowing Deeper Fact if Generated */}
      {liveResult?.deeperFact && (
        <div className="p-6 rounded-2xl bg-[#fff8f0] border-2 border-[#ffb356]/40 mb-8 animate-fadeIn">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-2xl">🔍</span>
            <h4 className="text-sm font-black text-[#0f3a52]">Mind-Blowing Discovery</h4>
          </div>
          <p className="text-sm font-bold text-[#0f3a52] leading-relaxed">
            {liveResult.deeperFact}
          </p>
          {liveResult.relatedTopics?.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#ffb356]/20 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black text-[#6b8494] uppercase tracking-wider">Related:</span>
              {liveResult.relatedTopics.map((topic, i) => (
                <Link
                  key={i}
                  href={`/app/make-lesson?q=${encodeURIComponent(topic)}`}
                  className="px-2.5 py-1 rounded-full bg-white text-[#1fa7e1] hover:bg-[#1fa7e1] hover:text-white font-black text-[11px] transition-colors border border-[#1fa7e1]/20"
                >
                  {topic} ↗
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Follow Up Exploration Prompts */}
      <div className="space-y-4 mb-8">
        <h4 className="text-xs font-black uppercase tracking-wider text-[#6b8494]">
          {liveResult ? "Custom Deep Dive Questions" : "Questions to Ponder"}
        </h4>
        {followUps.map((prompt, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-[#eff8ff]/60 border border-[#1fa7e1]/20 flex items-start gap-3.5 hover:bg-[#eff8ff] transition-colors"
          >
            <span className="w-8 h-8 rounded-xl bg-white text-[#1fa7e1] font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
              {idx + 1}
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#0f3a52] pt-1 leading-relaxed">
                {prompt}
              </p>
            </div>
            <Link
              href={`/app/make-lesson?q=${encodeURIComponent(prompt)}`}
              title="Turn into a full lesson"
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#1fa7e1] text-[#1fa7e1] hover:text-white text-[11px] font-black transition-colors shrink-0 shadow-xs border border-[#1fa7e1]/20"
            >
              Make Lesson →
            </Link>
          </div>
        ))}
      </div>

      <div className="p-5 rounded-2xl bg-[#fff8f0] border border-[#ffb356]/30 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-[#e0a322] mb-0.5">
            Turn Any Wonder Into a Full Lesson
          </h4>
          <p className="text-xs font-semibold text-[#0f3a52]">
            Use your monthly allowance to generate a 6-step interactive learning adventure on ANY topic.
          </p>
        </div>
        <Link
          href={`/app/make-lesson?q=${encodeURIComponent(kidQuestion || lessonTitle)}`}
          className="px-4 py-2.5 rounded-full bg-[#1fa7e1] hover:bg-[#0d7fb0] text-xs font-black text-white transition-colors shrink-0 shadow-sm"
        >
          Create Full Lesson 🚀
        </Link>
      </div>

      <div className="pt-6 border-t border-[#0f3a52]/10 flex justify-center">
        <button
          onClick={handleFinish}
          className="px-10 py-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm transition-all shadow-lg shadow-emerald-600/25 hover:scale-105 cursor-pointer flex items-center gap-2"
        >
          <span>Complete Lesson 🎉</span>
        </button>
      </div>
    </div>
  );
}
