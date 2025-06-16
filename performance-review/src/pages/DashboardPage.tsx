import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import HRDashboard from './HRDashboard';
import ManagerDashboard from './manager/ManagerDashboard';
import IndividualDashboard from './individual/IndividualDashboard';

export function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Route to role-specific dashboard
  switch (user.role) {
    case 'hr_admin':
      return <HRDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'individual_contributor':
      return <IndividualDashboard />;
    default:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Invalid Role</h1>
            <p className="text-gray-600 mt-2">
              Your account role is not recognized. Please contact support.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Back to Login
            </button>
          </div>
        </div>
      );
  }
}

export default DashboardPage; 