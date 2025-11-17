# Feature: Erinnerungen für fällige Wörter

## Übersicht
Benachrichtigungen wenn Wörter zur Wiederholung bereit sind, basierend auf dem Leitner-System. Hilft, regelmäßiges Lernen beizubehalten.

## Motivation
- Spaced Repetition funktioniert nur mit regelmäßiger Wiederholung
- User vergessen zu üben
- Rechtzeitige Erinnerungen verbessern Retention
- Optimales Timing basierend auf Leitner-Intervallen
- Verhindert Vergessen durch zu lange Pausen

## Funktionsbeschreibung

### Hauptfunktionen

1. **Fällige Wörter Berechnung**
   - Basierend auf Mastery Level und letzter Übung
   - Leitner Intervalle:
     - Level 0: täglich
     - Level 1: alle 3 Tage
     - Level 2: alle 7 Tage
     - Level 3: alle 14 Tage
     - Level 4: alle 30 Tage
     - Level 5: alle 90 Tage

2. **Dashboard Badge**
   - Zeigt Anzahl fälliger Wörter
   - Prominent auf Dashboard
   - "Jetzt wiederholen" Button
   - Color-coded nach Dringlichkeit

3. **Push/Email Benachrichtigungen**
   - Tägliche Erinnerung (konfigurierbar)
   - "Sie haben X Wörter zu wiederholen"
   - Deep-Link zur App
   - Snooze-Option

4. **Smart Scheduling**
   - Berücksichtigt User-Gewohnheiten
   - Beste Zeit basierend auf Nutzungsdaten
   - Wochenende/Wochentag-Unterscheidung
   - Timezone-aware

### UI/UX Design

```
Dashboard Widget:
┌─────────────────────────────────────┐
│  ⏰ Fällige Wörter                  │
│                                     │
│  ┌───────────────────────────────┐ │
│  │      🔴 42                     │ │
│  │                                │ │
│  │  Wörter warten auf             │ │
│  │  Wiederholung                  │ │
│  │                                │ │
│  │  Breakdown:                    │ │
│  │  🔴 12 überfällig              │ │
│  │  🟡 18 heute fällig            │ │
│  │  🟢 12 bald fällig             │ │
│  │                                │ │
│  │  [ 🎯 Jetzt wiederholen ]      │ │
│  └───────────────────────────────┘ │
│                                     │
│  💡 Beste Zeit: 19:00 Uhr          │
│  (Basierend auf Ihren Gewohnheiten)│
└─────────────────────────────────────┘

Settings:
┌─────────────────────────────────────┐
│  🔔 Erinnerungen                    │
│                                     │
│  ☑ Tägliche Erinnerungen            │
│                                     │
│  Uhrzeit:                           │
│  [ 19:00 ▼ ]                        │
│                                     │
│  Methode:                           │
│  ☑ Push-Benachrichtigung            │
│  ☑ Email                            │
│  ☐ SMS (Premium)                    │
│                                     │
│  Nur erinnern wenn:                 │
│  ☑ Mind. 5 Wörter fällig            │
│  ☑ Nicht am Wochenende              │
│                                     │
│  [ Erinnerung testen ]              │
└─────────────────────────────────────┘

Push Notification:
┌─────────────────────────────────────┐
│  Italian Flashcards                 │
│  ⏰ Zeit zum Lernen!                │
│                                     │
│  Sie haben 42 Wörter zu wiederholen │
│  Tap um fortzufahren →             │
│                                     │
│  [ Jetzt ] [ In 1 Stunde ] [ ✕ ]   │
└─────────────────────────────────────┘
```

### Datenbankschema

