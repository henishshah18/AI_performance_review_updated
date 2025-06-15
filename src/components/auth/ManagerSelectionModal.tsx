import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { User, Department } from '../../types/auth';
import authService from '../../services/authService';
import Modal from '../common/Modal';
import FormSelect from '../forms/FormSelect';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

interface ManagerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void; // Required - will be provided by parent
}

const validationSchema = Yup.object({
  manager_id: Yup.string().required('Please select a manager to continue'),
});

export function ManagerSelectionModal({ isOpen, onClose }: ManagerSelectionModalProps) {
  const { user, assignManager, error, clearError } = useAuth();
  const [managers, setManagers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadData();
    }
  }, [isOpen, user]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      clearError();

      // Load departments first
      const departmentList = await authService.getDepartments();
      setDepartments(departmentList);

      // If user has a department, load managers for that department
      if (user?.department_id) {
        const managerList = await authService.getManagersByDepartment(user.department_id);
        setManagers(managerList);
      }
    } catch (error) {
      console.error('Failed to load manager data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      manager_id: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        await assignManager(values.manager_id);
        // Modal will close automatically when needsManagerAssignment becomes false
      } catch (error) {
        console.error('Failed to assign manager:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleDepartmentChange = async (departmentId: string) => {
    try {
      setIsLoading(true);
      const managerList = await authService.getManagersByDepartment(departmentId);
      setManagers(managerList);
      formik.setFieldValue('manager_id', ''); // Reset manager selection
    } catch (error) {
      console.error('Failed to load managers for department:', error);
      setManagers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const managerOptions = managers.map(manager => ({
    value: manager.id,
    label: `${manager.first_name} ${manager.last_name}${manager.role_title ? ` - ${manager.role_title}` : ''}`,
  }));

  const departmentOptions = departments.map(dept => ({
    value: dept.id,
    label: dept.name,
  }));

  const currentDepartment = departments.find(dept => dept.id === user?.department_id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Your Manager"
      size="md"
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
                Manager Assignment Required
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  To continue using ReviewAI, please select your direct manager. 
                  This is required for proper goal assignment and performance review workflows.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Department Info */}
        {currentDepartment && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Your Department</h4>
            <p className="text-sm text-gray-600">{currentDepartment.name}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <ErrorMessage
            message={error}
            variant="card"
            onDismiss={clearError}
          />
        )}

        {/* Form */}
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {/* Department Selection (if user doesn't have one or wants to change) */}
          {!user?.department_id && (
            <FormSelect
              id="department_id"
              name="department_id"
              label="Department"
              placeholder="Select your department"
              value={user?.department_id || ''}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              options={departmentOptions}
              required
              disabled={isLoading}
            />
          )}

          {/* Manager Selection */}
          <FormSelect
            id="manager_id"
            name="manager_id"
            label="Manager"
            placeholder={
              !user?.department_id
                ? "Please select a department first"
                : isLoading
                ? "Loading managers..."
                : managers.length === 0
                ? "No managers found in your department"
                : "Select your manager"
            }
            value={formik.values.manager_id}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            options={managerOptions}
            error={formik.touched.manager_id ? formik.errors.manager_id : undefined}
            required
            disabled={!user?.department_id || isLoading || managers.length === 0}
          />

          {/* No managers message */}
          {!isLoading && user?.department_id && managers.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    No Managers Available
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      There are no managers assigned to your department yet. 
                      Please contact your HR administrator to set up department managers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !formik.isValid || managers.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
              {isSubmitting ? 'Assigning Manager...' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default ManagerSelectionModal; 