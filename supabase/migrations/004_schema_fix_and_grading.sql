-- Migration 005: Fix matches schema + prediction grading
-- ============================================================
-- 1. Drop all dependent objects and recreate with integer ids
-- ============================================================

-- Drop dependent objects first
drop view if exists public.leaderboard;
drop table if exists public.predictions cascade;
drop table if exists public.match_change_requests cascade;
drop table if exists public.change_request_votes cascade;
drop table if exists public.matches cascade;
drop table if exists public.teams cascade;

-- Drop old enums
drop type if exists public.tournament_phase cascade;
drop type if exists public.match_status cascade;
drop type if exists public.change_request_status cascade;
drop type if exists public.change_request_type cascade;

-- ============================================================
-- 2. Teams (integer id)
-- ============================================================
create table public.teams (
  id integer primary key,
  name text not null,
  name_en text,
  name_es text,
  name_it text,
  code varchar(4) not null unique,
  flag_url text,
  group_name char(1),
  created_at timestamptz default now() not null
);

alter table public.teams enable row level security;

create policy "Teams are viewable by everyone"
  on public.teams for select using (true);

create policy "Authenticated users can insert teams"
  on public.teams for insert with check (auth.role() = 'authenticated');

-- Seed all 48 teams
insert into public.teams (id, name, name_en, name_es, name_it, code, flag_url, group_name) values
  (1,  'Algeria',              'Algeria',              'Argelia',              'Algeria',              'ALG', 'https://flagsapi.com/DZ/flat/64.png', 'J'),
  (2,  'Argentina',            'Argentina',            'Argentina',            'Argentina',            'ARG', 'https://flagsapi.com/AR/flat/64.png', 'J'),
  (3,  'Australia',            'Australia',            'Australia',            'Australia',            'AUS', 'https://flagsapi.com/AU/flat/64.png', 'D'),
  (4,  'Austria',              'Austria',              'Austria',              'Austria',              'AUT', 'https://flagsapi.com/AT/flat/64.png', 'J'),
  (5,  'Belgium',              'Belgium',              'Bélgica',              'Belgio',               'BEL', 'https://flagsapi.com/BE/flat/64.png', 'G'),
  (6,  'Bosnia and Herzegovina','Bosnia and Herzegovina','Bosnia y Herzegovina','Bosnia ed Erzegovina', 'BIH', 'https://flagsapi.com/BA/flat/64.png', 'B'),
  (7,  'Brazil',               'Brazil',               'Brasil',               'Brasile',              'BRA', 'https://flagsapi.com/BR/flat/64.png', 'C'),
  (8,  'Cabo Verde',           'Cabo Verde',           'Cabo Verde',           'Capo Verde',           'CPV', 'https://flagsapi.com/CV/flat/64.png', 'H'),
  (9,  'Canada',               'Canada',               'Canadá',               'Canada',               'CAN', 'https://flagsapi.com/CA/flat/64.png', 'B'),
  (10, 'Colombia',             'Colombia',             'Colombia',             'Colombia',             'COL', 'https://flagsapi.com/CO/flat/64.png', 'K'),
  (11, 'Congo DR',             'Congo DR',             'Congo RD',             'Congo RD',             'COD', 'https://flagsapi.com/CD/flat/64.png', 'K'),
  (12, 'Côte d''Ivoire',       'Côte d''Ivoire',       'Costa de Marfil',      'Costa d''Avorio',      'CIV', 'https://flagsapi.com/CI/flat/64.png', 'E'),
  (13, 'Croatia',              'Croatia',              'Croacia',              'Croazia',              'CRO', 'https://flagsapi.com/HR/flat/64.png', 'L'),
  (14, 'Curaçao',              'Curaçao',              'Curazao',              'Curaçao',              'CUW', 'https://flagsapi.com/CW/flat/64.png', 'E'),
  (15, 'Czechia',              'Czechia',              'República Checa',      'Repubblica Ceca',      'CZE', 'https://flagsapi.com/CZ/flat/64.png', 'A'),
  (16, 'Ecuador',              'Ecuador',              'Ecuador',              'Ecuador',              'ECU', 'https://flagsapi.com/EC/flat/64.png', 'E'),
  (17, 'Egypt',                'Egypt',                'Egipto',               'Egitto',               'EGY', 'https://flagsapi.com/EG/flat/64.png', 'G'),
  (18, 'England',              'England',              'Inglaterra',           'Inghilterra',          'ENG', 'https://flagsapi.com/GB/flat/64.png', 'L'),
  (19, 'France',               'France',               'Francia',              'Francia',              'FRA', 'https://flagsapi.com/FR/flat/64.png', 'I'),
  (20, 'Germany',              'Germany',              'Alemania',             'Germania',             'GER', 'https://flagsapi.com/DE/flat/64.png', 'E'),
  (21, 'Ghana',                'Ghana',                'Ghana',                'Ghana',                'GHA', 'https://flagsapi.com/GH/flat/64.png', 'L'),
  (22, 'Haiti',                'Haiti',                'Haití',                'Haiti',                'HAI', 'https://flagsapi.com/HT/flat/64.png', 'C'),
  (23, 'IR Iran',              'IR Iran',              'Irán',                 'Iran',                 'IRN', 'https://flagsapi.com/IR/flat/64.png', 'G'),
  (24, 'Iraq',                 'Iraq',                 'Irak',                 'Iraq',                 'IRQ', 'https://flagsapi.com/IQ/flat/64.png', 'I'),
  (25, 'Japan',                'Japan',                'Japón',                'Giappone',             'JPN', 'https://flagsapi.com/JP/flat/64.png', 'F'),
  (26, 'Jordan',               'Jordan',               'Jordania',             'Giordania',            'JOR', 'https://flagsapi.com/JO/flat/64.png', 'J'),
  (27, 'Korea Republic',       'Korea Republic',       'Corea del Sur',        'Corea del Sud',        'KOR', 'https://flagsapi.com/KR/flat/64.png', 'A'),
  (28, 'Mexico',               'Mexico',               'México',               'Messico',              'MEX', 'https://flagsapi.com/MX/flat/64.png', 'A'),
  (29, 'Morocco',              'Morocco',              'Marruecos',            'Marocco',              'MAR', 'https://flagsapi.com/MA/flat/64.png', 'C'),
  (30, 'Netherlands',          'Netherlands',          'Países Bajos',         'Paesi Bassi',          'NED', 'https://flagsapi.com/NL/flat/64.png', 'F'),
  (31, 'New Zealand',          'New Zealand',          'Nueva Zelanda',        'Nuova Zelanda',        'NZL', 'https://flagsapi.com/NZ/flat/64.png', 'G'),
  (32, 'Norway',               'Norway',               'Noruega',              'Norvegia',             'NOR', 'https://flagsapi.com/NO/flat/64.png', 'I'),
  (33, 'Panama',               'Panama',               'Panamá',               'Panama',               'PAN', 'https://flagsapi.com/PA/flat/64.png', 'L'),
  (34, 'Paraguay',             'Paraguay',             'Paraguay',             'Paraguay',             'PAR', 'https://flagsapi.com/PY/flat/64.png', 'D'),
  (35, 'Portugal',             'Portugal',             'Portugal',             'Portogallo',           'POR', 'https://flagsapi.com/PT/flat/64.png', 'K'),
  (36, 'Qatar',                'Qatar',                'Catar',                'Qatar',                'QAT', 'https://flagsapi.com/QA/flat/64.png', 'B'),
  (37, 'Saudi Arabia',         'Saudi Arabia',         'Arabia Saudita',       'Arabia Saudita',       'KSA', 'https://flagsapi.com/SA/flat/64.png', 'H'),
  (38, 'Scotland',             'Scotland',             'Escocia',              'Scozia',               'SCO', 'https://flagcdn.com/h120/gb-sct.jpg',  'C'),
  (39, 'Senegal',              'Senegal',              'Senegal',              'Senegal',              'SEN', 'https://flagsapi.com/SN/flat/64.png', 'I'),
  (40, 'South Africa',         'South Africa',         'Sudáfrica',            'Sudafrica',            'RSA', 'https://flagsapi.com/ZA/flat/64.png', 'A'),
  (41, 'Spain',                'Spain',                'España',               'Spagna',               'ESP', 'https://flagsapi.com/ES/flat/64.png', 'H'),
  (42, 'Sweden',               'Sweden',               'Suecia',               'Svezia',               'SWE', 'https://flagsapi.com/SE/flat/64.png', 'F'),
  (43, 'Switzerland',          'Switzerland',          'Suiza',                'Svizzera',             'SUI', 'https://flagsapi.com/CH/flat/64.png', 'B'),
  (44, 'Tunisia',              'Tunisia',              'Túnez',                'Tunisia',              'TUN', 'https://flagsapi.com/TN/flat/64.png', 'F'),
  (45, 'Türkiye',              'Türkiye',              'Turquía',              'Turchia',              'TUR', 'https://flagsapi.com/TR/flat/64.png', 'D'),
  (46, 'Uruguay',              'Uruguay',              'Uruguay',              'Uruguay',              'URU', 'https://flagsapi.com/UY/flat/64.png', 'H'),
  (47, 'USA',                  'USA',                  'Estados Unidos',       'Stati Uniti',          'USA', 'https://flagsapi.com/US/flat/64.png', 'D'),
  (48, 'Uzbekistan',           'Uzbekistan',           'Uzbekistán',           'Uzbekistan',           'UZB', 'https://flagsapi.com/UZ/flat/64.png', 'K')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, name_en = EXCLUDED.name_en, name_es = EXCLUDED.name_es,
  name_it = EXCLUDED.name_it, code = EXCLUDED.code, flag_url = EXCLUDED.flag_url,
  group_name = EXCLUDED.group_name;

