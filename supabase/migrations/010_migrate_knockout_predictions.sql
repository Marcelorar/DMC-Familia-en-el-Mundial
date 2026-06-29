-- Migration 010: Migrate knockout predictions from score format (e.g. 3-2) to winner format (999-0)
-- This ensures that previous predictions made for knockout stages follow the new rule 
-- where only the winner is selected (represented by 999-0 or 0-999).

UPDATE public.predictions p
SET 
  predicted_home_score = CASE 
    WHEN p.predicted_home_score > p.predicted_away_score THEN 999 
    WHEN p.predicted_away_score > p.predicted_home_score THEN 0
    ELSE p.predicted_home_score 
  END,
  predicted_away_score = CASE 
    WHEN p.predicted_away_score > p.predicted_home_score THEN 999 
    WHEN p.predicted_home_score > p.predicted_away_score THEN 0
    ELSE p.predicted_away_score 
  END,
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM public.matches m
  WHERE m.id = p.match_id
    AND m.stage <> 'GROUP'
)
-- Only target predictions that haven't been migrated yet
AND NOT (
  (p.predicted_home_score = 999 AND p.predicted_away_score = 0) OR
  (p.predicted_home_score = 0 AND p.predicted_away_score = 999)
)
-- Ensure we only update if there was a clear winner predicted
AND p.predicted_home_score <> p.predicted_away_score;
