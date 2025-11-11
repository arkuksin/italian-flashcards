# Feature: Wort-Bilder / Visuelle Assoziationen

## Übersicht
Zeige Bilder zu Wörtern an, um visuelles Lernen zu unterstützen und die Merkfähigkeit durch Bilder zu verbessern.

## Motivation
- Menschen merken sich Bilder besser als Text (Bildüberlegenheitseffekt)
- Visuelles Lernen spricht andere Gehirnbereiche an
- Konkrete Substantive (Hund, Haus, Apfel) profitieren stark
- Macht das Lernen lebendiger und interessanter
- Hilft bei direkter Assoziation ohne Übersetzung

## Funktionsbeschreibung

### Hauptfunktionen

1. **Bild-Anzeige auf Flashcard**
   - Optional anzeigbar per Toggle
   - Kleine Thumbnail-Ansicht oder Full-Size
   - Nur für Wörter wo Bild sinnvoll (Substantive)

2. **Bild-Quellen**
   - Kuratierte Bilder-Datenbank
   - API-Integration (Unsplash, Pexels)
   - User-Upload (optional)
   - AI-generierte Bilder (DALL-E, Midjourney)

3. **Bild nur nach Antwort** (optional)
   - Erst antworten, dann Bild als Bestätigung
   - Vermeidet "cheating" durch Bildhinweis
   - Verstärkt Lernen durch visuelles Feedback

### UI/UX Design

```
Mit Bild:
┌─────────────────────────────────────┐
│  ┌─────────┐                        │
│  │  🍎     │  яблоко (yabloko)      │
│  │ [Image]│  [Obst]                 │
│  └─────────┘                        │
│                                     │
│  🖼️ Bild ausblenden                 │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Ihre Antwort...               │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘

Settings:
┌─────────────────────────────────────┐
│  Visuelles Lernen                   │
│                                     │
│  ☑ Bilder anzeigen                  │
│                                     │
│  Wann zeigen:                       │
│  ○ Immer                            │
│  ● Nur nach Antwort                 │
│  ○ Nie                              │
│                                     │
│  Bildgröße:                         │
│  ○ Klein  ● Mittel  ○ Groß         │
└─────────────────────────────────────┘
```

### Datenbankschema

```sql
-- Neue Tabelle für Bilder
CREATE TABLE word_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT, -- Kleinere Version für Performance
  source VARCHAR(50), -- 'unsplash', 'pexels', 'custom', 'ai'
  source_attribution TEXT, -- Copyright/Credit Info
  alt_text TEXT, -- Accessibility
  is_primary BOOLEAN DEFAULT true, -- Haupt-Bild für das Wort
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(word_id, image_url)
);

-- Index
CREATE INDEX idx_word_images_word_id ON word_images(word_id);
CREATE INDEX idx_word_images_primary ON word_images(word_id, is_primary);

-- User Präferenzen für Bilder
ALTER TABLE user_preferences
ADD COLUMN show_images BOOLEAN DEFAULT true,
ADD COLUMN image_timing VARCHAR(20) DEFAULT 'always', -- 'always', 'after_answer', 'never'
ADD COLUMN image_size VARCHAR(20) DEFAULT 'medium'; -- 'small', 'medium', 'large'
```

### Service Layer

