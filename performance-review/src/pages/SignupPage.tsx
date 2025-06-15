import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, Department, ROLE_REDIRECTS } from '../types/auth';
import authService from '../services/authService';
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
    .required('Department is required'),
  manager_id: Yup.string()
    .when('role', {
      is: 'individual_contributor',
      then: (schema) => schema.required('Manager is required for Individual Contributors'),
      otherwise: (schema) => schema.notRequired(),
    }),
  phone: Yup.string()
    .matches(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingManagers, setLoadingManagers] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(ROLE_REDIRECTS[user.role], { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Load departments on component mount
  useEffect(() => {
    loadDepartments();
  }, []);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const departmentList = await authService.getDepartments();
      setDepartments(departmentList);
    } catch (error) {
      console.error('Failed to load departments:', error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const loadManagers = async (departmentId: string) => {
    try {
      setLoadingManagers(true);
      const managerList = await authService.getManagersByDepartment(departmentId);
      setManagers(managerList);
    } catch (error) {
      console.error('Failed to load managers:', error);
      setManagers([]);
    } finally {
      setLoadingManagers(false);
    }
  };

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
        await signup(signupData as any);
        // Navigation will be handled by the useEffect above
      } catch (error) {
        // Error is handled by the auth context
        console.error('Signup error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Handle department change
  useEffect(() => {
    if (formik.values.department_id && formik.values.role === 'individual_contributor') {
      loadManagers(formik.values.department_id);
      formik.setFieldValue('manager_id', ''); // Reset manager selection
    }
  }, [formik.values.department_id, formik.values.role]);

  // Handle role change
  useEffect(() => {
    if (formik.values.role !== 'individual_contributor') {
      formik.setFieldValue('manager_id', ''); // Clear manager if not individual contributor
      setManagers([]);
    }
  }, [formik.values.role]);

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

  const departmentOptions = departments.map(dept => ({
    value: dept.id,
    label: dept.name,
  }));

  const managerOptions = managers.map(manager => ({
    value: manager.id,
    label: `${manager.first_name} ${manager.last_name} (${manager.role_title || 'Manager'})`,
  }));

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

                <FormSelect
                  id="department_id"
                  name="department_id"
                  label="Department"
                  placeholder={loadingDepartments ? "Loading departments..." : "Select your department"}
                  value={formik.values.department_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  options={departmentOptions}
                  error={formik.touched.department_id ? formik.errors.department_id : undefined}
                  required
                  disabled={loadingDepartments}
                />

                {formik.values.role === 'individual_contributor' && (
                  <FormSelect
                    id="manager_id"
                    name="manager_id"
                    label="Manager"
                    placeholder={
                      !formik.values.department_id
                        ? "Please select a department first"
                        : loadingManagers
                        ? "Loading managers..."
                        : "Select your manager"
                    }
                    value={formik.values.manager_id}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    options={managerOptions}
                    error={formik.touched.manager_id ? formik.errors.manager_id : undefined}
                    required
                    disabled={!formik.values.department_id || loadingManagers}
                  />
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