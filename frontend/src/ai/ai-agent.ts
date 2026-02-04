// AI Agent for Todo Chatbot
// Orchestrates the interaction between natural language processing and MCP tools

import { mcpServer } from './mcp-server';
import { processCreateTodoCommand } from './parser/create-parser';
import { ChatMessageRequest, ChatMessageResponse, Todo } from '../types/chat';
import { errorHandler } from '../utils/error-handler';
import { getUserErrorMessage } from '../utils/user-error-messages';

export interface AIContext {
  userId: number;
  sessionId: string;
  token?: string;
  [key: string]: any;
}

class AIAgent {
  private context: AIContext | null = null;

  /**
   * Process a natural language command and return an appropriate response
   * @param message - The natural language command from the user
   * @param context - The authentication and session context
   * @returns ChatMessageResponse with the AI's response
   */
  async processCommand(message: string, context: AIContext): Promise<ChatMessageResponse> {
    try {
      this.context = context;

      // Determine the intent from the message
      const intent = this.classifyIntent(message);

      // Process based on intent
      switch (intent) {
        case 'create_todo':
          return await this.handleCreateTodo(message, context);
        case 'list_todos':
          return await this.handleListTodos(message, context);
        case 'complete_todo':
          return await this.handleCompleteTodo(message, context);
        case 'update_todo':
          return await this.handleUpdateTodo(message, context);
        case 'delete_todo':
          return await this.handleDeleteTodo(message, context);
        case 'greeting':
          return this.handleGreeting();
        case 'help':
          return this.handleHelp();
        default:
          return this.handleUnknownCommand(message);
      }
    } catch (error) {
      console.error('Error processing command:', error);

      return {
        response: getUserErrorMessage(error).message,
        intent: 'error',
        processed: false,
        sessionId: context.sessionId
      };
    }
  }

  /**
   * Classify the intent of the user's message
   * @param message - The user's message
   * @returns The classified intent
   */
  private classifyIntent(message: string): string {
    const lowerMessage = message.toLowerCase();

    // Greetings
    if (lowerMessage.match(/\b(hello|hi|hey|greetings|good morning|good afternoon|good evening)\b/)) {
      return 'greeting';
    }

    // Help requests
    if (lowerMessage.match(/\b(help|assist|support|command|instruction|what can you do)\b/)) {
      return 'help';
    }

    // Create todo intents
    if (lowerMessage.match(/\b(add|create|make|new|buy|get|write|note|remember|task|todo|do)\b/) &&
        !lowerMessage.match(/\b(delete|remove|cancel|finish|complete|done|mark|update|change|edit|list|show|display|view)\b/)) {
      return 'create_todo';
    }

    // List/Show todos
    if (lowerMessage.match(/\b(show|list|display|view|see|get|fetch|find|my|all|completed|done|pending|active|tasks|todos)\b/)) {
      return 'list_todos';
    }

    // Complete/Finish todos
    if (lowerMessage.match(/\b(complete|finish|done|mark|check|tick|accomplish|achieve|fulfill)\b/)) {
      return 'complete_todo';
    }

    // Update/Change todos
    if (lowerMessage.match(/\b(update|change|modify|edit|alter|adjust|revise|improve)\b/)) {
      return 'update_todo';
    }

    // Delete/Remove todos
    if (lowerMessage.match(/\b(delete|remove|cancel|erase|eliminate|clear|get rid of)\b/)) {
      return 'delete_todo';
    }

    // Default to unknown
    return 'unknown';
  }

  /**
   * Handle a create todo command
   */
  private async handleCreateTodo(message: string, context: AIContext): Promise<ChatMessageResponse> {
    try {
      // Parse the natural language command to extract parameters
      const params = processCreateTodoCommand(message);

      if (!params) {
        return {
          response: "I couldn't understand the task you want to create. Please try rephrasing.",
          intent: 'create_todo',
          processed: false,
          sessionId: context.sessionId
        };
      }

      // Execute the create_todo MCP tool
      const result = await mcpServer.executeTool('create_todo', params, context);

      if (result.success) {
        return {
          response: `I've created the task "${result.todo.title}" for you.`,
          intent: 'create_todo',
          processed: true,
          sessionId: context.sessionId
        };
      } else {
        return {
          response: result.error || 'Failed to create the task. Please try again.',
          intent: 'create_todo',
          processed: false,
          sessionId: context.sessionId
        };
      }
    } catch (error) {
      console.error('Error in handleCreateTodo:', error);
      return {
        response: getUserErrorMessage(error).message,
        intent: 'create_todo',
        processed: false,
        sessionId: context.sessionId
      };
    }
  }

