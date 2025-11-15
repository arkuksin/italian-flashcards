# Fix Inconsistent Maximum Width Across Pages

## Issue
Different pages use different maximum widths, reducing visual coherence and creating an inconsistent reading experience.

## Locations
Multiple pages throughout the application

## Problem Details

**Current inconsistent widths:**
- Dashboard: `max-w-4xl` (56rem / 896px)
- Login: `max-w-6xl` (72rem / 1152px)
- Analytics: Uses `container` class (varies by breakpoint)
- Other pages: Various other max-widths

### Issues:
1. **Inconsistent reading widths** reduce visual coherence
2. **No clear layout system** - arbitrary width choices
3. **Confusing user experience** - layout changes unexpectedly
4. **Harder to maintain** - no standardization

## Impact
- Reduced visual coherence
- Inconsistent user experience
- Maintenance difficulties
- Unprofessional appearance

## Task
Define and implement standard layout widths across the application:

1. **Define standard layout width tokens:**
   ```tsx
   // Add to design tokens or Tailwind config
   const layoutWidths = {
     content: 'max-w-4xl',      // 896px - for reading/forms
     dashboard: 'max-w-5xl',     // 1024px - for cards/grids
     analytics: 'max-w-6xl',     // 1152px - for charts/data
     wide: 'max-w-7xl',          // 1280px - for full-width layouts
   };
   ```

2. **Create layout wrapper components:**
   ```tsx
   // src/components/layout/Container.tsx
   type ContainerWidth = 'content' | 'dashboard' | 'analytics' | 'wide';

   interface ContainerProps {
     width?: ContainerWidth;
     children: React.ReactNode;
     className?: string;
   }

   export const Container: React.FC<ContainerProps> = ({
     width = 'dashboard',
     children,
     className = '',
   }) => {
     const widthClasses = {
       content: 'max-w-4xl',
       dashboard: 'max-w-5xl',
       analytics: 'max-w-6xl',
       wide: 'max-w-7xl',
     };

     return (
       <div className={`${widthClasses[width]} mx-auto px-4 ${className}`}>
         {children}
       </div>
     );
   };
   ```

3. **Update all pages to use standard widths:**
   - **Dashboard.tsx**: Use `Container width="dashboard"`
   - **LoginForm.tsx**: Use `Container width="content"`
   - **Analytics.tsx**: Use `Container width="analytics"`
   - **FlashCard**: Use `Container width="content"`
   - **Statistics**: Use `Container width="dashboard"`

4. **Document width usage guidelines:**
   ```
   Content width (max-w-4xl):
   - Use for: Forms, reading content, single-column layouts
   - Examples: Login, Profile, Settings

   Dashboard width (max-w-5xl):
   - Use for: Card grids, dashboard views, mode selection
   - Examples: Dashboard, Category selection

   Analytics width (max-w-6xl):
   - Use for: Charts, wide data tables, analytics
   - Examples: Analytics, Statistics with charts

   Wide width (max-w-7xl):
   - Use for: Full-width layouts, complex grids
   - Examples: Admin panels (if added), complex dashboards
   ```

5. **Ensure consistent implementation:**
   - Use the Container component everywhere
   - Remove all hardcoded max-width classes
   - Add `mx-auto` for centering
   - Include horizontal padding (`px-4` or similar)

6. **Test responsive behavior:**
   - Verify layouts work on all breakpoints
   - Ensure consistent edge spacing
   - Check that content doesn't touch edges on mobile
   - Verify centered alignment

## Success Criteria
- All pages use standardized width tokens
- Consistent visual coherence across the application
- Container component used throughout
- No hardcoded max-width values
- Documentation complete
- Responsive behavior verified

## References
- UI_Review.md: Section 2.3 - Layout & Spacing Problems: Inconsistent Maximum Width
- Material Design 3: Layout principles
- Tailwind CSS: Container utilities
