-- AI usage log + per-user daily budget cap support.
--
-- Replaces console.log instrumentation in /lib/ai/usage.ts with persisted
-- per-call records. Enables:
--   1. Per-user daily AI budget cap (sum cost_usd WHERE user_id=$1 AND occurred_at::date=today)
--   2. Post-launch abuse investigation (query top users, top endpoints, anomaly detection)
--   3. User-facing /settings/account remaining-budget display
--
-- Naming follows existing pattern (singular underscored noun + _log).
-- Note: schema_migrations tracking will need a `supabase migration repair`
-- once this file is renamed to the canonical timestamp format; see backlog
-- agent3-task1-evidence/discovery.md.

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Free-form route path (e.g. '/api/ai/risk', '/api/v1/smart-brief'). Optional.
  endpoint text,
  -- Feature tag from /lib/ai (client-summary, risk-assessment, etc.). Optional.
  feature text,
  -- Provider canonical name: 'anthropic' | 'gemini-pro' | 'gemini-flash' | 'gemini-flash-lite' | 'groq'.
  provider text NOT NULL,
  -- Specific model id, e.g. 'claude-haiku-4-5-20251001', 'gemini-2.5-flash'.
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  -- Convenience sum; persisted to avoid GROUP BY (input+output) on hot path.
  total_tokens integer GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  -- USD cost, computed at log time using per-model rate table in /lib/ai/usage.ts.
  -- numeric(12, 8) handles fractions of a cent precisely (smallest call ~ $0.000005).
  cost_usd numeric(12, 8) NOT NULL DEFAULT 0,
  duration_ms integer,
  success boolean NOT NULL DEFAULT true,
  error_code text,
  -- Fallback record: which provider failed and triggered this fallback call.
  fell_back_from text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

-- Hot path: budget cap query — `SELECT sum(cost_usd) FROM ai_usage_log
-- WHERE user_id = $1 AND occurred_at >= date_trunc('day', now())`.
-- Index on (user_id, occurred_at DESC) lets this scan only today's rows.
CREATE INDEX IF NOT EXISTS ai_usage_log_user_day_idx
  ON ai_usage_log (user_id, occurred_at DESC);

-- Admin/dashboard queries: top users, recent activity.
CREATE INDEX IF NOT EXISTS ai_usage_log_occurred_at_idx
  ON ai_usage_log (occurred_at DESC);

-- Provider/model rollups for cost forecasting.
CREATE INDEX IF NOT EXISTS ai_usage_log_provider_idx
  ON ai_usage_log (provider, occurred_at DESC);

-- RLS: users can read their own usage (powers /settings/account remaining-budget).
-- Inserts happen via createAdminClient() which bypasses RLS (service role).
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own AI usage"
  ON ai_usage_log FOR SELECT
  USING (auth.uid() = user_id);

-- Comment for future maintainers.
COMMENT ON TABLE ai_usage_log IS
  'Per-call AI usage records. Populated by /lib/ai/usage.ts logAIUsage(). '
  'Read for: (a) per-user daily budget cap in /lib/ai/budget.ts; '
  '(b) /api/ai/budget UI endpoint; '
  '(c) admin abuse investigation queries.';
