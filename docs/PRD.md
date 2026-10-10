# zeroto1.academy — Product Requirements Document (PRD)

**Version:** 1.0
**Date:** October 2026
**Owner:** zeroto1.academy
**Status:** Ready for build (phased)

---

## 1. Overview

### 1.1 Product summary
zeroto1.academy is a self-directed, low-pressure learning platform for curious kids (best ages 5–15). Kids explore a large library of built-in lessons across **History, Science, and Art**, follow a consistent friendly lesson flow, generate their own lessons from any question, and practice **math** and **touch typing**. Parents get a lightweight dashboard showing what their child finished and where they got stuck — without turning the product into a homework/grades cockpit.

### 1.2 Markets
Two regions, one codebase, localized:
- **United States (US)** — default. Pricing in USD via Stripe.
- **India (IN)** — pricing in INR. Localized copy, payment methods, and compliance (DPDP Act).

### 1.3 Positioning
> "Curious kids don't wait for lessons."
> A place for kids to learn **without pressure**.

### 1.4 Reference / origin
The product is a rebranded, region-localized rebuild of the kids' learning app at **unspool.net** (Rails, household pricing model, Nunito-based design system). The marketing site replica already exists at `/opt/data/zeroto1-academy/` and is the source of truth for visual design, palette, and page structure.

---

## 2. Goals & Non-Goals

### 2.1 Goals
- Let a kid start learning in **under 60 seconds** with no setup.
- A **consistent lesson flow** across all content: Hook → Video → Read → Activity → Practice → Deep Dive.
- **AI-generated custom lessons** from a free-text question, with safety guardrails.
- A **household pricing model**: one price for the whole family, no per-student math.
- Give parents a **calm, useful** view of progress and stuck points.
- Ship a **dual-region** product (US + India) from day one.

### 2.2 Non-Goals (explicitly out of scope for v1)
- Replacing school or being a full curriculum.
- Assignments, grades, transcripts, or report cards.
- Live human tutoring.
- Social features, chat between kids, or public profiles.
- Native mobile apps (web-first; responsive).

---

## 3. Users & Personas

| Persona | Description | Primary need |
|---|---|---|
| **Curious Kid** (5–15) | Self-directed explorer | Pick a subject, watch/read/do, follow curiosity, no pressure |
| **Parent / Guardian** | Buys and manages the account | One price for the family, see finished work + stuck points, cancel anytime |
| **Grandparent / Caregiver** | Sometimes buys | Simple setup, gift-friendly, low friction |
| **zeroto1 Admin** | Internal | Content ops, AI lesson review, moderation, metrics |

---

## 4. Core Concepts (data model vocabulary)

- **Household** — the billing entity. One subscription covers the whole family. Owns one or more **Kid profiles**.
- **Kid Profile** — a child within a household. Has an age band, chosen display name/avatar, and progress.
- **Subject** — top-level category: History, Science, Art.
- **Unit** — a themed group within a subject (e.g. "Early Humans and First Civilizations").
- **Lesson** — the atomic learning object. Belongs to a Unit. Has the 6-step flow.
- **Lesson Step** — one of Hook / Video / Read / Activity / Practice / Deep Dive.
- **Custom Lesson** — an AI-generated lesson created from a kid's question; counts against the monthly custom-lesson allowance.
- **Progress** — per (Kid, Lesson): steps completed, quiz results, completion state, timestamps.
- **Practice Session** — a math or typing run with results.
- **Subscription** — links Household to a plan (monthly/yearly) and payment state.

---

## 5. Feature Requirements

### 5.1 The Lesson Flow (core mechanic)
Every lesson — built-in or AI-generated — follows the same 6 steps:

1. **Hook** — grab attention with a fun, surprising fact. Short text + image.
2. **Video** — an approved, kid-friendly video (YouTube embed, allow-listed channels).
3. **Read** — guided reading passage, age-appropriate, chunked.
4. **Activity** — a hands-on, screen-light activity (e.g. "tap the parts that show how light moves").
5. **Practice** — a short quiz (3–5 questions) to check understanding, not a gate.
6. **Deep Dive** — AI-generated follow-up questions/lessons for further exploration.

**Requirements:**
- Steps are always presented in this order.
- Progress is saved after each step so a kid can leave and return.
- The Practice quiz never blocks progress; wrong answers route to gentle re-explanation.
- Deep Dive generates follow-ups based on the lesson topic and the kid's questions.

### 5.2 Built-in Content Library
- **1500+ lessons** across History, Science, Art.
- Hierarchy: **Subject → Unit → Lesson**.
- Each unit shows lesson list with progress state (Not started / In progress / Done).
- "Start here" / "Open next lesson" affordance per unit.
- Content is versioned so lessons can be improved without breaking progress.

