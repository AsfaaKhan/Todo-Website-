# Todo App with AI Chatbot

A secure, scalable, multi-user full-stack web application with an AI-powered chatbot built with Next.js, FastAPI, and SQLModel.

## 🌟 Features

- User authentication (registration and login)
- Secure JWT-based session management
- Personalized Todo lists per user
- Create, read, update, and delete Todos
- **NEW**: AI-Powered Chatbot for natural language todo management
- Responsive web interface with beautiful blue and yellow theme
- Real-time chat interface for managing tasks

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router), React, TypeScript
- **Backend**: FastAPI, Python
- **Database**: Neon PostgreSQL
- **ORM**: SQLModel
- **Package Manager**: uv
- **Authentication**: BetterAuth
- **AI Integration**: MCP (Model Context Protocol) server architecture

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- PostgreSQL database
- API key for AI service (optional for AI chatbot)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Todo-Website-
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
pip install uv
uv pip install -r requirements.txt
```

### Environment Configuration

Create `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
GEMINI_API_KEY=your_api_key_here  # Optional: for AI chatbot features
MCP_SERVER_HOST=localhost
MCP_SERVER_PORT=8080
BACKEND_API_URL=http://localhost:8000
```

Create `.env` file in the `backend` directory:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/todo_db
SECRET_KEY=your_secret_key_here
```

### Running the Application

#### 1. Start the Backend Server

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

The backend server will start on `http://localhost:8000`

#### 2. Start the Frontend Server

In a new terminal, navigate to the frontend directory:

```bash
cd frontend
npm run dev
```

The frontend server will start on `http://localhost:3000`

#### 3. Access the Application

Open your browser and navigate to `http://localhost:3000`

### Running Both Servers Simultaneously

You can use a tool like `concurrently` to run both servers simultaneously:

```bash
# From the root directory
npm install -g concurrently

# Run both servers
concurrently "cd backend && uv run uvicorn app.main:app --reload --port 8000" "cd frontend && npm run dev"
```

## 🤖 Using the AI Chatbot

Once the application is running, you can use the AI chatbot to manage your todos:

### Supported Commands

#### Creating Todos
- "Add a task to buy groceries"
- "Create a task to call John tomorrow at 3pm"
- "Make a note to finish the report by Friday"

#### Updating Todos
- "Change the grocery task to Saturday morning"
- "Update my meeting prep to high priority"
- "Edit the title of task #3 to 'Review proposal'"

#### Completing Todos
- "Mark the shopping task as done"
- "Complete task #1"
- "Finish the presentation task"

#### Listing Todos
- "Show me my tasks"
- "List my tasks for today"
- "Show my high priority tasks"

#### Deleting Todos
- "Remove the old task"
- "Delete task #5"
- "Cancel the appointment task"

### Chat Interface

The chat interface is located on the right side of the dashboard. Simply type your natural language command and press Enter or click the send button.

## 🔧 Development

### Project Structure

```
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── ai/             # AI and MCP server components
│   │   ├── components/     # React UI components
│   │   ├── services/       # API service wrappers
│   │   └── types/          # TypeScript type definitions
│   └── app/
│       └── dashboard/      # Dashboard page with chatbot
├── backend/                 # FastAPI backend application
│   ├── api/                # API route definitions
│   ├── services/           # Business logic services
│   └── models/             # Database models
└── specs/                  # Feature specifications
    └── 2-ai-chatbot/       # AI Chatbot feature specs
```

### Available Scripts

#### Frontend
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
```

#### Backend
```bash
uv run uvicorn app.main:app --reload    # Start development server
python -m pytest                       # Run tests
```

## 🔐 Authentication

The application includes a complete authentication system:

1. **Register**: Create a new account
2. **Login**: Sign in to your account
3. **Dashboard**: Access your personal todo list
4. **AI Chatbot**: Interact with the AI assistant

## 📝 API Endpoints

### Backend API
- `GET /` - Health check
- `GET /health` - Health check
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /api/chat/start` - Start chat session
- `POST /api/chat/{sessionId}/message` - Send message to AI
- `GET /api/chat/{sessionId}/history` - Get chat history
- `DELETE /api/chat/{sessionId}` - End chat session
- `GET /todos/` - Get user's todos
- `POST /todos/` - Create new todo
- `PUT /todos/{id}` - Update todo
- `DELETE /todos/{id}` - Delete todo

## 🧪 Testing

### Frontend Tests
```bash
npm run test
```

### Backend Tests
```bash
python -m pytest
```

## 🚀 Deployment

### Frontend Deployment
The frontend can be deployed to Vercel, Netlify, or any hosting platform that supports Next.js applications.

### Backend Deployment
The backend can be deployed to various platforms:

#### Hugging Face Spaces (Recommended)
The backend is specifically configured for deployment on Hugging Face Spaces:

1. Create a Hugging Face account
2. Create a new Space with the `docker` SDK type
3. Add the following secrets in your Space settings:
   - `DATABASE_URL`: PostgreSQL connection string (e.g., Neon DB URL)
   - `SECRET_KEY`: Secret key for JWT signing (long random string)
4. The application will automatically deploy using the configuration in `backend/huggingface.yml`

#### Other Platforms
The backend can also be deployed to Heroku, AWS, Google Cloud, or any platform that supports Python/FastAPI applications.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you have any questions or issues, please open an issue in the repository.

---

Made with ❤️ using Next.js, FastAPI, and AI technology