  /**
   * Handle a list todos command
   */
  private async handleListTodos(message: string, context: AIContext): Promise<ChatMessageResponse> {
    try {
      // Extract filters from the message (completed, priority, due date, etc.)
      const params = this.parseListFilters(message);

      // Execute the list_todos MCP tool
      const result = await mcpServer.executeTool('list_todos', params, context);

      if (result.success) {
        if (result.todos && result.todos.length > 0) {
          const todoList = result.todos.map((todo: Todo) => `- ${todo.completed ? '✓' : '○'} ${todo.title}`).join('\n');
          let response = `Here are your tasks:\n${todoList}`;

          if (result.totalCount && result.todos.length < result.totalCount) {
            response += `\n... and ${result.totalCount - result.todos.length} more`;
          }

          return {
            response,
            intent: 'list_todos',
            processed: true,
            sessionId: context.sessionId
          };
        } else {
          return {
            response: "You don't have any tasks that match your criteria.",
            intent: 'list_todos',
            processed: true,
            sessionId: context.sessionId
          };
        }
      } else {
        return {
          response: result.error || 'Failed to retrieve your tasks. Please try again.',
          intent: 'list_todos',
          processed: false,
          sessionId: context.sessionId
        };
      }
    } catch (error) {
      console.error('Error in handleListTodos:', error);
      return {
        response: getUserErrorMessage(error).message,
        intent: 'list_todos',
        processed: false,
        sessionId: context.sessionId
      };
    }
  }

  /**
   * Handle a complete todo command
   */
  private async handleCompleteTodo(message: string, context: AIContext): Promise<ChatMessageResponse> {
    try {
      // Extract the todo ID or title from the message
      const todoId = this.extractTodoId(message);

      if (!todoId) {
        return {
          response: "I couldn't identify which task to complete. Please specify the task by number or title.",
          intent: 'complete_todo',
          processed: false,
          sessionId: context.sessionId
        };
      }

      // Execute the complete_todo MCP tool
      const result = await mcpServer.executeTool('complete_todo', { todo_id: todoId }, context);

      if (result.success) {
        return {
          response: `I've marked task #${todoId} as completed.`,
          intent: 'complete_todo',
          processed: true,
          sessionId: context.sessionId
        };
      } else {
        return {
          response: result.error || 'Failed to complete the task. Please try again.',
          intent: 'complete_todo',
          processed: false,
          sessionId: context.sessionId
        };
      }
    } catch (error) {
      console.error('Error in handleCompleteTodo:', error);
      return {
        response: getUserErrorMessage(error).message,
        intent: 'complete_todo',
        processed: false,
        sessionId: context.sessionId
      };
    }
  }

  /**
   * Handle an update todo command
   */
  private async handleUpdateTodo(message: string, context: AIContext): Promise<ChatMessageResponse> {
    try {
      // Extract the todo ID and update parameters from the message
      const { todoId, updateParams } = this.parseUpdateCommand(message);

      if (!todoId) {
        return {
          response: "I couldn't identify which task to update. Please specify the task by number or title.",
          intent: 'update_todo',
          processed: false,
          sessionId: context.sessionId
        };
      }

      if (!updateParams || Object.keys(updateParams).length === 0) {
        return {
          response: "I couldn't understand what you want to update about the task. Please be more specific.",
          intent: 'update_todo',
          processed: false,
          sessionId: context.sessionId
        };
      }

      // Execute the update_todo MCP tool
      const result = await mcpServer.executeTool('update_todo', { todo_id: todoId, ...updateParams }, context);

      if (result.success) {
        return {
          response: `I've updated task #${todoId}.`,
          intent: 'update_todo',
          processed: true,
          sessionId: context.sessionId
        };
      } else {
        return {
          response: result.error || 'Failed to update the task. Please try again.',
          intent: 'update_todo',
          processed: false,
          sessionId: context.sessionId
        };
      }
    } catch (error) {
      console.error('Error in handleUpdateTodo:', error);
      return {
        response: getUserErrorMessage(error).message,
        intent: 'update_todo',
        processed: false,
        sessionId: context.sessionId
      };
    }
  }

