# Live Gemini Browser Path Implementation Plan

> **For agentic workers:** Use executing-plans inline (subagents disabled). Checkbox steps for tracking.

**Goal:** Auto-use Gemini Flash via Cloud Function when online; fall back to on-device Gemma offline.

**Architecture:** New `functions/generate` HTTP proxy holds `GEMINI_API_KEY`. Client `cloud-generate.ts` + `ModelProvider` auto-selects cloud vs MediaPipe. Generators unchanged.

**Tech Stack:** React/Vite, MediaPipe (existing), `@google/generative-ai` in Cloud Function, GCP Secret Manager at deploy.

## Global Constraints

- Mode A auto-select; approach 1 Cloud Function proxy
- Model: `gemini-2.5-flash` (env override `GEMINI_MODEL`)
- No API key in client; only `VITE_GENERATE_ENDPOINT`
- Branch: `feat/live-gemini-browser-path` → PR to `main`
- Verify: `npm run typecheck && npm run build`

---

### Task 1: Cloud Function `karatuai-generate`

**Files:**
- Create: `functions/generate/package.json`
- Create: `functions/generate/index.js`
- Create: `functions/generate/.gcloudignore`

- [ ] Scaffold package like `functions/support`
- [ ] Implement CORS, POST body validation, Gemini `generateContent`, JSON `{ text }` response
- [ ] Rate-limit best-effort + 100k char cap

### Task 2: Client cloud helper + context types

**Files:**
- Create: `src/lib/cloud-generate.ts`
- Modify: `src/contexts/model-context.ts`

- [ ] Add `ModelBackend` + `backend` on status
- [ ] Implement `isCloudGenerateConfigured`, `probeCloudGenerate`, `cloudGenerate`

### Task 3: ModelProvider auto path

**Files:**
- Modify: `src/contexts/ModelContext.tsx`

- [ ] Try cloud first when online + configured
- [ ] iOS: cloud OK → ready; else unsupported
- [ ] `generate` dispatches cloud vs offline
- [ ] `retry` re-runs auto select

### Task 4: UI indicator + loading/settings

**Files:**
- Modify: `src/components/ModelLoadingScreen.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/pages/SettingsPage.tsx`

- [ ] Cloud connecting copy; iOS cloud path
- [ ] Header/Settings show Cloud vs On-device

### Task 5: Deploy wiring + docs + PR

**Files:**
- Modify: `cloudbuild.yaml`, `deploy.sh`, `README.md`
- Include design spec in PR

- [ ] `VITE_GENERATE_ENDPOINT` substitution
- [ ] typecheck + build
- [ ] Commit, push, `gh pr create`
