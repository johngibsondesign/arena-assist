# 🔐 API Key Setup Guide

Arena Assist uses environment variables to keep your API keys secure. Here's how to set them up:

## 🏃 Quick Setup (Local Development)

1. **Copy the example file:**
   ```bash
   copy .env.example .env.local
   ```

2. **Edit `.env.local` with your actual API keys:**
   ```env
   VITE_RIOT_API_KEY=RGAPI-your-actual-key-here
   VITE_OPENAI_API_KEY=sk-proj-your-actual-key-here
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_KEY=your-supabase-anon-key-here
   VITE_DEFAULT_REGION=euw1
   ```

3. **Restart the app** - Environment variables are loaded at build time

## 🔑 Getting API Keys

### Riot Games API (Required)
1. Go to [Riot Developer Portal](https://developer.riotgames.com/)
2. Sign in with your Riot account
3. Generate a new API key
4. Copy the key to `VITE_RIOT_API_KEY`

### OpenAI API (Optional)
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new secret key
3. Copy the key to `VITE_OPENAI_API_KEY`

### Supabase (Optional)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or use existing
3. Go to Settings > API
4. Copy the URL to `VITE_SUPABASE_URL`
5. Copy the anon public key to `VITE_SUPABASE_KEY`

## 🚀 GitHub Actions Setup

If you're building releases, add these secrets to your GitHub repository:

1. Go to your repo Settings > Secrets and variables > Actions
2. Add these secrets:
   - `RIOT_API_KEY` - Your Riot Games API key
   - `OPENAI_API_KEY` - Your OpenAI API key (optional)
   - `SUPABASE_URL` - Your Supabase project URL (optional)
   - `SUPABASE_KEY` - Your Supabase anon key (optional)  
   - `DEFAULT_REGION` - Your preferred Riot API region (e.g., "euw1")

## ⚠️ Security Notes

- **Never commit** `.env.local` or any file containing real API keys
- **Use environment variables** for all sensitive data
- **Rotate keys regularly** if they become compromised
- **Use different keys** for development and production

## 🛠️ Troubleshooting

### "API key not found" errors
- Make sure `.env.local` exists and has the correct variable names
- Restart the development server after changing environment variables
- Check that variable names start with `VITE_` (required for Vite)

### Build fails with missing secrets
- Ensure all required GitHub secrets are set in repository settings
- Check that secret names match the workflow file exactly
