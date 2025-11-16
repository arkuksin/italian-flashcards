# Feature: Wort des Tages

## Übersicht
Jeden Tag ein spezielles Wort hervorheben mit tieferer Erklärung, Beispielen und Kontext. Motiviert zum täglichen Lernen.

## Motivation
- Tägliche Routine fördert Konsistenz
- Spezielle Aufmerksamkeit für ein Wort verbessert Lernen
- Schafft Vorfreude und Engagement
- Kombiniert gut mit Daily Streak Feature
- Niedrige Schwelle für tägliches Lernen

## Funktionsbeschreibung

### Hauptfunktionen

1. **Tägliches Wort**
   - Jeden Tag ein neues Wort
   - Automatische Auswahl basierend auf:
     - User-Level
     - Noch nicht gelernte Wörter
     - Saisonale/thematische Relevanz
     - Häufigkeit der Verwendung

2. **Erweiterte Information**
   - Ausführliche Beschreibung
   - 2-3 Beispielsätze
   - Etymologie (optional)
   - Audio-Aussprache
   - Verwandte Wörter
   - Bild (falls verfügbar)

3. **Daily Widget auf Dashboard**
   - Prominent platziert
   - "Heute lernen" Call-to-Action
   - Zeigt ob bereits gelernt
   - Historie der letzten Tage

4. **Push-Benachrichtigung** (optional)
   - Tägliche Erinnerung
   - Zeigt das Wort an
   - Deep-Link zur App

### UI/UX Design

```
Dashboard Widget:
┌─────────────────────────────────────┐
│  ⭐ Wort des Tages                  │
│     11. November 2025               │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  🇷🇺 солнце (solntse)         │ │
│  │  🇮🇹 sole                      │ │
│  │                                │ │
│  │  ☀️ [Natur]                   │ │
│  │                                │ │
│  │  "Die Sonne" - Ein wichtiges  │ │
│  │  Wort für Wetter und Natur.   │ │
│  │                                │ │
│  │  [ Jetzt lernen → ]            │ │
│  └───────────────────────────────┘ │
│                                     │
│  📅 Letzte 7 Tage: ✅✅❌✅✅✅✅     │
└─────────────────────────────────────┘

Detail-Seite:
┌─────────────────────────────────────┐
│  ← Zurück                           │
│                                     │
│  ⭐ Wort des Tages                  │
│  Samstag, 11. November 2025         │
│                                     │
│  ┌───────────────────────────────┐ │
│  │     ☀️                         │ │
│  │                                │ │
│  │  солнце (solntse)              │ │
│  │  [sol-nt͡sɛ] 🔊                 │ │
│  │                                │ │
│  │  sole                          │ │
│  │  [so-le] 🔊                    │ │
│  │                                │ │
│  │  Kategorie: Natur              │ │
│  │  Wortart: Substantiv (sächlich)│ │
│  └───────────────────────────────┘ │
│                                     │
│  📖 Beschreibung                    │
│  Die Sonne - unser Stern und       │
│  Lichtquelle. Ein fundamentales    │
│  Wort für Wetter-Gespräche.        │
│                                     │
│  💡 Beispiele:                      │
│  1. Солнце светит ярко.            │
│     Il sole splende luminoso.      │
│     (Die Sonne scheint hell.)      │
│                                     │
│  2. Утром встаёт солнце.           │
│     Al mattino sorge il sole.      │
│     (Morgens geht die Sonne auf.)  │
│                                     │
│  🔗 Verwandte Wörter:               │
│  • солнечный (sonnig)              │
│  • подсолнух (Sonnenblume)         │
│                                     │
│  [ ✅ Als gelernt markieren ]       │
│  [ 📝 Notiz hinzufügen ]            │
│  [ 🎯 Jetzt üben ]                  │
└─────────────────────────────────────┘
```

### Datenbankschema

