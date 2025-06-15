import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  StarIcon,
  DocumentTextIcon,
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { reviewsService } from '../../services/reviewsService';
import { 
  ReviewCycle, 
  ReviewCycleProgress,
  UserReviewDashboard,
  TeamReviewSummary 
} from '../../types/reviews';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { useAuth } from '../../contexts/AuthContext';

interface ReviewAnalyticsProps {
  className?: string;
}

interface AnalyticsData {
  cycles: ReviewCycle[];
  cycleProgress: Record<string, ReviewCycleProgress>;
  userDashboard: UserReviewDashboard | null;
  teamSummary: TeamReviewSummary | null;
}

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<any>;
  color: string;
  description?: string;
}

export const ReviewAnalytics: React.FC<ReviewAnalyticsProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData>({
    cycles: [],
    cycleProgress: {},
    userDashboard: null,
    teamSummary: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [cyclesResponse, userDashboard, teamSummary] = await Promise.allSettled([
        reviewsService.getReviewCycles({ page_size: 50 }),
        reviewsService.getUserReviewDashboard(),
        user?.role === 'manager' || user?.role === 'hr_admin' 
          ? reviewsService.getTeamReviewSummary() 
          : Promise.resolve(null)
      ]);

      let cycles: ReviewCycle[] = [];
      if (cyclesResponse.status === 'fulfilled') {
        cycles = cyclesResponse.value.results;
      }

      // Load progress for active cycles
      const activeCycles = cycles.filter(cycle => cycle.status === 'active');
      const progressPromises = activeCycles.map(cycle => 
        reviewsService.getCycleProgress(cycle.id).catch(() => null)
      );
      
      const progressResults = await Promise.all(progressPromises);
      const cycleProgress: Record<string, ReviewCycleProgress> = {};
      
      progressResults.forEach((progress, index) => {
        if (progress) {
          cycleProgress[activeCycles[index].id] = progress;
        }
      });

      setData({
        cycles,
        cycleProgress,
        userDashboard: userDashboard.status === 'fulfilled' ? userDashboard.value : null,
        teamSummary: teamSummary.status === 'fulfilled' ? teamSummary.value : null
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (): MetricCard[] => {
    const { cycles, cycleProgress, userDashboard, teamSummary } = data;
    
    const activeCycles = cycles.filter(c => c.status === 'active');
    const completedCycles = cycles.filter(c => c.status === 'completed');
    
    // Calculate overall completion rates
    const totalProgress = Object.values(cycleProgress);
    const avgSelfAssessmentCompletion = totalProgress.length > 0 
      ? Math.round(totalProgress.reduce((sum, p) => sum + p.self_assessment_progress.percentage, 0) / totalProgress.length)
      : 0;
    
    const avgPeerReviewCompletion = totalProgress.length > 0
      ? Math.round(totalProgress.reduce((sum, p) => sum + p.peer_review_progress.percentage, 0) / totalProgress.length)
      : 0;

    const metrics: MetricCard[] = [
      {
        title: 'Active Cycles',
        value: activeCycles.length,
        icon: CalendarIcon,
        color: 'text-blue-600 bg-blue-100',
        description: `${completedCycles.length} completed this year`
      },
      {
        title: 'Self Assessment Completion',
        value: `${avgSelfAssessmentCompletion}%`,
        change: avgSelfAssessmentCompletion > 75 ? 5 : -3,
        changeLabel: 'vs last cycle',
        icon: DocumentTextIcon,
        color: 'text-green-600 bg-green-100'
      },
      {
        title: 'Peer Review Completion',
        value: `${avgPeerReviewCompletion}%`,
        change: avgPeerReviewCompletion > 70 ? 8 : -5,
        changeLabel: 'vs last cycle',
        icon: UsersIcon,
        color: 'text-purple-600 bg-purple-100'
      }
    ];

    if (userDashboard) {
      const totalPending = Object.values(userDashboard.pending_tasks).reduce((sum, count) => sum + count, 0);
      metrics.push({
        title: 'Pending Tasks',
        value: totalPending,
        icon: ClockIcon,
        color: totalPending > 0 ? 'text-amber-600 bg-amber-100' : 'text-green-600 bg-green-100',
        description: totalPending === 0 ? 'All caught up!' : 'Tasks requiring attention'
      });
    }

    if (teamSummary) {
      metrics.push({
        title: 'Team Size',
        value: teamSummary.team_size,
        icon: UsersIcon,
        color: 'text-indigo-600 bg-indigo-100',
        description: `${teamSummary.active_cycles} active cycles`
      });
    }

    return metrics;
  };

  const renderMetricCard = (metric: MetricCard) => (
    <div key={metric.title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${metric.color}`}>
          <metric.icon className="h-6 w-6" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{metric.title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
            {metric.change && (
              <div className={`ml-2 flex items-center text-sm ${
                metric.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.change > 0 ? (
                  <TrendingUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDownIcon className="h-4 w-4 mr-1" />
                )}
                <span>{Math.abs(metric.change)}%</span>
                {metric.changeLabel && (
                  <span className="text-gray-500 ml-1">{metric.changeLabel}</span>
                )}
              </div>
            )}
          </div>
          {metric.description && (
            <p className="text-sm text-gray-500 mt-1">{metric.description}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderProgressChart = () => {
    const { cycleProgress } = data;
    const progressData = Object.values(cycleProgress);

    if (progressData.length === 0) {
      return (
        <div className="text-center py-8">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No active cycles to display</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {progressData.map((progress) => (
          <div key={progress.cycle_id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">{progress.cycle_name}</h4>
              <span className="text-sm text-gray-500 capitalize">
                {progress.current_phase.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Self Assessments */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Self Assessments</span>
                  <span className="font-medium">
                    {progress.self_assessment_progress.completed}/{progress.self_assessment_progress.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.self_assessment_progress.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {progress.self_assessment_progress.percentage}% complete
                </p>
              </div>

              {/* Peer Reviews */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Peer Reviews</span>
                  <span className="font-medium">
                    {progress.peer_review_progress.completed}/{progress.peer_review_progress.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.peer_review_progress.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {progress.peer_review_progress.percentage}% complete
                </p>
              </div>

              {/* Manager Reviews */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Manager Reviews</span>
                  <span className="font-medium">
                    {progress.manager_review_progress.completed}/{progress.manager_review_progress.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.manager_review_progress.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {progress.manager_review_progress.percentage}% complete
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTeamInsights = () => {
    const { teamSummary } = data;
    
    if (!teamSummary) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <UsersIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-900">{teamSummary.team_size}</p>
            <p className="text-sm text-blue-700">Team Members</p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-900">
              {teamSummary.completion_rates.self_assessments}%
            </p>
            <p className="text-sm text-green-700">Self Assessment Rate</p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <StarIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-900">
              {teamSummary.completion_rates.peer_reviews}%
            </p>
            <p className="text-sm text-purple-700">Peer Review Rate</p>
          </div>
        </div>

        {/* Top Performers */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Team Performance Overview</h4>
          <div className="space-y-3">
            {teamSummary.team_members.slice(0, 5).map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-600">{member.email}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="text-center">
                      <p className="font-medium text-gray-900">{member.self_assessments_completed}</p>
                      <p className="text-gray-600">Self Reviews</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900">{member.peer_reviews_received}</p>
                      <p className="text-gray-600">Peer Reviews</p>
                    </div>
                  </div>
                  {member.latest_review_date && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last: {reviewsService.formatDate(member.latest_review_date)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <ErrorMessage message={error} onRetry={loadAnalyticsData} />
      </div>
    );
  }

  const metrics = calculateMetrics();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <ChartBarIcon className="h-6 w-6 mr-2 text-blue-600" />
              Review Analytics
            </h2>
            <p className="text-gray-600 mt-1">
              Performance review insights and completion metrics
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="current">Current Period</option>
              <option value="last_quarter">Last Quarter</option>
              <option value="last_year">Last Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map(renderMetricCard)}
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Active Cycle Progress
        </h3>
        {renderProgressChart()}
      </div>

      {/* Team Insights (Managers/HR Only) */}
      {data.teamSummary && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Team Insights
          </h3>
          {renderTeamInsights()}
        </div>
      )}

      {/* Cycle History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Recent Review Cycles
        </h3>
        
        {data.cycles.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No review cycles found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.cycles.slice(0, 5).map((cycle) => (
              <div key={cycle.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{cycle.name}</h4>
                  <p className="text-sm text-gray-600">
                    {reviewsService.formatReviewType(cycle.review_type)} • 
                    {reviewsService.formatDate(cycle.review_period_start)} - {reviewsService.formatDate(cycle.review_period_end)}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${reviewsService.getStatusColor(cycle.status)}`}>
                    {cycle.status}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {cycle.participant_count} participants
                    </p>
                    <p className="text-xs text-gray-500">
                      Created by {cycle.created_by_name}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alerts and Recommendations */}
      {data.cycles.some(c => c.status === 'active' && reviewsService.isReviewOverdue(c.review_period_end)) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-amber-600" />
            Attention Required
          </h3>
          
          <div className="space-y-3">
            {data.cycles
              .filter(c => c.status === 'active' && reviewsService.isReviewOverdue(c.review_period_end))
              .map((cycle) => (
                <div key={cycle.id} className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-amber-900">{cycle.name}</p>
                      <p className="text-sm text-amber-700">
                        Review period ended on {reviewsService.formatDate(cycle.review_period_end)}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-amber-900">Overdue</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}; 