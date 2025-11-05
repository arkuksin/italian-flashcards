# Detaillierter Projektplan: React Flashcard App mit Backend-Integration

## 📊 Aktuelle Architektur-Analyse

### Bestehende Struktur
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **State Management**: Lokaler useState (nicht persistent)
- **Daten**: 300 statische russisch-italienische Wortpaare mit Kategorien
- **Storage**: Nur localStorage für Dark Mode
- **Deployment**: GitHub Pages
- **Fortschritt**: Geht bei Seitenreload verloren

### Erkannte Herausforderungen
- Kein persistenter Lernfortschritt
- Keine Benutzerverwaltung
- Statische Datenhaltung
- Fehlende Backup-/Sync-Funktionalität

---

## 🎯 Technologie-Empfehlungen

### Backend-as-a-Service: **Supabase** (Empfehlung)
**Vorteile:**
- PostgreSQL-Datenbank mit Row Level Security
- Eingebaute Authentication (Email, OAuth, Magic Links)
- Real-time Subscriptions
- Kostenloses Tier ausreichend für Prototyp
- TypeScript SDK
- Einfache Vercel-Integration

**Alternative:** Firebase (Google-Ökosystem, NoSQL)

### Authentication: **Supabase Auth** 
**Vorteile gegenüber Clerk:**
- Integriert in Backend-Lösung
- Kosteneffektiver
- Mehr Kontrolle über Daten
- GDPR-konform (EU-Server verfügbar)

---

## 📋 Schritt-für-Schritt-Projektplan

## Phase 1: Backend-Setup und Datenbank-Design

### 1.1 Supabase-Projekt erstellen
**ToDos:**
- [ ] Supabase-Account erstellen
- [ ] Neues Projekt anlegen
- [ ] Datenbank-URL und anon Key notieren
- [ ] RLS (Row Level Security) aktivieren

### 1.2 Datenbank-Schema erstellen
```sql
-- Benutzertabelle (wird automatisch durch Auth erstellt)
-- public.users wird von auth.users synchronisiert

-- Wörter-Tabelle
CREATE TABLE words (
  id SERIAL PRIMARY KEY,
  russian TEXT NOT NULL,
  italian TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Benutzer-Fortschritt
CREATE TABLE user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
  correct_count INTEGER DEFAULT 0,
  wrong_count INTEGER DEFAULT 0,
  last_practiced TIMESTAMPTZ DEFAULT NOW(),
  mastery_level INTEGER DEFAULT 0, -- 0-5 (Leitner System)
  UNIQUE(user_id, word_id)
);

-- Lernsessions
CREATE TABLE learning_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  words_studied INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  learning_direction TEXT -- 'ru-it' oder 'it-ru'
);

-- RLS Policies
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;

-- Policies für user_progress
CREATE POLICY "Users can only see own progress" ON user_progress
  FOR ALL USING (auth.uid() = user_id);

-- Policies für learning_sessions  
CREATE POLICY "Users can only see own sessions" ON learning_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Wörter sind für alle lesbar
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Words are viewable by everyone" ON words
  FOR SELECT USING (true);
```

### 1.3 Bestehende Wörter migrieren
```sql
-- Insert der 300 bestehenden Wörter
INSERT INTO words (id, russian, italian, category) VALUES
  (1, 'дом', 'casa', 'nouns'),
  (2, 'вода', 'acqua', 'nouns'),
  -- ... alle 300 Wörter
```

---

## Phase 2: Frontend-Anpassungen

### 2.1 Dependencies installieren
```bash
npm install @supabase/supabase-js
npm install @supabase/auth-ui-react @supabase/auth-ui-shared
npm install react-router-dom
npm install date-fns # für Datumsformatierung
```

### 2.2 Umgebungsvariablen einrichten
```typescript
// .env.local
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2.3 Supabase Client Setup
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types für bessere TypeScript-Integration
export type Database = {
  public: {
    Tables: {
      words: {
        Row: {
          id: number
          russian: string
          italian: string
          category: string
          created_at: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          word_id: number
          correct_count: number
          wrong_count: number
          last_practiced: string
          mastery_level: number
        }
        Insert: {
          user_id: string
          word_id: number
          correct_count?: number
          wrong_count?: number
          mastery_level?: number
        }
      }
    }
  }
}
```

### 2.4 Auth Context erstellen
```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {}
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={%raw%}{{ user, session, loading, signOut }}{%endraw%}>
      {children}
    </AuthContext.Provider>
  )
}
```

### 2.5 Protected Route Component
```typescript
// src/components/ProtectedRoute.tsx
import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LoginForm } from './auth/LoginForm'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return <>{children}</>
}
```

