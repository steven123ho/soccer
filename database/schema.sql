-- Soccer Pickup FIFA Database Schema

-- PostgreSQL 12+

 

-- Drop tables if they exist (for clean setup)

DROP TABLE IF EXISTS poll_votes CASCADE;

DROP TABLE IF EXISTS poll_options CASCADE;

DROP TABLE IF EXISTS polls CASCADE;

DROP TABLE IF EXISTS stat_votes CASCADE;

DROP TABLE IF EXISTS team_members CASCADE;

DROP TABLE IF EXISTS teams CASCADE;

DROP TABLE IF EXISTS players CASCADE;

 

-- Players table

CREATE TABLE players (

    id VARCHAR(50) PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE,

    image_url TEXT,

    primary_position VARCHAR(10) NOT NULL,

    rarity VARCHAR(20) NOT NULL DEFAULT 'gold',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

 

-- Player stats (calculated from votes)

CREATE TABLE player_stats (

    player_id VARCHAR(50) PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,

    pace INTEGER NOT NULL DEFAULT 50 CHECK (pace >= 1 AND pace <= 99),

    shooting INTEGER NOT NULL DEFAULT 50 CHECK (shooting >= 1 AND shooting <= 99),

    passing INTEGER NOT NULL DEFAULT 50 CHECK (passing >= 1 AND passing <= 99),

    dribbling INTEGER NOT NULL DEFAULT 50 CHECK (dribbling >= 1 AND dribbling <= 99),

    defending INTEGER NOT NULL DEFAULT 50 CHECK (defending >= 1 AND defending <= 99),

    physical INTEGER NOT NULL DEFAULT 50 CHECK (physical >= 1 AND physical <= 99),

    vote_count INTEGER NOT NULL DEFAULT 0,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

 

-- Individual stat votes from users

CREATE TABLE stat_votes (

    id VARCHAR(50) PRIMARY KEY,

    voter_id VARCHAR(50) NOT NULL,

    player_id VARCHAR(50) NOT NULL REFERENCES players(id) ON DELETE CASCADE,

    pace INTEGER NOT NULL CHECK (pace >= 1 AND pace <= 99),

    shooting INTEGER NOT NULL CHECK (shooting >= 1 AND shooting <= 99),

    passing INTEGER NOT NULL CHECK (passing >= 1 AND passing <= 99),

    dribbling INTEGER NOT NULL CHECK (dribbling >= 1 AND dribbling <= 99),

    defending INTEGER NOT NULL CHECK (defending >= 1 AND defending <= 99),

    physical INTEGER NOT NULL CHECK (physical >= 1 AND physical <= 99),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(voter_id, player_id)

);

 

-- Teams

CREATE TABLE teams (

    id VARCHAR(50) PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    color VARCHAR(7) NOT NULL DEFAULT '#3b82f6',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

 

-- Team members (many-to-many relationship)

CREATE TABLE team_members (

    id VARCHAR(50) PRIMARY KEY,

    team_id VARCHAR(50) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

    player_id VARCHAR(50) NOT NULL REFERENCES players(id) ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(team_id, player_id)

);

 

-- Polls

CREATE TABLE polls (

    id VARCHAR(50) PRIMARY KEY,

    title VARCHAR(200) NOT NULL,

    description TEXT,

    poll_type VARCHAR(50) NOT NULL DEFAULT 'general',

    active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

 

-- Poll options

CREATE TABLE poll_options (

    id VARCHAR(50) PRIMARY KEY,

    poll_id VARCHAR(50) NOT NULL REFERENCES polls(id) ON DELETE CASCADE,

    option_text TEXT NOT NULL,

    votes INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

 

-- Poll votes (track who voted for what)

CREATE TABLE poll_votes (

    id VARCHAR(50) PRIMARY KEY,

    poll_id VARCHAR(50) NOT NULL REFERENCES polls(id) ON DELETE CASCADE,

    option_id VARCHAR(50) NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,

    voter_id VARCHAR(50) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(poll_id, voter_id)

);

 

-- Indexes for better performance

CREATE INDEX idx_players_name ON players(name);

CREATE INDEX idx_stat_votes_player ON stat_votes(player_id);

CREATE INDEX idx_stat_votes_voter ON stat_votes(voter_id);

CREATE INDEX idx_team_members_team ON team_members(team_id);

CREATE INDEX idx_team_members_player ON team_members(player_id);

CREATE INDEX idx_poll_options_poll ON poll_options(poll_id);

CREATE INDEX idx_poll_votes_poll ON poll_votes(poll_id);

CREATE INDEX idx_poll_votes_voter ON poll_votes(voter_id);

 

-- Function to update player stats when votes change

CREATE OR REPLACE FUNCTION update_player_stats()

RETURNS TRIGGER AS $$

BEGIN

    -- Recalculate average stats for the player

    UPDATE player_stats

    SET

        pace = (SELECT ROUND(AVG(pace)) FROM stat_votes WHERE player_id = NEW.player_id),

        shooting = (SELECT ROUND(AVG(shooting)) FROM stat_votes WHERE player_id = NEW.player_id),

        passing = (SELECT ROUND(AVG(passing)) FROM stat_votes WHERE player_id = NEW.player_id),

        dribbling = (SELECT ROUND(AVG(dribbling)) FROM stat_votes WHERE player_id = NEW.player_id),

        defending = (SELECT ROUND(AVG(defending)) FROM stat_votes WHERE player_id = NEW.player_id),

        physical = (SELECT ROUND(AVG(physical)) FROM stat_votes WHERE player_id = NEW.player_id),

        vote_count = (SELECT COUNT(*) FROM stat_votes WHERE player_id = NEW.player_id),

        updated_at = CURRENT_TIMESTAMP

    WHERE player_id = NEW.player_id;

   

    RETURN NEW;

END;

$$ LANGUAGE plpgsql;

 

-- Trigger to auto-update stats when votes are added/updated

CREATE TRIGGER trigger_update_player_stats

AFTER INSERT OR UPDATE ON stat_votes

FOR EACH ROW

EXECUTE FUNCTION update_player_stats();

 

-- Function to update poll option votes

CREATE OR REPLACE FUNCTION update_poll_option_votes()

RETURNS TRIGGER AS $$

BEGIN

    -- Update vote count for the option

    UPDATE poll_options

    SET votes = (SELECT COUNT(*) FROM poll_votes WHERE option_id = NEW.option_id)

    WHERE id = NEW.option_id;

   

    RETURN NEW;

END;

$$ LANGUAGE plpgsql;

 

-- Trigger to auto-update poll votes

CREATE TRIGGER trigger_update_poll_votes

AFTER INSERT OR DELETE ON poll_votes

FOR EACH ROW

EXECUTE FUNCTION update_poll_option_votes();

 

-- Insert sample data (optional - remove if you don't want sample data)

-- Uncomment the lines below to add sample players

 

/*

INSERT INTO players (id, name, primary_position, rarity) VALUES

    ('player_sample_1', 'Sample Player 1', 'ST', 'gold'),

    ('player_sample_2', 'Sample Player 2', 'CM', 'silver');

 

INSERT INTO player_stats (player_id) VALUES

    ('player_sample_1'),

    ('player_sample_2');

*/

 

-- Grant permissions (adjust username as needed)

-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_username;

-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_username;