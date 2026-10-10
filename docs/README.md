# zeroto1.academy — Documentation

This folder contains the full product + build documentation for the zeroto1.academy app.

| Doc | What it is |
|---|---|
| **`PRD.md`** | Full Product Requirements Document — product overview, users, data model, feature requirements (lesson flow, AI generation, math, typing, parent dashboard, payments), AI middleware architecture, tech stack, NFRs, metrics, risks. |
| **`SPRINTS.md`** | The build plan in **6 phases / 16 sprints**. Each sprint has a **VERIFY gate** — check it's correct before advancing. |
| **`antigravity-prompts.md`** | Paste-ready, self-contained prompts for the **Google Antigravity (Gemini 3.8)** build agent, one per sprint. |

## Recommended build order

1. Read `PRD.md` (understand the product).
2. Open `SPRINTS.md` — work sprints **in order**.
3. For each sprint, paste the matching prompt from `antigravity-prompts.md` into Antigravity.
4. When it finishes, run that sprint's **VERIFY** gate in `SPRINTS.md`.
5. Only advance to the next sprint when the gate is green.

## Phase summary

- **Phase 0 — Foundation** (S1–S3): scaffold, database, auth → logged-in household with kid profiles
- **Phase 1 — Content & Lesson Engine** (S4–S6): browsing + unified 6-step lesson player + progress
- **Phase 2 — AI Middleware & Generation** (S7–S9): AI layer + safe custom lesson generation
- **Phase 3 — Practice** (S10–S11): math + touch typing
- **Phase 4 — Parent Dashboard** (S12): finished work + stuck points
- **Phase 5 — Payments & Region** (S13–S14): Stripe US+India, region switch
- **Phase 6 — Hardening & Launch** (S15–S16): security, perf, compliance, launch

## Key product facts (quick reference)

- **Audience:** curious kids 5–15; low-pressure, self-directed.
- **Content:** 1500+ lessons across History, Science, Art (Subject → Unit → Lesson).
- **Lesson flow (fixed):** Hook → Video → Read → Activity → Practice → Deep Dive.
- **AI:** kids generate their own lessons from a question; ~75/household/30 days; safety guardrails mandatory.
- **Pricing (household, one price for the family):** US $19/mo · $99/yr · India ₹999/mo · ₹7,999/yr.
- **Refunds:** within 30 days via hello@zeroto1.academy. Card descriptor: ZEROTO1.
- **Design:** Nunito font, radius 28px, max-width 1080px, palette ink #0f3a52 / blue #1fa7e1 / cream #fff8f0 / sky #eff8ff / amber #ffb356 / green #75d06a.
