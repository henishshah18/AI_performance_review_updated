import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  TargetIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PlusIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { ReviewManagement } from '../../components/reviews/ReviewManagement';

// Mock data types - will be replaced with real API types in later phases
interface AssignedObjective {
  id: string;
  title: string;
  description: string;
  progress: number;
  totalGoals: number;
  completedGoals: number;
  dueDate: string;
  status: 'active' | 'completed' | 'overdue';
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleTitle?: string;
  activeGoals: number;
  completedGoals: number;
  overdue: number;
  progressPercentage: number;
  lastActivity: string;
}

interface TeamOverview {
  totalMembers: number;
  activeGoals: number;
  completedGoals: number;
  overdueGoals: number;
  averageProgress: number;
}

export function ManagerDashboard() {
  const { user } = useAuth();
  const [objectives, setObjectives] = useState<AssignedObjective[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamOverview, setTeamOverview] = useState<TeamOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTeam, setHasTeam] = useState(true);
  const [activeTab, setActiveTab] = useState<'objectives' | 'reviews'>('objectives');

  // Mock data loading - will be replaced with real API calls
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock assigned objectives
      setObjectives([
        {
          id: '1',
          title: 'Improve Team Productivity',
          description: 'Increase team output by 25% through process optimization',
          progress: 68,
          totalGoals: 5,
          completedGoals: 3,
          dueDate: '2024-12-31',
          status: 'active',
        },
        {
          id: '2',
          title: 'Enhance Code Quality',
          description: 'Reduce bug reports by 40% and improve code review process',
          progress: 45,
          totalGoals: 4,
          completedGoals: 2,
          dueDate: '2024-11-30',
          status: 'active',
        },
        {
          id: '3',
          title: 'Team Skill Development',
          description: 'Complete technical training for all team members',
          progress: 90,
          totalGoals: 3,
          completedGoals: 3,
          dueDate: '2024-10-15',
          status: 'completed',
        },
      ]);

      // Mock team overview
      setTeamOverview({
        totalMembers: 8,
        activeGoals: 24,
        completedGoals: 18,
        overdueGoals: 3,
        averageProgress: 72,
      });

      // Mock team members
      setTeamMembers([
        {
          id: '1',
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice.johnson@company.com',
          roleTitle: 'Senior Developer',
          activeGoals: 4,
          completedGoals: 6,
          overdue: 1,
          progressPercentage: 75,
          lastActivity: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: '2',
          firstName: 'Bob',
          lastName: 'Smith',
          email: 'bob.smith@company.com',
          roleTitle: 'Frontend Developer',
          activeGoals: 3,
          completedGoals: 4,
          overdue: 0,
          progressPercentage: 85,
          lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        {
          id: '3',
          firstName: 'Carol',
          lastName: 'Davis',
          email: 'carol.davis@company.com',
          roleTitle: 'Backend Developer',
          activeGoals: 2,
          completedGoals: 3,
          overdue: 0,
          progressPercentage: 90,
          lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        },
        {
          id: '4',
          firstName: 'David',
          lastName: 'Wilson',
          email: 'david.wilson@company.com',
          roleTitle: 'DevOps Engineer',
          activeGoals: 3,
          completedGoals: 2,
          overdue: 1,
          progressPercentage: 60,
          lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        },
        {
          id: '5',
          firstName: 'Eva',
          lastName: 'Brown',
          email: 'eva.brown@company.com',
          roleTitle: 'QA Engineer',
          activeGoals: 2,
          completedGoals: 3,
          overdue: 0,
          progressPercentage: 80,
          lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
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

  const getStatusColor = (status: AssignedObjective['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!hasTeam) {
    return <NoTeamState />;
  }

  const renderTabContent = () => {
    if (activeTab === 'reviews') {
      return <ReviewManagement className="mt-6" />;
    }

    return (
      <div className="space-y-6">
        {/* Team Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Team Members</p>
                <p className="text-2xl font-bold text-gray-900">{teamOverview?.totalMembers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TargetIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Goals</p>
                <p className="text-2xl font-bold text-gray-900">{teamOverview?.activeGoals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{teamOverview?.completedGoals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{teamOverview?.overdueGoals}</p>
              </div>
            </div>
          </div>
        </div>

        {/* My Objectives */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">My Objectives</h2>
              <Link
                to="/objectives"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {objectives.slice(0, 3).map((objective) => (
                <div key={objective.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{objective.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{objective.description}</p>
                      <div className="flex items-center mt-3 space-x-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <TargetIcon className="h-4 w-4 mr-1" />
                          {objective.completedGoals}/{objective.totalGoals} goals
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          Due {new Date(objective.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(objective.status)}`}>
                        {objective.status}
                      </span>
                      <button className="text-gray-400 hover:text-gray-600">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{objective.progress}%</span>
                    </div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressColor(objective.progress)}`}
                        style={{ width: `${objective.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  Avg. Progress: {teamOverview?.averageProgress}%
                </span>
                <Link
                  to="/team"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View All
                </Link>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {member.firstName[0]}{member.lastName[0]}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{member.roleTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">{member.activeGoals}</p>
                        <p className="text-xs text-gray-500">Active</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">{member.completedGoals}</p>
                        <p className="text-xs text-gray-500">Completed</p>
                      </div>
                      {member.overdue > 0 && (
                        <div className="text-center">
                          <p className="text-sm font-medium text-red-600">{member.overdue}</p>
                          <p className="text-xs text-red-500">Overdue</p>
                        </div>
                      )}
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          Last active {formatTimestamp(member.lastActivity)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Overall Progress</span>
                      <span className="font-medium">{member.progressPercentage}%</span>
                    </div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressColor(member.progressPercentage)}`}
                        style={{ width: `${member.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/objectives/create"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <PlusIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Create Objective</p>
                <p className="text-xs text-gray-600">Set new team goals</p>
              </div>
            </Link>
            <Link
              to="/team/performance"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChartBarIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">View Analytics</p>
                <p className="text-xs text-gray-600">Team performance insights</p>
              </div>
            </Link>
            <button
              onClick={() => setActiveTab('reviews')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <DocumentTextIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Manage Reviews</p>
                <p className="text-xs text-gray-600">Performance reviews</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Manager Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.first_name}! Here's your team overview.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('objectives')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'objectives'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <TargetIcon className="h-5 w-5 mr-2" />
                  Objectives & Team
                </div>
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reviews'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Performance Reviews
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
}

function NoTeamState() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <UsersIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Team Assigned</h2>
        <p className="text-gray-600 mb-6 max-w-md">
          You don't have any team members assigned to you yet. 
          Please contact your HR team to get team members assigned to your account.
        </p>
        <Link
          to="/help"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-gray-300 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-96"></div>
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-gray-300 rounded"></div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-gray-300 rounded w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Content Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManagerDashboard; 