### 2.6 Login/Signup Components
```typescript
// src/components/auth/LoginForm.tsx
import React, { useState } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../../lib/supabase'

export const LoginForm: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Italian Flashcards
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Sign in to save your progress
          </p>
        </div>
        
        <Auth
          supabaseClient={supabase}
          appearance={%raw%}{{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#3b82f6',
                  brandAccent: '#1d4ed8',
                }
              }
            }
          }}{%endraw%}
          providers={['google', 'github']}
          redirectTo={window.location.origin}
        />
      </div>
    </div>
  )
}
```

---

## Phase 3: Fortschritts-System implementieren

### 3.1 Progress Hook erstellen
```typescript
// src/hooks/useProgress.ts
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface WordProgress {
  word_id: number
  correct_count: number
  wrong_count: number
  mastery_level: number
  last_practiced: string
}

export const useProgress = () => {
  const { user } = useAuth()
  const [progress, setProgress] = useState<Map<number, WordProgress>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadProgress()
    }
  }, [user])

  const loadProgress = async () => {
    if (!user) return
    
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error loading progress:', error)
      return
    }

    const progressMap = new Map()
    data?.forEach(item => {
      progressMap.set(item.word_id, item)
    })
    
    setProgress(progressMap)
    setLoading(false)
  }

  const updateProgress = async (wordId: number, correct: boolean) => {
    if (!user) return

    const currentProgress = progress.get(wordId)
    const newCorrectCount = currentProgress ? 
      (correct ? currentProgress.correct_count + 1 : currentProgress.correct_count) :
      (correct ? 1 : 0)
    
    const newWrongCount = currentProgress ?
      (!correct ? currentProgress.wrong_count + 1 : currentProgress.wrong_count) :
      (!correct ? 1 : 0)

    // Leitner System: Mastery Level basierend auf Erfolgsrate
    const totalAttempts = newCorrectCount + newWrongCount
    const successRate = totalAttempts > 0 ? newCorrectCount / totalAttempts : 0
    let masteryLevel = 0
    if (successRate >= 0.9 && totalAttempts >= 5) masteryLevel = 5
    else if (successRate >= 0.8 && totalAttempts >= 4) masteryLevel = 4
    else if (successRate >= 0.7 && totalAttempts >= 3) masteryLevel = 3
    else if (successRate >= 0.6 && totalAttempts >= 2) masteryLevel = 2
    else if (totalAttempts >= 1) masteryLevel = 1

    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: user.id,
        word_id: wordId,
        correct_count: newCorrectCount,
        wrong_count: newWrongCount,
        mastery_level: masteryLevel,
        last_practiced: new Date().toISOString()
      }, {
        onConflict: 'user_id,word_id'
      })

    if (error) {
      console.error('Error updating progress:', error)
      return
    }

    // Local state update
    const updatedProgress = new Map(progress)
    updatedProgress.set(wordId, {
      word_id: wordId,
      correct_count: newCorrectCount,
      wrong_count: newWrongCount,
      mastery_level: masteryLevel,
      last_practiced: new Date().toISOString()
    })
    setProgress(updatedProgress)
  }

  return {
    progress,
    loading,
    updateProgress,
    refreshProgress: loadProgress
  }
}
```

### 3.2 App.tsx für Auth anpassen
```typescript
// src/App.tsx (wichtige Änderungen)
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { BrowserRouter as Router } from 'react-router-dom'

function App() {
  return (
    <Router>
      <AuthProvider>
        <ProtectedRoute>
          <FlashCardApp />
        </ProtectedRoute>
      </AuthProvider>
    </Router>
  )
}

// Bisherige App-Logik in separate Komponente auslagern
const FlashCardApp: React.FC = () => {
  // Bestehende App-Logik hier
  // + Integration von useProgress Hook
}
```

---

## Phase 4: Vercel-Deployment

### 4.1 Vercel-Konfiguration
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 4.2 Environment Variables Setup
**In Vercel Dashboard:**
- `VITE_SUPABASE_URL`: Deine Supabase-Projekt-URL
- `VITE_SUPABASE_ANON_KEY`: Dein Supabase anon/public Key

### 4.3 Deployment-Checkliste
- [ ] GitHub-Repository mit Vercel verbinden
- [ ] Environment Variables setzen
- [ ] Custom Domain konfigurieren (optional)
- [ ] Supabase Auth Redirects anpassen:
  - Site URL: `https://your-app.vercel.app`
  - Redirect URLs: `https://your-app.vercel.app/**`

---

## Phase 5: Erweiterte Features

