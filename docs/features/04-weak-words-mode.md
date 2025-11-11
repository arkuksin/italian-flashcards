# Feature: Schwache Wörter Modus

## Übersicht
Intelligenter Fokus auf Wörter mit niedrigem Score oder häufigen Fehlern. Automatische Auswahl von Problem-Wörtern für gezieltes Training.

## Motivation
- Lernzeit ist begrenzt - Fokus auf schwache Bereiche ist effizient
- Wiederholung von bereits gemeisterten Wörtern ist weniger produktiv
- Gezielte Übung verbessert schwache Wörter schneller
- Frustrationsreduzierung durch sichtbare Verbesserung
- Adaptives Lernen: System passt sich an User an

## Funktionsbeschreibung

### Hauptfunktionen

1. **Schwache Wörter Identifizierung**
   - Algorithmus erkennt problematische Wörter
   - Basiert auf mehreren Metriken:
     - Niedrige Accuracy (< 50%)
     - Häufige Fehler (3+ falsche Antworten)
     - Lange Zeit seit letzter richtiger Antwort
     - Mastery Level 0-1 (neu/lernend)
     - Hohe Response Time (langsames Antworten)

2. **Dedizierter Lernmodus**
   - "Schwache Wörter üben" Button auf Dashboard
   - Zeigt nur problematische Wörter
   - Priorisierung nach Schwierigkeitsgrad
   - Automatisches Ende wenn keine schwachen Wörter mehr

3. **Progress Tracking**
   - Zeige Verbesserung über Zeit
   - "X von Y schwachen Wörtern verbessert"
   - Visualisierung des Fortschritts
   - Celebration bei Verbesserungen

4. **Smart Scheduling**
   - Schwache Wörter erscheinen häufiger
   - Verteilung über normale Sessions
   - Adaptive Wiederholungsrate

### UI/UX Design

```
Dashboard - Neue Karte:
┌─────────────────────────────────────┐
│  ⚠️ Schwache Wörter                 │
│                                     │
│  Sie haben 23 Wörter, die          │
│  zusätzliche Übung brauchen        │
│                                     │
│  📊 Durchschnittliche Accuracy:    │
│      35% → Fokus empfohlen!        │
│                                     │
│  [ Schwache Wörter üben ]          │
└─────────────────────────────────────┘

Während der Session:
┌─────────────────────────────────────┐
│  ⚠️ Schwache Wörter Modus           │
│  ━━━━━━━━░░░░░░░░░░  8/23          │
│                                     │
│  🎯 Fokus: Häufige Fehler          │
│                                     │
│  дом                                │
│  [Wohnung, Haus]                   │
│                                     │
│  💡 Tipp: 3 Fehler bei diesem      │
│      Wort - nehmen Sie sich Zeit!  │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Ihre Antwort...               │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Schwache Wörter Algorithmus

```typescript
// src/services/weakWordsService.ts

interface WeakWordCriteria {
  minAccuracy: number; // z.B. 0.5 (50%)
  minAttempts: number; // z.B. 3
  maxMasteryLevel: number; // z.B. 1
  daysSinceCorrect: number; // z.B. 7
  responseTimeThreshold: number; // z.B. 10000ms
}

interface WeakWordScore {
  word_id: number;
  weakness_score: number; // 0-100, höher = schwächer
  reasons: string[];
  accuracy: number;
  attempts: number;
  last_correct: Date | null;
}

