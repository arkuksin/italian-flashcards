# Fix Header Overcrowding

## Issue
The Header contains 7 icon buttons in a row, which become tiny or wrap awkwardly on mobile devices. Icon-only buttons lack clear affordance and have no visual grouping.

## Location
`Header.tsx` (lines 59-128)

## Problem Details

### Current buttons in header:
1. Toggle direction
2. Shuffle toggle
3. Accent sensitivity toggle
4. Restart
5. Dark mode
6. Language switcher
7. User profile (with dropdown)

### Problems:
1. **On mobile:** Buttons become tiny (< 36×36px) or wrap awkwardly
2. **Icon-only buttons:** Users don't understand what each button does
3. **No visual grouping:** All buttons look the same
4. **Active states:** Not immediately obvious (shuffle on/off)
5. **Accessibility:** Difficult to tap accurately on touch devices

**Mobile Evidence:**
```tsx
<div className="flex items-center space-x-2">
  {/* 7+ buttons with w-5 h-5 icons */}
  {/* Becomes cramped on screens < 768px */}
</div>
```

## Impact
- Poor mobile user experience
- Confusing interface (icon-only)
- Accessibility issues
- Difficult to tap accurately
- Cluttered appearance

## Task
Redesign the Header for better mobile experience and clarity:

1. **Implement responsive header design:**
   - **Desktop (≥768px):** Show all buttons with tooltips
   - **Mobile (<768px):** Show logo + hamburger menu
   - Use a drawer/modal for mobile actions with labels

2. **Create "More" overflow menu for secondary actions:**
   - Primary actions: User profile, Dark mode
   - Secondary actions (in overflow): Toggle direction, Shuffle, Accent sensitivity, Restart, Language switcher
   - Or: Use hamburger menu on mobile

3. **Improve button affordance:**
   - Keep tooltips on hover (already present)
   - Add labels on wider screens (≥1024px)
   - Group related actions visually (shuffle + direction together)

4. **Make active states more prominent:**
   - Add background color for active state
   - Change icon appearance when active
   - Example: Shuffle button shows filled icon when on, outline when off

5. **Implementation approach:**
   ```tsx
   // Desktop: All buttons visible
   <div className="hidden md:flex items-center gap-2">
     <ButtonGroup primary={[darkMode, userProfile]} />
     <ButtonGroup secondary={[...other actions]} />
   </div>

   // Mobile: Hamburger menu
   <button className="md:hidden" onClick={openDrawer}>
     <Menu />
   </button>

   <Drawer open={drawerOpen} onClose={closeDrawer}>
     <ActionsList withLabels />
   </Drawer>
   ```

## Success Criteria
- Header is usable on all screen sizes
- All actions are clearly labeled on mobile
- Touch targets meet accessibility guidelines (44×44px)
- Active states are immediately obvious
- Visual grouping makes related actions clear
- Improved user testing results

## References
- UI_Review.md: Section 2.2 - Component-Level Issues: Header Overcrowding
- UI_Review.md: Section 3.2 - Medium-Term Improvement #2: Refactor Header for Mobile
- Apple HIG: Touch targets (44×44px minimum)
