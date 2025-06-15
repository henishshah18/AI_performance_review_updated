import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeSlashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { PeerReviewForm } from '../../components/reviews/PeerReviewForm';
import { reviewsService } from '../../services/reviewsService';
import { ReviewCycle, PeerReview } from '../../types/reviews';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/common/Button';

export const PeerReviewPage: React.FC = () => {
  const { cycleId, revieweeId, reviewId } = useParams<{ 
    cycleId?: string; 
    revieweeId?: string; 
    reviewId?: string; 
  }>();
  const navigate = useNavigate();
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<ReviewCycle | null>(null);
  const [peerReviews, setPeerReviews] = useState<PeerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (cycleId && revieweeId && cycles.length > 0) {
      const cycle = cycles.find(c => c.id === cycleId);
      if (cycle) {
        setSelectedCycle(cycle);
        setShowForm(true);
      }
    }
  }, [cycleId, revieweeId, cycles]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [cyclesResponse, reviewsResponse] = await Promise.allSettled([
        reviewsService.getActiveReviewCycles(),
        reviewsService.getPeerReviews({ page_size: 50 })
      ]);

      if (cyclesResponse.status === 'fulfilled') {
        setCycles(cyclesResponse.value);
      }

      if (reviewsResponse.status === 'fulfilled') {
        setPeerReviews(reviewsResponse.value.results);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSave = (review: PeerReview) => {
    setPeerReviews(prev => {
      const existing = prev.find(r => r.id === review.id);
      if (existing) {
        return prev.map(r => r.id === review.id ? review : r);
      } else {
        return [review, ...prev];
      }
    });
  };

  const handleReviewSubmit = (review: PeerReview) => {
    setPeerReviews(prev => prev.map(r => r.id === review.id ? review : r));
    navigate('/reviews', { 
      state: { message: 'Peer review submitted successfully!' }
    });
  };

  const handleBack = () => {
    if (showForm) {
      setShowForm(false);
      setSelectedCycle(null);
      navigate('/reviews/peer-review');
    } else {
      navigate('/reviews');
    }
  };

  const handleStartReview = (cycleId: string, revieweeId: string) => {
    navigate(`/reviews/peer-review/${cycleId}/${revieweeId}`);
  };

  const groupReviewsByCycle = () => {
    const grouped: Record<string, PeerReview[]> = {};
    peerReviews.forEach(review => {
      if (!grouped[review.cycle]) {
        grouped[review.cycle] = [];
      }
      grouped[review.cycle].push(review);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <ErrorMessage message={error} onRetry={loadData} />
      </div>
    );
  }

  if (showForm && selectedCycle && cycleId && revieweeId) {
    const existingReview = peerReviews.find(r => 
      r.cycle === cycleId && r.reviewee === revieweeId
    );
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="mr-4 flex items-center"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Peer Review</h1>
                  <p className="text-sm text-gray-600">{selectedCycle.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PeerReviewForm
            cycleId={cycleId}
            revieweeId={revieweeId}
            reviewId={existingReview?.id}
            onSave={handleReviewSave}
            onSubmit={handleReviewSubmit}
            onCancel={handleBack}
          />
        </div>
      </div>
    );
  }

  const groupedReviews = groupReviewsByCycle();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="mr-4 flex items-center"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Reviews
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Peer Reviews</h1>
                <p className="text-sm text-gray-600">Review your colleagues' performance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cycles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Review Cycles</h3>
            <p className="text-gray-600">
              There are currently no active review cycles available for peer reviews.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Cycles with Pending Reviews */}
            {cycles.map((cycle) => {
              const cycleReviews = groupedReviews[cycle.id] || [];
              const pendingReviews = cycleReviews.filter(r => r.status !== 'completed');
              const completedReviews = cycleReviews.filter(r => r.status === 'completed');

              return (
                <div key={cycle.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{cycle.name}</h2>
                      <p className="text-sm text-gray-600">
                        {reviewsService.formatReviewType(cycle.review_type)} • 
                        Due: {reviewsService.formatDate(cycle.peer_review_end)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {completedReviews.length} of {cycleReviews.length} completed
                      </p>
                      {cycleReviews.length > 0 && (
                        <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.round((completedReviews.length / cycleReviews.length) * 100)}%` 
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pending Reviews */}
                  {pendingReviews.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2 text-amber-600" />
                        Pending Reviews ({pendingReviews.length})
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {pendingReviews.map((review) => (
                          <div
                            key={review.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleStartReview(review.cycle, review.reviewee)}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {review.reviewee_details.first_name} {review.reviewee_details.last_name}
                                </h4>
                                <p className="text-sm text-gray-600">{review.reviewee_details.email}</p>
                              </div>
                              <div className="flex items-center">
                                {review.is_anonymous ? (
                                  <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <EyeIcon className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                review.status === 'in_progress'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {review.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                              </span>
                              
                              <Button size="sm" variant="outline">
                                {review.status === 'in_progress' ? 'Continue' : 'Start Review'}
                              </Button>
                            </div>

                            {review.is_anonymous && (
                              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-xs text-blue-800">Anonymous review</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed Reviews */}
                  {completedReviews.length > 0 && (
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                        <CheckCircleIcon className="h-4 w-4 mr-2 text-green-600" />
                        Completed Reviews ({completedReviews.length})
                      </h3>
                      <div className="space-y-3">
                        {completedReviews.map((review) => (
                          <div key={review.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 mr-4">
                                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {review.reviewee_details.first_name} {review.reviewee_details.last_name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Submitted on {reviewsService.formatDateTime(review.submitted_at || '')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              {review.is_anonymous && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <EyeSlashIcon className="h-3 w-3 mr-1" />
                                  Anonymous
                                </span>
                              )}
                              <span className="text-sm text-gray-500">
                                {reviewsService.getRatingStars(review.collaboration_rating)} Collaboration
                              </span>
                              <span className="text-sm text-gray-500">
                                {reviewsService.getRatingStars(review.impact_rating)} Impact
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Reviews Message */}
                  {cycleReviews.length === 0 && (
                    <div className="text-center py-8">
                      <UsersIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No peer reviews assigned for this cycle</p>
                    </div>
                  )}

                  {/* Overdue Warning */}
                  {reviewsService.isReviewOverdue(cycle.peer_review_end) && pendingReviews.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center">
                        <ClockIcon className="h-5 w-5 text-red-600 mr-2" />
                        <p className="text-sm text-red-800">
                          Peer review deadline has passed. Please complete your pending reviews as soon as possible.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Summary Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Summary</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {peerReviews.filter(r => r.status === 'completed').length}
                  </p>
                  <p className="text-sm text-gray-600">Reviews Completed</p>
                </div>
                
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-600">
                    {peerReviews.filter(r => r.status !== 'completed').length}
                  </p>
                  <p className="text-sm text-gray-600">Reviews Pending</p>
                </div>
                
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">
                    {peerReviews.filter(r => r.is_anonymous).length}
                  </p>
                  <p className="text-sm text-gray-600">Anonymous Reviews</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 