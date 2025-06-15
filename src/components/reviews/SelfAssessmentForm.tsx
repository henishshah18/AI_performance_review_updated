import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ClockIcon,
  StarIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { reviewsService } from '../../services/reviewsService';
import { SelfAssessment, CreateSelfAssessmentData, ReviewCycle } from '../../types/reviews';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { Button } from '../common/Button';
import FormField from '../forms/FormField';
import FormTextarea from '../forms/FormTextarea';
import AIGenerationButton from '../ai/AIGenerationButton';
import aiService from '../../services/aiService';

interface SelfAssessmentFormProps {
  cycleId: string;
  assessmentId?: string;
  onSave?: (assessment: SelfAssessment) => void;
  onSubmit?: (assessment: SelfAssessment) => void;
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
    id: 'technical',
    title: 'Technical Excellence',
    description: 'Evaluate your technical skills and expertise',
    fields: ['technical_excellence', 'technical_examples']
  },
  {
    id: 'collaboration',
    title: 'Collaboration',
    description: 'Assess your teamwork and collaboration skills',
    fields: ['collaboration', 'collaboration_examples']
  },
  {
    id: 'problem_solving',
    title: 'Problem Solving',
    description: 'Review your analytical and problem-solving abilities',
    fields: ['problem_solving', 'problem_solving_examples']
  },
  {
    id: 'initiative',
    title: 'Initiative',
    description: 'Evaluate your proactive behavior and leadership',
    fields: ['initiative', 'initiative_examples']
  },
  {
    id: 'development',
    title: 'Development Goals',
    description: 'Plan your professional growth and development',
    fields: ['development_goals', 'manager_support_needed', 'career_interests']
  }
];

