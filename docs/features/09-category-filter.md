# Feature: Kategorie-Filter beim Lernen

## Übersicht
Ermöglicht Nutzern, nur bestimmte Kategorien zu üben. Fokussiertes Lernen nach Thema (z.B. nur "Essen" oder "Reisen" Wörter).

## Motivation
- Thematisches Lernen ist effektiver
- User können sich auf relevante Bereiche fokussieren
- Vorbereitung für spezifische Situationen (z.B. Reise)
- Reduziert kognitive Last durch Kontext
- Ermöglicht gezielte Wiederholung

## Funktionsbeschreibung

### Hauptfunktionen

1. **Kategorie-Auswahl**
   - Multi-Select auf Mode Selection Screen
   - Alle Kategorien anzeigen mit Wort-Anzahl
   - "Alle auswählen" / "Keine" Buttons
   - Gespeicherte Präferenzen

2. **Filter während Session**
   - Dropdown oder Tag-System
   - Schneller Wechsel zwischen Kategorien
   - Zeige Fortschritt pro Kategorie
   - Reset-Option

3. **Smart Suggestions**
   - "Kategorie mit niedrigster Accuracy"
   - "Kategorien mit fälligen Wörtern"
   - Thematische Recommendations

4. **Kategorie-Statistiken**
   - Wörter gelernt pro Kategorie
   - Accuracy pro Kategorie
   - Mastery-Verteilung

### UI/UX Design

```
Mode Selection mit Kategorie-Filter:
┌─────────────────────────────────────┐
│  🌍 Lernrichtung wählen             │
│                                     │
│  [ 🇷🇺 → 🇮🇹 Russisch zu Italienisch ] │
│  [ 🇮🇹 → 🇷🇺 Italienisch zu Russisch ] │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  🏷️ Kategorien filtern (optional)   │
│                                     │
│  [ Alle ] [ Keine ]                 │
│                                     │
│  ☑ Essen (45 Wörter)                │
│  ☑ Reisen (38 Wörter)               │
│  ☐ Familie (22 Wörter)              │
│  ☑ Wetter (15 Wörter)               │
│  ☐ Gesundheit (28 Wörter)           │
│  ☐ Arbeit (31 Wörter)               │
│  ☐ Verben (89 Wörter)               │
│                                     │
│  💡 Empfehlung:                     │
│  "Gesundheit" hat niedrigste        │
│  Accuracy (42%)                     │
│                                     │
│  [ 🎯 Mit Filter starten ]          │
│  [ ✨ Alle Kategorien ]             │
└─────────────────────────────────────┘

Während der Session:
┌─────────────────────────────────────┐
│  🏷️ Essen, Reisen  [Ändern ▼]      │
│  ━━━━━━━━━━━━░░░░░░░  15/98        │
│                                     │
│  яблоко                             │
│  [Essen] 🍎                         │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Ihre Antwort...               │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Datenbankschema

```sql
-- Kategorien sind bereits in words.category
-- Neue Tabelle für User Präferenzen

CREATE TABLE user_category_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  is_selected BOOLEAN DEFAULT true, -- Für default Auswahl
  priority INTEGER DEFAULT 5, -- 1-10, für Sortierung/Empfehlungen
  last_practiced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, category)
);

-- Index
CREATE INDEX idx_user_cat_pref_user ON user_category_preferences(user_id);
CREATE INDEX idx_user_cat_pref_selected ON user_category_preferences(user_id, is_selected);

-- RLS
ALTER TABLE user_category_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own category preferences"
  ON user_category_preferences
  FOR ALL
  USING (auth.uid() = user_id);

-- View: Kategorie-Statistiken
CREATE OR REPLACE VIEW v_category_statistics AS
SELECT
  w.category,
  COUNT(DISTINCT w.id) as total_words,
  COUNT(DISTINCT wp.word_id) as learned_words,
  ROUND(AVG(
    CASE
      WHEN wp.correct_count + wp.wrong_count > 0
      THEN wp.correct_count::NUMERIC / (wp.correct_count + wp.wrong_count)
      ELSE NULL
    END
  ) * 100, 2) as avg_accuracy,
  ROUND(AVG(wp.mastery_level), 2) as avg_mastery_level
FROM words w
LEFT JOIN word_progress wp ON wp.word_id = w.id
GROUP BY w.category;

