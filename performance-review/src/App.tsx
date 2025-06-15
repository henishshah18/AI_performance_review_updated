import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ToastProvider } from '../src/contexts/ToastContext';
import authService from '../src/services/authService';

// Auth Components
import { ProtectedRoute } from '../src/components/auth';
import AuthModals from '../src/components/auth/AuthModals';

// Pages
import LoginPage from '../src/pages/LoginPage';
import SignupPage from '../src/pages/SignupPage';
import DashboardPage from '../src/pages/DashboardPage';
import UnauthorizedPage from '../src/pages/UnauthorizedPage';

// Styles
import './index.css';

function App() {
  useEffect(() => {
    // Initialize auth service on app startup
    authService.initialize();
  }, []);

  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            {/* Auth Modals - shown based on user state */}
            <AuthModals />
            
            <Routes>
              {/* Public Routes */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <Navigate to="/login" replace />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/login" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <LoginPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/signup" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <SignupPage />
                  </ProtectedRoute>
                } 
              />

              {/* Protected Routes - General Dashboard */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['manager', 'individual_contributor']}>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />

              {/* Protected Routes - HR Admin */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['hr_admin']}>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />

              {/* Placeholder routes for Phase 3+ */}
              <Route 
                path="/objectives" 
                element={
                  <ProtectedRoute allowedRoles={['hr_admin', 'manager']}>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900">Objectives Management</h1>
                        <p className="text-gray-600 mt-2">Coming in Phase 4</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/team-goals" 
                element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900">Team Goals</h1>
                        <p className="text-gray-600 mt-2">Coming in Phase 4</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/goals" 
                element={
                  <ProtectedRoute allowedRoles={['individual_contributor']}>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900">My Goals</h1>
                        <p className="text-gray-600 mt-2">Coming in Phase 4</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/tasks" 
                element={
                  <ProtectedRoute allowedRoles={['individual_contributor']}>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
                        <p className="text-gray-600 mt-2">Coming in Phase 4</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/feedback" 
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
                        <p className="text-gray-600 mt-2">Coming in Phase 5</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/reviews" 
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
                        <p className="text-gray-600 mt-2">Coming in Phase 6</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                } 
              />

              {/* Error Routes */}
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              
              {/* 404 Route */}
              <Route 
                path="*" 
                element={
                  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-900">404</h1>
                      <p className="text-gray-600 mt-2">Page not found</p>
                      <a href="/dashboard" className="text-primary-600 hover:text-primary-500 mt-4 inline-block">
                        Go to Dashboard
                      </a>
                    </div>
                  </div>
                } 
              />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
