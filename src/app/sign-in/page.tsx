"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("from") || "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sign in");
      }

      // Check if household has kids; if so and none selected, auto-select first or send to select-profile
      const kids = data.household?.kidProfiles || [];
      if (kids.length === 1) {
        await fetch("/api/kids/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kidProfileId: kids[0].id }),
        });
      }

      router.push(kids.length > 1 ? "/app/select-profile" : returnTo);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMsg(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }
      setResetMsg(data.message || "Password updated successfully! You can now sign in.");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setResetMsg(err.message);
      } else {
        setResetMsg("Failed to reset password.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="max-w-[440px] mx-auto px-6 py-20">
      <div className="bg-white rounded-[28px] p-8 sm:p-10 shadow-xl border border-[#0f3a52]/10">
        <div className="text-center mb-8">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1fa7e1] to-[#63c5f1] text-white inline-flex items-center justify-center font-black text-sm tracking-tight shadow-md shadow-[#1fa7e1]/30 mb-3">
            0→1
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0f3a52] tracking-tight">
            Sign in
          </h1>
          <p className="text-sm font-bold text-[#6b8494] mt-1">
            Welcome back to Zeroto1 Academy
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="signin-email" className="block text-xs font-black uppercase tracking-wider text-[#0f3a52] mb-1.5">
              Parent / Household Email
            </label>
            <input
              id="signin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@example.com"
              className="w-full px-4 py-3 rounded-xl border border-[#0f3a52]/15 text-[#0f3a52] font-semibold text-sm focus:outline-none focus:border-[#1fa7e1] focus:ring-2 focus:ring-[#1fa7e1]/20 transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="signin-password" className="block text-xs font-black uppercase tracking-wider text-[#0f3a52]">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowForgot(!showForgot);
                  setResetEmail(email);
                }}
                className="text-xs font-bold text-[#1fa7e1] hover:underline"
              >
                {showForgot ? "Close reset" : "Forgot?"}
              </button>
            </div>
            <input
              id="signin-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-[#0f3a52]/15 text-[#0f3a52] font-semibold text-sm focus:outline-none focus:border-[#1fa7e1] focus:ring-2 focus:ring-[#1fa7e1]/20 transition-all"
            />
          </div>

          {showForgot && (
            <div className="p-4 bg-[#eff8ff] rounded-2xl border border-[#1fa7e1]/20 space-y-3">
              <h3 className="text-xs font-black text-[#0f3a52] uppercase tracking-wider">
                Reset Password
              </h3>
              <input
                type="email"
                placeholder="Parent Email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#0f3a52]/15 font-semibold text-[#0f3a52]"
              />
              <input
                type="password"
                placeholder="New Password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#0f3a52]/15 font-semibold text-[#0f3a52]"
              />
              {resetMsg && (
                <p className="text-xs font-bold text-[#0f3a52]">{resetMsg}</p>
              )}
              <button
                type="button"
                disabled={resetLoading}
                onClick={handleResetPassword}
                className="w-full py-2 bg-[#1fa7e1] text-white rounded-lg text-xs font-black hover:bg-[#0d7fb0] transition-colors"
              >
                {resetLoading ? "Updating..." : "Update Password"}
              </button>
            </div>
          )}

          <button
            id="signin-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-[#0f3a52] text-white font-black text-sm hover:bg-[#1fa7e1] transition-colors shadow-md mt-2 disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign in to Household →"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#0f3a52]/10 text-center text-xs font-bold text-[#6b8494]">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-[#1fa7e1] font-black hover:underline">
            Start a free trial
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="max-w-[440px] mx-auto px-6 py-20 text-center font-bold text-[#6b8494]">Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
