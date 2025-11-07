# Pipeline und Deployment Test Plan

Dieser Plan beschreibt umfassende Tests für die CI/CD-Pipeline und Deployment-Prozesse der Italian Flashcards Anwendung.

## Übersicht

**Ziel:** Sicherstellen, dass alle Pipeline- und Deployment-Prozesse korrekt funktionieren, Migrationen sicher angewendet werden und die Anwendung in allen Umgebungen stabil läuft.

**Umgebungen:**
- **Test Database**: `slhyzoupwluxgasvapoc.supabase.co`
- **Production Database**: `gjftooyqkmijlvqbkwdr.supabase.co`
- **Vercel Preview**: Automatische Deployments für PRs
- **Vercel Production**: Main-Branch Deployments

---

## Phase 1: GitHub Actions CI/CD Tests

### 1.1 Migration Validation Workflow

**Datei:** `.github/workflows/db-migrations.yml`

**Test-Schritte:**

```bash
# 1. Erstelle Feature-Branch
git checkout -b test/pipeline-validation

# 2. Erstelle Test-Migration
npm run create:migration "pipeline_test_column"

# 3. Füge Test-SQL hinzu
cat > db/migrations/V$(date +%Y%m%d%H%M%S)__pipeline_test_column.sql << 'EOF'
-- Test migration for pipeline validation
-- This migration adds a test column to verify pipeline works

ALTER TABLE public.words
ADD COLUMN IF NOT EXISTS pipeline_test TEXT;

COMMENT ON COLUMN public.words.pipeline_test IS
'Test column created to verify pipeline migration validation';
EOF

# 4. Commit und Push
git add db/migrations/
git commit -m "test: add pipeline validation test migration"
git push origin test/pipeline-validation

# 5. Erstelle Pull Request
gh pr create --title "Test: Pipeline Migration Validation" \
  --body "Testing migration validation in GitHub Actions"

# 6. Warte auf Workflow-Ergebnisse
gh pr checks

# Erwartetes Ergebnis:
# ✅ "Database migrations check" sollte erfolgreich sein
# ✅ Migration wird validiert mit --check flag
# ✅ Keine tatsächliche Anwendung auf Datenbank
```

**Validierung:**
- [ ] Workflow startet automatisch bei PR-Erstellung
- [ ] Verbindung zur Test-Datenbank erfolgreich
- [ ] Migration wird erkannt und validiert
- [ ] Keine Fehler in Workflow-Logs
- [ ] Workflow verwendet `secrets` nicht `vars`

**Fehlerbehebung:**

Falls Workflow fehlschlägt:
```bash
# Workflow-Logs prüfen
gh run view --log

# Häufige Probleme:
# 1. Fehlende GitHub Secrets
gh secret list

# 2. Falsche DB-Verbindungsparameter
# Prüfe .github/workflows/db-migrations.yml

# 3. SQL-Syntax-Fehler
npm run migrate:lint
```

### 1.2 Production Deployment Workflow Test

**Datei:** `.github/workflows/production-deploy.yml`

**Test-Schritte:**

```bash
# 1. Merge Test-Branch zu Main (simuliert Production Deployment)
git checkout main
git merge test/pipeline-validation

# WICHTIG: Nur wenn sicher!
# git push origin main

# 2. Überwache Workflow
gh workflow view production-deploy
gh run list --workflow=production-deploy

# 3. Prüfe spezifischen Run
gh run view <run-id> --log

# Erwartete Schritte im Workflow:
# ✅ Checkout code
# ✅ Setup Node.js
# ✅ Install dependencies
# ✅ Validate database migrations (NEU)
# ✅ Build application
# ✅ Deploy to Vercel Production
```

**Validierung:**
- [ ] Migrations-Validierung läuft VOR dem Build
- [ ] Verwendet SUPABASE_PROD_DB_* Secrets
- [ ] Build schlägt fehl wenn Migrations ungültig
- [ ] Successful deployment nur wenn alles passt

