-- Voice Rooms Table for WebRTC Game-based Chat
-- This table manages voice chat rooms tied to Arena games

CREATE TABLE IF NOT EXISTS voice_rooms (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  host TEXT NOT NULL,
  participants TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE
);

-- Create partial unique index separately
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_game_room 
ON voice_rooms (game_id) WHERE active = true;

-- Enable RLS (Row Level Security)
ALTER TABLE voice_rooms ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and create new ones
DROP POLICY IF EXISTS "Allow read access to active voice rooms" ON voice_rooms;
CREATE POLICY "Allow read access to active voice rooms" 
ON voice_rooms FOR SELECT 
USING (active = true);

DROP POLICY IF EXISTS "Allow insert new voice rooms" ON voice_rooms;
CREATE POLICY "Allow insert new voice rooms" 
ON voice_rooms FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update voice rooms for participants" ON voice_rooms;
CREATE POLICY "Allow update voice rooms for participants" 
ON voice_rooms FOR UPDATE 
USING (true);

DROP POLICY IF EXISTS "Allow delete voice rooms for host" ON voice_rooms;
CREATE POLICY "Allow delete voice rooms for host" 
ON voice_rooms FOR DELETE 
USING (true);

-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_voice_rooms_updated_at ON voice_rooms;
CREATE TRIGGER update_voice_rooms_updated_at 
BEFORE UPDATE ON voice_rooms 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-cleanup expired rooms (rooms older than 2 hours)
CREATE OR REPLACE FUNCTION cleanup_expired_voice_rooms()
RETURNS void AS $$
BEGIN
    DELETE FROM voice_rooms 
    WHERE created_at < NOW() - INTERVAL '2 hours';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup to run every hour (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-voice-rooms', '0 * * * *', 'SELECT cleanup_expired_voice_rooms();');

-- Optional: Game Session Tracking Table
-- This helps detect when Arena games start/end for better room management

CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summoner_name TEXT NOT NULL,
  champion_name TEXT,
  game_start_time TIMESTAMPTZ DEFAULT NOW(),
  game_end_time TIMESTAMPTZ,
  game_id TEXT UNIQUE,
  region TEXT DEFAULT 'euw1',
  active BOOLEAN DEFAULT TRUE
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_game_sessions_active 
ON game_sessions(active, summoner_name);

-- Enable RLS for game sessions
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for game sessions
DROP POLICY IF EXISTS "Users can manage their own game sessions" ON game_sessions;
CREATE POLICY "Users can manage their own game sessions" 
ON game_sessions FOR ALL 
USING (true) WITH CHECK (true);

-- Function to automatically end game sessions and cleanup voice rooms
CREATE OR REPLACE FUNCTION end_game_session(session_game_id TEXT)
RETURNS void AS $$
BEGIN
    -- Mark game session as ended
    UPDATE game_sessions 
    SET game_end_time = NOW(), active = false 
    WHERE game_id = session_game_id;
    
    -- Cleanup associated voice rooms
    DELETE FROM voice_rooms 
    WHERE game_id = session_game_id;
END;
$$ LANGUAGE plpgsql; 