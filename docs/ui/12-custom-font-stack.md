# Add Custom Font Stack

## Issue
The application currently uses browser default fonts (system-ui), lacking distinctive brand personality and optimized font loading.

## Current State
Uses browser default fonts with no custom font stack or font family customization.

## Problem Details

### Issues:
1. **Lacks distinctive brand personality**
2. **No serif/sans-serif mixing strategy**
3. **No optimized font loading**
4. **Missed opportunity** for improved readability and brand identity

## Impact
- Generic appearance
- No visual brand identity
- Missed opportunity for improved readability
- Less polished user experience

## Task
Add custom fonts to improve brand personality and readability:

1. **Choose font pairing:**

   **Option 1: Modern Geometric** (Recommended for flashcard app)
   ```
   Headings & UI: Inter (neutral, highly readable, modern)
   Body: Inter (consistency)
   Monospace: JetBrains Mono (for code/stats if needed)
   ```

   **Option 2: Friendly Educational**
   ```
   Headings: Poppins (rounded, approachable, friendly)
   Body: Open Sans (excellent readability)
   Monospace: Source Code Pro
   ```

   **Option 3: Contemporary Professional**
   ```
   Headings: Plus Jakarta Sans (modern, geometric)
   Body: Inter (readable, neutral)
   Monospace: Fira Code
   ```

2. **Install fonts via npm (recommended approach):**
   ```bash
   # Option 1: Using fontsource (recommended)
   npm install @fontsource/inter @fontsource/jetbrains-mono

   # Option 2: Using next/font if Next.js
   # Built-in, no installation needed
   ```

3. **Import fonts in app:**

   **Using Fontsource:**
   ```tsx
   // src/index.tsx or src/App.tsx
   import '@fontsource/inter/400.css'; // Regular
   import '@fontsource/inter/500.css'; // Medium
   import '@fontsource/inter/600.css'; // Semibold
   import '@fontsource/inter/700.css'; // Bold
   import '@fontsource/jetbrains-mono/400.css'; // Mono regular
   ```

   **Using Google Fonts:**
   ```html
   <!-- public/index.html -->
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
   ```

4. **Update Tailwind configuration:**
   ```js
   // tailwind.config.js
   module.exports = {
     theme: {
       extend: {
         fontFamily: {
           sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
           display: ['Inter', 'system-ui', 'sans-serif'], // For headings
           mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
         },
       },
     },
   };
   ```

5. **Add font-display optimization:**
   ```tsx
   // If using fontsource
   import '@fontsource/inter/400.css'; // Automatically includes font-display: swap

   // If using Google Fonts, already included in URL (display=swap)
   ```

6. **Update base styles:**
   ```css
   /* src/index.css */
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

   @layer base {
     body {
       @apply font-sans; /* Uses Inter */
     }

     h1, h2, h3, h4, h5, h6 {
       @apply font-display; /* Uses Inter for headings */
     }

     code, pre {
       @apply font-mono; /* Uses JetBrains Mono */
     }
   }
   ```

7. **Update components to use font utilities:**
   ```tsx
   // Headings
   <h1 className="font-display text-3xl font-bold">

   // Body text (default)
   <p className="font-sans text-base">

   // Stats/numbers
   <span className="font-mono text-sm">42</span>
   ```

8. **Implement font loading strategy:**

   **Option A: Preload critical fonts**
   ```html
   <!-- public/index.html -->
   <link rel="preload" href="/fonts/Inter-var.woff2"
         as="font" type="font/woff2" crossorigin />
   ```

   **Option B: Use font-display: swap**
   ```css
   @font-face {
     font-family: 'Inter';
     src: url('/fonts/Inter-var.woff2') format('woff2');
     font-display: swap; /* Show fallback font immediately */
   }
   ```

9. **Add fallback fonts for better compatibility:**
   ```js
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
   }
   ```

10. **Test font loading and rendering:**
    - Check initial page load (ensure no FOUT - Flash of Unstyled Text)
    - Verify fallback fonts work
    - Test on slow connections
    - Verify font weights are correct
    - Check readability on different devices

## Success Criteria
- Custom fonts loaded and displaying correctly
- No Flash of Unstyled Text (FOUT) on page load
- Font weights (400, 500, 600, 700) working properly
- Improved brand personality and readability
- Fast font loading (< 100ms impact on page load)
- Fallback fonts work correctly
- Works on all major browsers

## Performance Considerations
- Only load font weights you actually use
- Use `font-display: swap` to prevent invisible text
- Preload critical font files
- Consider variable fonts for better performance
- Subset fonts if possible (Latin only, exclude unused characters)

## References
- UI_Review.md: Section 2.5 - Typography Issues: No Custom Font Stack
- Google Fonts: https://fonts.google.com/
- Fontsource: https://fontsource.org/
- CSS-Tricks: Font Loading Strategies
