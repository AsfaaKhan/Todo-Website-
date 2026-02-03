'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';
import { Todo as TodoType, CreateTodoData } from '../../src/services/api';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { Skeleton, SkeletonCard } from '../../src/components/Skeleton';
import { TodoCard } from '../../src/components/TodoCard';
import ChatBot from '../../src/components/ChatBot';

const DashboardPage: React.FC = () => {
  const { getTodos, createTodo, updateTodo, deleteTodo, isLoading: authIsLoading } = useAuth();
  const [todos, setTodos] = useState<TodoType[]>([]);
  const [filteredTodos, setFilteredTodos] = useState<TodoType[]>([]);
  const [newTodo, setNewTodo] = useState<CreateTodoData>({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    category: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompleted, setFilterCompleted] = useState<'all' | 'completed' | 'pending'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'created_at' | 'due_date' | 'priority' | 'title'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (!authIsLoading) {
      const fetchTodosWithAuthCheck = async () => {
        try {
          setLoading(true);
          const todosData = await getTodos();
          setTodos(todosData);
        } catch (err) {
          console.error('Error loading todos:', err);
          setError('Failed to load todos');
        } finally {
          setLoading(false);
        }
      };

      fetchTodosWithAuthCheck();
    }
  }, [authIsLoading]);

  // Apply filters and sorting when todos or filter states change
  useEffect(() => {
    let result = [...todos];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(todo =>
        todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (todo.description && todo.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply completion filter
    if (filterCompleted !== 'all') {
      if (filterCompleted === 'completed') {
        result = result.filter(todo => todo.completed);
      } else {
        result = result.filter(todo => !todo.completed);
      }
    }

    // Apply priority filter
    if (filterPriority !== 'all') {
      result = result.filter(todo => todo.priority === filterPriority);
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      result = result.filter(todo => todo.category === filterCategory);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortOption) {
        case 'due_date':
          if (a.due_date && b.due_date) {
            comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          } else if (a.due_date) {
            comparison = -1;
          } else if (b.due_date) {
            comparison = 1;
          } else {
            comparison = 0;
          }
          break;
        case 'priority':
          const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
          comparison = (priorityOrder[b.priority || 'medium'] || 2) - (priorityOrder[a.priority || 'medium'] || 2);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created_at':
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredTodos(result);
  }, [todos, searchTerm, filterCompleted, filterPriority, filterCategory, sortOption, sortOrder]);

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const createdTodo = await createTodo(newTodo);
      setTodos(prevTodos => [createdTodo, ...prevTodos]);
      setNewTodo({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        category: ''
      });
    } catch (err) {
      setError('Failed to create todo');
    }
  };

  const handleToggleComplete = async (id: number, currentCompleted: boolean) => {
    try {
      const updatedTodo = await updateTodo(id, { completed: !currentCompleted });
      setTodos(prevTodos => prevTodos.map(todo =>
        todo.id === id ? updatedTodo : todo
      ));
    } catch (err) {
      setError('Failed to update todo');
    }
  };

  const handleUpdateTodo = async (id: number, updates: Partial<TodoType>) => {
    try {
      const updatedTodo = await updateTodo(id, updates);
      setTodos(prevTodos => prevTodos.map(todo =>
        todo.id === id ? updatedTodo : todo
      ));
    } catch (err) {
      setError('Failed to update todo');
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await deleteTodo(id);
      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
    } catch (err) {
      setError('Failed to delete todo');
    }
  };

  if (loading || authIsLoading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="rounded-lg p-6">
          <h1 className="text-h1 font-semibold text-foreground mb-6">Your Todos</h1>

          <div className="mb-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="sm:col-span-1">
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="mt-2">
              <Skeleton className="h-20 w-full" />
            </div>
          </div>

          <div className="space-y-4">
            <SkeletonCard paragraphCount={2} showActions={true} />
            <SkeletonCard paragraphCount={2} showActions={true} />
            <SkeletonCard paragraphCount={2} showActions={true} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0 relative">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-xl p-6 bg-white shadow-sm border border-blue-100">
            <div className="mb-2">
              <h1 className="text-h1 font-bold text-blue-800">Your Todo Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage your tasks efficiently</p>
            </div>

            {/* Add Todo Form */}
            <form onSubmit={handleCreateTodo} className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
              <h2 className="text-h3 font-semibold text-blue-700 mb-4">Add New Task</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    id="title"
                    label="Todo Title"
                    value={newTodo.title}
                    onChange={(e) => setNewTodo({...newTodo, title: e.target.value})}
                    placeholder="What needs to be done?"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Input
                    id="description"
                    label="Description (optional)"
                    as="textarea"
                    rows={2}
                    value={newTodo.description || ''}
                    onChange={(e) => setNewTodo({...newTodo, description: e.target.value})}
                    placeholder="Additional details..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newTodo.priority}
                    onChange={(e) => setNewTodo({...newTodo, priority: e.target.value as 'low' | 'medium' | 'high'})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTodo.due_date || ''}
                    onChange={(e) => setNewTodo({...newTodo, due_date: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <Input
                    id="category"
                    label="Category (optional)"
                    value={newTodo.category || ''}
                    onChange={(e) => setNewTodo({...newTodo, category: e.target.value})}
                    placeholder="e.g., Work, Personal, Shopping"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <Button
                    type="submit"
                    className="mt-4 w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    Add Todo
                  </Button>
                </div>
              </div>
            </form>

            {/* Filters and Search */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tasks..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filterCompleted}
                  onChange={(e) => setFilterCompleted(e.target.value as 'all' | 'completed' | 'pending')}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All</option>
                  {[...new Set(todos.map(todo => todo.category).filter(Boolean))].map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={`${sortOption}-${sortOrder}`}
                  onChange={(e) => {
                    const [option, order] = e.target.value.split('-');
                    setSortOption(option as any);
                    setSortOrder(order as any);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="created_at-desc">Created (Newest)</option>
                  <option value="created_at-asc">Created (Oldest)</option>
                  <option value="due_date-asc">Due Date (Earliest)</option>
                  <option value="due_date-desc">Due Date (Latest)</option>
                  <option value="priority-desc">Priority (High to Low)</option>
                  <option value="priority-asc">Priority (Low to High)</option>
                  <option value="title-asc">Title (A-Z)</option>
                  <option value="title-desc">Title (Z-A)</option>
                </select>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-destructive/10 p-4 mb-6 border border-red-200">
                <div className="text-sm text-destructive font-medium">{error}</div>
              </div>
            )}

            {/* Todo List Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-h2 font-semibold text-blue-800">Your Tasks</h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {filteredTodos.length} {filteredTodos.length === 1 ? 'task' : 'tasks'}
                {searchTerm && ` matching "${searchTerm}"`}
              </span>
            </div>

            {/* Todo List */}
            <div className="space-y-5 max-h-[500px] overflow-y-auto pr-2">
              {filteredTodos.length === 0 ? (
                <div className="text-center py-12 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50">
                  <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-muted-foreground">
                    {todos.length === 0
                      ? "No todos yet. Add one above to get started!"
                      : "No tasks match your current filters."}
                  </p>
                </div>
              ) : (
                filteredTodos.map((todo) => (
                  <TodoCard
                    key={todo.id}
                    todo={todo}
                    onToggleComplete={handleToggleComplete}
                    onUpdateTodo={handleUpdateTodo}
                    onDeleteTodo={handleDeleteTodo}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chat Icon */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg z-50 transition-all duration-300 hover:scale-110"
        aria-label="Open chatbot"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Chat Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md h-[600px] flex flex-col relative">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-blue-800">AI Assistant</h3>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatBot className="h-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;