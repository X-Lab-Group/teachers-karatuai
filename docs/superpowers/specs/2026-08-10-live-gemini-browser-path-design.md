# Live Gemini Browser Path (Auto Online)

Date: 2026-08-10  
Repo: `X-Lab-Group/teachers-karatuai`  
Decision: Mode **A** (auto online → Gemini; offline/fail → on-device Gemma), approach **1** (Cloud Function proxy)  
Jay approved: mode A, approach 1

## Goal

Make the browser app usable immediately for teachers with internet by calling a live Gemini model through a server proxy, without downloading the ~1.9 GB on-device Gemma model first. Keep full offline / Android APK behavior as a fallback.

## Non-goals

- No Gemini API key in the Vite client bundle
- No rewrite of lesson / scheme / activity / assessment generators (they keep using `generate(prompt)`)
- No removal of MediaPipe on-device path
- No billing / account system in this PR
- No coupling to main `karatuai.com` AI backend

## Current architecture

- `AppShell` wraps app routes in `ModelProvider`
- `ModelProvider` downloads/loads Gemma via MediaPipe, then exposes:
  - `status`, `progress`, `error`, `isReady`
  - `generate(prompt, onToken?) → Promise<string>`
  - `retry()`
- Generators (`useLessonGenerator`, scheme/activity/assessment pages) only call `generate` when `isReady`
- Landing page does not load the model

## Target behavior

```
App enters ModelProvider
  ├─ If navigator.onLine && VITE_GENERATE_ENDPOINT set
  │    → probe / ready via lightweight health or first generate readiness
  │    → status = ready, backend = "cloud"
  │    → skip Gemma download
  ├─ Else / cloud probe fails
  │    → existing on-device init (download → load → ready), backend = "offline"
  └─ generate()
       ├─ if backend cloud → POST proxy, stream/relay tokens
       └─ if backend offline → MediaPipe LlmInference (unchanged)
```

Fallback rules:

1. Start cloud when online + endpoint configured.
2. If cloud probe fails (network, 5xx, missing secret), fall through to on-device init.
3. If a cloud `generate` fails mid-session and on-device model is already cached/ready, optionally retry once on-device; if on-device is not loaded, surface the cloud error and offer Retry (which re-runs auto selection).
4. If offline at boot (`navigator.onLine === false`), go straight to on-device (or iOS unsupported if no cloud).

iOS:

- Today: `unsupported` because MediaPipe cannot load.
- With cloud: iOS browsers become supported when the endpoint is configured and online.
- If cloud unavailable on iOS: keep the existing unsupported message (do not attempt Gemma download).

## Backend: Cloud Function `karatuai-generate`

Mirror `functions/support/`:

| Item | Value |
|------|--------|
| Path | `functions/generate/` |
| Runtime | Node 22, gen2, `us-central1` |
| Trigger | HTTP |
| Secret | `GEMINI_API_KEY` via `--set-secrets` |
| Model | `gemini-2.5-flash` (override with env `GEMINI_MODEL` if needed) |
| Auth | Unauthenticated HTTP (same as support), with hardening below |

### Request / response

`POST /` JSON:

```json
{
  "prompt": "<full text prompt from the client>"
}
```

Response options for v1:

- **Preferred:** `text/plain` chunked stream of UTF-8 deltas (easy to map to `onToken`)
- Fallback if streaming is awkward in Functions Framework: single JSON `{ "text": "..." }` and client synthesizes one `onToken` call with the full text (generators still work; streaming UX is nicer but not required for correctness)

v1 can ship non-streaming JSON first if faster, then add streaming in a follow-up. Spec preference: implement streaming if ≤1 hour extra; otherwise JSON is acceptable for the PR.

### Hardening (required in v1)

