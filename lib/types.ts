export interface Player {
  id: string
  user_id: string | null
  name: string
  image_url: string | null
  primary_position: string
  secondary_positions: string[] | null
  player_number: number | null
  nationality: string | null
  rarity: string
  card_color: string | null
  photo_offset_x: number
  photo_offset_y: number
  created_at: string
  updated_at: string
}

export interface PlayerStats {
  player_id: string
  pace: number
  shooting: number
  passing: number
  dribbling: number
  defending: number
  physical: number
  skill_moves: number
  weak_foot: number
  vision: number
  work_rate: number
  stamina: number
  touch: number
  mindset: number
  vote_count: number
  updated_at: string
}

export interface PlayerWithStats extends Player {
  stats: PlayerStats
}

export interface StatVote {
  id: string
  voter_id: string
  player_id: string
  pace: number
  shooting: number
  passing: number
  dribbling: number
  defending: number
  physical: number
  skill_moves: number
  weak_foot: number
  vision: number
  work_rate: number
  stamina: number
  touch: number
  mindset: number
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  name: string
  color: string
  created_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  player_id: string
  created_at: string
}

export interface TeamWithMembers extends Team {
  members: (TeamMember & { player: PlayerWithStats })[]
}

export interface Poll {
  id: string
  title: string
  description: string | null
  poll_type: string
  active: boolean
  created_at: string
}

export interface PollOption {
  id: string
  poll_id: string
  option_text: string
  votes: number
  created_at: string
}

export interface PollVote {
  id: string
  poll_id: string
  option_id: string
  voter_id: string
  created_at: string
}

export interface PollWithOptions extends Poll {
  options: (PollOption & { has_voted?: boolean })[]
}

export interface StatsEntry {
  id: string
  player_id: string
  goals: number
  assists: number
  date: string
  hours_played: number | null
  created_at: string
  updated_at: string
}

export interface StatsSummary {
  total_goals: number
  total_assists: number
  total_games: number
  total_hours: number
  goals_per_game: number
  assists_per_game: number
  goals_per_hour: number
  assists_per_hour: number
  goals_last_week: number
  assists_last_week: number
  goals_last_month: number
  assists_last_month: number
  goals_last_year: number
  assists_last_year: number
}

export interface Game {
  id: string
  title: string
  game_date: string
  created_at: string
  expires_at: string
  team_a_score: number | null
  team_b_score: number | null
  status: 'active' | 'completed' | 'cancelled'
  created_by: string
  updated_at: string
}

export interface GameParticipant {
  id: string
  game_id: string
  player_id: string
  team: 'team_a' | 'team_b'
  created_at: string
}

export interface GameWithParticipants extends Game {
  participants: (GameParticipant & { player: PlayerWithStats })[]
}

export interface MOTMVote {
  id: string
  game_id: string
  voter_id: string
  candidate_id: string
  created_at: string
  updated_at: string
}

export interface MOTMBoost {
  id: string
  player_id: string
  game_id: string
  boost_amount: number
  expires_at: string
  created_at: string
}
