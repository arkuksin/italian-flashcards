# Focus Style Guidelines

This document defines the consistent focus styles used throughout the Italian Flashcards application to ensure excellent keyboard navigation and accessibility.

## Overview

All interactive elements in the application use standardized focus ring styles that are:
- **Visible**: Clear visual feedback when an element has focus
- **Consistent**: Same appearance across all components
- **Accessible**: Meet WCAG 2.4.7 Focus Visible guidelines
- **Adaptive**: Support for dark mode and high contrast preferences

## Global Focus Styles

### Automatic Focus Rings

The application automatically applies focus rings to all standard interactive elements through global CSS rules in `src/index.css`:

- **All focusable elements**: 2px blue ring with 2px offset
- **Buttons**: 2px blue ring with 2px offset
- **Input fields**: 2px blue ring + blue border
- **Links**: 2px blue ring with 2px offset + rounded corners

These styles use `:focus-visible`, which only shows focus rings for keyboard navigation (not mouse clicks).

## Utility Classes

Three utility classes are available for custom focus styling:

### `.focus-ring` (Standard)

Use for most interactive elements like buttons, links, and custom clickable elements.

```tsx
<button className="px-4 py-2 bg-blue-500 focus-ring">
  Click me
</button>
```

**Styles:**
- Ring width: 2px
- Ring color: blue-500 (light) / blue-400 (dark)
- Ring offset: 2px
- Outline: none

### `.focus-ring-inset`

Use for input fields, textareas, and elements where offset ring would be too large.

```tsx
<div className="p-4 rounded focus-ring-inset" tabIndex={0}>
  Custom input element
</div>
```

**Styles:**
- Ring width: 2px (inset)
- Ring color: blue-500 (light) / blue-400 (dark)
- No offset
- Outline: none

### `.focus-ring-thin`

Use for compact UI elements, dense layouts, and icon buttons.

```tsx
<button className="p-1 focus-ring-thin">
  <IconComponent />
</button>
```

**Styles:**
- Ring width: 1px
- Ring color: blue-500 (light) / blue-400 (dark)
- Ring offset: 1px
- Outline: none

## Components

### Focusable Component Wrapper

A utility component for applying focus styles with TypeScript support:

```tsx
import { Focusable } from './components/ui/Focusable';

// Standard focus ring
<Focusable variant="default">
  <button>Click me</button>
</Focusable>

// Inset focus ring
<Focusable variant="inset" as="label">
  <input type="checkbox" />
  <span>Option</span>
</Focusable>

// Thin focus ring
<Focusable variant="thin" as="button">
  <Icon />
</Focusable>
```

### SkipLink Component

Allows keyboard users to skip navigation and jump to main content:

```tsx
import { SkipLink } from './components/ui/SkipLink';

// Default usage
<SkipLink />

// Custom target
<SkipLink targetId="content">
  Skip to content
</SkipLink>
```

The skip link is visually hidden until focused, then appears in the top-left corner.

## Color System

### Light Mode
- Focus ring: `blue-500` (#3B82F6)
- Border on focus: `blue-500` (#3B82F6)

### Dark Mode
- Focus ring: `blue-400` (#60A5FA)
- Border on focus: `blue-400` (#60A5FA)
- Ring offset background: `gray-900` (#111827)

### High Contrast Mode
When `prefers-contrast: high` is enabled:
- Ring width increases to 4px
- Ring color: black (light mode) / white (dark mode)

## Best Practices

### 1. Always Provide Focus States

Every interactive element must have a visible focus state:

```tsx
// ✅ Good - has focus style
<button className="px-4 py-2 bg-blue-500 focus-ring">
  Submit
</button>

// ❌ Bad - no focus style
<button className="px-4 py-2 bg-blue-500">
  Submit
</button>
```

### 2. Use tabIndex for Custom Interactive Elements

If an element is clickable but not naturally focusable, add `tabIndex={0}`:

```tsx
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  className="cursor-pointer focus-ring"
>
  Custom button
</div>
```

### 3. Maintain Logical Focus Order

Ensure the tab order follows the visual flow of the page:
- Top to bottom
- Left to right
- Primary actions before secondary actions

### 4. Don't Remove Focus Styles

Never use `outline: none` or `ring-0` without providing an alternative focus indicator:

```tsx
// ❌ Bad - removes focus without alternative
<button className="outline-none ring-0">
  Click me
</button>

// ✅ Good - custom focus indicator
<button className="outline-none focus:ring-2 focus:ring-green-500">
  Click me
</button>
```

### 5. Test Keyboard Navigation

Always test that:
- All interactive elements are reachable with Tab
- Focus order is logical
- Focus indicators are clearly visible
- Enter/Space keys activate buttons and links
- Escape closes modals/dialogs

## Testing Checklist

- [ ] Tab through all interactive elements
- [ ] Verify focus ring is visible on all elements
- [ ] Check focus ring visibility in light mode
- [ ] Check focus ring visibility in dark mode
- [ ] Test with high contrast mode
- [ ] Ensure focus order is logical
- [ ] Verify Shift+Tab reverse navigation works
- [ ] Test keyboard-only navigation through entire app
- [ ] Check skip link functionality
- [ ] Test with screen reader (NVDA/VoiceOver)

## Accessibility Tools

Use these tools to verify focus states:

1. **Keyboard Navigation**: Tab, Shift+Tab, Enter, Space, Escape
2. **Chrome DevTools**: Lighthouse accessibility audit
3. **Browser Extensions**:
   - axe DevTools
   - WAVE
4. **Screen Readers**:
   - NVDA (Windows)
   - VoiceOver (macOS)
   - JAWS (Windows)

## Examples

### Button with Focus Ring

```tsx
<button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg focus-ring">
  Submit Form
</button>
```

### Input Field (Automatic)

```tsx
// TextField component automatically gets focus styles from global CSS
<TextField
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

### Custom Card Selection

```tsx
<Card
  as="label"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect();
    }
  }}
  className="cursor-pointer transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
>
  <input type="checkbox" className="sr-only" />
  <CardContent />
</Card>
```

### Icon Button

```tsx
<button
  aria-label="Close dialog"
  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus-ring-thin"
>
  <XIcon className="w-5 h-5" />
</button>
```

## Related Documentation

- [UI Improvement: Focus States Inconsistency](ui/16-focus-states-inconsistency.md)
- [Accessibility Guidelines](dev/ACCESSIBILITY.md) (if exists)
- [Code Standards](dev/CODE_STANDARDS.md)

## WCAG References

- [WCAG 2.4.7: Focus Visible](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible)
- [WebAIM: Keyboard Accessibility](https://webaim.org/techniques/keyboard/)
- [MDN: :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)
