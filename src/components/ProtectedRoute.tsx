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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-navy w-10 h-10" />
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

  return <>{children}</>;
}
