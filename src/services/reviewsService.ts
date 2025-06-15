import { apiClient } from './apiClient';
import {
  ReviewCycle,
  ReviewParticipant,
  SelfAssessment,
  PeerReview,
  ManagerReview,
  UpwardReview,
  ReviewCycleProgress,
  UserReviewDashboard,
  TeamReviewSummary,
  CreateReviewCycleData,
  CreateSelfAssessmentData,
  CreatePeerReviewData,
  CreateManagerReviewData,
  ReviewFilters,
  PaginatedResponse,
} from '../types/reviews';

class ReviewsService {
  private baseUrl = '/api/reviews';

  // Review Cycle Management
  async getReviewCycles(filters?: ReviewFilters): Promise<PaginatedResponse<ReviewCycle>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.review_type) params.append('review_type', filters.review_type);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());

    const response = await apiClient.get(`${this.baseUrl}/cycles/?${params.toString()}`);
    return response.data;
  }

  async getReviewCycle(id: string): Promise<ReviewCycle> {
    const response = await apiClient.get(`${this.baseUrl}/cycles/${id}/`);
    return response.data;
  }

  async createReviewCycle(data: CreateReviewCycleData): Promise<ReviewCycle> {
    const response = await apiClient.post(`${this.baseUrl}/cycles/`, data);
    return response.data;
  }

  async updateReviewCycle(id: string, data: Partial<CreateReviewCycleData>): Promise<ReviewCycle> {
    const response = await apiClient.put(`${this.baseUrl}/cycles/${id}/`, data);
    return response.data;
  }

  async deleteReviewCycle(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/cycles/${id}/`);
  }

  async getActiveReviewCycles(): Promise<ReviewCycle[]> {
    const response = await apiClient.get(`${this.baseUrl}/cycles/active/`);
    return response.data;
  }

  async getCycleParticipants(cycleId: string): Promise<ReviewParticipant[]> {
    const response = await apiClient.get(`${this.baseUrl}/cycles/${cycleId}/participants/`);
    return response.data;
  }

  async addCycleParticipants(cycleId: string, userIds: string[]): Promise<{ message: string; added_count: number }> {
    const response = await apiClient.post(`${this.baseUrl}/cycles/${cycleId}/participants/`, {
      user_ids: userIds,
    });
    return response.data;
  }

  async getCycleProgress(cycleId: string): Promise<ReviewCycleProgress> {
    const response = await apiClient.get(`${this.baseUrl}/cycles/${cycleId}/progress/`);
    return response.data;
  }

  // Self-Assessment Management
  async getSelfAssessments(filters?: ReviewFilters): Promise<PaginatedResponse<SelfAssessment>> {
    const params = new URLSearchParams();
    if (filters?.cycle_id) params.append('cycle_id', filters.cycle_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());

    const response = await apiClient.get(`${this.baseUrl}/self-assessments/?${params.toString()}`);
    return response.data;
  }

  async getSelfAssessment(id: string): Promise<SelfAssessment> {
    const response = await apiClient.get(`${this.baseUrl}/self-assessments/${id}/`);
    return response.data;
  }

  async createSelfAssessment(data: CreateSelfAssessmentData): Promise<SelfAssessment> {
    const response = await apiClient.post(`${this.baseUrl}/self-assessments/`, data);
    return response.data;
  }

  async updateSelfAssessment(id: string, data: Partial<CreateSelfAssessmentData>): Promise<SelfAssessment> {
    const response = await apiClient.put(`${this.baseUrl}/self-assessments/${id}/`, data);
    return response.data;
  }

  async submitSelfAssessment(id: string): Promise<{ message: string; submitted_at: string }> {
    const response = await apiClient.post(`${this.baseUrl}/self-assessments/${id}/submit/`);
    return response.data;
  }

  // Peer Review Management
  async getPeerReviews(filters?: ReviewFilters): Promise<PaginatedResponse<PeerReview>> {
    const params = new URLSearchParams();
    if (filters?.cycle_id) params.append('cycle_id', filters.cycle_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());

    const response = await apiClient.get(`${this.baseUrl}/peer-reviews/?${params.toString()}`);
    return response.data;
  }

  async getPeerReview(id: string): Promise<PeerReview> {
    const response = await apiClient.get(`${this.baseUrl}/peer-reviews/${id}/`);
    return response.data;
  }

  async createPeerReview(data: CreatePeerReviewData): Promise<PeerReview> {
    const response = await apiClient.post(`${this.baseUrl}/peer-reviews/`, data);
    return response.data;
  }

  async updatePeerReview(id: string, data: Partial<CreatePeerReviewData>): Promise<PeerReview> {
    const response = await apiClient.put(`${this.baseUrl}/peer-reviews/${id}/`, data);
    return response.data;
  }

  // Manager Review Management
  async getManagerReviews(filters?: ReviewFilters): Promise<PaginatedResponse<ManagerReview>> {
    const params = new URLSearchParams();
    if (filters?.cycle_id) params.append('cycle_id', filters.cycle_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());

    const response = await apiClient.get(`${this.baseUrl}/manager-reviews/?${params.toString()}`);
    return response.data;
  }

  async getManagerReview(id: string): Promise<ManagerReview> {
    const response = await apiClient.get(`${this.baseUrl}/manager-reviews/${id}/`);
    return response.data;
  }

  async createManagerReview(data: CreateManagerReviewData): Promise<ManagerReview> {
    const response = await apiClient.post(`${this.baseUrl}/manager-reviews/`, data);
    return response.data;
  }

  async updateManagerReview(id: string, data: Partial<CreateManagerReviewData>): Promise<ManagerReview> {
    const response = await apiClient.put(`${this.baseUrl}/manager-reviews/${id}/`, data);
    return response.data;
  }

  // Dashboard and Analytics
  async getUserReviewDashboard(): Promise<UserReviewDashboard> {
    const response = await apiClient.get(`${this.baseUrl}/dashboard/`);
    return response.data;
  }

  async getTeamReviewSummary(): Promise<TeamReviewSummary> {
    const response = await apiClient.get(`${this.baseUrl}/team-summary/`);
    return response.data;
  }

  // Utility Methods
  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-100';
      case 'not_started':
        return 'text-gray-600 bg-gray-100';
      case 'active':
        return 'text-blue-600 bg-blue-100';
      case 'draft':
        return 'text-purple-600 bg-purple-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  getOverallRatingColor(rating: string): string {
    switch (rating) {
      case 'exceeds_expectations':
        return 'text-green-600 bg-green-100';
      case 'meets_expectations':
        return 'text-blue-600 bg-blue-100';
      case 'below_expectations':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  getRatingStars(rating?: number): string {
    if (!rating) return '☆☆☆☆☆';
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  formatReviewType(type: string): string {
    switch (type) {
      case 'quarterly':
        return 'Quarterly';
      case 'half_yearly':
        return 'Half Yearly';
      case 'annual':
        return 'Annual';
      default:
        return type;
    }
  }

  formatOverallRating(rating: string): string {
    switch (rating) {
      case 'exceeds_expectations':
        return 'Exceeds Expectations';
      case 'meets_expectations':
        return 'Meets Expectations';
      case 'below_expectations':
        return 'Below Expectations';
      default:
        return rating;
    }
  }

  formatGoalRating(rating: string): string {
    switch (rating) {
      case 'exceeded':
        return 'Exceeded';
      case 'met':
        return 'Met';
      case 'partially_met':
        return 'Partially Met';
      case 'not_met':
        return 'Not Met';
      default:
        return rating;
    }
  }

  calculateProgressPercentage(completed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }

  isReviewOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

export const reviewsService = new ReviewsService(); 