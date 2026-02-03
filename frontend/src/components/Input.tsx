import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  as?: 'input' | 'textarea';
  rows?: number;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  success,
  helperText,
  as = 'input',
  rows = 1,
  className = '',
  ...props
}) => {
  const hasError = Boolean(error);
  const hasSuccess = Boolean(success);

  const baseClasses = [
    'flex w-full rounded-lg border',
    'px-4 py-3 text-sm',
    'ring-offset-background',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'transition-all duration-200',
    hasError
      ? 'border-destructive focus-visible:ring-destructive'
      : hasSuccess
      ? 'border-success focus-visible:ring-success'
      : 'border-input focus-visible:ring-primary hover:border-primary/50',
    className
  ].join(' ');

  const inputClasses = [
    'h-10',
    baseClasses
  ].join(' ');

  const textareaClasses = [
    baseClasses
  ].join(' ');

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-foreground mb-2"
        >
          {label}
        </label>
      )}
      {as === 'textarea' ? (
        <textarea
          className={textareaClasses}
          rows={rows}
          {...props as React.TextareaHTMLAttributes<HTMLTextAreaElement>}
        />
      ) : (
        <input
          className={inputClasses}
          {...props}
        />
      )}
      {helperText && !hasError && !hasSuccess && (
        <p className="mt-2 text-sm text-muted-foreground">{helperText}</p>
      )}
      {hasError && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
      {hasSuccess && !hasError && (
        <p className="mt-2 text-sm text-success">{success}</p>
      )}
    </div>
  );
};