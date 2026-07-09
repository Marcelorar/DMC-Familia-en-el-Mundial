-- Migration: Seed Round of 8
-- Round of 8 matches are scheduled pairings

INSERT INTO public.matches (id, home_team_id, away_team_id, match_date, stage, venue, status, home_score, away_score)
VALUES
  -- Round of 16
  (97, 19, 29, '2026-07-09T20:00:00Z', 'QF', 'Gillette Stadium, Foxborough, Massachusetts','scheduled', NULL, NULL),
  (98,  41, 5, '2026-07-10T19:00:00Z', 'QF', 'Sofi Stadium, NRG Stadium, Inglewood, California',                      'scheduled', NULL, NULL),
  (99,  32, 18, '2026-07-11T21:00:00Z', 'QF', 'Hard Rock Stadium, Miami Gardens, Florida',     'scheduled', NULL, NULL),
  (100, 2, 42, '2026-07-12T01:00:00Z', 'QF', 'Geha Field At Arrowhead Stadium, Kansas City, Missouri',                     'scheduled', NULL, NULL)
  ON CONFLICT (id) DO UPDATE SET
  home_team_id = EXCLUDED.home_team_id,
  away_team_id = EXCLUDED.away_team_id,
  match_date   = EXCLUDED.match_date,
  stage        = EXCLUDED.stage,
  venue        = EXCLUDED.venue,
  status       = EXCLUDED.status,
  home_score   = EXCLUDED.home_score,
  away_score   = EXCLUDED.away_score;
