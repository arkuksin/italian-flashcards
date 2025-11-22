# Freemium Implementierungsplan - Schritt für Schritt

Dieser Plan beschreibt die technische Umsetzung der Freemium-Monetarisierung für die Italian Flashcards App.

## Übersicht der Tiers

### 🆓 Free Tier
- 50 Wörter/Monat
- 3 Kategorien gleichzeitig
- Basis Leitner (Level 0-3)
- 1 Learning Direction
- Basis Statistics
- Werbung nach jeder 10. Karte

### 💎 Premium Tier (€4.99/Monat)
- Unbegrenzte Wörter
- Alle Kategorien
- Vollständiges Leitner (0-5)
- Beide Directions
- Advanced Analytics
- Offline Mode
- Keine Werbung

### 👑 Ultimate Tier (€9.99/Monat)
- Alle Premium Features
- Custom Flashcards
- AI Features
- Multi-Language
- VIP Support

---

## Phase 1: Datenbank-Setup (Woche 1)

### Step 1.1: Subscription Schema Migration

**Datei:** `supabase/migrations/XXX_add_subscriptions.sql`

```sql
-- Subscription tiers enum
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'ultimate');
CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'cancelled', 'expired', 'past_due');
CREATE TYPE payment_provider AS ENUM ('stripe', 'paddle', 'manual');

-- User subscriptions table
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',

  -- Trial management
  trial_ends_at TIMESTAMPTZ,

  -- Subscription management
  subscription_starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subscription_ends_at TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,

  -- Payment provider info
  payment_provider payment_provider,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  paddle_subscription_id TEXT,

  -- Pricing
  price_amount DECIMAL(10,2),
  price_currency TEXT DEFAULT 'EUR',
  billing_interval TEXT, -- 'monthly' or 'yearly'

  -- Metadata
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id)
);

-- Index for faster lookups
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);

-- RLS Policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON user_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Updated_at trigger
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Step 1.2: Usage Tracking Table

```sql
-- Track monthly word limits for free tier
CREATE TABLE user_usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Usage counters
  words_learned_this_month INTEGER NOT NULL DEFAULT 0,
  active_categories INTEGER NOT NULL DEFAULT 0,

  -- Period tracking
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Limits based on tier
  words_limit INTEGER NOT NULL DEFAULT 50,
  categories_limit INTEGER NOT NULL DEFAULT 3,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one record per user per month
  UNIQUE(user_id, period_start)
);

CREATE INDEX idx_usage_tracking_user_period ON user_usage_tracking(user_id, period_start);

ALTER TABLE user_usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON user_usage_tracking FOR SELECT
  USING (auth.uid() = user_id);
```

### Step 1.3: Feature Access Table

```sql
-- Track feature access overrides (for grandfathering, special offers, etc.)
CREATE TABLE user_feature_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,

  -- Access control
  has_access BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Metadata
  granted_by TEXT, -- 'trial', 'referral', 'admin', 'lifetime'
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, feature_key)
);

CREATE INDEX idx_feature_access_user ON user_feature_access(user_id);

ALTER TABLE user_feature_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feature access"
  ON user_feature_access FOR SELECT
  USING (auth.uid() = user_id);
```

### Step 1.4: Default Subscription for Existing Users

```sql
-- Create free subscriptions for all existing users
INSERT INTO user_subscriptions (user_id, tier, status)
SELECT id, 'free', 'active'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_subscriptions);
```

### Step 1.5: Run Migration

```bash
npm run migrate
```

---

## Phase 2: TypeScript Types & Constants (Woche 1)

### Step 2.1: Add Subscription Types

**Datei:** `src/types/subscription.ts`

```typescript
export type SubscriptionTier = 'free' | 'premium' | 'ultimate'
export type SubscriptionStatus = 'active' | 'trialing' | 'cancelled' | 'expired' | 'past_due'
export type PaymentProvider = 'stripe' | 'paddle' | 'manual'
export type BillingInterval = 'monthly' | 'yearly'

export interface UserSubscription {
  id: string
  user_id: string
  tier: SubscriptionTier
  status: SubscriptionStatus

  trial_ends_at: string | null
  subscription_starts_at: string
  subscription_ends_at: string | null
  next_billing_date: string | null

  payment_provider: PaymentProvider | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  paddle_subscription_id: string | null

  price_amount: number | null
  price_currency: string
  billing_interval: BillingInterval | null

  cancelled_at: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
}

export interface UsageTracking {
  id: string
  user_id: string
  words_learned_this_month: number
  active_categories: number
  period_start: string
  period_end: string
  words_limit: number
  categories_limit: number
  created_at: string
  updated_at: string
}

export interface FeatureAccess {
  id: string
  user_id: string
  feature_key: string
  has_access: boolean
  granted_at: string
  expires_at: string | null
  granted_by: string | null
  notes: string | null
  created_at: string
}
```

### Step 2.2: Feature Keys Constants

**Datei:** `src/constants/features.ts`

```typescript
export const FEATURES = {
  // Learning Features
  UNLIMITED_WORDS: 'unlimited_words',
  ALL_CATEGORIES: 'all_categories',
  FULL_LEITNER: 'full_leitner',
  BOTH_DIRECTIONS: 'both_directions',
  CUSTOM_DAILY_GOALS: 'custom_daily_goals',
  DIFFICULTY_RATING: 'difficulty_rating',

  // Analytics
  ADVANCED_ANALYTICS: 'advanced_analytics',
  REVIEW_HISTORY: 'review_history',
  LEARNING_VELOCITY: 'learning_velocity',
  RETENTION_ANALYSIS: 'retention_analysis',
  HEATMAP: 'heatmap',
  BOX_DISTRIBUTION: 'box_distribution',
  EXPORT_PROGRESS: 'export_progress',

  // Gamification
  PREMIUM_ACHIEVEMENTS: 'premium_achievements',
  UNLIMITED_STREAK: 'unlimited_streak',
  XP_BOOSTS: 'xp_boosts',

  // Productivity
  OFFLINE_MODE: 'offline_mode',
  NO_ADS: 'no_ads',
  ADVANCED_SHORTCUTS: 'advanced_shortcuts',

  // Ultimate Features
  CUSTOM_DECKS: 'custom_decks',
  DECK_IMPORT_EXPORT: 'deck_import_export',
  AI_CONTEXT: 'ai_context',
  AI_MNEMONICS: 'ai_mnemonics',
  AI_PRONUNCIATION: 'ai_pronunciation',
  MULTI_LANGUAGE: 'multi_language',
  COLLABORATION: 'collaboration',
} as const

export type FeatureKey = typeof FEATURES[keyof typeof FEATURES]

