// NBA Stats Application - Main Infrastructure Orchestration
// Deploys all Azure resources for the NBA Stats application

targetScope = 'subscription'

metadata description = 'NBA Stats Application - Azure Infrastructure'

// ============================================================================
// PARAMETERS
// ============================================================================

@description('Environment name (dev, test, prod)')
@allowed(['dev', 'test', 'prod'])
param environment string

@description('Application name')
param appName string = 'nba-stats'

@description('Azure region for resources')
param location string = 'swedencentral'

@description('Tags to apply to all resources')
param tags object = {
  application: 'nba-stats'
  environment: environment
  managedBy: 'bicep'
}

// Networking Parameters
@description('Virtual Network address prefix')
param vnetAddressPrefix string = '10.0.0.0/16'

@description('Container Apps subnet address prefix')
param containerAppsSubnetPrefix string = '10.0.0.0/23'

@description('PostgreSQL subnet address prefix')
param postgresSubnetPrefix string = '10.0.2.0/24'

@description('Private endpoints subnet address prefix')
param privateEndpointsSubnetPrefix string = '10.0.3.0/24'

@description('Additional services subnet address prefix')
param servicesSubnetPrefix string = '10.0.4.0/24'

// Database Parameters
@description('PostgreSQL administrator username')
param postgresAdminUsername string = 'nbastatsadmin'

@description('PostgreSQL administrator password')
@secure()
param postgresAdminPassword string

@description('PostgreSQL SKU name')
param postgresSku string = environment == 'prod' ? 'Standard_D2ds_v4' : 'Standard_B1ms'

@description('PostgreSQL storage size in GB')
param postgresStorageGB int = environment == 'prod' ? 128 : 32

// Container Apps Parameters
@description('Frontend container image')
param frontendImage string = ''

@description('API container image')
param apiImage string = ''

@description('Minimum replica count for Container Apps')
param minReplicas int = environment == 'prod' ? 2 : 1

@description('Maximum replica count for Container Apps')
param maxReplicas int = environment == 'prod' ? 10 : 3

// NBA API Configuration
@description('NBA API Key from BallDontLie')
@secure()
param nbaApiKey string = ''

@description('Azure DevOps Service Principal Object ID for Key Vault access during deployment')
param azureDevOpsServicePrincipalId string = ''

// Feature Flags
@description('Enable private endpoints (recommended for production)')
param enablePrivateEndpoints bool = environment == 'prod'

@description('Enable zone redundancy (production only)')
param enableZoneRedundancy bool = environment == 'prod'

// ============================================================================
// RESOURCE GROUP
// ============================================================================

var resourceGroupName = 'rg-${appName}-${environment}'

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

// ============================================================================
// VARIABLES
// ============================================================================

var resourcePrefix = '${appName}-${environment}'
var uniqueSuffix = uniqueString(rg.id)
var containerRegistryName = replace('${resourcePrefix}acr${uniqueSuffix}', '-', '')
// Key Vault name must be 3-24 chars. Using 'kv' prefix and unique suffix to keep it short
// Use resource group ID only (not deployment name) for stable naming across deployments
// Max length: kv-nba-stats-test- (18) + v2- (3) + 4 chars = 25 chars - adjusted to fit 24 char limit
// Temporary v2 suffix added to avoid conflicts with soft-deleted vaults that have purge protection
var keyVaultName = 'kv-${appName}-${environment}-v2-${take(uniqueString(rg.id), 3)}'
var logAnalyticsName = '${resourcePrefix}-logs'
var appInsightsName = '${resourcePrefix}-ai'
var managedIdentityName = '${resourcePrefix}-identity'
var containerEnvName = '${resourcePrefix}-env'
var postgresServerName = '${resourcePrefix}-pg-${uniqueSuffix}'
var vnetName = '${resourcePrefix}-vnet'

// ============================================================================
// MODULES
// ============================================================================

// 1. Managed Identity (required first for RBAC assignments)
module identity 'modules/identity/managed-identity.bicep' = {
  scope: rg
  name: 'deploy-identity'
  params: {
    name: managedIdentityName
    location: location
    tags: tags
  }
}

// 2. Networking Infrastructure
module networking 'modules/networking/vnet.bicep' = {
  scope: rg
  name: 'deploy-networking'
  params: {
    vnetName: vnetName
    location: location
    tags: tags
    vnetAddressPrefix: vnetAddressPrefix
    containerAppsSubnetPrefix: containerAppsSubnetPrefix
    postgresSubnetPrefix: postgresSubnetPrefix
    privateEndpointsSubnetPrefix: privateEndpointsSubnetPrefix
    servicesSubnetPrefix: servicesSubnetPrefix
    enablePrivateEndpoints: enablePrivateEndpoints
  }
}

// 3. Monitoring & Logging
module monitoring 'modules/monitoring/log-analytics.bicep' = {
  scope: rg
  name: 'deploy-monitoring'
  params: {
    logAnalyticsName: logAnalyticsName
    appInsightsName: appInsightsName
    location: location
    tags: tags
  }
}

// 4. Key Vault for Secrets Management
module keyVault 'modules/secrets/key-vault.bicep' = {
  scope: rg
  name: 'deploy-keyvault'
  params: {
    keyVaultName: keyVaultName
    location: location
    tags: tags
    enablePrivateEndpoint: enablePrivateEndpoints
    privateEndpointSubnetId: enablePrivateEndpoints ? networking.outputs.privateEndpointsSubnetId : ''
    vnetId: networking.outputs.vnetId
    privateDnsZoneId: networking.outputs.keyVaultPrivateDnsZoneId
    managedIdentityPrincipalId: identity.outputs.principalId
    azureDevOpsServicePrincipalId: azureDevOpsServicePrincipalId
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
    nbaApiKey: nbaApiKey
    enablePurgeProtection: environment == 'prod'  // Only enable purge protection in production
  }
}

