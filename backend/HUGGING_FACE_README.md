# Todo App Backend for Hugging Face

This is the backend for the full-stack Todo web application, designed for deployment on Hugging Face Spaces.

## Features

- User authentication with JWT
- Secure password hashing with bcrypt
- User-specific Todo management
- RESTful API endpoints
- PostgreSQL database with connection pooling

## Deployment on Hugging Face

### Prerequisites

- Hugging Face Account
- PostgreSQL database (Neon recommended)

### Environment Variables

You need to set the following secrets in your Hugging Face Space:

- `DATABASE_URL`: PostgreSQL connection string (e.g., `postgresql://username:password@host:port/dbname`)
- `SECRET_KEY`: Secret key for JWT signing (should be a long random string)
- `ALGORITHM`: Algorithm for JWT (default: HS256) - Optional
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time in minutes (default: 30) - Optional

### API Endpoints

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /todos` - Get user's todos
- `POST /todos` - Create new todo
- `PUT /todos/{id}` - Update todo
- `DELETE /todos/{id}` - Delete todo

### Health Check

- `GET /health` - Health check endpoint
- `GET /docs` - API documentation (Swagger UI)

## Architecture

- FastAPI web framework
- SQLModel for database modeling
- JWT-based authentication
- Neon PostgreSQL database
- Bcrypt password hashing

## Security

- Passwords are securely hashed using bcrypt
- JWT tokens with configurable expiration
- User isolation - users can only access their own todos
- Input validation and sanitization

## Scalability

- Connection pooling for database operations
- Async/await for improved performance
- Efficient querying with SQLModel

## License

MIT License - see LICENSE file for details.