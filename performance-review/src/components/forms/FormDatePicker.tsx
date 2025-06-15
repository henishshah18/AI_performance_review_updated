import React from 'react';

export interface FormDatePickerProps {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  error?: string;
  helpText?: string;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const FormDatePicker: React.FC<FormDatePickerProps> = ({
  name,
  label,
  placeholder,
  required = false,
  disabled = false,
  min,
  max,
  error,
  helpText,
  className = '',
  value,
  onChange,
  onBlur,
}) => {
  const fieldId = `date-${name}`;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  const inputClasses = `
    form-input
    ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}
    ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
    ${className}
  `.trim();

  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-1">
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-error-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          id={fieldId}
          name={name}
          type="date"
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`.trim()}
        />
        
        {/* Calendar icon */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>
      
      {error && (
        <p id={errorId} className="text-sm text-error-600" role="alert">
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p id={helpId} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
};

export default FormDatePicker; 