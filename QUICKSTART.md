# Quick Start Guide

## Prerequisites

- Node.js 18+ and npm installed
- (Optional) Google Custom Search API credentials
- (Optional) OpenAI or Anthropic API key for LLM features

## Quick Environment Setup

**Option 1: Use the setup script (Recommended)**
```bash
node setup-env.js
```
This will create all `.env.local` files with default values.

**Option 2: Manual setup**
See [SETUP_ENV.md](SETUP_ENV.md) for detailed instructions.

## Running the Project

### Option 1: Run All Services (Recommended)

Open **3 separate terminal windows** and run each service:

#### Terminal 1: Start the API
```bash
cd apps/api
npm install
npm start
```
API will run on `http://localhost:3001`

#### Terminal 2: Start the Frontend
```bash
cd apps/frontend
npm install
npm run dev
```
Frontend will run on `http://localhost:3000`

#### Terminal 3: Run Automation (when needed)
```bash
cd scripts/automation
npm install
npm run update
```

### Option 2: Step-by-Step Setup

#### 1. Set Up the API

```bash
# Navigate to API directory
cd apps/api

# Install dependencies
npm install

# Create environment file
# On Windows (PowerShell):
New-Item -Path .env.local -ItemType File
# On Mac/Linux:
touch .env.local

# Add to .env.local:
# PORT=3001
# NODE_ENV=development
# CORS_ORIGIN=http://localhost:3000

# Start the API
npm start
```

Verify API is running: Open `http://localhost:3001/health` in your browser.

#### 2. Set Up the Frontend

```bash
# Open a new terminal
cd apps/frontend

# Install dependencies
npm install

# Create environment file
# On Windows (PowerShell):
New-Item -Path .env.local -ItemType File
# On Mac/Linux:
touch .env.local

# Add to .env.local:
# VITE_API_URL=http://localhost:3001

# Start the frontend
npm run dev
```

Verify frontend is running: Open `http://localhost:3000` in your browser.

#### 3. Set Up Automation Scripts (Optional)

```bash
# Open a new terminal
cd scripts/automation

# Install dependencies
npm install

# Create environment file
# On Windows (PowerShell):
New-Item -Path .env.local -ItemType File
# On Mac/Linux:
touch .env.local

# Add to .env.local (minimum required):
# API_URL=http://localhost:3001

# For full functionality, also add:
# GOOGLE_API_KEY=your-key
# GOOGLE_SEARCH_ENGINE_ID=your-id
# OPENAI_API_KEY=your-key
# LLM_PROVIDER=openai
```

## Running the Automation Pipeline

Once the API is running, you can execute the automation pipeline:

```bash
cd scripts/automation

# Scrape articles from BeyondChats
npm run scrape

# Run the full update pipeline (scrape → search → improve → store)
npm run update

# Or update a specific article by ID
node src/index.js update <articleId>
```

## Testing the System

### 1. Test the API

```bash
# In a new terminal
curl http://localhost:3001/health
# Should return: {"success":true,"message":"API is running",...}
```

### 2. Test the Frontend

1. Open `http://localhost:3000` in your browser
2. You should see the article list (empty if no articles yet)

### 3. Populate with Data

```bash
cd scripts/automation
npm run update
```

This will:
- Scrape 5 oldest articles from BeyondChats
- Find reference articles via Google
- Improve them with LLM
- Store them in the API

### 4. View in Frontend

Refresh `http://localhost:3000` to see the articles.

## Common Commands

### API
```bash
cd apps/api
npm start          # Start server
npm run dev        # Start with auto-reload (if configured)
```

### Frontend
```bash
cd apps/frontend
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
```

### Automation
```bash
cd scripts/automation
npm run scrape     # Scrape articles
npm run search "Title"  # Search Google
npm run extract "URL"   # Extract content
npm run update     # Full pipeline
```

## Troubleshooting

### Port Already in Use

If port 3001 is taken:
```bash
# Change API port in apps/api/.env.local
PORT=3002

# Update frontend to match in apps/frontend/.env.local
VITE_API_URL=http://localhost:3002
```

If port 3000 is taken, Vite will automatically use the next available port.

### API Not Responding

1. Check API is running: `curl http://localhost:3001/health`
2. Check CORS settings in `apps/api/.env.local`
3. Verify frontend `VITE_API_URL` matches API URL

### Automation Errors

**Google Search failing:**
- System will fall back to web scraping if API credentials missing
- Add credentials to `scripts/automation/.env.local` for better results

**LLM errors:**
- Verify API key is correct
- Check `LLM_PROVIDER` matches your key type
- Ensure API has sufficient credits/quota

**API connection errors:**
- Ensure API is running on the correct port
- Check `API_URL` in automation `.env.local` matches API port

## What to Expect

### First Run

1. **API starts** - Shows: `🚀 API server running on http://localhost:3001`
2. **Frontend starts** - Shows: `Local: http://localhost:3000`
3. **Automation runs** - Shows progress for each article:
   - Scraping articles
   - Searching for references
   - Extracting content
   - Improving with LLM
   - Storing in API

### Typical Output

```
=== Starting Article Update Pipeline ===
API URL: http://localhost:3001
Processing 5 oldest articles
Step 1: Scraping oldest articles from BeyondChats...
Found 5 article(s) to process
Step 2: Ensuring articles exist in API...
Step 3: Processing update for article ID 1...
Searching for 2 reference articles...
Improving article with LLM...
Saving improved article to API...
Successfully created article update (ID: 2)

=== Processing Complete ===
Total: 5
Successful: 4
Skipped: 1
Failed: 0
```

## Next Steps

1. **View Articles:** Open `http://localhost:3000`
2. **Filter Articles:** Use the filter buttons (All, Original, Updated)
3. **View Details:** Click any article to see full content
4. **Compare Versions:** Use tabs to switch between original and updated content

## Development Workflow

1. **Make changes to code**
2. **API:** Restart with `npm start` (or use auto-reload if configured)
3. **Frontend:** Auto-reloads on save (Vite hot reload)
4. **Automation:** Re-run `npm run update` to test changes

---

**Note:** The API uses in-memory storage, so data is lost when the API restarts. For persistent storage, see the README section on adding a database.

