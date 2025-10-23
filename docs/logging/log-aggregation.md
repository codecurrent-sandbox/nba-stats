# Centralized Log Aggregation Configuration

This directory contains configuration and documentation for centralized log aggregation for the NBA Stats application.

## Overview

Centralized log aggregation collects logs from all services (API, frontend, infrastructure) into a single location for:
- Unified monitoring and alerting
- Correlation across services
- Long-term storage and analysis
- Debugging distributed systems
- Compliance and auditing

## Supported Log Aggregation Services

### 1. Azure Application Insights (Recommended for Azure deployments)

**Advantages:**
- Native Azure integration
- Automatic correlation between services
- Built-in analytics and dashboards
- Application performance monitoring
- Cost-effective for Azure workloads

**Setup:**

1. Create Application Insights resource in Azure Portal
2. Get the connection string/instrumentation key
3. Configure services:

**API Service (Node.js):**
```typescript
import * as appInsights from 'applicationinsights';

appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
  .setAutoDependencyCorrelation(true)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true)
  .setAutoCollectExceptions(true)
  .setAutoCollectDependencies(true)
  .setAutoCollectConsole(true)
  .setUseDiskRetryCaching(true)
  .setSendLiveMetrics(true)
  .start();
```

**Frontend:**
```typescript
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
  config: {
    connectionString: process.env.REACT_APP_APPINSIGHTS_CONNECTION_STRING,
    enableAutoRouteTracking: true,
    enableCorsCorrelation: true,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true,
  }
});
appInsights.loadAppInsights();
```

**Environment Variables:**
```env
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx;IngestionEndpoint=https://xxx.in.applicationinsights.azure.com/
```

### 2. ELK Stack (Elasticsearch, Logstash, Kibana)

**Advantages:**
- Open source and self-hosted
- Powerful search and analytics
- Flexible data ingestion
- Extensive visualization options

**Setup:**

**Docker Compose Configuration:**
```yaml
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.10.0
    ports:
      - "5000:5000"
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
      - ./logstash/config:/usr/share/logstash/config
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.10.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  elasticsearch-data:
```

**Logstash Pipeline Configuration:**
```ruby
input {
  http {
    port => 5000
    codec => json
  }
}

filter {
  # Parse timestamp
  date {
    match => ["timestamp", "ISO8601"]
  }
  
  # Add fields
  mutate {
    add_field => { "environment" => "${ENVIRONMENT:development}" }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "nba-stats-%{+YYYY.MM.dd}"
  }
}
```

**API Service Integration:**
```typescript
import { logger } from './logging/logger';

// Configure HTTP transport to send to Logstash
const httpTransport = new winston.transports.Http({
  host: 'localhost',
  port: 5000,
  path: '/',
});
```

### 3. Splunk

**Advantages:**
- Enterprise-grade analytics
- Advanced security features
- Compliance reporting
- Machine learning capabilities

**Setup:**

**Splunk HTTP Event Collector (HEC):**
```typescript
import winston from 'winston';
import SplunkStreamEvent from 'winston-splunk-httplogger';

const splunkTransport = new SplunkStreamEvent({
  token: process.env.SPLUNK_TOKEN,
  host: process.env.SPLUNK_HOST,
  maxRetries: 3,
});

logger.add(splunkTransport);
```

**Environment Variables:**
```env
SPLUNK_TOKEN=your-hec-token
SPLUNK_HOST=splunk.example.com
SPLUNK_PORT=8088
```

### 4. Datadog

**Advantages:**
- Cloud-native monitoring
- APM and infrastructure monitoring
- Real-time alerting
- Multi-cloud support

**Setup:**

**API Service:**
```typescript
import tracer from 'dd-trace';

tracer.init({
  logInjection: true,
  runtimeMetrics: true,
});

// Winston integration
const ddTransport = new winston.transports.Http({
  host: 'http-intake.logs.datadoghq.com',
  path: `/v1/input/${process.env.DD_API_KEY}`,
  ssl: true,
});
```

**Frontend:**
```typescript
import { datadogLogs } from '@datadog/browser-logs';

datadogLogs.init({
  clientToken: process.env.REACT_APP_DD_CLIENT_TOKEN,
  site: 'datadoghq.com',
  forwardErrorsToLogs: true,
  sampleRate: 100,
});
```

## Log Format Standardization

All services should log in a consistent JSON format:

