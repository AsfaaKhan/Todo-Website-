// Update Todo MCP Tool Definition

import { Tool } from '../mcp-server';
import { UpdateTodoParams, UpdateTodoResponse } from '../../types/chat';
import { todosAPI } from '../../services/api';
import { validateToolAuth } from './auth-validator';

/**
 * Update Todo Tool
 * This tool allows the AI agent to update existing todo items for the authenticated user
 */
const updateTodoTool: Tool = {
  name: 'update_todo',
  description: 'Update an existing todo item for the authenticated user',
  inputSchema: {
    type: 'object',
    properties: {
      todo_id: {
        type: 'integer',
        description: 'The ID of the todo item to update'
      },
      title: {
        type: 'string',
        description: 'New title for the todo item (optional)'
      },
      description: {
        type: 'string',
        description: 'New description for the todo item (optional)'
      },
      due_date: {
        type: 'string',
        format: 'date-time',
        description: 'New due date and time for the todo item (optional)'
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'New priority level for the todo item (optional)'
      },
      completed: {
        type: 'boolean',
        description: 'New completion status for the todo item (optional)'
      },
      category: {
        type: 'string',
        description: 'New category or tag for the todo item (optional)'
      },
      recurring_rule: {
        type: 'string',
        description: 'New recurring rule for the todo item (optional)'
      }
    },
    required: ['todo_id']
  },
  async handler(params: UpdateTodoParams, context: any) {
    try {
      // Validate authentication and authorization
      const authValidation = validateToolAuth(context, 'update', params.todo_id);

      if (!authValidation.isValid) {
        return {
          success: false,
          error: authValidation.error || 'Authentication failed'
        };
      }

      // Verify that at least one field to update is provided
      const updateFields = { ...params };
      const { todo_id, ...fieldsToUpdate } = updateFields;

      const hasUpdateFields = Object.keys(fieldsToUpdate).some(key => (fieldsToUpdate as any)[key] !== undefined);

      if (!hasUpdateFields) {
        return {
          success: false,
          error: 'No fields to update provided. Please specify at least one field to update.'
        };
      }

      // Prepare update data - only include fields that are explicitly provided
      const updateData: any = {};
      if (params.title !== undefined) updateData.title = params.title;
      if (params.description !== undefined) updateData.description = params.description;
      if (params.due_date !== undefined) updateData.due_date = params.due_date;
      if (params.priority !== undefined) updateData.priority = params.priority;
      if (params.completed !== undefined) updateData.completed = params.completed;
      if (params.category !== undefined) updateData.category = params.category;
      if (params.recurring_rule !== undefined) updateData.recurring_rule = params.recurring_rule;

      // Call backend API to update todo
      const response = await todosAPI.update(params.todo_id, updateData);

      return {
        success: true,
        todo: response.data
      };
    } catch (error: any) {
      console.error('Error in update_todo tool:', error);

      // Use error handler to get user-friendly message
      let errorMessage = 'Failed to update todo';
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

export { updateTodoTool };