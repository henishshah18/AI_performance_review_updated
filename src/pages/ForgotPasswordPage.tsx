import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import authService from '../services/authService';
import FormField from '../components/forms/FormField';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

// Validation schema
const forgotPasswordSchema = Yup.object({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
});

export function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: forgotPasswordSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      setError(null);
      
      try {
        await authService.requestPasswordReset(values);
        setIsSuccess(true);
      } catch (error: any) {
        setError(error.error?.message || error.message || 'Failed to send reset email');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleRetry = () => {
    setError(null);
    formik.handleSubmit();
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Check your email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              We've sent a password reset link to <strong>{formik.values.email}</strong>
            </p>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-6 space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                What's next?
              </h3>
              <div className="space-y-3 text-sm text-gray-600 text-left">
                <div className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                    1
                  </span>
                  <p>Check your email inbox (and spam folder)</p>
                </div>
                <div className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                    2
                  </span>
                  <p>Click the password reset link in the email</p>
                </div>
                <div className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                    3
                  </span>
                  <p>Create a new password and sign in</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => formik.handleSubmit()}
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
                  Resend email
                </button>
                
                <Link
                  to="/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => formik.handleSubmit()}
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                try again
              </button>
            </p>
          </div>
        </div>
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
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Forgot your password?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            No worries! Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {/* Reset Form */}
        <form className="mt-8 space-y-6" onSubmit={formik.handleSubmit}>
          <div className="space-y-4">
            {/* Error Message */}
            {error && (
              <ErrorMessage
                message={error}
                variant="card"
                onRetry={handleRetry}
                onDismiss={() => setError(null)}
              />
            )}

            {/* Email Field */}
            <FormField
              id="email"
              name="email"
              type="email"
              label="Email Address"
              placeholder="Enter your email address"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email ? formik.errors.email : undefined}
              required
              autoComplete="email"
              autoFocus
            />
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
              {isSubmitting ? 'Sending reset link...' : 'Send reset link'}
            </button>
          </div>

          {/* Back to login link */}
          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              ← Back to Sign In
            </Link>
          </div>
        </form>

        {/* Help Section */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Still having trouble?{' '}
            <a
              href="mailto:support@reviewai.com"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage; 