// Feature Matrix: Which tier has access to which feature
export const FEATURE_MATRIX: Record<FeatureKey, SubscriptionTier[]> = {
  // Free tier features (none listed here, all included by default)

  // Premium features
  [FEATURES.UNLIMITED_WORDS]: ['premium', 'ultimate'],
  [FEATURES.ALL_CATEGORIES]: ['premium', 'ultimate'],
  [FEATURES.FULL_LEITNER]: ['premium', 'ultimate'],
  [FEATURES.BOTH_DIRECTIONS]: ['premium', 'ultimate'],
  [FEATURES.CUSTOM_DAILY_GOALS]: ['premium', 'ultimate'],
  [FEATURES.DIFFICULTY_RATING]: ['premium', 'ultimate'],

  [FEATURES.ADVANCED_ANALYTICS]: ['premium', 'ultimate'],
  [FEATURES.REVIEW_HISTORY]: ['premium', 'ultimate'],
  [FEATURES.LEARNING_VELOCITY]: ['premium', 'ultimate'],
  [FEATURES.RETENTION_ANALYSIS]: ['premium', 'ultimate'],
  [FEATURES.HEATMAP]: ['premium', 'ultimate'],
  [FEATURES.BOX_DISTRIBUTION]: ['premium', 'ultimate'],
  [FEATURES.EXPORT_PROGRESS]: ['premium', 'ultimate'],

  [FEATURES.PREMIUM_ACHIEVEMENTS]: ['premium', 'ultimate'],
  [FEATURES.UNLIMITED_STREAK]: ['premium', 'ultimate'],
  [FEATURES.XP_BOOSTS]: ['premium', 'ultimate'],

  [FEATURES.OFFLINE_MODE]: ['premium', 'ultimate'],
  [FEATURES.NO_ADS]: ['premium', 'ultimate'],
  [FEATURES.ADVANCED_SHORTCUTS]: ['premium', 'ultimate'],

  // Ultimate-only features
  [FEATURES.CUSTOM_DECKS]: ['ultimate'],
  [FEATURES.DECK_IMPORT_EXPORT]: ['ultimate'],
  [FEATURES.AI_CONTEXT]: ['ultimate'],
  [FEATURES.AI_MNEMONICS]: ['ultimate'],
  [FEATURES.AI_PRONUNCIATION]: ['ultimate'],
  [FEATURES.MULTI_LANGUAGE]: ['ultimate'],
  [FEATURES.COLLABORATION]: ['ultimate'],
}

// Tier Limits
export const TIER_LIMITS = {
  free: {
    wordsPerMonth: 50,
    maxCategories: 3,
    maxDailyGoal: 10,
    maxMasteryLevel: 3,
    maxStreakDisplay: 7,
    learningDirections: 1,
  },
  premium: {
    wordsPerMonth: -1, // unlimited
    maxCategories: -1, // unlimited
    maxDailyGoal: 100,
    maxMasteryLevel: 5,
    maxStreakDisplay: -1, // unlimited
    learningDirections: 2,
  },
  ultimate: {
    wordsPerMonth: -1,
    maxCategories: -1,
    maxDailyGoal: -1,
    maxMasteryLevel: 5,
    maxStreakDisplay: -1,
    learningDirections: -1,
  },
} as const
```

### Step 2.3: Pricing Constants

**Datei:** `src/constants/pricing.ts`

```typescript
export const PRICING = {
  premium: {
    monthly: {
      EUR: 4.99,
      USD: 5.99,
      RUB: 399,
      INR: 349,
    },
    yearly: {
      EUR: 49.99,
      USD: 59.99,
      RUB: 3999,
      INR: 2999,
    },
  },
  ultimate: {
    monthly: {
      EUR: 9.99,
      USD: 11.99,
      RUB: 799,
      INR: 699,
    },
    yearly: {
      EUR: 99.99,
      USD: 119.99,
      RUB: 7999,
      INR: 5999,
    },
  },
  addons: {
    remove_ads: {
      EUR: 9.99,
      USD: 11.99,
    },
    lifetime_premium: {
      EUR: 199.99,
      USD: 239.99,
    },
  },
  student_discount: 0.3, // 30% off
} as const

export type Currency = 'EUR' | 'USD' | 'RUB' | 'INR'

export function getPrice(
  tier: 'premium' | 'ultimate',
  interval: 'monthly' | 'yearly',
  currency: Currency = 'EUR'
): number {
  return PRICING[tier][interval][currency]
}

export function getYearlySavings(tier: 'premium' | 'ultimate', currency: Currency = 'EUR'): number {
  const monthly = PRICING[tier].monthly[currency]
  const yearly = PRICING[tier].yearly[currency]
  return (monthly * 12) - yearly
}

export function getYearlySavingsPercent(tier: 'premium' | 'ultimate'): number {
  return 17 // 17% savings
}
```

---

## Phase 3: Subscription Service (Woche 2)

### Step 3.1: Subscription Service

**Datei:** `src/services/subscriptionService.ts`

```typescript
import { supabase } from '../lib/supabase'
import { UserSubscription, SubscriptionTier, SubscriptionStatus } from '../types/subscription'
import { FEATURE_MATRIX, TIER_LIMITS, FeatureKey } from '../constants/features'

export class SubscriptionService {
  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching subscription:', error)
      return null
    }

    return data
  }

  /**
   * Get user's effective tier (considers trial status)
   */
  async getUserTier(userId: string): Promise<SubscriptionTier> {
    const subscription = await this.getUserSubscription(userId)

    if (!subscription) {
      // Create default free subscription
      await this.createFreeSubscription(userId)
      return 'free'
    }

    // Check if trial is active
    if (subscription.status === 'trialing' && subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at)
      if (trialEnd > new Date()) {
        return subscription.tier // Trial is active, return trial tier
      }
      // Trial expired, downgrade to free
      await this.expireTrial(userId)
      return 'free'
    }

    // Check subscription status
    if (subscription.status === 'active') {
      return subscription.tier
    }

    // Inactive subscription = free tier
    return 'free'
  }

  /**
   * Check if user has access to a specific feature
   */
  async hasFeatureAccess(userId: string, feature: FeatureKey): Promise<boolean> {
    // Get user's tier
    const tier = await this.getUserTier(userId)

    // Check feature matrix
    const allowedTiers = FEATURE_MATRIX[feature] || []
    const hasAccessByTier = allowedTiers.includes(tier)

    if (hasAccessByTier) return true

    // Check for feature-specific overrides
    const { data } = await supabase
      .from('user_feature_access')
      .select('*')
      .eq('user_id', userId)
      .eq('feature_key', feature)
      .single()

    if (!data) return false

    // Check if override is still valid
    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at)
      if (expiresAt < new Date()) return false
    }

    return data.has_access
  }

  /**
   * Get tier limits for user
   */
  async getTierLimits(userId: string) {
    const tier = await this.getUserTier(userId)
    return TIER_LIMITS[tier]
  }

  /**
   * Check if user can learn more words this month
   */
  async canLearnMoreWords(userId: string): Promise<{
    allowed: boolean
    current: number
    limit: number
    remaining: number
  }> {
    const tier = await this.getUserTier(userId)
    const limits = TIER_LIMITS[tier]

    // Unlimited for premium/ultimate
    if (limits.wordsPerMonth === -1) {
      return {
        allowed: true,
        current: 0,
        limit: -1,
        remaining: -1,
      }
    }

    // Check usage for free tier
    const usage = await this.getCurrentMonthUsage(userId)
    const current = usage.words_learned_this_month
    const limit = limits.wordsPerMonth

    return {
      allowed: current < limit,
      current,
      limit,
      remaining: Math.max(0, limit - current),
    }
  }

  /**
   * Increment word count for current month
   */
  async incrementWordCount(userId: string): Promise<void> {
    const { period_start, period_end } = this.getCurrentPeriod()

    const { error } = await supabase.rpc('increment_word_count', {
      p_user_id: userId,
      p_period_start: period_start,
      p_period_end: period_end,
    })

    if (error) {
      console.error('Error incrementing word count:', error)
    }
  }

  /**
   * Get current month usage
   */
  async getCurrentMonthUsage(userId: string) {
    const { period_start, period_end } = this.getCurrentPeriod()

    let { data, error } = await supabase
      .from('user_usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('period_start', period_start)
      .single()

    // Create if doesn't exist
    if (error || !data) {
      const tier = await this.getUserTier(userId)
      const limits = TIER_LIMITS[tier]

      const { data: newData, error: insertError } = await supabase
        .from('user_usage_tracking')
        .insert({
          user_id: userId,
          period_start,
          period_end,
          words_limit: limits.wordsPerMonth,
          categories_limit: limits.maxCategories,
          words_learned_this_month: 0,
          active_categories: 0,
        })
        .select()
        .single()

      if (insertError) throw insertError
      data = newData
    }

    return data
  }

  /**
   * Start premium trial (7 days)
   */
  async startPremiumTrial(userId: string): Promise<void> {
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 7)

    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        tier: 'premium',
        status: 'trialing',
        trial_ends_at: trialEnd.toISOString(),
      })

    if (error) {
      console.error('Error starting trial:', error)
      throw error
    }
  }

  /**
   * Create free subscription for new user
   */
  async createFreeSubscription(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        tier: 'free',
        status: 'active',
      })

    if (error && error.code !== '23505') { // Ignore duplicate errors
      console.error('Error creating free subscription:', error)
    }
  }

  /**
   * Expire trial and downgrade to free
   */
  async expireTrial(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        tier: 'free',
        status: 'active',
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Error expiring trial:', error)
    }
  }

  /**
   * Helper: Get current billing period
   */
  private getCurrentPeriod() {
    const now = new Date()
    const period_start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const period_end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    return { period_start, period_end }
  }
}