export const weakWordsService = {
  async getWeakWords(
    userId: string,
    criteria: Partial<WeakWordCriteria> = {}
  ): Promise<WeakWordScore[]> {
    const defaultCriteria: WeakWordCriteria = {
      minAccuracy: 0.5,
      minAttempts: 3,
      maxMasteryLevel: 1,
      daysSinceCorrect: 7,
      responseTimeThreshold: 10000,
      ...criteria
    };

    // Komplexe Query um schwache Wörter zu identifizieren
    const { data, error } = await supabase.rpc('get_weak_words', {
      p_user_id: userId,
      p_min_accuracy: defaultCriteria.minAccuracy,
      p_min_attempts: defaultCriteria.minAttempts,
      p_max_mastery_level: defaultCriteria.maxMasteryLevel
    });

    if (error) throw error;
    return data || [];
  },

  calculateWeaknessScore(progress: WordProgress, reviews: ReviewHistory[]): number {
    let score = 0;

    // Faktor 1: Niedrige Accuracy (max 40 Punkte)
    const accuracy = progress.correct_count / (progress.correct_count + progress.wrong_count);
    score += (1 - accuracy) * 40;

    // Faktor 2: Niedriges Mastery Level (max 20 Punkte)
    score += (5 - progress.mastery_level) * 4;

    // Faktor 3: Häufige Fehler (max 20 Punkte)
    score += Math.min(progress.wrong_count * 2, 20);

    // Faktor 4: Lange her seit korrekter Antwort (max 20 Punkte)
    const lastCorrect = reviews.find(r => r.correct)?.review_date;
    if (lastCorrect) {
      const daysSince = (Date.now() - new Date(lastCorrect).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.min(daysSince * 2, 20);
    } else {
      score += 20; // Noch nie korrekt
    }

    return Math.min(Math.round(score), 100);
  },

  async getWeakWordsStatistics(userId: string) {
    const weakWords = await this.getWeakWords(userId);

    return {
      total: weakWords.length,
      averageAccuracy: weakWords.reduce((sum, w) => sum + w.accuracy, 0) / weakWords.length,
      mostDifficult: weakWords.slice(0, 5), // Top 5 schwächste
      categories: this.groupByCategory(weakWords)
    };
  }
};
```

### Datenbankfunktion

```sql
-- PostgreSQL Function für schwache Wörter
CREATE OR REPLACE FUNCTION get_weak_words(
  p_user_id UUID,
  p_min_accuracy NUMERIC DEFAULT 0.5,
  p_min_attempts INTEGER DEFAULT 3,
  p_max_mastery_level INTEGER DEFAULT 1
)
RETURNS TABLE (
  word_id INTEGER,
  russian TEXT,
  italian TEXT,
  category TEXT,
  accuracy NUMERIC,
  attempts INTEGER,
  mastery_level INTEGER,
  weakness_score NUMERIC,
  reasons TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  WITH word_stats AS (
    SELECT
      wp.word_id,
      wp.correct_count,
      wp.wrong_count,
      wp.mastery_level,
      wp.last_practiced,
      CASE
        WHEN (wp.correct_count + wp.wrong_count) > 0
        THEN wp.correct_count::NUMERIC / (wp.correct_count + wp.wrong_count)
        ELSE 0
      END as word_accuracy,
      (wp.correct_count + wp.wrong_count) as total_attempts
    FROM word_progress wp
    WHERE wp.user_id = p_user_id
  ),
  weak_candidates AS (
    SELECT
      ws.*,
      w.russian,
      w.italian,
      w.category,
      -- Weakness Score Berechnung
      (
        (1 - ws.word_accuracy) * 40 +  -- Accuracy
        (5 - ws.mastery_level) * 4 +    -- Mastery Level
        LEAST(ws.wrong_count * 2, 20) + -- Fehleranzahl
        CASE
          WHEN ws.last_practiced IS NULL THEN 20
          WHEN ws.last_practiced < NOW() - INTERVAL '7 days' THEN 20
          ELSE EXTRACT(EPOCH FROM (NOW() - ws.last_practiced)) / (60 * 60 * 24) * 2
        END
      )::NUMERIC as weakness_score,
      -- Gründe sammeln
      ARRAY_REMOVE(ARRAY[
        CASE WHEN ws.word_accuracy < p_min_accuracy THEN 'Niedrige Accuracy' END,
        CASE WHEN ws.mastery_level <= 1 THEN 'Niedriger Level' END,
        CASE WHEN ws.wrong_count >= 3 THEN 'Häufige Fehler' END,
        CASE WHEN ws.last_practiced < NOW() - INTERVAL '7 days' THEN 'Lange nicht geübt' END
      ], NULL) as weakness_reasons
    FROM word_stats ws
    JOIN words w ON w.id = ws.word_id
    WHERE
      ws.total_attempts >= p_min_attempts
      AND (
        ws.word_accuracy < p_min_accuracy
        OR ws.mastery_level <= p_max_mastery_level
        OR ws.wrong_count >= 3
      )
  )
  SELECT
    wc.word_id,
    wc.russian,
    wc.italian,
    wc.category,
    wc.word_accuracy,
    wc.total_attempts,
    wc.mastery_level,
    wc.weakness_score,
    wc.weakness_reasons
  FROM weak_candidates wc
  ORDER BY wc.weakness_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### React Component

```typescript
// src/components/WeakWordsMode.tsx

import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Target } from 'lucide-react';
import { weakWordsService } from '../services/weakWordsService';
import type { WeakWordScore } from '../services/weakWordsService';

interface WeakWordsModeProps {
  onStartSession: (wordIds: number[]) => void;
}

export const WeakWordsMode: React.FC<WeakWordsModeProps> = ({ onStartSession }) => {
  const [weakWords, setWeakWords] = useState<WeakWordScore[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeakWords();
  }, []);

  const loadWeakWords = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const words = await weakWordsService.getWeakWords(user.id);
      const statistics = await weakWordsService.getWeakWordsStatistics(user.id);

      setWeakWords(words);
      setStats(statistics);
    } catch (error) {
      console.error('Error loading weak words:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    const wordIds = weakWords.map(w => w.word_id);
    onStartSession(wordIds);
  };

  if (loading) {
    return <div>Lade schwache Wörter...</div>;
  }

  if (weakWords.length === 0) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-3 mb-3">
          <TrendingUp className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-green-800">
            Großartig!
          </h3>
        </div>
        <p className="text-green-700">
          Sie haben derzeit keine schwachen Wörter. Alle Wörter werden gut gelernt! 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="w-6 h-6 text-yellow-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          Schwache Wörter
        </h3>
      </div>

      <div className="space-y-3 mb-4">
        <p className="text-gray-700">
          Sie haben <strong>{weakWords.length} Wörter</strong>, die zusätzliche Übung brauchen.
        </p>

        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded border border-yellow-200">
              <div className="text-xs text-gray-600">Durchschn. Accuracy</div>
              <div className="text-xl font-semibold text-yellow-700">
                {(stats.averageAccuracy * 100).toFixed(0)}%
              </div>
            </div>
            <div className="p-3 bg-white rounded border border-yellow-200">
              <div className="text-xs text-gray-600">Zu üben</div>
              <div className="text-xl font-semibold text-yellow-700">
                {stats.total}
              </div>
            </div>
          </div>
        )}

        <div className="p-3 bg-white rounded border border-yellow-200">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Schwierigste Wörter:
          </div>
          <ul className="text-sm space-y-1">
            {stats?.mostDifficult?.slice(0, 3).map((word: any) => (
              <li key={word.word_id} className="flex justify-between">
                <span className="text-gray-800">{word.russian} → {word.italian}</span>
                <span className="text-xs text-gray-500">
                  {(word.accuracy * 100).toFixed(0)}% Accuracy
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        onClick={handleStart}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors"
      >
        <Target className="w-5 h-5" />
        Schwache Wörter üben
      </button>

      <p className="text-xs text-gray-600 text-center mt-3">
        Fokussiertes Training für maximale Verbesserung
      </p>
    </div>
  );
};
```

## User Stories

1. **Als Lerner** möchte ich gezielt meine schwachen Wörter üben, um effizienter zu lernen.

2. **Als User mit begrenzter Zeit** möchte ich mich auf Problem-Wörter fokussieren statt Zeit mit bereits gemeisterten Wörtern zu verschwenden.

3. **Als motivierter Lerner** möchte ich meinen Fortschritt bei schwachen Wörtern sehen, um mich zu motivieren.

4. **Als Anfänger** möchte ich verstehen, welche Wörter mir besonders schwer fallen.

## Akzeptanzkriterien

- [ ] System identifiziert automatisch schwache Wörter
- [ ] "Schwache Wörter" Widget auf Dashboard
- [ ] Dedizierter Lernmodus nur für schwache Wörter
- [ ] Statistiken zeigen Anzahl und durchschnittliche Accuracy
- [ ] Top 3-5 schwierigste Wörter werden angezeigt
- [ ] Progress Tracking während der Session
- [ ] Celebration wenn Wort verbessert wurde
- [ ] Empty State wenn keine schwachen Wörter vorhanden

## Priorität
**Hoch** ⭐⭐⭐

## Aufwand
- **Backend (Algorithmus + DB Function)**: 3 Tage
- **Frontend (UI Components)**: 2 Tage
- **Integration**: 1 Tag
- **Testing & Tuning**: 2 Tage
- **Gesamt**: 7-8 Tage

## Abhängigkeiten
- Erfordert ausreichend Review History Daten
- Funktioniert besser mit mehr Nutzungsdaten

## Risiken
- Algorithmus könnte zu streng/locker sein (benötigt Tuning)
- User könnten frustriert sein wenn zu viele schwache Wörter
- Balance zwischen Herausforderung und Motivation wichtig

## Erweiterungen (Future)

### AI-gestützte Empfehlungen
```typescript
// ML-Modell sagt voraus, welche Wörter schwierig werden
async function predictDifficultWords(userId: string) {
  // Analysiere Lernmuster
  // Finde ähnliche Wörter die problematisch waren
  // Empfehle präventives Training
}
```

### Personalisierte Schwellenwerte
- User kann eigene Kriterien festlegen
- "Strenger" vs. "Lockerer" Modus
- Anpassung basierend auf Gesamt-Level

### Category-spezifische Schwäche
- "Ihre schwächste Kategorie: Verben"
- Gezieltes Training pro Kategorie

## Nächste Schritte
1. Datenbank-Funktion erstellen
2. Service Layer implementieren
3. Algorithmus testen mit echten Daten
4. UI Components entwickeln
5. Dashboard Integration
6. User-Testing mit verschiedenen Profilen
7. Algorithmus basierend auf Feedback tunen
