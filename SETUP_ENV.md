# Environment Setup Guide

This guide shows you how to create the `.env.local` files needed for the project.

## Quick Setup

Run these commands to create all `.env.local` files from the examples:

### On Windows (PowerShell):
```powershell
# API
Copy-Item apps\api\.env.example apps\api\.env.local

# Frontend
Copy-Item apps\frontend\.env.example apps\frontend\.env.local

# Automation
Copy-Item scripts\automation\.env.example scripts\automation\.env.local
```

### On Mac/Linux:
```bash
# API
cp apps/api/.env.example apps/api/.env.local

# Frontend
cp apps/frontend/.env.example apps/frontend/.env.local

# Automation
cp scripts/automation/.env.example scripts/automation/.env.local
```

## Manual Setup

### 1. API Environment (`apps/api/.env.local`)

Create `apps/api/.env.local` with:
```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

**Required:** None (all have defaults)  
**Optional:** Database URL, JWT secret for future features

### 2. Frontend Environment (`apps/frontend/.env.local`)

Create `apps/frontend/.env.local` with:
```env
VITE_API_URL=http://localhost:3001
```

**Required:** None (defaults to `http://localhost:3001`)  
**Change if:** API runs on different port

### 3. Automation Environment (`scripts/automation/.env.local`)

Create `scripts/automation/.env.local` with minimum:
```env
API_URL=http://localhost:3001
```

**For full functionality, add:**
```env
# Google Search (optional - has fallback)
GOOGLE_API_KEY=your-google-api-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id

# LLM (required for article improvement)
OPENAI_API_KEY=your-openai-key
LLM_PROVIDER=openai

# Or use Anthropic:
# ANTHROPIC_API_KEY=your-anthropic-key
# LLM_PROVIDER=anthropic
```

## Getting API Keys

### Google Custom Search API (Optional)

See [docs/GOOGLE_API_SETUP.md](docs/GOOGLE_API_SETUP.md) for detailed step-by-step instructions.

**Quick summary:**
1. Create a Google Cloud project
2. Enable Custom Search API
3. Create an API key
4. Create a Custom Search Engine
5. Get your Search Engine ID

**Note:** Free tier allows 100 queries/day. See the detailed guide for troubleshooting and best practices.

### OpenAI API Key (Required for LLM)

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create new secret key
5. Copy the key (shown only once)

**Note:** Requires billing setup, pay-as-you-go pricing

### Anthropic API Key (Alternative to OpenAI)

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys
4. Create new key
5. Copy the key

## Minimal Setup (No API Keys)

You can run the project with minimal configuration:

**API:** Works with defaults (no `.env.local` needed)  
**Frontend:** Works with defaults (no `.env.local` needed)  
**Automation:** Needs at least `API_URL=http://localhost:3001`

**Limitations without API keys:**
- Google search uses web scraping fallback (less reliable)
- LLM features won't work (article improvement disabled)

## Verifying Setup

After creating `.env.local` files:

1. **Check API:**
   ```bash
   cd apps/api
   npm start
   # Should show: 🚀 API server running on http://localhost:3001
   ```

2. **Check Frontend:**
   ```bash
   cd apps/frontend
   npm run dev
   # Should show: Local: http://localhost:3000
   ```

3. **Check Automation:**
   ```bash
   cd scripts/automation
   node -e "console.log(process.env.API_URL || 'Not set')"
   # Should show: http://localhost:3001
   ```

## Troubleshooting

### Environment Variables Not Loading

- Ensure file is named exactly `.env.local` (not `.env.local.txt`)
- Check file is in correct directory
- Restart the service after creating/editing `.env.local`

### API Keys Not Working

- Verify keys are correct (no extra spaces)
- Check API key permissions/quotas
- Verify provider setting matches key type (openai vs anthropic)

### Port Conflicts

If ports 3000 or 3001 are in use:

1. Change API port in `apps/api/.env.local`:
   ```env
   PORT=3002
   ```

2. Update frontend in `apps/frontend/.env.local`:
   ```env
   VITE_API_URL=http://localhost:3002
   ```

3. Update automation in `scripts/automation/.env.local`:
   ```env
   API_URL=http://localhost:3002
   ```

## Security Notes

- `.env.local` files are gitignored (never commit them)
- Never share API keys publicly
- Rotate keys if accidentally exposed
- Use different keys for development/production

