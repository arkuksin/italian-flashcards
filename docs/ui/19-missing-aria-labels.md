# Add Missing ARIA Labels

## Issue
Mode selection buttons and other components use emojis (🇷🇺 🇮🇹) without proper ARIA labels, making them unclear for screen reader users.

## Location
`ModeSelection.tsx` and other components using icons/emojis

## Problem Details

**Current usage without ARIA labels:**
```tsx
<span className="text-3xl md:text-5xl">🇷🇺</span>
```

### Issues:
1. **Screen readers announce** "flag: Russia" but context is unclear
2. **Emojis used for functional purposes** without proper labels
3. **Icon-only buttons** lack descriptions
4. **Insufficient semantic information** for assistive technology

## Impact
- Poor screen reader experience
- Accessibility issues (WCAG 4.1.2)
- Confusing for users with visual impairments
- Incomplete accessibility implementation

## Task
Add proper ARIA labels throughout the application:

1. **Add ARIA labels to emoji flags:**
   ```tsx
   // Before
   <span className="text-3xl md:text-5xl">🇷🇺</span>

   // After
   <span
     className="text-3xl md:text-5xl"
     role="img"
     aria-label="Russian language"
   >
     🇷🇺
   </span>
   ```

2. **Update ModeSelection component:**
   ```tsx
   // src/components/ModeSelection.tsx
   <button
     onClick={() => setMode('ru-it')}
     className="..."
     aria-label="Practice Russian to Italian translation"
   >
     <span role="img" aria-label="Russian">🇷🇺</span>
     <ArrowRight className="mx-2" aria-hidden="true" />
     <span role="img" aria-label="Italian">🇮🇹</span>
     <span className="mt-2 text-sm">Russian to Italian</span>
   </button>
   ```

3. **Add ARIA labels to icon-only buttons:**
   ```tsx
   // Header icon buttons
   <button
     onClick={toggleDarkMode}
     className="p-3 rounded-lg hover:bg-gray-100"
     aria-label="Toggle dark mode"
     aria-pressed={isDarkMode}
   >
     <Sun className="w-5 h-5" aria-hidden="true" />
   </button>

   <button
     onClick={toggleShuffle}
     className="p-3 rounded-lg hover:bg-gray-100"
     aria-label="Toggle shuffle mode"
     aria-pressed={isShuffleOn}
   >
     <Shuffle className="w-5 h-5" aria-hidden="true" />
   </button>

   <button
     onClick={restart}
     className="p-3 rounded-lg hover:bg-gray-100"
     aria-label="Restart session"
   >
     <RotateCcw className="w-5 h-5" aria-hidden="true" />
   </button>
   ```

4. **Add ARIA labels to language switcher:**
   ```tsx
   // LanguageSwitcher.tsx
   <button
     onClick={() => setLanguage('en')}
     aria-label="Switch to English"
     aria-current={currentLanguage === 'en'}
   >
     <span role="img" aria-label="English">🇬🇧</span>
   </button>

   <button
     onClick={() => setLanguage('de')}
     aria-label="Switch to German"
     aria-current={currentLanguage === 'de'}
   >
     <span role="img" aria-label="German">🇩🇪</span>
   </button>
   ```

5. **Add descriptive labels to form inputs:**
   ```tsx
   // FlashCard input
   <label htmlFor="answer-input" className="sr-only">
     Type your answer here
   </label>
   <input
     id="answer-input"
     type="text"
     placeholder="Type your answer..."
     aria-label="Answer input field"
     aria-describedby="answer-hint"
   />
   <span id="answer-hint" className="text-sm text-gray-600">
     Press Enter to submit
   </span>
   ```

6. **Add ARIA labels to progress indicators:**
   ```tsx
   // Progress bar
   <div
     role="progressbar"
     aria-label="Learning progress"
     aria-valuenow={progress}
     aria-valuemin={0}
     aria-valuemax={100}
     className="..."
   >
     <div style={{ width: `${progress}%` }} />
   </div>

   // Stats
   <div
     role="status"
     aria-label={`${learned} out of ${total} words learned`}
   >
     <span aria-hidden="true">{learned}/{total}</span>
   </div>
   ```

7. **Add ARIA labels to interactive cards:**
   ```tsx
   // Category cards
   <div
     role="checkbox"
     aria-checked={isSelected}
     aria-labelledby={`category-${category.id}`}
     tabIndex={0}
     onKeyDown={handleKeyPress}
     className="..."
   >
     <h3 id={`category-${category.id}`}>{category.name}</h3>
     <span aria-label={`${category.learned} out of ${category.total} words learned`}>
       {category.learned}/{category.total}
     </span>
   </div>
   ```

