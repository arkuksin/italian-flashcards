# OAuth Troubleshooting Guide - Base URL Fix

## Problem

Wenn du beim Google OAuth Login den Fehler siehst:
```
The server is configured with a public base URL of /italian-flashcards/ -
did you mean to visit /italian-flashcards/auth/callback instead?
```

Das bedeutet, dass Vite die falsche Base URL für die lokale Entwicklung verwendet hat.

## Lösung

✅ **Die Vite Config wurde bereits korrigiert!**

Die Änderung in `vite.config.ts`:

**Vorher:**
```typescript
base: process.env.VERCEL ? '/' : '/italian-flashcards/',
```

**Nachher:**
```typescript
base: mode === 'development' || process.env.VERCEL ? '/' : '/italian-flashcards/',
```

Diese Änderung stellt sicher, dass:
- Im **Development Mode** (`npm run dev`): Base URL = `/`
- Auf **Vercel**: Base URL = `/`
- Für **GitHub Pages Build**: Base URL = `/italian-flashcards/`

## Nächste Schritte

### 1. Stoppe den Dev Server

Drücke `Ctrl+C` im Terminal, wo `npm run dev` läuft.

### 2. Starte den Dev Server neu

```bash
npm run dev
```

### 3. Teste den Google OAuth Flow erneut

1. Öffne `http://localhost:5173` im Browser
2. Du solltest die Login-Seite sehen
3. Klicke auf **"Sign in with Google"**
4. Google Consent Screen öffnet sich
5. Wähle deinen Google Account
6. Nach Autorisierung wirst du zu `http://localhost:5173/auth/callback` weitergeleitet
7. Du solltest automatisch zum Dashboard (`http://localhost:5173/`) weitergeleitet werden
8. Dein Profil sollte im Header (oben rechts) erscheinen

### 4. Wenn es immer noch nicht funktioniert

Überprüfe die Google Cloud Console OAuth-Konfiguration:

**Autorisierte JavaScript-Ursprünge:**
- `http://localhost:5173`
- `https://gjftooyqkmijlvqbkwdr.supabase.co`

**Autorisierte Redirect-URIs:**
- `http://localhost:5173/auth/callback` ← **Wichtig für lokale Entwicklung!**
- `https://gjftooyqkmijlvqbkwdr.supabase.co/auth/v1/callback` ← **Wichtig für Supabase!**

Wenn `http://localhost:5173/auth/callback` fehlt, füge es hinzu:

1. Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
2. Wähle dein Projekt: "Italian Flashcards"
3. Gehe zu **APIs & Services** → **Credentials**
4. Klicke auf deinen OAuth 2.0 Client: "Italian Flashcards Web Client"
5. Unter **Autorisierte Redirect-URIs** klicke **"+ URI HINZUFÜGEN"**
6. Füge hinzu: `http://localhost:5173/auth/callback`
7. Klicke **"SPEICHERN"**
8. Warte 1-2 Minuten, bis die Änderungen wirksam sind
9. Versuche den Login erneut

## Browser Cache löschen

Manchmal hilft es, den Browser-Cache zu löschen:

**Chrome/Edge:**
1. Drücke `F12` um DevTools zu öffnen
2. Rechtsklick auf den Reload-Button
3. Wähle **"Leeren Cache und harte Aktualisierung"**

**Firefox:**
1. Drücke `Ctrl+Shift+Delete`
2. Wähle "Cache"
3. Klicke "Jetzt löschen"

## Erwartetes Verhalten nach dem Fix

✅ URL beim Login: `http://localhost:5173/login`
✅ OAuth Redirect: `http://localhost:5173/auth/callback`
✅ Nach Login: `http://localhost:5173/` (Dashboard)
✅ Keine `/italian-flashcards/` im Pfad bei lokaler Entwicklung

## Debugging

Wenn es immer noch Probleme gibt, öffne die Browser Console (`F12`) und prüfe:

1. **Netzwerk-Tab**: Suche nach fehlgeschlagenen Requests
2. **Console-Tab**: Suche nach Error-Messages
3. **Application-Tab** → **Local Storage**: Prüfe ob `supabase.auth.token` vorhanden ist

Typische Fehlermeldungen und was sie bedeuten:

| Fehler | Ursache | Lösung |
|--------|---------|--------|
| "Redirect URI mismatch" | Google OAuth Redirect URI fehlt | Füge `http://localhost:5173/auth/callback` in Google Console hinzu |
| "No session found" | Session wurde nicht erstellt | Prüfe Supabase Dashboard → Auth → Logs |
| "CORS error" | Browser blockiert Request | Prüfe ob Supabase URL korrekt ist |
| "Failed to fetch" | Netzwerkproblem | Prüfe Internetverbindung |

## Weitere Hilfe

Wenn das Problem weiterhin besteht:

1. Prüfe die vollständige Dokumentation: `docs/GOOGLE_OAUTH_SETUP.md`
2. Prüfe Supabase Dashboard → Authentication → Logs
3. Prüfe ob die Environment Variables korrekt sind (`.env` Datei)

---

**Wichtig:** Nach jeder Änderung an `vite.config.ts` musst du den Dev Server neu starten!
