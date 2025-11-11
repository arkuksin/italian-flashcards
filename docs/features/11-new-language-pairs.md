# Feature: Neue Sprachpaare (Deutsch & Englisch)

## Übersicht
Unterstützung für zusätzliche Sprachrichtungen:
- **Deutsch → Italienisch**
- **Italienisch → Deutsch**
- **Englisch → Italienisch**
- **Italienisch → Englisch**

Dies erweitert die Anwendung über das aktuelle Russisch-Italienisch Paar hinaus.

## Motivation
- Größere Zielgruppe erreichen
- Deutsch-Sprachige können direkt lernen
- Englisch ist Weltsprache - großes Potenzial
- Nutzer könnten mehrere Sprachpaare lernen wollen
- Skalierbarkeit: Weitere Sprachen in Zukunft

## Funktionsbeschreibung

### Hauptfunktionen

1. **Multi-Language Support**
   - Wörter haben Übersetzungen in mehreren Sprachen
   - User wählt Sprachpaar beim Lernen
   - Separate Progress-Tracking pro Sprachpaar
   - UI unterstützt alle Sprachrichtungen

2. **Sprachpaar-Auswahl**
   - Erweiterte Mode Selection
   - Grid mit allen verfügbaren Paaren
   - User kann bevorzugte Paare setzen
   - Schnellwechsel zwischen Paaren

3. **Separate Statistiken**
   - Progress pro Sprachpaar getrennt
   - Accuracy pro Paar
   - Gesamtübersicht über alle Paare

4. **Flexible Datenbankstruktur**
   - Unterstützt beliebige Sprachkombinationen
   - Einfache Erweiterung um neue Sprachen
   - Vermeidet Code-Duplikation

### UI/UX Design

```
Erweiterte Mode Selection:
┌─────────────────────────────────────┐
│  🌍 Sprachpaar wählen               │
│                                     │
│  ┌─────────────┬─────────────┐    │
│  │ 🇷🇺 → 🇮🇹   │ 🇮🇹 → 🇷🇺   │    │
│  │ Russisch    │ Italienisch │    │
│  │ Italienisch │ Russisch    │    │
│  │                            │    │
│  │ 245 Wörter                 │    │
│  │ 68% Accuracy               │    │
│  └─────────────┴─────────────┘    │
│                                     │
│  ┌─────────────┬─────────────┐    │
│  │ 🇩🇪 → 🇮🇹   │ 🇮🇹 → 🇩🇪   │    │
│  │ Deutsch     │ Italienisch │    │
│  │ Italienisch │ Deutsch     │    │
│  │                            │    │
│  │ 245 Wörter                 │    │
│  │ 45% Accuracy               │    │
│  └─────────────┴─────────────┘    │
│                                     │
│  ┌─────────────┬─────────────┐    │
│  │ 🇬🇧 → 🇮🇹   │ 🇮🇹 → 🇬🇧   │    │
│  │ Englisch    │ Italienisch │    │
│  │ Italienisch │ Englisch    │    │
│  │                            │    │
│  │ 245 Wörter                 │    │
│  │ Neu! ✨                    │    │
│  └─────────────┴─────────────┘    │
│                                     │
│  💡 Empfehlung: Deutsch-Italienisch│
│     hat niedrigste Accuracy        │
└─────────────────────────────────────┘

Analytics mit Sprachpaar-Filter:
┌─────────────────────────────────────┐
│  📊 Analytics                       │
│                                     │
│  Sprachpaar: [ Alle ▼ ]            │
│               🇷🇺→🇮🇹               │
│               🇩🇪→🇮🇹               │
│               🇬🇧→🇮🇹               │
│                                     │
│  [Charts und Statistiken...]        │
└─────────────────────────────────────┘
```

### Datenbankschema

