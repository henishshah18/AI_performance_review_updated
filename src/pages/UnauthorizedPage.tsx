import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_REDIRECTS } from '../types/auth';

export function UnauthorizedPage() {
  const { user, logout } = useAuth();

  const handleGoHome = () => {
    if (user) {
      return ROLE_REDIRECTS[user.role];
    }
    return '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <svg
            className="mx-auto h-24 w-24 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-500">
              This page requires different permissions than your current role provides.
            </p>
            
            {user && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Current Role:</strong> {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>
            )}

            <div className="flex flex-col space-y-3">
              <Link
                to={handleGoHome()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Go to Dashboard
              </Link>
              
              <button
                onClick={logout}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnauthorizedPage; 