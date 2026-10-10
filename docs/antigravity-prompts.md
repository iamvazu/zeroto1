# zeroto1.academy — Antigravity (Gemini 3.8) Build Prompts

**How to use:** Work sprints in order. For each sprint, **paste the corresponding prompt below into Google Antigravity** as the task instruction. Antigravity runs with no memory of prior chats, so each prompt is self-contained. After it finishes, run the sprint's VERIFY gate from `SPRINTS.md` — only advance when green.

**Context to prepend (optional but recommended once per session):**
> "You are building zeroto1.academy, a self-directed learning app for kids (5–15) across History, Science, Art, with AI lesson generation, math + touch-typing practice, a parent dashboard, and household subscriptions for US + India. Full PRD is in docs/PRD.md and the sprint plan is in docs/SPRINTS.md. Read both before starting. The existing marketing site (static HTML/CSS) in the repo root is the design source of truth — match its palette (ink #0f3a52, blue #1fa7e1, cream #fff8f0, sky #eff8ff, amber #ffb356, green #75d06a), Nunito font, radius 28px, max-width 1080px. Work test-driven where possible and don't claim a step is done without showing it runs."

---

## S1 — Project Scaffold & Design Tokens

> Set up the zeroto1.academy app as a Next.js (App Router) + TypeScript + Tailwind project inside this repo (do not touch the existing static marketing HTML files — they are the design reference; you may reuse their assets).
>
> 1. Initialize Next.js App Router + TypeScript + Tailwind. Configure ESLint + Prettier.
> 2. Port the design tokens from `assets/style.css` into the Tailwind theme: colors (--ink #0f3a52, --ink-soft #3d5a6c, --muted #6b8494, --cream #fff8f0, --sky #eff8ff, --sky-deep #d9f0fb, --blue #1fa7e1, --blue-dark #0d7fb0, --blue-soft #63c5f1, --amber #ffb356, --green #75d06a), the Nunito font (self-hosted from assets/fonts/Nunito-Variable.ttf), border radius 28px, and max content width 1080px (1180px for wide sections).
> 3. Build a shared layout: a sticky header with the brand mark "0→1" + "zeroto1.academy", a pill navigation (Home, Pricing, Try a lesson, Contact), a region switch placeholder (🇺🇸 US / 🇮🇳 India), and Sign in / Sign up buttons. Build a matching footer (brand, nav links, legal line "© 2026 zeroto1.academy").
> 4. Create these routes, each rendering a minimal but on-brand page: `/`, `/pricing`, `/try-a-lesson`, `/sign-in`, `/sign-up`, `/privacy`, `/terms`, `/contact`. Match the structure and copy of the existing static pages (index.html, pricing.html, etc.) but as React components.
> 5. Add `.env.example`, and make sure no secrets are committed.
>
> **Done means:** `npm run dev` starts clean, all 8 routes return 200, the home page uses Nunito + the correct palette + radius 28px + 1080px max-width, header/footer match the static site, `npm run lint` is clean, and `npm run build` succeeds. Show me the dev server running and each route rendering before you finish.

---

## S2 — Database & Data Model

> In the zeroto1.academy Next.js app, set up PostgreSQL with Prisma (or Drizzle) and implement the full data model from the PRD (docs/PRD.md §7.3).
>
> 1. Define these tables with correct relationships and indexes: `households`, `users`, `kid_profiles`, `subjects`, `units`, `lessons`, `lesson_steps`, `lesson_progress`, `custom_lessons`, `practice_sessions`, `subscriptions`, `ai_jobs`, `moderation_logs`. Add a composite index on `lesson_progress(kid_profile_id, lesson_id)`.
> 2. A `lesson` belongs to a `unit`; a `unit` belongs to a `subject`. A `lesson` has ordered `lesson_steps` of type Hook | Video | Read | Activity | Practice | Deep Dive.
> 3. Wire up migrations (`prisma migrate dev` or drizzle-kit).
> 4. Write a seed script (`npm run db:seed`) that creates: 3 subjects (History, Science, Art), at least 2 units, and 10 sample lessons — each with all 6 steps in order, a big question, a "by the end" line, and a banner.
>
> **Done means:** migrations run clean from an empty DB, `npm run db:seed` populates the data, and a query returns a lesson with its 6 steps in the correct fixed order (Hook→Video→Read→Activity→Practice→Deep Dive). Show the migration running, the seed output, and the query result before you finish.

---

## S3 — Auth & Household/Profile Model

> Add authentication and the household model to zeroto1.academy.
>
> 1. Parent/guardian auth: sign-up and sign-in with email + password (hash passwords with bcrypt/argon2 — never store plaintext), plus password reset. Use httpOnly-cookie JWT sessions OR integrate the auth provider we choose (Clerk/Supabase Auth) — ask me which before wiring it in.
> 2. On sign-up, create a `household` and capture the region (US or India).
> 3. Kid profiles: full CRUD under a household (display name, avatar, age band 5-8/8-11/11-15). Kids do NOT log in — they use a profile picker.
> 4. Protect app routes with middleware; unauthenticated users hitting `/app/*` redirect to `/sign-in`.
>
> **Done means:** sign-up creates a household + region; sign in/out works and the session survives a reload; you can add/edit/delete a kid profile and the picker shows them; unauthenticated access to /app/* redirects to sign-in; and passwords are hashed in the DB. Demonstrate each flow before you finish.

---

## S4 — Subjects, Units & Lesson Browsing

> Build content browsing for zeroto1.academy using the real database.
>
> 1. Subject index page: cards for History, Science, Art.
> 2. Unit view under each subject: list its lessons with progress state (Not started / In progress / Done), plus a "Start here" / "Open next lesson" affordance.
> 3. Lesson overview page: banner image, the big question, and the "by the end" line.
> 4. Wire everything to real DB data.
>
> **Done means:** `/subjects` lists the 3 subjects; clicking one opens its units; a unit page lists lessons with correct progress state; the lesson overview shows the big question + by-the-end + banner; and it all works for a logged-in kid profile. Show each page rendering with real data before you finish.

---

## S5 — The Lesson Player (6-step flow)

> Build the core lesson player for zeroto1.academy — a single unified component that renders ANY lesson (built-in now, AI-generated later) identically.
>
> 1. A step router that always renders steps in this fixed order: Hook → Video → Read → Activity → Practice → Deep Dive.
> 2. Each step component marks itself complete and saves progress; leaving and returning resumes at the next incomplete step.
> 3. Hook: short text + image. Video: YouTube embed restricted to an allow-list of kid-friendly channels. Read: chunked guided passage. Activity: a simple tap/sort/observe interaction. Practice: a 3–5 question quiz that is NON-blocking — a wrong answer shows a gentle re-explanation and does not stop progress. Deep Dive: show follow-up prompts (can be stubbed until Sprint 8).
> 4. Progress writes to `lesson_progress` per step.
>
> **Done means:** you can play a built-in lesson start-to-finish through all 6 steps; progress persists and a refresh resumes at the correct step; a wrong quiz answer shows a re-explanation without blocking; steps always render in the fixed order; and video only embeds allow-listed channels. Walk me through a full playthrough before you finish.

---

## S6 — Progress Tracking & "Try a Lesson" Preview

> Finish progress tracking and gate the free preview in zeroto1.academy.
>
> 1. Fully wire `lesson_progress`: per-step completion, quiz scores, timestamps, and overall completion state.
> 2. Add "Continue learning" / "Up next" recommendations on the home screen.
> 3. Free preview: a curated set of lessons must be playable WITHOUT an account, with an upgrade CTA at the end. Logged-out users must not be able to open non-preview lessons.
>
> **Done means:** progress shows the correct percentage and "Done" after completing a lesson; "Up next" recommends the right lesson; a preview lesson plays fully while logged out and shows the paywall CTA at the end; and logged-out users are blocked from non-preview lessons. Demonstrate the logged-out preview and the gating before you finish.

---

## S7 — AI Middleware Core

> Build the AI middleware layer for zeroto1.academy — provider-agnostic, no user-facing feature yet.
>
> 1. Create an AI middleware service with a provider abstraction (LLM vendor swappable purely via env var). Implement prompt templates for five tasks: Classify, Generate Lesson, Generate Deep Dive, Re-explain, Moderate.
> 2. Add Redis caching: identical input returns the cached output (log cache hits).
> 3. Add rate limiting plus a per-household custom-lesson allowance counter (75 per 30 days, stored durably).
> 4. Add structured logging and cost/latency metrics. Create the `ai_jobs` table for async generation tracking.
> 5. No secrets in logs.
>
> **Done means:** a test call to Classify returns a subject + age band + safety verdict; calling the same input twice produces a cache hit on the second; a burst trips the rate limit; the provider is swappable via env; and no secrets appear in logs. Show the test calls and the cache-hit log before you finish.

---

## S8 — Guardrails & Lesson Generation

> Implement safe AI lesson generation in zeroto1.academy, conforming to the strict JSON schema in the PRD (docs/PRD.md §6.3).
>
> 1. Pipeline: Classify → Moderate(input) → Generate Lesson → Moderate(output). 
> 2. The generated lesson MUST conform exactly to the PRD JSON schema (title, subject, ageBand, summary, bigQuestion, byTheEnd, and all 6 steps with their required fields).
> 3. Unsafe/inappropriate prompts are rejected or safely redirected. Failed output moderation produces a SAFE FALLBACK, never an error page.
> 4. Save generated lessons to `custom_lessons`, linked to the asking kid, and decrement the household allowance.
> 5. The generated lesson must render through the SAME lesson player as built-in lessons.
>
> **Done means:** "How do whales talk?" generates a full schema-valid lesson that plays in the unified player; an unsafe test prompt is blocked with a safe response (no error, no unsafe content); output moderation blocks a known-bad generation; and the allowance decrements. Show the generated JSON, the playthrough, and the blocked-prompt test before you finish.

---

## S9 — Custom Lesson UX & Deep Dive

> Build the kid-facing "Make your own lesson" experience and activate Deep Dive in zeroto1.academy.
>
> 1. A question input with example suggestions ("How do whales talk?", etc.).
> 2. Async generation with a friendly progress UI (target < 30s). On completion the lesson opens in the unified player and is saved to the kid's library.
> 3. Deep Dive now generates real follow-up questions from the lesson topic + the kid's own questions.
> 4. Allowance UI: "X of 75 custom lessons left this month." When exhausted, show a clear upsell.
> 5. Re-asking the same question returns the cached lesson.
>
> **Done means:** a kid types a question, sees progress, and gets a playable lesson; the allowance counter decrements and displays correctly; Deep Dive returns relevant follow-ups; the same question returns the cached lesson; and an exhausted allowance shows the upsell. Walk me through generating a lesson and exhausting/reusing the allowance before you finish.

---

## S10 — Math Practice

> Build the math practice engine for zeroto1.academy.
>
> 1. Operators + − × ÷. Three modes: free practice, race-the-clock, and streak ("how many in a row").
> 2. Adaptive difficulty driven by tracked progress. A guided path (e.g. "Plus at 2, get 10 correct") with per-operator tracks and a bonus challenge. Plus a "Choose your own" mode.
> 3. Save every session to `practice_sessions`.
>
> **Done means:** all 4 operators and all 3 modes work; difficulty adapts based on past results; the guided path + bonus challenge are present; and sessions persist and appear in history. Demonstrate each mode and the adaptive behavior before you finish.

---

## S11 — Touch Typing

> Build the touch-typing trainer for zeroto1.academy.
>
> 1. A lesson progression from single keys ("j") up through words ("pretzels"), based on standard touch-typing teaching order.
> 2. An on-screen keyboard that highlights the next key to press.
> 3. Live accuracy and WPM tracking. Save results per kid.
>
> **Done means:** lessons progress from single keys to words; the keyboard highlights the correct next key; accuracy and WPM compute correctly; and results persist per kid. Show a typing session with live stats before you finish.

---

## S12 — Parent Dashboard

> Build the parent dashboard for zeroto1.academy — calm and useful, NOT a grades cockpit.
>
> 1. Finished work: lessons completed, per kid.
> 2. Stuck points: failed quiz items and abandoned lessons.
> 3. Custom-lesson allowance usage.
> 4. Manage kid profiles (add/edit). Link to subscription management.
> 5. Tone: informative and calm. No leaderboards, no grades, no nagging.
>
> **Done means:** the finished-lessons list is accurate per kid; stuck points surface correctly; allowance usage is shown; you can add/edit kid profiles from the dashboard; and the tone contains no grades/leaderboard/nagging elements. Show the dashboard with real progress data before you finish.

---

## S13 — Region Switch & Localization

> Make US/India a first-class, account-level setting in zeroto1.academy.
>
> 1. Region is captured at signup and is switchable in settings and the header switcher.
> 2. Prices/currency swap by region: US = $19/mo or $99/yr; India = ₹999/mo or ₹7,999/yr (founding-member pricing shown where relevant).
> 3. Region-aware legal copy; India pages reference the DPDP Act.
>
> **Done means:** switching the region updates all displayed prices and currency; the region persists across sessions and is stored on the account; and legal pages reflect the correct region. Show the switch updating prices live before you finish.

---

## S14 — Stripe Subscriptions (US + India)

> Implement live billing in zeroto1.academy with Stripe, for both US and India.
>
> 1. Stripe Checkout for monthly + yearly plans in USD (US) and INR (India, with local payment methods).
> 2. Webhooks for subscription created / updated / canceled; gate paid features on entitlement.
> 3. Cancel anytime — access continues until the paid period ends. Refund-within-30-days request flow that emails hello@zeroto1.academy.
> 4. Card statement descriptor = ZEROTO1.
>
> **Done means:** a test-mode checkout completes for both regions and currencies; the webhook updates subscription state and unlocks paid features; cancel retains access until period end; the refund request flow sends the email; the descriptor is ZEROTO1; and an unpaid household cannot access paid features. Run a full test-mode checkout + webhook + cancel cycle for both regions before you finish.

---

## S15 — Security, Performance & Compliance

> Harden zeroto1.academy for production.
>
> 1. Security: enforce CSP + HSTS, validate all inputs, ensure no PII in logs, keep secrets in an env vault, and rate-limit auth endpoints.
> 2. Performance: lesson pages load < 2s; AI generation < 30s; verify DB indexes are used.
> 3. Accessibility: WCAG 2.1 AA — full keyboard navigation, reduced-motion respected, sufficient contrast.
> 4. Compliance: COPPA (US) + DPDP Act (India) review; confirm minimal child data is collected.
> 5. Wire error tracking (Sentry or equivalent).
>
> **Done means:** the security checklist passes with no secrets/PII in logs; a lesson page loads < 2s on a throttled connection; keyboard navigation works end-to-end and reduced-motion is respected; the COPPA + DPDP review is documented; and Sentry captures a test error. Show the security/perf/a11y results before you finish.

---

## S16 — Content Load, QA & Launch

> Load the real content library and ship zeroto1.academy.
>
> 1. Load and verify the 1500+ built-in lessons (write/verify an import tool; content ops review).
> 2. Full end-to-end QA across both regions and all age bands.
> 3. Instrument success metrics: time-to-first-lesson, lesson completion rate, free→paid conversion, churn, refund rate, AI moderation block rate.
> 4. Launch checklist: DNS, production env vars, DB backups, monitoring, and a rollback plan.
>
> **Done means:** the lesson count in the DB is verified at 1500+; the E2E happy path passes for US and India; success-metric events are firing; backups + monitoring + rollback are in place; and we run a final LAUNCH GO/NO-GO review together. Show the lesson count, the E2E results, and the firing metrics before you finish.
