# PSC Platform — Complete Setup & Run Guide
# ============================================================
# Follow these steps IN ORDER. Every command is copy-paste ready.
# Estimated time: 15-20 minutes from zero to running app.
# ============================================================

## PREREQUISITES

Install these before starting:
- Node.js 20+   → https://nodejs.org (download LTS)
- Git           → https://git-scm.com
- Docker Desktop → https://docker.com/products/docker-desktop
  (Docker runs MongoDB + Redis locally — no account needed)

Check versions:
```
node --version    # must be >= 20
npm --version     # must be >= 10
docker --version  # any recent version
```

---

## STEP 1 — EXTRACT THE ZIP

Unzip psc-platform-complete.zip to a folder of your choice.

```bash
# macOS / Linux
unzip psc-platform-complete.zip -d ~/projects/
cd ~/projects/psc-platform

# Windows (PowerShell)
Expand-Archive psc-platform-complete.zip -DestinationPath C:\projects\
cd C:\projects\psc-platform
```

---

## STEP 2 — INSTALL DEPENDENCIES

```bash
# From the psc-platform root folder:
npm install
```

This installs all packages for both the web app and shared packages.
It takes 1-3 minutes. You will see some warnings — that's normal.

---

## STEP 3 — SET UP ENVIRONMENT VARIABLES

```bash
# Copy the example file
cp apps/web/.env.example apps/web/.env.local
```

Now open `apps/web/.env.local` in any text editor and fill in:

```env
# Required — MongoDB (local Docker, leave as-is for local dev)
MONGODB_URI=mongodb://localhost:27017/psc-platform

# Required — generate a random secret:
# Run this command: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
NEXTAUTH_SECRET=paste_your_generated_secret_here

# Required — your local URL (don't change for local dev)
NEXTAUTH_URL=http://localhost:3000

# Required for Google login — get from https://console.cloud.google.com
# Go to: APIs & Services → Credentials → Create OAuth 2.0 Client
# Authorized redirect URIs: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Optional — Redis (local Docker, leave as-is for local dev)
REDIS_URL=redis://localhost:6379

# Optional — Cloudinary (only needed for PDF note uploads)
# Get free account at cloudinary.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### SKIP GOOGLE OAUTH for now?
You can skip Google login setup and only use email/password.
Just set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to any placeholder:
```
GOOGLE_CLIENT_ID=skip
GOOGLE_CLIENT_SECRET=skip
```
Email registration will still work fully.

---

## STEP 4 — START MONGODB AND REDIS

```bash
# From the psc-platform root folder (where docker-compose.yml is):
docker compose up -d
```

This starts:
- MongoDB on port 27017
- Redis on port 6379  
- Mongo Express (DB viewer UI) on port 8081 → http://localhost:8081

Check they're running:
```bash
docker compose ps
# Both should show "running" status
```

---

## STEP 5 — SEED THE DATABASE

```bash
npm run seed
```

This creates:
- The "Computer Operator" exam
- 4 subjects (Computer Fundamentals, MS Office, OS, Internet & Networking)
- 21 real PSC-style questions with explanations
- 1 full mock test (50 questions, 45 minutes, −0.2 negative marking)

Expected output:
```
✓ Connected to MongoDB
✓ Exam: Computer Operator
✓ Subjects: Computer Fundamentals, MS Office, Operating System, Internet & Networking
✓ Questions: 21
✓ Mock Test: Computer Operator Full Mock Test #1
🎉 Seed complete!
```

---

## STEP 6 — START THE DEV SERVER

```bash
npm run dev
```

Open your browser: **http://localhost:3000**

You should see the PSC Prep landing page.

---

## STEP 7 — CREATE YOUR ACCOUNT

1. Click "Get started free"
2. Fill in name, email, password (min 8 characters)
3. You'll be redirected to the dashboard

---

## STEP 8 — MAKE YOURSELF ADMIN

Open Mongo Express at http://localhost:8081

1. Click "psc-platform" database
2. Click "users" collection
3. Find your user document
4. Click the pencil (edit) icon
5. Change `"role": "user"` to `"role": "admin"`
6. Save

**OR** use MongoDB shell:
```bash
docker exec -it psc-mongo mongosh psc-platform --eval \
  'db.users.updateOne({email:"your@email.com"},{$set:{role:"admin"}})'
```

Now sign out and sign back in — you'll see "Admin Panel" in the sidebar.

---

## STEP 9 — TEST THE FULL FLOW

1. Go to **Exams** → click "Computer Operator"
2. Click **Start Test** on the mock test
3. Answer some questions, submit
4. Check **Results** page — score with negative marking breakdown
5. Check **Dashboard** — analytics will appear after 2+ tests
6. Try **Speed Drill** → pick Computer Operator → Start Drill
7. Try **Study Planner** → set a target date → Generate Plan
8. Go to **Admin Panel** (/admin) → upload more questions

---

## COMMON ERRORS & FIXES

### "Cannot connect to MongoDB"
```bash
docker compose ps          # check if MongoDB is running
docker compose up -d       # restart if stopped
```

### "NEXTAUTH_SECRET is not defined"
Make sure you've set it in .env.local (not .env.example)

### "Module not found: @psc/shared"
```bash
npm install    # run again from root
```

### "Redis connection refused" 
This is non-fatal — the app works without Redis (just no caching).
Check Docker: `docker compose up -d`

### Port 3000 already in use
```bash
# Find what's using it:
lsof -i :3000   # macOS/Linux
netstat -ano | findstr :3000   # Windows

