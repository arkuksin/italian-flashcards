# Feature: Audio-Aussprache

## Übersicht
Russische und italienische Wörter von Muttersprachlern vorlesen lassen, um die richtige Aussprache zu lernen und das Hörverständnis zu verbessern.

## Motivation
- Aussprache ist ein fundamentaler Teil des Sprachenlernens
- Viele Lernende wissen nicht, wie Wörter korrekt ausgesprochen werden
- Audio-Feedback verbessert die Merkfähigkeit deutlich
- Hilft bei der Entwicklung eines authentischen Akzents

## Funktionsbeschreibung

### Hauptfunktionen
1. **Audio-Button neben jedem Wort**
   - Lautsprecher-Icon (🔊) klickbar
   - Spielt Audio-Datei oder nutzt Text-to-Speech API ab
   - Funktioniert für Frage- und Antwort-Wörter

2. **Automatische Wiedergabe** (optional)
   - Wort wird automatisch vorgelesen beim Anzeigen
   - Einstellbar in User-Präferenzen
   - Hilft bei passivem Lernen

3. **Verlangsamte Wiedergabe**
   - Zusätzlicher Button für langsame Wiedergabe
   - Hilft bei schwierigen Wörtern
   - Besonders nützlich für Anfänger

### Technische Umsetzung

#### Option A: Text-to-Speech API
```typescript
// Beispiel mit Web Speech API
const speak = (text: string, lang: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'ru' ? 'ru-RU' : 'it-IT';
  utterance.rate = 0.9; // Leicht verlangsamt
  speechSynthesis.speak(utterance);
};
```

**Vorteile:**
- Kostenlos
- Sofort verfügbar
- Keine Server-Kosten

**Nachteile:**
- Qualität variiert je nach Browser/OS
- Klingt manchmal roboterhaft
- Nicht immer perfekte Aussprache

#### Option B: Audio-Dateien
- Pre-recorded Audio von Muttersprachlern
- Höhere Qualität und natürliche Aussprache
- Erfordert Audio-Dateien für alle Wörter
- Kann mit Services wie Forvo API integriert werden

#### Option C: Cloud TTS Services
- Google Cloud Text-to-Speech
- Amazon Polly
- Microsoft Azure Speech

**Vorteile:**
- Sehr gute Qualität
- Natürlich klingende Stimmen
- Mehrere Stimmen verfügbar

**Nachteile:**
- Kostenpflichtig (aber günstig bei geringem Volumen)
- Benötigt API-Integration

### UI/UX Design

```
┌─────────────────────────────────┐
│  Russisches Wort      🔊 🐌     │
│  [categoria]                     │
│                                  │
│  ┌──────────────────────────┐  │
│  │  Ihre Antwort...         │  │
│  └──────────────────────────┘  │
│                                  │
│  Italienische Übersetzung  🔊 🐌 │
└─────────────────────────────────┘

🔊 = Normale Geschwindigkeit
🐌 = Langsame Wiedergabe
```

### Datenbankschema

```sql
-- Neue Spalten für words Tabelle (falls Audio-URLs)
ALTER TABLE words
ADD COLUMN audio_url_ru TEXT,
ADD COLUMN audio_url_it TEXT;

-- Oder: User-Präferenzen für Audio
ALTER TABLE user_preferences
ADD COLUMN auto_play_audio BOOLEAN DEFAULT false,
ADD COLUMN audio_speed NUMERIC DEFAULT 1.0;
```

### React Component Beispiel

```tsx
interface AudioButtonProps {
  text: string;
  language: 'ru' | 'it';
  speed?: number;
}

const AudioButton: React.FC<AudioButtonProps> = ({
  text,
  language,
  speed = 1.0
}) => {
  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'ru' ? 'ru-RU' : 'it-IT';
    utterance.rate = speed;
    speechSynthesis.speak(utterance);
  };

  return (
    <button
      onClick={speak}
      className="p-2 hover:bg-gray-100 rounded-full"
      aria-label={`Aussprache für ${text}`}
    >
      <Volume2 className="w-5 h-5" />
    </button>
  );
};
```

## User Stories

1. **Als Anfänger** möchte ich hören, wie Wörter ausgesprochen werden, damit ich sie richtig lernen kann.

2. **Als Fortgeschrittener** möchte ich meine Aussprache überprüfen können, um Fehler zu korrigieren.

3. **Als visueller Lerner** möchte ich Audio zusätzlich zum Text haben, um besser zu lernen.

## Akzeptanzkriterien

- [ ] Audio-Button ist bei jedem Wort sichtbar
- [ ] Klick auf Button spielt Audio ab
- [ ] Audio ist in korrekter Sprache (RU/IT)
- [ ] Audio funktioniert auf Desktop und Mobile
- [ ] Optional: Verlangsamte Wiedergabe verfügbar
- [ ] Optional: Auto-Play in Settings konfigurierbar
- [ ] Keine Verzögerung beim Abspielen
- [ ] Visuelles Feedback während Wiedergabe

## Priorität
**Hoch** ⭐⭐⭐

## Aufwand
- **Mit Web Speech API**: 2-3 Tage
- **Mit Cloud TTS**: 4-5 Tage
- **Mit pre-recorded Audio**: 7-10 Tage (+ Audio-Produktion)

## Abhängigkeiten
- Keine kritischen Abhängigkeiten
- Optional: Cloud TTS Account (Google/AWS/Azure)

## Risiken
- Browser-Kompatibilität bei Web Speech API
- Audio-Qualität könnte nicht allen Nutzern gefallen
- Kosten bei Cloud TTS Services

## Nächste Schritte
1. Entscheidung: Welche TTS-Lösung? (Empfehlung: Start mit Web Speech API)
2. Prototype erstellen
3. User-Testing mit 5-10 Personen
4. Implementation in FlashCard Component
5. Settings-Page erweitern für Audio-Präferenzen
