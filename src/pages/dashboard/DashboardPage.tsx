import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import { useIsMobile } from '../../hooks/useIsMobile';
import OverviewView from './views/OverviewView';
import POSView from './views/POSView';
import InventoryView from './views/InventoryView';
import SalesHistoryView from './views/SalesHistoryView';
import ExpensesView from './views/ExpensesView';
import CustomersView from './views/CustomersView';
import ReportsView from './views/ReportsView';
import SettingsView from './views/SettingsView';
import { useAuth } from '../../hooks/useAuth';

export default function DashboardPage() {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-navy flex selection:bg-gold/30">
      {!isMobile && <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />}
      
      <main className={`flex-1 flex flex-col transition-all duration-300 ${!isMobile ? (collapsed ? 'ml-20' : 'ml-72') : 'ml-0 mb-16'}`}>
        {/* Top Header */}
        <header className="h-20 bg-navy border-b border-slate-800 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-40 backdrop-blur-xl bg-navy/80">
          <div className="flex items-center gap-4">
            {isMobile && (
              <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center shrink-0">
                <span className="text-navy font-black text-xl">B</span>
              </div>
            )}
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-white tracking-tight leading-none mb-1">
                {isMobile ? 'Biashara Yako' : 'Overview Dashboard'}
              </h2>
              <p className="hidden sm:block text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                Welcome back, <span className="text-gold">{profile?.displayName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="bg-navy-muted border border-slate-800 rounded-full px-4 py-2 flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
              <span className="text-[10px] font-mono font-bold text-slate-400">SYNCED</span>
            </div>

            <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
               <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center border border-gold/20 overflow-hidden shadow-lg shadow-gold/5">
                  {profile?.photoUrl ? (
                    <img src={profile.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-navy font-black leading-none">{profile?.displayName?.charAt(0)}</span>
                  )}
               </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-x-hidden">
          <Routes>
            <Route index element={<OverviewView />} />
            <Route path="pos" element={<POSView />} />
            <Route path="inventory" element={<InventoryView />} />
            <Route path="sales" element={<SalesHistoryView />} />
            <Route path="expenses" element={<ExpensesView />} />
            <Route path="customers" element={<CustomersView />} />
            <Route path="reports" element={<ReportsView />} />
            <Route path="settings" element={<SettingsView />} />
          </Routes>
        </div>

        {/* Real Footer from Design */}
        <footer className="h-12 border-t border-slate-800 flex items-center justify-between px-8 text-[11px] text-slate-500 bg-navy shrink-0">
          <div className="flex items-center space-x-6 uppercase font-bold tracking-widest">
            <span>System Version 2.0.1 (PWA Ready)</span>
            <span className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              <span>Database Synced</span>
            </span>
          </div>
          <p>Designed and built by <a href="https://nex-chi-six.vercel.app/" target="_blank" className="text-gold hover:text-white transition-colors underline decoration-gold/30">Jackson Mwaniki Munene</a></p>
        </footer>
      </main>
      {isMobile && <BottomNav />}
    </div>
  );
}
