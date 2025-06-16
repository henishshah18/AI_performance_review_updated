import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/common/Toast';
import authService from './services/authService';

// Layout Components
import Header from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import ObjectivesManagement from './pages/admin/ObjectivesManagement';
import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { IndividualDashboard } from './pages/individual/IndividualDashboard';
import { ReviewsPage } from './pages/ReviewsPage';
import { HRDashboard } from './pages/HRDashboard';

// Layout Component for authenticated users
function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={isMobileMenuOpen} onClose={handleMobileMenuClose} />
      
      {/* Main content area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden md:ml-64">
        {/* Header */}
        <Header 
          onMobileMenuToggle={handleMobileMenuToggle}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        
        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}

// Public Route Component (only accessible when not authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute>
          <SignupPage />
        </PublicRoute>
      } />
      
      {/* Protected Dashboard Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin/objectives" element={
        <ProtectedRoute>
          <ObjectivesManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/review-cycles" element={
        <ProtectedRoute>
          <ReviewsPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/analytics" element={
        <ProtectedRoute>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900">Admin Analytics</h1>
            <p className="text-gray-600 mt-2">Admin analytics dashboard coming soon...</p>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/admin/reports" element={
        <ProtectedRoute>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900">Admin Reports</h1>
            <p className="text-gray-600 mt-2">Admin reports coming soon...</p>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/admin/settings" element={
        <ProtectedRoute>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600 mt-2">System settings coming soon...</p>
          </div>
        </ProtectedRoute>
      } />
      
      {/* Placeholder routes for navigation items */}
      <Route path="/objectives" element={
        <ProtectedRoute>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900">Objectives</h1>
            <p className="text-gray-600 mt-2">Objectives management coming soon...</p>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/feedback" element={
        <ProtectedRoute>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
            <p className="text-gray-600 mt-2">Feedback system coming soon...</p>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/reviews" element={
        <ProtectedRoute>
          <ReviewsPage />
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-2">Analytics dashboard coming soon...</p>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/ai" element={
        <ProtectedRoute>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
            <p className="text-gray-600 mt-2">AI-powered insights coming soon...</p>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-2">User profile coming soon...</p>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">Settings page coming soon...</p>
          </div>
        </ProtectedRoute>
      } />
      
      {/* Manager Dashboard Routes */}
      <Route path="/manager/dashboard" element={
        <ProtectedRoute>
          <ManagerDashboard />
        </ProtectedRoute>
      } />
      
      {/* Individual Dashboard Routes */}
      <Route path="/individual/dashboard" element={
        <ProtectedRoute>
          <IndividualDashboard />
        </ProtectedRoute>
      } />
      
      {/* HR Dashboard Routes */}
      <Route path="/hr/dashboard" element={
        <ProtectedRoute>
          <HRDashboard />
        </ProtectedRoute>
      } />
      
      {/* 404 Route */}
      <Route 
        path="*" 
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900">404</h1>
              <p className="text-gray-600 mt-2">Page not found</p>
              <a href="/dashboard" className="mt-4 inline-block px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                Go to Dashboard
              </a>
            </div>
          </div>
        } 
      />
    </Routes>
  );
}

function AppWithRouter() {
  return (
    <Router>
      <div className="App">
        <ToastContainer />
        <AppRoutes />
      </div>
    </Router>
  );
}

function App() {
  useEffect(() => {
    // Initialize auth service on app startup
    authService.initialize();
  }, []);

  return (
    <ToastProvider>
      <AuthProvider>
        <AppWithRouter />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
