# UI Improvement Implementation Prompts

This document contains actionable prompts for implementing all issues and weaknesses identified in the UI/UX Review. Each prompt is self-contained and can be provided to Claude Code for implementation.

**Review Date:** 2025-11-14
**Source:** UI_Review.md
**Total Issues:** 21 prompts

---

## Section 1: Visual Hierarchy Issues

### Prompt 1.1: Fix Dashboard Visual Weight and Hierarchy

**Problem:** The Dashboard mode selection view presents too many elements with equal visual importance, overwhelming users and making it unclear where to start.

**Location:** `src/pages/Dashboard.tsx` (lines 616-700)

**Current State:**
- Mode selection cards, category filter, quick stats, welcome message, gamification widgets, and Leitner box visualizer all have similar visual weight
- No clear primary action
- Users feel overwhelmed

**Implementation Required:**

1. **Increase Mode Selection prominence:**
   - Make mode selection cards larger with more prominent styling
   - Center them with more surrounding white space
   - Add subtle entrance animation to draw attention

2. **Reduce secondary element visual weight:**
   - Use lighter background colors for QuickStats
   - Reduce text size for Statistics section
   - Make gamification widgets more subtle

3. **Add visual hierarchy through:**
   - Size variation (primary actions larger)
   - Color variation (primary actions with accent colors, secondary with neutral)
   - Spacing variation (more space around important elements)

4. **Group related elements:**
   - Add clear section headers with semantic HTML (`<section>`, `<h2>`)
   - Use consistent spacing between groups
   - Consider collapsible sections for less critical information

**Acceptance Criteria:**
- Mode selection cards are visually dominant
- Clear visual hierarchy from primary to secondary content
- Users can immediately identify where to start
- Maintains responsive design on mobile

---

### Prompt 1.2: Standardize Card Component Styles

**Problem:** Different components use varying card styles with inconsistent borders, corner radius, shadows, and opacity values, reducing professional appearance.

**Locations:**
- `src/components/FlashCard.tsx` (line 76)
- `src/components/ModeSelection.tsx` (line 41)
- `src/components/CategoryFilter.tsx` (line 217)
- Multiple other components

**Current Inconsistencies:**
- Border widths: 1px vs 2px
- Corner radius: lg vs xl vs 2xl vs 3xl
- Shadow intensities: none vs md vs lg vs xl vs 2xl
- Opacity values: /80 vs /90 vs solid

**Implementation Required:**

1. **Create reusable Card component:**
   ```tsx
   // src/components/ui/Card.tsx
   export const Card: React.FC<CardProps> = ({
     variant = 'default',
     padding = 'comfortable',
     children,
     className
   }) => {
     const styles = {
       default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-md',
       elevated: 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-xl',
       flat: 'bg-gray-50 dark:bg-gray-900 rounded-lg p-4',
       compact: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm'
     }
     // Implementation details
   }
   ```

2. **Define Card variants:**
   - `default`: Standard cards for most content
   - `elevated`: Important cards with glassmorphism (FlashCard)
   - `flat`: Subtle cards for secondary content
   - `compact`: Dense cards for filters/lists

3. **Replace all card instances:**
   - Update FlashCard to use `<Card variant="elevated">`
   - Update ModeSelection to use `<Card variant="default">`
   - Update CategoryFilter to use `<Card variant="compact">`
   - Update all other card-like divs

4. **Document card usage:**
   - Add JSDoc comments explaining when to use each variant
   - Create examples in component documentation

**Acceptance Criteria:**
- Single Card component used throughout
- Consistent styling across all cards
- All variants properly documented
- Dark mode support maintained
- No visual regression in existing features

---

## Section 2: Component-Level Issues

### Prompt 2.1: Refactor Header for Mobile with Overflow Menu

**Problem:** The Header contains 7+ icon buttons in a row that become tiny or wrap awkwardly on mobile. Icon-only buttons lack clear affordance and active states aren't immediately obvious.

**Location:** `src/components/Header.tsx` (lines 59-128)

**Current Issues:**
- 7+ icon buttons (toggle direction, shuffle, accent sensitivity, restart, dark mode, language, profile)
- Buttons too small on mobile (36×36px, should be 44×44px minimum)
- No visual grouping
- Active states not prominent
- Icon-only design unclear on purpose

**Implementation Required:**

1. **Create responsive header layout:**
   - Desktop: Show all action buttons with labels
   - Mobile: Logo + hamburger menu
   - Use hamburger menu/drawer for secondary actions on mobile

2. **Implement drawer/sheet component:**
   ```tsx
   // Mobile: Drawer with labeled actions
   <Drawer open={drawerOpen} onClose={closeDrawer}>
     <DrawerContent>
       <ActionButton icon={Shuffle} label="Shuffle Cards" active={shuffleEnabled} />
       <ActionButton icon={Repeat} label="Toggle Direction" />
       {/* Other actions with labels */}
     </DrawerContent>
   </Drawer>
   ```

3. **Group related actions:**
   - Learning controls group (shuffle, direction, accent)
   - App settings group (dark mode, language)
   - User profile separate

4. **Improve active states:**
   - Use background color + icon change for active states
   - Add clear visual indicators (e.g., colored background when shuffle is ON)
   - Ensure sufficient color contrast

5. **Increase touch targets:**
   - Change `p-2` to `p-3` for 44×44px minimum
   - Add proper spacing between buttons
   - Ensure hit areas don't overlap

