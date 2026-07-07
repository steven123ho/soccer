-- Add photo offset columns to players table
ALTER TABLE players 
ADD COLUMN photo_offset_x INTEGER DEFAULT 0,
ADD COLUMN photo_offset_y INTEGER DEFAULT 0;
