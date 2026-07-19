import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  isLoading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-yellow text-black hover:bg-yellow-hover disabled:hover:bg-yellow disabled:opacity-40 shadow-glow-yellow',
  secondary:
    'border border-bn-border-light bg-bn-elevated text-bnText-primary hover:border-yellow/50 hover:text-yellow',
  ghost: 'text-bnText-secondary hover:bg-bn-hover hover:text-bnText-primary',
  danger:
    'bg-bnRed/10 text-bnRed border border-bnRed/20 hover:bg-bnRed/20',
  success:
    'bg-bnGreen/10 text-bnGreen border border-bnGreen/20 hover:bg-bnGreen/20',
};

const sizes: Record<Size, string> = {
  xs: 'px-2.5 py-1 text-2xs rounded-bn-sm',
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth, isLoading, children, className = '', disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={[
        'inline-flex items-center justify-center rounded-bn font-semibold transition-all duration-200 active:scale-[0.97] focus-ring',
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : '',
        (disabled || isLoading) ? 'cursor-not-allowed opacity-40' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {isLoading && (
        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
