# Fachliches Domänendokument – Italian Flashcards

## 1. Projektüberblick
- **Ziel & Nutzen**: Interaktive Lernplattform, die russischsprachigen Personen hilft, rund 300 alltagsrelevante italienische Vokabeln verlässlich zu verinnerlichen. Kurze Lerneinheiten, sofortiges Feedback und sichtbare Fortschrittsanzeigen halten die Motivation hoch.
- **Einsatzfeld & Problemstellung**: Unregelmäßige Vokabelpraxis führt zu Vergessen oder unstrukturiertem Lernen. Das System bietet klare Lernpfade, geplante Wiederholungen und persönliche Erfolge, wodurch die Aneignung neuer Vokabeln planbar und nachhaltiger wird.
- **Stakeholder & Nutzergruppen**:
  - Selbstlernende, die Italienisch aus dem Russischen heraus aufbauen wollen.
  - Sprachcoaches oder Bildungsträger, die Lernpfade kuratieren und Lernergebnisse kontrollieren möchten.
  - Personen, die unterwegs oder in kurzen Zeitfenstern üben und ihre Fortschritte festhalten wollen.

## 2. Fachliche Kernlogik
### 2.1 Fachobjekte
- **Lernender**: Authentifizierte Person mit persönlichem Fortschrittskonto.
- **Vokabel**: Paar aus russischem und italienischem Begriff, inklusive Themenkategorie und Anlegezeitpunkt.
- **Lernsession**: Zeitlich abgegrenzte Trainingseinheit mit festgelegter Übersetzungsrichtung (Russisch→Italienisch oder Italienisch→Russisch); hält bearbeitete Wörter sowie richtige Antworten fest.
- **Lernfortschritt pro Wort**: Individueller Datensatz pro Lernender und Vokabel mit Anzahl richtiger/falscher Antworten, letztem Übungszeitpunkt und Mastery-Level (0–5).
- **Nutzerpräferenzen**: Gespeicherte Einstellungen wie Dark Mode, Standardrichtung, Shuffle-Status, tägliches Lernziel und Benachrichtigungsstatus.

### 2.2 Geschäftsregeln & Abläufe
- Zugriff auf Lerninhalte erfolgt nur nach erfolgreicher Anmeldung.
- Jede Lernsession beginnt mit der bewussten Wahl der Übersetzungsrichtung.
- Jede abgegebene Antwort wird mit dem Zielwort verglichen; das Ergebnis (richtig/falsch) erzeugt Sofortfeedback und aktualisiert Zähler, Mastery-Level sowie „zuletzt geübt“.
- Lernstatistiken (bearbeitete Wörter, korrekte Antworten) werden sessionübergreifend geführt und im Dashboard verdichtet.
- Bei Verbindungsverlust werden Eingaben lokal zwischengespeichert und nach Wiederherstellung synchronisiert, ohne Datenverlust.

### 2.3 Spaced Repetition & Mastery
- Mastery-Level 0–5 beschreiben Reifegrade von „neu“ bis „beherrscht“. Sie entstehen aus den bisherigen Antworten und werden bei jeder Interaktion neu bewertet.
- Wiederholungsintervalle richten sich nach dem Mastery-Level (z. B. 1 Tag bei Level 1, 14 Tage bei Level 4, 90 Tage bei Level 5); neue Wörter gelten stets als fällig und haben Priorität.
- Die Lernübersicht bevorzugt überfällige oder niedrigere Mastery-Level, damit unbeherrschte Wörter häufiger geübt werden.

### 2.4 Fachliche Datenflüsse
1. **Input**: Lernender meldet sich an, wählt Modus und beantwortet Übersetzungsaufgaben; optionale Komfortfunktionen (Dark Mode, Shuffle) werden aktiviert.
2. **Verarbeitung**: System vergleicht jede Eingabe mit der Zielübersetzung, klassifiziert das Ergebnis, aktualisiert Session- und Fortschrittsdatensätze, passt Mastery-Level an und plant nächste Wiederholungen.
3. **Output**: Sofortiges visuelles Feedback („richtig“/„falsch“), Anzeige der korrekten Lösung, Fortschrittsbalken, Statistiken zu Genauigkeit, Streaks sowie Status „Mastered“/„In Progress“; Hinweise auf Offline-Synchronisierung bei Bedarf.

