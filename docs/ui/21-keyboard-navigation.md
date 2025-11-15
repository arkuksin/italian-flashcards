# Complete Keyboard Navigation

## Issue
Custom keyboard shortcuts exist but not all components support comprehensive keyboard navigation. Missing features include tab order optimization, skip links, arrow key navigation in grids, and inconsistent Escape key behavior.

## Locations
Throughout the application

## Problem Details

**Current keyboard navigation gaps:**
- Some components trap focus
- No skip links for keyboard users
- No arrow key navigation in category grid
- Escape key doesn't always work consistently
- Tab order not optimized in some views

### Issues:
1. **Tab order** not optimized (some components trap focus)
2. **No skip links** for main content
3. **Arrow key navigation** missing in category grid
4. **Escape key** inconsistent behavior
5. **Keyboard shortcuts** not documented for users

## Impact
- Poor keyboard-only user experience
- Accessibility issues (WCAG 2.1.1, 2.1.2, 2.4.1)
- Frustration for power users
- Incomplete keyboard support

## Task
Implement comprehensive keyboard navigation:

1. **Add skip link at top of page:**
   ```tsx
   // src/components/layout/SkipLink.tsx
   export const SkipLink = () => (
     <a
       href="#main-content"
       className="sr-only focus:not-sr-only focus:absolute
                  focus:top-4 focus:left-4 focus:z-50
                  focus:px-4 focus:py-2 focus:rounded-lg
                  focus:bg-blue-600 focus:text-white
                  focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
     >
       Skip to main content
     </a>
   );

   // Usage in App.tsx
   <div>
     <SkipLink />
     <Header />
     <main id="main-content">
       {/* Content */}
     </main>
   </div>
   ```

2. **Implement roving tabindex for category grid:**
   ```tsx
   // src/components/CategoryFilter/CategoryGrid.tsx
   import { useRovingTabIndex } from '@/hooks/useRovingTabIndex';

   export const CategoryGrid = ({ categories }: CategoryGridProps) => {
     const { currentIndex, setCurrentIndex, handleKeyDown } = useRovingTabIndex({
       itemCount: categories.length,
       columns: 2, // Grid columns
     });

     return (
       <div
         role="grid"
         aria-label="Category selection"
         className="grid grid-cols-2 gap-4"
       >
         {categories.map((category, index) => (
           <div
             key={category.id}
             role="gridcell"
             tabIndex={currentIndex === index ? 0 : -1}
             onKeyDown={(e) => handleKeyDown(e, index)}
             onFocus={() => setCurrentIndex(index)}
             className="..."
           >
             {/* Category content */}
           </div>
         ))}
       </div>
     );
   };
   ```

3. **Create useRovingTabIndex hook:**
   ```tsx
   // src/hooks/useRovingTabIndex.ts
   import { useState, useCallback } from 'react';

   interface UseRovingTabIndexProps {
     itemCount: number;
     columns?: number;
     loop?: boolean;
   }

   export const useRovingTabIndex = ({
     itemCount,
     columns = 1,
     loop = true,
   }: UseRovingTabIndexProps) => {
     const [currentIndex, setCurrentIndex] = useState(0);

     const handleKeyDown = useCallback(
       (e: React.KeyboardEvent, index: number) => {
         let nextIndex = index;

         switch (e.key) {
           case 'ArrowRight':
             e.preventDefault();
             nextIndex = index + 1;
             if (nextIndex >= itemCount && loop) nextIndex = 0;
             break;

           case 'ArrowLeft':
             e.preventDefault();
             nextIndex = index - 1;
             if (nextIndex < 0 && loop) nextIndex = itemCount - 1;
             break;

           case 'ArrowDown':
             e.preventDefault();
             nextIndex = index + columns;
             if (nextIndex >= itemCount && loop) nextIndex = nextIndex % itemCount;
             break;

           case 'ArrowUp':
             e.preventDefault();
             nextIndex = index - columns;
             if (nextIndex < 0 && loop) nextIndex = itemCount + nextIndex;
             break;

           case 'Home':
             e.preventDefault();
             nextIndex = 0;
             break;

           case 'End':
             e.preventDefault();
             nextIndex = itemCount - 1;
             break;

           default:
             return;
         }

         if (nextIndex >= 0 && nextIndex < itemCount) {
           setCurrentIndex(nextIndex);
           // Focus the element
           const elements = document.querySelectorAll('[role="gridcell"]');
           (elements[nextIndex] as HTMLElement)?.focus();
         }
       },
       [itemCount, columns, loop]
     );

     return { currentIndex, setCurrentIndex, handleKeyDown };
   };
   ```

