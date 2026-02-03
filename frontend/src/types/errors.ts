// Comprehensive error types for the AI chatbot application

// Base error type for the application
export interface AppError {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  details?: any;
  timestamp: Date;
}

// Specific error types for the chatbot
export interface ChatError extends AppError {
  type: 'chat_error';
  sessionId?: string;
  userId?: number;
}

export interface ValidationError extends AppError {
  type: 'validation_error';
  field?: string;
  value?: any;
  validationRules?: any;
}

export interface AuthError extends AppError {
  type: 'auth_error';
  userId?: number;
  token?: string;
}

export interface NetworkError extends AppError {
  type: 'network_error';
  url?: string;
  method?: string;
  status?: number;
  statusText?: string;
}

export interface TodoError extends AppError {
  type: 'todo_error';
  todoId?: number;
  operation: 'create' | 'read' | 'update' | 'delete';
}

export interface AIServiceError extends AppError {
  type: 'ai_service_error';
  service: 'gemini' | 'openai' | 'custom';
  request?: any;
  response?: any;
}

export interface MCPError extends AppError {
  type: 'mcp_error';
  toolName?: string;
  toolParams?: any;
  context?: any;
}

// Error codes for the application
export enum ErrorCode {
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',

  // Authentication errors
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',

  // Chat errors
  CHAT_SESSION_NOT_FOUND = 'CHAT_SESSION_NOT_FOUND',
  CHAT_SESSION_INACTIVE = 'CHAT_SESSION_INACTIVE',
  CHAT_MESSAGE_TOO_LONG = 'CHAT_MESSAGE_TOO_LONG',

  // Todo errors
  TODO_NOT_FOUND = 'TODO_NOT_FOUND',
  TODO_INVALID_DATA = 'TODO_INVALID_DATA',
  TODO_UNAUTHORIZED_ACCESS = 'TODO_UNAUTHORIZED_ACCESS',
  TODO_CREATION_FAILED = 'TODO_CREATION_FAILED',
  TODO_UPDATE_FAILED = 'TODO_UPDATE_FAILED',
  TODO_DELETION_FAILED = 'TODO_DELETION_FAILED',

  // AI/MCP errors
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  AI_RATE_LIMIT_EXCEEDED = 'AI_RATE_LIMIT_EXCEEDED',
  MCP_TOOL_EXECUTION_FAILED = 'MCP_TOOL_EXECUTION_FAILED',
  MCP_TOOL_NOT_FOUND = 'MCP_TOOL_NOT_FOUND',

  // System errors
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}

// Error factory functions
export class ErrorFactory {
  static createAppError(
    name: string,
    message: string,
    code?: ErrorCode,
    details?: any
  ): AppError {
    return {
      name,
      message,
      code,
      details,
      timestamp: new Date()
    };
  }

  static createChatError(
    message: string,
    sessionId?: string,
    userId?: number,
    details?: any
  ): ChatError {
    return {
      ...this.createAppError('ChatError', message, undefined, details),
      type: 'chat_error',
      sessionId,
      userId
    };
  }

  static createValidationError(
    field: string,
    value: any,
    validationRules: any,
    message?: string
  ): ValidationError {
    return {
      ...this.createAppError(
        'ValidationError',
        message || `Validation failed for field: ${field}`,
        ErrorCode.VALIDATION_ERROR,
        { field, value, validationRules }
      ),
      type: 'validation_error',
      field,
      value,
      validationRules
    };
  }

  static createAuthError(
    message: string,
    userId?: number,
    token?: string,
    code?: ErrorCode
  ): AuthError {
    return {
      ...this.createAppError(
        'AuthError',
        message,
        code || ErrorCode.AUTH_TOKEN_INVALID,
        { userId, token }
      ),
      type: 'auth_error',
      userId,
      token
    };
  }

