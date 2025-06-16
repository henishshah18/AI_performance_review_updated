export interface ReviewCycle {
  id: string;
  name: string;
  description?: string;
  review_type: "quarterly" | "half_yearly" | "annual";
  status: "draft" | "active" | "completed" | "cancelled";
  current_phase: string;
  review_period_start: string;
  review_period_end: string;
  self_assessment_start: string;
  self_assessment_end: string;
  peer_review_start: string;
  peer_review_end: string;
  manager_review_start: string;
  manager_review_end: string;
  participant_count: number;
  created_by_name: string;
  created_at: string;
}

export interface UserReviewDashboard {
  active_cycles: ReviewCycle[];
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

export interface CreateReviewCycleData {
  name: string;
  description?: string;
  review_type: "quarterly" | "half_yearly" | "annual";
  status?: "draft" | "active" | "completed" | "cancelled";
  review_period_start: string;
  review_period_end: string;
  self_assessment_start: string;
  self_assessment_end: string;
  peer_review_start: string;
  peer_review_end: string;
  manager_review_start: string;
  manager_review_end: string;
}

export interface ReviewCycleProgress {
  cycle_id: string;
  cycle_name: string;
  current_phase: string;
  total_participants: number;
  self_assessment_progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  peer_review_progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  manager_review_progress: {
    completed: number;
    total: number;
    percentage: number;
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
  }>;
  completion_rates: {
    self_assessments: number;
    peer_reviews: number;
    manager_reviews: number;
  };
}

export interface TeamMemberReview {
  id: string;
  employee_name: string;
  employee_email: string;
  self_assessment_status: 'completed' | 'in_progress' | 'not_started';
  peer_reviews_received: number;
  peer_reviews_expected: number;
  manager_review_status: 'completed' | 'in_progress' | 'not_started';
  meeting_scheduled: boolean;
  meeting_date?: string;
  overall_progress: number;
}

export interface SelfAssessment {
  id: string;
  employee_id: string;
  cycle_id: string;
  status: 'draft' | 'submitted';
  responses: Record<string, any>;
}

export interface PeerReview {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  cycle_id: string;
  status: 'draft' | 'submitted';
  responses: Record<string, any>;
}

export interface ManagerReview {
  id: string;
  manager_id: string;
  employee_id: string;
  cycle_id: string;
  status: 'draft' | 'submitted';
  responses: Record<string, any>;
}

export interface UpwardReview {
  id: string;
  employee_id: string;
  manager_id: string;
  cycle_id: string;
  status: 'draft' | 'submitted';
  responses: Record<string, any>;
}

export interface ReviewParticipant {
  id: string;
  employee_id: string;
  cycle_id: string;
  role: 'participant' | 'reviewer' | 'manager';
}