```json
{
  "timestamp": "2025-10-23T09:30:00.000Z",
  "level": "info",
  "service": "api",
  "environment": "production",
  "message": "HTTP Request",
  "requestId": "req-123",
  "userId": "user-456",
  "method": "GET",
  "url": "/api/players",
  "statusCode": 200,
  "duration": 45,
  "metadata": {
    "additional": "context"
  }
}
```

### Required Fields

- `timestamp`: ISO 8601 formatted timestamp
- `level`: Log level (error, warn, info, debug)
- `service`: Service name (api, frontend, database)
- `environment`: Environment (development, staging, production)
- `message`: Log message

### Optional Fields

- `requestId`: Request correlation ID
- `userId`: User identifier
- `sessionId`: Session identifier
- `traceId`: Distributed trace ID
- `spanId`: Span identifier
- `errorCode`: Application error code
- `stack`: Error stack trace

## Correlation IDs

Use correlation IDs to track requests across services:

**API Service (Express Middleware):**
```typescript
import { v4 as uuidv4 } from 'uuid';

export function correlationMiddleware(req, res, next) {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
}
```

**Frontend (Axios Interceptor):**
```typescript
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

axios.interceptors.request.use((config) => {
  const correlationId = uuidv4();
  config.headers['x-correlation-id'] = correlationId;
  return config;
});
```

## Retention Policies

Configure appropriate retention policies based on environment:

| Environment | Retention Period | Sampling Rate |
|-------------|------------------|---------------|
| Development | 7 days           | 100%          |
| Staging     | 30 days          | 100%          |
| Production  | 90 days          | 50-100%       |

## Alerting Rules

Set up alerts for critical events:

### Error Rate Alerts
- **Condition**: Error rate > 5% of total requests
- **Duration**: 5 minutes
- **Severity**: High

### Slow Response Alerts
- **Condition**: P95 latency > 2 seconds
- **Duration**: 10 minutes
- **Severity**: Medium

### Service Availability
- **Condition**: Health check failures
- **Duration**: 2 minutes
- **Severity**: Critical

### Failed Authentication
- **Condition**: > 10 failed auth attempts in 5 minutes
- **Duration**: 5 minutes
- **Severity**: High

## Dashboards

Create dashboards for monitoring:

### Application Health Dashboard
- Total requests per minute
- Error rate percentage
- Average response time
- Service availability

### Error Analysis Dashboard
- Error count by type
- Error rate trend
- Top errors by frequency
- Error distribution by service

### Performance Dashboard
- Request latency (P50, P95, P99)
- Database query performance
- Cache hit/miss ratio
- API endpoint performance

### User Activity Dashboard
- Active users
- User actions
- Page views
- User journey analysis

## Best Practices

1. **Structured Logging**: Always use JSON format for machine parsing
2. **Consistent Fields**: Use standardized field names across services
3. **Correlation IDs**: Track requests across service boundaries
4. **Log Levels**: Use appropriate log levels (ERROR, WARN, INFO, DEBUG)
5. **Sampling**: Sample high-volume logs in production
6. **PII Protection**: Never log sensitive personal data
7. **Cost Management**: Monitor ingestion costs and adjust sampling
8. **Index Management**: Rotate and archive old logs
9. **Security**: Secure log transmission with TLS
10. **Testing**: Test logging in development before production

## Security Considerations

- Use TLS/SSL for log transmission
- Encrypt logs at rest
- Implement access controls
- Audit log access
- Redact sensitive data before logging
- Comply with data retention regulations (GDPR, HIPAA)

## Cost Optimization

- Implement log sampling for high-volume services
- Use appropriate retention periods
- Archive old logs to cheaper storage
- Filter out debug logs in production
- Compress logs before transmission
- Use log aggregation to deduplicate

## Monitoring Log Health

Monitor the logging system itself:
- Log ingestion rate
- Log pipeline failures
- Storage capacity
- Query performance
- Alert delivery

## Troubleshooting

### Logs Not Appearing
1. Check network connectivity
2. Verify authentication credentials
3. Check log level configuration
4. Review sampling rate
5. Check service health

### High Log Volume
1. Increase sampling rate
2. Filter debug logs
3. Optimize logging frequency
4. Review noisy components

### Missing Correlation
1. Verify correlation ID propagation
2. Check header forwarding
3. Review middleware configuration
4. Test with trace IDs

## Migration Plan

If migrating from one log aggregation service to another:

1. Set up new service in parallel
2. Configure dual logging temporarily
3. Validate new service works correctly
4. Switch primary service
5. Monitor for issues
6. Decommission old service after validation period
