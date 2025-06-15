import React from 'react';
import { FaSmile, FaMeh, FaFrown } from 'react-icons/fa';

interface SentimentIndicatorProps {
  sentimentLabel: 'positive' | 'neutral' | 'negative' | string;
  score: number;
  showLabel?: boolean;
}

const sentimentStyles = {
  positive: {
    icon: <FaSmile className="text-green-500" />,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    label: 'Positive',
  },
  neutral: {
    icon: <FaMeh className="text-yellow-500" />,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100',
    label: 'Neutral',
  },
  negative: {
    icon: <FaFrown className="text-red-500" />,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    label: 'Negative',
  },
};

const SentimentIndicator: React.FC<SentimentIndicatorProps> = ({ sentimentLabel, score, showLabel = true }) => {
  const styles = sentimentStyles[sentimentLabel as keyof typeof sentimentStyles] || sentimentStyles.neutral;

  return (
    <div className={`flex items-center space-x-2 p-1 rounded-full text-xs font-medium ${styles.bgColor} ${styles.color}`}>
      <span className="text-lg">{styles.icon}</span>
      {showLabel && <span>{styles.label} ({score.toFixed(2)})</span>}
    </div>
  );
};

export default SentimentIndicator; 