```sql
-- Erweitere words Tabelle mit allen Sprachen
ALTER TABLE words
ADD COLUMN german TEXT,
ADD COLUMN english TEXT;

-- Update: Füge Übersetzungen hinzu (Migration Script)
-- Beispiel: 'дом' -> 'Haus' (de), 'house' (en)

-- Sprachpaar-Definition Tabelle
CREATE TABLE language_pairs (
  id SERIAL PRIMARY KEY,
  source_lang VARCHAR(5) NOT NULL,    -- 'ru', 'it', 'de', 'en'
  target_lang VARCHAR(5) NOT NULL,    -- 'ru', 'it', 'de', 'en'
  is_active BOOLEAN DEFAULT true,
  display_name_source TEXT NOT NULL,  -- 'Russisch', 'Italiano', etc.
  display_name_target TEXT NOT NULL,
  flag_emoji_source VARCHAR(10),      -- '🇷🇺', '🇮🇹', etc.
  flag_emoji_target VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(source_lang, target_lang),
  CHECK(source_lang != target_lang)
);

-- Initiale Sprachpaare
INSERT INTO language_pairs (source_lang, target_lang, display_name_source, display_name_target, flag_emoji_source, flag_emoji_target)
VALUES
  ('ru', 'it', 'Russisch', 'Italienisch', '🇷🇺', '🇮🇹'),
  ('it', 'ru', 'Italienisch', 'Russisch', '🇮🇹', '🇷🇺'),
  ('de', 'it', 'Deutsch', 'Italienisch', '🇩🇪', '🇮🇹'),
  ('it', 'de', 'Italienisch', 'Deutsch', '🇮🇹', '🇩🇪'),
  ('en', 'it', 'English', 'Italiano', '🇬🇧', '🇮🇹'),
  ('it', 'en', 'Italiano', 'English', '🇮🇹', '🇬🇧');

-- Erweitere word_progress mit Sprachpaar
ALTER TABLE word_progress
ADD COLUMN language_pair_id INTEGER REFERENCES language_pairs(id);

-- Migriere bestehende Daten (ru-it)
UPDATE word_progress
SET language_pair_id = (SELECT id FROM language_pairs WHERE source_lang = 'ru' AND target_lang = 'it')
WHERE language_pair_id IS NULL;

-- Jetzt NOT NULL machen
ALTER TABLE word_progress
ALTER COLUMN language_pair_id SET NOT NULL;

-- Unique constraint anpassen
ALTER TABLE word_progress
DROP CONSTRAINT IF EXISTS word_progress_user_id_word_id_key;

ALTER TABLE word_progress
ADD CONSTRAINT word_progress_user_word_pair_unique
UNIQUE(user_id, word_id, language_pair_id);

-- Erweitere learning_sessions
ALTER TABLE learning_sessions
ADD COLUMN language_pair_id INTEGER REFERENCES language_pairs(id);

-- Erweitere review_history
ALTER TABLE review_history
ADD COLUMN language_pair_id INTEGER REFERENCES language_pairs(id);

-- View: Statistiken pro Sprachpaar
CREATE OR REPLACE VIEW v_language_pair_stats AS
SELECT
  lp.id as language_pair_id,
  lp.source_lang,
  lp.target_lang,
  lp.display_name_source,
  lp.display_name_target,
  wp.user_id,
  COUNT(DISTINCT wp.word_id) as words_learned,
  ROUND(AVG(
    CASE
      WHEN wp.correct_count + wp.wrong_count > 0
      THEN wp.correct_count::NUMERIC / (wp.correct_count + wp.wrong_count)
      ELSE 0
    END
  ) * 100, 2) as avg_accuracy,
  ROUND(AVG(wp.mastery_level), 2) as avg_mastery_level
FROM language_pairs lp
CROSS JOIN auth.users u
LEFT JOIN word_progress wp ON wp.language_pair_id = lp.id AND wp.user_id = u.id
WHERE lp.is_active = true
GROUP BY lp.id, lp.source_lang, lp.target_lang, lp.display_name_source, lp.display_name_target, wp.user_id;

-- Function: Get word translation for language
CREATE OR REPLACE FUNCTION get_word_translation(
  p_word_id INTEGER,
  p_language VARCHAR(5)
)
RETURNS TEXT AS $$
DECLARE
  v_translation TEXT;
BEGIN
  SELECT
    CASE p_language
      WHEN 'ru' THEN russian
      WHEN 'it' THEN italian
      WHEN 'de' THEN german
      WHEN 'en' THEN english
      ELSE NULL
    END
  INTO v_translation
  FROM words
  WHERE id = p_word_id;

  RETURN v_translation;
END;
$$ LANGUAGE plpgsql;
```

### TypeScript Types

```typescript
// src/types/languages.ts

export type LanguageCode = 'ru' | 'it' | 'de' | 'en';

export interface LanguagePair {
  id: number;
  source_lang: LanguageCode;
  target_lang: LanguageCode;
  is_active: boolean;
  display_name_source: string;
  display_name_target: string;
  flag_emoji_source: string;
  flag_emoji_target: string;
}

export interface LanguagePairStats {
  language_pair_id: number;
  source_lang: LanguageCode;
  target_lang: LanguageCode;
  display_name_source: string;
  display_name_target: string;
  words_learned: number;
  avg_accuracy: number;
  avg_mastery_level: number;
}

export interface MultilingualWord {
  id: number;
  russian: string;
  italian: string;
  german?: string;
  english?: string;
  category: string;
}

// Erweiterte LearningDirection
export type LearningDirection =
  | 'ru-it'
  | 'it-ru'
  | 'de-it'
  | 'it-de'
  | 'en-it'
  | 'it-en';
```

