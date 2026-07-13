-- Fix generated card rating trigger to use generated_card_id instead of id
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
  WHERE generated_card_id = NEW.generated_card_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix generated card rating RPC to use generated_card_id instead of id
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
  WHERE generated_card_id = card_id;
  
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
    WHERE generated_card_id = card_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
