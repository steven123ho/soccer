-- Games system for pickup games and MOTM voting

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  game_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '12 hours'),
  team_a_score INTEGER,
  team_b_score INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Game participants table
CREATE TABLE IF NOT EXISTS game_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team TEXT NOT NULL CHECK (team IN ('team_a', 'team_b')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(game_id, player_id)
);

-- MOTM votes table
CREATE TABLE IF NOT EXISTS motm_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(game_id, voter_id)
);

-- MOTM boosts table
CREATE TABLE IF NOT EXISTS motm_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  boost_amount INTEGER NOT NULL DEFAULT 10,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, game_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_game_participants_game_id ON game_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_player_id ON game_participants(player_id);
CREATE INDEX IF NOT EXISTS idx_motm_votes_game_id ON motm_votes(game_id);
CREATE INDEX IF NOT EXISTS idx_motm_votes_voter_id ON motm_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_motm_votes_candidate_id ON motm_votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_motm_boosts_player_id ON motm_boosts(player_id);
CREATE INDEX IF NOT EXISTS idx_motm_boosts_expires_at ON motm_boosts(expires_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_motm_votes_updated_at
  BEFORE UPDATE ON motm_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check if MOTM voting should end early
CREATE OR REPLACE FUNCTION check_motm_early_termination()
RETURNS TRIGGER AS $$
DECLARE
  total_participants INTEGER;
  total_votes INTEGER;
  leader_votes INTEGER;
  second_highest_votes INTEGER;
  remaining_votes INTEGER;
  leader_candidate_id TEXT;
BEGIN
  -- Get total participants in the game
  SELECT COUNT(*) INTO total_participants
  FROM game_participants
  WHERE game_id = NEW.game_id;

  -- Get total votes cast
  SELECT COUNT(*) INTO total_votes
  FROM motm_votes
  WHERE game_id = NEW.game_id;

  -- If all votes are cast, voting is done
  IF total_votes >= total_participants THEN
    RETURN NEW;
  END IF;

  -- Get vote counts for each candidate
  SELECT candidate_id, COUNT(*) INTO leader_candidate_id, leader_votes
  FROM motm_votes
  WHERE game_id = NEW.game_id
  GROUP BY candidate_id
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Get second highest vote count
  SELECT COUNT(*) INTO second_highest_votes
  FROM motm_votes
  WHERE game_id = NEW.game_id
  AND candidate_id != leader_candidate_id
  GROUP BY candidate_id
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- If no second highest, set to 0
  IF second_highest_votes IS NULL THEN
    second_highest_votes := 0;
  END IF;

  -- Calculate remaining votes
  remaining_votes := total_participants - total_votes;

  -- Check if leader has insurmountable lead
  -- Leader wins if: leader_votes > second_highest_votes + remaining_votes
  IF leader_votes > (second_highest_votes + remaining_votes) THEN
    -- Update game status to completed (MOTM voting ended)
    UPDATE games
    SET status = 'completed'
    WHERE id = NEW.game_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for early MOTM termination
CREATE TRIGGER check_motm_early_termination_trigger
  AFTER INSERT OR UPDATE ON motm_votes
  FOR EACH ROW
  EXECUTE FUNCTION check_motm_early_termination();

-- Function to get player's current MOTM boost
CREATE OR REPLACE FUNCTION get_player_motm_boost(p_player_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_boost INTEGER;
BEGIN
  SELECT COALESCE(SUM(boost_amount), 0) INTO total_boost
  FROM motm_boosts
  WHERE player_id = p_player_id
  AND expires_at > NOW();
  
  RETURN total_boost;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE motm_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE motm_boosts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for games
-- Everyone can read games
CREATE POLICY "Games are viewable by everyone"
  ON games FOR SELECT
  USING (true);

-- Only authenticated users can create games
CREATE POLICY "Authenticated users can create games"
  ON games FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only game creator can update their games
CREATE POLICY "Game creator can update their games"
  ON games FOR UPDATE
  USING (auth.uid() = created_by);

-- Only game creator can delete their games
CREATE POLICY "Game creator can delete their games"
  ON games FOR DELETE
  USING (auth.uid() = created_by);

-- RLS Policies for game_participants
-- Everyone can read game participants
CREATE POLICY "Game participants are viewable by everyone"
  ON game_participants FOR SELECT
  USING (true);

-- Only authenticated users can add participants to games they created
CREATE POLICY "Game creator can add participants"
  ON game_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = game_participants.game_id
      AND games.created_by = auth.uid()
    )
  );

-- Game creator can remove participants
CREATE POLICY "Game creator can remove participants"
  ON game_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = game_participants.game_id
      AND games.created_by = auth.uid()
    )
  );

-- RLS Policies for motm_votes
-- Everyone can read MOTM votes
CREATE POLICY "MOTM votes are viewable by everyone"
  ON motm_votes FOR SELECT
  USING (true);

-- Only game participants can vote for MOTM
CREATE POLICY "Game participants can vote for MOTM"
  ON motm_votes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players
      WHERE players.user_id = auth.uid()
      AND players.id = motm_votes.voter_id
    )
    AND EXISTS (
      SELECT 1 FROM game_participants
      WHERE game_participants.game_id = motm_votes.game_id
      AND game_participants.player_id = motm_votes.voter_id
    )
  );

-- Voters can update their own votes
CREATE POLICY "Voters can update their own votes"
  ON motm_votes FOR UPDATE
  USING (auth.uid()::text = voter_id);

-- Voters can delete their own votes
CREATE POLICY "Voters can delete their own votes"
  ON motm_votes FOR DELETE
  USING (auth.uid()::text = voter_id);

-- RLS Policies for motm_boosts
-- Everyone can read MOTM boosts
CREATE POLICY "MOTM boosts are viewable by everyone"
  ON motm_boosts FOR SELECT
  USING (true);

-- Only system/authorized function can create MOTM boosts
-- This will be handled by a backend function, not direct user access
CREATE POLICY "No direct insert for motm_boosts"
  ON motm_boosts FOR INSERT
  WITH CHECK (false);

-- No direct updates for motm_boosts
CREATE POLICY "No direct update for motm_boosts"
  ON motm_boosts FOR UPDATE
  WITH CHECK (false);

-- No direct deletes for motm_boosts
CREATE POLICY "No direct delete for motm_boosts"
  ON motm_boosts FOR DELETE
  USING (false);
