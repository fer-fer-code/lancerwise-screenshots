#!/usr/bin/env node
// scripts/qa/locale-purity-ratchet.js
//
// CI gate: compares the total number of EN-on-RU tokens captured by
// tests/e2e/locale-purity.spec.ts against the baseline floor in
// audit/locale-purity-baseline.json. Same shape as the eslint i18n
// ratchet — symmetric pattern, deliberately.
//
// Usage:
//   node scripts/qa/locale-purity-ratchet.js <locale-purity-baseline-failures-json>
//
// Where the input is the JSON file the spec writes (default path:
// audit/locale-purity-baseline-failures.json) — shape:
//   {
//     "scan_timestamp": "...",
//     "base_url": "...",
//     "failures": [
//       { "route": "...", "token": "...", "parent_selector": "...", ... },
//       ...
//     ]
//   }
//
// Exit codes:
//   0  — current ≤ baseline (improvement, exact match, or no failures
//        file at all). If current < baseline, the baseline JSON is
//        rewritten in place with the new lower floor — the workflow
//        commits + pushes it back to the PR branch.
//   1  — current > baseline (regression — merge blocked).
//   2  — bad input (missing file, malformed JSON, etc.).
//
// stdout: single ratchet=... summary line (workflow surfaces in PR check).
// stderr: verbose breakdown with per-route delta + top offending tokens.

const fs = require('node:fs')
const path = require('node:path')

const BASELINE_PATH = path.resolve(__dirname, '..', '..', 'audit', 'locale-purity-baseline.json')

function die(msg, code) {
  process.stderr.write(`locale-purity-ratchet: ${msg}\n`)
  process.exit(code)
}

const reportPath = process.argv[2]
if (!reportPath) die('usage: node scripts/qa/locale-purity-ratchet.js <failures-json>', 2)
if (!fs.existsSync(BASELINE_PATH)) die(`baseline not found: ${BASELINE_PATH}`, 2)

let baseline
try {
  baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8'))
} catch (e) {
  die(`malformed baseline json: ${e.message}`, 2)
}
const baselineCount = Number(baseline.violations)
if (!Number.isFinite(baselineCount)) die('baseline.violations must be a finite number', 2)

// If the failures file is missing it means the spec didn't run or wrote
// nothing — both legitimate "no failures" cases. Treat as current=0.
let failures = []
if (fs.existsSync(reportPath)) {
  let report
  try {
    report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'))
  } catch (e) {
    die(`malformed report json: ${e.message}`, 2)
  }
  failures = Array.isArray(report.failures) ? report.failures : []
} else {
  process.stderr.write(`Note: report file ${reportPath} not present — treating as 0 failures.\n`)
}

const current = failures.length
const delta = current - baselineCount

// Per-route + top-token breakdown
const byRoute = new Map()
const byToken = new Map()
for (const f of failures) {
  byRoute.set(f.route, (byRoute.get(f.route) || 0) + 1)
  byToken.set(f.token, (byToken.get(f.token) || 0) + 1)
}

const pad = (n) => String(n).padStart(6, ' ')

process.stderr.write(`\nlocale-purity ratchet report\n`)
process.stderr.write(`  Rule:     locale-purity-ru (tokens of 3+ Latin chars on RU locale)\n`)
process.stderr.write(`  Baseline: ${pad(baselineCount)}\n`)
process.stderr.write(`  Current:  ${pad(current)}\n`)
process.stderr.write(`  Delta:    ${pad(delta)}\n`)
process.stderr.write(`  Routes flagged: ${byRoute.size}\n\n`)

if (delta > 0) {
  // Show per-route counts so the PR author finds the regression fast.
  const sorted = [...byRoute.entries()].sort((a, b) => b[1] - a[1])
  process.stderr.write(`Routes with most tokens:\n`)
  for (const [route, n] of sorted) {
    process.stderr.write(`  ${pad(n)}  ${route}\n`)
  }
  // Also show the top regressing tokens — these are likely the new EN strings.
  const tokSorted = [...byToken.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  process.stderr.write(`\nTop offending tokens (count across routes):\n`)
  for (const [tok, n] of tokSorted) {
    process.stderr.write(`  ${pad(n)}  ${JSON.stringify(tok)}\n`)
  }
  process.stderr.write(`\n❌ RATCHET FAILED — ${delta} new locale-purity violations introduced.\n`)
  process.stderr.write(`   Either translate the new EN strings via next-intl, or — if the\n`)
  process.stderr.write(`   regression is intentional (e.g., new English-only marketing page)\n`)
  process.stderr.write(`   — raise the baseline in audit/locale-purity-baseline.json with rationale.\n`)
  process.stdout.write(`ratchet=fail current=${current} baseline=${baselineCount} delta=+${delta}\n`)
  process.exit(1)
}

if (delta < 0) {
  // Improvement — lower the baseline floor.
  const updated = {
    ...baseline,
    violations: current,
    updated_at: new Date().toISOString().slice(0, 10),
    updated_by: process.env.GITHUB_SHA
      ? `qa-gates-ci@${process.env.GITHUB_SHA.slice(0, 8)}`
      : 'qa-gates-locale-purity-ratchet',
  }
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(updated, null, 2) + '\n')
  process.stderr.write(`✅ Improvement — ${-delta} fewer locale-purity violations. Baseline lowered to ${current}.\n`)
  process.stderr.write(`   CI workflow will commit the updated audit/locale-purity-baseline.json back to this branch.\n`)
  process.stdout.write(`ratchet=improve current=${current} baseline=${baselineCount} delta=-${-delta}\n`)
  process.exit(0)
}

process.stderr.write(`✅ Ratchet OK — current count matches baseline.\n`)
process.stdout.write(`ratchet=ok current=${current} baseline=${baselineCount} delta=0\n`)
process.exit(0)
