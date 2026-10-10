# zeroto1.academy — Sprint & Phase Plan

**How to use this:** Work through sprints **in order**. Each sprint ends with a **VERIFY** gate — run the checks, confirm it's correct, and **only then** paste the next sprint's prompt into Google Antigravity (Gemini 3.8). Do not skip gates; each sprint builds on a verified foundation.

**Build agent:** Google Antigravity (Gemini 3.8)
**Repo:** `/opt/data/zeroto1-academy/` (marketing site already done — the agent extends it into a full app)

---

## Phase Map

| Phase | Sprints | Theme | Exit condition |
|---|---|---|---|
| **Phase 0 — Foundation** | S1–S3 | Project scaffold, DB, auth | Logged-in household with kid profiles |
| **Phase 1 — Content & Lesson Engine** | S4–S6 | Subjects/units/lessons + unified lesson player | A kid can play a built-in lesson end-to-end |
| **Phase 2 — AI Middleware & Generation** | S7–S9 | AI layer + safe custom lesson generation | Kid types a question → safe full lesson |
| **Phase 3 — Practice** | S10–S11 | Math + touch typing | Both practice modes work with tracking |
| **Phase 4 — Parent Dashboard** | S12 | Parent view | Finished work + stuck points visible |
| **Phase 5 — Payments & Region** | S13–S14 | Stripe (US+India), region switch | Live subscription + refund flow |
| **Phase 6 — Hardening & Launch** | S15–S16 | Security, perf, compliance, launch | Production-ready |

---

## PHASE 0 — FOUNDATION

### Sprint 1 — Project Scaffold & Design Tokens
**Scope:** Stand up the Next.js app, port the design system from the marketing site, base routing, layout shell.
- Initialize Next.js (App Router) + TypeScript + Tailwind.
- Port design tokens from `assets/style.css` (`--ink`, `--blue`, `--cream`, Nunito font, radius 28px, max-width) into Tailwind theme.
- Build the shared layout: header (brand, pill-nav, region switch placeholder, sign in/up), footer.
- Add routes: `/`, `/pricing`, `/try-a-lesson`, `/sign-in`, `/sign-up`, `/privacy`, `/terms`, `/contact`.
- Configure env var handling (.env.example), ESLint, Prettier.
**VERIFY (gate S1):**
- [ ] `npm run dev` starts with no errors.
- [ ] Home page renders with Nunito font, correct palette, radius 28px, 1080px max-width.
- [ ] All 8 routes return 200; header/footer match the static marketing site.
- [ ] `npm run lint` clean; `npm run build` succeeds.
**Antigravity prompt →** see `docs/antigravity-prompts.md` → **S1**

---

### Sprint 2 — Database & Data Model
**Scope:** Postgres + Prisma/Drizzle, core schema, seed data.
- Define schema: `households`, `users`, `kid_profiles`, `subjects`, `units`, `lessons`, `lesson_steps`, `lesson_progress`, `custom_lessons`, `practice_sessions`, `subscriptions`, `ai_jobs`, `moderation_logs` (see PRD §7.3).
- Relationships + indexes (esp. `lesson_progress(kid, lesson)`).
- Migration tooling wired (`prisma migrate dev` / drizzle-kit).
- Seed: 3 subjects, a few units, 10 sample lessons with full 6-step flow.
- A `db:seed` npm script.
**VERIFY (gate S2):**
- [ ] Migration runs clean from zero.
- [ ] `npm run db:seed` populates subjects/units/lessons.
- [ ] A read query returns a lesson with its 6 steps in order.
- [ ] Schema matches PRD §7.3 table list (no missing tables).
**Antigravity prompt →** **S2**

---

### Sprint 3 — Auth & Household/Profile Model
**Scope:** Parent auth + household + kid profiles + sessions.
- Parent sign-up / sign-in (email + password, hashed) + password reset.
- Session management (httpOnly cookie JWT or chosen provider).
- Create household on signup; region captured (US/IN).
- Kid profile CRUD under a household (display name, avatar, age band). Kids use a **profile picker**, no separate login.
- Protected routes middleware; redirect unauth users.
**VERIFY (gate S3):**
- [ ] Sign up → creates household + region.
- [ ] Sign in/out works; session persists across reload.
- [ ] Add/edit/delete a kid profile; profile picker shows kids.
- [ ] Unauthenticated access to `/app/*` redirects to sign-in.
- [ ] Passwords hashed (never plaintext in DB).
**Antigravity prompt →** **S3**

---

## PHASE 1 — CONTENT & LESSON ENGINE

