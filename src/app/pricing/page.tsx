"use client";

import { useState } from "react";
import Link from "next/link";

export default function PricingPage() {
  const [billing, setBilling] = useState<"yearly" | "monthly">("yearly");

  return (
    <div className="max-w-[1080px] mx-auto px-6 py-16">
      <div className="text-center max-w-[600px] mx-auto mb-12">
        <span className="inline-block px-3 py-1 rounded-full bg-[#eff8ff] text-[#1fa7e1] text-xs font-black uppercase tracking-wider mb-3">
          Simple family pricing
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-[#0f3a52] tracking-tight mb-4">
          One price for the whole family.
        </h1>
        <p className="text-lg font-bold text-[#3d5a6c] mb-8">
          No per-student math. Pay unlocks all features for every kid in your household.
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex p-1 rounded-full bg-white border border-[#0f3a52]/10 shadow-sm">
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={`px-5 py-2 rounded-full text-sm font-extrabold transition-all ${
              billing === "monthly"
                ? "bg-[#0f3a52] text-white shadow-sm"
                : "text-[#3d5a6c] hover:text-[#0f3a52]"
            }`}
          >
            Monthly ($19)
          </button>
          <button
            type="button"
            onClick={() => setBilling("yearly")}
            className={`px-5 py-2 rounded-full text-sm font-extrabold transition-all ${
              billing === "yearly"
                ? "bg-[#0f3a52] text-white shadow-sm"
                : "text-[#3d5a6c] hover:text-[#0f3a52]"
            }`}
          >
            Yearly ($99) <span className="text-[#75d06a] text-xs ml-1">Save 48%</span>
          </button>
        </div>
      </div>

      {/* Pricing Card */}
      <div className="max-w-[480px] mx-auto bg-white rounded-[28px] p-8 shadow-xl border border-[#0f3a52]/10">
        <div className="text-center pb-6 border-b border-[#0f3a52]/10">
          <span className="text-xs font-black uppercase tracking-wider text-[#1fa7e1]">
            Household Plan
          </span>
          <div className="mt-4 flex items-baseline justify-center gap-1">
            <span className="text-5xl font-black text-[#0f3a52] tracking-tight">
              {billing === "yearly" ? "$99" : "$19"}
            </span>
            <span className="text-base font-bold text-[#6b8494]">
              {billing === "yearly" ? "/year" : "/month"}
            </span>
          </div>
          <p className="text-sm font-bold text-[#3d5a6c] mt-2">
            {billing === "yearly"
              ? "Founding Member · Billed $99/year · Cancel anytime"
              : "Billed $19/month · Cancel anytime"}
          </p>
        </div>

        <ul className="py-6 space-y-3.5 border-b border-[#0f3a52]/10 text-sm font-bold text-[#0f3a52]">
          {[
            "Covers your entire household (unlimited kids)",
            "1,500+ structured lessons across History, Science, and Art",
            "~75 AI custom-generated lessons per month with guardrails",
            "Full Math Practice lab (all operators & modes)",
            "Full Touch-Typing course with live keyboard guide",
            "Calm Parent Dashboard (completed work & stuck points)",
            "No ads, no data tracking, 100% kid-safe",
          ].map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <span className="text-[#75d06a] font-black text-base shrink-0">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="pt-6">
          <Link
            href="/sign-up"
            className="w-full py-4 rounded-full bg-[#1fa7e1] text-white font-black text-center text-base hover:bg-[#0d7fb0] transition-colors shadow-lg shadow-[#1fa7e1]/25 block"
          >
            Start your free trial →
          </Link>
          <p className="text-xs font-bold text-[#6b8494] text-center mt-3">
            30-day money-back guarantee. Charge appears as ZEROTO1 on card.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-[680px] mx-auto mt-20">
        <h2 className="text-2xl font-black text-[#0f3a52] text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {[
            {
              q: "How many kids are included in one subscription?",
              a: "All of them. zeroto1.academy uses household pricing, meaning one monthly or annual plan covers all children in your household with separate profiles for each.",
            },
            {
              q: "Can I cancel at any time?",
              a: "Yes. You can cancel your subscription anytime with a single click. You will keep access until the end of your billing cycle.",
            },
            {
              q: "What is your refund policy?",
              a: "We offer a full 30-day money-back guarantee. If you or your kids are not satisfied, email hello@zeroto1.academy within 30 days and we will issue a full refund.",
            },
            {
              q: "Are the AI lessons safe for young children?",
              a: "Yes. Every custom lesson prompt is filtered through strict kid-safety guardrails and age-appropriate content moderation before the lesson is presented.",
            },
          ].map((faq) => (
            <details
              key={faq.q}
              className="p-5 rounded-2xl bg-white border border-[#0f3a52]/10 shadow-sm group"
            >
              <summary className="font-extrabold text-[#0f3a52] cursor-pointer flex justify-between items-center list-none">
                {faq.q}
                <span className="text-xl text-[#1fa7e1] group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm font-semibold text-[#3d5a6c] leading-relaxed">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
