import React, { useEffect } from 'react';
import { Toast as ToastType, useToast } from '../../contexts/ToastContext';

// Icons (using simple SVG icons since we can't import Heroicons yet)
const CheckIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const ExclamationIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);

interface ToastItemProps {
  toast: ToastType;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast }) => {
  const { removeToast } = useToast();

  const getToastStyles = (type: ToastType['type']) => {
    switch (type) {
      case 'success':
        return {
          containerClass: 'toast-success',
          iconClass: 'text-success-500',
          icon: <CheckIcon />
        };
      case 'error':
        return {
          containerClass: 'toast-error',
          iconClass: 'text-error-500',
          icon: <XIcon />
        };
      case 'warning':
        return {
          containerClass: 'toast-warning',
          iconClass: 'text-warning-500',
          icon: <ExclamationIcon />
        };
      case 'info':
        return {
          containerClass: 'toast-info',
          iconClass: 'text-primary-500',
          icon: <InfoIcon />
        };
      default:
        return {
          containerClass: 'toast-info',
          iconClass: 'text-gray-500',
          icon: <InfoIcon />
        };
    }
  };

  const { containerClass, iconClass, icon } = getToastStyles(toast.type);

  return (
    <div className={`toast ${containerClass} animate-slide-in`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${iconClass}`}>
            {icon}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {toast.title}
            </p>
            {toast.message && (
              <p className="mt-1 text-sm text-gray-500">
                {toast.message}
              </p>
            )}
            {toast.action && (
              <div className="mt-3">
                <button
                  type="button"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:underline"
                  onClick={toast.action.onClick}
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              type="button"
              className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-md"
              onClick={() => removeToast(toast.id)}
            >
              <span className="sr-only">Close</span>
              <XIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Toast Container Component
const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-4 w-full max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default ToastContainer; 