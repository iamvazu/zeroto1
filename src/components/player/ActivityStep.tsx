"use client";

import { useState } from "react";

interface ActivityStepProps {
  content: string; // JSON string
  onComplete: () => void;
}

export default function ActivityStep({ content, onComplete }: ActivityStepProps) {
  let instruction = "Look closely at the clues and discover the key pattern.";
  let interactionType = "observe";

  try {
    const parsed = JSON.parse(content);
    if (parsed.instruction) instruction = parsed.instruction;
    if (parsed.interactionType) interactionType = parsed.interactionType;
  } catch {
    instruction = content;
  }

  // Interactive clue toggles
  const [tappedClues, setTappedClues] = useState<number[]>([]);
  const sampleClues = [
    { title: "Clue 1: Observation", detail: "Ancient symbols and tools reveal how early humans communicated without alphabets." },
    { title: "Clue 2: Environment", detail: "Natural mineral pigments in deep cave shelters survived intact for tens of thousands of years." },
    { title: "Clue 3: Teamwork", detail: "Creating large cave art required scaffolds and torchlight, proving communities worked together." },
  ];

  const toggleClue = (idx: number) => {
    if (!tappedClues.includes(idx)) {
      setTappedClues([...tappedClues, idx]);
    }
  };

  const isDone = tappedClues.length >= sampleClues.length;

  return (
    <div className="bg-white rounded-[28px] p-6 sm:p-12 border border-[#0f3a52]/10 shadow-lg max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <span className="px-3.5 py-1 rounded-full bg-[#eff8ff] text-[#1fa7e1] text-xs font-black uppercase tracking-wider inline-block mb-3">
          Step 4 • Interactive Activity ({interactionType})
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-[#0f3a52] tracking-tight">
          Hands-On Thinking
        </h2>
        <p className="text-sm font-semibold text-[#6b8494] mt-2 max-w-xl mx-auto">
          {instruction}
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <p className="text-xs font-black uppercase tracking-wider text-[#6b8494]">
          Tap each clue card to inspect evidence ({tappedClues.length}/{sampleClues.length} revealed):
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {sampleClues.map((clue, idx) => {
            const revealed = tappedClues.includes(idx);
            return (
              <div
                key={idx}
                onClick={() => toggleClue(idx)}
                className={`p-6 rounded-[22px] border-2 cursor-pointer transition-all flex flex-col justify-between min-h-[170px] ${
                  revealed
                    ? "bg-[#eff8ff] border-[#1fa7e1] shadow-md scale-102"
                    : "bg-[#fff8f0] border-dashed border-[#ffb356]/40 hover:border-[#1fa7e1] hover:scale-102"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-[#0f3a52]">
                      {clue.title}
                    </span>
                    <span className="text-lg">{revealed ? "🔍" : "❓"}</span>
                  </div>
                  <p className="text-xs font-semibold text-[#0f3a52] leading-relaxed">
                    {revealed ? clue.detail : "Tap to inspect this piece of evidence"}
                  </p>
                </div>

                <div className="mt-3">
                  <span
                    className={`inline-block text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                      revealed
                        ? "bg-[#1fa7e1] text-white"
                        : "bg-white/80 text-[#6b8494]"
                    }`}
                  >
                    {revealed ? "Inspected ✓" : "Tap to open"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-6 border-t border-[#0f3a52]/10 flex flex-wrap items-center justify-between gap-4">
        <span className="text-xs font-bold text-[#6b8494]">
          {isDone
            ? "Awesome work! You discovered all the evidence."
            : "Inspect all clues above to finish the activity."}
        </span>

        <button
          onClick={onComplete}
          className="px-8 py-3.5 rounded-full bg-[#1fa7e1] hover:bg-[#0d7fb0] text-white font-black text-sm transition-all shadow-md shadow-[#1fa7e1]/25 hover:scale-105 cursor-pointer flex items-center gap-2"
        >
          <span>Complete Activity</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
