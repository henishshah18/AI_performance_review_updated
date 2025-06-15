// Status Types
export type StatusType = 
  | 'not_started'
  | 'draft'
  | 'in_progress'
  | 'active'
  | 'completed'
  | 'blocked'
  | 'overdue'
  | 'cancelled';

// Status Configuration
export const STATUS_CONFIG: Record<StatusType, {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  description: string;
}> = {
  not_started: {
    label: 'Not Started',
    color: '#6B7280',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    description: 'Task has not been started yet'
  },
  draft: {
    label: 'Draft',
    color: '#9CA3AF',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    description: 'Task is in draft mode'
  },
  in_progress: {
    label: 'In Progress',
    color: '#3B82F6',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    description: 'Task is currently being worked on'
  },
  active: {
    label: 'Active',
    color: '#2563EB',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-900',
    description: 'Task is active and ongoing'
  },
  completed: {
    label: 'Completed',
    color: '#10B981',
    bgColor: 'bg-success-100',
    textColor: 'text-success-800',
    description: 'Task has been completed successfully'
  },
  blocked: {
    label: 'Blocked',
    color: '#EF4444',
    bgColor: 'bg-error-100',
    textColor: 'text-error-800',
    description: 'Task is blocked and cannot proceed'
  },
  overdue: {
    label: 'Overdue',
    color: '#DC2626',
    bgColor: 'bg-error-100',
    textColor: 'text-error-900',
    description: 'Task is past its due date'
  },
  cancelled: {
    label: 'Cancelled',
    color: '#6B7280',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    description: 'Task has been cancelled'
  }
};

// Status Transition Matrix - defines which status can transition to which other status
export const STATUS_TRANSITIONS: Record<StatusType, StatusType[]> = {
  not_started: ['draft', 'in_progress', 'active', 'cancelled'],
  draft: ['not_started', 'in_progress', 'active', 'cancelled'],
  in_progress: ['active', 'completed', 'blocked', 'cancelled'],
  active: ['in_progress', 'completed', 'blocked', 'overdue', 'cancelled'],
  completed: [], // Completed tasks cannot transition to other states
  blocked: ['in_progress', 'active', 'cancelled'],
  overdue: ['in_progress', 'active', 'completed', 'blocked', 'cancelled'],
  cancelled: ['not_started', 'draft'] // Cancelled tasks can be restarted
};

// Validation Functions
export function canTransitionTo(from: StatusType, to: StatusType): boolean {
  if (from === to) return false; // Cannot transition to the same status
  return STATUS_TRANSITIONS[from].includes(to);
}

export function getValidTransitions(currentStatus: StatusType): StatusType[] {
  return STATUS_TRANSITIONS[currentStatus] || [];
}

export function getStatusConfig(status: StatusType) {
  return STATUS_CONFIG[status];
}

export function getStatusLabel(status: StatusType): string {
  return STATUS_CONFIG[status]?.label || status;
}

export function getStatusColor(status: StatusType): string {
  return STATUS_CONFIG[status]?.color || '#6B7280';
}

export function getStatusDescription(status: StatusType): string {
  return STATUS_CONFIG[status]?.description || '';
}

// Validation Error Messages
export const TRANSITION_ERROR_MESSAGES: Record<string, string> = {
  invalid_transition: 'This status transition is not allowed',
  same_status: 'Cannot transition to the same status',
  completed_locked: 'Completed items cannot be changed',
  permission_denied: 'You do not have permission to change this status'
};

export function getTransitionErrorMessage(from: StatusType, to: StatusType): string {
  if (from === to) {
    return TRANSITION_ERROR_MESSAGES.same_status;
  }
  
  if (from === 'completed') {
    return TRANSITION_ERROR_MESSAGES.completed_locked;
  }
  
  if (!canTransitionTo(from, to)) {
    return TRANSITION_ERROR_MESSAGES.invalid_transition;
  }
  
  return '';
}

// Status Priority for sorting (lower number = higher priority)
export const STATUS_PRIORITY: Record<StatusType, number> = {
  overdue: 1,
  blocked: 2,
  in_progress: 3,
  active: 4,
  not_started: 5,
  draft: 6,
  completed: 7,
  cancelled: 8
};

export function sortByStatusPriority<T extends { status: StatusType }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const priorityA = STATUS_PRIORITY[a.status] || 999;
    const priorityB = STATUS_PRIORITY[b.status] || 999;
    return priorityA - priorityB;
  });
}

// Status Filtering
export function filterByStatus<T extends { status: StatusType }>(
  items: T[], 
  statuses: StatusType[]
): T[] {
  return items.filter(item => statuses.includes(item.status));
}

export function getActiveStatuses(): StatusType[] {
  return ['in_progress', 'active', 'blocked', 'overdue'];
}

export function getCompletedStatuses(): StatusType[] {
  return ['completed'];
}

export function getInactiveStatuses(): StatusType[] {
  return ['not_started', 'draft', 'cancelled'];
}

// Status Analytics
export function getStatusCounts<T extends { status: StatusType }>(items: T[]): Record<StatusType, number> {
  const counts = {} as Record<StatusType, number>;
  
  // Initialize all statuses with 0
  Object.keys(STATUS_CONFIG).forEach(status => {
    counts[status as StatusType] = 0;
  });
  
  // Count items by status
  items.forEach(item => {
    counts[item.status] = (counts[item.status] || 0) + 1;
  });
  
  return counts;
}

export function getStatusPercentages<T extends { status: StatusType }>(items: T[]): Record<StatusType, number> {
  const counts = getStatusCounts(items);
  const total = items.length;
  const percentages = {} as Record<StatusType, number>;
  
  Object.entries(counts).forEach(([status, count]) => {
    percentages[status as StatusType] = total > 0 ? Math.round((count / total) * 100) : 0;
  });
  
  return percentages;
}

// Auto-status Updates
export function shouldAutoUpdateStatus<T extends { 
  status: StatusType; 
  due_date?: string; 
  start_date?: string; 
}>(item: T): StatusType | null {
  const now = new Date();
  const dueDate = item.due_date ? new Date(item.due_date) : null;
  const startDate = item.start_date ? new Date(item.start_date) : null;
  
  // Check if item is overdue
  if (dueDate && now > dueDate && item.status !== 'completed' && item.status !== 'cancelled') {
    if (item.status !== 'overdue') {
      return 'overdue';
    }
  }
  
  // Check if item should be active (past start date)
  if (startDate && now >= startDate && item.status === 'not_started') {
    return 'active';
  }
  
  return null;
}

export function validateStatusTransition(
  from: StatusType, 
  to: StatusType, 
  userRole?: string
): { isValid: boolean; error?: string } {
  // Check basic transition rules
  if (!canTransitionTo(from, to)) {
    return {
      isValid: false,
      error: getTransitionErrorMessage(from, to)
    };
  }
  
  // Role-based validation (if needed)
  if (userRole) {
    // Add role-specific validation logic here
    // For example, only managers can mark items as completed
    if (to === 'completed' && userRole === 'individual_contributor') {
      // This is just an example - adjust based on business rules
      // return {
      //   isValid: false,
      //   error: 'Only managers can mark items as completed'
      // };
    }
  }
  
  return { isValid: true };
} 