4. **Implement consistent Escape key behavior:**
   ```tsx
   // src/hooks/useEscapeKey.ts
   import { useEffect } from 'react';

   export const useEscapeKey = (callback: () => void, enabled = true) => {
     useEffect(() => {
       if (!enabled) return;

       const handleEscape = (e: KeyboardEvent) => {
         if (e.key === 'Escape') {
           e.preventDefault();
           callback();
         }
       };

       document.addEventListener('keydown', handleEscape);
       return () => document.removeEventListener('keydown', handleEscape);
     }, [callback, enabled]);
   };

   // Usage
   const Modal = ({ onClose, isOpen }) => {
     useEscapeKey(onClose, isOpen);

     return (
       <div role="dialog" aria-modal="true">
         {/* Modal content */}
       </div>
     );
   };
   ```

5. **Add keyboard shortcuts documentation:**
   ```tsx
   // src/components/KeyboardShortcutsHelp.tsx
   export const KeyboardShortcutsHelp = () => (
     <div role="dialog" aria-labelledby="shortcuts-title">
       <h2 id="shortcuts-title">Keyboard Shortcuts</h2>

       <section>
         <h3>Navigation</h3>
         <dl>
           <dt><kbd>Tab</kbd></dt>
           <dd>Move to next interactive element</dd>

           <dt><kbd>Shift</kbd> + <kbd>Tab</kbd></dt>
           <dd>Move to previous interactive element</dd>

           <dt><kbd>Escape</kbd></dt>
           <dd>Close modal or dialog</dd>

           <dt><kbd>Alt</kbd> + <kbd>S</kbd></dt>
           <dd>Skip to main content</dd>
         </dl>
       </section>

       <section>
         <h3>Flashcard Controls</h3>
         <dl>
           <dt><kbd>Enter</kbd></dt>
           <dd>Submit answer</dd>

           <dt><kbd>1</kbd></dt>
           <dd>Rate as "Again"</dd>

           <dt><kbd>2</kbd></dt>
           <dd>Rate as "Hard"</dd>

           <dt><kbd>3</kbd></dt>
           <dd>Rate as "Good"</dd>

           <dt><kbd>4</kbd></dt>
           <dd>Rate as "Easy"</dd>

           <dt><kbd>Space</kbd></dt>
           <dd>Reveal answer</dd>
         </dl>
       </section>

       <section>
         <h3>Category Grid</h3>
         <dl>
           <dt><kbd>Arrow Keys</kbd></dt>
           <dd>Navigate between categories</dd>

           <dt><kbd>Space</kbd> or <kbd>Enter</kbd></dt>
           <dd>Select/deselect category</dd>

           <dt><kbd>Home</kbd></dt>
           <dd>Go to first category</dd>

           <dt><kbd>End</kbd></dt>
           <dd>Go to last category</dd>
         </dl>
       </section>
     </div>
   );

   // Trigger with keyboard shortcut
   // Press ? to show shortcuts
   const App = () => {
     const [showShortcuts, setShowShortcuts] = useState(false);

     useEffect(() => {
       const handleKeyPress = (e: KeyboardEvent) => {
         if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
           e.preventDefault();
           setShowShortcuts(true);
         }
       };

       document.addEventListener('keydown', handleKeyPress);
       return () => document.removeEventListener('keydown', handleKeyPress);
     }, []);

     return (
       <div>
         {/* App content */}
         {showShortcuts && (
           <Modal onClose={() => setShowShortcuts(false)}>
             <KeyboardShortcutsHelp />
           </Modal>
         )}
       </div>
     );
   };
   ```

