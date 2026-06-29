-- Migration 011: Fix draw grading in GROUP stage
-- Draw predictions that don't match the exact score should be 'partial', not 'miss'.

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
    
    -- 3. Correct outcome (win/loss/draw) but wrong score: 'partial' (1 pt)
    -- This now correctly handles draws (sign = 0) in the GROUP stage
    when sign(predicted_home_score - predicted_away_score) = sign(v_home - v_away) then 'partial'::public.prediction_result
    
    -- 4. Everything else: 'miss' (0 pts)
    else 'miss'::public.prediction_result
  end,
  updated_at = now()
  where match_id = p_match_id;
end;
$$;

-- Trigger re-grading for all matches that have a result
-- This will fix the 'miss' results for draws in the GROUP stage
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.matches WHERE home_score IS NOT NULL AND away_score IS NOT NULL LOOP
        PERFORM public.grade_predictions(r.id);
    END LOOP;
END $$;
