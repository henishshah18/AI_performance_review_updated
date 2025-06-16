import React from 'react';

interface ManagerReviewFormProps {
  cycleId: string;
  employeeId: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export const ManagerReviewForm: React.FC<ManagerReviewFormProps> = ({ cycleId, employeeId, onSubmit, onCancel }) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Manager Review Form</h3>
      <p className="text-gray-600 mb-4">
        Reviewing employee: {employeeId} for cycle: {cycleId}
      </p>
      <p className="text-gray-500 mb-6">Coming Soon - Manager review functionality will be implemented here.</p>
      <div className="flex justify-end space-x-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Submit Review
        </button>
      </div>
    </div>
  );
};

export default ManagerReviewForm;
