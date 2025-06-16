import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { useToastHelpers } from '../contexts/ToastContext';
import { UserRole, ROLE_REDIRECTS } from '../types/auth';
import FormField from '../components/forms/FormField';
import FormSelect from '../components/forms/FormSelect';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

// Validation schema
const signupSchema = Yup.object({
  first_name: Yup.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .required('First name is required'),
  last_name: Yup.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .required('Last name is required'),
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  role: Yup.string()
    .oneOf(['hr_admin', 'manager', 'individual_contributor'], 'Please select a valid role')
    .required('Role is required'),
  department_id: Yup.string()
    .notRequired(),
  manager_id: Yup.string()
    .notRequired(),
  phone: Yup.string()
    .matches(/^[+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')
    .notRequired(),
  role_title: Yup.string()
    .max(100, 'Role title must be less than 100 characters')
    .notRequired(),
});

// Role options
const roleOptions = [
  { value: 'individual_contributor', label: 'Individual Contributor' },
  { value: 'manager', label: 'Manager' },
  { value: 'hr_admin', label: 'HR Administrator' },
];

export function SignupPage() {
  const navigate = useNavigate();
  const { signup, isAuthenticated, isLoading, error, clearError, user } = useAuth();
  const { showSuccess, showError } = useToastHelpers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(ROLE_REDIRECTS[user.role], { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const formik = useFormik({
    initialValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: '' as UserRole | '',
      department_id: '',
      manager_id: '',
      phone: '',
      role_title: '',
    },
    validationSchema: signupSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const { confirmPassword, ...signupData } = values;
        // Transform the data to match backend expectations
        const backendData = {
          ...signupData,
          password_confirm: confirmPassword
        };
        await signup(backendData as any);
        
        // Show success message
        showSuccess(
          'Account created successfully!', 
          'Welcome to ReviewAI. You are now signed in.'
        );
        
        // Navigation will be handled by the useEffect above
      } catch (error: any) {
        // Show error message
        const errorMessage = error?.error?.message || error?.message || 'Failed to create account';
        showError('Signup failed', errorMessage);
        console.error('Signup error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleRetry = () => {
    clearError();
    formik.handleSubmit();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <svg
              className="h-8 w-8 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create your ReviewAI account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join your team and start managing performance reviews effectively.
          </p>
        </div>

        {/* Signup Form */}
        <form className="mt-8 space-y-6" onSubmit={formik.handleSubmit}>
          <div className="bg-white shadow-lg rounded-lg p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <ErrorMessage
                message={error}
                variant="card"
                onRetry={handleRetry}
                onDismiss={clearError}
              />
            )}

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  id="first_name"
                  name="first_name"
                  type="text"
                  label="First Name"
                  placeholder="Enter your first name"
                  value={formik.values.first_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.first_name ? formik.errors.first_name : undefined}
                  required
                  autoComplete="given-name"
                />

                <FormField
                  id="last_name"
                  name="last_name"
                  type="text"
                  label="Last Name"
                  placeholder="Enter your last name"
                  value={formik.values.last_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.last_name ? formik.errors.last_name : undefined}
                  required
                  autoComplete="family-name"
                />
              </div>

              <div className="mt-4">
                <FormField
                  id="email"
                  name="email"
                  type="email"
                  label="Email Address"
                  placeholder="Enter your work email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email ? formik.errors.email : undefined}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField
                  id="phone"
                  name="phone"
                  type="tel"
                  label="Phone Number (Optional)"
                  placeholder="Enter your phone number"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.phone ? formik.errors.phone : undefined}
                  autoComplete="tel"
                />

                <FormField
                  id="role_title"
                  name="role_title"
                  type="text"
                  label="Job Title (Optional)"
                  placeholder="e.g., Senior Developer, Product Manager"
                  value={formik.values.role_title}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.role_title ? formik.errors.role_title : undefined}
                />
              </div>
            </div>

            {/* Account Security */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Security</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  id="password"
                  name="password"
                  type="password"
                  label="Password"
                  placeholder="Create a strong password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.password ? formik.errors.password : undefined}
                  required
                  autoComplete="new-password"
                />

                <FormField
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.confirmPassword ? formik.errors.confirmPassword : undefined}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Organization Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Information</h3>
              <div className="space-y-4">
                <FormSelect
                  id="role"
                  name="role"
                  label="Role"
                  placeholder="Select your role"
                  value={formik.values.role}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  options={roleOptions}
                  error={formik.touched.role ? formik.errors.role : undefined}
                  required
                />
                
                {formik.values.role && formik.values.role !== 'hr_admin' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          Department Assignment
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>
                            After creating your account, you'll be prompted to select your department and 
                            {formik.values.role === 'individual_contributor' ? ' manager' : ' team members'} 
                            to complete your profile setup.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting || !formik.isValid}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting && (
                <LoadingSpinner size="sm" className="mr-2" />
              )}
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          {/* Sign in link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SignupPage; 