**Acceptance Criteria:**
- Mobile shows hamburger menu for secondary actions
- Desktop shows all actions with tooltips
- Minimum 44×44px touch targets on all buttons
- Active states clearly visible
- Smooth drawer animations
- Maintains all existing functionality

---

### Prompt 2.2: Modernize Input Field Design

**Problem:** Current input design feels dated with heavy borders. Lacks modern patterns like floating labels and visual interest on focus.

**Location:** `src/components/FlashCard.tsx` (lines 130-152)

**Current Issues:**
- Border-heavy design (2024 trend: subtle borders or no borders)
- Small submit button inside input
- No floating label pattern
- Lacks visual interest when focused

**Implementation Required:**

1. **Create modern TextField component:**
   ```tsx
   // src/components/ui/TextField.tsx
   export const TextField = ({ label, value, onChange, ...props }) => (
     <div className="relative">
       <input
         value={value}
         onChange={onChange}
         className="peer w-full px-4 pt-6 pb-2 text-base
                    bg-gray-100 dark:bg-gray-800
                    border-b-2 border-gray-300 dark:border-gray-600
                    rounded-t-xl
                    focus:border-blue-500 focus:bg-gray-50
                    dark:focus:bg-gray-900
                    transition-all"
         placeholder=" "
         {...props}
       />
       <label className="absolute left-4 top-4 text-gray-500
                         pointer-events-none transition-all
                         peer-focus:top-2 peer-focus:text-xs
                         peer-focus:text-blue-500
                         peer-[:not(:placeholder-shown)]:top-2
                         peer-[:not(:placeholder-shown)]:text-xs">
         {label}
       </label>
     </div>
   )
   ```

2. **Implement Material 3 filled style:**
   - Filled background (not just border)
   - Bottom border emphasis (not full border)
   - Floating label animation
   - Subtle elevation change on focus

3. **Improve submit button:**
   - Larger touch target for mobile
   - Clear visual indicator
   - Smooth transition animations
   - Consider external button for better accessibility

4. **Add focus states:**
   - Background color change on focus
   - Border color change
   - Label color change
   - Smooth transitions

**Acceptance Criteria:**
- Floating label animation working
- Material 3 filled style implemented
- Larger touch targets on mobile
- Clear focus states
- Smooth animations
- Maintains accessibility
- Works with dark mode

---

### Prompt 2.3: Improve Difficulty Rating Buttons for Mobile

**Problem:** Difficulty rating buttons become narrow on mobile (difficult to tap accurately), color meanings aren't immediately clear, and there's no visual indication of consequence.

**Location:** `src/components/FlashCard.tsx` (lines 206-263)

**Current Issues:**
- 4-button grid becomes too narrow on mobile
- Color meanings not clear (red = bad, green = good?)
- Labels could be more descriptive
- No feedback on what rating does to learning

**Implementation Required:**

1. **Responsive grid layout:**
   ```tsx
   // Mobile: 2x2 grid
   // Desktop: 1x4 grid
   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
     {/* Rating buttons */}
   </div>
   ```

2. **Add icons to buttons:**
   - Again: 😞 or 👎 icon
   - Hard: 😐 or 🤔 icon
   - Good: 🙂 or 👍 icon
   - Easy: 😊 or ✨ icon

3. **Improve button labels:**
   - Add secondary text explaining consequence
   - Example: "Again" → "Again (Show soon)"
   - Example: "Easy" → "Easy (Show later)"

4. **Add micro-interactions:**
   ```tsx
   // Confetti for "Easy" rating
   const [confetti, setConfetti] = useState(false)

   <motion.button
     onClick={() => {
       if (rating === 4) setConfetti(true)
       onDifficultyRating(rating)
     }}
     whileTap={{ scale: 0.95 }}
     onTouchStart={() => navigator.vibrate?.(10)} // Haptic feedback
   >
     😊 Easy
   </motion.button>
   ```

5. **Add tooltips:**
   - Explain how each rating affects learning schedule
   - Show on hover (desktop) or info icon (mobile)

**Acceptance Criteria:**
- 2x2 grid on mobile, 1x4 on desktop
- Icons added to all buttons
- Clear labels with consequences
- Tooltips explaining rating impact
- Micro-interactions for feedback
- Haptic feedback on mobile (progressive enhancement)
- Maintains current color scheme or improves it

---

### Prompt 2.4: Reduce Category Filter Information Density

**Problem:** Each category card shows too much information (name, total words, learned words, accuracy, checkbox, check icon), causing information overload.

**Location:** `src/components/CategoryFilter.tsx` (lines 207-250)

**Current Issues:**
- Too much information per card
- Hard to scan quickly
- Cluttered appearance
- Difficult to compare categories

**Implementation Required:**

1. **Implement progressive disclosure:**
   - Show only essential info by default (name + mastery percentage)
   - Show full details on hover (desktop) or tap (mobile)
   - Use smooth transitions for detail reveal

2. **Simplify default view:**
   ```tsx
   // Default state: Just category name + progress ring
   <CategoryCard>
     <CategoryIcon />
     <CategoryName>{category.name}</CategoryName>
     <ProgressRing percentage={masteryPercentage} />
   </CategoryCard>

   // Expanded state: Show all details
   <CategoryCard expanded>
     <CategoryIcon />
     <CategoryName>{category.name}</CategoryName>
     <DetailList>
       <Detail>Total: {totalWords}</Detail>
       <Detail>Learned: {learnedWords}</Detail>
       <Detail>Accuracy: {accuracy}%</Detail>
     </DetailList>
   </CategoryCard>
   ```

