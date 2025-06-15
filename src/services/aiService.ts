import axios from 'axios';
import { API_BASE_URL } from './api';

const API_URL = `${API_BASE_URL}/ai`;

export interface SentimentAnalysisResult {
  sentiment_label: 'positive' | 'neutral' | 'negative';
  sentiment_score: number;
  confidence_score: number;
  keywords: string[];
  detected_issues: string[];
  explanation: string;
  usage_info: {
    tokens_used: number;
    processing_time: number;
  };
}

export interface AIGenerationResult {
  success: boolean;
  request_id: string;
  generated_content: string;
  structured_output: Record<string, any>;
  usage_info: {
    tokens_used: number;
    processing_time: number;
  };
  error?: string;
}

export interface AISettings {
  id: string;
  ai_features_enabled: boolean;
  sentiment_analysis_enabled: boolean;
  review_generation_enabled: boolean;
  goal_suggestions_enabled: boolean;
  max_generations_per_user_per_day: number;
  max_generations_per_user_per_hour: number;
  openai_model: string;
  max_tokens: number;
  temperature: number;
  auto_analyze_feedback: boolean;
  auto_analyze_reviews: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
  updated_by_name: string | null;
}

export interface SentimentDashboard {
  total_analyzed: number;
  average_sentiment_score: number;
  average_confidence: number;
  sentiment_distribution: {
    positive: { count: number; percentage: number };
    neutral: { count: number; percentage: number };
    negative: { count: number; percentage: number };
  };
  sentiment_trends: Array<{
    week_start: string;
    count: number;
    average_score: number;
  }>;
  detected_issues: Record<string, number>;
  analysis_period: {
    start_date: string | null;
    end_date: string;
  };
}

export interface AIAlert {
  type: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  sentiment_score: number;
  confidence: number;
  object_id: string;
  content_type: string;
  detected_at: string;
  issues: string[];
}

export interface AIInsights {
  insights: Array<{
    type: string;
    title: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    metric_value: number;
    metric_unit: string;
  }>;
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  sentiment_alerts: AIAlert[];
  quality_flags: Array<{
    type: string;
    description: string;
    count: number;
  }>;
}

export interface GenerationHistory {
  id: string;
  generation_type: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  tokens_used: number | null;
  processing_time: number | null;
  has_content: boolean;
  error_message: string | null;
}

class AIService {
  // AI Settings Management (HR Admin only)
  async getAISettings(): Promise<AISettings> {
    const response = await axios.get(`${API_URL}/settings/`);
    return response.data;
  }

  async updateAISettings(settings: Partial<AISettings>): Promise<AISettings> {
    const response = await axios.put(`${API_URL}/settings/`, settings);
    return response.data;
  }

  // Review Generation
  async generateSelfAssessmentDraft(data: {
    generation_type: 'self_assessment';
    context_data: Record<string, any>;
    cycle_id?: string;
  }): Promise<AIGenerationResult> {
    const response = await axios.post(`${API_URL}/generate/self-assessment/`, data);
    return response.data;
  }

  async generatePeerReviewDraft(data: {
    generation_type: 'peer_review';
    context_data: Record<string, any>;
    cycle_id?: string;
    reviewee_id: string;
  }): Promise<AIGenerationResult> {
    const response = await axios.post(`${API_URL}/generate/peer-review/`, data);
    return response.data;
  }

  async generateManagerReviewDraft(data: {
    generation_type: 'manager_review';
    context_data: Record<string, any>;
    cycle_id?: string;
    reviewee_id: string;
  }): Promise<AIGenerationResult> {
    const response = await axios.post(`${API_URL}/generate/manager-review/`, data);
    return response.data;
  }

  // Sentiment Analysis
  async analyzeSentiment(data: {
    content: string;
    content_type?: string;
  }): Promise<SentimentAnalysisResult> {
    const response = await axios.post(`${API_URL}/sentiment/analyze/`, data);
    return response.data;
  }

  async getSentimentDashboard(params?: {
    content_type?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<SentimentDashboard> {
    const response = await axios.get(`${API_URL}/sentiment/dashboard/`, { params });
    return response.data;
  }

  async getSentimentAlerts(): Promise<{ alerts: AIAlert[]; total_alerts: number }> {
    const response = await axios.get(`${API_URL}/sentiment/alerts/`);
    return response.data;
  }

  // AI Generation History
  async getGenerationHistory(params?: {
    generation_type?: string;
    status?: string;
    page?: number;
  }): Promise<{
    results: GenerationHistory[];
    count: number;
    next: string | null;
    previous: string | null;
  }> {
    const response = await axios.get(`${API_URL}/generation-history/`, { params });
    return response.data;
  }

  // AI Analytics (HR Admin only)
  async getUsageAnalytics(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<{
    total_generations: number;
    generations_by_type: Record<string, number>;
    generations_by_user: Array<{
      user__first_name: string;
      user__last_name: string;
      user__email: string;
      count: number;
    }>;
    daily_usage: Array<{
      date: string;
      count: number;
    }>;
    success_rate: number;
    average_processing_time: number;
    total_tokens_used: number;
    analysis_period: {
      start_date: string;
      end_date: string;
    };
  }> {
    const response = await axios.get(`${API_URL}/analytics/usage/`, { params });
    return response.data;
  }

  // AI Insights
  async getAIInsights(): Promise<AIInsights> {
    const response = await axios.get(`${API_URL}/insights/`);
    return response.data;
  }

  // Utility methods
  getSentimentColor(sentimentLabel: string): string {
    switch (sentimentLabel) {
      case 'positive':
        return 'text-green-600 bg-green-50';
      case 'negative':
        return 'text-red-600 bg-red-50';
      case 'neutral':
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  }

  getSentimentIcon(sentimentLabel: string): string {
    switch (sentimentLabel) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😟';
      case 'neutral':
      default:
        return '😐';
    }
  }

  formatSentimentScore(score: number): string {
    if (score > 0.3) return 'Positive';
    if (score < -0.3) return 'Negative';
    return 'Neutral';
  }

  getGenerationTypeLabel(type: string): string {
    switch (type) {
      case 'self_assessment':
        return 'Self Assessment';
      case 'peer_review':
        return 'Peer Review';
      case 'manager_review':
        return 'Manager Review';
      case 'goal_suggestions':
        return 'Goal Suggestions';
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  }

  // Error handling
  handleAIError(error: any): string {
    if (error.response?.status === 429) {
      return 'Rate limit exceeded. Please try again later.';
    }
    if (error.response?.status === 403) {
      return 'You do not have permission to use this AI feature.';
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    return 'An error occurred while processing your AI request. Please try again.';
  }
}

export const aiService = new AIService();
export default aiService; 