### 1.3 Security Audit Test

**Test GitHub Secrets vs Vars:**

```bash
# 1. Prüfe welche Secrets existieren
gh secret list

# Sollte enthalten:
# - SUPABASE_DB_HOST
# - SUPABASE_DB_PORT
# - SUPABASE_DB_DATABASE
# - SUPABASE_DB_USER
# - SUPABASE_DB_PASSWORD
# - SUPABASE_DB_SSL
# - SUPABASE_DB_SSL_REJECT_UNAUTHORIZED
# - SUPABASE_PROD_DB_HOST (für Production)
# - SUPABASE_PROD_DB_PORT
# - SUPABASE_PROD_DB_DATABASE
# - SUPABASE_PROD_DB_USER
# - SUPABASE_PROD_DB_PASSWORD
# - SUPABASE_PROD_DB_SSL
# - SUPABASE_PROD_DB_SSL_REJECT_UNAUTHORIZED

# 2. Prüfe Workflow-Dateien auf vars.*
grep -r "vars\." .github/workflows/

# Erwartetes Ergebnis: KEINE Treffer für DB-Credentials

# 3. Workflow-Logs prüfen (keine Credential-Leaks)
gh run view <run-id> --log | grep -i "password\|secret\|key"
# Sollte nur "***" zeigen, keine echten Werte
```

**Validierung:**
- [ ] Keine `vars.*` für Datenbank-Credentials
- [ ] Alle DB-Credentials nutzen `secrets.*`
- [ ] Workflow-Logs zeigen keine Passwörter

---

## Phase 2: Vercel Deployment Tests

### 2.1 Preview Deployment Test

**Auslöser:** Pull Request zu beliebigem Branch

**Test-Schritte:**

```bash
# 1. Erstelle Feature-Branch mit Änderungen
git checkout -b test/vercel-preview

# 2. Mache eine sichtbare Änderung
echo "<!-- Test Preview Deployment -->" >> src/App.tsx

# 3. Commit und Push
git add src/App.tsx
git commit -m "test: vercel preview deployment"
git push origin test/vercel-preview

# 4. Erstelle PR
gh pr create --title "Test: Vercel Preview Deployment" \
  --body "Testing preview deployment with migrations"

# 5. Warte auf Vercel-Kommentar mit Preview-URL
# Oder hole URL direkt:
vercel ls italian-flashcards --token=$VERCEL_TOKEN | head -5

# 6. Teste Preview-URL
PREVIEW_URL=$(gh pr view --json url -q .url)
curl -I $PREVIEW_URL
```

**Validierung Preview-Build:**
- [ ] Preview-URL wird generiert
- [ ] Migrationen laufen gegen Test-Datenbank
- [ ] Build-Logs zeigen Migration-Execution
- [ ] Anwendung startet erfolgreich
- [ ] Keine Migration-Errors im Build-Log

**Prüfe Vercel Build-Logs:**
```bash
# Via Vercel CLI
vercel logs <deployment-url> --token=$VERCEL_TOKEN

# Suche nach:
# - "Checking migration..."
# - "Applied migration..."
# - Build-Erfolg
```

**Test Datenbank-Zugriff von Preview:**
1. Öffne Preview-URL im Browser
2. Logge dich ein
3. Teste Hauptfunktionen:
   - Flashcard-Anzeige
   - Progress-Tracking
   - Sprach-Präferenz

### 2.2 Production Deployment Test

**Auslöser:** Merge zu `main` Branch

**WARNUNG:** ⚠️ Dies deployed zu Production! Nur ausführen wenn sicher!

**Test-Schritte:**

