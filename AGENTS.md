# KaratuAI - Teacher's Companion

## Project Overview
PWA + Mobile app helping African teachers create lesson plans, activities, and assessments using on-device AI (Gemma 4).

## Live Deployment
- **App URL**: https://karatuai-teachers-companion-25390365712.us-central1.run.app
- **GitHub**: https://github.com/JatoJay/teachers-digital-literacy

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript check
- `npm run preview` - Preview production build
- `./deploy.sh` - Deploy to Google Cloud Run

## Mobile (Capacitor)
- `npm run cap:add:android` - Add Android platform
- `npm run cap:add:ios` - Add iOS platform
- `npm run cap:sync` - Sync web assets to native
- `npm run cap:open:android` - Open in Android Studio
- `npm run cap:open:ios` - Open in Xcode

## Architecture
- **Framework**: React 19 + TypeScript + Vite 8
- **UI**: Tailwind CSS 4 + DaisyUI 5
- **Storage**: IndexedDB via Dexie.js
- **AI**: Gemma 4 via MediaPipe LlmInference
- **Mobile**: Capacitor 8

## Cloud Services (GCP)
- **Project ID**: `dolly-party-hrms`
- **Region**: `us-central1`
- **Cloud Run Service**: `karatuai-teachers-companion`
- **GCS Bucket**: `gs://karatuai-models/`
- **AI Model URL**: `https://storage.googleapis.com/karatuai-models/gemma-4-E2B-it-web.task` (1.87 GB)

## Key Files

### AI Model Integration
- `src/contexts/model-context.ts` - Context definition for model state
- `src/contexts/ModelContext.tsx` - ModelProvider component (loads Gemma model on app start)
- `src/hooks/useModel.ts` - Hook to access model state and generate() function
- `src/components/ModelLoadingScreen.tsx` - Loading UI during model download

### Content Generation
- `src/lib/prompts/lesson-plan.ts` - Prompt templates for lesson/activity/assessment generation
- `src/hooks/useLessonGenerator.ts` - Hook for lesson plan generation with streaming

### Pages
- `src/pages/LessonPlannerPage.tsx` - Create AI-generated lesson plans
- `src/pages/ActivitiesPage.tsx` - Create classroom activities
- `src/pages/AssessmentsPage.tsx` - Create quizzes and tests
- `src/pages/SettingsPage.tsx` - App settings and model status

### Storage
- `src/lib/db/index.ts` - IndexedDB schema and operations via Dexie.js

### UI Components
- `src/components/ui/` - Button, Card, Input, Select, TextArea
- `src/components/layout/` - Header, BottomNav, Layout

## Model Loading Flow
1. `App.tsx` wraps app in `<ModelProvider>`
2. `ModelProvider` auto-initializes model on mount
3. `ModelLoadingScreen` shows progress overlay until model ready
4. Pages use `useModel()` hook to access `generate()` function

## Deployment Flow
1. `./deploy.sh` runs Cloud Build
2. Docker builds nginx container with static assets
3. Deploys to Cloud Run with public access
4. App fetches AI model from GCS on first load

## Design Principles
- Large touch targets (48px minimum)
- Simple, clear language
- Works offline after model download
- Low bandwidth friendly (model cached in browser)
- Culturally relevant for African educators
