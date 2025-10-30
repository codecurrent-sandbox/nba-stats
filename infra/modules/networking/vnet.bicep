// Virtual Network with subnets for Container Apps, PostgreSQL, and Private Endpoints
targetScope = 'resourceGroup'

@description('Name of the virtual network')
param vnetName string

@description('Location for the virtual network')
param location string

@description('Tags to apply to resources')
param tags object

@description('Virtual network address prefix')
param vnetAddressPrefix string

@description('Container Apps subnet address prefix')
param containerAppsSubnetPrefix string

@description('PostgreSQL subnet address prefix')
param postgresSubnetPrefix string

@description('Private endpoints subnet address prefix')
param privateEndpointsSubnetPrefix string

@description('Additional services subnet address prefix')
param servicesSubnetPrefix string

@description('Enable private endpoints for resources')
param enablePrivateEndpoints bool = false

// Network Security Group for Container Apps
resource containerAppsNsg 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: '${vnetName}-containerApps-nsg'
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'AllowHTTPSInbound'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: '*'
        }
      }
      {
        name: 'AllowHTTPInbound'
        properties: {
          priority: 110
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '80'
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: '*'
        }
      }
    ]
  }
}

// Network Security Group for PostgreSQL
resource postgresNsg 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: '${vnetName}-postgres-nsg'
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'AllowPostgreSQLFromVNet'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '5432'
          sourceAddressPrefix: 'VirtualNetwork'
          destinationAddressPrefix: '*'
        }
      }
    ]
  }
}

// Network Security Group for Private Endpoints (only if private endpoints enabled)
resource privateEndpointsNsg 'Microsoft.Network/networkSecurityGroups@2023-05-01' = if (enablePrivateEndpoints) {
  name: '${vnetName}-privateEndpoints-nsg'
  location: location
  tags: tags
  properties: {
    securityRules: []
  }
}

// Base subnets (always created)
var baseSubnets = [
  {
    name: 'containerAppsSubnet'
    properties: {
      addressPrefix: containerAppsSubnetPrefix
      networkSecurityGroup: {
        id: containerAppsNsg.id
      }
      // Container Apps Environment will handle delegation automatically
      delegations: []
    }
  }
  {
    name: 'postgresSubnet'
    properties: {
      addressPrefix: postgresSubnetPrefix
      networkSecurityGroup: {
        id: postgresNsg.id
      }
      delegations: [
        {
          name: 'Microsoft.DBforPostgreSQL/flexibleServers'
          properties: {
            serviceName: 'Microsoft.DBforPostgreSQL/flexibleServers'
          }
        }
      ]
    }
  }
  {
    name: 'servicesSubnet'
    properties: {
      addressPrefix: servicesSubnetPrefix
    }
  }
]

// Private endpoints subnet (only created when enabled)
var privateEndpointsSubnet = [
  {
    name: 'privateEndpointsSubnet'
    properties: {
      addressPrefix: privateEndpointsSubnetPrefix
      networkSecurityGroup: {
        id: privateEndpointsNsg.id
      }
      privateEndpointNetworkPolicies: 'Disabled'
    }
  }
]

// Virtual Network
resource vnet 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: vnetName
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        vnetAddressPrefix
      ]
    }
    subnets: enablePrivateEndpoints ? union(baseSubnets, privateEndpointsSubnet) : baseSubnets
  }
}

output vnetId string = vnet.id
output vnetName string = vnet.name
output containerAppsSubnetId string = vnet.properties.subnets[0].id
output postgresSubnetId string = vnet.properties.subnets[1].id
// When private endpoints enabled: [containerApps, postgres, services, privateEndpoints]
// When disabled: [containerApps, postgres, services]
output privateEndpointsSubnetId string = enablePrivateEndpoints ? vnet.properties.subnets[3].id : ''
output servicesSubnetId string = vnet.properties.subnets[2].id
