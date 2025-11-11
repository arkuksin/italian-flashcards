# Feature: Wort-Familien / Ähnliche Wörter

## Übersicht
Zeige verwandte Wörter zusammen, um Wortstämme und Ableitungen zu lernen. Hilft beim Aufbau eines größeren Wortschatzes durch Verbindungen.

## Motivation
- Wörter in Familien zu lernen ist effizienter als isoliert
- Verstehen von Wortstämmen hilft bei neuen Wörtern
- Zeigt Muster in der Sprache
- Erweitert Vokabular schneller
- Hilft bei der Unterscheidung ähnlicher Wörter

## Funktionsbeschreibung

### Hauptfunktionen

1. **Verwandte Wörter anzeigen**
   - Button "Verwandte Wörter"
   - Zeigt Wörter mit gleichem Stamm
   - Gruppiert nach Beziehungstyp

2. **Beziehungstypen**
   - **Gleicher Stamm**: дом → домашний → бездомный
   - **Synonyme**: говорить ↔ сказать
   - **Antonyme**: большой ↔ маленький
   - **Ableitungen**: учить → ученик → учитель
   - **Ähnliche Klänge**: (False Friends Warnung)

3. **Smart Suggestions**
   - Basierend auf bereits gelernten Wörtern
   - "Sie kennen schon X, lernen Sie auch Y"
   - Automatische Wortstamm-Erkennung

4. **Visuelle Verbindung**
   - Baumstruktur oder Netzwerk-Ansicht
   - Klickbar zu verwandten Wörtern
   - Mastery-Level angezeigt

### UI/UX Design

```
Flashcard mit verwandten Wörtern:
┌─────────────────────────────────────┐
│  дом (dom)                          │
│  [Substantiv]                       │
│                                     │
│  🔗 Verwandte Wörter (3)            │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Ihre Antwort...               │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘

Expandiert:
┌─────────────────────────────────────┐
│  дом (dom) - casa                   │
│  [Substantiv]                       │
│                                     │
│  🔗 Verwandte Wörter                │
│  ┌───────────────────────────────┐ │
│  │ 🏠 Gleicher Stamm:            │ │
│  │                                │ │
│  │ • домашний (häuslich)         │ │
│  │   casalingo                    │ │
│  │   ⭐⭐⭐ Level 3               │ │
│  │                                │ │
│  │ • бездомный (obdachlos)       │ │
│  │   senzatetto                   │ │
│  │   ⭐ Level 1                   │ │
│  │                                │ │
│  │ 💡 Tipp lernen:               │ │
│  │ [ + домик (Häuschen) ]         │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Datenbankschema

```sql
-- Neue Tabelle für Wort-Beziehungen
CREATE TABLE word_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
  related_word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL, -- 'same_root', 'synonym', 'antonym', 'derivative', 'similar_sound'
  relationship_strength INTEGER DEFAULT 5, -- 1-10, wie stark die Verbindung
  notes TEXT, -- Erklärung der Beziehung
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Verhindert Duplikate
  UNIQUE(word_id, related_word_id, relationship_type),
  -- Verhindert Selbst-Beziehungen
  CHECK(word_id != related_word_id)
);

-- Index
CREATE INDEX idx_word_relationships_word ON word_relationships(word_id);
CREATE INDEX idx_word_relationships_related ON word_relationships(related_word_id);
CREATE INDEX idx_word_relationships_type ON word_relationships(relationship_type);

-- Bidirektionale Beziehungen mit Trigger
CREATE OR REPLACE FUNCTION create_reverse_relationship()
RETURNS TRIGGER AS $$
BEGIN
  -- Erstelle automatisch die umgekehrte Beziehung (außer für gerichtete wie 'derivative')
  IF NEW.relationship_type IN ('same_root', 'synonym', 'antonym', 'similar_sound') THEN
    INSERT INTO word_relationships (word_id, related_word_id, relationship_type, relationship_strength, notes)
    VALUES (NEW.related_word_id, NEW.word_id, NEW.relationship_type, NEW.relationship_strength, NEW.notes)
    ON CONFLICT (word_id, related_word_id, relationship_type) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER word_relationships_bidirectional
  AFTER INSERT ON word_relationships
  FOR EACH ROW
  EXECUTE FUNCTION create_reverse_relationship();

-- Wortstamm-Spalte (optional, für Gruppierung)
ALTER TABLE words
ADD COLUMN word_root TEXT, -- z.B. "дом", "говор"
ADD COLUMN etymology TEXT; -- Etymologie-Informationen
```

### TypeScript Types

```typescript
// src/types/wordRelationships.ts

export type RelationshipType =
  | 'same_root'      // Gleicher Wortstamm
  | 'synonym'        // Synonym
  | 'antonym'        // Antonym
  | 'derivative'     // Ableitung
  | 'similar_sound'  // Ähnlicher Klang (False Friends)
  | 'compound';      // Zusammengesetztes Wort

