'use client';

import './globals.css';
import { useEffect } from 'react';
import { useAuth } from '@/store/auth';
// FIX: Changed import from '@/components/Navbar' to '@/components/Nav'
import Navbar from '@/components/Nav';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const hydrate = useAuth((s) => s.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}