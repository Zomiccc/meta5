'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from './Skeleton';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  subValue?: React.ReactNode;
  icon?: React.ReactNode;
  loading?: boolean;
  variant?: 'default' | 'positive' | 'negative' | 'warning';
}

const variantBorder: Record<string, string> = {
  default: 'border-bn-border',
  positive: 'border-bnGreen/30',
  negative: 'border-bnRed/30',
  warning: 'border-yellow/30',
};

const variantIcon: Record<string, string> = {
  default: 'bg-bn-input text-bnText-secondary',
  positive: 'bg-bnGreen/10 text-bnGreen',
  negative: 'bg-bnRed/10 text-bnRed',
  warning: 'bg-yellow/10 text-yellow',
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, icon, loading, variant = 'default' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-bn border ${variantBorder[variant]} bg-bn-card p-4 shadow-bn`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-bnText-secondary">{label}</span>
        {icon && <div className={`flex h-8 w-8 items-center justify-center rounded-bn ${variantIcon[variant]}`}>{icon}</div>}
      </div>
      {loading ? <Skeleton className="h-7 w-24" /> : <div className="text-xl font-bold text-bnText-primary">{value}</div>}
      {subValue && !loading && <div className="mt-1 text-xs text-bnText-muted">{subValue}</div>}
    </motion.div>
  );
};
