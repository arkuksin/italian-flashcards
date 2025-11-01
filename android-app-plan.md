# Plan: Android-App mit Supabase-Backend

## Ziel
- Die bestehende Wen-Anwendung bekommt eine Android-Version.
- Die App soll den gleichen Supabase-Account nutzen wie die Web-Version.
- Fokus: einfache erste Version für eigene Nutzung oder Tests.

## Voraussetzungen
- Computer mit Android Studio (kostenlos) und aktuellem Android SDK.
- Android-Gerät oder Emulator.
- Supabase-Projekt mit API-URL, `anon`-Key und den nötigen Tabellen (wie in der Web-App).
- Basiswissen in Java/Kotlin ist hilfreich, aber nicht zwingend. Wir setzen auf Kotlin, weil moderne Android-Apps so entstehen und es viele Beispiele gibt.

## Schritt 1: Android Studio vorbereiten
1. Android Studio von developer.android.com herunterladen und installieren.
2. Beim ersten Start das Standard-Setup akzeptieren (Emulator, SDK).
3. Testprojekt anlegen und einmal im Emulator starten, damit alles läuft.

## Schritt 2: Neues Projekt anlegen
1. In Android Studio `New > New Project`.
2. Vorlage `Empty Activity` wählen.
3. Projektnamen setzen (z. B. `ItalianFlashcardsApp`), Programmiersprache `Kotlin`.
4. Mindest-API-Level: `21 (Android 5.0)` oder höher.
5. Projekt bauen lassen (Gradle Sync).

## Schritt 3: Projektstruktur verstehen
- `app/src/main/java`: Kotlin-Code (`Activity`, `ViewModel`, Services).
- `app/src/main/res/layout`: UI-Layouts (XML) oder Jetpack Compose, wenn genutzt.
- `AndroidManifest.xml`: zentrale App-Konfiguration.
- Wir können Jetpack Compose nutzen (moderne UI). Wenn zu neu, Start mit klassischen Layouts.

## Schritt 4: Supabase in Android nutzen
1. In `build.gradle (Module)` die Supabase-Client-Bibliothek hinzufügen:
   ```kotlin
   implementation("io.supabase:supabase-kt:VERSION")
   implementation("io.ktor:ktor-client-android:VERSION")
   ```
   Aktuelle Versionsnummern auf GitHub/Docs prüfen (Internet nötig).
2. In einer `SupabaseClientFactory`-Klasse Singleton erstellen:
   ```kotlin
   val supabase = SupabaseClient(
       supabaseUrl = "https://..",
       supabaseKey = "PUBLIC_ANON_KEY"
   ) {
       install(Postgrest)
       install(Auth)
   }
   ```
3. Sensible Keys nur für Entwicklung in der App lassen. Für Produktion: eigene Edge-Funktionen oder RLS-Regeln in Supabase prüfen.

## Schritt 5: Datenmodell abbilden
- Für jede Tabelle (z. B. `cards`, `decks`) Kotlin-`data class` erstellen.
- Zugriff über Supabase Postgrest:
  ```kotlin
  suspend fun loadDecks(): List<Deck> {
      return supabase.postgrest["decks"].select().decodeList()
  }
  ```
- Direktes Mapping hilft beim Wiederverwenden der Web-Logik.

## Schritt 6: UI planen
- Einfach starten: Hauptbildschirm mit Kartenliste.
- Navigation-Komponente oder Compose Navigation nutzen.
- Screens:
  1. Login/Signup (optional, falls bestehende Web-Version Auth nutzt).
  2. Deck-Übersicht.
  3. Karten-Lernen-Screen (Swipe oder Buttons für Richtig/Falsch).
- Für Compose: `@Composable`-Funktionen je Screen.
- Für klassische Views: `Activity` + `Fragment` mit XML-Layouts.

## Schritt 7: State & Architektur
- ViewModel + LiveData/StateFlow einsetzen (MVVM-Pattern).
- Repository-Schicht erstellen, die Supabase-Aufrufe kapselt.
- Beispiel:
  - `DeckRepository` ruft Supabase.
  - `DeckViewModel` nutzt Repository, liefert UI-State.
  - `DeckScreen` zeigt Inhalte an und reagiert auf Nutzeraktionen.

## Schritt 8: Authentifizierung (falls nötig)
1. Supabase E-Mail/Passwort oder Magic Link wie im Web.
2. Auth-Flows:
   - `supabase.auth.signInWith(Email)` usw.
   - Token speichern (Supabase-Client erledigt das).
3. Eventuell Session in `SharedPreferences` sichern, damit Nutzer eingeloggt bleibt.

## Schritt 9: Offline & Performance (optional)
- Für erste Version reicht Online-Modus.
- Später Room-DB oder Cache überlegen.
- Netzwerkstatus prüfen, Fehlermeldungen freundlich anzeigen.

## Schritt 10: Testing
- Unit-Tests für Repository und ViewModel (Mock-Supabase).
- UI-Tests mit Espresso oder Compose Test-Kit.
- Manuelle Tests auf echtem Gerät (Leistung, Layout, Dark Mode).

## Schritt 11: Veröffentlichung
1. App-Symbol erstellen (Android Asset Studio).
2. `app/build.gradle`: VersionCode & VersionName setzen.
3. Release-Build (`Build > Generate Signed Bundle/APK`).
4. Google Play Console Account anlegen (einmalige Gebühr).
5. App hochladen, Test-Track (Internal/Testers) nutzen.
6. Datenschutz & Richtlinien beachten (Supabase-Daten, Auth).

## Schritt 12: Zusammenarbeit & Weiterentwicklung
- Code in Git verwalten (Branch für Android).
- README ergänzen: Setup-Schritte, Supabase-Konfiguration.
- Changelog führen, Bugs dokumentieren.
- Feedback sammeln, UI verbessern, zusätzliche Funktionen planen.

## Nächste Schritte (konkret)
1. Android Studio installieren und Beispiel-App starten.
2. Neues Projekt anlegen, Supabase-Client einbinden.
3. Erstes Screen-Gerüst bauen (Deck-Liste).
4. Supabase-Daten abrufen und anzeigen.
5. Auth (falls nötig) ergänzen.
6. Funktion zum Lernen umsetzen (ähnlich Web-Logik).
7. Testen und iterativ verbessern.

