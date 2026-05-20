import React, { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useI18n } from './i18n/context';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterWizard from './pages/RegisterWizard';
import SuperAdminPanel from './pages/SuperAdminPanel';
import DashboardContainer from './pages/DashboardContainer';
import { ShoppingBag } from 'lucide-react';

export default function App() {
  const { user, profile, loading, isSuperAdmin, refreshProfile } = useAuth();
  const { t } = useI18n();
  const [currentNav, setCurrentNav] = useState<'landing' | 'login' | 'register_wizard' | 'dashboard' | 'super_admin'>('landing');

  // Dynamic Routing Engine based on Firebase Auth and profile status
  useEffect(() => {
    if (loading) return;

    if (user) {
      if (isSuperAdmin()) {
        setCurrentNav('super_admin');
      } else if (profile) {
        if (!profile.businessId) {
          // If authenticated but has no active businessTenantId linked yet
          setCurrentNav('register_wizard');
        } else {
          // Send straight to workspace
          setCurrentNav('dashboard');
        }
      } else {
        // Wait, what if the profile document is still fetching? We can double-check
        // If it resolved to null, it means registration wizard is required.
        const timer = setTimeout(() => {
          if (!profile) {
            setCurrentNav('register_wizard');
          }
        }, 1500);
        return () => clearTimeout(timer);
      }
    } else {
      // Force back to public views if logged out
      if (currentNav === 'dashboard' || currentNav === 'register_wizard' || currentNav === 'super_admin') {
        setCurrentNav('landing');
      }
    }
  }, [user, profile, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000B1A] flex flex-col items-center justify-center text-white relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#05172b_1px,transparent_1px),linear-gradient(to_bottom,#05172b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
        <div className="text-center space-y-4 relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#C9A84C] to-[#F0C96E] flex items-center justify-center animate-bounce shadow-xl shadow-[#C9A84C]/10 mx-auto">
            <ShoppingBag className="w-7 h-7 text-[#000B1A]" />
          </div>
          <p className="text-xs uppercase tracking-widest font-mono text-[#A0B4C8] animate-pulse">
            Syncing Ledger Nodes...
          </p>
        </div>
      </div>
    );
  }

  // Orchestrator switch views
  return (
    <>
      {currentNav === 'landing' && (
        <LandingPage onNavigate={(p: any) => setCurrentNav(p)} />
      )}
      {currentNav === 'login' && (
        <LoginPage onNavigate={(p: any) => setCurrentNav(p as any)} />
      )}
      {currentNav === 'register_wizard' && (
        <RegisterWizard onComplete={() => setCurrentNav('dashboard')} onNavigate={(p: any) => setCurrentNav(p as any)} />
      )}
      {currentNav === 'super_admin' && (
        <SuperAdminPanel onNavigate={(p: any) => setCurrentNav(p as any)} />
      )}
      {currentNav === 'dashboard' && (
        <DashboardContainer onNavigate={(p: any) => setCurrentNav(p as any)} />
      )}
    </>
  );
}