// 5. Azure Container Registry
module containerRegistry 'modules/registry/container-registry.bicep' = {
  scope: rg
  name: 'deploy-acr'
  params: {
    registryName: containerRegistryName
    location: location
    tags: tags
    sku: environment == 'prod' ? 'Premium' : 'Basic'
    managedIdentityPrincipalId: identity.outputs.principalId
  }
}

// 6. PostgreSQL Database
module database 'modules/database/postgres.bicep' = {
  scope: rg
  name: 'deploy-database'
  params: {
    serverName: postgresServerName
    location: location
    tags: tags
    administratorLogin: postgresAdminUsername
    administratorLoginPassword: postgresAdminPassword
    skuName: postgresSku
    storageSizeGB: postgresStorageGB
    version: '16'
    enablePrivateEndpoint: enablePrivateEndpoints
    postgresSubnetId: networking.outputs.postgresSubnetId
    vnetId: networking.outputs.vnetId
    enableZoneRedundancy: enableZoneRedundancy
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
  }
}

// 7. Container Apps Environment
module containerAppsEnv 'modules/container-apps/environment.bicep' = {
  scope: rg
  name: 'deploy-containerenv'
  params: {
    environmentName: containerEnvName
    location: location
    tags: tags
    infrastructureSubnetId: networking.outputs.containerAppsSubnetId
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
    enableZoneRedundancy: enableZoneRedundancy
  }
}

// 8. API Container App
module apiApp 'modules/container-apps/api-app.bicep' = {
  scope: rg
  name: 'deploy-api-app'
  params: {
    appName: '${resourcePrefix}-api'
    location: location
    tags: tags
    containerAppsEnvironmentId: containerAppsEnv.outputs.environmentId
    containerImage: !empty(apiImage) ? apiImage : 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
    containerRegistryName: containerRegistryName
    managedIdentityId: identity.outputs.id
    appInsightsConnectionString: monitoring.outputs.appInsightsConnectionString
    postgresConnectionString: 'Host=${database.outputs.serverFqdn};Database=nba_stats;Username=${postgresAdminUsername};Password=${postgresAdminPassword};SSL Mode=Require'
    nbaApiKeySecretUri: '${keyVault.outputs.keyVaultUri}secrets/NBA-API-KEY'
    nbaApiKey: nbaApiKey
    minReplicas: minReplicas
    maxReplicas: maxReplicas
  }
  dependsOn: [
    containerRegistry
    keyVault
  ]
}

// 9. Frontend Container App
module frontendApp 'modules/container-apps/frontend-app.bicep' = {
  scope: rg
  name: 'deploy-frontend-app'
  params: {
    appName: '${resourcePrefix}-frontend'
    location: location
    tags: tags
    containerAppsEnvironmentId: containerAppsEnv.outputs.environmentId
    containerImage: !empty(frontendImage) ? frontendImage : 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
    containerRegistryName: containerRegistryName
    managedIdentityId: identity.outputs.id
    apiUrl: 'https://${apiApp.outputs.fqdn}'
    appInsightsConnectionString: monitoring.outputs.appInsightsConnectionString
    minReplicas: minReplicas
    maxReplicas: maxReplicas
  }
  dependsOn: [
    containerRegistry
  ]
}

// 10. Alerts and Monitoring
module alerts 'modules/monitoring/alerts.bicep' = {
  scope: rg
  name: 'deploy-alerts'
  params: {
    tags: tags
    containerApps: [
      {
        name: apiApp.outputs.name
        id: apiApp.outputs.id
      }
      {
        name: frontendApp.outputs.name
        id: frontendApp.outputs.id
      }
    ]
    postgresServerId: database.outputs.serverId
    environment: environment
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output resourceGroupName string = rg.name
output location string = location
output environment string = environment

// Identity
output managedIdentityId string = identity.outputs.id
output managedIdentityClientId string = identity.outputs.clientId
output managedIdentityPrincipalId string = identity.outputs.principalId

// Networking
output vnetId string = networking.outputs.vnetId
output vnetName string = networking.outputs.vnetName

// Monitoring
output logAnalyticsWorkspaceId string = monitoring.outputs.logAnalyticsWorkspaceId
output appInsightsId string = monitoring.outputs.appInsightsId
output appInsightsInstrumentationKey string = monitoring.outputs.appInsightsInstrumentationKey
output appInsightsConnectionString string = monitoring.outputs.appInsightsConnectionString

// Secrets
output keyVaultName string = keyVault.outputs.keyVaultName
output keyVaultUri string = keyVault.outputs.keyVaultUri

// Container Registry
output containerRegistryName string = containerRegistry.outputs.name
output containerRegistryLoginServer string = containerRegistry.outputs.loginServer

// Database
output postgresServerName string = database.outputs.serverName
output postgresServerFqdn string = database.outputs.serverFqdn
output postgresDatabaseName string = database.outputs.databaseName

// Container Apps
output containerAppsEnvironmentId string = containerAppsEnv.outputs.environmentId
output containerAppsEnvironmentName string = containerAppsEnv.outputs.environmentName

output apiFqdn string = apiApp.outputs.fqdn
output apiUrl string = 'https://${apiApp.outputs.fqdn}'
output apiName string = apiApp.outputs.name

output frontendFqdn string = frontendApp.outputs.fqdn
output frontendUrl string = 'https://${frontendApp.outputs.fqdn}'
output frontendName string = frontendApp.outputs.name
