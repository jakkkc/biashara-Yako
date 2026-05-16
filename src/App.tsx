import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Toaster } from 'react-hot-toast';

// Lazy load or import pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import InventoryPage from './pages/InventoryPage';
import ReportsPage from './pages/ReportsPage';
import ExpensesPage from './pages/ExpensesPage';
import UsersPage from './pages/UsersPage';
import BranchesPage from './pages/BranchesPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected SaaS Admin route */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute roles={['super_admin']}>
                  <AdminPage />
                </ProtectedRoute>
              } 
            />

            {/* Protected Business routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute roles={['business_owner', 'manager']}>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/pos" 
              element={
                <ProtectedRoute roles={['business_owner', 'manager', 'salesperson']}>
                  <POSPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/inventory" 
              element={
                <ProtectedRoute roles={['business_owner', 'manager']}>
                  <InventoryPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reports" 
              element={
                <ProtectedRoute roles={['business_owner', 'manager']}>
                  <ReportsPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/expenses" 
              element={
                <ProtectedRoute roles={['business_owner', 'manager']}>
                  <ExpensesPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/users" 
              element={
                <ProtectedRoute roles={['business_owner', 'manager']}>
                  <UsersPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/branches" 
              element={
                <ProtectedRoute roles={['business_owner']}>
                  <BranchesPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } 
            />

            {/* Fallback routing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#070714',
              color: '#f1f5f9',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '12px',
              fontFamily: 'var(--font-sans)',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
