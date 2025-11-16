# Define Consistent Typography Scale

## Issue
Components use arbitrary text sizes with no defined type scale, creating visual inconsistency throughout the application.

## Locations
Throughout the application

## Problem Details

**Examples of arbitrary text sizing:**
- FlashCard question: `text-4xl md:text-5xl`
- Mode selection: `text-lg md:text-2xl`
- Header title: `text-2xl`
- Category label: `text-sm`

### Issues:
1. **No defined type scale** creates visual inconsistency
2. **Arbitrary size choices** with no clear hierarchy
3. **Difficult to maintain** consistency
4. **No semantic naming** for text sizes

## Impact
- Visual inconsistency
- Unclear typography hierarchy
- Maintenance difficulties
- Unprofessional appearance

## Task
Define and implement a semantic typography scale:

1. **Define typography tokens based on Material 3 scale:**
   ```tsx
   // src/design-tokens/typography.ts
   export const typography = {
     // Display - Large, expressive text (hero sections, big headers)
     'display-large': {
       fontSize: '3.5rem',      // 57px
       lineHeight: '4rem',      // 64px
       fontWeight: '700',
       letterSpacing: '-0.02em',
     },
     'display-medium': {
       fontSize: '2.8rem',      // 45px
       lineHeight: '3.25rem',   // 52px
       fontWeight: '700',
       letterSpacing: '-0.01em',
     },
     'display-small': {
       fontSize: '2.25rem',     // 36px
       lineHeight: '2.75rem',   // 44px
       fontWeight: '700',
       letterSpacing: '0',
     },

     // Headline - High-emphasis text (section headers, card titles)
     'headline-large': {
       fontSize: '2rem',        // 32px
       lineHeight: '2.5rem',    // 40px
       fontWeight: '600',
       letterSpacing: '0',
     },
     'headline-medium': {
       fontSize: '1.75rem',     // 28px
       lineHeight: '2.25rem',   // 36px
       fontWeight: '600',
       letterSpacing: '0',
     },
     'headline-small': {
       fontSize: '1.5rem',      // 24px
       lineHeight: '2rem',      // 32px
       fontWeight: '600',
       letterSpacing: '0',
     },

     // Title - Medium-emphasis text (card headers, list titles)
     'title-large': {
       fontSize: '1.375rem',    // 22px
       lineHeight: '1.75rem',   // 28px
       fontWeight: '500',
       letterSpacing: '0',
     },
     'title-medium': {
       fontSize: '1rem',        // 16px
       lineHeight: '1.5rem',    // 24px
       fontWeight: '500',
       letterSpacing: '0.01em',
     },
     'title-small': {
       fontSize: '0.875rem',    // 14px
       lineHeight: '1.25rem',   // 20px
       fontWeight: '500',
       letterSpacing: '0.01em',
     },

     // Body - Main content text
     'body-large': {
       fontSize: '1rem',        // 16px
       lineHeight: '1.5rem',    // 24px
       fontWeight: '400',
       letterSpacing: '0.01em',
     },
     'body-medium': {
       fontSize: '0.875rem',    // 14px
       lineHeight: '1.25rem',   // 20px
       fontWeight: '400',
       letterSpacing: '0.02em',
     },
     'body-small': {
       fontSize: '0.75rem',     // 12px
       lineHeight: '1rem',      // 16px
       fontWeight: '400',
       letterSpacing: '0.03em',
     },

     // Label - UI elements (buttons, tabs, chips)
     'label-large': {
       fontSize: '0.875rem',    // 14px
       lineHeight: '1.25rem',   // 20px
       fontWeight: '500',
       letterSpacing: '0.01em',
     },
     'label-medium': {
       fontSize: '0.75rem',     // 12px
       lineHeight: '1rem',      // 16px
       fontWeight: '500',
       letterSpacing: '0.05em',
     },
     'label-small': {
       fontSize: '0.6875rem',   // 11px
       lineHeight: '1rem',      // 16px
       fontWeight: '500',
       letterSpacing: '0.05em',
     },
   };
   ```

