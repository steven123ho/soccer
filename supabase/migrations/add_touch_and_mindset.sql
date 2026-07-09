-- Add touch and mindset stats
ALTER TABLE player_stats 
ADD COLUMN touch INTEGER DEFAULT 50 CHECK (touch >= 1 AND touch <= 99),
ADD COLUMN mindset INTEGER DEFAULT 2 CHECK (mindset >= 1 AND mindset <= 3);

-- Update work_rate to be 1-4 scale instead of 1-99
ALTER TABLE player_stats 
ALTER COLUMN work_rate DROP DEFAULT,
ALTER COLUMN work_rate SET DEFAULT 2,
ADD CONSTRAINT work_rate_check CHECK (work_rate >= 1 AND work_rate <= 4);

-- Add columns as nullable first, backfill existing rows, then set NOT NULL
ALTER TABLE stat_votes 
ADD COLUMN touch INTEGER CHECK (touch >= 1 AND touch <= 99),
ADD COLUMN mindset INTEGER CHECK (mindset >= 1 AND mindset <= 3);

-- Update work_rate in stat_votes to 1-4 scale
ALTER TABLE stat_votes 
ALTER COLUMN work_rate DROP DEFAULT,
ALTER COLUMN work_rate SET DEFAULT 2,
ADD CONSTRAINT stat_votes_work_rate_check CHECK (work_rate >= 1 AND work_rate <= 4);

UPDATE stat_votes SET touch = 50 WHERE touch IS NULL;
UPDATE stat_votes SET mindset = 2 WHERE mindset IS NULL;
UPDATE stat_votes SET work_rate = 2 WHERE work_rate > 4;

ALTER TABLE stat_votes 
ALTER COLUMN touch SET NOT NULL,
ALTER COLUMN mindset SET NOT NULL;

CREATE OR REPLACE FUNCTION update_player_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE player_stats
    SET 
        pace = (SELECT ROUND(AVG(pace)) FROM stat_votes WHERE player_id = NEW.player_id),
        shooting = (SELECT ROUND(AVG(shooting)) FROM stat_votes WHERE player_id = NEW.player_id),
        passing = (SELECT ROUND(AVG(passing)) FROM stat_votes WHERE player_id = NEW.player_id),
        dribbling = (SELECT ROUND(AVG(dribbling)) FROM stat_votes WHERE player_id = NEW.player_id),
        defending = (SELECT ROUND(AVG(defending)) FROM stat_votes WHERE player_id = NEW.player_id),
        physical = (SELECT ROUND(AVG(physical)) FROM stat_votes WHERE player_id = NEW.player_id),
        skill_moves = (SELECT ROUND(AVG(skill_moves)::numeric, 1) FROM stat_votes WHERE player_id = NEW.player_id),
        weak_foot = (SELECT ROUND(AVG(weak_foot)::numeric, 1) FROM stat_votes WHERE player_id = NEW.player_id),
        vision = (SELECT ROUND(AVG(vision)) FROM stat_votes WHERE player_id = NEW.player_id),
        work_rate = (SELECT ROUND(AVG(work_rate)) FROM stat_votes WHERE player_id = NEW.player_id),
        stamina = (SELECT ROUND(AVG(stamina)) FROM stat_votes WHERE player_id = NEW.player_id),
        touch = (SELECT ROUND(AVG(touch)) FROM stat_votes WHERE player_id = NEW.player_id),
        mindset = (SELECT ROUND(AVG(mindset)) FROM stat_votes WHERE player_id = NEW.player_id),
        vote_count = (SELECT COUNT(*) FROM stat_votes WHERE player_id = NEW.player_id),
        updated_at = NOW()
    WHERE player_id = NEW.player_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS trigger_update_player_stats ON stat_votes;
CREATE TRIGGER trigger_update_player_stats
    AFTER INSERT OR UPDATE ON stat_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_player_stats();

-- Create callable RPC function for manual stat updates
CREATE OR REPLACE FUNCTION update_single_player_stats(player_id_param TEXT)
RETURNS VOID AS $$
BEGIN
    -- Ensure player_stats entry exists
    INSERT INTO player_stats (player_id, pace, shooting, passing, dribbling, defending, physical, skill_moves, weak_foot, vision, work_rate, stamina, touch, mindset, vote_count, updated_at)
    SELECT 
        player_id_param,
        50, 50, 50, 50, 50, 50, 3, 3, 50, 2, 50, 50, 2, 0, NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM player_stats WHERE player_id = player_id_param
    );
    
    UPDATE player_stats
    SET 
        pace = (SELECT ROUND(AVG(pace)) FROM stat_votes WHERE player_id = player_id_param),
        shooting = (SELECT ROUND(AVG(shooting)) FROM stat_votes WHERE player_id = player_id_param),
        passing = (SELECT ROUND(AVG(passing)) FROM stat_votes WHERE player_id = player_id_param),
        dribbling = (SELECT ROUND(AVG(dribbling)) FROM stat_votes WHERE player_id = player_id_param),
        defending = (SELECT ROUND(AVG(defending)) FROM stat_votes WHERE player_id = player_id_param),
        physical = (SELECT ROUND(AVG(physical)) FROM stat_votes WHERE player_id = player_id_param),
        skill_moves = (SELECT ROUND(AVG(skill_moves)::numeric, 1) FROM stat_votes WHERE player_id = player_id_param),
        weak_foot = (SELECT ROUND(AVG(weak_foot)::numeric, 1) FROM stat_votes WHERE player_id = player_id_param),
        vision = (SELECT ROUND(AVG(vision)) FROM stat_votes WHERE player_id = player_id_param),
        work_rate = (SELECT ROUND(AVG(work_rate)) FROM stat_votes WHERE player_id = player_id_param),
        stamina = (SELECT ROUND(AVG(stamina)) FROM stat_votes WHERE player_id = player_id_param),
        touch = (SELECT ROUND(AVG(touch)) FROM stat_votes WHERE player_id = player_id_param),
        mindset = (SELECT ROUND(AVG(mindset)) FROM stat_votes WHERE player_id = player_id_param),
        vote_count = (SELECT COUNT(*) FROM stat_votes WHERE player_id = player_id_param),
        updated_at = NOW()
    WHERE player_id = player_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
