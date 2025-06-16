import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DocumentTextIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { reviewsService } from '../../services/reviewsService';
import { ReviewCycle, UserReviewDashboard } from '../../types/reviews';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ReviewIntegrationWidgetProps {
  className?: string;
  compact?: boolean;
}

export const ReviewIntegrationWidget: React.FC<ReviewIntegrationWidgetProps> = ({ 
  className = '', 
  compact = false 
}) => {
  const [activeReviewCycles, setActiveReviewCycles] = useState<ReviewCycle[]>([]);
  const [reviewDashboard, setReviewDashboard] = useState<UserReviewDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [reviewCyclesResponse, reviewDashboardResponse] = await Promise.allSettled([
        reviewsService.getReviewCycles({ status: 'active', page_size: 10 }),
        reviewsService.getUserReviewDashboard()
      ]);

      if (reviewCyclesResponse.status === 'fulfilled') {
        setActiveReviewCycles(reviewCyclesResponse.value.results);
      }

      if (reviewDashboardResponse.status === 'fulfilled') {
        setReviewDashboard(reviewDashboardResponse.value);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load review data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white overflow-hidden shadow rounded-lg ${className}`}>
        <div className="p-6">
          <div className="flex justify-center items-center h-24">
            <LoadingSpinner size="sm" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !reviewDashboard || activeReviewCycles.length === 0) {
    return null; // Don't show widget if no data or error
  }

  const totalPendingTasks = Object.values(reviewDashboard.pending_tasks).reduce((sum, count) => sum + count, 0);

  if (compact) {
    return (
      <div className={`bg-white overflow-hidden shadow rounded-lg ${className}`}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">Reviews</h3>
                <p className="text-xs text-gray-600">
                  {totalPendingTasks > 0 ? `${totalPendingTasks} pending` : 'All complete'}
                </p>
              </div>
            </div>
            <Link
              to="/reviews"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
            >
              View
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white overflow-hidden shadow rounded-lg ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
            Performance Reviews
          </h3>
          <Link
            to="/reviews"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
          >
            View All
            <ArrowRightIcon className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {totalPendingTasks > 0 ? (
          <div className="space-y-4">
            {/* Pending Tasks Summary */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800">
                    {totalPendingTasks} Pending Review{totalPendingTasks > 1 ? 's' : ''}
                  </h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Complete your performance reviews to stay on track
                  </p>
                </div>
              </div>
            </div>

            {/* Active Cycles */}
            <div className="space-y-3">
              {reviewDashboard.active_cycles.slice(0, 2).map((cycle) => (
                <div key={cycle.cycle_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">{cycle.cycle_name}</h4>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {cycle.cycle_type}
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

                    {/* Manager Reviews (for managers) */}
                    {cycle.tasks.manager_review_to_give > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Manager Reviews</span>
                        <span className="text-amber-600 font-medium">
                          {cycle.tasks.manager_review_to_give} pending
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <Link
                      to="/reviews"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                    >
                      Continue Reviews
                      <ArrowRightIcon className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">All reviews completed!</p>
            <p className="text-xs text-gray-500 mt-1">
              {activeReviewCycles.length > 0 ? `Active: ${activeReviewCycles[0].name}` : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 