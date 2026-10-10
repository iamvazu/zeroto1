"use client";

import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-[640px] mx-auto px-6 py-16">
      <div className="bg-white rounded-[28px] p-8 sm:p-12 shadow-xl border border-[#0f3a52]/10">
        <div className="mb-8">
          <span className="text-xs font-black uppercase tracking-wider text-[#1fa7e1]">
            We&apos;re here to help
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0f3a52] tracking-tight mt-1 mb-2">
            Contact Support
          </h1>
          <p className="text-sm font-semibold text-[#3d5a6c]">
            Have a question, feedback, or need help with your household subscription? Send us a note below or email us directly at{" "}
            <a
              href="mailto:hello@zeroto1.academy"
              className="text-[#1fa7e1] font-bold underline"
            >
              hello@zeroto1.academy
            </a>
            .
          </p>
        </div>

        {submitted ? (
          <div className="p-6 rounded-2xl bg-[#eff8ff] border border-[#1fa7e1]/20 text-center">
            <span className="text-3xl mb-2 block">💌</span>
            <h3 className="text-lg font-black text-[#0f3a52] mb-1">
              Thank you for reaching out!
            </h3>
            <p className="text-sm font-semibold text-[#3d5a6c]">
              We&apos;ve received your message and will get back to you within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#0f3a52] mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Parent or guardian name"
                className="w-full px-4 py-3 rounded-xl border border-[#0f3a52]/15 text-[#0f3a52] font-semibold text-sm focus:outline-none focus:border-[#1fa7e1] focus:ring-2 focus:ring-[#1fa7e1]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#0f3a52] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 rounded-xl border border-[#0f3a52]/15 text-[#0f3a52] font-semibold text-sm focus:outline-none focus:border-[#1fa7e1] focus:ring-2 focus:ring-[#1fa7e1]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#0f3a52] mb-1.5">
                Message
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help your family?"
                className="w-full px-4 py-3 rounded-xl border border-[#0f3a52]/15 text-[#0f3a52] font-semibold text-sm focus:outline-none focus:border-[#1fa7e1] focus:ring-2 focus:ring-[#1fa7e1]/20 transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-full bg-[#0f3a52] text-white font-black text-sm hover:bg-[#1fa7e1] transition-colors shadow-md mt-2"
            >
              Send Message →
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
