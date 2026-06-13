-- ============================================================
-- DMC Familia en el Mundial 2026 - Initial Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  display_name text not null,
  avatar_url text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

-- Everyone can read profiles
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TEAMS
-- ============================================================
create table public.teams (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  code char(3) not null unique,
  flag_url text,
  group_name char(1), -- A-H for group stage teams
  created_at timestamptz default now() not null
);

alter table public.teams enable row level security;

create policy "Teams are viewable by everyone"
  on public.teams for select using (true);

create policy "Authenticated users can insert teams"
  on public.teams for insert with check (auth.role() = 'authenticated');

-- ============================================================
-- MATCHES
-- ============================================================
create type public.tournament_phase as enum (
  'group', 'round_of_16', 'quarterfinal', 'semifinal', 'final'
);

create type public.match_status as enum ('scheduled', 'live', 'finished');

create table public.matches (
  id uuid default uuid_generate_v4() primary key,
  phase public.tournament_phase not null,
  home_team_id uuid references public.teams(id) on delete restrict not null,
  away_team_id uuid references public.teams(id) on delete restrict not null,
  match_date timestamptz not null,
  home_score integer,
  away_score integer,
  venue text,
  status public.match_status default 'scheduled' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint different_teams check (home_team_id <> away_team_id)
);

alter table public.matches enable row level security;

create policy "Matches are viewable by everyone"
  on public.matches for select using (true);

create policy "Authenticated users can insert matches"
  on public.matches for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update matches"
  on public.matches for update using (auth.role() = 'authenticated');

-- ============================================================
-- PREDICTIONS
-- ============================================================
create table public.predictions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  match_id uuid references public.matches(id) on delete cascade not null,
  predicted_home_score integer not null check (predicted_home_score >= 0),
  predicted_away_score integer not null check (predicted_away_score >= 0),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, match_id)
);

alter table public.predictions enable row level security;

-- Everyone can read all predictions
create policy "Predictions are viewable by everyone"
  on public.predictions for select using (true);

-- Users can only insert their own predictions
create policy "Users can insert own predictions"
  on public.predictions for insert with check (auth.uid() = user_id);

-- Users can only update their own predictions (and only before match starts)
create policy "Users can update own predictions before match"
  on public.predictions for update using (
    auth.uid() = user_id
    and exists (
      select 1 from public.matches m
      where m.id = match_id
      and m.match_date > now()
    )
  );

-- ============================================================
-- MATCH CHANGE REQUESTS
-- ============================================================
create type public.change_request_status as enum ('pending', 'approved', 'denied');
create type public.change_request_type as enum ('create', 'update');

create table public.match_change_requests (
  id uuid default uuid_generate_v4() primary key,
  requested_by uuid references public.profiles(id) on delete cascade not null,
  match_id uuid references public.matches(id) on delete set null,
  request_type public.change_request_type not null,
  proposed_data jsonb not null,
  status public.change_request_status default 'pending' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.match_change_requests enable row level security;

create policy "Change requests are viewable by everyone"
  on public.match_change_requests for select using (true);

create policy "Authenticated users can create change requests"
  on public.match_change_requests for insert with check (auth.uid() = requested_by);

create policy "Authenticated users can update change request status"
  on public.match_change_requests for update using (auth.role() = 'authenticated');

-- ============================================================
-- CHANGE REQUEST VOTES
-- ============================================================
create table public.change_request_votes (
  id uuid default uuid_generate_v4() primary key,
  change_request_id uuid references public.match_change_requests(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  vote text not null check (vote in ('approve', 'deny')),
  created_at timestamptz default now() not null,
  unique(change_request_id, user_id)
);

alter table public.change_request_votes enable row level security;

create policy "Votes are viewable by everyone"
  on public.change_request_votes for select using (true);

-- Users can vote but not on their own requests
create policy "Authenticated users can vote on others requests"
  on public.change_request_votes for insert with check (
    auth.role() = 'authenticated'
    and auth.uid() = user_id
    and not exists (
      select 1 from public.match_change_requests r
      where r.id = change_request_id
      and r.requested_by = auth.uid()
    )
  );

-- ============================================================
-- LEADERBOARD VIEW
-- Points: 3 for exact score, 1 for correct result
-- ============================================================
create or replace view public.leaderboard as
select
  p.user_id,
  pr.display_name,
  count(*) filter (
    where m.status = 'finished'
  ) as total_predictions,
  count(*) filter (
    where m.status = 'finished'
    and (
      -- correct result (win/draw/loss)
      sign(p.predicted_home_score - p.predicted_away_score) =
      sign(m.home_score - m.away_score)
    )
  ) as correct_results,
  coalesce(sum(
    case
      when m.status = 'finished'
        and p.predicted_home_score = m.home_score
        and p.predicted_away_score = m.away_score
      then 3
      when m.status = 'finished'
        and sign(p.predicted_home_score - p.predicted_away_score) =
            sign(m.home_score - m.away_score)
      then 1
      else 0
    end
  ), 0) as total_points
from public.predictions p
join public.profiles pr on pr.id = p.user_id
join public.matches m on m.id = p.match_id
group by p.user_id, pr.display_name;

-- ============================================================
-- SEED: FIFA World Cup 2026 Teams (48 teams)
-- ============================================================
insert into public.teams (name, code, group_name) values
-- Group A
('Czechia', 'CZE', 'A'),
('Korea Republic', 'KOR', 'A'),
('Mexico', 'MEX', 'A'),
('South Africa', 'RSA', 'A'),
-- Group B
('Bosnia and Herzegovina', 'BIH', 'B'),
('Canada', 'CAN', 'B'),
('Qatar', 'QAT', 'B'),
('Switzerland', 'SUI', 'B'),
-- Group C
('Brazil', 'BRA', 'C'),
('Haiti', 'HAI', 'C'),
('Morocco', 'MAR', 'C'),
('Scotland', 'SCO', 'C'),
-- Group D
('Australia', 'AUS', 'D'),
('Paraguay', 'PAR', 'D'),
('Türkiye', 'TUR', 'D'),
('USA', 'USA', 'D'),
-- Group E
('Côte d''Ivoire', 'CIV', 'E'),
('Curaçao', 'CUW', 'E'),
('Ecuador', 'ECU', 'E'),
('Germany', 'GER', 'E'),
-- Group F
('Japan', 'JPN', 'F'),
('Netherlands', 'NED', 'F'),
('Sweden', 'SWE', 'F'),
('Tunisia', 'TUN', 'F'),
-- Group G
('Belgium', 'BEL', 'G'),
('Egypt', 'EGY', 'G'),
('IR Iran', 'IRN', 'G'),
('New Zealand', 'NZL', 'G'),
-- Group H
('Cabo Verde', 'CPV', 'H'),
('Saudi Arabia', 'KSA', 'H'),
('Spain', 'ESP', 'H'),
('Uruguay', 'URU', 'H'),
-- Group I
('France', 'FRA', 'I'),
('Iraq', 'IRQ', 'I'),
('Norway', 'NOR', 'I'),
('Senegal', 'SEN', 'I'),
-- Group J
('Algeria', 'ALG', 'J'),
('Argentina', 'ARG', 'J'),
('Austria', 'AUT', 'J'),
('Jordan', 'JOR', 'J'),
-- Group K
('Colombia', 'COL', 'K'),
('Congo DR', 'COD', 'K'),
('Portugal', 'POR', 'K'),
('Uzbekistan', 'UZB', 'K'),
-- Group L
('Croatia', 'CRO', 'L'),
('England', 'ENG', 'L'),
('Ghana', 'GHA', 'L'),
('Panama', 'PAN', 'L');
