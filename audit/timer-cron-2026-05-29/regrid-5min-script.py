"""
5-min regrid plan — trigger ONLY if 17:30 UTC re-check confirms granularity hypothesis.
This script:
1. Loads current vercel.json (stagger-deployed, 96 crons, 2-min intervals)
2. Re-assigns schedules onto 5-min boundary grid (0, 5, 10, 15, ..., 55)
3. Validates 0 collisions
4. Saves to vercel.json (overwrites)

Run ONLY after Ramiz OK.
"""
import json
from collections import defaultdict

# Drop already done. Use current state.
# Map: cron name → new schedule on 5-min grid
NEW_SCHEDULES = {
    # === HOUR 6 (2 crons, all critical) ===
    'auto-stop-timers':           '0 6 * * *',
    'generate-recurring-invoices':'5 6 * * *',

    # === HOUR 7 daily (5 critical → 5-min spread) ===
    'expire-proposals':           '0 7 * * *',
    'subscription-renewals':      '5 7 * * *',
    'milestone-reminders':        '10 7 * * *',
    'milestone-alerts':           '15 7 * * *',
    'generate-recurring-tasks':   '20 7 * * *',

    # === HOUR 8 daily (4 critical → 5-min spread, rest moved to 12-14) ===
    'payment-reminders':          '0 8 * * *',
    'contract-renewal-alerts':    '5 8 * * *',
    'renewal-reminders':          '10 8 * * *',
    'retainer-invoices':          '15 8 * * *',

    # === HOUR 9 daily (9 critical → 5-min spread, rest moved) ===
    'invoice-reminders':          '0 9 * * *',
    'auto-invoice-reminders':     '5 9 * * *',
    'late-fees':                  '10 9 * * *',
    'apply-late-fees':            '15 9 * * *',     # was 6 9 — still on 5-grid would be 15
    'auto-invoice-retainers':     '20 9 * * *',
    'renewal-alerts':             '25 9 * * *',
    'viewed-invoice-digest':      '30 9 * * *',
    'proposal-followup':          '35 9 * * *',
    'proposal-expired-alert':     '40 9 * * *',

    # === HOUR 10 daily (5 critical) ===
    'contract-expiry':            '0 10 * * *',
    'overdue-escalation':         '5 10 * * *',
    'overdue-threshold-reminders':'10 10 * * *',
    'send-payment-reminders':     '15 10 * * *',
    'invoice-reminders-auto':     '20 10 * * *',

    # === HOUR 11 daily (4 low-pri, originally moved к 12) — keep moved ===
    # all к 13 UTC instead since 12 is fillig up
    # Decision below

    # === HOUR 12 daily — low-priority gathered ===
    # re-engagement keeps `0 12 * * *` (existing solo)
    'client-anniversary':         '5 12 * * *',
    'client-greetings':           '10 12 * * *',
    'special-dates-greeting':     '15 12 * * *',
    'time-budget-alerts':         '20 12 * * *',
    'revenue-milestone':          '25 12 * * *',
    'burnout-alert':              '30 12 * * *',
    'scope-creep-alert':          '35 12 * * *',
    'budget-alert':               '40 12 * * *',
    'client-checkins':            '45 12 * * *',
    'lead-followups':             '50 12 * * *',
    'stale-draft-invoices':       '55 12 * * *',
    # === HOUR 13 daily — overflow для остальных low-pri ===
    'project-completion-followup':'0 13 * * *',
    'due-soon-reminder':          '5 13 * * *',
    'hours-budget-alert':         '10 13 * * *',
    'retainer-usage-alert':       '15 13 * * *',
    'invoice-aging':              '20 13 * * *',
    'onboarding-nudge':           '25 13 * * *',
    'client-onboarding':          '30 13 * * *',
    'project-survey':             '35 13 * * *',

    # === Monday `0 7 * * 1` (3 crons) ===
    'deadline-reminder':          '0 7 * * 1',
    'weekly-insights':            '5 7 * * 1',
    'ai-weekly-insights':         '10 7 * * 1',

    # === Monday `0 8 * * 1` (4 crons) ===
    'weekly-summary':             '0 8 * * 1',
    'weekly-digest':              '5 8 * * 1',
    'project-health':             '10 8 * * 1',
    'business-pulse':             '15 8 * * 1',

    # === Monday `0 9 * * 1` (3 crons) ===
    'api-key-digest':             '0 9 * * 1',
    'milestone-reminder':         '5 9 * * 1',
    'weekly-report':              '10 9 * * 1',

    # === Monday `30 8 * * 1` → kept в 30/35 (already on grid) ===
    'weekly-time-report':         '30 8 * * 1',
    'project-tracking-gap':       '35 8 * * 1',

    # === Wed `0 9 * * 3` (2 crons) ===
    'at-risk-clients':            '0 9 * * 3',
    'unbilled-digest':            '5 9 * * 3',

    # === Monthly day 1 `0 9 1 * *` (5 crons) ===
    'monthly-digest':             '0 9 1 * *',
    'rate-health-check':          '5 9 1 * *',
    'winback-reminder':           '10 9 1 * *',
    'recurring-expense-summary':  '15 9 1 * *',
    'client-invoice-gap':         '20 9 1 * *',

    # === Day 5 (2 crons) ===
    'project-profitability-report':'0 9 5 * *',
    'monthly-win-rate':           '5 9 5 * *',

    # === Day 10 (2 crons) ===
    'late-payment-pattern':       '0 9 10 * *',
    'goal-progress-alert':        '5 9 10 * *',

    # === Quarterly Jan-Apr-Jul-Oct day 1 (2 crons) ===
    'nps-survey':                 '0 9 1 1,4,7,10 *',
    'quarterly-tax-digest':       '5 9 1 1,4,7,10 *',
}

data = json.load(open('vercel.json'))
crons = data['crons']
touched = set()
for c in crons:
    name = c['path'].replace('/api/cron/', '')
    if name in NEW_SCHEDULES:
        c['schedule'] = NEW_SCHEDULES[name]
        touched.add(name)

# Verify each scheduled cron remains в 5-min grid (check all crons)
def is_on_grid(sched):
    parts = sched.split()
    minute = parts[0]
    # accept "0,5,10..." etc. — for our simple case all minutes are single int
    if minute in ('*', ''):
        return True
    try:
        m = int(minute)
        return m % 5 == 0
    except ValueError:
        # complex format like "*/5" — accept
        return True

off_grid = []
for c in crons:
    if not is_on_grid(c['schedule']):
        off_grid.append((c['path'].replace('/api/cron/',''), c['schedule']))

print(f'Touched: {len(touched)} of {len(NEW_SCHEDULES)} mapped')
print(f'Off-grid (minute not divisible by 5): {len(off_grid)}')
for n, s in off_grid[:10]:
    print(f'  ! {n}  {s}')

# Detect collisions
from collections import defaultdict
sched_map = defaultdict(list)
for c in crons:
    sched_map[c['schedule']].append(c['path'].replace('/api/cron/',''))
print()
print('=== Collisions ===')
collisions = 0
for sched, names in sorted(sched_map.items(), key=lambda x:-len(x[1])):
    if len(names) >= 2:
        collisions += 1
        print(f'  {sched}  →  {", ".join(names)}')
if collisions == 0:
    print('  NONE ✓')

print(f'\nTotal crons: {len(crons)}')
# DO NOT SAVE — this is a dry-run preview
print('\n(DRY RUN — vercel.json NOT modified)')
