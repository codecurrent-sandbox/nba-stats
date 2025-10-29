// API Container App
targetScope = 'resourceGroup'

@description('Name of the container app')
param appName string

@description('Location for the container app')
param location string

@description('Tags to apply to the resource')
param tags object

@description('Container Apps environment ID')
param containerAppsEnvironmentId string

@description('Container image to deploy')
param containerImage string

@description('Container registry name')
param containerRegistryName string

@description('Managed identity ID')
param managedIdentityId string

@description('Application Insights connection string')
@secure()
param appInsightsConnectionString string

@description('PostgreSQL connection string')
@secure()
param postgresConnectionString string

@description('NBA API Key secret URI from Key Vault')
param nbaApiKeySecretUri string

@description('NBA API Key value (used if secret URI is not available)')
@secure()
param nbaApiKey string = ''

@description('Minimum replicas')
param minReplicas int

@description('Maximum replicas')
param maxReplicas int

resource apiApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: appName
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentityId}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'
        allowInsecure: false
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
        corsPolicy: {
          allowedOrigins: [
            '*'
          ]
          allowedMethods: [
            'GET'
            'POST'
            'PUT'
            'DELETE'
            'OPTIONS'
          ]
          allowedHeaders: [
            '*'
          ]
        }
      }
      registries: [
        {
          server: '${containerRegistryName}.azurecr.io'
          identity: managedIdentityId
        }
      ]
      secrets: concat([
        {
          name: 'appinsights-connection-string'
          value: appInsightsConnectionString
        }
        {
          name: 'postgres-connection-string'
          value: postgresConnectionString
        }
      ], !empty(nbaApiKey) ? [
        {
          name: 'nba-api-key'
          value: nbaApiKey
        }
      ] : [
        {
          name: 'nba-api-key'
          keyVaultUrl: nbaApiKeySecretUri
          identity: managedIdentityId
        }
      ])
    }
    template: {
      containers: [
        {
          name: 'api'
          image: containerImage
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'PORT'
              value: '3000'
            }
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              secretRef: 'appinsights-connection-string'
            }
            {
              name: 'DATABASE_URL'
              secretRef: 'postgres-connection-string'
            }
            {
              name: 'NBA_API_KEY'
              secretRef: 'nba-api-key'
            }
            {
              name: 'CACHE_TTL_PLAYERS'
              value: '3600'
            }
            {
              name: 'CACHE_TTL_TEAMS'
              value: '86400'
            }
            {
              name: 'CACHE_TTL_GAMES'
              value: '1800'
            }
            {
              name: 'RATE_LIMIT_WINDOW_MS'
              value: '60000'
            }
            {
              name: 'RATE_LIMIT_MAX_REQUESTS'
              value: '100'
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 3000
              }
              initialDelaySeconds: 10
              periodSeconds: 10
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/health'
                port: 3000
              }
              initialDelaySeconds: 5
              periodSeconds: 5
            }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

output id string = apiApp.id
output name string = apiApp.name
output fqdn string = apiApp.properties.configuration.ingress.fqdn
output latestRevisionName string = apiApp.properties.latestRevisionName
