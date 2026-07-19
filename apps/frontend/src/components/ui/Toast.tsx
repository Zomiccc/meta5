'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

type Listener = (toasts: ToastItem[]) => void;

class ToastEmitter {
  private toasts: ToastItem[] = [];
  private listeners: Listener[] = [];

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit() {
    this.listeners.forEach((l) => l([...this.toasts]));
  }

  show(type: ToastType, message: string, duration = 4000) {
    const id = Math.random().toString(36).slice(2);
    this.toasts = [...this.toasts, { id, type, message }];
    this.emit();
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.emit();
  }
}

export const toastEmitter = new ToastEmitter();

export function useToast() {
  return {
    toast: (message: string, type: ToastType = 'info') => toastEmitter.show(type, message),
    success: (message: string) => toastEmitter.show('success', message),
    error: (message: string) => toastEmitter.show('error', message),
    info: (message: string) => toastEmitter.show('info', message),
  };
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-bnGreen" />,
  error: <AlertCircle className="h-4 w-4 text-bnRed" />,
  info: <Info className="h-4 w-4 text-yellow" />,
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toastEmitter.subscribe(setToasts);
  }, []);

  return (
    <div className="fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-start gap-3 rounded-bn border border-bn-border bg-bn-card p-3.5 shadow-bn-lg"
          >
            <div className="mt-0.5 shrink-0">{icons[toast.type]}</div>
            <p className="flex-1 text-sm leading-relaxed text-bnText-primary">{toast.message}</p>
            <button
              onClick={() => toastEmitter.dismiss(toast.id)}
              className="shrink-0 text-bnText-secondary transition hover:text-bnText-primary"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
