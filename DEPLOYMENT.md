# PSC Platform — Mobile App Architecture & Deployment Guide

## Mobile App Architecture (React Native / Expo)

### Core Principle: API-First
The mobile app uses **exactly the same API endpoints** as the web app.
No backend changes needed to add mobile support.

### Shared API Service

```typescript
// apps/mobile/services/api.ts
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-domain.com';

class ApiService {
  private token: string | null = null;

  setToken(t: string) { this.token = t; }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...options?.headers,
      },
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  }

  // Exams
  getExams = () => this.request<Exam[]>('/exams');
  getSubjects = (examId: string) => this.request<Subject[]>(`/subjects?exam_id=${examId}`);

  // Tests
  startTest = (testId: string, type: string) =>
    this.request('/tests/start', { method: 'POST', body: JSON.stringify({ test_id: testId, test_type: type }) });
  submitTest = (payload: SubmitPayload) =>
    this.request('/tests/submit', { method: 'POST', body: JSON.stringify(payload) });

  // Analytics
  getPerformance = (examId?: string) =>
    this.request(`/performance${examId ? `?exam_id=${examId}` : ''}`);

  // Planner
  generatePlan = (payload: PlanPayload) =>
    this.request('/planner/generate', { method: 'POST', body: JSON.stringify(payload) });
}

export const api = new ApiService();
```

### Mobile Screens

```
apps/mobile/app/
├── (tabs)/
│   ├── _layout.tsx         # Tab navigator
│   ├── index.tsx           # Home — exam list + streak
│   ├── practice.tsx        # Subject-wise MCQ practice
│   ├── mock.tsx            # Mock test list + timer UI
│   ├── dashboard.tsx       # Analytics charts
│   └── planner.tsx         # Study planner calendar
├── exam/[slug].tsx         # Exam detail
├── mock/[id]/test.tsx      # Active mock test
└── mock/[id]/result.tsx    # Result screen
```

### Key Mobile Components

```typescript
// Native timer hook — same logic as web store
export function useExamTimer(durationMinutes: number) {
  const [remaining, setRemaining] = useState(durationMinutes * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { setRunning(false); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  return { remaining, running, start: () => setRunning(true), stop: () => setRunning(false) };
}
```

---

## Deployment Guide

### Prerequisites
- Node.js 20+
- MongoDB Atlas cluster (free tier works for dev)
- Vercel account
- Redis (Upstash — free tier)

### Step 1 — Local Development

```bash
# Clone and install
git clone <repo>
cd psc-platform
npm install

# Start MongoDB + Redis locally
docker compose up -d

# Copy env
cp .env.example apps/web/.env.local
# Fill in MONGODB_URI, NEXTAUTH_SECRET, etc.

# Seed database
npm run seed

# Run dev server
npm run dev
# → http://localhost:3000
```

### Step 2 — MongoDB Atlas Setup

1. Create cluster at cloud.mongodb.com
2. Create database user with readWrite role
3. Whitelist IP: 0.0.0.0/0 (for Vercel serverless)
4. Get connection string:
   `mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/psc-platform`
5. Create indexes (run this once):

```javascript
// In MongoDB Atlas Shell or compass:
db.questions.createIndex({ exam_id: 1, subject_id: 1, difficulty: 1 })
db.questions.createIndex({ exam_id: 1, tags: 1 })
db.results.createIndex({ user_id: 1, created_at: -1 })
db.results.createIndex({ test_id: 1 })
db.subjects.createIndex({ exam_id: 1, slug: 1 }, { unique: true })
db.bookmarks.createIndex({ user_id: 1, question_id: 1 }, { unique: true })
```

### Step 3 — Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# From apps/web directory:
vercel

# Set environment variables:
vercel env add MONGODB_URI
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add REDIS_URL  # Upstash Redis URL
vercel env add CLOUDINARY_CLOUD_NAME
vercel env add CLOUDINARY_API_KEY
vercel env add CLOUDINARY_API_SECRET

# Deploy production:
vercel --prod
```

### Step 4 — Upstash Redis (for Vercel)

1. Go to upstash.com → Create Redis database
2. Copy REST URL and Token
3. Use `@upstash/redis` package instead of `redis` package for edge compatibility:

```typescript
import { Redis } from '@upstash/redis';
const redis = new Redis({ url: process.env.UPSTASH_URL!, token: process.env.UPSTASH_TOKEN! });
```

### Step 5 — Post-Deployment Checklist

- [ ] Seed production database: `MONGODB_URI=<prod> npm run seed`
- [ ] Create admin user manually in Atlas
- [ ] Set Google OAuth redirect URI: `https://your-domain.com/api/auth/callback/google`
- [ ] Test exam start → submit flow end-to-end
- [ ] Verify negative marking calculation in result
- [ ] Check analytics on dashboard after 2+ tests

### Step 6 — Adding New Exams (No Code Change)

To add NaSu, Kharidar, Officer, or any new exam:

1. Go to Admin Panel → `/admin/exams` → Create Exam
2. Fill: name, slug, duration, marking scheme, pattern_config
3. Add subjects under that exam
4. Bulk upload questions via `/admin/questions` (JSON upload)
5. Create mock tests with subject distributions

The entire system adapts automatically — all APIs are dynamic.

---

## Scaling Considerations

| Concern | Solution |
|---------|---------|
| Many concurrent test takers | Vercel serverless scales automatically |
| Question randomization load | Pre-generate test sessions, cache in Redis |
| Analytics slow queries | Add compound indexes on Results collection |
| Bulk question uploads | Use MongoDB `insertMany` with `ordered: false` |
| Image/PDF serving | Cloudinary CDN handles this |
| Session management | JWT (stateless) — no server-side sessions |
| Mobile offline support | React Query + AsyncStorage for offline caching |

## Security

- All test answers validated server-side (never trust client score)
- Correct answers never sent to client during test
- Admin routes protected by role check middleware
- Rate limiting on `/api/tests/start` (prevent abuse)
- Input validation with Zod on all API routes
- MongoDB injection prevention via Mongoose typed queries
