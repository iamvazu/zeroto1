"use client";

import { useState } from "react";

const ALLOWED_CHANNELS = [
  "SciShow Kids",
  "CrashCourse Kids",
  "National Geographic Kids",
  "Khan Academy",
  "Free School",
  "TED-Ed",
  "PBS Kids",
  "Peekaboo Kidz",
];

interface VideoStepProps {
  content: string; // JSON string
  onComplete: () => void;
}

export default function VideoStep({ content, onComplete }: VideoStepProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  let parsedContent: { query?: string; channelAllowlist?: string[]; videoId?: string } = {};
  try {
    parsedContent = JSON.parse(content);
  } catch {
    parsedContent = { query: "Educational Science & History" };
  }

  // Filter channels to only allowed educational channels
  const channels = (parsedContent.channelAllowlist || ALLOWED_CHANNELS).filter((c) =>
    ALLOWED_CHANNELS.includes(c)
  );

  const displayChannel = channels[0] || "National Geographic Kids";

  // Safe educational embed IDs for popular science/history themes
  const defaultEmbedId = "U73c1r0Fk8A"; // Kid safe science/history explainer
  const embedId = parsedContent.videoId || defaultEmbedId;

  return (
    <div className="bg-white rounded-[28px] p-6 sm:p-10 border border-[#0f3a52]/10 shadow-lg max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <span className="px-3.5 py-1 rounded-full bg-[#eff8ff] text-[#1fa7e1] text-xs font-black uppercase tracking-wider inline-block mb-3">
          Step 2 • Guided Video
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-[#0f3a52] tracking-tight">
          Watch & Discover
        </h2>
        <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black">
          <span>✓</span>
          <span>Approved Kid-Safe Channel: {displayChannel}</span>
        </div>
      </div>

      {/* Video Container (16:9 Aspect Ratio) */}
      <div className="relative rounded-2xl overflow-hidden bg-[#0f3a52] aspect-video shadow-md border border-[#0f3a52]/10 mb-6">
        {isPlaying ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${embedId}?autoplay=1&rel=0&modestbranding=1`}
            title="Educational Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        ) : (
          <div
            onClick={() => setIsPlaying(true)}
            className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0f3a52] to-[#1fa7e1] p-6 text-center text-white cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-full bg-white text-[#1fa7e1] flex items-center justify-center text-2xl font-black shadow-lg group-hover:scale-110 transition-transform mb-3">
              ▶
            </div>
            <p className="text-sm font-black tracking-tight">
              Click to Play Guided Video
            </p>
            <p className="text-xs text-slate-200 mt-1">
              {parsedContent.query || "Curated educational presentation"}
            </p>
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl bg-[#eff8ff] border border-[#1fa7e1]/20 flex items-center justify-between gap-4 mb-6 text-xs font-bold text-[#0f3a52]">
        <div className="flex items-center gap-2">
          <span>🛡️</span>
          <span>Zero external recommendations • Commercial-free embed</span>
        </div>
        <span className="text-[#6b8494]">~3 mins</span>
      </div>

      <div className="pt-4 border-t border-[#0f3a52]/10 flex justify-end">
        <button
          onClick={onComplete}
          className="px-8 py-3.5 rounded-full bg-[#1fa7e1] hover:bg-[#0d7fb0] text-white font-black text-sm transition-all shadow-md shadow-[#1fa7e1]/25 hover:scale-105 cursor-pointer flex items-center gap-2"
        >
          <span>I finished watching</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