### Service Layer

```typescript
// src/services/languageService.ts

import { supabase } from '../lib/supabase';
import type { LanguagePair, LanguagePairStats, LanguageCode } from '../types/languages';

export const languageService = {
  async getActiveLanguagePairs(): Promise<LanguagePair[]> {
    const { data, error } = await supabase
      .from('language_pairs')
      .select('*')
      .eq('is_active', true)
      .order('source_lang')
      .order('target_lang');

    if (error) throw error;
    return data || [];
  },

  async getLanguagePairStats(userId: string): Promise<LanguagePairStats[]> {
    const { data, error } = await supabase
      .from('v_language_pair_stats')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  },

  async getLanguagePairById(pairId: number): Promise<LanguagePair | null> {
    const { data, error } = await supabase
      .from('language_pairs')
      .select('*')
      .eq('id', pairId)
      .single();

    if (error) throw error;
    return data;
  },

  languageDirectionToPairId(direction: LearningDirection): Promise<number> {
    const [source, target] = direction.split('-') as [LanguageCode, LanguageCode];

    return this.getPairIdByLanguages(source, target);
  },

  async getPairIdByLanguages(
    sourceLang: LanguageCode,
    targetLang: LanguageCode
  ): Promise<number> {
    const { data, error } = await supabase
      .from('language_pairs')
      .select('id')
      .eq('source_lang', sourceLang)
      .eq('target_lang', targetLang)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Language pair not found');

    return data.id;
  },

  getWordTranslation(word: MultilingualWord, lang: LanguageCode): string {
    switch (lang) {
      case 'ru': return word.russian;
      case 'it': return word.italian;
      case 'de': return word.german || '';
      case 'en': return word.english || '';
      default: return '';
    }
  },

  languageCodeToName(code: LanguageCode): string {
    const names: Record<LanguageCode, string> = {
      ru: 'Russisch',
      it: 'Italienisch',
      de: 'Deutsch',
      en: 'English'
    };
    return names[code];
  },

  languageCodeToFlag(code: LanguageCode): string {
    const flags: Record<LanguageCode, string> = {
      ru: '🇷🇺',
      it: '🇮🇹',
      de: '🇩🇪',
      en: '🇬🇧'
    };
    return flags[code];
  }
};
```

### React Component

```typescript
// src/components/LanguagePairSelector.tsx

import React, { useState, useEffect } from 'react';
import { Globe, TrendingUp } from 'lucide-react';
import { languageService } from '../services/languageService';
import type { LanguagePair, LanguagePairStats } from '../types/languages';

interface LanguagePairSelectorProps {
  onSelect: (pairId: number, direction: string) => void;
}

export const LanguagePairSelector: React.FC<LanguagePairSelectorProps> = ({
  onSelect
}) => {
  const [pairs, setPairs] = useState<LanguagePair[]>([]);
  const [stats, setStats] = useState<LanguagePairStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLanguagePairs();
  }, []);

  const loadLanguagePairs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [pairsData, statsData] = await Promise.all([
        languageService.getActiveLanguagePairs(),
        languageService.getLanguagePairStats(user.id)
      ]);

      setPairs(pairsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading language pairs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatsForPair = (pairId: number): LanguagePairStats | undefined => {
    return stats.find(s => s.language_pair_id === pairId);
  };

  const getSuggestion = (): LanguagePairStats | null => {
    const learnedPairs = stats.filter(s => s.words_learned > 0);
    if (learnedPairs.length === 0) return null;

    return learnedPairs.reduce((lowest, current) =>
      current.avg_accuracy < lowest.avg_accuracy ? current : lowest
    );
  };

  if (loading) {
    return <div className="text-center py-8">Lade Sprachpaare...</div>;
  }

  const suggestion = getSuggestion();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Globe className="w-12 h-12 text-blue-600 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Sprachpaar wählen
        </h2>
        <p className="text-gray-600">
          Wählen Sie die Lernrichtung für Ihre Session
        </p>
      </div>

      {suggestion && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <div className="font-medium text-gray-800">Empfehlung</div>
              <div className="text-sm text-gray-700">
                {suggestion.display_name_source} → {suggestion.display_name_target}{' '}
                hat die niedrigste Accuracy ({suggestion.avg_accuracy.toFixed(0)}%)
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pairs.map(pair => {
          const pairStats = getStatsForPair(pair.id);
          const direction = `${pair.source_lang}-${pair.target_lang}`;

          return (
            <button
              key={pair.id}
              onClick={() => onSelect(pair.id, direction)}
              className="p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{pair.flag_emoji_source}</span>
                  <span className="text-xl text-gray-400">→</span>
                  <span className="text-3xl">{pair.flag_emoji_target}</span>
                </div>
                {pairStats && pairStats.words_learned === 0 && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Neu! ✨
                  </span>
                )}
              </div>

              <div className="mb-3">
                <div className="font-semibold text-gray-800">
                  {pair.display_name_source}
                </div>
                <div className="text-sm text-gray-600">
                  {pair.display_name_target}
                </div>
              </div>

              {pairStats ? (
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Gelernte Wörter:</span>
                    <span className="font-medium">{pairStats.words_learned}</span>
                  </div>
                  {pairStats.words_learned > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span>Accuracy:</span>
                        <span className="font-medium">
                          {pairStats.avg_accuracy.toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ø Level:</span>
                        <span className="font-medium">
                          {pairStats.avg_mastery_level.toFixed(1)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  245 Wörter verfügbar
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
```

