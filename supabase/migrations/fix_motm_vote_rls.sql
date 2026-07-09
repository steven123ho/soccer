-- Fix MOTM vote RLS policy
-- Drop existing policy
DROP POLICY IF EXISTS "Game participants can vote for MOTM" ON motm_votes;

-- Recreate with correct logic
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
