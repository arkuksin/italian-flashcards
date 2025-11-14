# Spacing System

This document describes the standardized spacing system for consistent vertical and horizontal rhythm throughout the application.

## Overview

The spacing system provides semantic spacing tokens that replace arbitrary Tailwind CSS values, ensuring visual consistency and easier maintenance.

**Related:**
- Implementation: [`docs/ui/08-vertical-spacing-inconsistency.md`](08-vertical-spacing-inconsistency.md)
- Constants: [`src/constants/spacing.ts`](../../src/constants/spacing.ts)
- Components: [`src/components/ui/Stack.tsx`](../../src/components/ui/Stack.tsx)

## Quick Reference

### Spacing Scale

| Size | Value | Tailwind | Use Case |
|------|-------|----------|----------|
| `xs` | 8px | `gap-2`, `mb-2`, `space-y-2` | Small elements, tight spacing |
| `sm` | 12px | `gap-3`, `mb-3`, `space-y-3` | Compact sections, list items |
| `md` | 16px | `gap-4`, `mb-4`, `space-y-4` | Default spacing, form fields |
| `lg` | 24px | `gap-6`, `mb-6`, `space-y-6` | Comfortable sections |
| `xl` | 32px | `gap-8`, `mb-8`, `space-y-8` | Large sections, card stacks |
| `2xl` | 40px | `mb-10`, `space-y-10` | Major page sections |
| `3xl` | 48px | `mb-12`, `space-y-12` | Page divisions |
| `4xl` | 64px | `mb-16`, `space-y-16` | Hero sections, distinct areas |

## Usage

### Import

```tsx
import {
  MARGIN_BOTTOM,
  GAP,
  VERTICAL_SPACING,
  PADDING,
  SPACING_PATTERNS
} from '../constants/spacing';
```

Adjust the path based on your file location:
- From `src/components/`: `'../constants/spacing'`
- From `src/components/ui/`: `'../../constants/spacing'`
- From `src/components/auth/`: `'../../constants/spacing'`

### Vertical Spacing (space-y)

Use for stacking elements vertically:

```tsx
// Before
<div className="space-y-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// After
<div className={VERTICAL_SPACING.md}>
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Margin Bottom

Use for section separators:

```tsx
// Before
<div className="mb-6">
  <h2>Section Title</h2>
</div>

// After
<div className={MARGIN_BOTTOM.lg}>
  <h2>Section Title</h2>
</div>
```

### Gap (Flex/Grid)

Use for gaps in flex or grid layouts:

```tsx
// Before
<div className="flex gap-3">
  <button>Cancel</button>
  <button>Submit</button>
</div>

// After
<div className={`flex ${GAP.sm}`}>
  <button>Cancel</button>
  <button>Submit</button>
</div>
```

### Padding

Use for container internal spacing:

```tsx
// Before
<div className="p-6 bg-white rounded-lg">
  Content
</div>

// After
<div className={`${PADDING.comfortable} bg-white rounded-lg`}>
  Content
</div>
```

### Spacing Patterns

Use semantic patterns for common scenarios:

```tsx
// Form field
<div className={SPACING_PATTERNS.formField}>
  <label>Name</label>
  <input type="text" />
</div>

// Icon + Text
<div className={`flex items-center ${SPACING_PATTERNS.iconText}`}>
  <Icon className="w-5 h-5" />
  <span>Label</span>
</div>

// Button group
<div className={`flex ${SPACING_PATTERNS.buttonGroup}`}>
  <button>Action 1</button>
  <button>Action 2</button>
</div>
```

## Stack Component

For complex vertical layouts, use the Stack component:

```tsx
import { Stack } from '../components/ui/Stack';

<Stack spacing="md">
  <Section1 />
  <Section2 />
  <Section3 />
</Stack>
```

**Props:**
- `spacing`: Size of vertical spacing (`xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`)
- `className`: Additional CSS classes
- `as`: HTML element type (default: `div`)

**Horizontal Stack (HStack):**

```tsx
import { HStack } from '../components/ui/Stack';