-- Function: Get Words für selected Categories
CREATE OR REPLACE FUNCTION get_words_by_categories(
  p_user_id UUID,
  p_categories TEXT[],
  p_learning_direction TEXT DEFAULT 'ru-it'
)
RETURNS TABLE (
  id INTEGER,
  russian TEXT,
  italian TEXT,
  category TEXT,
  mastery_level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.russian,
    w.italian,
    w.category,
    COALESCE(wp.mastery_level, 0) as mastery_level
  FROM words w
  LEFT JOIN word_progress wp ON wp.word_id = w.id AND wp.user_id = p_user_id
  WHERE
    w.category = ANY(p_categories)
  ORDER BY RANDOM();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### TypeScript Types

```typescript
// src/types/categories.ts

export interface CategoryInfo {
  name: string;
  totalWords: number;
  learnedWords: number;
  avgAccuracy: number;
  avgMasteryLevel: number;
}

export interface CategoryPreference {
  id: string;
  user_id: string;
  category: string;
  is_selected: boolean;
  priority: number;
  last_practiced?: string;
}

export interface CategoryFilter {
  selectedCategories: string[];
  excludedCategories: string[];
}
```

### Service Layer

```typescript
// src/services/categoryService.ts

import { supabase } from '../lib/supabase';
import type { CategoryInfo, CategoryPreference } from '../types/categories';

export const categoryService = {
  async getAllCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('words')
      .select('category')
      .order('category');

    if (error) throw error;

    // Get unique categories
    const categories = [...new Set(data?.map(w => w.category) || [])];
    return categories.sort();
  },

  async getCategoryStatistics(userId?: string): Promise<CategoryInfo[]> {
    let query = supabase
      .from('v_category_statistics')
      .select('*')
      .order('category');

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getUserCategoryPreferences(userId: string): Promise<CategoryPreference[]> {
    const { data, error } = await supabase
      .from('user_category_preferences')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateCategoryPreferences(
    userId: string,
    category: string,
    isSelected: boolean
  ): Promise<void> {
    const { error } = await supabase
      .from('user_category_preferences')
      .upsert({
        user_id: userId,
        category,
        is_selected: isSelected
      }, {
        onConflict: 'user_id,category'
      });

    if (error) throw error;
  },

  async bulkUpdatePreferences(
    userId: string,
    selections: Record<string, boolean>
  ): Promise<void> {
    const updates = Object.entries(selections).map(([category, isSelected]) => ({
      user_id: userId,
      category,
      is_selected: isSelected
    }));

    const { error } = await supabase
      .from('user_category_preferences')
      .upsert(updates, {
        onConflict: 'user_id,category'
      });

    if (error) throw error;
  },

  async getSelectedCategories(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_category_preferences')
      .select('category')
      .eq('user_id', userId)
      .eq('is_selected', true);

    if (error) throw error;

    if (!data || data.length === 0) {
      // Default: alle Kategorien
      return await this.getAllCategories();
    }

    return data.map(d => d.category);
  },

  async getWordsByCategories(
    userId: string,
    categories: string[]
  ): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_words_by_categories', {
      p_user_id: userId,
      p_categories: categories
    });

    if (error) throw error;
    return data || [];
  },

  async getSuggestedCategory(userId: string): Promise<string | null> {
    // Finde Kategorie mit niedrigster Accuracy
    const stats = await this.getCategoryStatistics(userId);
    const sorted = stats
      .filter(s => s.learnedWords > 0)
      .sort((a, b) => a.avgAccuracy - b.avgAccuracy);

    return sorted[0]?.name || null;
  }
};
```

### React Component

```typescript
// src/components/CategoryFilter.tsx

import React, { useState, useEffect } from 'react';
import { Tag, Check, AlertCircle } from 'lucide-react';
import { categoryService } from '../services/categoryService';
import type { CategoryInfo } from '../types/categories';

interface CategoryFilterProps {
  userId: string;
  onSelectionChange: (categories: string[]) => void;
  initialSelection?: string[];
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  userId,
  onSelectionChange,
  initialSelection = []
}) => {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelection));
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const [stats, savedSelection, suggested] = await Promise.all([
        categoryService.getCategoryStatistics(userId),
        categoryService.getSelectedCategories(userId),
        categoryService.getSuggestedCategory(userId)
      ]);

      setCategories(stats);
      setSelected(new Set(initialSelection.length > 0 ? initialSelection : savedSelection));
      setSuggestion(suggested);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (category: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(category)) {
      newSelected.delete(category);
    } else {
      newSelected.add(category);
    }
    setSelected(newSelected);
    onSelectionChange(Array.from(newSelected));
  };

  const handleSelectAll = () => {
    const all = new Set(categories.map(c => c.name));
    setSelected(all);
    onSelectionChange(Array.from(all));
  };

  const handleSelectNone = () => {
    setSelected(new Set());
    onSelectionChange([]);
  };

  const handleSavePreferences = async () => {
    try {
      const selections: Record<string, boolean> = {};
      categories.forEach(cat => {
        selections[cat.name] = selected.has(cat.name);
      });
      await categoryService.bulkUpdatePreferences(userId, selections);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Lade Kategorien...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Kategorien filtern</h3>
          <span className="text-xs text-gray-500">
            ({selected.size} ausgewählt)
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
          >
            Alle
          </button>
          <button
            onClick={handleSelectNone}
            className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
          >
            Keine
          </button>
        </div>
      </div>

      {suggestion && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="flex-1 text-sm">
              <span className="font-medium text-gray-800">Empfehlung: </span>
              <span className="text-gray-700">
                "{suggestion}" hat niedrigste Accuracy
              </span>
              <button
                onClick={() => handleToggle(suggestion)}
                className="ml-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                {selected.has(suggestion) ? '✓ Ausgewählt' : '+ Auswählen'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
        {categories.map(category => (
          <label
            key={category.name}
            className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
              selected.has(category.name)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.has(category.name)}
              onChange={() => handleToggle(category.name)}
              className="mt-1 w-5 h-5 text-blue-600 rounded"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800 truncate">
                {category.name}
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>{category.totalWords} Wörter</div>
                {category.learnedWords > 0 && (
                  <>
                    <div>
                      {category.learnedWords} gelernt
                      {category.avgAccuracy > 0 && (
                        <span className="ml-1">
                          ({category.avgAccuracy.toFixed(0)}% Accuracy)
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            {selected.has(category.name) && (
              <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
            )}
          </label>
        ))}
      </div>

      <button
        onClick={handleSavePreferences}
        className="text-sm text-gray-600 hover:text-gray-800 underline"
      >
        Als Standard speichern
      </button>
    </div>
  );
};
```

## User Stories

1. **Als Lerner** möchte ich nur bestimmte Kategorien üben, um mich auf relevante Themen zu fokussieren.

2. **Als Reisender** möchte ich vor einer Reise nur "Reisen" und "Essen" Vokabeln wiederholen.

3. **Als User** möchte ich meine Kategorie-Präferenzen speichern, damit ich sie nicht jedes Mal neu auswählen muss.

4. **Als fortgeschrittener Lerner** möchte ich sehen, welche Kategorien ich noch verbessern muss.

## Akzeptanzkriterien

- [ ] Multi-Select Kategorie-Auswahl
- [ ] Wort-Anzahl pro Kategorie angezeigt
- [ ] Statistiken (Accuracy, gelernte Wörter) sichtbar
- [ ] "Alle" und "Keine" Schnellauswahl
- [ ] Präferenzen werden gespeichert
- [ ] Smart Suggestions basierend auf Performance
- [ ] Filter während Session änderbar
- [ ] Responsive Design

## Priorität
**Mittel** ⭐⭐

## Aufwand
- **Backend (Datenbank + Service)**: 2 Tage
- **Frontend (Filter Component)**: 2 Tage
- **Integration in Mode Selection**: 1 Tag
- **Testing**: 1 Tag
- **Gesamt**: 6 Tage

## Abhängigkeiten
- Kategorien müssen gut definiert sein
- word_progress Daten für Statistiken

## Risiken
- Zu viele Kategorien könnten UI überladen
- Empty State wenn keine Kategorie ausgewählt
- Performance bei vielen Kategorien

## Erweiterungen (Future)

### Custom Kategorien
- User kann eigene Kategorien erstellen
- Wörter zu custom Kategorien hinzufügen
- Tags statt fester Kategorien

### Thematische Sammlungen
- Vordefinierte "Reise Pack", "Business Pack"
- Kurierte Wortlisten
- Community-erstellte Sammlungen

## Nächste Schritte
1. Datenbank-Migration
2. Service Layer
3. CategoryFilter Component
4. Integration in ModeSelection
5. Statistiken Dashboard
6. User-Testing
7. Performance-Optimierung
