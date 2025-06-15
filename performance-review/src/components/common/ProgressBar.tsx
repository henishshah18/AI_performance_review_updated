import React from 'react';

export interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'compact' | 'standard';
  color?: 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
  label?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'standard',
  color = 'primary',
  showLabel = false,
  animated = true,
  className = '',
  label,
}) => {
  // Ensure value is within bounds
  const normalizedValue = Math.min(Math.max(value, 0), max);
  const percentage = (normalizedValue / max) * 100;

  const sizeClasses = {
    compact: 'h-2',
    standard: 'h-3',
  };

  const colorClasses = {
    primary: 'bg-primary-600',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
  };

  const backgroundColorClasses = {
    primary: 'bg-primary-100',
    success: 'bg-success-100',
    warning: 'bg-warning-100',
    error: 'bg-error-100',
  };

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">
            {label || 'Progress'}
          </span>
          {showLabel && (
            <span className="text-sm text-gray-500">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div
        className={`
          progress-bar
          ${sizeClasses[size]}
          ${backgroundColorClasses[color]}
          rounded-full
          overflow-hidden
        `}
        role="progressbar"
        aria-valuenow={normalizedValue}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progress: ${Math.round(percentage)}%`}
      >
        <div
          className={`
            progress-fill
            ${sizeClasses[size]}
            ${colorClasses[color]}
            rounded-full
            ${animated ? 'transition-all duration-500 ease-out' : ''}
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar; 