<HStack spacing="sm" align="center" justify="between">
  <div>Left</div>
  <div>Right</div>
</HStack>
```

## Available Constants

### VERTICAL_SPACING

```tsx
VERTICAL_SPACING.xs   // space-y-2 (8px)
VERTICAL_SPACING.sm   // space-y-3 (12px)
VERTICAL_SPACING.md   // space-y-4 (16px)
VERTICAL_SPACING.lg   // space-y-6 (24px)
VERTICAL_SPACING.xl   // space-y-8 (32px)
VERTICAL_SPACING['2xl']  // space-y-10 (40px)
VERTICAL_SPACING['3xl']  // space-y-12 (48px)
```

### MARGIN_BOTTOM

```tsx
MARGIN_BOTTOM.xs   // mb-2 (8px)
MARGIN_BOTTOM.sm   // mb-3 (12px)
MARGIN_BOTTOM.md   // mb-4 (16px)
MARGIN_BOTTOM.lg   // mb-6 (24px)
MARGIN_BOTTOM.xl   // mb-8 (32px)
MARGIN_BOTTOM['2xl']  // mb-10 (40px)
MARGIN_BOTTOM['3xl']  // mb-12 (48px)
MARGIN_BOTTOM['4xl']  // mb-16 (64px)
```

### GAP

```tsx
GAP.xs   // gap-2 (8px)
GAP.sm   // gap-3 (12px)
GAP.md   // gap-4 (16px)
GAP.lg   // gap-6 (24px)
GAP.xl   // gap-8 (32px)
```

### PADDING

```tsx
PADDING.compact      // p-3 (12px)
PADDING.default      // p-4 (16px)
PADDING.comfortable  // p-6 (24px)
PADDING.spacious     // p-8 (32px)
```

### SPACING_PATTERNS

Semantic patterns for common use cases:

```tsx
SPACING_PATTERNS.cardSection      // mb-4
SPACING_PATTERNS.cardStack        // space-y-4
SPACING_PATTERNS.formField        // mb-4
SPACING_PATTERNS.formSection      // mb-6
SPACING_PATTERNS.listItem         // mb-2
SPACING_PATTERNS.labelToInput     // mb-2
SPACING_PATTERNS.sectionHeader    // mb-6
SPACING_PATTERNS.pageHeader       // mb-8
SPACING_PATTERNS.buttonGroup      // gap-3
SPACING_PATTERNS.iconText         // gap-2
```

## Guidelines

### When to Use Each Size

**xs (8px)** - Tight spacing
- Small list items
- Icon + text combinations
- Labels above inputs
- Compact card elements

**sm (12px)** - Compact spacing
- Menu items
- Compact form sections
- Button groups
- Badge spacing

**md (16px)** - Default spacing
- Form fields
- Card internal sections
- Default list items
- General content spacing

**lg (24px)** - Comfortable spacing
- Content sections
- Form section separators
- Comfortable reading areas
- Card content groups

**xl (32px)** - Large spacing
- Between cards in a list
- Dashboard widgets
- Major component separators
- Page content blocks

**2xl-4xl (40px-64px)** - Section spacing
- Page sections
- Major navigation areas
- Hero sections
- Distinct page areas

### Combining with Tailwind Classes

When combining with other Tailwind classes, use template literals:

```tsx
// Single constant
<div className={MARGIN_BOTTOM.md}>

// With other classes
<div className={`${MARGIN_BOTTOM.lg} text-center`}>

// Multiple constants
<div className={`${PADDING.comfortable} ${MARGIN_BOTTOM.lg} bg-white`}>

// In template literals
<div className={`flex ${GAP.sm} ${isActive ? 'bg-blue-500' : 'bg-gray-100'}`}>
```

### TypeScript Support

All constants are fully typed for TypeScript autocomplete:

```tsx
import type {
  VerticalSpacingKey,
  MarginBottomKey,
  GapKey,
  PaddingKey,
  SpacingPatternKey
} from '../constants/spacing';

