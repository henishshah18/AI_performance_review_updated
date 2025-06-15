export interface ReviewCycle {
  id: string;
  name: string;
  review_type: 'quarterly' | 'half_yearly' | 'annual';
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  review_period_start: string;
  review_period_end: string;
  self_assessment_start: string;
  self_assessment_end: string;
  peer_review_start: string;
  peer_review_end: string;
  manager_review_start: string;
  manager_review_end: string;
  created_by: string;
  created_by_name: string;
  current_phase: string;
  is_active: boolean;
  participant_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewParticipant {
  id: string;
  cycle: string;
  user: string;
  user_details: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
    department?: string;
    role: string;
  };
  cycle_name: string;
  is_active: boolean;
  created_at: string;
}

export interface SelfAssessment {
  id: string;
  cycle: string;
  user: string;
  user_details: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
  cycle_name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  technical_excellence?: number;
  technical_examples?: string;
  collaboration?: number;
  collaboration_examples?: string;
  problem_solving?: number;
  problem_solving_examples?: string;
  initiative?: number;
  initiative_examples?: string;
  development_goals?: string;
  manager_support_needed?: string;
  career_interests?: string;
  completion_percentage: number;
  sentiment_analyzed: boolean;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface GoalAssessment {
  id: string;
  goal: string;
  goal_title: string;
  goal_description: string;
  self_rating: 'exceeded' | 'met' | 'partially_met' | 'not_met';
  accomplishments?: string;
  evidence_links: string[];
  created_at: string;
  updated_at: string;
}

export interface PeerReview {
  id: string;
  cycle: string;
  reviewer: string;
  reviewee: string;
  reviewer_details: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
  reviewee_details: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
  cycle_name: string;
  is_anonymous: boolean;
  status: 'not_started' | 'in_progress' | 'completed';
  collaboration_rating?: number;
  collaboration_examples?: string;
  impact_rating?: number;
  impact_examples?: string;
  development_suggestions?: string;
  strengths_to_continue?: string;
  sentiment_analyzed: boolean;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ManagerReview {
  id: string;
  cycle: string;
  manager: string;
  employee: string;
  manager_details: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
  employee_details: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
  cycle_name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  overall_rating?: 'exceeds_expectations' | 'meets_expectations' | 'below_expectations';
  technical_excellence?: number;
  technical_justification?: string;
  collaboration?: number;
  collaboration_justification?: string;
  problem_solving?: number;
  problem_solving_justification?: string;
  initiative?: number;
  initiative_justification?: string;
  development_plan?: string;
  manager_support?: string;
  business_impact?: string;
  sentiment_analyzed: boolean;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UpwardReview {
  id: string;
  cycle: string;
  reviewer: string;
  manager: string;
  reviewer_details: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
  manager_details: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
  cycle_name: string;
  is_anonymous: boolean;
  status: 'not_started' | 'in_progress' | 'completed';
  leadership_effectiveness?: number;
  leadership_examples?: string;
  communication_clarity?: number;
  communication_examples?: string;
  support_provided?: number;
  support_examples?: string;
  areas_for_improvement?: string;
  additional_comments?: string;
  sentiment_analyzed: boolean;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewProgress {
  completed: number;
  total: number;
  percentage: number;
}

export interface ReviewCycleProgress {
  cycle_id: string;
  cycle_name: string;
  current_phase: string;
  total_participants: number;
  self_assessment_progress: ReviewProgress;
  peer_review_progress: ReviewProgress;
  manager_review_progress: ReviewProgress;
}

export interface UserReviewDashboard {
  active_cycles: Array<{
    id: string;
    name: string;
    current_phase: string;
    tasks: {
      self_assessment: 'not_started' | 'in_progress' | 'completed';
      peer_reviews_to_give: number;
      manager_review_to_give: number;
      upward_review_to_give: number;
    };
  }>;
  pending_tasks: {
    self_assessments: number;
    peer_reviews: number;
    manager_reviews: number;
    upward_reviews: number;
  };
  completed_reviews: {
    self_assessments: number;
    peer_reviews_given: number;
    peer_reviews_received: number;
    manager_reviews_given: number;
    manager_reviews_received: number;
  };
}

export interface TeamReviewSummary {
  team_size: number;
  active_cycles: number;
  team_members: Array<{
    id: string;
    name: string;
    email: string;
    self_assessments_completed: number;
    peer_reviews_received: number;
    latest_review_date?: string;
  }>;
  completion_rates: {
    self_assessments: number;
    peer_reviews: number;
    manager_reviews: number;
  };
}

export interface CreateReviewCycleData {
  name: string;
  review_type: 'quarterly' | 'half_yearly' | 'annual';
  review_period_start: string;
  review_period_end: string;
  self_assessment_start: string;
  self_assessment_end: string;
  peer_review_start: string;
  peer_review_end: string;
  manager_review_start: string;
  manager_review_end: string;
}

export interface CreateSelfAssessmentData {
  cycle: string;
  status: 'not_started' | 'in_progress' | 'completed';
  technical_excellence?: number;
  technical_examples?: string;
  collaboration?: number;
  collaboration_examples?: string;
  problem_solving?: number;
  problem_solving_examples?: string;
  initiative?: number;
  initiative_examples?: string;
  development_goals?: string;
  manager_support_needed?: string;
  career_interests?: string;
}

export interface CreatePeerReviewData {
  cycle: string;
  reviewee: string;
  is_anonymous: boolean;
  status: 'not_started' | 'in_progress' | 'completed';
  collaboration_rating?: number;
  collaboration_examples?: string;
  impact_rating?: number;
  impact_examples?: string;
  development_suggestions?: string;
  strengths_to_continue?: string;
}

export interface CreateManagerReviewData {
  cycle: string;
  employee: string;
  status: 'not_started' | 'in_progress' | 'completed';
  overall_rating?: 'exceeds_expectations' | 'meets_expectations' | 'below_expectations';
  technical_excellence?: number;
  technical_justification?: string;
  collaboration?: number;
  collaboration_justification?: string;
  problem_solving?: number;
  problem_solving_justification?: string;
  initiative?: number;
  initiative_justification?: string;
  development_plan?: string;
  manager_support?: string;
  business_impact?: string;
}

export interface ReviewFilters {
  status?: string;
  cycle_id?: string;
  review_type?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
} 