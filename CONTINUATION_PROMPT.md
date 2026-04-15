# PSC Platform — Advanced Continuation Prompt
# Use this prompt with Claude to complete all remaining features.
# Feed the entire ZIP file as context before using these prompts.

---

## CONTEXT

You are continuing development of **psc-platform**, a production-grade,
full-stack PSC (Public Service Commission Nepal) exam preparation platform.

The ZIP file you have been given contains the COMPLETE base implementation:

### Already built (do NOT rebuild these):
- ✅ All MongoDB Mongoose schemas (Exam, Subject, Question, MockTest, User, Result, StudyPlan, Bookmark, Note)
- ✅ Core engines: scoring.ts (negative marking), analytics.ts (performance), planner.ts (study plan generation)
- ✅ All API routes: /auth, /exams, /subjects, /questions, /tests/start, /tests/submit, /performance, /planner, /bookmarks, /notes
- ✅ All pages: landing, login, register, dashboard, exams, practice, mock test, results, planner, notes, bookmarks
- ✅ All admin pages: overview, exams, subjects, questions (bulk upload), users, notes
- ✅ Zustand exam store with timer, question palette, auto-submit
- ✅ Sidebar + MobileNav layout components
- ✅ DashboardCharts (Recharts), ResultReview, PlannerClient, BulkUploadClient
- ✅ Seed data: Computer Operator exam with 4 subjects and 21 questions
- ✅ Full config: next.config.js, tailwind.config.js, tsconfig.json, docker-compose.yml, .env.example

---

## PHASE 1 — INSTALL & RUN (do this first)

```bash
cd psc-platform
npm install
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local — fill in MONGODB_URI, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
docker compose up -d          # start MongoDB + Redis
npm run seed                  # seed Computer Operator exam data
npm run dev                   # start dev server on http://localhost:3000
```

To create an admin user manually after seeding:
```javascript
// In MongoDB shell or Compass:
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

---

## PHASE 2 — FEATURES TO BUILD NEXT

Use these prompts in sequence. Each builds on the previous.

---

### PROMPT 2A — NaSu & Kharidar Exam Seed Data

```
I have the PSC Platform ZIP with Computer Operator already seeded.
Now create a NEW seed script at scripts/seed-nasu-kharidar.ts that seeds:

1. Nab Suchak (NaSu) exam:
   - 100 questions, 100 marks, 2 hours, −0.25 negative marking
   - Subjects: General Knowledge (30%), Nepali (20%), English (20%), 
     Arithmetic (15%), Computer Basics (15%)
   - 8 real PSC-style questions per subject with full explanations
   - 2 mock tests

2. Kharidar exam:
   - 50 questions, 75 marks, 90 min, −0.25 negative marking
   - Subjects: General Knowledge (35%), Nepali (25%), 
     English (20%), Arithmetic (20%)
   - 8 questions per subject
   - 1 mock test

Follow the EXACT same structure as scripts/seed-computer-operator.ts.
Questions must be real PSC-style multiple-choice with 4 options each,
correct_answer as 0-3 index, and detailed Nepali-context explanations.
```

---

### PROMPT 2B — Leaderboard System

```
The PSC Platform already has Result and MockTest schemas.
Add a leaderboard system:

1. API route: GET /api/leaderboard?test_id=&exam_id=&period=all|week|month
   - Returns top 20 users ranked by score for a test or exam
   - Include: rank, user name (partial — "Ram B."), score, accuracy, time_taken
   - Cache in Redis for 5 minutes using CacheKeys pattern in lib/redis.ts
   
2. Server component: app/(dashboard)/leaderboard/page.tsx
   - Exam selector (dropdown using /api/exams)
   - Test selector filtered by exam
   - Leaderboard table with rank badges (🥇🥈🥉 for top 3)
   - Show the current user's rank highlighted
   - Period filter: This Week / This Month / All Time

3. Add leaderboard link to Sidebar.tsx NAV array

Use existing card, badge, and btn-primary CSS classes from globals.css.
Use @tanstack/react-query for data fetching on the client.
```

---

### PROMPT 2C — Bookmark UX Enhancement + Practice from Bookmarks

```
Currently bookmarks/page.tsx shows bookmarked questions. Enhance it:

1. Add "Practice from bookmarks" button that starts a practice session
   using only bookmarked questions (pass question IDs to /api/tests/start
   as a custom list, test_type='practice').

2. Add note editing: users can add/edit a personal note on each bookmark
   (PUT /api/bookmarks/[id] to update the note field).

3. Add subject filtering: group bookmarks by subject with a filter sidebar.

4. Show an empty illustration when there are no bookmarks.

