-- Duo Queue Stats Table for Arena Assist
-- This table stores duo queue tier list data for champion pairs

CREATE TABLE IF NOT EXISTS arena_duo_queue_stats (
    id SERIAL PRIMARY KEY,
    champion_1_id VARCHAR(50) NOT NULL,
    champion_2_id VARCHAR(50) NOT NULL,
    tier_rank VARCHAR(1) NOT NULL CHECK (tier_rank IN ('S', 'A', 'B', 'C', 'D')),
    tier_position INTEGER NOT NULL DEFAULT 1,
    score DECIMAL(5,2), -- Overall performance score
    win_rate DECIMAL(5,2) NOT NULL, -- Win percentage (0.00-100.00)
    top_2_rate DECIMAL(5,2) NOT NULL, -- Top 2 placement percentage
    avg_placement DECIMAL(3,2) NOT NULL, -- Average placement (1.00-8.00)
    pick_rate DECIMAL(5,2) NOT NULL, -- Pick rate percentage
    synergy_description TEXT, -- Description of champion synergy
    strengths TEXT, -- What makes this duo strong
    weaknesses TEXT, -- What this duo struggles with
    playstyle_notes TEXT, -- How to play this duo effectively
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(champion_1_id, champion_2_id),
    UNIQUE(tier_rank, tier_position),
    CHECK(champion_1_id != champion_2_id), -- Prevent same champion pairs
    CHECK(win_rate >= 0 AND win_rate <= 100),
    CHECK(top_2_rate >= 0 AND top_2_rate <= 100),
    CHECK(avg_placement >= 1.00 AND avg_placement <= 8.00),
    CHECK(pick_rate >= 0 AND pick_rate <= 100)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_duo_stats_champion_1 ON arena_duo_queue_stats(champion_1_id);
CREATE INDEX IF NOT EXISTS idx_duo_stats_champion_2 ON arena_duo_queue_stats(champion_2_id);
CREATE INDEX IF NOT EXISTS idx_duo_stats_tier_rank ON arena_duo_queue_stats(tier_rank);
CREATE INDEX IF NOT EXISTS idx_duo_stats_score ON arena_duo_queue_stats(score DESC);
CREATE INDEX IF NOT EXISTS idx_duo_stats_win_rate ON arena_duo_queue_stats(win_rate DESC);
CREATE INDEX IF NOT EXISTS idx_duo_stats_champions ON arena_duo_queue_stats(champion_1_id, champion_2_id);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_duo_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_duo_stats_updated_at
    BEFORE UPDATE ON arena_duo_queue_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_duo_stats_updated_at();

-- Sample data for testing (based on common Arena duos)
INSERT INTO arena_duo_queue_stats (
    champion_1_id, champion_2_id, tier_rank, tier_position, score, 
    win_rate, top_2_rate, avg_placement, pick_rate, 
    synergy_description, strengths, weaknesses, playstyle_notes
) VALUES
('Jinx', 'Lulu', 'S', 1, 92.5, 67.8, 85.2, 2.1, 12.4, 
 'Hyper-carry protection duo with massive scaling potential', 
 'Incredible late game scaling, strong peel, consistent damage output',
 'Vulnerable early game, requires farm priority, weak to dive comps',
 'Focus on farming early, let Lulu peel and buff Jinx, play for late game teamfights'),

('Yasuo', 'Malphite', 'S', 2, 91.2, 65.4, 83.7, 2.3, 15.8,
 'Wombo combo duo with massive AoE teamfight potential',
 'Game-changing ultimate combo, strong engage, high burst damage',
 'Requires coordination, vulnerable if combo fails, telegraphed engage',
 'Look for multi-man Malphite ults into Yasuo follow-up, control vision for picks'),

('Vayne', 'Taric', 'A', 1, 88.7, 62.9, 80.1, 2.5, 9.2,
 'Tank-shredding duo with invulnerability and sustained damage',
 'True damage, invulnerability ultimate, strong 2v2 potential',
 'Weak early game, short range, requires proper positioning',
 'Play safe early, look for isolated 2v2 fights, use Taric ult to dive backline'),

('Katarina', 'Amumu', 'A', 2, 87.3, 61.5, 78.9, 2.7, 8.6,
 'AoE reset duo with chain CC and massive teamfight damage',
 'Multiple resets, AoE CC chain, high burst damage',
 'Vulnerable to poke, requires good engagement timing, squishy',
 'Wait for Amumu engage, follow up with Katarina resets, focus backline targets'),

('Jhin', 'Shen', 'B', 1, 84.1, 58.7, 75.3, 3.1, 11.7,
 'Global presence duo with pick potential and map control',
 'Global ultimates, good pick potential, strong utility',
 'Lower sustained damage, requires coordination, vulnerable to dive',
 'Use global ults for picks and rotations, focus on map control and utility')

ON CONFLICT (champion_1_id, champion_2_id) DO NOTHING;

-- View for easier querying with both champion orders
CREATE OR REPLACE VIEW arena_duo_queue_pairs AS
SELECT 
    id,
    champion_1_id,
    champion_2_id,
    tier_rank,
    tier_position,
    score,
    win_rate,
    top_2_rate,
    avg_placement,
    pick_rate,
    synergy_description,
    strengths,
    weaknesses,
    playstyle_notes,
    updated_at
FROM arena_duo_queue_stats
UNION ALL
SELECT 
    id,
    champion_2_id as champion_1_id,
    champion_1_id as champion_2_id,
    tier_rank,
    tier_position,
    score,
    win_rate,
    top_2_rate,
    avg_placement,
    pick_rate,
    synergy_description,
    strengths,
    weaknesses,
    playstyle_notes,
    updated_at
FROM arena_duo_queue_stats;

-- Comments explaining the schema
COMMENT ON TABLE arena_duo_queue_stats IS 'Stores tier list rankings and statistics for champion duos in Arena mode';
COMMENT ON COLUMN arena_duo_queue_stats.champion_1_id IS 'First champion in the duo (alphabetically first)';
COMMENT ON COLUMN arena_duo_queue_stats.champion_2_id IS 'Second champion in the duo (alphabetically second)';
COMMENT ON COLUMN arena_duo_queue_stats.tier_rank IS 'Tier ranking: S=Best, A=Great, B=Good, C=Average, D=Poor';
COMMENT ON COLUMN arena_duo_queue_stats.tier_position IS 'Position within the tier (1=highest in tier)';
COMMENT ON COLUMN arena_duo_queue_stats.score IS 'Overall performance score (0-100)';
COMMENT ON COLUMN arena_duo_queue_stats.win_rate IS 'Win percentage (0.00-100.00)';
COMMENT ON COLUMN arena_duo_queue_stats.top_2_rate IS 'Top 2 placement percentage (0.00-100.00)';
COMMENT ON COLUMN arena_duo_queue_stats.avg_placement IS 'Average placement (1.00-8.00, lower is better)';
COMMENT ON COLUMN arena_duo_queue_stats.pick_rate IS 'Pick rate percentage (0.00-100.00)';
COMMENT ON COLUMN arena_duo_queue_stats.synergy_description IS 'Brief description of why these champions work well together';
COMMENT ON COLUMN arena_duo_queue_stats.strengths IS 'What makes this duo combination strong';
COMMENT ON COLUMN arena_duo_queue_stats.weaknesses IS 'What this duo struggles against or lacks';
COMMENT ON COLUMN arena_duo_queue_stats.playstyle_notes IS 'Strategic notes on how to play this duo effectively';
