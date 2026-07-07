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