```bash
# 1. Vor dem Merge: Backup der Production DB
# Dokumentation: https://supabase.com/docs/guides/platform/backups

# 2. Merge zu Main
git checkout main
git merge test/vercel-preview
git push origin main

# 3. Überwache Vercel Production Deployment
vercel ls italian-flashcards --prod --token=$VERCEL_TOKEN

# 4. Warte auf Deployment-Completion
# Prüfe Status:
vercel inspect <deployment-url> --token=$VERCEL_TOKEN

# 5. Teste Production-URL
curl -I https://italian-flashcards-eight.vercel.app
```

**Validierung Production-Build:**
- [ ] Migrationen laufen gegen Production-Datenbank
- [ ] Build verwendet PROD Environment Variables
- [ ] Deployment erfolgreich
- [ ] Health-Check erfolgreich
- [ ] Keine Errors in Production-Logs

**Post-Deployment Tests:**

```bash
# 1. Smoke-Test auf Production
curl https://italian-flashcards-eight.vercel.app/health || echo "No health endpoint"

# 2. Test kritische User-Flows
# Manuell im Browser:
# - Login
# - Flashcard-Anzeige
# - Progress-Speicherung
# - Logout

# 3. Prüfe Production-Datenbank
# Supabase Dashboard → Database → Table Editor
# Verifiziere neue Spalte existiert

# 4. Überwache Logs für Errors
vercel logs https://italian-flashcards-eight.vercel.app \
  --token=$VERCEL_TOKEN \
  --follow
```

### 2.3 Environment Variables Test

**Test Environment-Variable-Konfiguration in Vercel:**

```bash
# 1. Liste alle Environment Variables
vercel env ls --token=$VERCEL_TOKEN

# Sollte enthalten (für Production):
# VITE_SUPABASE_URL=https://gjftooyqkmijlvqbkwdr.supabase.co
# VITE_SUPABASE_ANON_KEY=(masked)
# SUPABASE_DB_HOST=aws-1-eu-central-1.pooler.supabase.com
# SUPABASE_DB_PORT=6543
# SUPABASE_DB_DATABASE=postgres
# SUPABASE_DB_USER=postgres
# SUPABASE_DB_PASSWORD=(masked)
# SUPABASE_DB_SSL=true
# SUPABASE_DB_SSL_REJECT_UNAUTHORIZED=false

# 2. Prüfe Preview-Environment
vercel env ls --environment=preview --token=$VERCEL_TOKEN

# Sollte Test-Database verwenden:
# VITE_SUPABASE_URL=https://slhyzoupwluxgasvapoc.supabase.co
```

**Fehlende Variablen hinzufügen:**
```bash
# Für Production
vercel env add SUPABASE_DB_HOST production --token=$VERCEL_TOKEN
# Eingabe: aws-1-eu-central-1.pooler.supabase.com

vercel env add SUPABASE_DB_PORT production --token=$VERCEL_TOKEN
# Eingabe: 6543

# Wiederholen für alle fehlenden Variablen
```

**Validierung:**
- [ ] Alle 7 Migrations-Variablen in Production
- [ ] Alle 7 Migrations-Variablen in Preview
- [ ] Preview verwendet Test-DB-Credentials
- [ ] Production verwendet Prod-DB-Credentials

---

## Phase 3: Migration System Tests

### 3.1 Migration Execution Test

**Test komplette Migration-Pipeline:**

