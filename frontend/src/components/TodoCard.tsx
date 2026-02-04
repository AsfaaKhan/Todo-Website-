import React, { useState } from 'react';
import { Todo as TodoType } from '../services/api';
import { Button } from './Button';
import { Card, CardContent } from './Card';
import { Input } from './Input';

interface TodoCardProps {
  todo: TodoType;
  onToggleComplete: (id: number, currentCompleted: boolean) => void;
  onUpdateTodo: (id: number, updates: Partial<TodoType>) => void;
  onDeleteTodo: (id: number) => void;
}

export const TodoCard: React.FC<TodoCardProps> = ({
  todo,
  onToggleComplete,
  onUpdateTodo,
  onDeleteTodo
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description || '');
  const [editPriority, setEditPriority] = useState(todo.priority || 'medium');
  const [editDueDate, setEditDueDate] = useState(todo.due_date || '');
  const [editCategory, setEditCategory] = useState(todo.category || '');

  const handleSaveEdit = () => {
    onUpdateTodo(todo.id, {
      title: editTitle,
      description: editDescription || undefined,
      priority: editPriority as 'low' | 'medium' | 'high',
      due_date: editDueDate || undefined,
      category: editCategory || undefined
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(todo.title);
    setEditDescription(todo.description || '');
    setEditPriority(todo.priority || 'medium');
    setEditDueDate(todo.due_date || '');
    setEditCategory(todo.category || '');
    setIsEditing(false);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getPriorityColor = (priority: string | undefined) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Card
      className={`p-5 transition-normal animate-elevate shadow-blue ${todo.completed ? 'bg-muted border-blue-100' : 'bg-card border-blue-100'} ${todo.completed ? 'opacity-80' : ''}`}
    >
      <CardContent className="p-0">
        <div className="flex items-start">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggleComplete(todo.id, todo.completed)}
            className="h-5 w-5 text-primary rounded focus:ring-primary focus:ring-2 mt-0.5 cursor-pointer"
          />
          <div className="ml-4 flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="font-semibold"
                  placeholder="Todo title"
                />
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  as="textarea"
                  rows={2}
                  placeholder="Description"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Priority</label>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value as 'low' | 'medium' | 'high')}
                      className="w-full p-2 border rounded text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Due Date</label>
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="w-full p-2 border rounded text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Category</label>
                  <Input
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    placeholder="e.g., Work, Personal"
                  />
                </div>
              </div>
            ) : (
              <>
                <p className={`text-body font-semibold ${todo.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {todo.title}
                </p>
                {todo.description && (
                  <p className={`text-sm mt-1 ${todo.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                    {todo.description}
                  </p>
                )}

                {/* Display priority, due date, and category */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {todo.priority && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                      {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                    </span>
                  )}
                  {todo.due_date && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Due: {formatDate(todo.due_date)}
                    </span>
                  )}
                  {todo.category && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {todo.category}
                    </span>
                  )}
                </div>

                <p className="text-xs text-blue-500 mt-2 font-medium">
                  Created: {new Date(todo.created_at).toLocaleString()}
                </p>
              </>
            )}
          </div>
          <div className="flex flex-col space-y-2">
            {!isEditing ? (
              <>
                <Button
                  onClick={() => onUpdateTodo(todo.id, { completed: !todo.completed })}
                  variant={todo.completed ? "secondary" : "primary"}
                  size="sm"
                >
                  {todo.completed ? 'Undo' : 'Complete'}
                </Button>
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="secondary"
                  size="sm"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => onDeleteTodo(todo.id)}
                  variant="destructive"
                  size="sm"
                >
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleSaveEdit}
                  variant="primary"
                  size="sm"
                >
                  Save
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  variant="secondary"
                  size="sm"
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};