# Typography Usage Guidelines

This document provides guidelines for using the typography system in the Italian Flashcards application. Our typography scale is based on Material Design 3 and provides consistent, semantic text styling across the application.

## Typography Scale Overview

The typography system is organized into five categories:

1. **Display** - Large, expressive text
2. **Headline** - High-emphasis text
3. **Title** - Medium-emphasis text
4. **Body** - Main content text
5. **Label** - UI element text

Each category has three sizes: large, medium, and small.

## Display (display-*)

**Use for:** Hero sections, landing pages, large impactful text

### Variants

- **`display-large`** (57px / 3.5rem)
  - Use for: Hero headlines, main landing page title
  - Example: Large welcome messages, primary marketing text

- **`display-medium`** (45px / 2.8rem)
  - Use for: Section heroes, flashcard questions
  - Example: Main content on flashcards

- **`display-small`** (36px / 2.25rem)
  - Use for: Large feature headers
  - Example: Featured section titles

### Usage Examples

```tsx
// Direct Tailwind class
<h1 className="text-display-lg">Welcome to Italian Flashcards</h1>

// Typography component
<Typography variant="display-medium" as="h2">
  Question Text
</Typography>
```

## Headline (headline-*)

**Use for:** Page titles, section headers, card titles

### Variants

- **`headline-large`** (32px / 2rem)
  - Use for: Main page titles, dashboard headers
  - Example: "Dashboard", "Settings", page names

- **`headline-medium`** (28px / 1.75rem)
  - Use for: Section headers
  - Example: "Your Progress", "Recent Cards"

- **`headline-small`** (24px / 1.5rem)
  - Use for: Card titles, subsection headers
  - Example: Mode selection options, card categories

### Usage Examples

```tsx
// Direct Tailwind class
<h1 className="text-headline-lg">Dashboard</h1>

// Typography component
<Typography variant="headline-small" as="h3">
  Study Mode
</Typography>
```

## Title (title-*)

**Use for:** Emphasized text, list headers, small headers

### Variants

- **`title-large`** (22px / 1.375rem)
  - Use for: List section headers, emphasized content
  - Example: Category group headers

- **`title-medium`** (16px / 1rem)
  - Use for: List item titles, small card headers
  - Example: Individual card titles in lists

- **`title-small`** (14px / 0.875rem)
  - Use for: Menu items, tab labels
  - Example: Navigation menu items

### Usage Examples

```tsx
// Direct Tailwind class
<h4 className="text-title-lg">Categories</h4>

// Typography component
<Typography variant="title-medium" as="h5">
  Card Title
</Typography>
```

## Body (body-*)

**Use for:** Main content, paragraphs, descriptions

### Variants

- **`body-large`** (16px / 1rem)
  - Use for: Primary reading content, important descriptions
  - Example: Main paragraph text, instructions

- **`body-medium`** (14px / 0.875rem)
  - Use for: Secondary content, descriptions, helper text
  - Example: Card descriptions, form hints

- **`body-small`** (12px / 0.75rem)
  - Use for: Captions, fine print, metadata
  - Example: Timestamps, copyright text

### Usage Examples

```tsx
// Direct Tailwind class
<p className="text-body-lg">This is the main content of the page.</p>

// Typography component
<Typography variant="body-medium">
  This is a description or helper text.
</Typography>
```

## Label (label-*)

**Use for:** UI elements like buttons, tabs, chips, badges

### Variants

- **`label-large`** (14px / 0.875rem)
  - Use for: Large buttons, prominent chips, primary actions
  - Example: "Start Learning" button, "Submit" button

- **`label-medium`** (12px / 0.75rem)
  - Use for: Standard buttons, form labels, tabs
  - Example: Form field labels, secondary buttons

- **`label-small`** (11px / 0.6875rem)
  - Use for: Small chips, indicators, tooltips, badges
  - Example: Status badges, count indicators

### Usage Examples

```tsx
// Direct Tailwind class
<button className="text-label-lg">Start Learning</button>

// Typography component
<Typography variant="label-medium" as="label">
  Email Address
</Typography>
```

## Component Mapping Guide

Common components and their recommended typography:

```tsx
// Flashcard question
<Typography variant="display-medium" as="h2">
  {question}
</Typography>

// Dashboard welcome message
<Typography variant="headline-large" as="h1">
  Welcome back!
</Typography>

// Section headers
<Typography variant="headline-medium" as="h2">
  Your Progress
</Typography>

// Card titles
<Typography variant="title-large" as="h3">
  Category Name
</Typography>

// Button text
<button className="text-label-lg">
  Continue
</button>

// Form labels
<label className="text-label-md">
  Username
</label>

// Body text, descriptions
<p className="text-body-lg">
  Learn Italian words with interactive flashcards.
</p>

// Helper text, captions
<span className="text-body-sm">
  Last updated: 2 hours ago
</span>

// Small indicators, badges
<span className="text-label-sm">
  New
</span>
```

## Best Practices

### Do's

✅ **Use semantic typography variants** instead of arbitrary text sizes
✅ **Match variant to content hierarchy** (Display > Headline > Title > Body/Label)
✅ **Use Typography component for consistency** when possible
✅ **Maintain proper heading hierarchy** (h1 > h2 > h3, etc.)
✅ **Consider responsive needs** - variants already include optimal sizing

### Don'ts

❌ **Don't use arbitrary text-* classes** like `text-4xl`, `text-lg`, etc.
❌ **Don't override font-weight or line-height** on typography variants
❌ **Don't skip heading levels** (h1 to h3 without h2)
❌ **Don't use display text for body content** - it's too large
❌ **Don't use multiple font weights randomly** - stick to the scale

## Accessibility Considerations

- Maintain proper heading hierarchy for screen readers
- Ensure sufficient color contrast with text (WCAG AA minimum)
- Use semantic HTML elements (`as` prop in Typography component)
- Don't rely solely on size to convey meaning

## Migration from Old Code

When updating existing components:

```tsx
// Before
<h2 className="text-4xl md:text-5xl font-bold">
  Question
</h2>

// After
<Typography variant="display-medium" as="h2">
  Question
</Typography>
// or
<h2 className="text-display-md">
  Question
</h2>
```

```tsx
// Before
<span className="text-lg md:text-2xl font-semibold">
  Mode Title
</span>

// After
<Typography variant="headline-small">
  Mode Title
</Typography>
// or
<span className="text-headline-sm">
  Mode Title
</span>
```

## References

- [Material Design 3 Typography](https://m3.material.io/styles/typography)
- [Typography Design Tokens](../src/design-tokens/typography.ts)
- [Typography Component](../src/components/ui/Typography.tsx)
- [Tailwind Config](../tailwind.config.js)

## Need Help?

If you're unsure which typography variant to use:

1. Consider the content hierarchy (what's most important?)
2. Look at similar components in the codebase
3. Refer to the component mapping guide above
4. Default to body-large for general content
5. Ask in team discussions if still uncertain
