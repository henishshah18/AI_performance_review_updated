import React from 'react';
import {
  UsersIcon,
  ChartBarIcon,
  TrophyIcon,
  ArrowRightIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { Button } from '../common/Button';

interface DepartmentSummary {
  id: string;
  name: string;
  employee_count: number;
  objectives_count: number;
  completion_rate: number;
  manager_to_ic_ratio: string;
  recent_activity: number;
}

interface DepartmentOverviewCardProps {
  department: DepartmentSummary;
  onViewDetails: () => void;
  className?: string;
}

export const DepartmentOverviewCard: React.FC<DepartmentOverviewCardProps> = ({
  department,
  onViewDetails,
  className = ''
}) => {
  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatPercentage = (value: number): string => {
    return `${Math.round(value)}%`;
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
            <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
            <p className="text-sm text-gray-600">Department</p>
          </div>
        </div>
        <Button
          onClick={onViewDetails}
          variant="outline"
          size="sm"
          className="flex items-center"
        >
          View Details
          <ArrowRightIcon className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg mx-auto mb-2">
            <UsersIcon className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{department.employee_count}</p>
          <p className="text-xs text-gray-600">Employees</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-lg mx-auto mb-2">
            <TrophyIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{department.objectives_count}</p>
          <p className="text-xs text-gray-600">Objectives</p>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Completion Rate</span>
          <span className={`text-sm font-bold ${getCompletionRateColor(department.completion_rate)}`}>
            {formatPercentage(department.completion_rate)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              department.completion_rate >= 80 ? 'bg-green-500' :
              department.completion_rate >= 60 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${department.completion_rate}%` }}
          />
        </div>
      </div>

      {/* Manager to IC Ratio */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Manager to IC Ratio</span>
          <span className="text-sm font-medium text-gray-900">{department.manager_to_ic_ratio}</span>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <ChartBarIcon className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">Recent Activity</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-sm font-medium text-gray-900">{department.recent_activity}</span>
          <span className="text-xs text-gray-500">updates</span>
        </div>
      </div>
    </div>
  );
}; 