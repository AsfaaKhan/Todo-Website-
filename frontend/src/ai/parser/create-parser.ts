// Natural language parser for create todo commands

import { CreateTodoParams } from '../../types/chat';
import { parseNaturalLanguageDateTime } from '../../utils/date-parser';

/**
 * Parses natural language input to extract parameters for creating a todo
 * @param input - Natural language command (e.g., "Add a task to buy milk tomorrow at 6pm")
 * @returns Parsed CreateTodoParams object
 */
export function parseCreateTodoCommand(input: string): CreateTodoParams {
  // Normalize the input
  const normalizedInput = input.toLowerCase().trim();

  // Extract the title by removing common command prefixes
  let title = extractTitle(normalizedInput);

  // Extract due date/time
  const dueDate = parseNaturalLanguageDateTime(input);

  // Extract priority
  const priority = extractPriority(normalizedInput);

  // Create the params object
  const params: CreateTodoParams = {
    title: title.trim() || "Untitled task",
    due_date: dueDate || undefined,
    priority: priority || undefined
  };

  return params;
}

/**
 * Extracts the task title from the natural language command
 * @param input - Normalized input string
 * @returns Extracted title
 */
function extractTitle(input: string): string {
  // Remove common prefixes like "add", "create", "make", "new", "buy", "get"
  let title = input.replace(/^(add|create|make|new|buy|get|please add|please create|can you add|can you create)\s*/, '');

  // Remove common articles and connectors
  title = title.replace(/\b(a|an|the|to|for|at|on|by)\s+/g, ' ');

  // Look for time expressions to remove from title
  // Remove "tomorrow", "next week", "in 2 days", etc.
  title = title.replace(/\b(tomorrow|yesterday|today|tonight|next\s+\w+|last\s+\w+|in\s+\d+\s+\w+s?)\b/g, ' ');

  // Remove time expressions like "at 6pm", "6:30am", etc.
  title = title.replace(/\b(at\s+\d{1,2}(:\d{2})?\s*(am|pm)?|(\d{1,2}):(\d{2})\s*(am|pm)?|noon|midnight)\b/g, ' ');

  // Remove due date expressions
  title = title.replace(/\b(due|by|before)\s+\w+/g, ' ');

  // Clean up extra whitespace
  title = title.replace(/\s+/g, ' ').trim();

  return title;
}

/**
 * Extracts priority level from the natural language command
 * @param input - Normalized input string
 * @returns Priority level or undefined
 */
function extractPriority(input: string): 'low' | 'medium' | 'high' | undefined {
  // Look for priority indicators
  if (/\b(urgent|important|high|critical|asap|emergency|top priority)\b/.test(input)) {
    return 'high';
  } else if (/\b(low|minor|small|trivial|not important)\b/.test(input)) {
    return 'low';
  } else if (/\b(medium|normal|regular|usual|standard)\b/.test(input)) {
    return 'medium';
  }

  // Default to medium if no specific priority is indicated
  return undefined;
}

/**
 * Validates the parsed create todo parameters
 * @param params - CreateTodoParams to validate
 * @returns True if valid, false otherwise
 */
export function validateCreateTodoParams(params: CreateTodoParams): boolean {
  // Title is required and must not be empty
  if (!params.title || params.title.trim() === '') {
    return false;
  }

  // If due_date is provided, it should be a valid ISO string
  if (params.due_date) {
    const date = new Date(params.due_date);
    if (isNaN(date.getTime())) {
      return false; // Invalid date
    }
  }

  // If priority is provided, it should be one of the allowed values
  if (params.priority && !['low', 'medium', 'high'].includes(params.priority)) {
    return false;
  }

  return true;
}

/**
 * Sanitizes the input to prevent injection attacks
 * @param input - Raw input string
 * @returns Sanitized input
 */
export function sanitizeCreateInput(input: string): string {
  // Remove potentially dangerous characters/sequences
  // This is a basic sanitization - in production, use a proper library
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Processes a natural language create command with validation and sanitization
 * @param input - Raw natural language command
 * @returns Validated CreateTodoParams or null if invalid
 */
export function processCreateTodoCommand(input: string): CreateTodoParams | null {
  try {
    // Sanitize input first
    const sanitizedInput = sanitizeCreateInput(input);

    // Parse the command
    const params = parseCreateTodoCommand(sanitizedInput);

    // Validate the parsed parameters
    if (validateCreateTodoParams(params)) {
      return params;
    } else {
      console.warn('Invalid create todo parameters:', params);
      return null;
    }
  } catch (error) {
    console.error('Error processing create todo command:', error);
    return null;
  }
}