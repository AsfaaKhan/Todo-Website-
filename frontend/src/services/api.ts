import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Authentication API functions
export const authAPI = {
  register: (userData: { username: string; email: string; password: string }) =>
    api.post('/auth/register', userData),

  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login', credentials),

  logout: () => {
    localStorage.removeItem('access_token');
  },

  getCurrentUser: () => {
    const token = localStorage.getItem('access_token');
    return !!token; // Simple check - in real app, you'd verify the token
  },
};

// Todo API functions
export interface Todo {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTodoData {
  title: string;
  description?: string;
  completed?: boolean;
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  completed?: boolean;
}

export const todosAPI = {
  getAll: () => api.get<Todo[]>('/todos'),

  getById: (id: number) => api.get<Todo>(`/todos/${id}`),

  create: (todoData: CreateTodoData) => api.post<Todo>('/todos', todoData),

  update: (id: number, todoData: UpdateTodoData) =>
    api.put<Todo>(`/todos/${id}`, todoData),

  delete: (id: number) => api.delete(`/todos/${id}`),
};