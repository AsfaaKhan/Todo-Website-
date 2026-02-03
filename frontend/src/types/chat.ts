// Chat-related TypeScript interfaces

export interface ChatSession {
  sessionId: string;
  userId: number;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Message {
  id: number;
  sessionId: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  intent?: string;
  parameters?: Record<string, any>;
  aiResponse?: string;
}

export interface Intent {
  type: 'create' | 'update' | 'complete' | 'delete' | 'list';
  confidenceScore: number;
  extractedParameters: Record<string, any>;
  actionResult: Record<string, any>;
  processedAt: Date;
}

export interface Todo {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string; // ISO 8601 format
  priority?: 'low' | 'medium' | 'high';
  created_at: string; // ISO 8601 format
  updated_at: string; // ISO 8601 format
}

export interface CreateTodoParams {
  title: string;
  description?: string;
  due_date?: string; // ISO 8601 format
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  recurring_rule?: string;
}

export interface UpdateTodoParams {
  todo_id: number;
  title?: string;
  description?: string;
  due_date?: string; // ISO 8601 format
  priority?: 'low' | 'medium' | 'high';
  completed?: boolean;
  category?: string;
  recurring_rule?: string;
}

export interface CompleteTodoParams {
  todo_id: number;
}

export interface DeleteTodoParams {
  todo_id: number;
}

export interface ListTodosParams {
  completed?: boolean;
  due_date?: string; // ISO 8601 date format
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  limit?: number;
  offset?: number;
}

export interface ToolResponse {
  success: boolean;
  error?: string;
}

export interface CreateTodoResponse extends ToolResponse {
  todo?: Todo;
}

export interface UpdateTodoResponse extends ToolResponse {
  todo?: Todo;
}

export interface CompleteTodoResponse extends ToolResponse {
  todo?: Todo;
}

export interface DeleteTodoResponse extends ToolResponse {
  // No todo object returned for delete
}

export interface ListTodosResponse extends ToolResponse {
  todos?: Todo[];
  totalCount?: number;
}

export interface ChatMessageRequest {
  message: string;
  userId: number;
}

export interface ChatMessageResponse {
  response: string;
  intent?: string;
  processed: boolean;
  sessionId: string;
}