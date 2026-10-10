"use client";

interface HookStepProps {
  content: string; // JSON string
  onComplete: () => void;
}

export default function HookStep({ content, onComplete }: HookStepProps) {
  let parsedContent: { text?: string; imagePrompt?: string } = {};
  try {
    parsedContent = JSON.parse(content);
  } catch {
    parsedContent = { text: content };
  }

  return (
    <div className="bg-white rounded-[28px] p-8 sm:p-12 border border-[#0f3a52]/10 shadow-lg text-center max-w-3xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-[#eff8ff] text-[#1fa7e1] text-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
        💡
      </div>

      <span className="px-3.5 py-1 rounded-full bg-[#eff8ff] text-[#1fa7e1] text-xs font-black uppercase tracking-wider inline-block mb-4">
        Step 1 • The Spark
      </span>

      <h2 className="text-2xl sm:text-4xl font-black text-[#0f3a52] tracking-tight leading-snug mb-6">
        {parsedContent.text || "Every great discovery started with a simple question."}
      </h2>

      {parsedContent.imagePrompt && (
        <div className="my-8 p-6 rounded-2xl bg-[#fff8f0] border border-[#ffb356]/20 text-left flex items-start gap-4">
          <span className="text-2xl">🎨</span>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#e0a322] block mb-1">
              Visual Wonder
            </span>
            <p className="text-sm font-bold text-[#0f3a52]">
              {parsedContent.imagePrompt}
            </p>
          </div>
        </div>
      )}

      <div className="pt-6 border-t border-[#0f3a52]/10 flex justify-center">
        <button
          onClick={onComplete}
          className="px-8 py-4 rounded-full bg-[#1fa7e1] hover:bg-[#0d7fb0] text-white font-black text-sm transition-all shadow-md shadow-[#1fa7e1]/25 hover:scale-105 cursor-pointer flex items-center gap-2"
        >
          <span>I&apos;m ready to see more!</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
