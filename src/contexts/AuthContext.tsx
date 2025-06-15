import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, UserRole, LoginRequest, SignupRequest, AuthError } from '../types/auth';
import authService from '../services/authService';

// Auth state interface
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  needsManagerAssignment: boolean;
  needsTeamAssignment: boolean;
}

// Auth actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_NEEDS_MANAGER_ASSIGNMENT'; payload: boolean }
  | { type: 'SET_NEEDS_TEAM_ASSIGNMENT'; payload: boolean }
  | { type: 'UPDATE_USER'; payload: User };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  needsManagerAssignment: false,
  needsTeamAssignment: false,
};

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        needsManagerAssignment: action.payload.role === 'individual_contributor' && !action.payload.manager_id,
        needsTeamAssignment: false, // Will be set separately after checking team status
      };

    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        needsManagerAssignment: false,
        needsTeamAssignment: false,
      };

    case 'AUTH_LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'SET_NEEDS_MANAGER_ASSIGNMENT':
      return {
        ...state,
        needsManagerAssignment: action.payload,
      };

    case 'SET_NEEDS_TEAM_ASSIGNMENT':
      return {
        ...state,
        needsTeamAssignment: action.payload,
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
        needsManagerAssignment: action.payload.role === 'individual_contributor' && !action.payload.manager_id,
      };

    default:
      return state;
  }
}

// Auth context interface
interface AuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  needsManagerAssignment: boolean;
  needsTeamAssignment: boolean;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (userData: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  assignManager: (managerId: string) => Promise<void>;
  assignTeamMembers: (memberIds: string[]) => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  checkTeamAssignmentStatus: () => Promise<void>;

  // Utility functions
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  canAccessRoute: (route: string) => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on app load
  useEffect(() => {
    initializeAuth();
  }, []);

  // Check team assignment status when user changes
  useEffect(() => {
    if (state.user?.role === 'manager' && state.isAuthenticated) {
      checkTeamAssignmentStatus();
    }
  }, [state.user, state.isAuthenticated]);

  const initializeAuth = async () => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      if (authService.isAuthenticated()) {
        const user = authService.getUser();
        if (user) {
          // Verify token is still valid by fetching fresh user data
          try {
            const profile = await authService.getUserProfile();
            dispatch({ type: 'AUTH_SUCCESS', payload: profile.user });
          } catch (error) {
            // Token might be expired, clear auth state
            authService.clearTokens();
            dispatch({ type: 'AUTH_LOGOUT' });
          }
        } else {
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } else {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authService.login(credentials);
      
      if (response.success) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.error?.message || error.message || 'Login failed';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const signup = async (userData: SignupRequest) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authService.signup(userData);
      
      if (response.success) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
      } else {
        throw new Error(response.message || 'Signup failed');
      }
    } catch (error: any) {
      const errorMessage = error.error?.message || error.message || 'Signup failed';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const assignManager = async (managerId: string) => {
    try {
      const updatedUser = await authService.assignManager(managerId);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      dispatch({ type: 'SET_NEEDS_MANAGER_ASSIGNMENT', payload: false });
    } catch (error: any) {
      const errorMessage = error.error?.message || error.message || 'Failed to assign manager';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const assignTeamMembers = async (memberIds: string[]) => {
    try {
      await authService.assignTeamMembers(memberIds);
      dispatch({ type: 'SET_NEEDS_TEAM_ASSIGNMENT', payload: false });
    } catch (error: any) {
      const errorMessage = error.error?.message || error.message || 'Failed to assign team members';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const updateProfile = async (profileData: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(profileData);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error: any) {
      const errorMessage = error.error?.message || error.message || 'Failed to update profile';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const checkTeamAssignmentStatus = async () => {
    try {
      if (state.user?.role === 'manager') {
        const profile = await authService.getUserProfile();
        const hasTeam = profile.team_members && profile.team_members.length > 0;
        dispatch({ type: 'SET_NEEDS_TEAM_ASSIGNMENT', payload: !hasTeam });
      }
    } catch (error) {
      console.error('Error checking team assignment status:', error);
    }
  };

  // Utility functions
  const hasRole = (role: UserRole): boolean => {
    return state.user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return state.user ? roles.includes(state.user.role) : false;
  };

  const canAccessRoute = (route: string): boolean => {
    if (!state.user) return false;

    // Import route permissions
    const { ROUTE_PERMISSIONS, PUBLIC_ROUTES } = require('../types/auth');
    
    // Check if it's a public route
    if (PUBLIC_ROUTES.includes(route)) return true;

    // Check role-based permissions
    const userPermissions = ROUTE_PERMISSIONS[state.user.role] || [];
    return userPermissions.includes(route);
  };

  const contextValue: AuthContextType = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    needsManagerAssignment: state.needsManagerAssignment,
    needsTeamAssignment: state.needsTeamAssignment,

    // Actions
    login,
    signup,
    logout,
    clearError,
    assignManager,
    assignTeamMembers,
    updateProfile,
    checkTeamAssignmentStatus,

    // Utilities
    hasRole,
    hasAnyRole,
    canAccessRoute,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext; 