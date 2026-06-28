export type TournamentStage = 'GROUP' | 'ROUND_OF_32' | 'R16' | 'QF' | 'SF' | 'F'

export interface Team {
  id: number
  name: string
  name_en?: string
  name_es?: string
  name_it?: string
  code: string // e.g. "BRA", "ARG"
  flag_url?: string
  group_name?: string // A-H for group phase
}

export interface Match {
  id: number
  stage: TournamentStage
  home_team_id: number
  away_team_id: number
  match_date: string // ISO string
  home_score?: number | null
  away_score?: number | null
  venue?: string
  status: 'scheduled' | 'live' | 'completed'
  home_team?: Team
  away_team?: Team
}

export type PredictionResult = 'correct' | 'partial' | 'miss' | 'proposed'

export interface Prediction {
  id: string
  user_id: string
  match_id: number
  predicted_home_score: number
  predicted_away_score: number
  result: PredictionResult
  created_at: string
  updated_at: string
  match?: Match
  user?: UserProfile
}

export interface UserProfile {
  id: string
  email: string
  display_name: string
  avatar_url?: string
  created_at: string
}

export type ChangeRequestStatus = 'pending' | 'approved' | 'denied'
export type ChangeRequestType = 'create' | 'update' | 'finish'

export interface MatchChangeRequest {
  id: string
  requested_by: string
  match_id?: number | null // null for create requests
  request_type: ChangeRequestType
  proposed_data: Partial<Match> & { home_score?: number | null; away_score?: number | null }
  status: ChangeRequestStatus
  created_at: string
  updated_at: string
  requester?: UserProfile
  votes?: ChangeRequestVote[]
  match?: Match
}

export interface ChangeRequestVote {
  id: string
  change_request_id: string
  user_id: string
  vote: 'approve' | 'deny'
  created_at: string
  user?: UserProfile
}
