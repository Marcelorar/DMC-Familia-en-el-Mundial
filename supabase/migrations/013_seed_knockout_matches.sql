-- Migration: Seed Round of 32 and Round of 16 matches
-- Round of 32 matches are marked as completed based on provided JSON results
-- Round of 16 matches are scheduled pairings

INSERT INTO public.matches (id, home_team_id, away_team_id, match_date, stage, venue, status, home_score, away_score)
VALUES
  -- Round of 16
  (89, 34, 19, '2026-07-04T21:00:00Z', 'R16', 'Lincoln Financial Field, Philadelphia, Pennsylvania','scheduled', NULL, NULL), -- PAR vs FRA
  (90,  9, 29, '2026-07-04T17:00:00Z', 'R16', 'NRG Stadium, Houston, Texas',                      'scheduled', NULL, NULL), -- CAN vs MAR
  (91,  7, 32, '2026-07-05T20:00:00Z', 'R16', 'MetLife Stadium, East Rutherford, New Jersey',     'scheduled', NULL, NULL), -- BRA vs NOR
  (92, 28, 18, '2026-07-06T00:00:00Z', 'R16', 'Estadio Banorte, Mexico City',                     'scheduled', NULL, NULL), -- MEX vs ENG
  (93, 35, 41, '2026-07-06T19:00:00Z', 'R16', 'AT&T Stadium, Arlington, Texas',                   'scheduled', NULL, NULL), -- POR vs ESP
  (94, 47,  5, '2026-07-07T00:00:00Z', 'R16', 'Lumen Field, Seattle, Washington',                 'scheduled', NULL, NULL), -- USA vs BEL
  (95,  2, 17, '2026-07-07T16:00:00Z', 'R16', 'Mercedes-Benz Stadium, Atlanta, Georgia',          'scheduled', NULL, NULL), -- ARG vs EGY
  (96, 43, 10, '2026-07-07T20:00:00Z', 'R16', 'BC Place, Vancouver',                              'scheduled', NULL, NULL)  -- SUI vs COL
ON CONFLICT (id) DO UPDATE SET
  home_team_id = EXCLUDED.home_team_id,
  away_team_id = EXCLUDED.away_team_id,
  match_date   = EXCLUDED.match_date,
  stage        = EXCLUDED.stage,
  venue        = EXCLUDED.venue,
  status       = EXCLUDED.status,
  home_score   = EXCLUDED.home_score,
  away_score   = EXCLUDED.away_score;
