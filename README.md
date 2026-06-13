# ⚽ Familia en el Mundial 2026

A FIFA World Cup 2026 soccer predictions app for family & friends, built with React + Vite + Supabase.

## Features

- 🔐 **Authentication** — Email/password sign-up & login via Supabase Auth
- 🏆 **Predictions** — Predict scores for all 5 tournament phases (Group, R16, QF, SF, Final)
- ✏️ **Editable predictions** — Edit your prediction any time before the match starts
- 📊 **Leaderboard** — Live ranking with points (3 for exact score, 1 for correct result)
- 🛠️ **Admin panel** — Any user can propose match creation/updates via change requests
- 🗳️ **Democratic moderation** — Other users vote to approve/deny changes (2 votes to apply)
- 🌍 **Bilingual** — Full English & Spanish support (auto-detected, toggle in navbar)

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18 + TypeScript + Vite        |
| Styling    | Tailwind CSS + shadcn/ui components |
| Backend    | Supabase (PostgreSQL + Auth + RLS)  |
| i18n       | i18next + react-i18next             |
| Routing    | React Router v6                     |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

See [`supabase/readme.md`](./supabase/readme.md) for full instructions.

**Quick summary:**
1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL Editor
3. Copy `.env.example` → `.env` and fill in your credentials

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Project Structure

```
src/
├── components/
│   ├── layout/       # Navbar
│   └── ui/           # shadcn/ui primitives (button, card, dialog, etc.)
├── context/          # AuthContext (Supabase session)
├── hooks/            # use-toast
├── i18n/             # i18next setup + EN/ES locale files
├── lib/              # supabase client, utils
├── pages/            # LoginPage, PredictionsPage, LeaderboardPage, AdminPage
└── types/            # TypeScript interfaces

supabase/
├── migrations/       # 001_initial_schema.sql (schema + RLS + seed data)
└── readme.md         # Supabase setup guide
```

## Tournament Phases

| Phase         | Matches |
|---------------|---------|
| Group Stage   | 104     |
| Round of 16   | 16      |
| Quarterfinals | 8       |
| Semifinals    | 4       |
| Final         | 1       |

## Scoring System

| Result          | Points |
|-----------------|--------|
| Exact score     | 3 pts  |
| Correct outcome | 1 pt   |
| Wrong result    | 0 pts  |

## Admin / Change Request Flow

All users are equal — there are no super-admins. Instead:

1. Any logged-in user can **propose** a new match or an update to an existing one.
2. The proposal owner **cannot vote** on their own request.
3. When **3 other users approve** → the change is automatically applied.
4. When **3 other users deny** → the request is rejected.

## License

MIT
