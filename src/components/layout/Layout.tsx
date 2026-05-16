import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#050510] flex flex-col items-center justify-center gap-4 z-50">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-emerald-500 to-indigo-500 animate-pulse" />
        {/* Glowing glass loading card */}
        <div className="glass-card max-w-sm p-8 text-center flex flex-col items-center gap-4 border-indigo-500/20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500" />
          <div className="space-y-1.5 mt-2">
            <h3 className="text-white font-bold tracking-wide">Inarudisha data yako...</h3>
            <p className="text-xs text-slate-400">Loading Biashara Yako POS resources. Please wait.</p>
          </div>
        </div>
      </div>
    );
  }

  // If not logged in, just display the clean public viewport (landing, login, registration)
  if (!user) {
    return <main className="min-h-screen text-slate-100">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-[#050510] text-slate-200 overflow-hidden font-sans">
      
      {/* 1. Desktop & Tablet Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* 2. Main Window Wrapper */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 min-h-screen ${
          collapsed ? 'md:pl-16' : 'md:pl-64'
        }`}
      >
        {/* Top Header tools */}
        <TopBar />

        {/* Dynamic routing scroll page contents */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6 text-slate-100 bg-slate-950/20">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>

        {/* Mobile Bottom navbar */}
        <BottomNav />
      </div>
    </div>
  );
};
export default Layout;
