# Phase 3: Enhanced User Feedback

**Priority**: MEDIUM (Should Have)
**Estimated Time**: 2-3 hours
**Dependencies**: Phase 1 (ReviewDashboard), Phase 2 (Session types)

## Overview

Add motivational feedback and clarity to the learning experience. Users should know when they'll see a card next, celebrate improvements, and feel progress toward mastery.

---

## Task 7: Next Review Indicator Component

### Objective
Show users when they'll see each flashcard again based on their current mastery level and Leitner intervals.

### File to Create
`src/components/NextReviewIndicator.tsx`

### Visual Design

Display on flashcard after user answers:

```
┌─────────────────────────────────────┐
│ ✅ Correct!                          │
│                                     │
│ Mastery: Level 3 ⭐⭐⭐               │
│ Next review: November 23            │
│ (in 14 days)                        │
│                                     │
│ ◯━━━━━━●━━━━━━◯                     │
│ 7d    14d     30d                   │
└─────────────────────────────────────┘
```

### Component Interface

```typescript
interface NextReviewIndicatorProps {
  masteryLevel: number; // 0-5
  lastPracticed: Date;
  isCorrect: boolean; // For context (just answered)
  nextMasteryLevel?: number; // If answer changes level
}

export const NextReviewIndicator: React.FC<NextReviewIndicatorProps> = ({
  masteryLevel,
  lastPracticed,
  isCorrect,
  nextMasteryLevel
}) => {
  const nextReviewDate = getNextReviewDate(masteryLevel, lastPracticed);
  const daysUntilReview = daysBetween(new Date(), nextReviewDate);

  return (
    <div className="next-review-indicator">
      {/* Current mastery level */}
      <MasteryLevelDisplay level={masteryLevel} />

      {/* Next review info */}
      <div className="next-review-info">
        <span className="next-review-label">Next review:</span>
        <span className="next-review-date">
          {formatDate(nextReviewDate)}
        </span>
        <span className="next-review-relative">
          (in {daysUntilReview} {daysUntilReview === 1 ? 'day' : 'days'})
        </span>
      </div>

      {/* Visual timeline */}
      <ReviewTimeline currentLevel={masteryLevel} />

      {/* Level change indicator */}
      {nextMasteryLevel && nextMasteryLevel !== masteryLevel && (
        <LevelChangeIndicator
          from={masteryLevel}
          to={nextMasteryLevel}
          direction={nextMasteryLevel > masteryLevel ? 'up' : 'down'}
        />
      )}
    </div>
  );
};
```

### Sub-Components

#### 1. MasteryLevelDisplay

```typescript
const MasteryLevelDisplay: React.FC<{ level: number }> = ({ level }) => {
  const stars = '⭐'.repeat(level);
  const emptyStars = '☆'.repeat(5 - level);

  const levelNames = [
    'New',
    'Beginner',
    'Learning',
    'Good',
    'Strong',
    'Mastered'
  ];

  return (
    <div className="mastery-display">
      <span className="level-name">{levelNames[level]}</span>
      <span className="level-stars">{stars}{emptyStars}</span>
      <span className="level-number">Level {level}</span>
    </div>
  );
};
```

#### 2. ReviewTimeline

Visual representation of Leitner intervals:

```typescript
const ReviewTimeline: React.FC<{ currentLevel: number }> = ({ currentLevel }) => {
  const intervals = [1, 3, 7, 14, 30, 90]; // days

  return (
    <div className="review-timeline">
      <div className="timeline-track">
        {intervals.map((interval, index) => (
          <div
            key={interval}
            className={`timeline-point ${
              index === currentLevel ? 'active' : ''
            } ${index < currentLevel ? 'completed' : ''}`}
          >
            <div className="timeline-dot" />
            <div className="timeline-label">{interval}d</div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

#### 3. LevelChangeIndicator

```typescript
interface LevelChangeIndicatorProps {
  from: number;
  to: number;
  direction: 'up' | 'down';
}

const LevelChangeIndicator: React.FC<LevelChangeIndicatorProps> = ({
  from,
  to,
  direction
}) => {
  return (
    <div className={`level-change ${direction}`}>
      <span className="level-change-icon">
        {direction === 'up' ? '⬆️' : '⬇️'}
      </span>
      <span className="level-change-text">
        {direction === 'up'
          ? `Advancing to Level ${to}!`
          : `Back to Level ${to}`}
      </span>
    </div>
  );
};
```

### Helper Functions

Add to `src/utils/spacedRepetition.ts`:

```typescript
export const getNextReviewDate = (
  masteryLevel: number,
  lastPracticed: Date
): Date => {
  const intervals = [1, 3, 7, 14, 30, 90]; // days
  const interval = intervals[masteryLevel] || 1;

  const nextDate = new Date(lastPracticed);
  nextDate.setDate(nextDate.getDate() + interval);

  return nextDate;
};

