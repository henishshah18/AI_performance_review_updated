import React from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface FormSelectProps {
  name: string;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  multiple?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
  value?: string | string[] | number | number[];
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
}

const FormSelect: React.FC<FormSelectProps> = ({
  name,
  label,
  options,
  placeholder,
  required = false,
  disabled = false,
  multiple = false,
  error,
  helpText,
  className = '',
  value,
  onChange,
  onBlur,
}) => {
  const fieldId = `select-${name}`;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  const selectClasses = `
    form-select
    ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}
    ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
    ${className}
  `.trim();

  return (
    <div className="space-y-1">
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-error-500 ml-1">*</span>}
      </label>
      
      <select
        id={fieldId}
        name={name}
        required={required}
        disabled={disabled}
        multiple={multiple}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={selectClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`.trim()}
      >
        {placeholder && !multiple && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
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

export default FormSelect; 