- CORS: allow `https://teachers.karatuai.com`, `http://localhost:5173`, `http://127.0.0.1:5173` (and Capacitor origins only if needed later)
- Methods: `POST`, `OPTIONS` only
- Body size cap: reject prompts > 100_000 characters
- Empty prompt → 400
- Missing `GEMINI_API_KEY` → 503
- Basic in-memory rate limit per IP (e.g. 30 req / 10 min) — best-effort on Cloud Functions; document that abuse controls may need Cloud Armor later

### Client env

- `VITE_GENERATE_ENDPOINT` — full HTTPS URL of the deployed function
- Wired through `cloudbuild.yaml` + `deploy.sh` substitutions like the support/classroom endpoints

## Frontend changes

### `model-context.ts`

Extend status value:

```ts
export type ModelBackend = 'cloud' | 'offline' | 'none'

export interface ModelStatusValue {
  status: ModelStatus
  progress: number
  error: string | null
  isReady: boolean
  backend: ModelBackend
}
```

### `ModelContext.tsx`

- On init: try cloud path first when online + endpoint present
- Cloud ready → `status: 'ready'`, `backend: 'cloud'`, `progress: 100`
- Otherwise existing MediaPipe path → `backend: 'offline'`
- `generate`: dispatch to cloud client or `llmInstance`
- `retry`: clear cloud/offline state and re-run auto selection

### New `src/lib/cloud-generate.ts`

- `isCloudGenerateConfigured(): boolean`
- `probeCloudGenerate(): Promise<boolean>` (optional HEAD/POST with tiny prompt, or treat first success as probe)
- `cloudGenerate(prompt, onToken?): Promise<string>`

### `ModelLoadingScreen.tsx`

- When attempting cloud: short “Connecting to cloud AI…” state (reuse checking/loading)
- Skip download copy when `backend === 'cloud'`
- iOS: if cloud configured, do not show unsupported until cloud fails

### Header indicator

- Small chip / tooltip: “Cloud AI” vs “On-device AI” based on `backend`
- Keep existing ready/not-ready color

### Settings

- Show which backend is active
- Keep retry control

## Files to add / change

| File | Change |
|------|--------|
| `functions/generate/index.js` | New Gemini proxy |
| `functions/generate/package.json` | deps: functions-framework, `@google/generative-ai` |
| `src/lib/cloud-generate.ts` | Client for endpoint |
| `src/contexts/model-context.ts` | Add `backend` |
| `src/contexts/ModelContext.tsx` | Auto select + dispatch |
| `src/components/ModelLoadingScreen.tsx` | Cloud / iOS messaging |
| `src/components/layout/Header.tsx` | Backend chip |
| `src/pages/SettingsPage.tsx` | Show backend |
| `cloudbuild.yaml` / `deploy.sh` | Pass `VITE_GENERATE_ENDPOINT` |
| `README.md` | Document cloud path + secret |

## Acceptance criteria

1. With endpoint + key deployed and online browser: open `/curriculum` reaches ready without downloading Gemma.
2. Lesson plan (and other generators) produce content via cloud path.
3. Airplane mode / no endpoint: existing on-device download/load still works on desktop/Android.
4. iOS online + endpoint: app is usable (not stuck on unsupported).
5. iOS offline / no endpoint: unsupported message remains.
6. API key never appears in client source maps or env baked into JS except the public endpoint URL.
7. `npm run typecheck` and `npm run build` pass.
8. PR opened against `main` (not merged until Jay asks).

## Deploy gate (human)

Requires before production works:

1. Create/store `GEMINI_API_KEY` in GCP Secret Manager (`dolly-party-hrms`)
2. Deploy `karatuai-generate` with that secret
3. Rebuild/redeploy the web app with `VITE_GENERATE_ENDPOINT` set to the function URL

Code can merge and be tested locally with a local function + `.env` before production secret is available.

## Open questions (resolved)

- Selection mode: Auto A — resolved
- Architecture: Cloud Function proxy — resolved
- Gemini key availability: deploy-time gate; do not block PR implementation
