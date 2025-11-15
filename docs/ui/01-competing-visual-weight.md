# Fix Competing Visual Weight on Dashboard

## Issue
The Dashboard mode selection view presents too many elements with equal visual importance, causing users to feel overwhelmed and unclear about where to start.

## Location
`Dashboard.tsx` (lines 616-700)

## Problem Details
All sections have similar visual weight:
- Mode selection cards (primary action)
- Category filter (also looks primary)
- Quick stats (similar card styling)
- Statistics (equally prominent)
- Gamification widgets (4 separate cards, also competing for attention)
- Leitner box visualizer

**Evidence:**
```tsx
// All sections have similar visual weight
<section className="max-w-4xl mx-auto mb-8">
  <ModeSelection /> {/* Primary action */}
  <CategoryFilter /> {/* Also looks primary */}
</section>
<QuickStats /> {/* Similar card styling */}
<Statistics /> {/* Equally prominent */}
<GamificationWidgets /> {/* Also competing for attention */}
```

## Impact
- Users feel overwhelmed
- Unclear where to start
- Reduced task completion
- Poor information hierarchy

## Task
Improve the visual hierarchy of the Dashboard by:

1. **Increase visual prominence of Mode Selection**
   - Make it larger and more centered
   - Add subtle animation (scale-in or fade-in)
   - Use more prominent card styling
   - Consider adding a subtle glow or shadow effect

2. **Reduce visual weight of secondary elements**
   - Use lighter backgrounds for non-primary sections
   - Reduce font sizes for labels and descriptions
   - Consider using a more subtle card style (less shadow, lighter borders)

3. **Group related elements with clear section headers**
   - Add clear section headers with appropriate typography
   - Use spacing to separate sections visually
   - Consider collapsible sections for less important content

4. **Implement visual hierarchy through:**
   - Size (larger primary actions)
   - Color (more saturated for important elements)
   - Spacing (more whitespace around primary actions)
   - Depth (shadows, elevation)

## Success Criteria
- Mode selection is immediately recognizable as the primary action
- Secondary content is visible but not competing for attention
- Clear visual flow from primary to secondary content
- User testing shows improved task completion

## References
- UI_Review.md: Section 2.1 - Visual Hierarchy Issues
- Material Design 3: Visual Hierarchy principles
- Apple HIG: Layout and Visual Hierarchy
