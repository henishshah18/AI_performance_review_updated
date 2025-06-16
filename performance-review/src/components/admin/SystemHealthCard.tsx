import React from 'react';
import {
  CpuChipIcon,
  UsersIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface SystemHealth {
  user_engagement_score: number;
  data_integrity_score: number;
  performance_score: number;
  recent_activity_count: number;
  active_sessions: number;
}

interface SystemHealthCardProps {
  systemHealth: SystemHealth;
  className?: string;
}

interface HealthMetric {
  label: string;
  value: number;
  icon: any;
  color: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({
  systemHealth,
  className = ''
}) => {
  const getHealthStatus = (score: number): 'excellent' | 'good' | 'warning' | 'critical' => {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'warning';
    return 'critical';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-100';
      case 'good':
        return 'text-blue-600 bg-blue-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'good':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'critical':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <CheckCircleIcon className="h-4 w-4" />;
    }
  };

  const metrics: HealthMetric[] = [
    {
      label: 'User Engagement',
      value: systemHealth.user_engagement_score,
      icon: UsersIcon,
      color: 'blue',
      status: getHealthStatus(systemHealth.user_engagement_score)
    },
    {
      label: 'Data Integrity',
      value: systemHealth.data_integrity_score,
      icon: ShieldCheckIcon,
      color: 'green',
      status: getHealthStatus(systemHealth.data_integrity_score)
    },
    {
      label: 'Performance',
      value: systemHealth.performance_score,
      icon: CpuChipIcon,
      color: 'purple',
      status: getHealthStatus(systemHealth.performance_score)
    }
  ];

  const overallHealth = Math.round(
    (systemHealth.user_engagement_score + systemHealth.data_integrity_score + systemHealth.performance_score) / 3
  );
  const overallStatus = getHealthStatus(overallHealth);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2 text-orange-600" />
          System Health
        </h2>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(overallStatus)}`}>
          {getStatusIcon(overallStatus)}
          <span className="ml-1 capitalize">{overallStatus}</span>
        </span>
      </div>

      {/* Overall Health Score */}
      <div className="text-center mb-6">
        <div className="relative">
          <div className="w-24 h-24 mx-auto">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - overallHealth / 100)}`}
                className={`transition-all duration-500 ${
                  overallStatus === 'excellent' ? 'text-green-500' :
                  overallStatus === 'good' ? 'text-blue-500' :
                  overallStatus === 'warning' ? 'text-yellow-500' :
                  'text-red-500'
                }`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">{overallHealth}%</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">Overall System Health</p>
      </div>

      {/* Individual Metrics */}
      <div className="space-y-4 mb-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`flex items-center justify-center w-8 h-8 bg-${metric.color}-100 rounded-lg`}>
                  <Icon className={`h-4 w-4 text-${metric.color}-600`} />
                </div>
                <span className="text-sm font-medium text-gray-700">{metric.label}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      metric.status === 'excellent' ? 'bg-green-500' :
                      metric.status === 'good' ? 'bg-blue-500' :
                      metric.status === 'warning' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-900 w-10 text-right">{metric.value}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{systemHealth.active_sessions}</p>
          <p className="text-xs text-gray-600">Active Sessions</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{systemHealth.recent_activity_count}</p>
          <p className="text-xs text-gray-600">Recent Activities</p>
        </div>
      </div>

      {/* Health Recommendations */}
      {overallStatus === 'warning' || overallStatus === 'critical' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                {overallStatus === 'critical' 
                  ? 'System requires immediate attention. Check individual metrics for details.'
                  : 'Some metrics need attention. Consider reviewing system performance.'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 