-- ============================================================
-- 2. New enums
-- ============================================================
create type public.match_status as enum ('scheduled', 'live', 'completed');
create type public.change_request_status as enum ('pending', 'approved', 'denied');
create type public.change_request_type as enum ('create', 'update', 'finish');
create type public.prediction_result as enum ('correct', 'partial', 'miss', 'proposed');

-- ============================================================
-- 3. Matches (integer id, stage text, venue text)
-- ============================================================
create table public.matches (
  id integer primary key,
  stage text not null,           -- 'GROUP', 'R32', 'R16', 'QF', 'SF', 'F'
  home_team_id integer not null,
  away_team_id integer not null,
  match_date timestamptz not null,
  home_score integer,
  away_score integer,
  venue text,
  status public.match_status default 'scheduled' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.matches enable row level security;

create policy "Matches are viewable by everyone"
  on public.matches for select using (true);

create policy "Authenticated users can insert matches"
  on public.matches for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update matches"
  on public.matches for update using (auth.role() = 'authenticated');

-- ============================================================
-- 4. Predictions (with result grading)
-- ============================================================
create table public.predictions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  match_id integer references public.matches(id) on delete cascade not null,
  predicted_home_score integer not null check (predicted_home_score >= 0),
  predicted_away_score integer not null check (predicted_away_score >= 0),
  result public.prediction_result default 'proposed' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, match_id)
);