2. **Add typography utilities to Tailwind config:**
   ```js
   // tailwind.config.js
   import { typography } from './src/design-tokens/typography';

   module.exports = {
     theme: {
       extend: {
         // Add as Tailwind utilities
         fontSize: {
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
           // ... add all typography tokens
         },
       },
     },
   };
   ```

3. **Create Typography component (optional but recommended):**
   ```tsx
   // src/components/ui/Typography.tsx
   type TypographyVariant =
     | 'display-large' | 'display-medium' | 'display-small'
     | 'headline-large' | 'headline-medium' | 'headline-small'
     | 'title-large' | 'title-medium' | 'title-small'
     | 'body-large' | 'body-medium' | 'body-small'
     | 'label-large' | 'label-medium' | 'label-small';

   interface TypographyProps {
     variant: TypographyVariant;
     as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
     children: React.ReactNode;
     className?: string;
   }

   export const Typography: React.FC<TypographyProps> = ({
     variant,
     as: Component = 'p',
     children,
     className = '',
   }) => {
     return (
       <Component className={`text-${variant} ${className}`}>
         {children}
       </Component>
     );
   };

   // Usage
   <Typography variant="headline-large" as="h1">
     Welcome to Flashcards
   </Typography>
   ```

4. **Create usage guidelines document:**
   ```markdown
   # Typography Usage Guidelines

   ## Display (display-*)
   Use for: Hero sections, landing pages, large impactful text
   - display-large: Hero headlines, main landing page title
   - display-medium: Section heroes
   - display-small: Large feature headers

   ## Headline (headline-*)
   Use for: Page titles, section headers, card titles
   - headline-large: Main page titles
   - headline-medium: Section headers
   - headline-small: Card titles, subsection headers

   ## Title (title-*)
   Use for: Emphasized text, list headers, small headers
   - title-large: List section headers
   - title-medium: List item titles, small card headers
   - title-small: Menu items, tab labels

   ## Body (body-*)
   Use for: Main content, paragraphs, descriptions
   - body-large: Primary reading content
   - body-medium: Secondary content, descriptions
   - body-small: Captions, fine print

   ## Label (label-*)
   Use for: UI elements, buttons, chips, badges
   - label-large: Large buttons, prominent chips
   - label-medium: Standard buttons, form labels
   - label-small: Small chips, indicators, tooltips
   ```

5. **Update components to use typography scale:**

   **FlashCard.tsx:**
   ```tsx
   // Before
   <h2 className="text-4xl md:text-5xl">

   // After
   <Typography variant="display-medium" as="h2">
   // or
   <h2 className="text-display-md">
   ```

   **ModeSelection.tsx:**
   ```tsx
   // Before
   <span className="text-lg md:text-2xl">

   // After
   <Typography variant="headline-small">
   // or
   <span className="text-headline-sm">
   ```

   **Header.tsx:**
   ```tsx
   // Before
   <h1 className="text-2xl">

   // After
   <Typography variant="headline-large" as="h1">
   ```

   **CategoryFilter.tsx:**
   ```tsx
   // Before
   <label className="text-sm">

   // After
   <Typography variant="body-small" as="label">
   ```

6. **Audit all components:**
   - Find all text-* classes
   - Replace with semantic typography classes
   - Document any exceptions
   - Remove arbitrary text sizing

7. **Add ESLint rule (optional):**
   - Warn on arbitrary text-* classes
   - Suggest semantic typography alternatives
   - Maintain consistency

## Success Criteria
- Typography scale defined and documented
- All components use semantic typography tokens
- No arbitrary text sizes in codebase
- Consistent typography hierarchy
- Typography component working properly
- Usage guidelines documented
- Visual consistency improved

## Component Mapping Examples
```tsx
// Flashcard question
display-medium or display-small

// Dashboard welcome message
headline-large

// Section headers
headline-medium or headline-small

// Card titles
title-large

// Button text
label-large or label-medium

// Form labels
title-small or label-medium

// Body text, descriptions
body-large or body-medium

// Helper text, captions
body-small

// Small indicators, badges
label-small
```

## References
- UI_Review.md: Section 2.5 - Typography Issues: Inconsistent Text Sizing
- Material Design 3: Typography (https://m3.material.io/styles/typography)
- Tailwind CSS: Custom Font Sizes
