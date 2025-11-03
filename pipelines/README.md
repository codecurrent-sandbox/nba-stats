# Build Pipelines Documentation

This document explains the NBA Stats build pipelines and their configuration.

## Overview

The NBA Stats project uses three Azure DevOps pipelines:

1. **Infrastructure Deployment** (`infra-deploy.yml`) - Deploys Azure infrastructure using Bicep
2. **API Build** (`build-api.yml`) - Builds and publishes the Node.js API Docker image
3. **Frontend Build** (`build-frontend.yml`) - Builds the React frontend application

## Pipeline Integration

The build pipelines are **integrated with the infrastructure pipeline** to automatically consume deployment outputs. This eliminates the need for manual configuration of ACR names and API endpoints.

### How It Works

1. **Infrastructure Pipeline** runs first and deploys Azure resources (ACR, Container Apps, etc.)
2. Infrastructure pipeline **captures outputs** (ACR name, login server, API URL) and publishes them as artifacts
3. **Build pipelines** download these artifacts and extract the necessary configuration dynamically

This approach ensures:
- ✅ No hardcoded values
- ✅ Automatic environment-specific configuration
- ✅ Consistency between infrastructure and build pipelines
- ✅ Reduced manual configuration errors

## API Build Pipeline (`build-api.yml`)

### Purpose
Builds the Node.js API service as a Docker image and pushes it to Azure Container Registry.

### Pipeline Stages

1. **Prep** - Setup Node.js environment and install dependencies with caching
2. **Quality** - Run ESLint validation
3. **Build** - Build Docker image with semantic versioning (`{version}-{sha}`)
4. **Publish** - Push to ACR (main branch only)

### Triggers
- **Branch**: `main`
- **Path Filter**: `services/api/**`, `pipelines/build-api.yml`

### Configuration

#### Required Pipeline Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `acrServiceConnection` | Azure Container Registry service connection name | `acr-nba-stats-dev` | Yes |
| `targetEnvironment` | Target environment (dev/test/prod) | `dev` | No (defaults to `dev`) |

#### Automatic Configuration (from Infrastructure Pipeline)

The following values are **automatically retrieved** from the infrastructure deployment:
- `acrName` - Container Registry name
- `acrLoginServer` - Container Registry login server URL

### Image Tagging Strategy

Images are tagged with semantic versioning:
- Format: `{version}-{sha}`
- Example: `1.0.0-a3b4c5d`
- Also tagged as `latest`

Where:
- `{version}` comes from `services/api/package.json`
- `{sha}` is the short git commit hash (7 characters)

### Service Connection Setup

You need to create an Azure Container Registry service connection in Azure DevOps:

1. Navigate to **Project Settings** > **Service Connections**
2. Click **New service connection** > **Docker Registry**
3. Select **Azure Container Registry**
4. Choose your subscription and ACR
5. Name it (e.g., `acr-nba-stats-dev`)
6. Save and use this name in the `acrServiceConnection` variable

## Frontend Build Pipeline (`build-frontend.yml`)

### Purpose
Builds the React frontend application, analyzes bundle sizes, and publishes build artifacts.

### Pipeline Stages

1. **Prep** - Setup Node.js environment and install dependencies
2. **Quality** - Run TypeScript type checking and ESLint (parallel)
3. **Build** - Vite production build
4. **Metrics** - Bundle size analysis
5. **Publish** - Publish artifacts (main branch only)

### Triggers
- **Branch**: `main`
- **Path Filter**: `frontend/**`, `pipelines/build-frontend.yml`

### Configuration

#### Required Pipeline Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `targetEnvironment` | Target environment (dev/test/prod) | `dev` | No (defaults to `dev`) |

#### Automatic Configuration (from Infrastructure Pipeline)

The following value is **automatically retrieved** from the infrastructure deployment:
- `viteApiUrl` - API endpoint URL for the frontend to connect to

If the infrastructure outputs are not available, a placeholder URL is used and logged.

### Build Output

The pipeline produces two artifacts:

1. **frontend-dist** - Production build output (`dist` folder)
2. **bundle-metrics** - Bundle size analysis
   - `bundle-metrics.md` - Human-readable markdown report
   - `bundle-metrics.json` - Machine-readable JSON metrics

### Bundle Analysis

The Metrics stage analyzes:
- Total bundle size (bytes, KB, MB)
- Individual JavaScript file sizes
- Individual CSS file sizes
- Build metadata (build number, commit, timestamp)

Reports are published as:
- Pipeline artifact for download
- Build summary for quick viewing

## Infrastructure Pipeline Integration

### Pipeline Resource Configuration

Both build pipelines reference the infrastructure pipeline as a resource:

```yaml
resources:
  pipelines:
    - pipeline: infraPipeline
      source: 'NBA-Stats-Infra-Deploy'  # Name of your infrastructure pipeline
      trigger:
        branches:
          include:
            - main
```

