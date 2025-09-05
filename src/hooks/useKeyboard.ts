import { useEffect } from 'react';

interface UseKeyboardProps {
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  onToggleMode: () => void;
  onRestart: () => void;
  onShuffle: () => void;
}

export const useKeyboard = ({
  onNext,
  onPrevious,
  onSubmit,
  onToggleMode,
  onRestart,
  onShuffle,
}: UseKeyboardProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          onNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          onPrevious();
          break;
        case 'Enter':
          event.preventDefault();
          onSubmit();
          break;
        case 't':
        case 'T':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onToggleMode();
          }
          break;
        case 'r':
        case 'R':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onRestart();
          }
          break;
        case 's':
        case 'S':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onShuffle();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrevious, onSubmit, onToggleMode, onRestart, onShuffle]);
};