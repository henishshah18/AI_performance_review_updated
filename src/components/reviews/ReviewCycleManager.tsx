import React, { useState, useEffect } from 'react';
import { 
  PlusIcon,
  CalendarIcon,
  UsersIcon,
  ChartBarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { reviewsService } from '../../services/reviewsService';
import { 
  ReviewCycle, 
  CreateReviewCycleData, 
  ReviewCycleProgress,
  PaginatedResponse 
} from '../../types/reviews';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface ReviewCycleManagerProps {
  className?: string;
}

export const ReviewCycleManager: React.FC<ReviewCycleManagerProps> = ({ className = '' }) => {
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [cycleProgress, setCycleProgress] = useState<Record<string, ReviewCycleProgress>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCycle, setEditingCycle] = useState<ReviewCycle | null>(null);
  const [deletingCycle, setDeletingCycle] = useState<ReviewCycle | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    review_type: '',
    search: ''
  });

  useEffect(() => {
    loadCycles();
  }, [filters]);

  const loadCycles = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await reviewsService.getReviewCycles({
        status: filters.status || undefined,
        review_type: filters.review_type || undefined,
        search: filters.search || undefined,
        page_size: 50
      });

      setCycles(response.results);

      // Load progress for active cycles
      const activeCycles = response.results.filter(cycle => cycle.status === 'active');
      const progressPromises = activeCycles.map(cycle => 
        reviewsService.getCycleProgress(cycle.id).catch(() => null)
      );
      
      const progressResults = await Promise.all(progressPromises);
      const progressMap: Record<string, ReviewCycleProgress> = {};
      
      progressResults.forEach((progress, index) => {
        if (progress) {
          progressMap[activeCycles[index].id] = progress;
        }
      });
      
      setCycleProgress(progressMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load review cycles');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCycle = async (cycle: ReviewCycle) => {
    try {
      await reviewsService.deleteReviewCycle(cycle.id);
      setCycles(prev => prev.filter(c => c.id !== cycle.id));
      setDeletingCycle(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete cycle');
    }
  };

  const getStatusColor = (status: string) => {
    return reviewsService.getStatusColor(status);
  };

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

  const renderProgressBar = (completed: number, total: number, label: string) => {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-600">
          <span>{label}</span>
          <span>{completed}/{total} ({percentage}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
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
        <ErrorMessage message={error} onRetry={loadCycles} />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Review Cycle Management</h2>
            <p className="text-gray-600 mt-1">
              Create and manage performance review cycles
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Cycle
          </Button>
        </div>

        {/* Filters */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Review Type
            </label>
            <select
              value={filters.review_type}
              onChange={(e) => setFilters(prev => ({ ...prev, review_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="quarterly">Quarterly</option>
              <option value="half_yearly">Half Yearly</option>
              <option value="annual">Annual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search cycles..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Cycles List */}
      <div className="space-y-4">
        {cycles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Review Cycles</h3>
            <p className="text-gray-600 mb-4">
              Get started by creating your first performance review cycle.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create First Cycle
            </Button>
          </div>
        ) : (
          cycles.map((cycle) => {
            const progress = cycleProgress[cycle.id];
            
            return (
              <div key={cycle.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{cycle.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(cycle.status)}`}>
                        {getStatusIcon(cycle.status)}
                        <span className="ml-1 capitalize">{cycle.status}</span>
                      </span>
                      <span className="text-sm text-gray-500">
                        {reviewsService.formatReviewType(cycle.review_type)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Review Period</p>
                        <p className="font-medium text-gray-900">
                          {reviewsService.formatDate(cycle.review_period_start)} - {reviewsService.formatDate(cycle.review_period_end)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Current Phase</p>
                        <p className="font-medium text-gray-900 capitalize">
                          {cycle.current_phase.replace('_', ' ')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Participants</p>
                        <p className="font-medium text-gray-900 flex items-center">
                          <UsersIcon className="h-4 w-4 mr-1" />
                          {cycle.participant_count}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Created By</p>
                        <p className="font-medium text-gray-900">{cycle.created_by_name}</p>
                      </div>
                    </div>

                    {/* Progress Bars for Active Cycles */}
                    {cycle.status === 'active' && progress && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {renderProgressBar(
                          progress.self_assessment_progress.completed,
                          progress.self_assessment_progress.total,
                          'Self Assessments'
                        )}
                        {renderProgressBar(
                          progress.peer_review_progress.completed,
                          progress.peer_review_progress.total,
                          'Peer Reviews'
                        )}
                        {renderProgressBar(
                          progress.manager_review_progress.completed,
                          progress.manager_review_progress.total,
                          'Manager Reviews'
                        )}
                      </div>
                    )}

                    {/* Timeline for Active Cycles */}
                    {cycle.status === 'active' && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Review Timeline</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Self Assessment</span>
                            <span className="text-gray-900">
                              {reviewsService.formatDate(cycle.self_assessment_start)} - {reviewsService.formatDate(cycle.self_assessment_end)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Peer Reviews</span>
                            <span className="text-gray-900">
                              {reviewsService.formatDate(cycle.peer_review_start)} - {reviewsService.formatDate(cycle.peer_review_end)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Manager Reviews</span>
                            <span className="text-gray-900">
                              {reviewsService.formatDate(cycle.manager_review_start)} - {reviewsService.formatDate(cycle.manager_review_end)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* Navigate to cycle details */}}
                      className="flex items-center"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    
                    {cycle.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCycle(cycle)}
                        className="flex items-center"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}

                    {cycle.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {/* Navigate to progress view */}}
                        className="flex items-center"
                      >
                        <ChartBarIcon className="h-4 w-4 mr-1" />
                        Progress
                      </Button>
                    )}

                    {(cycle.status === 'draft' || cycle.status === 'cancelled') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingCycle(cycle)}
                        className="flex items-center text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>

                {/* Overdue Warning */}
                {cycle.status === 'active' && reviewsService.isReviewOverdue(cycle.review_period_end) && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                      <p className="text-sm text-red-800">
                        This review cycle is overdue. Review period ended on {reviewsService.formatDate(cycle.review_period_end)}.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingCycle) && (
        <ReviewCycleForm
          cycle={editingCycle}
          onSave={(cycle) => {
            if (editingCycle) {
              setCycles(prev => prev.map(c => c.id === cycle.id ? cycle : c));
            } else {
              setCycles(prev => [cycle, ...prev]);
            }
            setShowCreateModal(false);
            setEditingCycle(null);
          }}
          onCancel={() => {
            setShowCreateModal(false);
            setEditingCycle(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deletingCycle && (
        <ConfirmDialog
          title="Delete Review Cycle"
          message={`Are you sure you want to delete "${deletingCycle.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          confirmVariant="danger"
          onConfirm={() => handleDeleteCycle(deletingCycle)}
          onCancel={() => setDeletingCycle(null)}
        />
      )}
    </div>
  );
};

// Review Cycle Form Component
interface ReviewCycleFormProps {
  cycle?: ReviewCycle | null;
  onSave: (cycle: ReviewCycle) => void;
  onCancel: () => void;
}

const ReviewCycleForm: React.FC<ReviewCycleFormProps> = ({ cycle, onSave, onCancel }) => {
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);

      let savedCycle: ReviewCycle;
      if (cycle) {
        savedCycle = await reviewsService.updateReviewCycle(cycle.id, formData);
      } else {
        savedCycle = await reviewsService.createReviewCycle(formData);
      }

      onSave(savedCycle);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save cycle');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof CreateReviewCycleData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      title={cycle ? 'Edit Review Cycle' : 'Create Review Cycle'}
      onClose={onCancel}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cycle Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Q1 2024 Performance Review"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Review Type
            </label>
            <select
              value={formData.review_type}
              onChange={(e) => handleInputChange('review_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="quarterly">Quarterly</option>
              <option value="half_yearly">Half Yearly</option>
              <option value="annual">Annual</option>
            </select>
          </div>

          <div></div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Review Period Start
            </label>
            <input
              type="date"
              value={formData.review_period_start}
              onChange={(e) => handleInputChange('review_period_start', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Review Period End
            </label>
            <input
              type="date"
              value={formData.review_period_end}
              onChange={(e) => handleInputChange('review_period_end', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Self Assessment Start
            </label>
            <input
              type="date"
              value={formData.self_assessment_start}
              onChange={(e) => handleInputChange('self_assessment_start', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Self Assessment End
            </label>
            <input
              type="date"
              value={formData.self_assessment_end}
              onChange={(e) => handleInputChange('self_assessment_end', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Peer Review Start
            </label>
            <input
              type="date"
              value={formData.peer_review_start}
              onChange={(e) => handleInputChange('peer_review_start', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Peer Review End
            </label>
            <input
              type="date"
              value={formData.peer_review_end}
              onChange={(e) => handleInputChange('peer_review_end', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manager Review Start
            </label>
            <input
              type="date"
              value={formData.manager_review_start}
              onChange={(e) => handleInputChange('manager_review_start', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manager Review End
            </label>
            <input
              type="date"
              value={formData.manager_review_end}
              onChange={(e) => handleInputChange('manager_review_end', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              cycle ? 'Update Cycle' : 'Create Cycle'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}; 