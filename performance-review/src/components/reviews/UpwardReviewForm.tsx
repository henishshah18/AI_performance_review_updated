import React from 'react';

interface UpwardReviewFormProps {
  cycleId: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export const UpwardReviewForm: React.FC<UpwardReviewFormProps> = ({ cycleId, onSubmit, onCancel }) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Upward Review Form</h3>
      <p className="text-gray-600 mb-4">
        Review cycle: {cycleId}
      </p>
      <p className="text-gray-500 mb-6">Coming Soon - Upward review functionality will be implemented here.</p>
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

export default UpwardReviewForm;
