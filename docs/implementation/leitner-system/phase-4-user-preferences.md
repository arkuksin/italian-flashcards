# Phase 4: User Preferences

**Priority**: LOW (Nice to Have)
**Estimated Time**: 1-2 hours
**Dependencies**: Phase 1-3 (All previous features)

## Overview

Allow users to customize their learning experience by setting preferences for default review mode, celebration animations, next review visibility, daily goals, and more.

---

## Task 10: Add User Preference Fields

### Objective
Extend the `user_preferences` table to store Leitner-specific settings.

### Current Schema

```sql
-- From supabase/schema.sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dark_mode BOOLEAN DEFAULT false,
  default_learning_direction TEXT DEFAULT 'ru-it',
  shuffle_mode BOOLEAN DEFAULT true,
  daily_goal INTEGER DEFAULT 20,
  notification_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);
```

### New Fields to Add

Create migration file:

**File**: `supabase/migrations/YYYYMMDD_add_leitner_preferences.sql`

```sql
-- Add Leitner-specific user preferences

-- Default review mode when opening the app
ALTER TABLE user_preferences
ADD COLUMN default_review_mode TEXT
  CHECK (default_review_mode IN ('smart', 'all', 'category'))
  DEFAULT 'smart';

-- Show next review date on flashcards
ALTER TABLE user_preferences
ADD COLUMN show_next_review_date BOOLEAN DEFAULT true;

-- Enable celebration animations for level-ups
ALTER TABLE user_preferences
ADD COLUMN celebration_animations BOOLEAN DEFAULT true;

-- Play sound effects
ALTER TABLE user_preferences
ADD COLUMN sound_effects BOOLEAN DEFAULT false;

-- Show mastery timeline on flashcards
ALTER TABLE user_preferences
ADD COLUMN show_mastery_timeline BOOLEAN DEFAULT true;

-- Daily goal for number of cards to review
-- (already exists, but ensure default is sensible)
ALTER TABLE user_preferences
ALTER COLUMN daily_goal SET DEFAULT 20;

-- Show daily goal progress in UI
ALTER TABLE user_preferences
ADD COLUMN show_daily_goal BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN user_preferences.default_review_mode IS
'Default mode when starting a session: smart (due cards), all (all cards), category (choose category)';

COMMENT ON COLUMN user_preferences.show_next_review_date IS
'Display when each card will be reviewed next';

COMMENT ON COLUMN user_preferences.celebration_animations IS
'Show celebration animations when leveling up mastery';

COMMENT ON COLUMN user_preferences.sound_effects IS
'Play sound effects for celebrations and feedback';

COMMENT ON COLUMN user_preferences.show_mastery_timeline IS
'Display visual timeline of Leitner intervals on flashcards';

COMMENT ON COLUMN user_preferences.show_daily_goal IS
'Display daily goal progress in the UI';
```

### Apply Migration

```bash
# Test migration on test database first
npm run migrate -- --check

# Apply migration
npm run migrate
```

### TypeScript Types

Update `src/types/index.ts`:

```typescript
export interface UserPreferences {
  id: string;
  user_id: string;
  dark_mode: boolean;
  default_learning_direction: 'ru-it' | 'it-ru';
  shuffle_mode: boolean;
  daily_goal: number;
  notification_enabled: boolean;

  // NEW: Leitner preferences
  default_review_mode: 'smart' | 'all' | 'category';
  show_next_review_date: boolean;
  celebration_animations: boolean;
  sound_effects: boolean;
  show_mastery_timeline: boolean;
  show_daily_goal: boolean;

  created_at: string;
  updated_at: string;
}
```

---

## Task 11: Create Settings UI

### Objective
Build a Settings page/modal where users can configure their preferences.

### File to Create
`src/pages/Settings.tsx` (or `src/components/SettingsModal.tsx` if modal approach)

### UI Design

