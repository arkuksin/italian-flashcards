# Feature: Verb-Konjugationen

## Übersicht
Für Verben: einfache Konjugationstabellen zeigen mit Grundformen (Präsens, Perfekt, etc.). Hilft beim Verstehen der Verb-Verwendung.

## Motivation
- Verben sind das Rückgrat jeder Sprache
- Konjugationen sind oft schwierig zu merken
- Kontextuelle Information hilft beim Lernen
- Zeigt Muster und Regelmäßigkeiten
- Verbessert praktische Sprachverwendung

## Funktionsbeschreibung

### Hauptfunktionen

1. **Konjugationstabelle anzeigen**
   - Button "Konjugation" nur bei Verben
   - Expandiert und zeigt Tabelle
   - Wichtigste Formen zuerst

2. **Zeitformen**
   - **Italienisch**: Presente, Passato Prossimo, Futuro Semplice
   - **Russisch**: Настоящее (Präsens), Прошедшее (Perfekt), Будущее (Futur)
   - Optional: weitere Zeiten für Fortgeschrittene

3. **Kompakt-Ansicht**
   - Nicht zu überladen
   - Fokus auf gebräuchlichste Formen
   - "Mehr zeigen" für vollständige Tabelle

4. **Smart Detection**
   - System erkennt automatisch Verben
   - Nutzt Kategorie-Tag "Verb"
   - Zeigt Button nur bei Verben

### UI/UX Design

```
Bei Verb:
┌─────────────────────────────────────┐
│  говорить (govorit')                │
│  [Verb] 🔤                          │
│                                     │
│  📖 Konjugation anzeigen            │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Ihre Antwort...               │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘

Expandiert:
┌─────────────────────────────────────┐
│  говорить (govorit')                │
│  [Verb] 🔤                          │
│                                     │
│  📖 Konjugation ausblenden          │
│  ┌───────────────────────────────┐ │
│  │ Russisch: говорить             │ │
│  │ Italienisch: parlare           │ │
│  │                                │ │
│  │ Präsens (io):                  │ │
│  │ 🇷🇺 я говорю                   │ │
│  │ 🇮🇹 io parlo                   │ │
│  │                                │ │
│  │ Perfekt:                       │ │
│  │ 🇷🇺 я говорил/говорила         │ │
│  │ 🇮🇹 io ho parlato              │ │
│  │                                │ │
│  │ Futur:                         │ │
│  │ 🇷🇺 я буду говорить            │ │
│  │ 🇮🇹 io parlerò                 │ │
│  │                                │ │
│  │ [Vollständige Tabelle →]       │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Datenbankschema

```sql
-- Neue Tabelle für Verb-Konjugationen
CREATE TABLE verb_conjugations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
  language VARCHAR(5) NOT NULL, -- 'ru', 'it'
  tense VARCHAR(50) NOT NULL, -- 'present', 'past', 'future', 'imperfect', etc.
  person VARCHAR(20), -- 'я', 'ты', 'io', 'tu', etc. (kann NULL sein für Infinitiv)
  conjugated_form TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false, -- Markiert wichtigste Formen
  notes TEXT, -- z.B. "irregulär", "gebräuchlich"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ein Verb kann nur eine Form pro Language+Tense+Person haben
  UNIQUE(word_id, language, tense, person)
);

-- Index
CREATE INDEX idx_verb_conjugations_word ON verb_conjugations(word_id);
CREATE INDEX idx_verb_conjugations_primary ON verb_conjugations(word_id, is_primary);
CREATE INDEX idx_verb_conjugations_lang_tense ON verb_conjugations(language, tense);

-- Markiere Verben in words Tabelle
ALTER TABLE words
ADD COLUMN is_verb BOOLEAN DEFAULT false,
ADD COLUMN verb_type VARCHAR(50); -- 'regular', 'irregular', 'reflexive'

-- Update bestehende Verben
UPDATE words SET is_verb = true WHERE category = 'Verben';
```

### TypeScript Types

```typescript
// src/types/conjugations.ts

export type Language = 'ru' | 'it';
export type Tense = 'present' | 'past' | 'future' | 'imperfect' | 'conditional';
export type Person = 'я' | 'ты' | 'он' | 'она' | 'мы' | 'вы' | 'они' | // Russisch
                     'io' | 'tu' | 'lui' | 'lei' | 'noi' | 'voi' | 'loro'; // Italienisch

