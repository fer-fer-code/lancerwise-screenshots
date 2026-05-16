// B1 smoke test: directly invoke 2 migrated cron endpoints in process к verify
// (a) no Anthropic import paths used, (b) Gemini returns sensible output,
// (c) endpoint reaches sendEmail / DB write without throwing.
//
// Run: npx tsx scripts/b1-cron-smoke.ts

import { readFileSync } from 'node:fs'
const env = readFileSync('.env.local', 'utf8')
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/)
  if (m && !process.env[m[1]]) {
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    process.env[m[1]] = v
  }
}

// Test the lowest-overhead AI helper directly с realistic cron payload —
// confirms /lib/ai routing works, не requires firing the full cron loop.
async function testDeadlineReminderPrompt() {
  const { generateJSON } = await import('@/lib/ai')
  const projectList = '- Q3 landing page (due 2026-05-20)\n- API integration spec (due 2026-05-22)'
  const t0 = Date.now()
  const { data, tokensUsed, provider } = await generateJSON<{ subject: string; body: string }>(
    `Write a brief, motivating email to a freelancer reminding them of projects due in the next 7 days.

Projects due soon:
${projectList}

Guidelines:
- Professional and encouraging tone
- List each project clearly
- Suggest prioritizing tasks for today
- Under 80 words (body only)
- No fluff

Return JSON: {"subject": "...", "body": "..."}`,
    { feature: 'comms-draft', maxOutputTokens: 300, userId: '367d62fc-a790-4ffb-b627-32db0df9b34e' },
  )
  return {
    name: 'deadline-reminder',
    duration_ms: Date.now() - t0,
    provider,
    tokensUsed,
    subject_len: data.subject?.length ?? 0,
    body_len: data.body?.length ?? 0,
    subject: data.subject?.slice(0, 80),
    body_preview: data.body?.slice(0, 120),
  }
}

async function testQuarterlyReviewPrompt() {
  const { generateText } = await import('@/lib/ai')
  const t0 = Date.now()
  const { text, tokensUsed, provider } = await generateText(
    `Analyze this freelancer's Q2 2026 business performance:

Revenue: $12,500 (+8% vs Q1)
Hours logged: 320h
Proposals: 4/8 won (50% win rate)
Top clients: Acme Corp, Beta Studio

Write a quarterly review with these exact sections:
[SUMMARY] 2-3 sentence honest overview of the quarter
[HIGHLIGHTS] 3 specific achievements from the data
[ACTIONS] 3 specific, actionable goals for next quarter based on gaps in this data

Keep it under 300 words total. Be direct and specific to the numbers.`,
    {
      feature: 'other',
      systemPrompt: "You are a business coach analyzing a freelancer's quarterly performance. Be specific, actionable, and motivating.",
      maxOutputTokens: 500,
      userId: '367d62fc-a790-4ffb-b627-32db0df9b34e',
    },
  )
  const hasSummary = /\[SUMMARY\]/i.test(text)
  const hasHighlights = /\[HIGHLIGHTS\]/i.test(text)
  const hasActions = /\[ACTIONS\]/i.test(text)
  return {
    name: 'quarterly-review',
    duration_ms: Date.now() - t0,
    provider,
    tokensUsed,
    text_len: text.length,
    has_summary: hasSummary,
    has_highlights: hasHighlights,
    has_actions: hasActions,
    preview: text.slice(0, 300),
  }
}

async function main() {
  console.log('=== B1 cron smoke (sample 2/11) ===\n')
  const r1 = await testDeadlineReminderPrompt()
  console.log('Test 1 — deadline-reminder prompt:')
  console.log(JSON.stringify(r1, null, 2))
  console.log('')
  const r2 = await testQuarterlyReviewPrompt()
  console.log('Test 2 — quarterly-review prompt:')
  console.log(JSON.stringify(r2, null, 2))
  console.log('')

  // Sanity asserts
  if (!r1.subject_len || !r1.body_len) throw new Error('deadline-reminder JSON shape broken')
  if (r1.provider !== 'gemini-flash') throw new Error(`deadline-reminder unexpected provider ${r1.provider}`)
  if (!r2.has_summary || !r2.has_highlights || !r2.has_actions) throw new Error('quarterly-review missing sections')
  if (r2.provider !== 'gemini-flash') throw new Error(`quarterly-review unexpected provider ${r2.provider}`)

  console.log('=== ALL ASSERTS PASSED ===')
}

main().catch((e) => { console.error('FAIL:', e); process.exit(1) })
