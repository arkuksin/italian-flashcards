# Feature: Beispielsätze / Kontext

## Übersicht
Zeige Wörter in echten Sätzen, um zu verstehen, wie das Wort in der Praxis benutzt wird. Dies verbessert das Sprachverständnis erheblich.

## Motivation
- Wörter lernen ohne Kontext führt zu mechanischem Auswendiglernen
- Beispielsätze zeigen die praktische Verwendung
- Hilft bei Grammatik und Satzbau
- Verbessert die Merkfähigkeit durch Story/Kontext
- Macht das Lernen lebendiger und realistischer

## Funktionsbeschreibung

### Hauptfunktionen

1. **Beispielsatz anzeigen**
   - Button "Beispiel anzeigen" auf Flashcard
   - Expandiert und zeigt Satz in beiden Sprachen
   - Suchbegriff ist hervorgehoben

2. **Mehrere Beispiele**
   - 2-3 verschiedene Beispielsätze pro Wort
   - Zeigt verschiedene Verwendungsarten
   - Durchblätterbar mit Pfeilen

3. **Kontext-Level**
   - Einfache Sätze für Anfänger
   - Komplexere Sätze für Fortgeschrittene
   - Automatisch basierend auf User-Level

### UI/UX Design

```
┌─────────────────────────────────────┐
│  дом (dom)                          │
│  [Substantiv]                       │
│                                     │
│  📖 Beispiel anzeigen               │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Ihre Antwort...               │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘

Nach Klick:
┌─────────────────────────────────────┐
│  дом (dom)                          │
│  [Substantiv]                       │
│                                     │
│  📖 Beispiel ausblenden             │
│  ┌───────────────────────────────┐ │
│  │ 🇷🇺 Это мой дом.              │ │
│  │ 🇮🇹 Questa è la mia casa.     │ │
│  │                                │ │
│  │ ← 1/3 →                        │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Ihre Antwort...               │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Datenbankschema

```sql
-- Neue Tabelle für Beispielsätze
CREATE TABLE example_sentences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
  sentence_ru TEXT NOT NULL,
  sentence_it TEXT NOT NULL,
  difficulty_level INTEGER DEFAULT 1, -- 1=einfach, 2=mittel, 3=schwer
  usage_context TEXT, -- z.B. "formal", "informal", "idiom"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index für schnelle Abfragen
CREATE INDEX idx_example_sentences_word_id ON example_sentences(word_id);
CREATE INDEX idx_example_sentences_difficulty ON example_sentences(difficulty_level);

-- Beispiel-Daten
INSERT INTO example_sentences (word_id, sentence_ru, sentence_it, difficulty_level) VALUES
  (1, 'Это мой дом.', 'Questa è la mia casa.', 1),
  (1, 'Мы купили новый дом в центре города.', 'Abbiamo comprato una nuova casa in centro.', 2),
  (1, 'Дом, в котором я вырос, был очень старым.', 'La casa in cui sono cresciuto era molto vecchia.', 3);
```

### React Component

```tsx
interface ExampleSentence {
  id: string;
  sentence_ru: string;
  sentence_it: string;
  difficulty_level: number;
  usage_context?: string;
}

interface ExampleSentencesProps {
  wordId: number;
  currentWord: string;
  learningDirection: 'ru-it' | 'it-ru';
}

