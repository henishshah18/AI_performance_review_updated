import React from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<any>;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'search' | 'error';
  className?: string;
}

// Default icons for different scenarios
const DefaultIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const ErrorIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
    />
  </svg>
);

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: CustomIcon,
  action,
  variant = 'default',
  className = '',
}) => {
  const getDefaultIcon = () => {
    switch (variant) {
      case 'search':
        return SearchIcon;
      case 'error':
        return ErrorIcon;
      default:
        return DefaultIcon;
    }
  };

  const IconComponent = CustomIcon || getDefaultIcon();

  const getVariantClasses = () => {
    switch (variant) {
      case 'search':
        return 'text-blue-400';
      case 'error':
        return 'text-error-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className={`mx-auto ${getVariantClasses()}`}>
        <IconComponent />
      </div>
      
      <h3 className="mt-4 text-lg font-medium text-gray-900">
        {title}
      </h3>
      
      {description && (
        <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
          {description}
        </p>
      )}
      
      {action && (
        <div className="mt-6">
          <button
            type="button"
            className="btn-primary"
            onClick={action.onClick}
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
};

// Predefined empty state components for common scenarios
export const NoObjectives: React.FC<{ onCreateObjective?: () => void }> = ({ onCreateObjective }) => (
  <EmptyState
    title="No objectives assigned"
    description="You don't have any objectives assigned yet. Contact your manager or HR to get started."
    action={onCreateObjective ? { label: 'Create Objective', onClick: onCreateObjective } : undefined}
  />
);

export const NoTeamMembers: React.FC<{ onInviteMembers?: () => void }> = ({ onInviteMembers }) => (
  <EmptyState
    title="No team members"
    description="Your team is empty. Start by inviting team members to collaborate on objectives and goals."
    action={onInviteMembers ? { label: 'Invite Members', onClick: onInviteMembers } : undefined}
  />
);

export const NoGoals: React.FC<{ onCreateGoal?: () => void }> = ({ onCreateGoal }) => (
  <EmptyState
    title="No goals created"
    description="You haven't created any goals yet. Goals help break down objectives into manageable tasks."
    action={onCreateGoal ? { label: 'Create Goal', onClick: onCreateGoal } : undefined}
  />
);

export const NoTasks: React.FC<{ onCreateTask?: () => void }> = ({ onCreateTask }) => (
  <EmptyState
    title="No tasks assigned"
    description="You don't have any tasks assigned. Tasks are the building blocks of your goals."
    action={onCreateTask ? { label: 'Create Task', onClick: onCreateTask } : undefined}
  />
);

export const NoFeedback: React.FC<{ onGiveFeedback?: () => void }> = ({ onGiveFeedback }) => (
  <EmptyState
    title="No feedback received"
    description="You haven't received any feedback yet. Feedback helps you grow and improve your performance."
    action={onGiveFeedback ? { label: 'Request Feedback', onClick: onGiveFeedback } : undefined}
  />
);

export const NoReviews: React.FC<{ onStartReview?: () => void }> = ({ onStartReview }) => (
  <EmptyState
    title="No reviews pending"
    description="You don't have any pending reviews. Reviews help track your progress and development."
    action={onStartReview ? { label: 'Start Review', onClick: onStartReview } : undefined}
  />
);

export const SearchNoResults: React.FC<{ query?: string; onClearSearch?: () => void }> = ({ 
  query, 
  onClearSearch 
}) => (
  <EmptyState
    variant="search"
    title="No results found"
    description={query ? `No results found for "${query}". Try adjusting your search terms.` : 'No results found. Try different search terms.'}
    action={onClearSearch ? { label: 'Clear Search', onClick: onClearSearch } : undefined}
  />
);

export default EmptyState; 