# 🐾 PawPal – Pet Care Dashboard

A full-featured React + Supabase pet care web app. Track your pet's meals, weight, health records, medications, activities, reminders, and smart devices — all in one place.

**Live stack:** React 18 · TypeScript · Vite · React Router v6 (HashRouter) · Supabase · Recharts · Lucide React · date-fns

---

## Features

- **Dashboard** — daily summary cards, calorie & activity progress, weight trend chart, reminders, alerts, devices overview
- **Pets** — multi-pet support, photo upload, allergy & medical condition tracking
- **Meal Planner** — 7-day meal plan, calorie calculator, food stock tracking, per-meal logging
- **Health** — weight log with chart, health records, medication tracking
- **Activity** — weekly bar chart, log walks/runs/play with distance and steps
- **Reminders** — overdue/upcoming view, repeat rules, one-click completion
- **Devices** — smart feeder, water bowl, GPS collar, temperature sensor cards with live metadata
- **Alerts** — severity-filtered alert feed with mark-read and delete
- **Settings** — theme toggle (light/dark), display name, clear demo data
- **Demo mode** — loads a sample Golden Retriever (Milo) with full data so you can explore immediately

---

## Quick Start

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the SQL Editor, paste the entire contents of `supabase/schema.sql` and run it.
3. Copy your **Project URL** and **anon/public key** from Project Settings → API.

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

> **Security note:** The anon key is safe to expose in a browser app — Supabase's Row Level Security (RLS) policies ensure every user can only access their own data. Never put your `service_role` key in client-side code.

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:5173/pet-care-dashboard/](http://localhost:5173/pet-care-dashboard/)

---

## Deploying to GitHub Pages

### Step 1: Enable GitHub Pages

In your repository → Settings → Pages → set Source to **GitHub Actions**.

### Step 2: Add repository secrets

In Settings → Secrets and variables → Actions, add:

| Secret name | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon key |

### Step 3: Push to main

The `.github/workflows/deploy.yml` workflow will build and deploy automatically on every push to `main`.

Your app will be available at:
```
https://<your-username>.github.io/pet-care-dashboard/
```

> **Important:** Update `vite.config.ts` `base` field if your repository name differs from `pet-care-dashboard`.

---

## Project Structure

```
pawpal/
├── src/
│   ├── components/
│   │   ├── common/       # Shared UI components
│   │   └── layout/       # AppShell, Sidebar, TopBar, BottomNavigation
│   ├── contexts/         # AuthContext, PetContext, ThemeContext
│   ├── lib/              # Supabase client
│   ├── pages/            # One file per route
│   ├── services/         # All Supabase queries (never in components)
│   ├── styles/           # globals.css with CSS variables
│   ├── types/            # All TypeScript interfaces
│   └── main.tsx          # App entry + router
├── supabase/
│   └── schema.sql        # Full DB schema + RLS policies + storage
└── .github/
    └── workflows/
        └── deploy.yml    # GitHub Pages CI/CD
```

---

## Adding Your Own Pet

1. Sign up with your email.
2. Click **Add Pet** on the Pets page.
3. Fill in your pet's details — name, species, breed, weight, allergies.
4. Optionally upload a photo (JPEG/PNG/WebP, max 5 MB).
5. Navigate to Meal Planner and create a plan.

Or load the **Demo Data** from the Dashboard to explore with a pre-populated Golden Retriever called Milo.

---

## Customising

### Changing the calorie target
The daily calorie target is set per meal plan. A rough guideline for dogs is `body weight (kg) × 40` kcal/day for maintenance. Always consult your vet.

### Adding more food items
Go to the Meal Planner and use the food selector. Foods are per-user — add them via the Supabase table editor or extend the UI with a food management page.

### Theming
All colours are CSS custom properties in `src/styles/globals.css`. Edit the `:root` and `[data-theme='dark']` blocks to customise the palette.

---

## Tech Decisions

| Decision | Reason |
|---|---|
| HashRouter | GitHub Pages doesn't support HTML5 history; hash routing avoids 404s |
| CSS variables (no CSS-in-JS) | Zero runtime cost, easy theme switching via `data-theme` attr |
| Service layer | All Supabase calls in `src/services/` — components stay clean |
| Promise.all on dashboard | Parallel queries cut dashboard load time significantly |
| Demo flag in localStorage | Prevents duplicate inserts if the user refreshes mid-load |
| Signed URLs for photos | 1-hour expiry keeps photos private even with guessed paths |

---

## License

MIT — use freely for personal or commercial projects.
