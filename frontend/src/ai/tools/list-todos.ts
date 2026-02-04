// List Todos MCP Tool Definition

import { Tool } from '../mcp-server';
import { ListTodosParams, ListTodosResponse } from '../../types/chat';
import { todosAPI } from '../../services/api';
import { validateToolAuth } from './auth-validator';

/**
 * List Todos Tool
 * This tool allows the AI agent to retrieve a list of todo items for the authenticated user with optional filters
 */
const listTodosTool: Tool = {
  name: 'list_todos',
  description: 'Retrieve a list of todo items for the authenticated user with optional filters',
  inputSchema: {
    type: 'object',
    properties: {
      completed: {
        type: 'boolean',
        description: 'Filter by completion status (optional)'
      },
      due_date: {
        type: 'string',
        format: 'date',
        description: 'Filter by due date (optional, YYYY-MM-DD format)'
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'Filter by priority level (optional)'
      },
      category: {
        type: 'string',
        description: 'Filter by category/tag (optional)'
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        description: 'Maximum number of results to return (optional, default 50)'
      },
      offset: {
        type: 'integer',
        minimum: 0,
        description: 'Number of results to skip (optional, default 0)'
      }
    }
  },
  async handler(params: ListTodosParams, context: any) {
    try {
      // Validate authentication and authorization
      const authValidation = validateToolAuth(context, 'read');

      if (!authValidation.isValid) {
        return {
          success: false,
          error: authValidation.error || 'Authentication failed'
        };
      }

      // Call backend API to get todos
      const response = await todosAPI.getAll();
      const allTodos = response.data;

      // Apply filters to the results
      let filteredTodos = allTodos;

      if (params.completed !== undefined) {
        filteredTodos = filteredTodos.filter(todo => todo.completed === params.completed);
      }

      if (params.priority) {
        filteredTodos = filteredTodos.filter(todo => todo.priority === params.priority);
      }

      if (params.due_date) {
        filteredTodos = filteredTodos.filter(todo =>
          todo.due_date && params.due_date && todo.due_date.startsWith(params.due_date)
        );
      }

      if (params.category) {
        filteredTodos = filteredTodos.filter(todo =>
          todo.category && todo.category.toLowerCase().includes(params.category!.toLowerCase())
        );
      }

      // Apply offset and limit for pagination
      const totalCount = filteredTodos.length;

      if (params.offset && params.offset > 0) {
        filteredTodos = filteredTodos.slice(params.offset);
      }

      if (params.limit && params.limit > 0) {
        filteredTodos = filteredTodos.slice(0, params.limit);
      }

      return {
        success: true,
        todos: filteredTodos,
        totalCount: totalCount
      };
    } catch (error: any) {
      console.error('Error in list_todos tool:', error);

      // Use error handler to get user-friendly message
      let errorMessage = 'Failed to list todos';
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

export { listTodosTool };