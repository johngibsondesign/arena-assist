-- Prismatic Items Table for Arena Assist
-- This table stores tier list data for prismatic items per champion

CREATE TABLE IF NOT EXISTS arena_prismatic_items (
    id SERIAL PRIMARY KEY,
    champion_id VARCHAR(50) NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    image_url TEXT,
    tier_rank VARCHAR(1) NOT NULL CHECK (tier_rank IN ('S', 'A', 'B', 'C', 'D')),
    tier_position INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    effect_summary TEXT,
    usage_notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(champion_id, item_name),
    UNIQUE(champion_id, tier_rank, tier_position)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_prismatic_items_champion_id ON arena_prismatic_items(champion_id);
CREATE INDEX IF NOT EXISTS idx_prismatic_items_tier_rank ON arena_prismatic_items(tier_rank);
CREATE INDEX IF NOT EXISTS idx_prismatic_items_champion_tier ON arena_prismatic_items(champion_id, tier_rank);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_prismatic_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_prismatic_items_updated_at
    BEFORE UPDATE ON arena_prismatic_items
    FOR EACH ROW
    EXECUTE FUNCTION update_prismatic_items_updated_at();

-- Sample data for testing (you can remove this after setting up)
INSERT INTO arena_prismatic_items (champion_id, item_name, image_url, tier_rank, tier_position, description, effect_summary, usage_notes) VALUES
('Jinx', 'Deathblade', 'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/6673.png', 'S', 1, 'Legendary sword that grows stronger with takedowns', 'Gains AD permanently on takedown', 'Essential for carry potential'),
('Jinx', 'Infinity Edge', 'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/6673.png', 'S', 2, 'Massive critical strike damage boost', 'Increases crit damage significantly', 'Core item for crit builds'),
('Jinx', 'Runaans Hurricane', 'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/6673.png', 'A', 1, 'Allows attacks to hit multiple enemies', 'Bolts hit additional targets', 'Great for teamfight damage'),
('Jinx', 'Bloodthirster', 'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/6673.png', 'A', 2, 'Provides sustain and shield', 'Lifesteal and damage shield', 'Good for survivability'),
('Jinx', 'Lord Dominiks Regards', 'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/6673.png', 'B', 1, 'Armor penetration for tanks', 'Cuts through enemy armor', 'Situational vs tanky teams')
ON CONFLICT (champion_id, item_name) DO NOTHING;

-- Comments explaining the schema
COMMENT ON TABLE arena_prismatic_items IS 'Stores tier list rankings of prismatic items for each champion in Arena mode';
COMMENT ON COLUMN arena_prismatic_items.champion_id IS 'League champion identifier (e.g., "Jinx", "Yasuo")';
COMMENT ON COLUMN arena_prismatic_items.item_name IS 'Name of the prismatic item';
COMMENT ON COLUMN arena_prismatic_items.image_url IS 'URL to the item image from Riot CDN';
COMMENT ON COLUMN arena_prismatic_items.tier_rank IS 'Tier ranking: S=Best, A=Great, B=Good, C=Average, D=Poor';
COMMENT ON COLUMN arena_prismatic_items.tier_position IS 'Position within the tier (1=highest, 2=second, etc.)';
COMMENT ON COLUMN arena_prismatic_items.description IS 'Full description of the item';
COMMENT ON COLUMN arena_prismatic_items.effect_summary IS 'Brief summary of item effect';
COMMENT ON COLUMN arena_prismatic_items.usage_notes IS 'Notes on when/how to use this item';
