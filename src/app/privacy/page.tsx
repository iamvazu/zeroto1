export default function PrivacyPage() {
  return (
    <div className="max-w-[760px] mx-auto px-6 py-16">
      <div className="bg-white rounded-[28px] p-8 sm:p-12 shadow-xl border border-[#0f3a52]/10 space-y-6 text-[#3d5a6c] leading-relaxed">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#1fa7e1]">
            Legal & Compliance
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0f3a52] tracking-tight mt-1 mb-2">
            Privacy Policy
          </h1>
          <p className="text-xs font-bold text-[#6b8494]">
            Last updated: October 2026 · Regional Compliance: United States & India
          </p>
        </div>

        <p className="font-semibold">
          Zeroto1 Academy (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) respects your family&apos;s privacy and is committed to protecting the personal information of our users and their children. No advertising, no profiling, and no third-party behavioral trackers exist on our platform.
        </p>

        <h2 className="text-xl font-black text-[#0f3a52] pt-4">
          1. Information We Collect
        </h2>
        <p>
          We collect minimal information required to manage household subscriptions and learning progress:
        </p>
        <ul className="list-disc pl-5 space-y-2 font-medium">
          <li><strong>Parent / Household Account Data:</strong> Name, email address, password hash, and billing information (processed securely through Stripe with statement descriptor ZEROTO1).</li>
          <li><strong>Child Profile Data:</strong> Display name or nickname, age band, and lesson progress records. We do not require or collect full legal names, physical addresses, or photos of children.</li>
          <li><strong>Learning Activity:</strong> Lessons completed, quiz answers, and custom lesson queries to personalize review and track stuck points calmly without grading pressure.</li>
        </ul>

        <h2 className="text-xl font-black text-[#0f3a52] pt-4">
          2. COPPA Compliance (United States)
        </h2>
        <p>
          Zeroto1 Academy complies strictly with the Children&apos;s Online Privacy Protection Act (COPPA). Household accounts must be created by a parent or verified guardian. We never condition a child&apos;s participation on disclosing more personal information than is reasonably necessary. Parents have full access to review, edit, or delete their children&apos;s profiles at any time through the Parent Dashboard.
        </p>

        <h2 className="text-xl font-black text-[#0f3a52] pt-4">
          3. India DPDP Act Compliance (Digital Personal Data Protection Act)
        </h2>
        <p>
          For families residing in India, Zeroto1 Academy complies with the Digital Personal Data Protection (DPDP) Act. We process children&apos;s data only with verifiable parental consent. We do not engage in tracking, behavioral monitoring, or targeted advertising directed at children. Parents retain full rights of access, correction, erasure, and grievance redressal as recognized data principals.
        </p>

        <h2 className="text-xl font-black text-[#0f3a52] pt-4">
          4. AI Safety & Guardrails
        </h2>
        <p>
          Custom lesson prompts submitted by children are processed solely to generate safe educational content through our multi-stage moderation pipeline. Prompts are never used to train public foundation AI models and are stripped of PII.
        </p>

        <h2 className="text-xl font-black text-[#0f3a52] pt-4">
          5. Contact & Data Deletion
        </h2>
        <p>
          If you have questions about this policy or wish to delete your household and child profiles, email us anytime at{" "}
          <a href="mailto:hello@zeroto1.academy" className="text-[#1fa7e1] font-bold underline">
            hello@zeroto1.academy
          </a>.
        </p>
      </div>
    </div>
  );
}
