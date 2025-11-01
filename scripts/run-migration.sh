#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Applying Database Migration"
echo "================================"
echo ""

# Migration SQL
MIGRATION_SQL="ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en', 'ru', 'it', 'de')); COMMENT ON COLUMN user_preferences.language_preference IS 'User preferred language for UI (en=English, ru=Russian, it=Italian, de=German)'; CREATE INDEX IF NOT EXISTS idx_user_preferences_language ON user_preferences(language_preference);"

# Test Database
echo -e "${YELLOW}📊 TEST Database${NC}"
echo "URL: https://slhyzoupwluxgasvapoc.supabase.co"

TEST_RESPONSE=$(curl -s -X POST \
  'https://slhyzoupwluxgasvapoc.supabase.co/rest/v1/rpc/query' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsaHl6b3Vwd2x1eGdhc3ZhcG9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTAwMDY5OCwiZXhwIjoyMDc0NTc2Njk4fQ.sHXPnNygm8rNozI-7p4CBxIpWMk49IpqJyLam2F7lLU" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsaHl6b3Vwd2x1eGdhc3ZhcG9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTAwMDY5OCwiZXhwIjoyMDc0NTc2Njk4fQ.sHXPnNygm8rNozI-7p4CBxIpWMk49IpqJyLam2F7lLU" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$MIGRATION_SQL\"}" 2>&1)

# Since direct SQL execution via REST API isn't available, use psql
echo ""
echo -e "${YELLOW}Using psql to apply migration...${NC}"
echo ""

# Extract database credentials from Supabase URL
# Connection string format: postgresql://postgres:[YOUR-PASSWORD]@db.PROJECT_REF.supabase.co:5432/postgres

echo -e "${YELLOW}📊 Applying to TEST Database${NC}"
PGPASSWORD="VfuGIFmXOLV0lLwN" psql -h db.slhyzoupwluxgasvapoc.supabase.co -U postgres -d postgres -p 5432 -c "$MIGRATION_SQL" 2>&1 && \
  echo -e "${GREEN}✅ TEST database migration successful${NC}" || \
  echo -e "${RED}❌ TEST database migration failed${NC}"

echo ""
echo -e "${YELLOW}📊 Applying to PRODUCTION Database${NC}"
PGPASSWORD="Supabase2024!" psql -h db.gjftooyqkmijlvqbkwdr.supabase.co -U postgres -d postgres -p 5432 -c "$MIGRATION_SQL" 2>&1 && \
  echo -e "${GREEN}✅ PRODUCTION database migration successful${NC}" || \
  echo -e "${RED}❌ PRODUCTION database migration failed${NC}"

echo ""
echo "================================"
echo "✨ Migration process complete!"
