// Frontend Container App
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

@description('API URL')
param apiUrl string

@description('Application Insights connection string')
@secure()
param appInsightsConnectionString string

@description('Minimum replicas')
param minReplicas int

@description('Maximum replicas')
param maxReplicas int

resource frontendApp 'Microsoft.App/containerApps@2023-05-01' = {
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
        targetPort: 80
        transport: 'http'
        allowInsecure: false
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
      registries: [
        {
          server: '${containerRegistryName}.azurecr.io'
          identity: managedIdentityId
        }
      ]
      secrets: [
        {
          name: 'appinsights-connection-string'
          value: appInsightsConnectionString
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'frontend'
          image: containerImage
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'VITE_API_URL'
              value: apiUrl
            }
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              secretRef: 'appinsights-connection-string'
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/'
                port: 80
              }
              initialDelaySeconds: 10
              periodSeconds: 10
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/'
                port: 80
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
                concurrentRequests: '100'
              }
            }
          }
        ]
      }
    }
  }
}

output id string = frontendApp.id
output name string = frontendApp.name
output fqdn string = frontendApp.properties.configuration.ingress.fqdn
output latestRevisionName string = frontendApp.properties.latestRevisionName
