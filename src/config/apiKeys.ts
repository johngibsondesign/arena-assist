// 🔑 Centralized API Key Configuration
// Replace these with your actual API keys for shared team usage

export const apiKeys = {
  // 🎮 Riot Games API (Required)
  // Get from: https://developer.riotgames.com/
  RIOT_API_KEY: 'RGAPI-007741b9-6561-425c-ac75-a412e9de9e7b',
  // 🤖 OpenAI API (Optional - Premium Features)
  // Get from: https://platform.openai.com/api-keys
  OPENAI_API_KEY: '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',
  
  // 📡 Supabase (Optional - Enhanced Voice Chat)
  // Get from: https://supabase.com/dashboard
  SUPABASE_URL: 'https://txnrcfwepaiwxyovcsvz.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4bnJjZndlcGFpd3h5b3Zjc3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MjQyMzksImV4cCI6MjA2ODUwMDIzOX0.GBsybFez8S_hKsrW9P5jHvrEwU3E87LV1tk-yvYu2BU',
  
  // 🌍 Default Region for Riot API
  DEFAULT_REGION: 'euw1', // Change to your region: na1, euw1, kr, etc.
};

// 🔒 Security Note:
// These keys will be visible to anyone with access to your codebase.
// Only use this approach for:
// - Team/internal projects
// - Development/testing environments
// - When you want shared keys across all users
//
// For production apps, use the Settings UI instead! 