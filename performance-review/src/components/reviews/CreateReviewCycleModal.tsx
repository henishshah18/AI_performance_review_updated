import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  DocumentTextIcon
, CheckCircleIcon, ExclamationTriangleIcon} from '@heroicons/react/24/outline';
import Modal from '../common/Modal';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
// Note: Services will be imported when implemented
import { reviewsService } from '../../services/reviewsService';
import { analyticsService } from '../../services/analyticsService';
import { ReviewCycle, CreateReviewCycleData } from '../../types/reviews';

interface CreateReviewCycleModalProps {
  isOpen: boolean;
  cycle?: ReviewCycle;
  onSave: (cycle: ReviewCycle) => void;
  onCancel: () => void;
}

interface Department {
  id: string;
  name: string;
  employee_count: number;
  manager_count: number;
}

interface ParticipantPreview {
  total_participants: number;
  by_department: Array<{
    department: string;
    count: number;
    roles: {
      managers: number;
      individual_contributors: number;
    };
  }>;
  estimated_workload: {
    self_assessments: number;
    peer_reviews: number;
    manager_reviews: number;
  };
}

export const CreateReviewCycleModal: React.FC<CreateReviewCycleModalProps> = ({
  isOpen,
  cycle,
  onSave,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CreateReviewCycleData>({
    name: cycle?.name || '',
    review_type: cycle?.review_type || 'quarterly',
    review_period_start: cycle?.review_period_start || '',
    review_period_end: cycle?.review_period_end || '',
    self_assessment_start: cycle?.self_assessment_start || '',
    self_assessment_end: cycle?.self_assessment_end || '',
    peer_review_start: cycle?.peer_review_start || '',
    peer_review_end: cycle?.peer_review_end || '',
    manager_review_start: cycle?.manager_review_start || '',
    manager_review_end: cycle?.manager_review_end || ''
  });
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [participantPreview, setParticipantPreview] = useState<ParticipantPreview | null>(null);
  const [advancedSettings, setAdvancedSettings] = useState({
    review_visibility: 'manager_hr' as 'manager_only' | 'manager_hr' | 'all_participants',
    peer_review_anonymous: true,
    exclude_probationary: true,
    exclude_contractors: false,
    calibration_required: true,
    auto_reminders: true,
    reminder_schedule: ['3_days', '1_day'] as string[]
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const steps = [
    {
      title: 'Basic Information',
      description: 'Set up cycle name, type, and description',
      icon: DocumentTextIcon
    },
    {
      title: 'Timeline Configuration',
      description: 'Configure review phases and deadlines',
      icon: CalendarIcon
    },
    {
      title: 'Participant Selection',
      description: 'Choose departments and participants',
      icon: UserGroupIcon
    },
    {
      title: 'Advanced Settings',
      description: 'Configure visibility and notification settings',
      icon: CheckCircleIcon
    }
  ];

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartments.length > 0) {
      generateParticipantPreview();
    }
  }, [selectedDepartments, advancedSettings]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getDepartments();
      setDepartments(data);
      
      // Select all departments by default
      setSelectedDepartments(data.map(d => d.id));
    } catch (err) {
      setError('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const generateParticipantPreview = async () => {
    try {
      const preview = await analyticsService.getParticipantPreview({
        departments: selectedDepartments,
        exclude_probationary: advancedSettings.exclude_probationary,
        exclude_contractors: advancedSettings.exclude_contractors
      });
      setParticipantPreview(preview);
    } catch (err) {
      console.error('Failed to generate participant preview:', err);
    }
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 0: // Basic Information
        if (!formData.name.trim()) {
          errors.name = 'Cycle name is required';
        }
        if (!formData.review_type) {
          errors.review_type = 'Review type is required';
        }
        break;

      case 1: // Timeline Configuration
        if (!formData.review_period_start) {
          errors.review_period_start = 'Review period start is required';
        }
        if (!formData.review_period_end) {
          errors.review_period_end = 'Review period end is required';
        }
        if (formData.review_period_start && formData.review_period_end) {
          if (new Date(formData.review_period_start) >= new Date(formData.review_period_end)) {
            errors.review_period_end = 'End date must be after start date';
          }
        }
        
        // Validate phase dates
        const phases = [
          { start: 'self_assessment_start', end: 'self_assessment_end', name: 'Self Assessment' },
          { start: 'peer_review_start', end: 'peer_review_end', name: 'Peer Review' },
          { start: 'manager_review_start', end: 'manager_review_end', name: 'Manager Review' }
        ];
        
        phases.forEach(phase => {
          const startDate = formData[phase.start as keyof CreateReviewCycleData] as string;
          const endDate = formData[phase.end as keyof CreateReviewCycleData] as string;
          
          if (!startDate) {
            errors[phase.start] = `${phase.name} start date is required`;
          }
          if (!endDate) {
            errors[phase.end] = `${phase.name} end date is required`;
          }
          if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
            errors[phase.end] = `${phase.name} end date must be after start date`;
          }
        });
        
        // Check chronological order
        if (formData.self_assessment_end && formData.peer_review_start &&
            new Date(formData.self_assessment_end) > new Date(formData.peer_review_start)) {
          errors.peer_review_start = 'Peer review should start after self-assessment ends';
        }
        break;

      case 2: // Participant Selection
        if (selectedDepartments.length === 0) {
          errors.departments = 'At least one department must be selected';
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const cycleData = {
        ...formData,
        departments: selectedDepartments,
        settings: advancedSettings
      };

      let savedCycle: ReviewCycle;
      if (cycle) {
        savedCycle = await reviewsService.updateReviewCycle(cycle.id, cycleData);
      } else {
        savedCycle = await reviewsService.createReviewCycle(cycleData);
      }

      onSave(savedCycle);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save cycle');
    } finally {
      setSaving(false);
    }
  };

  const renderBasicInformation = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cycle Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Q4 2024 Performance Review"
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            validationErrors.name ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {validationErrors.name && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Review Type *
        </label>
        <select
          value={formData.review_type}
          onChange={(e) => setFormData(prev => ({ ...prev, review_type: e.target.value as any }))}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            validationErrors.review_type ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <option value="quarterly">Quarterly Review</option>
          <option value="half_yearly">Half-Yearly Review</option>
          <option value="annual">Annual Review</option>
        </select>
        {validationErrors.review_type && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.review_type}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description (Optional)
        </label>
        <textarea
          rows={3}
          placeholder="Describe the goals and context for this review cycle..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );

  const renderTimelineConfiguration = () => (
    <div className="space-y-6">
      {/* Review Period */}
      <div>
        <h3 className="text-md font-medium text-gray-900 mb-4">Review Period</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period Start Date *
            </label>
            <input
              type="date"
              value={formData.review_period_start}
              onChange={(e) => setFormData(prev => ({ ...prev, review_period_start: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.review_period_start ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {validationErrors.review_period_start && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.review_period_start}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period End Date *
            </label>
            <input
              type="date"
              value={formData.review_period_end}
              onChange={(e) => setFormData(prev => ({ ...prev, review_period_end: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.review_period_end ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {validationErrors.review_period_end && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.review_period_end}</p>
            )}
          </div>
        </div>
      </div>

      {/* Phase Timeline */}
      <div>
        <h3 className="text-md font-medium text-gray-900 mb-4">Phase Timeline</h3>
        <div className="space-y-4">
          {/* Self Assessment Phase */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Self-Assessment Phase</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.self_assessment_start}
                  onChange={(e) => setFormData(prev => ({ ...prev, self_assessment_start: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.self_assessment_start ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.self_assessment_start && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.self_assessment_start}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.self_assessment_end}
                  onChange={(e) => setFormData(prev => ({ ...prev, self_assessment_end: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.self_assessment_end ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.self_assessment_end && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.self_assessment_end}</p>
                )}
              </div>
            </div>
          </div>

          {/* Peer Review Phase */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Peer Review Phase</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.peer_review_start}
                  onChange={(e) => setFormData(prev => ({ ...prev, peer_review_start: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.peer_review_start ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.peer_review_start && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.peer_review_start}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.peer_review_end}
                  onChange={(e) => setFormData(prev => ({ ...prev, peer_review_end: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.peer_review_end ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.peer_review_end && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.peer_review_end}</p>
                )}
              </div>
            </div>
          </div>

          {/* Manager Review Phase */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Manager Review Phase</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.manager_review_start}
                  onChange={(e) => setFormData(prev => ({ ...prev, manager_review_start: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.manager_review_start ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.manager_review_start && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.manager_review_start}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.manager_review_end}
                  onChange={(e) => setFormData(prev => ({ ...prev, manager_review_end: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.manager_review_end ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.manager_review_end && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.manager_review_end}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderParticipantSelection = () => (
    <div className="space-y-6">
      {/* Department Selection */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-medium text-gray-900">Department Inclusion</h3>
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedDepartments(departments.map(d => d.id))}
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedDepartments([])}
            >
              Deselect All
            </Button>
          </div>
        </div>
        
        {departments.length === 0 ? (
          <div className="text-center py-4">
            <LoadingSpinner size="sm" />
            <p className="text-sm text-gray-600 mt-2">Loading departments...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map((dept) => (
              <label key={dept.id} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedDepartments.includes(dept.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDepartments(prev => [...prev, dept.id]);
                    } else {
                      setSelectedDepartments(prev => prev.filter(id => id !== dept.id));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <p className="font-medium text-gray-900">{dept.name}</p>
                  <p className="text-sm text-gray-600">
                    {dept.employee_count} employees, {dept.manager_count} managers
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
        {validationErrors.departments && (
          <p className="mt-2 text-sm text-red-600">{validationErrors.departments}</p>
        )}
      </div>

      {/* Role-Based Exclusions */}
      <div>
        <h3 className="text-md font-medium text-gray-900 mb-4">Exclusion Rules</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={advancedSettings.exclude_probationary}
              onChange={(e) => setAdvancedSettings(prev => ({ ...prev, exclude_probationary: e.target.checked }))}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">
              Exclude probationary employees (less than 90 days)
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={advancedSettings.exclude_contractors}
              onChange={(e) => setAdvancedSettings(prev => ({ ...prev, exclude_contractors: e.target.checked }))}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">
              Exclude contractors and temporary employees
            </span>
          </label>
        </div>
      </div>

      {/* Participant Preview */}
      {participantPreview && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-md font-medium text-blue-900 mb-3">Participant Preview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">{participantPreview.total_participants}</p>
              <p className="text-sm text-blue-700">Total Participants</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">{participantPreview.estimated_workload.self_assessments}</p>
              <p className="text-sm text-blue-700">Self Assessments</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">{participantPreview.estimated_workload.peer_reviews}</p>
              <p className="text-sm text-blue-700">Peer Reviews</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-blue-900">Breakdown by Department:</h4>
            {participantPreview.by_department.map((dept, index) => (
              <div key={index} className="flex justify-between text-sm text-blue-800">
                <span>{dept.department}</span>
                <span>{dept.count} participants ({dept.roles.managers}M, {dept.roles.individual_contributors}IC)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAdvancedSettings = () => (
    <div className="space-y-6">
      {/* Review Visibility */}
      <div>
        <h3 className="text-md font-medium text-gray-900 mb-4">Review Visibility</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="radio"
              name="visibility"
              value="manager_only"
              checked={advancedSettings.review_visibility === 'manager_only'}
              onChange={(e) => setAdvancedSettings(prev => ({ ...prev, review_visibility: e.target.value as any }))}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">Manager Only</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="visibility"
              value="manager_hr"
              checked={advancedSettings.review_visibility === 'manager_hr'}
              onChange={(e) => setAdvancedSettings(prev => ({ ...prev, review_visibility: e.target.value as any }))}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">Manager + HR Admin (Recommended)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="visibility"
              value="all_participants"
              checked={advancedSettings.review_visibility === 'all_participants'}
              onChange={(e) => setAdvancedSettings(prev => ({ ...prev, review_visibility: e.target.value as any }))}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">All Participants</span>
          </label>
        </div>
      </div>

      {/* Anonymity Rules */}
      <div>
        <h3 className="text-md font-medium text-gray-900 mb-4">Anonymity Settings</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={advancedSettings.peer_review_anonymous}
              onChange={(e) => setAdvancedSettings(prev => ({ ...prev, peer_review_anonymous: e.target.checked }))}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">
              Peer reviews are anonymous by default
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={advancedSettings.calibration_required}
              onChange={(e) => setAdvancedSettings(prev => ({ ...prev, calibration_required: e.target.checked }))}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">
              Require manager calibration sessions
            </span>
          </label>
        </div>
      </div>

      {/* Auto-Reminders */}
      <div>
        <h3 className="text-md font-medium text-gray-900 mb-4">Notification Settings</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={advancedSettings.auto_reminders}
              onChange={(e) => setAdvancedSettings(prev => ({ ...prev, auto_reminders: e.target.checked }))}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">
              Enable automatic email reminders
            </span>
          </label>
          
          {advancedSettings.auto_reminders && (
            <div className="ml-7 space-y-2">
              <p className="text-sm text-gray-600">Send reminders:</p>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={advancedSettings.reminder_schedule.includes('3_days')}
                    onChange={(e) => {
                      const schedule = e.target.checked
                        ? [...advancedSettings.reminder_schedule, '3_days']
                        : advancedSettings.reminder_schedule.filter(s => s !== '3_days');
                      setAdvancedSettings(prev => ({ ...prev, reminder_schedule: schedule }));
                    }}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">3 days before deadline</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={advancedSettings.reminder_schedule.includes('1_day')}
                    onChange={(e) => {
                      const schedule = e.target.checked
                        ? [...advancedSettings.reminder_schedule, '1_day']
                        : advancedSettings.reminder_schedule.filter(s => s !== '1_day');
                      setAdvancedSettings(prev => ({ ...prev, reminder_schedule: schedule }));
                    }}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">1 day before deadline</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInformation();
      case 1:
        return renderTimelineConfiguration();
      case 2:
        return renderParticipantSelection();
      case 3:
        return renderAdvancedSettings();
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title={cycle ? 'Edit Review Cycle' : 'Create Review Cycle'}
      onClose={onCancel}
      size="xl"
    >
      <div className="flex flex-col h-full">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div key={index} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted ? 'bg-green-100 border-green-500' :
                    isActive ? 'bg-blue-100 border-blue-500' :
                    'bg-gray-100 border-gray-300'
                  }`}>
                    {isCompleted ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    ) : (
                      <StepIcon className={`h-5 w-5 ${
                        isActive ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-24 h-1 mx-4 ${
                      isCompleted ? 'bg-green-200' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-900">{steps[currentStep].title}</h3>
            <p className="text-sm text-gray-600">{steps[currentStep].description}</p>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
          <div>
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={handlePrev}>
                Previous
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={saving}>
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {cycle ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  cycle ? 'Update Cycle' : 'Create Cycle'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}; 