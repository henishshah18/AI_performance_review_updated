import axios, { AxiosResponse } from 'axios';
import {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  AuthTokens,
  User,
  UserProfile,
  PasswordChangeRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
  Department,
  AuthError
} from '../types/auth';

// Base API URL - will be configured based on environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage keys
const ACCESS_TOKEN_KEY = 'reviewai_access_token';
const REFRESH_TOKEN_KEY = 'reviewai_refresh_token';
const USER_KEY = 'reviewai_user';

class AuthService {
  // Token management
  setTokens(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
    this.setupAxiosInterceptors();
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete apiClient.defaults.headers.common['Authorization'];
  }

  // User data management
  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const user = this.getUser();
    return !!(token && user);
  }

  // Setup axios interceptors for automatic token attachment and refresh
  setupAxiosInterceptors(): void {
    const token = this.getAccessToken();
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Response interceptor for token refresh
    apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await this.refreshAccessToken(refreshToken);
              this.setTokens(response.data.tokens);
              originalRequest.headers['Authorization'] = `Bearer ${response.data.tokens.access}`;
              return apiClient(originalRequest);
            }
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Authentication API calls
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response: AxiosResponse<LoginResponse> = await apiClient.post('/auth/login/', credentials);
      
      if (response.data.success) {
        this.setTokens(response.data.data.tokens);
        this.setUser(response.data.data.user);
        this.setupAxiosInterceptors();
      }
      
      return response.data;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async signup(userData: SignupRequest): Promise<SignupResponse> {
    try {
      const response: AxiosResponse<SignupResponse> = await apiClient.post('/auth/signup/', userData);
      
      if (response.data.success) {
        this.setTokens(response.data.data.tokens);
        this.setUser(response.data.data.user);
        this.setupAxiosInterceptors();
      }
      
      return response.data;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        await apiClient.post('/auth/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      this.clearTokens();
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ data: { tokens: AuthTokens } }> {
    const response = await apiClient.post('/auth/refresh/', { refresh: refreshToken });
    return response.data;
  }

  // Profile management
  async getUserProfile(): Promise<UserProfile> {
    try {
      const response: AxiosResponse<{ success: boolean; data: UserProfile }> = 
        await apiClient.get('/auth/profile/');
      return response.data.data;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    try {
      const response: AxiosResponse<{ success: boolean; data: User }> = 
        await apiClient.put('/auth/profile/', profileData);
      
      if (response.data.success) {
        this.setUser(response.data.data);
      }
      
      return response.data.data;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Password management
  async changePassword(passwordData: PasswordChangeRequest): Promise<void> {
    try {
      await apiClient.post('/auth/change-password/', passwordData);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    try {
      await apiClient.post('/auth/password-reset/', data);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async confirmPasswordReset(data: PasswordResetConfirm): Promise<void> {
    try {
      await apiClient.post('/auth/password-reset-confirm/', data);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Manager assignment (for Individual Contributors)
  async assignManager(managerId: string): Promise<User> {
    try {
      const response: AxiosResponse<{ success: boolean; data: User }> = 
        await apiClient.put('/auth/assign-manager/', { manager_id: managerId });
      
      if (response.data.success) {
        this.setUser(response.data.data);
      }
      
      return response.data.data;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Team management (for Managers)
  async assignTeamMembers(memberIds: string[]): Promise<User[]> {
    try {
      const response: AxiosResponse<{ success: boolean; data: User[] }> = 
        await apiClient.put('/auth/assign-team/', { member_ids: memberIds });
      return response.data.data;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Department management
  async getDepartments(): Promise<Department[]> {
    try {
      const response: AxiosResponse<{ success: boolean; data: Department[] }> = 
        await apiClient.get('/departments/');
      return response.data.data;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Get managers by department (for signup and manager assignment)
  async getManagersByDepartment(departmentId: string): Promise<User[]> {
    try {
      const response: AxiosResponse<{ success: boolean; data: User[] }> = 
        await apiClient.get(`/departments/${departmentId}/managers/`);
      return response.data.data;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Get unassigned individual contributors (for team assignment)
  async getUnassignedIndividuals(departmentId?: string): Promise<User[]> {
    try {
      const url = departmentId 
        ? `/users/unassigned/?department_id=${departmentId}`
        : '/users/unassigned/';
      const response: AxiosResponse<{ success: boolean; data: User[] }> = 
        await apiClient.get(url);
      return response.data.data;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Error handling
  private handleAuthError(error: any): AuthError {
    if (error.response?.data) {
      return {
        success: false,
        error: {
          code: error.response.status.toString(),
          message: error.response.data.message || error.response.data.error || 'Authentication failed',
          details: error.response.data.details || error.response.data
        }
      };
    }

    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Network error occurred',
        details: error
      }
    };
  }

  // Initialize service (call on app startup)
  initialize(): void {
    this.setupAxiosInterceptors();
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService; 