3. **Add visual indicators:**
   - Progress ring around category icon
   - Color-coded mastery level
   - Simple checkmark when selected (not checkbox)

4. **Highlight most important metric:**
   - Make mastery percentage prominent
   - De-emphasize word counts
   - Use typography hierarchy

**Acceptance Criteria:**
- Simplified default view with essential info only
- Progressive disclosure on hover/tap
- Visual progress indicators (rings or bars)
- Easy to scan and compare categories
- Smooth animations for transitions
- Maintains selection functionality
- Works on mobile and desktop

---

## Section 3: Layout & Spacing Issues

### Prompt 3.1: Standardize Maximum Width Across Pages

**Problem:** Different pages use different max widths (Dashboard: max-w-4xl, Login: max-w-6xl, Analytics: container), reducing visual coherence.

**Locations:** Multiple pages

**Implementation Required:**

1. **Define standard layout widths:**
   ```tsx
   // Create layout constants
   export const layoutWidths = {
     content: 'max-w-4xl',    // For reading/forms (896px)
     dashboard: 'max-w-5xl',  // For cards/grids (1024px)
     wide: 'max-w-6xl',       // For analytics/charts (1152px)
     full: 'max-w-7xl',       // For full-width layouts (1280px)
   }
   ```

2. **Create Layout wrapper components:**
   ```tsx
   // src/components/layout/ContentLayout.tsx
   export const ContentLayout = ({ children, width = 'dashboard' }) => (
     <div className={cn('mx-auto px-4', layoutWidths[width])}>
       {children}
     </div>
   )
   ```

3. **Apply to pages:**
   - Dashboard → `dashboard` width (max-w-5xl)
   - Login/Auth → `content` width (max-w-4xl)
   - Analytics → `wide` width (max-w-6xl)
   - Settings → `content` width (max-w-4xl)

4. **Document usage guidelines:**
   - When to use each width
   - Examples for each layout type

**Acceptance Criteria:**
- Consistent max widths across similar page types
- Layout wrapper components created
- All pages updated to use standard widths
- Guidelines documented
- Responsive behavior maintained

---

### Prompt 3.2: Establish Consistent Vertical Spacing Scale

**Problem:** No clear rhythm or pattern to spacing decisions with variable `mb-` values (mb-2, mb-4, mb-6, mb-8) used inconsistently.

**Evidence:** Variable spacing throughout Dashboard.tsx and other components

**Implementation Required:**

1. **Define spacing scale:**
   ```tsx
   // src/design-system/tokens/spacing.ts
   export const spacing = {
     // Between major sections
     section: 'space-y-12',      // 48px
     sectionLarge: 'space-y-16', // 64px

     // Between cards in a section
     cardStack: 'space-y-8',     // 32px
     cardStackCompact: 'space-y-6', // 24px

     // Inside cards
     cardInternal: 'space-y-4',  // 16px

     // Between small elements
     compact: 'gap-2',           // 8px
     comfortable: 'gap-3',       // 12px
   }
   ```

2. **Create spacing utility:**
   ```tsx
   // Helper for consistent spacing
   export const stackSpace = {
     section: 'mb-12',
     card: 'mb-8',
     element: 'mb-4',
     compact: 'mb-2',
   }
   ```

3. **Apply systematically:**
   - Replace all `mb-*` with semantic spacing values
   - Use `space-y-*` for flex/grid containers
   - Document when to use each spacing level

4. **Add to Tailwind config:**
   ```js
   // tailwind.config.js
   theme: {
     extend: {
       spacing: {
         'section': '3rem',
         'card-stack': '2rem',
         'card-internal': '1rem',
       }
     }
   }
   ```

**Acceptance Criteria:**
- Defined spacing scale documented
- All components updated to use consistent spacing
- Clear rhythm visible between sections
- Guidelines for when to use each spacing level
- No arbitrary spacing values used

---

## Section 4: Mobile & Responsive Issues

### Prompt 4.1: Increase Touch Target Sizes to 44×44px Minimum

**Problem:** Header buttons use 36×36px touch targets, below Apple HIG's 44×44px minimum recommendation.

**Location:** `src/components/Header.tsx` and other interactive elements

**Current State:**
- Buttons use `p-2` padding with `w-5 h-5` icons = 36×36px total
- Below accessibility guidelines

**Implementation Required:**

1. **Update button padding:**
   ```tsx
   // Before
   <button className="p-2 rounded-lg"> {/* 36×36px */}
     <Icon className="w-5 h-5" />
   </button>

   // After
   <button className="p-3 rounded-lg"> {/* 44×44px */}
     <Icon className="w-5 h-5" />
   </button>
   ```

2. **Create minimum touch target utility:**
   ```css
   @layer utilities {
     .touch-target {
       @apply min-w-[44px] min-h-[44px] inline-flex items-center justify-center;
     }
   }
   ```

3. **Audit all interactive elements:**
   - Header buttons
   - Category filter checkboxes
   - Difficulty rating buttons
   - Navigation items
   - Form controls

4. **Test on real devices:**
   - iOS Safari
   - Chrome Android
   - Verify comfortable tapping

**Acceptance Criteria:**
- All interactive elements ≥44×44px
- No overlapping hit areas
- Comfortable tapping on mobile devices
- Visual design maintained
- Utility classes created for reuse

---

