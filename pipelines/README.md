# Build Pipelines

Three Azure DevOps pipelines with automatic cascade triggering:

1. **Infrastructure** (`infra-deploy.yml`) - Deploys Bicep templates → triggers API pipeline
2. **API** (`build-api.yml`) - Builds Node.js API, updates DB secrets, deploys to Container Apps → triggers Frontend pipeline
3. **Frontend** (`build-frontend.yml`) - Builds React app, deploys to Container Apps

## Pipeline Flow

```
Infrastructure → API → Frontend
```

- Infrastructure changes auto-trigger API build
- API completion auto-triggers Frontend build
- Manual approval required for Test/Prod

## API Build Pipeline

**Triggers:** Changes to `services/api/**` or `pipelines/build-api.yml` on `main` branch, or Infrastructure completion

**Stages:**
1. Prep - Install dependencies (cached)
2. Quality - ESLint validation
3. Build - Docker image with tag `{version}-{sha}`
4. Publish - Push to ACR
5. Deploy - Update DB connection string secret, deploy to Container Apps (Dev/Test/Prod)

**Image Tags:** `1.0.0-a3b4c5d` (version from package.json + git commit SHA)

**Service Connection:** Use `azure-nba-stats-connection` (AzureRM)

**Key Feature:** Automatically updates PostgreSQL connection string with correct password during deployment

## Frontend Build Pipeline

**Triggers:** Changes to `frontend/**` or `pipelines/build-frontend.yml` on `main` branch, or API completion

**Stages:**
1. Prep - Install dependencies
2. Quality - TypeScript type check + ESLint (parallel)
3. Build - Vite production build
4. Metrics - Bundle size analysis
5. Publish - Build artifacts
6. Deploy - Deploy to Container Apps (Dev/Test/Prod)

**Artifacts:**
- `frontend-dist` - Production build
- `bundle-metrics` - Size analysis (MD + JSON)

**Service Connection:** Use `azure-nba-stats-connection` (AzureRM)

## Infrastructure Pipeline

**Triggers:** Changes to `infra/**` on `main` branch

**Stages:**
1. Deploy Dev - Auto-deploy, triggers API pipeline
2. Deploy Test - Manual approval
3. Deploy Prod - Manual approval

**Outputs Published:** ACR name/login server, API URL, PostgreSQL FQDN (as artifacts)

## Required Pipeline Variables

| Variable | Type | Used By | Description |
|----------|------|---------|-------------|
| `POSTGRES_ADMIN_PASSWORD` | Secret | Infrastructure, API | PostgreSQL admin password |
| `NBA_API_KEY` | Secret | Infrastructure | BallDontLie API key |

## Troubleshooting

**"ACR service connection not found"**: Verify service connection name is `azure-nba-stats-connection`

**"Using placeholder API URL"**: Infrastructure pipeline needs to run first

**Empty DB password**: Ensure `POSTGRES_ADMIN_PASSWORD` is set as pipeline variable

**Verify deployment:**
```bash
az containerapp revision list -g rg-nba-stats-dev -n nba-stats-dev-api -o table
```
