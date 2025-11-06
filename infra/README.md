# NBA Stats - Infrastructure

Infrastructure as Code (IaC) using Bicep templates for deploying to Azure.

## Quick Start

**Automated (Recommended):**
- Pipeline auto-deploys on commits to `/infra/**` in `main` branch
- Location: `pipelines/infra-deploy.yml`
- Approvals required for Test/Prod

**Manual:**
```bash
./scripts/deploy.sh <dev|test|prod>
```

## Architecture

- **Container Apps Environment**: Hosts frontend (React) and API (Node.js)
- **PostgreSQL Flexible Server**: NBA data cache
- **Container Registry**: Docker image storage
- **Key Vault**: Secrets (NBA_API_KEY, DB password)
- **Log Analytics**: Centralized logging
- **Managed Identity**: Passwordless authentication

## Resources Created

| Resource | Dev SKU | Test/Prod SKU |
|----------|---------|---------------|
| PostgreSQL | B1ms, 32GB | D2ds_v4, 64GB/128GB |
| Container Apps | 1-3 replicas | 2-5/2-10 replicas |
| ACR | Basic | Basic |
| Key Vault | Standard | Standard |

## Environment Configuration

Parameter files in `/parameters/`:
- `dev.bicepparam` - Auto-deploy
- `test.bicepparam` - Manual approval
- `prod.bicepparam` - Manual approval

**Required Pipeline Variables:**
- `POSTGRES_ADMIN_PASSWORD` (secret)
- `NBA_API_KEY` (secret)

## File Structure

```
infra/
├── main.bicep                  # Main template
├── parameters/                 # Environment configs
├── modules/                    # Bicep modules
│   ├── container-apps/        # Frontend & API
│   ├── database/              # PostgreSQL
│   ├── identity/              # Managed identity
│   ├── monitoring/            # Logs & alerts
│   ├── registry/              # ACR
│   └── secrets/               # Key Vault
├── scripts/                   # Deployment scripts
└── docs/                      # Additional docs
```

## Troubleshooting

**Key Vault conflict**: Purge soft-deleted vault with `az keyvault purge --name <vault-name>`

**DB init fails**: Verify firewall allows Azure services, check `init-database.sh` permissions

**Container Apps can't pull images**: Verify Managed Identity has AcrPull role

**Secrets not accessible**: Verify Managed Identity has Key Vault Secrets User role

**Validate deployment:**
```bash
az containerapp list -g rg-nba-stats-dev --query "[].{Name:name, Status:properties.runningStatus}" -o table
```
