import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModeSelection } from './components/ModeSelection';
import { Header } from './components/Header';
import { FlashCard } from './components/FlashCard';
import { ProgressBar } from './components/ProgressBar';
import { useKeyboard } from './hooks/useKeyboard';
import { WORDS, getShuffledWords } from './data/words';
import { AppState, LearningDirection, Word } from './types';
import { compareStrings } from './utils/textUtils';

function App() {
  const [hasSelectedMode, setHasSelectedMode] = useState(false);
  const [words, setWords] = useState<Word[]>(WORDS);
  const [state, setState] = useState<AppState>({
    currentWordIndex: 0,
    userInput: '',
    showAnswer: false,
    progress: {
      correct: 0,
      wrong: 0,
      streak: 0,
      completed: new Set(),
    },
    learningDirection: 'ru-it',
    darkMode: false,
    shuffleMode: false,
    ignoreAccents: false,
  });

  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setState(prev => ({ ...prev, darkMode: savedDarkMode }));
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const currentWord = words[state.currentWordIndex];

  const handleModeSelect = (direction: LearningDirection) => {
    setState(prev => ({ ...prev, learningDirection: direction }));
    setHasSelectedMode(true);
  };

  const handleNext = () => {
    if (state.currentWordIndex < words.length - 1) {
      setState(prev => ({
        ...prev,
        currentWordIndex: prev.currentWordIndex + 1,
        userInput: '',
        showAnswer: false,
      }));
      setIsCorrect(null);
    }
  };

  const handlePrevious = () => {
    if (state.currentWordIndex > 0) {
      setState(prev => ({
        ...prev,
        currentWordIndex: prev.currentWordIndex - 1,
        userInput: '',
        showAnswer: false,
      }));
      setIsCorrect(null);
    }
  };

  const handleSubmit = () => {
    if (!state.userInput.trim() || state.showAnswer) return;

    const targetWord = state.learningDirection === 'ru-it' 
      ? currentWord.italian.toLowerCase() 
      : currentWord.russian.toLowerCase();
    
    const correct = compareStrings(state.userInput, targetWord, state.ignoreAccents);
    
    setIsCorrect(correct);

    setState(prev => ({
      ...prev,
      showAnswer: true,
      progress: {
        ...prev.progress,
        correct: correct ? prev.progress.correct + 1 : prev.progress.correct,
        wrong: correct ? prev.progress.wrong : prev.progress.wrong + 1,
        streak: correct ? prev.progress.streak + 1 : 0,
        completed: new Set([...prev.progress.completed, currentWord.id]),
      },
    }));
  };

  const handleToggleDarkMode = () => {
    setState(prev => ({ ...prev, darkMode: !prev.darkMode }));
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', (!state.darkMode).toString());
  };

  const handleToggleDirection = () => {
    setState(prev => ({
      ...prev,
      learningDirection: prev.learningDirection === 'ru-it' ? 'it-ru' : 'ru-it',
      userInput: '',
      showAnswer: false,
    }));
    setIsCorrect(null);
  };

  const handleToggleIgnoreAccents = () => {
    setState(prev => ({ ...prev, ignoreAccents: !prev.ignoreAccents }));
  };

  const handleToggleShuffle = () => {
    const newShuffleMode = !state.shuffleMode;
    setState(prev => ({ ...prev, shuffleMode: newShuffleMode }));
    
    if (newShuffleMode) {
      setWords(getShuffledWords());
    } else {
      setWords(WORDS);
    }
    
    setState(prev => ({
      ...prev,
      currentWordIndex: 0,
      userInput: '',
      showAnswer: false,
    }));
    setIsCorrect(null);
  };

  const handleRestart = () => {
    setState(prev => ({
      ...prev,
      currentWordIndex: 0,
      userInput: '',
      showAnswer: false,
      progress: {
        correct: 0,
        wrong: 0,
        streak: 0,
        completed: new Set(),
      },
    }));
    setIsCorrect(null);
    
    if (state.shuffleMode) {
      setWords(getShuffledWords());
    }
  };

  const handleInputChange = (value: string) => {
    setState(prev => ({ ...prev, userInput: value }));
  };

  useKeyboard({
    onNext: handleNext,
    onPrevious: handlePrevious,
    onSubmit: handleSubmit,
    onToggleMode: handleToggleDirection,
    onToggleIgnoreAccents: handleToggleIgnoreAccents,
    onRestart: handleRestart,
    onShuffle: handleToggleShuffle,
  });

  if (!hasSelectedMode) {
    return <ModeSelection onModeSelect={handleModeSelect} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      state.darkMode ? 'dark' : ''
    }`}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <Header
          darkMode={state.darkMode}
          shuffleMode={state.shuffleMode}
          ignoreAccents={state.ignoreAccents}
          learningDirection={state.learningDirection}
          onToggleDarkMode={handleToggleDarkMode}
          onToggleShuffle={handleToggleShuffle}
          onToggleIgnoreAccents={handleToggleIgnoreAccents}
          onToggleDirection={handleToggleDirection}
          onRestart={handleRestart}
        />

        <div className="container mx-auto px-6 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Progress Sidebar */}
            <div className="lg:col-span-1">
              <ProgressBar
                progress={state.progress}
                totalWords={words.length}
                currentIndex={state.currentWordIndex}
              />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={state.currentWordIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <FlashCard
                    word={currentWord}
                    learningDirection={state.learningDirection}
                    userInput={state.userInput}
                    showAnswer={state.showAnswer}
                    ignoreAccents={state.ignoreAccents}
                    onInputChange={handleInputChange}
                    onSubmit={handleSubmit}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    isCorrect={isCorrect}
                    currentIndex={state.currentWordIndex}
                    totalWords={words.length}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;