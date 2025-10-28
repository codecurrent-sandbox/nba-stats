# NBA Stats

A modern web application to display real-time NBA statistics with a React frontend and Node.js API backend.

## Quick Start

### Prerequisites
- Docker & Docker Compose
- **BallDontLie API Key** - Get yours at [https://www.balldontlie.io](https://www.balldontlie.io)

### Setup

1. **Get your BallDontLie API Key:**
   - Visit [https://www.balldontlie.io](https://www.balldontlie.io)
   - Sign up and get your API key from the dashboard

2. **Add your API key to `.env`:**
   ```bash
   # Edit the .env file in the root directory
   NBA_API_KEY=your_actual_api_key_here
   ```

3. **Start the application:**
   ```bash
   docker-compose up
   ```
   
   Or run in detached mode:
   ```bash
   docker-compose up -d
   ```

The application will be available at:
- **Frontend**: http://localhost:3001
- **API**: http://localhost:3000/api/v1
- **API Health Check**: http://localhost:3000/api/health

### Verify the Setup

Test that the BallDontLie API integration is working:

```bash
# Check API health
curl http://localhost:3000/api/health

# Get NBA teams (should return real data)
curl http://localhost:3000/api/v1/teams

# Get NBA players
curl "http://localhost:3000/api/v1/players?limit=5"
```

If you get real NBA data, you're all set! 🏀

## Available Services

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Frontend | 3001 | http://localhost:3001 | React web application |
| API | 3000 | http://localhost:3000/api/v1 | REST API server |
| PostgreSQL | 5432 | localhost:5432 | Database |

## API Endpoints

### Teams
- `GET /api/v1/teams` - Get all NBA teams
- `GET /api/v1/teams/:id` - Get specific team by ID

### Players
- `GET /api/v1/players` - Get all NBA players (paginated)
  - Query params: `cursor`, `limit`, `search`
- `GET /api/v1/players/:id` - Get specific player by ID

### Games
- `GET /api/v1/games` - Get NBA games (with filters)
  - Query params: `dates`, `seasons`, `team_ids`, `cursor`, `limit`
- `GET /api/v1/games/:id` - Get specific game by ID

## Project Structure

```
nba-stats/
├── frontend/          # React + TypeScript + Vite
├── services/
│   └── api/          # Express.js API server
├── docs/             # Documentation
├── infra/            # Infrastructure configs
├── scripts/          # Utility scripts
└── tests/            # Test suites
```

## Development

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### API Development
```bash
cd services/api
npm install
npm run dev
```

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express.js, PostgreSQL
- **External API**: BallDontLie.io for NBA statistics
- **Caching**: In-memory cache (5-minute TTL)
- **Deployment**: Docker, Docker Compose, Nginx

## Features

- ✅ **Real NBA Data**: Integrated with BallDontLie.io API
- ✅ **Players**: Browse and search NBA players
- ✅ **Teams**: View all NBA teams with details
- ✅ **Games**: Access game schedules and results
- ✅ **Caching**: Smart caching (5-minute TTL) to optimize API calls
- ✅ **Error Handling**: Comprehensive error handling and logging

## Troubleshooting

### Common Issues

**401 Unauthorized Error**
- Make sure you've added your API key to the `.env` file
- Verify your API key is valid at https://www.balldontlie.io

**No Data Showing**
- Check that Docker containers are running: `docker-compose ps`
- View API logs: `docker-compose logs api`
- Restart containers: `docker-compose restart`

**Port Already in Use**
- Check if ports 3000 or 3001 are in use
- Modify ports in `docker-compose.yml` if needed

## Development

### Local Development (without Docker)

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

**API:**
```bash
cd services/api
npm install
npm run dev
# Runs on http://localhost:3000
```

### Stopping the Application

```bash
docker-compose down
```

## License

ISC