Keep all existing functionality intact. Use useMutation from @tanstack/react-query.
```

---

### PROMPT 2D — Timed Mini-Tests (5-question speed drills)

```
Add a "Speed Drill" feature for quick 5-minute practice:

1. New page: app/(dashboard)/drill/page.tsx
   - User picks an exam and difficulty
   - Generates 5 random questions (uses POST /api/tests/start with count=5)
   - Timer: exactly 5 minutes, ticking, shows urgency when < 60s
   - No skip/flag — must answer or move on
   - After all 5 answered OR timer ends → instant results card
   - Show streak: "3 drills completed today 🔥"

2. Add "Quick Drill" card to dashboard page.tsx under the stats cards.

3. Track drill results in the existing Result schema (test_type='practice').

Use the existing useExamStore from store/examStore.ts — just configure it
with duration_minutes: 5 and questions length 5. The submit flow already works.
```

---

### PROMPT 2E — Email Notifications (Resend)

```
Add email notification support using Resend (https://resend.com):

1. Install: npm install resend

2. Create lib/email.ts:
   - sendWelcomeEmail(name, email) — triggered on register
   - sendStreakReminderEmail(name, email, streak) — if user hasn't logged in for 2 days
   - sendWeeklyReport(name, email, analytics) — weekly summary

3. React email templates in emails/ folder:
   - WelcomeEmail.tsx — onboarding email with exam links
   - StreakReminderEmail.tsx — "Don't break your streak!" 
   - WeeklyReportEmail.tsx — score, accuracy, weak topics table

4. Trigger welcome email in app/api/auth/register/route.ts after User.create()

5. Add RESEND_API_KEY to .env.example

Use clean, minimal HTML email design — compatible with all email clients.
```

---

### PROMPT 2F — Mobile App Screens (React Native / Expo)

```
The apps/mobile/ directory has the API service and home screen started.
Complete the following React Native screens using the SAME API endpoints:

1. apps/mobile/app/(tabs)/practice.tsx
   - Exam picker → Subject picker → settings (count, difficulty)
   - Question screen with options (TouchableOpacity)
   - Answer reveal with explanation
   - Progress bar at top
   - Uses api.getQuestions() and api.revealAnswer()

2. apps/mobile/app/(tabs)/mock.tsx  
   - Mock test list grouped by exam
   - "Start Test" button → navigates to mock/[id]/test.tsx
   - Uses api.getExams() and api.getExam()

3. apps/mobile/app/mock/[id]/test.tsx
   - Full mock test with countdown timer (useExamTimer hook)
   - Question display + 4 option buttons
   - Bottom: prev/next navigation + submit button
   - Palette modal (bottom sheet) showing answered/skipped/flagged
   - Auto-submit when timer hits 0

4. apps/mobile/app/(tabs)/dashboard.tsx
   - Performance stats cards (4 metrics)
   - Recent test list with score/accuracy
   - Uses api.getPerformance()

Use React Native StyleSheet, not Tailwind.
Use expo-router for navigation.
Colors: primary #2563eb, bg #f9fafb (light), #030712 (dark).
```

---

### PROMPT 2G — Admin Analytics Dashboard

```
Add an analytics page to the admin panel at app/admin/analytics/page.tsx:

1. Platform overview charts (server component + DashboardCharts):
   - Daily new registrations (last 30 days) — bar chart
   - Tests attempted per day (last 30 days) — line chart  
   - Most attempted questions (top 10 by attempt_count) — horizontal bar
   - Average accuracy by exam — grouped bar chart
   - Subject difficulty heatmap (correct_count/attempt_count per subject)

2. Data aggregation functions using MongoDB aggregation pipelines:
   - getDailyRegistrations(days: number): User.aggregate([...])
   - getDailyAttempts(days: number): Result.aggregate([...])
   - getMostAttemptedQuestions(limit: number): Question.aggregate([...])
   - getExamAccuracy(): Result.aggregate([...])

3. Export button: download all analytics as CSV
   (use Papa Parse or manual CSV generation in a client component)

Add /admin/analytics to the AdminLayout nav array.
Use Recharts for all charts — import from 'recharts'.
```

---

### PROMPT 2H — PWA + Offline Support

```
Make the web app a Progressive Web App (PWA) with offline support:

1. Install next-pwa: npm install next-pwa

2. Configure in next.config.js:
   const withPWA = require('next-pwa')({ dest: 'public', disable: process.env.NODE_ENV === 'development' })

3. Create public/manifest.json:
   - name: "PSC Prep", short_name: "PSC", theme_color: "#2563eb"
   - icons in /public/icons/ (192x192 and 512x512)
   - display: "standalone", start_url: "/dashboard"

4. Service worker caching strategy:
   - Cache-first: static assets, fonts, images
   - Network-first: API calls (fall back to stale data)
   - Offline fallback page: app/offline/page.tsx — "You're offline. Questions you've started will sync when you reconnect."

5. Offline question caching:
   - After a practice session loads questions, store them in IndexedDB
   - If offline on next visit, load from IndexedDB and show "Offline mode" badge
   - Use idb-keyval: npm install idb-keyval

Add "Install App" button to the landing page.
```

---

### PROMPT 2I — Search Functionality

```
Add a global search feature to the platform:

1. API route: GET /api/search?q=&type=question|exam|note&limit=10
   - Questions: full-text search on question_text using MongoDB text index
   - Exams: search on name and description
   - Notes: search on title
   - Returns combined results with type labels

2. MongoDB text index setup (add to seed script):
   db.questions.createIndex({ question_text: 'text', tags: 'text' })
   db.exams.createIndex({ name: 'text', description: 'text' })

3. Search UI:
   - Global search bar in the Sidebar above the nav links (cmd+K shortcut)
   - SearchModal.tsx (fixed overlay, clean popover style)
   - Results grouped by type: Questions, Exams, Notes
   - Click question result → opens practice mode with that question first
   - Keyboard nav: arrow keys to move, Enter to select, Esc to close
   - Debounce: 300ms before firing API call

4. Use @tanstack/react-query for search with enabled: !!query && query.length >= 2
```

---

### PROMPT 2J — Rate Limiting & Security Hardening

```
Add production security measures:

1. Rate limiting middleware using upstash/ratelimit:
   npm install @upstash/ratelimit @upstash/redis

   Create lib/rateLimit.ts with limits:
   - /api/auth/register: 5 requests per hour per IP
   - /api/tests/start: 20 per hour per user
   - /api/tests/submit: 20 per hour per user
   - /api/* general: 200 per minute per IP

2. Input validation with Zod on ALL API routes:
   - Create lib/validators.ts with Zod schemas for each request body
   - Validate in each route.ts before processing
   - Return 400 with validation errors in JSON

3. API key auth for mobile app:
   - Add X-API-Key header validation for /api/* routes
   - Store key in env: MOBILE_API_KEY
   - Mobile app sends this header on every request

4. Security headers in next.config.js:
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - Referrer-Policy: strict-origin-when-cross-origin
   - Content-Security-Policy (permissive for cloudinary + google)

5. Audit log: create AuditLog mongoose model, log admin actions
   (exam create/edit, question upload, user role change) to MongoDB
```

---

## PHASE 3 — DEPLOYMENT CHECKLIST

Before deploying to production, verify:

```bash
# 1. Build succeeds
npm run build

# 2. Environment variables set in Vercel dashboard:
#    MONGODB_URI, NEXTAUTH_SECRET, NEXTAUTH_URL,
#    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
#    REDIS_URL, CLOUDINARY_*, RESEND_API_KEY

# 3. MongoDB Atlas indexes created:
db.questions.createIndex({ exam_id: 1, subject_id: 1, difficulty: 1 })
db.questions.createIndex({ exam_id: 1, tags: 1 })
db.questions.createIndex({ question_text: "text", tags: "text" })
db.results.createIndex({ user_id: 1, created_at: -1 })
db.results.createIndex({ test_id: 1 })
db.bookmarks.createIndex({ user_id: 1, question_id: 1 }, { unique: true })

# 4. Seed production database
MONGODB_URI=<atlas_uri> npm run seed

# 5. Create admin user
# In Atlas shell: db.users.updateOne({email:"admin@yoursite.com"},{$set:{role:"admin"}})

# 6. Test full flow:
#    Register → Login → Start Mock Test → Submit → Check Results → Check Dashboard
```

---

## ARCHITECTURE REMINDER

When adding new features, always follow this pattern:

1. **Schema change?** → Edit packages/shared/models/index.ts
2. **New API endpoint?** → Create apps/web/app/api/[route]/route.ts
   - Import helpers: connectDB, getServerSession, authOptions
   - Use response helpers: ok(), created(), err(), unauthorized(), serverError()
   - Cache with: cacheGet(), cacheSet(), CacheKeys from lib/redis.ts
3. **New page?** → Create under apps/web/app/(dashboard)/[page]/page.tsx
   - Server component by default (async, no 'use client')
   - Client components go in components/ with 'use client' at top
4. **New exam type?** → Admin panel only — zero code changes needed
5. **Mobile?** → Same API URLs, just use api.ts service from apps/mobile/services/api.ts

The platform is 100% API-first — all logic lives in /api routes,
not in page server actions, so mobile always stays in sync.
