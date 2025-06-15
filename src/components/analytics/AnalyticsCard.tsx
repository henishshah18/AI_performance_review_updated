import React from 'react';
import { AnalyticsCardProps } from '../../types/analytics';

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'blue',
  loading = false
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-900'
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600'
  };

  const trendColorClasses = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-gray-600'
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    stable: '→'
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
          <div className="text-2xl font-bold mb-1">
            {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trendColorClasses[trend.direction]}`}>
              <span className="mr-1">{trendIcons[trend.direction]}</span>
              <span className="font-medium">
                {trend.percentage > 0 ? '+' : ''}{trend.percentage.toFixed(1)}%
              </span>
              <span className="text-gray-500 ml-1">vs {trend.period}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`text-3xl ${iconColorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsCard; 