```
┌─────────────────────────────────────┐
│ ⚙️ Settings                          │
├─────────────────────────────────────┤
│ Learning Preferences                │
│                                     │
│ Default Review Mode                 │
│ [Smart Review ▼]                    │
│                                     │
│ Default Learning Direction          │
│ [Russian → Italian ▼]               │
│                                     │
│ Daily Goal                          │
│ [20] cards per day                  │
│                                     │
│ [✓] Shuffle cards                   │
│ [✓] Show daily goal progress        │
├─────────────────────────────────────┤
│ Display Preferences                 │
│                                     │
│ [✓] Show next review date           │
│ [✓] Show mastery timeline           │
│ [✓] Dark mode                       │
├─────────────────────────────────────┤
│ Animations & Sound                  │
│                                     │
│ [✓] Celebration animations          │
│ [ ] Sound effects                   │
├─────────────────────────────────────┤
│ Notifications (Coming Soon)         │
│                                     │
│ [ ] Daily review reminders          │
├─────────────────────────────────────┤
│ [Save Settings]  [Cancel]           │
└─────────────────────────────────────┘
```

### Component Implementation

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserPreferences } from '../types';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setPreferences(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user || !preferences) return;

    setSaving(true);

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        ...preferences,
        user_id: user.id,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save settings');
    } else {
      alert('Settings saved successfully!');
    }

    setSaving(false);
  };

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
  };

  if (loading) {
    return <div>Loading settings...</div>;
  }

  if (!preferences) {
    return <div>Error loading preferences</div>;
  }

  return (
    <div className="settings-container">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Learning Preferences Section */}
      <section className="settings-section">
        <h2 className="text-xl font-semibold mb-4">Learning Preferences</h2>

        {/* Default Review Mode */}
        <div className="setting-item">
          <label htmlFor="review-mode">Default Review Mode</label>
          <select
            id="review-mode"
            value={preferences.default_review_mode}
            onChange={(e) => updatePreference('default_review_mode', e.target.value as any)}
            className="setting-select"
          >
            <option value="smart">Smart Review (Due Cards Only)</option>
            <option value="all">Practice All</option>
            <option value="category">Category Focus</option>
          </select>
        </div>

        {/* Default Learning Direction */}
        <div className="setting-item">
          <label htmlFor="direction">Default Learning Direction</label>
          <select
            id="direction"
            value={preferences.default_learning_direction}
            onChange={(e) => updatePreference('default_learning_direction', e.target.value as any)}
            className="setting-select"
          >
            <option value="ru-it">Russian → Italian</option>
            <option value="it-ru">Italian → Russian</option>
          </select>
        </div>

        {/* Daily Goal */}
        <div className="setting-item">
          <label htmlFor="daily-goal">Daily Goal</label>
          <div className="flex items-center gap-2">
            <input
              id="daily-goal"
              type="number"
              min="5"
              max="100"
              value={preferences.daily_goal}
              onChange={(e) => updatePreference('daily_goal', parseInt(e.target.value))}
              className="setting-input w-20"
            />
            <span>cards per day</span>
          </div>
        </div>

        {/* Shuffle Mode */}
        <div className="setting-item">
          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={preferences.shuffle_mode}
              onChange={(e) => updatePreference('shuffle_mode', e.target.checked)}
            />
            <span>Shuffle cards</span>
          </label>
        </div>

        {/* Show Daily Goal */}
        <div className="setting-item">
          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={preferences.show_daily_goal}
              onChange={(e) => updatePreference('show_daily_goal', e.target.checked)}
            />
            <span>Show daily goal progress</span>
          </label>
        </div>
      </section>

      {/* Display Preferences Section */}
      <section className="settings-section">
        <h2 className="text-xl font-semibold mb-4">Display Preferences</h2>

        <div className="setting-item">
          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={preferences.show_next_review_date}
              onChange={(e) => updatePreference('show_next_review_date', e.target.checked)}
            />
            <span>Show next review date on flashcards</span>
          </label>
        </div>

        <div className="setting-item">
          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={preferences.show_mastery_timeline}
              onChange={(e) => updatePreference('show_mastery_timeline', e.target.checked)}
            />
            <span>Show mastery timeline</span>
          </label>
        </div>

        <div className="setting-item">
          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={preferences.dark_mode}
              onChange={(e) => updatePreference('dark_mode', e.target.checked)}
            />
            <span>Dark mode</span>
          </label>
        </div>
      </section>

      {/* Animations & Sound Section */}
      <section className="settings-section">
        <h2 className="text-xl font-semibold mb-4">Animations & Sound</h2>

        <div className="setting-item">
          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={preferences.celebration_animations}
              onChange={(e) => updatePreference('celebration_animations', e.target.checked)}
            />
            <span>Celebration animations</span>
          </label>
          <p className="text-sm text-gray-500 ml-6">
            Show animations when leveling up mastery
          </p>
        </div>

        <div className="setting-item">
          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={preferences.sound_effects}
              onChange={(e) => updatePreference('sound_effects', e.target.checked)}
            />
            <span>Sound effects</span>
          </label>
          <p className="text-sm text-gray-500 ml-6">
            Play sounds for celebrations and feedback
          </p>
        </div>
      </section>

      {/* Notifications Section (Future) */}
      <section className="settings-section">
        <h2 className="text-xl font-semibold mb-4">Notifications</h2>

        <div className="setting-item">
          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={preferences.notification_enabled}
              onChange={(e) => updatePreference('notification_enabled', e.target.checked)}
              disabled
            />
            <span className="text-gray-400">Daily review reminders (Coming Soon)</span>
          </label>
        </div>
      </section>

      {/* Action Buttons */}
      <div className="settings-actions">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        <button
          onClick={() => window.history.back()}
          className="btn btn-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
