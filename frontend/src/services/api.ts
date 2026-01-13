import axios, { AxiosInstance } from 'axios';

// Function to get the proper API base URL based on current protocol
const getApiBaseUrl = (): string => {
  let envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Always ensure HTTPS for production environments to avoid mixed content issues
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    // For production, enforce HTTPS regardless of what's in the environment variable
    if (envUrl.startsWith('http://')) {
      envUrl = envUrl.replace('http://', 'https://');
    }
  }

  return envUrl;
};

// Function to create axios instance with proper baseURL
const createApiInstance = (): AxiosInstance => {
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

  return api;
};

// Export the function to create API instance
export const getApi = (): AxiosInstance => {
  return createApiInstance();
};

// Export default api instance
export default createApiInstance();

// Authentication API functions
export const authAPI = {
  register: (userData: { username: string; email: string; password: string }) =>
    getApi().post('/auth/register', userData),

  login: (credentials: { username: string; password: string }) =>
    getApi().post('/auth/login', credentials),

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
  getAll: () => getApi().get<Todo[]>('/todos'),

  getById: (id: number) => getApi().get<Todo>(`/todos/${id}`),

  create: (todoData: CreateTodoData) => getApi().post<Todo>('/todos', todoData),

  update: (id: number, todoData: UpdateTodoData) =>
    getApi().put<Todo>(`/todos/${id}`, todoData),

  delete: (id: number) => getApi().delete(`/todos/${id}`),
};