-- Migration 008: Add partial_results to leaderboard view
drop view public.leaderboard;

create or replace view public.leaderboard as
select
  p.user_id,
  pr.display_name,
  count(*) filter (where p.result <> 'proposed') as total_graded,
  count(*) filter (where p.result = 'correct') as correct_results,
  count(*) filter (where p.result = 'partial') as partial_results,
  count(*) filter (where p.result = 'miss') as total_predictions,
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

grant select on public.leaderboard to anon, authenticated;