export const formatRelativeTime = (date: Date): string => {
  const days = daysBetween(new Date(), date);

  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days < 7) return `in ${days} days`;
  if (days < 30) return `in ${Math.floor(days / 7)} weeks`;
  return `in ${Math.floor(days / 30)} months`;
};
```

### Integration

Update `src/components/FlashCard.tsx`:

```typescript
// After user submits answer and feedback is shown
{showAnswer && (
  <div className="answer-feedback">
    <AnswerResult isCorrect={isCorrect} />

    <NextReviewIndicator
      masteryLevel={currentProgress.mastery_level}
      lastPracticed={new Date()}
      isCorrect={isCorrect}
      nextMasteryLevel={projectedMasteryLevel}
    />

    <button onClick={handleNext}>Next Card</button>
  </div>
)}
```

### Styling Guidelines

- Use subtle animations (fade in, slide up)
- Color coding:
  - Green for level up
  - Red for level down
  - Blue for neutral
- Keep text size readable but not overwhelming
- Responsive: stack vertically on mobile

---

## Task 8: Level-Up Celebration Animation

### Objective
Celebrate when users improve their mastery level with a rewarding animation.

### Trigger Conditions

Level up happens when:
- User answers correctly
- New mastery level > previous mastery level
- Based on accuracy calculation in `calculateMasteryLevel()`

### Implementation Approach

#### Option 1: Pure CSS Animation (Lightweight)

**File**: `src/components/LevelUpCelebration.tsx`

```typescript
interface LevelUpCelebrationProps {
  fromLevel: number;
  toLevel: number;
  onComplete?: () => void;
}

export const LevelUpCelebration: React.FC<LevelUpCelebrationProps> = ({
  fromLevel,
  toLevel,
  onComplete
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 2000); // Auto-dismiss after 2s

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="level-up-celebration">
      <div className="celebration-content">
        <div className="celebration-icon animate-bounce">
          🎉
        </div>
        <h2 className="celebration-title animate-slide-up">
          Level Up!
        </h2>
        <div className="celebration-levels">
          <span className="old-level">Level {fromLevel}</span>
          <span className="arrow">→</span>
          <span className="new-level">Level {toLevel}</span>
        </div>
        <p className="celebration-message">
          Great progress! Keep it up!
        </p>
      </div>

      {/* Sparkles animation */}
      <div className="sparkles">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="sparkle"
            style={{
              '--delay': `${i * 0.1}s`,
              '--angle': `${i * 30}deg`
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
};
```

**CSS** (in `src/styles/celebrations.css`):

```css
.level-up-celebration {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  animation: fadeIn 0.3s ease-in;
}

.celebration-content {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: scaleIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.celebration-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sparkle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: gold;
  border-radius: 50%;
  animation: sparkleAnimation 1s ease-out forwards;
  animation-delay: var(--delay);
  transform-origin: center;
}

@keyframes sparkleAnimation {
  0% {
    transform: rotate(var(--angle)) translateX(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: rotate(var(--angle)) translateX(100px) scale(0);
    opacity: 0;
  }
}
```

#### Option 2: Using Animation Library (Feature-Rich)

Install library:
```bash
npm install react-confetti
```

```typescript
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

export const LevelUpCelebration: React.FC<LevelUpCelebrationProps> = ({
  fromLevel,
  toLevel,
  onComplete
}) => {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <>
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={200}
          recycle={false}
        />
      )}
      <div className="level-up-overlay">
        {/* ... rest of celebration UI ... */}
      </div>
    </>
  );
};
```

**Recommendation**: Start with Option 1 (pure CSS) for performance, add Option 2 later if desired.

### Integration in FlashCard

```typescript
const [showLevelUp, setShowLevelUp] = useState(false);
const [levelUpData, setLevelUpData] = useState<{from: number, to: number} | null>(null);

