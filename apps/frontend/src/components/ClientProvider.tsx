'use client';

import { ToastContainer } from './ui/Toast';

export function ClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
