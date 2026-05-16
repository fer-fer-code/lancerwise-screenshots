# Dev Feedback Widget — Evidence

In-app bug reporter built for Ramiz QA pass on Russian-localized
LancerWise. Restricted to two whitelisted accounts:
- `krokusstudia2@gmail.com`
- `lancerwise.team@gmail.com`

## Contents
- `COMPLETION-REPORT.md` — full delivery report (scope, commits, curl
  evidence, RLS proof, RU translation samples, expected appearance,
  next steps)

## Key facts
- Lancerwise branch: `feature/dev-feedback-widget`
- Lancerwise commit: `2f743635`
- Migration: `scripts/migrations/2026-05-16-dev-feedback.sql`
- Defense-in-depth: server-render gate + API whitelist + Supabase RLS
- 401 + RLS rejection (42501) verified via curl
- 16-key RU + EN translation parity