export interface VerbConjugation {
  id: string;
  word_id: number;
  language: Language;
  tense: Tense;
  person?: Person;
  conjugated_form: string;
  is_primary: boolean;
  notes?: string;
}

export interface ConjugationTable {
  infinitive: {
    ru: string;
    it: string;
  };
  present: {
    ru: string[];
    it: string[];
  };
  past: {
    ru: string[];
    it: string[];
  };
  future: {
    ru: string[];
    it: string[];
  };
}
```

### Service Layer

```typescript
// src/services/conjugationService.ts

import { supabase } from '../lib/supabase';
import type { VerbConjugation, ConjugationTable } from '../types/conjugations';

export const conjugationService = {
  async getConjugationsForVerb(wordId: number): Promise<VerbConjugation[]> {
    const { data, error } = await supabase
      .from('verb_conjugations')
      .select('*')
      .eq('word_id', wordId)
      .order('language')
      .order('tense')
      .order('person');

    if (error) throw error;
    return data || [];
  },

  async getPrimaryConjugations(wordId: number): Promise<VerbConjugation[]> {
    // Nur wichtigste Formen
    const { data, error } = await supabase
      .from('verb_conjugations')
      .select('*')
      .eq('word_id', wordId)
      .eq('is_primary', true)
      .order('language')
      .order('tense');

    if (error) throw error;
    return data || [];
  },

  formatConjugationTable(conjugations: VerbConjugation[]): ConjugationTable {
    const ru = conjugations.filter(c => c.language === 'ru');
    const it = conjugations.filter(c => c.language === 'it');

    return {
      infinitive: {
        ru: ru.find(c => !c.person)?.conjugated_form || '',
        it: it.find(c => !c.person)?.conjugated_form || ''
      },
      present: {
        ru: ru.filter(c => c.tense === 'present' && c.person).map(c => c.conjugated_form),
        it: it.filter(c => c.tense === 'present' && c.person).map(c => c.conjugated_form)
      },
      past: {
        ru: ru.filter(c => c.tense === 'past' && c.person).map(c => c.conjugated_form),
        it: it.filter(c => c.tense === 'past' && c.person).map(c => c.conjugated_form)
      },
      future: {
        ru: ru.filter(c => c.tense === 'future' && c.person).map(c => c.conjugated_form),
        it: it.filter(c => c.tense === 'future' && c.person).map(c => c.conjugated_form)
      }
    };
  },

  async addConjugation(
    wordId: number,
    language: Language,
    tense: Tense,
    person: string | undefined,
    conjugatedForm: string,
    isPrimary: boolean = false,
    notes?: string
  ): Promise<VerbConjugation> {
    const { data, error } = await supabase
      .from('verb_conjugations')
      .insert({
        word_id: wordId,
        language,
        tense,
        person,
        conjugated_form: conjugatedForm,
        is_primary: isPrimary,
        notes
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
```

### React Component

```typescript
// src/components/VerbConjugation.tsx

import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { conjugationService } from '../services/conjugationService';
import type { VerbConjugation as VerbConjugationType } from '../types/conjugations';

interface VerbConjugationProps {
  wordId: number;
  russianWord: string;
  italianWord: string;
  isVerb: boolean;
}

export const VerbConjugation: React.FC<VerbConjugationProps> = ({
  wordId,
  russianWord,
  italianWord,
  isVerb
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [conjugations, setConjugations] = useState<VerbConjugationType[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isExpanded && conjugations.length === 0) {
      loadConjugations();
    }
  }, [isExpanded]);

  const loadConjugations = async () => {
    try {
      setLoading(true);
      const data = showAll
        ? await conjugationService.getConjugationsForVerb(wordId)
        : await conjugationService.getPrimaryConjugations(wordId);
      setConjugations(data);
    } catch (error) {
      console.error('Error loading conjugations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isVerb) return null;

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 transition-colors"
      >
        <BookOpen className="w-4 h-4" />
        Konjugation anzeigen
      </button>
    );
  }

  const table = conjugationService.formatConjugationTable(conjugations);

  return (
    <div className="my-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
      <button
        onClick={() => setIsExpanded(false)}
        className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 mb-3"
      >
        <BookOpen className="w-4 h-4" />
        Konjugation ausblenden
      </button>

      {loading ? (
        <p className="text-sm text-gray-500">Lade Konjugationen...</p>
      ) : conjugations.length === 0 ? (
        <p className="text-sm text-gray-500">Keine Konjugationen verfügbar</p>
      ) : (
        <div className="space-y-4">
          {/* Infinitiv */}
          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-purple-200">
            <div>
              <div className="text-xs text-gray-600 mb-1">Russisch (Infinitiv)</div>
              <div className="font-medium text-gray-800">{russianWord}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Italienisch (Infinitivo)</div>
              <div className="font-medium text-gray-800">{italianWord}</div>
            </div>
          </div>

          {/* Präsens */}
          {(table.present.ru.length > 0 || table.present.it.length > 0) && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Präsens / Presente</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="mr-2">🇷🇺</span>
                  {table.present.ru[0] || '-'}
                  <span className="text-xs text-gray-500 ml-1">(я)</span>
                </div>
                <div>
                  <span className="mr-2">🇮🇹</span>
                  {table.present.it[0] || '-'}
                  <span className="text-xs text-gray-500 ml-1">(io)</span>
                </div>
              </div>
            </div>
          )}

          {/* Perfekt */}
          {(table.past.ru.length > 0 || table.past.it.length > 0) && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Perfekt / Passato Prossimo</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="mr-2">🇷🇺</span>
                  {table.past.ru[0] || '-'}
                </div>
                <div>
                  <span className="mr-2">🇮🇹</span>
                  {table.past.it[0] || '-'}
                </div>
              </div>
            </div>
          )}

          {/* Futur */}
          {(table.future.ru.length > 0 || table.future.it.length > 0) && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Futur / Futuro</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="mr-2">🇷🇺</span>
                  {table.future.ru[0] || '-'}
                </div>
                <div>
                  <span className="mr-2">🇮🇹</span>
                  {table.future.it[0] || '-'}
                </div>
              </div>
            </div>
          )}

          {/* Vollständige Tabelle Link */}
          {!showAll && (
            <button
              onClick={() => {
                setShowAll(true);
                loadConjugations();
              }}
              className="w-full text-sm text-purple-600 hover:text-purple-800 flex items-center justify-center gap-2 mt-3 py-2 border-t border-purple-200"
            >
              Vollständige Tabelle anzeigen
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
```

## User Stories

1. **Als Lerner** möchte ich Verb-Konjugationen sehen, um zu verstehen, wie Verben verwendet werden.

2. **Als Anfänger** möchte ich nur die wichtigsten Formen sehen, um nicht überfordert zu werden.

3. **Als Fortgeschrittener** möchte ich vollständige Konjugationstabellen abrufen können.

4. **Als visueller Lerner** möchte ich Konjugationen in beiden Sprachen parallel sehen.

## Akzeptanzkriterien

- [ ] Button "Konjugation" nur bei Verben angezeigt
- [ ] Kompakte Ansicht mit wichtigsten Formen
- [ ] Option für vollständige Tabelle
- [ ] Beide Sprachen parallel angezeigt
- [ ] Korrekte Konjugationen für reguläre und irreguläre Verben
- [ ] Schnelles Laden (< 500ms)
- [ ] Mobile-optimiert
- [ ] Kein Button bei Nicht-Verben

## Priorität
**Mittel** ⭐⭐

## Aufwand
- **Backend (Datenbank + Service)**: 2 Tage
- **Frontend (Component)**: 2 Tage
- **Content (Konjugationen sammeln)**: 10-15 Tage
- **Testing**: 1 Tag
- **Gesamt**: 5 Tage Development + erhebliche Content-Arbeit

## Abhängigkeiten
- Konjugationstabellen müssen erstellt werden
- Optional: API für automatische Konjugationen (Wiktionary, etc.)
- Verb-Erkennung muss funktionieren

## Risiken
- Hoher Aufwand für Content-Erstellung
- Konjugationen müssen korrekt sein (Qualitätskontrolle)
- Irreguläre Verben sind komplex
- Russische und italienische Grammatik ist umfangreich

## Alternativen

### API-Integration
```typescript
// Integration mit Wiktionary oder anderen APIs
async function fetchConjugations(verb: string, language: string) {
  const response = await fetch(
    `https://en.wiktionary.org/api/rest_v1/page/html/${verb}`
  );
  // Parse und extrahiere Konjugationen
}
```

### Reduzierter Scope
- Nur 1-2 wichtigste Formen anzeigen
- Keine vollständige Tabelle
- Link zu externen Konjugations-Tools

## Nächste Schritte
1. Datenbank-Migration
2. Service Layer
3. React Component
4. Verb-Detection verbessern
5. Content-Strategie (API vs. manuell)
6. Erste 20 häufigste Verben implementieren
7. User-Testing
