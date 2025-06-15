import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import analyticsService from '../../services/analyticsService';
import AnalyticsCard from '../../components/analytics/AnalyticsCard';
import AnalyticsChart from '../../components/analytics/AnalyticsChart';
import {
  FeedbackMetrics,
  FeedbackSentimentAnalysis,
  FeedbackTagAnalysis,
  FeedbackParticipationRates,
  TrendAnalysis,
  AnalyticsFilters,
  ChartDataPoint,
  TimeSeriesDataPoint
} from '../../types/analytics';

const FeedbackAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [volumeTrends, setVolumeTrends] = useState<TrendAnalysis | null>(null);
  const [sentimentAnalysis, setSentimentAnalysis] = useState<FeedbackSentimentAnalysis | null>(null);
  const [tagAnalysis, setTagAnalysis] = useState<FeedbackTagAnalysis | null>(null);
  const [participationRates, setParticipationRates] = useState<FeedbackParticipationRates | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    ...analyticsService.getDefaultDateRange(30)
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'sentiment' | 'tags' | 'participation'>('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [filters]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Load volume trends
      const trendsData = await analyticsService.getFeedbackVolumeTrends(filters);
      setVolumeTrends(trendsData);

      // Load sentiment analysis (only for managers and HR admins)
      if (user?.role !== 'individual_contributor') {
        const sentimentData = await analyticsService.getFeedbackSentimentAnalysis(filters);
        setSentimentAnalysis(sentimentData);

        const participationData = await analyticsService.getFeedbackParticipationRates(filters);
        setParticipationRates(participationData);
      }

      // Load tag analysis
      const tagData = await analyticsService.getFeedbackTagFrequency(filters);
      setTagAnalysis(tagData);

    } catch (error) {
      console.error('Failed to load feedback analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (range: 'week' | 'month' | 'quarter' | 'year') => {
    let dateRange;
    switch (range) {
      case 'week':
        dateRange = analyticsService.getDefaultDateRange(7);
        break;
      case 'month':
        dateRange = analyticsService.getDefaultDateRange(30);
        break;
      case 'quarter':
        dateRange = analyticsService.getQuarterDateRange();
        break;
      case 'year':
        dateRange = analyticsService.getYearDateRange();
        break;
      default:
        dateRange = analyticsService.getDefaultDateRange(30);
    }
    setFilters({ ...filters, ...dateRange });
  };

  const formatVolumeTrendsData = (): TimeSeriesDataPoint[] => {
    if (!volumeTrends) return [];
    
    return volumeTrends.trends.map(trend => ({
      date: trend.week_start,
      value: trend.value,
      label: `Week of ${new Date(trend.week_start).toLocaleDateString()}`
    }));
  };

  const formatFeedbackTypeData = (): ChartDataPoint[] => {
    if (!sentimentAnalysis?.feedback_metrics.type_distribution) return [];
    
    const typeDistribution = sentimentAnalysis.feedback_metrics.type_distribution;
    return [
      { label: 'Commendation 👏', value: typeDistribution.commendation || 0, color: '#10B981' },
      { label: 'Guidance 💡', value: typeDistribution.guidance || 0, color: '#3B82F6' },
      { label: 'Constructive 🔧', value: typeDistribution.constructive || 0, color: '#F59E0B' }
    ];
  };

  const formatSentimentData = (): ChartDataPoint[] => {
    if (!sentimentAnalysis) return [];
    
    return [
      { label: 'Positive', value: sentimentAnalysis.sentiment_distribution.positive, color: '#10B981' },
      { label: 'Neutral', value: sentimentAnalysis.sentiment_distribution.neutral, color: '#6B7280' },
      { label: 'Negative', value: sentimentAnalysis.sentiment_distribution.negative, color: '#EF4444' }
    ];
  };

  const formatSentimentTrendsData = (): TimeSeriesDataPoint[] => {
    if (!sentimentAnalysis) return [];
    
    return sentimentAnalysis.sentiment_trends.map(trend => ({
      date: trend.week,
      value: trend.score * 100, // Convert to percentage
      label: `Week of ${new Date(trend.week).toLocaleDateString()}`
    }));
  };

  const formatTopTagsData = (): ChartDataPoint[] => {
    if (!tagAnalysis?.top_tags) return [];
    
    return tagAnalysis.top_tags.slice(0, 10).map((tag, index) => ({
      label: tag.tag_name,
      value: tag.count,
      color: undefined // Will use default colors
    }));
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Total Feedback"
          value={sentimentAnalysis?.feedback_metrics.total_feedback || 0}
          subtitle="This period"
          trend={{
            direction: volumeTrends?.analysis.trend_direction === 'increasing' ? 'up' : 
                     volumeTrends?.analysis.trend_direction === 'decreasing' ? 'down' : 'stable',
            percentage: volumeTrends?.analysis.trend_percentage || 0,
            period: 'last period'
          }}
          icon="💬"
          color="blue"
          loading={loading}
        />
        
        <AnalyticsCard
          title="Participation Rate"
          value={`${participationRates?.participation_rate || 0}%`}
          subtitle="Active participants"
          icon="👥"
          color="green"
          loading={loading}
        />
        
        <AnalyticsCard
          title="Anonymous Feedback"
          value={`${sentimentAnalysis?.feedback_metrics.anonymous_percentage || 0}%`}
          subtitle="Of total feedback"
          icon="🎭"
          color="purple"
          loading={loading}
        />
        
        <AnalyticsCard
          title="Sentiment Score"
          value={sentimentAnalysis ? (sentimentAnalysis.sentiment_score * 100).toFixed(1) : '0'}
          subtitle="Overall positivity"
          icon="😊"
          color={sentimentAnalysis?.overall_sentiment === 'positive' ? 'green' : 
                 sentimentAnalysis?.overall_sentiment === 'negative' ? 'red' : 'yellow'}
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart
          data={formatVolumeTrendsData()}
          title="Feedback Volume Trends"
          type="line"
          height={300}
        />
        
        <AnalyticsChart
          data={formatFeedbackTypeData()}
          title="Feedback Type Distribution"
          type="doughnut"
          height={300}
        />
      </div>
    </div>
  );

  const renderSentimentTab = () => {
    if (user?.role === 'individual_contributor') {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔒</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">Sentiment analysis is only available to Managers and HR Administrators.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Sentiment Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnalyticsCard
            title="Overall Sentiment"
            value={sentimentAnalysis?.overall_sentiment.toUpperCase() || 'N/A'}
            subtitle={`Score: ${sentimentAnalysis ? (sentimentAnalysis.sentiment_score * 100).toFixed(1) : '0'}/100`}
            icon={sentimentAnalysis?.overall_sentiment === 'positive' ? '😊' : 
                 sentimentAnalysis?.overall_sentiment === 'negative' ? '😞' : '😐'}
            color={sentimentAnalysis?.overall_sentiment === 'positive' ? 'green' : 
                  sentimentAnalysis?.overall_sentiment === 'negative' ? 'red' : 'yellow'}
            loading={loading}
          />
          
          <AnalyticsCard
            title="Positive Feedback"
            value={`${sentimentAnalysis?.sentiment_distribution.positive || 0}%`}
            subtitle="Of all feedback"
            icon="👍"
            color="green"
            loading={loading}
          />
          
          <AnalyticsCard
            title="Areas for Improvement"
            value={`${sentimentAnalysis?.sentiment_distribution.negative || 0}%`}
            subtitle="Constructive feedback"
            icon="🔧"
            color="red"
            loading={loading}
          />
        </div>

        {/* Sentiment Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnalyticsChart
            data={formatSentimentData()}
            title="Sentiment Distribution"
            type="pie"
            height={300}
          />
          
          <AnalyticsChart
            data={formatSentimentTrendsData()}
            title="Sentiment Trends Over Time"
            type="line"
            height={300}
          />
        </div>

        {/* Sentiment Insights */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Sentiment Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Positive Indicators</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• High collaboration scores</li>
                <li>• Increased commendation feedback</li>
                <li>• Positive trend in sentiment score</li>
                <li>• Strong team dynamics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Areas to Watch</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Communication feedback frequency</li>
                <li>• Technical skill development needs</li>
                <li>• Leadership feedback patterns</li>
                <li>• Cross-team collaboration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTagsTab = () => (
    <div className="space-y-6">
      <AnalyticsChart
        data={formatTopTagsData()}
        title="Most Common Feedback Tags"
        type="bar"
        height={400}
      />
      
      {tagAnalysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tag Trends */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Tag Trends</h3>
            <div className="space-y-3">
              {tagAnalysis.tag_trends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{trend.tag}</span>
                  <div className="flex items-center">
                    <span className={`text-sm font-medium mr-2 ${
                      trend.trend === 'increasing' ? 'text-green-600' :
                      trend.trend === 'decreasing' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {trend.trend === 'increasing' ? '↗' : 
                       trend.trend === 'decreasing' ? '↘' : '→'}
                    </span>
                    <span className="text-sm text-gray-600">
                      {trend.change > 0 ? '+' : ''}{trend.change}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Tag Categories</h3>
            <AnalyticsChart
              data={[
                { label: 'Skills', value: tagAnalysis.category_distribution.skills, color: '#3B82F6' },
                { label: 'Behaviors', value: tagAnalysis.category_distribution.behaviors, color: '#10B981' },
                { label: 'Values', value: tagAnalysis.category_distribution.values, color: '#F59E0B' }
              ]}
              type="doughnut"
              height={200}
              showLegend={true}
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderParticipationTab = () => {
    if (user?.role === 'individual_contributor') {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔒</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">Participation analytics are only available to Managers and HR Administrators.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Participation Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <AnalyticsCard
            title="Participation Rate"
            value={`${participationRates?.participation_rate || 0}%`}
            subtitle="Team participation"
            icon="📊"
            color="blue"
            loading={loading}
          />
          
          <AnalyticsCard
            title="Feedback Givers"
            value={participationRates?.unique_givers || 0}
            subtitle="Unique contributors"
            icon="👤"
            color="green"
            loading={loading}
          />
          
          <AnalyticsCard
            title="Feedback Receivers"
            value={participationRates?.unique_receivers || 0}
            subtitle="Team members"
            icon="👥"
            color="purple"
            loading={loading}
          />
          
          <AnalyticsCard
            title="Daily Average"
            value={participationRates?.feedback_frequency.daily_average.toFixed(1) || '0'}
            subtitle="Feedback per day"
            icon="📅"
            color="yellow"
            loading={loading}
          />
        </div>

        {/* Participation Insights */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Participation Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Engagement Highlights</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• {participationRates?.unique_givers || 0} team members actively giving feedback</li>
                <li>• {participationRates?.unique_receivers || 0} team members receiving feedback</li>
                <li>• {participationRates?.feedback_frequency.weekly_average.toFixed(1) || 0} average weekly feedback</li>
                <li>• {participationRates?.engagement_rate.toFixed(1) || 0}% overall engagement rate</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Encourage peer-to-peer feedback</li>
                <li>• Set up feedback reminders</li>
                <li>• Recognize active participants</li>
                <li>• Provide feedback training</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Feedback Analytics</h1>
          <p className="mt-2 text-gray-600">
            Analyze feedback patterns, sentiment, and team participation
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['week', 'month', 'quarter', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => handleDateRangeChange(range as any)}
              className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 capitalize"
            >
              Last {range}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'sentiment', label: 'Sentiment', icon: '😊' },
              { id: 'tags', label: 'Tags', icon: '🏷️' },
              { id: 'participation', label: 'Participation', icon: '👥' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'sentiment' && renderSentimentTab()}
          {activeTab === 'tags' && renderTagsTab()}
          {activeTab === 'participation' && renderParticipationTab()}
        </div>
      </div>
    </div>
  );
};

export default FeedbackAnalytics; 