```

### Styling

**File**: `src/styles/settings.css`

```css
.settings-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.settings-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.setting-item {
  margin-bottom: 1.5rem;
}

.setting-item label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.setting-select,
.setting-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
}

.setting-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.setting-checkbox input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}

.settings-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

/* Dark mode support */
.dark .setting-select,
.dark .setting-input {
  background: #1f2937;
  border-color: #374151;
  color: white;
}
```

---

## Integration with Existing Components

### 1. Load Preferences on App Start

Update `src/contexts/AuthContext.tsx` or create `src/hooks/usePreferences.tsx`:

```typescript
import { useState, useEffect, useContext, createContext } from 'react';
import { supabase } from '../lib/supabase';
import { UserPreferences } from '../types';
import { useAuth } from './AuthContext';

interface PreferencesContextType {
  preferences: UserPreferences | null;
  loading: boolean;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
      setPreferences(null);
      setLoading(false);
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setPreferences(data);
    } else {
      // Create default preferences
      await createDefaultPreferences();
    }

    setLoading(false);
  };

  const createDefaultPreferences = async () => {
    if (!user) return;

    const defaultPrefs: Partial<UserPreferences> = {
      user_id: user.id,
      dark_mode: false,
      default_learning_direction: 'ru-it',
      shuffle_mode: true,
      daily_goal: 20,
      notification_enabled: false,
      default_review_mode: 'smart',
      show_next_review_date: true,
      celebration_animations: true,
      sound_effects: false,
      show_mastery_timeline: true,
      show_daily_goal: true
    };

    const { data } = await supabase
      .from('user_preferences')
      .insert(defaultPrefs)
      .select()
      .single();

    if (data) {
      setPreferences(data);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user || !preferences) return;

    const { data, error } = await supabase
      .from('user_preferences')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (data) {
      setPreferences(data);
    }
  };

  const refreshPreferences = async () => {
    await loadPreferences();
  };

  return (
    <PreferencesContext.Provider
      value={{ preferences, loading, updatePreferences, refreshPreferences }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return context;
};
```

### 2. Use Preferences in Components

**In Dashboard.tsx:**

```typescript
import { usePreferences } from '../hooks/usePreferences';

const Dashboard = () => {
  const { preferences } = usePreferences();

  // Set default review mode
  const [sessionConfig, setSessionConfig] = useState<SessionConfig>({
    reviewMode: preferences?.default_review_mode || 'smart',
    learningDirection: preferences?.default_learning_direction || 'ru-it'
  });

  // ... rest of component
};
```

**In FlashCard.tsx:**

```typescript
const FlashCard = ({ word, onAnswer }) => {
  const { preferences } = usePreferences();

  return (
    <div className="flashcard">
      {/* ... card content ... */}

      {/* Conditionally show next review indicator */}
      {preferences?.show_next_review_date && (
        <NextReviewIndicator {...props} />
      )}

      {/* Conditionally show mastery timeline */}
      {preferences?.show_mastery_timeline && (
        <ReviewTimeline {...props} />
      )}
    </div>
  );
};
```

**In LevelUpCelebration.tsx:**

```typescript
const LevelUpCelebration = ({ fromLevel, toLevel }) => {
  const { preferences } = usePreferences();

  // Don't show if disabled
  if (!preferences?.celebration_animations) {
    return null;
  }

  // Play sound if enabled
  useEffect(() => {
    if (preferences?.sound_effects) {
      playLevelUpSound();
    }
  }, []);

  // ... rest of component
};
```

### 3. Add Settings Link to Navigation

Update navigation/header:

```typescript
<nav>
  <Link to="/dashboard">Dashboard</Link>
  <Link to="/statistics">Statistics</Link>
  <Link to="/settings">⚙️ Settings</Link>
  <Link to="/logout">Logout</Link>
</nav>
```

---

## Testing Checklist

### Database
- [ ] Migration applies successfully
- [ ] New columns have correct types and defaults
- [ ] Existing user preferences are not affected
- [ ] RLS policies work correctly

### Settings UI
- [ ] Settings page loads preferences correctly
- [ ] All controls update state properly
- [ ] Save button persists changes to database
- [ ] Cancel button discards changes
- [ ] Loading state displays while fetching
- [ ] Error handling for save failures

### Integration
- [ ] Default review mode is applied on app start
- [ ] Next review date respects show/hide preference
- [ ] Celebrations respect animation preference
- [ ] Sound effects respect audio preference
- [ ] Daily goal progress respects show/hide preference
- [ ] Dark mode toggle still works

### Edge Cases
- [ ] New user gets default preferences
- [ ] Missing preferences table entry is handled
- [ ] Invalid preference values are rejected
- [ ] Concurrent updates don't cause conflicts

---

## Acceptance Criteria

### Phase 4 is complete when:

1. ✅ User preferences table includes all Leitner settings
2. ✅ Settings page displays all configurable options
3. ✅ Settings are persisted to database on save
4. ✅ Settings are loaded and applied on app start
5. ✅ Components respect user preferences (show/hide features)
6. ✅ Default review mode is applied automatically
7. ✅ Animations can be disabled via preferences
8. ✅ All preferences have sensible defaults
9. ✅ Settings UI is intuitive and well-organized
10. ✅ No regressions to existing preference features

---

## User Stories

**As a user, I want to...**

- Set my preferred review mode, so it's selected by default
- Control which UI elements I see, so I can reduce clutter
- Disable animations if they distract me, so I can focus on learning
- Set a daily goal that motivates me, so I stay consistent
- Customize my experience, so the app works how I want

---

## Next Steps

After completing Phase 4, proceed to:
- **Phase 5**: Database & Backend (ensure all backend support is solid)
- **Phase 6**: Testing & Documentation

---

## Notes & Tips

- Make preferences easily discoverable (prominent Settings link)
- Provide tooltips/help text for each setting
- Consider preset profiles ("Beginner", "Intense Learner", etc.)
- Add "Reset to Defaults" button
- Ensure preferences sync across devices (Supabase handles this)
- Consider exporting/importing preferences for power users
- Add analytics to see which preferences are most used

---

**File Created**: `docs/implementation/leitner-system/phase-4-user-preferences.md`