### 5.1 Spaced Repetition System
```typescript
// src/utils/spacedRepetition.ts
export const getNextReviewDate = (masteryLevel: number, lastReviewed: Date): Date => {
  const intervals = [1, 3, 7, 14, 30, 90] // Tage
  const interval = intervals[Math.min(masteryLevel, intervals.length - 1)]
  
  const nextReview = new Date(lastReviewed)
  nextReview.setDate(nextReview.getDate() + interval)
  
  return nextReview
}

export const getDueWords = (progress: Map<number, WordProgress>): number[] => {
  const now = new Date()
  const dueWords: number[] = []
  
  progress.forEach((wordProgress, wordId) => {
    const nextReview = getNextReviewDate(
      wordProgress.mastery_level, 
      new Date(wordProgress.last_practiced)
    )
    
    if (nextReview <= now) {
      dueWords.push(wordId)
    }
  })
  
  return dueWords
}
```

### 5.2 Statistiken Dashboard
```typescript
// src/components/Statistics.tsx
import { useProgress } from '../hooks/useProgress'
import { format } from 'date-fns'

export const Statistics: React.FC = () => {
  const { progress } = useProgress()
  
  const stats = Array.from(progress.values()).reduce((acc, curr) => {
    acc.totalStudied += curr.correct_count + curr.wrong_count
    acc.totalCorrect += curr.correct_count
    acc.masteredWords += curr.mastery_level >= 4 ? 1 : 0
    return acc
  }, { totalStudied: 0, totalCorrect: 0, masteredWords: 0 })
  
  const accuracy = stats.totalStudied > 0 ? 
    Math.round((stats.totalCorrect / stats.totalStudied) * 100) : 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Words Studied" value={progress.size} />
      <StatCard title="Total Answers" value={stats.totalStudied} />
      <StatCard title="Accuracy" value={`${accuracy}%`} />
      <StatCard title="Mastered Words" value={stats.masteredWords} />
    </div>
  )
}
```

### 5.3 Kategorie-Filter
```typescript
// src/components/CategoryFilter.tsx
export const CategoryFilter: React.FC<{
  selectedCategories: string[]
  onCategoryChange: (categories: string[]) => void
}> = ({ selectedCategories, onCategoryChange }) => {
  const categories = ['nouns', 'verbs', 'colors', 'family', 'numbers', 'time']
  
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {categories.map(category => (
        <button
          key={category}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            selectedCategories.includes(category)
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={%raw%}={() => {
            const newCategories = selectedCategories.includes(category)
              ? selectedCategories.filter(c => c !== category)
              : [...selectedCategories, category]
            onCategoryChange(newCategories)
          }}{%endraw%}
        >
          {category}
        </button>
      ))}
    </div>
  )
}
```

---

## 🚀 Optionale Erweiterungen

### Migration von lokalem Fortschritt
```typescript
// src/utils/migration.ts
export const migrateLocalProgress = async (user: any) => {
  // Lokalen Fortschritt aus localStorage lesen und in DB übertragen
  const localProgress = localStorage.getItem('learning_progress')
  if (localProgress && user) {
    const progress = JSON.parse(localProgress)
    // In Supabase übertragen...
    localStorage.removeItem('learning_progress') // Nach Migration löschen
  }
}
```

### PWA/Offline-Modus
```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/your-supabase-url\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
            },
          },
        ],
      },
    }),
  ],
})
```

---

## 📊 Projektphasen-Übersicht

| Phase | Zeitschätzung | Priorität | Status |
|-------|---------------|-----------|--------|
| 1: Backend-Setup | 1-2 Tage | Hoch | ⏳ |
| 2: Frontend-Auth | 2-3 Tage | Hoch | ⏳ |
| 3: Fortschritt-System | 2-3 Tage | Hoch | ⏳ |
| 4: Vercel-Deployment | 0.5 Tag | Mittel | ⏳ |
| 5: Erweiterte Features | 3-5 Tage | Niedrig | ⏳ |

## 🔐 Sicherheitsaspekte

### Row Level Security (RLS)
- Alle sensiblen Tabellen haben RLS aktiviert
- User können nur eigene Daten sehen/ändern
- Öffentliche Wörter-Tabelle read-only für alle

### Environment Variables
- Supabase Keys sicher in Vercel verwalten
- Anon Key ist öffentlich sichtbar (by design)
- Service Key niemals im Frontend verwenden

### Authentication
- Supabase Auth mit Email-Verifizierung
- Optional: OAuth mit Google/GitHub
- Session-basierte Authentifizierung

---

## 🎯 Nächste Schritte

1. **Sofort starten:** Supabase-Projekt anlegen und Datenbank-Schema erstellen
2. **Woche 1:** Auth-System implementieren und testen
3. **Woche 2:** Fortschritts-System entwickeln und Vercel-Deployment
4. **Woche 3+:** Erweiterte Features nach Bedarf

Dieser Plan bietet eine solide Grundlage für die Weiterentwicklung deiner Flashcard-App mit modernem Backend, sicherer Authentifizierung und skalierbarer Architektur.