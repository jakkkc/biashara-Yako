import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import POSPage from './pages/sales/POSPage';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import BranchesPage from './pages/owner/BranchesPage';
import EmployeesPage from './pages/owner/EmployeesPage';
import InventoryPage from './pages/manager/InventoryPage';
import SalesHistoryPage from './pages/manager/SalesHistoryPage';
import BranchDashboard from './pages/manager/BranchDashboard';
import ExpensesPage from './pages/manager/ExpensesPage';
import ReportsPage from './pages/ReportsPage';
import AdminBusinessesPage from './pages/admin/AdminBusinessesPage';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';

// Lazy load pages later, for now placeholders
const DashboardPlaceholder = ({ title }: { title: string }) => (
  <div>
    <h2 className="text-2xl font-bold font-serif mb-6">{title}</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-32 flex flex-col justify-center">
        <p className="text-slate-500 text-sm font-medium">Coming Soon</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">Under Construction</p>
      </div>
    </div>
  </div>
);

function RootRedirect() {
  const { profile, loading } = useAuth();
  
  if (loading) return null;
  if (!profile) return <Navigate to="/login" replace />;

  switch (profile.role) {
    case 'super_admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'business_owner':
      return <Navigate to="/owner/dashboard" replace />;
    case 'manager':
      return <Navigate to="/manager/dashboard" replace />;
    case 'salesperson':
      return <Navigate to="/sales/pos" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route element={<Layout />}>
            <Route path="/" element={<RootRedirect />} />
            
            {/* Super Admin Routes */}
            <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/admin/businesses" element={<AdminBusinessesPage />} />
            
            {/* Owner Routes */}
            <Route path="/owner/dashboard" element={<OwnerDashboard />} />
            <Route path="/owner/branches" element={<BranchesPage />} />
            <Route path="/owner/employees" element={<EmployeesPage />} />
            <Route path="/owner/inventory" element={<InventoryPage />} />
            <Route path="/owner/reports" element={<ReportsPage />} />
            
            {/* Manager Routes */}
            <Route path="/manager/dashboard" element={<BranchDashboard />} />
            <Route path="/manager/sales" element={<SalesHistoryPage />} />
            <Route path="/manager/inventory" element={<InventoryPage />} />
            <Route path="/manager/expenses" element={<ExpensesPage />} />
            <Route path="/manager/employees" element={<DashboardPlaceholder title="Branch Staff" />} />
            <Route path="/manager/reports" element={<ReportsPage />} />
            
            {/* Sales Routes */}
            <Route path="/sales/pos" element={<POSPage />} />
            <Route path="/sales/my-sales" element={<SalesHistoryPage mySalesOnly />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
