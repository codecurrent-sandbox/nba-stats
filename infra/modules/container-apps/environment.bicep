// Container Apps Environment
targetScope = 'resourceGroup'

@description('Name of the Container Apps environment')
param environmentName string

@description('Location for the environment')
param location string

@description('Tags to apply to the resource')
param tags object

@description('Infrastructure subnet ID for Container Apps (optional)')
param infrastructureSubnetId string = ''

@description('Log Analytics workspace ID')
param logAnalyticsWorkspaceId string

@description('Enable zone redundancy')
param enableZoneRedundancy bool

resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: environmentName
  location: location
  tags: tags
  properties: {
    vnetConfiguration: !empty(infrastructureSubnetId) ? {
      infrastructureSubnetId: infrastructureSubnetId
    } : null
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: reference(logAnalyticsWorkspaceId, '2022-10-01').customerId
        sharedKey: listKeys(logAnalyticsWorkspaceId, '2022-10-01').primarySharedKey
      }
    }
    zoneRedundant: enableZoneRedundancy
  }
}

output environmentId string = containerAppsEnvironment.id
output environmentName string = containerAppsEnvironment.name
output defaultDomain string = containerAppsEnvironment.properties.defaultDomain
output staticIp string = containerAppsEnvironment.properties.staticIp
