// Complete Todo MCP Tool Definition

import { Tool } from '../mcp-server';
import { CompleteTodoParams, CompleteTodoResponse } from '../../types/chat';
import { todosAPI } from '../../services/api';
import { validateToolAuth } from './auth-validator';

/**
 * Complete Todo Tool
 * This tool allows the AI agent to mark a todo item as completed for the authenticated user
 */
const completeTodoTool: Tool = {
  name: 'complete_todo',
  description: 'Mark a todo item as completed for the authenticated user',
  inputSchema: {
    type: 'object',
    properties: {
      todo_id: {
        type: 'integer',
        description: 'The ID of the todo item to mark as completed'
      }
    },
    required: ['todo_id']
  },
  async handler(params: CompleteTodoParams, context: any) {
    try {
      // Validate authentication and authorization
      const authValidation = validateToolAuth(context, 'update', params.todo_id);

      if (!authValidation.isValid) {
        return {
          success: false,
          error: authValidation.error || 'Authentication failed'
        };
      }

      // Verify that todo_id is valid
      if (!params.todo_id || params.todo_id <= 0) {
        return {
          success: false,
          error: 'Valid todo ID is required to mark as completed'
        };
      }

      // For recurring tasks, we might need to create a new instance instead of just marking as completed
      const response = await todosAPI.update(params.todo_id, { completed: true });

      return {
        success: true,
        todo: response.data
      };
    } catch (error: any) {
      console.error('Error in complete_todo tool:', error);

      // Use error handler to get user-friendly message
      let errorMessage = 'Failed to complete todo';
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

export { completeTodoTool };