# Feature: Persönliche Notizen / Eselsbrücken

## Übersicht
Ermögliche Nutzern, eigene Notizen und Merkhilfen zu schwierigen Wörtern hinzuzufügen. Persönliche Verbindungen verbessern die Merkfähigkeit erheblich.

## Motivation
- Jeder lernt anders und hat eigene Assoziationen
- Persönliche Eselsbrücken sind effektiver als generische
- Eigene Notizen helfen bei schwierigen Wörtern
- Fördert aktives Lernen und Engagement
- Notizen können Verwechslungen verhindern

## Funktionsbeschreibung

### Hauptfunktionen

1. **Notiz hinzufügen**
   - Button "Notiz hinzufügen" auf Flashcard
   - Text-Editor öffnet sich
   - Speichern und Anzeigen der Notiz

2. **Notiz bearbeiten/löschen**
   - Bestehende Notizen editierbar
   - Löschen-Funktion mit Bestätigung
   - Versionierung optional

3. **Notiz-Typen**
   - **Eselsbrücke**: Merkhilfe (z.B. "klingt wie...")
   - **Verwechslung**: "Nicht verwechseln mit..."
   - **Grammatik**: Grammatikalische Hinweise
   - **Persönlich**: Eigene Assoziationen

4. **Notiz-Anzeige**
   - Icon zeigt an, dass Notiz vorhanden
   - Expandierbar/Kollabierbar
   - Dezent, stört nicht beim Lernen

### UI/UX Design

```
Ohne Notiz:
┌─────────────────────────────────────┐
│  дерево (derevo)                    │
│  [Substantiv]                       │
│                                     │
│  📝 Notiz hinzufügen                │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Ihre Antwort...               │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘

Mit Notiz:
┌─────────────────────────────────────┐
│  дерево (derevo)                    │
│  [Substantiv]                       │
│                                     │
│  💡 Meine Notiz (klicken)           │
│  ┌───────────────────────────────┐ │
│  │ 🧠 "Derevo klingt wie         │ │
│  │    'der Baum' auf Deutsch"    │ │
│  │                                │ │
│  │ ✏️ Bearbeiten  🗑️ Löschen     │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Ihre Antwort...               │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Datenbankschema

```sql
-- Neue Tabelle für persönliche Notizen
CREATE TABLE word_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  note_type VARCHAR(50) DEFAULT 'personal', -- personal, mnemonic, grammar, confusion
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ein User kann nur eine Notiz pro Wort haben
  UNIQUE(user_id, word_id)
);

-- Index für schnelle Abfragen
CREATE INDEX idx_word_notes_user_word ON word_notes(user_id, word_id);
CREATE INDEX idx_word_notes_type ON word_notes(note_type);

-- RLS Policy
ALTER TABLE word_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes"
  ON word_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON word_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON word_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON word_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_word_notes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER word_notes_updated_at
  BEFORE UPDATE ON word_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_word_notes_timestamp();
```

### TypeScript Types

```typescript
// src/types/wordNotes.ts

export type NoteType = 'personal' | 'mnemonic' | 'grammar' | 'confusion';

export interface WordNote {
  id: string;
  user_id: string;
  word_id: number;
  note_text: string;
  note_type: NoteType;
  created_at: string;
  updated_at: string;
}

export interface WordNoteInput {
  word_id: number;
  note_text: string;
  note_type?: NoteType;
}
```

### Service Layer

```typescript
// src/services/wordNoteService.ts

import { supabase } from '../lib/supabase';
import type { WordNote, WordNoteInput } from '../types/wordNotes';

