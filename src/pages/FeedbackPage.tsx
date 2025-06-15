import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import FeedbackDashboard from '../components/feedback/FeedbackDashboard';
import FeedbackList from '../components/feedback/FeedbackList';
import FeedbackAnalytics from '../components/feedback/FeedbackAnalytics';
import GlobalFeedbackModal from '../components/feedback/GlobalFeedbackModal';
import { feedbackService } from '../services/feedbackService';

const FeedbackPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'given' | 'received' | 'analytics'>('dashboard');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const handleFeedbackSubmit = async (data: any) => {
    try {
      await feedbackService.createFeedback(data);
      setShowFeedbackModal(false);
      // Refresh current tab data by changing activeTab temporarily
      const currentTab = activeTab;
      setActiveTab('dashboard');
      setTimeout(() => setActiveTab(currentTab), 100);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'given', label: 'Given', icon: '📤' },
    { id: 'received', label: 'Received', icon: '📥' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Continuous Feedback</h1>
              <p className="text-gray-600 mt-1">
                Share and receive feedback to drive continuous improvement
              </p>
            </div>
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
            >
              <span>💬</span>
              Give Feedback
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <FeedbackDashboard />
        )}

        {activeTab === 'given' && (
          <FeedbackList
            title="Feedback You've Given"
            filters={{ page_size: 10 }}
            showFilters={true}
          />
        )}

        {activeTab === 'received' && (
          <FeedbackList
            title="Feedback You've Received"
            filters={{ page_size: 10 }}
            showFilters={true}
          />
        )}

        {activeTab === 'analytics' && (
          <FeedbackAnalytics />
        )}
      </div>

      {/* Global Feedback Modal */}
      <GlobalFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
        currentUserId={user?.id}
      />
    </div>
  );
};

export default FeedbackPage;