const handleAnswerSubmit = async (userAnswer: string) => {
  const isCorrect = checkAnswer(userAnswer);

  // Update progress
  const updatedProgress = await updateProgress(isCorrect);

  // Check for level up
  if (updatedProgress.mastery_level > currentProgress.mastery_level) {
    setLevelUpData({
      from: currentProgress.mastery_level,
      to: updatedProgress.mastery_level
    });
    setShowLevelUp(true);
  }

  setShowAnswer(true);
};

return (
  <>
    {/* Main flashcard UI */}
    <div className="flashcard">
      {/* ... */}
    </div>

    {/* Level-up celebration overlay */}
    {showLevelUp && levelUpData && (
      <LevelUpCelebration
        fromLevel={levelUpData.from}
        toLevel={levelUpData.to}
        onComplete={() => {
          setShowLevelUp(false);
          setLevelUpData(null);
        }}
      />
    )}
  </>
);
```

### Sound Effects (Optional)

Add celebratory sound:

```typescript
const playLevelUpSound = () => {
  const audio = new Audio('/sounds/level-up.mp3');
  audio.volume = 0.3;
  audio.play().catch(() => {
    // Ignore if autoplay is blocked
  });
};

// In celebration component
useEffect(() => {
  if (userPreferences.soundEnabled) {
    playLevelUpSound();
  }
}, []);
```

### User Preferences

Add option to disable celebrations:

```typescript
// In user_preferences table
celebration_animations BOOLEAN DEFAULT true
```

Check preference before showing:

```typescript
if (shouldLevelUp && userPreferences.celebration_animations) {
  setShowLevelUp(true);
}
```

---

## Task 9: Progress Bar Enhancements

### Objective
Make the ProgressBar component more informative by showing progress toward completing due cards and session goals.

### File to Update
`src/components/ProgressBar.tsx`

### Current Display
- Session progress: X/Y cards
- Accuracy: 85%
- Current streak: 5

### Enhanced Display

Add:
1. **Due Cards Progress** (if in Smart Review mode)
   - "15/23 due cards completed"
   - Visual progress bar

2. **Daily Goal Progress** (if user has set a goal)
   - "18/25 cards toward daily goal"
   - Celebrate when goal reached

3. **Mastery Projection**
   - "Keep this up: 3 cards will level up!"
   - Shows impact of current accuracy

### Implementation

```typescript
interface ProgressBarProps {
  currentIndex: number;
  totalCards: number;
  correctCount: number;
  wrongCount: number;
  currentStreak: number;

