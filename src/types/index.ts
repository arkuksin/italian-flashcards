export interface Word {
  id: number;
  russian: string;
  italian: string;
  category?: string;
}

export type LearningDirection = 'ru-it' | 'it-ru';

export interface Progress {
  correct: number;
  wrong: number;
  streak: number;
  completed: Set<number>;
}

export interface AppState {
  currentWordIndex: number;
  userInput: string;
  showAnswer: boolean;
  progress: Progress;
  learningDirection: LearningDirection;
  darkMode: boolean;
  shuffleMode: boolean;
}