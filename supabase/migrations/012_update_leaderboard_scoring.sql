-- Migration 012: Update leaderboard scoring
-- Stages R32 and higher: correct = 5 points, miss = 1 point
-- GROUP stage: correct = 3 points, partial = 1 point, miss = 0 points

drop view if exists public.leaderboard;

create or replace view public.leaderboard as
select
  p.user_id,
  pr.display_name,
  count(*) filter (where p.result <> 'proposed') as total_graded,
  count(*) filter (where p.result = 'correct') as correct_results,
  count(*) filter (where p.result = 'partial') as partial_results,
  count(*) filter (where p.result = 'miss') as total_predictions, -- This name is used for 'miss' in the frontend
  coalesce(sum(
    case
      when m.stage = 'GROUP' then
        case
          when p.result = 'correct' then 3
          when p.result = 'partial' then 1
          else 0
        end
      else -- Knockout stages (R32, R16, QF, SF, F)
        case
          when p.result = 'correct' then 5
          when p.result = 'miss' or p.result = 'partial' then 1
          else 0 -- 'proposed'
        end
    end
  ), 0) as total_points
from public.predictions p
join public.profiles pr on pr.id = p.user_id
join public.matches m on m.id = p.match_id
group by p.user_id, pr.display_name
order by total_points desc, correct_results desc;

grant select on public.leaderboard to anon, authenticated;
