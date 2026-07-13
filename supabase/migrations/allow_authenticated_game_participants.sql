-- Allow authenticated users to manage game participants for team picking
DROP POLICY IF EXISTS "Authenticated users can manage game participants" ON game_participants;

CREATE POLICY "Authenticated users can manage game participants"
  ON game_participants FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
