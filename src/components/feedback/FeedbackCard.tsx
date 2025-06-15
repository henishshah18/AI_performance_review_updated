import React, { useState } from 'react';
import { Feedback } from '../../types/feedback';
import { feedbackService } from '../../services/feedbackService';
import { useAuth } from '../../contexts/AuthContext';

interface FeedbackCardProps {
  feedback: Feedback;
  showActions?: boolean;
  compact?: boolean;
  onUpdate?: () => void;
}

const FeedbackCard: React.FC<FeedbackCardProps> = ({
  feedback,
  showActions = true,
  compact = false,
  onUpdate,
}) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = user?.id === feedback.from_user.id;
  const canDelete = user?.id === feedback.from_user.id || user?.role === 'hr_admin';

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    try {
      setIsDeleting(true);
      await feedbackService.deleteFeedback(feedback.id);
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert('Failed to delete feedback. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getFeedbackTypeColor = (type: string) => {
    switch (type) {
      case 'commendation':
        return 'bg-green-100 text-green-800';
      case 'guidance':
        return 'bg-blue-100 text-blue-800';
      case 'constructive':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFeedbackTypeIcon = (type: string) => {
    switch (type) {
      case 'commendation':
        return '👏';
      case 'guidance':
        return '💡';
      case 'constructive':
        return '🔧';
      default:
        return '💬';
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    return visibility === 'public' ? '🌐' : '🔒';
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${compact ? 'p-4' : 'p-6'} hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {feedback.from_user.avatar_url ? (
              <img
                src={feedback.from_user.avatar_url}
                alt={`${feedback.from_user.first_name} ${feedback.from_user.last_name}`}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {feedback.from_user.first_name[0]}{feedback.from_user.last_name[0]}
                </span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-900">
                {feedback.is_anonymous ? 'Anonymous' : `${feedback.from_user.first_name} ${feedback.from_user.last_name}`}
              </p>
              <span className="text-gray-400">→</span>
              <p className="text-sm text-gray-600">
                {feedback.to_user.first_name} {feedback.to_user.last_name}
              </p>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getFeedbackTypeColor(feedback.feedback_type)}`}>
                <span className="mr-1">{getFeedbackTypeIcon(feedback.feedback_type)}</span>
                {feedbackService.formatFeedbackType(feedback.feedback_type)}
              </span>
              <span className="text-xs text-gray-500 flex items-center">
                <span className="mr-1">{getVisibilityIcon(feedback.visibility)}</span>
                {feedbackService.formatVisibility(feedback.visibility)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {feedbackService.getTimeAgo(feedback.created_at)}
          </span>
          {showActions && (canEdit || canDelete) && (
            <div className="flex items-center space-x-1">
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-600 hover:text-red-700 p-1 rounded"
                  title="Delete feedback"
                >
                  {isDeleting ? '⏳' : '🗑️'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className={`text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
          {feedback.content}
        </p>
      </div>

      {/* Tags */}
      {feedback.tags && feedback.tags.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {feedback.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
              >
                #{tag.tag_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Related Items */}
      {(feedback.related_objective || feedback.related_goal || feedback.related_task) && (
        <div className="mb-3">
          <div className="flex items-center text-xs text-gray-500">
            <span className="mr-1">🔗</span>
            <span>
              Related to: {feedback.related_objective && 'Objective'} 
              {feedback.related_goal && 'Goal'} 
              {feedback.related_task && 'Task'}
            </span>
          </div>
        </div>
      )}

      {/* Comments Section */}
      {!compact && feedback.comments && feedback.comments.length > 0 && (
        <div className="border-t border-gray-200 pt-3">
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showComments ? 'Hide' : 'Show'} Comments ({feedback.comments.length})
          </button>
          {showComments && (
            <div className="mt-3 space-y-2">
              {feedback.comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {comment.comment_by.first_name} {comment.comment_by.last_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {feedbackService.getTimeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedbackCard; 