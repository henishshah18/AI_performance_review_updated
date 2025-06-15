import React from 'react';

export interface FormCheckboxProps {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const FormCheckbox: React.FC<FormCheckboxProps> = ({
  name,
  label,
  description,
  required = false,
  disabled = false,
  error,
  className = '',
  checked = false,
  onChange,
  onBlur,
}) => {
  const fieldId = `checkbox-${name}`;
  const errorId = `${fieldId}-error`;
  const descId = `${fieldId}-description`;

  const checkboxClasses = `
    form-checkbox
    ${error ? 'border-error-500 text-error-600 focus:border-error-500 focus:ring-error-500' : ''}
    ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
    ${className}
  `.trim();

  return (
    <div className="space-y-1">
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id={fieldId}
            name={name}
            type="checkbox"
            required={required}
            disabled={disabled}
            checked={checked}
            onChange={onChange}
            onBlur={onBlur}
            className={checkboxClasses}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={`${error ? errorId : ''} ${description ? descId : ''}`.trim()}
          />
        </div>
        
        <div className="ml-3 text-sm">
          <label
            htmlFor={fieldId}
            className={`font-medium text-gray-700 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
          
          {description && (
            <p id={descId} className="text-gray-500 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      
      {error && (
        <p id={errorId} className="text-sm text-error-600 ml-8" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormCheckbox; 