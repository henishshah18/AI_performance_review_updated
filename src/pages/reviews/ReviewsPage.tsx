import React, { useState } from 'react';
import { 
  ChartBarIcon,
  DocumentTextIcon,
  UsersIcon,
  CalendarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { ReviewDashboard } from '../../components/reviews/ReviewDashboard';
import { ReviewAnalytics } from '../../components/reviews/ReviewAnalytics';
import { ReviewCycleManager } from '../../components/reviews/ReviewCycleManager';
import { useAuth } from '../../contexts/AuthContext';

type TabType = 'dashboard' | 'analytics' | 'cycles' | 'reviews';

export const ReviewsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const tabs = [
    {
      id: 'dashboard' as TabType,
      name: 'Dashboard',
      icon: ChartBarIcon,
      description: 'Overview of your review activities',
      roles: ['individual_contributor', 'manager', 'hr_admin']
    },
    {
      id: 'analytics' as TabType,
      name: 'Analytics',
      icon: DocumentTextIcon,
      description: 'Review insights and metrics',
      roles: ['manager', 'hr_admin']
    },
    {
      id: 'cycles' as TabType,
      name: 'Cycle Management',
      icon: CalendarIcon,
      description: 'Create and manage review cycles',
      roles: ['hr_admin']
    },
    {
      id: 'reviews' as TabType,
      name: 'Review Management',
      icon: UsersIcon,
      description: 'Manage individual reviews',
      roles: ['manager', 'hr_admin']
    }
  ];

  const availableTabs = tabs.filter(tab => 
    tab.roles.includes(user?.role || 'individual_contributor')
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ReviewDashboard />;
      case 'analytics':
        return <ReviewAnalytics />;
      case 'cycles':
        return <ReviewCycleManager />;
      case 'reviews':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Review Management</h3>
            <p className="text-gray-600">
              Individual review management features coming soon.
            </p>
          </div>
        );
      default:
        return <ReviewDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Cog6ToothIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Performance Reviews</h1>
                <p className="text-sm text-gray-600">360° Performance Review System</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {availableTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon
                    className={`-ml-0.5 mr-2 h-5 w-5 ${
                      isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Description */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <p className="text-sm text-blue-700">
            {availableTabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>
    </div>
  );
}; 