8. **Add ARIA live regions for dynamic content:**
   ```tsx
   // Feedback messages
   <div
     role="status"
     aria-live="polite"
     aria-atomic="true"
     className={feedback ? '' : 'sr-only'}
   >
     {feedback && (
       <p>
         <span className="sr-only">
           {isCorrect ? 'Correct answer:' : 'Incorrect. The correct answer is:'}
         </span>
         {feedback}
       </p>
     )}
   </div>

   // Toast notifications
   <div
     role="alert"
     aria-live="assertive"
     aria-atomic="true"
   >
     {toast.message}
   </div>
   ```

9. **Add descriptive labels to navigation:**
   ```tsx
   // TaskModeAppBar breadcrumbs
   <nav aria-label="Breadcrumb">
     <ol className="flex items-center gap-2">
       <li>
         <a href="/dashboard" aria-label="Go to dashboard">
           Dashboard
         </a>
       </li>
       <li aria-current="page">
         Exercise Mode
       </li>
     </ol>
   </nav>
   ```

10. **Add ARIA labels to modal/dialog:**
    ```tsx
    <div
      role="dialog"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      aria-modal="true"
    >
      <h2 id="modal-title">Confirm Action</h2>
      <p id="modal-description">
        Are you sure you want to restart your session?
      </p>
      <button aria-label="Confirm restart">Yes</button>
      <button aria-label="Cancel">No</button>
    </div>
    ```

11. **Hide decorative elements from screen readers:**
    ```tsx
    // Decorative icons
    <Icon className="..." aria-hidden="true" />

    // Decorative images
    <img src="..." alt="" aria-hidden="true" />

    // Decorative emojis (when text label is present)
    <button aria-label="Delete item">
      <span aria-hidden="true">🗑️</span>
    </button>
    ```

12. **Create ARIA label utility component:**
    ```tsx
    // src/components/ui/AriaLabel.tsx
    interface AriaLabelProps {
      children: React.ReactNode;
      label: string;
      role?: string;
    }

    export const AriaLabel: React.FC<AriaLabelProps> = ({
      children,
      label,
      role = 'img',
    }) => (
      <span role={role} aria-label={label}>
        {children}
      </span>
    );

    // Usage
    <AriaLabel label="Russian language">🇷🇺</AriaLabel>
    ```

13. **Audit all components for missing ARIA labels:**
    ```bash
    # Find elements that might need ARIA labels
    grep -r "onClick" src/ | grep -v "aria-label"
    grep -r "<button" src/ | grep -v "aria-label"
    grep -r "role=" src/
    grep -r "🇷🇺\|🇮🇹\|🇬🇧\|🇩🇪" src/ # Find emoji flags
    ```

14. **Test with screen readers:**
    - NVDA (Windows)
    - VoiceOver (Mac/iOS)
    - JAWS (Windows)
    - TalkBack (Android)

## Success Criteria
- All icon-only buttons have ARIA labels
- All emojis used functionally have role="img" and aria-label
- Form inputs have proper labels (visible or sr-only)
- Progress indicators have appropriate ARIA attributes
- Interactive elements have descriptive labels
- Decorative elements hidden from screen readers
- Screen reader testing confirms good experience
- Accessibility audit passes

## Testing Checklist
- [ ] Test with NVDA screen reader
- [ ] Test with VoiceOver
- [ ] Run axe DevTools audit
- [ ] Run WAVE accessibility audit
- [ ] Run Lighthouse accessibility audit
- [ ] Verify all interactive elements are properly labeled
- [ ] Check that decorative elements are hidden
- [ ] Test keyboard navigation with screen reader
- [ ] Get feedback from screen reader users

## Common ARIA Patterns
```tsx
// Button with icon only
<button aria-label="Description">
  <Icon aria-hidden="true" />
</button>

// Button with icon and text
<button>
  <Icon aria-hidden="true" />
  <span>Description</span>
</button>

// Toggle button
<button aria-pressed={isPressed} aria-label="Toggle feature">
  <Icon />
</button>

// Link with icon
<a href="..." aria-label="Go to page">
  <Icon aria-hidden="true" />
</a>

// Decorative emoji
<span role="img" aria-label="Description">🎉</span>

// Hide decorative emoji
<span aria-hidden="true">🎉</span>
<span className="sr-only">Celebration</span>
```

## References
- UI_Review.md: Section 2.8 - Accessibility Gaps: Missing ARIA Labels
- WCAG 4.1.2: Name, Role, Value
- WAI-ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- MDN: ARIA Labels
