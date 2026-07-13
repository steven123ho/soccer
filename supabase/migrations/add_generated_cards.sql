-- Create generated_cards table (similar to players but for user-created cards)
CREATE TABLE generated_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_name TEXT,
  name TEXT NOT NULL,
  primary_position TEXT NOT NULL,
  secondary_positions TEXT[] DEFAULT '{}',
  player_number INTEGER,
  nationality TEXT,
  image_url TEXT,
  card_color TEXT DEFAULT '#f59e0b',
  photo_offset_x INTEGER DEFAULT 0,
  photo_offset_y INTEGER DEFAULT 0,
  rarity TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generated_stats table (similar to player_stats)
CREATE TABLE generated_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  generated_card_id UUID REFERENCES generated_cards(id) ON DELETE CASCADE UNIQUE,
  pace INTEGER DEFAULT 50,
  shooting INTEGER DEFAULT 50,
  passing INTEGER DEFAULT 50,
  dribbling INTEGER DEFAULT 50,
  defending INTEGER DEFAULT 50,
  physical INTEGER DEFAULT 50,
  touch INTEGER DEFAULT 50,
  mindset INTEGER DEFAULT 2,
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generated_stat_votes table (similar to stat_votes)
CREATE TABLE generated_stat_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  generated_card_id UUID REFERENCES generated_cards(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL,
  pace INTEGER DEFAULT 50,
  shooting INTEGER DEFAULT 50,
  passing INTEGER DEFAULT 50,
  dribbling INTEGER DEFAULT 50,
  defending INTEGER DEFAULT 50,
  physical INTEGER DEFAULT 50,
  touch INTEGER DEFAULT 50,
  mindset INTEGER DEFAULT 2,
  skill_moves INTEGER DEFAULT 3,
  weak_foot INTEGER DEFAULT 3,
  vision INTEGER DEFAULT 50,
  work_rate INTEGER DEFAULT 2,
  stamina INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voter_id, generated_card_id)
);

-- Create daily_card_creation_tracking table
CREATE TABLE daily_card_creation_tracking (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_card_date DATE NOT NULL DEFAULT CURRENT_DATE,
  cards_created_today INTEGER DEFAULT 0
);

-- Create trigger for updating updated_at on generated_cards
CREATE OR REPLACE FUNCTION update_generated_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generated_cards_updated_at
  BEFORE UPDATE ON generated_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_generated_cards_updated_at();

-- Create trigger for updating updated_at on generated_stats
CREATE TRIGGER generated_stats_updated_at
  BEFORE UPDATE ON generated_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_generated_cards_updated_at();

-- Create trigger for updating updated_at on generated_stat_votes
CREATE TRIGGER generated_stat_votes_updated_at
  BEFORE UPDATE ON generated_stat_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_generated_cards_updated_at();

