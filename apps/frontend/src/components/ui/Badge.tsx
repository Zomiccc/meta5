import React from 'react';

type BadgeColor = 'default' | 'success' | 'danger' | 'warning' | 'info';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  color?: BadgeColor;
}

const map: Record<BadgeColor, string> = {
  default: 'bg-bn-border text-bnText-secondary',
  success: 'bg-bnGreen/10 text-bnGreen',
  danger: 'bg-bnRed/10 text-bnRed',
  warning: 'bg-yellow/10 text-yellow',
  info: 'bg-bnBlue/10 text-blue-400',
};

export const Badge: React.FC<BadgeProps> = ({ children, color = 'default', className = '', ...props }) => (
  <span
    className={`inline-flex items-center rounded-bn px-2 py-0.5 text-xs font-medium ${map[color]} ${className}`}
    {...props}
  >
    {children}
  </span>
);
