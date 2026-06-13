-- ============================================================
-- Fix: Grant SELECT to anon and authenticated roles on all public tables
-- This resolves 403 errors when reading teams, matches, etc. without auth
-- ============================================================

grant usage on schema public to anon, authenticated;

grant select on public.teams to anon, authenticated;
grant select on public.matches to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant select on public.predictions to anon, authenticated;
grant select on public.match_change_requests to anon, authenticated;
grant select on public.change_request_votes to anon, authenticated;

grant insert, update on public.predictions to authenticated;
grant insert, update on public.matches to authenticated;
grant insert on public.match_change_requests to authenticated;
grant update on public.match_change_requests to authenticated;
grant insert on public.change_request_votes to authenticated;
grant insert on public.teams to authenticated;
