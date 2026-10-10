"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  FINGER_FRIENDLY_NAMES,
  FINGER_MAPPING,
  KEYBOARD_LAYOUT,
  TYPING_CURRICULUM,
  TypingLesson,
  calculateAccuracy,
  calculateWpm,
} from "@/lib/practice/typing";

interface TypingResult {
  lessonId: string;
  lessonTitle: string;
  wpm: number;
  accuracy: number;
  durationSeconds: number;
  totalChars: number;
}

export default function TouchTypingPage() {
  const [activeTab, setActiveTab] = useState<"practice" | "curriculum" | "history">("practice");
  const [currentLesson, setCurrentLesson] = useState<TypingLesson>(TYPING_CURRICULUM[0]);

  // Typing Run State
  const [typedText, setTypedText] = useState("");
  const [errorsCount, setErrorsCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [lastMistake, setLastMistake] = useState(false);
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);
  const [sessionSummary, setSessionSummary] = useState<TypingResult | null>(null);

  // History State
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [historyStats, setHistoryStats] = useState({ totalWords: 0, highestWpm: 0, avgAccuracy: 0 });

  const inputRef = useRef<HTMLInputElement>(null);

  const targetText = currentLesson.practiceText;
  const currentIndex = typedText.length;
  const nextChar = currentIndex < targetText.length ? targetText[currentIndex].toLowerCase() : "";
  const nextFinger = FINGER_MAPPING[nextChar] || (nextChar === " " ? "thumb" : "left-index");

  // Load History
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/practice/typing/history");
        if (res.ok) {
          const data = await res.json();
          setPastSessions(data.sessions || []);
          if (data.stats) setHistoryStats(data.stats);
        }
      } catch (err) {
        console.error("Error loading typing history:", err);
      }
    }
    loadHistory();
  }, [isFinished]);

  // Focus input automatically
  useEffect(() => {
    if (!isFinished) {
      inputRef.current?.focus();
    }
  }, [currentLesson, isFinished]);

  // Live timer for WPM
  useEffect(() => {
    if (!startTime || isFinished) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setLiveWpm(calculateWpm(typedText.length, elapsed));
    }, 500);

    return () => clearInterval(interval);
  }, [startTime, typedText.length, isFinished]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isFinished) return;

    if (!startTime) {
      setStartTime(Date.now());
    }

    if (e.key === "Backspace") {
      e.preventDefault();
      if (typedText.length > 0) {
        setTypedText((prev) => prev.slice(0, -1));
        setLastMistake(false);
      }
      return;
    }

    // Ignore modifier keys
    if (e.key.length !== 1) return;

    const pressedKey = e.key;
    const expectedKey = targetText[typedText.length];

    if (pressedKey === expectedKey) {
      const updatedTyped = typedText + pressedKey;
      setTypedText(updatedTyped);
      setLastMistake(false);

      const elapsed = startTime ? Math.max(1, (Date.now() - startTime) / 1000) : 1;
      const newAccuracy = calculateAccuracy(updatedTyped.length, errorsCount);
      setLiveAccuracy(newAccuracy);
      setLiveWpm(calculateWpm(updatedTyped.length, elapsed));

      // Check completion
      if (updatedTyped.length >= targetText.length) {
        finishLesson(updatedTyped.length, errorsCount, elapsed);
      }
    } else {
      // Mistake
      setErrorsCount((prev) => prev + 1);
      setLastMistake(true);
      const newAccuracy = calculateAccuracy(typedText.length + 1, errorsCount + 1);
      setLiveAccuracy(newAccuracy);
    }
  };

  const finishLesson = async (totalTyped: number, finalErrors: number, elapsed: number) => {
    setIsFinished(true);
    const finalWpm = calculateWpm(totalTyped, elapsed);
    const finalAccuracy = calculateAccuracy(totalTyped, finalErrors);

    const summary: TypingResult = {
      lessonId: currentLesson.id,
      lessonTitle: currentLesson.title,
      wpm: finalWpm,
      accuracy: finalAccuracy,
      durationSeconds: Math.round(elapsed),
      totalChars: totalTyped,
    };
    setSessionSummary(summary);

    try {
      await fetch("/api/practice/typing/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wpm: finalWpm,
          accuracy: finalAccuracy,
          durationSeconds: Math.round(elapsed),
          score: totalTyped,
          metadata: {
            lessonId: currentLesson.id,
            stage: currentLesson.stage,
          },
        }),
      });
    } catch (err) {
      console.error("Failed to save typing session:", err);
    }
  };

  const selectLesson = (lesson: TypingLesson) => {
    setCurrentLesson(lesson);
    setTypedText("");
    setErrorsCount(0);
    setStartTime(null);
    setIsFinished(false);
    setLastMistake(false);
    setLiveWpm(0);
    setLiveAccuracy(100);
    setSessionSummary(null);
    setActiveTab("practice");
  };

  const nextLesson = () => {
    const currentIndexInCurriculum = TYPING_CURRICULUM.findIndex((l) => l.id === currentLesson.id);
    const nextIdx = (currentIndexInCurriculum + 1) % TYPING_CURRICULUM.length;
    selectLesson(TYPING_CURRICULUM[nextIdx]);
  };

  return (
    <div className="max-w-[1080px] mx-auto px-6 py-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/app"
            className="text-xs font-black text-[#1fa7e1] hover:underline flex items-center gap-1.5 mb-1"
          >
            ← Back to Learning Space
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0f3a52] tracking-tight">
            Touch Typing Trainer ⌨️
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#6b8494] mt-1">
            Build muscle memory from home keys (J & F) to full words like &ldquo;pretzels&rdquo; with live key guidance.
          </p>
        </div>

        {/* Stats Pill */}
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-white border border-[#0f3a52]/10 shadow-xs">
          <div className="px-3 py-1.5 rounded-xl bg-[#eff8ff] text-center">
            <span className="text-xs font-black text-[#1fa7e1] block">{historyStats.totalWords}</span>
            <span className="text-[10px] font-bold text-[#6b8494]">Words</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 text-center">
            <span className="text-xs font-black text-amber-600 block">{historyStats.highestWpm}</span>
            <span className="text-[10px] font-bold text-[#6b8494]">Best WPM</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-center">
            <span className="text-xs font-black text-emerald-600 block">{historyStats.avgAccuracy}%</span>
            <span className="text-[10px] font-bold text-[#6b8494]">Accuracy</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 mb-8 p-1.5 rounded-2xl bg-white border border-[#0f3a52]/10 w-fit">
        <button
          onClick={() => setActiveTab("practice")}
          className={`px-5 py-2.5 rounded-xl font-black text-xs transition-colors cursor-pointer ${
            activeTab === "practice"
              ? "bg-[#1fa7e1] text-white shadow-xs"
              : "text-[#6b8494] hover:text-[#0f3a52]"
          }`}
        >
          ⚡ Typing Practice
        </button>
        <button
          onClick={() => setActiveTab("curriculum")}
          className={`px-5 py-2.5 rounded-xl font-black text-xs transition-colors cursor-pointer ${
            activeTab === "curriculum"
              ? "bg-[#1fa7e1] text-white shadow-xs"
              : "text-[#6b8494] hover:text-[#0f3a52]"
          }`}
        >
          📚 Lesson Curriculum
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-5 py-2.5 rounded-xl font-black text-xs transition-colors cursor-pointer ${
            activeTab === "history"
              ? "bg-[#1fa7e1] text-white shadow-xs"
              : "text-[#6b8494] hover:text-[#0f3a52]"
          }`}
        >
          📊 History & Stats
        </button>
      </div>

      {/* TAB 1: ACTIVE TYPING PRACTICE */}
      {activeTab === "practice" && (
        <div className="bg-white rounded-[28px] p-6 sm:p-12 border border-[#0f3a52]/10 shadow-xl max-w-3xl mx-auto mb-10 text-center relative overflow-hidden">
          {/* Top HUD */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#0f3a52]/10">
            <div>
              <span className="px-3.5 py-1 rounded-full bg-[#eff8ff] text-[#1fa7e1] text-xs font-black uppercase tracking-wider inline-block mb-1">
                {currentLesson.title}
              </span>
              <p className="text-xs font-semibold text-[#6b8494]">
                {currentLesson.description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 text-center">
                <span className="text-base font-black text-amber-600 block">{liveWpm}</span>
                <span className="text-[10px] font-bold text-[#6b8494]">WPM</span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-center">
                <span className="text-base font-black text-emerald-600 block">{liveAccuracy}%</span>
                <span className="text-[10px] font-bold text-[#6b8494]">Accuracy</span>
              </div>
            </div>
          </div>

          {/* Target Text Stream */}
          <div
            onClick={() => inputRef.current?.focus()}
            className="p-8 rounded-3xl bg-[#eff8ff]/60 border border-[#1fa7e1]/20 mb-8 cursor-text select-none text-left font-mono text-2xl sm:text-3xl tracking-wider leading-relaxed relative"
          >
            {targetText.split("").map((char, idx) => {
              const isTyped = idx < typedText.length;
              const isCurrent = idx === typedText.length;
              const isCorrect = isTyped && typedText[idx] === char;

              return (
                <span
                  key={idx}
                  className={`transition-colors ${
                    isCorrect
                      ? "text-emerald-600 font-bold"
                      : isCurrent
                      ? `text-[#0f3a52] font-black underline underline-offset-8 decoration-[#1fa7e1] decoration-4 ${
                          lastMistake ? "bg-red-200 text-red-700" : "bg-[#1fa7e1]/20"
                        }`
                      : "text-[#6b8494]/60"
                  }`}
                >
                  {char === " " ? "␣" : char}
                </span>
              );
            })}

            {/* Hidden Input Capturing Real Keystrokes */}
            <input
              ref={inputRef}
              type="text"
              className="absolute opacity-0 pointer-events-none"
              onKeyDown={handleKeyDown}
              onChange={() => {}}
            />
          </div>

          {/* Finger Guidance Banner */}
          <div className="mb-6 p-3 rounded-2xl bg-[#fff8f0] border border-[#ffb356]/30 inline-flex items-center gap-2 text-xs font-black text-[#0f3a52]">
            <span>🖐️ Next Key:</span>
            <span className="px-2.5 py-1 rounded-lg bg-white text-[#1fa7e1] border border-[#1fa7e1]/20 font-black">
              {nextChar === " " ? "SPACE" : nextChar.toUpperCase()}
            </span>
            <span className="text-[#6b8494]">•</span>
            <span className="text-[#e0a322]">{FINGER_FRIENDLY_NAMES[nextFinger] || "Use Index Finger"}</span>
          </div>

          {/* On-Screen Keyboard */}
          <div className="max-w-xl mx-auto p-4 rounded-2xl bg-slate-100 border border-slate-200 mb-6 select-none shadow-inner">
            {KEYBOARD_LAYOUT.map((row, rowIdx) => (
              <div key={rowIdx} className="flex justify-center gap-1.5 mb-1.5 last:mb-0">
                {row.map((keyChar) => {
                  const isHighlighted = keyChar === nextChar;
                  const isSpace = keyChar === " ";

                  return (
                    <div
                      key={keyChar}
                      className={`h-11 rounded-lg flex items-center justify-center font-black transition-all ${
                        isSpace ? "w-64 text-xs tracking-wider" : "w-10 text-sm"
                      } ${
                        isHighlighted
                          ? "bg-[#1fa7e1] text-white shadow-md shadow-[#1fa7e1]/30 scale-105 border-2 border-white ring-2 ring-[#1fa7e1]"
                          : "bg-white text-[#0f3a52] border border-slate-200 shadow-xs"
                      }`}
                    >
                      {isSpace ? "SPACEBAR" : keyChar.toUpperCase()}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => selectLesson(currentLesson)}
              className="px-6 py-2.5 rounded-full border border-[#0f3a52]/15 text-[#0f3a52] font-black text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Restart Lesson ↺
            </button>
            <button
              onClick={nextLesson}
              className="px-6 py-2.5 rounded-full bg-[#1fa7e1] hover:bg-[#0d7fb0] text-white font-black text-xs transition-colors shadow-sm cursor-pointer"
            >
              Next Lesson →
            </button>
          </div>
        </div>
      )}

      {/* SESSION SUMMARY MODAL */}
      {sessionSummary && (
        <div className="fixed inset-0 z-50 bg-[#0f3a52]/40 backdrop-blur-xs flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[28px] p-8 sm:p-12 border border-[#0f3a52]/10 shadow-2xl max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 text-4xl flex items-center justify-center mx-auto mb-4 animate-bounce">
              🎉
            </div>

            <span className="px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider inline-block mb-2">
              Typing Complete!
            </span>

            <h2 className="text-3xl font-black text-[#0f3a52] mb-1">
              Fantastic Typing!
            </h2>
            <p className="text-xs font-semibold text-[#6b8494] mb-6">
              {sessionSummary.lessonTitle}
            </p>

            <div className="grid grid-cols-3 gap-2.5 p-4 rounded-2xl bg-[#eff8ff] mb-6 text-center">
              <div>
                <span className="text-xl font-black text-[#1fa7e1] block">{sessionSummary.wpm}</span>
                <span className="text-[10px] font-bold text-[#6b8494]">WPM</span>
              </div>
              <div>
                <span className="text-xl font-black text-emerald-600 block">{sessionSummary.accuracy}%</span>
                <span className="text-[10px] font-bold text-[#6b8494]">Accuracy</span>
              </div>
              <div>
                <span className="text-xl font-black text-[#0f3a52] block">{sessionSummary.durationSeconds}s</span>
                <span className="text-[10px] font-bold text-[#6b8494]">Time</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={nextLesson}
                className="w-full py-3.5 rounded-full bg-[#1fa7e1] hover:bg-[#0d7fb0] text-white font-black text-sm transition-all shadow-md shadow-[#1fa7e1]/25 cursor-pointer"
              >
                Next Typing Stage →
              </button>
              <button
                onClick={() => selectLesson(currentLesson)}
                className="w-full py-3 rounded-full border border-[#0f3a52]/15 text-[#0f3a52] font-black text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Practice Again ↺
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CURRICULUM SELECTOR */}
      {activeTab === "curriculum" && (
        <div className="space-y-4 max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-[#0f3a52] mb-6 text-center">
            Touch Typing Curriculum
          </h2>
          {TYPING_CURRICULUM.map((les) => (
            <button
              key={les.id}
              onClick={() => selectLesson(les)}
              className="w-full text-left p-5 rounded-2xl bg-white hover:bg-[#eff8ff]/60 border border-[#0f3a52]/10 hover:border-[#1fa7e1] transition-all flex items-center justify-between cursor-pointer group shadow-xs"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#eff8ff] text-[#1fa7e1] text-[10px] font-black uppercase">
                    Stage {les.stage}
                  </span>
                  <h3 className="text-base font-black text-[#0f3a52] group-hover:text-[#1fa7e1] transition-colors">
                    {les.title}
                  </h3>
                </div>
                <p className="text-xs font-semibold text-[#6b8494]">
                  {les.description}
                </p>
                <div className="mt-2 text-xs font-mono text-[#0f3a52] bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  Sample: &ldquo;{les.practiceText.slice(0, 30)}...&rdquo;
                </div>
              </div>
              <span className="px-4 py-2 rounded-full bg-[#1fa7e1] text-white font-black text-xs group-hover:scale-105 transition-transform shadow-xs shrink-0">
                Start →
              </span>
            </button>
          ))}
        </div>
      )}

      {/* TAB 3: HISTORY & STATS */}
      {activeTab === "history" && (
        <div className="bg-white rounded-[28px] p-6 sm:p-10 border border-[#0f3a52]/10 shadow-sm max-w-2xl mx-auto">
          <h2 className="text-xl font-black text-[#0f3a52] mb-6">
            Typing Session History
          </h2>

          {pastSessions.length === 0 ? (
            <div className="text-center py-12 text-sm font-semibold text-[#6b8494]">
              No typing sessions recorded yet. Complete a lesson to see your speed and accuracy stats here!
            </div>
          ) : (
            <div className="space-y-3">
              {pastSessions.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl bg-[#eff8ff]/50 border border-[#1fa7e1]/15 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-white text-[#1fa7e1] font-black text-lg flex items-center justify-center shadow-xs">
                      ⌨️
                    </span>
                    <div>
                      <span className="text-xs font-black text-[#0f3a52] block">
                        Speed: {s.wpm} WPM • Accuracy: {s.accuracy}%
                      </span>
                      <span className="text-[11px] font-semibold text-[#6b8494]">
                        {new Date(s.createdAt).toLocaleDateString()} at{" "}
                        {new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-600 block">{s.score} chars</span>
                    <span className="text-[10px] font-bold text-[#6b8494]">{s.durationSeconds}s duration</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
