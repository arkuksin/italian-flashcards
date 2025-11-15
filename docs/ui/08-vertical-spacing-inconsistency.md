# Standardize Vertical Spacing

## Issue
Vertical spacing throughout the application uses arbitrary margin values with no clear pattern or rhythm, creating visual inconsistency.

## Locations
Throughout the application, especially `Dashboard.tsx`

## Problem Details

**Current spacing examples:**
```tsx
// Dashboard.tsx spacing examples
<section className="mb-8">  {/* 32px */}
<div className="mb-6">      {/* 24px */}
<div className="mb-4">      {/* 16px */}
<div className="mb-2">      {/* 8px */}
```

### Issues:
1. **No clear rhythm** or pattern to spacing decisions
2. **Arbitrary values** used inconsistently
3. **Makes design feel unpolished**
4. **Difficult to maintain** consistency

## Impact
- Visual inconsistency
- Unpolished appearance
- Maintenance difficulties
- No clear design system

## Task
Establish and implement a consistent spacing scale throughout the application:

1. **Define spacing scale tokens:**
   ```tsx
   // Add to design tokens or document in CLAUDE.md
   const spacingScale = {
     micro: 'gap-2',           // 8px - between related small elements
     compact: 'space-y-3',     // 12px - tight spacing
     element: 'space-y-4',     // 16px - internal card spacing
     comfortable: 'space-y-6', // 24px - card content spacing
     stack: 'space-y-8',       // 32px - between cards
     section: 'mb-10',         // 40px - between major sections
     page: 'mb-12',            // 48px - between page sections
     large: 'mb-16',           // 64px - large section breaks
   };
   ```

2. **Usage guidelines:**
   ```
   Micro spacing (gap-2, 8px):
   - Between icons and text
   - Between closely related elements (e.g., label + value)
   - Button groups

   Compact spacing (space-y-3, 12px):
   - List items
   - Form field groups
   - Tight layouts

   Element spacing (space-y-4, 16px):
   - Within cards (between card elements)
   - Form fields
   - Default paragraph spacing

   Comfortable spacing (space-y-6, 24px):
   - Between card sections
   - Between form groups
   - Reading content

   Stack spacing (space-y-8, 32px):
   - Between cards in a list
   - Between major UI elements
   - Dashboard widgets

   Section spacing (mb-10, 40px):
   - Between major page sections
   - Between different content areas
   - Navigation + content separation

   Page spacing (mb-12, 48px):
   - Between large page sections
   - Header + main content
   - Major visual breaks

   Large spacing (mb-16, 64px):
   - Between distinct page areas
   - Major section separators
   - Hero sections
   ```

3. **Update components to use standard spacing:**
   - **Dashboard.tsx**:
     ```tsx
     <div className="space-y-10"> {/* section spacing */}
       <section className="space-y-6"> {/* card spacing */}
         <ModeSelection />
         <CategoryFilter />
       </section>

       <section className="space-y-6">
         <QuickStats />
         <Statistics />
       </section>
     </div>
     ```

   - **FlashCard.tsx**:
     ```tsx
     <div className="space-y-6"> {/* comfortable spacing */}
       <QuestionDisplay />
       <AnswerInput />
       <DifficultyButtons />
     </div>
     ```

   - **Statistics.tsx**:
     ```tsx
     <div className="space-y-4"> {/* element spacing */}
       <StatCard />
       <StatCard />
       <StatCard />
     </div>
     ```

4. **Create utility components for consistent spacing:**
   ```tsx
   // src/components/layout/Stack.tsx
   export const Stack: React.FC<{
     spacing?: 'micro' | 'compact' | 'element' | 'comfortable' | 'stack';
     children: React.ReactNode;
   }> = ({ spacing = 'element', children }) => {
     const spacingClasses = {
       micro: 'space-y-2',
       compact: 'space-y-3',
       element: 'space-y-4',
       comfortable: 'space-y-6',
       stack: 'space-y-8',
     };

     return (
       <div className={spacingClasses[spacing]}>
         {children}
       </div>
     );
   };
   ```

5. **Audit and update all components:**
   - Find all instances of `mb-`, `mt-`, `space-y-`, `gap-`
   - Replace with standard spacing scale values
   - Use Stack component where appropriate
   - Document any exceptions

6. **Add ESLint rule (optional):**
   - Warn on non-standard spacing values
   - Suggest standard spacing alternatives
   - Help maintain consistency

## Success Criteria
- All spacing uses standard scale values
- Consistent visual rhythm throughout application
- Stack component used where appropriate
- Documentation complete
- No arbitrary spacing values
- Visual polish improved

## References
- UI_Review.md: Section 2.3 - Layout & Spacing Problems: Vertical Spacing Inconsistency
- Material Design 3: Spacing system
- Tailwind CSS: Spacing utilities
