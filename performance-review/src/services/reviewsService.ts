import { ReviewCycle, CreateReviewCycleData, UserReviewDashboard, ReviewCycleProgress, TeamReviewSummary } from '../types/reviews';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('reviewai_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}`);
  }
  return response.json();
};

export const reviewsService = {
  // Get user's review dashboard data
  getUserReviewDashboard: async (): Promise<UserReviewDashboard> => {
    const response = await fetch(`${API_BASE_URL}/reviews/dashboard/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get active review cycles
  getActiveReviewCycles: async (): Promise<ReviewCycle[]> => {
    const response = await fetch(`${API_BASE_URL}/reviews/cycles/active/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get review cycles with filters
  getReviewCycles: async (params: { status?: string; page_size?: number }): Promise<{ results: ReviewCycle[] }> => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.page_size) queryParams.append('page_size', params.page_size.toString());
    
    const response = await fetch(`${API_BASE_URL}/reviews/cycles/?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get cycle progress
  getCycleProgress: async (cycleId: string): Promise<ReviewCycleProgress> => {
    const response = await fetch(`${API_BASE_URL}/reviews/cycles/${cycleId}/progress/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get team review summary (for managers)
  getTeamReviewSummary: async (): Promise<TeamReviewSummary> => {
    const response = await fetch(`${API_BASE_URL}/reviews/team-summary/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Create review cycle
  createReviewCycle: async (data: CreateReviewCycleData): Promise<ReviewCycle> => {
    const response = await fetch(`${API_BASE_URL}/reviews/cycles/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Update review cycle
  updateReviewCycle: async (id: string, data: Partial<CreateReviewCycleData>): Promise<ReviewCycle> => {
    const response = await fetch(`${API_BASE_URL}/reviews/cycles/${id}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Delete review cycle
  deleteReviewCycle: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/reviews/cycles/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}`);
    }
  },

  // Start review cycle (transition from draft to active)
  startReviewCycle: async (id: string, data: { department_ids: string[]; settings: any }): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/reviews/cycles/${id}/start/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Get cycle participants
  getCycleParticipants: async (cycleId: string) => {
    const response = await fetch(`${API_BASE_URL}/reviews/cycles/${cycleId}/participants/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Add participants to cycle
  addCycleParticipants: async (cycleId: string, userIds: string[]) => {
    const response = await fetch(`${API_BASE_URL}/reviews/cycles/${cycleId}/participants/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ user_ids: userIds }),
    });
    return handleResponse(response);
  },

  // Self-assessment endpoints
  getSelfAssessments: async (cycleId?: string) => {
    const queryParams = cycleId ? `?cycle_id=${cycleId}` : '';
    const response = await fetch(`${API_BASE_URL}/reviews/self-assessments/${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  createSelfAssessment: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/reviews/self-assessments/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateSelfAssessment: async (id: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/reviews/self-assessments/${id}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  submitSelfAssessment: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/reviews/self-assessments/${id}/submit/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Peer review endpoints
  getPeerReviews: async (cycleId?: string) => {
    const queryParams = cycleId ? `?cycle_id=${cycleId}` : '';
    const response = await fetch(`${API_BASE_URL}/reviews/peer-reviews/${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  createPeerReview: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/reviews/peer-reviews/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updatePeerReview: async (id: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/reviews/peer-reviews/${id}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Manager review endpoints
  getManagerReviews: async (cycleId?: string) => {
    const queryParams = cycleId ? `?cycle_id=${cycleId}` : '';
    const response = await fetch(`${API_BASE_URL}/reviews/manager-reviews/${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  createManagerReview: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/reviews/manager-reviews/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateManagerReview: async (id: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/reviews/manager-reviews/${id}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Utility function to format dates
  formatDate: (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  }
};