```bash
# 1. Erstelle Test-Migration
npm run create:migration "complete_pipeline_test"

# 2. Schreibe SQL
cat > db/migrations/V$(date +%Y%m%d%H%M%S)__complete_pipeline_test.sql << 'EOF'
-- Complete pipeline test migration
-- Tests full migration workflow from creation to production

-- Add test table
CREATE TABLE IF NOT EXISTS public.pipeline_test (
  id BIGSERIAL PRIMARY KEY,
  test_data TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS
ALTER TABLE public.pipeline_test ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pipeline test is public" ON public.pipeline_test;
CREATE POLICY "Pipeline test is public"
ON public.pipeline_test
FOR SELECT
USING (true);

-- Add index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pipeline_test_created
ON public.pipeline_test(created_at);

COMMENT ON TABLE public.pipeline_test IS
'Test table for complete pipeline validation';
EOF

# 3. Lint Migration
npm run migrate:lint

# Erwartung: Keine Errors (oder nur Warnings)

# 4. Dry-Run Test
npm run migrate -- --check --verbose

# Erwartung:
# - Migration wird erkannt
# - SQL wird angezeigt
# - Keine Verbindungsfehler

# 5. Apply Lokal (zu Test-DB)
npm run migrate

# Erwartung:
# - Migration erfolgreich angewendet
# - Tabelle existiert in Supabase

# 6. Verifiziere in Supabase
# Supabase Dashboard → Database → Tables
# Sollte pipeline_test Tabelle zeigen

# 7. Erstelle Rollback
npm run migrate:create-revert V<timestamp>

# 8. Bearbeite Rollback
# db/migrations/V<new-timestamp>__revert_complete_pipeline_test.sql
# Füge hinzu:
cat > db/migrations/V<new-timestamp>__revert_complete_pipeline_test.sql << 'EOF'
-- Rollback: Remove pipeline_test table

DROP TABLE IF EXISTS public.pipeline_test CASCADE;
EOF

# 9. Apply Rollback
npm run migrate

# Erwartung:
# - Tabelle wird gelöscht
# - Keine Errors

# 10. Cleanup Test-Migrationen
rm db/migrations/V*__complete_pipeline_test.sql
rm db/migrations/V*__revert_complete_pipeline_test.sql
```

**Validierung:**
- [ ] Migration erstellt ohne Errors
- [ ] Linting findet keine kritischen Issues
- [ ] Dry-Run zeigt SQL korrekt
- [ ] Migration wird erfolgreich angewendet
- [ ] Tabelle existiert in Datenbank
- [ ] Rollback funktioniert
- [ ] Tabelle wird sauber entfernt

### 3.2 Migration Failure Handling Test

**Test Transaction-Rollback bei Fehlern:**

```bash
# 1. Erstelle absichtlich fehlerhafte Migration
cat > db/migrations/V$(date +%Y%m%d%H%M%S)__intentional_failure_test.sql << 'EOF'
-- This migration will fail intentionally

-- Valid operation
ALTER TABLE public.words
ADD COLUMN IF NOT EXISTS failure_test_1 TEXT;

-- Invalid operation (will cause failure)
ALTER TABLE public.non_existent_table
ADD COLUMN failure_test_2 TEXT;

-- This should NOT be applied due to rollback
ALTER TABLE public.words
ADD COLUMN failure_test_3 TEXT;
EOF

# 2. Versuche Migration anzuwenden
npm run migrate

# Erwartetes Ergebnis:
# ❌ Migration fails
# ✅ Error-Message zeigt Problem
# ✅ Transaction rollback erfolgt
# ✅ failure_test_1 Spalte NICHT vorhanden (rollback)
# ✅ failure_test_3 Spalte NICHT vorhanden (nicht ausgeführt)

# 3. Verifiziere Rollback
# Prüfe words Tabelle hat KEINE failure_test_* Spalten

# 4. Cleanup
rm db/migrations/V*__intentional_failure_test.sql
```

**Validierung:**
- [ ] Migration schlägt erwartungsgemäß fehl
- [ ] Error-Message ist aussagekräftig
- [ ] Keine partial Änderungen (vollständiger Rollback)
- [ ] schema_version Tabelle nicht aktualisiert

### 3.3 Checksum Verification Test

**Test Migration-Integrity-Prüfung:**

```bash
# 1. Finde angewendete Migration
ls db/migrations/

# Wähle eine bereits angewendete Migration, z.B.:
# V20251031233404__add_language_preference.sql

# 2. Versuche Migration zu ändern
# (Simuliert unautorisierten Edit)
echo "-- Modified" >> db/migrations/V20251031233404__add_language_preference.sql

# 3. Versuche Migrations zu laufen
npm run migrate -- --check

# Erwartetes Ergebnis:
# ❌ "Checksum mismatch" Error
# ✅ System erkennt Manipulation
# ✅ Migration wird NICHT angewendet

# 4. Restore original
git restore db/migrations/V20251031233404__add_language_preference.sql

# 5. Verifiziere Checksum OK
npm run migrate -- --check
# ✅ Sollte nun erfolgreich sein
```

