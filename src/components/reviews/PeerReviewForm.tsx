import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  EyeSlashIcon,
  EyeIcon,
  StarIcon,
  UserIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { reviewsService } from '../../services/reviewsService';
import { PeerReview, CreatePeerReviewData, ReviewCycle } from '../../types/reviews';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { Button } from '../common/Button';

interface PeerReviewFormProps {
  cycleId: string;
  revieweeId: string;
  reviewId?: string;
  onSave?: (review: PeerReview) => void;
  onSubmit?: (review: PeerReview) => void;
  onCancel?: () => void;
  className?: string;
}

export const PeerReviewForm: React.FC<PeerReviewFormProps> = ({
  cycleId,
  revieweeId,
  reviewId,
  onSave,
  onSubmit,
  onCancel,
  className = ''
}) => {
  const [formData, setFormData] = useState<CreatePeerReviewData>({
    cycle: cycleId,
    reviewee: revieweeId,
    is_anonymous: false,
    status: 'in_progress'
  });
  const [review, setReview] = useState<PeerReview | null>(null);
  const [cycle, setCycle] = useState<ReviewCycle | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [cycleId, reviewId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [cycleData, reviewData] = await Promise.allSettled([
        reviewsService.getReviewCycle(cycleId),
        reviewId ? reviewsService.getPeerReview(reviewId) : Promise.resolve(null)
      ]);

      if (cycleData.status === 'fulfilled') {
        setCycle(cycleData.value);
      }

      if (reviewData.status === 'fulfilled' && reviewData.value) {
        const data = reviewData.value;
        setReview(data);
        setFormData({
          cycle: data.cycle,
          reviewee: data.reviewee,
          is_anonymous: data.is_anonymous,
          status: data.status,
          collaboration_rating: data.collaboration_rating,
          collaboration_examples: data.collaboration_examples,
          impact_rating: data.impact_rating,
          impact_examples: data.impact_examples,
          development_suggestions: data.development_suggestions,
          strengths_to_continue: data.strengths_to_continue
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreatePeerReviewData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      let savedReview: PeerReview;
      if (reviewId) {
        savedReview = await reviewsService.updatePeerReview(reviewId, formData);
      } else {
        savedReview = await reviewsService.createPeerReview(formData);
      }

      setReview(savedReview);
      onSave?.(savedReview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save review');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Save first if not already saved
      let currentReview = review;
      if (!currentReview || hasUnsavedChanges()) {
        await handleSave();
        currentReview = review;
      }

      if (currentReview) {
        // Update status to completed
        const updatedData = { ...formData, status: 'completed' as const };
        const submittedReview = await reviewsService.updatePeerReview(currentReview.id, updatedData);
        setReview(submittedReview);
        setFormData(prev => ({ ...prev, status: 'completed' }));
        onSubmit?.(submittedReview);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const hasUnsavedChanges = () => {
    if (!review) return true;
    
    return JSON.stringify(formData) !== JSON.stringify({
      cycle: review.cycle,
      reviewee: review.reviewee,
      is_anonymous: review.is_anonymous,
      status: review.status,
      collaboration_rating: review.collaboration_rating,
      collaboration_examples: review.collaboration_examples,
      impact_rating: review.impact_rating,
      impact_examples: review.impact_examples,
      development_suggestions: review.development_suggestions,
      strengths_to_continue: review.strengths_to_continue
    });
  };

  const renderRatingInput = (
    label: string,
    field: keyof CreatePeerReviewData,
    value?: number,
    description?: string
  ) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => handleInputChange(field, rating)}
            className="p-1 hover:scale-110 transition-transform"
            disabled={review?.status === 'completed'}
          >
            {value && value >= rating ? (
              <StarIconSolid className="h-6 w-6 text-yellow-400" />
            ) : (
              <StarIcon className="h-6 w-6 text-gray-300 hover:text-yellow-400" />
            )}
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {value ? `${value}/5` : 'Not rated'}
        </span>
      </div>
    </div>
  );

  const renderTextArea = (
    label: string,
    field: keyof CreatePeerReviewData,
    placeholder: string,
    value?: string,
    rows: number = 4,
    description?: string
  ) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}
      <textarea
        value={value || ''}
        onChange={(e) => handleInputChange(field, e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={review?.status === 'completed'}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
      />
    </div>
  );

  const canSubmit = () => {
    return formData.collaboration_rating && 
           formData.impact_rating && 
           formData.collaboration_examples && 
           formData.impact_examples &&
           review?.status !== 'completed';
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
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Peer Review</h2>
            <p className="text-gray-600 mt-1">
              {cycle?.name} - Review for {review?.reviewee_details?.first_name} {review?.reviewee_details?.last_name}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {review?.status === 'completed' && (
              <div className="flex items-center text-green-600">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">Submitted</span>
              </div>
            )}
          </div>
        </div>

        {/* Anonymous Toggle */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {formData.is_anonymous ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-600 mr-2" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-600 mr-2" />
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-900">Anonymous Review</h3>
                <p className="text-sm text-gray-600">
                  {formData.is_anonymous 
                    ? 'Your identity will be hidden from the reviewee'
                    : 'Your identity will be visible to the reviewee'
                  }
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleInputChange('is_anonymous', !formData.is_anonymous)}
              disabled={review?.status === 'completed'}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                formData.is_anonymous ? 'bg-blue-600' : 'bg-gray-200'
              } ${review?.status === 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.is_anonymous ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-8">
          {/* Collaboration Section */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                Collaboration Assessment
              </h3>
              <p className="text-gray-600 mt-1">
                Evaluate how well this person collaborates with team members
              </p>
            </div>

            {renderRatingInput(
              'Collaboration Rating',
              'collaboration_rating',
              formData.collaboration_rating,
              'Rate their teamwork, communication, and ability to work with others'
            )}

            {renderTextArea(
              'Collaboration Examples',
              'collaboration_examples',
              'Provide specific examples of their collaboration skills, teamwork contributions, and how they work with others...',
              formData.collaboration_examples,
              5,
              'Share concrete examples of their collaborative behavior'
            )}
          </div>

          {/* Impact Section */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <StarIcon className="h-5 w-5 mr-2 text-purple-600" />
                Impact Assessment
              </h3>
              <p className="text-gray-600 mt-1">
                Assess the impact of their work and contributions
              </p>
            </div>

            {renderRatingInput(
              'Impact Rating',
              'impact_rating',
              formData.impact_rating,
              'Rate the significance and quality of their contributions'
            )}

            {renderTextArea(
              'Impact Examples',
              'impact_examples',
              'Describe the impact of their work, achievements, and contributions to projects or team goals...',
              formData.impact_examples,
              5,
              'Highlight specific achievements and their business impact'
            )}
          </div>

          {/* Development Section */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-green-600" />
                Development Feedback
              </h3>
              <p className="text-gray-600 mt-1">
                Provide constructive feedback for their professional growth
              </p>
            </div>

            {renderTextArea(
              'Strengths to Continue',
              'strengths_to_continue',
              'What are their key strengths that they should continue to leverage and develop?',
              formData.strengths_to_continue,
              4,
              'Focus on positive behaviors and skills they excel at'
            )}

            {renderTextArea(
              'Development Suggestions',
              'development_suggestions',
              'What areas could they focus on for professional development and growth?',
              formData.development_suggestions,
              4,
              'Provide constructive suggestions for improvement'
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <div>
            {review?.status === 'completed' && (
              <p className="text-sm text-gray-600 flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-1 text-green-600" />
                Review submitted on {reviewsService.formatDateTime(review.submitted_at || '')}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={saving || review?.status === 'completed'}
              className="flex items-center"
            >
              {saving ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <DocumentTextIcon className="h-4 w-4 mr-2" />
              )}
              Save Draft
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit() || submitting}
              className="flex items-center"
            >
              {submitting ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <CheckCircleIcon className="h-4 w-4 mr-2" />
              )}
              {review?.status === 'completed' ? 'Already Submitted' : 'Submit Review'}
            </Button>

            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Validation Warning */}
        {!canSubmit() && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mr-2" />
              <p className="text-sm text-amber-800">
                Please provide ratings and examples for both collaboration and impact before submitting.
              </p>
            </div>
          </div>
        )}

        {/* Anonymous Notice */}
        {formData.is_anonymous && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <EyeSlashIcon className="h-5 w-5 text-blue-600 mr-2" />
              <p className="text-sm text-blue-800">
                This review will be submitted anonymously. Your identity will not be revealed to the reviewee.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 