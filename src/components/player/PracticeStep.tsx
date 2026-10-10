"use client";

import { useState } from "react";

interface Question {
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
}

interface PracticeStepProps {
  content: string; // JSON string
  onComplete: (score?: number) => void;
}

export default function PracticeStep({ content, onComplete }: PracticeStepProps) {
  let questions: Question[] = [];
  try {
    const parsed = JSON.parse(content);
    questions = parsed.questions || [];
  } catch {
    questions = [];
  }

  if (questions.length === 0) {
    questions = [
      {
        prompt: "What is the key takeaway about what we explored today?",
        choices: [
          "It follows consistent patterns and natural laws",
          "It is completely random and cannot be studied",
          "It only happened once in history",
          "None of the above",
        ],
        answerIndex: 0,
        explanation: "Great thinking! Natural and historical events follow discoverable patterns that help us understand our world.",
      },
    ];
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const currentQ = questions[currentIndex];
  const isCorrect = selectedChoice === currentQ.answerIndex;

  const handleSelectChoice = (idx: number) => {
    if (hasAnswered) return;
    setSelectedChoice(idx);
    setHasAnswered(true);

    if (idx === currentQ.answerIndex) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedChoice(null);
      setHasAnswered(false);
    } else {
      const finalScore = Math.round(((correctCount + (isCorrect ? 0 : 0)) / questions.length) * 100);
      onComplete(finalScore);
    }
  };

  return (
    <div className="bg-white rounded-[28px] p-6 sm:p-12 border border-[#0f3a52]/10 shadow-lg max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="px-3.5 py-1 rounded-full bg-[#eff8ff] text-[#1fa7e1] text-xs font-black uppercase tracking-wider inline-block mb-1">
            Step 5 • Practice Quiz (Non-blocking)
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0f3a52] tracking-tight">
            Check Your Understanding
          </h2>
        </div>

        <div className="bg-[#eff8ff] px-3.5 py-1.5 rounded-full text-xs font-black text-[#1fa7e1]">
          Question {currentIndex + 1} of {questions.length}
        </div>
      </div>

      {/* Question Prompt */}
      <div className="mb-6 p-6 rounded-2xl bg-[#eff8ff]/50 border border-[#1fa7e1]/15">
        <h3 className="text-lg sm:text-xl font-black text-[#0f3a52] leading-snug">
          {currentQ.prompt}
        </h3>
      </div>

      {/* Choices */}
      <div className="space-y-3 mb-8">
        {currentQ.choices.map((choice, idx) => {
          let btnStyle = "bg-white border-[#0f3a52]/15 text-[#0f3a52] hover:border-[#1fa7e1]";

          if (hasAnswered) {
            if (idx === currentQ.answerIndex) {
              btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-800 font-black";
            } else if (idx === selectedChoice) {
              btnStyle = "bg-amber-50 border-amber-400 text-amber-800";
            } else {
              btnStyle = "bg-slate-50 border-slate-200 text-[#6b8494] opacity-50";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelectChoice(idx)}
              disabled={hasAnswered}
              className={`w-full p-4 rounded-2xl border-2 text-left text-sm font-bold transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
            >
              <span>{choice}</span>
              {hasAnswered && idx === currentQ.answerIndex && (
                <span className="text-emerald-600 font-black">✓ Correct</span>
              )}
              {hasAnswered && idx === selectedChoice && idx !== currentQ.answerIndex && (
                <span className="text-amber-600 font-black">Not quite</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Gentle Re-explanation (Non-blocking feedback) */}
      {hasAnswered && (
        <div
          className={`p-6 rounded-2xl mb-8 border transition-all ${
            isCorrect
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{isCorrect ? "✨" : "💡"}</span>
            <div>
              <h4 className="text-sm font-black mb-1">
                {isCorrect ? "Spot on!" : "Let's look at this together"}
              </h4>
              <p className="text-xs font-semibold leading-relaxed">
                {currentQ.explanation}
              </p>
              {!isCorrect && (
                <p className="text-[11px] font-bold text-amber-700 mt-2">
                  No stress — curiosity is all about trying and learning. You can continue right away!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-[#0f3a52]/10 flex items-center justify-between">
        <span className="text-xs font-bold text-[#6b8494]">
          Zero negative scores • Designed for confidence
        </span>

        {hasAnswered ? (
          <button
            onClick={handleNext}
            className="px-8 py-3.5 rounded-full bg-[#1fa7e1] hover:bg-[#0d7fb0] text-white font-black text-sm transition-all shadow-md shadow-[#1fa7e1]/25 hover:scale-105 cursor-pointer flex items-center gap-2"
          >
            <span>{currentIndex < questions.length - 1 ? "Next Question" : "Continue to Deep Dive"}</span>
            <span>→</span>
          </button>
        ) : (
          <span className="text-xs font-bold text-[#1fa7e1]">
            Tap an answer above to continue
          </span>
        )}
      </div>
    </div>
  );
}
