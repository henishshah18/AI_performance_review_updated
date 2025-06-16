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
import { reviewsService } from '../../services/reviewsService';
import { 
  ManagerReview, 
  SelfAssessment, 
  PeerReview, 
  ReviewCycle,
  UserReviewDashboard 
} from '../../types/reviews';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { SelfAssessmentForm } from './SelfAssessmentForm';
import { PeerReviewForm } from './PeerReviewForm';
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
}

export const ReviewManagement: React.FC<ReviewManagementProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<UserReviewDashboard | null>(null);
  const [activeCycles, setActiveCycles] = useState<ReviewCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<ReviewCycle | null>(null);
  const [teamReviews, setTeamReviews] = useState<TeamMemberReview[]>([]);
  const [myReviews, setMyReviews] = useState<{
    selfAssessments: SelfAssessment[];
    peerReviews: PeerReview[];
    managerReviews: ManagerReview[];
  }>({
    selfAssessments: [],
    peerReviews: [],
    managerReviews: []
  });
  
  // Modal states
  const [showSelfAssessmentModal, setShowSelfAssessmentModal] = useState(false);
  const [showPeerReviewModal, setShowPeerReviewModal] = useState(false);
  const [showManagerReviewModal, setShowManagerReviewModal] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedPeerRevieweeId, setSelectedPeerRevieweeId] = useState<string | null>(null);
  
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

      const [dashboardResponse, cyclesResponse] = await Promise.allSettled([
        reviewsService.getUserReviewDashboard(),
        reviewsService.getReviewCycles({ status: 'active', page_size: 50 })
      ]);

      if (dashboardResponse.status === 'fulfilled') {
        setDashboardData(dashboardResponse.value);
      }

      if (cyclesResponse.status === 'fulfilled') {
        const cycles = cyclesResponse.value.results;
        setActiveCycles(cycles);
        if (cycles.length > 0 && !selectedCycle) {
          setSelectedCycle(cycles[0]);
        }
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
        // Load team reviews for managers
        const teamResponse = await reviewsService.getManagerReviews({ 
          cycle_id: selectedCycle.id 
        });
        
        // Transform to team review format
        const teamReviews: TeamMemberReview[] = teamResponse.results.map(review => ({
          employeeId: review.employee,
          employeeName: `${review.employee_details.first_name} ${review.employee_details.last_name}`,
          employeeEmail: review.employee_details.email,
          reviewId: review.id,
          status: review.status,
          lastUpdated: review.updated_at
        }));
        
        setTeamReviews(teamReviews);
      }

      // Load my reviews for all users
      const [selfAssessments, peerReviews, managerReviews] = await Promise.allSettled([
        reviewsService.getSelfAssessments({ cycle_id: selectedCycle.id }),
        reviewsService.getPeerReviews({ cycle_id: selectedCycle.id }),
        user?.role === 'manager' 
          ? reviewsService.getManagerReviews({ cycle_id: selectedCycle.id })
          : Promise.resolve({ results: [] })
      ]);

      setMyReviews({
        selfAssessments: selfAssessments.status === 'fulfilled' ? selfAssessments.value.results : [],
        peerReviews: peerReviews.status === 'fulfilled' ? peerReviews.value.results : [],
        managerReviews: managerReviews.status === 'fulfilled' ? managerReviews.value.results : []
      });
    } catch (err) {
      console.error('Failed to load cycle-specific data:', err);
    }
  };

  const handleStartSelfAssessment = (cycleId: string, assessmentId?: string) => {
    setSelectedReviewId(assessmentId || null);
    setShowSelfAssessmentModal(true);
  };

  const handleStartPeerReview = (cycleId: string, revieweeId: string, reviewId?: string) => {
    setSelectedPeerRevieweeId(revieweeId);
    setSelectedReviewId(reviewId || null);
    setShowPeerReviewModal(true);
  };

  const handleStartManagerReview = (cycleId: string, employeeId: string, reviewId?: string) => {
    setSelectedEmployeeId(employeeId);
    setSelectedReviewId(reviewId || null);
    setShowManagerReviewModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      case 'not_started':
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-yellow-600';
      case 'not_started':
      default:
        return 'text-gray-500';
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
                  <div className="flex items-center space-x-3">
                    <span className={`text-sm font-medium capitalize ${getStatusColor(review.status)}`}>
                      {review.status.replace('_', ' ')}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleStartManagerReview(selectedCycle.id, review.employeeId, review.reviewId)}
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
                          {review.status === 'not_started' ? 'Start' : 'Continue'}
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

    const mySelfAssessment = myReviews.selfAssessments.find(sa => sa.cycle === selectedCycle.id);
    const myPeerReviewsToGive = myReviews.peerReviews.filter(pr => pr.reviewer === user?.id);
    const myManagerReviews = myReviews.managerReviews.filter(mr => mr.manager === user?.id);

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
                  {getStatusIcon(mySelfAssessment?.status || 'not_started')}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Self Assessment</h4>
                  <p className="text-sm text-gray-600">Evaluate your own performance</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-sm font-medium capitalize ${getStatusColor(mySelfAssessment?.status || 'not_started')}`}>
                  {(mySelfAssessment?.status || 'not_started').replace('_', ' ')}
                </span>
                <Button
                  size="sm"
                  onClick={() => handleStartSelfAssessment(selectedCycle.id, mySelfAssessment?.id)}
                  className="flex items-center"
                >
                  {mySelfAssessment?.status === 'completed' ? (
                    <>
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </>
                  ) : (
                    <>
                      <PencilIcon className="h-4 w-4 mr-1" />
                      {!mySelfAssessment ? 'Start' : 'Continue'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Peer Reviews */}
          {myPeerReviewsToGive.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Peer Reviews</h4>
                  <p className="text-sm text-gray-600">Review your colleagues</p>
                </div>
                <div className="text-sm text-gray-600">
                  {myPeerReviewsToGive.filter(pr => pr.status === 'completed').length} of {myPeerReviewsToGive.length} completed
                </div>
              </div>
              <div className="space-y-2">
                {myPeerReviewsToGive.map((peerReview) => (
                  <div key={peerReview.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(peerReview.status)}
                      <span className="text-sm text-gray-900">
                        {peerReview.reviewee_details?.first_name} {peerReview.reviewee_details?.last_name}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStartPeerReview(selectedCycle.id, peerReview.reviewee, peerReview.id)}
                      className="flex items-center"
                    >
                      {peerReview.status === 'completed' ? (
                        <>
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </>
                      ) : (
                        <>
                          <PencilIcon className="h-4 w-4 mr-1" />
                          {peerReview.status === 'not_started' ? 'Start' : 'Continue'}
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
        <ErrorMessage message={error} onRetry={loadData} />
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

      {/* Modals */}
      {showSelfAssessmentModal && selectedCycle && (
        <Modal
          title="Self Assessment"
          onClose={() => {
            setShowSelfAssessmentModal(false);
            setSelectedReviewId(null);
          }}
          size="lg"
        >
          <SelfAssessmentForm
            cycleId={selectedCycle.id}
            assessmentId={selectedReviewId || undefined}
            onSave={() => {
              loadCycleSpecificData();
            }}
            onSubmit={() => {
              setShowSelfAssessmentModal(false);
              setSelectedReviewId(null);
              loadCycleSpecificData();
            }}
            onCancel={() => {
              setShowSelfAssessmentModal(false);
              setSelectedReviewId(null);
            }}
          />
        </Modal>
      )}

      {showPeerReviewModal && selectedCycle && selectedPeerRevieweeId && (
        <Modal
          title="Peer Review"
          onClose={() => {
            setShowPeerReviewModal(false);
            setSelectedReviewId(null);
            setSelectedPeerRevieweeId(null);
          }}
          size="lg"
        >
          <PeerReviewForm
            cycleId={selectedCycle.id}
            revieweeId={selectedPeerRevieweeId}
            reviewId={selectedReviewId || undefined}
            onSave={() => {
              loadCycleSpecificData();
            }}
            onSubmit={() => {
              setShowPeerReviewModal(false);
              setSelectedReviewId(null);
              setSelectedPeerRevieweeId(null);
              loadCycleSpecificData();
            }}
            onCancel={() => {
              setShowPeerReviewModal(false);
              setSelectedReviewId(null);
              setSelectedPeerRevieweeId(null);
            }}
          />
        </Modal>
      )}

      {showManagerReviewModal && selectedCycle && selectedEmployeeId && (
        <Modal
          title="Manager Review"
          onClose={() => {
            setShowManagerReviewModal(false);
            setSelectedReviewId(null);
            setSelectedEmployeeId(null);
          }}
          size="lg"
        >
          <ManagerReviewForm
            cycleId={selectedCycle.id}
            employeeId={selectedEmployeeId}
            reviewId={selectedReviewId || undefined}
            onSave={() => {
              loadCycleSpecificData();
            }}
            onSubmit={() => {
              setShowManagerReviewModal(false);
              setSelectedReviewId(null);
              setSelectedEmployeeId(null);
              loadCycleSpecificData();
            }}
            onCancel={() => {
              setShowManagerReviewModal(false);
              setSelectedReviewId(null);
              setSelectedEmployeeId(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}; 