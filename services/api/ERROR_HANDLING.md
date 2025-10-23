# API Error Handling

## HTTP Status Codes

### Success Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful, returning data |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request successful, no content to return |

### Client Error Codes

| Code | Status | Description |
|------|--------|-------------|
| 400 | Bad Request | Invalid parameters or malformed request |
| 401 | Unauthorized | Authentication required or invalid credentials |
| 403 | Forbidden | Authenticated but not authorized for resource |
| 404 | Not Found | Requested resource does not exist |
| 409 | Conflict | Request conflicts with existing data |
| 422 | Unprocessable Entity | Request validation failed |
| 429 | Too Many Requests | Rate limit exceeded |

### Server Error Codes

| Code | Status | Description |
|------|--------|-------------|
| 500 | Internal Server Error | Unexpected server error |
| 502 | Bad Gateway | Service unavailable |
| 503 | Service Unavailable | Server temporarily unavailable |

## Error Response Format

All error responses follow this standard format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "timestamp": "2025-10-23T07:57:00Z",
    "path": "/api/resource",
    "details": {
      "field": "fieldName",
      "issue": "Detailed issue description"
    }
  }
}
```

## Common Error Codes

### Validation Errors (400)

```
INVALID_PARAMETER - Required parameter missing or invalid format
INVALID_UUID - UUID format validation failed
INVALID_DATE - Date format validation failed
MISSING_FIELD - Required field is missing
```

### Not Found Errors (404)

```
PLAYER_NOT_FOUND - Player with given ID does not exist
TEAM_NOT_FOUND - Team with given ID does not exist
GAME_NOT_FOUND - Game with given ID does not exist
RESOURCE_NOT_FOUND - Generic resource not found
```

### Authentication/Authorization Errors (401/403)

```
UNAUTHORIZED - Missing or invalid authentication token
FORBIDDEN - Insufficient permissions for resource
EXPIRED_TOKEN - Authentication token has expired
```

### Business Logic Errors (422)

```
DUPLICATE_RESOURCE - Resource already exists
INVALID_STATE_TRANSITION - Operation not allowed in current state
BUSINESS_RULE_VIOLATION - Request violates business rules
```

### Rate Limit Errors (429)

```
RATE_LIMIT_EXCEEDED - Too many requests in time window
```

## Example Error Responses

### Invalid Parameter

```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Invalid limit parameter",
    "timestamp": "2025-10-23T07:57:00Z",
    "path": "/api/players",
    "details": {
      "field": "limit",
      "issue": "limit must be between 1 and 100"
    }
  }
}
```

### Resource Not Found

```json
{
  "error": {
    "code": "PLAYER_NOT_FOUND",
    "message": "Player not found",
    "timestamp": "2025-10-23T07:57:00Z",
    "path": "/api/players/invalid-uuid",
    "details": {
      "playerId": "invalid-uuid"
    }
  }
}
```

### Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authentication token",
    "timestamp": "2025-10-23T07:57:00Z",
    "path": "/api/protected-resource"
  }
}
```

### Server Error

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred",
    "timestamp": "2025-10-23T07:57:00Z",
    "path": "/api/resource",
    "details": {
      "requestId": "req-12345-67890"
    }
  }
}
```

## Error Handling Best Practices

1. **Always include timestamp** - Helps with debugging and log correlation
2. **Provide error codes** - Clients can programmatically handle specific errors
3. **Include request path** - Identifies which endpoint failed
4. **Add context in details** - Additional information for debugging
5. **Use appropriate HTTP status codes** - Follow HTTP specifications
6. **Don't expose internal details** - Keep error messages user-friendly in production
7. **Implement retryable logic** - Mark which errors are safe to retry

## Client Error Handling Guidelines

- Catch and handle specific error codes
- Implement exponential backoff for 429/503 errors
- Log all 4xx errors for debugging
- Implement circuit breaker for 5xx errors
- Provide user-friendly error messages to UI
