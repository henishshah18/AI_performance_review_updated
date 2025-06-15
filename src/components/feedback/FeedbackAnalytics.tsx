import React, { useState, useEffect } from 'react';
import { feedbackService } from '../../services/feedbackService';
import { FeedbackAnalytics as FeedbackAnalyticsType, TeamFeedbackSummary } from '../../types/feedback';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import FeedbackStatsCard from './FeedbackStatsCard';

interface FeedbackAnalyticsProps {
  className?: string;
}

const FeedbackAnalytics: React.FC<FeedbackAnalyticsProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<FeedbackAnalyticsType | null>(null);
  const [teamSummary, setTeamSummary] = useState<TeamFeedbackSummary[]>([]);
  const [trendingTags, setTrendingTags] = useState<Array<{ tag_name: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    to: new Date().toISOString().split('T')[0], // today
  });

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const promises = [
        feedbackService.getFeedbackAnalytics(dateRange.from, dateRange.to),
        feedbackService.getTrendingTags(),
      ];

      // Add team summary for managers
      if (user?.role === 'manager') {
        promises.push(feedbackService.getTeamFeedbackSummary());
      }

      const results = await Promise.all(promises);
      
      setAnalytics(results[0]);
      setTrendingTags(results[1]);
      
      if (user?.role === 'manager' && results[2]) {
        setTeamSummary(results[2] as TeamFeedbackSummary[]);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (field: 'from' | 'to', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
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
        <ErrorMessage message={error} onRetry={loadAnalytics} />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data available</h3>
        <p className="text-gray-600">Analytics will appear once feedback activity begins.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Feedback Analytics</h2>
          <p className="text-gray-600 mt-1">
            Insights and trends from feedback activity
          </p>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => handleDateRangeChange('from', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => handleDateRangeChange('to', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FeedbackStatsCard
          title="Feedback Given"
          value={analytics.total_given}
          icon="📤"
          color="blue"
          subtitle="In selected period"
        />
        <FeedbackStatsCard
          title="Feedback Received"
          value={analytics.total_received}
          icon="📥"
          color="green"
          subtitle="In selected period"
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

      {/* Feedback Type Distribution */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Feedback Type Distribution
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl">👏</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {analytics.feedback_by_type.commendation}
            </div>
            <div className="text-sm text-gray-600">Commendations</div>
            <div className="text-xs text-gray-500 mt-1">
              {analytics.total_received > 0 
                ? Math.round((analytics.feedback_by_type.commendation / analytics.total_received) * 100)
                : 0}% of total
            </div>
          </div>
          
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl">💡</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {analytics.feedback_by_type.guidance}
            </div>
            <div className="text-sm text-gray-600">Guidance</div>
            <div className="text-xs text-gray-500 mt-1">
              {analytics.total_received > 0 
                ? Math.round((analytics.feedback_by_type.guidance / analytics.total_received) * 100)
                : 0}% of total
            </div>
          </div>
          
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl">🔧</span>
            </div>
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {analytics.feedback_by_type.constructive}
            </div>
            <div className="text-sm text-gray-600">Constructive</div>
            <div className="text-xs text-gray-500 mt-1">
              {analytics.total_received > 0 
                ? Math.round((analytics.feedback_by_type.constructive / analytics.total_received) * 100)
                : 0}% of total
            </div>
          </div>
        </div>
      </div>

      {/* Trending Tags */}
      {trendingTags.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Trending Feedback Tags
          </h3>
          <div className="flex flex-wrap gap-3">
            {trendingTags.slice(0, 15).map((tag, index) => (
              <div
                key={tag.tag_name}
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                  index < 3
                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-200'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {index < 3 && <span className="mr-2">🏆</span>}
                {tag.tag_name}
                <span className="ml-2 text-xs bg-white bg-opacity-50 px-2 py-1 rounded-full">
                  {tag.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Trends */}
      {analytics.monthly_trends && analytics.monthly_trends.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Monthly Feedback Trends
          </h3>
          <div className="space-y-4">
            {analytics.monthly_trends.map((trend) => (
              <div key={trend.month} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">{trend.month}</div>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-600">📤</span>
                    <span className="text-sm text-gray-600">Given:</span>
                    <span className="font-semibold text-blue-600">{trend.given}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">📥</span>
                    <span className="text-sm text-gray-600">Received:</span>
                    <span className="font-semibold text-green-600">{trend.received}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Summary (for managers) */}
      {user?.role === 'manager' && teamSummary.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Team Feedback Summary
          </h3>
          <div className="space-y-4">
            {teamSummary.map((member) => (
              <div key={member.team_member.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {member.team_member.first_name[0]}{member.team_member.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {member.team_member.first_name} {member.team_member.last_name}
                      </div>
                      <div className="text-sm text-gray-600">{member.team_member.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">{member.feedback_given_count}</div>
                      <div className="text-gray-500">Given</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-600">{member.feedback_received_count}</div>
                      <div className="text-gray-500">Received</div>
                    </div>
                  </div>
                </div>
                
                {/* Feedback Type Breakdown */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-semibold text-green-600">{member.feedback_by_type.commendation}</div>
                    <div className="text-gray-600">👏 Commendations</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="font-semibold text-blue-600">{member.feedback_by_type.guidance}</div>
                    <div className="text-gray-600">💡 Guidance</div>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <div className="font-semibold text-orange-600">{member.feedback_by_type.constructive}</div>
                    <div className="text-gray-600">🔧 Constructive</div>
                  </div>
                </div>

                {/* Top Tags */}
                {member.top_received_tags.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-600 mb-2">Top feedback tags:</div>
                    <div className="flex flex-wrap gap-1">
                      {member.top_received_tags.slice(0, 5).map((tag) => (
                        <span
                          key={tag.tag_name}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                        >
                          {tag.tag_name} ({tag.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Participation Overview */}
      {analytics.team_participation && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Team Participation Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {analytics.team_participation.active_givers}
              </div>
              <div className="text-sm text-gray-600">Active Feedback Givers</div>
              <div className="text-xs text-gray-500 mt-1">
                Out of {analytics.team_participation.total_team_members} team members
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {analytics.team_participation.active_receivers}
              </div>
              <div className="text-sm text-gray-600">Receiving Feedback</div>
              <div className="text-xs text-gray-500 mt-1">
                Team members with feedback
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {Math.round(
                  (analytics.team_participation.active_givers / 
                   analytics.team_participation.total_team_members) * 100
                )}%
              </div>
              <div className="text-sm text-gray-600">Participation Rate</div>
              <div className="text-xs text-gray-500 mt-1">
                Team engagement level
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackAnalytics;
