import React, { useState, useEffect } from 'react';
import {
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  EyeIcon,
  PencilIcon,
  UserGroupIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { ManagerReviewForm } from '../../components/reviews/ManagerReviewForm';
import { UpwardReviewForm } from '../../components/reviews/UpwardReviewForm';
import { ReviewMeetingScheduler } from '../../components/reviews/ReviewMeetingScheduler';
import { reviewsService } from '../../services/reviewsService';
import { ReviewCycle, SelfAssessment, PeerReview, ManagerReview, UpwardReview, TeamMemberReview } from '../../types/reviews';


interface ReviewCycleInfo {
  cycle: ReviewCycle;
  current_phase: string;
  days_remaining: number;
  my_tasks: {
    self_assessment: 'not_started' | 'in_progress' | 'completed';
    peer_reviews_to_give: number;
    manager_reviews_to_complete: number;
    upward_review_to_give: number;
    meetings_to_schedule: number;
  };
  team_summary: {
    total_members: number;
    self_assessments_completed: number;
    peer_reviews_completed: number;
    manager_reviews_completed: number;
    meetings_completed: number;
  };
}

export const ManagerReviewDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeCycle, setActiveCycle] = useState<ReviewCycleInfo | null>(null);
  const [teamReviews, setTeamReviews] = useState<TeamMemberReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showManagerReviewModal, setShowManagerReviewModal] = useState(false);
  const [showUpwardReviewModal, setShowUpwardReviewModal] = useState(false);
  const [showMeetingSchedulerModal, setShowMeetingSchedulerModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<TeamMemberReview | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadReviewData();
  }, [refreshTrigger]);

  const loadReviewData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load active review cycles and manager's review responsibilities
      const cyclesResponse = await reviewsService.getReviewCycles({ status: 'active', page_size: 1 });
      
      if (cyclesResponse.results.length > 0) {
        const cycle = cyclesResponse.results[0];
        
        // Get manager's team review summary
        const teamSummary = await reviewsService.getTeamReviewSummary();
        
        // Mock active cycle info - in production this would come from the API
        const mockCycleInfo: ReviewCycleInfo = {
          cycle,
          current_phase: cycle.current_phase,
          days_remaining: Math.ceil((new Date(cycle.manager_review_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
          my_tasks: {
            self_assessment: 'completed',
            peer_reviews_to_give: 2,
            manager_reviews_to_complete: 5,
            upward_review_to_give: 1,
            meetings_to_schedule: 3
          },
          team_summary: {
            total_members: teamSummary.team_size,
            self_assessments_completed: Math.floor(teamSummary.team_size * (teamSummary.completion_rates.self_assessments / 100)),
            peer_reviews_completed: Math.floor(teamSummary.team_size * (teamSummary.completion_rates.peer_reviews / 100)),
            manager_reviews_completed: Math.floor(teamSummary.team_size * (teamSummary.completion_rates.manager_reviews / 100)),
            meetings_completed: Math.floor(teamSummary.team_size * 0.4) // Mock meetings completion
          }
        };
        
        setActiveCycle(mockCycleInfo);
        
        // Generate mock team review data
        const mockTeamReviews: TeamMemberReview[] = teamSummary.team_members.map((member, index) => ({
          id: member.id,
          employee_name: member.name,
          employee_email: member.email,
          self_assessment_status: member.self_assessments_completed > 0 ? 'completed' : 'in_progress',
          peer_reviews_received: member.peer_reviews_received,
          peer_reviews_expected: 3,
          manager_review_status: index < 2 ? 'completed' : index < 4 ? 'in_progress' : 'not_started',
          meeting_scheduled: index < 3,
          meeting_date: index < 3 ? new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString() : undefined,
          overall_progress: Math.round(((member.self_assessments_completed > 0 ? 1 : 0) + 
                                      (member.peer_reviews_received / 3) + 
                                      (index < 2 ? 1 : index < 4 ? 0.5 : 0)) / 3 * 100)
        }));
        
        setTeamReviews(mockTeamReviews);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load review data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartManagerReview = (employee: TeamMemberReview) => {
    setSelectedEmployee(employee);
    setShowManagerReviewModal(true);
  };

  const handleStartUpwardReview = () => {
    setShowUpwardReviewModal(true);
  };

  const handleScheduleMeeting = (employee: TeamMemberReview) => {
    setSelectedEmployee(employee);
    setShowMeetingSchedulerModal(true);
  };

  const handleReviewSubmitted = () => {
    setShowManagerReviewModal(false);
    setShowUpwardReviewModal(false);
    setShowMeetingSchedulerModal(false);
    setSelectedEmployee(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'Self Assessment':
        return <DocumentTextIcon className="h-5 w-5" />;
      case 'Peer Review':
        return <UserGroupIcon className="h-5 w-5" />;
      case 'Manager Review':
        return <CheckCircleIcon className="h-5 w-5" />;
      default:
        return <ClockIcon className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-100';
      case 'not_started':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const renderProgressBar = (completed: number, total: number, label: string) => {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-600">
          <span>{label}</span>
          <span>{completed}/{total} ({percentage}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Review Data</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => setRefreshTrigger(prev => prev + 1)}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!activeCycle) {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Review Cycle</h3>
        <p className="text-gray-600">
          There are currently no active review cycles. Check back later or contact HR.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manager Review Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Manage team reviews for {activeCycle.cycle.name}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={handleStartUpwardReview}
              variant="outline"
              className="flex items-center"
            >
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Upward Review
            </Button>
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

      {/* Current Cycle Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          {getPhaseIcon(activeCycle.current_phase)}
          <span className="ml-2">Current Phase: {activeCycle.current_phase}</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              activeCycle.days_remaining > 7 ? 'text-green-600 bg-green-100' :
              activeCycle.days_remaining > 3 ? 'text-yellow-600 bg-yellow-100' :
              'text-red-600 bg-red-100'
            }`}>
              <ClockIcon className="h-4 w-4 mr-1" />
              {activeCycle.days_remaining} days remaining
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Until {activeCycle.cycle.manager_review_end}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{activeCycle.my_tasks.manager_reviews_to_complete}</p>
            <p className="text-sm text-gray-600">Reviews to Complete</p>
          </div>
          
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{activeCycle.my_tasks.meetings_to_schedule}</p>
            <p className="text-sm text-gray-600">Meetings to Schedule</p>
          </div>
        </div>
      </div>

      {/* My Review Tasks */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
          My Review Tasks
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Self Assessment</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activeCycle.my_tasks.self_assessment)}`}>
                {activeCycle.my_tasks.self_assessment === 'completed' ? 
                  <CheckCircleIcon className="h-3 w-3 mr-1" /> : 
                  <ClockIcon className="h-3 w-3 mr-1" />
                }
                {activeCycle.my_tasks.self_assessment.replace('_', ' ')}
              </span>
            </div>
            {activeCycle.my_tasks.self_assessment !== 'completed' && (
              <Button size="sm" variant="outline" className="w-full">
                Complete Assessment
              </Button>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Peer Reviews</span>
              <span className="text-sm text-gray-600">{activeCycle.my_tasks.peer_reviews_to_give} pending</span>
            </div>
            <Button size="sm" variant="outline" className="w-full">
              Complete Reviews
            </Button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Manager Reviews</span>
              <span className="text-sm text-gray-600">{activeCycle.my_tasks.manager_reviews_to_complete} pending</span>
            </div>
            <p className="text-xs text-gray-500 mb-2">Review your team members</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Upward Review</span>
              <span className="text-sm text-gray-600">{activeCycle.my_tasks.upward_review_to_give} pending</span>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              onClick={handleStartUpwardReview}
            >
              Provide Feedback
            </Button>
          </div>
        </div>
      </div>

      {/* Team Progress Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2 text-purple-600" />
          Team Progress Overview
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {renderProgressBar(
            activeCycle.team_summary.self_assessments_completed,
            activeCycle.team_summary.total_members,
            'Self Assessments'
          )}
          {renderProgressBar(
            activeCycle.team_summary.peer_reviews_completed,
            activeCycle.team_summary.total_members * 3, // Assuming 3 peer reviews per person
            'Peer Reviews'
          )}
          {renderProgressBar(
            activeCycle.team_summary.manager_reviews_completed,
            activeCycle.team_summary.total_members,
            'Manager Reviews'
          )}
          {renderProgressBar(
            activeCycle.team_summary.meetings_completed,
            activeCycle.team_summary.total_members,
            'Review Meetings'
          )}
        </div>
      </div>

      {/* Team Members Review Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <UsersIcon className="h-5 w-5 mr-2 text-green-600" />
          Team Members ({teamReviews.length})
        </h2>
        
        <div className="space-y-4">
          {teamReviews.map((member) => (
            <div key={member.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                    <span className="text-sm font-medium text-blue-600">
                      {member.employee_name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">{member.employee_name}</h3>
                    <p className="text-sm text-gray-600">{member.employee_email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  {/* Review Status */}
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Self Assessment</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.self_assessment_status)}`}>
                      {member.self_assessment_status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Peer Reviews</p>
                    <span className="text-sm font-medium text-gray-900">
                      {member.peer_reviews_received}/{member.peer_reviews_expected}
                    </span>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Manager Review</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.manager_review_status)}`}>
                      {member.manager_review_status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Meeting</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      member.meeting_scheduled ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                    }`}>
                      {member.meeting_scheduled ? 'Scheduled' : 'Pending'}
                    </span>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {member.manager_review_status === 'not_started' && (
                      <Button
                        size="sm"
                        onClick={() => handleStartManagerReview(member)}
                        className="flex items-center"
                      >
                        <PlayIcon className="h-4 w-4 mr-1" />
                        Start Review
                      </Button>
                    )}
                    
                    {member.manager_review_status === 'in_progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartManagerReview(member)}
                        className="flex items-center"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Continue
                      </Button>
                    )}
                    
                    {member.manager_review_status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartManagerReview(member)}
                        className="flex items-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    )}
                    
                    {!member.meeting_scheduled && member.manager_review_status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleScheduleMeeting(member)}
                        className="flex items-center"
                      >
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Schedule
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Overall Progress</span>
                  <span>{member.overall_progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${member.overall_progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manager Review Modal */}
      {showManagerReviewModal && selectedEmployee && (
        <ManagerReviewForm
          cycleId={activeCycle.cycle.id}
          employeeId={selectedEmployee.id}
          onSubmit={handleReviewSubmitted}
          onCancel={() => {
            setShowManagerReviewModal(false);
            setSelectedEmployee(null);
          }}
        />
      )}

      {/* Upward Review Modal */}
      {showUpwardReviewModal && (
        <UpwardReviewForm
          cycleId={activeCycle.cycle.id}
          onSubmit={handleReviewSubmitted}
          onCancel={() => setShowUpwardReviewModal(false)}
        />
      )}

      {/* Meeting Scheduler Modal */}
      {showMeetingSchedulerModal && selectedEmployee && (
        <ReviewMeetingScheduler
          cycleId={activeCycle.cycle.id}
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.employee_name}
          onScheduled={handleReviewSubmitted}
          onCancel={() => {
            setShowMeetingSchedulerModal(false);
            setSelectedEmployee(null);
          }}
        />
      )}
    </div>
  );
}; 