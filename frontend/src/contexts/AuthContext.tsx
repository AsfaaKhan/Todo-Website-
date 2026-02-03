"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, todosAPI, type Todo } from '../services/api';

interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  getTodos: (params?: import('../services/api').GetTodosParams) => Promise<Todo[]>;
  createTodo: (todoData: import('../services/api').CreateTodoData) => Promise<Todo>;
  updateTodo: (id: number, todoData: import('../services/api').UpdateTodoData) => Promise<Todo>;
  deleteTodo: (id: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user is logged in on initial load
    const token = localStorage.getItem('access_token');
    if (token) {
      // Token exists, user is likely authenticated
      setIsAuthenticated(true);
      // Set user info from localStorage
      setUser({ username: localStorage.getItem('username') });
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authAPI.login({ username, password });
      const { access_token } = response.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('username', username);

      setIsAuthenticated(true);
      setUser({ username });
    } catch (error) {
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      await authAPI.register({ username, email, password });
      // After registration, login the user
      await login(username, password);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
    setUser(null);
    setIsAuthenticated(false);
  };

  const getTodos = async (params?: import('../services/api').GetTodosParams): Promise<Todo[]> => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await todosAPI.getAll(params);
      return response.data;
    } catch (error) {
      console.error('Error fetching todos:', error);
      throw error;
    }
  };

  const createTodo = async (todoData: import('../services/api').CreateTodoData): Promise<Todo> => {
    try {
      const response = await todosAPI.create(todoData);
      return response.data;
    } catch (error) {
      console.error('Error creating todo:', error);
      throw error;
    }
  };

  const updateTodo = async (id: number, todoData: import('../services/api').UpdateTodoData): Promise<Todo> => {
    try {
      const response = await todosAPI.update(id, todoData);
      return response.data;
    } catch (error) {
      console.error('Error updating todo:', error);
      throw error;
    }
  };

  const deleteTodo = async (id: number): Promise<void> => {
    try {
      await todosAPI.delete(id);
    } catch (error) {
      console.error('Error deleting todo:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        getTodos,
        createTodo,
        updateTodo,
        deleteTodo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};