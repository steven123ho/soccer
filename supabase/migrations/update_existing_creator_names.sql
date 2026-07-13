-- Update existing generated_cards creator_name to use the player's chosen name
UPDATE generated_cards
SET creator_name = (
  SELECT name
  FROM players
  WHERE players.user_id = generated_cards.creator_id
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1
  FROM players
  WHERE players.user_id = generated_cards.creator_id
);
