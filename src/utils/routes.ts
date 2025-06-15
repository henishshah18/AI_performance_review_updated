import { UserRole } from '../types/auth';

// Public routes that don't require authentication
export const PUBLIC_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
} as const;

// Protected routes for different user roles
export const PROTECTED_ROUTES = {
  // Common routes
  DASHBOARD: '/dashboard',
  FEEDBACK: '/feedback',
  REVIEWS: '/reviews',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  
  // Manager routes
  OBJECTIVES: '/objectives',
  TEAM_GOALS: '/team-goals',
  REPORTS: '/reports',
  
  // Individual Contributor routes
  GOALS: '/goals',
  TASKS: '/tasks',
  PROGRESS: '/progress',
  
  // HR Admin routes
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_OBJECTIVES: '/admin/objectives',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_REVIEW_CYCLES: '/admin/review-cycles',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_SETTINGS: '/admin/settings',
} as const;

// Error routes
export const ERROR_ROUTES = {
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '/404',
} as const;

// Role-based route permissions
export const ROUTE_PERMISSIONS: Record<UserRole, string[]> = {
  hr_admin: [
    PROTECTED_ROUTES.ADMIN_DASHBOARD,
    PROTECTED_ROUTES.ADMIN_OBJECTIVES,
    PROTECTED_ROUTES.ADMIN_ANALYTICS,
    PROTECTED_ROUTES.ADMIN_REVIEW_CYCLES,
    PROTECTED_ROUTES.ADMIN_REPORTS,
    PROTECTED_ROUTES.ADMIN_SETTINGS,
    PROTECTED_ROUTES.DASHBOARD,
    PROTECTED_ROUTES.OBJECTIVES,
    PROTECTED_ROUTES.FEEDBACK,
    PROTECTED_ROUTES.REVIEWS,
    PROTECTED_ROUTES.REPORTS,
    PROTECTED_ROUTES.PROFILE,
    PROTECTED_ROUTES.SETTINGS,
  ],
  manager: [
    PROTECTED_ROUTES.DASHBOARD,
    PROTECTED_ROUTES.OBJECTIVES,
    PROTECTED_ROUTES.TEAM_GOALS,
    PROTECTED_ROUTES.FEEDBACK,
    PROTECTED_ROUTES.REVIEWS,
    PROTECTED_ROUTES.REPORTS,
    PROTECTED_ROUTES.PROFILE,
    PROTECTED_ROUTES.SETTINGS,
  ],
  individual_contributor: [
    PROTECTED_ROUTES.DASHBOARD,
    PROTECTED_ROUTES.GOALS,
    PROTECTED_ROUTES.TASKS,
    PROTECTED_ROUTES.FEEDBACK,
    PROTECTED_ROUTES.REVIEWS,
    PROTECTED_ROUTES.PROGRESS,
    PROTECTED_ROUTES.PROFILE,
    PROTECTED_ROUTES.SETTINGS,
  ],
};

// Role-based default redirect paths after login
export const ROLE_REDIRECTS: Record<UserRole, string> = {
  hr_admin: PROTECTED_ROUTES.ADMIN_DASHBOARD,
  manager: PROTECTED_ROUTES.DASHBOARD,
  individual_contributor: PROTECTED_ROUTES.DASHBOARD,
};

// Utility functions
export const isPublicRoute = (path: string): boolean => {
  return Object.values(PUBLIC_ROUTES).includes(path as any);
};

export const canUserAccessRoute = (userRole: UserRole, path: string): boolean => {
  if (isPublicRoute(path)) {
    return true;
  }
  
  return ROUTE_PERMISSIONS[userRole]?.includes(path) || false;
};

export const getDefaultRouteForRole = (role: UserRole): string => {
  return ROLE_REDIRECTS[role];
};

