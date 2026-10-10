"use client";

import Link from "next/link";
import { useState } from "react";
import HookStep from "./HookStep";
import VideoStep from "./VideoStep";
import ReadStep from "./ReadStep";
import ActivityStep from "./ActivityStep";
import PracticeStep from "./PracticeStep";
import DeepDiveStep from "./DeepDiveStep";

export interface StepData {
  id: string;
  stepType: string;
  stepOrder: number;
  content: string;
}

export interface LessonPlayerData {
  id: string;
  slug: string;
  title: string;
  bigQuestion: string;
  unit: {
    slug: string;
    title: string;
    subject: {
      slug: string;
      name: string;
    };
  };
  steps: StepData[];
}

interface LessonPlayerProps {
  lesson: LessonPlayerData;
  initialStepOrder: number;
  completedStepsList: number[];
  activeKidName?: string | null;
  activeKidAvatar?: string | null;
  isGuestPreview?: boolean;
}

const STEP_METADATA = [
  { order: 1, type: "HOOK", label: "Hook", icon: "💡" },
  { order: 2, type: "VIDEO", label: "Video", icon: "🎬" },
  { order: 3, type: "READ", label: "Read", icon: "📖" },
  { order: 4, type: "ACTIVITY", label: "Activity", icon: "✨" },
  { order: 5, type: "PRACTICE", label: "Practice", icon: "🎯" },
  { order: 6, type: "DEEP_DIVE", label: "Deep Dive", icon: "🚀" },
];

export default function LessonPlayer({
  lesson,
  initialStepOrder,
  completedStepsList: initialCompleted,
  activeKidName,
  activeKidAvatar,
  isGuestPreview,
}: LessonPlayerProps) {
  // Current active step (1 to 6)
  const [currentStep, setCurrentStep] = useState(
    Math.min(6, Math.max(1, initialStepOrder))
  );
  const [completedSteps, setCompletedSteps] = useState<number[]>(initialCompleted);
  const [saving, setSaving] = useState(false);

  // Find step data by stepOrder (fixed 1..6 order)
  const currentStepData = lesson.steps.find((s) => s.stepOrder === currentStep);

  const saveProgress = async (completedStepNum: number, nextStepNum: number, quizScore?: number) => {
    setSaving(true);
    try {
      await fetch(`/api/player/${lesson.slug}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedStepOrder: completedStepNum,
          nextStepOrder: nextStepNum,
          quizScore,
        }),
      });
    } catch (err) {
      console.error("Failed to save step progress:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleStepComplete = async (quizScore?: number) => {
    const nextStep = Math.min(6, currentStep + 1);
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }
    await saveProgress(currentStep, nextStep, quizScore);
    if (currentStep < 6) {
      setCurrentStep(nextStep);
    }
  };

  const handleStepSelect = (order: number) => {
    // Can jump to any step that is completed or the current/next step
    if (completedSteps.includes(order) || order <= currentStep) {
      setCurrentStep(order);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f0] pb-20">
      {/* Top Player Sticky Header */}
      <div className="sticky top-0 z-40 bg-[#fff8f0]/95 backdrop-blur-md border-b border-[#0f3a52]/10 py-3.5 px-6">
        <div className="max-w-[1080px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/subjects/${lesson.unit.subject.slug}/${lesson.unit.slug}`}
              className="px-3.5 py-1.5 rounded-full border border-[#0f3a52]/15 text-[#0f3a52] hover:bg-white text-xs font-black transition-colors"
            >
              ← Exit
            </Link>
            <div>
              <h1 className="text-sm font-black text-[#0f3a52] line-clamp-1">
                {lesson.title}
              </h1>
              <p className="text-[11px] font-semibold text-[#6b8494]">
                {lesson.unit.subject.name} • {lesson.unit.title}
              </p>
            </div>
          </div>

          {activeKidName && (
            <div className="flex items-center gap-2 bg-[#eff8ff] px-3 py-1 rounded-full text-xs font-black text-[#1fa7e1]">
              <span>{activeKidAvatar || "🌟"}</span>
              <span>{activeKidName}</span>
            </div>
          )}
        </div>

        {/* 6-Step Visual Timeline Bar */}
        <div className="max-w-[1080px] mx-auto mt-3 pt-3 border-t border-[#0f3a52]/5">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            {STEP_METADATA.map((meta) => {
              const isCompleted = completedSteps.includes(meta.order);
              const isCurrent = currentStep === meta.order;
              const canClick = isCompleted || meta.order <= currentStep;

              return (
                <button
                  key={meta.order}
                  disabled={!canClick}
                  onClick={() => handleStepSelect(meta.order)}
                  className={`flex-1 py-1.5 sm:py-2 px-1 sm:px-3 rounded-full text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer disabled:cursor-not-allowed ${
                    isCurrent
                      ? "bg-[#1fa7e1] text-white shadow-md shadow-[#1fa7e1]/25 ring-2 ring-[#1fa7e1]/20 scale-102"
                      : isCompleted
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      : "bg-slate-100 text-[#6b8494] opacity-60"
                  }`}
                >
                  <span>{isCompleted && !isCurrent ? "✓" : meta.icon}</span>
                  <span className="hidden md:inline">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Step Content Area */}
      <main className="max-w-[1080px] mx-auto px-6 pt-10">
        {saving && (
          <div className="text-center text-xs font-bold text-[#6b8494] mb-3 animate-pulse">
            Saving progress...
          </div>
        )}

        {currentStep === 1 && (
          <HookStep
            content={currentStepData?.content || ""}
            onComplete={() => handleStepComplete()}
          />
        )}

        {currentStep === 2 && (
          <VideoStep
            content={currentStepData?.content || ""}
            onComplete={() => handleStepComplete()}
          />
        )}

        {currentStep === 3 && (
          <ReadStep
            content={currentStepData?.content || ""}
            onComplete={() => handleStepComplete()}
          />
        )}

        {currentStep === 4 && (
          <ActivityStep
            content={currentStepData?.content || ""}
            onComplete={() => handleStepComplete()}
          />
        )}

        {currentStep === 5 && (
          <PracticeStep
            content={currentStepData?.content || ""}
            onComplete={(score) => handleStepComplete(score)}
          />
        )}

        {currentStep === 6 && (
          <DeepDiveStep
            content={currentStepData?.content || ""}
            lessonTitle={lesson.title}
            unitSlug={lesson.unit.slug}
            subjectSlug={lesson.unit.subject.slug}
            isGuestPreview={isGuestPreview}
            onComplete={() => handleStepComplete()}
          />
        )}
      </main>
    </div>
  );
}
