import React from 'react';

export interface LoadingSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
  animate?: boolean;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  width,
  height,
  lines = 1,
  className = '',
  animate = true,
}) => {
  const baseClasses = `bg-gray-200 ${animate ? 'animate-pulse' : ''} ${className}`;

  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-md';
      case 'text':
        return 'rounded';
      case 'card':
        return 'rounded-xl';
      default:
        return 'rounded';
    }
  };

  const getDefaultDimensions = () => {
    switch (variant) {
      case 'circular':
        return { width: '40px', height: '40px' };
      case 'text':
        return { width: '100%', height: '1rem' };
      case 'rectangular':
        return { width: '100%', height: '200px' };
      case 'card':
        return { width: '100%', height: '300px' };
      default:
        return { width: '100%', height: '1rem' };
    }
  };

  const defaultDimensions = getDefaultDimensions();
  const finalWidth = width || defaultDimensions.width;
  const finalHeight = height || defaultDimensions.height;

  const style = {
    width: typeof finalWidth === 'number' ? `${finalWidth}px` : finalWidth,
    height: typeof finalHeight === 'number' ? `${finalHeight}px` : finalHeight,
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${getVariantClasses()}`}
            style={{
              ...style,
              width: index === lines - 1 ? '75%' : style.width, // Last line is shorter
            }}
            role="status"
            aria-label="Loading content"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${getVariantClasses()}`}
      style={style}
      role="status"
      aria-label="Loading content"
    />
  );
};

// Predefined skeleton components for common use cases
export const SkeletonText: React.FC<Omit<LoadingSkeletonProps, 'variant'>> = (props) => (
  <LoadingSkeleton {...props} variant="text" />
);

export const SkeletonCircle: React.FC<Omit<LoadingSkeletonProps, 'variant'>> = (props) => (
  <LoadingSkeleton {...props} variant="circular" />
);

export const SkeletonCard: React.FC<Omit<LoadingSkeletonProps, 'variant'>> = (props) => (
  <LoadingSkeleton {...props} variant="card" />
);

export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 56,
  };
  
  return <SkeletonCircle width={sizeMap[size]} height={sizeMap[size]} />;
};

export const SkeletonButton: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const dimensions = {
    sm: { width: '80px', height: '32px' },
    md: { width: '100px', height: '40px' },
    lg: { width: '120px', height: '48px' },
  };
  
  return (
    <LoadingSkeleton
      variant="rectangular"
      width={dimensions[size].width}
      height={dimensions[size].height}
      className="rounded-lg"
    />
  );
};

export default LoadingSkeleton; 