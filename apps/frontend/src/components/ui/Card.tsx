import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  noPadding?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', interactive, noPadding, ...props }, ref) => (
    <div
      ref={ref}
      className={[
        'rounded-bn border border-bn-border bg-bn-card shadow-card',
        interactive ? 'transition-all duration-300 hover:shadow-card-hover hover:border-bn-border-light' : '',
        noPadding ? '' : 'p-4',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = 'Card';