**Important**: Update the `source` value if your infrastructure pipeline has a different name in Azure DevOps.

### Deployment Outputs

The infrastructure pipeline captures and publishes these outputs for each environment (dev/test/prod):

| Output | Description | Used By |
|--------|-------------|---------|
| `containerRegistryName` | ACR short name | API Build |
| `containerRegistryLoginServer` | ACR FQDN | API Build |
| `apiUrl` | API endpoint URL | Frontend Build |
| `postgresServerFqdn` | PostgreSQL server FQDN | Infrastructure |
| `resourceGroupName` | Resource group name | Infrastructure |

Outputs are saved to artifacts:
- `deployment-dev.json`
- `deployment-test.json`
- `deployment-prod.json`

### Example Output JSON

```json
{
  "postgresServerFqdn": "nba-stats-dev-pg-abc123.postgres.database.azure.com",
  "resourceGroupName": "rg-nba-stats-dev",
  "containerRegistryName": "nbastatsdevacrabc123",
  "containerRegistryLoginServer": "nbastatsdevacrabc123.azurecr.io",
  "apiUrl": "https://nba-stats-dev-api.example.azurecontainerapps.io"
}
```

## Multi-Environment Support

### Targeting Different Environments

To build for different environments (dev/test/prod), override the `targetEnvironment` variable:

**For API Build:**
```yaml
variables:
  targetEnvironment: 'test'  # or 'prod'
```

**For Frontend Build:**
```yaml
variables:
  targetEnvironment: 'test'  # or 'prod'
```

This will:
1. Download the corresponding environment's deployment outputs
2. Use the ACR/API URL for that environment
3. Ensure environment-specific builds

### Service Connections Per Environment

You may want separate service connections for each environment:
- `acr-nba-stats-dev`
- `acr-nba-stats-test`
- `acr-nba-stats-prod`

Update the `acrServiceConnection` variable accordingly when targeting different environments.

## Common Workflows

### 1. First-Time Setup

1. Run infrastructure pipeline to deploy Azure resources
2. Create ACR service connection(s) in Azure DevOps
3. Update `acrServiceConnection` in build-api.yml (or as pipeline variable)
4. Run API build pipeline
5. Run frontend build pipeline

### 2. Code Changes

When you commit code changes:
- API changes trigger API build pipeline automatically
- Frontend changes trigger frontend build pipeline automatically
- Build pipelines fetch latest infrastructure outputs

### 3. Infrastructure Changes

When infrastructure is updated:
- Infrastructure pipeline runs and publishes new outputs
- Next build pipeline runs will automatically use updated values
- No manual configuration needed

## Troubleshooting

### API Build: "ACR service connection not found"

**Solution**: Create the ACR service connection in Azure DevOps and update the `acrServiceConnection` variable.

### Frontend Build: "Using placeholder API URL"

**Cause**: Infrastructure deployment outputs not found or `apiUrl` missing.

**Solution**: 
1. Verify infrastructure pipeline has run successfully
2. Check that deployment artifacts exist (deployment-{env}.json)
3. Ensure `apiUrl` is in the Bicep outputs (it should be)

### "Download infrastructure outputs failed"

**Cause**: Infrastructure pipeline may not have run or artifacts expired.

**Solution**:
1. Run the infrastructure pipeline first
2. Verify artifacts are published (check pipeline run)
3. Ensure pipeline names match in the `resources` section

### Wrong Environment Configuration

**Cause**: `targetEnvironment` variable set incorrectly or not set.

**Solution**: Verify the `targetEnvironment` variable matches your intended environment (dev/test/prod).

## Security Considerations

### Secrets Management

- **PostgreSQL Password**: Stored as pipeline secret variable `POSTGRES_ADMIN_PASSWORD`
- **NBA API Key**: Stored as pipeline secret variable `NBA_API_KEY`
- **Service Connections**: Use managed identities or service principals with minimal required permissions

### ACR Authentication

The build pipelines authenticate to ACR using:
1. **Service Connection** (configured in Azure DevOps)
2. **Managed Identity** (granted `AcrPull` role in Bicep)

This eliminates the need for admin credentials.

## Best Practices

1. **Always run infrastructure pipeline first** when setting up a new environment
2. **Use separate service connections** for dev/test/prod
3. **Monitor bundle sizes** in the Metrics stage to prevent bloat
4. **Review ESLint/TypeScript errors** in Quality stage before merging
5. **Tag releases** using semantic versioning in package.json
6. **Keep build pipelines lightweight** - they should complete in < 10 minutes

## Related Documentation

- [Infrastructure README](../infra/README.md) - Infrastructure deployment guide
- [API Documentation](../services/api/README.md) - API service documentation
- [Frontend Documentation](../frontend/README.md) - Frontend application documentation
