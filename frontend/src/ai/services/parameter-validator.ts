// Parameter validation service for AI tools
// Validates parameters passed to MCP tools to ensure security and correctness

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedParams?: any;
}

interface ValidationRule {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date' | 'enum';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enumValues?: any[];
  items?: ValidationRule; // For arrays
  properties?: { [key: string]: ValidationRule }; // For objects
  nullable?: boolean;
}

class ParameterValidator {
  /**
   * Validate parameters against a schema
   * @param params - Parameters to validate
   * @param schema - Validation schema
   * @returns Validation result
   */
  validate(params: any, schema: { [key: string]: ValidationRule }): ValidationResult {
    if (!params || typeof params !== 'object') {
      return {
        isValid: false,
        errors: ['Parameters must be an object']
      };
    }

    const errors: string[] = [];
    const sanitizedParams: any = {};

    // Validate each field in the schema
    for (const fieldName in schema) {
      const rule = schema[fieldName];
      const value = params[fieldName];

      // Check if required field is present
      if (rule.required && (value === undefined || value === null)) {
        errors.push(`Field '${fieldName}' is required`);
        continue;
      }

      // Skip validation for undefined values if not required
      if (value === undefined) {
        continue;
      }

      // Handle nullable values
      if (value === null) {
        if (rule.nullable) {
          sanitizedParams[fieldName] = null;
          continue;
        } else {
          errors.push(`Field '${fieldName}' does not accept null values`);
          continue;
        }
      }

      // Validate based on type
      const fieldResult = this.validateField(value, rule, fieldName);

      if (fieldResult.isValid) {
        sanitizedParams[fieldName] = fieldResult.sanitizedValue;
      } else {
        errors.push(...fieldResult.errors);
      }
    }

    // Check for extra fields not in schema
    for (const fieldName in params) {
      if (!(fieldName in schema)) {
        // We allow extra fields but don't include them in sanitized params
        // This is to prevent passing unexpected parameters to tools
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedParams: errors.length === 0 ? sanitizedParams : undefined
    };
  }

  /**
   * Validate a single field value
   * @param value - Value to validate
   * @param rule - Validation rule
   * @param fieldName - Name of the field (for error messages)
   * @returns Validation result for the field
   */
  private validateField(value: any, rule: ValidationRule, fieldName: string): {
    isValid: boolean;
    errors: string[];
    sanitizedValue?: any;
  } {
    const errors: string[] = [];

    // Type validation
    const typeCheck = this.validateType(value, rule.type, fieldName);
    if (!typeCheck.isValid) {
      return {
        isValid: false,
        errors: [typeCheck.error!]
      };
    }

    // Sanitize the value based on type
    let sanitizedValue = value;

    switch (rule.type) {
      case 'string':
        sanitizedValue = this.sanitizeString(value, rule);
        break;
      case 'number':
        sanitizedValue = this.sanitizeNumber(value, rule);
        break;
      case 'boolean':
        sanitizedValue = this.sanitizeBoolean(value);
        break;
      case 'array':
        sanitizedValue = this.sanitizeArray(value, rule);
        break;
      case 'object':
        sanitizedValue = this.sanitizeObject(value, rule);
        break;
      case 'date':
        sanitizedValue = this.sanitizeDate(value);
        break;
      case 'enum':
        sanitizedValue = value; // Enum values are already validated by enumValues check
        break;
    }

    // Additional validations based on type
    switch (rule.type) {
      case 'string':
        if (rule.minLength !== undefined && sanitizedValue.length < rule.minLength) {
          errors.push(`Field '${fieldName}' must be at least ${rule.minLength} characters long`);
        }
        if (rule.maxLength !== undefined && sanitizedValue.length > rule.maxLength) {
          errors.push(`Field '${fieldName}' must be at most ${rule.maxLength} characters long`);
        }
        if (rule.pattern && !rule.pattern.test(sanitizedValue)) {
          errors.push(`Field '${fieldName}' does not match required pattern`);
        }
        break;

      case 'number':
        if (rule.min !== undefined && sanitizedValue < rule.min) {
          errors.push(`Field '${fieldName}' must be at least ${rule.min}`);
        }
        if (rule.max !== undefined && sanitizedValue > rule.max) {
          errors.push(`Field '${fieldName}' must be at most ${rule.max}`);
        }
        break;

      case 'enum':
        if (rule.enumValues && !rule.enumValues.includes(sanitizedValue)) {
          errors.push(`Field '${fieldName}' must be one of: ${rule.enumValues.join(', ')}`);
        }
        break;

      case 'array':
        if (rule.min !== undefined && sanitizedValue.length < rule.min) {
          errors.push(`Field '${fieldName}' must have at least ${rule.min} items`);
        }
        if (rule.max !== undefined && sanitizedValue.length > rule.max) {
          errors.push(`Field '${fieldName}' must have at most ${rule.max} items`);
        }
        break;
    }

    // For arrays, validate each item if item schema is provided
    if (rule.type === 'array' && rule.items) {
      for (let i = 0; i < sanitizedValue.length; i++) {
        const itemResult = this.validateField(sanitizedValue[i], rule.items, `${fieldName}[${i}]`);
        if (!itemResult.isValid) {
          errors.push(...itemResult.errors);
        }
      }
    }

    // For objects, validate nested properties if schema is provided
    if (rule.type === 'object' && rule.properties) {
      for (const nestedFieldName in rule.properties) {
        const nestedRule = rule.properties[nestedFieldName];
        const nestedValue = sanitizedValue[nestedFieldName];

        // Check if required nested field is present
        if (nestedRule.required && (nestedValue === undefined || nestedValue === null)) {
          errors.push(`Nested field '${fieldName}.${nestedFieldName}' is required`);
          continue;
        }

        if (nestedValue !== undefined) {
          const nestedResult = this.validateField(nestedValue, nestedRule, `${fieldName}.${nestedFieldName}`);
          if (!nestedResult.isValid) {
            errors.push(...nestedResult.errors);
          } else {
            sanitizedValue[nestedFieldName] = nestedResult.sanitizedValue;
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: errors.length === 0 ? sanitizedValue : undefined
    };
  }

  /**
   * Validate the type of a value
   * @param value - Value to validate
   * @param expectedType - Expected type
   * @param fieldName - Name of the field
   * @returns Type validation result
   */
  private validateType(value: any, expectedType: ValidationRule['type'], fieldName: string): {
    isValid: boolean;
    error?: string;
  } {
    switch (expectedType) {
      case 'string':
        if (typeof value !== 'string') {
          // Try to convert to string if possible
          if (value !== null && value !== undefined) {
            value = String(value);
          } else {
            return { isValid: false, error: `Field '${fieldName}' must be a string` };
          }
        }
        return { isValid: true };

      case 'number':
        if (typeof value === 'string') {
          const num = Number(value);
          if (isNaN(num)) {
            return { isValid: false, error: `Field '${fieldName}' must be a number` };
          }
          return { isValid: true };
        }
        if (typeof value !== 'number' || isNaN(value)) {
          return { isValid: false, error: `Field '${fieldName}' must be a number` };
        }
        return { isValid: true };

      case 'boolean':
        if (typeof value === 'string') {
          if (['true', 'false', '1', '0'].includes(value.toLowerCase())) {
            return { isValid: true };
          }
          return { isValid: false, error: `Field '${fieldName}' must be a boolean` };
        }
        if (typeof value !== 'boolean') {
          return { isValid: false, error: `Field '${fieldName}' must be a boolean` };
        }
        return { isValid: true };

      case 'array':
        if (!Array.isArray(value)) {
          return { isValid: false, error: `Field '${fieldName}' must be an array` };
        }
        return { isValid: true };

      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return { isValid: false, error: `Field '${fieldName}' must be an object` };
        }
        return { isValid: true };

      case 'date':
        if (typeof value === 'string') {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            return { isValid: false, error: `Field '${fieldName}' must be a valid date string` };
          }
          return { isValid: true };
        }
        if (value instanceof Date && !isNaN(value.getTime())) {
          return { isValid: true };
        }
        return { isValid: false, error: `Field '${fieldName}' must be a valid date` };

      case 'enum':
        return { isValid: true }; // Enum validation happens separately

      default:
        return { isValid: true };
    }
  }

  /**
   * Sanitize a string value
   * @param value - String value to sanitize
   * @param rule - Validation rule
   * @returns Sanitized string
   */
  private sanitizeString(value: string, rule: ValidationRule): string {
    // Basic sanitization to prevent injection attacks
    let sanitized = value;

    // Remove potential script tags
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove javascript: and vbscript: protocols
    sanitized = sanitized.replace(/(javascript|vbscript|data):/gi, '');

    return sanitized;
  }

  /**
   * Sanitize a number value
   * @param value - Number value to sanitize
   * @param rule - Validation rule
   * @returns Sanitized number
   */
  private sanitizeNumber(value: number, rule: ValidationRule): number {
    // Ensure the value is within the specified range if min/max are provided
    if (rule.min !== undefined && value < rule.min) {
      value = rule.min;
    }
    if (rule.max !== undefined && value > rule.max) {
      value = rule.max;
    }

    return value;
  }

  /**
   * Sanitize a boolean value
   * @param value - Boolean value to sanitize
   * @returns Sanitized boolean
   */
  private sanitizeBoolean(value: any): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    return Boolean(value);
  }

  /**
   * Sanitize an array value
   * @param value - Array value to sanitize
   * @param rule - Validation rule
   * @returns Sanitized array
   */
  private sanitizeArray(value: any[], rule: ValidationRule): any[] {
    // If min/max are specified, trim or pad the array
    if (rule.min !== undefined && value.length < rule.min) {
      // Trim to max allowed length if it exceeds max
      if (rule.max !== undefined && value.length > rule.max) {
        return value.slice(0, rule.max);
      }
      return value;
    }
    if (rule.max !== undefined && value.length > rule.max) {
      return value.slice(0, rule.max);
    }
    return value;
  }

  /**
   * Sanitize an object value
   * @param value - Object value to sanitize
   * @param rule - Validation rule
   * @returns Sanitized object
   */
  private sanitizeObject(value: any, rule: ValidationRule): any {
    // For now, return the object as-is since deep sanitization of objects
    // would require more specific rules per property
    return value;
  }

  /**
   * Sanitize a date value
   * @param value - Date value to sanitize
   * @returns Sanitized date
   */
  private sanitizeDate(value: string | Date): Date {
    if (value instanceof Date) {
      return value;
    }
    return new Date(value);
  }

  /**
   * Validate parameters for create_todo tool
   * @param params - Parameters for create_todo
   * @returns Validation result
   */
  validateCreateTodoParams(params: any): ValidationResult {
    const schema: { [key: string]: ValidationRule } = {
      title: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 200
      },
      description: {
        type: 'string',
        required: false,
        maxLength: 1000
      },
      due_date: {
        type: 'string', // Date as ISO string
        required: false
      },
      priority: {
        type: 'enum',
        required: false,
        enumValues: ['low', 'medium', 'high']
      },
      category: {
        type: 'string',
        required: false,
        maxLength: 50
      },
      recurring_rule: {
        type: 'string',
        required: false,
        maxLength: 100
      }
    };

    return this.validate(params, schema);
  }

