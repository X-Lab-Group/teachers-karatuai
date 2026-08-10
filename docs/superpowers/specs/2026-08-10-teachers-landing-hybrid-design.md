# Teachers Landing Hybrid Redesign

Date: 2026-08-10  
Repo: `X-Lab-Group/teachers-karatuai`  
Live page: `https://teachers.karatuai.com`  
Reference: `https://karatuai.com` (`JatoJay/karatuai` `app/page.tsx`)  
Decision: Scope **C Hybrid**, approach **1** (Jay approved)

## Goal

Make the teachers companion landing page feel like the main KaratuAI marketing site: clean, unicorn-level, open-source product page. Keep teachers-specific copy, device-aware download flows, sponsorship, and open-source sections. Do not require new photography.

## Non-goals

- No new product screenshots or photo assets
- No app-shell / in-app UI restyle
- No content rewrite of download install steps, APK version, or sponsorship tiers
- No GSAP dependency (keep Framer Motion already in the teachers app)
- No dark-mode redesign for the landing page

## Page map

| # | Section | Treatment |
|---|---------|-----------|
| 1 | Top nav | Restyle only; keep links and CTAs |
| 2 | Hero | **Rewrite** to split layout matching main site |
| 3 | Trust strip | **New / rewrite** (offline, private, MIT, Gemma) |
| 4 | Differentiators | **Rewrite** into quieter chapter-style blocks |
| 5 | Use cases ("What you can create") | **Rewrite** into chapter or calm 2x2 without loud icon cards |
| 6 | How it works | Restyle tokens/spacing only; keep 3 steps |
| 7 | Open source | Restyle tokens only; keep dark band + GitHub CTAs |
| 8 | Sponsorship | Restyle tokens only; keep 3 tiers + email CTA |
| 9 | Share classroom card | Restyle shell to match new tokens if shown |
| 10 | Download | Restyle tokens only; keep device-aware APK / web / iOS note |
| 11 | Footer | Restyle tokens only |

## Visual tokens (match main site)

Source of truth: `karatuai` `DESIGN_SYSTEM.md` + landing page colors.

| Role | Value | Usage |
|------|-------|--------|
| Canvas | `#f6f8f7` | Page background behind white bands |
| Surface | `#ffffff` | Hero, cards, nav |
| Ink | `#14221f` | Headings, primary text |
| Muted | `#63716d` | Body, captions |
| Hairline | `#dde5e2` | Borders, dividers |
| Brand | `#0c8c7e` | Links, accents, primary CTA fill |
| Brand hover | `#075f57` | Primary CTA hover |
| Brand soft | `rgba(12,140,126,0.08)` | Pill / chip backgrounds |

Typography:

- Keep Inter as the teachers app body font (already loaded via Tailwind theme).
- Headings: tighter tracking (`tracking-tight` / ~`-0.04em`), bold, ink color (not gradient text).
- Eyebrows: 11px, uppercase, wide tracking, brand color (same pattern as main `Eyebrow`).

Motion:

- Keep existing Framer Motion fade-ins.
- Soften: remove large teal/emerald blur orbs from the hero.
- Respect `prefers-reduced-motion` (already partly handled by Framer defaults; do not add aggressive hover lifts on lower sections).

## Hero (rewrite)

Layout: two columns on `lg+`, stacked on mobile.

Left:

- Soft brand pill: `Open source · v{ANDROID_APK_VERSION}` linking to GitHub
- H1 (exact): `AI lesson planning` + brand-colored `that lives on your phone.` (no gradient clip)
- Body (exact intent, may trim lightly for line length): Generate schemes of work, lesson plans, classroom activities, and assessments — entirely offline, completely private, free forever. Built for teachers across Africa.
- CTAs:
  - Primary solid brand: `Open in browser` → `/curriculum` (hide on iOS, same as today)
  - Secondary outlined brand: `Download for Android` or `Get the mobile app` (device-aware, scrolls to `#download`)
- Micro line under CTAs: `Works offline · No account needed · MIT licensed`

Right:

- Reuse the existing `ProductPreview` lesson-plan mock as the hero visual
- Frame it like main-site product art: white surface, hairline border, soft shadow, no multi-color glow halo
- Soft edge fade into white optional; no decorative blur blobs

## Trust strip

Full-width white band with top/bottom hairline.

- Left label: something like `Built for classrooms without reliable WiFi`
- Right chips: Works offline · No account · MIT licensed · Powered by Gemma

## Chapters (differentiators + use cases)

Replace the current loud gradient icon cards with main-site chapter rhythm:

1. **Offline** — title + body + 2–3 bullets (patchy school WiFi, one-time model download, then offline)
2. **Private** — title + body + bullets (no server, student data stays on device)
3. **What you can create** — schemes, lesson plans, activities, assessments as a calm list or 2x2 with simple brand-tint icons (no multi-color gradient icon tiles)

Alternating optional: one chapter can sit on `#f6f8f7`, others on white. No numbered `01/02/03` markers unless the section is truly sequential (How it works already owns that).

## Lower half (restyle only)

Keep structure and copy for:

- How it works (3 steps)
- Open source dark band
- Sponsorship tiers + contact CTA
- Download device flows (web / Android APK + install steps / desktop QR / iOS note)
- Footer columns

Token swaps only:

- Replace teal gradient buttons with solid brand / outlined brand
- Borders → `#dde5e2`
- Body text → `#63716d`
- Headings → `#14221f`
- Remove leftover multi-orb gradient backdrops from section wrappers
- Open-source band may stay dark; retint accents to brand rather than mixed emerald/teal gradients where easy

## Components / files

Primary change surface:

- `src/pages/LandingPage.tsx` — section structure and styles
- Light touch on `src/index.css` only if landing needs shared tokens (`--brand` aliases); do not restyle DaisyUI app chrome globally beyond adding brand CSS variables if useful
- `ShareClassroomCard` inline variant: align card chrome to hairline/ink tokens if it looks out of place after the restyle

Do not move routing, APK URLs, GitHub URL, or contact email.

## Acceptance criteria

1. First viewport reads like `karatuai.com`: quiet canvas, split hero, solid brand CTA, no teal blur blobs.
2. Teachers value props (offline / private / free / Africa) remain obvious above the fold.
3. Device-aware download behavior unchanged (Android / iOS / desktop / web).
4. Open source + sponsor + download sections still present and usable.
5. Mobile: stacked hero, CTAs full-width, no horizontal overflow.
6. `npm run typecheck` and `npm run build` pass.
7. Visual check of `/` on desktop and a narrow viewport before merge.

## Implementation notes

- Work in a feature branch off `main`, open PR into `main`.
- Prefer editing `LandingPage.tsx` in place over a file split unless the file becomes unmaintainable mid-change.
- Keep `detectDevice`, APK constants, and scroll-to-download behavior.
- After merge, deploy via the existing teachers Cloud Run path (`deploy.sh` / `cloudbuild.yaml`) only when Jay asks.

## Open questions (resolved)

- Scope: Hybrid C — resolved
- Approach: 1 (no new photography) — resolved
