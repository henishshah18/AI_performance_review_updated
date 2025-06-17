import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../../components/common/Modal';
import {
  FlagIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PlusIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  EllipsisVerticalIcon,
  CalendarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  StarIcon,
  ArrowRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import DashboardSkeleton from "../../components/skeletons/DashboardSkeleton";
import CreateTaskModal from "../../components/modals/CreateTaskModal";
import EditTaskModal from "../../components/modals/EditTaskModal";
import UpdateProgressModal from "../../components/modals/UpdateProgressModal";
import GoalDetailsModal from "../../components/modals/GoalDetailsModal";
import { reviewsService } from "../../services/reviewsService";
import { ReviewCycle, UserReviewDashboard } from "../../types/reviews";
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';

interface SelfAssessmentTask {
  id: string;
  cycle_id: string;
  cycle_name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  due_date: string;
  days_remaining: number;
}

interface PeerReviewTask {
  id: string;
  cycle_id: string;
  reviewee_name: string;
  reviewee_email: string;
  status: 'not_started' | 'in_progress' | 'completed';
  due_date: string;
}

interface ReviewMeetingTask {
  id: string;
  cycle_id: string;
  manager_name: string;
  scheduled_date?: string;
  status: 'not_scheduled' | 'scheduled' | 'completed';
}

export function IndividualDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<UserReviewDashboard | null>(null);
  const [activeCycles, setActiveCycles] = useState<ReviewCycle[]>([]);
  const [selfAssessmentTasks, setSelfAssessmentTasks] = useState<SelfAssessmentTask[]>([]);
  const [peerReviewTasks, setPeerReviewTasks] = useState<PeerReviewTask[]>([]);
  const [reviewMeetings, setReviewMeetings] = useState<ReviewMeetingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, [refreshTrigger]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user's review dashboard
      const dashboard = await reviewsService.getUserReviewDashboard();
      setDashboardData(dashboard);
      setActiveCycles(dashboard.active_cycles);

      // Load self-assessment tasks
      const selfAssessments = await reviewsService.getSelfAssessments();
      const selfTasks: SelfAssessmentTask[] = selfAssessments.results?.map((assessment: any) => ({
        id: assessment.id,
        cycle_id: assessment.cycle.id,
        cycle_name: assessment.cycle.name,
        status: assessment.status,
        due_date: assessment.cycle.self_assessment_end,
        days_remaining: Math.ceil((new Date(assessment.cycle.self_assessment_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      })) || [];
      setSelfAssessmentTasks(selfTasks);

      // Load peer review tasks
      const peerReviews = await reviewsService.getPeerReviews();
      const peerTasks: PeerReviewTask[] = peerReviews.results?.map((review: any) => ({
        id: review.id,
        cycle_id: review.cycle.id,
        reviewee_name: review.reviewee.first_name + ' ' + review.reviewee.last_name,
        reviewee_email: review.reviewee.email,
        status: review.status,
        due_date: review.cycle.peer_review_end
      })) || [];
      setPeerReviewTasks(peerTasks);

      // Mock review meetings - in production this would come from API
      const mockMeetings: ReviewMeetingTask[] = activeCycles.map(cycle => ({
        id: `meeting-${cycle.id}`,
        cycle_id: cycle.id,
        manager_name: user?.manager ? `${user.manager.first_name} ${user.manager.last_name}` : 'Your Manager',
        status: 'not_scheduled'
      }));
      setReviewMeetings(mockMeetings);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Dashboard loading error:', err);
    } finally {
      setLoading(false);
    }
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

  const getUrgencyColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return 'text-red-600 bg-red-100';
    if (daysRemaining <= 3) return 'text-orange-600 bg-orange-100';
    if (daysRemaining <= 7) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const handleStartSelfAssessment = (task: SelfAssessmentTask) => {
    // Navigate to self-assessment form
    window.location.href = `/reviews/self-assessment/${task.id}`;
  };

  const handleStartPeerReview = (task: PeerReviewTask) => {
    // Navigate to peer review form
    window.location.href = `/reviews/peer-review/${task.id}`;
  };

  const handleScheduleMeeting = (meeting: ReviewMeetingTask) => {
    // Navigate to meeting scheduler
    window.location.href = `/reviews/schedule-meeting/${meeting.cycle_id}`;
  };

  const handleViewCycleDetails = (cycle: ReviewCycle) => {
    setSelectedTask(cycle);
    setShowTaskModal(true);
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => setRefreshTrigger(prev => prev + 1)} variant="primary">
          Try Again
        </Button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Review Data</h3>
        <p className="text-gray-600">
          No review cycles are currently active. Check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            My Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {user?.first_name}! Here's your progress overview.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <Link
            to="/progress"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            View Progress
          </Link>
        </div>
      </div>

      {/* No Manager Warning */}
      {!user?.manager && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                No Manager Assigned
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You don't have a manager assigned yet. Some features may be limited until a manager is assigned.
                  Please contact HR for assistance.
                </p>
              </div>
              <div className="mt-4">
                <a
                  href="mailto:hr@company.com"
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-700"
                >
                  Contact HR →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Overview Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Tasks
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData.pending_tasks.self_assessments + 
                       dashboardData.pending_tasks.peer_reviews + 
                       reviewMeetings.filter(m => m.status === 'not_scheduled').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData.completed_reviews.self_assessments + 
                       dashboardData.completed_reviews.peer_reviews_given}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      In Progress
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData.pending_tasks.self_assessments + 
                       dashboardData.pending_tasks.peer_reviews}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className={`h-6 w-6 ${dashboardData.pending_tasks.self_assessments > 0 || dashboardData.pending_tasks.peer_reviews > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Overdue
                    </dt>
                    <dd className={`text-lg font-medium ${dashboardData.pending_tasks.self_assessments > 0 || dashboardData.pending_tasks.peer_reviews > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {dashboardData.pending_tasks.self_assessments + 
                       dashboardData.pending_tasks.peer_reviews}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Due Soon
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {reviewMeetings.filter(m => m.status === 'not_scheduled').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overdue Tasks Warning */}
      {dashboardData && (dashboardData.pending_tasks.self_assessments > 0 || dashboardData.pending_tasks.peer_reviews > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Overdue Tasks Require Attention
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  You have {dashboardData.pending_tasks.self_assessments + 
                   dashboardData.pending_tasks.peer_reviews} overdue task{dashboardData.pending_tasks.self_assessments + 
                    dashboardData.pending_tasks.peer_reviews > 1 ? 's' : ''}. 
                  Please review and update your progress or contact your manager if you need assistance.
                </p>
              </div>
              <div className="mt-4">
                <Link
                  to="/tasks?filter=overdue"
                  className="text-sm font-medium text-red-800 hover:text-red-700"
                >
                  View overdue tasks →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">My Tasks</h3>
        </div>
        
        {dashboardData && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {dashboardData.pending_tasks.self_assessments > 0 && (
                <li>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-medium text-gray-900 truncate">
                            Self-Assessment
                          </h4>
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {selfAssessmentTasks.length} tasks due
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleViewCycleDetails({
                            id: 'self-assessment',
                            name: 'Self-Assessment',
                            review_type: 'quarterly',
                            status: 'active',
                            current_phase: 'In Progress',
                            participant_count: selfAssessmentTasks.length,
                            review_period_start: new Date().toISOString().split('T')[0],
                            review_period_end: selfAssessmentTasks[0]?.due_date || new Date().toISOString().split('T')[0],
                            self_assessment_start: new Date().toISOString().split('T')[0],
                            self_assessment_end: selfAssessmentTasks[0]?.due_date || new Date().toISOString().split('T')[0],
                            peer_review_start: new Date().toISOString().split('T')[0],
                            peer_review_end: new Date().toISOString().split('T')[0],
                            manager_review_start: new Date().toISOString().split('T')[0],
                            manager_review_end: new Date().toISOString().split('T')[0],
                            created_by_name: user ? `${user.first_name} ${user.last_name}` : 'System',
                            created_at: new Date().toISOString()
                          })}
                          className="text-gray-400 hover:text-blue-500"
                          title="View Self-Assessment Tasks"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              )}
              {dashboardData.pending_tasks.peer_reviews > 0 && (
                <li>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-medium text-gray-900 truncate">
                            Peer Review
                          </h4>
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {peerReviewTasks.length} tasks to give
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleViewCycleDetails({
                            id: 'peer-review',
                            name: 'Peer Review',
                            review_type: 'quarterly',
                            status: 'active',
                            current_phase: 'Not Started',
                            participant_count: peerReviewTasks.length,
                            review_period_start: new Date().toISOString().split('T')[0],
                            review_period_end: peerReviewTasks[0]?.due_date || new Date().toISOString().split('T')[0],
                            self_assessment_start: new Date().toISOString().split('T')[0],
                            self_assessment_end: new Date().toISOString().split('T')[0],
                            peer_review_start: new Date().toISOString().split('T')[0],
                            peer_review_end: peerReviewTasks[0]?.due_date || new Date().toISOString().split('T')[0],
                            manager_review_start: new Date().toISOString().split('T')[0],
                            manager_review_end: new Date().toISOString().split('T')[0],
                            created_by_name: user ? `${user.first_name} ${user.last_name}` : 'System',
                            created_at: new Date().toISOString()
                          })}
                          className="text-gray-400 hover:text-blue-500"
                          title="View Peer Review Tasks"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              )}
              {reviewMeetings.filter(m => m.status === 'not_scheduled').length > 0 && (
                <li>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-medium text-gray-900 truncate">
                            Review Meetings
                          </h4>
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {reviewMeetings.filter(m => m.status === 'not_scheduled').length} meetings to schedule
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleViewCycleDetails({
                            id: 'review-meetings',
                            name: 'Review Meetings',
                            review_type: 'quarterly',
                            status: 'active',
                            current_phase: 'Not Scheduled',
                            participant_count: 0,
                            review_period_start: new Date().toISOString().split('T')[0],
                            review_period_end: new Date().toISOString().split('T')[0],
                            self_assessment_start: new Date().toISOString().split('T')[0],
                            self_assessment_end: new Date().toISOString().split('T')[0],
                            peer_review_start: new Date().toISOString().split('T')[0],
                            peer_review_end: new Date().toISOString().split('T')[0],
                            manager_review_start: new Date().toISOString().split('T')[0],
                            manager_review_end: new Date().toISOString().split('T')[0],
                            created_by_name: user ? `${user.first_name} ${user.last_name}` : 'System',
                            created_at: new Date().toISOString()
                          })}
                          className="text-gray-400 hover:text-blue-500"
                          title="View Review Meetings"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* My Current Goals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">My Current Goals</h3>
          <Link
            to="/goals"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all goals →
          </Link>
        </div>
        
        {activeCycles.length === 0 && (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <FlagIcon className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No goals assigned</h3>
            <p className="mt-1 text-sm text-gray-500">
              Contact your manager to get goals assigned to you.
            </p>
          </div>
        )}

        {activeCycles.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
            {activeCycles.slice(0, 4).map((cycle) => (
              <div key={cycle.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cycle.status === 'active' ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                      }`}>
                        {cycle.status === 'active' ? <PlayIcon className="h-3 w-3 mr-1" /> : <ClockIcon className="h-3 w-3 mr-1" />}
                        {cycle.status}
                      </span>
                    </div>
                    <button
                      onClick={() => handleViewCycleDetails(cycle)}
                      className="text-gray-400 hover:text-gray-500"
                      title="View Cycle Details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-lg font-medium text-gray-900">{cycle.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{cycle.current_phase}</p>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Due: {new Date(cycle.self_assessment_end).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manager Information & Recent Feedback */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Manager Information - Temporarily disabled due to data structure issues */}
        {/* {user?.manager && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Manager Information</h3>
              ... manager content ...
            </div>
          </div>
        )} */}

        {/* No Manager Assigned Warning */}
        {!user?.manager_id && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Manager Information</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      No Manager Assigned
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        You don't have a manager assigned yet. Please contact HR to get this set up.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Feedback */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Feedback</h3>
              <Link
                to="/feedback"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View all →
              </Link>
            </div>
            
            {dashboardData && (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">💬</div>
                <h4 className="text-sm font-medium text-gray-900">No recent feedback</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Feedback from your manager and peers will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cycle Details Modal */}
      {showTaskModal && selectedTask && (
        <Modal
          isOpen={showTaskModal}
          title={`Review Cycle: ${selectedTask.name}`}
          onClose={() => setShowTaskModal(false)}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Cycle Information</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Type:</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {selectedTask.review_type.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`text-sm font-medium capitalize ${
                    selectedTask.status === 'active' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {selectedTask.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current Phase:</span>
                  <span className="text-sm font-medium text-gray-900">{selectedTask.current_phase}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Participants:</span>
                  <span className="text-sm font-medium text-gray-900">{selectedTask.participant_count}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Timeline</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Review Period:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {reviewsService.formatDate(selectedTask.review_period_start)} - {reviewsService.formatDate(selectedTask.review_period_end)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Self Assessment:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {reviewsService.formatDate(selectedTask.self_assessment_start)} - {reviewsService.formatDate(selectedTask.self_assessment_end)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Peer Reviews:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {reviewsService.formatDate(selectedTask.peer_review_start)} - {reviewsService.formatDate(selectedTask.peer_review_end)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Manager Reviews:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {reviewsService.formatDate(selectedTask.manager_review_start)} - {reviewsService.formatDate(selectedTask.manager_review_end)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button onClick={() => setShowTaskModal(false)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default IndividualDashboard;
