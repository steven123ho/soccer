-- Fix MOTM early termination trigger to mark game completed and award MOTM boost when all votes are cast
CREATE OR REPLACE FUNCTION check_motm_early_termination()
RETURNS TRIGGER AS $$
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
  WHERE game_id = NEW.game_id;

  -- Get total votes cast
  SELECT COUNT(*) INTO total_votes
  FROM motm_votes
  WHERE game_id = NEW.game_id;

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

  -- Mark game completed if all votes are cast OR leader has insurmountable lead
  IF total_votes >= total_participants OR leader_votes > (second_highest_votes + remaining_votes) THEN
    UPDATE games
    SET status = 'completed'
    WHERE id = NEW.game_id;

    -- Award MOTM boost to all players with the highest vote count
    FOR winner_id IN
      SELECT candidate_id
      FROM motm_votes
      WHERE game_id = NEW.game_id
      GROUP BY candidate_id
      HAVING COUNT(*) = leader_votes
    LOOP
      -- Check if boost already exists for this player/game
      SELECT id INTO existing_boost_id
      FROM motm_boosts
      WHERE player_id = winner_id
      AND game_id = NEW.game_id;

      expires_at := NOW() + INTERVAL '3 days';

      IF existing_boost_id IS NOT NULL THEN
        -- Extend existing boost
        UPDATE motm_boosts
        SET expires_at = expires_at + INTERVAL '3 days'
        WHERE id = existing_boost_id;
      ELSE
        -- Create new boost
        INSERT INTO motm_boosts (player_id, game_id, boost_amount, expires_at)
        VALUES (winner_id, NEW.game_id, 10, expires_at);
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