export const subscriptionService = new SubscriptionService()
```

### Step 3.2: Database Function for Word Count

**Datei:** `supabase/migrations/XXX_add_increment_function.sql`

```sql
-- Function to increment word count atomically
CREATE OR REPLACE FUNCTION increment_word_count(
  p_user_id UUID,
  p_period_start DATE,
  p_period_end DATE
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_usage_tracking (
    user_id,
    period_start,
    period_end,
    words_learned_this_month
  )
  VALUES (
    p_user_id,
    p_period_start,
    p_period_end,
    1
  )
  ON CONFLICT (user_id, period_start)
  DO UPDATE SET
    words_learned_this_month = user_usage_tracking.words_learned_this_month + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Phase 4: Subscription Context (Woche 2)

### Step 4.1: Subscription Context

**Datei:** `src/contexts/SubscriptionContext.tsx`

```typescript
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { subscriptionService } from '../services/subscriptionService'
import { SubscriptionTier, UserSubscription } from '../types/subscription'
import { FeatureKey } from '../constants/features'

interface SubscriptionContextValue {
  subscription: UserSubscription | null
  tier: SubscriptionTier
  loading: boolean
  hasFeature: (feature: FeatureKey) => boolean
  canLearnMoreWords: () => Promise<{
    allowed: boolean
    current: number
    limit: number
    remaining: number
  }>
  startPremiumTrial: () => Promise<void>
  refreshSubscription: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined)

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [tier, setTier] = useState<SubscriptionTier>('free')
  const [loading, setLoading] = useState(true)
  const [featureCache, setFeatureCache] = useState<Map<FeatureKey, boolean>>(new Map())

  const loadSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null)
      setTier('free')
      setLoading(false)
      return
    }

    try {
      const [sub, userTier] = await Promise.all([
        subscriptionService.getUserSubscription(user.id),
        subscriptionService.getUserTier(user.id),
      ])

      setSubscription(sub)
      setTier(userTier)
    } catch (error) {
      console.error('Error loading subscription:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadSubscription()
  }, [loadSubscription])

  const hasFeature = useCallback(
    (feature: FeatureKey): boolean => {
      if (!user) return false

      // Check cache first
      if (featureCache.has(feature)) {
        return featureCache.get(feature)!
      }

      // For synchronous check, use tier-based access
      // (Async overrides will be checked separately)
      const FEATURE_MATRIX = require('../constants/features').FEATURE_MATRIX
      const allowedTiers = FEATURE_MATRIX[feature] || []
      const hasAccess = allowedTiers.includes(tier)

      // Cache result
      setFeatureCache(prev => new Map(prev).set(feature, hasAccess))

      return hasAccess
    },
    [user, tier, featureCache]
  )

  const canLearnMoreWords = useCallback(async () => {
    if (!user) {
      return { allowed: false, current: 0, limit: 0, remaining: 0 }
    }
    return subscriptionService.canLearnMoreWords(user.id)
  }, [user])

  const startPremiumTrial = useCallback(async () => {
    if (!user) return
    await subscriptionService.startPremiumTrial(user.id)
    await loadSubscription()
  }, [user, loadSubscription])

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      subscription,
      tier,
      loading,
      hasFeature,
      canLearnMoreWords,
      startPremiumTrial,
      refreshSubscription: loadSubscription,
    }),
    [subscription, tier, loading, hasFeature, canLearnMoreWords, startPremiumTrial, loadSubscription]
  )

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}

export const useSubscription = (): SubscriptionContextValue => {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}
```

### Step 4.2: Add Provider to App

**Datei:** `src/App.tsx`

```typescript
// Add import
import { SubscriptionProvider } from './contexts/SubscriptionContext'

// Wrap app with provider (inside AuthProvider)
<AuthProvider>
  <SubscriptionProvider>
    {/* Rest of app */}
  </SubscriptionProvider>
</AuthProvider>
```

---

## Phase 5: UI Components (Woche 3)

### Step 5.1: Premium Badge Component

**Datei:** `src/components/PremiumBadge.tsx`

```typescript
import { Crown } from 'lucide-react'

interface PremiumBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export const PremiumBadge = ({ size = 'md', showText = true }: PremiumBadgeProps) => {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold ${sizeClasses[size]}`}
    >
      <Crown size={iconSizes[size]} />
      {showText && 'Premium'}
    </span>
  )
}
```

### Step 5.2: Feature Gate Component

**Datei:** `src/components/FeatureGate.tsx`

```typescript
import { ReactNode } from 'react'
import { useSubscription } from '../contexts/SubscriptionContext'
import { FeatureKey } from '../constants/features'
import { PremiumBadge } from './PremiumBadge'
import { Lock } from 'lucide-react'

interface FeatureGateProps {
  feature: FeatureKey
  children: ReactNode
  fallback?: ReactNode
  showUpgradePrompt?: boolean
  onUpgradeClick?: () => void
}

