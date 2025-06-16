import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
  TrophyIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { CreateReviewCycleModal } from '../../components/reviews/CreateReviewCycleModal';
import { ReviewCycleCard } from '../../components/reviews/ReviewCycleCard';
import { DepartmentOverviewCard } from '../../components/admin/DepartmentOverviewCard';
import { SystemHealthCard } from '../../components/admin/SystemHealthCard';
import { ActivityFeedCard } from '../../components/admin/ActivityFeedCard';
import { reviewsService } from '../../services/reviewsService';
import { analyticsService } from '../../services/analyticsService';
import { useAuth } from '../../contexts/AuthContext';
import { ReviewCycle, ReviewCycleProgress } from '../../types/reviews';

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

export const HRDashboard: React.FC = () => {
  const { user } = useAuth();
  const [companyOverview, setCompanyOverview] = useState<CompanyOverview | null>(null);
  const [departmentSummaries, setDepartmentSummaries] = useState<DepartmentSummary[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [activeReviewCycles, setActiveReviewCycles] = useState<ReviewCycle[]>([]);
  const [cycleProgress, setCycleProgress] = useState<Record<string, ReviewCycleProgress>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateCycleModal, setShowCreateCycleModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, [refreshTrigger]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load company overview
      const overviewData = await analyticsService.getCompanyOverview();
      setCompanyOverview(overviewData);

      // Load department summaries
      const departmentsData = await analyticsService.getDepartmentSummaries();
      setDepartmentSummaries(departmentsData);

      // Load system health
      const healthData = await analyticsService.getSystemHealth();
      setSystemHealth(healthData);

      // Load recent activities
      const activitiesData = await analyticsService.getRecentActivities();
      setRecentActivities(activitiesData);

      // Load active review cycles
      const cyclesResponse = await reviewsService.getReviewCycles({ 
        status: 'active', 
        page_size: 10 
      });
      setActiveReviewCycles(cyclesResponse.results);

      // Load progress for active cycles
      const progressPromises = cyclesResponse.results.map(cycle => 
        reviewsService.getCycleProgress(cycle.id).catch(() => null)
      );
      
      const progressResults = await Promise.all(progressPromises);
      const progressMap: Record<string, ReviewCycleProgress> = {};
      
      progressResults.forEach((progress, index) => {
        if (progress) {
          progressMap[cyclesResponse.results[index].id] = progress;
        }
      });
      
      setCycleProgress(progressMap);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Dashboard loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCycle = (cycle: ReviewCycle) => {
    setActiveReviewCycles(prev => [cycle, ...prev]);
    setShowCreateCycleModal(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const formatPercentage = (value: number): string => {
    return `${Math.round(value)}%`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'objective_created':
        return <TrophyIcon className="h-4 w-4 text-blue-600" />;
      case 'goal_completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'review_submitted':
        return <DocumentTextIcon className="h-4 w-4 text-purple-600" />;
      case 'user_registered':
        return <UsersIcon className="h-4 w-4 text-indigo-600" />;
      case 'system_alert':
        return <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-amber-500 bg-amber-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => setRefreshTrigger(prev => prev + 1)}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">HR Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Company performance overview and system management
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={() => setShowCreateCycleModal(true)}
              variant="primary"
              className="flex items-center"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Create Review Cycle
            </Button>
            <Button 
              onClick={() => setRefreshTrigger(prev => prev + 1)} 
              variant="outline"
              className="flex items-center"
            >
              <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Company Overview */}
      {companyOverview && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-600" />
            Company Overview
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
                <UsersIcon className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{companyOverview.total_employees}</p>
              <p className="text-sm text-gray-600">Total Employees</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
                <TrophyIcon className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{companyOverview.active_objectives}</p>
              <p className="text-sm text-gray-600">Active Objectives</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatPercentage(companyOverview.overall_completion)}</p>
              <p className="text-sm text-gray-600">Overall Completion</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mx-auto mb-3">
                <CalendarIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{companyOverview.active_review_cycles}</p>
              <p className="text-sm text-gray-600">Active Review Cycles</p>
            </div>
          </div>

          {/* Department Distribution Chart */}
          {companyOverview.department_distribution.length > 0 && (
            <div className="mt-8">
              <h3 className="text-md font-medium text-gray-900 mb-4">Department Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companyOverview.department_distribution.map((dept, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{dept.department}</h4>
                      <span className="text-sm text-gray-600">{dept.employee_count} employees</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${dept.objective_completion}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {formatPercentage(dept.objective_completion)} completion rate
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Review Cycles */}
      {activeReviewCycles.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
              Active Review Cycles
            </h2>
            <Button 
              onClick={() => window.location.href = '/reviews'}
              variant="outline"
              size="sm"
            >
              Manage All Cycles
            </Button>
          </div>
          
          <div className="grid gap-6">
            {activeReviewCycles.map((cycle) => (
              <ReviewCycleCard
                key={cycle.id}
                cycle={cycle}
                progress={cycleProgress[cycle.id]}
                onUpdate={() => setRefreshTrigger(prev => prev + 1)}
                showManagementActions
              />
            ))}
          </div>
        </div>
      )}

      {/* Department Summary Cards */}
      {departmentSummaries.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <BuildingOfficeIcon className="h-5 w-5 mr-2 text-purple-600" />
            Department Summary
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departmentSummaries.map((dept) => (
              <DepartmentOverviewCard
                key={dept.id}
                department={dept}
                onViewDetails={() => window.location.href = `/admin/departments/${dept.id}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* System Health and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        {systemHealth && (
          <SystemHealthCard systemHealth={systemHealth} />
        )}

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-green-600" />
            Recent Activity
          </h2>
          
          {recentActivities.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className={`border-l-4 pl-4 py-3 ${getActivityImportanceColor(activity.importance)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getActivityIcon(activity.type)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {activity.message}
                        </p>
                        {activity.user && (
                          <p className="text-xs text-gray-600">by {activity.user}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Review Cycle Modal */}
      {showCreateCycleModal && (
        <CreateReviewCycleModal
          isOpen={showCreateCycleModal}
          onSave={handleCreateCycle}
          onCancel={() => setShowCreateCycleModal(false)}
        />
      )}
    </div>
  );
}; 