export const wordNoteService = {
  async getNoteForWord(wordId: number): Promise<WordNote | null> {
    const { data, error } = await supabase
      .from('word_notes')
      .select('*')
      .eq('word_id', wordId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createNote(input: WordNoteInput): Promise<WordNote> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('word_notes')
      .insert({
        user_id: user.user.id,
        word_id: input.word_id,
        note_text: input.note_text,
        note_type: input.note_type || 'personal'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateNote(noteId: string, noteText: string, noteType?: NoteType): Promise<WordNote> {
    const { data, error } = await supabase
      .from('word_notes')
      .update({
        note_text: noteText,
        ...(noteType && { note_type: noteType })
      })
      .eq('id', noteId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteNote(noteId: string): Promise<void> {
    const { error } = await supabase
      .from('word_notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
  },

  async getUserNotesCount(): Promise<number> {
    const { count, error } = await supabase
      .from('word_notes')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  }
};
```

### React Component

```typescript
// src/components/WordNote.tsx

import React, { useState, useEffect } from 'react';
import { StickyNote, Edit2, Trash2, Save, X } from 'lucide-react';
import { wordNoteService } from '../services/wordNoteService';
import type { WordNote as WordNoteType, NoteType } from '../types/wordNotes';

interface WordNoteProps {
  wordId: number;
}

const noteTypeIcons: Record<NoteType, string> = {
  personal: '💭',
  mnemonic: '🧠',
  grammar: '📚',
  confusion: '⚠️'
};

const noteTypeLabels: Record<NoteType, string> = {
  personal: 'Persönlich',
  mnemonic: 'Eselsbrücke',
  grammar: 'Grammatik',
  confusion: 'Verwechslung'
};

export const WordNote: React.FC<WordNoteProps> = ({ wordId }) => {
  const [note, setNote] = useState<WordNoteType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editText, setEditText] = useState('');
  const [editType, setEditType] = useState<NoteType>('personal');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNote();
  }, [wordId]);

  const loadNote = async () => {
    try {
      const data = await wordNoteService.getNoteForWord(wordId);
      setNote(data);
      if (data) {
        setEditText(data.note_text);
        setEditType(data.note_type);
      }
    } catch (error) {
      console.error('Error loading note:', error);
    }
  };

  const handleSave = async () => {
    if (!editText.trim()) return;

    setLoading(true);
    try {
      if (note) {
        // Update existing note
        const updated = await wordNoteService.updateNote(note.id, editText, editType);
        setNote(updated);
      } else {
        // Create new note
        const created = await wordNoteService.createNote({
          word_id: wordId,
          note_text: editText,
          note_type: editType
        });
        setNote(created);
      }
      setIsEditing(false);
      setIsExpanded(true);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!note || !confirm('Notiz wirklich löschen?')) return;

    setLoading(true);
    try {
      await wordNoteService.deleteNote(note.id);
      setNote(null);
      setEditText('');
      setIsEditing(false);
    } catch (error) {
      console.error('Error deleting note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (note) {
      setEditText(note.note_text);
      setEditType(note.note_type);
    } else {
      setEditText('');
    }
  };

  // No note and not editing - show add button
  if (!note && !isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
      >
        <StickyNote className="w-4 h-4" />
        Notiz hinzufügen
      </button>
    );
  }

  // Editing mode
  if (isEditing) {
    return (
      <div className="my-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="mb-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Notiz-Typ
          </label>
          <select
            value={editType}
            onChange={(e) => setEditType(e.target.value as NoteType)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            {Object.entries(noteTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {noteTypeIcons[value as NoteType]} {label}
              </option>
            ))}
          </select>
        </div>

        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          placeholder="Ihre Notiz oder Eselsbrücke..."
          className="w-full text-sm border border-gray-300 rounded p-2 min-h-[80px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />

        <div className="flex gap-2 mt-2">
          <button
            onClick={handleSave}
            disabled={loading || !editText.trim()}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-3 h-3" />
            Speichern
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
          >
            <X className="w-3 h-3" />
            Abbrechen
          </button>
        </div>
      </div>
    );
  }

  // Display mode
  return (
    <div className="my-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
      >
        <span>{noteTypeIcons[note.note_type]}</span>
        <span>Meine Notiz {isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && note && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">
              {noteTypeLabels[note.note_type]}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-600 hover:text-blue-600"
                title="Bearbeiten"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={handleDelete}
                className="text-gray-600 hover:text-red-600"
                title="Löschen"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">
            {note.note_text}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Erstellt: {new Date(note.created_at).toLocaleDateString('de-DE')}
          </p>
        </div>
      )}
    </div>
  );
};
```

## User Stories

1. **Als Lerner** möchte ich meine eigenen Eselsbrücken speichern, damit ich schwierige Wörter besser merken kann.

2. **Als User** möchte ich Notizen zu Wörtern hinzufügen, die ich oft verwechsle, damit ich Fehler vermeide.

3. **Als fortgeschrittener Lerner** möchte ich grammatikalische Hinweise notieren, um Nuancen zu verstehen.

4. **Als visueller Lerner** möchte ich sehen können, welche Wörter Notizen haben, ohne sie öffnen zu müssen.

## Akzeptanzkriterien

- [ ] Button "Notiz hinzufügen" ist auf jeder Flashcard
- [ ] Text-Editor zum Schreiben der Notiz
- [ ] Notiz-Typen auswählbar (Persönlich, Eselsbrücke, Grammatik, Verwechslung)
- [ ] Notizen sind editierbar und löschbar
- [ ] Visueller Indikator wenn Notiz vorhanden
- [ ] Notizen sind kollabierbar (nicht immer sichtbar)
- [ ] Schnelles Speichern (< 500ms)
- [ ] Notizen werden pro User gespeichert (RLS)
- [ ] Mobile-optimiert

## Priorität
**Mittel** ⭐⭐

## Aufwand
- **Backend (Datenbank + Service)**: 1 Tag
- **Frontend (UI Component)**: 2 Tage
- **Integration in FlashCard**: 0.5 Tage
- **Testing**: 1 Tag
- **Gesamt**: 4-5 Tage

## Abhängigkeiten
- Keine kritischen Abhängigkeiten
- Optional: Rich Text Editor (z.B. TipTap) für formatierte Notizen

## Risiken
- Minimales Risiko
- Einfaches Feature mit klarem Scope

## Erweiterungen (Future)

### Rich Text Editor
- Fettschrift, Kursiv, Farben
- Bilder in Notizen
- Links zu externen Ressourcen

### Notizen teilen (Community)
- Nutzer können Notizen öffentlich teilen
- Andere können hilfreiche Notizen upvoten
- "Community-Eselsbrücken" Sektion

### AI-generierte Vorschläge
```typescript
// GPT-4 schlägt Eselsbrücken vor
async function suggestMnemonic(russianWord: string, italianWord: string) {
  const prompt = `Suggest a creative mnemonic to remember that the Russian word "${russianWord}" means "${italianWord}" in Italian.`;
  // AI Call...
}
```

### Export/Import
- Notizen als CSV/JSON exportieren
- Backup-Funktion
- Import von alten Notizen

## Nächste Schritte
1. Datenbank-Migration erstellen
2. Service Layer implementieren
3. React Component entwickeln
4. In FlashCard.tsx integrieren
5. User-Testing mit 5 Personen
6. Feedback einarbeiten
