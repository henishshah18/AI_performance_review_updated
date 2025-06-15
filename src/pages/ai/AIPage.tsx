import React, { useState } from 'react';
import { 
  SparklesIcon, 
  CogIcon, 
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import AIDashboard from '../../components/ai/AIDashboard';
import AISettingsPanel from '../../components/ai/AISettingsPanel';

const AIPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');

  const tabs = [
    { 
      id: 'dashboard', 
      label: 'AI Dashboard', 
      icon: ChartBarIcon,
      description: 'View AI insights and analytics'
    },
    ...(user?.role === 'hr_admin' ? [{
      id: 'settings', 
      label: 'AI Settings', 
      icon: CogIcon,
      description: 'Configure AI features and parameters'
    }] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <SparklesIcon className="w-10 h-10 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI-Powered Insights</h1>
              <p className="text-gray-600">
                Leverage artificial intelligence to enhance your performance review process
              </p>
            </div>
          </div>

          {/* Feature Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <SparklesIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI Generation</h3>
                  <p className="text-sm text-gray-600">Generate review drafts with AI assistance</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Sentiment Analysis</h3>
                  <p className="text-sm text-gray-600">Analyze feedback sentiment automatically</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DocumentTextIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Smart Insights</h3>
                  <p className="text-sm text-gray-600">Get actionable insights from AI analysis</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                      ${activeTab === tab.id
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="text-left">
                      <div>{tab.label}</div>
                      <div className="text-xs text-gray-400">{tab.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'dashboard' && <AIDashboard />}
          {activeTab === 'settings' && user?.role === 'hr_admin' && <AISettingsPanel />}
        </div>
      </div>
    </div>
  );
};

export default AIPage; 