-- Add new player stats: skill moves, weak foot, vision, work rate, stamina
ALTER TABLE player_stats 
ADD COLUMN skill_moves NUMERIC(3,1) DEFAULT 1 CHECK (skill_moves >= 1 AND skill_moves <= 5),
ADD COLUMN weak_foot NUMERIC(3,1) DEFAULT 1 CHECK (weak_foot >= 1 AND weak_foot <= 5),
ADD COLUMN vision INTEGER DEFAULT 50 CHECK (vision >= 1 AND vision <= 99),
ADD COLUMN work_rate INTEGER DEFAULT 50 CHECK (work_rate >= 1 AND work_rate <= 99),
ADD COLUMN stamina INTEGER DEFAULT 50 CHECK (stamina >= 1 AND stamina <= 99);

-- Add columns as nullable first, backfill existing rows, then set NOT NULL
ALTER TABLE stat_votes 
ADD COLUMN skill_moves NUMERIC(3,1) CHECK (skill_moves >= 1 AND skill_moves <= 5),
ADD COLUMN weak_foot NUMERIC(3,1) CHECK (weak_foot >= 1 AND weak_foot <= 5),
ADD COLUMN vision INTEGER CHECK (vision >= 1 AND vision <= 99),a
ADD COLUMN work_rate INTEGER CHECK (work_rate >= 1 AND work_rate <= 99),
ADD COLUMN stamina INTEGER CHECK (stamina >= 1 AND stamina <= 99);

UPDATE stat_votes SET skill_moves = 1 WHERE skill_moves IS NULL;
UPDATE stat_votes SET weak_foot = 1 WHERE weak_foot IS NULL;
UPDATE stat_votes SET vision = 50 WHERE vision IS NULL;
UPDATE stat_votes SET work_rate = 50 WHERE work_rate IS NULL;
UPDATE stat_votes SET stamina = 50 WHERE stamina IS NULL;

ALTER TABLE stat_votes 
ALTER COLUMN skill_moves SET NOT NULL,
ALTER COLUMN weak_foot SET NOT NULL,
ALTER COLUMN vision SET NOT NULL,
ALTER COLUMN work_rate SET NOT NULL,
ALTER COLUMN stamina SET NOT NULL;

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
        vote_count = (SELECT COUNT(*) FROM stat_votes WHERE player_id = NEW.player_id),
        updated_at = NOW()
    WHERE player_id = NEW.player_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