export const FeatureGate = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  onUpgradeClick,
}: FeatureGateProps) => {
  const { hasFeature } = useSubscription()

  if (hasFeature(feature)) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (showUpgradePrompt) {
    return (
      <div className="relative">
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg">
          <div className="text-center p-6">
            <Lock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <PremiumBadge size="lg" />
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              This feature is available in Premium
            </p>
            {onUpgradeClick && (
              <button
                onClick={onUpgradeClick}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-lg hover:shadow-lg transition"
              >
                Upgrade Now
              </button>
            )}
          </div>
        </div>
        <div className="opacity-30 pointer-events-none">{children}</div>
      </div>
    )
  }

  return null
}
```

### Step 5.3: Usage Indicator Component

**Datei:** `src/components/UsageIndicator.tsx`

```typescript
import { useEffect, useState } from 'react'
import { useSubscription } from '../contexts/SubscriptionContext'

export const UsageIndicator = () => {
  const { tier, canLearnMoreWords } = useSubscription()
  const [usage, setUsage] = useState({ current: 0, limit: 50, remaining: 50 })

  useEffect(() => {
    const loadUsage = async () => {
      const result = await canLearnMoreWords()
      setUsage(result)
    }
    loadUsage()
  }, [canLearnMoreWords])

  // Don't show for premium/ultimate
  if (tier !== 'free') return null

  const percentage = (usage.current / usage.limit) * 100
  const isNearLimit = percentage >= 80

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Monthly Words
        </span>
        <span className="text-sm text-gray-500">
          {usage.current} / {usage.limit}
        </span>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            isNearLimit ? 'bg-red-500' : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {isNearLimit && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-2">
          Only {usage.remaining} words remaining this month!
        </p>
      )}
    </div>
  )
}
```

### Step 5.4: Upgrade Modal Component

**Datei:** `src/components/UpgradeModal.tsx`

```typescript
import { useState } from 'react'
import { X, Check, Crown, Sparkles } from 'lucide-react'
import { useSubscription } from '../contexts/SubscriptionContext'
import { getPrice, getYearlySavingsPercent } from '../constants/pricing'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  reason?: string // Why are we showing this modal?
}

