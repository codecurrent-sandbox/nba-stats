# Azure Developer CLI (azd) Integration

## Overview
This project includes Azure Developer CLI (azd) integration for simplified local development and deployment workflows.

## Prerequisites

1. **Install Azure Developer CLI**:
   ```bash
   # macOS
   brew install azure-dev
   
   # Windows
   winget install Microsoft.Azd
   
   # Linux
   curl -fsSL https://aka.ms/install-azd.sh | bash
   ```

2. **Install Azure CLI**:
   ```bash
   # macOS
   brew install azure-cli
   
   # Windows
   winget install Microsoft.AzureCLI
   
   # Linux
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   ```

3. **Login to Azure**:
   ```bash
   az login
   azd auth login
   ```

## Quick Start

### Initialize Environment

```bash
# Create a new azd environment
azd env new dev

# Set Azure location (default is swedencentral, but you can choose any region)
azd env set AZURE_LOCATION swedencentral

# The following will be prompted during 'azd up':
# - NBA_API_KEY (your BallDontLie API key)
# - POSTGRES_ADMIN_PASSWORD (database password)
```

### Deploy Infrastructure

```bash
# Provision Azure resources (runs Bicep deployment)
azd provision

# This will:
# 1. Prompt for NBA API key and PostgreSQL password (if not already set)
# 2. Deploy Bicep templates to create Azure resources
# 3. Run postprovision hook (seed secrets to Key Vault, initialize database)
```

### Deploy Application

```bash
# Build and deploy application containers
azd deploy

# This will:
# 1. Build Docker images for frontend and API
# 2. Push images to Azure Container Registry
# 3. Update Container Apps with new images
```

### Full Deployment

```bash
# Provision infrastructure AND deploy application
azd up

# This combines 'azd provision' and 'azd deploy'
```

## Environment Management

### List Environments

```bash
azd env list
```

### Switch Environments

```bash
azd env select nba-stats-dev
azd env select nba-stats-test
azd env select nba-stats-prod
```

### View Environment Variables

```bash
azd env get-values
```

### Set Environment Variables

```bash
azd env set NBA_API_KEY "new-api-key"
azd env set POSTGRES_ADMIN_PASSWORD "new-password"
```

## Useful Commands

### Monitor Application

```bash
# Open Azure Portal for the environment
azd monitor

# View application logs
azd monitor --logs
```

### Cleanup Resources

```bash
# Delete all Azure resources
azd down

# Delete with purge (remove soft-deleted resources)
azd down --purge --force
```

### CI/CD Integration

```bash
# Configure Azure DevOps pipeline
azd pipeline config

# This will:
# 1. Create service connection
# 2. Create pipeline variables
# 3. Create pipeline in Azure DevOps
```

## Project Structure

```
nba-stats/
├── azure.yaml              # azd configuration
├── infra/                  # Bicep infrastructure files
│   ├── main.bicep
│   ├── parameters/
│   │   ├── dev.bicepparam
│   │   ├── test.bicepparam
│   │   └── prod.bicepparam
│   └── scripts/
├── services/
│   └── api/               # Backend API service
└── frontend/              # Frontend application
```

## Configuration File (azure.yaml)

The `azure.yaml` file defines:

- **Services**: Frontend and API containers
- **Infrastructure**: Bicep module and parameters
- **Hooks**: Pre/post provision scripts

### Hooks

**Postprovision Hook**:
- Seeds NBA API key to Azure Key Vault
- Initializes PostgreSQL database schema

Note: Preprovision hook was removed for simplicity. Required parameters are prompted during deployment.

## Environment Variables

Parameters prompted during deployment:

| Variable | Description | Prompted During |
|----------|-------------|-----------------|
| `NBA_API_KEY` | API key for BallDontLie API | `azd up` or `azd provision` |
| `POSTGRES_ADMIN_PASSWORD` | PostgreSQL admin password | `azd up` or `azd provision` |

You can also pre-set these with `azd env set NBA_API_KEY "your-key"` to skip the prompts.

## Troubleshooting

### Issue: NBA_API_KEY not set

```bash
# Set the variable
azd env set NBA_API_KEY "your-key"

# Verify it's set
azd env get-values | grep NBA_API_KEY
```

### Issue: Authentication failed

```bash
# Re-login to Azure
azd auth login --use-device-code
```

### Issue: Deployment fails

```bash
# View detailed logs
azd provision --debug

# Check environment values
azd env get-values

# Common fixes:
# 1. Delete soft-deleted Key Vault (dev/test only):
az keyvault purge --name <vault-name>

# 2. Clean up and retry:
azd down
azd up
```

## Best Practices

1. **Use separate environments**: Create distinct azd environments for dev, test, and prod
2. **Secure secrets**: Use `azd env set` for sensitive values (never commit to source control)
3. **Regular updates**: Keep azd updated with `brew upgrade azure-dev`
4. **Monitor costs**: Use `azd monitor` to track resource usage
5. **Clean up**: Run `azd down` when resources are no longer needed

## Additional Resources

- [Azure Developer CLI Documentation](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/)
- [azd Template Gallery](https://azure.github.io/awesome-azd/)
- [azd GitHub Repository](https://github.com/Azure/azure-dev)