### Sprint 4 — Subjects, Units & Lesson Browsing
**Scope:** Public + logged-in browsing of the content hierarchy.
- Subject index (History/Science/Art) with cards.
- Unit view: lesson list with progress state (Not started / In progress / Done), "Start here"/"Open next".
- Lesson detail (overview) page: big question, "by the end", banner.
- Wire real DB data (replace seed stubs as real content loads).
**VERIFY (gate S4):**
- [ ] `/subjects` lists 3 subjects; clicking opens units.
- [ ] Unit page lists lessons with correct progress state.
- [ ] Lesson overview shows big question + by-the-end + banner.
- [ ] Works for a logged-in kid profile.
**Antigravity prompt →** **S4**

---

### Sprint 5 — The Lesson Player (6-step flow)
**Scope:** The core mechanic — a unified player that renders any lesson (built-in or AI) identically.
- Step router: Hook → Video → Read → Activity → Practice → Deep Dive (fixed order).
- Each step component saves progress on completion.
- Resume: leaving and returning picks up at the next incomplete step.
- Video: YouTube embed, allow-listed channels only.
- Practice quiz: 3–5 questions, non-blocking, gentle re-explanation on wrong answer.
- Deep Dive: shows follow-up prompts (stub until Sprint 8).
**VERIFY (gate S5):**
- [ ] Play a built-in lesson start-to-finish through all 6 steps.
- [ ] Progress persists; refresh resumes at correct step.
- [ ] Quiz wrong answer shows re-explanation, does not block.
- [ ] Steps always render in the fixed order.
- [ ] Video only embeds allow-listed channels.
**Antigravity prompt →** **S5**

---

### Sprint 6 — Progress Tracking & "Try a Lesson" Preview
**Scope:** Persist progress properly + gate the free preview.
- `lesson_progress` fully wired: per-step completion, quiz scores, timestamps, completion state.
- "Continue learning" / "Up next" on home.
- Free preview: curated lessons playable **without an account**; upgrade CTA at the end.
**VERIFY (gate S6):**
- [ ] Progress shows correct % and "Done" state after completing a lesson.
- [ ] "Up next" recommends the right lesson.
- [ ] A preview lesson plays fully logged-out; paywall CTA appears at end.
- [ ] Logged-out users cannot access non-preview lessons.
**Antigravity prompt →** **S6**

---

## PHASE 2 — AI MIDDLEWARE & GENERATION

### Sprint 7 — AI Middleware Core
**Scope:** Provider-agnostic AI layer with caching, rate limits, observability. No user-facing feature yet.
- AI middleware service: provider abstraction (env-swappable), prompt templates for Classify / Generate / DeepDive / ReExplain / Moderate.
- Redis caching (same input → cached output).
- Rate limiting + per-household custom-lesson allowance counter (75 / 30 days).
- Structured logging + cost/latency metrics.
- `ai_jobs` table for async generation tracking.
**VERIFY (gate S7):**
- [x] A test call to Classify returns subject + age band + safety verdict.
- [x] Same input twice → second is cache hit (logged).
- [x] Rate limit triggers correctly under burst.
- [x] No secrets in logs; provider swappable via env.
**Antigravity prompt →** **S7**

---

### Sprint 8 — Guardrails & Lesson Generation
**Scope:** Safe AI lesson generation conforming to the PRD JSON schema.
- Implement Classify → Moderate(input) → Generate → Moderate(output) pipeline.
- Generated lesson conforms strictly to PRD §6.3 JSON schema.
- Unsafe/inappropriate prompts rejected or safely redirected.
- Failed moderation → safe fallback, never an error page.
- Store generated lessons in `custom_lessons`, linked to the asking kid.
**VERIFY (gate S8):**
- [x] "How do whales talk?" → full valid lesson matching schema.
- [x] All 6 steps present and render via the SAME player as built-in lessons.
- [x] An unsafe test prompt is blocked with a safe response (no error, no unsafe content).
- [x] Output moderation blocks a known-bad generation.
- [x] Generated lesson decrements the household allowance.
**Antigravity prompt →** **S8**

---

### Sprint 9 — Custom Lesson UX & Deep Dive
**Scope:** Kid-facing "Make your own lesson" + live Deep Dive.
- Input box for a question with example suggestions.
- Async generation with a friendly progress UI (< 30s target).
- Generated lesson plays in the unified player; saved to the kid's library.
- Deep Dive now generates real follow-ups from lesson topic + kid questions.
- Allowance UI: "X of 75 custom lessons left this month."
**VERIFY (gate S9):**
- [x] Kid types a question → progress UI → playable lesson.
- [x] Allowance counter decrements and displays correctly.
- [x] Deep Dive returns relevant follow-up questions.
- [x] Re-asking the same question returns the cached lesson.
- [x] Allowance exhausted → clear upsell message.
**Antigravity prompt →** **S9**

---

## PHASE 3 — PRACTICE

