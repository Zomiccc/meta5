import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div
    className={`animate-shimmer rounded-bn bg-gradient-to-r from-bn-card via-bn-border-light to-bn-card bg-[length:200%_100%] ${className}`}
  />
);
