# Regressions removed (or rather: avoided)

## Strategy: cherry-pick, not rebase

The original `feature/lemonsqueezy-integration` branch carried **849 files of divergence** vs current `main` (10,949 insertions, 20,433 deletions). Trying to rebase that branch onto main would have required resolving conflicts across hundreds of files.

Instead: started from `origin/main`, cherry-picked the **two LS-relevant commits** (`ab7f6cff` skeleton + `dc277842` handlers/migration/toggle), and ignored everything else. This naturally side-stepped 3 unrelated regressions identified in earlier `code-gaps.md`.

## Regression #1 — `/settings/billing` redirect deletion (AVOIDED)

**On original branch**: `src/app/(app)/settings/billing/page.tsx` was deleted entirely. If merged, `/settings/billing` would return 404 instead of redirecting to `/upgrade`.

**Verification on cherry-pick branch**:
```bash
$ ls -la 'src/app/(app)/settings/billing/page.tsx'
-rw-r--r--  1 myoffice  staff  121 May 18 10:08 src/app/(app)/settings/billing/page.tsx
```

File intact, 5-line redirect to `/upgrade` preserved.

## Regression #2 — `tool-subscriptions/optimize` revert + missing `force-dynamic` (AVOIDED)

**On original branch**: `src/app/api/tool-subscriptions/optimize/route.ts` was reverted from new `/lib/ai` abstraction back to direct `@anthropic-ai/sdk` import, AND `export const dynamic = 'force-dynamic'` was removed.

Per memory `feedback_force_dynamic_invariant.md`: routes hitting `/lib/ai` MUST have `force-dynamic` to prevent Next.js static-render inference from freezing build-time `process.env` values. Removing it would re-trigger the PR #28 incident.

**Verification on cherry-pick branch**:
```bash
$ grep -E 'force-dynamic|@/lib/ai|@anthropic-ai/sdk' src/app/api/tool-subscriptions/optimize/route.ts
import { streamText } from '@/lib/ai'
export const dynamic = 'force-dynamic'
```

Both `/lib/ai` import AND `force-dynamic` preserved. No Anthropic SDK direct import.

## Regression #3 — Visual-regression snapshot deletions (AVOIDED)

**On original branch**: ~30+ `*.png` visual-regression baseline files deleted (the branch was operating on stale snapshot state). These deletions would have broken any subsequent visual-regression CI runs.

**Verification on cherry-pick branch**:
```bash
$ ls e2e/visual-tests/ 2>/dev/null | wc -l
0
```

(The path doesn't even exist on main — these are zombie deletions of files that were already absent. Cherry-pick correctly skipped them.)

## Why cherry-pick worked

The original branch's regressions were artifacts of long-running drift between the branch HEAD and main HEAD over weeks. The two LS-relevant commits (`ab7f6cff`, `dc277842`) themselves were atomic and only touched LS files — they never touched the 3 files listed above. So cherry-picking just those commits onto fresh main got the LS work without the drift.

If anyone needs to delete the original branch:
```bash
git branch -D feature/lemonsqueezy-integration
git push origin --delete feature/lemonsqueezy-integration
```

(Recommend doing this once `feature/lemonsqueezy-clean` is merged — the original branch is functionally superseded.)
