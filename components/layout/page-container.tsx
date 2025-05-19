'use client';

import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <main className={`container mx-auto max-w-4xl px-4 py-8 ${className}`}>
      {children}
    </main>
  );
}
