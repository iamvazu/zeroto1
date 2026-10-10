"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignUpPage() {
  const router = useRouter();
  const [parentName, setParentName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [kidName, setKidName] = useState("");
  const [ageBand, setAgeBand] = useState("8-11");
  const [region, setRegion] = useState("US");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Sign up parent & create household
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parentName,
          email,
          password,
          region,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      // 2. If a kid name was entered, create their initial profile
      if (kidName.trim()) {
        const kidRes = await fetch("/api/kids", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: kidName.trim(),
            ageBand,
            avatar: "🚀",
          }),
        });

        if (kidRes.ok) {
          const kidData = await kidRes.json();
          // Select this kid
          await fetch("/api/kids/select", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kidProfileId: kidData.kidProfile.id }),
          });
        }
      }

      // 3. Navigate to app
      router.push("/app");
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

  return (
    <div className="max-w-[480px] mx-auto px-6 py-16">
      <div className="bg-white rounded-[28px] p-8 sm:p-10 shadow-xl border border-[#0f3a52]/10">
        <div className="text-center mb-8">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1fa7e1] to-[#63c5f1] text-white inline-flex items-center justify-center font-black text-sm tracking-tight shadow-md shadow-[#1fa7e1]/30 mb-3">
            0→1
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0f3a52] tracking-tight">
            Start a free trial
          </h1>
          <p className="text-sm font-bold text-[#6b8494] mt-1">
            One household account covers your whole family
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="signup-parent-name" className="block text-xs font-black uppercase tracking-wider text-[#0f3a52] mb-1.5">
              Parent / Guardian Name
            </label>
            <input
              id="signup-parent-name"
              type="text"
              required
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="e.g. Sarah Miller"
              className="w-full px-4 py-3 rounded-xl border border-[#0f3a52]/15 text-[#0f3a52] font-semibold text-sm focus:outline-none focus:border-[#1fa7e1] focus:ring-2 focus:ring-[#1fa7e1]/20 transition-all"
            />
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-xs font-black uppercase tracking-wider text-[#0f3a52] mb-1.5">
              Email Address
            </label>
            <input
              id="signup-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@example.com"
              className="w-full px-4 py-3 rounded-xl border border-[#0f3a52]/15 text-[#0f3a52] font-semibold text-sm focus:outline-none focus:border-[#1fa7e1] focus:ring-2 focus:ring-[#1fa7e1]/20 transition-all"
            />
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-xs font-black uppercase tracking-wider text-[#0f3a52] mb-1.5">
              Create Password
            </label>
            <input
              id="signup-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-4 py-3 rounded-xl border border-[#0f3a52]/15 text-[#0f3a52] font-semibold text-sm focus:outline-none focus:border-[#1fa7e1] focus:ring-2 focus:ring-[#1fa7e1]/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="signup-kid-name" className="block text-xs font-black uppercase tracking-wider text-[#0f3a52] mb-1.5">
                First Child&apos;s Name
              </label>
              <input
                id="signup-kid-name"
                type="text"
                value={kidName}
                onChange={(e) => setKidName(e.target.value)}
                placeholder="e.g. Riley"
                className="w-full px-4 py-3 rounded-xl border border-[#0f3a52]/15 text-[#0f3a52] font-semibold text-sm focus:outline-none focus:border-[#1fa7e1] focus:ring-2 focus:ring-[#1fa7e1]/20 transition-all"
              />
            </div>
            <div>
              <label htmlFor="signup-age-band" className="block text-xs font-black uppercase tracking-wider text-[#0f3a52] mb-1.5">
                Age Band
              </label>
              <select
                id="signup-age-band"
                value={ageBand}
                onChange={(e) => setAgeBand(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#0f3a52]/15 text-[#0f3a52] font-semibold text-sm focus:outline-none focus:border-[#1fa7e1] focus:ring-2 focus:ring-[#1fa7e1]/20 transition-all bg-white"
              >
                <option value="5-8">Ages 5–8</option>
                <option value="8-11">Ages 8–11</option>
                <option value="11-15">Ages 11–15</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="signup-region" className="block text-xs font-black uppercase tracking-wider text-[#0f3a52] mb-1.5">
              Billing Region
            </label>
            <select
              id="signup-region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#0f3a52]/15 text-[#0f3a52] font-semibold text-sm focus:outline-none focus:border-[#1fa7e1] focus:ring-2 focus:ring-[#1fa7e1]/20 transition-all bg-white"
            >
              <option value="US">United States (USD)</option>
              <option value="IN">India (INR)</option>
            </select>
          </div>

          <button
            id="signup-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full bg-[#1fa7e1] text-white font-black text-sm hover:bg-[#0d7fb0] transition-colors shadow-lg shadow-[#1fa7e1]/25 mt-4 disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Creating your household..." : "Create Household Account →"}
          </button>
        </form>

        <p className="text-xs font-semibold text-[#6b8494] text-center mt-4">
          By signing up, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-[#0f3a52]">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-[#0f3a52]">
            Privacy Policy
          </Link>
          .
        </p>

        <div className="mt-8 pt-6 border-t border-[#0f3a52]/10 text-center text-xs font-bold text-[#6b8494]">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-[#1fa7e1] font-black hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
