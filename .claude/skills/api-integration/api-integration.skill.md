# API Integration Patterns Skill

Build robust API clients with proper error handling, retry logic, caching, and rate limiting for third-party API integrations.

## Purpose
Provide a comprehensive guide for implementing resilient API clients that handle failures gracefully, optimize performance through caching, and respect API limits.

## Core Components

### 1. Error Handling Strategies
- Network error detection and classification
- HTTP status code handling (4xx, 5xx)
- Timeout management
- Graceful degradation mechanisms
- Logging and monitoring setup

### 2. Retry Logic with Exponential Backoff
- Configurable retry attempts
- Exponential backoff algorithm
- Jitter implementation to prevent thundering herd
- Retry conditions based on error types
- Circuit breaker pattern implementation

### 3. Response Caching
- Cache expiration strategies
- Cache invalidation mechanisms
- Conditional requests (ETag/Last-Modified)
- Memory vs disk caching options
- Cache warming strategies

### 4. Rate Limiting Best Practices
- Token bucket algorithm implementation
- Leaky bucket algorithm options
- Client-side rate limiting
- Server-side rate limit detection
- Adaptive rate limiting based on server responses

## Implementation Approach
- Follow REST API best practices
- Implement async/await patterns for better performance
- Use promises/futures for concurrent requests
- Include proper request/response logging
- Add metrics collection for monitoring

## Technology Agnostic Patterns
- Language-agnostic design principles
- Framework-agnostic implementation patterns
- Platform-independent configurations
- Standardized error responses

## Security Considerations
- Secure credential handling
- Request signing where required
- TLS/SSL best practices
- Input sanitization and validation