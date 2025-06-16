export type UserRole = 'hr_admin' | 'manager' | 'individual_contributor';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  manager_id?: string;
  department_id: string;
  phone?: string;
  role_title?: string;
  bio?: string;
  skills: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Manager information (populated when needed)
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    role_title?: string;
    department?: string;
  };
  // Department information (populated when needed)
  department?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  manager_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    tokens: AuthTokens;
  };
  message?: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  department_id: string;
  manager_id?: string;
  phone?: string;
  role_title?: string;
}

export interface SignupResponse {
  success: boolean;
  data: {
    user: User;
    tokens: AuthTokens;
  };
  message?: string;
}

export interface AuthError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface UserProfile {
  user: User;
  department: Department;
  manager?: User;
  team_members?: User[];
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

// Route permissions based on user roles
export interface RoutePermissions {
  hr_admin: string[];
  manager: string[];
  individual_contributor: string[];
}

export const ROUTE_PERMISSIONS: RoutePermissions = {
  hr_admin: [
    '/admin/dashboard',
    '/admin/objectives',
    '/admin/review-cycles',
    '/admin/analytics',
    '/admin/reports',
    '/admin/settings',
    '/dashboard',
    '/objectives',
    '/feedback',
    '/reviews',
    '/profile',
    '/settings'
  ],
  manager: [
    '/dashboard',
    '/objectives',
    '/team-goals',
    '/feedback',
    '/reviews',
    '/reports',
    '/profile',
    '/settings'
  ],
  individual_contributor: [
    '/dashboard',
    '/goals',
    '/tasks',
    '/feedback',
    '/reviews',
    '/progress',
    '/profile',
    '/settings'
  ]
};

// Public routes that don't require authentication
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/reset-password',
  '/forgot-password'
];

// Role-based redirect paths after login
export const ROLE_REDIRECTS: Record<UserRole, string> = {
  hr_admin: '/admin/dashboard',
  manager: '/dashboard',
  individual_contributor: '/dashboard'
}; 