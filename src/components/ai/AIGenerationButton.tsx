import React, { useState } from 'react';
import { SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { aiService, AIGenerationResult } from '../../services/aiService';
import { useToast } from '../../hooks/useToast';

interface AIGenerationButtonProps {
  generationType: 'self_assessment' | 'peer_review' | 'manager_review';
  contextData: Record<string, any>;
  cycleId?: string;
  revieweeId?: string;
  onGenerated: (result: AIGenerationResult) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
}

const AIGenerationButton: React.FC<AIGenerationButtonProps> = ({
  generationType,
  contextData,
  cycleId,
  revieweeId,
  onGenerated,
  disabled = false,
  className = '',
  size = 'md',
  variant = 'primary'
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { addToast } = useToast();

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white border-transparent',
    secondary: 'bg-purple-100 hover:bg-purple-200 text-purple-700 border-transparent',
    outline: 'bg-white hover:bg-purple-50 text-purple-600 border-purple-300'
  };

  const getButtonText = () => {
    switch (generationType) {
      case 'self_assessment':
        return 'Generate Self-Assessment Draft';
      case 'peer_review':
        return 'Generate Peer Review Draft';
      case 'manager_review':
        return 'Generate Manager Review Draft';
      default:
        return 'Generate AI Draft';
    }
  };

  const handleGenerate = async () => {
    if (isGenerating || disabled) return;

    setIsGenerating(true);

    try {
      let result: AIGenerationResult;

      const baseData = {
        generation_type: generationType,
        context_data: contextData,
        cycle_id: cycleId
      };

      switch (generationType) {
        case 'self_assessment':
          result = await aiService.generateSelfAssessmentDraft(baseData);
          break;
        case 'peer_review':
          if (!revieweeId) {
            throw new Error('Reviewee ID is required for peer review generation');
          }
          result = await aiService.generatePeerReviewDraft({
            ...baseData,
            reviewee_id: revieweeId
          });
          break;
        case 'manager_review':
          if (!revieweeId) {
            throw new Error('Employee ID is required for manager review generation');
          }
          result = await aiService.generateManagerReviewDraft({
            ...baseData,
            reviewee_id: revieweeId
          });
          break;
        default:
          throw new Error('Invalid generation type');
      }

      if (result.success) {
        addToast({
          type: 'success',
          title: 'AI Draft Generated',
          message: `Your ${generationType.replace('_', ' ')} draft has been generated successfully.`
        });
        onGenerated(result);
      } else {
        throw new Error(result.error || 'Generation failed');
      }

    } catch (error: any) {
      console.error('AI generation error:', error);
      const errorMessage = aiService.handleAIError(error);
      addToast({
        type: 'error',
        title: 'Generation Failed',
        message: errorMessage
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={disabled || isGenerating}
      className={`
        inline-flex items-center justify-center
        border rounded-md font-medium
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      title={isGenerating ? 'Generating...' : getButtonText()}
    >
      {isGenerating ? (
        <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <SparklesIcon className="w-4 h-4 mr-2" />
      )}
      {isGenerating ? 'Generating...' : 'AI Generate'}
    </button>
  );
};

export default AIGenerationButton; 