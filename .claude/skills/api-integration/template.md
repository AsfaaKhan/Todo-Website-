# API Integration Patterns Template

## Error Handling Strategy

```javascript
class ApiErrorHandler {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.timeout = options.timeout || 10000;
    this.logger = options.logger || console;
  }

  // Classify different types of errors
  classifyError(error) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return { type: 'TIMEOUT', retryable: true };
    }

    if (error.response) {
      const status = error.response.status;
      if (status >= 500) {
        return { type: 'SERVER_ERROR', retryable: true };
      } else if (status === 429) {
        return { type: 'RATE_LIMITED', retryable: true };
      } else if (status >= 400 && status < 500) {
        return { type: 'CLIENT_ERROR', retryable: false };
      }
    }

    return { type: 'NETWORK_ERROR', retryable: true };
  }

  async handleRequest(requestFn) {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await Promise.race([
          requestFn(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), this.timeout)
          )
        ]);

        return response;
      } catch (error) {
        lastError = error;
        const errorInfo = this.classifyError(error);

        if (!errorInfo.retryable || attempt === this.maxRetries) {
          this.logger.error(`API request failed after ${attempt} attempts:`, error.message);
          throw error;
        }

        this.logger.warn(`Attempt ${attempt + 1} failed, retrying...`, error.message);
        await this.waitBeforeRetry(attempt);
      }
    }

    throw lastError;
  }

  async waitBeforeRetry(attempt) {
    // Exponential backoff with jitter
    const baseDelay = Math.pow(2, attempt) * 1000; // Start with 1 second
    const jitter = Math.random() * 1000; // Add up to 1 second of randomness
    const delay = baseDelay + jitter;

    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
```

## Retry Logic with Exponential Backoff

```javascript
class RetryManager {
  constructor(options = {}) {
    this.baseDelay = options.baseDelay || 1000; // 1 second
    this.maxDelay = options.maxDelay || 30000; // 30 seconds
    this.maxRetries = options.maxRetries || 5;
    this.jitter = options.jitter || true;
    this.multiplier = options.multiplier || 2;
  }

  async executeWithRetry(operation, shouldRetry) {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === this.maxRetries) {
          break;
        }

        if (!shouldRetry(error, attempt)) {
          throw error;
        }

        const delay = this.calculateDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  calculateDelay(attempt) {
    let delay = this.baseDelay * Math.pow(this.multiplier, attempt);
    delay = Math.min(delay, this.maxDelay);

    if (this.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5); // Add 50-100% of delay randomly
    }

    return Math.floor(delay);
  }
}
```

## Response Caching

```javascript
class ApiResponseCache {
  constructor(options = {}) {
    this.ttl = options.ttl || 300000; // 5 minutes default
    this.maxSize = options.maxSize || 1000;
    this.storage = new Map(); // Simple in-memory storage
    this.cleanupInterval = options.cleanupInterval || 60000; // 1 minute

    // Start cleanup interval
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  async get(key) {
    const cached = this.storage.get(key);

    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      this.storage.delete(key);
      return null;
    }

    return cached.data;
  }

  async set(key, data, ttl = this.ttl) {
    // Remove oldest entry if cache is full
    if (this.storage.size >= this.maxSize) {
      const firstKey = this.storage.keys().next().value;
      this.storage.delete(firstKey);
    }

    const expiresAt = Date.now() + ttl;
    this.storage.set(key, { data, expiresAt });
  }

  async invalidate(key) {
    this.storage.delete(key);
  }

  async clear() {
    this.storage.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.storage.entries()) {
      if (now > value.expiresAt) {
        this.storage.delete(key);
      }
    }
  }
}
```

## Rate Limiting Implementation

```javascript
class RateLimiter {
  constructor(options = {}) {
    this.capacity = options.capacity || 10; // Tokens per window
    this.refillRate = options.refillRate || 1; // Tokens per second
    this.tokens = this.capacity;
    this.lastRefill = Date.now();

    // Track rate limit headers from API responses
    this.limitHeaders = {
      remaining: 'X-RateLimit-Remaining',
      reset: 'X-RateLimit-Reset',
      limit: 'X-RateLimit-Limit'
    };
  }

  async consume(tokens = 1) {
    this.refillTokens();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return { allowed: true, delay: 0 };
    }

    const delay = (tokens - this.tokens) / this.refillRate * 1000;
    return { allowed: false, delay };
  }

  refillTokens() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // in seconds
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  // Handle API response headers for dynamic rate limiting
  updateFromResponse(response) {
    const remaining = parseInt(response.headers[this.limitHeaders.remaining]);
    const resetTime = parseInt(response.headers[this.limitHeaders.reset]);
    const limit = parseInt(response.headers[this.limitHeaders.limit]);

    if (!isNaN(remaining)) {
      this.tokens = Math.min(this.capacity, remaining);
    }

    if (!isNaN(limit)) {
      this.capacity = limit;
    }

    if (!isNaN(resetTime)) {
      // Adjust refill rate based on server information
      this.lastRefill = Date.now();
    }
  }
}
```

## Complete API Client Example

```javascript
class RobustApiClient {
  constructor(baseURL, options = {}) {
    this.baseURL = baseURL;
    this.errorHandler = new ApiErrorHandler(options.errorHandling);
    this.retryManager = new RetryManager(options.retry);
    this.cache = new ApiResponseCache(options.cache);
    this.rateLimiter = new RateLimiter(options.rateLimit);
    this.defaultHeaders = options.headers || {};
  }

  async request(method, endpoint, data = null, options = {}) {
    const cacheKey = `${method}:${endpoint}:${JSON.stringify(data)}`;

    // Check cache first for GET requests
    if (method.toUpperCase() === 'GET' && !options.skipCache) {
      const cachedResponse = await this.cache.get(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Apply rate limiting
    const rateLimitResult = await this.rateLimiter.consume(1);
    if (!rateLimitResult.allowed) {
      await new Promise(resolve => setTimeout(resolve, rateLimitResult.delay));
    }

    const operation = async () => {
      // Implement the actual request using your preferred HTTP library
      // This is a simplified example
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers: {
          ...this.defaultHeaders,
          ...options.headers
        },
        body: data ? JSON.stringify(data) : undefined
      });

      // Update rate limiter with response headers
      this.rateLimiter.updateFromResponse(response);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Cache successful GET responses
      if (method.toUpperCase() === 'GET') {
        await this.cache.set(cacheKey, result);
      }

      return result;
    };

    const shouldRetry = (error, attempt) => {
      const errorInfo = this.errorHandler.classifyError(error);
      return errorInfo.retryable && attempt < this.retryManager.maxRetries;
    };

    return this.retryManager.executeWithRetry(operation, shouldRetry);
  }

  // Convenience methods
  get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options);
  }

  post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, data, options);
  }

  put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, data, options);
  }

  delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options);
  }
}
```

## Usage Example

```javascript
const apiClient = new RobustApiClient('https://api.example.com', {
  errorHandling: { maxRetries: 3, timeout: 10000 },
  retry: { baseDelay: 1000, maxRetries: 5 },
  cache: { ttl: 300000 }, // 5 minutes
  rateLimit: { capacity: 10, refillRate: 1 },
  headers: { 'Authorization': 'Bearer token' }
});

try {
  const data = await apiClient.get('/users/123');
  console.log(data);
} catch (error) {
  console.error('API request failed:', error.message);
}
```