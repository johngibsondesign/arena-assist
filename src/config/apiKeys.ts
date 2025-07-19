// 🔑 Centralized API Key Configuration
// Keys are loaded from environment variables for security

export const apiKeys = {
  // 🎮 Riot Games API (Required)
  // Get from: https://developer.riotgames.com/
  RIOT_API_KEY: import.meta.env.VITE_RIOT_API_KEY || '',
  
  // 🤖 OpenAI API (Optional - Premium Features)
  // Get from: https://platform.openai.com/api-keys
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
  
  // 📡 Supabase (Optional - Enhanced Voice Chat)
  // Get from: https://supabase.com/dashboard
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
  SUPABASE_KEY: import.meta.env.VITE_SUPABASE_KEY || '',
  
  // 🌍 Default Region for Riot API
  DEFAULT_REGION: import.meta.env.VITE_DEFAULT_REGION || 'euw1',
};

// 🔒 Security Note:
// These keys will be visible to anyone with access to your codebase.
// Only use this approach for:
// - Team/internal projects
// - Development/testing environments
// - When you want shared keys across all users
//
// For production apps, use the Settings UI instead! 