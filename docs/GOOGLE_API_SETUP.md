# Google Custom Search API Setup Guide

This guide walks you through setting up Google Custom Search API to enable reference article discovery in the automation pipeline.

## Overview

Google Custom Search API allows you to programmatically search Google and retrieve results. The free tier provides 100 queries per day, which is sufficient for development and testing.

## Step-by-Step Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click the project dropdown at the top
4. Click **"New Project"**
5. Enter a project name (e.g., "Article Update Platform")
6. Click **"Create"**
7. Wait for the project to be created, then select it from the dropdown

### Step 2: Enable Custom Search API

1. In the Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"Custom Search API"**
3. Click on **"Custom Search API"**
4. Click **"Enable"**
5. Wait for the API to be enabled (usually takes a few seconds)

### Step 3: Create API Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"API Key"**
4. Your API key will be created and displayed
5. **Copy the API key** - you'll need it for your `.env.local` file
6. (Optional) Click **"Restrict Key"** to limit usage:
   - Under "API restrictions", select "Restrict key"
   - Choose "Custom Search API"
   - Click "Save"

### Step 4: Create a Custom Search Engine

1. Go to [Google Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click **"Add"** or **"Create a custom search engine"**
3. Fill in the form:
   - **Sites to search**: Enter `*` (asterisk) to search the entire web
   - **Name of the search engine**: Enter any name (e.g., "Article Reference Search")
   - **Language**: Select your preferred language
4. Click **"Create"**
5. Click **"Control Panel"** (or go to [CSE Control Panel](https://programmablesearchengine.google.com/cse/all))
6. Click on your search engine
7. Under **"Setup"** → **"Basics"**, find **"Search engine ID"**
8. **Copy the Search Engine ID** - you'll need it for your `.env.local` file

### Step 5: Configure Search Engine (Optional but Recommended)

1. In the Search Engine Control Panel, go to **"Setup"** → **"Basics"**
2. Under **"Sites to search"**, you can:
   - Keep `*` to search the entire web (recommended for finding reference articles)
   - Or specify domains if you want to limit searches
3. Under **"Advanced"** → **"WebSearch Settings"**:
   - Enable **"Search the entire web"** if you want broader results
4. Click **"Save"**

### Step 6: Add Credentials to Your Project

1. Open `scripts/automation/.env.local` in your project
2. Replace the placeholder values:

```env
GOOGLE_API_KEY=your-actual-api-key-here
GOOGLE_SEARCH_ENGINE_ID=your-actual-search-engine-id-here
```

**Example:**
```env
GOOGLE_API_KEY=AIzaSyB1234567890abcdefghijklmnopqrstuvw
GOOGLE_SEARCH_ENGINE_ID=012345678901234567890:abcdefghijk
```

3. Save the file

## Verifying Your Setup

### Test the API Key

You can test your API key using curl or a browser:

```bash
# Replace YOUR_API_KEY and YOUR_SEARCH_ENGINE_ID with your actual values
curl "https://www.googleapis.com/customsearch/v1?key=YOUR_API_KEY&cx=YOUR_SEARCH_ENGINE_ID&q=test"
```

Or visit this URL in your browser (replace the values):
```
https://www.googleapis.com/customsearch/v1?key=YOUR_API_KEY&cx=YOUR_SEARCH_ENGINE_ID&q=test
```

You should see JSON results if everything is configured correctly.

### Test in the Project

1. Make sure your `.env.local` file has the correct values
2. Run the automation script:
   ```bash
   cd scripts/automation
   npm run search "Getting Started with Node.js"
   ```
3. If configured correctly, you should see search results

## Troubleshooting

### "API key not valid" Error

- Verify you copied the entire API key (no spaces or extra characters)
- Check that Custom Search API is enabled in your Google Cloud project
- Ensure the API key isn't restricted to a different API

### "Search engine ID not found" Error

- Verify you copied the entire Search Engine ID
- Check that the search engine exists in your Programmable Search Engine dashboard
- Ensure the search engine is set to search the entire web (not just specific sites)

### "Quota exceeded" Error

- Free tier allows 100 queries per day
- Wait 24 hours for quota to reset, or upgrade to a paid plan
- Check your usage in Google Cloud Console → APIs & Services → Dashboard

### No Results Returned

- Verify your search engine is configured to search the entire web (`*`)
- Check that the search engine is active (not paused)
- Try a different search query to test

## Free Tier Limits

- **100 queries per day** (resets at midnight Pacific Time)
- **10 queries per second** rate limit
- Sufficient for development and testing
- For production, consider upgrading to a paid plan

## Security Best Practices

1. **Restrict API Key**: Limit the key to only Custom Search API
2. **Don't Commit Keys**: Never commit `.env.local` files to git
3. **Rotate Keys**: If a key is exposed, create a new one and disable the old one
4. **Monitor Usage**: Regularly check API usage in Google Cloud Console

## Alternative: Web Scraping Fallback

If you don't want to set up Google API credentials, the system will automatically fall back to web scraping. However:
- Less reliable (Google's HTML structure changes)
- May violate Google's Terms of Service
- Slower and less accurate results
- **Recommended**: Use the API for better results

## Next Steps

Once you have your API keys set up:

1. Add them to `scripts/automation/.env.local`
2. Test with: `npm run search "test query"`
3. Run the full pipeline: `npm run update`

Your automation pipeline will now use Google Custom Search API to find high-quality reference articles!