  /**
   * Validate parameters for update_todo tool
   * @param params - Parameters for update_todo
   * @returns Validation result
   */
  validateUpdateTodoParams(params: any): ValidationResult {
    const schema: { [key: string]: ValidationRule } = {
      todo_id: {
        type: 'number',
        required: true
      },
      title: {
        type: 'string',
        required: false,
        minLength: 1,
        maxLength: 200
      },
      description: {
        type: 'string',
        required: false,
        maxLength: 1000
      },
      due_date: {
        type: 'string', // Date as ISO string
        required: false
      },
      priority: {
        type: 'enum',
        required: false,
        enumValues: ['low', 'medium', 'high']
      },
      completed: {
        type: 'boolean',
        required: false
      },
      category: {
        type: 'string',
        required: false,
        maxLength: 50
      },
      recurring_rule: {
        type: 'string',
        required: false,
        maxLength: 100
      }
    };

    return this.validate(params, schema);
  }

  /**
   * Validate parameters for complete_todo tool
   * @param params - Parameters for complete_todo
   * @returns Validation result
   */
  validateCompleteTodoParams(params: any): ValidationResult {
    const schema: { [key: string]: ValidationRule } = {
      todo_id: {
        type: 'number',
        required: true
      }
    };

    return this.validate(params, schema);
  }