```sql
-- Function: Berechne fällige Wörter
CREATE OR REPLACE FUNCTION get_due_words(
  p_user_id UUID,
  p_include_overdue BOOLEAN DEFAULT true
)
RETURNS TABLE (
  word_id INTEGER,
  russian TEXT,
  italian TEXT,
  category TEXT,
  mastery_level INTEGER,
  last_practiced TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  days_overdue INTEGER
) AS $$
DECLARE
  v_intervals INTEGER[] := ARRAY[1, 3, 7, 14, 30, 90]; -- Tage pro Level
BEGIN
  RETURN QUERY
  WITH word_due_dates AS (
    SELECT
      wp.word_id,
      wp.mastery_level,
      wp.last_practiced,
      wp.last_practiced + (v_intervals[wp.mastery_level + 1] || ' days')::INTERVAL as calculated_due_date
    FROM word_progress wp
    WHERE wp.user_id = p_user_id
  )
  SELECT
    w.id,
    w.russian,
    w.italian,
    w.category,
    wdd.mastery_level,
    wdd.last_practiced,
    wdd.calculated_due_date,
    GREATEST(0, EXTRACT(DAY FROM (NOW() - wdd.calculated_due_date))::INTEGER) as days_overdue
  FROM word_due_dates wdd
  JOIN words w ON w.id = wdd.word_id
  WHERE
    wdd.calculated_due_date <= NOW()
    OR (p_include_overdue AND wdd.calculated_due_date < NOW())
  ORDER BY wdd.calculated_due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tabelle für Erinnerungs-Präferenzen
CREATE TABLE user_reminder_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  reminder_time TIME DEFAULT '19:00:00',
  timezone VARCHAR(50) DEFAULT 'UTC',
  min_due_words INTEGER DEFAULT 5, -- Mindestanzahl für Erinnerung
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,
  sms_enabled BOOLEAN DEFAULT false,
  reminder_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 1=Mon, 7=Sun
  last_reminder_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE user_reminder_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reminder settings"
  ON user_reminder_settings
  FOR ALL
  USING (auth.uid() = user_id);

-- Tabelle für Erinnerungs-Historie
CREATE TABLE reminder_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_words_count INTEGER NOT NULL,
  method VARCHAR(20) NOT NULL, -- 'push', 'email', 'sms'
  opened BOOLEAN DEFAULT false,
  opened_at TIMESTAMP WITH TIME ZONE,
  snoozed_until TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_reminder_history_user ON reminder_history(user_id);
CREATE INDEX idx_reminder_history_sent ON reminder_history(sent_at DESC);

-- Function: Sollte Erinnerung gesendet werden?
CREATE OR REPLACE FUNCTION should_send_reminder(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_settings user_reminder_settings;
  v_due_count INTEGER;
  v_today_weekday INTEGER;
BEGIN
  -- Hole Settings
  SELECT * INTO v_settings
  FROM user_reminder_settings
  WHERE user_id = p_user_id;

  -- Nicht aktiviert
  IF NOT v_settings.enabled THEN
    RETURN false;
  END IF;

  -- Heute schon gesendet?
  IF v_settings.last_reminder_sent::DATE = CURRENT_DATE THEN
    RETURN false;
  END IF;

  -- Wochentag prüfen (1=Montag, 7=Sonntag)
  v_today_weekday := EXTRACT(ISODOW FROM CURRENT_DATE);
  IF NOT (v_today_weekday = ANY(v_settings.reminder_days)) THEN
    RETURN false;
  END IF;

  -- Anzahl fälliger Wörter
  SELECT COUNT(*) INTO v_due_count
  FROM get_due_words(p_user_id, true);

  IF v_due_count < v_settings.min_due_words THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### TypeScript Types

```typescript
// src/types/reminders.ts

export interface DueWord {
  word_id: number;
  russian: string;
  italian: string;
  category: string;
  mastery_level: number;
  last_practiced: string;
  due_date: string;
  days_overdue: number;
}

export interface ReminderSettings {
  user_id: string;
  enabled: boolean;
  reminder_time: string; // HH:MM:SS
  timezone: string;
  min_due_words: number;
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  reminder_days: number[]; // 1-7
  last_reminder_sent?: string;
}

export interface DueWordsBreakdown {
  overdue: DueWord[]; // Überfällig
  dueToday: DueWord[]; // Heute fällig
  dueSoon: DueWord[]; // Bald fällig (nächste 2 Tage)
  total: number;
}
```

### Service Layer

```typescript
// src/services/reminderService.ts

import { supabase } from '../lib/supabase';
import type { DueWord, ReminderSettings, DueWordsBreakdown } from '../types/reminders';

