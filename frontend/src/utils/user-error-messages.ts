// User-friendly error messages for the AI chatbot application

export interface ErrorMessageConfig {
  title: string;
  message: string;
  action?: string;
  type?: 'error' | 'warning' | 'info';
}

export class UserErrorMessages {
  /**
   * Get a user-friendly error message based on the error type
   * @param error - The error object
   * @param fallbackMessage - Fallback message if no specific mapping is found
   * @returns User-friendly error configuration
   */
  static getErrorMessage(error: any, fallbackMessage?: string): ErrorMessageConfig {
    // Handle different types of errors
    const errorMessage = this.extractErrorMessage(error);

    // Check for specific error patterns
    if (errorMessage.includes('network') || errorMessage.includes('Network'))
      return this.networkError();

    if (errorMessage.includes('auth') || errorMessage.includes('Auth') ||
        errorMessage.includes('token') || errorMessage.includes('Token') ||
        error.status === 401 || errorMessage.includes('401'))
      return this.authenticationError();

    if (errorMessage.includes('forbidden') || error.status === 403 || errorMessage.includes('403'))
      return this.forbiddenError();

    if (errorMessage.includes('not found') || error.status === 404 || errorMessage.includes('404'))
      return this.notFoundError();

    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout'))
      return this.timeoutError();

    if (errorMessage.includes('rate limit') || errorMessage.includes('Rate limit') ||
        errorMessage.includes('Too Many Requests') || error.status === 429 || errorMessage.includes('429'))
      return this.rateLimitError();

    if (errorMessage.includes('duplicate') || errorMessage.includes('Duplicate'))
      return this.duplicateError();

    if (errorMessage.includes('validation') || errorMessage.includes('Validation') ||
        errorMessage.includes('invalid') || errorMessage.includes('Invalid'))
      return this.validationError();

    // Default error if no specific pattern matched
    return {
      title: 'Something went wrong',
      message: fallbackMessage || 'An unexpected error occurred. Please try again.',
      action: 'Try again',
      type: 'error'
    };
  }

  /**
   * Extract error message from various error formats
   */
  private static extractErrorMessage(error: any): string {
    if (!error) return '';

    // Handle different error formats
    if (typeof error === 'string') {
      return error;
    }

    if (error.message) {
      return error.message;
    }

    if (error.msg) {
      return error.msg;
    }

    if (error.detail) {
      return error.detail;
    }

    if (error.error) {
      return typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
    }

    // Handle axios-like error objects
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    if (error.response?.data?.msg) {
      return error.response.data.msg;
    }

    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }

    if (error.response?.statusText) {
      return error.response.statusText;
    }

