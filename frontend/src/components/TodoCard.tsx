import React from 'react';
import { Todo as TodoType } from '../services/api';
import { Button } from './Button';
import { Card, CardContent } from './Card';

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
  return (
    <Card
      className={`p-4 transition-normal animate-elevate ${todo.completed ? 'bg-muted' : 'bg-card'}`}
    >
      <CardContent className="p-0">
        <div className="flex items-start">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggleComplete(todo.id, todo.completed)}
            className="h-5 w-5 text-primary rounded focus:ring-primary focus:ring-2 mt-0.5"
          />
          <div className="ml-3 flex-1 min-w-0">
            <p className={`text-body font-medium ${todo.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {todo.title}
            </p>
            {todo.description && (
              <p className={`text-sm ${todo.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                {todo.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Created: {new Date(todo.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => onUpdateTodo(todo.id, { completed: !todo.completed })}
              variant={todo.completed ? "secondary" : "primary"}
              size="sm"
            >
              {todo.completed ? 'Undo' : 'Complete'}
            </Button>
            <Button
              onClick={() => onDeleteTodo(todo.id)}
              variant="destructive"
              size="sm"
            >
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};