```typescript
// src/services/wordImageService.ts

interface WordImage {
  id: string;
  word_id: number;
  image_url: string;
  thumbnail_url?: string;
  source: 'unsplash' | 'pexels' | 'custom' | 'ai';
  source_attribution?: string;
  alt_text: string;
  is_primary: boolean;
}

export const wordImageService = {
  async getImageForWord(wordId: number): Promise<WordImage | null> {
    const { data, error } = await supabase
      .from('word_images')
      .select('*')
      .eq('word_id', wordId)
      .eq('is_primary', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async searchUnsplashImage(query: string): Promise<string | null> {
    // Unsplash API Integration
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${query}&per_page=1`,
      {
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
        }
      }
    );

    const data = await response.json();
    return data.results?.[0]?.urls?.regular || null;
  },

  async assignImageToWord(
    wordId: number,
    imageUrl: string,
    source: WordImage['source'] = 'custom',
    altText?: string
  ): Promise<WordImage> {
    const { data, error } = await supabase
      .from('word_images')
      .insert({
        word_id: wordId,
        image_url: imageUrl,
        source,
        alt_text: altText || `Image for word ${wordId}`,
        is_primary: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async bulkAssignImages(words: Array<{ id: number; italian: string }>) {
    // Batch-Prozess um Bilder für viele Wörter zu finden
    const results = [];

    for (const word of words) {
      try {
        const imageUrl = await this.searchUnsplashImage(word.italian);
        if (imageUrl) {
          const assigned = await this.assignImageToWord(
            word.id,
            imageUrl,
            'unsplash',
            `Image of ${word.italian}`
          );
          results.push(assigned);
        }
      } catch (error) {
        console.error(`Failed to assign image for word ${word.id}:`, error);
      }

      // Rate limiting - warte zwischen Requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }
};
```

### React Component

```typescript
// src/components/WordImage.tsx

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import { wordImageService } from '../services/wordImageService';
import { useSettings } from '../hooks/useSettings';
import type { WordImage as WordImageType } from '../services/wordImageService';

interface WordImageProps {
  wordId: number;
  wordText: string;
  showAfterAnswer?: boolean; // Zeige erst nach Antwort
  hasAnswered?: boolean; // Hat User schon geantwortet?
}

export const WordImage: React.FC<WordImageProps> = ({
  wordId,
  wordText,
  showAfterAnswer = false,
  hasAnswered = false
}) => {
  const [image, setImage] = useState<WordImageType | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    loadImage();
  }, [wordId]);

  const loadImage = async () => {
    try {
      setLoading(true);
      setImageError(false);
      const data = await wordImageService.getImageForWord(wordId);
      setImage(data);
    } catch (error) {
      console.error('Error loading image:', error);
      setImageError(true);
    } finally {
      setLoading(false);
    }
  };

  // Prüfe ob Bild angezeigt werden soll
  const shouldShowImage = () => {
    if (!settings.show_images || !image) return false;
    if (settings.image_timing === 'never') return false;
    if (settings.image_timing === 'after_answer' && !hasAnswered) return false;
    return true;
  };

  if (loading) {
    return (
      <div className="w-32 h-32 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  if (imageError || !image || !shouldShowImage()) {
    return null;
  }

  const sizeClasses = {
    small: 'w-24 h-24',
    medium: 'w-32 h-32',
    large: 'w-48 h-48'
  };

  const imageSize = sizeClasses[settings.image_size || 'medium'];

  return (
    <div className="relative group">
      <img
        src={image.thumbnail_url || image.image_url}
        alt={image.alt_text || wordText}
        className={`${imageSize} object-cover rounded-lg border-2 border-gray-200 shadow-sm`}
        loading="lazy"
        onError={() => setImageError(true)}
      />

      {/* Attribution */}
      {image.source_attribution && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
          {image.source_attribution}
        </div>
      )}

      {/* Tooltip mit Wort */}
      <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
        {wordText}
      </div>
    </div>
  );
};
```

### Image Settings Component

```typescript
// src/components/settings/ImageSettings.tsx

import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';

export const ImageSettings: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <ImageIcon className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold">Visuelles Lernen</h3>
      </div>

      <div className="space-y-4">
        {/* Bilder aktivieren */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.show_images}
            onChange={(e) => updateSettings({ show_images: e.target.checked })}
            className="w-5 h-5 text-blue-600 rounded"
          />
          <span className="text-gray-800">Bilder anzeigen</span>
        </label>

        {/* Timing */}
        {settings.show_images && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wann zeigen:
              </label>
              <div className="space-y-2">
                {[
                  { value: 'always', label: 'Immer' },
                  { value: 'after_answer', label: 'Nur nach Antwort' },
                  { value: 'never', label: 'Nie' }
                ].map(option => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="image_timing"
                      value={option.value}
                      checked={settings.image_timing === option.value}
                      onChange={(e) => updateSettings({ image_timing: e.target.value })}
                      className="text-blue-600"
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Größe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bildgröße:
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'small', label: 'Klein' },
                  { value: 'medium', label: 'Mittel' },
                  { value: 'large', label: 'Groß' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => updateSettings({ image_size: option.value })}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      settings.image_size === option.value
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
```

## User Stories

1. **Als visueller Lerner** möchte ich Bilder zu Wörtern sehen, um sie besser zu merken.

2. **Als Anfänger** möchte ich direkte visuelle Assoziationen bilden, ohne durch meine Muttersprache zu übersetzen.

3. **Als User** möchte ich selbst entscheiden können, ob und wann Bilder angezeigt werden.

4. **Als Lerner von Substantiven** möchte ich konkrete Objekte visualisiert sehen.

## Akzeptanzkriterien

- [ ] Bilder werden zu passenden Wörtern angezeigt (primär Substantive)
- [ ] User kann Bilder in Settings aktivieren/deaktivieren
- [ ] Timing konfigurierbar (immer, nach Antwort, nie)
- [ ] Bildgröße anpassbar (klein, mittel, groß)
- [ ] Bilder laden performant (Thumbnails, Lazy Loading)
- [ ] Fallback wenn Bild nicht verfügbar
- [ ] Attribution für externe Bilder
- [ ] Accessibility (Alt-Text)
- [ ] Responsive Design

## Priorität
**Mittel** ⭐⭐

## Aufwand
- **Backend (Datenbank + API Integration)**: 2 Tage
- **Frontend (Component + Settings)**: 2 Tage
- **Content (Bilder sammeln/zuweisen)**: 5-10 Tage
- **Testing**: 1 Tag
- **Gesamt**: 5 Tage Development + Content-Arbeit

## Abhängigkeiten
- Bilder-Quelle (API-Keys für Unsplash/Pexels oder eigene Datenbank)
- Optional: Bildrechte klären
- Optional: CDN für Bild-Hosting

## Risiken
- Copyright/Lizenz-Probleme bei externen Bildern
- Große Datenmengen (Speicher/Bandbreite)
- Nicht alle Wörter haben sinnvolle Bilder (abstrakte Konzepte)
- Performance bei vielen Bildern

## Alternativen

### AI-generierte Bilder
```typescript
// DALL-E API für custom Bilder
async function generateImage(word: string) {
  const response = await openai.images.generate({
    prompt: `Simple, clear illustration of: ${word}`,
    n: 1,
    size: "256x256"
  });
  return response.data[0].url;
}
```

### Icon-basierte Lösung
- Statt Fotos: Icons/Illustrationen
- Leichter, konsistenter Stil
- Einfacher zu kuratieren
- Beispiel: Font Awesome, Material Icons

## Nächste Schritte
1. Entscheidung: Bildquelle (API vs. eigene vs. AI)
2. Datenbank-Migration
3. API-Integration (z.B. Unsplash)
4. React Components
5. Settings Integration
6. Bilder für Top 100 Wörter sammeln
7. User-Testing
