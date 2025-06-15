import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { feedbackService } from '../../services/feedbackService';
import { FeedbackAnalytics, Feedback } from '../../types/feedback';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import FeedbackCard from './FeedbackCard';
import FeedbackStatsCard from './FeedbackStatsCard';
import GlobalFeedbackModal from './GlobalFeedbackModal';

interface FeedbackDashboardProps {
  className?: string;
}

const FeedbackDashboard: React.FC<FeedbackDashboardProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [recentFeedback, setRecentFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, [refreshTrigger]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load analytics and recent feedback in parallel
      const [analyticsData, recentData] = await Promise.all([
        feedbackService.getFeedbackAnalytics(),
        feedbackService.getFeedback({ page_size: 5 }),
      ]);

      setAnalytics(analyticsData);
      setRecentFeedback(recentData.results);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (data: any) => {
    try {
      await feedbackService.createFeedback(data);
      setRefreshTrigger(prev => prev + 1);
      setShowFeedbackModal(false);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center py-12 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <ErrorMessage message={error} onRetry={loadDashboardData} />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track your feedback activity and team insights
          </p>
        </div>
        <button
          onClick={() => setShowFeedbackModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>💬</span>
          Give Feedback
        </button>
      </div>

      {/* Stats Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeedbackStatsCard
            title="Feedback Given"
            value={analytics.total_given}
            icon="📤"
            color="blue"
            subtitle="This month"
          />
          <FeedbackStatsCard
            title="Feedback Received"
            value={analytics.total_received}
            icon="📥"
            color="green"
            subtitle="This month"
          />
          <FeedbackStatsCard
            title="Commendations"
            value={analytics.feedback_by_type.commendation}
            icon="👏"
            color="emerald"
            subtitle="Positive feedback"
          />
          <FeedbackStatsCard
            title="Growth Areas"
            value={analytics.feedback_by_type.constructive}
            icon="🔧"
            color="orange"
            subtitle="Improvement feedback"
          />
        </div>
      )}

      {/* Feedback Type Breakdown */}
      {analytics && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Feedback Type Distribution
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">👏</div>
              <div className="text-2xl font-bold text-green-600">
                {analytics.feedback_by_type.commendation}
              </div>
              <div className="text-sm text-gray-600">Commendations</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">💡</div>
              <div className="text-2xl font-bold text-blue-600">
                {analytics.feedback_by_type.guidance}
              </div>
              <div className="text-sm text-gray-600">Guidance</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl mb-2">🔧</div>
              <div className="text-2xl font-bold text-orange-600">
                {analytics.feedback_by_type.constructive}
              </div>
              <div className="text-sm text-gray-600">Constructive</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Tags */}
      {analytics && analytics.top_tags.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Most Common Feedback Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {analytics.top_tags.slice(0, 10).map((tag, index) => (
              <span
                key={tag.tag_name}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {tag.tag_name}
                <span className="ml-1 text-xs bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded-full">
                  {tag.count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Feedback */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Recent Feedback</h2>
            <a
              href="/feedback/all"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All →
            </a>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {recentFeedback.length > 0 ? (
            recentFeedback.map((feedback) => (
              <div key={feedback.id} className="p-6">
                <FeedbackCard
                  feedback={feedback}
                  showActions={false}
                  compact={true}
                />
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              <div className="text-4xl mb-2">💬</div>
              <p>No recent feedback found</p>
              <p className="text-sm mt-1">Start giving feedback to see activity here</p>
            </div>
          )}
        </div>
      </div>

      {/* Team Participation (for managers) */}
      {user?.role === 'manager' && analytics?.team_participation && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Team Feedback Participation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {analytics.team_participation.active_givers}
              </div>
              <div className="text-sm text-gray-600">Active Feedback Givers</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {analytics.team_participation.active_receivers}
              </div>
              <div className="text-sm text-gray-600">Receiving Feedback</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(
                  (analytics.team_participation.active_givers /
                    analytics.team_participation.total_team_members) *
                    100
                )}%
              </div>
              <div className="text-sm text-gray-600">Participation Rate</div>
            </div>
          </div>
        </div>
      )}

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

export default FeedbackDashboard; 