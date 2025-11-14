# Optimize TaskModeAppBar for Mobile

## Issue
TaskModeAppBar shows breadcrumbs, progress badges, and buttons in one row on desktop, but stacks everything vertically on mobile, taking up too much vertical screen space.

## Location
`TaskModeAppBar.tsx` (lines 33-101)

## Problem Details

**Current behavior:**
- **Desktop**: Breadcrumbs + progress badges + button in one row
- **Mobile**: Everything stacked vertically

### Issues:
1. **Takes up too much vertical space** on small screens
2. **Valuable screen real estate wasted** (especially on mobile where space is limited)
3. **Breadcrumbs less useful on mobile** (limited space)
4. **Progress badges could be more compact**

## Impact
- Reduced available space for main content
- Poor use of limited mobile screen space
- Content pushed further down the page
- Scrolling required earlier

## Task
Optimize TaskModeAppBar layout for mobile devices:

1. **Implement responsive layout strategy:**

   **Desktop (≥768px):**
   ```tsx
   <div className="flex items-center justify-between">
     <Breadcrumbs />
     <div className="flex items-center gap-4">
       <ProgressBadges />
       <ActionButton />
     </div>
   </div>
   ```

   **Mobile (<768px):**
   ```tsx
   <div className="flex items-center justify-between">
     <PageTitle /> {/* Instead of breadcrumbs */}
     <CompactProgress /> {/* Single badge */}
     <IconButton /> {/* Icon only */}
   </div>
   ```

2. **Hide breadcrumbs on mobile:**
   ```tsx
   // Replace with simple page title
   <h1 className="text-lg font-semibold md:hidden">
     Exercise Mode
   </h1>

   <Breadcrumbs className="hidden md:flex" />
   ```

3. **Combine progress badges into single compact badge:**
   ```tsx
   // Desktop: Multiple badges
   <div className="hidden md:flex gap-2">
     <Badge>15/45 words</Badge>
     <Badge>Session: 23 min</Badge>
     <Badge>87% accuracy</Badge>
   </div>

   // Mobile: Single compact badge
   <Badge className="md:hidden text-xs">
     15/45 • 87%
   </Badge>
   ```

4. **Use icon-only button on mobile:**
   ```tsx
   // Desktop: Button with text
   <Button className="hidden md:flex">
     <PauseIcon />
     <span>Pause Session</span>
   </Button>

   // Mobile: Icon button only
   <IconButton className="md:hidden" aria-label="Pause Session">
     <PauseIcon />
   </IconButton>
   ```

5. **Reduce vertical padding on mobile:**
   ```tsx
   <header className="py-2 md:py-4 px-4">
     {/* Content */}
   </header>
   ```

6. **Consider floating action button alternative:**
   ```tsx
   // Instead of button in header, use FAB (optional)
   <FloatingActionButton
     className="md:hidden fixed bottom-4 right-4"
     icon={<PauseIcon />}
     label="Pause"
   />
   ```

7. **Implement compact mode:**
   ```tsx
   interface TaskModeAppBarProps {
     compact?: boolean; // Auto-set based on viewport
     showBreadcrumbs?: boolean;
     showDetailedProgress?: boolean;
   }

   const TaskModeAppBar: React.FC<TaskModeAppBarProps> = ({
     compact = false,
     showBreadcrumbs = true,
     showDetailedProgress = true,
   }) => {
     const isMobile = useMediaQuery('(max-width: 768px)');
     const isCompact = compact || isMobile;

     return (
       <header className={`${isCompact ? 'py-2' : 'py-4'}`}>
         {!isCompact && showBreadcrumbs && <Breadcrumbs />}
         {isCompact && <PageTitle />}
         {/* ... */}
       </header>
     );
   };
   ```

## Success Criteria
- TaskModeAppBar uses minimal vertical space on mobile
- All important information still visible
- Action button easily accessible
- Desktop layout unchanged
- Smooth responsive behavior
- User testing shows improved mobile experience

## Alternative Approaches
1. **Sticky compact header**: Make header sticky with auto-hide on scroll
2. **Collapsible header**: Allow users to collapse/expand details
3. **Slide-out panel**: Move detailed progress to slide-out side panel

## References
- UI_Review.md: Section 2.4 - Mobile & Responsive Issues: TaskModeAppBar Mobile Layout
- Material Design 3: Top app bars
- Apple HIG: Navigation bars
