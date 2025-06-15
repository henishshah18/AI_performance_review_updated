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
} from '@heroicons/react/24/outline';

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
    return 'bg-red-500';
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
            Manager Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {user?.first_name}! Here's your team's performance overview.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <Link
            to="/team-goals"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Assign Goals
          </Link>
          <Link
            to="/reports"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            View Reports
          </Link>
        </div>
      </div>

      {/* My Assigned Objectives */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">My Assigned Objectives</h3>
          <Link
            to="/objectives"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all objectives →
          </Link>
        </div>
        
        {objectives.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <TargetIcon className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No objectives assigned</h3>
            <p className="mt-1 text-sm text-gray-500">
              Contact HR to get your objectives assigned.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {objectives.map((objective) => (
              <div key={objective.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(objective.status)}`}>
                      {objective.status}
                    </span>
                    <Link
                      to={`/objectives/${objective.id}`}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </Link>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-lg font-medium text-gray-900">{objective.title}</h4>
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                      {objective.description}
                    </p>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium text-gray-900">{objective.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressColor(objective.progress)}`}
                        style={{ width: `${objective.progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between text-sm text-gray-500">
                    <span>Goals: {objective.completedGoals}/{objective.totalGoals}</span>
                    <span>Due: {new Date(objective.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Performance Overview */}
      {hasTeam && teamOverview ? (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Team Performance Overview</h3>
          
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UsersIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Team Members
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {teamOverview.totalMembers}
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
                        Active Goals
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {teamOverview.activeGoals}
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
                    <CheckCircleIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Completed Goals
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {teamOverview.completedGoals}
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
                    <ExclamationTriangleIcon className={`h-6 w-6 ${teamOverview.overdueGoals > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Overdue Goals
                      </dt>
                      <dd className={`text-lg font-medium ${teamOverview.overdueGoals > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {teamOverview.overdueGoals}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {teamOverview.overdueGoals > 0 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Attention Required
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      Your team has {teamOverview.overdueGoals} overdue goal{teamOverview.overdueGoals > 1 ? 's' : ''}. 
                      Please review and take action to get back on track.
                    </p>
                  </div>
                  <div className="mt-4">
                    <Link
                      to="/team-goals?filter=overdue"
                      className="text-sm font-medium text-red-800 hover:text-red-700"
                    >
                      View overdue goals →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <NoTeamState />
      )}

      {/* Team Member Cards */}
      {hasTeam && teamMembers.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
            <Link
              to="/team-goals"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Manage team goals →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member) => (
              <div key={member.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </h4>
                      <p className="text-sm text-gray-500">{member.roleTitle}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Active Goals</span>
                      <span className="font-medium text-gray-900">{member.activeGoals}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Completed</span>
                      <span className="font-medium text-gray-900">{member.completedGoals}</span>
                    </div>
                    
                    {member.overdue > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-red-500">Overdue</span>
                        <span className="font-medium text-red-600">{member.overdue}</span>
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-medium text-gray-900">{member.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(member.progressPercentage)}`}
                          style={{ width: `${member.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Last active: {formatTimestamp(member.lastActivity)}</span>
                      <Link
                        to={`/team-goals?assignee=${member.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// No Team State Component
function NoTeamState() {
  return (
    <div className="bg-white shadow rounded-lg p-6 text-center">
      <UsersIcon className="mx-auto h-12 w-12 text-gray-300" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">No team members assigned</h3>
      <p className="mt-1 text-sm text-gray-500">
        You haven't been assigned any team members yet. Contact HR or add team members to get started.
      </p>
      <div className="mt-6">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Team Members
        </button>
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
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
      </div>

      {/* Objectives skeleton */}
      <div>
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg p-5">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-2 bg-gray-200 rounded w-full mb-4"></div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team overview skeleton */}
      <div>
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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
      </div>
    </div>
  );
}

export default ManagerDashboard; 