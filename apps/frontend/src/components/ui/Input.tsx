import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, right, className = '', ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-xs font-medium text-bnText-secondary">
          {label}
        </label>
      )}
      <div className="relative flex items-stretch">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-bnText-muted">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={[
            'bn-input min-h-[44px] w-full flex-1',
            icon ? 'pl-10' : '',
            right ? 'pr-10' : '',
            error ? 'border-bnRed focus:border-bnRed focus:ring-bnRed/30' : '',
            className,
          ].join(' ')}
          {...props}
        />
        {right && (
          <span className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-bnText-secondary">
            {right}
          </span>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-bnRed">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';