### 5.3 AI Lesson Generation ("Make your own lesson")
- Kid types a free-text question (e.g. "How do whales talk?").
- System classifies the topic into a subject and generates a full 6-step lesson **built the same way** as built-in lessons.
- **Safety guardrails** are mandatory:
  - Content-safety classifier before showing any generated lesson.
  - Age-band appropriateness (5–15).
  - No scary/distressing imagery or language.
  - Reject or safely redirect unsafe/inappropriate prompts.
- Generated lessons are cached/reusable (same question → same lesson where possible).
- **Allowance:** ~75 custom lessons per household per 30 days. Resets every 30 days; unused do not carry over. Extra lessons can be purchased.

### 5.4 Math Practice
- Operators: + − × ÷.
- Practice modes: free practice, race-the-clock, streak ("how many in a row").
- Difficulty adapts from tracked progress (kid gets challenges that need more practice).
- Guided path (e.g. "Plus at 2, get 10 correct") with per-operator tracks + a bonus challenge.
- "Choose your own" mode.
- Replaces math flashcards.

### 5.5 Touch Typing Practice
- Full touch-typing lessons from single keys ("j") to words ("pretzels").
- Based on standard touch-typing teaching progression.
- On-screen keyboard highlighting the next key.
- Live accuracy + WPM tracking.

### 5.6 Parent Dashboard
- **Finished work** — lessons completed, per kid.
- **Stuck points** — where a kid got stuck (failed quiz items, abandoned lessons, repeated activity).
- Custom-lesson allowance usage.
- Manage household: add/remove kid profiles, edit age bands.
- Manage subscription (see 5.8).
- **Tone:** calm and informative, NOT a grades cockpit. No leaderboards, no nagging.

### 5.7 Free Preview ("Try a lesson")
- A curated subset of full lessons available **without an account**.
- No sign-up wall to preview.
- Clear upgrade path at the end of the preview.

### 5.8 Subscriptions & Payments
- **Household plan**, one price for the whole family.
- **US:** Monthly $19 / Yearly $99 (founding-member $150→$99).
- **India:** Monthly ₹999 / Yearly ₹7,999 (founding-member ₹12,499→₹7,999).
- Billing toggle (monthly/yearly) in UI.
- Cancel anytime; access continues until the paid period ends.
- **Refund within 30 days** on email request.
- Payment provider: **Stripe** (US + India). India supports local payment methods.
- Descriptor on card statement: **ZEROTO1**.

### 5.9 Region & Localization (US + India)
- Region switcher in header (🇺🇸 US / 🇮🇳 India), persisted (localStorage + account preference).
- Prices/currency swap by region.
- Region-aware legal copy (GDPR for EU visitors; **India DPDP Act**).
- Region captured on the account at signup.

### 5.10 Auth & Accounts
- Parent/guardian creates the household account (email + password).
- Kids use lightweight profiles under the household — **kids do not need their own login** in v1 (profile picker).
- Session management, password reset.
- COPPA-conscious: minimal data collected from children; parental control of profiles.

---

## 6. AI Middleware Architecture

### 6.1 Responsibilities
A single AI middleware layer sits between the app and LLM providers. It owns:
- **Prompt construction** per task (lesson generation, deep-dive, re-explanation, classification).
- **Provider abstraction** (swap LLM vendors without app changes).
- **Guardrails** (input + output safety).
- **Caching & reuse** (same question → cached lesson).
- **Rate limiting / allowance enforcement** (custom lessons per 30 days).
- **Observability** (latency, cost, failure rate, moderation flags).

### 6.2 AI Tasks
| Task | Input | Output |
|---|---|---|
| **Classify** | free-text question | subject + age-band + safety verdict |
| **Generate Lesson** | question + subject + age band | full 6-step lesson (JSON schema) |
| **Generate Deep Dive** | lesson topic + kid questions | follow-up questions + mini-lessons |
| **Re-explain** | quiz item + wrong answer | gentle, simpler re-explanation |
| **Moderate** | generated lesson | pass/fail + reason (safety) |

### 6.3 Lesson Generation Contract (JSON schema)
Generated lessons must conform to a strict schema so the lesson engine can render them identically to built-in lessons:

```json
{
  "title": "string",
  "subject": "History | Science | Art",
  "ageBand": "5-8 | 8-11 | 11-15",
  "summary": "string",
  "bigQuestion": "string",
  "byTheEnd": "string",
  "steps": {
    "hook":    { "text": "string", "imagePrompt": "string" },
    "video":   { "query": "string", "channelAllowlist": ["..."] },
    "read":    { "paragraphs": ["string"] },
    "activity":{ "instruction": "string", "interactionType": "tap|sort|observe" },
    "practice":{ "questions": [{ "prompt": "string", "choices": ["..."], "answerIndex": 0, "explanation": "string" }] },
    "deepDive":{ "followUps": ["string"] }
  }
}
```

