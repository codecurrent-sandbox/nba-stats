# Azure Service Connection Configuration

## Overview
This document describes the Azure service connection required for the NBA Stats infrastructure deployment pipeline.

## Service Connection Requirements

### Connection Type
- **Type**: Azure Resource Manager
- **Authentication Method**: Service Principal (automatic)
- **Scope**: Subscription

### Required Permissions
The service principal needs the following permissions:

1. **Subscription Level**:
   - `Contributor` role - To create and manage resources
   - `User Access Administrator` role - To assign roles to managed identities

2. **Resource Group Level** (alternative to subscription-level permissions):
   - `Contributor` role on:
     - `rg-nba-stats-dev`
     - `rg-nba-stats-test`
     - `rg-nba-stats-prod`

## Creating the Service Connection

### Option 1: Azure DevOps Portal (Recommended)

1. Navigate to your Azure DevOps project
2. Go to **Project Settings** → **Service connections**
3. Click **New service connection**
4. Select **Azure Resource Manager**
5. Choose **Service principal (automatic)**
6. Fill in the details:
   - **Scope level**: Subscription
   - **Subscription**: Select your Azure subscription
   - **Service connection name**: `azure-nba-stats-connection`
   - **Description**: Service connection for NBA Stats infrastructure deployment
   - **Grant access permission to all pipelines**: ✓ (checked)
7. Click **Save**

### Option 2: Azure CLI

```bash
# Set variables
SUBSCRIPTION_ID="your-subscription-id"
SUBSCRIPTION_NAME="your-subscription-name"
TENANT_ID="your-tenant-id"
PROJECT_NAME="Agentic DevOps"
ORG_URL="https://dev.azure.com/your-org"

# Create service principal
SP_NAME="sp-nba-stats-azdo"
SP_OUTPUT=$(az ad sp create-for-rbac \
  --name "$SP_NAME" \
  --role "Contributor" \
  --scopes "/subscriptions/$SUBSCRIPTION_ID" \
  --sdk-auth)

# Extract values
CLIENT_ID=$(echo $SP_OUTPUT | jq -r '.clientId')
CLIENT_SECRET=$(echo $SP_OUTPUT | jq -r '.clientSecret')
TENANT_ID=$(echo $SP_OUTPUT | jq -r '.tenantId')

# Assign User Access Administrator role (for managed identity role assignments)
az role assignment create \
  --assignee "$CLIENT_ID" \
  --role "User Access Administrator" \
  --scope "/subscriptions/$SUBSCRIPTION_ID"

echo "Service Principal Created:"
echo "  Client ID: $CLIENT_ID"
echo "  Tenant ID: $TENANT_ID"
echo "  Client Secret: $CLIENT_SECRET"
echo ""
echo "Use these values to create the service connection in Azure DevOps"
```

## Service Connection Name
The pipeline expects a service connection named: **`azure-nba-stats-connection`**

If you use a different name, update the `azureSubscription` parameter in `pipelines/infra-deploy.yml`.

## Verification

After creating the service connection, verify it works:

1. Go to the service connection in Azure DevOps
2. Click **Verify**
3. Ensure the verification succeeds

## Security Best Practices

1. **Limit Scope**: If possible, limit the service connection to specific resource groups rather than the entire subscription
2. **Secret Rotation**: Rotate the service principal secret regularly (every 90 days)
3. **Audit Logs**: Monitor the service principal's activity in Azure Activity Logs
4. **Least Privilege**: Only grant the minimum required permissions
5. **Use Managed Identities**: For Azure resources, prefer managed identities over service principals where possible

## Troubleshooting

### Permission Denied Errors
- Verify the service principal has `Contributor` role on the subscription or resource groups
- Check if the service principal has `User Access Administrator` role for role assignments

### Service Connection Not Found
- Ensure the service connection name matches exactly: `azure-nba-stats-connection`
- Verify the service connection has "Grant access permission to all pipelines" enabled

### Authentication Failures
- Verify the service principal credentials haven't expired
- Check if the service principal exists in Azure AD
- Ensure the tenant ID matches your Azure subscription

## Additional Resources

- [Azure DevOps Service Connections Documentation](https://learn.microsoft.com/en-us/azure/devops/pipelines/library/service-endpoints)
- [Azure RBAC Documentation](https://learn.microsoft.com/en-us/azure/role-based-access-control/overview)
- [Service Principal Best Practices](https://learn.microsoft.com/en-us/azure/active-directory/develop/howto-create-service-principal-portal)
