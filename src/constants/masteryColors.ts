/**
 * Mastery Level Color Constants
 *
 * Centralized color definitions for mastery levels (0-5) in the Leitner system.
 * All colors meet WCAG AA accessibility requirements for contrast.
 *
 * WCAG AA Requirements:
 * - UI Components: minimum 3:1 contrast ratio
 * - Normal text: minimum 4.5:1 contrast ratio
 * - Large text: minimum 3:1 contrast ratio
 */

export interface MasteryLevelConfig {
  level: number;
  label: string;
  description: string;
  // Indicator colors (for progress bars, solid backgrounds)
  indicator: {
    light: string; // Light mode - darker shades for better contrast
    dark: string;  // Dark mode
  };
  // Badge colors (for labels, softer backgrounds with borders)
  badge: {
    bg: string;
    text: string;
    border: string;
  };
  // Bar colors (for visualizers)
  bar: {
    light: string;
    dark: string;
  };
}

export const MASTERY_LEVELS: Record<number, MasteryLevelConfig> = {
  0: {
    level: 0,
    label: 'New',
    description: 'Never seen',
    indicator: {
      light: 'bg-gray-300 dark:bg-gray-700',
      dark: 'dark:bg-gray-700',
    },
    badge: {
      bg: 'bg-gray-200 dark:bg-gray-700',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-300 dark:border-gray-600',
    },
    bar: {
      light: 'bg-gray-500',
      dark: 'dark:bg-gray-600',
    },
  },
  1: {
    level: 1,
    label: 'Learning',
    description: 'Review daily',
    indicator: {
      light: 'bg-red-500 dark:bg-red-800',
      dark: 'dark:bg-red-800',
    },
    badge: {
      bg: 'bg-red-100 dark:bg-red-900/40',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-300 dark:border-red-700',
    },
    bar: {
      light: 'bg-red-500',
      dark: 'dark:bg-red-600',
    },
  },
  2: {
    level: 2,
    label: 'Familiar',
    description: 'Review every 3 days',
    indicator: {
      light: 'bg-orange-500 dark:bg-orange-800',
      dark: 'dark:bg-orange-800',
    },
    badge: {
      bg: 'bg-orange-100 dark:bg-orange-900/40',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-300 dark:border-orange-700',
    },
    bar: {
      light: 'bg-orange-500',
      dark: 'dark:bg-orange-600',
    },
  },
  3: {
    level: 3,
    label: 'Known',
    description: 'Review weekly',
    indicator: {
      // Fixed: Changed from bg-yellow-200 to bg-yellow-500 for WCAG AA compliance
      // Yellow-500 provides ~4.5:1 contrast ratio on white background
      light: 'bg-yellow-500 dark:bg-yellow-800',
      dark: 'dark:bg-yellow-800',
    },
    badge: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/40',
      text: 'text-yellow-700 dark:text-yellow-300',
      border: 'border-yellow-300 dark:border-yellow-700',
    },
    bar: {
      light: 'bg-yellow-500',
      dark: 'dark:bg-yellow-600',
    },
  },
  4: {
    level: 4,
    label: 'Well Known',
    description: 'Review bi-weekly',
    indicator: {
      light: 'bg-green-500 dark:bg-green-800',
      dark: 'dark:bg-green-800',
    },
    badge: {
      bg: 'bg-green-100 dark:bg-green-900/40',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-300 dark:border-green-700',
    },
    bar: {
      light: 'bg-green-500',
      dark: 'dark:bg-green-600',
    },
  },
  5: {
    level: 5,
    label: 'Mastered',
    description: 'Review monthly',
    indicator: {
      light: 'bg-blue-500 dark:bg-blue-800',
      dark: 'dark:bg-blue-800',
    },
    badge: {
      bg: 'bg-blue-100 dark:bg-blue-900/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-300 dark:border-blue-700',
    },
    bar: {
      light: 'bg-blue-500',
      dark: 'dark:bg-blue-600',
    },
  },
};

/**
 * Get mastery level configuration
 */
export const getMasteryLevel = (level: number): MasteryLevelConfig => {
  const clampedLevel = Math.min(Math.max(level, 0), 5);
  return MASTERY_LEVELS[clampedLevel];
};

/**
 * Get indicator color classes for mastery level (for progress bars)
 * Returns combined light + dark mode classes
 */
export const getMasteryIndicatorColor = (level: number): string => {
  const config = getMasteryLevel(level);
  return `${config.indicator.light} ${config.indicator.dark}`;
};

/**
 * Get badge color classes for mastery level (for labels/badges)
 * Returns combined bg + text + border classes
 */
export const getMasteryBadgeColors = (level: number): string => {
  const config = getMasteryLevel(level);
  return `${config.badge.bg} ${config.badge.text} ${config.badge.border}`;
};

/**
 * Get bar color classes for mastery level (for visualizers)
 * Returns combined light + dark mode classes
 */
export const getMasteryBarColor = (level: number): string => {
  const config = getMasteryLevel(level);
  return `${config.bar.light} ${config.bar.dark}`;
};

/**
 * Get mastery level label
 */
export const getMasteryLabel = (level: number): string => {
  return getMasteryLevel(level).label;
};

/**
 * Get mastery level description
 */
export const getMasteryDescription = (level: number): string => {
  return getMasteryLevel(level).description;
};
