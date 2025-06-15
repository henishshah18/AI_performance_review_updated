import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { SelfAssessmentForm } from '../../components/reviews/SelfAssessmentForm';
import { reviewsService } from '../../services/reviewsService';
import { ReviewCycle, SelfAssessment } from '../../types/reviews';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/common/Button';

export const SelfAssessmentPage: React.FC = () => {
  const { cycleId, assessmentId } = useParams<{ cycleId?: string; assessmentId?: string }>();
  const navigate = useNavigate();
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<ReviewCycle | null>(null);
  const [assessments, setAssessments] = useState<SelfAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (cycleId && cycles.length > 0) {
      const cycle = cycles.find(c => c.id === cycleId);
      if (cycle) {
        setSelectedCycle(cycle);
        setShowForm(true);
      }
    }
  }, [cycleId, cycles]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [cyclesResponse, assessmentsResponse] = await Promise.allSettled([
        reviewsService.getActiveReviewCycles(),
        reviewsService.getSelfAssessments({ page_size: 50 })
      ]);

      if (cyclesResponse.status === 'fulfilled') {
        setCycles(cyclesResponse.value);
      }

      if (assessmentsResponse.status === 'fulfilled') {
        setAssessments(assessmentsResponse.value.results);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCycleSelect = (cycle: ReviewCycle) => {
    setSelectedCycle(cycle);
    setShowForm(true);
    navigate(`/reviews/self-assessment/${cycle.id}`);
  };

  const handleAssessmentSave = (assessment: SelfAssessment) => {
    setAssessments(prev => {
      const existing = prev.find(a => a.id === assessment.id);
      if (existing) {
        return prev.map(a => a.id === assessment.id ? assessment : a);
      } else {
        return [assessment, ...prev];
      }
    });
  };

  const handleAssessmentSubmit = (assessment: SelfAssessment) => {
    setAssessments(prev => prev.map(a => a.id === assessment.id ? assessment : a));
    // Show success message or redirect
    navigate('/reviews', { 
      state: { message: 'Self-assessment submitted successfully!' }
    });
  };

  const handleBack = () => {
    if (showForm) {
      setShowForm(false);
      setSelectedCycle(null);
      navigate('/reviews/self-assessment');
    } else {
      navigate('/reviews');
    }
  };

  const getAssessmentForCycle = (cycleId: string) => {
    return assessments.find(a => a.cycle === cycleId);
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

  if (showForm && selectedCycle) {
    const existingAssessment = getAssessmentForCycle(selectedCycle.id);
    
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
                  <h1 className="text-xl font-semibold text-gray-900">Self Assessment</h1>
                  <p className="text-sm text-gray-600">{selectedCycle.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SelfAssessmentForm
            cycleId={selectedCycle.id}
            assessmentId={existingAssessment?.id}
            onSave={handleAssessmentSave}
            onSubmit={handleAssessmentSubmit}
            onCancel={handleBack}
          />
        </div>
      </div>
    );
  }

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
                <h1 className="text-xl font-semibold text-gray-900">Self Assessment</h1>
                <p className="text-sm text-gray-600">Choose a review cycle to complete your self-assessment</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cycles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Review Cycles</h3>
            <p className="text-gray-600">
              There are currently no active review cycles available for self-assessment.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Available Review Cycles
              </h2>
              <p className="text-gray-600 mb-6">
                Select a review cycle to start or continue your self-assessment.
              </p>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {cycles.map((cycle) => {
                  const assessment = getAssessmentForCycle(cycle.id);
                  const isCompleted = assessment?.status === 'completed';
                  const isInProgress = assessment?.status === 'in_progress';
                  
                  return (
                    <div
                      key={cycle.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleCycleSelect(cycle)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">{cycle.name}</h3>
                          <p className="text-sm text-gray-600">
                            {reviewsService.formatReviewType(cycle.review_type)}
                          </p>
                        </div>
                        <div className="flex items-center">
                          {isCompleted ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-600" />
                          ) : isInProgress ? (
                            <ClockIcon className="h-5 w-5 text-yellow-600" />
                          ) : (
                            <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Review Period</span>
                          <span className="text-gray-900">
                            {reviewsService.formatDate(cycle.review_period_start)} - {reviewsService.formatDate(cycle.review_period_end)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Self Assessment Due</span>
                          <span className={`font-medium ${
                            reviewsService.isReviewOverdue(cycle.self_assessment_end) 
                              ? 'text-red-600' 
                              : 'text-gray-900'
                          }`}>
                            {reviewsService.formatDate(cycle.self_assessment_end)}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isCompleted 
                            ? 'bg-green-100 text-green-800'
                            : isInProgress
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started'}
                        </span>

                        {assessment && (
                          <span className="text-sm text-gray-600">
                            {assessment.completion_percentage}% complete
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {assessment && assessment.completion_percentage > 0 && (
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                isCompleted ? 'bg-green-600' : 'bg-yellow-600'
                              }`}
                              style={{ width: `${assessment.completion_percentage}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Overdue Warning */}
                      {reviewsService.isReviewOverdue(cycle.self_assessment_end) && !isCompleted && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-xs text-red-800">
                            Self-assessment is overdue
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Completed Assessments */}
            {assessments.filter(a => a.status === 'completed').length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Completed Assessments
                </h2>
                
                <div className="space-y-3">
                  {assessments
                    .filter(a => a.status === 'completed')
                    .map((assessment) => (
                      <div key={assessment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{assessment.cycle_name}</h4>
                          <p className="text-sm text-gray-600">
                            Submitted on {reviewsService.formatDateTime(assessment.submitted_at || '')}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                          <span className="text-sm font-medium text-green-800">Completed</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 