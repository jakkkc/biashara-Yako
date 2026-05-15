import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../contexts/AuthContext';

export function Layout() {
  const { user, loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 relative overflow-hidden">
        <div className="mesh-gradient" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-[24px] glass flex items-center justify-center animate-pulse border border-white/10 shadow-2xl">
            <div className="w-8 h-8 rounded-lg bg-blue-500 animate-spin flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm" />
            </div>
          </div>
          <p className="mt-6 text-xs font-black text-blue-400 uppercase tracking-[0.3em] animate-pulse">Initializing System</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.status === 'suspended') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 relative overflow-hidden px-4">
        <div className="mesh-gradient" />
        <div className="glass-card p-12 rounded-[40px] border border-white/10 shadow-2xl max-w-md w-full text-center relative z-10 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 blur-[100px] rounded-full" />
          <div className="w-20 h-20 bg-red-600/20 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/20">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Account Suspended</h1>
          <p className="text-slate-400 font-medium mb-10 leading-relaxed">
            Your account access has been restricted. Please contact our system administrator for further clarification.
          </p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="w-full py-5 bg-white/5 hover:bg-white/10 text-white rounded-[20px] font-bold transition border border-white/10 active:scale-95"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden relative">
      <div className="mesh-gradient" />
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full relative z-10">
        <div className="max-w-7xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