  static createNetworkError(
    url: string,
    method: string,
    status: number,
    statusText: string,
    message?: string
  ): NetworkError {
    return {
      ...this.createAppError(
        'NetworkError',
        message || `Network request failed: ${method} ${url}`,
        ErrorCode.NETWORK_ERROR,
        { url, method, status, statusText }
      ),
      type: 'network_error',
      url,
      method,
      status,
      statusText
    };
  }

  static createTodoError(
    operation: 'create' | 'read' | 'update' | 'delete',
    message: string,
    todoId?: number,
    code?: ErrorCode
  ): TodoError {
    return {
      ...this.createAppError(
        'TodoError',
        message,
        code,
        { todoId, operation }
      ),
      type: 'todo_error',
      todoId,
      operation
    };
  }

  static createAIServiceError(
    service: 'gemini' | 'openai' | 'custom',
    message: string,
    request?: any,
    response?: any
  ): AIServiceError {
    return {
      ...this.createAppError(
        'AIServiceError',
        message,
        ErrorCode.AI_SERVICE_UNAVAILABLE,
        { service, request, response }
      ),
      type: 'ai_service_error',
      service,
      request,
      response
    };
  }

  static createMCPError(
    message: string,
    toolName?: string,
    toolParams?: any,
    context?: any
  ): MCPError {
    return {
      ...this.createAppError(
        'MCPError',
        message,
        ErrorCode.MCP_TOOL_EXECUTION_FAILED,
        { toolName, toolParams, context }
      ),
      type: 'mcp_error',
      toolName,
      toolParams,
      context
    };
  }
}

// Error utility functions
export class ErrorUtils {
  /**
   * Check if an error is an authentication error
   */
  static isAuthError(error: any): error is AuthError {
    return error && error.type === 'auth_error';
  }

  /**
   * Check if an error is a validation error
   */
  static isValidationError(error: any): error is ValidationError {
    return error && error.type === 'validation_error';
  }

  /**
   * Check if an error is a network error
   */
  static isNetworkError(error: any): error is NetworkError {
    return error && error.type === 'network_error';
  }

  /**
   * Check if an error is a todo-related error
   */
  static isTodoError(error: any): error is TodoError {
    return error && error.type === 'todo_error';
  }

  /**
   * Check if an error is an AI service error
   */
  static isAIServiceError(error: any): error is AIServiceError {
    return error && error.type === 'ai_service_error';
  }

  /**
   * Check if an error is an MCP error
   */
  static isMCPError(error: any): error is MCPError {
    return error && error.type === 'mcp_error';
  }

  /**
   * Get user-friendly message from error
   */
  static getUserFriendlyMessage(error: any): string {
    if (error && error.message) {
      // Map specific error codes to user-friendly messages
      switch (error.code) {
        case ErrorCode.AUTH_TOKEN_EXPIRED:
          return 'Your session has expired. Please log in again.';
        case ErrorCode.AUTH_TOKEN_INVALID:
          return 'Authentication failed. Please log in again.';
        case ErrorCode.NETWORK_ERROR:
          return 'Network connection issue. Please check your internet connection.';
        case ErrorCode.AI_SERVICE_UNAVAILABLE:
          return 'The AI service is temporarily unavailable. Please try again later.';
        case ErrorCode.AI_RATE_LIMIT_EXCEEDED:
          return 'Rate limit exceeded. Please wait before sending more messages.';
        case ErrorCode.TODO_UNAUTHORIZED_ACCESS:
          return 'You do not have permission to access this task.';
        case ErrorCode.CHAT_SESSION_NOT_FOUND:
          return 'Chat session not found. Please start a new conversation.';
        default:
          return error.message;
      }
    }

    // For non-standard errors
    if (typeof error === 'string') {
      return error;
    }

    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Log error with appropriate level
   */
  static logError(error: any, logger: any): void {
    if (this.isValidationError(error)) {
      logger.info?.('Validation error occurred', error);
    } else if (this.isNetworkError(error)) {
      logger.warn?.('Network error occurred', error);
    } else if (this.isAuthError(error)) {
      logger.warn?.('Authentication error occurred', error);
    } else {
      logger.error?.('Unexpected error occurred', error);
    }
  }
}