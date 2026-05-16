import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { firebaseUser, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Not logged in to Firebase
  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but no profile (new user needs registration)
  if (!userProfile && location.pathname !== '/register') {
    return <Navigate to="/register" replace />;
  }

  // Profile exists but role not allowed
  if (userProfile && roles && !roles.includes(userProfile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Suspended check
  if (userProfile?.status === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 text-center">
        <div className="glass-card p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Account Suspended</h1>
          <p className="text-slate-400">Your account has been suspended. Please contact support.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