  /**
   * Handle a delete todo command
   */
  private async handleDeleteTodo(message: string, context: AIContext): Promise<ChatMessageResponse> {
    try {
      // Extract the todo ID or title from the message
      const todoId = this.extractTodoId(message);

      if (!todoId) {
        return {
          response: "I couldn't identify which task to delete. Please specify the task by number or title.",
          intent: 'delete_todo',
          processed: false,
          sessionId: context.sessionId
        };
      }

      // Execute the delete_todo MCP tool
      const result = await mcpServer.executeTool('delete_todo', { todo_id: todoId }, context);

      if (result.success) {
        return {
          response: `I've deleted task #${todoId}.`,
          intent: 'delete_todo',
          processed: true,
          sessionId: context.sessionId
        };
      } else {
        return {
          response: result.error || 'Failed to delete the task. Please try again.',
          intent: 'delete_todo',
          processed: false,
          sessionId: context.sessionId
        };
      }
    } catch (error) {
      console.error('Error in handleDeleteTodo:', error);
      return {
        response: getUserErrorMessage(error).message,
        intent: 'delete_todo',
        processed: false,
        sessionId: context.sessionId
      };
    }
  }

  /**
   * Handle a greeting
   */
  private handleGreeting(): ChatMessageResponse {
    const responses = [
      "Hello! I'm your AI assistant for managing todos. How can I help you today?",
      "Hi there! I can help you create, update, complete, or list your tasks. What would you like to do?",
      "Greetings! I'm here to help you manage your todos. Try saying something like 'Add a task to buy groceries'."
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return {
      response: randomResponse,
      intent: 'greeting',
      processed: true,
      sessionId: this.context?.sessionId || ''
    };
  }

  /**
   * Handle a help request
   */
  private handleHelp(): ChatMessageResponse {
    return {
      response: "I can help you manage your tasks. You can ask me to:\n- Add/create tasks: 'Add a task to buy milk tomorrow at 6pm'\n- List tasks: 'Show me my tasks'\n- Complete tasks: 'Mark task #1 as done'\n- Update tasks: 'Change the title of task #1 to grocery shopping'\n- Delete tasks: 'Delete task #2'",
      intent: 'help',
      processed: true,
      sessionId: this.context?.sessionId || ''
    };
  }

  /**
   * Handle an unknown command
   */
  private handleUnknownCommand(originalMessage: string): ChatMessageResponse {
    return {
      response: `I'm not sure how to handle "${originalMessage}". Try commands like "Add a task to buy groceries", "Show my tasks", or "Mark task #1 as done".`,
      intent: 'unknown',
      processed: false,
      sessionId: this.context?.sessionId || ''
    };
  }

  /**
   * Parse filters for list commands
   */
  private parseListFilters(message: string): any {
    const filters: any = {};

    // Check for completion status
    if (message.toLowerCase().includes('completed') || message.toLowerCase().includes('done')) {
      filters.completed = true;
    } else if (message.toLowerCase().includes('pending') || message.toLowerCase().includes('not done')) {
      filters.completed = false;
    }

    // Check for priority
    if (message.toLowerCase().includes('high priority')) {
      filters.priority = 'high';
    } else if (message.toLowerCase().includes('low priority')) {
      filters.priority = 'low';
    } else if (message.toLowerCase().includes('medium priority')) {
      filters.priority = 'medium';
    }

    // Check for date filters
    if (message.toLowerCase().includes('today')) {
      filters.due_date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (message.toLowerCase().includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      filters.due_date = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    return filters;
  }

  /**
   * Extract todo ID from message
   */
  private extractTodoId(message: string): number | null {
    // Look for patterns like "task #1", "task 1", "#1", etc.
    const idMatch = message.match(/(?:task|#|number|no\.?\s*)(\d+)/i);
    if (idMatch) {
      return parseInt(idMatch[1]);
    }

    // If no ID found, we might need to implement a more sophisticated lookup
    // For now, return null to indicate that we couldn't identify the specific task
    return null;
  }

  /**
   * Parse update command to extract todo ID and update parameters
   */
  private parseUpdateCommand(message: string): { todoId: number | null; updateParams: any } {
    // Extract the todo ID
    const todoId = this.extractTodoId(message);

    // For now, we'll return a basic update params object
    // In a more sophisticated implementation, we'd parse the message more thoroughly
    const updateParams: any = {};

    // Check if the message contains update information
    if (message.toLowerCase().includes('title') || message.toLowerCase().includes('rename')) {
      // Extract new title (this is a simplified extraction)
      const titleMatch = message.match(/(?:to|as|new)\s+(['"]?)([^'",.!?]+)\1?/i);
      if (titleMatch) {
        updateParams.title = titleMatch[2].trim();
      }
    }

    return { todoId, updateParams };
  }
}

// Create a singleton instance
const aiAgent = new AIAgent();

export { aiAgent, AIAgent };