export const UpgradeModal = ({ isOpen, onClose, reason }: UpgradeModalProps) => {
  const { tier } = useSubscription()
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'yearly'>('yearly')

  if (!isOpen) return null

  const premiumPrice = getPrice('premium', selectedInterval)
  const ultimatePrice = getPrice('ultimate', selectedInterval)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Upgrade Your Learning
            </h2>
            {reason && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{reason}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center gap-2 p-4 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={() => setSelectedInterval('monthly')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedInterval === 'monthly'
                ? 'bg-white dark:bg-gray-800 shadow'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedInterval('yearly')}
            className={`px-4 py-2 rounded-lg font-medium transition relative ${
              selectedInterval === 'yearly'
                ? 'bg-white dark:bg-gray-800 shadow'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Yearly
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
              Save {getYearlySavingsPercent('premium')}%
            </span>
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* Premium Card */}
          <div className="border-2 border-yellow-400 rounded-xl p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-900">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="text-yellow-600" size={24} />
              <h3 className="text-xl font-bold">Premium</h3>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold">€{premiumPrice}</span>
              <span className="text-gray-600 dark:text-gray-400">
                /{selectedInterval === 'monthly' ? 'month' : 'year'}
              </span>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <Check className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                <span className="text-sm">Unlimited words</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                <span className="text-sm">All categories</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                <span className="text-sm">Advanced analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                <span className="text-sm">Offline mode</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                <span className="text-sm">No ads</span>
              </li>
            </ul>

            <button className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-lg hover:shadow-lg transition">
              Upgrade to Premium
            </button>
          </div>

          {/* Ultimate Card */}
          <div className="border-2 border-purple-500 rounded-xl p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
              Best Value
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-purple-600" size={24} />
              <h3 className="text-xl font-bold">Ultimate</h3>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold">€{ultimatePrice}</span>
              <span className="text-gray-600 dark:text-gray-400">
                /{selectedInterval === 'monthly' ? 'month' : 'year'}
              </span>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <Check className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                <span className="text-sm">Everything in Premium</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                <span className="text-sm">Custom flashcards</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                <span className="text-sm">AI-powered features</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                <span className="text-sm">Multi-language support</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                <span className="text-sm">Priority support</span>
              </li>
            </ul>

            <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:shadow-lg transition">
              Upgrade to Ultimate
            </button>
          </div>
        </div>

        {/* Trial CTA */}
        {tier === 'free' && (
          <div className="p-6 bg-blue-50 dark:bg-blue-900/20 text-center">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Try Premium free for 7 days. No credit card required.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Phase 6: Stripe Integration (Woche 4)

### Step 6.0: Stripe Account Setup & Dashboard Configuration

**Wichtig**: Für EU-basierte Anwendungen ist Stripe die beste Wahl aufgrund vollständiger SCA (Strong Customer Authentication) Compliance und automatischer Umsatzsteuer-Behandlung.

#### A) Stripe Account erstellen

1. **Registrierung**: https://dashboard.stripe.com/register
   - Email-Adresse bestätigen
   - Business-Typ auswählen: "Individual" oder "Company"
   - Land: Deutschland (oder Ihr Land)

2. **Account aktivieren**:
   - Dashboard: https://dashboard.stripe.com
   - Zunächst im **Test Mode** arbeiten (Toggle oben rechts)
   - Account Details vervollständigen (später für Live Mode erforderlich)

3. **Business Details** (für Live Mode):
   - Firmenname / Geschäftsname
   - Steuernummer / USt-IdNr. (für EU)
   - Geschäftsadresse
   - Bank-Verbindung für Auszahlungen
   - Verifizierung kann 1-3 Tage dauern

#### B) Produkte & Preise erstellen

**Im Stripe Dashboard** → **Products** → **Add product**

##### Premium Tier:

**Product 1: Italian Flashcards Premium**
- Name: `Italian Flashcards Premium`
- Description: `Unlimited learning with advanced features`
- Pricing Model: `Recurring`

**Monatlicher Preis:**
- Price ID: `price_premium_monthly_eur` (wird automatisch generiert)
- Amount: `€4.99`
- Billing Period: `Monthly`
- Currency: `EUR`

**Jährlicher Preis:**
- Price ID: `price_premium_yearly_eur`
- Amount: `€49.99`
- Billing Period: `Yearly`
- Currency: `EUR`

**Zusätzliche Währungen erstellen:**
- USD: $5.99/Monat, $59.99/Jahr
- RUB: ₽399/Monat, ₽3,999/Jahr (falls Russland unterstützt wird)

##### Ultimate Tier:

**Product 2: Italian Flashcards Ultimate**
- Name: `Italian Flashcards Ultimate`
- Description: `Premium + AI features, custom decks, priority support`

**Monatlich:** €9.99
**Jährlich:** €99.99

##### Wichtige Produkt-Einstellungen:

- ✅ **Tax Behavior**: `Exclusive` (Preis + MwSt)
- ✅ **Trial Period**: 7 Tage (bei Premium)
- ✅ **Metered Billing**: Nein
- ✅ **Usage Type**: `Licensed`

#### C) API Keys kopieren

**Test Mode** (für Entwicklung):

Dashboard → **Developers** → **API Keys**

```bash
Publishable key: pk_test_51...
Secret key: sk_test_51...
```

**Live Mode** (nach Launch):
- Toggle auf "Live" umschalten
- Neue Keys werden generiert
- NIE Test- und Live-Keys vermischen!

#### D) Webhook Endpoints einrichten

**Dashboard** → **Developers** → **Webhooks** → **Add endpoint**

**Test Mode Webhook:**
```
URL: https://[your-supabase-project].supabase.co/functions/v1/stripe-webhook
Description: Handle subscription events (Test)
```

**Events to listen for:**
```
✅ checkout.session.completed
✅ customer.subscription.created
✅ customer.subscription.updated
✅ customer.subscription.deleted
✅ invoice.payment_succeeded
✅ invoice.payment_failed
✅ customer.created
✅ customer.updated
```

**Webhook Signing Secret:**
- Nach Erstellung wird `whsec_...` angezeigt
- Kopieren für Environment Variables

**Live Mode Webhook:**
- Gleiche Schritte für Live Mode wiederholen
- Separates `whsec_...` Secret für Production

#### E) Customer Portal konfigurieren

**Dashboard** → **Settings** → **Customer Portal**

**Aktivierte Features:**
- ✅ **Update payment method**
- ✅ **Cancel subscription**
- ✅ **Update subscription** (Upgrade/Downgrade)
- ✅ **View invoice history**

**Cancellation Settings:**
- Retention offers: Optional (z.B. "Pause for 3 months" anbieten)
- Cancellation reasons: Aktivieren (für Feedback)
- Effective date: "At period end" (kein sofortiger Zugriffsverlust)

**Branding:**
- Logo hochladen
- Akzentfarbe: #F59E0B (Orange, passend zur App)
- Privacy Policy URL: `https://yourdomain.com/privacy`
- Terms of Service URL: `https://yourdomain.com/terms`

#### F) Tax & VAT Einstellungen (EU-spezifisch)

**Dashboard** → **Settings** → **Tax Settings**

**Stripe Tax aktivieren:**
- ✅ Automatische Steuerberechnung
- ✅ EU VAT-Compliance (MOSS)
- ✅ Reverse Charge für B2B
- Kostet: 0.5% der Transaktion + Stripe Fees

**Alternative: Manuelle Tax Rates:**
```
Deutschland: 19% MwSt
Österreich: 20% MwSt
Schweiz: 7.7% MwSt
EU (allgemein): 19-27% je nach Land
```

#### G) Email Settings

**Dashboard** → **Settings** → **Emails**

**Aktivierte Emails:**
- ✅ Successful payment
- ✅ Failed payment
- ✅ Upcoming invoice (3 Tage vorher)
- ✅ Subscription cancelled
- ✅ Trial ending (2 Tage vorher)

**Email Branding:**
- App Name: "Italian Flashcards"
- Support Email: `support@yourdomain.com`
- From Name: "Italian Flashcards Team"

#### H) Payment Methods

**Dashboard** → **Settings** → **Payment Methods**

**Aktivierte Zahlungsmethoden:**
- ✅ **Cards** (Visa, Mastercard, Amex)
- ✅ **SEPA Direct Debit** (für EU)
- ✅ **Google Pay** / **Apple Pay**
- Optional: **Klarna**, **PayPal** (höhere Fees)

#### I) Stripe CLI installieren (für lokale Tests)

**macOS / Linux:**
```bash
# Homebrew
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Test webhook lokal
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

**Windows:**
```bash
# Scoop
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

#### J) Test Cards für Development

**Test Mode Karten:**
```
Successful Payment:
  Card: 4242 4242 4242 4242
  CVC: Any 3 digits
  Date: Any future date
  ZIP: Any 5 digits

3D Secure (SCA Test):
  Card: 4000 0027 6000 3184

Declined Payment:
  Card: 4000 0000 0000 0002

Insufficient Funds:
  Card: 4000 0000 0000 9995
```

Mehr Test-Karten: https://stripe.com/docs/testing

#### K) Stripe Price IDs notieren

Nach Produkt-Erstellung, notieren Sie die Price IDs:

**Test Mode:**
```bash
# Premium
PRICE_PREMIUM_MONTHLY_EUR=price_xxxxxxxxxxxxx
PRICE_PREMIUM_YEARLY_EUR=price_xxxxxxxxxxxxx

# Ultimate
PRICE_ULTIMATE_MONTHLY_EUR=price_xxxxxxxxxxxxx
PRICE_ULTIMATE_YEARLY_EUR=price_xxxxxxxxxxxxx
```

Diese IDs werden in Step 6.4 verwendet.

#### L) Wichtige Stripe Dashboard Bereiche

**Übersicht nach Setup:**
- **Home**: Umsatz-Dashboard, Recent Events
- **Payments**: Alle Zahlungen, Refunds
- **Subscriptions**: Aktive Abonnements, Churn
- **Customers**: Kundendatenbank
- **Invoices**: Alle Rechnungen
- **Billing**: Überfällige Zahlungen
- **Reports**: Revenue Reports, MRR, ARR
- **Logs**: Webhook Logs, API Logs

#### M) Stripe Apps (Optional Erweiterungen)

**Nützliche Apps im Stripe App Marketplace:**
- **Klaviyo**: Email Marketing Integration
- **ChartMogul**: Advanced Analytics & MRR Tracking
- **Baremetrics**: Subscription Analytics
- **ProfitWell**: Revenue Recognition

---

### Step 6.1: Install Stripe

```bash
npm install @stripe/stripe-js stripe
```

### Step 6.2: Environment Variables

**Datei:** `.env.local`

```bash
VITE_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 6.3: Stripe Service

**Datei:** `src/services/stripeService.ts`

```typescript
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '../lib/supabase'

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY
const stripePromise = loadStripe(stripePublicKey)

export class StripeService {
  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(
    userId: string,
    tier: 'premium' | 'ultimate',
    interval: 'monthly' | 'yearly'
  ): Promise<string> {
    // Call Supabase Edge Function to create Stripe session
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        userId,
        tier,
        interval,
      },
    })

    if (error) throw error
    return data.sessionId
  }

  /**
   * Redirect to Stripe Checkout
   */
  async redirectToCheckout(sessionId: string): Promise<void> {
    const stripe = await stripePromise
    if (!stripe) throw new Error('Stripe not loaded')

    const { error } = await stripe.redirectToCheckout({ sessionId })
    if (error) throw error
  }

  /**
   * Create customer portal session
   */
  async createPortalSession(userId: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke('create-portal-session', {
      body: { userId },
    })

    if (error) throw error
    return data.url
  }
}

export const stripeService = new StripeService()
```

### Step 6.4: Supabase Edge Function - Checkout

**Datei:** `supabase/functions/create-checkout-session/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const PRICING = {
  premium: {
    monthly: 'price_xxx', // Stripe Price ID
    yearly: 'price_yyy',
  },
  ultimate: {
    monthly: 'price_zzz',
    yearly: 'price_aaa',
  },
}

