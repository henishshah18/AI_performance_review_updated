import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, PUBLIC_ROUTES } from '../../types/auth';
import LoadingSpinner from '../common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  requireAuth = true 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, canAccessRoute } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Check if route requires authentication
  if (requireAuth && !isAuthenticated) {
    // Save the attempted location for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is authenticated but trying to access public routes (like login/signup)
  if (isAuthenticated && PUBLIC_ROUTES.includes(location.pathname)) {
    // Redirect to appropriate dashboard based on role
    const redirectPath = user?.role === 'hr_admin' 
      ? '/admin/dashboard' 
      : user?.role === 'manager' 
      ? '/dashboard' 
      : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // Check role-based permissions
  if (requireAuth && isAuthenticated && user) {
    // If specific roles are required, check if user has one of them
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }

    // Check if user can access the current route based on their role
    if (!canAccessRoute(location.pathname)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}

export default ProtectedRoute; 