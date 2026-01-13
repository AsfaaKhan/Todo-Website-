# Todo App Implementation Plan

## Technical Context
- **Application**: Full-stack Todo web application with multi-user support
- **Frontend**: Next.js (App Router) - already initialized
- **Backend**: FastAPI with uv package manager (MUST use uv, not pip/poetry/conda)
- **Database**: Neon PostgreSQL with SQLModel ORM
- **Authentication**: JWT-based with password hashing
- **Environment**: Configuration via environment variables

## Constitution Check
- Follow Spec-Driven Development methodology ✓
- Prioritize security and data privacy ✓ (JWT auth, password hashing)
- Maintain clean separation of concerns ✓ (frontend/backend separation)
- Use modern, well-documented technologies ✓ (Next.js, FastAPI, SQLModel)
- Ensure code readability and maintainability ✓
- Implement proper error handling and validation ✓

## Gates
- [x] All technology choices align with constitution
- [x] Security requirements satisfied
- [x] Architecture supports scalability
- [x] Proper separation of concerns maintained

## Phase 0: Research & Unknowns Resolution

### Research Tasks
1. Neon PostgreSQL connection details and configuration
2. JWT token expiration and refresh strategy
3. Frontend-backend communication patterns for Next.js/FastAPI
4. SQLModel relationship patterns for user-todo association

### Research Outcomes
- Neon PostgreSQL: Will use connection pooling and environment variables for connection string
- JWT Strategy: Standard access tokens with 15-minute expiration, refresh tokens with 7-day expiration
- API Communication: Frontend will make API calls to backend endpoints using fetch/Axios
- SQLModel Relationships: One-to-many relationship between User and Todo models

## Phase 1: Data Model & API Contracts

### Data Model (`data-model.md`)
#### User Entity
- Fields: id (int, PK), username (str), email (str, unique), hashed_password (str), created_at (datetime)
- Validation: Username/email required, email format validation
- Relationships: One-to-many with Todo

#### Todo Entity
- Fields: id (int, PK), title (str), description (str, optional), completed (bool), user_id (int, FK), created_at (datetime), updated_at (datetime)
- Validation: Title required, length limits
- Relationships: Many-to-one with User

### API Contracts (`contracts/openapi.yaml`)
#### Authentication Endpoints
- POST /auth/register - User registration
- POST /auth/login - User authentication
- POST /auth/logout - User logout

#### Todo Endpoints
- GET /todos - Get user's todos
- POST /todos - Create new todo
- PUT /todos/{id} - Update todo
- DELETE /todos/{id} - Delete todo

### Quickstart Guide (`quickstart.md`)
1. Clone repository
2. Set up environment variables
3. Initialize database
4. Start backend: `uv run uvicorn app.main:app --reload`
5. Start frontend: `npm run dev`

## Phase 2: Implementation Plan

### Backend Setup
1. [ ] Initialize backend directory structure
2. [ ] Set up database models with SQLModel
3. [ ] Implement authentication utilities (password hashing, JWT)
4. [ ] Create database session management
5. [ ] Build API endpoints with proper validation

### Frontend Integration
1. [ ] Configure API client for backend communication
2. [ ] Implement authentication context/state
3. [ ] Create login/signup forms
4. [ ] Build Todo management components
5. [ ] Connect frontend to backend APIs

### Testing & Validation
1. [ ] Unit tests for backend endpoints
2. [ ] Integration tests for API flows
3. [ ] End-to-end testing of user workflows
4. [ ] Security validation (authentication, authorization)
5. [ ] Performance testing for concurrent users

## Architecture Patterns
- **Layered Architecture**: Presentation → Service → Data Access → Database
- **Security Layer**: Authentication & Authorization middleware
- **Data Layer**: Repository pattern with SQLModel
- **API Layer**: RESTful endpoints with proper error handling

## Risk Mitigation
- **Data Security**: All passwords hashed, JWT tokens secured
- **Scalability**: Connection pooling, optimized queries
- **Maintainability**: Clear separation of concerns, comprehensive documentation
- **Performance**: Caching strategies, database indexing

## Success Criteria
- [ ] Multi-user Todo app works end-to-end
- [ ] Data persists across sessions in Neon PostgreSQL
- [ ] Backend runs successfully using uv
- [ ] Frontend and backend communicate without issues
- [ ] Authentication and authorization work correctly
- [ ] All CRUD operations function properly