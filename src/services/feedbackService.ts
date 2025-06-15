import { apiClient } from './apiClient';
import {
  Feedback,
  CreateFeedbackData,
  FeedbackAnalytics,
  TeamFeedbackSummary,
  FeedbackTagTemplate,
  FeedbackComment,
  CreateCommentData,
  FeedbackFilters,
  PaginatedFeedbackResponse,
} from '../types/feedback';

class FeedbackService {
  private baseUrl = '/api/feedback';

  // Core Feedback Operations
  async getFeedback(filters?: FeedbackFilters): Promise<PaginatedFeedbackResponse> {
    const params = new URLSearchParams();
    if (filters?.feedback_type) params.append('feedback_type', filters.feedback_type);
    if (filters?.visibility) params.append('visibility', filters.visibility);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());

    const response = await apiClient.get(`${this.baseUrl}/?${params.toString()}`);
    return response.data;
  }

  async getFeedbackById(id: string): Promise<Feedback> {
    const response = await apiClient.get(`${this.baseUrl}/${id}/`);
    return response.data;
  }

  async createFeedback(data: CreateFeedbackData): Promise<Feedback> {
    const response = await apiClient.post(`${this.baseUrl}/`, data);
    return response.data;
  }

  async updateFeedback(id: string, data: Partial<CreateFeedbackData>): Promise<Feedback> {
    const response = await apiClient.put(`${this.baseUrl}/${id}/`, data);
    return response.data;
  }

  async deleteFeedback(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}/`);
  }

  // User-specific Feedback
  async getFeedbackGiven(filters?: FeedbackFilters): Promise<PaginatedFeedbackResponse> {
    const params = new URLSearchParams();
    if (filters?.feedback_type) params.append('feedback_type', filters.feedback_type);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());

    const response = await apiClient.get(`${this.baseUrl}/given/?${params.toString()}`);
    return response.data;
  }

  async getFeedbackReceived(filters?: FeedbackFilters): Promise<PaginatedFeedbackResponse> {
    const params = new URLSearchParams();
    if (filters?.feedback_type) params.append('feedback_type', filters.feedback_type);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());

    const response = await apiClient.get(`${this.baseUrl}/received/?${params.toString()}`);
    return response.data;
  }

  // Analytics and Insights
  async getFeedbackAnalytics(dateFrom?: string, dateTo?: string): Promise<FeedbackAnalytics> {
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);

    const response = await apiClient.get(`${this.baseUrl}/analytics/?${params.toString()}`);
    return response.data;
  }

  async getTeamFeedbackSummary(): Promise<TeamFeedbackSummary[]> {
    const response = await apiClient.get(`${this.baseUrl}/team-summary/`);
    return response.data;
  }

  async getTrendingTags(): Promise<Array<{ tag_name: string; count: number }>> {
    const response = await apiClient.get(`${this.baseUrl}/tags/trending/`);
    return response.data;
  }

  // Feedback Tags
  async addFeedbackTag(feedbackId: string, tagName: string): Promise<{ message: string }> {
    const response = await apiClient.post(`${this.baseUrl}/${feedbackId}/tags/`, {
      tag_name: tagName,
    });
    return response.data;
  }

  async removeFeedbackTag(feedbackId: string, tagName: string): Promise<{ message: string }> {
    await apiClient.delete(`${this.baseUrl}/${feedbackId}/tags/${tagName}/`);
    return { message: 'Tag removed successfully' };
  }

  // Feedback Tag Templates (HR Admin)
  async getTagTemplates(): Promise<FeedbackTagTemplate[]> {
    const response = await apiClient.get(`${this.baseUrl}/settings/tag-templates/`);
    return response.data;
  }

  async createTagTemplate(data: {
    tag_name: string;
    description: string;
    category: string;
  }): Promise<FeedbackTagTemplate> {
    const response = await apiClient.post(`${this.baseUrl}/settings/tag-templates/`, data);
    return response.data;
  }

  async updateTagTemplate(
    id: string,
    data: Partial<{ tag_name: string; description: string; category: string; is_active: boolean }>
  ): Promise<FeedbackTagTemplate> {
    const response = await apiClient.put(`${this.baseUrl}/settings/tag-templates/${id}/`, data);
    return response.data;
  }

  async deleteTagTemplate(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/settings/tag-templates/${id}/`);
  }

  // Feedback Comments
  async getFeedbackComments(feedbackId: string): Promise<FeedbackComment[]> {
    const response = await apiClient.get(`${this.baseUrl}/${feedbackId}/comments/`);
    return response.data;
  }

  async addFeedbackComment(feedbackId: string, data: CreateCommentData): Promise<FeedbackComment> {
    const response = await apiClient.post(`${this.baseUrl}/${feedbackId}/comments/`, data);
    return response.data;
  }

  async updateFeedbackComment(commentId: string, data: CreateCommentData): Promise<FeedbackComment> {
    const response = await apiClient.put(`${this.baseUrl}/comments/${commentId}/`, data);
    return response.data;
  }

  async deleteFeedbackComment(commentId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/comments/${commentId}/`);
  }

  // Utility Methods
  getFeedbackTypeColor(type: string): string {
    switch (type) {
      case 'commendation':
        return 'text-green-600 bg-green-100';
      case 'guidance':
        return 'text-blue-600 bg-blue-100';
      case 'constructive':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  getFeedbackTypeIcon(type: string): string {
    switch (type) {
      case 'commendation':
        return '👏';
      case 'guidance':
        return '💡';
      case 'constructive':
        return '🔧';
      default:
        return '💬';
    }
  }

  getVisibilityColor(visibility: string): string {
    switch (visibility) {
      case 'public':
        return 'text-blue-600 bg-blue-100';
      case 'private':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  formatFeedbackType(type: string): string {
    switch (type) {
      case 'commendation':
        return 'Commendation';
      case 'guidance':
        return 'Guidance';
      case 'constructive':
        return 'Constructive';
      default:
        return type;
    }
  }

  formatVisibility(visibility: string): string {
    switch (visibility) {
      case 'public':
        return 'Public';
      case 'private':
        return 'Private';
      default:
        return visibility;
    }
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

  getTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return this.formatDate(dateString);
    }
  }
}

export const feedbackService = new FeedbackService(); 