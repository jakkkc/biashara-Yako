import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { Toaster } from 'react-hot-toast';
import { OfflineBanner } from '../ui/OfflineBanner';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <TopBar />
        <main className="flex-1 p-6 md:p-10 pb-24 lg:pb-10 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
        <BottomNav />
      </div>
      <Toaster 
        position="top-right" 
        toastOptions={{
          className: 'glass text-white border border-white/10',
          style: {
            background: 'rgba(30, 41, 59, 0.9)',
            backdropFilter: 'blur(12px)',
          }
        }} 
      />
      <OfflineBanner />
    </div>
  );
};
