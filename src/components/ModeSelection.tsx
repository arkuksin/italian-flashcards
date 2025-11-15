import React from 'react';
import { LearningDirection } from '../types';
import { LanguagePairSelector } from './LanguagePairSelector';

interface ModeSelectionProps {
  onModeSelect: (direction: LearningDirection, selectedCategories?: string[]) => void;
  selectedCategories?: string[];
}

/**
 * ModeSelection - Wrapper component for language pair selection
 * Now uses LanguagePairSelector to support multiple language pairs
 */
export const ModeSelection: React.FC<ModeSelectionProps> = ({ onModeSelect, selectedCategories }) => {
  const handlePairSelect = (pairId: number, direction: LearningDirection) => {
    // For now, we pass the direction to maintain compatibility
    // In the future, we can enhance this to also pass pairId
    onModeSelect(direction, selectedCategories);
  };

  return <LanguagePairSelector onSelect={handlePairSelect} />;
};