# Standardize Focus States

## Issue
Different components use inconsistent focus styles, creating unpredictable visual feedback for keyboard users.

## Locations
Throughout the application

## Problem Details

**Current inconsistent focus styles:**
```tsx
// FlashCard input
focus:border-blue-500 focus:outline-none

// Buttons in various places
focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2

// CategoryFilter
// No focus style defined
```

### Issues:
1. **Inconsistent visual feedback** for keyboard users
2. **Some components have no focus styles**
3. **Different focus ring implementations**
4. **Accessibility concerns**

## Impact
- Poor keyboard navigation experience
- Accessibility issues (WCAG 2.4.7 Focus Visible)
- Unpredictable user experience
- Compliance issues

## Task
Create and implement consistent focus states throughout the application:

1. **Define global focus ring utility:**
   ```css
   /* src/index.css */
   @layer utilities {
     .focus-ring {
       @apply focus:outline-none
              focus:ring-2
              focus:ring-blue-500
              focus:ring-offset-2
              dark:focus:ring-blue-400
              dark:focus:ring-offset-gray-900;
     }

     .focus-ring-inset {
       @apply focus:outline-none
              focus:ring-2
              focus:ring-inset
              focus:ring-blue-500
              dark:focus:ring-blue-400;
     }

     .focus-ring-thin {
       @apply focus:outline-none
              focus:ring-1
              focus:ring-blue-500
              focus:ring-offset-1
              dark:focus:ring-blue-400;
     }
   }
   ```

2. **Define focus styles for different component types:**
   ```css
   @layer base {
     /* Default focus visible for all focusable elements */
     *:focus-visible {
       @apply outline-none
              ring-2
              ring-blue-500
              ring-offset-2
              dark:ring-blue-400
              dark:ring-offset-gray-900;
     }

     /* Buttons */
     button:focus-visible {
       @apply outline-none
              ring-2
              ring-blue-500
              ring-offset-2;
     }

     /* Input fields */
     input:focus-visible,
     textarea:focus-visible,
     select:focus-visible {
       @apply outline-none
              ring-2
              ring-blue-500
              border-blue-500;
     }

     /* Links */
     a:focus-visible {
       @apply outline-none
              ring-2
              ring-blue-500
              ring-offset-2
              rounded;
     }
   }
   ```

3. **Create FocusableComponent wrapper (optional):**
   ```tsx
   // src/components/ui/FocusableComponent.tsx
   interface FocusableProps {
     children: React.ReactNode;
     className?: string;
     variant?: 'default' | 'inset' | 'thin';
   }

   export const Focusable: React.FC<FocusableProps> = ({
     children,
     className = '',
     variant = 'default',
   }) => {
     const focusClasses = {
       default: 'focus-ring',
       inset: 'focus-ring-inset',
       thin: 'focus-ring-thin',
     };

     return (
       <div className={`${focusClasses[variant]} ${className}`}>
         {children}
       </div>
     );
   };
   ```

4. **Update all interactive components:**

   **Buttons:**
   ```tsx
   // Before
   <button className="px-4 py-2 bg-blue-500">

   // After
   <button className="px-4 py-2 bg-blue-500 focus-ring">
   ```

   **Input fields:**
   ```tsx
   // Before
   <input className="px-4 py-2 border">

   // After
   <input className="px-4 py-2 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
   ```

   **Links:**
   ```tsx
   // Before
   <a href="/path">

   // After
   <a href="/path" className="focus-ring rounded">
   ```

   **Custom components:**
   ```tsx
   // Category cards
   <div className="cursor-pointer focus-ring" tabIndex={0}>

   // Modal close button
   <button className="focus-ring" aria-label="Close">
   ```

5. **Ensure focus visible for all interactive elements:**
   ```tsx
   // Add tabIndex for non-standard interactive elements
   <div
     role="button"
     tabIndex={0}
     onClick={handleClick}
     onKeyDown={handleKeyPress}
     className="focus-ring cursor-pointer"
   >
     Custom clickable element
   </div>
   ```

6. **Audit all components for focus styles:**
   ```bash
   # Find all interactive elements
   grep -r "onClick" src/ | grep -v "focus"
   grep -r "button" src/ | grep -v "focus"
   grep -r "input" src/ | grep -v "focus"
   grep -r "tabIndex" src/ | grep -v "focus"
   ```

7. **Test keyboard navigation:**
   ```
   Testing checklist:
   - [ ] Tab through all interactive elements
   - [ ] Verify focus ring is visible on all elements
   - [ ] Check focus ring visibility in light mode
   - [ ] Check focus ring visibility in dark mode
   - [ ] Test with high contrast mode
   - [ ] Ensure focus order is logical
   - [ ] Verify Shift+Tab reverse navigation works
   - [ ] Test keyboard-only navigation through entire app
   ```

8. **Handle specific focus cases:**

   **Skip link (for accessibility):**
   ```tsx
   <a
     href="#main-content"
     className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
                focus-ring px-4 py-2 bg-blue-600 text-white rounded z-50"
   >
     Skip to main content
   </a>
   ```

   **Modal/Dialog focus trap:**
   ```tsx
   import { FocusTrap } from '@headlessui/react';

   <FocusTrap>
     <Dialog>
       {/* Content */}
     </Dialog>
   </FocusTrap>
   ```

   **Custom focus indicators for cards:**
   ```tsx
   <div
     tabIndex={0}
     className="relative p-4 rounded-xl
                focus:outline-none
                focus:ring-2 focus:ring-blue-500
                focus:ring-offset-2"
   >
     {/* Card content */}
   </div>
   ```

9. **Respect user preferences:**
   ```css
   /* Hide focus ring for mouse users (optional) */
   .no-focus-visible:focus:not(:focus-visible) {
     @apply ring-0;
   }

   /* Enhance focus for high contrast mode */
   @media (prefers-contrast: high) {
     *:focus-visible {
       @apply ring-4 ring-black dark:ring-white;
     }
   }
   ```

10. **Document focus style guidelines:**
    ```markdown
    # Focus Style Guidelines

    ## Standard Focus Ring
    Use `focus-ring` class for most interactive elements:
    - Buttons
    - Links
    - Custom clickable elements

    ## Inset Focus Ring
    Use `focus-ring-inset` for:
    - Input fields
    - Textareas
    - Elements where offset ring would be too large

    ## Thin Focus Ring
    Use `focus-ring-thin` for:
    - Compact UI elements
    - Dense layouts
    - Icon buttons

    ## Colors
    - Primary focus color: blue-500 (light mode)
    - Primary focus color: blue-400 (dark mode)
    - Ring width: 2px (standard)
    - Ring offset: 2px (standard)
    ```

## Success Criteria
- All interactive elements have visible focus states
- Focus styles are consistent across the application
- Global focus utilities implemented
- Keyboard navigation works smoothly
- Focus order is logical
- Accessibility audit passes (WCAG 2.4.7)
- Testing with keyboard-only confirms good UX

## Testing Tools
- Keyboard navigation (Tab, Shift+Tab, Enter, Space, Escape)
- Chrome DevTools: Lighthouse accessibility
- axe DevTools browser extension
- WAVE browser extension
- Screen reader testing (NVDA, VoiceOver)

## References
- UI_Review.md: Section 2.6 - Color & Contrast Issues: Focus States Inconsistency
- WCAG 2.4.7: Focus Visible - https://www.w3.org/WAI/WCAG21/Understanding/focus-visible
- WebAIM: Keyboard Accessibility - https://webaim.org/techniques/keyboard/
