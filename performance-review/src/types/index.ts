import { ReactNode, ComponentType, FormEvent } from 'react';

// User and Authentication Types
export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  role_display: string;
  department_name: string;
  department_display: string;
  manager_name?: string;
  phone?: string;
  role_title?: string;
  bio?: string;
  skills: string[];
  is_active: boolean;
  hire_date?: string;
  date_joined: string;
  last_login?: string;
}

export type UserRole = 'hr_admin' | 'manager' | 'individual_contributor';

export interface Department {
  id: number;
  name: string;
  display_name: string;
  description: string;
  user_count: number;
  is_active: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
  message: string;
  redirect_url: string;
}

export interface UserPermissions {
  user_id: number;
  role: UserRole;
  permissions: Record<string, boolean>;
  department: string;
  is_manager: boolean;
  is_hr_admin: boolean;
}

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

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  description: string;
}

export type StatusTransitions = Record<StatusType, StatusType[]>;

// Progress Types
export interface ProgressData {
  current: number;
  total: number;
  percentage: number;
}

export interface ProgressCalculation {
  taskProgress: ProgressData;
  goalProgress: ProgressData;
  objectiveProgress: ProgressData;
}

// Form Types
export interface FormFieldProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
}

export interface FormSelectProps extends Omit<FormFieldProps, 'type'> {
  options: SelectOption[];
  multiple?: boolean;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface FormTextareaProps extends Omit<FormFieldProps, 'type'> {
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
}

// Modal Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

// Toast Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

// Feedback Types
export type FeedbackType = 'commendation' | 'guidance' | 'constructive';
export type FeedbackVisibility = 'private' | 'public';

export interface FeedbackFormData {
  recipient_id: number;
  feedback_type: FeedbackType;
  visibility: FeedbackVisibility;
  content: string;
  tags: string[];
  related_entity_type?: 'goal' | 'objective' | 'task';
  related_entity_id?: number;
  is_anonymous: boolean;
}

export interface Feedback {
  id: number;
  giver: User;
  recipient: User;
  feedback_type: FeedbackType;
  visibility: FeedbackVisibility;
  content: string;
  tags: string[];
  related_entity_type?: string;
  related_entity_id?: number;
  is_anonymous: boolean;
  status: StatusType;
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next?: string;
  previous?: string;
  page_size: number;
  total_pages: number;
}

// Error Types
export interface ApiError {
  message: string;
  status?: number;
  details?: Record<string, string[]>;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Loading States
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface AsyncState<T> extends LoadingState {
  data?: T | null;
}

// Component Props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

export interface BadgeProps extends BaseComponentProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

export interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'compact' | 'standard';
  color?: 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: 40 | 60 | 80;
  color?: 'primary' | 'success' | 'warning' | 'error';
  showText?: boolean;
  thickness?: number;
  className?: string;
}

// Empty State Types
export interface EmptyStateProps extends BaseComponentProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<any>;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'search' | 'error';
}

// Navigation Types
export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<any>;
  badge?: string | number;
  children?: NavItem[];
  roles?: UserRole[];
}

// Theme Types
export interface ThemeConfig {
  colors: {
    primary: Record<string, string>;
    secondary: Record<string, string>;
    accent: Record<string, string>;
    success: Record<string, string>;
    warning: Record<string, string>;
    error: Record<string, string>;
    status: Record<StatusType, string>;
  };
  spacing: Record<string, string>;
  fontSize: Record<string, [string, { lineHeight: string }]>;
  fontFamily: Record<string, string[]>;
}

// Utility Types
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Event Handler Types
export type ChangeHandler<T = string> = (value: T) => void;
export type SubmitHandler<T = any> = (data: T) => void | Promise<void>;
export type ClickHandler = () => void;

// Hook Return Types
export interface UseAsyncReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<void>;
  reset: () => void;
}

export interface UseFormReturn<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (field: keyof T) => ChangeHandler;
  handleSubmit: (onSubmit: SubmitHandler<T>) => (e: React.FormEvent) => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  reset: () => void;
} 