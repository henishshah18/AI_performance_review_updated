import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  FlagIcon,
  UsersIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

// Types based on user journey document
interface Objective {
  id: string;
  title: string;
  description: string;
  owner: string[];
  department: string[];
  progress: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  timeline: 'quarterly' | 'annual';
  startDate: string;
  endDate: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  updatedAt: string;
}

interface CreateObjectiveData {
  title: string;
  description: string;
  assignedManagers: string[];
  timelineType: 'quarterly' | 'annual';
  startDate: string;
  endDate: string;
  departmentScope: string[];
  priority: 'high' | 'medium' | 'low';
  successMetrics: string;
}

export function ObjectivesManagement() {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    department: 'all',
    owner: 'all',
    timeline: 'all',
    search: '',
  });

  useEffect(() => {
    loadObjectives();
  }, []);

  const loadObjectives = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockObjectives: Objective[] = [
        {
          id: '1',
          title: 'Improve Customer Satisfaction Score',
          description: 'Increase overall customer satisfaction score by 15% through improved service quality and response times',
          owner: ['Sarah Johnson', 'Mike Chen'],
          department: ['Customer Success', 'Engineering'],
          progress: 72,
          status: 'active',
          timeline: 'quarterly',
          startDate: '2024-01-01',
          endDate: '2024-03-31',
          priority: 'high',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-02-15T10:30:00Z',
        },
        {
          id: '2',
          title: 'Launch Mobile App Beta',
          description: 'Successfully launch and test mobile application beta version with 1000+ users',
          owner: ['Alex Rivera'],
          department: ['Product', 'Engineering'],
          progress: 45,
          status: 'active',
          timeline: 'quarterly',
          startDate: '2024-02-01',
          endDate: '2024-04-30',
          priority: 'high',
          createdAt: '2024-02-01T00:00:00Z',
          updatedAt: '2024-02-20T14:15:00Z',
        },
        {
          id: '3',
          title: 'Expand Market Presence',
          description: 'Enter 3 new geographical markets and establish local partnerships',
          owner: ['Emma Davis'],
          department: ['Marketing', 'Sales'],
          progress: 30,
          status: 'active',
          timeline: 'annual',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          priority: 'medium',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-02-10T09:45:00Z',
        },
        {
          id: '4',
          title: 'Implement AI-Powered Analytics',
          description: 'Deploy machine learning models for predictive analytics across all departments',
          owner: ['David Kim'],
          department: ['Engineering', 'Data Science'],
          progress: 85,
          status: 'active',
          timeline: 'quarterly',
          startDate: '2023-10-01',
          endDate: '2023-12-31',
          priority: 'medium',
          createdAt: '2023-10-01T00:00:00Z',
          updatedAt: '2024-02-25T16:20:00Z',
        },
        {
          id: '5',
          title: 'Q3 Revenue Growth Initiative',
          description: 'Achieve 25% revenue growth through new product launches and market expansion',
          owner: ['Lisa Wang'],
          department: ['Sales', 'Product'],
          progress: 100,
          status: 'completed',
          timeline: 'quarterly',
          startDate: '2023-07-01',
          endDate: '2023-09-30',
          priority: 'high',
          createdAt: '2023-07-01T00:00:00Z',
          updatedAt: '2023-10-01T12:00:00Z',
        },
      ];
      
      setObjectives(mockObjectives);
    } catch (error) {
      console.error('Failed to load objectives:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create a new objective
  const createObjective = (formData: CreateObjectiveData) => {
    const newObjective: Objective = {
      id: Date.now().toString(), // Simple ID generation for demo
      title: formData.title,
      description: formData.description,
      owner: formData.assignedManagers.length > 0 ? formData.assignedManagers : ['Current User'],
      department: formData.departmentScope.length > 0 ? formData.departmentScope : ['General'],
      progress: 0,
      status: 'draft',
      timeline: formData.timelineType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      priority: formData.priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setObjectives(prev => [newObjective, ...prev]);
  };

  // Function to duplicate an objective
  const duplicateObjective = (objective: Objective) => {
    const duplicatedObjective: Objective = {
      ...objective,
      id: Date.now().toString(),
      title: `${objective.title} (Copy)`,
      status: 'draft',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setObjectives(prev => [duplicatedObjective, ...prev]);
  };

  // Function to delete an objective
  const deleteObjective = (objectiveId: string) => {
    if (window.confirm('Are you sure you want to delete this objective? This action cannot be undone.')) {
      setObjectives(prev => prev.filter(obj => obj.id !== objectiveId));
    }
  };

  // Function to edit an objective
  const editObjective = (objective: Objective) => {
    setSelectedObjective(objective);
    setShowEditModal(true);
  };

  const getStatusBadge = (status: Objective['status']) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      active: { color: 'bg-blue-100 text-blue-800', label: 'Active' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
    };
    
    const config = statusConfig[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: Objective['priority']) => {
    const priorityConfig = {
      high: { color: 'bg-red-100 text-red-800', label: 'High' },
      medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
      low: { color: 'bg-green-100 text-green-800', label: 'Low' },
    };
    
    const config = priorityConfig[priority];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const filteredObjectives = objectives.filter(objective => {
    if (filters.status !== 'all' && objective.status !== filters.status) return false;
    if (filters.timeline !== 'all' && objective.timeline !== filters.timeline) return false;
    if (filters.search && !objective.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const handleCreateObjective = () => {
    setShowCreateModal(true);
  };

  const handleViewDetails = (objective: Objective) => {
    setSelectedObjective(objective);
    setShowDetailsModal(true);
  };

  if (isLoading) {
    return <ObjectivesLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Company Objectives Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Create, manage, and track company-wide objectives and their progress
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={handleCreateObjective}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create New Objective
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search objectives..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Timeline Filter */}
            <select
              value={filters.timeline}
              onChange={(e) => setFilters({ ...filters, timeline: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            >
              <option value="all">All Timeline</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>

            {/* Department Filter */}
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            >
              <option value="all">All Departments</option>
              <option value="engineering">Engineering</option>
              <option value="product">Product</option>
              <option value="marketing">Marketing</option>
              <option value="sales">Sales</option>
              <option value="customer-success">Customer Success</option>
            </select>

            {/* Owner Filter */}
            <select
              value={filters.owner}
              onChange={(e) => setFilters({ ...filters, owner: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            >
              <option value="all">All Owners</option>
              <option value="sarah-johnson">Sarah Johnson</option>
              <option value="mike-chen">Mike Chen</option>
              <option value="alex-rivera">Alex Rivera</option>
              <option value="emma-davis">Emma Davis</option>
              <option value="david-kim">David Kim</option>
            </select>
          </div>
        </div>
      </div>

      {/* Objectives Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Objectives ({filteredObjectives.length})
            </h3>
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">
                {filteredObjectives.length} of {objectives.length} objectives
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner(s)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timeline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredObjectives.map((objective) => (
                  <tr key={objective.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <FlagIcon className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {objective.title}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {objective.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {objective.owner.map((owner, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {owner}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {objective.department.map((dept, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {dept}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-900 font-medium">{objective.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                objective.progress >= 80 ? 'bg-green-500' :
                                objective.progress >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${objective.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(objective.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900 capitalize">
                          {objective.timeline}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(objective.startDate).toLocaleDateString()} - {new Date(objective.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(objective)}
                          className="text-purple-600 hover:text-purple-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => editObjective(objective)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => duplicateObjective(objective)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Duplicate"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteObjective(objective.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredObjectives.length === 0 && (
            <div className="text-center py-12">
              <FlagIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No objectives found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.search || filters.status !== 'all' || filters.timeline !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by creating your first company objective.'}
              </p>
              {(!filters.search && filters.status === 'all' && filters.timeline === 'all') && (
                <div className="mt-6">
                  <button
                    onClick={handleCreateObjective}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create New Objective
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Objective Modal */}
      {showCreateModal && (
        <CreateObjectiveModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadObjectives();
          }}
          onCreateObjective={createObjective}
        />
      )}

      {/* Objective Details Modal */}
      {showDetailsModal && selectedObjective && (
        <ObjectiveDetailsModal
          objective={selectedObjective}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedObjective(null);
          }}
        />
      )}

      {/* Edit Objective Modal */}
      {showEditModal && selectedObjective && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Objective</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedObjective(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="text-center py-8">
                <PencilIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Edit Functionality</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Edit objective functionality will be implemented in the next phase.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedObjective(null);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Create Objective Modal Component
function CreateObjectiveModal({ onClose, onSuccess, onCreateObjective }: { onClose: () => void; onSuccess: () => void; onCreateObjective: (formData: CreateObjectiveData) => void }) {
  const [formData, setFormData] = useState<CreateObjectiveData>({
    title: '',
    description: '',
    assignedManagers: [],
    timelineType: 'quarterly',
    startDate: '',
    endDate: '',
    departmentScope: [],
    priority: 'medium',
    successMetrics: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      onCreateObjective(formData);
      onSuccess();
    } catch (error) {
      console.error('Failed to create objective:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create New Objective</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Objective Title *
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Enter objective title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Describe the objective..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Assigned Managers
                </label>
                <select
                  multiple
                  value={formData.assignedManagers}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({ ...formData, assignedManagers: values });
                  }}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  size={3}
                >
                  <option value="Sarah Johnson">Sarah Johnson</option>
                  <option value="Mike Chen">Mike Chen</option>
                  <option value="Alex Rivera">Alex Rivera</option>
                  <option value="Emma Davis">Emma Davis</option>
                  <option value="David Kim">David Kim</option>
                  <option value="Lisa Wang">Lisa Wang</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Department Scope
                </label>
                <select
                  multiple
                  value={formData.departmentScope}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({ ...formData, departmentScope: values });
                  }}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  size={3}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Customer Success">Customer Success</option>
                  <option value="Data Science">Data Science</option>
                  <option value="HR">HR</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Timeline Type *
                </label>
                <select
                  required
                  value={formData.timelineType}
                  onChange={(e) => setFormData({ ...formData, timelineType: e.target.value as 'quarterly' | 'annual' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                >
                  <option value="quarterly">Quarterly (3 months)</option>
                  <option value="annual">Annual (12 months)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Priority Level
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'high' | 'medium' | 'low' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Success Metrics (Optional)
              </label>
              <textarea
                rows={2}
                value={formData.successMetrics}
                onChange={(e) => setFormData({ ...formData, successMetrics: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Define measurable success criteria..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Objective'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Objective Details Modal Component
function ObjectiveDetailsModal({ objective, onClose }: { objective: Objective; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Objective Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Basic Information</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Title:</span>
                  <p className="text-sm text-gray-900 mt-1">{objective.title}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Description:</span>
                  <p className="text-sm text-gray-900 mt-1">{objective.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        objective.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        objective.status === 'completed' ? 'bg-green-100 text-green-800' :
                        objective.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {objective.status.charAt(0).toUpperCase() + objective.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Priority:</span>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        objective.priority === 'high' ? 'bg-red-100 text-red-800' :
                        objective.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {objective.priority.charAt(0).toUpperCase() + objective.priority.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Overview */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Progress Overview</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">Overall Progress</span>
                  <span className="text-sm font-medium text-gray-900">{objective.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      objective.progress >= 80 ? 'bg-green-500' :
                      objective.progress >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${objective.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Timeline and Assignments */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Timeline</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Type:</span>
                    <span className="text-sm text-gray-900 capitalize">{objective.timeline}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Start Date:</span>
                    <span className="text-sm text-gray-900">{new Date(objective.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">End Date:</span>
                    <span className="text-sm text-gray-900">{new Date(objective.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Assignments</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Assigned Managers:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {objective.owner.map((owner, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {owner}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Departments:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {objective.department.map((dept, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Close
              </button>
              <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                Edit Objective
              </button>
              <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton component
function ObjectivesLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="mt-4 md:mt-0">
          <div className="h-10 bg-gray-200 rounded w-40"></div>
        </div>
      </div>

      {/* Filters skeleton */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-7 gap-4">
              {[...Array(7)].map((_, j) => (
                <div key={j} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ObjectivesManagement; 