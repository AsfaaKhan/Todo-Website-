'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';
import { Todo as TodoType } from '../../src/services/api';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { Skeleton, SkeletonCard } from '../../src/components/Skeleton';
import { TodoCard } from '../../src/components/TodoCard';

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
    <div className="px-4 py-6 sm:px-0">
      <div className="rounded-lg p-6">
        <h1 className="text-h1 font-semibold text-foreground mb-6">Your Todos</h1>

        {/* Add Todo Form */}
        <form onSubmit={handleCreateTodo} className="mb-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Input
                id="title"
                label="Todo Title"
                value={newTodo.title}
                onChange={(e) => setNewTodo({...newTodo, title: e.target.value})}
                placeholder="What needs to be done?"
                required
              />
            </div>
            <div className="sm:col-span-1">
              <Button
                type="submit"
                className="mt-6 w-full"
              >
                Add Todo
              </Button>
            </div>
          </div>
          <div className="mt-2">
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
        </form>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-destructive/10 p-4 mb-4">
            <div className="text-sm text-destructive">{error}</div>
          </div>
        )}

        {/* Todo List */}
        <div className="space-y-4">
          {todos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No todos yet. Add one above!</p>
            </div>
          ) : (
            todos.map((todo) => (
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
  );
};

export default DashboardPage;