    return JSON.stringify(error);
  }

  /**
   * Network error message
   */
  static networkError(): ErrorMessageConfig {
    return {
      title: 'Connection issue',
      message: 'We\'re having trouble connecting to the server. Please check your internet connection and try again.',
      action: 'Retry connection',
      type: 'warning'
    };
  }

  /**
   * Authentication error message
   */
  static authenticationError(): ErrorMessageConfig {
    return {
      title: 'Authentication required',
      message: 'Your session has expired or you need to log in again to continue using the service.',
      action: 'Log in again',
      type: 'error'
    };
  }

  /**
   * Forbidden error message
   */
  static forbiddenError(): ErrorMessageConfig {
    return {
      title: 'Access denied',
      message: 'You don\'t have permission to perform this action. Contact your administrator if you believe this is an error.',
      action: 'Contact support',
      type: 'error'
    };
  }

  /**
   * Not found error message
   */
  static notFoundError(): ErrorMessageConfig {
    return {
      title: 'Item not found',
      message: 'The item you\'re looking for doesn\'t exist or may have been removed.',
      action: 'Go back',
      type: 'info'
    };
  }

  /**
   * Timeout error message
   */
  static timeoutError(): ErrorMessageConfig {
    return {
      title: 'Request timed out',
      message: 'The request took too long to complete. Please try again.',
      action: 'Try again',
      type: 'warning'
    };
  }

  /**
   * Rate limit error message
   */
  static rateLimitError(): ErrorMessageConfig {
    return {
      title: 'Too many requests',
      message: 'You\'ve reached the limit for requests. Please wait before trying again.',
      action: 'Wait and retry',
      type: 'warning'
    };
  }

  /**
   * Duplicate error message
   */
  static duplicateError(): ErrorMessageConfig {
    return {
      title: 'Duplicate entry',
      message: 'An item with this information already exists. Please use different information.',
      action: 'Try different input',
      type: 'warning'
    };
  }

  /**
   * Validation error message
   */
  static validationError(): ErrorMessageConfig {
    return {
      title: 'Invalid input',
      message: 'The information you entered is not valid. Please check and try again.',
      action: 'Correct input',
      type: 'warning'
    };
  }

  /**
   * AI processing error message
   */
  static aiProcessingError(): ErrorMessageConfig {
    return {
      title: 'AI processing issue',
      message: 'The AI had trouble processing your request. Please try rephrasing your message.',
      action: 'Rephrase request',
      type: 'warning'
    };
  }

  /**
   * Todo operation error message
   */
  static todoOperationError(operation: 'create' | 'update' | 'delete' | 'complete'): ErrorMessageConfig {
    const operationMap: Record<string, {verb: string, noun: string}> = {
      create: {verb: 'creating', noun: 'task'},
      update: {verb: 'updating', noun: 'task'},
      delete: {verb: 'deleting', noun: 'task'},
      complete: {verb: 'completing', noun: 'task'}
    };

    const op = operationMap[operation] || {verb: 'processing', noun: 'request'};

    return {
      title: `Error ${op.verb} ${op.noun}`,
      message: `There was a problem ${op.verb} your ${op.noun}. Please try again.`,
      action: 'Try again',
      type: 'error'
    };
  }

  /**
   * Chat session error message
   */
  static chatSessionError(): ErrorMessageConfig {
    return {
      title: 'Chat session issue',
      message: 'There was a problem with your chat session. Starting a new conversation may help.',
      action: 'Start new chat',
      type: 'warning'
    };
  }

  /**
   * Natural language understanding error
   */
  static naturalLanguageError(): ErrorMessageConfig {
    return {
      title: 'Command not understood',
      message: 'I couldn\'t understand your request. Try using simpler language or one of the example commands.',
      action: 'See examples',
      type: 'info'
    };
  }

  /**
   * Service unavailable error
   */
  static serviceUnavailable(): ErrorMessageConfig {
    return {
      title: 'Service temporarily unavailable',
      message: 'Our service is temporarily down for maintenance. Please try again later.',
      action: 'Try again later',
      type: 'info'
    };
  }

  /**
   * Generic AI error for when AI doesn't know how to respond
   */
  static aiUnknownCommand(): ErrorMessageConfig {
    return {
      title: 'I\'m not sure how to help with that',
      message: 'I don\'t understand that command. Try asking me to create, update, complete, or list your tasks.',
      action: 'See command examples',
      type: 'info'
    };
  }

  /**
   * Get error message for specific todo operations
   */
  static getTodoErrorMessage(operation: 'create' | 'update' | 'delete' | 'complete', error: any): ErrorMessageConfig {
    const baseMessage = this.todoOperationError(operation);

    // If there's a specific error message, include it
    const specificMessage = this.extractErrorMessage(error);
    if (specificMessage && !specificMessage.includes('Error')) {
      return {
        ...baseMessage,
        message: `${baseMessage.message} Details: ${specificMessage}`
      };
    }

    return baseMessage;
  }
}

// Convenience functions for common error scenarios
export const getUserErrorMessage = (error: any, fallbackMessage?: string): ErrorMessageConfig => {
  return UserErrorMessages.getErrorMessage(error, fallbackMessage);
};

export const getTodoErrorMessage = (operation: 'create' | 'update' | 'delete' | 'complete', error: any): ErrorMessageConfig => {
  return UserErrorMessages.getTodoErrorMessage(operation, error);
};

export const getAiProcessingError = (): ErrorMessageConfig => {
  return UserErrorMessages.aiProcessingError();
};

export const getNaturalLanguageError = (): ErrorMessageConfig => {
  return UserErrorMessages.naturalLanguageError();
};