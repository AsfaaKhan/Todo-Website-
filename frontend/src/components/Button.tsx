import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  ...props
}) => {
  const baseClasses = [
    'inline-flex items-center justify-center rounded-md font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'ring-offset-background'
  ];

  const variantClasses = {
    primary: [
      'bg-primary text-primary-foreground',
      'hover:bg-primary/90',
      'active:bg-primary/80',
      'shadow-md hover:shadow-lg transition-all duration-200'
    ],
    secondary: [
      'bg-accent text-accent-foreground',
      'hover:bg-accent/90',
      'active:bg-accent/80',
      'shadow-md hover:shadow-lg transition-all duration-200'
    ],
    ghost: [
      'hover:bg-accent hover:text-accent-foreground',
      'active:bg-accent/70',
      'transition-colors duration-200'
    ],
    destructive: [
      'bg-destructive text-destructive-foreground',
      'hover:bg-destructive/90',
      'active:bg-destructive/80',
      'shadow-md hover:shadow-lg transition-all duration-200'
    ]
  };

  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 py-2 text-base',
    lg: 'h-11 px-8 text-lg'
  };

  const classes = [
    ...baseClasses,
    ...(variantClasses[variant] || []),
    sizeClasses[size],
    className
  ].join(' ');

  return (
    <button
      className={classes}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <span className="mr-2 h-4 w-4 animate-spin" aria-label="Loading...">
          {/* Spinner SVG */}
          <svg
            className="h-full w-full"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </span>
      )}
      {children}
    </button>
  );
};