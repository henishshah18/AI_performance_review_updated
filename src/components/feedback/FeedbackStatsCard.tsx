import React from 'react';

interface FeedbackStatsCardProps {
  title: string;
  value: number;
  icon: string;
  color: 'blue' | 'green' | 'emerald' | 'orange' | 'purple' | 'red';
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const FeedbackStatsCard: React.FC<FeedbackStatsCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle,
  trend,
}) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'green':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'orange':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'purple':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'red':
        return 'bg-red-50 text-red-600 border-red-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const colorClasses = getColorClasses(color);

  return (
    <div className={`rounded-lg border p-6 ${colorClasses}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{icon}</div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center text-sm ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <span className="mr-1">
              {trend.isPositive ? '↗️' : '↘️'}
            </span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackStatsCard; 