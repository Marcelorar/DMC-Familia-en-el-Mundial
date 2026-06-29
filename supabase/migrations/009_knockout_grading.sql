-- Migration 009: Update grade_predictions to handle knockout stages
-- For phases higher than 'GROUP', picking the right winner gives 'correct' result (3 points)

create or replace function public.grade_predictions(p_match_id integer)
returns void language plpgsql security definer as $$
declare
  v_home integer;
  v_away integer;
  v_stage text;
begin
  select home_score, away_score, stage into v_home, v_away, v_stage
  from public.matches where id = p_match_id;

  update public.predictions
  set result = case
    -- 1. Exact score match: always 'correct' (3 pts)
    when predicted_home_score = v_home and predicted_away_score = v_away then 'correct'::public.prediction_result
    
    -- 2. Knockout stages: correct winner selection is enough for 'correct' (3 pts)
    when v_stage <> 'GROUP' and sign(predicted_home_score - predicted_away_score) = sign(v_home - v_away) then 'correct'::public.prediction_result
    
    -- 3. Group stage: actual draw (only exact score is correct)
    when v_stage = 'GROUP' and v_home = v_away then 'miss'::public.prediction_result
    
    -- 4. Correct outcome (win/loss) but wrong score: 'partial' (1 pt)
    when sign(predicted_home_score - predicted_away_score) = sign(v_home - v_away) then 'partial'::public.prediction_result
    
    -- 5. Everything else: 'miss' (0 pts)
    else 'miss'::public.prediction_result
  end,
  updated_at = now()
  where match_id = p_match_id;
end;
$$;