serve(async (req) => {
  try {
    const { userId, tier, interval } = await req.json()

    const priceId = PRICING[tier][interval]

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/payment/cancelled`,
      client_reference_id: userId,
      metadata: {
        userId,
        tier,
        interval,
      },
    })

    return new Response(JSON.stringify({ sessionId: session.id }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

### Step 6.5: Supabase Edge Function - Webhook

**Datei:** `supabase/functions/stripe-webhook/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature!, webhookSecret)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCancelled(subscription)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const tier = session.metadata?.tier
  const interval = session.metadata?.interval

  if (!userId || !tier) return

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

  await supabase.from('user_subscriptions').upsert({
    user_id: userId,
    tier,
    status: 'active',
    stripe_customer_id: session.customer as string,
    stripe_subscription_id: session.subscription as string,
    billing_interval: interval,
    next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: subscription.status === 'active' ? 'active' : 'past_due',
      next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) console.error('Error updating subscription:', error)
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'past_due',
    })
    .eq('stripe_customer_id', invoice.customer as string)
}
```

### Step 6.6: Customer Portal Edge Function

**Datei:** `supabase/functions/create-portal-session/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  try {
    const { userId } = await req.json()

    // Get user's subscription to find Stripe customer ID
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    if (error || !subscription?.stripe_customer_id) {
      throw new Error('No active subscription found')
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${req.headers.get('origin')}/settings`,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

### Step 6.7: Lokales Testing mit Stripe CLI

#### A) Webhook Testing lokal

**Terminal 1 - Supabase Functions:**
```bash
supabase functions serve stripe-webhook --env-file .env.local
```

**Terminal 2 - Stripe CLI:**
```bash
# Forward Stripe events zu lokalem Endpoint
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Output zeigt Webhook Signing Secret:
# > Ready! Your webhook signing secret is whsec_xxx (^C to quit)
```

**Terminal 3 - Event Trigger:**
```bash
# Test checkout.session.completed
stripe trigger checkout.session.completed

# Test subscription.updated
stripe trigger customer.subscription.updated

# Test payment_failed
stripe trigger invoice.payment_failed
```

#### B) Checkout Flow testen

1. **Frontend starten:**
```bash
npm run dev
```

2. **Upgrade-Flow durchlaufen:**
   - Auf "Upgrade to Premium" klicken
   - Stripe Checkout öffnet sich
   - Test-Karte eingeben: `4242 4242 4242 4242`
   - Zahlung abschließen
   - Redirect zu Success-Seite
   - Webhook wird getriggert
   - Subscription in DB wird erstellt

3. **Logs prüfen:**
```bash
# Stripe Dashboard
https://dashboard.stripe.com/test/logs

# Supabase Logs
https://app.supabase.com/project/[project-id]/logs/edge-functions

# Stripe CLI Output
# Zeigt alle Events in Real-time
```

#### C) SCA (Strong Customer Authentication) testen

**3D Secure Test-Karte:**
```bash
Card: 4000 0027 6000 3184
```

**Flow:**
1. Checkout mit dieser Karte
2. Stripe zeigt 3D Secure Modal
3. Klick auf "Authenticate"
4. Zahlung wird authorisiert
5. Webhook wird getriggert

**Alternative: SCA Required (manuell)**
```bash
Card: 4000 0025 0000 3155
# Erfordert zusätzliche Authentifizierung
```

#### D) Subscription Lifecycle testen

**1. Subscription erstellen:**
```bash
stripe trigger checkout.session.completed
```

**2. Subscription upgraden (Premium → Ultimate):**
```typescript
// In UpgradeModal.tsx beim Upgrade-Button
const handleUpgrade = async () => {
  // Stripe Checkout mit neuem Tier
  const sessionId = await stripeService.createCheckoutSession(
    user.id,
    'ultimate',
    'monthly'
  )
  await stripeService.redirectToCheckout(sessionId)
}
```

**3. Subscription canceln:**
```bash
# Via Customer Portal (automatisch)
# Oder manuell in Stripe Dashboard → Customers → [Customer] → Cancel

# Oder via API:
stripe subscriptions cancel sub_xxxxxx
```

**4. Fehlgeschlagene Zahlung simulieren:**
```bash
stripe trigger invoice.payment_failed

# Oder Test-Karte mit Decline:
# Card: 4000 0000 0000 0002
```

#### E) Webhook Retry Testing

**Webhook Failure simulieren:**
```bash
# In stripe-webhook Edge Function einen Error werfen:
throw new Error('Simulated webhook failure')

# Stripe retried automatisch:
# - Immediately
# - After 1 hour
# - After 6 hours
# - After 24 hours
# - After 3 days
```

**Retry in Stripe Dashboard prüfen:**
```
Dashboard → Developers → Webhooks → [Endpoint] → Recent Events
→ Click auf Event → "Reattempt" Button
```

#### F) Tax Calculation Testing (mit Stripe Tax)

**EU Customer testen:**
```typescript
// In create-checkout-session Edge Function:
const session = await stripe.checkout.sessions.create({
  // ... existing config
  automatic_tax: {
    enabled: true,
  },
  customer_details: {
    tax_exempt: 'none',
  },
  // Stripe berechnet automatisch VAT basierend auf Kunden-Location
})
```

**Test-Szenarien:**
- DE Customer: 19% MwSt
- AT Customer: 20% MwSt
- US Customer: 0% (no VAT)
- CH Customer: 7.7% MwSt (außerhalb EU)

#### G) Refund Testing

**Stripe Dashboard:**
```
Payments → [Payment] → Refund
```

**Oder via CLI:**
```bash
stripe refunds create --charge=ch_xxxxx --amount=499
```

**Webhook Event:**
```
charge.refunded
```

### Step 6.8: Environment Variables Setup

#### Lokale Development (.env.local)

```bash
# Stripe Test Mode
VITE_STRIPE_PUBLIC_KEY=pk_test_51xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Price IDs (aus Stripe Dashboard kopiert)
PRICE_PREMIUM_MONTHLY_EUR=price_xxxxxxxxxxxxx
PRICE_PREMIUM_YEARLY_EUR=price_xxxxxxxxxxxxx
PRICE_ULTIMATE_MONTHLY_EUR=price_xxxxxxxxxxxxx
PRICE_ULTIMATE_YEARLY_EUR=price_xxxxxxxxxxxxx
```

#### Vercel Environment Variables (Production)

**Vercel Dashboard** → **Settings** → **Environment Variables**

**Production Secrets:**
```bash
# Stripe Live Mode
VITE_STRIPE_PUBLIC_KEY=pk_live_51xxxxxxxxxxxxx  # Visible to frontend
STRIPE_SECRET_KEY=sk_live_51xxxxxxxxxxxxx       # Secret, server-only
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx       # Secret, server-only

# Live Price IDs
PRICE_PREMIUM_MONTHLY_EUR=price_xxxxxxxxxxxxx
PRICE_PREMIUM_YEARLY_EUR=price_xxxxxxxxxxxxx
PRICE_ULTIMATE_MONTHLY_EUR=price_xxxxxxxxxxxxx
PRICE_ULTIMATE_YEARLY_EUR=price_xxxxxxxxxxxxx
```

**Preview Environment (optional):**
- Separate Test Mode Keys für Preview Deployments
- Nützlich für PR Testing

#### Supabase Environment Variables

**Supabase Dashboard** → **Edge Functions** → **Settings**

**Secrets hinzufügen:**
```bash
# Via Supabase CLI
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx

# Price IDs
supabase secrets set PRICE_PREMIUM_MONTHLY_EUR=price_xxx
supabase secrets set PRICE_PREMIUM_YEARLY_EUR=price_xxx
supabase secrets set PRICE_ULTIMATE_MONTHLY_EUR=price_xxx
supabase secrets set PRICE_ULTIMATE_YEARLY_EUR=price_xxx
```

**Secrets in Edge Function verwenden:**
```typescript
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
const priceId = Deno.env.get('PRICE_PREMIUM_MONTHLY_EUR')
```

### Step 6.9: Stripe Webhook Security Best Practices

#### A) Webhook Signature Verification

**Bereits implementiert in Step 6.5:**
```typescript
const signature = req.headers.get('stripe-signature')
const event = stripe.webhooks.constructEvent(body, signature!, webhookSecret)
```

**Warum wichtig:**
- Verifiziert dass Event wirklich von Stripe kommt
- Verhindert Replay-Attacken
- Schützt vor gefälschten Webhooks

#### B) Idempotency

**Events können mehrfach gesendet werden:**
```typescript
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Upsert statt Insert → Idempotent
  await supabase.from('user_subscriptions').upsert({
    user_id: userId,
    // ... data
  })
}
```

**Event ID tracking (optional):**
```typescript
// Events table zum Tracking
CREATE TABLE stripe_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ DEFAULT NOW()
)