### Prompt 4.2: Optimize TaskModeAppBar for Mobile Layout

**Problem:** TaskModeAppBar takes up too much vertical space on small screens with stacked breadcrumbs, progress badges, and button.

**Location:** `src/components/TaskModeAppBar.tsx` (lines 33-101)

**Current Issues:**
- Desktop shows breadcrumbs + progress badges + button in one row
- Mobile stacks everything vertically
- Consumes valuable vertical space on small screens

**Implementation Required:**

1. **Responsive layout changes:**
   ```tsx
   // Desktop: Full breadcrumbs + badges + button
   <div className="hidden md:flex items-center justify-between">
     <Breadcrumbs />
     <ProgressBadges />
     <ExitButton />
   </div>

   // Mobile: Compact title + combined badge + icon button
   <div className="flex md:hidden items-center justify-between">
     <CompactTitle />
     <CombinedProgressBadge />
     <ExitIconButton />
   </div>
   ```

2. **Hide breadcrumbs on mobile:**
   - Replace with simple page title
   - Reduce visual clutter
   - Save vertical space

3. **Combine progress badges:**
   - Single compact badge showing most important metric
   - Example: "45/100 (45%)"
   - Tap to expand full details (optional)

4. **Icon-only button on mobile:**
   - Use X icon instead of "Exit Exercise" text
   - Maintain 44×44px touch target
   - Add aria-label for accessibility

**Acceptance Criteria:**
- Compact mobile layout
- Reduced vertical space usage
- All information still accessible
- Smooth transitions between breakpoints
- Maintains functionality
- Proper ARIA labels for icon-only elements

---

### Prompt 4.3: Improve ModeSelection Card Touch Targets for Small Phones

**Problem:** On very small phones (<375px), mode selection text can wrap awkwardly, and cards don't have minimum height.

**Location:** `src/components/ModeSelection.tsx` (lines 38-83)

**Current Issues:**
- Cards use `p-4 md:p-6` with `text-lg md:text-2xl`
- No minimum height defined
- Text can wrap on small phones

**Implementation Required:**

1. **Add minimum height:**
   ```tsx
   className="min-h-[120px] p-5 md:p-6 flex flex-col items-center justify-center"
   ```

2. **Implement fluid typography:**
   ```tsx
   // Instead of breakpoint-based sizes
   // Use clamp for smooth scaling
   style={{
     fontSize: 'clamp(1rem, 4vw, 1.5rem)',
     lineHeight: '1.3'
   }}
   ```

3. **Improve layout on small screens:**
   - Ensure adequate padding
   - Prevent text wrapping where possible
   - Center content vertically and horizontally

4. **Test on small devices:**
   - iPhone SE (375px width)
   - Small Android devices
   - Ensure comfortable tapping and reading

**Acceptance Criteria:**
- Minimum height prevents cards from being too small
- Fluid typography scales smoothly
- No awkward text wrapping
- Comfortable on phones <375px wide
- Maintains visual design
- Cards remain tappable and accessible

---

## Section 5: Typography Issues

### Prompt 5.1: Add Custom Font Stack and Improve Typography

**Problem:** Application uses browser default fonts (system-ui) with no distinctive brand personality, unclear serif/sans-serif mixing, and no optimized font loading.

**Current State:** Relies on system fonts only

**Implementation Required:**

1. **Choose and add custom fonts:**

   **Option A: Modern Geometric (Recommended)**
   ```tsx
   // Add to project
   Headings & Body: Inter
   Code/Data: JetBrains Mono
   ```

   **Option B: Friendly Educational**
   ```tsx
   Headings: Poppins
   Body: Open Sans
   Code: Source Code Pro
   ```

2. **Install fonts:**
   ```bash
   npm install @fontsource/inter @fontsource/jetbrains-mono
   ```

3. **Update Tailwind config:**
   ```js
   // tailwind.config.js
   theme: {
     extend: {
       fontFamily: {
         sans: ['Inter', 'system-ui', 'sans-serif'],
         display: ['Inter', 'sans-serif'],
         mono: ['JetBrains Mono', 'monospace'],
       }
     }
   }
   ```

4. **Import fonts in app:**
   ```tsx
   // src/index.tsx or App.tsx
   import '@fontsource/inter/400.css'
   import '@fontsource/inter/500.css'
   import '@fontsource/inter/600.css'
   import '@fontsource/inter/700.css'
   import '@fontsource/jetbrains-mono/400.css'
   ```

5. **Optimize font loading:**
   ```html
   <!-- Preload critical fonts in index.html -->
   <link rel="preload" href="/fonts/inter-var.woff2"
         as="font" type="font/woff2" crossorigin />
   ```

**Acceptance Criteria:**
- Custom fonts loaded and applied
- Font loading optimized (no FOUT/FOIT)
- Tailwind config updated
- Consistent font family throughout
- Performance not degraded
- Fonts properly licensed

---

### Prompt 5.2: Define and Implement Semantic Typography Scale

**Problem:** Components use arbitrary text sizes with no defined type scale, creating visual inconsistency.

**Evidence:**
- FlashCard question: `text-4xl md:text-5xl`
- Mode selection: `text-lg md:text-2xl`
- Header title: `text-2xl`
- Category label: `text-sm`

**Implementation Required:**

