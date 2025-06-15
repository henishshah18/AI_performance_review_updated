import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { reviewsService } from '../../services/reviewsService';
import { UserReviewDashboard, TeamReviewSummary } from '../../types/reviews';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';

interface ReviewDashboardProps {
  className?: string;
}

export const ReviewDashboard: React.FC<ReviewDashboardProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<UserReviewDashboard | null>(null);
  const [teamSummary, setTeamSummary] = useState<TeamReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [userDashboard, teamData] = await Promise.allSettled([
        reviewsService.getUserReviewDashboard(),
        user?.role === 'manager' ? reviewsService.getTeamReviewSummary() : Promise.resolve(null)
      ]);

      if (userDashboard.status === 'fulfilled') {
        setDashboardData(userDashboard.value);
      } else {
        throw new Error('Failed to load dashboard data');
      }

      if (teamData.status === 'fulfilled' && teamData.value) {
        setTeamSummary(teamData.value);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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
        <ErrorMessage message={error} onRetry={loadDashboardData} />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">No review data available</p>
      </div>
    );
  }

  const totalPendingTasks = Object.values(dashboardData.pending_tasks).reduce((sum, count) => sum + count, 0);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Review Dashboard</h2>
            <p className="text-gray-600 mt-1">
              Track your performance review progress and pending tasks
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {totalPendingTasks > 0 && (
              <div className="flex items-center text-amber-600">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">{totalPendingTasks} pending tasks</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Cycles */}
      {dashboardData.active_cycles.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-blue-600" />
            Active Review Cycles
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dashboardData.active_cycles.map((cycle) => (
              <div key={cycle.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{cycle.name}</h4>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {cycle.current_phase}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {/* Self Assessment */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Self Assessment</span>
                    <div className="flex items-center">
                      {cycle.tasks.self_assessment === 'completed' ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      ) : cycle.tasks.self_assessment === 'in_progress' ? (
                        <ClockIcon className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
                      )}
                      <span className={`ml-1 capitalize ${
                        cycle.tasks.self_assessment === 'completed' ? 'text-green-600' :
                        cycle.tasks.self_assessment === 'in_progress' ? 'text-yellow-600' :
                        'text-gray-500'
                      }`}>
                        {cycle.tasks.self_assessment.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Peer Reviews */}
                  {cycle.tasks.peer_reviews_to_give > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Peer Reviews</span>
                      <span className="text-amber-600 font-medium">
                        {cycle.tasks.peer_reviews_to_give} pending
                      </span>
                    </div>
                  )}

                  {/* Manager Reviews */}
                  {cycle.tasks.manager_review_to_give > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Manager Reviews</span>
                      <span className="text-amber-600 font-medium">
                        {cycle.tasks.manager_review_to_give} pending
                      </span>
                    </div>
                  )}

                  {/* Upward Reviews */}
                  {cycle.tasks.upward_review_to_give > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Upward Reviews</span>
                      <span className="text-amber-600 font-medium">
                        {cycle.tasks.upward_review_to_give} pending
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Pending Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{totalPendingTasks}</p>
            </div>
          </div>
          <div className="mt-4 space-y-1">
            {dashboardData.pending_tasks.self_assessments > 0 && (
              <p className="text-xs text-gray-500">
                {dashboardData.pending_tasks.self_assessments} self-assessments
              </p>
            )}
            {dashboardData.pending_tasks.peer_reviews > 0 && (
              <p className="text-xs text-gray-500">
                {dashboardData.pending_tasks.peer_reviews} peer reviews
              </p>
            )}
            {dashboardData.pending_tasks.manager_reviews > 0 && (
              <p className="text-xs text-gray-500">
                {dashboardData.pending_tasks.manager_reviews} manager reviews
              </p>
            )}
          </div>
        </div>

        {/* Completed Self Assessments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Self Assessments</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData.completed_reviews.self_assessments}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Completed this year</p>
        </div>

        {/* Peer Reviews Given */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Peer Reviews Given</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData.completed_reviews.peer_reviews_given}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            {dashboardData.completed_reviews.peer_reviews_received} received
          </p>
        </div>

        {/* Manager Reviews */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <StarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Manager Reviews</p>
              <p className="text-2xl font-bold text-gray-900">
                {user?.role === 'manager' 
                  ? dashboardData.completed_reviews.manager_reviews_given
                  : dashboardData.completed_reviews.manager_reviews_received
                }
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            {user?.role === 'manager' ? 'Given to team' : 'Received from manager'}
          </p>
        </div>
      </div>

      {/* Team Summary (Managers Only) */}
      {user?.role === 'manager' && teamSummary && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-purple-600" />
            Team Review Summary
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{teamSummary.team_size}</p>
              <p className="text-sm text-gray-600">Team Members</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{teamSummary.active_cycles}</p>
              <p className="text-sm text-gray-600">Active Cycles</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {teamSummary.completion_rates.self_assessments}%
              </p>
              <p className="text-sm text-gray-600">Self Assessment Completion</p>
            </div>
          </div>

          {/* Team Members Progress */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Team Progress</h4>
            {teamSummary.team_members.slice(0, 5).map((member) => (
              <div key={member.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {member.self_assessments_completed} self-assessments
                  </p>
                  <p className="text-sm text-gray-500">
                    {member.peer_reviews_received} peer reviews
                  </p>
                </div>
              </div>
            ))}
            {teamSummary.team_members.length > 5 && (
              <p className="text-sm text-gray-500 text-center pt-2">
                And {teamSummary.team_members.length - 5} more team members...
              </p>
            )}
          </div>
        </div>
      )}

      {/* No Active Cycles */}
      {dashboardData.active_cycles.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Review Cycles</h3>
          <p className="text-gray-600">
            There are currently no active performance review cycles. 
            Check back later or contact your HR team for more information.
          </p>
        </div>
      )}
    </div>
  );
}; 