// Check vor Verarbeitung
const { data } = await supabase
  .from('stripe_events')
  .select()
  .eq('event_id', event.id)
  .single()

if (data) {
  // Event bereits verarbeitet, skip
  return
}
```

#### C) Webhook Response Time

**Best Practice: <15 Sekunden**
```typescript
serve(async (req) => {
  try {
    const event = stripe.webhooks.constructEvent(...)

    // Schnelle Antwort zurück
    const response = new Response(JSON.stringify({ received: true }))

    // Async processing (nicht auf Ergebnis warten)
    processEventAsync(event)

    return response
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    })
  }
})
```

#### D) Error Handling & Monitoring

**Sentry Integration (optional):**
```typescript
import * as Sentry from 'https://esm.sh/@sentry/deno'

Sentry.init({
  dsn: Deno.env.get('SENTRY_DSN'),
})

try {
  await handleCheckoutCompleted(session)
} catch (error) {
  Sentry.captureException(error)
  throw error
}
```

### Step 6.10: Stripe Compliance & Legal (EU/Deutschland)

#### A) Pflichtangaben im Checkout

**Bereits in Customer Portal konfiguriert:**
- ✅ Impressum Link
- ✅ Datenschutzerklärung Link
- ✅ AGB Link
- ✅ Widerrufsbelehrung (14 Tage für digitale Güter)

#### B) Rechnungsstellung

**Stripe generiert automatisch Invoices:**
- PDF Download verfügbar
- Enthält MwSt-Ausweis
- Fortlaufende Rechnungsnummer
- Firmenname/Adresse des Merchants

**Anpassung:**
```
Dashboard → Settings → Business Settings
→ Business Information
  - Legal Business Name
  - Address
  - Tax ID (USt-IdNr)
```

#### C) DSGVO Compliance

**Kundendaten in Stripe:**
- Name, Email, Zahlungsinformationen
- Speicherung in EU (Stripe EU)
- DPA (Data Processing Agreement) verfügbar

**In Privacy Policy erwähnen:**
```
"Wir nutzen Stripe für Zahlungsabwicklung.
Stripe verarbeitet Ihre Zahlungsdaten gemäß
EU-DSGVO. Weitere Infos: https://stripe.com/privacy"
```

**Data Retention:**
- Stripe speichert Daten für 7 Jahre (gesetzliche Aufbewahrungspflicht)
- Customer deletion möglich nach Retention Period

#### D) SCA Compliance

**Strong Customer Authentication (PSD2):**
- Stripe handhabt automatisch
- 3D Secure für EU-Karten
- Exemptions für kleine Beträge (<30€)
- Saved cards mit CVC-Re-entry

**Bereits implementiert via:**
```typescript
payment_method_types: ['card']
// Stripe fügt automatisch 3D Secure hinzu wenn benötigt
```

---

## Phase 7: Feature Integration (Woche 5)

### Step 7.1: Gate Advanced Analytics

**Datei:** `src/pages/Dashboard.tsx`

```typescript
import { FeatureGate } from '../components/FeatureGate'
import { FEATURES } from '../constants/features'

// Wrap analytics components
<FeatureGate feature={FEATURES.LEARNING_VELOCITY}>
  <LearningVelocityChart />
</FeatureGate>

<FeatureGate feature={FEATURES.HEATMAP}>
  <ReviewHeatmap />
</FeatureGate>

<FeatureGate feature={FEATURES.BOX_DISTRIBUTION}>
  <BoxDistributionChart />
</FeatureGate>
```

### Step 7.2: Enforce Word Limit

**Datei:** `src/hooks/useProgress.tsx`

```typescript
import { useSubscription } from '../contexts/SubscriptionContext'
import { subscriptionService } from '../services/subscriptionService'

// In updateProgress function:
const updateProgress = async (wordId: number, correct: boolean) => {
  if (!user) return

  // Check if user can learn more words
  const { allowed } = await subscriptionService.canLearnMoreWords(user.id)

  if (!allowed) {
    // Show upgrade modal
    setShowUpgradeModal(true)
    return
  }

  // Increment word count
  await subscriptionService.incrementWordCount(user.id)

  // Continue with normal flow...
}
```

### Step 7.3: Add Ads for Free Tier

**Datei:** `src/components/AdBanner.tsx`

```typescript
import { useSubscription } from '../contexts/SubscriptionContext'
import { FEATURES } from '../constants/features'

export const AdBanner = () => {
  const { hasFeature } = useSubscription()

  // Don't show ads for premium users
  if (hasFeature(FEATURES.NO_ADS)) return null

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center border border-gray-300 dark:border-gray-700">
      <p className="text-xs text-gray-500 mb-2">Advertisement</p>
      {/* Add your ad provider code here (Google AdSense, etc.) */}
      <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
        <span className="text-sm text-gray-500">Ad Placeholder</span>
      </div>
      <button className="mt-2 text-xs text-blue-600 hover:underline">
        Remove ads with Premium
      </button>
    </div>
  )
}
```

**Insert ads in FlashCard component:**

```typescript
// Show ad every 10 cards for free users
{cardCount > 0 && cardCount % 10 === 0 && <AdBanner />}
```

---

## Phase 8: Trial & Onboarding (Woche 6)

### Step 8.1: Auto-Start Trial After Signup

**Datei:** `src/pages/Login.tsx`

```typescript
import { useSubscription } from '../contexts/SubscriptionContext'