1. **Define semantic type scale:**
   ```tsx
   // src/design-system/tokens/typography.ts
   export const typography = {
     // Display (large hero text)
     displayLarge: 'text-5xl font-bold leading-tight',      // 3rem
     displayMedium: 'text-4xl font-bold leading-tight',     // 2.25rem
     displaySmall: 'text-3xl font-bold leading-snug',       // 1.875rem

     // Headlines (section headers)
     headlineLarge: 'text-2xl font-semibold leading-normal',  // 1.5rem
     headlineMedium: 'text-xl font-semibold leading-normal', // 1.25rem
     headlineSmall: 'text-lg font-semibold leading-normal',  // 1.125rem

     // Body (content text)
     bodyLarge: 'text-base font-normal leading-relaxed',    // 1rem
     bodyMedium: 'text-sm font-normal leading-relaxed',     // 0.875rem
     bodySmall: 'text-xs font-normal leading-normal',       // 0.75rem

     // Labels (UI text)
     labelLarge: 'text-sm font-medium leading-normal',
     labelMedium: 'text-xs font-medium leading-normal',
     labelSmall: 'text-xs font-medium leading-tight',
   }
   ```

2. **Create typography utility:**
   ```tsx
   // Helper function
   export const typeClass = (type: keyof typeof typography) => typography[type]
   ```

3. **Apply to components:**
   - FlashCard question → `displayMedium`
   - Mode selection → `headlineLarge`
   - Section headers → `headlineMedium`
   - Body text → `bodyLarge`
   - Category labels → `labelMedium`

4. **Document usage guidelines:**
   - When to use each level
   - Examples for each type
   - Responsive considerations

**Acceptance Criteria:**
- Complete type scale defined
- Semantic naming (not just sizes)
- Applied consistently across components
- Includes font-size, weight, and line-height
- Responsive variations documented
- Usage guidelines created

---

## Section 6: Color & Contrast Issues

### Prompt 6.1: Fix Gradient Text Readability and Contrast

**Problem:** Gradient text can have poor contrast on some backgrounds, lacks fallback color, and may be too bright in dark mode.

**Location:** `src/components/Header.tsx` (line 44) and other components using gradient text

**Current Code:**
```tsx
className="bg-gradient-to-r from-blue-600 to-purple-600
           bg-clip-text text-transparent"
```

**Issues:**
- Gradient text can have poor contrast
- No fallback if `bg-clip-text` unsupported
- Too bright in dark mode

**Implementation Required:**

1. **Limit gradient text usage:**
   - Use solid colors for critical text (headers, navigation)
   - Reserve gradients for decorative elements only
   - Apply gradients to non-text elements (borders, backgrounds)

2. **Add fallback color:**
   ```tsx
   className="text-blue-600 dark:text-blue-400
              bg-gradient-to-r from-blue-600 to-purple-600
              bg-clip-text [&]:text-transparent"
   ```

3. **Test contrast ratios:**
   - Use tools like WebAIM Contrast Checker
   - Ensure WCAG AA: 4.5:1 minimum for body text
   - Ensure WCAG AAA: 7:1 for important text

4. **Improve dark mode gradients:**
   ```tsx
   className="bg-gradient-to-r
              from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400
              bg-clip-text text-transparent"
   ```

5. **Alternative: Use solid text with gradient underline:**
   ```tsx
   <h1 className="text-gray-900 dark:text-white relative">
     Title Text
     <span className="absolute bottom-0 left-0 w-full h-1
                      bg-gradient-to-r from-blue-600 to-purple-600" />
   </h1>
   ```

**Acceptance Criteria:**
- Gradient text only on decorative elements
- All text meets WCAG AA contrast requirements
- Fallback colors provided
- Dark mode gradients optimized
- Browser compatibility maintained

---

### Prompt 6.2: Improve Mastery Level Colors for Accessibility

**Problem:** Yellow-200 on white background has poor contrast (~2:1), below WCAG requirements.

**Location:** `src/components/FlashCard.tsx` (lines 47-57)

**Current Colors:**
- Level 0: Gray
- Level 1: Red
- Level 2: Orange
- Level 3: Yellow ⚠️ (too light)
- Level 4: Green
- Level 5: Blue

**Implementation Required:**

1. **Fix yellow contrast:**
   ```tsx
   // Before
   'bg-yellow-200 dark:bg-yellow-900/50' // Poor contrast

   // After
   'bg-yellow-400 dark:bg-yellow-900/50' // Better contrast
   ```

2. **Test all mastery colors:**
   - Ensure each color has ≥4.5:1 contrast ratio
   - Test on both light and dark backgrounds
   - Verify color-blind accessibility

3. **Consider alternative color scheme:**
   ```tsx
   // More accessible option
   const masteryColors = {
     0: 'bg-gray-400 dark:bg-gray-600',      // New
     1: 'bg-red-500 dark:bg-red-700',        // Learning
     2: 'bg-orange-500 dark:bg-orange-700',  // Familiar
     3: 'bg-amber-500 dark:bg-amber-700',    // Known (amber instead of yellow)
     4: 'bg-green-500 dark:bg-green-700',    // Well Known
     5: 'bg-blue-500 dark:bg-blue-700',      // Mastered
   }
   ```

4. **Add patterns for color-blind users:**
   - Consider adding subtle patterns/textures to each level
   - Add icons for each mastery level (optional)
   - Ensure text labels always accompany colors

**Acceptance Criteria:**
- All mastery colors meet WCAG AA standards
- Tested with color-blind simulators
- Works in both light and dark mode
- Alternative indicators provided (not color-only)
- Visual hierarchy maintained

---

### Prompt 6.3: Standardize Focus States Across All Components