**Validierung:**
- [ ] Checksum-Änderung wird erkannt
- [ ] System blockiert manipulierte Migration
- [ ] Error-Message erklärt Problem klar
- [ ] Nach Restore funktioniert es wieder

---

## Phase 4: End-to-End Integration Tests

### 4.1 Kompletter Development-to-Production Flow

**Simuliere realistischen Workflow:**

```bash
# ==========================================
# Schritt 1: Feature-Entwicklung
# ==========================================

# 1.1 Feature-Branch
git checkout -b feature/add-difficulty-rating

# 1.2 Erstelle Migration
npm run create:migration "add_word_difficulty_rating"

# 1.3 Schreibe SQL
cat > db/migrations/V$(date +%Y%m%d%H%M%S)__add_word_difficulty_rating.sql << 'EOF'
-- Migration: Add difficulty rating to words
-- Date: $(date +%Y-%m-%d)
-- Description: Adds user-perceived difficulty rating (1-5) to words table

ALTER TABLE public.words
ADD COLUMN IF NOT EXISTS difficulty_rating INTEGER DEFAULT 3
CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5);

COMMENT ON COLUMN public.words.difficulty_rating IS
'User-perceived difficulty: 1 (easy) to 5 (very difficult)';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_words_difficulty
ON public.words(difficulty_rating);
EOF

# 1.4 Lokal testen
npm run migrate:lint
npm run migrate -- --check --verbose
npm run migrate

# 1.5 Anwendung testen
npm run dev
# Manuell: Teste Flashcards funktionieren weiterhin

# ==========================================
# Schritt 2: Code-Changes
# ==========================================

# 2.1 Update TypeScript Typen (Beispiel)
# src/types/database.ts - füge difficulty_rating hinzu

# 2.2 Commit alles zusammen
git add db/migrations/
git add src/
git commit -m "feat: add difficulty rating to words"

# ==========================================
# Schritt 3: Pull Request
# ==========================================

# 3.1 Push und PR erstellen
git push origin feature/add-difficulty-rating

gh pr create \
  --title "feat: Add difficulty rating to words" \
  --body "Adds 1-5 difficulty rating to help users identify challenging words

## Changes
- New migration: add_word_difficulty_rating
- Updated TypeScript types
- Tested locally on test database

## Testing
- [x] Migration linting passed
- [x] Dry-run successful
- [x] Applied to local test database
- [x] Application functions correctly
"

# 3.2 Warte auf CI Checks
gh pr checks --watch

# ==========================================
# Schritt 4: Preview Deployment
# ==========================================

# 4.1 Hole Preview-URL
PREVIEW_URL=$(gh pr view --json url -q .url | grep vercel)

# 4.2 Teste Preview
curl -I $PREVIEW_URL
# Öffne im Browser, teste Funktionalität

# 4.3 Prüfe Migration wurde angewendet
# Supabase Dashboard (Test DB) → words Tabelle
# Sollte difficulty_rating Spalte zeigen

# ==========================================
# Schritt 5: Code Review & Merge
# ==========================================

# 5.1 Review (simuliert)
gh pr review --approve

# 5.2 Merge
gh pr merge --squash

# ==========================================
# Schritt 6: Production Deployment
# ==========================================

# 6.1 Überwache Production Deployment
git checkout main
git pull
gh run list --workflow=production-deploy --limit 1

# 6.2 Warte auf Completion
gh run watch

# 6.3 Prüfe Production
curl -I https://italian-flashcards-eight.vercel.app

# 6.4 Verifiziere Migration in Production DB
# Supabase Dashboard (Prod DB) → words Tabelle
# Sollte difficulty_rating Spalte zeigen

# 6.5 Smoke Tests
# Öffne https://italian-flashcards-eight.vercel.app
# - Login
# - Flashcards anzeigen
# - Progress speichern
# - Funktioniert alles? ✅

# ==========================================
# Schritt 7: Monitoring (24h)
# ==========================================

# 7.1 Prüfe Vercel Logs
vercel logs https://italian-flashcards-eight.vercel.app --token=$VERCEL_TOKEN

# 7.2 Prüfe Supabase Metrics
# Supabase Dashboard → Reports
# - Query performance
# - Error rates
# - Connection pool usage

# 7.3 User Feedback
# Monitor for issues
```