6. **Fix focus traps in modals:**
   ```tsx
   // Use FocusTrap from @headlessui/react or similar
   import { Dialog, FocusTrap } from '@headlessui/react';

   const Modal = ({ isOpen, onClose, children }) => (
     <Dialog open={isOpen} onClose={onClose}>
       <FocusTrap>
         <div>
           {/* Modal content */}
           {children}
         </div>
       </FocusTrap>
     </Dialog>
   );
   ```

7. **Optimize tab order:**
   ```tsx
   // Ensure logical tab order
   // Use tabIndex carefully

   // Good tab order
   <div>
     <Header />  {/* tabIndex 0 (natural) */}
     <main>
       <PrimaryAction />  {/* tabIndex 0 */}
       <SecondaryAction />  {/* tabIndex 0 */}
     </main>
     <Footer />  {/* tabIndex 0 */}
   </div>

   // Avoid
   <div>
     <button tabIndex={3}>Third</button>
     <button tabIndex={1}>First</button>
     <button tabIndex={2}>Second</button>
   </div>
   ```

8. **Add keyboard event handlers:**
   ```tsx
   // CategoryCard - make clickable with keyboard
   <div
     role="checkbox"
     aria-checked={isSelected}
     tabIndex={0}
     onClick={handleToggle}
     onKeyDown={(e) => {
       if (e.key === 'Enter' || e.key === ' ') {
         e.preventDefault();
         handleToggle();
       }
     }}
     className="cursor-pointer focus-ring"
   >
     {/* Card content */}
   </div>
   ```

9. **Implement global keyboard shortcuts:**
   ```tsx
   // src/hooks/useGlobalShortcuts.ts
   export const useGlobalShortcuts = () => {
     useEffect(() => {
       const handleShortcut = (e: KeyboardEvent) => {
         // Only if not in input/textarea
         if (e.target instanceof HTMLInputElement ||
             e.target instanceof HTMLTextAreaElement) {
           return;
         }

         // Ctrl/Cmd + K: Search
         if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
           e.preventDefault();
           openSearch();
         }

         // ?: Show keyboard shortcuts
         if (e.key === '?') {
           e.preventDefault();
           showKeyboardShortcuts();
         }

         // Alt + D: Toggle dark mode
         if (e.altKey && e.key === 'd') {
           e.preventDefault();
           toggleDarkMode();
         }
       };

       document.addEventListener('keydown', handleShortcut);
       return () => document.removeEventListener('keydown', handleShortcut);
     }, []);
   };
   ```

10. **Add visual keyboard shortcut hints:**
    ```tsx
    // Show keyboard hints on buttons
    <button className="...">
      Delete
      <kbd className="ml-2 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">
        Del
      </kbd>
    </button>

    <button className="...">
      Submit Answer
      <kbd className="ml-2 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">
        ↵
      </kbd>
    </button>
    ```

11. **Test keyboard navigation:**
    ```
    Testing checklist:
    - [ ] Tab through entire application
    - [ ] Shift+Tab reverse navigation works
    - [ ] All interactive elements are reachable
    - [ ] Focus order is logical
    - [ ] Focus visible on all elements
    - [ ] Escape closes modals/dialogs
    - [ ] Enter/Space activates buttons
    - [ ] Arrow keys work in grids/lists
    - [ ] Skip link works
    - [ ] No focus traps (except modals)
    - [ ] Keyboard shortcuts work
    - [ ] ? shows shortcuts help
    ```

## Success Criteria
- All interactive elements reachable via keyboard
- Logical tab order throughout application
- Skip link implemented
- Arrow key navigation works in grids
- Escape key closes modals consistently
- Focus traps work correctly in modals
- Keyboard shortcuts documented and accessible
- WCAG 2.1 keyboard guidelines met
- Keyboard-only testing confirms smooth navigation

## Testing Tools
- Keyboard only (no mouse)
- Tab order visualization
- Chrome DevTools Accessibility inspector
- axe DevTools
- Screen reader + keyboard navigation

## References
- UI_Review.md: Section 2.8 - Accessibility Gaps: Keyboard Navigation Incomplete
- WCAG 2.1.1: Keyboard - https://www.w3.org/WAI/WCAG21/Understanding/keyboard
- WCAG 2.1.2: No Keyboard Trap
- WCAG 2.4.1: Bypass Blocks
- WAI-ARIA Authoring Practices: Keyboard Navigation
