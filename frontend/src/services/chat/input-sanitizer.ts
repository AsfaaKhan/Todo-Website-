// Input sanitization service for chat operations
// Sanitizes user inputs to prevent injection attacks and other security issues

interface SanitizationOptions {
  allowHtml?: boolean;
  allowedTags?: string[];
  maxLength?: number;
  stripScripts?: boolean;
  encodeEntities?: boolean;
}

class InputSanitizer {
  private defaultOptions: SanitizationOptions = {
    allowHtml: false,
    allowedTags: [],
    maxLength: 2000,
    stripScripts: true,
    encodeEntities: true
  };

  /**
   * Sanitize a string input
   * @param input - The input string to sanitize
   * @param options - Sanitization options
   * @returns Sanitized string
   */
  sanitize(input: string, options?: SanitizationOptions): string {
    const opts = { ...this.defaultOptions, ...options };

    if (typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Limit length
    if (opts.maxLength && sanitized.length > opts.maxLength) {
      sanitized = sanitized.substring(0, opts.maxLength);
    }

    // Strip scripts if requested
    if (opts.stripScripts) {
      sanitized = this.stripScripts(sanitized);
    }

    // Encode HTML entities if requested
    if (opts.encodeEntities) {
      sanitized = this.encodeHtmlEntities(sanitized);
    }

    // Sanitize HTML if not allowing HTML or if specific tags are restricted
    if (!opts.allowHtml) {
      sanitized = this.stripHtml(sanitized);
    } else if (opts.allowedTags && opts.allowedTags.length > 0) {
      sanitized = this.sanitizeHtml(sanitized, opts.allowedTags);
    }

    // Remove potentially dangerous sequences
    sanitized = this.removeDangerousSequences(sanitized);

    return sanitized.trim();
  }

  /**
   * Sanitize a message content specifically for chat
   * @param content - The message content to sanitize
   * @returns Sanitized content
   */
  sanitizeMessage(content: string): string {
    return this.sanitize(content, {
      maxLength: 2000,
      stripScripts: true,
      encodeEntities: true,
      allowHtml: false
    });
  }

  /**
   * Sanitize a todo title
   * @param title - The title to sanitize
   * @returns Sanitized title
   */
  sanitizeTitle(title: string): string {
    return this.sanitize(title, {
      maxLength: 200,
      stripScripts: true,
      encodeEntities: true,
      allowHtml: false
    });
  }

  /**
   * Sanitize a todo description
   * @param description - The description to sanitize
   * @returns Sanitized description
   */
  sanitizeDescription(description: string): string {
    return this.sanitize(description, {
      maxLength: 1000,
      stripScripts: true,
      encodeEntities: true,
      allowHtml: false
    });
  }

  /**
   * Strip script tags and JavaScript from input
   * @param input - The input string
   * @returns String with scripts removed
   */
  private stripScripts(input: string): string {
    // Remove script tags
    input = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers
    input = input.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove javascript: and vbscript: protocols
    input = input.replace(/(javascript|vbscript|data):/gi, '');

    return input;
  }

  /**
   * Strip all HTML tags
   * @param input - The input string
   * @returns String with HTML tags removed
   */
  private stripHtml(input: string): string {
    return input.replace(/<[^>]*>/g, '');
  }

  /**
   * Sanitize HTML by allowing only specific tags
   * @param input - The input string
   * @param allowedTags - Array of allowed tag names
   * @returns Sanitized HTML string
   */
  private sanitizeHtml(input: string, allowedTags: string[]): string {
    if (!allowedTags || allowedTags.length === 0) {
      return this.stripHtml(input);
    }

    // Create a regex pattern for allowed tags
    const allowedPattern = allowedTags.join('|');
    const tagRegex = new RegExp(`<(/?(${allowedPattern})\\b[^<]*)>`, 'gi');

    // Temporarily replace allowed tags with placeholders
    const placeholders: { [key: string]: string } = {};
    let output = input.replace(tagRegex, (match, tagContent, tagName) => {
      const placeholder = `ALLOWED_TAG_${Math.random().toString(36).substring(2)}`;
      placeholders[placeholder] = `<${tagContent}>`;
      return placeholder;
    });

    // Strip all other HTML tags
    output = this.stripHtml(output);

    // Restore allowed tags
    Object.entries(placeholders).forEach(([placeholder, tag]) => {
      output = output.replace(placeholder, tag);
    });

    return output;
  }

  /**
   * Encode HTML entities
   * @param input - The input string
   * @returns String with HTML entities encoded
   */
  private encodeHtmlEntities(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /**
   * Remove potentially dangerous character sequences
   * @param input - The input string
   * @returns String with dangerous sequences removed
   */
  private removeDangerousSequences(input: string): string {
    // Remove potential SQL injection sequences
    input = input.replace(/(;|--|\/\*|\*\/|xp_|sp_|exec|execute|select|insert|update|delete|drop|create|alter|grant|revoke|declare|union|intersect|except|merge|truncate|backup|restore|shutdown|kill|load|into|dumpfile|outfile)/gi, '');

    // Remove potential command injection sequences
    input = input.replace(/[;&|`$()]/g, '');

    // Remove potential XPath injection sequences
    input = input.replace(/[\'\"]*[\[\]\)]/g, '');

    return input;
  }

  /**
   * Validate if input is safe
   * @param input - The input string to validate
   * @param options - Sanitization options
   * @returns True if safe, false otherwise
   */
  isSafe(input: string, options?: SanitizationOptions): boolean {
    const sanitized = this.sanitize(input, options);
    return sanitized === input;
  }

  /**
   * Sanitize user ID (ensure it's a valid positive number)
   * @param userId - The user ID to sanitize
   * @returns Validated user ID or null if invalid
   */
  sanitizeUserId(userId: any): number | null {
    if (typeof userId === 'string') {
      userId = parseInt(userId, 10);
    }

    if (typeof userId === 'number' && !isNaN(userId) && userId > 0 && Number.isInteger(userId)) {
      return userId;
    }

    return null;
  }

  /**
   * Sanitize session ID (ensure it's a valid string)
   * @param sessionId - The session ID to sanitize
   * @returns Validated session ID or empty string if invalid
   */
  sanitizeSessionId(sessionId: any): string {
    if (typeof sessionId !== 'string') {
      return '';
    }

    // Only allow alphanumeric characters, hyphens, and underscores
    const sanitized = sessionId.replace(/[^a-zA-Z0-9\-_]/g, '');

    // Ensure it's not too long
    if (sanitized.length > 100) {
      return sanitized.substring(0, 100);
    }

    return sanitized;
  }

  /**
   * Sanitize intent type
   * @param intent - The intent to sanitize
   * @returns Validated intent or 'unknown' if invalid
   */
  sanitizeIntent(intent: any): string {
    if (typeof intent !== 'string') {
      return 'unknown';
    }

    // Only allow known intents
    const validIntents = [
      'create_todo', 'list_todos', 'complete_todo', 'update_todo', 'delete_todo',
      'greeting', 'help', 'error', 'unknown', 'welcome'
    ];

    const lowerIntent = intent.toLowerCase();
    return validIntents.includes(lowerIntent) ? lowerIntent : 'unknown';
  }
}

// Create a singleton instance
const inputSanitizer = new InputSanitizer();

export { inputSanitizer, InputSanitizer, type SanitizationOptions };