## User Stories

1. **Als deutschsprachiger User** möchte ich direkt Deutsch-Italienisch lernen, ohne Russisch zu können.

2. **Als mehrsprachiger Lerner** möchte ich verschiedene Sprachpaare gleichzeitig üben können.

3. **Als Anfänger** möchte ich mit Englisch-Italienisch starten, da Englisch einfacher ist.

4. **Als fortgeschrittener Lerner** möchte ich alle meine Fortschritte pro Sprachpaar getrennt sehen.

## Akzeptanzkriterien

- [ ] Deutsche Übersetzungen für alle Wörter vorhanden
- [ ] Englische Übersetzungen für alle Wörter vorhanden
- [ ] Auswahl zwischen allen 6 Sprachrichtungen möglich
- [ ] Progress wird pro Sprachpaar getrennt getrackt
- [ ] Statistiken zeigen Daten pro Sprachpaar
- [ ] Migration der bestehenden ru-it Daten funktioniert
- [ ] UI zeigt Flaggen und Sprachnamen korrekt
- [ ] Keine Vermischung von Daten zwischen Paaren

## Priorität
**Mittel-Hoch** ⭐⭐⭐

## Aufwand
- **Content (Übersetzungen)**: 10-15 Tage (245 Wörter × 2 Sprachen)
- **Backend (Datenbank-Migration)**: 3 Tage
- **Frontend (UI Anpassungen)**: 3 Tage
- **Testing**: 3 Tage
- **Gesamt**: 9 Tage Development + Content-Arbeit

## Abhängigkeiten
- Deutsche und englische Übersetzungen müssen erstellt werden
- Qualitätskontrolle durch Muttersprachler
- Datenbank-Migration muss sorgfältig getestet werden

## Risiken
- Hoher Content-Aufwand für Übersetzungen
- Datenbank-Migration könnte bestehende Daten gefährden
- Komplexität des Codes steigt
- Mehr Testing erforderlich

## Migrationsstrategie

### Phase 1: Datenbank vorbereiten
1. Neue Spalten hinzufügen (german, english)
2. language_pairs Tabelle erstellen
3. Constraints anpassen

### Phase 2: Content erstellen
1. Deutsche Übersetzungen für alle 245 Wörter
2. Englische Übersetzungen für alle 245 Wörter
3. Review durch Muttersprachler

### Phase 3: Code anpassen
1. Types erweitern
2. Services anpassen
3. Components updaten
4. Tests schreiben

### Phase 4: Migration der bestehenden Daten
1. Backup erstellen
2. Bestehende word_progress mit language_pair_id updaten
3. Bestehende sessions und reviews updaten
4. Validierung

### Phase 5: Deployment
1. Staged Rollout
2. Monitoring
3. User-Kommunikation

## Nächste Schritte
1. Datenbank-Schema Design finalisieren
2. Content-Strategie (intern vs. extern vs. AI)
3. Migration Script erstellen und testen
4. Prototyp mit einem Sprachpaar (de-it)
5. User-Testing
6. Schrittweise alle Paare aktivieren
