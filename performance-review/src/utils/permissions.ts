import { StatusType } from './statusValidation';

// User Role Types
export type UserRole = 'hr_admin' | 'manager' | 'individual_contributor';

// Permission Types
export interface PermissionContext {
  userRole: UserRole;
  userId: number;
  departmentId?: number;
  isManager?: boolean;
  isHrAdmin?: boolean;
}

export interface EntityPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canComplete: boolean;
  canAssign: boolean;
  canComment: boolean;
  canGiveFeedback: boolean;
}

// Status-based Permission Functions
export function canEdit(status: StatusType): boolean {
  // Cannot edit completed or cancelled items
  if (status === 'completed' || status === 'cancelled') {
    return false;
  }
  
  return true;
}

export function canDelete(status: StatusType): boolean {
  // Can only delete draft or not_started items
  return status === 'draft' || status === 'not_started';
}

export function canComplete(status: StatusType): boolean {
  // Can only complete items that are in progress or active
  return status === 'in_progress' || status === 'active';
}

export function canReopen(status: StatusType): boolean {
  // Can reopen completed or cancelled items
  return status === 'completed' || status === 'cancelled';
}

export function canBlock(status: StatusType): boolean {
  // Can block active or in-progress items
  return status === 'active' || status === 'in_progress';
}

export function canUnblock(status: StatusType): boolean {
  // Can unblock blocked items
  return status === 'blocked';
}

// Role-based Permission Functions
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    individual_contributor: 1,
    manager: 2,
    hr_admin: 3
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function canManageUsers(userRole: UserRole): boolean {
  return userRole === 'hr_admin' || userRole === 'manager';
}

export function canViewAllDepartments(userRole: UserRole): boolean {
  return userRole === 'hr_admin';
}

export function canCreateObjectives(userRole: UserRole): boolean {
  return userRole === 'hr_admin' || userRole === 'manager';
}

export function canAssignTasks(userRole: UserRole): boolean {
  return userRole === 'manager' || userRole === 'hr_admin';
}

export function canViewReports(userRole: UserRole): boolean {
  return userRole === 'manager' || userRole === 'hr_admin';
}

export function canManageReviewCycles(userRole: UserRole): boolean {
  return userRole === 'hr_admin';
}

export function canGiveFeedbackToAnyone(userRole: UserRole): boolean {
  return userRole === 'manager' || userRole === 'hr_admin';
}

// Entity-specific Permission Functions
export function getGoalPermissions(
  context: PermissionContext,
  goalOwnerId: number,
  goalStatus: StatusType
): EntityPermissions {
  const isOwner = context.userId === goalOwnerId;
  const canEditStatus = canEdit(goalStatus);
  const canDeleteStatus = canDelete(goalStatus);
  const canCompleteStatus = canComplete(goalStatus);
  
  return {
    canView: true, // Everyone can view goals in their department
    canEdit: isOwner && canEditStatus,
    canDelete: (isOwner || (context.isManager ?? false) || (context.isHrAdmin ?? false)) && canDeleteStatus,
    canComplete: (isOwner || (context.isManager ?? false)) && canCompleteStatus,
    canAssign: (context.isManager ?? false) || (context.isHrAdmin ?? false),
    canComment: true,
    canGiveFeedback: true
  };
}

export function getObjectivePermissions(
  context: PermissionContext,
  objectiveOwnerId: number,
  objectiveStatus: StatusType
): EntityPermissions {
  const isOwner = context.userId === objectiveOwnerId;
  const canEditStatus = canEdit(objectiveStatus);
  const canDeleteStatus = canDelete(objectiveStatus);
  const canCompleteStatus = canComplete(objectiveStatus);
  
  return {
    canView: true,
    canEdit: (isOwner || (context.isManager ?? false) || (context.isHrAdmin ?? false)) && canEditStatus,
    canDelete: ((context.isManager ?? false) || (context.isHrAdmin ?? false)) && canDeleteStatus,
    canComplete: (isOwner || (context.isManager ?? false) || (context.isHrAdmin ?? false)) && canCompleteStatus,
    canAssign: (context.isManager ?? false) || (context.isHrAdmin ?? false),
    canComment: true,
    canGiveFeedback: true
  };
}

export function getTaskPermissions(
  context: PermissionContext,
  taskOwnerId: number,
  taskStatus: StatusType
): EntityPermissions {
  const isOwner = context.userId === taskOwnerId;
  const canEditStatus = canEdit(taskStatus);
  const canDeleteStatus = canDelete(taskStatus);
  const canCompleteStatus = canComplete(taskStatus);
  
  return {
    canView: true,
    canEdit: isOwner && canEditStatus,
    canDelete: (isOwner || context.isManager) && canDeleteStatus,
    canComplete: isOwner && canCompleteStatus,
    canAssign: context.isManager || context.isHrAdmin,
    canComment: true,
    canGiveFeedback: true
  };
}

export function getFeedbackPermissions(
  context: PermissionContext,
  feedbackGiverId: number,
  feedbackRecipientId: number
): EntityPermissions {
  const isGiver = context.userId === feedbackGiverId;
  const isRecipient = context.userId === feedbackRecipientId;
  
  return {
    canView: isGiver || isRecipient || context.isManager || context.isHrAdmin,
    canEdit: isGiver, // Only the giver can edit their feedback
    canDelete: isGiver || context.isHrAdmin,
    canComplete: false, // Feedback doesn't have completion
    canAssign: false, // Feedback cannot be assigned
    canComment: isRecipient || context.isManager || context.isHrAdmin,
    canGiveFeedback: context.userId !== feedbackRecipientId // Cannot give feedback to yourself
  };
}

