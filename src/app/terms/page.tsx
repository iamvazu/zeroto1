export default function TermsPage() {
  return (
    <div className="max-w-[760px] mx-auto px-6 py-16">
      <div className="bg-white rounded-[28px] p-8 sm:p-12 shadow-xl border border-[#0f3a52]/10 space-y-6 text-[#3d5a6c] leading-relaxed">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#1fa7e1]">
            Legal
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0f3a52] tracking-tight mt-1 mb-2">
            Terms of Service
          </h1>
          <p className="text-xs font-bold text-[#6b8494]">
            Last updated: October 2026
          </p>
        </div>

        <p className="font-semibold">
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of Zeroto1 Academy. By creating an account or using the service, you agree to these Terms. If you do not agree, do not use the service.
        </p>

        <h2 className="text-xl font-black text-[#0f3a52] pt-4">
          1. The Service
        </h2>
        <p>
          Zeroto1 Academy is a self-directed learning platform for children, offering built-in lessons across History, Science, and Art, custom lesson generation, and math and touch-typing practice. The service is intended to supplement curiosity; it is not a replacement for school or a full accredited curriculum.
        </p>

        <h2 className="text-xl font-black text-[#0f3a52] pt-4">
          2. Subscriptions, Household Plan & Refunds
        </h2>
        <ul className="list-disc pl-5 space-y-2 font-medium">
          <li><strong>Household Plan:</strong> Zeroto1 Academy is offered as a single household price covering your immediate family — no per-student fees.</li>
          <li><strong>Billing:</strong> Plans renew automatically each month or year until cancelled via your parent dashboard.</li>
          <li><strong>30-Day Money-Back Guarantee:</strong> Refunds are available within 30 days of initial payment by emailing <a href="mailto:hello@zeroto1.academy" className="text-[#1fa7e1] font-bold underline">hello@zeroto1.academy</a>. The card statement descriptor will appear as <strong>ZEROTO1</strong>.</li>
        </ul>

        <h2 className="text-xl font-black text-[#0f3a52] pt-4">
          3. Acceptable Use & Child Safety
        </h2>
        <p>
          You agree not to bypass safety guardrails, attempt prompt injection to generate harmful material, or use the service for commercial distribution. We reserve the right to suspend accounts that violate child safety policies.
        </p>

        <h2 className="text-xl font-black text-[#0f3a52] pt-4">
          4. Contact
        </h2>
        <p>
          Questions about these Terms? Email us at{" "}
          <a href="mailto:hello@zeroto1.academy" className="text-[#1fa7e1] font-bold underline">
            hello@zeroto1.academy
          </a>.
        </p>
      </div>
    </div>
  );
}
