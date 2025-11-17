import { typography } from './src/design-tokens/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        display: ['Inter', 'system-ui', 'sans-serif'], // For headings
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      fontSize: {
        // Display - Large, expressive text
        'display-lg': [typography['display-large'].fontSize, {
          lineHeight: typography['display-large'].lineHeight,
          fontWeight: typography['display-large'].fontWeight,
          letterSpacing: typography['display-large'].letterSpacing,
        }],
        'display-md': [typography['display-medium'].fontSize, {
          lineHeight: typography['display-medium'].lineHeight,
          fontWeight: typography['display-medium'].fontWeight,
          letterSpacing: typography['display-medium'].letterSpacing,
        }],
        'display-sm': [typography['display-small'].fontSize, {
          lineHeight: typography['display-small'].lineHeight,
          fontWeight: typography['display-small'].fontWeight,
          letterSpacing: typography['display-small'].letterSpacing,
        }],

        // Headline - High-emphasis text
        'headline-lg': [typography['headline-large'].fontSize, {
          lineHeight: typography['headline-large'].lineHeight,
          fontWeight: typography['headline-large'].fontWeight,
          letterSpacing: typography['headline-large'].letterSpacing,
        }],
        'headline-md': [typography['headline-medium'].fontSize, {
          lineHeight: typography['headline-medium'].lineHeight,
          fontWeight: typography['headline-medium'].fontWeight,
          letterSpacing: typography['headline-medium'].letterSpacing,
        }],
        'headline-sm': [typography['headline-small'].fontSize, {
          lineHeight: typography['headline-small'].lineHeight,
          fontWeight: typography['headline-small'].fontWeight,
          letterSpacing: typography['headline-small'].letterSpacing,
        }],

        // Title - Medium-emphasis text
        'title-lg': [typography['title-large'].fontSize, {
          lineHeight: typography['title-large'].lineHeight,
          fontWeight: typography['title-large'].fontWeight,
          letterSpacing: typography['title-large'].letterSpacing,
        }],
        'title-md': [typography['title-medium'].fontSize, {
          lineHeight: typography['title-medium'].lineHeight,
          fontWeight: typography['title-medium'].fontWeight,
          letterSpacing: typography['title-medium'].letterSpacing,
        }],
        'title-sm': [typography['title-small'].fontSize, {
          lineHeight: typography['title-small'].lineHeight,
          fontWeight: typography['title-small'].fontWeight,
          letterSpacing: typography['title-small'].letterSpacing,
        }],

        // Body - Main content text
        'body-lg': [typography['body-large'].fontSize, {
          lineHeight: typography['body-large'].lineHeight,
          fontWeight: typography['body-large'].fontWeight,
          letterSpacing: typography['body-large'].letterSpacing,
        }],
        'body-md': [typography['body-medium'].fontSize, {
          lineHeight: typography['body-medium'].lineHeight,
          fontWeight: typography['body-medium'].fontWeight,
          letterSpacing: typography['body-medium'].letterSpacing,
        }],
        'body-sm': [typography['body-small'].fontSize, {
          lineHeight: typography['body-small'].lineHeight,
          fontWeight: typography['body-small'].fontWeight,
          letterSpacing: typography['body-small'].letterSpacing,
        }],

        // Label - UI elements
        'label-lg': [typography['label-large'].fontSize, {
          lineHeight: typography['label-large'].lineHeight,
          fontWeight: typography['label-large'].fontWeight,
          letterSpacing: typography['label-large'].letterSpacing,
        }],
        'label-md': [typography['label-medium'].fontSize, {
          lineHeight: typography['label-medium'].lineHeight,
          fontWeight: typography['label-medium'].fontWeight,
          letterSpacing: typography['label-medium'].letterSpacing,
        }],
        'label-sm': [typography['label-small'].fontSize, {
          lineHeight: typography['label-small'].lineHeight,
          fontWeight: typography['label-small'].fontWeight,
          letterSpacing: typography['label-small'].letterSpacing,
        }],
      },
      perspective: {
        '1000': '1000px',
      },
      animation: {
        'flip': 'flip 0.6s ease-in-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        scaleIn: {
          from: {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          to: {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.perspective-1000': {
          perspective: '1000px',
        },
        '.preserve-3d': {
          transformStyle: 'preserve-3d',
        },
        '.backface-hidden': {
          backfaceVisibility: 'hidden',
        },
        '.rotate-y-180': {
          transform: 'rotateY(180deg)',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};