  // NEW PROPS
  sessionMode?: 'smart' | 'all' | 'category';
  dueCardsTotal?: number; // Total due today
  dailyGoal?: number;
  cardsReviewedToday?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentIndex,
  totalCards,
  correctCount,
  wrongCount,
  currentStreak,
  sessionMode,
  dueCardsTotal,
  dailyGoal,
  cardsReviewedToday = 0
}) => {
  const totalAttempts = correctCount + wrongCount;
  const accuracy = totalAttempts > 0
    ? Math.round((correctCount / totalAttempts) * 100)
    : 0;

  // Calculate projected level-ups
  const projectedLevelUps = calculateProjectedLevelUps(
    currentWords,
    progressMap,
    accuracy
  );

  return (
    <div className="progress-bar-container">
      {/* Session Progress */}
      <div className="progress-section">
        <div className="progress-label">
          Session Progress
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${(currentIndex / totalCards) * 100}%` }}
          />
        </div>
        <div className="progress-text">
          {currentIndex} / {totalCards} cards
        </div>
      </div>

      {/* Due Cards Progress (Smart Review only) */}
      {sessionMode === 'smart' && dueCardsTotal && (
        <div className="progress-section">
          <div className="progress-label">
            Due Cards Today
          </div>
          <div className="progress-track">
            <div
              className="progress-fill bg-green-500"
              style={{ width: `${(currentIndex / dueCardsTotal) * 100}%` }}
            />
          </div>
          <div className="progress-text">
            {currentIndex} / {dueCardsTotal} completed
          </div>
        </div>
      )}

      {/* Daily Goal Progress */}
      {dailyGoal && (
        <div className="progress-section">
          <div className="progress-label">
            Daily Goal
            {cardsReviewedToday >= dailyGoal && ' 🎯'}
          </div>
          <div className="progress-track">
            <div
              className="progress-fill bg-blue-500"
              style={{
                width: `${Math.min((cardsReviewedToday / dailyGoal) * 100, 100)}%`
              }}
            />
          </div>
          <div className="progress-text">
            {cardsReviewedToday} / {dailyGoal} cards
          </div>
        </div>
      )}

      {/* Existing Stats */}
      <div className="stats-grid">
        <div className="stat">
          <span className="stat-label">Accuracy</span>
          <span className="stat-value">{accuracy}%</span>
        </div>
        <div className="stat">
          <span className="stat-label">Streak</span>
          <span className="stat-value">🔥 {currentStreak}</span>
        </div>

        {/* NEW: Mastery Projection */}
        {projectedLevelUps > 0 && (
          <div className="stat">
            <span className="stat-label">Level-ups</span>
            <span className="stat-value">⬆️ {projectedLevelUps}</span>
          </div>
        )}
      </div>
    </div>
  );
};
```

### Helper Function

```typescript
const calculateProjectedLevelUps = (
  words: Word[],
  progressMap: Map<number, WordProgress>,
  currentAccuracy: number
): number => {
  let levelUpCount = 0;

  words.forEach(word => {
    const progress = progressMap.get(word.id);
    if (!progress) return;

    const currentLevel = progress.mastery_level;

    // Simulate one more correct answer
    const newCorrectCount = progress.correct_count + 1;
    const newTotalCount = progress.correct_count + progress.wrong_count + 1;
    const projectedAccuracy = (newCorrectCount / newTotalCount) * 100;

    const projectedLevel = calculateMasteryLevel(
      newCorrectCount,
      progress.wrong_count
    );

    if (projectedLevel > currentLevel) {
      levelUpCount++;
    }
  });

  return levelUpCount;
};
```

### Goal Completion Celebration

When daily goal is reached:

```typescript
useEffect(() => {
  if (cardsReviewedToday === dailyGoal && !goalCelebrationShown) {
    showGoalCelebration();
    setGoalCelebrationShown(true);
  }
}, [cardsReviewedToday, dailyGoal]);

const showGoalCelebration = () => {
  toast.success('🎉 Daily goal reached! Great work!', {
    duration: 3000,
    icon: '🎯'
  });
};
```

---

## Testing Checklist

### NextReviewIndicator
- [ ] Displays correct next review date
- [ ] Shows relative time accurately ("in 7 days")
- [ ] Timeline highlights current mastery level
- [ ] Level change indicator appears when appropriate
- [ ] Responsive on mobile and desktop
- [ ] Works in dark mode

### Level-Up Celebration
- [ ] Triggers only when mastery level increases
- [ ] Animation plays smoothly
- [ ] Auto-dismisses after timeout
- [ ] Can be manually dismissed
- [ ] Doesn't block interaction if dismissed
- [ ] Respects user preference to disable
- [ ] Sound plays if enabled (and only if enabled)

### Progress Bar
- [ ] Session progress is accurate
- [ ] Due cards progress shows in Smart Review mode only
- [ ] Daily goal progress updates correctly
- [ ] Goal celebration triggers at exact goal
- [ ] Mastery projection is accurate
- [ ] All progress bars fill correctly (0-100%)
- [ ] Stats display with correct formatting

---

## Acceptance Criteria

### Phase 3 is complete when:

1. ✅ Users see when each card will be reviewed next
2. ✅ Visual timeline shows progression through Leitner intervals
3. ✅ Level-up celebration appears when mastery increases
4. ✅ Progress bar shows due cards completion in Smart Review mode
5. ✅ Daily goal progress is tracked and celebrated
6. ✅ Users can disable celebrations in preferences
7. ✅ All animations are smooth and performant
8. ✅ Feedback is motivating and clear
9. ✅ Dark mode support for all new components
10. ✅ No performance degradation on mobile devices

---

## User Stories

**As a user, I want to...**

- Know when I'll see a card again, so I understand the learning schedule
- Celebrate my progress, so I feel motivated to continue
- See how close I am to my daily goal, so I stay on track
- Understand what mastery level means, so I know where I stand
- Disable animations if I prefer, so I have control over my experience

---

## Next Steps

After completing Phase 3, proceed to:
- **Phase 4**: User Preferences (customize review experience)

---

## Notes & Tips

- Keep animations subtle and professional
- Don't overdo celebrations (annoying > motivating)
- Make next review date prominent but not distracting
- Test with various mastery levels (especially 0 and 5)
- Consider accessibility (reduced motion preference)
- Add haptic feedback on mobile for celebrations
- Ensure celebrations don't delay workflow

---

**File Created**: `docs/implementation/leitner-system/phase-3-enhanced-feedback.md`
