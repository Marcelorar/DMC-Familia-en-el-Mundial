-- Migration 006: Add explicit foreign key constraints on matches → teams
-- PostgREST requires named FK constraints to resolve relationship hints
-- like matches_home_team_id_fkey and matches_away_team_id_fkey

alter table public.matches
  add constraint matches_home_team_id_fkey
    foreign key (home_team_id) references public.teams(id) on delete restrict;

alter table public.matches
  add constraint matches_away_team_id_fkey
    foreign key (away_team_id) references public.teams(id) on delete restrict;
