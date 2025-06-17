import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../../components/common/Modal';
import {
  FlagIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PlusIcon,
  ChartBarIcon,
  CheckCircleIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
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

interface Goal {
  id: string;
  title: string;
  description: string;
  objectiveId: string;
  objectiveTitle: string;
  assignedTo: string;
  assignedToName: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  progress: number;
  totalTasks: number;
  completedTasks: number;
  createdAt: string;
}

interface CreateGoalData {
  title: string;
  description: string;
  objectiveId: string;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
}

export function ManagerDashboard() {
  const { user } = useAuth();
  const [objectives, setObjectives] = useState<AssignedObjective[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamOverview, setTeamOverview] = useState<TeamOverview | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'objectives' | 'reviews'>('objectives');
  
  // Modal states
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false);
  const [showEditGoalModal, setShowEditGoalModal] = useState(false);
  const [showGoalDetailsModal, setShowGoalDetailsModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

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

      // Mock goals data
      setGoals([
        {
          id: '1',
          title: 'Implement User Authentication',
          description: 'Build secure login and registration system',
          objectiveId: '1',
          objectiveTitle: 'Improve Team Productivity',
          assignedTo: '1',
          assignedToName: 'Alice Johnson',
          priority: 'high',
          dueDate: '2024-11-15',
          status: 'in_progress',
          progress: 75,
          totalTasks: 8,
          completedTasks: 6,
          createdAt: '2024-10-01',
        },
        {
          id: '2',
          title: 'Setup CI/CD Pipeline',
          description: 'Automated testing and deployment pipeline',
          objectiveId: '2',
          objectiveTitle: 'Enhance Code Quality',
          assignedTo: '4',
          assignedToName: 'David Wilson',
          priority: 'high',
          dueDate: '2024-10-30',
          status: 'completed',
          progress: 100,
          totalTasks: 5,
          completedTasks: 5,
          createdAt: '2024-09-15',
        },
      ]);

      setIsLoading(false);
    };

    loadDashboardData();
  }, []);

  const createGoal = (goalData: CreateGoalData) => {
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: goalData.title,
      description: goalData.description,
      objectiveId: goalData.objectiveId,
      objectiveTitle: objectives.find(obj => obj.id === goalData.objectiveId)?.title || '',
      assignedTo: goalData.assignedTo,
      assignedToName: teamMembers.find(member => member.id === goalData.assignedTo)?.firstName + ' ' + 
                     teamMembers.find(member => member.id === goalData.assignedTo)?.lastName || '',
      priority: goalData.priority,
      dueDate: goalData.dueDate,
      status: 'not_started',
      progress: 0,
      totalTasks: 0,
      completedTasks: 0,
      createdAt: new Date().toISOString(),
    };

    setGoals(prev => [...prev, newGoal]);
    setShowCreateGoalModal(false);
  };

  const editGoal = (goalData: CreateGoalData) => {
    if (!selectedGoal) return;

    const updatedGoal: Goal = {
      ...selectedGoal,
      title: goalData.title,
      description: goalData.description,
      objectiveId: goalData.objectiveId,
      objectiveTitle: objectives.find(obj => obj.id === goalData.objectiveId)?.title || '',
      assignedTo: goalData.assignedTo,
      assignedToName: teamMembers.find(member => member.id === goalData.assignedTo)?.firstName + ' ' + 
                     teamMembers.find(member => member.id === goalData.assignedTo)?.lastName || '',
      priority: goalData.priority,
      dueDate: goalData.dueDate,
    };

    setGoals(prev => prev.map(goal => goal.id === selectedGoal.id ? updatedGoal : goal));
    setShowEditGoalModal(false);
    setSelectedGoal(null);
  };

  const deleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== goalId));
  };

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

  const renderTabContent = () => {
    if (activeTab === 'reviews') {
      return <ReviewManagement className="mt-6" />;
    }

    // Objectives tab content (existing dashboard content)
    return (
      <div className="space-y-6">
        {/* Team Performance Overview */}
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
                        {teamOverview?.totalMembers}
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
                    <FlagIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Goals
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {teamOverview?.activeGoals}
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
                        {teamOverview?.completedGoals}
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
                    <ExclamationTriangleIcon className={`h-6 w-6 ${teamOverview && teamOverview.overdueGoals > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Overdue Goals
                      </dt>
                      <dd className={`text-lg font-medium ${teamOverview && teamOverview.overdueGoals > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {teamOverview?.overdueGoals}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {teamOverview && teamOverview.overdueGoals > 0 && (
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

        {/* My Assigned Objectives */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">My Assigned Objectives</h3>
            <Link
              to="/objectives"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all objectives →
            </Link>
          </div>
          
          {objectives.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <FlagIcon className="mx-auto h-12 w-12 text-gray-300" />
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

        {/* Team Member Cards */}
        {teamMembers.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
              <Link
                to="/team-goals"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
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
                          className="text-blue-600 hover:text-blue-700 font-medium"
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

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setShowCreateGoalModal(true)}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <PlusIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Create Goal</p>
                <p className="text-xs text-gray-600">Assign new goals to team</p>
              </div>
            </button>
            <Link
              to="/analytics"
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

  if (isLoading) {
    return <DashboardSkeleton />;
  }

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
                  <FlagIcon className="h-5 w-5 mr-2" />
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

        {/* Modals */}
        <CreateGoalModal
          isOpen={showCreateGoalModal}
          onClose={() => setShowCreateGoalModal(false)}
          onSubmit={createGoal}
          objectives={objectives}
          teamMembers={teamMembers}
        />

        <EditGoalModal
          isOpen={showEditGoalModal}
          onClose={() => {
            setShowEditGoalModal(false);
            setSelectedGoal(null);
          }}
          onSubmit={editGoal}
          objectives={objectives}
          teamMembers={teamMembers}
          goal={selectedGoal}
        />

        <GoalDetailsModal
          isOpen={showGoalDetailsModal}
          onClose={() => {
            setShowGoalDetailsModal(false);
            setSelectedGoal(null);
          }}
          goal={selectedGoal}
        />
      </div>
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

// Modal Components

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGoalData) => void;
  objectives: AssignedObjective[];
  teamMembers: TeamMember[];
}

function CreateGoalModal({ isOpen, onClose, onSubmit, objectives, teamMembers }: CreateGoalModalProps) {
  const [formData, setFormData] = useState<CreateGoalData>({
    title: '',
    description: '',
    objectiveId: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.objectiveId || !formData.assignedTo || !formData.dueDate) {
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    onSubmit(formData);
    setFormData({
      title: '',
      description: '',
      objectiveId: '',
      assignedTo: '',
      priority: 'medium',
      dueDate: '',
    });
    setIsSubmitting(false);
  };

  const handleInputChange = (field: keyof CreateGoalData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Goal"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Goal Title*
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Enter goal title (max 100 characters)"
            maxLength={100}
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Enter goal description (max 500 characters)"
            maxLength={500}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="objectiveId" className="block text-sm font-medium text-gray-700">
              Parent Objective*
            </label>
            <select
              id="objectiveId"
              value={formData.objectiveId}
              onChange={(e) => handleInputChange('objectiveId', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              required
            >
              <option value="">Select objective</option>
              {objectives.filter(obj => obj.status === 'active').map((objective) => (
                <option key={objective.id} value={objective.id}>
                  {objective.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
              Assign to Team Member*
            </label>
            <select
              id="assignedTo"
              value={formData.assignedTo}
              onChange={(e) => handleInputChange('assignedTo', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              required
            >
              <option value="">Select team member</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.firstName} {member.lastName} - {member.roleTitle}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value as 'low' | 'medium' | 'high')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
              Due Date*
            </label>
            <input
              type="date"
              id="dueDate"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              max={formData.objectiveId ? objectives.find(obj => obj.id === formData.objectiveId)?.dueDate : ''}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              required
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formData.title || !formData.objectiveId || !formData.assignedTo || !formData.dueDate}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Goal'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGoalData) => void;
  objectives: AssignedObjective[];
  teamMembers: TeamMember[];
  goal: Goal | null;
}

function EditGoalModal({ isOpen, onClose, onSubmit, objectives, teamMembers, goal }: EditGoalModalProps) {
  const [formData, setFormData] = useState<CreateGoalData>({
    title: '',
    description: '',
    objectiveId: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title,
        description: goal.description,
        objectiveId: goal.objectiveId,
        assignedTo: goal.assignedTo,
        priority: goal.priority,
        dueDate: goal.dueDate,
      });
    }
  }, [goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.objectiveId || !formData.assignedTo || !formData.dueDate) {
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    onSubmit(formData);
    setIsSubmitting(false);
  };

  const handleInputChange = (field: keyof CreateGoalData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Goal"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700">
            Goal Title*
          </label>
          <input
            type="text"
            id="edit-title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Enter goal title (max 100 characters)"
            maxLength={100}
            required
          />
        </div>

        <div>
          <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="edit-description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Enter goal description (max 500 characters)"
            maxLength={500}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="edit-objectiveId" className="block text-sm font-medium text-gray-700">
              Parent Objective*
            </label>
            <select
              id="edit-objectiveId"
              value={formData.objectiveId}
              onChange={(e) => handleInputChange('objectiveId', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              required
            >
              <option value="">Select objective</option>
              {objectives.filter(obj => obj.status === 'active').map((objective) => (
                <option key={objective.id} value={objective.id}>
                  {objective.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="edit-assignedTo" className="block text-sm font-medium text-gray-700">
              Assign to Team Member*
            </label>
            <select
              id="edit-assignedTo"
              value={formData.assignedTo}
              onChange={(e) => handleInputChange('assignedTo', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              required
            >
              <option value="">Select team member</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.firstName} {member.lastName} - {member.roleTitle}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="edit-priority" className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              id="edit-priority"
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value as 'low' | 'medium' | 'high')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label htmlFor="edit-dueDate" className="block text-sm font-medium text-gray-700">
              Due Date*
            </label>
            <input
              type="date"
              id="edit-dueDate"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              max={formData.objectiveId ? objectives.find(obj => obj.id === formData.objectiveId)?.dueDate : ''}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              required
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formData.title || !formData.objectiveId || !formData.assignedTo || !formData.dueDate}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Updating...' : 'Update Goal'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface GoalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
}

function GoalDetailsModal({ isOpen, onClose, goal }: GoalDetailsModalProps) {
  if (!goal) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Goal Details"
      size="lg"
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{goal.title}</h3>
          <div className="mt-2 flex items-center space-x-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              goal.priority === 'high' 
                ? 'bg-red-100 text-red-800' 
                : goal.priority === 'medium' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {goal.priority} priority
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              goal.status === 'completed' 
                ? 'bg-green-100 text-green-800'
                : goal.status === 'in_progress' 
                ? 'bg-blue-100 text-blue-800'
                : goal.status === 'overdue'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {goal.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700">Description</h4>
          <p className="mt-1 text-sm text-gray-600">
            {goal.description || 'No description provided'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Parent Objective</h4>
            <p className="mt-1 text-sm text-gray-600">{goal.objectiveTitle}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700">Assigned To</h4>
            <p className="mt-1 text-sm text-gray-600">{goal.assignedToName}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700">Due Date</h4>
            <p className="mt-1 text-sm text-gray-600">
              {new Date(goal.dueDate).toLocaleDateString()}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700">Created</h4>
            <p className="mt-1 text-sm text-gray-600">
              {new Date(goal.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700">Progress</h4>
          <div className="mt-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Overall Progress</span>
              <span className="font-medium text-gray-900">{goal.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  goal.progress >= 80 ? 'bg-green-500' : 
                  goal.progress >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${goal.progress}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-sm text-gray-500">
              <span>Tasks: {goal.completedTasks}/{goal.totalTasks}</span>
              <span>
                {goal.totalTasks - goal.completedTasks} remaining
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ManagerDashboard; 