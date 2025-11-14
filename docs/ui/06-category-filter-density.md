# Reduce Category Filter Information Density

## Issue
Each category card shows too much information (name, total words, learned words, average accuracy, checkbox, check icon), causing information overload and making it hard to scan quickly.

## Location
`CategoryFilter.tsx` (lines 207-250)

## Problem Details

**Current information shown per category:**
- Category name
- Total words count
- Learned words count
- Average accuracy
- Checkbox
- Check icon when selected

### Issues:
1. **Information overload** in small cards
2. **Hard to scan quickly** - too much text
3. **Cluttered appearance**
4. **Difficult to compare** categories

## Impact
- Cognitive overload for users
- Slower decision-making
- Reduced usability
- Cluttered visual appearance

## Task
Implement progressive disclosure and simplify category cards:

1. **Simplify default card view:**
   - Show only: Category name + Primary metric
   - Primary metric options:
     - Progress ring/bar (visual)
     - Percentage mastered (e.g., "45% mastered")
     - Simple indicator (e.g., "15/45 words")
   - Keep checkbox/selection indicator

2. **Add progressive disclosure:**
   ```tsx
   // Default view: Simple
   <CategoryCard>
     <CategoryIcon />
     <CategoryName />
     <ProgressRing percent={45} />
     <Checkbox />
   </CategoryCard>

   // On hover/tap: Show details
   <CategoryCard expanded>
     <CategoryIcon />
     <CategoryName />
     <Stats>
       <Stat label="Total" value="45 words" />
       <Stat label="Learned" value="15 words" />
       <Stat label="Accuracy" value="87%" />
     </Stats>
     <Checkbox />
   </CategoryCard>
   ```

3. **Add visual indicators:**
   - Progress ring around category icon (shows completion %)
   - Color-coded progress indicators
   - Use mastery level colors consistently
   - Consider using icons instead of text where possible

4. **Improve layout:**
   - Use consistent card sizes
   - Better spacing between elements
   - Larger touch targets (44×44px minimum)
   - Clear visual hierarchy within card

5. **Implementation approach:**
   ```tsx
   const CategoryCard = ({ category, selected, onToggle }) => {
     const [expanded, setExpanded] = useState(false);

     return (
       <motion.div
         className="relative p-4 rounded-xl border-2
                    cursor-pointer transition-all"
         onMouseEnter={() => setExpanded(true)}
         onMouseLeave={() => setExpanded(false)}
         whileHover={{ y: -2 }}
       >
         <div className="flex items-center gap-3">
           <ProgressRing value={category.masteredPercent} />
           <div className="flex-1">
             <h3 className="font-semibold">{category.name}</h3>
             {!expanded && (
               <p className="text-sm text-gray-600">
                 {category.masteredPercent}% mastered
               </p>
             )}
             {expanded && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                 <Stats {...category} />
               </motion.div>
             )}
           </div>
           <Checkbox checked={selected} onChange={onToggle} />
         </div>
       </motion.div>
     );
   };
   ```

6. **Alternative: Expandable details:**
   - Add "info" icon that opens detailed stats
   - Use modal or popover for detailed statistics
   - Keep main card clean and scannable

## Success Criteria
- Category cards are easy to scan
- Primary information is immediately visible
- Detailed information is accessible but not overwhelming
- Improved visual hierarchy
- Faster category selection
- Better mobile experience
- Positive user feedback

## References
- UI_Review.md: Section 2.2 - Component-Level Issues: Category Filter Information Density
- Material Design 3: Cards and Progressive Disclosure
- Nielsen Norman Group: Progressive Disclosure principles