// Type-safe spacing prop
interface Props {
  spacing: VerticalSpacingKey;
}
```

## Migration Guide

### Before (Arbitrary Values)

```tsx
<div className="space-y-3">
  <div className="mb-4 p-6 bg-white">
    <h3 className="mb-2">Title</h3>
    <div className="flex gap-2">
      <Icon />
      <span>Text</span>
    </div>
  </div>
  <div className="flex gap-3">
    <button>Cancel</button>
    <button>Submit</button>
  </div>
</div>
```

### After (Standardized)

```tsx
import { VERTICAL_SPACING, MARGIN_BOTTOM, PADDING, GAP, SPACING_PATTERNS } from '../constants/spacing';

<div className={VERTICAL_SPACING.sm}>
  <div className={`${MARGIN_BOTTOM.md} ${PADDING.comfortable} bg-white`}>
    <h3 className={MARGIN_BOTTOM.xs}>Title</h3>
    <div className={`flex ${SPACING_PATTERNS.iconText}`}>
      <Icon />
      <span>Text</span>
    </div>
  </div>
  <div className={`flex ${SPACING_PATTERNS.buttonGroup}`}>
    <button>Cancel</button>
    <button>Submit</button>
  </div>
</div>
```

## Common Patterns

### Form Layout

```tsx
<form className={VERTICAL_SPACING.lg}>
  <div className={SPACING_PATTERNS.formField}>
    <label className={SPACING_PATTERNS.labelToInput}>Email</label>
    <input type="email" />
  </div>

  <div className={SPACING_PATTERNS.formField}>
    <label className={SPACING_PATTERNS.labelToInput}>Password</label>
    <input type="password" />
  </div>

  <div className={`flex ${SPACING_PATTERNS.buttonGroup} justify-end`}>
    <button type="button">Cancel</button>
    <button type="submit">Submit</button>
  </div>
</form>
```

### Card Layout

```tsx
<div className={`${PADDING.comfortable} bg-white rounded-lg`}>
  <h2 className={SPACING_PATTERNS.sectionHeader}>Title</h2>

  <div className={SPACING_PATTERNS.cardSection}>
    <p>First section content</p>
  </div>

  <div className={SPACING_PATTERNS.cardSection}>
    <p>Second section content</p>
  </div>

  <div className={`flex ${SPACING_PATTERNS.buttonGroup} justify-end`}>
    <button>Action</button>
  </div>
</div>
```

### List Layout

```tsx
<div className={VERTICAL_SPACING.xs}>
  {items.map(item => (
    <div key={item.id} className={`flex ${SPACING_PATTERNS.iconText}`}>
      <Icon className="w-5 h-5" />
      <span>{item.label}</span>
    </div>
  ))}
</div>
```

## Best Practices

1. **Use semantic patterns first** - Check `SPACING_PATTERNS` before using raw constants
2. **Prefer Stack components** - For vertical layouts with consistent spacing
3. **Be consistent** - Use the same spacing size for similar elements
4. **Don't mix arbitrary values** - Always use constants, never hardcode spacing
5. **Document deviations** - If you must use a custom value, document why

## Related Documentation

- [Vertical Spacing Inconsistency Issue](08-vertical-spacing-inconsistency.md)
- [Card Component](../../src/components/ui/Card.tsx)
- [Stack Component](../../src/components/ui/Stack.tsx)
- [Spacing Constants](../../src/constants/spacing.ts)

## Troubleshooting

**Q: Which constant should I use?**
A: Start with semantic patterns (`SPACING_PATTERNS.*`), then use the size guide above.

**Q: Can I still use Tailwind spacing directly?**
A: Avoid it. Always use the standardized constants for maintainability.

**Q: What about horizontal spacing?**
A: Use `GAP` for flex/grid layouts. Horizontal margins (ml-, mr-, px-) can still use Tailwind directly if needed.

**Q: How do I handle responsive spacing?**
A: Use Tailwind responsive prefixes with constants:
```tsx
className={`${MARGIN_BOTTOM.md} md:${MARGIN_BOTTOM.lg}`}
```

**Q: What if I need a spacing value not in the scale?**
A: Evaluate if it's truly necessary. If so, propose adding it to the scale. Avoid arbitrary values.
