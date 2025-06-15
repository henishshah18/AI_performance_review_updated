import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  TargetIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PlusIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';

// Mock data types - will be replaced with real API types in later phases
interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  objectiveTitle: string;
}

interface TaskOverview {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  upcomingDeadlines: number;
}

interface ManagerInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roleTitle?: string;
  department: string;
  lastContact?: string;
}

interface RecentFeedback {
  id: string;
  fromUser: string;
  type: 'positive' | 'constructive' | 'neutral';
  message: string;
  timestamp: string;
}

export function IndividualDashboard() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [taskOverview, setTaskOverview] = useState<TaskOverview | null>(null);
  const [managerInfo, setManagerInfo] = useState<ManagerInfo | null>(null);
  const [recentFeedback, setRecentFeedback] = useState<RecentFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasManager, setHasManager] = useState(true);

  // Mock data loading - will be replaced with real API calls
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock current goals
      setGoals([
        {
          id: '1',
          title: 'Complete React Training Course',
          description: 'Finish the advanced React course and implement learnings in current project',
          progress: 75,
          totalTasks: 8,
          completedTasks: 6,
          dueDate: '2024-11-15',
          priority: 'high',
          status: 'in_progress',
          objectiveTitle: 'Team Skill Development',
        },
        {
          id: '2',
          title: 'Optimize Database Queries',
          description: 'Improve application performance by optimizing slow database queries',
          progress: 45,
          totalTasks: 5,
          completedTasks: 2,
          dueDate: '2024-12-01',
          priority: 'medium',
          status: 'in_progress',
          objectiveTitle: 'Improve Team Productivity',
        },
        {
          id: '3',
          title: 'Code Review Best Practices',
          description: 'Document and implement code review guidelines for the team',
          progress: 90,
          totalTasks: 4,
          completedTasks: 4,
          dueDate: '2024-10-30',
          priority: 'medium',
          status: 'completed',
          objectiveTitle: 'Enhance Code Quality',
        },
        {
          id: '4',
          title: 'API Documentation Update',
          description: 'Update and maintain comprehensive API documentation',
          progress: 20,
          totalTasks: 6,
          completedTasks: 1,
          dueDate: '2024-10-25',
          priority: 'low',
          status: 'overdue',
          objectiveTitle: 'Enhance Code Quality',
        },
      ]);

      // Mock task overview
      setTaskOverview({
        totalTasks: 23,
        completedTasks: 13,
        inProgressTasks: 7,
        overdueTasks: 3,
        upcomingDeadlines: 5,
      });

      // Mock manager info
      setManagerInfo({
        id: '1',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@company.com',
        phone: '+1 (555) 123-4567',
        roleTitle: 'Engineering Manager',
        department: 'Engineering',
        lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      });

      // Mock recent feedback
      setRecentFeedback([
        {
          id: '1',
          fromUser: 'Sarah Johnson',
          type: 'positive',
          message: 'Great work on the React component refactoring. The code is much cleaner now.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        },
        {
          id: '2',
          fromUser: 'Mike Chen',
          type: 'constructive',
          message: 'Consider adding more unit tests for the new features to improve coverage.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
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

  const getPriorityColor = (priority: Goal['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getFeedbackIcon = (type: RecentFeedback['type']) => {
    switch (type) {
      case 'positive':
        return '👍';
      case 'constructive':
        return '💡';
      default:
        return '💬';
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
            My Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {user?.first_name}! Here's your progress overview.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <Link
            to="/tasks"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Task
          </Link>
          <Link
            to="/progress"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            View Progress
          </Link>
        </div>
      </div>

      {/* No Manager Warning */}
      {!hasManager && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                No Manager Assigned
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You don't have a manager assigned yet. Some features may be limited until a manager is assigned.
                  Please contact HR for assistance.
                </p>
              </div>
              <div className="mt-4">
                <a
                  href="mailto:hr@company.com"
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-700"
                >
                  Contact HR →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Overview Cards */}
      {taskOverview && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Tasks
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {taskOverview.totalTasks}
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
                  <CheckCircleIcon className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {taskOverview.completedTasks}
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
                  <ClockIcon className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      In Progress
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {taskOverview.inProgressTasks}
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
                  <ExclamationTriangleIcon className={`h-6 w-6 ${taskOverview.overdueTasks > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Overdue
                    </dt>
                    <dd className={`text-lg font-medium ${taskOverview.overdueTasks > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {taskOverview.overdueTasks}
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
                  <ClockIcon className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Due Soon
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {taskOverview.upcomingDeadlines}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overdue Tasks Warning */}
      {taskOverview && taskOverview.overdueTasks > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Overdue Tasks Require Attention
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  You have {taskOverview.overdueTasks} overdue task{taskOverview.overdueTasks > 1 ? 's' : ''}. 
                  Please review and update your progress or contact your manager if you need assistance.
                </p>
              </div>
              <div className="mt-4">
                <Link
                  to="/tasks?filter=overdue"
                  className="text-sm font-medium text-red-800 hover:text-red-700"
                >
                  View overdue tasks →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Current Goals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">My Current Goals</h3>
          <Link
            to="/goals"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all goals →
          </Link>
        </div>
        
        {goals.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <TargetIcon className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No goals assigned</h3>
            <p className="mt-1 text-sm text-gray-500">
              Contact your manager to get goals assigned to you.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
            {goals.slice(0, 4).map((goal) => (
              <div key={goal.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                        {goal.priority}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                        {goal.status.replace('_', ' ')}
                      </span>
                    </div>
                    <Link
                      to={`/goals/${goal.id}`}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </Link>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-lg font-medium text-gray-900">{goal.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{goal.objectiveTitle}</p>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {goal.description}
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium text-gray-900">{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressColor(goal.progress)}`}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Tasks: {goal.completedTasks}/{goal.totalTasks}</span>
                    <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manager Information & Recent Feedback */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Manager Information */}
        {hasManager && managerInfo ? (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Manager Information</h3>
              
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-lg font-medium text-gray-700">
                    {managerInfo.firstName.charAt(0)}{managerInfo.lastName.charAt(0)}
                  </span>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">
                    {managerInfo.firstName} {managerInfo.lastName}
                  </h4>
                  <p className="text-sm text-gray-500">{managerInfo.roleTitle}</p>
                  <p className="text-sm text-gray-500">{managerInfo.department} Department</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <a href={`mailto:${managerInfo.email}`} className="hover:text-primary-600">
                    {managerInfo.email}
                  </a>
                </div>
                
                {managerInfo.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <a href={`tel:${managerInfo.phone}`} className="hover:text-primary-600">
                      {managerInfo.phone}
                    </a>
                  </div>
                )}
                
                {managerInfo.lastContact && (
                  <div className="text-sm text-gray-500">
                    Last contact: {formatTimestamp(managerInfo.lastContact)}
                  </div>
                )}
              </div>
              
              <div className="mt-6">
                <a
                  href={`mailto:${managerInfo.email}?subject=Check-in Request`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Contact Manager
                </a>
              </div>
            </div>
          </div>
        ) : (
          <NoManagerState />
        )}

        {/* Recent Feedback */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Feedback</h3>
              <Link
                to="/feedback"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View all →
              </Link>
            </div>
            
            {recentFeedback.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">💬</div>
                <h4 className="text-sm font-medium text-gray-900">No recent feedback</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Feedback from your manager and peers will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentFeedback.map((feedback) => (
                  <div key={feedback.id} className="border-l-4 border-primary-200 pl-4">
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{getFeedbackIcon(feedback.type)}</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{feedback.message}</p>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <span>from {feedback.fromUser}</span>
                          <span className="mx-1">•</span>
                          <span>{formatTimestamp(feedback.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// No Manager State Component
function NoManagerState() {
  return (
    <div className="bg-white shadow rounded-lg p-6 text-center">
      <UserIcon className="mx-auto h-12 w-12 text-gray-300" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">No manager assigned</h3>
      <p className="mt-1 text-sm text-gray-500">
        You don't have a manager assigned yet. Contact HR to get a manager assigned.
      </p>
      <div className="mt-6">
        <a
          href="mailto:hr@company.com"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <EnvelopeIcon className="h-4 w-4 mr-2" />
          Contact HR
        </a>
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
          <div className="h-10 bg-gray-200 rounded w-24"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
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

      {/* Goals skeleton */}
      <div>
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg p-5">
              <div className="flex justify-between mb-3">
                <div className="flex space-x-2">
                  <div className="h-5 bg-gray-200 rounded w-12"></div>
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-2 bg-gray-200 rounded w-full mb-4"></div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default IndividualDashboard; 