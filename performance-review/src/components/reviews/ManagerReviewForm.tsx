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
  LightBulbIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { ManagerReview, ReviewCycle, SelfAssessment, PeerReview } from '../../types/reviews';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';

interface ManagerReviewFormProps {
  cycleId: string;
  employeeId: string;
  reviewId?: string;
  onSave?: (review: ManagerReview) => void;
  onSubmit?: (review: ManagerReview) => void;
  onCancel?: () => void;
  className?: string;
}

interface CreateManagerReviewData {
  cycle: string;
  employee: string;
  status: string;
  overall_rating?: number;
  technical_excellence?: number;
  technical_justification?: string;
  collaboration?: number;
  collaboration_justification?: string;
  problem_solving?: number;
  problem_solving_justification?: string;
  initiative?: number;
  initiative_justification?: string;
  development_plan?: string;
  manager_support?: string;
  business_impact?: string;
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
  const [aiGenerating, setAiGenerating] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadData();
  }, [cycleId, reviewId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, just set mock data since the API might not be fully implemented
      setCycle({
        id: cycleId,
        name: 'Q3 2024 Performance Review',
        review_type: 'quarterly',
        status: 'active',
        current_phase: 'manager_review',
        participant_count: 5,
        review_period_start: '2024-07-01',
        review_period_end: '2024-09-30',
        self_assessment_start: '2024-10-01',
        self_assessment_end: '2024-10-07',
        peer_review_start: '2024-10-08',
        peer_review_end: '2024-10-14',
        manager_review_start: '2024-10-15',
        manager_review_end: '2024-10-21',
        created_by_name: 'HR Admin',
        created_at: '2024-09-01T00:00:00Z'
      });

      // Mock self assessment data
      setEmployeeSelfAssessment({
        id: 'sa-1',
        employee_id: employeeId,
        cycle_id: cycleId,
        status: 'submitted',
        responses: {
          technical_excellence: 4,
          collaboration: 5,
          problem_solving: 4,
          initiative: 4
        }
      });

      if (reviewId) {
        // Load existing review data
        setFormData({
          cycle: cycleId,
          employee: employeeId,
          status: 'in_progress'
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateManagerReviewData, value: any) => {
    setFormData((prev: CreateManagerReviewData) => ({
      ...prev,
      [field]: value
    }));
  };

  const generateAIDraft = async (category: string, field: keyof CreateManagerReviewData) => {
    try {
      setAiGenerating(prev => ({ ...prev, [category]: true }));
      
      console.log('Generating AI draft for category:', category);
      console.log('Employee ID:', employeeId);
      console.log('Cycle ID:', cycleId);
      
      // Call backend API for AI draft generation
      const response = await fetch('/api/reviews/ai/generate-review-draft/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('reviewai_access_token')}`
        },
        body: JSON.stringify({
          employee_id: employeeId,
          cycle_id: cycleId,
          category: category,
          context: {
            self_assessment: employeeSelfAssessment,
            peer_reviews: employeePeerReviews,
            cycle: cycle
          }
        })
      });

      console.log('API Response status:', response.status);
      console.log('API Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('API Error response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API Success response:', data);
      
      // Update the form with the generated draft
      handleInputChange(field, data.draft_content);
      
    } catch (err) {
      console.error('AI draft generation failed:', err);
      console.log('Falling back to mock drafts');
      
      // Enhanced mock drafts that match the new comprehensive format
      const mockDrafts = {
        technical_justification: `I have observed this employee demonstrate strong technical capabilities throughout this review period, consistently delivering high-quality work that meets our standards. Based on their self-assessment rating of 4/5 and peer feedback, their technical skills align well with role expectations. I have been particularly impressed with their approach to complex technical challenges, showing both depth of knowledge and practical application skills. Their code quality and attention to technical details have contributed significantly to project success and team productivity. In my assessment, they demonstrate strong problem-solving abilities when faced with technical obstacles, often finding efficient solutions. However, I believe there are opportunities for growth in staying current with emerging technologies and frameworks relevant to our work. I would like to see more proactive engagement in technical discussions and knowledge sharing with junior team members. Their collaboration on technical projects has been effective, though I encourage more leadership in technical decision-making processes. For continued development, I recommend pursuing advanced certifications in their area of expertise and taking on more complex technical challenges. Moving forward, I expect to see continued technical excellence with increased mentorship responsibilities and thought leadership within the team.`,
        
        collaboration_justification: `I have observed this employee demonstrate excellent collaborative skills throughout this review period, as evidenced by positive peer feedback and team dynamics. Based on their self-assessment of 5/5 and peer reviews from colleagues, their collaborative approach is highly valued by the team. I have witnessed their ability to facilitate productive discussions and build consensus among team members with different perspectives. Their communication style is clear and inclusive, ensuring all team members feel heard and valued in collaborative efforts. In cross-functional projects, I have seen them effectively bridge communication gaps between different departments and stakeholders. They consistently demonstrate respect for diverse viewpoints and show skill in incorporating feedback into collaborative solutions. I have noticed their willingness to support colleagues and share knowledge, contributing to overall team growth and capability. However, I believe there are opportunities for them to take on more leadership roles in collaborative initiatives and guide team direction more proactively. I would like to see them develop stronger skills in managing conflict resolution and navigating challenging team dynamics. For future development, I recommend seeking opportunities to lead cross-functional projects and mentor junior team members in collaborative best practices. Moving forward, I expect continued excellence in collaboration with expanded influence in shaping team culture and collaborative processes.`,
        
        problem_solving_justification: `I have witnessed this employee approach complex challenges with strong analytical thinking and systematic problem-solving methods throughout this review period. Based on their self-assessment rating of 4/5 and peer observations, their problem-solving capabilities are well-regarded within the team. I have been impressed by their ability to break down complex issues into manageable components and develop structured approaches to resolution. In challenging situations, I have observed them conduct thorough research and gather relevant information before proposing solutions. Their creative thinking has led to innovative approaches that have saved both time and resources on multiple projects. I have noticed their persistence when facing obstacles, demonstrating resilience and determination to find effective solutions. Their decision-making process shows good judgment in weighing risks and benefits, though I encourage more consultation with stakeholders in complex scenarios. However, I believe there are opportunities for improvement in documenting problem-solving processes and sharing methodologies with the team. I would like to see them develop stronger skills in anticipating potential issues and implementing preventive measures. For continued growth, I recommend taking on more complex analytical projects and developing expertise in advanced problem-solving frameworks. Moving forward, I expect to see enhanced problem-solving leadership with increased mentorship of others in analytical thinking and systematic approach to challenges.`,
        
        initiative_justification: `I have noticed this employee demonstrate strong self-motivation and proactive behavior throughout this review period, consistently going beyond basic job requirements. Based on their self-assessment of 4/5 and peer feedback, their initiative is recognized and appreciated by colleagues. Throughout this period, I have observed them identify improvement opportunities and take ownership of implementing solutions without being asked. I have been impressed by their ability to anticipate team needs and proactively address potential issues before they become problems. Their self-directed learning efforts have been evident in their pursuit of new skills and knowledge relevant to our objectives. I have witnessed them take leadership in process improvements, contributing valuable ideas that have enhanced team efficiency and effectiveness. Their goal-setting approach shows strong personal accountability and commitment to continuous improvement and professional growth. However, I believe there are opportunities for them to expand their influence and take on more strategic initiatives that impact broader organizational goals. I would like to see them develop stronger skills in change management and leading others through improvement initiatives. For future development, I recommend seeking opportunities to lead high-visibility projects and mentor others in developing proactive mindsets. Moving forward, I expect continued excellence in initiative with expanded scope of influence and increased contribution to organizational innovation and strategic direction.`
      };
      
      handleInputChange(field, mockDrafts[field as keyof typeof mockDrafts] || 'AI-generated draft content would appear here.');
    } finally {
      setAiGenerating(prev => ({ ...prev, [category]: false }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Mock save operation
      console.log('Saving manager review:', formData);
      
      const mockReview: ManagerReview = {
        id: reviewId || 'mr-1',
        manager_id: 'manager-1',
        employee_id: employeeId,
        cycle_id: cycleId,
        status: 'draft',
        responses: formData
      };
      
      onSave?.(mockReview);
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

      // Mock submit operation
      console.log('Submitting manager review:', formData);
      
      const mockReview: ManagerReview = {
        id: reviewId || 'mr-1',
        manager_id: 'manager-1',
        employee_id: employeeId,
        cycle_id: cycleId,
        status: 'submitted',
        responses: formData
      };
      
      onSubmit?.(mockReview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRatingInput = (
    label: string,
    field: keyof CreateManagerReviewData,
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

  const renderTextAreaWithAI = (
    label: string,
    field: keyof CreateManagerReviewData,
    placeholder: string,
    value?: string,
    rows: number = 4,
    category?: string
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {category && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => generateAIDraft(category, field)}
            disabled={aiGenerating[category]}
            className="flex items-center text-xs"
          >
            {aiGenerating[category] ? (
              <LoadingSpinner size="sm" className="mr-1" />
            ) : (
              <SparklesIcon className="h-3 w-3 mr-1" />
            )}
            {aiGenerating[category] ? 'Generating...' : 'AI Draft'}
          </Button>
        )}
      </div>
      <textarea
        value={value || ''}
        onChange={(e) => handleInputChange(field, e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );

  const renderTextArea = (
    label: string,
    field: keyof CreateManagerReviewData,
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
                <span className="font-medium">{employeeSelfAssessment.responses?.technical_excellence || 'N/A'}/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Collaboration:</span>
                <span className="font-medium">{employeeSelfAssessment.responses?.collaboration || 'N/A'}/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Problem Solving:</span>
                <span className="font-medium">{employeeSelfAssessment.responses?.problem_solving || 'N/A'}/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Initiative:</span>
                <span className="font-medium">{employeeSelfAssessment.responses?.initiative || 'N/A'}/5</span>
              </div>
            </div>
          </div>
        )}

        {/* Peer Reviews Summary */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Peer Reviews Summary</h4>
          {employeePeerReviews.length > 0 ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Reviews Received:</span>
                <span className="font-medium">{employeePeerReviews.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg. Collaboration:</span>
                <span className="font-medium">4.2/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg. Technical:</span>
                <span className="font-medium">4.5/5</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No peer reviews available</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    const step = FORM_STEPS[currentStep];

    switch (step.id) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900">Overall Performance Rating</h3>
              <p className="text-gray-600 mt-1">Provide an overall assessment of the employee's performance</p>
            </div>
            {renderRatingInput(
              'Overall Rating',
              'overall_rating',
              formData.overall_rating
            )}
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
              {renderTextAreaWithAI(
                'Technical Excellence Justification',
                'technical_justification',
                'Describe the employee\'s technical achievements, skills, and areas for improvement...',
                formData.technical_justification,
                4,
                'technical_excellence'
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
              {renderTextAreaWithAI(
                'Collaboration Justification',
                'collaboration_justification',
                'Describe how the employee collaborates with team members and contributes to team success...',
                formData.collaboration_justification,
                4,
                'collaboration'
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
              {renderTextAreaWithAI(
                'Problem Solving Justification',
                'problem_solving_justification',
                'Provide examples of complex problems solved and analytical approach taken...',
                formData.problem_solving_justification,
                4,
                'problem_solving'
              )}
            </div>

            {/* Initiative */}
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900">Initiative</h3>
                <p className="text-gray-600 mt-1">Assess proactive behavior and leadership potential</p>
              </div>
              {renderRatingInput(
                'Initiative Rating',
                'initiative',
                formData.initiative
              )}
              {renderTextAreaWithAI(
                'Initiative Justification',
                'initiative_justification',
                'Describe instances where the employee showed initiative and leadership...',
                formData.initiative_justification,
                4,
                'initiative'
              )}
            </div>
          </div>
        );

      case 'development':
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900">Development Planning</h3>
              <p className="text-gray-600 mt-1">Create development plans and define support</p>
            </div>
            
            {renderTextArea(
              'Development Plan',
              'development_plan',
              'Outline specific development goals, learning opportunities, and growth areas for the employee...',
              formData.development_plan,
              6
            )}
            
            {renderTextArea(
              'Manager Support',
              'manager_support',
              'Describe how you will support the employee\'s development and what resources you will provide...',
              formData.manager_support,
              4
            )}
            
            {renderTextArea(
              'Business Impact',
              'business_impact',
              'Assess the employee\'s impact on business objectives and team goals...',
              formData.business_impact,
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
      const value = formData[field as keyof CreateManagerReviewData];
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
    <div className={className}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manager Review</h2>
            <p className="text-gray-600 mt-1">
              {cycle?.name} - Review for Employee {employeeId}
            </p>
          </div>
          {review?.status === 'submitted' && (
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

      {/* Employee Context */}
      {renderContextSection()}

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
                disabled={!canSubmit() || submitting || review?.status === 'submitted'}
                className="flex items-center"
              >
                {submitting ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                )}
                {review?.status === 'submitted' ? 'Already Submitted' : 'Submit Review'}
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
                Please complete all sections before submitting your review.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerReviewForm;