export interface WordRelationship {
  id: string;
  word_id: number;
  related_word_id: number;
  relationship_type: RelationshipType;
  relationship_strength: number; // 1-10
  notes?: string;
  created_at: string;
}

export interface RelatedWord {
  word_id: number;
  russian: string;
  italian: string;
  category: string;
  relationship_type: RelationshipType;
  relationship_strength: number;
  notes?: string;
  mastery_level?: number; // Aus user progress
  is_learned: boolean;
}
```

### Service Layer

```typescript
// src/services/wordRelationshipService.ts

import { supabase } from '../lib/supabase';
import type { RelatedWord, RelationshipType } from '../types/wordRelationships';

export const wordRelationshipService = {
  async getRelatedWords(
    wordId: number,
    userId?: string
  ): Promise<RelatedWord[]> {
    // Query mit Join für related words + user progress
    const query = `
      SELECT
        w.id as word_id,
        w.russian,
        w.italian,
        w.category,
        wr.relationship_type,
        wr.relationship_strength,
        wr.notes,
        ${userId ? `
          wp.mastery_level,
          CASE WHEN wp.id IS NOT NULL THEN true ELSE false END as is_learned
        ` : `
          NULL as mastery_level,
          false as is_learned
        `}
      FROM word_relationships wr
      JOIN words w ON w.id = wr.related_word_id
      ${userId ? `
        LEFT JOIN word_progress wp ON wp.word_id = w.id AND wp.user_id = '${userId}'
      ` : ''}
      WHERE wr.word_id = ${wordId}
      ORDER BY wr.relationship_strength DESC, w.russian
    `;

    const { data, error } = await supabase.rpc('get_related_words_custom', {
      p_word_id: wordId,
      p_user_id: userId
    });

    if (error) throw error;
    return data || [];
  },

  groupByRelationshipType(relatedWords: RelatedWord[]): Record<RelationshipType, RelatedWord[]> {
    const grouped: any = {
      same_root: [],
      synonym: [],
      antonym: [],
      derivative: [],
      similar_sound: [],
      compound: []
    };

    relatedWords.forEach(word => {
      if (grouped[word.relationship_type]) {
        grouped[word.relationship_type].push(word);
      }
    });

    return grouped;
  },

  async suggestWordsToLearn(wordId: number, userId: string): Promise<RelatedWord[]> {
    // Finde verwandte Wörter die noch nicht gelernt wurden
    const relatedWords = await this.getRelatedWords(wordId, userId);
    return relatedWords.filter(w => !w.is_learned);
  },

  async addRelationship(
    wordId: number,
    relatedWordId: number,
    relationshipType: RelationshipType,
    strength: number = 5,
    notes?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('word_relationships')
      .insert({
        word_id: wordId,
        related_word_id: relatedWordId,
        relationship_type: relationshipType,
        relationship_strength: strength,
        notes
      });

    if (error) throw error;
  },

  async findWordsByRoot(root: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('word_root', root)
      .order('russian');

    if (error) throw error;
    return data || [];
  }
};
```

### React Component

```typescript
// src/components/RelatedWords.tsx

import React, { useState, useEffect } from 'react';
import { Link2, ChevronRight, Plus, AlertCircle } from 'lucide-react';
import { wordRelationshipService } from '../services/wordRelationshipService';
import { MasteryLevelBadge } from './MasteryLevelBadge';
import type { RelatedWord, RelationshipType } from '../types/wordRelationships';

interface RelatedWordsProps {
  wordId: number;
  userId?: string;
  onLearnWord?: (wordId: number) => void;
}

const relationshipLabels: Record<RelationshipType, { label: string; icon: string }> = {
  same_root: { label: 'Gleicher Stamm', icon: '🏠' },
  synonym: { label: 'Synonyme', icon: '🔄' },
  antonym: { label: 'Antonyme', icon: '↔️' },
  derivative: { label: 'Ableitungen', icon: '🌿' },
  similar_sound: { label: 'Ähnlicher Klang', icon: '⚠️' },
  compound: { label: 'Zusammengesetzt', icon: '🔗' }
};

