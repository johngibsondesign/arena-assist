# 🎤 WebRTC Voice Chat Setup Guide

Arena Assist now includes **peer-to-peer WebRTC voice chat** that automatically connects you with Arena teammates!

## ✨ Features

- **🎮 Game-based rooms**: Unique voice rooms for each Arena match
- **🤝 Auto-teammate detection**: Automatically finds teammates with Arena Assist
- **⚡ WebRTC P2P**: Low-latency peer-to-peer audio connection
- **🔒 Automatic cleanup**: Rooms deleted when games end
- **🎛️ Audio controls**: Microphone gain, speaker volume, mute/unmute

## 📋 Database Setup

### 1. Run Database Schema

Execute the SQL commands from `src/services/voiceRoomSchema.sql` in your Supabase database:

```bash
# In Supabase Dashboard > SQL Editor, run:
```

```sql
-- Voice Rooms Table
CREATE TABLE IF NOT EXISTS voice_rooms (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  host TEXT NOT NULL,
  participants TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE,
  UNIQUE(game_id, active) WHERE active = true
);

-- Game Sessions Table  
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

-- Auto-cleanup function
CREATE OR REPLACE FUNCTION end_game_session(session_game_id TEXT)
RETURNS void AS $$
BEGIN
    UPDATE game_sessions 
    SET game_end_time = NOW(), active = false 
    WHERE game_id = session_game_id;
    
    DELETE FROM voice_rooms 
    WHERE game_id = session_game_id;
END;
$$ LANGUAGE plpgsql;
```

### 2. Enable Row Level Security

The schema includes RLS policies that allow:
- ✅ Reading all active voice rooms
- ✅ Creating new voice rooms
- ✅ Updating rooms you participate in
- ✅ Deleting rooms you host

## 🎮 How It Works

### Automatic Flow

1. **Game Detection**: Arena Assist detects when you start an Arena match
2. **Room Creation**: Creates unique voice room with game ID
3. **Teammate Discovery**: Finds teammates also running Arena Assist  
4. **WebRTC Connection**: Establishes peer-to-peer audio connection
5. **Auto Cleanup**: Deletes room when game ends

### Manual Usage

You can also manually join voice chat:

1. Go to **Voice Chat** tab
2. Click **"Join Voice Chat"** 
3. Invite teammates by sharing room code
4. Enjoy crystal-clear voice communication!

## ⚙️ Configuration

### Voice Settings

- **🎤 Microphone Gain**: Adjust input sensitivity (0-100%)
- **🔊 Speaker Volume**: Control output volume (0-100%)  
- **🔄 Auto-join**: Automatically join when Arena games start
- **🎧 Test Microphone**: Verify your mic is working

### Audio Quality

- **Codec**: Opus (high-quality, low-latency)
- **Bitrate**: 64 kbps
- **Features**: Echo cancellation, noise suppression, auto-gain
- **Connection**: Direct peer-to-peer (no servers)

## 🔧 Troubleshooting

### Common Issues

**Voice chat not connecting?**
- ✅ Check microphone permissions in browser
- ✅ Ensure both players have Arena Assist running
- ✅ Verify Supabase connection in settings
- ✅ Check if you're in the same Arena game

**No teammates detected?**
- ✅ Make sure auto-join is enabled
- ✅ Both players need to start Arena match
- ✅ Check that game detection is working (summoner name shown)

**Poor audio quality?**
- ✅ Adjust microphone gain (try 70-80%)
- ✅ Check internet connection stability
- ✅ Test microphone in Voice settings

### Browser Requirements

**Supported Browsers:**
- ✅ Chrome/Chromium (recommended)
- ✅ Firefox
- ✅ Edge
- ❌ Safari (limited WebRTC support)

**Required Permissions:**
- 🎤 Microphone access
- 🌐 Network access for WebRTC

## 🛡️ Privacy & Security

- **🔒 Peer-to-peer**: Audio never goes through external servers
- **⏰ Temporary**: Voice rooms automatically deleted after games
- **🎯 Local**: All audio processing happens on your device
- **🚫 No recording**: Audio is not stored anywhere

## 🆘 Support

Having issues? Check:

1. **Console logs**: Press F12 → Console for error messages
2. **Network status**: Ensure stable internet connection  
3. **Microphone test**: Use the built-in test feature
4. **Game detection**: Verify summoner name appears in app

**Database Issues:**
- Make sure you've run the SQL schema in Supabase
- Check that RLS policies are properly configured
- Verify API keys are correct in `src/config/apiKeys.ts`

---

**🎉 Ready to dominate Arena with seamless team communication!** 

*Voice chat works best when both teammates have Arena Assist installed and running.* 