# Or run on a different port:
cd apps/web && npx next dev -p 3001
```

### TypeScript errors on build
```bash
cd apps/web
npx tsc --noEmit    # see all type errors
```

---

## PRODUCTION DEPLOYMENT (VERCEL)

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial PSC Platform"
git remote add origin https://github.com/yourusername/psc-platform.git
git push -u origin main
```

### Step 2 — Deploy to Vercel
```bash
npm install -g vercel
cd apps/web
vercel
```

### Step 3 — Set Environment Variables in Vercel
In Vercel dashboard → Project → Settings → Environment Variables:

```
MONGODB_URI         = mongodb+srv://user:pass@cluster.mongodb.net/psc-platform
NEXTAUTH_SECRET     = your-32-char-secret
NEXTAUTH_URL        = https://your-app.vercel.app
GOOGLE_CLIENT_ID    = your-google-client-id
GOOGLE_CLIENT_SECRET = your-google-secret
REDIS_URL           = rediss://default:token@host.upstash.io:6380
CLOUDINARY_CLOUD_NAME = your-cloud
CLOUDINARY_API_KEY  = your-key
CLOUDINARY_API_SECRET = your-secret
```

### Step 4 — MongoDB Atlas (for production)
1. Create free cluster at cloud.mongodb.com
2. Create database user with readWrite role
3. Whitelist IP: 0.0.0.0/0 (for Vercel serverless)
4. Get connection string → paste as MONGODB_URI

### Step 5 — Upstash Redis (free tier, Vercel-compatible)
1. Go to upstash.com → Create Redis database
2. Copy REST URL → REDIS_URL
3. Copy REST Token → set UPSTASH_REDIS_REST_TOKEN

### Step 6 — Seed Production DB
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/psc-platform npm run seed
```

### Step 7 — Create Admin User in Production
```bash
# Connect to Atlas using mongosh or Compass
db.users.updateOne({email:"admin@yoursite.com"},{$set:{role:"admin"}})
```

### Step 8 — Update Google OAuth redirect
In Google Cloud Console → OAuth 2.0 Credentials:
Add authorized redirect URI: `https://your-app.vercel.app/api/auth/callback/google`

---

## ADDING MORE EXAMS (NO CODE NEEDED)

1. Log in as admin → go to /admin/exams
2. Click "+ New Exam", fill in the form
3. Go to /admin/subjects → add subjects for that exam
4. Go to /admin/questions → bulk upload questions as JSON
5. The new exam automatically appears everywhere

### JSON Upload Format
```json
[
  {
    "question_text": "Which of the following is NOT an output device?",
    "options": [
      { "index": 0, "text": "Monitor" },
      { "index": 1, "text": "Printer" },
      { "index": 2, "text": "Scanner" },
      { "index": 3, "text": "Speakers" }
    ],
    "correct_answer": 2,
    "explanation": "Scanner is an input device — it reads physical documents into the computer.",
    "difficulty": "easy",
    "year": 2023,
    "tags": ["hardware", "devices"]
  }
]
```

---

## FILE STRUCTURE QUICK REFERENCE

```
psc-platform/
├── apps/web/
│   ├── app/
│   │   ├── (auth)/login, register        ← public pages
│   │   ├── (dashboard)/                  ← protected pages
│   │   │   ├── dashboard/                ← analytics home
│   │   │   ├── exams/[slug]/             ← exam detail
│   │   │   ├── practice/[exam]/[subject] ← MCQ practice
│   │   │   ├── mock/[exam]/              ← timed mock test
│   │   │   ├── drill/                    ← 5-min speed drill ⚡
│   │   │   ├── results/[id]/             ← test results
│   │   │   ├── planner/                  ← study planner
│   │   │   ├── leaderboard/              ← rankings 🏆
│   │   │   ├── notes/                    ← PDF notes
│   │   │   └── bookmarks/               ← saved questions
│   │   ├── admin/                        ← admin panel
│   │   └── api/                          ← all API routes
│   ├── components/                       ← UI components
│   ├── lib/                              ← db, auth, redis, cloudinary
│   └── store/examStore.ts               ← test session state
├── packages/shared/
│   ├── models/index.ts                  ← all DB schemas
│   ├── utils/scoring.ts                 ← negative marking
│   ├── utils/analytics.ts               ← performance engine
│   └── utils/planner.ts                 ← study plan algorithm
└── scripts/seed-computer-operator.ts    ← DB seed script
```

---

## MONGODB INDEXES (run once in production)

```javascript
// In MongoDB Atlas shell or Compass:
use psc-platform

db.questions.createIndex({ exam_id: 1, subject_id: 1, difficulty: 1 })
db.questions.createIndex({ exam_id: 1, tags: 1 })
db.questions.createIndex({ question_text: "text", tags: "text" })
db.results.createIndex({ user_id: 1, created_at: -1 })
db.results.createIndex({ test_id: 1 })
db.results.createIndex({ exam_id: 1, score: -1 })
db.bookmarks.createIndex({ user_id: 1, question_id: 1 }, { unique: true })
db.studyplans.createIndex({ user_id: 1, is_active: 1 })
db.subjects.createIndex({ exam_id: 1, slug: 1 }, { unique: true })
```