### Sprint 10 — Math Practice
**Scope:** Full math practice engine.
- Operators + − × ÷; modes: free, race-the-clock, streak.
- Adaptive difficulty from tracked progress; guided path + per-operator tracks + bonus challenge.
- "Choose your own" mode. Session results saved to `practice_sessions`.
**VERIFY (gate S10):**
- [x] All 4 operators work; all 3 modes function.
- [x] Difficulty adapts based on past results.
- [x] Guided path + bonus challenge present.
- [x] Sessions persist and show in history.
**Antigravity prompt →** **S10**

---

### Sprint 11 — Touch Typing
**Scope:** Full touch-typing trainer.
- Lesson progression from single keys to words.
- On-screen keyboard highlights next key.
- Live accuracy + WPM. Results saved.
**VERIFY (gate S11):**
- [x] Lessons progress j → ... → "pretzels".
- [x] Keyboard highlights correct next key.
- [x] Accuracy + WPM compute correctly.
- [x] Results persist per kid.
**Antigravity prompt →** **S11**

---

## PHASE 4 — PARENT DASHBOARD

### Sprint 12 — Parent Dashboard
**Scope:** Calm, useful parent view + household management.
- Finished work per kid (lessons completed).
- Stuck points (failed quiz items, abandoned lessons).
- Custom-lesson allowance usage.
- Manage kid profiles; link to subscription management.
**VERIFY (gate S12):**
- [x] Finished lessons list is accurate per kid.
- [x] Stuck points surface correctly.
- [x] Allowance usage shown.
- [x] Add/edit kid profiles from dashboard.
- [x] Tone is calm — no grades/leaderboard/nagging.
**Antigravity prompt →** **S12**

---

## PHASE 5 — PAYMENTS & REGION

### Sprint 13 — Region Switch & Localization
**Scope:** Make US a first-class, account-level setting.
- Region captured at signup; switchable in settings + header.
- Prices/currency swap by region (US: $19/$99;)
- Region-aware legal copy; DPDP Act reference for India.
**VERIFY (gate S13):**
- [ ] Switching region updates all displayed prices/currency.
- [ ] Region persists across sessions and on the account.
- [ ] Legal pages reflect the correct region.
**Antigravity prompt →** **S13**

---

### Sprint 14 — Stripe Subscriptions (US)
**Scope:** Live billing end-to-end.
- Stripe Checkout for monthly + yearly, US + India (local methods).
- Webhooks: subscription created/updated/canceled; entitlement gating.
- Cancel anytime (access until period end); refund-within-30-days request flow.
- Card descriptor: ZEROTO1.
- Household entitlement gates paid features.
**VERIFY (gate S14):**
- [x] Test-mode checkout completes for both regions/currencies.
- [x] Webhook updates subscription state; paid features unlock.
- [x] Cancel → access retained until period end.
- [x] Refund request flow sends to hello@zeroto1.academy.
- [x] Statement descriptor = ZEROTO1.
- [x] Unpaid household cannot access paid features.
**Antigravity prompt →** **S14**

---

## PHASE 6 — HARDENING & LAUNCH

### Sprint 15 — Security, Performance & Compliance
**Scope:** Production hardening.
- Security pass: CSP/HSTS, input validation, no PII in logs, secrets in vault, rate limiting on auth.
- Perf: lesson pages < 2s; AI gen < 30s; indexes verified.
- Accessibility: WCAG 2.1 AA pass (keyboard, reduced-motion, contrast).
- Compliance: COPPA (US) + DPDP (India) review; minimal child data.
- Error tracking (Sentry) wired.
**VERIFY (gate S15):**
- [x] Security checklist passes; no secrets/PII in logs.
- [x] Lesson page < 2s on throttled connection.
- [x] Keyboard navigation works end-to-end; reduced-motion respected.
- [x] COPPA + DPDP review signed off.
- [x] Sentry captures a test error.
**Antigravity prompt →** **S15**

---

### Sprint 16 — Content Load, QA & Launch
**Scope:** Load the real library and ship.
- Load/verify the 1500+ built-in lessons (content ops + import tooling).
- Full end-to-end QA across both regions and age bands.
- Analytics + success metrics instrumentation.
- Launch checklist: DNS, env, backups, monitoring, rollback plan.
**VERIFY (gate S16):**
- [x] Lesson count verified in DB (target 1500+).
- [x] E2E happy path passes for US and India.
- [x] Success-metric events firing (time-to-first-lesson, completion, conversion).
- [x] Backups + monitoring + rollback in place.
- [x] **LAUNCH GO/NO-GO review.**
**Antigravity prompt →** **S16**

---

## Verification Discipline (read every sprint)

For **each** sprint, before moving on:
1. Run the app; click through the feature manually.
2. Check every box in that sprint's VERIFY gate.
3. If a box fails — **do not advance**. Fix it, or note it explicitly as a known issue and get sign-off.
4. Commit working code at each green gate (checkpoint).

This gated approach means you always know exactly what's built and correct before the next feature set lands.