-- Create trigger to auto-create generated_stats when a generated_card is created
CREATE OR REPLACE FUNCTION create_generated_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO generated_stats (generated_card_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_generated_stats_trigger
  AFTER INSERT ON generated_cards
  FOR EACH ROW
  EXECUTE FUNCTION create_generated_stats();

-- Create trigger to update generated stats when votes are added
CREATE OR REPLACE FUNCTION update_generated_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE generated_stats
  SET 
    pace = (SELECT ROUND(AVG(pace)) FROM generated_stat_votes WHERE generated_card_id = NEW.generated_card_id),
    shooting = (SELECT ROUND(AVG(shooting)) FROM generated_stat_votes WHERE generated_card_id = NEW.generated_card_id),
    passing = (SELECT ROUND(AVG(passing)) FROM generated_stat_votes WHERE generated_card_id = NEW.generated_card_id),
    dribbling = (SELECT ROUND(AVG(dribbling)) FROM generated_stat_votes WHERE generated_card_id = NEW.generated_card_id),
    defending = (SELECT ROUND(AVG(defending)) FROM generated_stat_votes WHERE generated_card_id = NEW.generated_card_id),
    physical = (SELECT ROUND(AVG(physical)) FROM generated_stat_votes WHERE generated_card_id = NEW.generated_card_id),
    touch = (SELECT ROUND(AVG(touch)) FROM generated_stat_votes WHERE generated_card_id = NEW.generated_card_id),
    mindset = (SELECT ROUND(AVG(mindset)) FROM generated_stat_votes WHERE generated_card_id = NEW.generated_card_id),
    vote_count = (SELECT COUNT(*) FROM generated_stat_votes WHERE generated_card_id = NEW.generated_card_id),
    updated_at = NOW()
  WHERE id = NEW.generated_card_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_generated_stats_trigger
  AFTER INSERT OR UPDATE ON generated_stat_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_generated_stats();

-- RLS Policies
ALTER TABLE generated_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_stat_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_card_creation_tracking ENABLE ROW LEVEL SECURITY;

-- Generated cards policies
CREATE POLICY "Anyone can view generated cards"
  ON generated_cards FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create generated cards"
  ON generated_cards FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their generated cards"
  ON generated_cards FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their generated cards"
  ON generated_cards FOR DELETE
  USING (auth.uid() = creator_id);

-- Generated stats policies
CREATE POLICY "Anyone can view generated stats"
  ON generated_stats FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert generated stats"
  ON generated_stats FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update generated stats"
  ON generated_stats FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Generated stat votes policies
CREATE POLICY "Anyone can view generated stat votes"
  ON generated_stat_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create generated stat votes"
  ON generated_stat_votes FOR INSERT
  WITH CHECK (auth.uid() = voter_id);

CREATE POLICY "Users can update their own generated stat votes"
  ON generated_stat_votes FOR UPDATE
  USING (auth.uid() = voter_id);

CREATE POLICY "Users can delete their own generated stat votes"
  ON generated_stat_votes FOR DELETE
  USING (auth.uid() = voter_id);

-- Daily card creation tracking policies
CREATE POLICY "Users can view their own tracking"
  ON daily_card_creation_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracking"
  ON daily_card_creation_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracking"
  ON daily_card_creation_tracking FOR UPDATE
  USING (auth.uid() = user_id);

-- Add constraints for generated_stat_votes
ALTER TABLE generated_stat_votes
ADD CONSTRAINT generated_stat_votes_pace_check CHECK (pace >= 0 AND pace <= 100),
ADD CONSTRAINT generated_stat_votes_shooting_check CHECK (shooting >= 0 AND shooting <= 100),
ADD CONSTRAINT generated_stat_votes_passing_check CHECK (passing >= 0 AND passing <= 100),
ADD CONSTRAINT generated_stat_votes_dribbling_check CHECK (dribbling >= 0 AND dribbling <= 100),
ADD CONSTRAINT generated_stat_votes_defending_check CHECK (defending >= 0 AND defending <= 100),
ADD CONSTRAINT generated_stat_votes_physical_check CHECK (physical >= 0 AND physical <= 100),
ADD CONSTRAINT generated_stat_votes_touch_check CHECK (touch >= 0 AND touch <= 100),
ADD CONSTRAINT generated_stat_votes_mindset_check CHECK (mindset >= 1 AND mindset <= 3),
ADD CONSTRAINT generated_stat_votes_skill_moves_check CHECK (skill_moves >= 1 AND skill_moves <= 5),
ADD CONSTRAINT generated_stat_votes_weak_foot_check CHECK (weak_foot >= 1 AND weak_foot <= 5),
ADD CONSTRAINT generated_stat_votes_vision_check CHECK (vision >= 0 AND vision <= 100),
ADD CONSTRAINT generated_stat_votes_work_rate_check CHECK (work_rate >= 1 AND work_rate <= 3),
ADD CONSTRAINT generated_stat_votes_stamina_check CHECK (stamina >= 0 AND stamina <= 100);

-- Add constraints for generated_stats
ALTER TABLE generated_stats
ADD CONSTRAINT generated_stats_pace_check CHECK (pace >= 0 AND pace <= 100),
ADD CONSTRAINT generated_stats_shooting_check CHECK (shooting >= 0 AND shooting <= 100),
ADD CONSTRAINT generated_stats_passing_check CHECK (passing >= 0 AND passing <= 100),
ADD CONSTRAINT generated_stats_dribbling_check CHECK (dribbling >= 0 AND dribbling <= 100),
ADD CONSTRAINT generated_stats_defending_check CHECK (defending >= 0 AND defending <= 100),
ADD CONSTRAINT generated_stats_physical_check CHECK (physical >= 0 AND physical <= 100),
ADD CONSTRAINT generated_stats_touch_check CHECK (touch >= 0 AND touch <= 100),
ADD CONSTRAINT generated_stats_mindset_check CHECK (mindset >= 1 AND mindset <= 3);

-- RPC function to manually update generated card stats (similar to update_single_player_stats)
CREATE OR REPLACE FUNCTION update_single_generated_card_stats(card_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE generated_stats
  SET 
    pace = (SELECT ROUND(AVG(pace)) FROM generated_stat_votes WHERE generated_card_id = card_id),
    shooting = (SELECT ROUND(AVG(shooting)) FROM generated_stat_votes WHERE generated_card_id = card_id),
    passing = (SELECT ROUND(AVG(passing)) FROM generated_stat_votes WHERE generated_card_id = card_id),
    dribbling = (SELECT ROUND(AVG(dribbling)) FROM generated_stat_votes WHERE generated_card_id = card_id),
    defending = (SELECT ROUND(AVG(defending)) FROM generated_stat_votes WHERE generated_card_id = card_id),
    physical = (SELECT ROUND(AVG(physical)) FROM generated_stat_votes WHERE generated_card_id = card_id),
    touch = (SELECT ROUND(AVG(touch)) FROM generated_stat_votes WHERE generated_card_id = card_id),
    mindset = (SELECT ROUND(AVG(mindset)) FROM generated_stat_votes WHERE generated_card_id = card_id),
    vote_count = (SELECT COUNT(*) FROM generated_stat_votes WHERE generated_card_id = card_id),
    updated_at = NOW()
  WHERE id = card_id;
  
  -- If no votes exist, set defaults
  IF NOT EXISTS (SELECT 1 FROM generated_stat_votes WHERE generated_card_id = card_id) THEN
    UPDATE generated_stats
    SET 
      pace = 50,
      shooting = 50,
      passing = 50,
      dribbling = 50,
      defending = 50,
      physical = 50,
      touch = 50,
      mindset = 2,
      vote_count = 0,
      updated_at = NOW()
    WHERE id = card_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