**Validierung E2E Flow:**
- [ ] Migration erstellt und lokal getestet
- [ ] PR-Checks alle erfolgreich
- [ ] Preview-Deployment funktioniert
- [ ] Migration in Test-DB angewendet
- [ ] Code Review durchgeführt
- [ ] Production-Deployment erfolgreich
- [ ] Migration in Prod-DB angewendet
- [ ] Anwendung funktioniert in Production
- [ ] Keine Errors in Logs

---

## Phase 5: Rollback-Szenarien Tests

### 5.1 Planned Rollback Test

**Scenario:** Feature muss zurückgenommen werden

```bash
# 1. Identifiziere Migration zum Rollback
# Annahme: V20251106120000__add_word_difficulty_rating.sql

# 2. Erstelle Rollback-Migration
npm run migrate:create-revert V20251106120000

# 3. Bearbeite Rollback-SQL
# db/migrations/V20251106121500__revert_add_word_difficulty_rating.sql
cat > db/migrations/V*__revert_add_word_difficulty_rating.sql << 'EOF'
-- Rollback: Remove difficulty_rating from words table
-- Reason: Feature being rolled back due to [reason]

-- Drop index first
DROP INDEX CONCURRENTLY IF EXISTS public.idx_words_difficulty;

-- Remove column
ALTER TABLE public.words
DROP COLUMN IF EXISTS difficulty_rating;
EOF

# 4. Teste Rollback lokal
npm run migrate:lint
npm run migrate -- --check --verbose
npm run migrate

# 5. Verifiziere
# difficulty_rating Spalte sollte weg sein

# 6. Teste Anwendung
npm run dev
# Sicherstellen keine Errors

# 7. Deploy Rollback
git add db/migrations/
git commit -m "revert: remove difficulty rating feature"
git push origin main

# 8. Überwache Production Deployment
gh run list --workflow=production-deploy --limit 1
gh run watch
```

**Validierung:**
- [ ] Rollback-Migration korrekt generiert
- [ ] SQL entfernt alle Feature-Änderungen
- [ ] Keine Dependencies übersehen
- [ ] Lokal erfolgreich getestet
- [ ] Production-Deployment erfolgreich
- [ ] Feature vollständig entfernt

### 5.2 Emergency Rollback Test

**Scenario:** Production-Problem erfordert sofortigen Rollback

```bash
# NOTFALL-PROZEDUR

# 1. Identifiziere problematische Migration
# Annahme: Letzte Migration verursacht Errors

# 2. SCHNELLER WEG: Direkte DB-Änderung
# Nur in echtem Notfall!
# Supabase Dashboard → SQL Editor

# 3. Execute Rollback SQL direkt
-- DROP INDEX IF EXISTS idx_problematic;
-- ALTER TABLE words DROP COLUMN IF EXISTS problematic_column;

# 4. Erstelle Tracking-Migration für Dokumentation
npm run create:migration "emergency_rollback_$(date +%Y%m%d)"

cat > db/migrations/V*__emergency_rollback_*.sql << 'EOF'
-- EMERGENCY ROLLBACK executed manually in Production
-- Date: $(date)
-- Reason: [Document problem]
-- Manual SQL executed:
-- [Paste executed SQL here]

-- This file documents the emergency change
-- No actual SQL to execute (already done manually)
SELECT 1; -- Placeholder
EOF

# 5. Bootstrap Schema Version
npm run bootstrap:migrations

# 6. Commit Dokumentation
git add db/migrations/
git commit -m "docs: document emergency rollback of [feature]"
git push origin main

# 7. Post-Mortem
# Dokumentiere in docs/incidents/
```

