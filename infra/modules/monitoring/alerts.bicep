// Monitoring Alerts for Container Apps and Database
targetScope = 'resourceGroup'

@description('Location for alert rules')
param location string

@description('Tags to apply to resources')
param tags object

@description('Application Insights resource ID')
param appInsightsId string

@description('Container Apps to monitor')
param containerApps array

@description('PostgreSQL server resource ID')
param postgresServerId string

@description('Environment name')
param environment string

// Action Group for alert notifications
resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: 'nba-stats-${environment}-alerts'
  location: 'global'
  tags: tags
  properties: {
    groupShortName: 'NBAAlerts'
    enabled: true
    emailReceivers: []
    smsReceivers: []
    webhookReceivers: []
  }
}

// High CPU Alert for Container Apps
resource cpuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = [for app in containerApps: {
  name: '${app.name}-high-cpu'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when CPU usage exceeds 80%'
    severity: 2
    enabled: true
    scopes: [
      app.id
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighCPU'
          metricName: 'UsageNanoCores'
          operator: 'GreaterThan'
          threshold: 800000000
          timeAggregation: 'Average'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}]

// High Memory Alert for Container Apps
resource memoryAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = [for app in containerApps: {
  name: '${app.name}-high-memory'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when memory usage exceeds 80%'
    severity: 2
    enabled: true
    scopes: [
      app.id
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighMemory'
          metricName: 'WorkingSetBytes'
          operator: 'GreaterThan'
          threshold: 838860800
          timeAggregation: 'Average'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}]

// Failed Requests Alert
resource failedRequestsAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = [for app in containerApps: {
  name: '${app.name}-failed-requests'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when failed request rate exceeds 10%'
    severity: 1
    enabled: true
    scopes: [
      app.id
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighFailureRate'
          metricName: 'Requests'
          operator: 'GreaterThan'
          threshold: 10
          timeAggregation: 'Count'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}]

// PostgreSQL CPU Alert
resource postgresCpuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'postgres-high-cpu'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when PostgreSQL CPU usage exceeds 80%'
    severity: 2
    enabled: true
    scopes: [
      postgresServerId
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighCPU'
          metricName: 'cpu_percent'
          operator: 'GreaterThan'
          threshold: 80
          timeAggregation: 'Average'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// PostgreSQL Memory Alert
resource postgresMemoryAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'postgres-high-memory'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when PostgreSQL memory usage exceeds 80%'
    severity: 2
    enabled: true
    scopes: [
      postgresServerId
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighMemory'
          metricName: 'memory_percent'
          operator: 'GreaterThan'
          threshold: 80
          timeAggregation: 'Average'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

output actionGroupId string = actionGroup.id
output actionGroupName string = actionGroup.name
