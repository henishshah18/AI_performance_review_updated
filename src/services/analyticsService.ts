import api from './api';
import {
  OKRCompletionRates,
  FeedbackMetrics,
  ReviewCycleMetrics,
  UserEngagementMetrics,
  DepartmentPerformance,
  TrendAnalysis,
  FeedbackSentimentAnalysis,
  FeedbackTagAnalysis,
  FeedbackParticipationRates,
  ExecutiveOverview,
  ExportJob,
  AnalyticsFilters
} from '../types/analytics';

class AnalyticsService {
  // OKR Analytics
  async getOKRCompletionRates(filters: AnalyticsFilters = {}): Promise<OKRCompletionRates> {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.department) params.append('department', filters.department);
    if (filters.user_id) params.append('user_id', filters.user_id.toString());

    const response = await api.get(`/analytics/okr/completion-rates/?${params.toString()}`);
    return response.data;
  }

  async getOKRProgressTrends(filters: AnalyticsFilters = {}): Promise<TrendAnalysis> {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.department) params.append('department', filters.department);
    if (filters.user_id) params.append('user_id', filters.user_id.toString());

    const response = await api.get(`/analytics/okr/progress-trends/?${params.toString()}`);
    return response.data;
  }

  async getOKRDepartmentComparison(filters: AnalyticsFilters = {}): Promise<DepartmentPerformance> {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);

    const response = await api.get(`/analytics/okr/department-comparison/?${params.toString()}`);
    return response.data;
  }

  async getOKRIndividualPerformance(filters: AnalyticsFilters = {}): Promise<OKRCompletionRates & { engagement_metrics: UserEngagementMetrics }> {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.user_id) params.append('user_id', filters.user_id.toString());

    const response = await api.get(`/analytics/okr/individual-performance/?${params.toString()}`);
    return response.data;
  }

  // Feedback Analytics
  async getFeedbackVolumeTrends(filters: AnalyticsFilters = {}): Promise<TrendAnalysis> {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.department) params.append('department', filters.department);
    if (filters.user_id) params.append('user_id', filters.user_id.toString());

    const response = await api.get(`/analytics/feedback/volume-trends/?${params.toString()}`);
    return response.data;
  }

  async getFeedbackSentimentAnalysis(filters: AnalyticsFilters = {}): Promise<FeedbackSentimentAnalysis> {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.department) params.append('department', filters.department);

    const response = await api.get(`/analytics/feedback/sentiment-analysis/?${params.toString()}`);
    return response.data;
  }

  async getFeedbackTagFrequency(filters: AnalyticsFilters = {}): Promise<FeedbackTagAnalysis> {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.department) params.append('department', filters.department);

    const response = await api.get(`/analytics/feedback/tag-frequency/?${params.toString()}`);
    return response.data;
  }

  async getFeedbackParticipationRates(filters: AnalyticsFilters = {}): Promise<FeedbackParticipationRates> {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.department) params.append('department', filters.department);

    const response = await api.get(`/analytics/feedback/participation-rates/?${params.toString()}`);
    return response.data;
  }

  // Review Analytics
  async getReviewCycleCompletion(filters: AnalyticsFilters = {}): Promise<ReviewCycleMetrics> {
    const params = new URLSearchParams();
    if (filters.cycle_id) params.append('cycle_id', filters.cycle_id.toString());
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.department) params.append('department', filters.department);

    const response = await api.get(`/analytics/reviews/cycle-completion/?${params.toString()}`);
    return response.data;
  }

  // Executive Dashboard
  async getExecutiveOverview(filters: AnalyticsFilters = {}): Promise<ExecutiveOverview> {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);

    const response = await api.get(`/analytics/executive/company-overview/?${params.toString()}`);
    return response.data;
  }

  // User Engagement
  async getUserEngagementMetrics(filters: AnalyticsFilters = {}): Promise<UserEngagementMetrics> {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.department) params.append('department', filters.department);
    if (filters.user_id) params.append('user_id', filters.user_id.toString());

    const response = await api.get(`/analytics/engagement/metrics/?${params.toString()}`);
    return response.data;
  }

  // Data Export
  async exportOKRData(exportData: {
    format: 'json' | 'csv' | 'excel';
    start_date?: string;
    end_date?: string;
    department?: string;
  }): Promise<ExportJob> {
    const response = await api.post('/analytics/export/okr-data/', exportData);
    return response.data;
  }

  async exportFeedbackData(exportData: {
    format: 'json' | 'csv' | 'excel';
    start_date?: string;
    end_date?: string;
    department?: string;
  }): Promise<ExportJob> {
    const response = await api.post('/analytics/export/feedback-data/', exportData);
    return response.data;
  }

  // Utility methods
  formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getDefaultDateRange(days: number = 30): { start_date: string; end_date: string } {
    const end_date = new Date();
    const start_date = new Date();
    start_date.setDate(start_date.getDate() - days);

    return {
      start_date: this.formatDateForAPI(start_date),
      end_date: this.formatDateForAPI(end_date)
    };
  }

  getQuarterDateRange(): { start_date: string; end_date: string } {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const start_date = new Date(now.getFullYear(), quarter * 3, 1);
    const end_date = new Date(now.getFullYear(), quarter * 3 + 3, 0);

    return {
      start_date: this.formatDateForAPI(start_date),
      end_date: this.formatDateForAPI(end_date)
    };
  }

  getYearDateRange(): { start_date: string; end_date: string } {
    const now = new Date();
    const start_date = new Date(now.getFullYear(), 0, 1);
    const end_date = new Date(now.getFullYear(), 11, 31);

    return {
      start_date: this.formatDateForAPI(start_date),
      end_date: this.formatDateForAPI(end_date)
    };
  }
}

export default new AnalyticsService(); 