import React, { useState, useEffect } from 'react';
import { feedbackService } from '../../services/feedbackService';
import { Feedback, FeedbackFilters, PaginatedFeedbackResponse } from '../../types/feedback';
import FeedbackCard from './FeedbackCard';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

interface FeedbackListProps {
  title?: string;
  filters?: FeedbackFilters;
  showFilters?: boolean;
  className?: string;
}

const FeedbackList: React.FC<FeedbackListProps> = ({
  title = 'Feedback',
  filters: initialFilters = {},
  showFilters = true,
  className = '',
}) => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FeedbackFilters>(initialFilters);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
    currentPage: 1,
  });

  useEffect(() => {
    loadFeedback();
  }, [filters]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: PaginatedFeedbackResponse = await feedbackService.getFeedback(filters);
      
      setFeedback(response.results);
      setPagination({
        count: response.count,
        next: response.next,
        previous: response.previous,
        currentPage: filters.page || 1,
      });
    } catch (err) {
      console.error('Error loading feedback:', err);
      setError('Failed to load feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<FeedbackFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleFeedbackUpdate = () => {
    loadFeedback();
  };

  const totalPages = Math.ceil(pagination.count / (filters.page_size || 10));

  if (loading) {
    return (
      <div className={`flex justify-center items-center py-12 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <ErrorMessage message={error} onRetry={loadFeedback} />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {pagination.count} feedback item{pagination.count !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Feedback Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={filters.feedback_type || ''}
                onChange={(e) => handleFilterChange({ feedback_type: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="commendation">👏 Commendation</option>
                <option value="guidance">💡 Guidance</option>
                <option value="constructive">🔧 Constructive</option>
              </select>
            </div>

            {/* Visibility Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visibility
              </label>
              <select
                value={filters.visibility || ''}
                onChange={(e) => handleFilterChange({ visibility: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="public">🌐 Public</option>
                <option value="private">🔒 Private</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => handleFilterChange({ date_from: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => handleFilterChange({ date_to: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Search */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search feedback content..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange({ search: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Clear Filters */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setFilters({})}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Feedback List */}
      <div className="space-y-4">
        {feedback.length > 0 ? (
          feedback.map((item) => (
            <FeedbackCard
              key={item.id}
              feedback={item}
              onUpdate={handleFeedbackUpdate}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback found</h3>
            <p className="text-gray-600">
              {Object.keys(filters).length > 0
                ? 'Try adjusting your filters to see more results.'
                : 'No feedback has been shared yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.previous}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.next}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {(pagination.currentPage - 1) * (filters.page_size || 10) + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.currentPage * (filters.page_size || 10), pagination.count)}
                </span>{' '}
                of <span className="font-medium">{pagination.count}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.previous}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  ←
                </button>
                
                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, pagination.currentPage - 2) + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        pageNum === pagination.currentPage
                          ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.next}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  →
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackList;
