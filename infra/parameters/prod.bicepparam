// Production Environment Parameters for NBA Stats Application
using '../main.bicep'

param environment = 'prod'
param location = 'swedencentral'
param appName = 'nba-stats'

// Networking - Production uses standard address spaces in different range
param vnetAddressPrefix = '10.2.0.0/16'
param containerAppsSubnetPrefix = '10.2.0.0/23'
param postgresSubnetPrefix = '10.2.2.0/24'
param privateEndpointsSubnetPrefix = '10.2.3.0/24'
param servicesSubnetPrefix = '10.2.4.0/24'

// Database - Production uses high-performance SKU
param postgresAdminUsername = 'nbastatsadmin'
param postgresAdminPassword = ''
param postgresSku = 'Standard_D2ds_v4'
param postgresStorageGB = 128

// Container Apps - Production uses high availability settings
param frontendImage = ''
param apiImage = ''
param minReplicas = 2
param maxReplicas = 10

// NBA API Key
param nbaApiKey = ''

// Feature Flags - Production uses high availability but keeps networking simple
param enablePrivateEndpoints = false
param enableZoneRedundancy = true
