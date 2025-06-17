import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  UserGroupIcon,
  DocumentTextIcon,
  StarIcon,
  EyeIcon,
  PencilIcon,
  CalendarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { ManagerReviewForm } from './ManagerReviewForm';

interface ReviewManagementProps {
  className?: string;
}

interface TeamMemberReview {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  reviewId?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  lastUpdated?: string;
  selfAssessmentStatus: 'not_started' | 'in_progress' | 'completed';
  peerReviewsReceived: number;
  peerReviewsExpected: number;
}

interface ReviewCycle {
  id: string;
  name: string;
  review_type: string;
  status: string;
  current_phase: string;
}

export const ReviewManagement: React.FC<ReviewManagementProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [activeCycles, setActiveCycles] = useState<ReviewCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<ReviewCycle | null>(null);
  const [teamReviews, setTeamReviews] = useState<TeamMemberReview[]>([]);
  
  // Modal states
  const [showManagerReviewModal, setShowManagerReviewModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCycle) {
      loadCycleSpecificData();
    }
  }, [selectedCycle]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock active cycles data
      const mockCycles: ReviewCycle[] = [
        {
          id: 'cycle-1',
          name: 'Q3 2024 Performance Review',
          review_type: 'quarterly',
          status: 'active',
          current_phase: 'manager_review'
        }
      ];

      setActiveCycles(mockCycles);
      if (mockCycles.length > 0) {
        setSelectedCycle(mockCycles[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadCycleSpecificData = async () => {
    if (!selectedCycle) return;

    try {
      if (user?.role === 'manager') {
        // Mock team reviews for managers
        const mockTeamReviews: TeamMemberReview[] = [
          {
            employeeId: 'emp-1',
            employeeName: 'David Smith',
            employeeEmail: 'employee1@demo.com',
            status: 'not_started',
            selfAssessmentStatus: 'completed',
            peerReviewsReceived: 2,
            peerReviewsExpected: 3,
            lastUpdated: '2024-10-15T10:00:00Z'
          },
          {
            employeeId: 'emp-2',
            employeeName: 'Lisa Wang',
            employeeEmail: 'employee2@demo.com',
            status: 'in_progress',
            selfAssessmentStatus: 'completed',
            peerReviewsReceived: 3,
            peerReviewsExpected: 3,
            lastUpdated: '2024-10-16T14:30:00Z'
          }
        ];
        
        setTeamReviews(mockTeamReviews);
      }
    } catch (err) {
      console.error('Failed to load cycle-specific data:', err);
    }
  };

  const handleStartManagerReview = (employeeId: string, reviewId?: string) => {
    setSelectedEmployeeId(employeeId);
    setSelectedReviewId(reviewId || null);
    setShowManagerReviewModal(true);
  };

  const handleReviewSave = () => {
    loadCycleSpecificData();
  };

  const handleReviewSubmit = () => {
    setShowManagerReviewModal(false);
    setSelectedEmployeeId(null);
    setSelectedReviewId(null);
    loadCycleSpecificData();
  };

  const handleReviewCancel = () => {
    setShowManagerReviewModal(false);
    setSelectedEmployeeId(null);
    setSelectedReviewId(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      default:
        return <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const renderTeamReviewsSection = () => {
    if (user?.role !== 'manager' || !selectedCycle) return null;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2 text-blue-600" />
            Team Reviews
          </h3>
          <div className="text-sm text-gray-600">
            {teamReviews.filter(review => review.status === 'completed').length} of {teamReviews.length} completed
          </div>
        </div>

        {teamReviews.length === 0 ? (
          <div className="text-center py-8">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No team members assigned for this review cycle</p>
          </div>
        ) : (
          <div className="space-y-4">
            {teamReviews.map((review) => (
              <div key={review.employeeId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getStatusIcon(review.status)}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{review.employeeName}</h4>
                      <p className="text-sm text-gray-600">{review.employeeEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    {/* Self Assessment Status */}
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Self Assessment</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(review.selfAssessmentStatus)}`}>
                        {review.selfAssessmentStatus.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {/* Peer Reviews Status */}
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Peer Reviews</p>
                      <span className="text-sm font-medium text-gray-900">
                        {review.peerReviewsReceived}/{review.peerReviewsExpected}
                      </span>
                    </div>
                    
                    {/* Manager Review Status */}
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Manager Review</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                        {review.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {/* Action Button */}
                    <Button
                      size="sm"
                      onClick={() => handleStartManagerReview(review.employeeId, review.reviewId)}
                      className="flex items-center"
                    >
                      {review.status === 'completed' ? (
                        <>
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </>
                      ) : (
                        <>
                          <PencilIcon className="h-4 w-4 mr-1" />
                          {review.status === 'not_started' ? 'Start Review' : 'Continue'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                {review.lastUpdated && (
                  <div className="mt-2 text-xs text-gray-500">
                    Last updated: {formatDate(review.lastUpdated)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderMyReviewsSection = () => {
    if (!selectedCycle) return null;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <DocumentTextIcon className="h-5 w-5 mr-2 text-green-600" />
          My Reviews
        </h3>

        <div className="space-y-6">
          {/* Self Assessment */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getStatusIcon('completed')}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Self Assessment</h4>
                  <p className="text-sm text-gray-600">Evaluate your own performance</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-sm font-medium capitalize ${getStatusColor('completed')}`}>
                  Completed
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View
                </Button>
              </div>
            </div>
          </div>

          {/* Peer Reviews */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Peer Reviews</h4>
                <p className="text-sm text-gray-600">Review your colleagues</p>
              </div>
              <div className="text-sm text-gray-600">
                2 of 3 completed
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon('completed')}
                  <span className="text-sm text-gray-900">John Doe</span>
                </div>
                <Button size="sm" variant="outline" className="flex items-center">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View
                </Button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon('completed')}
                  <span className="text-sm text-gray-900">Jane Smith</span>
                </div>
                <Button size="sm" variant="outline" className="flex items-center">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View
                </Button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon('in_progress')}
                  <span className="text-sm text-gray-900">Mike Johnson</span>
                </div>
                <Button size="sm" className="flex items-center">
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Continue
                </Button>
              </div>
            </div>
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
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Review Management</h2>
            <p className="text-gray-600 mt-1">
              Manage your performance reviews and team evaluations
            </p>
          </div>
        </div>

        {/* Cycle Selection */}
        {activeCycles.length > 0 && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Active Review Cycle
            </label>
            <select
              value={selectedCycle?.id || ''}
              onChange={(e) => {
                const cycle = activeCycles.find(c => c.id === e.target.value);
                setSelectedCycle(cycle || null);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {activeCycles.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.name} ({cycle.review_type})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* No Active Cycles */}
      {activeCycles.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Review Cycles</h3>
          <p className="text-gray-600">
            There are currently no active review cycles. Check back later or contact your HR team.
          </p>
        </div>
      )}

      {/* Content Sections */}
      {selectedCycle && (
        <>
          {/* Team Reviews (Managers Only) */}
          {renderTeamReviewsSection()}

          {/* My Reviews */}
          {renderMyReviewsSection()}
        </>
      )}

      {/* Manager Review Modal */}
      {showManagerReviewModal && selectedCycle && selectedEmployeeId && (
        <Modal
          isOpen={showManagerReviewModal}
          onClose={handleReviewCancel}
          title="Manager Review"
          size="xl"
        >
          <ManagerReviewForm
            cycleId={selectedCycle.id}
            employeeId={selectedEmployeeId}
            reviewId={selectedReviewId || undefined}
            onSave={handleReviewSave}
            onSubmit={handleReviewSubmit}
            onCancel={handleReviewCancel}
          />
        </Modal>
      )}
    </div>
  );
}; 