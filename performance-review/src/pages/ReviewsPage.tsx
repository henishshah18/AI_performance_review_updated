import React, { useState, useEffect } from 'react';
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  PlayIcon,
  EyeIcon,
  PencilIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { ReviewCycleCard } from '../components/reviews/ReviewCycleCard';
import { CreateReviewCycleModal } from '../components/reviews/CreateReviewCycleModal';
import { reviewsService } from '../services/reviewsService';
import { ReviewCycle, UserReviewDashboard } from '../types/reviews';

interface ReviewTask {
  id: string;
  type: 'self_assessment' | 'peer_review' | 'manager_review' | 'upward_review';
  title: string;
  description: string;
  cycle_name: string;
  due_date: string;
  status: 'not_started' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  reviewee_name?: string;
  manager_name?: string;
}

export const ReviewsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cycles' | 'tasks'>('dashboard');
  const [dashboardData, setDashboardData] = useState<UserReviewDashboard | null>(null);
  const [reviewCycles, setReviewCycles] = useState<ReviewCycle[]>([]);
  const [reviewTasks, setReviewTasks] = useState<ReviewTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateCycleModal, setShowCreateCycleModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<ReviewCycle | null>(null);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadReviewData();
  }, [refreshTrigger, activeTab]);

  const loadReviewData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load dashboard data
      const dashboard = await reviewsService.getUserReviewDashboard();
      setDashboardData(dashboard);

      // Load review cycles based on user role
      let cyclesResponse;
      if (user?.role === 'hr_admin') {
        cyclesResponse = await reviewsService.getReviewCycles({ page_size: 50 });
      } else {
        cyclesResponse = await reviewsService.getReviewCycles({ status: 'active', page_size: 20 });
      }
      setReviewCycles(cyclesResponse.results);

      // Load review tasks
      await loadReviewTasks();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load review data');
      console.error('Review data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReviewTasks = async () => {
    try {
      const tasks: ReviewTask[] = [];

      // Load self-assessments
      const selfAssessments = await reviewsService.getSelfAssessments();
      selfAssessments.results?.forEach((assessment: any) => {
        if (assessment.status !== 'completed') {
          tasks.push({
            id: assessment.id,
            type: 'self_assessment',
            title: 'Complete Self-Assessment',
            description: `Self-assessment for ${assessment.cycle.name}`,
            cycle_name: assessment.cycle.name,
            due_date: assessment.cycle.self_assessment_end,
            status: assessment.status,
            priority: getDueDatePriority(assessment.cycle.self_assessment_end)
          });
        }
      });

      // Load peer reviews
      const peerReviews = await reviewsService.getPeerReviews();
      peerReviews.results?.forEach((review: any) => {
        if (review.status !== 'completed') {
          tasks.push({
            id: review.id,
            type: 'peer_review',
            title: 'Complete Peer Review',
            description: `Review for ${review.reviewee.first_name} ${review.reviewee.last_name}`,
            cycle_name: review.cycle.name,
            due_date: review.cycle.peer_review_end,
            status: review.status,
            priority: getDueDatePriority(review.cycle.peer_review_end),
            reviewee_name: `${review.reviewee.first_name} ${review.reviewee.last_name}`
          });
        }
      });

      // Load manager reviews (if user is a manager)
      if (user?.role === 'manager') {
        const managerReviews = await reviewsService.getManagerReviews();
        managerReviews.results?.forEach((review: any) => {
          if (review.status !== 'completed') {
            tasks.push({
              id: review.id,
              type: 'manager_review',
              title: 'Complete Manager Review',
              description: `Review for ${review.employee.first_name} ${review.employee.last_name}`,
              cycle_name: review.cycle.name,
              due_date: review.cycle.manager_review_end,
              status: review.status,
              priority: getDueDatePriority(review.cycle.manager_review_end),
              reviewee_name: `${review.employee.first_name} ${review.employee.last_name}`
            });
          }
        });
      }

      // Sort tasks by priority and due date
      tasks.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });

      setReviewTasks(tasks);
    } catch (err) {
      console.error('Failed to load review tasks:', err);
    }
  };

  const getDueDatePriority = (dueDate: string): 'high' | 'medium' | 'low' => {
    const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'high'; // Overdue
    if (days <= 3) return 'high';
    if (days <= 7) return 'medium';
    return 'low';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-blue-600 bg-blue-100';
      case 'not_started':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleTaskAction = (task: ReviewTask) => {
    switch (task.type) {
      case 'self_assessment':
        window.location.href = `/reviews/self-assessment/${task.id}`;
        break;
      case 'peer_review':
        window.location.href = `/reviews/peer-review/${task.id}`;
        break;
      case 'manager_review':
        window.location.href = `/reviews/manager-review/${task.id}`;
        break;
      case 'upward_review':
        window.location.href = `/reviews/upward-review/${task.id}`;
        break;
    }
  };

  const handleCreateCycle = (cycle: ReviewCycle) => {
    setReviewCycles(prev => [cycle, ...prev]);
    setShowCreateCycleModal(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleViewCycle = (cycle: ReviewCycle) => {
    setSelectedCycle(cycle);
    setShowCycleModal(true);
  };

  const renderDashboard = () => {
    if (!dashboardData) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Self Assessments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.pending_tasks.self_assessments}
                </p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Peer Reviews</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.pending_tasks.peer_reviews}
                </p>
                <p className="text-xs text-gray-500">To Give</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Manager Reviews</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.pending_tasks.manager_reviews}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.role === 'manager' ? 'To Give' : 'Pending'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.completed_reviews.self_assessments + 
                   dashboardData.completed_reviews.peer_reviews_given +
                   dashboardData.completed_reviews.manager_reviews_given}
                </p>
                <p className="text-xs text-gray-500">This Cycle</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Cycles */}
        {dashboardData.active_cycles.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
              Active Review Cycles
            </h2>
            
            <div className="space-y-4">
              {dashboardData.active_cycles.map((cycle) => (
                <div key={cycle.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{cycle.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Current Phase: <span className="font-medium">{cycle.current_phase}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {cycle.review_type.replace('_', ' ')} • {cycle.participant_count} participants
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cycle.status === 'active' ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                      }`}>
                        {cycle.status === 'active' ? <PlayIcon className="h-3 w-3 mr-1" /> : <ClockIcon className="h-3 w-3 mr-1" />}
                        {cycle.status}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewCycle(cycle)}
                        className="flex items-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Urgent Tasks */}
        {reviewTasks.filter(task => task.priority === 'high').length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-600" />
              Urgent Tasks
            </h2>
            
            <div className="space-y-3">
              {reviewTasks.filter(task => task.priority === 'high').slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{task.title}</h3>
                    <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        Due: {reviewsService.formatDate(task.due_date)}
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="primary"
                    onClick={() => handleTaskAction(task)}
                    className="flex items-center"
                  >
                    {task.status === 'not_started' ? (
                      <>
                        <PlayIcon className="h-4 w-4 mr-1" />
                        Start
                      </>
                    ) : (
                      <>
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Continue
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCycles = () => {
    return (
      <div className="space-y-6">
        {user?.role === 'hr_admin' && (
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Review Cycles</h2>
              <p className="text-sm text-gray-600">Manage and monitor review cycles</p>
            </div>
            <Button 
              onClick={() => setShowCreateCycleModal(true)}
              variant="primary"
              className="flex items-center"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Create Review Cycle
            </Button>
          </div>
        )}

        <div className="grid gap-6">
          {reviewCycles.map((cycle) => (
            <ReviewCycleCard
              key={cycle.id}
              cycle={cycle}
              onUpdate={() => setRefreshTrigger(prev => prev + 1)}
              showManagementActions={user?.role === 'hr_admin'}
            />
          ))}
        </div>

        {reviewCycles.length === 0 && (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Review Cycles</h3>
            <p className="text-gray-600">
              {user?.role === 'hr_admin' 
                ? 'Create your first review cycle to get started.'
                : 'No active review cycles at the moment.'
              }
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderTasks = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">My Review Tasks</h2>
          <p className="text-sm text-gray-600">Complete your pending review tasks</p>
        </div>

        <div className="space-y-4">
          {reviewTasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority} priority
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Cycle: {task.cycle_name}</span>
                    <span>Due: {reviewsService.formatDate(task.due_date)}</span>
                    {task.reviewee_name && <span>For: {task.reviewee_name}</span>}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    variant="primary"
                    onClick={() => handleTaskAction(task)}
                    className="flex items-center"
                  >
                    {task.status === 'not_started' ? (
                      <>
                        <PlayIcon className="h-4 w-4 mr-1" />
                        Start
                      </>
                    ) : (
                      <>
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Continue
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {reviewTasks.length === 0 && (
          <div className="text-center py-12">
            <CheckCircleIcon className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-600">
              You have no pending review tasks at the moment.
            </p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Reviews</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => setRefreshTrigger(prev => prev + 1)} variant="primary">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Performance Reviews</h1>
            <p className="text-gray-600 mt-1">
              Manage your performance review activities and cycles
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={() => setRefreshTrigger(prev => prev + 1)} 
              variant="outline"
              className="flex items-center"
            >
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('cycles')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'cycles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Review Cycles
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Tasks
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'cycles' && renderCycles()}
          {activeTab === 'tasks' && renderTasks()}
        </div>
      </div>

      {/* Create Review Cycle Modal */}
      {showCreateCycleModal && (
        <CreateReviewCycleModal
          isOpen={showCreateCycleModal}
          onSave={handleCreateCycle}
          onCancel={() => setShowCreateCycleModal(false)}
        />
      )}

      {/* Cycle Details Modal */}
      {showCycleModal && selectedCycle && (
        <Modal
          isOpen={showCycleModal}
          title={`Review Cycle: ${selectedCycle.name}`}
          onClose={() => setShowCycleModal(false)}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Cycle Information</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Type:</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {selectedCycle.review_type.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`text-sm font-medium capitalize ${
                    selectedCycle.status === 'active' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {selectedCycle.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current Phase:</span>
                  <span className="text-sm font-medium text-gray-900">{selectedCycle.current_phase}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Participants:</span>
                  <span className="text-sm font-medium text-gray-900">{selectedCycle.participant_count}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Timeline</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Review Period:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {reviewsService.formatDate(selectedCycle.review_period_start)} - {reviewsService.formatDate(selectedCycle.review_period_end)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Self Assessment:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {reviewsService.formatDate(selectedCycle.self_assessment_start)} - {reviewsService.formatDate(selectedCycle.self_assessment_end)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Peer Reviews:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {reviewsService.formatDate(selectedCycle.peer_review_start)} - {reviewsService.formatDate(selectedCycle.peer_review_end)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Manager Reviews:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {reviewsService.formatDate(selectedCycle.manager_review_start)} - {reviewsService.formatDate(selectedCycle.manager_review_end)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button onClick={() => setShowCycleModal(false)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ReviewsPage; 