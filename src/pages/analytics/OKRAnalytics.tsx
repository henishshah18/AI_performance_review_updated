import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import analyticsService from '../../services/analyticsService';
import AnalyticsCard from '../../components/analytics/AnalyticsCard';
import AnalyticsChart from '../../components/analytics/AnalyticsChart';
import {
  OKRCompletionRates,
  TrendAnalysis,
  DepartmentPerformance,
  AnalyticsFilters,
  ChartDataPoint,
  TimeSeriesDataPoint
} from '../../types/analytics';

const OKRAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [completionRates, setCompletionRates] = useState<OKRCompletionRates | null>(null);
  const [progressTrends, setProgressTrends] = useState<TrendAnalysis | null>(null);
  const [departmentComparison, setDepartmentComparison] = useState<DepartmentPerformance | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    ...analyticsService.getDefaultDateRange(30)
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'departments' | 'individual'>('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [filters]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Load completion rates for all users
      const completionData = await analyticsService.getOKRCompletionRates(filters);
      setCompletionRates(completionData);

      // Load progress trends
      const trendsData = await analyticsService.getOKRProgressTrends(filters);
      setProgressTrends(trendsData);

      // Load department comparison (only for HR admins)
      if (user?.role === 'hr_admin') {
        const deptData = await analyticsService.getOKRDepartmentComparison(filters);
        setDepartmentComparison(deptData);
      }

    } catch (error) {
      console.error('Failed to load OKR analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (range: 'week' | 'month' | 'quarter' | 'year') => {
    let dateRange;
    switch (range) {
      case 'week':
        dateRange = analyticsService.getDefaultDateRange(7);
        break;
      case 'month':
        dateRange = analyticsService.getDefaultDateRange(30);
        break;
      case 'quarter':
        dateRange = analyticsService.getQuarterDateRange();
        break;
      case 'year':
        dateRange = analyticsService.getYearDateRange();
        break;
      default:
        dateRange = analyticsService.getDefaultDateRange(30);
    }
    setFilters({ ...filters, ...dateRange });
  };

  const formatCompletionChartData = (): ChartDataPoint[] => {
    if (!completionRates) return [];
    
    return [
      {
        label: 'Objectives',
        value: completionRates.objectives.completion_rate,
        color: '#3B82F6'
      },
      {
        label: 'Goals',
        value: completionRates.goals.completion_rate,
        color: '#10B981'
      },
      {
        label: 'Tasks',
        value: completionRates.tasks.completion_rate,
        color: '#F59E0B'
      }
    ];
  };

  const formatTrendsChartData = (): TimeSeriesDataPoint[] => {
    if (!progressTrends) return [];
    
    return progressTrends.trends.map(trend => ({
      date: trend.week_start,
      value: trend.value,
      label: `Week of ${new Date(trend.week_start).toLocaleDateString()}`
    }));
  };

  const formatDepartmentChartData = (): ChartDataPoint[] => {
    if (!departmentComparison) return [];
    
    return departmentComparison.departments.map(dept => ({
      label: dept.department.charAt(0).toUpperCase() + dept.department.slice(1),
      value: dept.okr_completion_rate,
      color: undefined // Will use default colors
    }));
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Overall Completion Rate"
          value={`${completionRates?.overall.completion_rate || 0}%`}
          subtitle={`${completionRates?.overall.completed_items || 0} of ${completionRates?.overall.total_items || 0} items`}
          trend={{
            direction: progressTrends?.analysis.trend_direction === 'increasing' ? 'up' : 
                     progressTrends?.analysis.trend_direction === 'decreasing' ? 'down' : 'stable',
            percentage: progressTrends?.analysis.trend_percentage || 0,
            period: 'last period'
          }}
          icon="🎯"
          color="blue"
          loading={loading}
        />
        
        <AnalyticsCard
          title="Objectives Completed"
          value={`${completionRates?.objectives.completion_rate || 0}%`}
          subtitle={`${completionRates?.objectives.completed || 0} of ${completionRates?.objectives.total || 0}`}
          icon="🏆"
          color="green"
          loading={loading}
        />
        
        <AnalyticsCard
          title="Goals Completed"
          value={`${completionRates?.goals.completion_rate || 0}%`}
          subtitle={`${completionRates?.goals.completed || 0} of ${completionRates?.goals.total || 0}`}
          icon="⭐"
          color="yellow"
          loading={loading}
        />
        
        <AnalyticsCard
          title="Tasks Completed"
          value={`${completionRates?.tasks.completion_rate || 0}%`}
          subtitle={`${completionRates?.tasks.completed || 0} of ${completionRates?.tasks.total || 0}`}
          icon="✅"
          color="purple"
          loading={loading}
        />
      </div>

      {/* Completion Rate Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart
          data={formatCompletionChartData()}
          title="Completion Rates by Type"
          type="bar"
          height={300}
        />
        
        <AnalyticsChart
          data={formatCompletionChartData()}
          title="Completion Distribution"
          type="doughnut"
          height={300}
        />
      </div>
    </div>
  );

  const renderTrendsTab = () => (
    <div className="space-y-6">
      <AnalyticsChart
        data={formatTrendsChartData()}
        title="OKR Completion Trends Over Time"
        type="line"
        height={400}
      />
      
      {progressTrends && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Trend Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {progressTrends.analysis.trend_direction === 'increasing' ? '↗' : 
                 progressTrends.analysis.trend_direction === 'decreasing' ? '↘' : '→'}
              </div>
              <div className="text-sm text-gray-600">Trend Direction</div>
              <div className="font-medium capitalize">{progressTrends.analysis.trend_direction}</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {progressTrends.analysis.trend_percentage > 0 ? '+' : ''}
                {progressTrends.analysis.trend_percentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Change</div>
              <div className="font-medium">vs Previous Period</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {progressTrends.analysis.data_points}
              </div>
              <div className="text-sm text-gray-600">Data Points</div>
              <div className="font-medium">Weekly Measurements</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDepartmentsTab = () => {
    if (user?.role !== 'hr_admin') {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔒</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">Department comparison is only available to HR Administrators.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <AnalyticsChart
          data={formatDepartmentChartData()}
          title="OKR Completion Rate by Department"
          type="bar"
          height={400}
        />
        
        {departmentComparison && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Department Performance Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employees
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      OKR Completion
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {departmentComparison.departments.map((dept, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 capitalize">
                          {dept.department}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {dept.employee_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${dept.okr_completion_rate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {dept.okr_completion_rate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          dept.performance_score >= 80 ? 'bg-green-100 text-green-800' :
                          dept.performance_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {dept.performance_score.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">OKR Analytics</h1>
          <p className="mt-2 text-gray-600">
            Track and analyze OKR completion rates, trends, and performance metrics
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['week', 'month', 'quarter', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => handleDateRangeChange(range as any)}
              className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 capitalize"
            >
              Last {range}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'trends', label: 'Trends', icon: '📈' },
              { id: 'departments', label: 'Departments', icon: '🏢' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'trends' && renderTrendsTab()}
          {activeTab === 'departments' && renderDepartmentsTab()}
        </div>
      </div>
    </div>
  );
};

export default OKRAnalytics; 