import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: Array<'super_admin' | 'business_owner' | 'manager' | 'salesperson'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#050510] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  // 1. Not signed in? Send them to landing / signup
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Is this user's account suspended? Our AuthContext logs out suspended accounts automatically.
  // But as a secondary shield, we guard here.
  if (user.status === 'suspended') {
    return <Navigate to="/login" replace />;
  }

  // 3. Check role authorizations
  if (roles && !roles.includes(user.role)) {
    // If they aren't authorized for this area, send them to their operational home:
    if (user.role === 'super_admin') {
      return <Navigate to="/admin" replace />;
    }
    if (user.role === 'business_owner' || user.role === 'manager') {
      return <Navigate to="/dashboard" replace />;
    }
    if (user.role === 'salesperson') {
      return <Navigate to="/pos" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render protected view child
  return <>{children}</>;
};
export default ProtectedRoute;
