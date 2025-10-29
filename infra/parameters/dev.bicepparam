// Development Environment Parameters for NBA Stats Application
using '../main.bicep'

param environment = 'dev'
param location = 'swedencentral'
param appName = 'nba-stats'

// Networking - Dev uses smaller address spaces
param vnetAddressPrefix = '10.0.0.0/16'
param containerAppsSubnetPrefix = '10.0.0.0/23'
param postgresSubnetPrefix = '10.0.2.0/24'
param privateEndpointsSubnetPrefix = '10.0.3.0/24'
param servicesSubnetPrefix = '10.0.4.0/24'

// Database - Dev uses minimal SKU
param postgresAdminUsername = 'nbastatsadmin'
param postgresAdminPassword = ''
param postgresSku = 'Standard_B1ms'
param postgresStorageGB = 32

// Container Apps - Dev uses default placeholder images initially
param frontendImage = ''
param apiImage = ''
param minReplicas = 1
param maxReplicas = 3

// NBA API Key - Will be prompted during deployment
param nbaApiKey = ''

// Feature Flags - Dev doesn't use private endpoints
param enablePrivateEndpoints = false
param enableZoneRedundancy = false
