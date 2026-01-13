'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';
import { Todo as TodoType } from '../../src/services/api';

const DashboardPage: React.FC = () => {
  const { getTodos, createTodo, updateTodo, deleteTodo, isLoading: authIsLoading } = useAuth();
  const [todos, setTodos] = useState<TodoType[]>([]);
  const [newTodo, setNewTodo] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const createdTodo = await createTodo(newTodo);
      setTodos(prevTodos => [createdTodo, ...prevTodos]);
      setNewTodo({ title: '', description: '' });
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Your Todos</h1>

        {/* Add Todo Form */}
        <form onSubmit={handleCreateTodo} className="mb-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Todo Title
              </label>
              <input
                type="text"
                id="title"
                value={newTodo.title}
                onChange={(e) => setNewTodo({...newTodo, title: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="What needs to be done?"
                required
              />
            </div>
            <div className="sm:col-span-1">
              <label htmlFor="add-todo" className="block text-sm font-medium text-gray-700 sr-only">
                Add Todo
              </label>
              <button
                type="submit"
                className="mt-6 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Todo
              </button>
            </div>
          </div>
          <div className="mt-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description (optional)
            </label>
            <textarea
              id="description"
              rows={2}
              value={newTodo.description || ''}
              onChange={(e) => setNewTodo({...newTodo, description: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Additional details..."
            />
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Todo List */}
        <div className="space-y-4">
          {todos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No todos yet. Add one above!</p>
            </div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                className={`border rounded-lg p-4 ${todo.completed ? 'bg-green-50' : 'bg-white'}`}
              >
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleComplete(todo.id, todo.completed)}
                    className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <div className="ml-3 flex-1 min-w-0">
                    <p className={`text-lg font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {todo.title}
                    </p>
                    {todo.description && (
                      <p className={`text-sm ${todo.completed ? 'line-through text-gray-500' : 'text-gray-500'}`}>
                        {todo.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Created: {new Date(todo.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUpdateTodo(todo.id, { completed: !todo.completed })}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        todo.completed
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {todo.completed ? 'Undo' : 'Complete'}
                    </button>
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;