const ExampleSentences: React.FC<ExampleSentencesProps> = ({
  wordId,
  currentWord,
  learningDirection
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [examples, setExamples] = useState<ExampleSentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isExpanded && examples.length === 0) {
      fetchExamples();
    }
  }, [isExpanded]);

  const fetchExamples = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('example_sentences')
      .select('*')
      .eq('word_id', wordId)
      .order('difficulty_level', { ascending: true })
      .limit(3);

    if (data) setExamples(data);
    setLoading(false);
  };

  const highlightWord = (sentence: string, word: string) => {
    const regex = new RegExp(`(${word})`, 'gi');
    return sentence.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
      >
        <BookOpen className="w-4 h-4" />
        Beispiel anzeigen
      </button>
    );
  }

  const currentExample = examples[currentIndex];

  return (
    <div className="my-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <button
        onClick={() => setIsExpanded(false)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-3"
      >
        <BookOpen className="w-4 h-4" />
        Beispiel ausblenden
      </button>

      {loading ? (
        <p className="text-sm text-gray-500">Lade Beispiele...</p>
      ) : examples.length === 0 ? (
        <p className="text-sm text-gray-500">Keine Beispiele verfügbar</p>
      ) : (
        <>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="mr-2">🇷🇺</span>
              <span dangerouslySetInnerHTML={{
                __html: highlightWord(currentExample.sentence_ru, currentWord)
              }} />
            </p>
            <p className="text-sm">
              <span className="mr-2">🇮🇹</span>
              <span dangerouslySetInnerHTML={{
                __html: highlightWord(currentExample.sentence_it, currentWord)
              }} />
            </p>
          </div>

          {examples.length > 1 && (
            <div className="flex items-center justify-center gap-4 mt-3">
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="p-1 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-500">
                {currentIndex + 1}/{examples.length}
              </span>
              <button
                onClick={() => setCurrentIndex(Math.min(examples.length - 1, currentIndex + 1))}
                disabled={currentIndex === examples.length - 1}
                className="p-1 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
```

### Service Layer

```typescript
// src/services/exampleSentenceService.ts

export const exampleSentenceService = {
  async getExamplesForWord(
    wordId: number,
    userLevel?: number
  ): Promise<ExampleSentence[]> {
    const query = supabase
      .from('example_sentences')
      .select('*')
      .eq('word_id', wordId);

    // Filter nach User-Level falls vorhanden
    if (userLevel) {
      query.lte('difficulty_level', userLevel);
    }

    const { data, error } = await query
      .order('difficulty_level', { ascending: true })
      .limit(3);

    if (error) throw error;
    return data || [];
  },

  async addExampleSentence(
    wordId: number,
    sentenceRu: string,
    sentenceIt: string,
    difficultyLevel: number = 1,
    usageContext?: string
  ): Promise<ExampleSentence> {
    const { data, error } = await supabase
      .from('example_sentences')
      .insert({
        word_id: wordId,
        sentence_ru: sentenceRu,
        sentence_it: sentenceIt,
        difficulty_level: difficultyLevel,
        usage_context: usageContext
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
```

## User Stories

1. **Als Lerner** möchte ich Wörter im Kontext sehen, damit ich verstehe, wie sie benutzt werden.

2. **Als Anfänger** möchte ich einfache Beispielsätze sehen, damit ich nicht überfordert werde.

3. **Als Fortgeschrittener** möchte ich komplexere Sätze sehen, um mein Verständnis zu vertiefen.

4. **Als visueller Lerner** möchte ich das Wort im Satz hervorgehoben sehen, um es schnell zu finden.

## Akzeptanzkriterien

- [ ] Button "Beispiel anzeigen" ist auf jeder Flashcard
- [ ] Beispiele werden in beiden Sprachen angezeigt
- [ ] Suchbegriff ist visuell hervorgehoben (z.B. gelb markiert)
- [ ] Mehrere Beispiele sind durchblätterbar
- [ ] Beispiele werden basierend auf User-Level gefiltert
- [ ] Schnelles Laden der Beispiele (< 500ms)
- [ ] Responsive Design für Mobile
- [ ] Graceful Handling wenn keine Beispiele vorhanden

## Priorität
**Hoch** ⭐⭐⭐

## Aufwand
- **Backend (Datenbank + Service)**: 2 Tage
- **Frontend (UI Component)**: 2 Tage
- **Testing**: 1 Tag
- **Daten sammeln** (Beispielsätze für alle Wörter): 5-10 Tage (kann parallel laufen)
- **Gesamt**: 5 Tage Development + Content-Erstellung

## Abhängigkeiten
- Beispielsätze müssen erstellt/gesammelt werden
- Optional: GPT-4 API zur automatischen Generierung von Beispielsätzen

## Risiken
- Aufwand für Content-Erstellung ist hoch
- Qualität der Beispielsätze muss geprüft werden
- Übersetzungen müssen korrekt sein

## Alternativen & Erweiterungen

### Content-Generierung mit AI
```typescript
// Automatische Generierung mit OpenAI
async function generateExamples(word: string, language: 'ru' | 'it') {
  const prompt = `Generate 3 example sentences using the word "${word}" in ${language}.
  Provide sentences with different difficulty levels: easy, medium, hard.`;

  // OpenAI API Call
  // ...
}
```

### Integration mit externen Quellen
- Reverso Context API
- Tatoeba Sentence Database
- Wikipedia Extracts

## Nächste Schritte
1. Datenbank-Migration erstellen
2. Service Layer implementieren
3. React Component entwickeln
4. In FlashCard.tsx integrieren
5. Content-Strategie für Beispielsätze definieren
6. Erste 50 Wörter mit Beispielen ausstatten
7. User-Testing durchführen
