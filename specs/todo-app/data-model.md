# Todo App Data Model

## Entities

### User
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Integer | Primary Key, Auto-increment | Unique identifier for the user |
| username | String(50) | Unique, Not Null | User's chosen username |
| email | String(100) | Unique, Not Null | User's email address |
| hashed_password | String(255) | Not Null | BCrypt hashed password |
| created_at | DateTime | Not Null | Timestamp when user was created |

### Todo
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Integer | Primary Key, Auto-increment | Unique identifier for the todo |
| title | String(200) | Not Null | Title of the todo item |
| description | Text | Optional | Detailed description of the todo |
| completed | Boolean | Not Null, Default: False | Whether the todo is completed |
| user_id | Integer | Foreign Key, Not Null | Reference to the owning user |
| created_at | DateTime | Not Null | Timestamp when todo was created |
| updated_at | DateTime | Not Null | Timestamp when todo was last updated |

## Relationships
- One User has Many Todos (One-to-Many)
- Foreign Key: Todo.user_id references User.id
- Cascade delete: When a user is deleted, their todos are also deleted

## Indexes
- User.email: Unique index for fast lookups
- User.username: Unique index for fast lookups
- Todo.user_id: Index for filtering todos by user
- Todo.completed: Index for filtering completed/incomplete todos

## Validation Rules
### User
- Username: 3-50 characters, alphanumeric + underscore/hyphen only
- Email: Valid email format, max 100 characters
- Password: At least 8 characters when plain text (before hashing)

### Todo
- Title: 1-200 characters
- Description: Max 1000 characters
- A user can only access/modify their own todos