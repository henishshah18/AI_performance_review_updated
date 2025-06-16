import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { useToastHelpers } from '../contexts/ToastContext';
import { ROLE_REDIRECTS } from '../types/auth';
import FormField from '../components/forms/FormField';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

// Validation schema
const loginSchema = Yup.object({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, error, clearError, user } = useAuth();
  const { showSuccess, showError } = useToastHelpers();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Show success message with user's first name
      if (user.first_name) {
        showSuccess('Login successful!', `Welcome back, ${user.first_name}!`);
      } else {
        showSuccess('Login successful!', 'Welcome back!');
      }
      
      const from = (location.state as any)?.from?.pathname || ROLE_REDIRECTS[user.role];
      console.log('Redirecting to:', from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location, showSuccess]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      console.log('Form submitted with values:', values);
      setIsSubmitting(true);
      try {
        console.log('Calling login function...');
        await login(values);
        console.log('Login successful');
        
        // Don't show success message or navigate here - let the useEffect handle it
        // The useEffect will trigger when isAuthenticated and user state changes
        
      } catch (error: any) {
        // Show error message
        const errorMessage = error?.error?.message || error?.message || 'Login failed';
        showError('Login failed', errorMessage);
        console.error('Login error:', error);
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
      <div className="max-w-md w-full space-y-8">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to ReviewAI
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back! Please sign in to your account.
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={formik.handleSubmit}>
          <div className="space-y-4">
            {/* Error Message */}
            {error && (
              <ErrorMessage
                message={error}
                variant="card"
                onRetry={handleRetry}
                onDismiss={clearError}
              />
            )}

            {/* Email Field */}
            <FormField
              id="email"
              name="email"
              type="email"
              label="Email Address"
              placeholder="Enter your email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email ? formik.errors.email : undefined}
              required
              autoComplete="email"
            />

            {/* Password Field */}
            <FormField
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password ? formik.errors.password : undefined}
              required
              autoComplete="current-password"
            />
          </div>

          {/* Remember me and Forgot password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting || !formik.isValid}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => {
                console.log('Button clicked');
                console.log('Form valid:', formik.isValid);
                console.log('Form errors:', formik.errors);
                console.log('Form values:', formik.values);
                console.log('Is submitting:', isSubmitting);
              }}
            >
              {isSubmitting && (
                <LoadingSpinner size="sm" className="mr-2" />
              )}
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          {/* Sign up link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                Sign up here
              </Link>
            </p>
            {/* Add logout option for testing */}
            <p className="text-xs text-gray-500 mt-2">
              Already logged in?{' '}
              <button
                onClick={() => {
                  // Clear authentication and reload page
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('refresh_token');
                  localStorage.removeItem('user');
                  window.location.reload();
                }}
                className="font-medium text-red-600 hover:text-red-500 transition-colors underline"
              >
                Logout and sign up
              </button>
            </p>
          </div>
        </form>

        {/* Demo Accounts */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-4">Demo Accounts (Development Only)</p>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="bg-gray-100 p-2 rounded">
                <strong>HR Admin:</strong> qa_hr_admin@test.com / testpass123
              </div>
              <div className="bg-gray-100 p-2 rounded">
                <strong>Manager:</strong> manager@company.com / password123
              </div>
              <div className="bg-gray-100 p-2 rounded">
                <strong>Individual:</strong> employee@company.com / password123
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage; 