// After successful signup:
const handleSignup = async (email: string, password: string) => {
  await signUp(email, password)

  // Start 7-day premium trial
  await startPremiumTrial()

  // Show welcome message
  setShowWelcomeModal(true)
}
```

### Step 8.2: Welcome Modal with Trial Info

**Datei:** `src/components/WelcomeModal.tsx`

```typescript
export const WelcomeModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Welcome! 🎉</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Your 7-day Premium trial has started! You now have access to:
        </p>
        <ul className="space-y-2 mb-6">
          <li className="flex items-center gap-2">
            <Check className="text-green-600" size={18} />
            <span>Unlimited words</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="text-green-600" size={18} />
            <span>All categories</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="text-green-600" size={18} />
            <span>Advanced analytics</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="text-green-600" size={18} />
            <span>No ads</span>
          </li>
        </ul>
        <button
          onClick={onClose}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
        >
          Start Learning!
        </button>
      </div>
    </div>
  )
}
```

### Step 8.3: Trial Expiry Reminders

**Setup email reminders (Day 5 and Day 7) via Supabase Edge Function with cron job**

---

## Phase 9: Settings & Subscription Management (Woche 6)

### Step 9.1: Subscription Settings Page

**Datei:** `src/pages/Settings.tsx`

```typescript
import { useSubscription } from '../contexts/SubscriptionContext'
import { stripeService } from '../services/stripeService'
import { PremiumBadge } from '../components/PremiumBadge'
import { UsageIndicator } from '../components/UsageIndicator'

export const SettingsPage = () => {
  const { subscription, tier } = useSubscription()

  const handleManageSubscription = async () => {
    const url = await stripeService.createPortalSession(subscription!.user_id)
    window.location.href = url
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Subscription Settings</h1>

      {/* Current Plan */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Current Plan</h2>
          {tier !== 'free' && <PremiumBadge />}
        </div>

        <p className="text-3xl font-bold capitalize mb-2">{tier}</p>

        {subscription?.next_billing_date && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Next billing: {new Date(subscription.next_billing_date).toLocaleDateString()}
          </p>
        )}

        {tier !== 'free' && (
          <button
            onClick={handleManageSubscription}
            className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Manage Subscription
          </button>
        )}

        {tier === 'free' && (
          <button className="mt-4 px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-lg">
            Upgrade to Premium
          </button>
        )}
      </div>

      {/* Usage */}
      {tier === 'free' && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Usage This Month</h2>
          <UsageIndicator />
        </div>
      )}

      {/* Features */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
        <h2 className="text-lg font-semibold mb-4">Your Features</h2>
        <ul className="space-y-2">
          {tier === 'free' && (
            <>
              <li className="text-sm">✓ 50 words per month</li>
              <li className="text-sm">✓ 3 categories</li>
              <li className="text-sm">✓ Basic analytics</li>
            </>
          )}
          {tier === 'premium' && (
            <>
              <li className="text-sm">✓ Unlimited words</li>
              <li className="text-sm">✓ All categories</li>
              <li className="text-sm">✓ Advanced analytics</li>
              <li className="text-sm">✓ Offline mode</li>
              <li className="text-sm">✓ No ads</li>
            </>
          )}
          {tier === 'ultimate' && (
            <>
              <li className="text-sm">✓ Everything in Premium</li>
              <li className="text-sm">✓ Custom flashcards</li>
              <li className="text-sm">✓ AI features</li>
              <li className="text-sm">✓ Priority support</li>
            </>
          )}
        </ul>
      </div>
    </div>
  )
}
```

---

## Phase 10: Testing & Launch (Woche 7-8)

### Step 10.1: E2E Tests

**Datei:** `e2e/freemium.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Freemium Flow', () => {
  test('Free user sees word limit', async ({ page }) => {
    // Login as free user
    await page.goto('/login')
    await page.fill('[name="email"]', 'free@test.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')

    // Check usage indicator
    await expect(page.locator('text=Monthly Words')).toBeVisible()
    await expect(page.locator('text=0 / 50')).toBeVisible()
  })

  test('Premium user has unlimited access', async ({ page }) => {
    // Login as premium user
    await page.goto('/login')
    await page.fill('[name="email"]', 'premium@test.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')

    // No usage indicator
    await expect(page.locator('text=Monthly Words')).not.toBeVisible()

    // Advanced analytics visible
    await expect(page.locator('text=Learning Velocity')).toBeVisible()
  })

  test('Upgrade modal shows when limit reached', async ({ page }) => {
    // Simulate reaching limit
    // ... test implementation
  })
})
```

### Step 10.2: Stripe Test Mode

1. Create Stripe account
2. Create products & prices in test mode
3. Update environment variables
4. Test checkout flow end-to-end
5. Test webhook handling

### Step 10.3: Launch Checklist

- [ ] Database migrations applied to production
- [ ] Stripe products created in live mode
- [ ] Environment variables set in Vercel
- [ ] Webhook endpoints configured in Stripe
- [ ] Privacy policy updated with payment info
- [ ] Terms of service created
- [ ] Email templates ready (trial reminders, receipts)
- [ ] Analytics tracking setup (conversion funnels)
- [ ] Customer support email ready
- [ ] Refund policy defined
- [ ] Cancel/downgrade flow tested

---

## Phase 11: Post-Launch (Ongoing)

### Step 11.1: Monitoring

**KPIs to track:**
- Free → Premium conversion rate
- Trial → Paid conversion rate
- Monthly churn rate
- Average revenue per user (ARPU)
- Customer lifetime value (LTV)

**Tools:**
- Stripe Dashboard for revenue
- Google Analytics for user behavior
- Supabase Analytics for feature usage
- Custom admin dashboard

### Step 11.2: A/B Testing

Test variations of:
- Pricing (€4.99 vs €5.99)
- Free tier limits (50 vs 30 words)
- Trial duration (7 vs 14 days)
- Upgrade prompts (timing, messaging)
- Paywall design

### Step 11.3: Feature Rollout

**Q1:**
- ✅ Basic freemium with Premium tier
- ✅ Stripe integration
- ✅ Trial system

**Q2:**
- [ ] Ultimate tier
- [ ] Referral program
- [ ] Family plans

**Q3:**
- [ ] AI features (Ultimate)
- [ ] Custom decks
- [ ] Mobile app monetization

**Q4:**
- [ ] Education licenses
- [ ] Affiliate program
- [ ] Marketplace for decks

---

## Zusammenfassung

### Timeline: 8 Wochen bis MVP Launch

| Woche | Phase | Deliverables |
|-------|-------|-------------|
| 1 | Database + Types | Subscription schema, TypeScript types |
| 2 | Services + Context | Subscription service, React context |
| 3 | UI Components | Feature gates, badges, upgrade modal |
| 4 | Stripe Integration | Checkout, webhooks, payment flow |
| 5 | Feature Gating | Word limits, analytics gating, ads |
| 6 | Trial + Settings | Auto-trial, settings page, portal |
| 7-8 | Testing + Launch | E2E tests, production setup, go-live |

### Geschätzter Aufwand

- **Entwicklung**: 120-160 Stunden
- **Testing**: 20-30 Stunden
- **Setup & Config**: 10-15 Stunden
- **Gesamt**: ~150-200 Stunden (4-5 Wochen Vollzeit)

### Kosten

**Einmalig:**
- Stripe Setup: €0
- Entwicklung: (Eigenleistung)

**Laufend:**
- Stripe Fees: 1.4% + €0.25 pro Transaktion (EU)
- Supabase: ~€25/Monat (bei <100k users)
- Vercel: ~€20/Monat
- Email Service: ~€15/Monat

**Break-Even**: ~13 Premium-Nutzer (€65 MRR)

---

**Viel Erfolg bei der Implementierung! 🚀**