```sql
-- Tabelle für Wort des Tages
CREATE TABLE word_of_the_day (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
  date DATE NOT NULL UNIQUE,
  description TEXT NOT NULL,
  fun_fact TEXT, -- Interessante Zusatzinfo
  difficulty_level INTEGER DEFAULT 2, -- 1-5, für Level-Matching
  is_seasonal BOOLEAN DEFAULT false, -- Saisonale Relevanz
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_wotd_date ON word_of_the_day(date DESC);
CREATE INDEX idx_wotd_level ON word_of_the_day(difficulty_level);

-- User Tracking: Hat User das WotD gesehen/gelernt?
CREATE TABLE user_wotd_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wotd_id UUID REFERENCES word_of_the_day(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE, -- Wenn User das Wort geübt hat

  UNIQUE(user_id, wotd_id)
);

-- Index
CREATE INDEX idx_user_wotd_user ON user_wotd_progress(user_id);
CREATE INDEX idx_user_wotd_completed ON user_wotd_progress(completed_at);

-- RLS
ALTER TABLE user_wotd_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own WotD progress"
  ON user_wotd_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own WotD progress"
  ON user_wotd_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WotD progress"
  ON user_wotd_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Function: Hole WotD für ein bestimmtes Datum
CREATE OR REPLACE FUNCTION get_word_of_the_day(p_date DATE)
RETURNS TABLE (
  id UUID,
  word_id INTEGER,
  russian TEXT,
  italian TEXT,
  category TEXT,
  description TEXT,
  fun_fact TEXT,
  difficulty_level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wotd.id,
    wotd.word_id,
    w.russian,
    w.italian,
    w.category,
    wotd.description,
    wotd.fun_fact,
    wotd.difficulty_level
  FROM word_of_the_day wotd
  JOIN words w ON w.id = wotd.word_id
  WHERE wotd.date = p_date;
END;
$$ LANGUAGE plpgsql;

-- Function: Generiere WotD für nächsten Tag (automatisch)
CREATE OR REPLACE FUNCTION generate_next_word_of_the_day()
RETURNS UUID AS $$
DECLARE
  v_next_date DATE;
  v_word_id INTEGER;
  v_wotd_id UUID;
BEGIN
  -- Finde nächstes Datum ohne WotD
  SELECT COALESCE(MAX(date), CURRENT_DATE) + INTERVAL '1 day'
  INTO v_next_date
  FROM word_of_the_day;

  -- Wähle ein Wort das noch nicht WotD war
  SELECT w.id INTO v_word_id
  FROM words w
  WHERE w.id NOT IN (SELECT word_id FROM word_of_the_day)
  ORDER BY RANDOM()
  LIMIT 1;

  IF v_word_id IS NULL THEN
    RAISE EXCEPTION 'No more words available for Word of the Day';
  END IF;

  -- Erstelle WotD Eintrag
  INSERT INTO word_of_the_day (word_id, date, description, difficulty_level)
  VALUES (
    v_word_id,
    v_next_date,
    'Ein wichtiges Wort für Ihren täglichen Wortschatz.',
    2
  )
  RETURNING id INTO v_wotd_id;

  RETURN v_wotd_id;
END;
$$ LANGUAGE plpgsql;
```

### Service Layer

```typescript
// src/services/wordOfTheDayService.ts

import { supabase } from '../lib/supabase';

interface WordOfTheDay {
  id: string;
  word_id: number;
  russian: string;
  italian: string;
  category: string;
  description: string;
  fun_fact?: string;
  difficulty_level: number;
  date: string;
}

interface WotDProgress {
  viewed_at: string;
  completed_at?: string;
}

export const wordOfTheDayService = {
  async getTodaysWord(): Promise<WordOfTheDay | null> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase.rpc('get_word_of_the_day', {
      p_date: today
    });

    if (error) throw error;
    return data?.[0] || null;
  },

  async getWordForDate(date: string): Promise<WordOfTheDay | null> {
    const { data, error } = await supabase.rpc('get_word_of_the_day', {
      p_date: date
    });

    if (error) throw error;
    return data?.[0] || null;
  },

  async getUserProgress(wotdId: string): Promise<WotDProgress | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_wotd_progress')
      .select('viewed_at, completed_at')
      .eq('user_id', user.id)
      .eq('wotd_id', wotdId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async markAsViewed(wotdId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_wotd_progress')
      .upsert({
        user_id: user.id,
        wotd_id: wotdId,
        viewed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,wotd_id'
      });

    if (error) throw error;
  },

  async markAsCompleted(wotdId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_wotd_progress')
      .upsert({
        user_id: user.id,
        wotd_id: wotdId,
        viewed_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,wotd_id'
      });

    if (error) throw error;
  },

  async getLast7Days(): Promise<{ date: string; completed: boolean }[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const { data: wotds } = await supabase
      .from('word_of_the_day')
      .select('id, date')
      .in('date', last7Days);

    const { data: progress } = await supabase
      .from('user_wotd_progress')
      .select('wotd_id, completed_at')
      .eq('user_id', user.id)
      .in('wotd_id', wotds?.map(w => w.id) || []);

    return last7Days.map(date => ({
      date,
      completed: progress?.some(p =>
        wotds?.find(w => w.id === p.wotd_id)?.date === date && p.completed_at
      ) || false
    }));
  },

  async generateNextWord(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_next_word_of_the_day');
    if (error) throw error;
    return data;
  }
};
```

### React Component