alter table public.predictions enable row level security;

create policy "Predictions are viewable by everyone"
  on public.predictions for select using (true);

create policy "Users can insert own predictions"
  on public.predictions for insert with check (auth.uid() = user_id);

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
-- 5. Match change requests
-- ============================================================
create table public.match_change_requests (
  id uuid default uuid_generate_v4() primary key,
  requested_by uuid references public.profiles(id) on delete cascade not null,
  match_id integer references public.matches(id) on delete set null,
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
-- 6. Change request votes
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
-- 7. Function: grade predictions for a completed match
-- ============================================================
create or replace function public.grade_predictions(p_match_id integer)
returns void language plpgsql security definer as $$
declare
  v_home integer;
  v_away integer;
begin
  select home_score, away_score into v_home, v_away
  from public.matches where id = p_match_id;

  update public.predictions
  set result = case
    when predicted_home_score = v_home and predicted_away_score = v_away then 'correct'::public.prediction_result
    when sign(predicted_home_score - predicted_away_score) = sign(v_home - v_away) then 'partial'::public.prediction_result
    else 'miss'::public.prediction_result
  end,
  updated_at = now()
  where match_id = p_match_id;
end;
$$;

-- ============================================================
-- 8. Leaderboard view (correct=3pts, partial=1pt)
-- ============================================================
create or replace view public.leaderboard as
select
  p.user_id,
  pr.display_name,
  count(*) filter (where p.result <> 'proposed') as total_graded,
  count(*) filter (where p.result = 'correct') as correct_results,
  coalesce(sum(
    case
      when p.result = 'correct' then 3
      when p.result = 'partial' then 1
      else 0
    end
  ), 0) as total_points
from public.predictions p
join public.profiles pr on pr.id = p.user_id
group by p.user_id, pr.display_name
order by total_points desc, correct_results desc;

-- ============================================================
-- 9. Re-apply grants
-- ============================================================
grant usage on schema public to anon, authenticated;
grant select on public.matches to anon, authenticated;
grant select on public.teams to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant select on public.predictions to anon, authenticated;
grant select on public.match_change_requests to anon, authenticated;
grant select on public.change_request_votes to anon, authenticated;
grant select on public.leaderboard to anon, authenticated;

grant insert, update on public.matches to authenticated;
grant insert, update on public.predictions to authenticated;
grant insert, update on public.match_change_requests to authenticated;
grant insert on public.change_request_votes to authenticated;
grant insert, update on public.profiles to authenticated;
