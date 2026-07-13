-- RPC function to complete game and award MOTM boost
CREATE OR REPLACE FUNCTION complete_game_and_award_motm(p_game_id UUID)
RETURNS VOID AS $$
DECLARE
  total_participants INTEGER;
  total_votes INTEGER;
  leader_votes INTEGER;
  second_highest_votes INTEGER;
  remaining_votes INTEGER;
  leader_candidate_id TEXT;
  winner_id TEXT;
  existing_boost_id UUID;
  expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get total participants in the game
  SELECT COUNT(*) INTO total_participants
  FROM game_participants
  WHERE game_id = p_game_id;

  -- Get total votes cast
  SELECT COUNT(*) INTO total_votes
  FROM motm_votes
  WHERE game_id = p_game_id;

  -- Get vote counts for each candidate
  SELECT candidate_id, COUNT(*) INTO leader_candidate_id, leader_votes
  FROM motm_votes
  WHERE game_id = p_game_id
  GROUP BY candidate_id
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Get second highest vote count
  SELECT COUNT(*) INTO second_highest_votes
  FROM motm_votes
  WHERE game_id = p_game_id
  AND candidate_id != leader_candidate_id
  GROUP BY candidate_id
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  IF second_highest_votes IS NULL THEN
    second_highest_votes := 0;
  END IF;

  remaining_votes := total_participants - total_votes;

  IF total_votes >= total_participants OR leader_votes > (second_highest_votes + remaining_votes) THEN
    -- Update game status
    UPDATE games
    SET status = 'completed'
    WHERE id = p_game_id;

    -- Award MOTM boost to all players with highest vote count
    FOR winner_id IN
      SELECT candidate_id
      FROM motm_votes
      WHERE game_id = p_game_id
      GROUP BY candidate_id
      HAVING COUNT(*) = leader_votes
    LOOP
      SELECT id INTO existing_boost_id
      FROM motm_boosts
      WHERE player_id = winner_id
      AND game_id = p_game_id;

      expires_at := NOW() + INTERVAL '3 days';

      IF existing_boost_id IS NOT NULL THEN
        UPDATE motm_boosts
        SET expires_at = expires_at + INTERVAL '3 days'
        WHERE id = existing_boost_id;
      ELSE
        INSERT INTO motm_boosts (player_id, game_id, boost_amount, expires_at)
        VALUES (winner_id, p_game_id, 10, expires_at);
      END IF;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
