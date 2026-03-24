[README.md](https://github.com/user-attachments/files/26226107/README.md)
# WRAP App — Setup & Deployment Guide

## What This Is
The WRAP App is a life management system built on Spencer Combs' Drift to Drive framework and the WRAP methodology from *Momentum & Mastery*. It guides users through an NLP-based onboarding experience and then into an annual → monthly → weekly planning system.

---

## Tech Stack
- **Frontend**: React 18
- **Auth + Database**: Supabase (free tier handles your initial scale)
- **Hosting**: Vercel (free tier, deploys in ~2 min)
- **AI Coaching**: Claude API (Anthropic)

---

## Step 01 — Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (name it "wrap-app" or similar)
3. Wait ~2 minutes for it to provision
4. Go to **SQL Editor** in the left sidebar
5. Copy the entire contents of `src/lib/schema.sql` and paste it into the editor
6. Click **Run** — this creates all your tables, security policies, and helper functions
7. Go to **Settings → API** and copy:
   - `Project URL` → this is your `REACT_APP_SUPABASE_URL`
   - `anon public` key → this is your `REACT_APP_SUPABASE_ANON_KEY`

---

## Step 2 — Set Up Local Development

```bash
# Clone or download the project to your machine
cd wrap-app

# Install dependencies
npm install

# Copy the environment template
cp .env.example .env.local

# Edit .env.local and paste in your Supabase values from Step 1
# REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
# REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Start the dev server
npm start
```

The app will open at `http://localhost:3000`

---

## Step 3 — Deploy to Vercel

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial WRAP App commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/wrap-app.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **Add New Project** → select your `wrap-app` repo
4. Under **Environment Variables**, add:
   - `REACT_APP_SUPABASE_URL` = your Supabase URL
   - `REACT_APP_SUPABASE_ANON_KEY` = your Supabase anon key
5. Click **Deploy** — done in ~2 minutes
6. Vercel gives you a free URL like `wrap-app-xyz.vercel.app`
7. You can add a custom domain (e.g. `wrap.defiantresources.com`) in Vercel's domain settings

---

## Step 4 — Configure Claude API for AI Coaching

The AI coaching moments use the Anthropic API. For production security, you need a backend proxy so your API key isn't exposed in the browser.

**Quick option for testing**: Add your API key directly in `src/lib/supabase.js` — only do this locally, never deploy with a bare API key.

**Production option**: Use Supabase Edge Functions as a proxy:
1. In your Supabase dashboard, go to **Edge Functions**
2. Create a function called `claude-proxy`
3. Add your Anthropic API key as an environment secret
4. Update `getCoachingResponse` in `src/lib/supabase.js` to call your edge function URL instead of Anthropic directly

I can build this proxy function for you in the next sprint.

---

## Current State (Sprint 1)

✅ Auth (signup, signin, session persistence)  
✅ Entry routing (New / Alumni / Coaching Client)  
✅ Full Drift to Drive onboarding (Dream → Desire → Disturbance → Decision)  
✅ Anchor Goal setup  
✅ Life Areas setup  
✅ Dashboard shell with life areas display  

## Sprint 2 (Next)

⬜ Annual outcome setting per life area  
⬜ Monthly planning with guiding question  
⬜ Weekly WRAP session (Review / Reflect / Plan / Commit)  
⬜ Binary + Progress feedback types  
⬜ Desire List and Done List  
⬜ Coach view (read-only access to client WRAP)  

---

## File Structure

```
wrap-app/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── UI.jsx              # All reusable UI components
│   ├── hooks/
│   │   └── useAuth.jsx         # Auth context & hooks
│   ├── lib/
│   │   ├── supabase.js         # Supabase client + Claude API helper
│   │   └── schema.sql          # Run this in Supabase SQL Editor
│   ├── pages/
│   │   ├── AuthPage.jsx        # Sign up / Sign in
│   │   ├── EntryRoutingPage.jsx
│   │   ├── DashboardPage.jsx
│   │   └── onboarding/
│   │       ├── DreamStagePage.jsx
│   │       ├── StagePages.jsx  # Desire, Disturbance, Decision
│   │       └── AnchorAndAreas.jsx
│   ├── styles/
│   │   └── globals.css         # Design system + Defiant brand colors
│   ├── App.jsx                 # Routing + auth guards
│   └── index.js
├── .env.example
├── .gitignore
└── package.json
```
