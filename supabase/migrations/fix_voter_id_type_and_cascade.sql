-- Drop all policies that depend on voter_id
DROP POLICY IF EXISTS "Users cannot vote on themselves" ON stat_votes;
DROP POLICY IF EXISTS "Users can update their own stat votes" ON stat_votes;
DROP POLICY IF EXISTS "Users can vote on any player" ON stat_votes;
DROP POLICY IF EXISTS "Authenticated users can create poll votes" ON poll_votes;

-- Convert voter_id from text to UUID
ALTER TABLE stat_votes 
ALTER COLUMN voter_id TYPE UUID USING voter_id::UUID;

ALTER TABLE poll_votes 
ALTER COLUMN voter_id TYPE UUID USING voter_id::UUID;

-- Add foreign key constraints with cascade delete
ALTER TABLE stat_votes 
ADD CONSTRAINT stat_votes_voter_id_fkey 
FOREIGN KEY (voter_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE poll_votes 
ADD CONSTRAINT poll_votes_voter_id_fkey 
FOREIGN KEY (voter_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Recreate policies with UUID type
CREATE POLICY "Users cannot vote on themselves"
    ON stat_votes FOR INSERT
    WITH CHECK (
        auth.uid() = voter_id AND 
        voter_id != (SELECT user_id FROM players WHERE id = player_id)
    );

CREATE POLICY "Users can update their own stat votes"
    ON stat_votes FOR UPDATE
    USING (auth.uid() = voter_id);

CREATE POLICY "Users can vote on any player"
    ON stat_votes FOR INSERT
    WITH CHECK (auth.uid() = voter_id);

CREATE POLICY "Authenticated users can create poll votes"
    ON poll_votes FOR INSERT
    WITH CHECK (auth.uid() = voter_id);
