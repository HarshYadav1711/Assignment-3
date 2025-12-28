# Article Review Frontend

React frontend for reviewing original and updated articles.

## Features

- **Article List**: View all articles with filtering (All, Original, Updated)
- **Article Detail**: View full article content with tabs for original/updated versions
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Loading States**: Clear loading indicators
- **Error Handling**: User-friendly error messages with retry options
- **Clean UI**: Simple, professional design focused on readability

## Installation

```bash
cd apps/frontend
npm install
```

## Development

```bash
npm run dev
```

The app will run on `http://localhost:3000` (or the next available port).

## Build

```bash
npm run build
```

## Configuration

Set the API URL in `.env.local`:

```env
VITE_API_URL=http://localhost:3001
```

## Component Structure

```
src/
├── components/
│   ├── ArticleCard.jsx       # Article preview card
│   ├── ArticleDetail.jsx     # Full article view
│   ├── ArticleList.jsx        # Article list with filters
│   ├── Header.jsx            # App header
│   ├── Loading.jsx           # Loading indicator
│   └── ErrorMessage.jsx      # Error display
├── services/
│   └── api.js                # API client
├── App.jsx                    # Main app component
└── main.jsx                  # Entry point
```

## Features

### Article List
- Filter by type (All, Original, Updated)
- Responsive grid layout
- Article preview with metadata

### Article Detail
- Full article content
- Tabs to switch between original and updated content
- Reference URLs display
- Link to original article if viewing an update
- List of all updates if viewing original article

### Styling
- CSS modules for component styles
- Responsive breakpoints
- Clean typography
- Professional color scheme