export const getRouteTitle = (path: string): string => {
  const routeTitles: Record<string, string> = {
    [PUBLIC_ROUTES.LOGIN]: 'Sign In',
    [PUBLIC_ROUTES.SIGNUP]: 'Sign Up',
    [PUBLIC_ROUTES.FORGOT_PASSWORD]: 'Forgot Password',
    [PROTECTED_ROUTES.DASHBOARD]: 'Dashboard',
    [PROTECTED_ROUTES.OBJECTIVES]: 'Objectives',
    [PROTECTED_ROUTES.TEAM_GOALS]: 'Team Goals',
    [PROTECTED_ROUTES.GOALS]: 'My Goals',
    [PROTECTED_ROUTES.TASKS]: 'My Tasks',
    [PROTECTED_ROUTES.FEEDBACK]: 'Feedback',
    [PROTECTED_ROUTES.REVIEWS]: 'Reviews',
    [PROTECTED_ROUTES.PROGRESS]: 'My Progress',
    [PROTECTED_ROUTES.REPORTS]: 'Reports',
    [PROTECTED_ROUTES.ADMIN_DASHBOARD]: 'Admin Dashboard',
    [PROTECTED_ROUTES.ADMIN_OBJECTIVES]: 'Objectives Management',
    [PROTECTED_ROUTES.ADMIN_ANALYTICS]: 'Analytics',
    [PROTECTED_ROUTES.ADMIN_REVIEW_CYCLES]: 'Review Cycles',
    [PROTECTED_ROUTES.PROFILE]: 'Profile',
    [PROTECTED_ROUTES.SETTINGS]: 'Settings',
    [ERROR_ROUTES.UNAUTHORIZED]: 'Access Denied',
    [ERROR_ROUTES.NOT_FOUND]: 'Page Not Found',
  };
  
  return routeTitles[path] || 'ReviewAI';
};

// Navigation menu items for different roles
export const getNavigationItems = (role: UserRole) => {
  const baseItems = [
    { path: PROTECTED_ROUTES.FEEDBACK, label: 'Feedback', icon: 'chat' },
    { path: PROTECTED_ROUTES.REVIEWS, label: 'Reviews', icon: 'star' },
    { path: PROTECTED_ROUTES.PROFILE, label: 'Profile', icon: 'user' },
  ];

  switch (role) {
    case 'hr_admin':
      return [
        { path: PROTECTED_ROUTES.ADMIN_DASHBOARD, label: 'Dashboard', icon: 'home' },
        { path: PROTECTED_ROUTES.ADMIN_OBJECTIVES, label: 'Objectives', icon: 'target' },
        { path: PROTECTED_ROUTES.ADMIN_ANALYTICS, label: 'Analytics', icon: 'chart' },
        { path: PROTECTED_ROUTES.ADMIN_REVIEW_CYCLES, label: 'Review Cycles', icon: 'calendar' },
        ...baseItems,
        { path: PROTECTED_ROUTES.ADMIN_SETTINGS, label: 'Settings', icon: 'cog' },
      ];
    
    case 'manager':
      return [
        { path: PROTECTED_ROUTES.DASHBOARD, label: 'Dashboard', icon: 'home' },
        { path: PROTECTED_ROUTES.OBJECTIVES, label: 'Objectives', icon: 'target' },
        { path: PROTECTED_ROUTES.TEAM_GOALS, label: 'Team Goals', icon: 'users' },
        { path: PROTECTED_ROUTES.REPORTS, label: 'Reports', icon: 'document' },
        ...baseItems,
        { path: PROTECTED_ROUTES.SETTINGS, label: 'Settings', icon: 'cog' },
      ];
    
    case 'individual_contributor':
      return [
        { path: PROTECTED_ROUTES.DASHBOARD, label: 'Dashboard', icon: 'home' },
        { path: PROTECTED_ROUTES.GOALS, label: 'My Goals', icon: 'target' },
        { path: PROTECTED_ROUTES.TASKS, label: 'My Tasks', icon: 'clipboard' },
        { path: PROTECTED_ROUTES.PROGRESS, label: 'Progress', icon: 'chart' },
        ...baseItems,
        { path: PROTECTED_ROUTES.SETTINGS, label: 'Settings', icon: 'cog' },
      ];
    
    default:
      return baseItems;
  }
}; 