**Validierung:**
- [ ] Problem schnell identifiziert
- [ ] Rollback-SQL korrekt
- [ ] Änderungen dokumentiert
- [ ] schema_version Tabelle aktualisiert
- [ ] Team informiert
- [ ] Post-Mortem erstellt

---

## Phase 6: Performance & Load Tests

### 6.1 Migration Performance Test

**Test große Migrations unter Last:**

```bash
# 1. Erstelle Performance-Test-Migration
cat > db/migrations/V$(date +%Y%m%d%H%M%S)__performance_test.sql << 'EOF'
-- Performance test: Large batch update

-- Create test data (if not exists)
INSERT INTO public.words (russian, italian, created_at)
SELECT
  'test_' || generate_series::text,
  'test_' || generate_series::text,
  NOW()
FROM generate_series(1, 1000)
ON CONFLICT DO NOTHING;

-- Batch update with performance tracking
DO $$
DECLARE
    batch_size INT := 100;
    rows_affected INT;
    total_processed INT := 0;
    start_time TIMESTAMPTZ;
BEGIN
    start_time := clock_timestamp();

    LOOP
        UPDATE public.words
        SET italian = italian || '_updated'
        WHERE id IN (
            SELECT id FROM public.words
            WHERE italian NOT LIKE '%_updated'
            LIMIT batch_size
        );

        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        EXIT WHEN rows_affected = 0;

        total_processed := total_processed + rows_affected;
        RAISE NOTICE 'Processed % rows (total: %, elapsed: %)',
            rows_affected,
            total_processed,
            clock_timestamp() - start_time;
    END LOOP;

    RAISE NOTICE 'Performance test complete: % rows in %',
        total_processed,
        clock_timestamp() - start_time;
END $$;
EOF

# 2. Zeitmessung
time npm run migrate

# 3. Analysiere Logs
# Sollte Batch-Processing-Fortschritt zeigen

# 4. Cleanup
npm run migrate:create-revert V<timestamp>
# Revert durch Entfernen der Test-Daten
```

**Validierung:**
- [ ] Migration läuft ohne Timeout
- [ ] Batch-Processing funktioniert
- [ ] Performance-Logs aussagekräftig
- [ ] Keine Locks oder Deadlocks

### 6.2 Concurrent Access Test

**Test Migrations während Anwendung läuft:**

```bash
# Simuliere parallelen Zugriff

# Terminal 1: Starte Dev-Server
npm run dev

# Terminal 2: Führe Migration aus
npm run migrate -- --check

# Terminal 3: Test Anwendung
curl http://localhost:5173

# Erwartung:
# - Migration blockiert Anwendung NICHT
# - Queries funktionieren weiterhin
# - Keine Lock-Timeouts
```

---

## Phase 7: Dokumentation & Reporting

### 7.1 Test-Bericht erstellen

**Nach jedem Test-Durchlauf:**

