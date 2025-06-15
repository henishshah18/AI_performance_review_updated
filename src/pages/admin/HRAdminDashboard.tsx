import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UsersIcon,
  TargetIcon,
  CalendarIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

// Mock data types - will be replaced with real API types in later phases
interface CompanyOverview {
  totalEmployees: number;
  activeObjectives: number;
  overallCompletion: number;
  activeReviewCycles: number;
  departmentCount: number;
}

interface DepartmentSummary {
  id: string;
  name: string;
  employeeCount: number;
  managerCount: number;
  individualCount: number;
  objectiveCount: number;
  completionRate: number;
}

interface RecentActivity {
  id: string;
  type: 'objective_created' | 'review_started' | 'goal_completed' | 'user_joined';
  title: string;
  description: string;
  timestamp: string;
  user: string;
}

export function HRAdminDashboard() {
  const [overview, setOverview] = useState<CompanyOverview | null>(null);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data loading - will be replaced with real API calls
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock company overview
      setOverview({
        totalEmployees: 156,
        activeObjectives: 24,
        overallCompletion: 68,
        activeReviewCycles: 2,
        departmentCount: 8,
      });

      // Mock department data
      setDepartments([
        {
          id: '1',
          name: 'Engineering',
          employeeCount: 45,
          managerCount: 5,
          individualCount: 40,
          objectiveCount: 8,
          completionRate: 72,
        },
        {
          id: '2',
          name: 'Product',
          employeeCount: 18,
          managerCount: 2,
          individualCount: 16,
          objectiveCount: 4,
          completionRate: 85,
        },
        {
          id: '3',
          name: 'Design',
          employeeCount: 12,
          managerCount: 1,
          individualCount: 11,
          objectiveCount: 3,
          completionRate: 90,
        },
        {
          id: '4',
          name: 'Marketing',
          employeeCount: 22,
          managerCount: 2,
          individualCount: 20,
          objectiveCount: 5,
          completionRate: 60,
        },
        {
          id: '5',
          name: 'Sales',
          employeeCount: 28,
          managerCount: 3,
          individualCount: 25,
          objectiveCount: 6,
          completionRate: 55,
        },
        {
          id: '6',
          name: 'HR',
          employeeCount: 8,
          managerCount: 1,
          individualCount: 7,
          objectiveCount: 2,
          completionRate: 100,
        },
      ]);

      // Mock recent activity
      setRecentActivity([
        {
          id: '1',
          type: 'objective_created',
          title: 'New Q4 Objective Created',
          description: 'Improve Customer Satisfaction Score by 15%',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          user: 'Sarah Johnson',
        },
        {
          id: '2',
          type: 'review_started',
          title: 'Q3 Performance Review Started',
          description: 'Engineering Department - 45 participants',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          user: 'Mike Chen',
        },
        {
          id: '3',
          type: 'goal_completed',
          title: 'Goal Completed',
          description: 'Launch Mobile App Beta - Product Team',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          user: 'Alex Rivera',
        },
        {
          id: '4',
          type: 'user_joined',
          title: 'New Team Member',
          description: 'Emma Davis joined Marketing Department',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          user: 'System',
        },
      ]);

      setIsLoading(false);
    };

    loadDashboardData();
  }, []);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'objective_created':
        return <TargetIcon className="h-5 w-5 text-blue-500" />;
      case 'review_started':
        return <CalendarIcon className="h-5 w-5 text-purple-500" />;
      case 'goal_completed':
        return <ChartBarIcon className="h-5 w-5 text-green-500" />;
      case 'user_joined':
        return <UsersIcon className="h-5 w-5 text-indigo-500" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            HR Admin Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Company-wide performance overview and management
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <Link
            to="/admin/objectives"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Objective
          </Link>
          <Link
            to="/admin/review-cycles"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Start Review Cycle
          </Link>
        </div>
      </div>

      {/* Company Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Employees
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {overview.totalEmployees}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TargetIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Objectives
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {overview.activeObjectives}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Overall Completion
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {overview.overallCompletion}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Reviews
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {overview.activeReviewCycles}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Departments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {overview.departmentCount}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Department Overview</h3>
          <Link
            to="/admin/analytics"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View detailed analytics →
          </Link>
        </div>
        
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <div key={dept.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">{dept.name}</h4>
                  <button className="text-gray-400 hover:text-gray-500">
                    <EyeIcon className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Employees</span>
                    <span className="font-medium text-gray-900">{dept.employeeCount}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Managers</span>
                    <span className="font-medium text-gray-900">{dept.managerCount}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Objectives</span>
                    <span className="font-medium text-gray-900">{dept.objectiveCount}</span>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Completion Rate</span>
                      <span className="font-medium text-gray-900">{dept.completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          dept.completionRate >= 80 ? 'bg-green-500' :
                          dept.completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${dept.completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            <Link
              to="/admin/activity"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all activity →
            </Link>
          </div>
          
          <div className="flow-root">
            <ul className="-mb-8">
              {recentActivity.map((activity, index) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {index !== recentActivity.length - 1 && (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {activity.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-400">
                            by {activity.user}
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          {formatTimestamp(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Link
              to="/admin/objectives"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:border-gray-300"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-600 group-hover:bg-primary-100">
                  <TargetIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Create Objective
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Set new company objectives
                </p>
              </div>
            </Link>

            <Link
              to="/admin/review-cycles"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:border-gray-300"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-600 group-hover:bg-purple-100">
                  <CalendarIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Start Review Cycle
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Launch performance reviews
                </p>
              </div>
            </Link>

            <Link
              to="/admin/analytics"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:border-gray-300"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-600 group-hover:bg-green-100">
                  <ChartBarIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  View Reports
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Analyze performance data
                </p>
              </div>
            </Link>

            <Link
              to="/admin/settings"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:border-gray-300"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-gray-50 text-gray-600 group-hover:bg-gray-100">
                  <Cog6ToothIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  System Settings
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Configure system preferences
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton component
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <div className="h-10 bg-gray-200 rounded w-32"></div>
          <div className="h-10 bg-gray-200 rounded w-36"></div>
        </div>
      </div>

      {/* Overview cards skeleton */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg p-5">
            <div className="flex items-center">
              <div className="h-6 w-6 bg-gray-200 rounded"></div>
              <div className="ml-5 w-0 flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Department cards skeleton */}
      <div>
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg p-5">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
                <div className="h-2 bg-gray-200 rounded w-full mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HRAdminDashboard; 