**Problem:** Keyboard users get inconsistent visual feedback with different focus styles across components.

**Evidence:**
- FlashCard input: `focus:border-blue-500 focus:outline-none`
- Buttons: `focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`
- CategoryFilter: No focus style defined

**Implementation Required:**

1. **Create global focus utility:**
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
   }
   ```

2. **Apply base focus styles:**
   ```css
   @layer base {
     *:focus-visible {
       @apply outline-none
              ring-2
              ring-blue-500
              ring-offset-2
              dark:ring-blue-400;
     }
   }
   ```

3. **Update all interactive elements:**
   - Buttons → use `.focus-ring`
   - Inputs → use `.focus-ring-inset`
   - Links → use `.focus-ring`
   - Custom controls → apply appropriate focus style

4. **Test keyboard navigation:**
   - Tab through all interactive elements
   - Verify focus indicator is visible
   - Ensure focus order is logical
   - Test in both light and dark mode

**Acceptance Criteria:**
- Consistent focus styles throughout app
- All interactive elements have visible focus indicators
- Works in light and dark mode
- Meets WCAG 2.2 focus indicator requirements
- Keyboard navigation fully functional

---

## Section 7: Animation & Interaction Issues

### Prompt 7.1: Reduce Animation Overuse and Respect User Preferences

**Problem:** Too many simultaneous animations can feel gimmicky, cause performance issues on low-end devices, and reduce perceived speed.

**Locations:** Multiple components using Framer Motion

**Current Issues:**
- Every card animates in with delay
- Buttons have hover scale + tap scale
- Page transitions use fade + slide
- Progress bars animate on every update
- Can cause performance issues

**Implementation Required:**

1. **Respect `prefers-reduced-motion`:**
   ```tsx
   // Create hook
   export const usePrefersReducedMotion = () => {
     const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

     useEffect(() => {
       const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
       setPrefersReducedMotion(mediaQuery.matches)

       const handler = () => setPrefersReducedMotion(mediaQuery.matches)
       mediaQuery.addEventListener('change', handler)
       return () => mediaQuery.removeEventListener('change', handler)
     }, [])

     return prefersReducedMotion
   }

   // Usage
   const prefersReducedMotion = usePrefersReducedMotion()

   <motion.div
     animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
   />
   ```

2. **Limit animations per screen:**
   - Remove staggered card animations (or reduce to first 3 items)
   - Keep only essential state change animations
   - Limit to 2-3 animations per user interaction

3. **Use faster durations:**
   ```tsx
   // Before: 300-500ms
   transition={{ duration: 0.5 }}

   // After: 100-200ms for most interactions
   transition={{ duration: 0.2 }}
   ```

4. **Remove redundant animations:**
   - Remove hover animations on cards (keep on buttons only)
   - Simplify page transitions (fade only, no slide)
   - Make progress bar animations instant or very fast

5. **Create animation config:**
   ```tsx
   // src/config/animations.ts
   export const animations = {
     fast: { duration: 0.1 },
     normal: { duration: 0.2 },
     slow: { duration: 0.3 },
   }
   ```

**Acceptance Criteria:**
- `prefers-reduced-motion` respected
- Maximum 2-3 animations per screen
- Animation durations <200ms for most interactions
- No performance degradation on low-end devices
- User setting to disable animations (optional)

---

### Prompt 7.2: Implement Modern Loading States with Skeletons

**Problem:** Generic spinner doesn't match brand, no skeleton screens (jarring content pop-in), and loading text not always present.

**Locations:** Multiple components showing loading states

**Current Pattern:**
```tsx
<div className="animate-spin rounded-full h-16 w-16
                border-b-2 border-blue-600" />
