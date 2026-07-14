'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  value: string;
  className?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ value, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={`rounded-bn p-1.5 text-bnText-secondary transition-colors hover:bg-bn-hover hover:text-bnText-primary ${className}`}
      aria-label="Copy"
    >
      {copied ? <Check className="h-4 w-4 text-bnGreen" /> : <Copy className="h-4 w-4" />}
    </button>
  );
};
