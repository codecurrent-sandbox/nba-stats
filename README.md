# nba-stats

Simple site to display some stats about the NBA

## Architecture

### Project Structure

```
nba-stats/
├── frontend/          # React/Vue frontend application
├── services/
│   └── api/          # REST API services
├── infra/            # Infrastructure and deployment configs
├── docs/             # Project documentation
├── scripts/          # Utility scripts
└── tests/            # Test suites
```

### Components

- **Frontend**: Web interface for displaying NBA statistics
- **API Services**: Backend services providing data endpoints
- **Infrastructure**: Deployment and infrastructure configurations
- **Documentation**: Project guides and specifications
- **Scripts**: Development and deployment utilities
- **Tests**: Automated testing suites

## Logging and Monitoring

This project implements comprehensive logging and error tracking across all services.

### Logging Architecture

- **API Service**: Structured logging with Winston
- **Frontend**: Browser-based logging with error tracking
- **Log Aggregation**: ELK stack (Elasticsearch, Logstash, Kibana) for centralized logging

### API Service Logging

Located in `services/api/src/logging/`

#### Installation

```bash
cd services/api
npm install winston
npm install --save-dev @types/node
```

#### Usage

```typescript
import { initLogger } from './logging/logger';
import { getLoggerConfigWithOverrides } from './logging/config';

// Initialize on startup
initLogger(getLoggerConfigWithOverrides());

// Use logger
import { logger } from './logging/logger';

logger.info('Application started');
logger.error('Error occurred', { error: err.message });
logger.http({ method: 'GET', url: '/api/players', statusCode: 200, duration: 45 });
```

#### Configuration

Environment variables:
- `LOG_LEVEL`: error, warn, info, debug, trace
- `LOG_FORMAT`: json, text
- `LOG_FILE_PATH`: Path for file logging
- `LOG_HTTP_ENDPOINT`: Remote logging endpoint

### Frontend Logging

Located in `frontend/src/logging/`

#### Installation

```bash
cd frontend
# For Application Insights
npm install @microsoft/applicationinsights-web

# OR for Sentry
npm install @sentry/browser @sentry/tracing
```

#### Usage

```typescript
import { initLogger } from './logging/logger';
import { getLoggerConfig } from './logging/config';

// Initialize on app startup
initLogger(getLoggerConfig());

// Use logger
import { logger } from './logging/logger';

logger.info('User logged in', { userId: '123' });
logger.error('API call failed', { url: '/api/players', statusCode: 500 });
logger.trackPageView('Player Details', { playerId: '123' });
logger.trackAction('Button Click', { buttonName: 'Add to Cart' });
```

#### Error Boundary

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from './logging/logger';

class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('React Error Boundary', {
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      severity: 'critical'
    });
  }

  render() {
    return this.state.hasError ? <h1>Error occurred</h1> : this.props.children;
  }
}
```

#### Configuration

Environment variables:
- `REACT_APP_APPINSIGHTS_CONNECTION_STRING`: Application Insights connection
- `REACT_APP_SENTRY_DSN`: Sentry DSN
- `REACT_APP_LOG_ENDPOINT`: Custom log endpoint
- `REACT_APP_ENV`: Environment (development, staging, production)

### Centralized Log Aggregation

Located in `docs/logging/`

#### Quick Start with ELK Stack

```bash
cd docs/logging
docker-compose -f docker-compose.elk.yml up -d
```

This starts:
- **Elasticsearch** (9200): Log storage and search
- **Logstash** (5000): Log processing
- **Kibana** (5601): Log visualization
- **Filebeat**: Docker log collection

#### Access Kibana Dashboard

Open http://localhost:5601 in your browser

#### Configure Services to Send Logs

**API Service:**
```typescript
// config.ts
export const productionConfig: LoggerConfig = {
  enableHttp: true,
  httpEndpoint: 'http://logstash:5000'
};
```

**Frontend:**
```typescript
// config.ts
export const productionConfig: LoggerConfig = {
  enableRemote: true,
  remoteEndpoint: 'http://logstash:5000'
};
```

### Log Structure

All logs follow a consistent JSON structure:

```json
{
  "timestamp": "2025-10-23T09:30:45Z",
  "level": "info",
  "message": "HTTP Request",
  "requestId": "req-abc123",
  "service": "api",
  "environment": "production",
  "metadata": {
    "method": "GET",
    "url": "/api/players",
    "statusCode": 200,
    "duration": 45
  }
}
```

### Log Levels

1. **error**: Critical errors requiring immediate attention
2. **warn**: Warning messages for potentially harmful situations
3. **info**: General informational messages
4. **debug**: Detailed debugging information (development only)
5. **trace**: Most detailed execution tracing

### Best Practices

- ✅ Use appropriate log levels
- ✅ Include correlation IDs (requestId, userId)
- ✅ Log structured metadata, not concatenated strings
- ✅ Track important user actions and API calls
- ❌ Never log sensitive data (passwords, tokens, PII)
- ❌ Avoid excessive logging in hot paths
- ❌ Don't log in tight loops

### Monitoring and Alerts

Set up alerts in Kibana or your monitoring service for:
- High error rates (>5% of requests)
- Slow API responses (>2 seconds)
- Failed authentication attempts
- Database connection failures
- 5xx status codes
