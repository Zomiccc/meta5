import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PriceChangeProps {
  value: number;
  suffix?: string;
  className?: string;
}

export const PriceChange: React.FC<PriceChangeProps> = ({ value, suffix = '%', className = '' }) => {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  const color = isNeutral ? 'text-bnText-muted' : isPositive ? 'text-bnGreen' : 'text-bnRed';
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const formatted = `${isPositive ? '+' : ''}${value.toFixed(2)}${suffix}`;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color} ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {formatted}
    </span>
  );
};
