import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const TopBar: React.FC = () => {
  const { userProfile } = useAuth();

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-sm hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input 
            type="text" 
            placeholder="CMD_SEARCH..." 
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 h-10 text-xs text-white font-mono placeholder:text-slate-700 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="p-2 hover:bg-slate-900 rounded-xl relative transition-colors group">
          <Bell className="w-5 h-5 text-slate-500 group-hover:text-indigo-400" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-4 pl-6 border-l border-slate-900">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white uppercase tracking-tight">{userProfile?.name}</p>
            <p className="micro-label !text-indigo-400/60">{userProfile?.role.replace('_', ' ')}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 font-bold font-mono">
            {userProfile?.name.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
};
