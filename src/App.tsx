/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ui/ProtectedRoute';
import { Layout } from './components/layout/Layout';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/dashboard/Dashboard';
import POSPage from './pages/pos/POSPage';
import InventoryPage from './pages/inventory/InventoryPage';
import ExpensesPage from './pages/expenses/ExpensesPage';
import UsersPage from './pages/users/UsersPage';
import SettingsPage from './pages/settings/SettingsPage';
import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['super_admin']}>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute roles={['business_owner', 'manager']}>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/pos" element={
            <ProtectedRoute roles={['business_owner', 'manager', 'salesperson']}>
              <Layout>
                <POSPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/inventory" element={
            <ProtectedRoute roles={['business_owner', 'manager']}>
              <Layout>
                <InventoryPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/expenses" element={
            <ProtectedRoute roles={['business_owner', 'manager']}>
              <Layout>
                <ExpensesPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute roles={['business_owner', 'manager']}>
              <Layout>
                <UsersPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute roles={['business_owner', 'manager', 'salesperson']}>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Add more routes as needed */}
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
