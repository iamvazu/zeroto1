"use client";

import { useState } from "react";

interface ReadStepProps {
  content: string; // JSON string
  onComplete: () => void;
}

export default function ReadStep({ content, onComplete }: ReadStepProps) {
  let paragraphs: string[] = [];
  try {
    const parsed = JSON.parse(content);
    paragraphs = parsed.paragraphs || [];
  } catch {
    paragraphs = [content];
  }

  if (paragraphs.length === 0) {
    paragraphs = [
      "When we look closely at this topic, we discover patterns that explain why our world works the way it does.",
      "Scientists and historians spent centuries gathering clues to answer this question.",
      "Now it is your turn to explore the evidence yourself!",
    ];
  }

  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div className="bg-white rounded-[28px] p-6 sm:p-12 border border-[#0f3a52]/10 shadow-lg max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="px-3.5 py-1 rounded-full bg-[#eff8ff] text-[#1fa7e1] text-xs font-black uppercase tracking-wider inline-block mb-1">
            Step 3 • Guided Read
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0f3a52] tracking-tight">
            Explore the Story
          </h2>
        </div>

        <div className="flex items-center gap-1.5 bg-[#eff8ff] px-3.5 py-1.5 rounded-full text-xs font-black text-[#1fa7e1]">
          <span>Card {currentIndex + 1}</span>
          <span className="text-[#6b8494]">of {paragraphs.length}</span>
        </div>
      </div>

      {/* Reading Card */}
      <div className="p-8 sm:p-10 rounded-[24px] bg-[#fff8f0] border border-[#ffb356]/20 min-h-[200px] flex items-center justify-center text-center shadow-inner mb-8 transition-all">
        <p className="text-lg sm:text-xl font-bold text-[#0f3a52] leading-relaxed">
          {paragraphs[currentIndex]}
        </p>
      </div>

      {/* Card Navigation */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#0f3a52]/10">
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="px-5 py-2.5 rounded-full border border-[#0f3a52]/15 text-[#0f3a52] font-black text-xs hover:bg-slate-50 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
        >
          ← Previous
        </button>

        <div className="flex gap-2">
          {paragraphs.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-3 h-3 rounded-full transition-all ${
                currentIndex === idx
                  ? "bg-[#1fa7e1] scale-125"
                  : "bg-slate-200 hover:bg-slate-300"
              }`}
            />
          ))}
        </div>

        {currentIndex < paragraphs.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((prev) => Math.min(paragraphs.length - 1, prev + 1))}
            className="px-6 py-2.5 rounded-full bg-[#0f3a52] text-white font-black text-xs hover:bg-[#1fa7e1] transition-colors cursor-pointer"
          >
            Next Card →
          </button>
        ) : (
          <button
            onClick={onComplete}
            className="px-6 py-2.5 rounded-full bg-[#1fa7e1] hover:bg-[#0d7fb0] text-white font-black text-xs transition-all shadow-md shadow-[#1fa7e1]/25 hover:scale-105 cursor-pointer flex items-center gap-1.5"
          >
            <span>I finished reading</span>
            <span>→</span>
          </button>
        )}
      </div>
    </div>
  );
}
