'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TabsProps {
  tabs: { label: string; value: string }[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, active, onChange, className = '' }) => {
  return (
    <div className={`flex items-center gap-1 border-b border-bn-border ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors duration-200 ${
            active === tab.value ? 'text-bnText-primary' : 'text-bnText-secondary hover:text-bnText-primary'
          }`}
        >
          {tab.label}
          {active === tab.value && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow"
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            />
          )}
        </button>
      ))}
    </div>
  );
};
