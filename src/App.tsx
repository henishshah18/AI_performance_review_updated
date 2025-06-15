import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import authService from './services/authService';

// Layout Components
import { Layout } from './components/layout';

// Auth Components
import { ProtectedRoute } from './components/auth';
import AuthModals from './components/auth/AuthModals';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

// Review Pages
import { ReviewsPage } from './pages/reviews/ReviewsPage';
import { SelfAssessmentPage } from './pages/reviews/SelfAssessmentPage';
import { PeerReviewPage } from './pages/reviews/PeerReviewPage';

// Analytics Pages
import AnalyticsPage from './pages/analytics/AnalyticsPage';

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

              <Route 
                path="/forgot-password" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <ForgotPasswordPage />
                  </ProtectedRoute>
                } 
              />

              {/* Protected Routes with Layout */}
              
              {/* General Dashboard - Routes to role-specific dashboard */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['manager', 'individual_contributor']}>
                    <Layout>
                      <DashboardPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* HR Admin Dashboard */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['hr_admin']}>
                    <Layout>
                      <DashboardPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* Profile and Settings - Available to all authenticated users */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <div className="text-center">
                          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
                          <p className="text-gray-600 mt-2">Coming in Phase 7</p>
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute allowedRoles={['manager', 'individual_contributor']}>
                    <Layout>
                      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <div className="text-center">
                          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                          <p className="text-gray-600 mt-2">Coming in Phase 7</p>
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/settings" 
                element={
                  <ProtectedRoute allowedRoles={['hr_admin']}>
                    <Layout>
                      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <div className="text-center">
                          <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
                          <p className="text-gray-600 mt-2">Coming in Phase 7</p>
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/help" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <div className="text-center">
                          <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
                          <p className="text-gray-600 mt-2">Coming in Phase 7</p>
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/notifications" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <div className="text-center">
                          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                          <p className="text-gray-600 mt-2">Coming in Phase 7</p>
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* Placeholder routes for Phase 4+ with Layout */}
              <Route 
                path="/objectives" 
                element={
                  <ProtectedRoute allowedRoles={['hr_admin', 'manager']}>
                    <Layout>
                      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <div className="text-center">
                          <h1 className="text-2xl font-bold text-gray-900">Objectives Management</h1>
                          <p className="text-gray-600 mt-2">Coming in Phase 4</p>
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/team-goals" 
                element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <Layout>
                      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <div className="text-center">
                          <h1 className="text-2xl font-bold text-gray-900">Team Goals</h1>
                          <p className="text-gray-600 mt-2">Coming in Phase 4</p>
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/goals" 
                element={
                  <ProtectedRoute allowedRoles={['individual_contributor']}>
                    <Layout>
                      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <div className="text-center">
                          <h1 className="text-2xl font-bold text-gray-900">My Goals</h1>
                          <p className="text-gray-600 mt-2">Coming in Phase 4</p>
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/tasks" 
                element={
                  <ProtectedRoute allowedRoles={['individual_contributor']}>
                    <Layout>
                      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <div className="text-center">
                          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
                          <p className="text-gray-600 mt-2">Coming in Phase 4</p>
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/feedback" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <div className="text-center">
                          <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
                          <p className="text-gray-600 mt-2">Coming in Phase 5</p>
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/reviews" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ReviewsPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/reviews/self-assessment" 
                element={
                  <ProtectedRoute>
                    <SelfAssessmentPage />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/reviews/self-assessment/:cycleId" 
                element={
                  <ProtectedRoute>
                    <SelfAssessmentPage />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/reviews/self-assessment/:cycleId/:assessmentId" 
                element={
                  <ProtectedRoute>
                    <SelfAssessmentPage />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/reviews/peer-review" 
                element={
                  <ProtectedRoute>
                    <PeerReviewPage />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/reviews/peer-review/:cycleId/:revieweeId" 
                element={
                  <ProtectedRoute>
                    <PeerReviewPage />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/reviews/peer-review/:cycleId/:revieweeId/:reviewId" 
                element={
                  <ProtectedRoute>
                    <PeerReviewPage />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/progress" 
                element={
                  <ProtectedRoute allowedRoles={['individual_contributor']}>
                    <Layout>
                      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <div className="text-center">
                          <h1 className="text-2xl font-bold text-gray-900">My Progress</h1>
                          <p className="text-gray-600 mt-2">Coming in Phase 4</p>
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute allowedRoles={['hr_admin', 'manager']}>
                    <Layout>
                      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <div className="text-center">
                          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                          <p className="text-gray-600 mt-2">Coming in Phase 6</p>
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* Analytics Routes */}
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <AnalyticsPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/objectives" 
                element={
                  <ProtectedRoute allowedRoles={['hr_admin']}>
                    <Layout>
                      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <div className="text-center">
                          <h1 className="text-2xl font-bold text-gray-900">Objectives Management</h1>
                          <p className="text-gray-600 mt-2">Coming in Phase 4</p>
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/analytics" 
                element={
                  <ProtectedRoute allowedRoles={['hr_admin']}>
                    <Layout>
                      <AnalyticsPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/review-cycles" 
                element={
                  <ProtectedRoute allowedRoles={['hr_admin']}>
                    <Layout>
                      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <div className="text-center">
                          <h1 className="text-2xl font-bold text-gray-900">Review Cycles</h1>
                          <p className="text-gray-600 mt-2">Coming in Phase 6</p>
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* Error Routes - No Layout needed */}
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              
              {/* 404 Route - No Layout needed */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App; 