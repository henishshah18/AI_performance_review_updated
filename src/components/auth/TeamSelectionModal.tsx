import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types/auth';
import authService from '../../services/authService';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

interface TeamSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const validationSchema = Yup.object({
  member_ids: Yup.array()
    .of(Yup.string())
    .min(0, 'You can select team members or skip for now'),
});

export function TeamSelectionModal({ isOpen, onClose }: TeamSelectionModalProps) {
  const { user, assignTeamMembers, error, clearError } = useAuth();
  const [availableMembers, setAvailableMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadAvailableMembers();
    }
  }, [isOpen, user]);

  const loadAvailableMembers = async () => {
    try {
      setIsLoading(true);
      clearError();

      // Load unassigned individual contributors from the same department
      const unassignedMembers = await authService.getUnassignedIndividuals(user?.department_id);
      setAvailableMembers(unassignedMembers);
    } catch (error) {
      console.error('Failed to load available team members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      member_ids: [] as string[],
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        if (values.member_ids.length > 0) {
          await assignTeamMembers(values.member_ids);
        }
        onClose();
      } catch (error) {
        console.error('Failed to assign team members:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleMemberToggle = (memberId: string) => {
    const currentIds = formik.values.member_ids;
    const newIds = currentIds.includes(memberId)
      ? currentIds.filter(id => id !== memberId)
      : [...currentIds, memberId];
    
    formik.setFieldValue('member_ids', newIds);
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Build Your Team"
      size="lg"
      closeOnBackdropClick={false}
      closeOnEscape={false}
    >
      <div className="space-y-6">
        {/* Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Team Assignment (Optional)
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Select team members from your department who will report to you. 
                  You can skip this step and add team members later from your dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <ErrorMessage
            message={error}
            variant="card"
            onDismiss={clearError}
          />
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600">Loading available team members...</span>
          </div>
        )}

        {/* No Available Members */}
        {!isLoading && availableMembers.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No Available Team Members
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              There are no unassigned individual contributors in your department at the moment. 
              You can add team members later when new employees join.
            </p>
          </div>
        )}

        {/* Available Members List */}
        {!isLoading && availableMembers.length > 0 && (
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Available Team Members ({availableMembers.length})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleMemberToggle(member.id)}
                  >
                    <input
                      type="checkbox"
                      checked={formik.values.member_ids.includes(member.id)}
                      onChange={() => handleMemberToggle(member.id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                          {member.role_title && (
                            <p className="text-xs text-gray-400">{member.role_title}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Available
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Count */}
            {formik.values.member_ids.length > 0 && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                <p className="text-sm text-primary-800">
                  <strong>{formik.values.member_ids.length}</strong> team member{formik.values.member_ids.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={handleSkip}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Skip for Now
              </button>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
                  {isSubmitting 
                    ? 'Assigning Team...' 
                    : formik.values.member_ids.length > 0 
                    ? `Add ${formik.values.member_ids.length} Team Member${formik.values.member_ids.length !== 1 ? 's' : ''}`
                    : 'Continue'
                  }
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Skip Button for No Members Case */}
        {!isLoading && availableMembers.length === 0 && (
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleSkip}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default TeamSelectionModal; 