```typescript
// src/components/WordOfTheDay.tsx

import React, { useState, useEffect } from 'react';
import { Star, ChevronRight, Check } from 'lucide-react';
import { wordOfTheDayService } from '../services/wordOfTheDayService';
import type { WordOfTheDay as WotDType } from '../services/wordOfTheDayService';

export const WordOfTheDayWidget: React.FC = () => {
  const [wotd, setWotd] = useState<WotDType | null>(null);
  const [completed, setCompleted] = useState(false);
  const [last7Days, setLast7Days] = useState<{ date: string; completed: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWotd();
  }, []);

  const loadWotd = async () => {
    try {
      const word = await wordOfTheDayService.getTodaysWord();
      setWotd(word);

      if (word) {
        const progress = await wordOfTheDayService.getUserProgress(word.id);
        setCompleted(!!progress?.completed_at);

        // Mark as viewed
        await wordOfTheDayService.markAsViewed(word.id);
      }

      const history = await wordOfTheDayService.getLast7Days();
      setLast7Days(history);
    } catch (error) {
      console.error('Error loading WotD:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLearn = () => {
    // Navigate to WotD detail page or start learning
    window.location.href = `/word-of-the-day/${wotd?.id}`;
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200 animate-pulse">
        <div className="h-40 bg-gray-100 rounded"></div>
      </div>
    );
  }

  if (!wotd) {
    return null;
  }

  return (
    <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
        <h3 className="text-lg font-bold text-gray-800">Wort des Tages</h3>
      </div>

      <div className="text-xs text-gray-600 mb-3">
        {new Date().toLocaleDateString('de-DE', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </div>

      <div className="bg-white rounded-lg p-4 mb-4 border border-yellow-200">
        <div className="text-center space-y-2">
          <div>
            <span className="mr-2">🇷🇺</span>
            <span className="text-2xl font-bold text-gray-800">{wotd.russian}</span>
          </div>
          <div>
            <span className="mr-2">🇮🇹</span>
            <span className="text-xl text-gray-700">{wotd.italian}</span>
          </div>
          <div className="text-sm text-gray-600 bg-gray-100 inline-block px-3 py-1 rounded-full">
            {wotd.category}
          </div>
        </div>

        <p className="text-sm text-gray-700 mt-3 text-center">
          {wotd.description}
        </p>

        {completed ? (
          <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
            <Check className="w-5 h-5" />
            <span className="text-sm font-medium">Heute gelernt! ✅</span>
          </div>
        ) : (
          <button
            onClick={handleLearn}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors"
          >
            Jetzt lernen
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* History */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">Letzte 7 Tage:</span>
        <div className="flex gap-1">
          {last7Days.map((day, i) => (
            <div
              key={day.date}
              className={`w-6 h-6 rounded flex items-center justify-center ${
                day.completed
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
              title={day.date}
            >
              {day.completed ? '✓' : '○'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

## User Stories

1. **Als Lerner** möchte ich jeden Tag ein neues Wort lernen, um eine tägliche Routine zu entwickeln.

2. **Als User** möchte ich interessante Details zum Wort erfahren, nicht nur die Übersetzung.

3. **Als motivierter Lerner** möchte ich meine WotD-Streak sehen, um mich zu motivieren.

4. **Als beschäftigter User** möchte ich eine niederschwellige Option haben, täglich etwas zu lernen.

## Akzeptanzkriterien

- [ ] Jeden Tag ein neues Wort
- [ ] Widget auf Dashboard prominent angezeigt
- [ ] Erweiterte Informationen zum Wort
- [ ] "Als gelernt markieren" Funktion
- [ ] Historie der letzten 7 Tage
- [ ] Push-Benachrichtigung (optional)
- [ ] Detail-Seite mit allen Infos
- [ ] Responsive Design

## Priorität
**Mittel** ⭐⭐

## Aufwand
- **Backend (Datenbank + Automation)**: 2 Tage
- **Frontend (Widget + Detail-Seite)**: 3 Tage
- **Content (Beschreibungen schreiben)**: 5-10 Tage
- **Push Notifications**: 2 Tage (optional)
- **Gesamt**: 7 Tage Development + Content

## Abhängigkeiten
- Content muss erstellt werden (Beschreibungen, Fun Facts)
- Optional: Push Notification System

## Risiken
- Content-Qualität kritisch
- Tägliche Automation muss zuverlässig sein
- User könnten Feature ignorieren

## Nächste Schritte
1. Datenbank-Migration
2. Service Layer
3. Dashboard Widget
4. Detail-Seite
5. Content für erste 30 Tage erstellen
6. Cron Job für automatische Generierung
7. User-Testing
8. Optional: Push Notifications
