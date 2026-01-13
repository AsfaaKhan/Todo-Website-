# Todo App Research & Decisions

## Neon PostgreSQL Configuration

### Decision
Use Neon PostgreSQL with connection pooling and environment variable configuration.

### Rationale
- Neon provides serverless PostgreSQL with smart caching
- Environment variables allow for easy configuration across environments
- Connection pooling improves performance under load

### Implementation Details
- Connection string format: `postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require`
- Use SQLModel's async engine for connection pooling
- Store connection string in DATABASE_URL environment variable

## JWT Token Strategy

### Decision
Standard JWT access tokens with 15-minute expiration, refresh tokens with 7-day expiration.

### Rationale
- Short-lived access tokens enhance security
- Refresh tokens provide good UX without compromising security
- Industry standard approach to authentication

### Implementation Details
- Access tokens: 15 minutes expiration
- Refresh tokens: 7 days expiration (stored securely)
- Use python-jose for JWT handling
- Store tokens in HTTP-only cookies or secure localStorage

## Frontend-Backend Communication

### Decision
Frontend will make API calls to backend endpoints using fetch with a dedicated API client.

### Rationale
- Clean separation between frontend and backend
- Standard HTTP communication pattern
- Easy to debug and maintain

### Implementation Details
- Create API client service in Next.js
- Handle authentication headers automatically
- Implement proper error handling
- Use TypeScript interfaces matching backend schemas

## SQLModel Relationship Patterns

### Decision
One-to-many relationship between User and Todo models using foreign keys.

### Rationale
- Natural data model for multi-user todo application
- SQLModel provides clean relationship syntax
- Enforces data integrity at database level

### Implementation Details
- User model with todos relationship
- Todo model with user relationship
- Foreign key constraint on user_id
- Cascade deletion when user is removed