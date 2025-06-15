import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_REDIRECTS } from '../types/auth';

export function NotFoundPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (isAuthenticated && user) {
      navigate(ROLE_REDIRECTS[user.role]);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {/* 404 Icon */}
          <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-gray-100 mb-6">
            <svg
              className="h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.467-.881-6.08-2.33m0 0l-.431-.43A7.963 7.963 0 013 12a7.963 7.963 0 012.489-5.74m0 0l.431-.43C7.533 4.881 9.66 4 12 4c2.34 0 4.467.881 6.08 2.33m0 0l.431.43A7.963 7.963 0 0121 12a7.963 7.963 0 01-2.489 5.74m0 0l-.431.43"
              />
            </svg>
          </div>

          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you might have entered the wrong URL.
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-4">
            {/* Suggestions */}
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                What can you do?
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Check the URL for typos
                </div>
                <div className="flex items-center">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Go back to the previous page
                </div>
                <div className="flex items-center">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Visit our dashboard
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3 pt-4">
              <button
                onClick={() => window.history.back()}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Go Back
              </button>
              
              <button
                onClick={handleGoHome}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}
              </button>

              {/* Quick Links for Authenticated Users */}
              {isAuthenticated && user && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-3 text-center">Quick Links</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {user.role === 'hr_admin' && (
                      <>
                        <Link
                          to="/admin/objectives"
                          className="text-center py-2 px-3 text-primary-600 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors"
                        >
                          Objectives
                        </Link>
                        <Link
                          to="/admin/analytics"
                          className="text-center py-2 px-3 text-primary-600 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors"
                        >
                          Analytics
                        </Link>
                      </>
                    )}
                    {user.role === 'manager' && (
                      <>
                        <Link
                          to="/team-goals"
                          className="text-center py-2 px-3 text-primary-600 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors"
                        >
                          Team Goals
                        </Link>
                        <Link
                          to="/feedback"
                          className="text-center py-2 px-3 text-primary-600 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors"
                        >
                          Feedback
                        </Link>
                      </>
                    )}
                    {user.role === 'individual_contributor' && (
                      <>
                        <Link
                          to="/goals"
                          className="text-center py-2 px-3 text-primary-600 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors"
                        >
                          My Goals
                        </Link>
                        <Link
                          to="/tasks"
                          className="text-center py-2 px-3 text-primary-600 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors"
                        >
                          My Tasks
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Still need help?{' '}
            <a
              href="mailto:support@reviewai.com"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage; 