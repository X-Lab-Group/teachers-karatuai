# KaratuAI · Teacher's Companion

> AI lesson planning that runs entirely on your phone. Built for teachers across Africa.

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](./LICENSE)
[![Platform: Web](https://img.shields.io/badge/web-PWA-0d9488)](https://teachers.karatuai.com)
[![Platform: Android](https://img.shields.io/badge/android-APK-10b981)](https://storage.googleapis.com/karatuai-models/apks/karatuai-android-v1.2.2.apk)
[![Powered by Gemma](https://img.shields.io/badge/AI-Gemma%20on--device-4f46e5)](https://ai.google.dev/gemma)

KaratuAI helps African teachers generate **schemes of work, lesson plans, classroom activities, and assessments** — entirely offline, on whatever device they already own. The AI runs locally in the browser via WebAssembly, so nothing teachers type ever leaves their device.

- **Live app:** <https://teachers.karatuai.com>
- **Status:** v1.0 (Web + Android). iPhone app on the roadmap.

---

## Why this exists

Generative AI tools are useful for lesson planning, but the dominant ones (ChatGPT, Claude, Gemini API) assume cheap mobile data, fast WiFi, and recurring subscription fees — three things many teachers in Kenya, Nigeria, Ghana, Uganda, and across the continent do not have. KaratuAI inverts those assumptions:

- The AI model downloads **once** (1.87 GB) over WiFi, then runs forever offline.
- There is no server, no account, no per-message cost.
- Student names, school details, and lesson notes never leave the device.
- The codebase is MIT-licensed so a ministry of education can clone, brand, and ship a national version without a procurement call.

---

## Features

- **Curriculum library** — browse uploaded curricula by subject and grade.
- **Scheme of work generator** — full term mapped out by week.
- **Lesson plan generator** — introduction, main content, examples, closing activity for one period.
- **Activities generator** — hands-on group work, role plays, demonstrations using local materials.
- **Assessment generator** — multiple-choice, short answer, and open-ended questions with mark schemes.
- **Print-ready output** — every generated artifact can be printed or saved as PDF.
- **Local persistence** — IndexedDB stores everything generated, survives across sessions.
- **Resumable model download** — chunked into 50 MB pieces so a screen lock or network blip does not restart the 1.87 GB download.
- **Device-aware install** — landing page detects iOS, Android, and desktop, and presents the right path for each.

---

## Architecture

### On-device inference

KaratuAI uses Google's [Gemma](https://ai.google.dev/gemma) model (`gemma-4-E2B-it-web.task`, ~1.87 GB) executed via [MediaPipe Tasks GenAI](https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference) compiled to WebAssembly. The model runs in the user's browser tab — there is no inference server.

### Chunked model download

The 1.87 GB model is too large to fetch as a single response on a slow connection (a screen lock or signal drop would restart the entire download). Instead the page-side downloader in [`src/lib/model-cache.ts`](./src/lib/model-cache.ts) issues HTTP `Range` requests for 50 MB chunks, stores each chunk as its own entry in the Cache Storage API, and resumes from the last completed chunk on retry. A pre-flight `navigator.storage.estimate()` check fails fast if the device cannot fit the model. A Wake Lock keeps the screen on while the download runs.

### Service worker assembly

When MediaPipe asks for the model, the service worker in [`public/sw.js`](./public/sw.js) intercepts the request and stitches the 39 cached chunks back into a single streaming `Response`. Bytes flow from cache to MediaPipe one chunk at a time, so peak memory stays at ~50 MB instead of the full model size.

### Routing

- `/` — public landing page (no model, loads instantly).
- `/curriculum`, `/scheme`, `/lesson`, `/activities`, `/assessments`, `/settings` — wrapped by `AppShell`, which gates every app route behind `ModelProvider` and `ModelLoadingScreen`.

---

## Tech stack

| Layer            | Choice                                                     |
| ---------------- | ---------------------------------------------------------- |
| Framework        | React 19 + TypeScript                                      |
| Bundler          | Vite 8 (Rolldown)                                          |
| Styling          | Tailwind CSS 4 + DaisyUI 5                                 |
| Routing          | React Router 7                                             |
| Animation        | Framer Motion 12                                           |
| AI runtime       | MediaPipe Tasks GenAI (`@mediapipe/tasks-genai`) + WebAssembly |
| Model            | Gemma 3 (E2B), `.task` format, ~1.87 GB                    |
| Persistent cache | Cache Storage API + IndexedDB (Dexie.js)                   |
| Native shell     | Capacitor 8 (Android, iOS pending)                         |
| Hosting          | Google Cloud Run (nginx + static assets)                   |
| Model storage    | Google Cloud Storage (`gs://karatuai-models/`)             |
| Custom domain    | `teachers.karatuai.com`                                    |

---

## Getting started

### Prerequisites

- **Node.js** 20 or newer (22+ recommended — Capacitor 8 emits an `EBADENGINE` warning on Node 20).
- **npm** 10+.
- **Git**.

For Android builds:

- **Android Studio** (latest stable).
- **Java 21** (required by Capacitor 8). On macOS: `brew install openjdk@21`.

### Install and run

```bash
git clone https://github.com/X-Lab-Group/teachers-karatuai.git
cd teachers-karatuai
npm install
npm run dev
```

The dev server runs on `http://localhost:5173`. The first time you visit `/curriculum` (or any app route), the browser will download the AI model from `https://storage.googleapis.com/karatuai-models/gemma-4-E2B-it-web.task` — this takes a few minutes on a fast connection and is cached afterwards.

### Production build

```bash
npm run build
npm run preview   # serves dist/ locally for inspection
```

---

## Available scripts

| Script                   | What it does                                                |
| ------------------------ | ----------------------------------------------------------- |
| `npm run dev`            | Start the Vite dev server with HMR                          |
| `npm run build`          | Type-check (`tsc -b`) and build production assets to `dist/` |
| `npm run preview`        | Serve the built `dist/` locally                             |
| `npm run lint`           | Run ESLint over the codebase                                |
| `npm run typecheck`      | Run TypeScript without emitting                             |
| `npm run cap:add:android`| Add the Android platform via Capacitor                      |
| `npm run cap:add:ios`    | Add the iOS platform via Capacitor                          |
| `npm run cap:sync`       | Sync built web assets into native projects                  |
| `npm run cap:open:android`| Open the Android project in Android Studio                 |
| `npm run cap:open:ios`   | Open the iOS project in Xcode                               |

---

## Project structure

```
.
├── src/
│   ├── pages/                  # Top-level routes (Landing, Curriculum, Lesson, ...)
│   ├── components/
│   │   ├── AppShell.tsx        # Wraps app routes in ModelProvider + loading screen
│   │   ├── ModelLoadingScreen.tsx
│   │   ├── layout/             # Header, BottomNav, Layout
│   │   └── ui/                 # Button, Card, Input, Select, TextArea
│   ├── contexts/
│   │   ├── ModelContext.tsx    # Loads Gemma, exposes generate()
│   │   └── model-context.ts
│   ├── hooks/
│   │   ├── useModel.ts
│   │   └── useLessonGenerator.ts
│   ├── lib/
│   │   ├── model-cache.ts      # Chunked download + Cache Storage writer
│   │   ├── device.ts           # iOS/Android/desktop detection
│   │   ├── prompts/            # Prompt templates per content type
│   │   ├── db/                 # IndexedDB schema (Dexie)
│   │   ├── pdf-parse.ts        # Curriculum PDF ingestion
│   │   └── print.ts            # Print-friendly output
│   └── workers/                # Web workers (PDF parsing, etc.)
├── public/
│   ├── sw.js                   # Service worker: model assembly + offline shell
│   ├── manifest.json           # PWA manifest
│   └── icons/
├── android/                    # Capacitor Android project (generated)
├── nginx.conf                  # Production nginx config (Cloud Run container)
├── Dockerfile                  # Multi-stage: Node build -> nginx serve
├── cloudbuild.yaml             # Cloud Build pipeline
├── deploy.sh                   # One-command deploy script
└── capacitor.config.ts         # Capacitor app metadata
```

---

## Mobile (Capacitor / Android)

The Android app is a thin Capacitor shell around the same web build. To build it locally:

```bash
npm run build
npm run cap:sync

# Make sure Java 21 is on your PATH for this step:
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export PATH="$JAVA_HOME/bin:$PATH"

cd android
./gradlew assembleDebug
# APK will be at android/app/build/outputs/apk/debug/app-debug.apk
```

To open the project in Android Studio instead:

```bash
npm run cap:open:android
```

The current published APK is `karatuai-android-v1.2.2.apk` (~3.9 MB, signed release build), uploaded to `gs://karatuai-models/apks/`. iOS is not yet shipped because on-device AI does not fit in iPhone WebKit's per-tab memory budget — a native iOS app is on the roadmap.

---

## Deployment

KaratuAI is deployed to **Google Cloud Run** via Cloud Build. The deployment script ([`deploy.sh`](./deploy.sh)) handles everything in one command:

```bash
./deploy.sh
```

What it does:

1. Sets the active GCP project to `dolly-party-hrms`.
2. Enables required APIs (Cloud Build, Cloud Run, Storage).
3. Ensures the `karatuai-models` GCS bucket exists with public-read ACL and CORS for Range requests.
4. Submits a Cloud Build that:
   - Builds the Vite production bundle inside a Node 20 container.
   - Packages it into an nginx Alpine image with [`nginx.conf`](./nginx.conf).
   - Pushes the image to GCR and deploys to Cloud Run.

The Cloud Run service is fronted by the custom domain `teachers.karatuai.com`. The nginx config disables absolute redirects so the internal `:8080` listen port is never leaked into client-visible `Location` headers.

### Uploading a new AI model

```bash
curl -L -o gemma-4-E2B-it-web.task \
  'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-web.task'

gsutil cp gemma-4-E2B-it-web.task gs://karatuai-models/
```

Bump `CACHE_NAME` in `src/lib/model-cache.ts` and `MODEL_CACHE` in `public/sw.js` if you change anything about the chunking layout — old caches are evicted on activate.

---

## The AI model

| Attribute       | Value                                                        |
| --------------- | ------------------------------------------------------------ |
| Model           | Gemma 3 (E2B variant, instruction-tuned)                     |
| Format          | MediaPipe `.task`                                            |
| Size            | ~1.87 GB (`2,003,697,664` bytes)                             |
| Source          | Hugging Face (`litert-community/gemma-4-E2B-it-litert-lm`)   |
| Runtime         | MediaPipe Tasks GenAI compiled to WebAssembly                |
| Inputs          | Text only (image/audio not yet wired through the web SDK)    |
| Storage         | Public Google Cloud Storage bucket: `gs://karatuai-models/`  |
| Public URL      | `https://storage.googleapis.com/karatuai-models/gemma-4-E2B-it-web.task` |

---

## Roadmap

- [ ] Native iOS app (current iPhone WebKit memory caps prevent the web build from running).
- [ ] Play Store listing for Android.
- [ ] Multi-language UI (Swahili, French, Hausa).
- [ ] Image input (charts, photos of textbook pages).
- [ ] Country-specific curriculum packs as data, not code.
- [ ] Smaller / faster model variants for low-end devices.

---

## Sponsorship

KaratuAI is built as a public good — there are no subscriptions, no ads, and no data harvesting. Sponsorships pay for the bandwidth that delivers the AI model to teachers in low-bandwidth regions and the engineering time that keeps the project improving.

| Tier              | Who it's for                                            | What it funds                                                                 |
| ----------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Friend**        | Individuals and small donors                            | Server bandwidth that delivers the model to teachers on slow connections.     |
| **School patron** | Schools, NGOs, and small foundations                    | Specific features — new subject packs, local-language UI, curriculum imports. |
| **Partner**       | Ministries of education and large institutional funders | A localized, branded deployment shipped at country scale.                     |

To sponsor, partner with us, or just learn more, email **[info@karatuai.com](mailto:info@karatuai.com?subject=KaratuAI%20sponsorship%20enquiry)**. We reply within two working days.

---

## Contributing

Contributions are very welcome — especially from teachers, education researchers, and developers based in countries the app is meant to serve.

1. Fork the repository.
2. Create a branch: `git checkout -b feature/your-change`.
3. Make your changes and run `npm run lint && npm run typecheck`.
4. Commit and push: `git commit -m "Describe your change" && git push origin feature/your-change`.
5. Open a pull request.

For larger ideas — new content types, curriculum integrations, country-specific deployments — please open an issue first so we can discuss the shape together.

---

## License

KaratuAI is released under the [MIT License](./LICENSE). You can use, modify, and redistribute it freely, including for commercial deployments. We only ask that the project's license notice travels with derivative works.

---

## Contact

- **Email:** [info@karatuai.com](mailto:info@karatuai.com)
- **Sponsorship & partnerships:** [info@karatuai.com](mailto:info@karatuai.com?subject=KaratuAI%20sponsorship%20enquiry)
- **Issues & feature requests:** [GitHub Issues](https://github.com/X-Lab-Group/teachers-karatuai/issues)

---

## Acknowledgements

- **[Google Gemma](https://ai.google.dev/gemma)** — the open-weights model that makes this possible.
- **[MediaPipe Tasks GenAI](https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference)** — the on-device inference runtime.
- **African teachers** who tested early builds, told us when something didn't make sense, and reminded us what classrooms actually look like.

---

Built for African teachers. Powered by Gemma running on your device.