export const RelatedWords: React.FC<RelatedWordsProps> = ({
  wordId,
  userId,
  onLearnWord
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [relatedWords, setRelatedWords] = useState<RelatedWord[]>([]);
  const [suggestions, setSuggestions] = useState<RelatedWord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isExpanded && relatedWords.length === 0) {
      loadRelatedWords();
    }
  }, [isExpanded]);

  const loadRelatedWords = async () => {
    try {
      setLoading(true);
      const words = await wordRelationshipService.getRelatedWords(wordId, userId);
      setRelatedWords(words);

      if (userId) {
        const toLearn = await wordRelationshipService.suggestWordsToLearn(wordId, userId);
        setSuggestions(toLearn);
      }
    } catch (error) {
      console.error('Error loading related words:', error);
    } finally {
      setLoading(false);
    }
  };

  if (relatedWords.length === 0 && !loading) {
    return null;
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
      >
        <Link2 className="w-4 h-4" />
        Verwandte Wörter ({relatedWords.length})
      </button>
    );
  }

  const grouped = wordRelationshipService.groupByRelationshipType(relatedWords);

  return (
    <div className="my-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <button
        onClick={() => setIsExpanded(false)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mb-3"
      >
        <Link2 className="w-4 h-4" />
        Verwandte Wörter ausblenden
      </button>

      {loading ? (
        <p className="text-sm text-gray-500">Lade verwandte Wörter...</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([type, words]) => {
            if (words.length === 0) return null;

            const { label, icon } = relationshipLabels[type as RelationshipType];

            return (
              <div key={type} className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{icon}</span>
                  <h4 className="text-sm font-semibold text-gray-800">{label}</h4>
                </div>

                <ul className="space-y-2">
                  {words.map((word) => (
                    <li
                      key={word.word_id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-800 font-medium">
                            {word.russian}
                          </span>
                          {word.is_learned && word.mastery_level !== undefined && (
                            <MasteryLevelBadge level={word.mastery_level} size="xs" />
                          )}
                        </div>
                        <div className="text-gray-600">{word.italian}</div>
                        {word.notes && (
                          <div className="text-xs text-gray-500 italic mt-1">
                            {word.notes}
                          </div>
                        )}
                      </div>

                      {!word.is_learned && onLearnWord && (
                        <button
                          onClick={() => onLearnWord(word.word_id)}
                          className="ml-2 p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Lernen"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* Lern-Vorschläge */}
          {suggestions.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <h4 className="text-sm font-semibold text-gray-800">
                  Empfohlen zum Lernen
                </h4>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Diese verwandten Wörter haben Sie noch nicht gelernt:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 3).map(word => (
                  <button
                    key={word.word_id}
                    onClick={() => onLearnWord?.(word.word_id)}
                    className="px-3 py-1 bg-white border border-yellow-300 rounded-full text-sm text-gray-800 hover:bg-yellow-100 flex items-center gap-1"
                  >
                    {word.russian}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

## User Stories

1. **Als Lerner** möchte ich verwandte Wörter sehen, um meinen Wortschatz schneller zu erweitern.

2. **Als User** möchte ich Wortstämme verstehen, um neue Wörter leichter zu erkennen.

3. **Als fortgeschrittener Lerner** möchte ich Synonyme und Antonyme kennen, um nuancierter zu sprechen.

4. **Als motivierter Lerner** möchte ich Vorschläge für verwandte Wörter erhalten, die ich noch lernen könnte.

## Akzeptanzkriterien

- [ ] Verwandte Wörter werden angezeigt
- [ ] Gruppierung nach Beziehungstyp
- [ ] Mastery-Level angezeigt (falls gelernt)
- [ ] Vorschläge für noch nicht gelernte verwandte Wörter
- [ ] Bidirektionale Beziehungen funktionieren
- [ ] Schnelles Laden (< 500ms)
- [ ] Mobile-optimiert
- [ ] Keine Anzeige wenn keine verwandten Wörter

## Priorität
**Niedrig** ⭐

## Aufwand
- **Backend (Datenbank + Service)**: 3 Tage
- **Frontend (Component)**: 2 Tage
- **Content (Beziehungen definieren)**: 15-20 Tage
- **Testing**: 1 Tag
- **Gesamt**: 6 Tage Development + erhebliche Content-Arbeit

## Abhängigkeiten
- Wort-Beziehungen müssen definiert werden
- Wortstamm-Analyse (manuell oder automatisch)
- Optional: NLP für automatische Erkennung

## Risiken
- Sehr hoher Content-Aufwand
- Linguistische Expertise erforderlich
- Komplexität der Beziehungen
- Qualitätssicherung schwierig

## Alternativen

### Automatische Wortstamm-Erkennung
```typescript
// Einfacher Algorithmus für Russisch
function extractRoot(word: string): string {
  // Entferne bekannte Suffixe/Präfixe
  // Sehr vereinfacht!
  const prefixes = ['без', 'не', 'пре', 'при'];
  const suffixes = ['ный', 'ость', 'тель', 'ник'];

  let root = word;
  // ... Logik
  return root;
}
```

### NLP/AI-gestützt
- Nutze Word Embeddings (Word2Vec)
- Finde semantisch ähnliche Wörter
- Automatische Clustering

### Externer Dienst
- Wiktionary API
- WordNet
- Spezialisierte Linguistik-Datenbanken

## Nächste Schritte
1. Datenbank-Migration
2. Service Layer
3. React Component
4. Content-Strategie definieren
5. Erste 20 Wort-Familien manuell erstellen
6. Feedback sammeln
7. Skalierungs-Strategie entwickeln
