-- Migration 007: Fix grade_predictions function
-- 1. Fix draw logic: a wrong draw prediction should be 'miss', not 'partial'
-- 2. Grant EXECUTE so the edge function (service role) can call it via RPC

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
    when v_home = v_away then 'miss'::public.prediction_result  -- actual draw: only exact score is correct
    when sign(predicted_home_score - predicted_away_score) = sign(v_home - v_away) then 'partial'::public.prediction_result
    else 'miss'::public.prediction_result
  end,
  updated_at = now()
  where match_id = p_match_id;
end;
$$;

grant execute on function public.grade_predictions(integer) to service_role, authenticated;

-- Grant EXECUTE on the function to anon so the edge function (anon key) can call it via RPC
grant execute on function public.grade_predictions(integer) to anon;
