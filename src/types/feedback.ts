export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department?: string;
  avatar_url?: string;
}

export interface Feedback {
  id: string;
  from_user: User;
  to_user: User;
  feedback_type: 'commendation' | 'guidance' | 'constructive';
  visibility: 'private' | 'public';
  content: string;
  tags: FeedbackTag[];
  related_objective?: string;
  related_goal?: string;
  related_task?: string;
  is_anonymous: boolean;
  sentiment_analyzed: boolean;
  created_at: string;
  updated_at: string;
  comments?: FeedbackComment[];
}

export interface FeedbackTag {
  id: string;
  tag_name: string;
  created_at: string;
}

export interface FeedbackComment {
  id: string;
  feedback: string;
  comment_by: User;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface FeedbackTagTemplate {
  id: string;
  tag_name: string;
  description: string;
  category: string;
  is_active: boolean;
  usage_count: number;
  created_by: User;
  created_at: string;
  updated_at: string;
}

export interface CreateFeedbackData {
  to_user: string;
  feedback_type: 'commendation' | 'guidance' | 'constructive';
  visibility: 'private' | 'public';
  content: string;
  tags: string[];
  related_objective?: string;
  related_goal?: string;
  related_task?: string;
  is_anonymous: boolean;
}

export interface FeedbackAnalytics {
  total_given: number;
  total_received: number;
  feedback_by_type: {
    commendation: number;
    guidance: number;
    constructive: number;
  };
  recent_feedback: Feedback[];
  top_tags: Array<{
    tag_name: string;
    count: number;
  }>;
  team_participation?: {
    active_givers: number;
    active_receivers: number;
    total_team_members: number;
  };
  monthly_trends: Array<{
    month: string;
    given: number;
    received: number;
  }>;
}

export interface TeamFeedbackSummary {
  team_member: User;
  feedback_received_count: number;
  feedback_given_count: number;
  feedback_by_type: {
    commendation: number;
    guidance: number;
    constructive: number;
  };
  recent_feedback: Feedback[];
  top_received_tags: Array<{
    tag_name: string;
    count: number;
  }>;
}

export interface FeedbackFilters {
  feedback_type?: string;
  visibility?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedFeedbackResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Feedback[];
}

export interface CreateCommentData {
  content: string;
} 