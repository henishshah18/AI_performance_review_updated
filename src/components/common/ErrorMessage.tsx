import React from 'react';

export interface ErrorMessageProps {
  title?: string;
  message: string;
  variant?: 'inline' | 'card' | 'banner';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Error',
  message,
  variant = 'inline',
  size = 'md',
  showIcon = true,
  onRetry,
  onDismiss,
  className = '',
}) => {
  const ErrorIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  );

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'card':
        return 'bg-white border border-error-200 rounded-lg shadow-sm p-4';
      case 'banner':
        return 'bg-error-50 border-l-4 border-error-400 p-4';
      case 'inline':
      default:
        return 'bg-error-50 border border-error-200 rounded-md p-3';
    }
  };

  return (
    <div
      className={`${getVariantClasses()} ${sizeClasses[size]} ${className}`}
      role="alert"
    >
      <div className="flex">
        {showIcon && (
          <div className="flex-shrink-0">
            <div className="text-error-400">
              <ErrorIcon />
            </div>
          </div>
        )}
        
        <div className={`${showIcon ? 'ml-3' : ''} flex-1`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {title && (
                <h3 className="text-sm font-medium text-error-800 mb-1">
                  {title}
                </h3>
              )}
              <p className="text-sm text-error-700">
                {message}
              </p>
            </div>
            
            {onDismiss && (
              <div className="ml-4 flex-shrink-0">
                <button
                  type="button"
                  className="inline-flex text-error-400 hover:text-error-500 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2 rounded-md"
                  onClick={onDismiss}
                  aria-label="Dismiss error"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          {onRetry && (
            <div className="mt-3">
              <button
                type="button"
                className="text-sm font-medium text-error-600 hover:text-error-500 focus:outline-none focus:underline"
                onClick={onRetry}
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage; 