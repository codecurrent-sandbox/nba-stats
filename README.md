# NBA Stats

A web application to display NBA statistics with a React frontend and Node.js API backend.

## Quick Start

### Prerequisites
- Docker & Docker Compose
- (Optional) Node.js 20+ if running services locally without Docker

### Run with Docker Compose

```bash
cd nba-stats
docker-compose up
```

The application will be available at:
- **Frontend**: http://localhost:3001
- **API**: http://localhost:3000
- **Database Admin (PgAdmin)**: http://localhost:5050
  - Email: `admin@nba-stats.com`
  - Password: `admin`

### Services

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 3001 | React web application |
| API | 3000 | REST API server |
| PostgreSQL | 5432 | Database (postgres/postgres) |
| PgAdmin | 5050 | Database management UI |

### Database Credentials

- **Username**: `postgres`
- **Password**: `postgres`
- **Database**: `nba_stats`

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
- **Deployment**: Docker, Docker Compose, Nginx