export const SelfAssessmentForm: React.FC<SelfAssessmentFormProps> = ({
  cycleId,
  assessmentId,
  onSave,
  onSubmit,
  onCancel,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CreateSelfAssessmentData>({
    cycle: cycleId,
    status: 'in_progress'
  });
  const [assessment, setAssessment] = useState<SelfAssessment | null>(null);
  const [cycle, setCycle] = useState<ReviewCycle | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [cycleId, assessmentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [cycleData, assessmentData] = await Promise.allSettled([
        reviewsService.getReviewCycle(cycleId),
        assessmentId ? reviewsService.getSelfAssessment(assessmentId) : Promise.resolve(null)
      ]);

      if (cycleData.status === 'fulfilled') {
        setCycle(cycleData.value);
      }

      if (assessmentData.status === 'fulfilled' && assessmentData.value) {
        const data = assessmentData.value;
        setAssessment(data);
        setFormData({
          cycle: data.cycle,
          status: data.status,
          technical_excellence: data.technical_excellence,
          technical_examples: data.technical_examples,
          collaboration: data.collaboration,
          collaboration_examples: data.collaboration_examples,
          problem_solving: data.problem_solving,
          problem_solving_examples: data.problem_solving_examples,
          initiative: data.initiative,
          initiative_examples: data.initiative_examples,
          development_goals: data.development_goals,
          manager_support_needed: data.manager_support_needed,
          career_interests: data.career_interests
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateSelfAssessmentData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      let savedAssessment: SelfAssessment;
      if (assessmentId) {
        savedAssessment = await reviewsService.updateSelfAssessment(assessmentId, formData);
      } else {
        savedAssessment = await reviewsService.createSelfAssessment(formData);
      }

      setAssessment(savedAssessment);
      onSave?.(savedAssessment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save assessment');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Save first if not already saved
      let currentAssessment = assessment;
      if (!currentAssessment || JSON.stringify(formData) !== JSON.stringify({
        cycle: currentAssessment.cycle,
        status: currentAssessment.status,
        technical_excellence: currentAssessment.technical_excellence,
        technical_examples: currentAssessment.technical_examples,
        collaboration: currentAssessment.collaboration,
        collaboration_examples: currentAssessment.collaboration_examples,
        problem_solving: currentAssessment.problem_solving,
        problem_solving_examples: currentAssessment.problem_solving_examples,
        initiative: currentAssessment.initiative,
        initiative_examples: currentAssessment.initiative_examples,
        development_goals: currentAssessment.development_goals,
        manager_support_needed: currentAssessment.manager_support_needed,
        career_interests: currentAssessment.career_interests
      })) {
        await handleSave();
        currentAssessment = assessment;
      }

      if (currentAssessment) {
        await reviewsService.submitSelfAssessment(currentAssessment.id);
        const updatedAssessment = await reviewsService.getSelfAssessment(currentAssessment.id);
        setAssessment(updatedAssessment);
        onSubmit?.(updatedAssessment);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateDraft = async () => {
    try {
      const { draft } = await aiService.generateSelfAssessmentDraft();
      // Assuming 'strengths' is a field in your formik values
      setFormData(prev => ({
        ...prev,
        strengths: draft
      }));
    } catch (error) {
      // You might want to show an error toast here
      console.error("Failed to generate AI draft", error);
    }
  };

  const renderRatingInput = (
    label: string,
    field: keyof CreateSelfAssessmentData,
    value?: number
  ) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => handleInputChange(field, rating)}
            className="p-1 hover:scale-110 transition-transform"
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
    field: keyof CreateSelfAssessmentData,
    placeholder: string,
    value?: string,
    rows: number = 4
  ) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <textarea
        value={value || ''}
        onChange={(e) => handleInputChange(field, e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );

  const renderStepContent = () => {
    const step = FORM_STEPS[currentStep];

    switch (step.id) {
      case 'technical':
        return (
          <div className="space-y-6">
            {renderRatingInput(
              'Technical Excellence Rating',
              'technical_excellence',
              formData.technical_excellence
            )}
            {renderTextArea(
              'Technical Examples',
              'technical_examples',
              'Describe specific examples of your technical achievements, contributions, and expertise...',
              formData.technical_examples,
              6
            )}
          </div>
        );

      case 'collaboration':
        return (
          <div className="space-y-6">
            {renderRatingInput(
              'Collaboration Rating',
              'collaboration',
              formData.collaboration
            )}
            {renderTextArea(
              'Collaboration Examples',
              'collaboration_examples',
              'Describe how you work with team members, contribute to team goals, and support others...',
              formData.collaboration_examples,
              6
            )}
          </div>
        );

      case 'problem_solving':
        return (
          <div className="space-y-6">
            {renderRatingInput(
              'Problem Solving Rating',
              'problem_solving',
              formData.problem_solving
            )}
            {renderTextArea(
              'Problem Solving Examples',
              'problem_solving_examples',
              'Describe complex problems you solved, your analytical approach, and the impact...',
              formData.problem_solving_examples,
              6
            )}
          </div>
        );

      case 'initiative':
        return (
          <div className="space-y-6">
            {renderRatingInput(
              'Initiative Rating',
              'initiative',
              formData.initiative
            )}
            {renderTextArea(
              'Initiative Examples',
              'initiative_examples',
              'Describe times you took initiative, went above and beyond, or led improvements...',
              formData.initiative_examples,
              6
            )}
          </div>
        );

      case 'development':
        return (
          <div className="space-y-6">
            {renderTextArea(
              'Development Goals',
              'development_goals',
              'What are your professional development goals for the next period?',
              formData.development_goals,
              4
            )}
            {renderTextArea(
              'Manager Support Needed',
              'manager_support_needed',
              'What support do you need from your manager to achieve your goals?',
              formData.manager_support_needed,
              4
            )}
            {renderTextArea(
              'Career Interests',
              'career_interests',
              'What are your career aspirations and interests?',
              formData.career_interests,
              4
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const calculateProgress = () => {
    const totalSteps = FORM_STEPS.length;
    return Math.round(((currentStep + 1) / totalSteps) * 100);
  };

  const isStepComplete = (stepIndex: number) => {
    const step = FORM_STEPS[stepIndex];
    return step.fields.every(field => {
      const value = formData[field as keyof CreateSelfAssessmentData];
      return value !== undefined && value !== null && value !== '';
    });
  };

  const canProceedToNext = () => {
    return isStepComplete(currentStep);
  };

  const canSubmit = () => {
    return FORM_STEPS.every((_, index) => isStepComplete(index));
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
            <h2 className="text-2xl font-bold text-gray-900">Self Assessment</h2>
            <p className="text-gray-600 mt-1">
              {cycle?.name} - Evaluate your performance and set development goals
            </p>
          </div>
          {assessment?.status === 'completed' && (
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
        <div className="mt-6 flex items-center justify-between">
          {FORM_STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${index < FORM_STEPS.length - 1 ? 'flex-1' : ''}`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  index === currentStep
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : isStepComplete(index)
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-gray-300 bg-white text-gray-500'
                }`}
              >
                {isStepComplete(index) && index !== currentStep ? (
                  <CheckCircleIcon className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                index === currentStep ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
              {index < FORM_STEPS.length - 1 && (
                <div className="flex-1 h-0.5 bg-gray-300 mx-4" />
              )}
            </div>
          ))}
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
          <div className="flex items-center space-x-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex items-center"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center"
            >
              {saving ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <DocumentTextIcon className="h-4 w-4 mr-2" />
              )}
              Save Draft
            </Button>

            {currentStep < FORM_STEPS.length - 1 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceedToNext()}
                className="flex items-center"
              >
                Next
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit() || submitting || assessment?.status === 'completed'}
                className="flex items-center"
              >
                {submitting ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                )}
                {assessment?.status === 'completed' ? 'Already Submitted' : 'Submit Assessment'}
              </Button>
            )}

            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Completion Warning */}
        {!canSubmit() && currentStep === FORM_STEPS.length - 1 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mr-2" />
              <p className="text-sm text-amber-800">
                Please complete all sections before submitting your assessment.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium">Self-Assessment</h3>
          <AIGenerationButton
            onClick={handleGenerateDraft}
            buttonText="Generate Draft with AI"
            generatingText="Generating..."
          />
        </div>

        {/* Strengths Field */}
        <FormTextarea
          id="strengths"
          name="strengths"
          label="What are your key strengths and accomplishments during this period?"
          value={formData.strengths}
          onChange={(e) => handleInputChange('strengths', e.target.value)}
          onBlur={(e) => handleInputChange('strengths', e.target.value)}
          error={formData.strengths ? undefined : 'Strengths are required'}
          rows={5}
          required
        />
      </div>
    </div>
  );
}; 