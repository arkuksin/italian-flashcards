-- Migration: fix_category_view_rls
-- Generated at 2025-11-12T22:11:50.900Z UTC
-- Write idempotent SQL statements below.

-- Fix RLS access for v_category_statistics view
-- The view shows aggregated public statistics and should be accessible to all users

-- Grant SELECT permission on the view to authenticated and anonymous users
GRANT SELECT ON v_category_statistics TO authenticated, anon;

-- Grant EXECUTE permission on the get_words_by_categories function
GRANT EXECUTE ON FUNCTION get_words_by_categories(UUID, TEXT[], TEXT) TO authenticated, anon;

-- Add comment explaining the security model
COMMENT ON VIEW v_category_statistics IS 'Public view showing aggregated category statistics. Accessible to all users as it contains no user-specific data.';
