import axios from 'axios';

// Base API URL - will be configured based on environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
const getAccessToken = () => localStorage.getItem('reviewai_access_token');

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface CompanyOverview {
  total_employees: number;
  active_objectives: number;
  overall_completion: number;
  active_review_cycles: number;
  department_distribution: Array<{
    department: string;
    employee_count: number;
    objective_completion: number;
  }>;
}

interface DepartmentSummary {
  id: string;
  name: string;
  employee_count: number;
  objectives_count: number;
  completion_rate: number;
  manager_to_ic_ratio: string;
  recent_activity: number;
}

interface SystemHealth {
  user_engagement_score: number;
  data_integrity_score: number;
  performance_score: number;
  recent_activity_count: number;
  active_sessions: number;
}

interface RecentActivity {
  id: string;
  type: 'objective_created' | 'goal_completed' | 'review_submitted' | 'user_registered' | 'system_alert';
  message: string;
  timestamp: string;
  user?: string;
  importance: 'low' | 'medium' | 'high';
}

interface Department {
  id: string;
  name: string;
  employee_count: number;
  manager_count: number;
}

interface ParticipantPreview {
  total_participants: number;
  by_department: Array<{
    department: string;
    count: number;
    roles: {
      managers: number;
      individual_contributors: number;
    };
  }>;
  estimated_workload: {
    self_assessments: number;
    peer_reviews: number;
    manager_reviews: number;
  };
}

class AnalyticsService {
  private baseUrl = '/analytics';

  // Company Overview
  async getCompanyOverview(): Promise<CompanyOverview> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/company-overview/`);
      return response.data;
    } catch (error) {
      // Return mock data for development
      return {
        total_employees: 156,
        active_objectives: 23,
        overall_completion: 78,
        active_review_cycles: 2,
        department_distribution: [
          { department: 'Engineering', employee_count: 45, objective_completion: 82 },
          { department: 'Product', employee_count: 25, objective_completion: 76 },
          { department: 'Human Resources', employee_count: 8, objective_completion: 90 },
          { department: 'Sales', employee_count: 35, objective_completion: 74 },
          { department: 'Marketing', employee_count: 20, objective_completion: 85 },
          { department: 'Operations', employee_count: 23, objective_completion: 71 }
        ]
      };
    }
  }

  // Department Summaries
  async getDepartmentSummaries(): Promise<DepartmentSummary[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/departments/summaries/`);
      return response.data;
    } catch (error) {
      // Return mock data for development
      return [
        {
          id: '1',
          name: 'Engineering',
          employee_count: 45,
          objectives_count: 8,
          completion_rate: 82,
          manager_to_ic_ratio: '1:9',
          recent_activity: 23
        },
        {
          id: '2',
          name: 'Product',
          employee_count: 25,
          objectives_count: 5,
          completion_rate: 76,
          manager_to_ic_ratio: '1:8',
          recent_activity: 15
        },
        {
          id: '3',
          name: 'Human Resources',
          employee_count: 8,
          objectives_count: 3,
          completion_rate: 90,
          manager_to_ic_ratio: '1:3',
          recent_activity: 12
        },
        {
          id: '4',
          name: 'Sales',
          employee_count: 35,
          objectives_count: 6,
          completion_rate: 74,
          manager_to_ic_ratio: '1:7',
          recent_activity: 18
        },
        {
          id: '5',
          name: 'Marketing',
          employee_count: 20,
          objectives_count: 4,
          completion_rate: 85,
          manager_to_ic_ratio: '1:6',
          recent_activity: 10
        },
        {
          id: '6',
          name: 'Operations',
          employee_count: 23,
          objectives_count: 3,
          completion_rate: 71,
          manager_to_ic_ratio: '1:7',
          recent_activity: 8
        }
      ];
    }
  }

  // System Health
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/system-health/`);
      return response.data;
    } catch (error) {
      // Return mock data for development
      return {
        user_engagement_score: 87,
        data_integrity_score: 94,
        performance_score: 91,
        recent_activity_count: 142,
        active_sessions: 34
      };
    }
  }

  // Recent Activities
  async getRecentActivities(limit: number = 20): Promise<RecentActivity[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/recent-activities/?limit=${limit}`);
      return response.data;
    } catch (error) {
      // Return mock data for development
      const now = new Date();
      return [
        {
          id: '1',
          type: 'review_submitted',
          message: 'Q4 2024 self-assessment completed',
          timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          user: 'John Smith',
          importance: 'medium'
        },
        {
          id: '2',
          type: 'objective_created',
          message: 'New objective "Improve API Performance" created',
          timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
          user: 'Sarah Johnson',
          importance: 'high'
        },
        {
          id: '3',
          type: 'goal_completed',
          message: 'Goal "Implement user authentication" completed',
          timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
          user: 'Mike Chen',
          importance: 'medium'
        },
        {
          id: '4',
          type: 'user_registered',
          message: 'New employee Emily Rodriguez joined',
          timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
          importance: 'low'
        },
        {
          id: '5',
          type: 'review_submitted',
          message: 'Peer review for David Kim submitted',
          timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
          user: 'Lisa Wang',
          importance: 'medium'
        },
        {
          id: '6',
          type: 'system_alert',
          message: 'Review cycle deadline approaching (3 days remaining)',
          timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          importance: 'high'
        }
      ];
    }
  }

  // Departments for Review Cycle Creation
  async getDepartments(): Promise<Department[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/departments/`);
      return response.data;
    } catch (error) {
      // Return mock data for development
      return [
        { id: '1', name: 'Engineering', employee_count: 45, manager_count: 5 },
        { id: '2', name: 'Product', employee_count: 25, manager_count: 3 },
        { id: '3', name: 'Human Resources', employee_count: 8, manager_count: 2 },
        { id: '4', name: 'Sales', employee_count: 35, manager_count: 5 },
        { id: '5', name: 'Marketing', employee_count: 20, manager_count: 3 },
        { id: '6', name: 'Operations', employee_count: 23, manager_count: 3 }
      ];
    }
  }

  // Participant Preview for Review Cycles
  async getParticipantPreview(filters: {
    departments: string[];
    exclude_probationary: boolean;
    exclude_contractors: boolean;
  }): Promise<ParticipantPreview> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/participant-preview/`, filters);
      return response.data;
    } catch (error) {
      // Return mock data for development
      const totalParticipants = filters.departments.length * 20; // Roughly 20 people per department
      return {
        total_participants: totalParticipants,
        by_department: filters.departments.map((deptId, index) => ({
          department: ['Engineering', 'Product', 'HR', 'Sales', 'Marketing', 'Operations'][index] || `Department ${deptId}`,
          count: 20,
          roles: {
            managers: 3,
            individual_contributors: 17
          }
        })),
        estimated_workload: {
          self_assessments: totalParticipants,
          peer_reviews: totalParticipants * 3, // Each person reviews 3 peers
          manager_reviews: Math.floor(totalParticipants * 0.15) * 5 // Managers review ~5 people each
        }
      };
    }
  }

  // Utility methods
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService; 