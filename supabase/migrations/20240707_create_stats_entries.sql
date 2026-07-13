-- Create stats_entries table
CREATE TABLE IF NOT EXISTS stats_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id TEXT REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  goals INTEGER NOT NULL DEFAULT 0 CHECK (goals >= 0),
  assists INTEGER NOT NULL DEFAULT 0 CHECK (assists >= 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours_played NUMERIC(5,2) CHECK (hours_played >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on player_id for faster queries
CREATE INDEX IF NOT EXISTS idx_stats_entries_player_id ON stats_entries(player_id);
CREATE INDEX IF NOT EXISTS idx_stats_entries_date ON stats_entries(date);

-- Enable RLS
ALTER TABLE stats_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Players can only see their own stats entries
CREATE POLICY "Users can view own stats entries"
  ON stats_entries FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM players WHERE id = player_id));

-- Players can insert their own stats entries
CREATE POLICY "Users can insert own stats entries"
  ON stats_entries FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM players WHERE id = player_id));

-- Players can update their own stats entries
CREATE POLICY "Users can update own stats entries"
  ON stats_entries FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM players WHERE id = player_id));

-- Players can delete their own stats entries
CREATE POLICY "Users can delete own stats entries"
  ON stats_entries FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM players WHERE id = player_id));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_stats_entries_updated_at
  BEFORE UPDATE ON stats_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
