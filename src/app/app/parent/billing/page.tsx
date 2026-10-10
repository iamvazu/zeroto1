"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface BillingInfo {
  isEntitled: boolean;
  status: "ACTIVE" | "TRIALING" | "CANCELED" | "INACTIVE" | "PAST_DUE";
  plan: "MONTHLY" | "YEARLY" | null;
  currency: "USD" | "INR" | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  statementDescriptor: string;
}

export default function ParentBillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [region, setRegion] = useState<"US" | "IN">("US");
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");

  const loadBilling = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/billing/status");
      if (res.status === 401) {
        router.push("/sign-in?from=/app/parent/billing");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setBilling(data);
      }

      // Also get household region
      const regionRes = await fetch("/api/household/region");
      if (regionRes.ok) {
        const rData = await regionRes.json();
        if (rData.region) setRegion(rData.region);
      }
    } catch (err) {
      console.error("Failed to load billing status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilling();
  }, []);

  const handleCheckout = async (plan: "MONTHLY" | "YEARLY") => {
    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          region,
          successUrl: `${window.location.origin}/app/parent/billing?status=success`,
          cancelUrl: `${window.location.origin}/app/parent/billing?canceled=true`,
        }),
      });

      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setFeedback({ type: "error", text: data.error || "Failed to initiate checkout" });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error during checkout" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel? You will keep full household access until the end of your billing cycle.")) {
      return;
    }

    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: "success",
          text: "Your subscription has been canceled. You retain full access until your billing period ends.",
        });
        await loadBilling();
      } else {
        setFeedback({ type: "error", text: data.error || "Failed to cancel subscription" });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error during cancellation" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await fetch("/api/billing/refund-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: refundReason }),
      });
      const data = await res.json();
      if (data.success) {
        setShowRefundModal(false);
        setFeedback({
          type: "success",
          text: data.message || "Refund request submitted to hello@zeroto1.academy.",
        });
      } else {
        setFeedback({ type: "error", text: data.error || "Failed to submit refund request" });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error submitting refund request" });
    } finally {
      setActionLoading(false);
    }
  };

  const isUs = region === "US";
  const monthlyPriceStr = isUs ? "$19/mo" : "₹999/mo";
  const yearlyPriceStr = isUs ? "$99/yr" : "₹7,999/yr";

  return (
    <div className="min-h-screen bg-[#fff8f0] pb-20">
      <div className="max-w-[1080px] mx-auto px-6 pt-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-xs font-black uppercase tracking-wider text-[#6b8494]">
          <Link href="/app/parent" className="hover:text-[#0f3a52] transition-colors">
            ← Parent Dashboard
          </Link>
          <span>/</span>
          <span className="text-[#0f3a52]">Household Billing</span>
        </div>

        {/* Page Header */}
        <div className="mb-10">
          <div className="inline-block px-3 py-1 rounded-full bg-[#eff8ff] text-[#1fa7e1] text-xs font-black uppercase tracking-wider mb-2">
            Subscription & Entitlements
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0f3a52] tracking-tight">
            Family Subscription
          </h1>
          <p className="text-base font-bold text-[#6b8494] mt-1">
            One household plan covering unlimited kids. No per-student math.
          </p>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mb-8 p-4 rounded-2xl text-sm font-bold border ${
              feedback.type === "success"
                ? "bg-[#eaf8ea] border-[#75d06a]/40 text-[#256c20]"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {feedback.text}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-[28px] p-12 text-center border border-[#0f3a52]/10 shadow-sm text-sm font-bold text-[#6b8494]">
            Loading subscription details...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Status Card */}
            <div className="md:col-span-2 bg-white rounded-[28px] p-8 border border-[#0f3a52]/10 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-[#0f3a52]/10">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-[#6b8494]">
                    Current Status
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <h2 className="text-2xl font-black text-[#0f3a52]">
                      {billing?.isEntitled
                        ? billing?.cancelAtPeriodEnd
                          ? "Canceled (Active until period end)"
                          : "Active Household Plan"
                        : "No Active Subscription"}
                    </h2>
                    <span
                      className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                        billing?.isEntitled
                          ? billing?.cancelAtPeriodEnd
                            ? "bg-[#ffb356]/20 text-[#a06212]"
                            : "bg-[#75d06a]/20 text-[#246b1f]"
                          : "bg-gray-100 text-[#6b8494]"
                      }`}
                    >
                      {billing?.status}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black uppercase tracking-wider text-[#6b8494]">
                    Plan Type
                  </span>
                  <p className="text-lg font-black text-[#0f3a52] mt-0.5">
                    {billing?.plan ? `${billing.plan} (${billing.currency})` : "Free Tier"}
                  </p>
                </div>
              </div>

              {/* Details & Dates */}
              {billing?.isEntitled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-[#eff8ff]/50 rounded-2xl border border-[#1fa7e1]/10 text-sm">
                  <div>
                    <span className="text-xs font-bold text-[#6b8494] uppercase tracking-wider">
                      {billing.cancelAtPeriodEnd ? "Access Expires On" : "Next Renewal Date"}
                    </span>
                    <p className="font-black text-[#0f3a52] text-base mt-0.5">
                      {billing.currentPeriodEnd
                        ? new Date(billing.currentPeriodEnd).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Ongoing"}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-[#6b8494] uppercase tracking-wider">
                      Statement Descriptor
                    </span>
                    <p className="font-black text-[#0f3a52] text-base mt-0.5">
                      {billing.statementDescriptor || "ZEROTO1"}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions & Plan Buttons */}
              {!billing?.isEntitled ? (
                <div className="space-y-4 pt-2">
                  <h3 className="text-lg font-black text-[#0f3a52]">Choose Your Plan</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleCheckout("MONTHLY")}
                      className="p-5 rounded-2xl border-2 border-[#1fa7e1]/20 hover:border-[#1fa7e1] bg-[#eff8ff]/30 text-left transition-all hover:shadow-md cursor-pointer disabled:opacity-50"
                    >
                      <span className="text-xs font-black uppercase text-[#1fa7e1] block mb-1">
                        Monthly
                      </span>
                      <span className="text-2xl font-black text-[#0f3a52] block">
                        {monthlyPriceStr}
                      </span>
                      <span className="text-xs font-bold text-[#6b8494] block mt-1">
                        Cancel anytime · Billed monthly
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleCheckout("YEARLY")}
                      className="p-5 rounded-2xl border-2 border-[#75d06a]/40 hover:border-[#75d06a] bg-[#eaf8ea]/30 text-left transition-all hover:shadow-md cursor-pointer disabled:opacity-50 relative"
                    >
                      <span className="absolute top-3 right-3 px-2 py-0.5 bg-[#75d06a] text-white text-[10px] font-black rounded-full uppercase">
                        Save 48%
                      </span>
                      <span className="text-xs font-black uppercase text-[#256c20] block mb-1">
                        Yearly
                      </span>
                      <span className="text-2xl font-black text-[#0f3a52] block">
                        {yearlyPriceStr}
                      </span>
                      <span className="text-xs font-bold text-[#6b8494] block mt-1">
                        Founding Member · Billed yearly
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3 pt-4">
                  {!billing.cancelAtPeriodEnd && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleCancel}
                      className="px-5 py-2.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-xs font-extrabold transition-all cursor-pointer disabled:opacity-50"
                    >
                      Cancel Subscription
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowRefundModal(true)}
                    className="px-5 py-2.5 rounded-full border border-[#0f3a52]/15 text-[#0f3a52] hover:bg-slate-50 text-xs font-extrabold transition-all cursor-pointer"
                  >
                    Request 30-Day Refund
                  </button>
                </div>
              )}
            </div>

            {/* Guarantees & Information Sidebar */}
            <div className="bg-white rounded-[28px] p-8 border border-[#0f3a52]/10 shadow-sm space-y-6">
              <h3 className="text-base font-black text-[#0f3a52]">Our Family Promise</h3>
              
              <ul className="space-y-4 text-xs font-bold text-[#3d5a6c]">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#75d06a] text-base leading-none">✓</span>
                  <span><strong>30-day money-back guarantee:</strong> email hello@zeroto1.academy anytime within 30 days.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#75d06a] text-base leading-none">✓</span>
                  <span><strong>Card Descriptor:</strong> charges appear as <code className="px-1.5 py-0.5 bg-slate-100 rounded text-[#0f3a52] font-mono font-bold">ZEROTO1</code>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#75d06a] text-base leading-none">✓</span>
                  <span><strong>Cancel Anytime:</strong> keep full access until your billing period concludes.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#75d06a] text-base leading-none">✓</span>
                  <span><strong>Safe for Kids:</strong> COPPA compliant, zero ads, zero data tracking or third-party sharing.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 30-Day Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-[#0f3a52]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-[480px] w-full p-8 shadow-2xl border border-[#0f3a52]/10">
            <h3 className="text-xl font-black text-[#0f3a52] mb-2">
              30-Day Money-Back Guarantee
            </h3>
            <p className="text-xs font-bold text-[#6b8494] mb-6">
              We want Zeroto1 Academy to delight your family. If it wasn&apos;t the right fit, we will process a full refund to your original payment method.
            </p>

            <form onSubmit={handleRefund} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-[#0f3a52] block mb-2">
                  Optional reason or feedback:
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="How can we make Zeroto1 Academy better for your kids?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-[#0f3a52]/15 text-sm font-bold text-[#0f3a52] placeholder:text-[#6b8494]/60 focus:outline-none focus:border-[#1fa7e1]"
                />
              </div>

              <div className="p-3 bg-[#eff8ff] rounded-2xl text-[11px] font-bold text-[#1fa7e1]">
                This will automatically forward your request to <strong>hello@zeroto1.academy</strong>.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-extrabold text-[#6b8494] hover:text-[#0f3a52] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-full bg-[#0f3a52] hover:bg-[#154a67] text-white text-xs font-black transition-all cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Submitting..." : "Submit Refund Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
