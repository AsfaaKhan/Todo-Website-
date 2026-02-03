// Authentication validator for MCP tools

import { errorHandler } from '../../utils/error-handler';

/**
 * Validates the authentication context for MCP tool operations
 * @param context - The context object containing user information
 * @returns True if valid, error object if invalid
 */
export function validateAuthContext(context: any): { isValid: boolean; error?: string; userId?: number } {
  try {
    // Check if context exists
    if (!context) {
      return {
        isValid: false,
        error: 'Authentication context not provided'
      };
    }

    // Check if user ID exists in context
    if (!context.userId) {
      return {
        isValid: false,
        error: 'User ID not found in authentication context'
      };
    }

    // Validate user ID is a number
    const userId = Number(context.userId);
    if (isNaN(userId) || userId <= 0) {
      return {
        isValid: false,
        error: 'Invalid user ID in authentication context'
      };
    }

    // Additional context validation can be added here
    // For example, checking token expiration, permissions, etc.

    return {
      isValid: true,
      userId: userId
    };
  } catch (error) {
    console.error('Error validating auth context:', error);

    return {
      isValid: false,
      error: errorHandler.handleError(error, 'AuthValidator.validateAuthContext')
    };
  }
}

/**
 * Validates JWT token from context (simulated - in real app, verify with your auth provider)
 * @param token - The JWT token to validate
 * @returns True if valid, error object if invalid
 */
export function validateJwtToken(token: string | undefined): { isValid: boolean; error?: string } {
  if (!token) {
    return {
      isValid: false,
      error: 'JWT token not provided'
    };
  }

  try {
    // In a real application, you would:
    // 1. Decode the JWT token
    // 2. Verify its signature
    // 3. Check expiration
    // 4. Validate issuer, audience, etc.

    // For this implementation, we'll just simulate validation
    // In a real app, use a library like 'jsonwebtoken' or 'jose'

    // Basic validation - check if it looks like a JWT
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {
        isValid: false,
        error: 'Invalid JWT token format'
      };
    }

    // Simulate decoding and checking expiration
    // In real implementation, decode the payload and check exp claim
    try {
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      if (payload.exp && payload.exp < currentTime) {
        return {
          isValid: false,
          error: 'JWT token has expired'
        };
      }
    } catch (decodeError) {
      console.warn('Could not decode JWT payload:', decodeError);
      // Continue with basic validation even if we can't decode payload
    }

    return {
      isValid: true
    };
  } catch (error) {
    console.error('Error validating JWT token:', error);

    return {
      isValid: false,
      error: errorHandler.handleError(error, 'AuthValidator.validateJwtToken')
    };
  }
}

/**
 * Checks if the user has permission to perform a specific action
 * @param userId - The user ID
 * @param action - The action to check permissions for
 * @param resourceId - Optional resource ID for resource-specific permissions
 * @returns True if authorized, error object if not
 */
export function checkPermission(
  userId: number,
  action: 'create' | 'read' | 'update' | 'delete',
  resourceId?: number
): { isAuthorized: boolean; error?: string } {
  try {
    // In a real application, this would check permissions against a database or permission system
    // For this implementation, we'll allow all actions for valid users

    if (!userId || userId <= 0) {
      return {
        isAuthorized: false,
        error: 'Invalid user ID'
      };
    }

    // If checking resource-specific permission, validate that user owns the resource
    if (resourceId !== undefined) {
      // In a real app, you'd check if the resource belongs to the user
      // For now, we'll just return true for demonstration
    }

    return {
      isAuthorized: true
    };
  } catch (error) {
    console.error('Error checking permission:', error);

    return {
      isAuthorized: false,
      error: errorHandler.handleError(error, 'AuthValidator.checkPermission')
    };
  }
}

/**
 * Validates the full authentication and authorization for an MCP tool
 * @param context - The context object containing user information
 * @param action - The action being performed
 * @param resourceId - Optional resource ID for resource-specific validation
 * @returns Validation result with user ID if valid
 */
export function validateToolAuth(
  context: any,
  action: 'create' | 'read' | 'update' | 'delete',
  resourceId?: number
): { isValid: boolean; error?: string; userId?: number } {
  // Validate auth context
  const authValidation = validateAuthContext(context);
  if (!authValidation.isValid) {
    return authValidation;
  }

  // Validate JWT token if present
  if (context.token) {
    const tokenValidation = validateJwtToken(context.token);
    if (!tokenValidation.isValid) {
      return {
        isValid: false,
        error: tokenValidation.error
      };
    }
  }

  // Check permissions
  if (authValidation.userId) {
    const permissionCheck = checkPermission(authValidation.userId, action, resourceId);
    if (!permissionCheck.isAuthorized) {
      return {
        isValid: false,
        error: permissionCheck.error
      };
    }
  }

  return {
    isValid: true,
    userId: authValidation.userId
  };
}

/**
 * Middleware function to wrap tool handlers with auth validation
 * @param handler - The tool handler function
 * @param action - The action being performed
 * @returns A new function that validates auth before calling the handler
 */
export function withAuthValidation<T>(
  handler: (params: any, context: any) => Promise<T>,
  action: 'create' | 'read' | 'update' | 'delete'
): (params: any, context: any) => Promise<T | { success: false; error: string }> {
  return async (params: any, context: any) => {
    const validation = validateToolAuth(context, action);

    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error || 'Authentication validation failed'
      } as any;
    }

    // Add validated user ID to params if needed
    // This allows the handler to use the validated user ID
    const enhancedContext = {
      ...context,
      userId: validation.userId
    };

    try {
      return await handler(params, enhancedContext);
    } catch (error) {
      console.error('Error in authenticated handler:', error);
      return {
        success: false,
        error: errorHandler.handleError(error, 'AuthValidator.authenticatedHandler')
      } as any;
    }
  };
}