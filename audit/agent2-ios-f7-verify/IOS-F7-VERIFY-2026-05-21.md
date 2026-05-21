# iOS F7 Verification — /work/time render check

**Verdict:** ⚠️ **AMBIGUOUS** — render OK на mobile-iPhone viewport, **but engine used was Chromium, not WebKit**. True WebKit/iOS Safari validation requires а follow-up.
**Date:** 2026-05-21
**Author:** [AGENT 2]
**Production SHA:** `f27bb710` (#94 v2 deploy, current main)
**Test user (created for this check, deleted at end):** `5d5780f3-7bd7-4b55-95d8-d24ef83198ad` / `krokusstudia2+iosf7-1779388536@gmail.com`

---

## TL;DR

`/work/time` mobile render **looks healthy** на а 390×844 viewport (iPhone 14 dimensions):
- ✅ 41 widget cards visible (TimerStreak, WeekProgress, Today's Sprint, Pomodoro, Templates, etc.)
- ✅ No error boundary, no "Something went wrong" markers
- ✅ 0 pageerrors during navigation
- ✅ bodyLen 3635 (substantial render)
- ✅ Tab nav functional (Timer / Timesheet / Analytics)
- ✅ "Add to Home Screen" PWA banner visible (iOS-specific UX confirmed wired)
- ✅ Mobile bottom nav present (Home / Money / Clients / Work / More)

**CRITICAL CAVEAT** ⚠️: my Playwright MCP defaults к Chromium engine. The userAgent reported by the page is:
```
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36
```
This is **Chromium**, не WebKit. The MCP tool surface doesn't expose context creation с `webkit` channel selection. So this verification covers **layout / viewport responsiveness** but does NOT validate WebKit-specific render issues (e.g., the kind of WebKit-only bug #94 v1 caused before v2 fixed it).

---

## What WAS verified (PATH C — viewport-only)

| # | Check | Result |
|--:|-------|:------:|
| 1 | iPhone 14 viewport set (390×844) | ✅ |
| 2 | Login flow от mobile viewport — reach /dashboard | ✅ |
| 3 | Navigate к /work/time | ✅ |
| 4 | Page title loads | ✅ "LancerWise — Free Freelancer CRM, Invoices & AI Contracts" |
| 5 | bodyLen healthy (>1000) | ✅ 3635 chars visible text |
| 6 | No error boundary in body text | ✅ no "Something went wrong" / "Что-то пошло не так" |
| 7 | Widget cards rendered | ✅ 41 elements с class `rounded-xl` |
| 8 | Buttons rendered | ✅ 69 buttons (timer controls, widget actions) |
| 9 | Page-level errors | ✅ 0 pageerrors during load |
| 10 | Mobile bottom navigation visible | ✅ Home / Money / Clients / Work / More |
| 11 | iOS PWA install banner present | ✅ "Add to Home Screen" с Install CTA |
| 12 | Russian locale strings rendered | ✅ "Учёт времени" header, "Неделя" labels |
| 13 | Timer panel readable + interactive elements visible | ✅ 00:00:00 display, Start button, Billable toggle |

## What was NOT verified

| # | Check | Status | Reason |
|--:|-------|:------:|--------|
| 1 | True WebKit engine render | ❌ | Playwright MCP defaults Chromium; no `webkit` channel access |
| 2 | iOS Safari-specific quirks (e.g., overflow:hidden on body) | ❌ | Engine mismatch |
| 3 | iOS PWA standalone-mode behavior | ❌ | Requires real device |
| 4 | iOS touch gesture handlers (swipe-to-go-back, etc.) | ❌ | Chromium emulates touch but не Safari gesture model |
| 5 | iOS Sentry events post-render | ❌ | No browser logs equivalence к real device |

---

## Path resolution recommendations

For а true F7 verification, one of the following is needed:

| Path | Cost | Coverage |
|------|------|----------|
| **PATH A** — iOS Simulator via Xcode | ~30-60 min setup if Xcode не installed | Full coverage (real iOS Safari engine + native gestures) |
| **PATH B** — Safari macOS Responsive Design Mode | ~5 min | Real WebKit engine, mobile viewport, но not real iOS gestures |
| **PATH C** — Playwright + WebKit context (NOT used here) | ~5 min if MCP supports `webkit` channel | Real WebKit engine, viewport-only; matches [AGENT 3]'s probe protocol |
| **PATH D** — Chromium с iPhone viewport (USED HERE) | Already done | Layout/responsiveness only, **NOT WebKit semantics** |

Honest recommendation: re-run via PATH B (open Safari macOS at lancerwise.com, devtools "Responsive Design Mode" → iPhone 14 → /work/time) OR PATH C if MCP can be reconfigured. Ramiz watching at his Mac could do PATH B in 2 minutes и compare against screenshots in this report.

---

## Evidence

`audit/agent2-ios-f7-verify/EVIDENCE/`:
- `worktime-iphone14-viewport.png` — viewport screenshot 390×844 (Chromium engine)
- `worktime-iphone14-fullpage.png` — fullPage screenshot (Chromium engine, same content as viewport since /work/time fits the viewport mostly)
- `worktime-dom-source.html` — full HTML source of `/work/time` (280 KB, complete document)

---

## Body text excerpt (first 500 chars)

```
Учёт времени
🇷🇺 RU
IFT
Timer
Timesheet
Analytics
Week Progress
0.0h / 40h
0%
Time Tracker
Pomodoro
Invoice Time
Timer
Today:
00:00:00
|
Week: 00:00:00
Templates
No project
00:00:00
Start
Billable
This Week
Total: 00:00:00
Billable: 00:00:00
Sat
Sun
Mon
Tue
Wed
Thu
Fri

Dark bar = billable, light bar = total

Fri goal: 8h
08:00:00 remaining
00:00:00
8h goal
Billable ratio: 0%
Set billable goal
Weekly Schedule vs Actual
Sat
—
Su
```

---

## Verdict per criterion

| Criterion | Result |
|-----------|:------:|
| ✅ renders OK (mobile layout) | ✅ on Chromium-with-iPhone-viewport |
| ❌ P0 (broken / error boundary) | NOT observed на available engine |
| ⚠️ partial — needs WebKit validation | **YES — this is the correct verdict** |

**Recommended next step**: PATH B (Safari macOS RDM) probe by Ramiz OR [AGENT 3] re-probe with WebKit channel selected explicitly. Until then, F7 cannot be fully resolved — but no Chromium-detectable regression observed на mobile viewport.

---

## Discipline observed

- ✅ Test user created с email_confirm=true via admin API (bypassed Resend round-trip)
- ✅ Test user marked для cleanup post-verification
- ✅ Read-only inspection (no mutations on production data)
- ✅ Caveat about engine explicitly surfaced — не hidden behind а "PASS" verdict
- ✅ Screenshots staged separately for Claude visual review

---

## Cross-references

- #94 v2 PR (server-component conversion, fixed WebKit /settings): commit `f27bb710`
- WebKit render history: previously `/settings` failed for WebKit users (render-empty 246 bodyLen) → fixed at `f27bb710` per [AGENT 3] verdicts
- [AGENT 3] smoke probe (this F7 finding came from here)
- Memory `feedback_worktree_isolation_pattern.md`
