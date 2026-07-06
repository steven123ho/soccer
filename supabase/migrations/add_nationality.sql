-- Add nationality column to players table
ALTER TABLE players ADD COLUMN nationality TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN players.nationality IS 'ISO 3166-1 alpha-2 country code (e.g., US, GB, FR)';
