-- Supabase Schema for Soccer Pickup App
-- This schema includes tables for players, stats, teams, and polls

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE, -- Each user has one player profile
    name TEXT NOT NULL,
    image_url TEXT,
    primary_position TEXT NOT NULL CHECK (primary_position IN ('GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF')),
    player_number INTEGER CHECK (player_number >= 1 AND player_number <= 99),
    rarity TEXT DEFAULT 'gold' CHECK (rarity IN ('bronze', 'silver', 'gold', 'special')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player stats table
CREATE TABLE player_stats (
    player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    pace INTEGER DEFAULT 50 CHECK (pace >= 1 AND pace <= 99),
    shooting INTEGER DEFAULT 50 CHECK (shooting >= 1 AND shooting <= 99),
    passing INTEGER DEFAULT 50 CHECK (passing >= 1 AND passing <= 99),
    dribbling INTEGER DEFAULT 50 CHECK (dribbling >= 1 AND dribbling <= 99),
    defending INTEGER DEFAULT 50 CHECK (defending >= 1 AND defending <= 99),
    physical INTEGER DEFAULT 50 CHECK (physical >= 1 AND physical <= 99),
    vote_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stat votes table
CREATE TABLE stat_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voter_id UUID NOT NULL, -- Will reference auth.users
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    pace INTEGER NOT NULL CHECK (pace >= 1 AND pace <= 99),
    shooting INTEGER NOT NULL CHECK (shooting >= 1 AND shooting <= 99),
    passing INTEGER NOT NULL CHECK (passing >= 1 AND passing <= 99),
    dribbling INTEGER NOT NULL CHECK (dribbling >= 1 AND dribbling <= 99),
    defending INTEGER NOT NULL CHECK (defending >= 1 AND defending <= 99),
    physical INTEGER NOT NULL CHECK (physical >= 1 AND physical <= 99),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(voter_id, player_id)
);

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members table
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, player_id)
);

-- Polls table
CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    poll_type TEXT DEFAULT 'general',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poll options table
CREATE TABLE poll_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poll votes table
CREATE TABLE poll_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL, -- Will reference auth.users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(poll_id, voter_id)
);

-- Create indexes for performance
CREATE INDEX idx_players_created_at ON players(created_at DESC);
CREATE INDEX idx_stat_votes_voter ON stat_votes(voter_id);
CREATE INDEX idx_stat_votes_player ON stat_votes(player_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_player ON team_members(player_id);
CREATE INDEX idx_poll_options_poll ON poll_options(poll_id);
CREATE INDEX idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX idx_poll_votes_voter ON poll_votes(voter_id);

-- Function to update player stats based on votes
CREATE OR REPLACE FUNCTION update_player_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE player_stats
    SET 
        pace = ROUND(AVG(sv.pace)),
        shooting = ROUND(AVG(sv.shooting)),
        passing = ROUND(AVG(sv.passing)),
        dribbling = ROUND(AVG(sv.dribbling)),
        defending = ROUND(AVG(sv.defending)),
        physical = ROUND(AVG(sv.physical)),
        vote_count = (SELECT COUNT(*) FROM stat_votes WHERE player_id = NEW.player_id),
        updated_at = NOW()
    WHERE player_id = NEW.player_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats when vote is inserted or updated
CREATE TRIGGER trigger_update_player_stats
    AFTER INSERT OR UPDATE ON stat_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_player_stats();

-- Function to update poll option votes
CREATE OR REPLACE FUNCTION update_poll_option_votes()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE poll_options
    SET votes = (SELECT COUNT(*) FROM poll_votes WHERE option_id = NEW.option_id)
    WHERE id = NEW.option_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update poll option votes when vote is inserted
CREATE TRIGGER trigger_update_poll_votes
    AFTER INSERT ON poll_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_poll_option_votes();

-- Function to update poll option votes when vote is deleted
CREATE OR REPLACE FUNCTION update_poll_option_votes_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE poll_options
    SET votes = (SELECT COUNT(*) FROM poll_votes WHERE option_id = OLD.option_id)
    WHERE id = OLD.option_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update poll option votes when vote is deleted
CREATE TRIGGER trigger_update_poll_votes_delete
    AFTER DELETE ON poll_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_poll_option_votes_delete();

-- Enable Row Level Security (RLS)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE stat_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for players (read-only for public, users can only create/update their own player)
CREATE POLICY "Players are viewable by everyone"
    ON players FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own player profile"
    ON players FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own player profile"
    ON players FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for player_stats
CREATE POLICY "Player stats are viewable by everyone"
    ON player_stats FOR SELECT
    USING (true);

-- RLS Policies for stat_votes
CREATE POLICY "Stat votes are viewable by everyone"
    ON stat_votes FOR SELECT
    USING (true);

CREATE POLICY "Users cannot vote on themselves"
    ON stat_votes FOR INSERT
    WITH CHECK (
        auth.uid() = voter_id AND 
        voter_id != (SELECT user_id FROM players WHERE id = player_id)
    );

CREATE POLICY "Users can update their own stat votes"
    ON stat_votes FOR UPDATE
    USING (auth.uid() = voter_id);

-- RLS Policies for teams
CREATE POLICY "Teams are viewable by everyone"
    ON teams FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create teams"
    ON teams FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete teams"
    ON teams FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- RLS Policies for team_members
CREATE POLICY "Team members are viewable by everyone"
    ON team_members FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create team members"
    ON team_members FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for polls
CREATE POLICY "Polls are viewable by everyone"
    ON polls FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create polls"
    ON polls FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete polls"
    ON polls FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- RLS Policies for poll_options
CREATE POLICY "Poll options are viewable by everyone"
    ON poll_options FOR SELECT
    USING (true);

-- RLS Policies for poll_votes
CREATE POLICY "Poll votes are viewable by everyone"
    ON poll_votes FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create poll votes"
    ON poll_votes FOR INSERT
    WITH CHECK (auth.uid() = voter_id);

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON player_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stat_votes_updated_at BEFORE UPDATE ON stat_votes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
