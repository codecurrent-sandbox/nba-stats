// Test Environment Parameters for NBA Stats Application
using '../main.bicep'

param environment = 'test'
param location = 'swedencentral'
param appName = 'nba-stats'

// Networking - Test uses standard address spaces
param vnetAddressPrefix = '10.1.0.0/16'
param containerAppsSubnetPrefix = '10.1.0.0/23'
param postgresSubnetPrefix = '10.1.2.0/24'
param privateEndpointsSubnetPrefix = '10.1.3.0/24'
param servicesSubnetPrefix = '10.1.4.0/24'

// Database - Test uses production-like SKU
param postgresAdminUsername = 'nbastatsadmin'
param postgresAdminPassword = ''
param postgresSku = 'Standard_D2ds_v4'
param postgresStorageGB = 64

// Container Apps - Test uses production-like configuration
param frontendImage = ''
param apiImage = ''
param minReplicas = 2
param maxReplicas = 5

// NBA API Key
param nbaApiKey = ''

// Feature Flags - Test uses private endpoints but no zone redundancy
param enablePrivateEndpoints = true
param enableZoneRedundancy = false