```

**Implementation Required:**

1. **Create Skeleton component:**
   ```tsx
   // src/components/ui/Skeleton.tsx
   export const Skeleton: React.FC<SkeletonProps> = ({
     className,
     variant = 'rectangular'
   }) => {
     const baseStyles = 'animate-pulse bg-gray-200 dark:bg-gray-700'

     const variants = {
       rectangular: 'rounded',
       circular: 'rounded-full',
       text: 'rounded h-4',
     }

     return (
       <div className={cn(
         baseStyles,
         variants[variant],
         className
       )} />
     )
   }
   ```

2. **Create skeleton layouts for components:**
   ```tsx
   // CategoryFilter skeleton
   export const CategoryFilterSkeleton = () => (
     <div className="space-y-2">
       {[1, 2, 3, 4, 5].map(i => (
         <Skeleton key={i} className="h-20 w-full" />
       ))}
     </div>
   )

   // Statistics skeleton
   export const StatsSkeleton = () => (
     <div className="space-y-4">
       <Skeleton className="h-8 w-48" /> {/* Title */}
       <div className="grid grid-cols-2 gap-4">
         <Skeleton className="h-24 w-full" />
         <Skeleton className="h-24 w-full" />
       </div>
     </div>
   )
   ```

3. **Add shimmer effect (optional):**
   ```tsx
   // Enhanced skeleton with shimmer
   const shimmerStyles = `
     relative overflow-hidden
     before:absolute before:inset-0
     before:-translate-x-full before:animate-shimmer
     before:bg-gradient-to-r
     before:from-transparent before:via-white/20 before:to-transparent
   `
   ```

4. **Replace loading spinners:**
   - CategoryFilter → CategoryFilterSkeleton
   - Statistics → StatsSkeleton
   - Analytics → AnalyticsSkeleton
   - FlashCard → FlashCardSkeleton

5. **Add loading text for accessibility:**
   ```tsx
   <div role="status" aria-live="polite">
     <span className="sr-only">Loading content...</span>
     <Skeleton />
   </div>
   ```

**Acceptance Criteria:**
- Reusable Skeleton component created
- Skeleton layouts match actual content layout
- Used throughout app instead of spinners
- Smooth transition from skeleton to content
- Accessible loading announcements
- Works in dark mode

---

## Section 8: Accessibility Gaps

### Prompt 8.1: Add ARIA Labels and Improve Screen Reader Support

**Problem:** Mode selection buttons use emojis without alt text, and screen readers don't provide clear context.

**Location:** `src/components/ModeSelection.tsx` and other components using emojis/icons

**Current Issue:**
```tsx
<span className="text-3xl md:text-5xl">🇷🇺</span>
```
Screen readers announce "flag: Russia" but context unclear.

**Implementation Required:**

1. **Add ARIA labels to emoji elements:**
   ```tsx
   <span
     className="text-3xl md:text-5xl"
     aria-label="Russian"
     role="img"
   >
     🇷🇺
   </span>
   ```

2. **Add descriptive button labels:**
   ```tsx
   <button
     aria-label="Learn Russian to Italian translations"
     aria-describedby="mode-description-ru-it"
   >
     <span aria-hidden="true">🇷🇺 → 🇮🇹</span>
   </button>

   <span id="mode-description-ru-it" className="sr-only">
     Practice translating words from Russian to Italian
   </span>
   ```

3. **Add live regions for dynamic content:**
   ```tsx
   // For feedback messages
   <div
     role="status"
     aria-live="polite"
     aria-atomic="true"
     className="sr-only"
   >
     {feedback && <p>{feedback}</p>}
   </div>
   ```

4. **Improve icon buttons:**
   ```tsx
   // Header icon buttons
   <button aria-label="Toggle shuffle mode">
     <ShuffleIcon aria-hidden="true" />
   </button>
   ```

5. **Add landmark regions:**
   ```tsx
   <header role="banner">
   <nav role="navigation" aria-label="Main navigation">
   <main role="main">
   <aside role="complementary" aria-label="Statistics">
   <footer role="contentinfo">
   ```

**Acceptance Criteria:**
- All emojis have aria-label and role="img"
- All icon buttons have descriptive aria-labels
- Live regions for dynamic feedback
- Landmark regions properly defined
- Tested with screen readers (NVDA, VoiceOver)
- No redundant announcements

---

### Prompt 8.2: Add Non-Color Indicators for Feedback

**Problem:** Correct/incorrect feedback uses only color (green = correct, red = incorrect), which color-blind users may not distinguish.

**Location:** `src/components/FlashCard.tsx` (lines 163-199)

**Current Implementation:**
```tsx
// Color-only feedback
<div className="bg-green-50 border-green-300">
  {/* Correct feedback */}
</div>

<div className="bg-red-50 border-red-300">
  {/* Incorrect feedback */}
