'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  children: ReactNode;
  user?: {
    name: string;
    email: string;
    role: 'admin' | 'operator';
  };
  company?: {
    name: string;
    environment: 'homolog' | 'prod';
  };
}

export function AppLayout({ children, user, company }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="ml-64">
        <Header user={user} company={company} />
        
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
