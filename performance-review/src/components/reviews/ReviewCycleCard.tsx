import React, { useState } from 'react';
import {
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  CheckCircleIcon,
  PauseIcon,
  PlayIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import Button from '../common/Button';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import { reviewsService } from '../../services/reviewsService';
import { ReviewCycle, ReviewCycleProgress } from '../../types/reviews';

interface ReviewCycleCardProps {
  cycle: ReviewCycle;
  progress?: ReviewCycleProgress;
  onUpdate?: () => void;
  showManagementActions?: boolean;
  className?: string;
}

interface CycleAction {
  type: 'view' | 'edit' | 'end' | 'delete' | 'extend' | 'send_reminders';
  label: string;
  icon: any;
  variant: 'primary' | 'outline' | 'danger';
  action: () => void;
}

export const ReviewCycleCard: React.FC<ReviewCycleCardProps> = ({
  cycle,
  progress,
  onUpdate,
  showManagementActions = false,
  className = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEndCycleModal, setShowEndCycleModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <PlayIcon className="h-4 w-4" />;
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'draft':
        return <PencilIcon className="h-4 w-4" />;
      case 'cancelled':
        return <PauseIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      case 'draft':
        return 'text-purple-600 bg-purple-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getCurrentPhaseInfo = () => {
    const today = new Date();
    const selfAssessmentStart = new Date(cycle.self_assessment_start);
    const selfAssessmentEnd = new Date(cycle.self_assessment_end);
    const peerReviewStart = new Date(cycle.peer_review_start);
    const peerReviewEnd = new Date(cycle.peer_review_end);
    const managerReviewStart = new Date(cycle.manager_review_start);
    const managerReviewEnd = new Date(cycle.manager_review_end);

    if (today < selfAssessmentStart) {
      return { phase: 'Not Started', daysRemaining: Math.ceil((selfAssessmentStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) };
    } else if (today >= selfAssessmentStart && today <= selfAssessmentEnd) {
      return { phase: 'Self Assessment', daysRemaining: Math.ceil((selfAssessmentEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) };
    } else if (today >= peerReviewStart && today <= peerReviewEnd) {
      return { phase: 'Peer Review', daysRemaining: Math.ceil((peerReviewEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) };
    } else if (today >= managerReviewStart && today <= managerReviewEnd) {
      return { phase: 'Manager Review', daysRemaining: Math.ceil((managerReviewEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) };
    } else {
      return { phase: 'Completed', daysRemaining: 0 };
    }
  };

  const renderProgressBar = (completed: number, total: number, label: string, color: string = 'blue') => {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-600">
          <span>{label}</span>
          <span>{completed}/{total} ({percentage}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`bg-${color}-600 h-2 rounded-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const handleDeleteCycle = async () => {
    try {
      setLoading(true);
      setError(null);
      await reviewsService.deleteReviewCycle(cycle.id);
      setShowDeleteModal(false);
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete cycle');
    } finally {
      setLoading(false);
    }
  };

  const handleEndCycle = async () => {
    try {
      setLoading(true);
      setError(null);
      await reviewsService.updateReviewCycle(cycle.id, { ...cycle, status: 'completed' });
      setShowEndCycleModal(false);
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end cycle');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminders = async () => {
    try {
      setLoading(true);
      setError(null);
      // await reviewsService.sendCycleReminders(cycle.id);
      // For now, just show success
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reminders');
    } finally {
      setLoading(false);
    }
  };

  const getActions = (): CycleAction[] => {
    const actions: CycleAction[] = [
      {
        type: 'view',
        label: 'View Details',
        icon: EyeIcon,
        variant: 'outline',
        action: () => window.location.href = `/reviews?cycle=${cycle.id}`
      }
    ];

    if (showManagementActions) {
      if (cycle.status === 'draft') {
        actions.push({
          type: 'edit',
          label: 'Edit',
          icon: PencilIcon,
          variant: 'outline',
          action: () => window.location.href = `/reviews/cycles/${cycle.id}/edit`
        });
      }

      if (cycle.status === 'active') {
        actions.push(
          {
            type: 'send_reminders',
            label: 'Send Reminders',
            icon: ClockIcon,
            variant: 'outline',
            action: handleSendReminders
          },
          {
            type: 'end',
            label: 'End Cycle',
            icon: CheckCircleIcon,
            variant: 'primary',
            action: () => setShowEndCycleModal(true)
          }
        );
      }

      if (cycle.status !== 'completed') {
        actions.push({
          type: 'delete',
          label: 'Delete',
          icon: TrashIcon,
          variant: 'danger',
          action: () => setShowDeleteModal(true)
        });
      }
    }

    return actions;
  };

  const phaseInfo = getCurrentPhaseInfo();
  const actions = getActions();
  const isOverdue = cycle.status === 'active' && phaseInfo.daysRemaining < 0;

  return (
    <>
      <div className={`border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow ${className}`}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{cycle.name}</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(cycle.status)}`}>
                {getStatusIcon(cycle.status)}
                <span className="ml-1 capitalize">{cycle.status}</span>
              </span>
              <span className="text-sm text-gray-500 capitalize">
                {cycle.review_type.replace('_', ' ')}
              </span>
            </div>

            {/* Current Phase */}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                <span>Phase: {phaseInfo.phase}</span>
              </div>
              {cycle.status === 'active' && (
                <div className={`flex items-center ${isOverdue ? 'text-red-600' : 'text-blue-600'}`}>
                  <ClockIcon className="h-4 w-4 mr-1" />
                  <span>
                    {isOverdue ? `${Math.abs(phaseInfo.daysRemaining)} days overdue` : `${phaseInfo.daysRemaining} days remaining`}
                  </span>
                </div>
              )}
              <div className="flex items-center">
                <UsersIcon className="h-4 w-4 mr-1" />
                <span>{cycle.participant_count} participants</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.type}
                  onClick={action.action}
                  variant={action.variant}
                  size="sm"
                  disabled={loading}
                  className="flex items-center"
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Review Timeline</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Self Assessment</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  phaseInfo.phase === 'Self Assessment' ? 'bg-blue-100 text-blue-800' :
                  new Date() > new Date(cycle.self_assessment_end) ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {phaseInfo.phase === 'Self Assessment' ? 'Active' :
                   new Date() > new Date(cycle.self_assessment_end) ? 'Completed' : 'Upcoming'}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                {reviewsService.formatDate(cycle.self_assessment_start)} - {reviewsService.formatDate(cycle.self_assessment_end)}
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Peer Reviews</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  phaseInfo.phase === 'Peer Review' ? 'bg-blue-100 text-blue-800' :
                  new Date() > new Date(cycle.peer_review_end) ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {phaseInfo.phase === 'Peer Review' ? 'Active' :
                   new Date() > new Date(cycle.peer_review_end) ? 'Completed' : 'Upcoming'}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                {reviewsService.formatDate(cycle.peer_review_start)} - {reviewsService.formatDate(cycle.peer_review_end)}
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Manager Reviews</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  phaseInfo.phase === 'Manager Review' ? 'bg-blue-100 text-blue-800' :
                  new Date() > new Date(cycle.manager_review_end) ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {phaseInfo.phase === 'Manager Review' ? 'Active' :
                   new Date() > new Date(cycle.manager_review_end) ? 'Completed' : 'Upcoming'}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                {reviewsService.formatDate(cycle.manager_review_start)} - {reviewsService.formatDate(cycle.manager_review_end)}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bars for Active Cycles */}
        {cycle.status === 'active' && progress && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Completion Progress
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderProgressBar(
                progress.self_assessment_progress.completed,
                progress.self_assessment_progress.total,
                'Self Assessments',
                'blue'
              )}
              {renderProgressBar(
                progress.peer_review_progress.completed,
                progress.peer_review_progress.total,
                'Peer Reviews',
                'purple'
              )}
              {renderProgressBar(
                progress.manager_review_progress.completed,
                progress.manager_review_progress.total,
                'Manager Reviews',
                'green'
              )}
            </div>

            {/* Overall Progress */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">Overall Progress</span>
                <span className="text-gray-600">
                  {Math.round((
                    (progress.self_assessment_progress.percentage +
                     progress.peer_review_progress.percentage +
                     progress.manager_review_progress.percentage) / 3
                  ))}% Complete
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Cycle Info */}
        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span>Created by {cycle.created_by_name}</span>
            <span>{reviewsService.formatDate(cycle.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <Modal
          isOpen={showEndCycleModal}

          title="Delete Review Cycle"
          onClose={() => setShowDeleteModal(false)}
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-sm text-gray-900">
                  Are you sure you want to delete <strong>"{cycle.name}"</strong>?
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  This action cannot be undone and will permanently delete all associated review data.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteCycle}
                disabled={loading}
                className="flex items-center"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete Cycle'
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* End Cycle Modal */}
      {showEndCycleModal && (
        <Modal
          isOpen={showEndCycleModal}


          title="End Review Cycle"
          onClose={() => setShowEndCycleModal(false)}
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <CheckCircleIcon className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-900">
                  Are you sure you want to end <strong>"{cycle.name}"</strong>?
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  This will mark the cycle as completed and prevent further submissions.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowEndCycleModal(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleEndCycle}
                disabled={loading}
                className="flex items-center"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Ending...
                  </>
                ) : (
                  'End Cycle'
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}; 