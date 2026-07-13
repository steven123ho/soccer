-- Allow authenticated users to vote for MOTM
DROP POLICY IF EXISTS "Authenticated users can vote for MOTM" ON motm_votes;

CREATE POLICY "Authenticated users can vote for MOTM"
  ON motm_votes FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