```bash
# 1. Erstelle Test-Report
cat > test-reports/pipeline-test-$(date +%Y%m%d).md << 'EOF'
# Pipeline Test Report

**Datum:** $(date)
**Tester:** [Name]
**Branch:** $(git branch --show-current)
**Commit:** $(git rev-parse HEAD)

## Test-Ergebnisse

### Phase 1: GitHub Actions CI/CD
- [ ] Migration Validation: PASS/FAIL
- [ ] Production Deployment: PASS/FAIL
- [ ] Security Audit: PASS/FAIL

### Phase 2: Vercel Deployment
- [ ] Preview Deployment: PASS/FAIL
- [ ] Production Deployment: PASS/FAIL
- [ ] Environment Variables: PASS/FAIL

### Phase 3: Migration System
- [ ] Migration Execution: PASS/FAIL
- [ ] Failure Handling: PASS/FAIL
- [ ] Checksum Verification: PASS/FAIL

### Phase 4: E2E Integration
- [ ] Complete Workflow: PASS/FAIL

### Phase 5: Rollback Scenarios
- [ ] Planned Rollback: PASS/FAIL
- [ ] Emergency Rollback: PASS/FAIL

### Phase 6: Performance
- [ ] Migration Performance: PASS/FAIL
- [ ] Concurrent Access: PASS/FAIL

## Issues Found

1. [Issue Description]
   - Severity: HIGH/MEDIUM/LOW
   - Steps to Reproduce:
   - Expected vs Actual:
   - Fix Applied:

## Recommendations

- [Recommendation 1]
- [Recommendation 2]

## Sign-off

- [ ] All critical tests passed
- [ ] Issues documented
- [ ] Team notified
EOF
```

### 7.2 Metrics sammeln

**Key Metrics tracken:**

```bash
# 1. Migration Execution Times
grep "execution_time_ms" <migration-logs> | \
  awk '{sum+=$NF; count++} END {print "Avg:", sum/count, "ms"}'

# 2. Deployment Success Rate
gh run list --workflow=production-deploy --limit 20 --json conclusion | \
  jq '[.[] | select(.conclusion=="success")] | length'

# 3. Rollback Frequency
git log --grep="revert:" --oneline | wc -l

# 4. Test-to-Production Time
# Zeit zwischen PR-Erstellung und Production-Deployment
```

---

## Checklisten

### Pre-Test Checklist

- [ ] Alle GitHub Secrets konfiguriert
- [ ] Vercel Environment Variables gesetzt
- [ ] Test-Datenbank erreichbar
- [ ] Production-Datenbank-Backup vorhanden
- [ ] Team über Test informiert

### Post-Test Checklist

- [ ] Alle Test-Migrationen entfernt
- [ ] Test-Report erstellt
- [ ] Issues dokumentiert
- [ ] Production-Status geprüft
- [ ] Lessons Learned dokumentiert

---

## Troubleshooting

### Häufige Probleme

**1. GitHub Actions schlägt fehl:**
```bash
# Check Secrets
gh secret list

# Verify workflow syntax
yamllint .github/workflows/db-migrations.yml

# Check logs
gh run view --log
```

**2. Vercel Deployment hängt:**
```bash
# Cancel und retry
vercel --force

# Check environment variables
vercel env ls
```

**3. Migration fehlschlägt in Production:**
```bash
# Check schema_version
# Supabase Dashboard → SQL Editor:
SELECT * FROM schema_version ORDER BY executed_at DESC LIMIT 10;

# Check for locks
SELECT * FROM pg_locks WHERE NOT granted;
```

---

## Nächste Schritte

Nach erfolgreichem Test-Durchlauf:

1. **Dokumentation aktualisieren**
   - Test-Ergebnisse in Wiki
   - Runbook-Updates
   - FAQs erweitern

2. **Automation verbessern**
   - Mehr Tests in CI/CD
   - Automated Rollbacks
   - Performance Monitoring

3. **Team Training**
   - Pipeline-Walkthrough
   - Rollback-Drills
   - Incident Response

---

## Ressourcen

- [DB Versioning Plan](./DB_Versioning_Plan.md)
- [Migration Rollbacks](./db-migration-rollbacks.md)
- [DEPLOYMENT.md](./dev/DEPLOYMENT.md)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vercel Docs](https://vercel.com/docs)

---

**Version:** 1.0
**Letzte Aktualisierung:** $(date +%Y-%m-%d)
**Maintainer:** Dev Team
