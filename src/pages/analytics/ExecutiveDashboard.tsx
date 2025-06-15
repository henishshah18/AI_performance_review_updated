import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import analyticsService from '../../services/analyticsService';
import AnalyticsCard from '../../components/analytics/AnalyticsCard';
import AnalyticsChart from '../../components/analytics/AnalyticsChart';
import {
  ExecutiveOverview,
  AnalyticsFilters,
  ChartDataPoint,
  TimeSeriesDataPoint
} from '../../types/analytics';

const ExecutiveDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<ExecutiveOverview | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    ...analyticsService.getDefaultDateRange(30)
  });
  const [selectedMetric, setSelectedMetric] = useState<'okr' | 'engagement' | 'feedback'>('okr');

  useEffect(() => {
    if (user?.role === 'hr_admin') {
      loadExecutiveData();
    }
  }, [filters, user]);

  const loadExecutiveData = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getExecutiveOverview(filters);
      setOverview(data);
    } catch (error) {
      console.error('Failed to load executive dashboard:', error);
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

  const formatDepartmentPerformanceData = (): ChartDataPoint[] => {
    if (!overview?.department_performance) return [];
    
    return overview.department_performance.map(dept => ({
      label: dept.department.charAt(0).toUpperCase() + dept.department.slice(1),
      value: dept.performance_score,
      color: undefined
    }));
  };

  const formatTrendData = (trendType: 'okr' | 'engagement' | 'feedback'): TimeSeriesDataPoint[] => {
    if (!overview?.trends) return [];
    
    const trend = overview.trends[`${trendType}_trend`];
    if (!trend) return [];
    
    return trend.trends.map(point => ({
      date: point.week_start,
      value: point.value,
      label: `Week of ${new Date(point.week_start).toLocaleDateString()}`
    }));
  };

  const formatDepartmentComparisonData = (): ChartDataPoint[] => {
    if (!overview?.department_performance) return [];
    
    const metric = selectedMetric === 'okr' ? 'okr_completion_rate' :
                  selectedMetric === 'engagement' ? 'engagement_rate' :
                  'feedback_participation_rate';
    
    return overview.department_performance.map(dept => ({
      label: dept.department.charAt(0).toUpperCase() + dept.department.slice(1),
      value: dept[metric],
      color: undefined
    }));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  if (user?.role !== 'hr_admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-gray-600">The Executive Dashboard is only available to HR Administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Company-wide performance insights and strategic metrics
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

        {/* Key Performance Indicators */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Performance Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnalyticsCard
              title="OKR Completion Rate"
              value={`${overview?.key_metrics.overall_okr_completion || 0}%`}
              subtitle="Company-wide"
              trend={{
                direction: overview?.trends.okr_trend.analysis.trend_direction === 'increasing' ? 'up' : 
                         overview?.trends.okr_trend.analysis.trend_direction === 'decreasing' ? 'down' : 'stable',
                percentage: overview?.trends.okr_trend.analysis.trend_percentage || 0,
                period: 'last period'
              }}
              icon="🎯"
              color="blue"
              loading={loading}
            />
            
            <AnalyticsCard
              title="Employee Engagement"
              value={`${overview?.key_metrics.employee_engagement_rate || 0}%`}
              subtitle="Active participation"
              trend={{
                direction: overview?.trends.engagement_trend.analysis.trend_direction === 'increasing' ? 'up' : 
                         overview?.trends.engagement_trend.analysis.trend_direction === 'decreasing' ? 'down' : 'stable',
                percentage: overview?.trends.engagement_trend.analysis.trend_percentage || 0,
                period: 'last period'
              }}
              icon="👥"
              color="green"
              loading={loading}
            />
            
            <AnalyticsCard
              title="Feedback Participation"
              value={`${overview?.key_metrics.feedback_participation_rate || 0}%`}
              subtitle="Team collaboration"
              trend={{
                direction: overview?.trends.feedback_trend.analysis.trend_direction === 'increasing' ? 'up' : 
                         overview?.trends.feedback_trend.analysis.trend_direction === 'decreasing' ? 'down' : 'stable',
                percentage: overview?.trends.feedback_trend.analysis.trend_percentage || 0,
                period: 'last period'
              }}
              icon="💬"
              color="purple"
              loading={loading}
            />
            
            <AnalyticsCard
              title="Active Users"
              value={overview?.key_metrics.total_active_users || 0}
              subtitle="Platform engagement"
              icon="🚀"
              color="yellow"
              loading={loading}
            />
          </div>
        </div>

        {/* Department Performance Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Department Performance</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnalyticsChart
              data={formatDepartmentPerformanceData()}
              title="Overall Performance Score by Department"
              type="bar"
              height={300}
            />
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Department Comparison</h3>
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value as any)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="okr">OKR Completion</option>
                  <option value="engagement">Engagement Rate</option>
                  <option value="feedback">Feedback Participation</option>
                </select>
              </div>
              <AnalyticsChart
                data={formatDepartmentComparisonData()}
                type="doughnut"
                height={200}
                showLegend={true}
              />
            </div>
          </div>
        </div>

        {/* Trend Analysis */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Trends</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">OKR Completion Trend</h3>
              <AnalyticsChart
                data={formatTrendData('okr')}
                type="line"
                height={200}
                showLegend={false}
              />
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Engagement Trend</h3>
              <AnalyticsChart
                data={formatTrendData('engagement')}
                type="line"
                height={200}
                showLegend={false}
              />
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Feedback Trend</h3>
              <AnalyticsChart
                data={formatTrendData('feedback')}
                type="line"
                height={200}
                showLegend={false}
              />
            </div>
          </div>
        </div>

        {/* Alerts and Insights */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Alerts & Insights</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alerts */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">System Alerts</h3>
              <div className="space-y-3">
                {overview?.alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}
                  >
                    <div className="flex items-start">
                      <span className="text-lg mr-2">{getAlertIcon(alert.type)}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        {alert.department && (
                          <p className="text-xs mt-1 opacity-75">
                            Department: {alert.department}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Insights */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Strategic Insights</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-gray-900">Performance Highlights</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {overview?.department_performance.length || 0} departments tracked with an average 
                    performance score of {overview?.department_performance.reduce((acc, dept) => acc + dept.performance_score, 0) / (overview?.department_performance.length || 1) || 0}
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-gray-900">Growth Opportunities</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Focus on departments with lower engagement rates to improve overall company performance
                  </p>
                </div>
                
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-medium text-gray-900">Recommendations</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Implement targeted feedback programs and OKR training for underperforming departments
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Department Details Table */}
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
                    Engagement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feedback Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance Score
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overview?.department_performance.map((dept, index) => (
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
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 max-w-[60px]">
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
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 max-w-[60px]">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${dept.engagement_rate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {dept.engagement_rate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {dept.feedback_volume}
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
      </div>
    </div>
  );
};

export default ExecutiveDashboard; 