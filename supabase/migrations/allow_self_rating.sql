-- Disable RLS for stat_votes to allow voting
ALTER TABLE stat_votes DISABLE ROW LEVEL SECURITY;

-- Disable RLS for player_stats to allow trigger updates
ALTER TABLE player_stats DISABLE ROW LEVEL SECURITY;

-- Ensure the trigger exists and is working
CREATE OR REPLACE FUNCTION update_player_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if player_stats exists for this player
    IF EXISTS (SELECT 1 FROM player_stats WHERE player_id = NEW.player_id) THEN
        UPDATE player_stats
        SET 
            pace = (SELECT ROUND(AVG(pace)) FROM stat_votes WHERE player_id = NEW.player_id),
            shooting = (SELECT ROUND(AVG(shooting)) FROM stat_votes WHERE player_id = NEW.player_id),
            passing = (SELECT ROUND(AVG(passing)) FROM stat_votes WHERE player_id = NEW.player_id),
            dribbling = (SELECT ROUND(AVG(dribbling)) FROM stat_votes WHERE player_id = NEW.player_id),
            defending = (SELECT ROUND(AVG(defending)) FROM stat_votes WHERE player_id = NEW.player_id),
            physical = (SELECT ROUND(AVG(physical)) FROM stat_votes WHERE player_id = NEW.player_id),
            skill_moves = (SELECT ROUND(AVG(skill_moves)) FROM stat_votes WHERE player_id = NEW.player_id),
            weak_foot = (SELECT ROUND(AVG(weak_foot)) FROM stat_votes WHERE player_id = NEW.player_id),
            vision = (SELECT ROUND(AVG(vision)) FROM stat_votes WHERE player_id = NEW.player_id),
            work_rate = (SELECT ROUND(AVG(work_rate)) FROM stat_votes WHERE player_id = NEW.player_id),
            stamina = (SELECT ROUND(AVG(stamina)) FROM stat_votes WHERE player_id = NEW.player_id),
            vote_count = (SELECT COUNT(*) FROM stat_votes WHERE player_id = NEW.player_id),
            updated_at = NOW()
        WHERE player_id = NEW.player_id;
    ELSE
        -- Create new player_stats entry
        INSERT INTO player_stats (player_id, pace, shooting, passing, dribbling, defending, physical, skill_moves, weak_foot, vision, work_rate, stamina, vote_count)
        VALUES (
            NEW.player_id,
            NEW.pace,
            NEW.shooting,
            NEW.passing,
            NEW.dribbling,
            NEW.defending,
            NEW.physical,
            NEW.skill_moves,
            NEW.weak_foot,
            NEW.vision,
            NEW.work_rate,
            NEW.stamina,
            1
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_player_stats ON stat_votes;

-- Create trigger
CREATE TRIGGER trigger_update_player_stats
    AFTER INSERT OR UPDATE ON stat_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_player_stats();
