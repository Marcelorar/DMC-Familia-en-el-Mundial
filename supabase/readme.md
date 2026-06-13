# Supabase Setup — DMC Familia en el Mundial 2026

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a new project.
2. Copy your **Project URL** and **anon public key** from **Project Settings → API**.

## 2. Configure Environment Variables

Copy `.env.example` to `.env` in the project root and fill in your credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 3. Run the Migration

In the Supabase dashboard go to **SQL Editor** and run the contents of:

```
supabase/migrations/001_initial_schema.sql
```

This will create:

| Table / View               | Description                                              |
|----------------------------|----------------------------------------------------------|
| `profiles`                 | Auto-created on signup, stores display name              |
| `teams`                    | 48 FIFA World Cup 2026 teams (pre-seeded, groups A–L)    |
| `matches`                  | Matches per phase (group/R16/QF/SF/Final)                |
| `predictions`              | One prediction per user per match                        |
| `match_change_requests`    | Admin change requests (create or update a match)         |
| `change_request_votes`     | Votes on change requests (approve / deny)                |
| `leaderboard` *(view)*     | Computed points per user (3 exact, 1 correct result)     |

## 4. Authentication

- Email/password auth is used (enabled by default in Supabase).
- A database trigger (`on_auth_user_created`) auto-creates a `profiles` row on signup.
- All views are **public** — any logged-in user can see everything.

## 5. Row Level Security Summary

| Table                   | SELECT      | INSERT                        | UPDATE                              |
|-------------------------|-------------|-------------------------------|-------------------------------------|
| `profiles`              | Everyone    | Trigger only                  | Own row only                        |
| `teams`                 | Everyone    | Authenticated                 | —                                   |
| `matches`               | Everyone    | Authenticated                 | Authenticated                       |
| `predictions`           | Everyone    | Own rows only                 | Own rows, only before match date    |
| `match_change_requests` | Everyone    | Own requests only             | Authenticated (for status updates)  |
| `change_request_votes`  | Everyone    | Authenticated, not own request| —                                   |

## 6. Change Request Workflow

1. Any logged-in user can submit a **create** or **update** match request via the Admin page.
2. The request owner **cannot** vote on their own request.
3. Once **3 approvals** are reached → the change is automatically applied to `matches`.
4. Once **3 denials** are reached → the request is marked as denied.
