import axios from 'axios';

// Function to get the proper API base URL based on current protocol
const getApiBaseUrl = (): string => {
  // Get the environment variable
  let envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Special handling for Hugging Face spaces - they should always use HTTPS
    if (envUrl.includes('hf.space') && envUrl.startsWith('http://')) {
      envUrl = envUrl.replace('http://', 'https://');
    }

    // If the current page is served over HTTPS, ensure the API URL is also HTTPS
    if (window.location.protocol === 'https:') {
      // If the environment variable URL starts with HTTP, convert to HTTPS
      if (envUrl.startsWith('http://')) {
        envUrl = envUrl.replace('http://', 'https://');
      }
    }
  }

  return envUrl;
};

// Create a single axios instance
const api = axios.create({
  baseURL: getApiBaseUrl(),
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Update the baseURL based on current environment to ensure HTTPS in production
    config.baseURL = getApiBaseUrl();

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
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Create API functions that use the single instance
export const authAPI = {
  register: (userData: { username: string; email: string; password: string }) =>
    api.post('/auth/register', userData),

  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login', credentials),

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
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

// Export the axios instance
export default api;