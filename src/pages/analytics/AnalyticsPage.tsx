import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import OKRAnalytics from './OKRAnalytics';
import FeedbackAnalytics from './FeedbackAnalytics';
import ExecutiveDashboard from './ExecutiveDashboard';

type AnalyticsTab = 'okr' | 'feedback' | 'reviews' | 'executive' | 'export';

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('okr');

  const getAvailableTabs = () => {
    const baseTabs = [
      { id: 'okr', label: 'OKR Analytics', icon: '🎯', description: 'Track OKR completion rates and progress' },
      { id: 'feedback', label: 'Feedback Analytics', icon: '💬', description: 'Analyze feedback patterns and sentiment' },
    ];

    if (user?.role === 'hr_admin') {
      baseTabs.push(
        { id: 'reviews', label: 'Review Analytics', icon: '📋', description: 'Review cycle completion and insights' },
        { id: 'executive', label: 'Executive Dashboard', icon: '📊', description: 'Company-wide strategic insights' },
        { id: 'export', label: 'Data Export', icon: '📤', description: 'Export analytics data' }
      );
    } else if (user?.role === 'manager') {
      baseTabs.push(
        { id: 'reviews', label: 'Review Analytics', icon: '📋', description: 'Team review insights' }
      );
    }

    return baseTabs;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'okr':
        return <OKRAnalytics />;
      case 'feedback':
        return <FeedbackAnalytics />;
      case 'reviews':
        return <ReviewAnalyticsPlaceholder />;
      case 'executive':
        return <ExecutiveDashboard />;
      case 'export':
        return <DataExportPlaceholder />;
      default:
        return <OKRAnalytics />;
    }
  };

  const availableTabs = getAvailableTabs();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Reporting</h1>
            <p className="mt-2 text-gray-600">
              Comprehensive insights into performance, engagement, and growth
            </p>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-8 overflow-x-auto">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AnalyticsTab)}
                className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2 text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
};

// Placeholder components for tabs not yet implemented
const ReviewAnalyticsPlaceholder: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="text-center py-12">
      <div className="text-gray-400 text-6xl mb-4">📋</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Review Analytics</h3>
      <p className="text-gray-600 mb-6">
        Comprehensive review cycle analytics and insights coming soon.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-blue-600 text-3xl mb-3">📈</div>
          <h4 className="font-semibold text-gray-900 mb-2">Completion Rates</h4>
          <p className="text-sm text-gray-600">
            Track review cycle completion across departments and teams
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-green-600 text-3xl mb-3">⭐</div>
          <h4 className="font-semibold text-gray-900 mb-2">Rating Analysis</h4>
          <p className="text-sm text-gray-600">
            Analyze rating distributions and calibration insights
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-purple-600 text-3xl mb-3">🎯</div>
          <h4 className="font-semibold text-gray-900 mb-2">Development Trends</h4>
          <p className="text-sm text-gray-600">
            Identify development patterns and growth opportunities
          </p>
        </div>
      </div>
    </div>
  </div>
);

const DataExportPlaceholder: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="text-center py-12">
      <div className="text-gray-400 text-6xl mb-4">📤</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Data Export</h3>
      <p className="text-gray-600 mb-6">
        Export analytics data in various formats for external analysis.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-blue-600 text-3xl mb-3">📊</div>
          <h4 className="font-semibold text-gray-900 mb-2">OKR Data Export</h4>
          <p className="text-sm text-gray-600 mb-4">
            Export OKR completion data, progress trends, and performance metrics
          </p>
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Export OKR Data
          </button>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-green-600 text-3xl mb-3">💬</div>
          <h4 className="font-semibold text-gray-900 mb-2">Feedback Data Export</h4>
          <p className="text-sm text-gray-600 mb-4">
            Export feedback analytics, sentiment data, and participation metrics
          </p>
          <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
            Export Feedback Data
          </button>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-purple-600 text-3xl mb-3">📋</div>
          <h4 className="font-semibold text-gray-900 mb-2">Review Data Export</h4>
          <p className="text-sm text-gray-600 mb-4">
            Export review cycle data, ratings, and development insights
          </p>
          <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
            Export Review Data
          </button>
        </div>
      </div>
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl mx-auto">
        <div className="flex items-center">
          <div className="text-yellow-600 text-xl mr-3">⚠️</div>
          <div>
            <h4 className="font-medium text-yellow-800">Export Formats</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Data can be exported in JSON, CSV, or Excel formats. Large exports may take a few minutes to process.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default AnalyticsPage; 