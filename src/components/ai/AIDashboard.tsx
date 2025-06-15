import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  SparklesIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { aiService } from '../../services/aiService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { 
  SentimentDashboard, 
  AIAlert, 
  AIInsights, 
  GenerationHistory,
  AIUsageAnalytics 
} from '../../types/ai';
import SentimentIndicator from './SentimentIndicator';
import LoadingSpinner from '../common/LoadingSpinner';

const AIDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sentiment' | 'generation' | 'insights' | 'usage'>('sentiment');
  
  // State for different dashboard sections
  const [sentimentData, setSentimentData] = useState<SentimentDashboard | null>(null);
  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [generationHistory, setGenerationHistory] = useState<GenerationHistory[]>([]);
  const [usageAnalytics, setUsageAnalytics] = useState<AIUsageAnalytics | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [activeTab]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'sentiment':
          await loadSentimentData();
          break;
        case 'generation':
          await loadGenerationHistory();
          break;
        case 'insights':
          await loadInsights();
          break;
        case 'usage':
          if (user?.role === 'hr_admin') {
            await loadUsageAnalytics();
          }
          break;
      }
    } catch (error: any) {
      console.error('Dashboard loading error:', error);
      addToast({
        type: 'error',
        title: 'Loading Failed',
        message: 'Failed to load dashboard data'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSentimentData = async () => {
    const [dashboardData, alertsData] = await Promise.all([
      aiService.getSentimentDashboard(),
      aiService.getSentimentAlerts()
    ]);
    setSentimentData(dashboardData);
    setAlerts(alertsData.alerts);
  };

  const loadGenerationHistory = async () => {
    const response = await aiService.getGenerationHistory({ page: 1 });
    setGenerationHistory(response.results);
  };

  const loadInsights = async () => {
    const insightsData = await aiService.getAIInsights();
    setInsights(insightsData);
  };

  const loadUsageAnalytics = async () => {
    const analyticsData = await aiService.getUsageAnalytics();
    setUsageAnalytics(analyticsData);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const tabs = [
    { id: 'sentiment', label: 'Sentiment Analysis', icon: ChartBarIcon },
    { id: 'generation', label: 'AI Generation', icon: SparklesIcon },
    { id: 'insights', label: 'Insights', icon: ExclamationTriangleIcon },
    ...(user?.role === 'hr_admin' ? [{ id: 'usage', label: 'Usage Analytics', icon: UserGroupIcon }] : [])
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <SparklesIcon className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Dashboard</h1>
            <p className="text-gray-600">Monitor AI-powered insights and generation activity</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
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
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'sentiment' && sentimentData && (
            <div className="space-y-6">
              {/* Sentiment Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Analyzed</p>
                      <p className="text-2xl font-bold text-gray-900">{sentimentData.total_analyzed}</p>
                    </div>
                    <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Positive</p>
                      <p className="text-2xl font-bold text-green-900">
                        {sentimentData.sentiment_distribution.positive.percentage.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-green-600">
                      {sentimentData.sentiment_distribution.positive.count}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Neutral</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {sentimentData.sentiment_distribution.neutral.percentage.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-gray-600">
                      {sentimentData.sentiment_distribution.neutral.count}
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">Negative</p>
                      <p className="text-2xl font-bold text-red-900">
                        {sentimentData.sentiment_distribution.negative.percentage.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-red-600">
                      {sentimentData.sentiment_distribution.negative.count}
                    </div>
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {alerts.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Alerts</h3>
                  <div className="space-y-3">
                    {alerts.slice(0, 5).map((alert, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                                {alert.severity.toUpperCase()}
                              </span>
                              <span className="text-sm text-gray-500">{alert.type}</span>
                            </div>
                            <h4 className="font-medium text-gray-900 mt-1">{alert.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                            {alert.issues.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {alert.issues.map((issue, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                                    {issue.replace('_', ' ')}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <div>Score: {(alert.sentiment_score * 100).toFixed(0)}%</div>
                            <div>Confidence: {(alert.confidence * 100).toFixed(0)}%</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'generation' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Recent AI Generations</h3>
              {generationHistory.length > 0 ? (
                <div className="space-y-3">
                  {generationHistory.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                              {item.status.toUpperCase()}
                            </span>
                            <span className="font-medium text-gray-900">
                              {aiService.getGenerationTypeLabel(item.generation_type)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <ClockIcon className="w-4 h-4" />
                              <span>{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>
                            {item.tokens_used && (
                              <span>{item.tokens_used} tokens</span>
                            )}
                            {item.processing_time && (
                              <span>{item.processing_time.toFixed(2)}s</span>
                            )}
                          </div>
                          {item.error_message && (
                            <p className="text-sm text-red-600 mt-2">{item.error_message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <SparklesIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No AI generations yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'insights' && insights && (
            <div className="space-y-6">
              {/* Key Insights */}
              {insights.insights.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Key Insights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {insights.insights.map((insight, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(insight.severity)}`}>
                                {insight.severity.toUpperCase()}
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-900 mt-2">{insight.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">{insight.metric_value}</div>
                            <div className="text-xs text-gray-500">{insight.metric_unit}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {insights.recommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h3>
                  <div className="space-y-3">
                    {insights.recommendations.map((rec, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(rec.priority)}`}>
                            {rec.priority.toUpperCase()}
                          </span>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{rec.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'usage' && user?.role === 'hr_admin' && usageAnalytics && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Usage Analytics</h3>
              
              {/* Usage Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Generations</p>
                      <p className="text-2xl font-bold text-blue-900">{usageAnalytics.total_generations}</p>
                    </div>
                    <SparklesIcon className="w-8 h-8 text-blue-400" />
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Success Rate</p>
                      <p className="text-2xl font-bold text-green-900">{(usageAnalytics.success_rate * 100).toFixed(1)}%</p>
                    </div>
                    <ChartBarIcon className="w-8 h-8 text-green-400" />
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Avg Processing</p>
                      <p className="text-2xl font-bold text-purple-900">{usageAnalytics.average_processing_time.toFixed(1)}s</p>
                    </div>
                    <ClockIcon className="w-8 h-8 text-purple-400" />
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Total Tokens</p>
                      <p className="text-2xl font-bold text-orange-900">{usageAnalytics.total_tokens_used.toLocaleString()}</p>
                    </div>
                    <DocumentTextIcon className="w-8 h-8 text-orange-400" />
                  </div>
                </div>
              </div>

              {/* Top Users */}
              {usageAnalytics.generations_by_user.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Top Users</h4>
                  <div className="space-y-2">
                    {usageAnalytics.generations_by_user.slice(0, 5).map((user, index) => (
                      <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                        <span className="font-medium">{user.user__first_name} {user.user__last_name}</span>
                        <span className="text-sm text-gray-600">{user.count} generations</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIDashboard; 