import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-bn border border-bn-border bg-bn-card shadow-bn ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = 'Card';
