import axios from 'axios';

// Function to get the proper API base URL based on current protocol
const getApiBaseUrl = (): string => {
  // Get the environment variable
  let envUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Force HTTPS for Hugging Face spaces to prevent redirect issues
  if (envUrl.includes('hf.space')) {
    if (envUrl.startsWith('http://')) {
      envUrl = envUrl.replace('http://', 'https://');
    }
  }

  // Ensure there's no trailing slash for consistency
  if (envUrl.endsWith('/')) {
    envUrl = envUrl.slice(0, -1);
  }

  return envUrl;
};

// Create a single axios instance with base configuration
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000, // Increase timeout to 15 seconds to handle slower Hugging Face responses
  withCredentials: true, // Ensure cookies/credentials are included in cross-origin requests
});

// Handle redirects that change protocols (HTTP from HTTPS)
api.defaults.validateStatus = function (status) {
  // Allow redirect status codes as well as normal success codes
  return (status >= 200 && status < 300) || status === 301 || status === 302 || status === 307 || status === 308;
};

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
        url: (config.baseURL || '') + (config.url || ''),
        method: config?.method || 'unknown',
        headers: config?.headers || {}
      });
    }

    return config;
  },
  (error) => {
    // Log request errors for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.error('API Request Error:', error?.message || error || 'Unknown error');
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
        url: (response.config.baseURL || '') + response.config.url,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    // Log response errors for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.error('API Response Error:', {
        message: error?.message || 'Unknown error',
        code: error?.code || 'No code',
        response: error?.response || null,
        request: error?.request || null,
        config: error?.config ? {
          ...error.config,
          url: (error.config.baseURL || '') + (error.config.url || '')
        } : null
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
  priority?: 'low' | 'medium' | 'high';
  due_date?: string; // ISO 8601 format
  category?: string;
  recurring_rule?: string;
}

export interface CreateTodoData {
  title: string;
  description?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string; // ISO 8601 format
  category?: string;
  recurring_rule?: string;
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string; // ISO 8601 format
  category?: string;
  recurring_rule?: string;
}

export interface GetTodosParams {
  search?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  due_date_start?: string; // YYYY-MM-DD format
  due_date_end?: string; // YYYY-MM-DD format
  sort_by?: 'created_at' | 'updated_at' | 'due_date' | 'priority' | 'title';
  sort_order?: 'asc' | 'desc';
}

export const todosAPI = {
  getAll: (params?: GetTodosParams) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/todos?${queryString}` : '/todos';

    return api.get<Todo[]>(url);
  },

  getById: (id: number) => api.get<Todo>(`/todos/${id}`),

  create: (todoData: CreateTodoData) => api.post<Todo>('/todos', todoData),

  update: (id: number, todoData: UpdateTodoData) =>
    api.put<Todo>(`/todos/${id}`, todoData),

  delete: (id: number) => api.delete(`/todos/${id}`),
};