# NBA Stats

Modern NBA statistics application with React frontend, Node.js API, and PostgreSQL database. Fully automated Azure deployment with CI/CD pipelines.

## Features

- 🏀 Real NBA data from BallDontLie API
- 💾 PostgreSQL caching for fast performance
- 🔄 Automatic cache updates
- ☁️ Azure Container Apps deployment
- 🔐 Secure secrets management with Azure Key Vault
- 🚀 CI/CD with Azure DevOps pipelines
- 🌍 Multi-environment (Dev/Test/Prod)  

## Quick Start

### Local Development

1. **Get BallDontLie API Key** from [balldontlie.io](https://www.balldontlie.io)

2. **Add API key to `.env`**:
   ```env
   NBA_API_KEY=your_api_key_here
   ```

3. **Start with Docker Compose**:
   ```bash
   docker-compose up
   ```

**Access:**
- Frontend: http://localhost:3001
- API: http://localhost:3000/api/v1
- Health: http://localhost:3000/health

### Azure Deployment

**Prerequisites:**
- Azure DevOps project with service connection
- Pipeline variables: `POSTGRES_ADMIN_PASSWORD`, `NBA_API_KEY`

**Deploy:**
1. Push to `main` branch (infrastructure changes trigger deployment)
2. Or manually run pipelines in Azure DevOps

**Pipelines:**
- Infrastructure → API → Frontend (cascade automatically)
- Manual approval required for Test/Prod environments

See [Infrastructure Guide](infra/README.md) for details.

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, PostgreSQL
- **Infrastructure**: Azure Bicep, Container Apps, Key Vault
- **DevOps**: Azure DevOps Pipelines, Docker
- **External API**: BallDontLie.io

## API Endpoints

### Teams
- `GET /api/v1/teams` - List all teams
- `GET /api/v1/teams/:id` - Get team details

### Players
- `GET /api/v1/players` - List players (paginated)
- `GET /api/v1/players/:id` - Get player details

### Games
- `GET /api/v1/games` - List games (filtered)
- `GET /api/v1/games/:id` - Get game details

## Project Structure

```
nba-stats/
├── frontend/           # React app (port 3001)
├── services/api/       # Node.js API (port 3000)
├── infra/             # Bicep IaC templates
├── pipelines/         # Azure DevOps YAML
├── docker-compose.yml # Local development
└── tests/             # Test suites
```

## Documentation

- **[Infrastructure](infra/README.md)** - Deployment and Azure resources
- **[Pipelines](pipelines/README.md)** - CI/CD configuration
- **[API Schemas](services/api/schemas.md)** - Data models
- **[Error Handling](services/api/ERROR_HANDLING.md)** - API error patterns

## Troubleshooting

**401 Unauthorized**: Invalid/missing NBA_API_KEY in `.env` (local) or Key Vault (Azure)

**No Data**: Check containers are running (`docker-compose ps` or Azure Portal logs)

**Port Conflict**: Modify ports in `docker-compose.yml`

**Azure Deployment**: Review pipeline logs, verify service connections and RBAC permissions

**Key Vault Conflict**: Purge soft-deleted vault with `az keyvault purge --name <vault-name>` (dev/test only)

## Contributing

1. Fork and create feature branch
2. Test locally with Docker Compose
3. Test Azure deployment
4. Create Pull Request

## License

ISC