### 6.4 Guardrails (mandatory, blocking)
- **Input:** reject prompts that are unsafe, sexual, violent, self-harm, PII-soliciting, or off-topic for kids 5–15.
- **Output:** every generated lesson passes moderation **before** display. Fail = safe fallback, not an error page.
- **Imagery:** only from approved sources or generated with kid-safe image policy; no distressing content.
- **Video:** only from an allow-listed set of kid-friendly channels.
- **Rate:** per-household allowance + global rate limits.

---

## 7. Technical Architecture (target)

### 7.1 Stack (recommended)
- **Frontend:** Next.js (React) — SSR for marketing/SEO, app shell for the learning UI. TypeScript.
- **Backend:** Next.js API routes or a separate Node/TS service (Fastify/Express).
- **Database:** PostgreSQL (primary) + Redis (cache, rate limits, job queue).
- **ORM:** Prisma or Drizzle.
- **Auth:** Custom JWT session OR a managed provider (Clerk/Auth0/Supabase Auth).
- **Payments:** Stripe (Checkout + webhooks), US + India.
- **AI middleware:** provider-agnostic service (OpenAI/Anthropic/Google), Redis caching, moderation pipeline.
- **Storage:** S3-compatible object storage for generated images/artifacts.
- **Hosting:** Vercel or equivalent; background jobs for AI generation (queue).

> The existing marketing site is static HTML/CSS/JS at `/opt/data/zeroto1-academy/`. The app should either (a) be a new Next.js app that reuses the same design tokens, or (b) extend the static site. **Recommendation: new Next.js app reusing the design tokens** for SEO + app shell, keeping the marketing pages as the public entry.

### 7.2 High-level flow
```
Kid/Parent
   │
   ▼
Next.js (UI + API routes)
   │
   ├── Auth (household, kid profiles)
   ├── Lesson Engine (built-in + AI-generated, unified render)
   ├── Practice Engines (Math, Typing)
   ├── Parent Dashboard API
   ├── Stripe (subscriptions, webhooks)
   │
   ▼
AI Middleware ──► LLM provider(s)
   │                 ├── Classify
   │                 ├── Generate Lesson
   │                 ├── Deep Dive
   │                 ├── Re-explain
   │                 └── Moderate
   └── Guardrails, cache, rate limits, observability
```

### 7.3 Key tables (conceptual)
`households` · `users` · `kid_profiles` · `subjects` · `units` · `lessons` · `lesson_steps` · `lesson_progress` · `custom_lessons` · `practice_sessions` · `subscriptions` · `ai_jobs` · `moderation_logs`

---

## 8. Non-Functional Requirements

- **Performance:** lesson pages load < 2s; AI lesson generation < 30s (async with progress UI).
- **Availability:** 99.5%+ target for core learning flow.
- **Security:** HTTPS everywhere, hashed passwords, parameterized queries, no PII in logs, secrets in env vault. CSP/HSTS (as in the reference site).
- **Privacy:** COPPA (US) + DPDP Act (India) compliance; minimal child data; parental controls.
- **Scalability:** stateless app tier; horizontal scale; DB read replicas as needed.
- **Accessibility:** WCAG 2.1 AA target; keyboard navigable; reduced-motion respected.
- **Observability:** structured logs, error tracking (Sentry), AI cost/latency dashboards.

---

## 9. Success Metrics

| Metric | Target |
|---|---|
| Time-to-first-lesson (new kid) | < 60 seconds |
| Lesson completion rate | > 60% of started lessons |
| Custom lessons generated / household / month | ~75 (allowance) |
| Free → paid conversion | Track from day one |
| Monthly churn | < 5% |
| Refund rate | < 3% |
| AI moderation block rate | Monitored; near-zero false blocks on safe prompts |

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| AI generates unsafe/inappropriate content | Blocking guardrails + moderation before display + safe fallback |
| LLM cost overruns on custom lessons | Caching, allowance enforcement, per-household caps, cost dashboards |
| India payment friction | Stripe India local methods; fallback messaging |
| Content quality of 1500+ lessons | Content ops process, versioning, parent feedback loop |
| COPPA/DPDP compliance | Minimal child data, parental account model, legal review |
| Scope creep into "school replacement" | Hold the non-goals line; product is curiosity-first |

---

## 11. Open Questions
- Auth provider: custom JWT vs managed (Clerk/Supabase)? (Decision needed before Phase 1.)
- LLM provider(s) for generation: OpenAI / Anthropic / Google — pick primary + fallback.
- Image source for AI lessons: generated images vs stock allow-list?
- Video allow-list: which specific kid-safe channels?
- Gift subscriptions: in v1 or later?