### 2.5 Lerninhalte
- Kuratierter Wortschatz mit rund 300 Begriffen aus Alltagsthemen (Lebensmittel, Familie, Farben, Zahlen, Zeit, Körper, Reise, Orte, Speisen u. a.).
- Kategorien ermöglichen perspektivisch thematisches Lernen oder Filterung nach Bedarf.

## 3. Anwendungsfälle
### Use Case 1 – Zugang sichern
- **Ziel**: Lernender erhält Zugriff auf persönliche Trainingsdaten.
- **Auslöser**: Person ruft die Anwendung auf.
- **Ablauf**: Eingabe der Zugangsdaten oder Wahl eines OAuth-Anbieters; bei Erfolg Weiterleitung ins Dashboard.
- **Ergebnis**: Der authentifizierte Lernende sieht Willkommensnachricht, Statistiken und Moduswahl.

### Use Case 2 – Lernsession absolvieren
- **Ziel**: Vokabeln in gewählter Richtung trainieren.
- **Auslöser**: Lernender wählt auf dem Dashboard „Russisch→Italienisch“ oder „Italienisch→Russisch“.
- **Ablauf**: System legt eine neue Session an, zeigt sequenziell Flashcards; Lernender beantwortet, erhält Feedback, navigiert per Buttons oder Tastatur, kann Shuffle oder Neustart nutzen.
- **Ergebnis**: Session erfasst bearbeitete Wörter, korrekte Antworten und aktualisierte Mastery-Level.

### Use Case 3 – Lernfortschritt prüfen
- **Ziel**: Übersicht über Lernergebnisse gewinnen.
- **Auslöser**: Lernender besucht das Dashboard während oder nach einer Session.
- **Ablauf**: Anwendung aggregiert individuelle Lernfortschritt-Daten (Genauigkeit, Streak, Mastery-Verteilung) und visualisiert sie.
- **Ergebnis**: Lernender erkennt persönliche Stärken und offene Vokabeln, kann Lernstrategie anpassen.

### Use Case 4 – Offline-Training fortsetzen
- **Ziel**: Übung trotz instabiler Internetverbindung ermöglichen.
- **Auslöser**: Während einer Session geht die Verbindung verloren.
- **Ablauf**: System signalisiert Offline-Modus, nimmt Antworten lokal entgegen, reiht Aktualisierungen in eine Warteschlange und synchronisiert sie automatisch, sobald wieder Verbindung besteht.
- **Ergebnis**: Keine Fortschrittsverluste, konsistente Daten nach Re-Synchronisierung.

## 4. Abgrenzung und Annahmen
- Keine Grammatik-, Hör- oder Ausspracheübungen; Fokus ausschließlich auf schriftlicher Vokabelübersetzung.
- Keine kollaborativen Lernfunktionen, keine Dozenten-Dashboards; Fortschritt bleibt personenbezogen.
- Wortschatzpflege erfolgt redaktionell im Hintergrund; Endnutzer verwalten Vokabeln nicht selbst.
- Sprachrichtung ist fest auf Russisch ↔ Italienisch begrenzt.
- Benachrichtigungen, Tagesziele und Präferenzen sind vorbereitet, aber nur teilweise in der Oberfläche steuerbar.
- Annahme: Nutzer verwenden valide E-Mail-Adressen, damit Zustellbarkeit bei Registrierungen gewährleistet bleibt.

## 5. Glossar
- **Lernsession**: Zusammenhängender Trainingszeitraum ab Moduswahl bis Abbruch oder Neustart, inklusive Statistik der bearbeiteten Karten.
- **Mastery-Level**: Sechsstufiges Kompetenzmodell für Vokabeln, das Erfolgsquote und Übungshäufigkeit widerspiegelt.
- **Spaced Repetition**: Lernmethode mit wachsendem Wiederholungsabstand, um Erinnerungsleistung zu steigern.
- **Fortschrittsstatistik**: Kennzahlen im Dashboard (Genauigkeit, Streak, mastered vs. in-progress Wörter, Gesamtversuche).
