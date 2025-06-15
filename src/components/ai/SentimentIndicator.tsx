import React from 'react';
import { 
  FaceSmileIcon, 
  FaceFrownIcon, 
  MinusIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { SentimentAnalysisResult } from '../../types/ai';

interface SentimentIndicatorProps {
  sentimentResult: SentimentAnalysisResult;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SentimentIndicator: React.FC<SentimentIndicatorProps> = ({
  sentimentResult,
  showDetails = false,
  size = 'md',
  className = ''
}) => {
  const getSentimentColor = (label: string): string => {
    switch (label) {
      case 'positive':
        return 'text-green-600 bg-green-100';
      case 'negative':
        return 'text-red-600 bg-red-100';
      case 'neutral':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSentimentIcon = (label: string) => {
    const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
    
    switch (label) {
      case 'positive':
        return <FaceSmileIcon className={iconSize} />;
      case 'negative':
        return <FaceFrownIcon className={iconSize} />;
      case 'neutral':
        return <MinusIcon className={iconSize} />;
      default:
        return <MinusIcon className={iconSize} />;
    }
  };

  const formatScore = (score: number): string => {
    return (score * 100).toFixed(0);
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const hasIssues = sentimentResult.detected_issues && sentimentResult.detected_issues.length > 0;

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      {/* Main sentiment indicator */}
      <div className={`
        inline-flex items-center space-x-1 rounded-full border
        ${getSentimentColor(sentimentResult.sentiment_label)}
        ${sizeClasses[size]}
      `}>
        {getSentimentIcon(sentimentResult.sentiment_label)}
        <span className="font-medium capitalize">
          {sentimentResult.sentiment_label}
        </span>
        {showDetails && (
          <span className="text-xs opacity-75">
            ({formatScore(sentimentResult.sentiment_score)}%)
          </span>
        )}
      </div>

      {/* Confidence indicator */}
      {showDetails && (
        <div className="flex items-center space-x-1">
          <InformationCircleIcon className="w-4 h-4 text-gray-400" />
          <span className={`text-xs ${getConfidenceColor(sentimentResult.confidence_score)}`}>
            {(sentimentResult.confidence_score * 100).toFixed(0)}% confident
          </span>
        </div>
      )}

      {/* Issues warning */}
      {hasIssues && (
        <div className="flex items-center space-x-1">
          <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />
          <span className="text-xs text-amber-600">
            {sentimentResult.detected_issues.length} issue{sentimentResult.detected_issues.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Detailed information */}
      {showDetails && (
        <div className="ml-4 space-y-1">
          {/* Keywords */}
          {sentimentResult.detected_keywords && sentimentResult.detected_keywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-xs text-gray-500">Keywords:</span>
              {sentimentResult.detected_keywords.slice(0, 3).map((keyword, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full"
                >
                  {keyword}
                </span>
              ))}
              {sentimentResult.detected_keywords.length > 3 && (
                <span className="text-xs text-gray-400">
                  +{sentimentResult.detected_keywords.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Issues */}
          {hasIssues && (
            <div className="flex flex-wrap gap-1">
              <span className="text-xs text-gray-500">Issues:</span>
              {sentimentResult.detected_issues.map((issue, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full"
                >
                  {issue.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SentimentIndicator; 