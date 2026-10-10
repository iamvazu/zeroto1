"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  DifficultyLevel,
  GUIDED_TRACKS,
  GuidedTrackStage,
  MathMode,
  MathOperator,
  MathProblem,
  computeAdaptiveDifficulty,
  generateMathProblem,
} from "@/lib/practice/math";

interface SessionResult {
  score: number;
  totalAttempted: number;
  accuracy: number;
  maxStreak: number;
  durationSeconds: number;
  mode: MathMode;
  operator: MathOperator;
  finalLevel: DifficultyLevel;
}

export default function MathPracticePage() {
  const [activeTab, setActiveTab] = useState<"guided" | "custom" | "history">("guided");

  // Selection states for Custom mode
  const [selectedOperator, setSelectedOperator] = useState<MathOperator>("+");
  const [selectedMode, setSelectedMode] = useState<MathMode>("free");
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel>(1);

  // Active Game State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [historyAnswers, setHistoryAnswers] = useState<boolean[]>([]);
  const [currentLevel, setCurrentLevel] = useState<DifficultyLevel>(1);
  const [score, setScore] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [startTime, setStartTime] = useState<number>(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [sessionSummary, setSessionSummary] = useState<SessionResult | null>(null);
  const [currentTrack, setCurrentTrack] = useState<GuidedTrackStage | null>(null);

  // Past Sessions History State
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [historyStats, setHistoryStats] = useState({ totalProblems: 0, bestStreak: 0, avgAccuracy: 0 });

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/practice/math/history");
        if (res.ok) {
          const data = await res.json();
          setPastSessions(data.sessions || []);
          if (data.stats) setHistoryStats(data.stats);
        }
      } catch (err) {
        console.error("Error loading math history:", err);
      }
    }
    loadHistory();
  }, [isPlaying]);

  // Clock Mode Timer
  useEffect(() => {
    if (!isPlaying || selectedMode !== "clock") return;

    if (timeLeft <= 0) {
      finishSession();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, selectedMode]);

  const startSession = (
    op: MathOperator,
    mode: MathMode,
    level: DifficultyLevel,
    track?: GuidedTrackStage
  ) => {
    setSelectedOperator(op);
    setSelectedMode(mode);
    setSelectedLevel(level);
    setCurrentLevel(level);
    setCurrentTrack(track || null);

    setScore(0);
    setAttempted(0);
    setStreak(0);
    setMaxStreak(0);
    setHistoryAnswers([]);
    setUserAnswer("");
    setFeedback(null);
    setSessionSummary(null);
    setTimeLeft(60);
    setStartTime(Date.now());

    const firstProb = generateMathProblem(op, level);
    setCurrentProblem(firstProb);
    setIsPlaying(true);
  };

  const handleAnswerSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentProblem || !userAnswer.trim()) return;

    const numericAnswer = parseInt(userAnswer.trim(), 10);
    const isCorrect = numericAnswer === currentProblem.answer;

    const newAttempted = attempted + 1;
    const newScore = isCorrect ? score + 1 : score;
    const newStreak = isCorrect ? streak + 1 : 0;
    const newMaxStreak = Math.max(maxStreak, newStreak);
    const newHistory = [...historyAnswers, isCorrect];

    setAttempted(newAttempted);
    setScore(newScore);
    setStreak(newStreak);
    setMaxStreak(newMaxStreak);
    setHistoryAnswers(newHistory);

    // Adaptive difficulty calculation
    const nextLevel = computeAdaptiveDifficulty(currentLevel, newHistory);
    setCurrentLevel(nextLevel);

    setFeedback(isCorrect ? "correct" : "wrong");

    // Streak mode ends on first wrong answer
    if (!isCorrect && selectedMode === "streak") {
      setTimeout(() => {
        finishSession(newScore, newAttempted, newMaxStreak, nextLevel);
      }, 700);
      return;
    }

    // Guided track finishes when target reached
    if (currentTrack && newScore >= currentTrack.targetCount) {
      setTimeout(() => {
        finishSession(newScore, newAttempted, newMaxStreak, nextLevel);
      }, 700);
      return;
    }

    // Free practice reaches 15 questions per set
    if (selectedMode === "free" && newAttempted >= 15 && !currentTrack) {
      setTimeout(() => {
        finishSession(newScore, newAttempted, newMaxStreak, nextLevel);
      }, 700);
      return;
    }

    setTimeout(() => {
      setFeedback(null);
      setUserAnswer("");
      setCurrentProblem(generateMathProblem(selectedOperator, nextLevel));
    }, 350);
  };

  const finishSession = async (
    finalScore = score,
    finalAttempted = attempted,
    finalMaxStreak = maxStreak,
    finalLevel = currentLevel
  ) => {
    setIsPlaying(false);
    const duration = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const accuracy = finalAttempted > 0 ? Math.round((finalScore / finalAttempted) * 100) : 100;

    const summary: SessionResult = {
      score: finalScore,
      totalAttempted: finalAttempted,
      accuracy,
      maxStreak: finalMaxStreak,
      durationSeconds: duration,
      mode: selectedMode,
      operator: selectedOperator,
      finalLevel,
    };
    setSessionSummary(summary);

    // Save to Database
    try {
      await fetch("/api/practice/math/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: selectedMode,
          operator: selectedOperator,
          score: finalScore,
          accuracy,
          durationSeconds: duration,
          metadata: {
            streak: finalMaxStreak,
            level: finalLevel,
            trackId: currentTrack?.id,
          },
        }),
      });
    } catch (err) {
      console.error("Failed to save math practice session:", err);
    }
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
            Math Practice Engine ⚡
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#6b8494] mt-1">
            Build rapid mental arithmetic with adaptive difficulty, streak challenges, and guided tracks.
          </p>
        </div>

        {/* Lifetime Stats Pill */}
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-white border border-[#0f3a52]/10 shadow-xs">
          <div className="px-3 py-1.5 rounded-xl bg-[#eff8ff] text-center">
            <span className="text-xs font-black text-[#1fa7e1] block">{historyStats.totalProblems}</span>
            <span className="text-[10px] font-bold text-[#6b8494]">Solved</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 text-center">
            <span className="text-xs font-black text-amber-600 block">{historyStats.bestStreak} 🔥</span>
            <span className="text-[10px] font-bold text-[#6b8494]">Best Streak</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-center">
            <span className="text-xs font-black text-emerald-600 block">{historyStats.avgAccuracy}%</span>
            <span className="text-[10px] font-bold text-[#6b8494]">Accuracy</span>
          </div>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      {!isPlaying && (
        <div className="flex items-center gap-2 mb-8 p-1.5 rounded-2xl bg-white border border-[#0f3a52]/10 w-fit">
          <button
            onClick={() => setActiveTab("guided")}
            className={`px-5 py-2.5 rounded-xl font-black text-xs transition-colors cursor-pointer ${
              activeTab === "guided"
                ? "bg-[#1fa7e1] text-white shadow-xs"
                : "text-[#6b8494] hover:text-[#0f3a52]"
            }`}
          >
            🗺️ Guided Tracks
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`px-5 py-2.5 rounded-xl font-black text-xs transition-colors cursor-pointer ${
              activeTab === "custom"
                ? "bg-[#1fa7e1] text-white shadow-xs"
                : "text-[#6b8494] hover:text-[#0f3a52]"
            }`}
          >
            ⚙️ Choose Your Own
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
      )}

      {/* ACTIVE GAME ARENA */}
      {isPlaying && currentProblem && (
        <div className="bg-white rounded-[28px] p-6 sm:p-12 border border-[#0f3a52]/10 shadow-xl max-w-2xl mx-auto mb-10 text-center relative overflow-hidden">
          {/* Top HUD */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#0f3a52]/10">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#eff8ff] text-[#1fa7e1] text-xs font-black">
                Level {currentLevel} (Adaptive)
              </span>
              {currentTrack && (
                <span className="px-3 py-1 rounded-full bg-[#fff8f0] text-[#e0a322] text-xs font-black">
                  {currentTrack.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {selectedMode === "clock" && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-black animate-pulse">
                  <span>⏱️</span>
                  <span>{timeLeft}s</span>
                </div>
              )}

              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-black">
                <span>🔥</span>
                <span>{streak} Streak</span>
              </div>

              <div className="text-xs font-black text-[#0f3a52]">
                Score: {score}
              </div>
            </div>
          </div>

          {/* Big Problem Display */}
          <div
            className={`py-8 px-6 rounded-3xl mb-8 transition-all duration-300 ${
              feedback === "correct"
                ? "bg-emerald-50 scale-105 border-2 border-emerald-400"
                : feedback === "wrong"
                ? "bg-red-50 border-2 border-red-300 animate-shake"
                : "bg-[#eff8ff]/60 border border-[#1fa7e1]/20"
            }`}
          >
            <div className="text-5xl sm:text-7xl font-black text-[#0f3a52] tracking-wider flex items-center justify-center gap-4">
              <span>{currentProblem.num1}</span>
              <span className="text-[#1fa7e1]">
                {currentProblem.operator === "*" ? "×" : currentProblem.operator === "/" ? "÷" : currentProblem.operator}
              </span>
              <span>{currentProblem.num2}</span>
              <span className="text-[#6b8494]">=</span>
              <span className="text-[#1fa7e1] underline underline-offset-8">
                {userAnswer || "?"}
              </span>
            </div>
          </div>

          {/* Input & Virtual Keypad */}
          <form onSubmit={handleAnswerSubmit} className="max-w-xs mx-auto mb-6">
            <input
              type="number"
              autoFocus
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Your answer"
              className="w-full text-center text-3xl font-black px-4 py-3.5 rounded-2xl bg-white border-2 border-[#1fa7e1] text-[#0f3a52] focus:outline-none shadow-sm mb-4"
            />

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setUserAnswer((prev) => prev + n)}
                  className="py-3 rounded-xl bg-[#eff8ff] hover:bg-[#1fa7e1] text-[#0f3a52] hover:text-white font-black text-lg transition-colors cursor-pointer"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setUserAnswer("")}
                className="py-3 rounded-xl bg-red-50 hover:bg-red-500 text-red-600 hover:text-white font-black text-xs transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setUserAnswer((prev) => prev + "0")}
                className="py-3 rounded-xl bg-[#eff8ff] hover:bg-[#1fa7e1] text-[#0f3a52] hover:text-white font-black text-lg transition-colors cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setUserAnswer((prev) => prev.slice(0, -1))}
                className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0f3a52] font-black text-sm transition-colors cursor-pointer"
              >
                ⌫
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!userAnswer}
                className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base transition-all shadow-md shadow-emerald-600/25 disabled:opacity-50 cursor-pointer"
              >
                Check Answer ✓
              </button>
              <button
                type="button"
                onClick={() => finishSession()}
                className="px-4 py-3.5 rounded-xl border border-[#0f3a52]/15 text-[#6b8494] hover:text-[#0f3a52] font-black text-xs cursor-pointer"
              >
                End
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SESSION SUMMARY MODAL */}
      {sessionSummary && (
        <div className="fixed inset-0 z-50 bg-[#0f3a52]/40 backdrop-blur-xs flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[28px] p-8 sm:p-12 border border-[#0f3a52]/10 shadow-2xl max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 text-4xl flex items-center justify-center mx-auto mb-4 animate-bounce">
              🌟
            </div>

            <span className="px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider inline-block mb-2">
              Session Complete!
            </span>

            <h2 className="text-3xl font-black text-[#0f3a52] mb-2">
              Great Math Workout!
            </h2>

            <p className="text-xs font-semibold text-[#6b8494] mb-6">
              Your results are saved to your family learning profile.
            </p>

            <div className="grid grid-cols-3 gap-2.5 p-4 rounded-2xl bg-[#eff8ff] mb-6 text-center">
              <div>
                <span className="text-xl font-black text-[#0f3a52] block">{sessionSummary.score}</span>
                <span className="text-[10px] font-bold text-[#6b8494]">Correct</span>
              </div>
              <div>
                <span className="text-xl font-black text-[#1fa7e1] block">{sessionSummary.accuracy}%</span>
                <span className="text-[10px] font-bold text-[#6b8494]">Accuracy</span>
              </div>
              <div>
                <span className="text-xl font-black text-amber-500 block">{sessionSummary.maxStreak} 🔥</span>
                <span className="text-[10px] font-bold text-[#6b8494]">Streak</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => startSession(sessionSummary.operator, sessionSummary.mode, sessionSummary.finalLevel, currentTrack || undefined)}
                className="w-full py-3.5 rounded-full bg-[#1fa7e1] hover:bg-[#0d7fb0] text-white font-black text-sm transition-all shadow-md shadow-[#1fa7e1]/25 cursor-pointer"
              >
                Practice Again ⚡
              </button>
              <button
                onClick={() => setSessionSummary(null)}
                className="w-full py-3 rounded-full border border-[#0f3a52]/15 text-[#0f3a52] font-black text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Choose Another Track
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: GUIDED TRACKS */}
      {!isPlaying && activeTab === "guided" && (
        <div className="space-y-8">
          {/* Bonus Challenge Banner */}
          <div className="bg-gradient-to-r from-[#0f3a52] to-[#1fa7e1] text-white rounded-[28px] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div>
              <span className="px-3 py-1 rounded-full bg-[#ffb356] text-[#0f3a52] text-xs font-black uppercase tracking-wider inline-block mb-2">
                Bonus Challenge 🏆
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                The Grand Master Challenge
              </h2>
              <p className="text-xs sm:text-sm text-slate-100 font-semibold mt-1 max-w-lg">
                All 4 operators (+ − × ÷) combined in streak mode. Can you reach 15 correct in a row?
              </p>
            </div>

            <button
              onClick={() => startSession("mixed", "streak", 4, GUIDED_TRACKS.bonus[0])}
              className="px-8 py-3.5 rounded-full bg-[#ffb356] hover:bg-[#ffa73c] text-[#0f3a52] font-black text-sm transition-all shadow-lg shadow-[#ffb356]/30 hover:scale-105 shrink-0 cursor-pointer"
            >
              Start Challenge 🚀
            </button>
          </div>

          {/* 4 Operator Guided Tracks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Addition */}
            <div className="bg-white rounded-[28px] p-6 border border-[#0f3a52]/10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-black text-xl flex items-center justify-center">
                  +
                </span>
                <div>
                  <h3 className="text-lg font-black text-[#0f3a52]">Addition Track</h3>
                  <p className="text-xs font-semibold text-[#6b8494]">Mental sum speed & tens bridging</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {GUIDED_TRACKS.addition.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => startSession(stage.operator, "free", stage.level, stage)}
                    className="w-full text-left p-3.5 rounded-2xl bg-[#eff8ff]/50 hover:bg-[#eff8ff] border border-[#1fa7e1]/20 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-black text-[#0f3a52] block">{stage.name}</span>
                      <span className="text-[11px] font-semibold text-[#6b8494]">{stage.description}</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white text-[#1fa7e1] text-xs font-black shadow-xs">
                      Start →
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subtraction */}
            <div className="bg-white rounded-[28px] p-6 border border-[#0f3a52]/10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-blue-100 text-[#1fa7e1] font-black text-xl flex items-center justify-center">
                  −
                </span>
                <div>
                  <h3 className="text-lg font-black text-[#0f3a52]">Subtraction Track</h3>
                  <p className="text-xs font-semibold text-[#6b8494]">Rapid difference calculation</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {GUIDED_TRACKS.subtraction.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => startSession(stage.operator, "free", stage.level, stage)}
                    className="w-full text-left p-3.5 rounded-2xl bg-[#eff8ff]/50 hover:bg-[#eff8ff] border border-[#1fa7e1]/20 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-black text-[#0f3a52] block">{stage.name}</span>
                      <span className="text-[11px] font-semibold text-[#6b8494]">{stage.description}</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white text-[#1fa7e1] text-xs font-black shadow-xs">
                      Start →
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Multiplication */}
            <div className="bg-white rounded-[28px] p-6 border border-[#0f3a52]/10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 font-black text-xl flex items-center justify-center">
                  ×
                </span>
                <div>
                  <h3 className="text-lg font-black text-[#0f3a52]">Multiplication Track</h3>
                  <p className="text-xs font-semibold text-[#6b8494]">Times tables mastery from 2 to 12</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {GUIDED_TRACKS.multiplication.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => startSession(stage.operator, "free", stage.level, stage)}
                    className="w-full text-left p-3.5 rounded-2xl bg-[#eff8ff]/50 hover:bg-[#eff8ff] border border-[#1fa7e1]/20 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-black text-[#0f3a52] block">{stage.name}</span>
                      <span className="text-[11px] font-semibold text-[#6b8494]">{stage.description}</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white text-[#1fa7e1] text-xs font-black shadow-xs">
                      Start →
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Division */}
            <div className="bg-white rounded-[28px] p-6 border border-[#0f3a52]/10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 font-black text-xl flex items-center justify-center">
                  ÷
                </span>
                <div>
                  <h3 className="text-lg font-black text-[#0f3a52]">Division Track</h3>
                  <p className="text-xs font-semibold text-[#6b8494]">Whole number quotients without remainders</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {GUIDED_TRACKS.division.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => startSession(stage.operator, "free", stage.level, stage)}
                    className="w-full text-left p-3.5 rounded-2xl bg-[#eff8ff]/50 hover:bg-[#eff8ff] border border-[#1fa7e1]/20 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-black text-[#0f3a52] block">{stage.name}</span>
                      <span className="text-[11px] font-semibold text-[#6b8494]">{stage.description}</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white text-[#1fa7e1] text-xs font-black shadow-xs">
                      Start →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHOOSE YOUR OWN */}
      {!isPlaying && activeTab === "custom" && (
        <div className="bg-white rounded-[28px] p-8 sm:p-12 border border-[#0f3a52]/10 shadow-lg max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-[#0f3a52] mb-6 text-center">
            Customize Your Math Session
          </h2>

          {/* 1. Pick Operator */}
          <div className="mb-6">
            <label className="text-xs font-black uppercase tracking-wider text-[#6b8494] block mb-2">
              1. Choose Operator
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { op: "+", label: "Plus (+)" },
                { op: "-", label: "Minus (−)" },
                { op: "*", label: "Times (×)" },
                { op: "/", label: "Divide (÷)" },
                { op: "mixed", label: "Mixed 🎲" },
              ].map((item) => (
                <button
                  key={item.op}
                  onClick={() => setSelectedOperator(item.op as MathOperator)}
                  className={`py-3 rounded-xl font-black text-sm transition-all cursor-pointer ${
                    selectedOperator === item.op
                      ? "bg-[#1fa7e1] text-white shadow-sm"
                      : "bg-[#eff8ff] text-[#0f3a52] hover:bg-[#eff8ff]/80"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Pick Mode */}
          <div className="mb-6">
            <label className="text-xs font-black uppercase tracking-wider text-[#6b8494] block mb-2">
              2. Choose Practice Mode
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { mode: "free", label: "Free Practice", desc: "No pressure, 15 problems" },
                { mode: "clock", label: "Race The Clock", desc: "60-second speed test" },
                { mode: "streak", label: "Streak Mode", desc: "One mistake ends the run" },
              ].map((item) => (
                <button
                  key={item.mode}
                  onClick={() => setSelectedMode(item.mode as MathMode)}
                  className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                    selectedMode === item.mode
                      ? "border-[#1fa7e1] bg-[#eff8ff] text-[#0f3a52]"
                      : "border-[#0f3a52]/10 bg-white hover:bg-slate-50 text-[#6b8494]"
                  }`}
                >
                  <span className="text-xs font-black text-[#0f3a52] block mb-0.5">{item.label}</span>
                  <span className="text-[11px] font-semibold">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Pick Level */}
          <div className="mb-8">
            <label className="text-xs font-black uppercase tracking-wider text-[#6b8494] block mb-2">
              3. Starting Difficulty (Level 1–5)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl as DifficultyLevel)}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                    selectedLevel === lvl
                      ? "bg-[#0f3a52] text-white"
                      : "bg-[#eff8ff] text-[#0f3a52] hover:bg-[#eff8ff]/80"
                  }`}
                >
                  Level {lvl}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => startSession(selectedOperator, selectedMode, selectedLevel)}
            className="w-full py-4 rounded-full bg-[#1fa7e1] hover:bg-[#0d7fb0] text-white font-black text-base transition-all shadow-md shadow-[#1fa7e1]/25 hover:scale-102 cursor-pointer"
          >
            Launch Practice Arena 🚀
          </button>
        </div>
      )}

      {/* TAB 3: HISTORY & STATS */}
      {!isPlaying && activeTab === "history" && (
        <div className="bg-white rounded-[28px] p-6 sm:p-10 border border-[#0f3a52]/10 shadow-sm">
          <h2 className="text-xl font-black text-[#0f3a52] mb-6">
            Practice Session History
          </h2>

          {pastSessions.length === 0 ? (
            <div className="text-center py-12 text-sm font-semibold text-[#6b8494]">
              No practice sessions recorded yet. Start a session to see your progress here!
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
                      {s.operator === "*" ? "×" : s.operator === "/" ? "÷" : s.operator || "+"}
                    </span>
                    <div>
                      <span className="text-xs font-black text-[#0f3a52] block">
                        Mode: {s.mode.toUpperCase()} • Score: {s.score}
                      </span>
                      <span className="text-[11px] font-semibold text-[#6b8494]">
                        {new Date(s.createdAt).toLocaleDateString()} at{" "}
                        {new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-xs font-black text-emerald-600 block">{s.accuracy}%</span>
                      <span className="text-[10px] font-bold text-[#6b8494]">Accuracy</span>
                    </div>
                    <div>
                      <span className="text-xs font-black text-[#0f3a52] block">{s.durationSeconds}s</span>
                      <span className="text-[10px] font-bold text-[#6b8494]">Time</span>
                    </div>
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
