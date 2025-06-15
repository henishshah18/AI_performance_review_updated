export interface AnalyticsPeriod {
  start_date: string;
  end_date: string;
}

export interface OKRCompletionRates {
  period: AnalyticsPeriod;
  objectives: {
    total: number;
    completed: number;
    completion_rate: number;
  };
  goals: {
    total: number;
    completed: number;
    completion_rate: number;
  };
  tasks: {
    total: number;
    completed: number;
    completion_rate: number;
  };
  overall: {
    total_items: number;
    completed_items: number;
    completion_rate: number;
  };
}

export interface FeedbackMetrics {
  period: AnalyticsPeriod;
  total_feedback: number;
  type_distribution: {
    commendation?: number;
    guidance?: number;
    constructive?: number;
  };
  visibility_distribution: {
    public?: number;
    private?: number;
  };
  anonymous_percentage: number;
  top_tags: Array<{
    tag_name: string;
    count: number;
  }>;
  participation: {
    unique_givers: number;
    unique_receivers: number;
    participation_rate: number;
  };
}

export interface ReviewCycleMetrics {
  cycles: Array<{
    cycle_id: number;
    cycle_name: string;
    cycle_period: AnalyticsPeriod;
    participants: number;
    completion_rates: {
      self_assessment: number;
      peer_review: number;
      manager_review: number;
      overall: number;
    };
    review_counts: {
      self_assessments: {
        completed: number;
        total: number;
      };
      peer_reviews: {
        completed: number;
        total: number;
      };
      manager_reviews: {
        completed: number;
        total: number;
      };
    };
    average_ratings: {
      technical_excellence?: number;
      collaboration?: number;
      problem_solving?: number;
      initiative?: number;
      development_goals?: number;
    };
  }>;
  summary: {
    total_cycles: number;
    avg_completion_rate: number;
  };
}

export interface UserEngagementMetrics {
  period: AnalyticsPeriod;
  total_activities: number;
  unique_active_users: number;
  engagement_rate: number;
  activity_by_type: Array<{
    activity_type: string;
    count: number;
  }>;
  daily_trends: Array<{
    day: string;
    count: number;
  }>;
  most_active_users: Array<{
    user__first_name: string;
    user__last_name: string;
    user__id: number;
    activity_count: number;
  }>;
  login_metrics: {
    total_logins: number;
    unique_login_users: number;
  };
}

export interface DepartmentPerformance {
  period: AnalyticsPeriod;
  departments: Array<{
    department: string;
    employee_count: number;
    okr_completion_rate: number;
    feedback_participation_rate: number;
    engagement_rate: number;
    total_activities: number;
    feedback_volume: number;
    performance_score: number;
  }>;
  summary: {
    total_departments: number;
    avg_performance_score: number;
  };
}

export interface TrendAnalysis {
  metric_type: string;
  period: AnalyticsPeriod;
  trends: Array<{
    week_start: string;
    week_end: string;
    value: number;
    details: any;
  }>;
  analysis: {
    trend_direction: 'increasing' | 'decreasing' | 'stable';
    trend_percentage: number;
    data_points: number;
  };
}

export interface FeedbackSentimentAnalysis {
  overall_sentiment: 'positive' | 'neutral' | 'negative';
  sentiment_score: number; // -1 to 1 scale
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  sentiment_trends: Array<{
    week: string;
    score: number;
  }>;
  feedback_metrics: FeedbackMetrics;
}

export interface FeedbackTagAnalysis {
  top_tags: Array<{
    tag_name: string;
    count: number;
  }>;
  tag_trends: Array<{
    tag: string;
    trend: 'increasing' | 'stable' | 'decreasing';
    change: number;
  }>;
  category_distribution: {
    skills: number;
    behaviors: number;
    values: number;
  };
  feedback_metrics: FeedbackMetrics;
}

export interface FeedbackParticipationRates {
  participation_rate: number;
  unique_givers: number;
  unique_receivers: number;
  engagement_rate: number;
  feedback_frequency: {
    daily_average: number;
    weekly_average: number;
  };
  participation_trends: TrendAnalysis;
}

export interface ExecutiveOverview {
  period: AnalyticsPeriod;
  key_metrics: {
    overall_okr_completion: number;
    employee_engagement_rate: number;
    feedback_participation_rate: number;
    total_active_users: number;
  };
  department_performance: Array<{
    department: string;
    employee_count: number;
    okr_completion_rate: number;
    feedback_participation_rate: number;
    engagement_rate: number;
    total_activities: number;
    feedback_volume: number;
    performance_score: number;
  }>;
  trends: {
    okr_trend: TrendAnalysis;
    engagement_trend: TrendAnalysis;
    feedback_trend: TrendAnalysis;
  };
  alerts: Array<{
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
    metric: string;
    department?: string;
  }>;
}

export interface ExportJob {
  job_id: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  format: 'json' | 'csv' | 'excel';
  data?: any;
  download_url?: string;
  created_at: string;
  error_message?: string;
}

export interface AnalyticsFilters {
  start_date?: string;
  end_date?: string;
  department?: string;
  user_id?: number;
  cycle_id?: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  percentage?: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface AnalyticsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
  icon?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  loading?: boolean;
}

export interface ChartProps {
  data: ChartDataPoint[] | TimeSeriesDataPoint[];
  title?: string;
  height?: number;
  type?: 'bar' | 'line' | 'pie' | 'doughnut' | 'area';
  showLegend?: boolean;
  showTooltip?: boolean;
  colors?: string[];
}

export interface AnalyticsPageProps {
  userRole: 'individual_contributor' | 'manager' | 'hr_admin';
  userId: number;
  department?: string;
} 