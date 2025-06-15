import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { ChartProps, ChartDataPoint, TimeSeriesDataPoint } from '../../types/analytics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AnalyticsChart: React.FC<ChartProps> = ({
  data,
  title,
  height = 300,
  type = 'bar',
  showLegend = true,
  showTooltip = true,
  colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ]
}) => {
  const isTimeSeriesData = (data: any[]): data is TimeSeriesDataPoint[] => {
    return data.length > 0 && 'date' in data[0];
  };

  const isChartData = (data: any[]): data is ChartDataPoint[] => {
    return data.length > 0 && 'label' in data[0];
  };

  const formatChartData = () => {
    if (isTimeSeriesData(data)) {
      return {
        labels: data.map(item => {
          const date = new Date(item.date);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [{
          label: title || 'Value',
          data: data.map(item => item.value),
          backgroundColor: type === 'line' || type === 'area' ? 
            `${colors[0]}20` : colors[0],
          borderColor: colors[0],
          borderWidth: 2,
          fill: type === 'area',
          tension: 0.4
        }]
      };
    } else if (isChartData(data)) {
      return {
        labels: data.map(item => item.label),
        datasets: [{
          label: title || 'Count',
          data: data.map(item => item.value),
          backgroundColor: data.map((_, index) => 
            data[index].color || colors[index % colors.length]
          ),
          borderColor: data.map((_, index) => 
            data[index].color || colors[index % colors.length]
          ),
          borderWidth: type === 'pie' || type === 'doughnut' ? 0 : 2
        }]
      };
    }
    return { labels: [], datasets: [] };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        enabled: showTooltip,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y || context.parsed;
            
            if (type === 'pie' || type === 'doughnut') {
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
            
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: (type === 'pie' || type === 'doughnut') ? {} : {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: function(value: any) {
            if (typeof value === 'number') {
              return value % 1 === 0 ? value : value.toFixed(1);
            }
            return value;
          }
        }
      }
    }
  };

  const chartData = formatChartData();

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      options: chartOptions,
      height: height
    };

    switch (type) {
      case 'line':
      case 'area':
        return <Line {...commonProps} />;
      case 'pie':
        return <Pie {...commonProps} />;
      case 'doughnut':
        return <Doughnut {...commonProps} />;
      case 'bar':
      default:
        return <Bar {...commonProps} />;
    }
  };

  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
        style={{ height: `${height}px` }}
      >
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-2">📊</div>
          <p className="text-gray-500 text-sm">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div style={{ height: `${height}px` }}>
        {renderChart()}
      </div>
    </div>
  );
};

export default AnalyticsChart; 