</div>
```

**Implementation Required:**

1. **Add icons to feedback:**
   ```tsx
   // Correct feedback
   <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4
                   relative overflow-hidden">
     {/* Pattern overlay for additional distinction */}
     <div className="absolute inset-0 bg-checkered-pattern opacity-10"
          aria-hidden="true" />

     <div className="flex items-center gap-3">
       <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0"
                        aria-hidden="true" />
       <div>
         <p className="font-semibold text-green-900">Correct!</p>
         <p className="text-green-700">{correctAnswer}</p>
       </div>
     </div>
   </div>

   // Incorrect feedback
   <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4
                   relative overflow-hidden">
     <div className="absolute inset-0 bg-diagonal-lines opacity-10"
          aria-hidden="true" />

     <div className="flex items-center gap-3">
       <XCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0"
                    aria-hidden="true" />
       <div>
         <p className="font-semibold text-red-900">Incorrect</p>
         <p className="text-red-700">Correct answer: {correctAnswer}</p>
       </div>
     </div>
   </div>
   ```

2. **Add subtle patterns (optional):**
   ```css
   /* Pattern utilities */
   .bg-checkered-pattern {
     background-image: repeating-linear-gradient(
       45deg,
       transparent,
       transparent 10px,
       currentColor 10px,
       currentColor 20px
     );
   }

   .bg-diagonal-lines {
     background-image: repeating-linear-gradient(
       -45deg,
       transparent,
       transparent 10px,
       currentColor 10px,
       currentColor 11px
     );
   }
   ```

3. **Ensure text contrast:**
   - Use clear, descriptive text
   - Ensure text has sufficient contrast
   - Don't rely on color alone for meaning

4. **Test with color-blind simulators:**
   - Test with various types of color blindness
   - Ensure information is still clear
   - Verify patterns/icons provide sufficient distinction

**Acceptance Criteria:**
- Icons added to all feedback states
- Text clearly describes state
- Patterns or textures provide additional cues (optional)
- Works for users with color blindness
- Maintains visual appeal
- ARIA announcements for state changes

---

### Prompt 8.3: Improve Keyboard Navigation Throughout Application

**Problem:** Keyboard navigation is incomplete with missing features like skip links, arrow key navigation in grids, and inconsistent Escape key behavior.

**Locations:** Multiple components

**Missing Features:**
- Tab order optimization
- Skip links for keyboard users
- Arrow key navigation in category grid
- Inconsistent Escape key behavior
- Focus trapping in modals

**Implementation Required:**

1. **Add skip link:**
   ```tsx
   // At the top of App.tsx or main layout
   <a
     href="#main-content"
     className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
                focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white
                focus:rounded-lg focus:shadow-lg"
   >
     Skip to main content
   </a>

   // Main content area
   <main id="main-content" tabIndex={-1}>
     {/* Content */}
   </main>
   ```

2. **Implement roving tabindex for category grid:**
   ```tsx
   // CategoryFilter.tsx
   const [focusedIndex, setFocusedIndex] = useState(0)

   const handleKeyDown = (e: KeyboardEvent, currentIndex: number) => {
     const cols = 3 // Grid columns

     switch (e.key) {
       case 'ArrowRight':
         e.preventDefault()
         setFocusedIndex(Math.min(currentIndex + 1, categories.length - 1))
         break
       case 'ArrowLeft':
         e.preventDefault()
         setFocusedIndex(Math.max(currentIndex - 1, 0))
         break
       case 'ArrowDown':
         e.preventDefault()
         setFocusedIndex(Math.min(currentIndex + cols, categories.length - 1))
         break
       case 'ArrowUp':
         e.preventDefault()
         setFocusedIndex(Math.max(currentIndex - cols, 0))
         break
       case 'Enter':
       case ' ':
         e.preventDefault()
         toggleCategory(categories[currentIndex])
         break
     }
   }

   // In render
   <div
     role="checkbox"
     aria-checked={isSelected}
     tabIndex={index === focusedIndex ? 0 : -1}
     onKeyDown={(e) => handleKeyDown(e, index)}
   />
   ```

3. **Fix Escape key handling:**
   ```tsx
   // Consistent escape key handler
   useEffect(() => {
     const handleEscape = (e: KeyboardEvent) => {
       if (e.key === 'Escape') {
         // Close modals, drawers, etc.
         onClose()
       }
     }

     document.addEventListener('keydown', handleEscape)
     return () => document.removeEventListener('keydown', handleEscape)
   }, [onClose])
   ```

4. **Implement focus trap for modals:**
   ```tsx
   // Use Headless UI or similar
   import { Dialog } from '@headlessui/react'

   <Dialog open={isOpen} onClose={onClose}>
     {/* Focus is automatically trapped */}
     <Dialog.Panel>
       {/* Modal content */}
     </Dialog.Panel>
   </Dialog>
   ```

5. **Optimize tab order:**
   ```tsx
   // Remove elements from tab order that shouldn't be focusable
   <div tabIndex={-1} /> // Not keyboard focusable

   // Make custom controls keyboard accessible
   <div role="button" tabIndex={0} onKeyDown={handleKeyDown} />
   ```

**Acceptance Criteria:**
- Skip link visible on focus
- Arrow key navigation in category grid
- Consistent Escape key behavior throughout
- Focus trap in modals/dialogs
- Logical tab order on all pages
- All interactive elements keyboard accessible
- Tested with keyboard only (no mouse)

---

## Implementation Priority

### High Priority (Implement First)
These issues significantly impact usability and accessibility:

1. **Prompt 2.1** - Refactor Header for Mobile
2. **Prompt 4.1** - Increase Touch Target Sizes
3. **Prompt 6.3** - Standardize Focus States
4. **Prompt 8.1** - Add ARIA Labels
5. **Prompt 8.2** - Add Non-Color Indicators
6. **Prompt 1.2** - Standardize Card Styles

### Medium Priority (Implement Second)
These improve user experience and visual consistency:

7. **Prompt 1.1** - Fix Dashboard Visual Hierarchy
8. **Prompt 2.2** - Modernize Input Fields
9. **Prompt 2.3** - Improve Difficulty Rating Buttons
10. **Prompt 3.1** - Standardize Maximum Width
11. **Prompt 3.2** - Consistent Vertical Spacing
12. **Prompt 7.2** - Modern Loading States

### Lower Priority (Polish & Enhancement)
These are nice-to-have improvements:

13. **Prompt 2.4** - Reduce Category Filter Density
14. **Prompt 4.2** - Optimize TaskModeAppBar Mobile
15. **Prompt 4.3** - Improve ModeSelection Touch Targets
16. **Prompt 5.1** - Add Custom Fonts
17. **Prompt 5.2** - Semantic Typography Scale
18. **Prompt 6.1** - Fix Gradient Text
19. **Prompt 6.2** - Improve Mastery Colors
20. **Prompt 7.1** - Reduce Animation Overuse
21. **Prompt 8.3** - Improve Keyboard Navigation

---

## Usage Instructions

Each prompt above can be provided to Claude Code as a standalone task. For best results:

1. **Provide one prompt at a time** - This ensures focused implementation
2. **Test after each implementation** - Verify changes before moving to next prompt
3. **Follow the priority order** - High priority items have the most user impact
4. **Adapt as needed** - Some prompts may require adjustments based on your specific needs
5. **Create branches** - Implement each prompt in a separate branch for easier review

## Related Resources

- **Full UI Review:** `/UI_Review.md`
- **Component Documentation:** `/docs/dev/ARCHITECTURE.md`
- **Testing Guide:** `/docs/dev/TESTING.md`
- **Code Standards:** `/docs/dev/CODE_STANDARDS.md`

---

**Document Version:** 1.0
**Created:** 2025-11-14
**Source:** UI_Review.md comprehensive analysis
