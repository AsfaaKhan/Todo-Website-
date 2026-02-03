// Delete Todo MCP Tool Definition

import { Tool } from '../mcp-server';
import { DeleteTodoParams, DeleteTodoResponse } from '../../types/chat';
import { todosAPI } from '../../services/api';
import { validateToolAuth } from './auth-validator';

/**
 * Delete Todo Tool
 * This tool allows the AI agent to delete a todo item for the authenticated user
 */
const deleteTodoTool: Tool = {
  name: 'delete_todo',
  description: 'Delete a todo item for the authenticated user',
  inputSchema: {
    type: 'object',
    properties: {
      todo_id: {
        type: 'integer',
        description: 'The ID of the todo item to delete'
      }
    },
    required: ['todo_id']
  },
  async handler(params: DeleteTodoParams, context: any) {
    try {
      // Validate authentication and authorization
      const authValidation = validateToolAuth(context, 'delete', params.todo_id);

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
          error: 'Valid todo ID is required to delete'
        };
      }

      // Call backend API to delete todo
      await todosAPI.delete(params.todo_id);

      return {
        success: true
      };
    } catch (error: any) {
      console.error('Error in delete_todo tool:', error);

      // Use error handler to get user-friendly message
      let errorMessage = 'Failed to delete todo';
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

export { deleteTodoTool };