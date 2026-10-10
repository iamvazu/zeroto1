"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if session exists
    fetch("/api/auth/me")
      .then((res) => {
        setIsAuthenticated(res.ok);
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, [pathname]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/subjects", label: "Explore" },
    { href: "/pricing", label: "Pricing" },
    { href: "/try-a-lesson", label: "Try a lesson" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#fff8f0]/90 backdrop-blur-md border-b border-[#0f3a52]/10">
      <div className="max-w-[1080px] mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1fa7e1] to-[#63c5f1] text-white flex items-center justify-center font-black text-sm tracking-tight shadow-md shadow-[#1fa7e1]/30">
            0→1
          </span>
          <span className="font-black text-[#0f3a52] text-[15px] tracking-tight group-hover:text-[#1fa7e1] transition-colors">
            Zeroto1 Academy
          </span>
        </Link>

        {/* Pill Nav */}
        <nav className="hidden md:flex items-center gap-1 p-1.5 rounded-full border border-[#0f3a52]/10 bg-white/80 shadow-sm shadow-[#0f3a52]/5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-full text-[13px] font-extrabold transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-[#eff8ff] text-[#0f3a52]"
                    : "text-[#3d5a6c] hover:text-[#0f3a52] hover:bg-black/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              href="/app"
              className="px-4 py-2 rounded-full text-[13px] font-extrabold bg-[#1fa7e1] text-white hover:bg-[#0d7fb0] transition-colors shadow-sm"
            >
              Learning Space →
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-[14px] font-extrabold text-[#3d5a6c] hover:text-[#0f3a52] px-3 py-2 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 rounded-full text-[13px] font-extrabold bg-[#0f3a52] text-white hover:bg-[#1fa7e1] transition-colors shadow-sm"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