  /**
   * Validate parameters for delete_todo tool
   * @param params - Parameters for delete_todo
   * @returns Validation result
   */
  validateDeleteTodoParams(params: any): ValidationResult {
    const schema: { [key: string]: ValidationRule } = {
      todo_id: {
        type: 'number',
        required: true
      }
    };

    return this.validate(params, schema);
  }

  /**
   * Validate parameters for list_todos tool
   * @param params - Parameters for list_todos
   * @returns Validation result
   */
  validateListTodosParams(params: any): ValidationResult {
    const schema: { [key: string]: ValidationRule } = {
      completed: {
        type: 'boolean',
        required: false
      },
      due_date: {
        type: 'string',
        required: false
      },
      priority: {
        type: 'enum',
        required: false,
        enumValues: ['low', 'medium', 'high']
      },
      category: {
        type: 'string',
        required: false
      },
      limit: {
        type: 'number',
        required: false,
        min: 1,
        max: 100
      },
      offset: {
        type: 'number',
        required: false,
        min: 0
      }
    };

    return this.validate(params, schema);
  }

  /**
   * Validate general chat message parameters
   * @param params - Parameters for chat message
   * @returns Validation result
   */
  validateChatMessageParams(params: any): ValidationResult {
    const schema: { [key: string]: ValidationRule } = {
      message: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 2000
      },
      userId: {
        type: 'number',
        required: true
      }
    };

    return this.validate(params, schema);
  }

  /**
   * Sanitize user input to prevent injection attacks
   * @param input - Raw user input
   * @returns Sanitized input
   */
  sanitizeUserInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Remove potential injection sequences
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/(eval|alert|prompt|confirm)\s*\(/gi, '') // Remove dangerous functions
      .trim();

    return sanitized;
  }
}

// Create a singleton instance
const parameterValidator = new ParameterValidator();

export { parameterValidator, ParameterValidator, type ValidationRule, type ValidationResult };