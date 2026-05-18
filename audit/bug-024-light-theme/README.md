# Bug #024 — Light theme migration for /privacy + /terms

**Date:** 2026-05-18
**Branch:** `fix/bug-024-privacy-terms-dark-theme` (lancerwise repo)
**Agent:** [AGENT 1]
**Worktree:** `/Users/myoffice/lancerwise-agent1/`

## What changed
- `/privacy` and `/terms` migrated from light theme (`bg-gray-50`, `bg-white`, `text-gray-700`) to dark marketing theme (`bg-slate-900`, `bg-slate-800`, `text-slate-400`).
- Inline navbar + inline footer replaced with shared `<MarketingNavbar />` + `<MarketingFooter />` components (same chrome as `/about`, `/contact`, `/faq`, `/pricing`, `/changelog`).
- Legal text content unchanged (byte-identical sections).
- `<strong>` emphasis upgraded to `text-slate-200` for dark-theme contrast.

## Evidence files
16 PNGs in this directory, organized as `<state>-<page>-<locale>-<viewport>.png`:

| State | Page | Locale | Viewport | File |
|---|---|---|---|---|
| before | privacy | en | desktop 1280×800 | before-privacy-en-desktop.png |
| before | privacy | en | mobile 390×844 | before-privacy-en-mobile.png |
| before | privacy | ru | desktop | before-privacy-ru-desktop.png |
| before | privacy | ru | mobile | before-privacy-ru-mobile.png |
| before | terms | en | desktop | before-terms-en-desktop.png |
| before | terms | en | mobile | before-terms-en-mobile.png |
| before | terms | ru | desktop | before-terms-ru-desktop.png |
| before | terms | ru | mobile | before-terms-ru-mobile.png |
| after | privacy | en | desktop | after-privacy-en-desktop.png |
| after | privacy | en | mobile | after-privacy-en-mobile.png |
| after | privacy | ru | desktop | after-privacy-ru-desktop.png |
| after | privacy | ru | mobile | after-privacy-ru-mobile.png |
| after | terms | en | desktop | after-terms-en-desktop.png |
| after | terms | en | mobile | after-terms-en-mobile.png |
| after | terms | ru | desktop | after-terms-ru-desktop.png |
| after | terms | ru | mobile | after-terms-ru-mobile.png |

## Other docs
- `discovery.md` — Phase 1 discovery doc (current vs target theme, class swap map, migration plan, risks)

## ESLint i18n delta
**127 → 117 errors (−10)** on these two files. Inline navbar/footer English strings replaced by already-localized shared components.

## CI expectations
- ✅ `eslint i18n` — should pass or improve (10 fewer literals)
- ✅ `locale-purity (ru)` — unchanged; no new RU strings, no new EN leaks
- ⚠️ `visual-regression` — INTENTIONAL FAIL expected; theme change to 2 routes. Self-approve baseline update.
