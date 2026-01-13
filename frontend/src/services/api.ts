import axios from 'axios';

// Function to get the proper API base URL based on current protocol
const getApiBaseUrl = (): string => {
  // Get the environment variable
  const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // For Hugging Face spaces, ensure HTTPS
  if (envUrl.includes('hf.space')) {
    if (envUrl.startsWith('http://')) {
      return envUrl.replace('http://', 'https://');
    }
    return envUrl;
  }

  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // If the current page is served over HTTPS, ensure the API URL is also HTTPS
    if (window.location.protocol === 'https:') {
      // If the environment variable URL starts with HTTP, convert to HTTPS
      if (envUrl.startsWith('http://')) {
        return envUrl.replace('http://', 'https://');
      }
    }
  }

  return envUrl;
};

// Create a single axios instance with base configuration
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000, // Add timeout to prevent hanging requests
});

// Add interceptors to the main instance
api.interceptors.request.use(
  (config) => {
    // Only add auth token to headers, don't update baseURL here
    // The baseURL should remain as configured at instance creation
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log the request for debugging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log('API Request:', {
        url: config.baseURL + config.url,
        method: config.method,
        headers: config.headers
      });
    }

    return config;
  },
  (error) => {
    // Log request errors for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.error('API Request Error:', error.message || error);
    }
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log('API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    // Log response errors for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.error('API Response Error:', {
        message: error.message,
        response: error.response,
        request: error.request,
        config: error.config
      });
    }

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

// Export the configured instance
export default api;

// Export API functions that use the configured instance
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