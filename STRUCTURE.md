# PSC Exam Platform — Full Project Structure

```
psc-platform/
├── apps/
│   ├── web/                          # Next.js 14 Web App
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── exam/[slug]/page.tsx
│   │   │   │   ├── practice/[exam]/[subject]/page.tsx
│   │   │   │   ├── mock/[exam]/page.tsx
│   │   │   │   ├── mock/[exam]/result/[resultId]/page.tsx
│   │   │   │   ├── planner/page.tsx
│   │   │   │   └── notes/[exam]/page.tsx
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── exams/page.tsx
│   │   │   │   ├── questions/page.tsx
│   │   │   │   └── users/page.tsx
│   │   │   ├── api/
│   │   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   │   ├── exams/route.ts
│   │   │   │   ├── exams/[slug]/route.ts
│   │   │   │   ├── subjects/route.ts
│   │   │   │   ├── questions/route.ts
│   │   │   │   ├── questions/bulk/route.ts
│   │   │   │   ├── tests/start/route.ts
│   │   │   │   ├── tests/submit/route.ts
│   │   │   │   ├── performance/route.ts
│   │   │   │   ├── planner/generate/route.ts
│   │   │   │   ├── planner/[id]/progress/route.ts
│   │   │   │   ├── bookmarks/route.ts
│   │   │   │   └── notes/route.ts
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Progress.tsx
│   │   │   │   └── Modal.tsx
│   │   │   ├── exam/
│   │   │   │   ├── ExamCard.tsx
│   │   │   │   ├── QuestionRenderer.tsx
│   │   │   │   ├── TimerBar.tsx
│   │   │   │   ├── OptionButton.tsx
│   │   │   │   └── ResultSummary.tsx
│   │   │   ├── analytics/
│   │   │   │   ├── PerformanceChart.tsx
│   │   │   │   ├── SubjectRadar.tsx
│   │   │   │   └── WeakTopics.tsx
│   │   │   └── layout/
│   │   │       ├── Sidebar.tsx
│   │   │       ├── Header.tsx
│   │   │       └── MobileNav.tsx
│   │   ├── lib/
│   │   │   ├── db.ts                 # MongoDB connection
│   │   │   ├── auth.ts               # NextAuth config
│   │   │   ├── redis.ts              # Redis client
│   │   │   └── cloudinary.ts         # File upload
│   │   ├── store/
│   │   │   ├── examStore.ts          # Zustand exam state
│   │   │   └── userStore.ts          # Zustand user state
│   │   └── types/
│   │       └── index.ts              # Shared TypeScript types
│   │
│   └── mobile/                       # React Native (Expo) — Future
│       ├── app/
│       │   ├── (tabs)/
│       │   │   ├── index.tsx         # Home
│       │   │   ├── practice.tsx
│       │   │   ├── mock.tsx
│       │   │   ├── dashboard.tsx
│       │   │   └── planner.tsx
│       │   └── _layout.tsx
│       ├── components/
│       └── services/
│           └── api.ts                # Shared API client (same endpoints)
│
├── packages/
│   └── shared/
│       ├── types/index.ts            # Types used by web + mobile
│       └── utils/
│           ├── scoring.ts            # Negative marking logic
│           ├── analytics.ts          # Performance calculations
│           └── planner.ts            # Study plan generation
│
└── docker-compose.yml                # MongoDB + Redis local dev
```
