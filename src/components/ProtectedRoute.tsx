import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ 
  children, 
  adminOnly = false,
  requireBusiness = true 
}: { 
  children: React.ReactNode, 
  adminOnly?: boolean,
  requireBusiness?: boolean
}) {
  const { user, profile, loading, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-gold w-12 h-12" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">Initializing Interface...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireBusiness && !profile && !isSuperAdmin) {
    // Check if the current route is already registration to avoid loops
    if (location.pathname !== '/register-business') {
      return <Navigate to="/register-business" replace />;
    }
  }

  if (profile?.mustChangePassword && location.pathname !== '/set-password') {
    return <Navigate to="/set-password" replace />;
  }

  return <>{children}</>;
}