export const reminderService = {
  async getDueWords(userId: string, includeOverdue: boolean = true): Promise<DueWord[]> {
    const { data, error } = await supabase.rpc('get_due_words', {
      p_user_id: userId,
      p_include_overdue: includeOverdue
    });

    if (error) throw error;
    return data || [];
  },

  async getDueWordsBreakdown(userId: string): Promise<DueWordsBreakdown> {
    const dueWords = await this.getDueWords(userId, true);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    return {
      overdue: dueWords.filter(w => new Date(w.due_date) < today),
      dueToday: dueWords.filter(w => {
        const due = new Date(w.due_date);
        return due >= today && due < tomorrow;
      }),
      dueSoon: dueWords.filter(w => {
        const due = new Date(w.due_date);
        return due >= tomorrow && due < dayAfterTomorrow;
      }),
      total: dueWords.length
    };
  },

  async getReminderSettings(userId: string): Promise<ReminderSettings | null> {
    const { data, error } = await supabase
      .from('user_reminder_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateReminderSettings(
    userId: string,
    settings: Partial<ReminderSettings>
  ): Promise<ReminderSettings> {
    const { data, error } = await supabase
      .from('user_reminder_settings')
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async shouldSendReminder(userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('should_send_reminder', {
      p_user_id: userId
    });

    if (error) throw error;
    return data || false;
  },

  async sendReminder(
    userId: string,
    method: 'push' | 'email' | 'sms'
  ): Promise<void> {
    const breakdown = await this.getDueWordsBreakdown(userId);

    // Log reminder
    await supabase.from('reminder_history').insert({
      user_id: userId,
      due_words_count: breakdown.total,
      method
    });

    // Send based on method
    switch (method) {
      case 'push':
        await this.sendPushNotification(userId, breakdown.total);
        break;
      case 'email':
        await this.sendEmailReminder(userId, breakdown);
        break;
      case 'sms':
        await this.sendSMSReminder(userId, breakdown.total);
        break;
    }

    // Update last sent
    await supabase
      .from('user_reminder_settings')
      .update({ last_reminder_sent: new Date().toISOString() })
      .eq('user_id', userId);
  },

  async sendPushNotification(userId: string, count: number): Promise<void> {
    // Implementation with push service (e.g., Firebase Cloud Messaging)
    console.log(`Sending push to ${userId}: ${count} words due`);
  },

  async sendEmailReminder(userId: string, breakdown: DueWordsBreakdown): Promise<void> {
    // Implementation with email service (e.g., SendGrid, Supabase)
    console.log(`Sending email to ${userId}: ${breakdown.total} words due`);
  },

  async sendSMSReminder(userId: string, count: number): Promise<void> {
    // Implementation with SMS service (e.g., Twilio)
    console.log(`Sending SMS to ${userId}: ${count} words due`);
  }
};
```

### React Component

```typescript
// src/components/DueWordsWidget.tsx

import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { reminderService } from '../services/reminderService';
import type { DueWordsBreakdown } from '../types/reminders';

export const DueWordsWidget: React.FC = () => {
  const [breakdown, setBreakdown] = useState<DueWordsBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDueWords();
  }, []);

  const loadDueWords = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const data = await reminderService.getDueWordsBreakdown(user.id);
      setBreakdown(data);
    } catch (error) {
      console.error('Error loading due words:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePractice = () => {
    // Navigate to practice with due words
    window.location.href = '/practice?filter=due';
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200 animate-pulse">
        <div className="h-32 bg-gray-100 rounded"></div>
      </div>
    );
  }

  if (!breakdown || breakdown.total === 0) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-800">Alles aktuell!</h3>
            <p className="text-sm text-green-700">
              Keine Wörter zur Wiederholung fällig. Gut gemacht! 🎉
            </p>
          </div>
        </div>
      </div>
    );
  }

  const urgencyColor =
    breakdown.overdue.length > 10 ? 'red' :
    breakdown.overdue.length > 0 ? 'yellow' :
    'blue';

  const colorClasses = {
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      badge: 'bg-red-500'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      badge: 'bg-yellow-500'
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      badge: 'bg-blue-500'
    }
  };

  const colors = colorClasses[urgencyColor];

  return (
    <div className={`p-6 ${colors.bg} border ${colors.border} rounded-lg`}>
      <div className="flex items-center gap-3 mb-4">
        <Clock className={`w-6 h-6 ${colors.text}`} />
        <h3 className={`text-lg font-bold ${colors.text}`}>Fällige Wörter</h3>
      </div>

      <div className="text-center mb-4">
        <div className={`inline-flex items-center justify-center w-20 h-20 ${colors.badge} text-white rounded-full text-3xl font-bold mb-2`}>
          {breakdown.total}
        </div>
        <p className={`text-sm ${colors.text}`}>
          Wörter warten auf Wiederholung
        </p>
      </div>

      <div className="space-y-2 mb-4">
        {breakdown.overdue.length > 0 && (
          <div className="flex items-center justify-between text-sm bg-white rounded p-2">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              Überfällig
            </span>
            <span className="font-semibold">{breakdown.overdue.length}</span>
          </div>
        )}
        {breakdown.dueToday.length > 0 && (
          <div className="flex items-center justify-between text-sm bg-white rounded p-2">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              Heute fällig
            </span>
            <span className="font-semibold">{breakdown.dueToday.length}</span>
          </div>
        )}
        {breakdown.dueSoon.length > 0 && (
          <div className="flex items-center justify-between text-sm bg-white rounded p-2">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              Bald fällig
            </span>
            <span className="font-semibold">{breakdown.dueSoon.length}</span>
          </div>
        )}
      </div>

      <button
        onClick={handlePractice}
        className={`w-full py-3 ${colors.badge} text-white font-semibold rounded-lg hover:opacity-90 transition-opacity`}
      >
        🎯 Jetzt wiederholen
      </button>

      {breakdown.overdue.length > 5 && (
        <div className="mt-3 p-2 bg-white rounded border border-red-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">
              Sie haben {breakdown.overdue.length} überfällige Wörter. Regelmäßige Wiederholung verbessert Ihre Retention!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
```

## User Stories

1. **Als vergesslicher Lerner** möchte ich erinnert werden, wenn Wörter zur Wiederholung bereit sind.

2. **Als vielbeschäftigter User** möchte ich die beste Zeit für Erinnerungen selbst festlegen.

3. **Als motivierter Lerner** möchte ich sehen, wie viele Wörter überfällig sind, um mich zu motivieren.

4. **Als Streak-Enthusiast** möchte ich täglich erinnert werden, um meinen Streak beizubehalten.

## Akzeptanzkriterien

- [ ] Fällige Wörter werden korrekt berechnet basierend auf Leitner-Intervallen
- [ ] Dashboard Widget zeigt Breakdown (überfällig, heute, bald)
- [ ] Push/Email-Benachrichtigungen konfigurierbar
- [ ] Erinnerungs-Zeit einstellbar
- [ ] Wochentage auswählbar
- [ ] Mindestanzahl fälliger Wörter konfigurierbar
- [ ] "Jetzt wiederholen" startet Session mit fälligen Wörtern
- [ ] Keine doppelten Erinnerungen am selben Tag

## Priorität
**Hoch** ⭐⭐⭐

## Aufwand
- **Backend (Datenbank + Logic)**: 3 Tage
- **Frontend (Widget + Settings)**: 2 Tage
- **Push Notifications Setup**: 3 Tage
- **Email Integration**: 2 Tage
- **Testing & Cron Jobs**: 2 Tage
- **Gesamt**: 10-12 Tage

## Abhängigkeiten
- Push Notification Service (Firebase, OneSignal, etc.)
- Email Service (SendGrid, Supabase, etc.)
- Cron Job / Scheduled Function für tägliche Erinnerungen

## Risiken
- Push Notifications erfordern User-Permission
- Email könnte als Spam markiert werden
- Timezone-Handling komplex
- Cron Jobs müssen zuverlässig laufen

## Nächste Schritte
1. Datenbank-Migration
2. Service Layer mit Due Words Logic
3. Dashboard Widget
4. Settings Page
5. Push Notification Setup (z.B. Firebase)
6. Email Template erstellen
7. Cron Job für tägliche Erinnerungen
8. Testing mit verschiedenen Timezones
9. User-Testing
