# Teachers Landing Hybrid Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline). Subagent-driven development is disabled in this agent. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle `teachers.karatuai.com` landing so the top half matches `karatuai.com` (split hero, quiet chapters, brand tokens) while keeping download / open-source / sponsor flows intact.

**Architecture:** Edit `LandingPage.tsx` in place. Add landing-only CSS variables in `src/index.css`. Light-touch `ShareClassroomCard` chrome so the inline form does not clash. No new assets, no new animation library.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Framer Motion, React Router 7, existing Lucide icons.

## Global Constraints

- Scope: Hybrid C, approach 1 (Jay approved) — rewrite hero/trust/differentiators/use-cases; restyle lower half only
- Colors: canvas `#f6f8f7`, ink `#14221f`, muted `#63716d`, hairline `#dde5e2`, brand `#0c8c7e`, brand hover `#075f57`
- No teal blur orbs / multi-color gradient icon tiles in rewritten sections
- Preserve: `detectDevice`, APK URL/version/size, GitHub URL, contact email, device-aware download behavior
- Do not restyle in-app DaisyUI chrome beyond adding CSS variables
- Branch from `main`; do not commit unless Jay asks (or ask before first commit)
- Verify with `npm run typecheck` and `npm run build`

## File map

| File | Responsibility |
|------|----------------|
| `docs/superpowers/specs/2026-08-10-teachers-landing-hybrid-design.md` | Approved design (already written) |
| `src/index.css` | Add `--landing-*` / brand aliases used by landing classes |
| `src/pages/LandingPage.tsx` | All section markup/style changes |
| `src/components/ShareClassroomCard.tsx` | Align inline card borders/text to landing tokens |

---

### Task 1: Landing tokens + branch

**Files:**
- Modify: `src/index.css`
- Create branch: `design/teachers-landing-hybrid`

**Interfaces:**
- Produces: CSS variables `--landing-canvas`, `--landing-ink`, `--landing-muted`, `--landing-hairline`, `--landing-brand`, `--landing-brand-hover` available to Tailwind arbitrary values / utility classes in landing

- [ ] **Step 1: Create branch**

```bash
cd /workspace/teachers-karatuai
git checkout main
git pull --ff-only origin main
git checkout -b design/teachers-landing-hybrid
```

- [ ] **Step 2: Add landing tokens to `src/index.css` inside `@theme` (or `:root`)**

```css
--color-landing-canvas: #f6f8f7;
--color-landing-ink: #14221f;
--color-landing-muted: #63716d;
--color-landing-hairline: #dde5e2;
--color-landing-brand: #0c8c7e;
--color-landing-brand-hover: #075f57;
```

- [ ] **Step 3: Sanity check tokens compile**

Run: `cd /workspace/teachers-karatuai && npm run typecheck`
Expected: PASS (CSS-only change should not affect TS)

---

### Task 2: Rewrite TopNav + Hero + Trust strip

**Files:**
- Modify: `src/pages/LandingPage.tsx` (`TopNav`, `Hero`, `ProductPreview`, add `TrustStrip`)

**Interfaces:**
- Consumes: existing `device`, `onDownloadClick`, `ANDROID_APK_VERSION`, `GITHUB_URL`, `fadeIn`
- Produces: `TrustStrip` component rendered under Hero; Hero uses split layout

- [ ] **Step 1: Restyle `TopNav`**
  - White sticky bar, hairline bottom border
  - Ink logo text, muted nav links, solid brand or ink primary CTA `Get the app`
  - Remove heavy backdrop blur dependency if it fights the cleaner look (optional light blur OK)

- [ ] **Step 2: Rewrite `Hero`**
  - Page canvas: outer wrapper `bg-[#f6f8f7]`; hero band `bg-white`
  - `lg:grid` two columns: copy left, `ProductPreview` right
  - Pill: open source + version → GitHub
  - H1: `AI lesson planning` + brand span `that lives on your phone.` (no gradient)
  - Body + CTAs per spec
  - Delete `GradientBackdrop` usage from Hero

- [ ] **Step 3: Quiet `ProductPreview`**
  - Keep lesson content
  - Frame: white, `border-[#dde5e2]`, soft shadow, no glow halo

- [ ] **Step 4: Add `TrustStrip`**
  - White band, `border-y border-[#dde5e2]`
  - Label + chips: offline / no account / MIT / Gemma

- [ ] **Step 5: Wire into page export**
  - Order: TopNav → Hero → TrustStrip → …

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: PASS

---

### Task 3: Rewrite Differentiators + UseCases as chapters

**Files:**
- Modify: `src/pages/LandingPage.tsx` (`Differentiators`, `UseCases`)

**Interfaces:**
- Consumes: existing differentiator/use-case copy (may lightly edit bullets)
- Produces: quieter chapter sections without gradient icon tiles

- [ ] **Step 1: Replace `Differentiators` card grid**
  - Two chapter blocks (Offline, Private) — eyebrow, title, body, 2–3 bullets
  - Alternate `bg-white` / `bg-[#f6f8f7]`
  - Simple brand-tint icons OK; no `from-teal-500 to-teal-600` tiles

- [ ] **Step 2: Rewrite `UseCases`**
  - Eyebrow `What you can create`
  - Calm 2x2 or list with brand-tint icon wells (`bg-[#0c8c7e]/8 text-[#0c8c7e]`, hairline border)
  - Keep four items: schemes, lesson plans, activities, assessments

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS

---

### Task 4: Restyle lower half + ShareClassroomCard

**Files:**
- Modify: `src/pages/LandingPage.tsx` (`HowItWorks`, `OpenSourceSection`, `SponsorshipSection`, `DownloadSection`, `Footer`)
- Modify: `src/components/ShareClassroomCard.tsx` (inline shell chrome only)

**Interfaces:**
- Consumes: unchanged download/APK/device logic
- Produces: visually consistent lower half

- [ ] **Step 1: Restyle HowItWorks**
  - Ink headings, muted body, brand step numbers (solid brand text, not multi-stop gradient if easy)

- [ ] **Step 2: Restyle OpenSource / Sponsor / Download / Footer**
  - Swap teal gradient CTA fills → `bg-[#0c8c7e] hover:bg-[#075f57]`
  - Borders → `#dde5e2`
  - Remove leftover orb backdrops on light sections
  - Keep dark open-source band; retint accents to brand

- [ ] **Step 3: Align `ShareClassroomCard` inline shell**
  - Border/hairline + ink/muted text to match landing
  - Do not change form submit logic

- [ ] **Step 4: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both PASS

---

### Task 5: Visual verify + handoff

**Files:** none (run + report)

- [ ] **Step 1: Start preview if needed**

```bash
cd /workspace/teachers-karatuai && npm run build && npm run preview -- --host 127.0.0.1 --port 4173
```

- [ ] **Step 2: Spot-check**
  - Desktop `/`: split hero, no blur orbs, trust strip present
  - Narrow width: stacked hero, full-width CTAs
  - Download section still device-aware

- [ ] **Step 3: Progress update to Jay + ask to commit/PR/deploy**

Do not merge or deploy until Jay asks.

---

## Spec coverage check

| Spec requirement | Task |
|------------------|------|
| Visual tokens | 1 |
| Hero rewrite + ProductPreview quiet | 2 |
| Trust strip | 2 |
| Differentiators/use-cases chapters | 3 |
| Lower half restyle | 4 |
| Share classroom chrome | 4 |
| typecheck/build acceptance | 4–5 |
| Preserve download/APK/GitHub | 2–4 (no logic changes) |