// Department-based Permissions
export function canAccessDepartment(
  userRole: UserRole,
  userDepartmentId: number,
  targetDepartmentId: number
): boolean {
  // HR Admin can access all departments
  if (userRole === 'hr_admin') {
    return true;
  }
  
  // Others can only access their own department
  return userDepartmentId === targetDepartmentId;
}

export function canAccessUser(
  context: PermissionContext,
  targetUserId: number,
  targetUserDepartmentId: number
): boolean {
  // Can always access yourself
  if (context.userId === targetUserId) {
    return true;
  }
  
  // HR Admin can access anyone
  if (context.isHrAdmin) {
    return true;
  }
  
  // Managers can access users in their department
  if (context.isManager && context.departmentId === targetUserDepartmentId) {
    return true;
  }
  
  return false;
}

// Review Cycle Permissions
export function canParticipateInReview(
  userRole: UserRole,
  reviewType: 'self' | 'peer' | 'manager' | '360'
): boolean {
  switch (reviewType) {
    case 'self':
      return true; // Everyone can do self-reviews
    case 'peer':
      return true; // Everyone can do peer reviews
    case 'manager':
      return userRole === 'manager' || userRole === 'hr_admin';
    case '360':
      return true; // Everyone can participate in 360 reviews
    default:
      return false;
  }
}

export function canInitiateReview(userRole: UserRole): boolean {
  return userRole === 'manager' || userRole === 'hr_admin';
}

// Bulk Operations Permissions
export function canBulkEdit(userRole: UserRole): boolean {
  return userRole === 'manager' || userRole === 'hr_admin';
}

export function canBulkDelete(userRole: UserRole): boolean {
  return userRole === 'hr_admin';
}

export function canBulkAssign(userRole: UserRole): boolean {
  return userRole === 'manager' || userRole === 'hr_admin';
}

// Export/Import Permissions
export function canExportData(userRole: UserRole): boolean {
  return userRole === 'manager' || userRole === 'hr_admin';
}

export function canImportData(userRole: UserRole): boolean {
  return userRole === 'hr_admin';
}

// System Administration Permissions
export function canManageSystemSettings(userRole: UserRole): boolean {
  return userRole === 'hr_admin';
}

export function canViewAuditLogs(userRole: UserRole): boolean {
  return userRole === 'hr_admin';
}

export function canManageDepartments(userRole: UserRole): boolean {
  return userRole === 'hr_admin';
}

// Permission Validation Helper
export function validatePermission(
  context: PermissionContext,
  action: string,
  resource: string,
  resourceId?: number
): { allowed: boolean; reason?: string } {
  // This is a generic permission validator
  // You can extend this based on your specific needs
  
  const key = `${action}_${resource}`;
  
  switch (key) {
    case 'create_objective':
      return {
        allowed: canCreateObjectives(context.userRole),
        reason: !canCreateObjectives(context.userRole) ? 'Only managers and HR admins can create objectives' : undefined
      };
    
    case 'manage_users':
      return {
        allowed: canManageUsers(context.userRole),
        reason: !canManageUsers(context.userRole) ? 'Only managers and HR admins can manage users' : undefined
      };
    
    case 'view_reports':
      return {
        allowed: canViewReports(context.userRole),
        reason: !canViewReports(context.userRole) ? 'Only managers and HR admins can view reports' : undefined
      };
    
    default:
      return { allowed: false, reason: 'Unknown permission' };
  }
}

// Permission Constants
export const PERMISSIONS = {
  // User Management
  CREATE_USER: 'create_user',
  EDIT_USER: 'edit_user',
  DELETE_USER: 'delete_user',
  VIEW_USER: 'view_user',
  
  // Goal Management
  CREATE_GOAL: 'create_goal',
  EDIT_GOAL: 'edit_goal',
  DELETE_GOAL: 'delete_goal',
  VIEW_GOAL: 'view_goal',
  ASSIGN_GOAL: 'assign_goal',
  
  // Objective Management
  CREATE_OBJECTIVE: 'create_objective',
  EDIT_OBJECTIVE: 'edit_objective',
  DELETE_OBJECTIVE: 'delete_objective',
  VIEW_OBJECTIVE: 'view_objective',
  ASSIGN_OBJECTIVE: 'assign_objective',
  
  // Feedback Management
  GIVE_FEEDBACK: 'give_feedback',
  VIEW_FEEDBACK: 'view_feedback',
  EDIT_FEEDBACK: 'edit_feedback',
  DELETE_FEEDBACK: 'delete_feedback',
  
  // Review Management
  CREATE_REVIEW: 'create_review',
  PARTICIPATE_REVIEW: 'participate_review',
  VIEW_REVIEW: 'view_review',
  MANAGE_REVIEW_CYCLE: 'manage_review_cycle',
  
  // Reporting
  VIEW_REPORTS: 'view_reports',
  EXPORT_DATA: 'export_data',
  
  // System Administration
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  MANAGE_DEPARTMENTS: 'manage_departments'
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]; 