import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to ReviewAI Dashboard
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Hello, {user?.first_name} {user?.last_name}!
              </p>
              <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h2>
                <div className="space-y-2 text-left">
                  <p><strong>Role:</strong> {user?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                  <p><strong>Email:</strong> {user?.email}</p>
                  {user?.role_title && <p><strong>Title:</strong> {user.role_title}</p>}
                  {user?.phone && <p><strong>Phone:</strong> {user.phone}</p>}
                </div>
              </div>
              <div className="mt-8">
                <p className="text-sm text-gray-500">
                  Phase 3 will include role-specific dashboards with analytics, objectives, and team management.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage; 