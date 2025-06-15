import React from 'react';

export interface FormTextareaProps {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
}

const FormTextarea: React.FC<FormTextareaProps> = ({
  name,
  label,
  placeholder,
  required = false,
  disabled = false,
  rows = 4,
  maxLength,
  showCharCount = false,
  error,
  helpText,
  className = '',
  value = '',
  onChange,
  onBlur,
}) => {
  const fieldId = `textarea-${name}`;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;
  const charCountId = `${fieldId}-char-count`;

  const textareaClasses = `
    form-textarea
    ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}
    ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
    ${className}
  `.trim();

  const currentLength = value?.length || 0;
  const isNearLimit = maxLength && currentLength > maxLength * 0.8;
  const isOverLimit = maxLength && currentLength > maxLength;

  return (
    <div className="space-y-1">
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-error-500 ml-1">*</span>}
      </label>
      
      <textarea
        id={fieldId}
        name={name}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={textareaClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={`
          ${error ? errorId : ''} 
          ${helpText ? helpId : ''} 
          ${showCharCount ? charCountId : ''}
        `.trim()}
      />
      
      {showCharCount && maxLength && (
        <div
          id={charCountId}
          className={`text-sm text-right ${
            isOverLimit
              ? 'text-error-600'
              : isNearLimit
              ? 'text-warning-600'
              : 'text-gray-500'
          }`}
        >
          {currentLength}/{maxLength}
        </div>
      )}
      
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

export default FormTextarea; 