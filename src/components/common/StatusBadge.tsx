import React from 'react';
import { StatusType, getStatusConfig } from '../../utils/statusValidation';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'md', 
  showTooltip = true, 
  className = '' 
}) => {
  const config = getStatusConfig(status);
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };
  
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  const statusClasses = `${config.bgColor} ${config.textColor}`;
  const sizeClass = sizeClasses[size];
  
  const badgeClasses = `${baseClasses} ${statusClasses} ${sizeClass} ${className}`;
  
  const badge = (
    <span
      className={badgeClasses}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {status === 'cancelled' && (
        <span className="line-through">{config.label}</span>
      )}
      {status !== 'cancelled' && config.label}
    </span>
  );
  
  if (showTooltip) {
    return (
      <div className="relative group">
        {badge}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {config.description}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    );
  }
  
  return badge;
};

export default StatusBadge; 