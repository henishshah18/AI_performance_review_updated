// AI-related TypeScript interfaces and types

export interface SentimentAnalysisResult {
  id: string;
  sentiment_label: 'positive' | 'neutral' | 'negative';
  sentiment_score: number;
  confidence_score: number;
  detected_keywords: string[];
  detected_issues: string[];
  analysis_metadata: Record<string, any>;
  created_at: string;
  content_type: string;
  object_id: string;
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

export interface AIGenerationRequest {
  id: string;
  user: string;
  generation_type: 'self_assessment' | 'peer_review' | 'manager_review' | 'goal_suggestions';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  input_data: Record<string, any>;
  generated_content: string | null;
  structured_output: Record<string, any>;
  model_used: string;
  tokens_used: number | null;
  processing_time: number | null;
  error_message: string | null;
  related_cycle_id: string | null;
  related_user_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
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

export interface AIUsageAnalytics {
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
}

// Request/Response types for API calls
export interface ReviewGenerationRequest {
  generation_type: 'self_assessment' | 'peer_review' | 'manager_review';
  context_data: Record<string, any>;
  cycle_id?: string;
  reviewee_id?: string;
}

export interface SentimentAnalysisRequest {
  content: string;
  content_type?: string;
}

export interface AISettingsUpdateRequest {
  ai_features_enabled?: boolean;
  sentiment_analysis_enabled?: boolean;
  review_generation_enabled?: boolean;
  goal_suggestions_enabled?: boolean;
  max_generations_per_user_per_day?: number;
  max_generations_per_user_per_hour?: number;
  openai_model?: string;
  max_tokens?: number;
  temperature?: number;
  auto_analyze_feedback?: boolean;
  auto_analyze_reviews?: boolean;
}

// Component prop types
export interface AIGenerationButtonProps {
  generationType: 'self_assessment' | 'peer_review' | 'manager_review';
  contextData: Record<string, any>;
  cycleId?: string;
  revieweeId?: string;
  onGenerated: (result: AIGenerationResult) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
}

export interface SentimentIndicatorProps {
  sentimentResult: SentimentAnalysisResult;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Utility types
export type SentimentLabel = 'positive' | 'neutral' | 'negative';
export type GenerationType = 'self_assessment' | 'peer_review' | 'manager_review' | 'goal_suggestions';
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type AlertSeverity = 'high' | 'medium' | 'low'; 