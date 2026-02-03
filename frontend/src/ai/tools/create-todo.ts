// Create Todo MCP Tool Definition

import { Tool } from '../mcp-server';
import { CreateTodoParams, CreateTodoResponse } from '../../types/chat';
import { todosAPI } from '../../services/api';

/**
 * Create Todo Tool
 * This tool allows the AI agent to create new todo items for the authenticated user
 */
const createTodoTool: Tool = {
  name: 'create_todo',
  description: 'Create a new todo item for the authenticated user',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'The title or description of the todo item'
      },
      description: {
        type: 'string',
        description: 'Optional detailed description of the todo item'
      },
      due_date: {
        type: 'string',
        format: 'date-time',
        description: 'Optional due date and time for the todo item in ISO 8601 format'
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'Optional priority level for the todo item'
      },
      category: {
        type: 'string',
        description: 'Optional category or tag for the todo item'
      },
      recurring_rule: {
        type: 'string',
        description: 'Optional recurring rule for repeating tasks'
      }
    },
    required: ['title']
  },
  async handler(params: CreateTodoParams, context: any) {
    try {
      // Validate user context from context object
      const userId = context.userId;

      if (!userId) {
        return {
          success: false,
          error: 'User context not provided. Cannot create todo without authentication.'
        };
      }

      // Call backend API to create todo
      const response = await todosAPI.create({
        title: params.title,
        description: params.description || "",
        completed: false,  // New todos are not completed by default
        due_date: params.due_date,
        priority: params.priority || 'medium',  // Default to medium priority
        category: params.category,
        recurring_rule: params.recurring_rule
      });

      return {
        success: true,
        todo: response.data
      };
    } catch (error: any) {
      console.error('Error in create_todo tool:', error);

      // Use error handler to get user-friendly message
      let errorMessage = 'Failed to create todo';
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

export { createTodoTool };