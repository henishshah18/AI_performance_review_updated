import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ClockIcon,
  StarIcon,
  UserIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { reviewsService } from '../../services/reviewsService';
import { ManagerReview, CreateManagerReviewData, ReviewCycle, SelfAssessment, PeerReview } from '../../types/reviews';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { Button } from '../common/Button';

interface ManagerReviewFormProps {
  cycleId: string;
  employeeId: string;
  reviewId?: string;
  onSave?: (review: ManagerReview) => void;
  onSubmit?: (review: ManagerReview) => void;
  onCancel?: () => void;
  className?: string;
}

interface FormStep {
  id: string;
  title: string;
  description: string;
  fields: string[];
}

const FORM_STEPS: FormStep[] = [
  {
    id: 'overview',
    title: 'Overall Assessment',
    description: 'Provide an overall performance rating',
    fields: ['overall_rating']
  },
  {
    id: 'competencies',
    title: 'Core Competencies',
    description: 'Evaluate key performance areas',
    fields: ['technical_excellence', 'collaboration', 'problem_solving', 'initiative']
  },
  {
    id: 'development',
    title: 'Development Planning',
    description: 'Create development plans and support commitments',
    fields: ['development_plan', 'manager_support', 'business_impact']
  }
];

export const ManagerReviewForm: React.FC<ManagerReviewFormProps> = ({
  cycleId,
  employeeId,
  reviewId,
  onSave,
  onSubmit,
  onCancel,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CreateManagerReviewData>({
    cycle: cycleId,
    employee: employeeId,
    status: 'in_progress'
  });
  const [review, setReview] = useState<ManagerReview | null>(null);
  const [cycle, setCycle] = useState<ReviewCycle | null>(null);
  const [employeeSelfAssessment, setEmployeeSelfAssessment] = useState<SelfAssessment | null>(null);
  const [employeePeerReviews, setEmployeePeerReviews] = useState<PeerReview[]>([]);
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

      const [cycleData, reviewData, selfAssessmentData, peerReviewsData] = await Promise.allSettled([
        reviewsService.getReviewCycle(cycleId),
        reviewId ? reviewsService.getManagerReview(reviewId) : Promise.resolve(null),
        reviewsService.getSelfAssessments({ cycle_id: cycleId, user_id: employeeId }).then(res => res.results[0] || null),
        reviewsService.getPeerReviews({ cycle_id: cycleId, reviewee_id: employeeId })
      ]);

      if (cycleData.status === 'fulfilled') {
        setCycle(cycleData.value);
      }

      if (reviewData.status === 'fulfilled' && reviewData.value) {
        const data = reviewData.value;
        setReview(data);
        setFormData({
          cycle: data.cycle,
          employee: data.employee,
          status: data.status,
          overall_rating: data.overall_rating,
          technical_excellence: data.technical_excellence,
          technical_justification: data.technical_justification,
          collaboration: data.collaboration,
          collaboration_justification: data.collaboration_justification,
          problem_solving: data.problem_solving,
          problem_solving_justification: data.problem_solving_justification,
          initiative: data.initiative,
          initiative_justification: data.initiative_justification,
          development_plan: data.development_plan,
          manager_support: data.manager_support,
          business_impact: data.business_impact
        });
      }

      if (selfAssessmentData.status === 'fulfilled') {
        setEmployeeSelfAssessment(selfAssessmentData.value);
      }

      if (peerReviewsData.status === 'fulfilled') {
        setEmployeePeerReviews(peerReviewsData.value.results || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateManagerReviewData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      let savedReview: ManagerReview;
      if (reviewId) {
        savedReview = await reviewsService.updateManagerReview(reviewId, formData);
      } else {
        savedReview = await reviewsService.createManagerReview(formData);
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
        const submittedReview = await reviewsService.updateManagerReview(currentReview.id, updatedData);
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
      employee: review.employee,
      status: review.status,
      overall_rating: review.overall_rating,
      technical_excellence: review.technical_excellence,
      technical_justification: review.technical_justification,
      collaboration: review.collaboration,
      collaboration_justification: review.collaboration_justification,
      problem_solving: review.problem_solving,
      problem_solving_justification: review.problem_solving_justification,
      initiative: review.initiative,
      initiative_justification: review.initiative_justification,
      development_plan: review.development_plan,
      manager_support: review.manager_support,
      business_impact: review.business_impact
    });
  };

  const renderRatingInput = (
    label: string,
    field: keyof CreateManagerReviewData,
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
    field: keyof CreateManagerReviewData,
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

  const renderOverallRating = () => (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">Overall Performance Rating</label>
      <p className="text-sm text-gray-600">
        Provide an overall assessment of this employee's performance during the review period
      </p>
      <div className="space-y-3">
        {[
          { value: 'exceeds_expectations', label: 'Exceeds Expectations', description: 'Consistently performs above requirements' },
          { value: 'meets_expectations', label: 'Meets Expectations', description: 'Consistently meets all requirements' },
          { value: 'below_expectations', label: 'Below Expectations', description: 'Performance needs improvement' }
        ].map((option) => (
          <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              value={option.value}
              checked={formData.overall_rating === option.value}
              onChange={(e) => handleInputChange('overall_rating', e.target.value)}
              disabled={review?.status === 'completed'}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">{option.label}</div>
              <div className="text-sm text-gray-600">{option.description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );

  const renderContextSection = () => (
    <div className="bg-gray-50 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
        Employee Context
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Self Assessment Summary */}
        {employeeSelfAssessment && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Self Assessment Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Technical Excellence:</span>
                <span className="font-medium">{employeeSelfAssessment.technical_excellence || 'N/A'}/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Collaboration:</span>
                <span className="font-medium">{employeeSelfAssessment.collaboration || 'N/A'}/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Problem Solving:</span>
                <span className="font-medium">{employeeSelfAssessment.problem_solving || 'N/A'}/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Initiative:</span>
                <span className="font-medium">{employeeSelfAssessment.initiative || 'N/A'}/5</span>
              </div>
            </div>
          </div>
        )}

        {/* Peer Reviews Summary */}
        {employeePeerReviews.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Peer Reviews Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Reviews Received:</span>
                <span className="font-medium">{employeePeerReviews.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Collaboration:</span>
                <span className="font-medium">
                  {employeePeerReviews.reduce((sum, review) => sum + (review.collaboration_rating || 0), 0) / employeePeerReviews.length || 0}/5
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Impact:</span>
                <span className="font-medium">
                  {employeePeerReviews.reduce((sum, review) => sum + (review.impact_rating || 0), 0) / employeePeerReviews.length || 0}/5
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStepContent = () => {
    const step = FORM_STEPS[currentStep];

    switch (step.id) {
      case 'overview':
        return (
          <div className="space-y-6">
            {renderContextSection()}
            {renderOverallRating()}
          </div>
        );

      case 'competencies':
        return (
          <div className="space-y-8">
            {/* Technical Excellence */}
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900">Technical Excellence</h3>
                <p className="text-gray-600 mt-1">Evaluate technical skills and expertise</p>
              </div>
              {renderRatingInput(
                'Technical Excellence Rating',
                'technical_excellence',
                formData.technical_excellence
              )}
              {renderTextArea(
                'Technical Excellence Justification',
                'technical_justification',
                'Provide specific examples and justification for the technical excellence rating...',
                formData.technical_justification,
                4
              )}
            </div>

            {/* Collaboration */}
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900">Collaboration</h3>
                <p className="text-gray-600 mt-1">Assess teamwork and collaboration skills</p>
              </div>
              {renderRatingInput(
                'Collaboration Rating',
                'collaboration',
                formData.collaboration
              )}
              {renderTextArea(
                'Collaboration Justification',
                'collaboration_justification',
                'Describe how the employee collaborates with team members and contributes to team success...',
                formData.collaboration_justification,
                4
              )}
            </div>

            {/* Problem Solving */}
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900">Problem Solving</h3>
                <p className="text-gray-600 mt-1">Evaluate analytical and problem-solving abilities</p>
              </div>
              {renderRatingInput(
                'Problem Solving Rating',
                'problem_solving',
                formData.problem_solving
              )}
              {renderTextArea(
                'Problem Solving Justification',
                'problem_solving_justification',
                'Provide examples of complex problems solved and analytical approach taken...',
                formData.problem_solving_justification,
                4
              )}
            </div>

            {/* Initiative */}
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900">Initiative</h3>
                <p className="text-gray-600 mt-1">Assess proactive behavior and leadership</p>
              </div>
              {renderRatingInput(
                'Initiative Rating',
                'initiative',
                formData.initiative
              )}
              {renderTextArea(
                'Initiative Justification',
                'initiative_justification',
                'Describe examples of proactive behavior, leadership, and taking initiative...',
                formData.initiative_justification,
                4
              )}
            </div>
          </div>
        );

      case 'development':
        return (
          <div className="space-y-8">
            {/* Development Plan */}
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <LightBulbIcon className="h-5 w-5 mr-2 text-yellow-600" />
                  Development Plan
                </h3>
                <p className="text-gray-600 mt-1">Create a development plan for the employee's growth</p>
              </div>
              {renderTextArea(
                'Development Plan',
                'development_plan',
                'Outline specific development goals, skills to improve, and growth opportunities...',
                formData.development_plan,
                6,
                'Be specific about development areas and actionable steps'
              )}
            </div>

            {/* Manager Support */}
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Manager Support
                </h3>
                <p className="text-gray-600 mt-1">Commit to specific support you will provide</p>
              </div>
              {renderTextArea(
                'Manager Support Commitments',
                'manager_support',
                'Describe how you will support the employee in achieving their development goals...',
                formData.manager_support,
                5,
                'Include specific actions, resources, and time commitments'
              )}
            </div>

            {/* Business Impact */}
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ChartBarIcon className="h-5 w-5 mr-2 text-green-600" />
                  Business Impact
                </h3>
                <p className="text-gray-600 mt-1">Assess the employee's impact on business outcomes</p>
              </div>
              {renderTextArea(
                'Business Impact Assessment',
                'business_impact',
                'Describe the employee\'s contributions to business goals and organizational success...',
                formData.business_impact,
                5,
                'Focus on measurable outcomes and strategic value'
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isStepComplete = (stepIndex: number) => {
    const step = FORM_STEPS[stepIndex];
    
    switch (step.id) {
      case 'overview':
        return !!formData.overall_rating;
      case 'competencies':
        return formData.technical_excellence && formData.collaboration && 
               formData.problem_solving && formData.initiative &&
               formData.technical_justification && formData.collaboration_justification &&
               formData.problem_solving_justification && formData.initiative_justification;
      case 'development':
        return formData.development_plan && formData.manager_support && formData.business_impact;
      default:
        return false;
    }
  };

  const calculateProgress = () => {
    const completedSteps = FORM_STEPS.filter((_, index) => isStepComplete(index)).length;
    return Math.round((completedSteps / FORM_STEPS.length) * 100);
  };

  const canSubmit = () => {
    return FORM_STEPS.every((_, index) => isStepComplete(index)) && review?.status !== 'completed';
  };

  const canGoNext = () => {
    return currentStep < FORM_STEPS.length - 1;
  };

  const canGoPrev = () => {
    return currentStep > 0;
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
            <h2 className="text-2xl font-bold text-gray-900">Manager Review</h2>
            <p className="text-gray-600 mt-1">
              {cycle?.name} - Review for {review?.employee_details?.first_name} {review?.employee_details?.last_name}
            </p>
          </div>
          {review?.status === 'completed' && (
            <div className="flex items-center text-green-600">
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              <span className="font-medium">Submitted</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{calculateProgress()}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>

        {/* Step Navigation */}
        <div className="mt-6">
          <nav className="flex items-center justify-center">
            {FORM_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    index <= currentStep
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300 text-gray-500'
                  } ${index < currentStep ? 'bg-green-600 border-green-600' : ''}`}
                >
                  {index < currentStep ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="ml-2 mr-8">
                  <p className={`text-sm font-medium ${
                    index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < FORM_STEPS.length - 1 && (
                  <div className={`w-12 h-1 ${
                    index < currentStep ? 'bg-green-600' : 'bg-gray-300'
                  } mr-8`} />
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {FORM_STEPS[currentStep].title}
          </h3>
          <p className="text-gray-600 mt-1">
            {FORM_STEPS[currentStep].description}
          </p>
        </div>

        {renderStepContent()}

        {/* Navigation Buttons */}
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
              variant="ghost"
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={!canGoPrev()}
              className="flex items-center"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Previous
            </Button>

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

            {canGoNext() ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="flex items-center"
              >
                Next
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Button>
            ) : (
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
            )}

            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Validation Warning */}
        {!canSubmit() && currentStep === FORM_STEPS.length - 1 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mr-2" />
              <p className="text-sm text-amber-800">
                Please complete all sections before submitting the review.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 