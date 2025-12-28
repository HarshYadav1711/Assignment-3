# Monorepo Structure

## Folder Structure

```
assignment-3/
├── apps/
│   ├── frontend/                    # React frontend application
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── components/          # Reusable React components
│   │   │   ├── pages/               # Page components (ArticleList, ArticleDetail, etc.)
│   │   │   ├── services/            # API client services
│   │   │   ├── hooks/               # Custom React hooks
│   │   │   ├── utils/               # Frontend utilities
│   │   │   └── App.jsx
│   │   ├── package.json
│   │   └── vite.config.js           # or webpack.config.js
│   │
│   └── api/                         # Backend REST API
│       ├── src/
│       │   ├── controllers/         # Request handlers
│       │   ├── models/              # Data models/schemas
│       │   ├── routes/              # API route definitions
│       │   ├── middleware/          # Express middleware (auth, validation, etc.)
│       │   ├── services/            # Business logic layer
│       │   ├── config/              # Database, app configuration
│       │   ├── utils/               # Backend utilities
│       │   └── server.js            # Entry point
│       ├── package.json
│       └── .env.example
│
├── scripts/
│   └── automation/                   # Node.js automation scripts
│       ├── src/
│       │   ├── scrapers/            # Web scraping logic
│       │   ├── services/            # Google search, LLM integration
│       │   ├── processors/          # Article update processing
│       │   ├── utils/               # Script utilities
│       │   └── index.js             # Main script entry point
│       ├── package.json
│       └── .env.example
│
├── packages/                         # Shared code (optional)
│   └── shared/                       # Common types, utilities, constants
│       ├── src/
│       │   ├── types/               # TypeScript types or JSDoc types
│       │   ├── constants/           # Shared constants
│       │   └── utils/               # Shared utility functions
│       └── package.json
│
├── docs/                             # Documentation and diagrams
│   ├── architecture.md              # System architecture overview
│   ├── api.md                       # API documentation
│   └── diagrams/                    # Architecture diagrams (Mermaid, PNG, etc.)
│
├── .env.example                      # Root-level environment variable template
├── .env.local                        # Local environment (gitignored)
├── .gitignore
├── package.json                      # Root workspace configuration
├── README.md                         # Main project README
└── pnpm-workspace.yaml               # or npm/yarn workspace config
```

## Folder Explanations

### `/apps/frontend`
- **Purpose**: React application for displaying articles
- **Contains**: UI components, pages, API client, hooks, and frontend utilities
- **Tech Stack**: React, Vite (or Create React App), Axios/Fetch for API calls

### `/apps/api`
- **Purpose**: Backend REST API for article CRUD operations
- **Contains**: Controllers, models, routes, middleware, business logic, and server configuration
- **Tech Stack**: Node.js, Express (or Fastify), database ORM (Prisma/Sequelize/Mongoose)

### `/scripts/automation`
- **Purpose**: Standalone Node.js script for web scraping, Google search, and LLM-based article updates
- **Contains**: Scraping logic, external service integrations (Google Search API, LLM API), and article processing logic
- **Tech Stack**: Node.js, Puppeteer/Cheerio for scraping, OpenAI/Anthropic API for LLM

### `/packages/shared` (Optional)
- **Purpose**: Shared code between apps (types, constants, utilities)
- **Use Case**: If you need to share TypeScript types or utility functions between frontend and backend

### `/docs`
- **Purpose**: Project documentation and architecture diagrams
- **Contains**: Architecture docs, API documentation, and visual diagrams

## Environment Variables

### Location Strategy
1. **Root Level** (`.env.example`): Template file with all required variables (committed to git)
2. **App-Specific** (`.env.local`): Actual environment variables (gitignored)
   - `/apps/api/.env.local` - API-specific variables (DB_URL, JWT_SECRET, etc.)
   - `/scripts/automation/.env.local` - Automation script variables (GOOGLE_API_KEY, LLM_API_KEY, etc.)
   - `/apps/frontend/.env.local` - Frontend variables (API_URL, etc.)

### Recommended Variables

**API (.env.local)**
```
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://...
JWT_SECRET=...
CORS_ORIGIN=http://localhost:3000
```

**Automation Script (.env.local)**
```
GOOGLE_API_KEY=...
GOOGLE_SEARCH_ENGINE_ID=...
LLM_API_KEY=...
LLM_PROVIDER=openai|anthropic
DATABASE_URL=postgresql://...  # Same as API if sharing DB
```

**Frontend (.env.local)**
```
VITE_API_URL=http://localhost:3001
# or REACT_APP_API_URL if using CRA
```

## Documentation Location

### `/README.md` (Root)
- Project overview
- Quick start guide
- Installation instructions
- How to run each app
- Tech stack summary

### `/docs/architecture.md`
- System architecture overview
- Component interactions
- Data flow diagrams
- Technology choices and rationale

### `/docs/api.md`
- API endpoint documentation
- Request/response examples
- Authentication details
- Error handling

### `/docs/diagrams/`
- Visual architecture diagrams (Mermaid, draw.io, or PNG)
- Database schema diagrams
- Sequence diagrams for key flows

## Monorepo Management

### Package Manager Options
- **pnpm**: Recommended for monorepos (fast, efficient)
- **npm/yarn**: Workspace support available

### Workspace Configuration
- Root `package.json` defines workspaces
- Each app/package has its own `package.json`
- Shared dependencies can be hoisted to root

## Best Practices Applied

1. **Clear Separation**: Each app is self-contained with its own dependencies
2. **Scalability**: Easy to add new apps or packages
3. **Environment Isolation**: Each app manages its own environment variables
4. **Documentation**: Centralized docs folder for all documentation
5. **Production-Ready**: Structure follows industry standards for monorepos
6. **Simple & Readable**: No over-engineering, straightforward naming

