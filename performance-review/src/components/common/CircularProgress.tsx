import React from 'react';

export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: 40 | 60 | 80;
  color?: 'primary' | 'success' | 'warning' | 'error';
  showText?: boolean;
  thickness?: number;
  className?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 60,
  color = 'primary',
  showText = true,
  thickness = 4,
  className = '',
}) => {
  // Ensure value is within bounds
  const normalizedValue = Math.min(Math.max(value, 0), max);
  const percentage = (normalizedValue / max) * 100;

  // Calculate circle properties
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    primary: 'text-primary-600',
    success: 'text-success-500',
    warning: 'text-warning-500',
    error: 'text-error-500',
  };

  const backgroundColorClasses = {
    primary: 'text-primary-100',
    success: 'text-success-100',
    warning: 'text-warning-100',
    error: 'text-error-100',
  };

  const textSizeClasses = {
    40: 'text-xs',
    60: 'text-sm',
    80: 'text-base',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      role="progressbar"
      aria-valuenow={normalizedValue}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`Progress: ${Math.round(percentage)}%`}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          className={backgroundColorClasses[color]}
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={`${colorClasses[color]} transition-all duration-500 ease-out`}
          style={{
            transformOrigin: 'center',
          }}
        />
      </svg>
      
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-medium text-gray-700 ${textSizeClasses[size]}`}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default CircularProgress; 