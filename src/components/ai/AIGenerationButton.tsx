import React, { useState } from 'react';
import { FaMagic } from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';

interface AIGenerationButtonProps {
  onClick: () => Promise<void>;
  buttonText: string;
  generatingText: string;
}

const AIGenerationButton: React.FC<AIGenerationButtonProps> = ({ onClick, buttonText, generatingText }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleClick = async () => {
    setIsGenerating(true);
    try {
      await onClick();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isGenerating}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-300"
    >
      {isGenerating ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          {generatingText}
        </>
      ) : (
        <>
          <FaMagic className="mr-2 -ml-1 h-5 w-5" />
          {buttonText}
        </>
      )}
    </button>
  );
};

export default AIGenerationButton; 