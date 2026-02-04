// MCP server implementation for AI chatbot
// Implements the Model Context Protocol for AI tool integration

import { EventEmitter } from 'events';
import { CreateTodoParams, UpdateTodoParams, CompleteTodoParams, DeleteTodoParams, ListTodosParams, CreateTodoResponse, UpdateTodoResponse, CompleteTodoResponse, DeleteTodoResponse, ListTodosResponse } from '../types/chat';
import { todosAPI } from '../services/api';
import { createTodoTool } from './tools/create-todo';
import { updateTodoTool } from './tools/update-todo';
import { completeTodoTool } from './tools/complete-todo';
import { deleteTodoTool } from './tools/delete-todo';
import { listTodosTool } from './tools/list-todos';

// Define the Tool interface
export interface Tool {
  name: string;
  description: string;
  inputSchema: any;
  handler: (params: any, context: any) => Promise<any>;
}

// MCP Server class
class MCPServer {
  private tools: Map<string, Tool> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();

  constructor() {
    this.initializeDefaultTools();
  }

  // Initialize default tools for todo operations
  private initializeDefaultTools(): void {
    // Register all the imported tools
    this.tools.set(createTodoTool.name, createTodoTool);
    this.tools.set(updateTodoTool.name, updateTodoTool);
    this.tools.set(completeTodoTool.name, completeTodoTool);
    this.tools.set(deleteTodoTool.name, deleteTodoTool);
    this.tools.set(listTodosTool.name, listTodosTool);
  }

  // Register a new tool
  public registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  // Get a tool by name
  public getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  // Execute a tool with given parameters
  public async executeTool(toolName: string, params: any, context: any): Promise<any> {
    const tool = this.getTool(toolName);

    if (!tool) {
      console.error(`Tool "${toolName}" not found. Available tools:`, Array.from(this.tools.keys()));
      throw new Error(`Tool "${toolName}" not found`);
    }

    try {
      return await tool.handler(params, context);
    } catch (error) {
      console.error(`Error executing tool "${toolName}":`, error);
      return {
        success: false,
        error: (error as Error).message || 'Tool execution failed'
      };
    }
  }

  // Get all registered tools
  public getToolDefinitions(): Tool[] {
    return Array.from(this.tools.values());
  }

  // Event subscription
  public on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  // Get tool names for debugging
  public getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
}

// Create a singleton instance
const mcpServer = new MCPServer();

export { mcpServer, MCPServer };