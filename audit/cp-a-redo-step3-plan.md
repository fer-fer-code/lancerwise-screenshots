# CP-A Redo — Step 3 Fix Plan

**Route:** `/dashboard` (signed-in)
**Inventory total:** 227 entries (222 needing RU translation, 5 already done in CP-A pass 1)
**Files touched in plan:** 30 components + 1 API route + 2 new lib files + 2 message files

---

## 1. Executive Summary

Three workstreams running in parallel after plan approval:

1. **Static UI strings (200+ entries)** — wire `useTranslations()` in 30 widget components, route to namespaced keys in `messages/{en,ru}.json`. Mechanical, low risk.
2. **Dynamic API strings (~10 templates)** — `/api/dashboard/super` + `/api/ai/next-action` read `NEXT_LOCALE` cookie and return translated `description` / `action` / `linkLabel` / `reasoning`. New helper `src/lib/api/locale.ts`.
3. **Cross-cutting helpers (3 new files)** — shared `currency.ts` (compact-aware, locale-aware), `plural-hours.ts` (Intl.PluralRules), expanded `bucketForHour()` with 4-bucket support (morning/afternoon/evening/night).

Greeting boundary Q3 resolved as 4-bucket: night `0-4`, morning `5-11`, afternoon `12-17`, evening `18-23`.

**Total estimate: 18–22 hours.** Discrete checkpoints: Step 4a (helpers + Q1 API) ≈ 6h, Step 4b (widget wiring) ≈ 10h, Step 4c (verify captures + comparison report) ≈ 3h.

---

## 2. Locale File Diffs

### messages/ru.json additions

```jsonc
{
  "dashboard": {
    "greeting": {
      "morning": "Доброе утро",
      "afternoon": "Добрый день",
      "evening": "Добрый вечер",
      "night": "Доброй ночи"
    },
    "kpi2": {
      "revenueThisMonth": "Доход за месяц",
      "pendingInvoices": "Ожидают оплаты",
      "timeThisWeek": "Время за неделю",
      "pipelineValue": "Объём воронки",
      "vsLastMonth": "{pct}% к прошлому месяцу",
      "ytd": "С начала года: {amount}",
      "invoicesOutstanding": "{N, plural, one {счёт в ожидании} few {счёта в ожидании} many {счетов в ожидании} other {счёта в ожидании}}: {N}",
      "overdueWithAmount": "просрочено: {N} ({amount})",
      "noneOverdue": "Просрочек нет",
      "openLeads": "{N, plural, one {открытый лид} few {открытых лида} many {открытых лидов} other {открытых лида}}: {N}",
      "activeProjects": "{N, plural, one {активный проект} few {активных проекта} many {активных проектов} other {активных проекта}}: {N}",
      "dueSoon": "скоро срок: {N}",
      "todayHours": "Сегодня: {hours}",
      "toGoal": "до цели: {remaining} (план {goal})",
      "weeklyGoalReached": "✓ Цель на неделю достигнута!"
    },
    "alerts": {
      "needAttention": "{N, plural, one {требует внимания} few {требуют внимания} many {требуют внимания} other {требуют внимания}}: {N}",
      "overdueInvoices": "просрочено счетов: {N}",
      "followUpsOverdue": "просрочено фоллоу-апов: {N}",
      "docsExpiring": "истекает документов: {N}"
    },
    "activeProjects": { "title": "Активные проекты", "noneCreate": "Нет активных проектов. Создать →", "dueWithin14d": "⏰ срок в течение 14 дней: {N}", "noTimeThisWeek": "без учёта времени на этой неделе: {N}", "activeBadge": "АКТИВНО: {N}", "dueSoonBadge": "скоро срок: {N}", "detailedList": "Полный список проектов с клиентами и учётом времени — в разделе Проекты.", "viewAll": "Все проекты →" },
    "followUpsHub": { "title": "Фоллоу-апы", "overdueShort": "⚠ просрочено: {N}", "noneToday": "✓ На сегодня нет", "done": "Готово" },
    "leadPipeline": { "title": "Воронка лидов", "stageProspect": "Потенциал", "stageContacted": "Контакт", "stageProposal": "Предложение", "stageNegotiating": "Переговоры", "totalPipeline": "Объём воронки: {amount}" },
    "recentActivity": { "title": "Недавняя активность", "empty": "Свежей активности пока нет" },
    "revenueOverview": { "title": "Сводка по доходу", "thisMonth": "В этом месяце", "ytd": "С начала года", "lastMonth": "В прошлом месяце: {amount}", "setGoals": "Задайте цели по доходу, чтобы отслеживать прогресс →" },
    "timeThisWeekHub": { "title": "Время за неделю", "none": "На этой неделе время не учтено", "startTracking": "Начать учёт →", "today": "Сегодня", "earlier": "Ранее", "label": "за неделю", "pctGoal": "{pct}% от цели на неделю ({goal})" },
    "revenueChart": { "emptyTitle": "Доходов пока нет", "emptySubtitle": "Создайте первый счёт, чтобы начать отслеживать доход.", "emptyCta": "Новый счёт" },
    "errorState": { "title": "Дашборд временно недоступен", "quickLinks": "Быстрые ссылки:" }
  },
  "client": {
    "status": {
      "active": "Активен",
      "idle": "Пауза",
      "at_risk": "В зоне риска",
      "new": "Новый",
      "overdue": "Просрочка",
      "daysAgo": "{N} дн назад"
    }
  },
  "urgency": {
    "critical": "критично",
    "high": "высокая",
    "medium": "средняя",
    "low": "низкая"
  },
  "format": {
    "hoursUnit": "ч",
    "hoursPlural": "{N, plural, one {{N} час} few {{N} часа} many {{N} часов} other {{N} часа}}",
    "daysPlural": "{N, plural, one {{N} день} few {{N} дня} many {{N} дней} other {{N} дня}}",
    "daysAgo": "{N} дн назад",
    "minutesAgo": "{N} мин назад",
    "hoursAgo": "{N} ч назад",
    "justNow": "только что",
    "yesterday": "Вчера"
  },
  "widget": {
    "freelanceHealth": { "title": "Здоровье фриланс-бизнеса", "subtitle": "5 ключевых индикаторов · скользящие 30 дн", "outOf100": "из 100", "gradeExcellent": "Отлично", "gradeGood": "Хорошо", "gradeFair": "Удовлетв.", "gradeNeedsWork": "Требует работы", "indicators": { "invoiceHealth": "Здоровье счетов", "revenueTrend": "Динамика дохода", "activeClients": "Активные клиенты", "weeklyHours": "Часов в неделю", "activeProjectsLabel": "Активные проекты" }, "details": { "noOverdue": "Просрочек нет", "overdueN": "просрочено: {N}", "vsLastMonth": "{pct}% к прошлому месяцу", "noComparison": "Нет данных для сравнения", "clientsActive30d": "активных клиентов за 30 дн: {N}", "avgWeek": "в среднем {hours} ч/нед", "activeProjectsN": "{N, plural, one {активный проект} few {активных проекта} many {активных проектов} other {активных проекта}}: {N}" } },
    "churn": { "title": "Возобновите контакт с клиентами", "inactive90d": "неактивных 90+ дн: {N}", "checkIn": "Связаться →" },
    "scopeCreep": { "title": "Контроль расширения объёма", "onTrack": "Все проекты в рамках плана", "severityCritical": "Критично", "severityWarning": "Предупреждение" },
    "clientHealth": { "title": "Состояние клиентов", "atRisk": "в зоне риска: {N}", "activeBadge": "активных: {N}", "subtitle": "Статус по счетам, проектам и просрочкам", "moreClients": "ещё клиентов: {N}" },
    "cashFlow": { "title": "Денежный поток", "fullForecast": "Полный прогноз →", "estimatedBalance": "Оценочный баланс", "basedOn30d": "на основе последних 30 дней", "income": "Доход", "expenses": "Расходы", "net": "Чисто", "crunchProjected": "Прогноз кассового разрыва — баланс может упасть до {amount} в период {week}." },
    "earningsGoal": { "title": "Цель по доходу за месяц", "earnedThisMonth": "заработано в этом месяце", "reached": "Цель достигнута!", "toGo": "осталось: {amount}", "save": "Сохранить", "goalEdit": "Цель: {amount} · изменить" },
    "leadsPipeline": { "title": "ВОРОНКА ЛИДОВ", "due": "{N} к сроку", "activeAndExpected": "активных лидов: {N} · ожидается ~{exp}", "won": "выиграно: {N}", "emptyState": "В воронке нет активных лидов" },
    "nextAction": { "title": "СЛЕДУЮЩЕЕ ДЕЙСТВИЕ", "finding": "Подбираем главный приоритет…", "potential": "потенциал: +{currency} {amount}" },
    "todayAgenda": { "title": "План на сегодня", "items": "пунктов: {N}", "overdueInv": "Просроченный счёт", "projectDueToday": "Срок проекта — сегодня", "invoiceDueToday": "Срок счёта — сегодня" },
    "upcomingInvoices": { "title": "Ближайшие сроки", "countLine": "сроков в течение 14 дней: {N}", "unknownClient": "Неизвестно", "daysOverdue": "просрочено на {N} дн", "dueToday": "Срок — сегодня", "dueInDays": "через {N} дн" },
    "contractExpiry": { "title": "Договоры с истекающим сроком", "in60days": "в течение 60 дней: {N}", "daysLeft": "осталось {N} дн" },
    "unbilled": { "title": "Неоплаченное время", "subtitle": "Оплачиваемые часы по проектам без счёта", "createInvoiceTooltip": "Создать счёт по этому проекту", "totalSuffix": "всего: {amount}", "unbilledLabel": "без счёта", "moreLink": "ещё {N} →" },
    "workStreak": { "title": "Серия работы", "subtitle": "Последние 14 дней · подряд дней с учётом времени", "tooltipWorked": "Был на работе", "tooltipNoEntry": "Нет записи" },
    "activeTimer": { "view": "Открыть", "noProject": "Без проекта", "stop": "Стоп" },
    "earningsPace": { "title": "Темп заработка", "thisMonthDay": "В этом месяце (день {day})", "projected": "Прогноз на весь месяц" },
    "recurringRev": { "title": "Регулярный vs разовый доход", "recurring": "Регулярный", "oneTime": "Разовый" },
    "proposalWinRate": { "title": "Конверсия предложений" },
    "hourlyEarnings": { "title": "Темп заработка", "dailyAvg": "В среднем в день", "weeklyAvg": "В среднем в неделю" },
    "runRate": { "title": "Темп годового дохода", "monthly": "В месяц", "quarterly": "В квартал", "toMilestone": "До {amount}/год" },
    "taxEstimate": { "title": "Налог: оценка", "basedOn": "При ставке {pct}% · только оценка", "qEstimate": "Налог за Q{n}", "ytdRevenue": "Доход с начала года", "ytdTax": "Налог с начала года @ {pct}%", "sePortion": "Доля соц. налога", "annualProjected": "Прогноз годового налога", "consult": "Для точных цифр обратитесь к налоговому консультанту." },
    "overduePulse": { "title": "Просроченные счета" },
    "agingAlert": { "title": "Тревога по давности ⚠️", "line": "просрочено на 60+ дн: {N} — под риском {amount}", "viewReport": "Открыть отчёт" },
    "diversification": { "title": "Диверсификация", "others": "Остальные ({N})" },
    "burnout": { "title": "Баланс работы и отдыха" },
    "goalProgress": { "title": "Прогресс по целям", "monthlyRev": "Доход за месяц", "thisMonth": "В этом месяце", "weeklyHours": "Часы за неделю", "thisWeek": "На этой неделе", "emptyCta": "Задайте цели по доходу и часам", "noGoalSet": "Цель не задана", "manage": "Управлять" },
    "milestones": { "title": "Финансовые вехи", "latest": "Последнее достижение" },
    "activeProjBudget": { "title": "Бюджеты активных проектов", "overBudget": "превышено бюджетов: {N}", "withBudget": "активных проектов с заданным бюджетом: {N}", "totalBudget": "Всего бюджет", "invoicedSoFar": "Выставлено счетов", "hoursTracked": "учтено: {hours}" },
    "monthlyRevGauge": { "title": "Шкала дохода за месяц", "target": "Цель: {amount} (+10% к прошлому месяцу)", "thisMonth": "В этом месяце", "remaining": "Осталось" },
    "weeklyIncome": { "title": "Доход за неделю" },
    "clientInactive": { "title": "Неактивные клиенты", "dormant": "спящих: {N}", "subtitle": "За 90 дней не было счетов или проектов — стоит возобновить контакт:", "reengage": "Связаться" },
    "followUps": { "upcomingTitle": "Ближайшие фоллоу-апы", "overdueBadge": "просрочено: {N}", "viewAll": "Все", "unknownClient": "Неизвестно", "dueDaysOverdue": "просрочено на {N} дн", "dueToday": "сегодня", "dueTomorrow": "завтра", "dueInDays": "через {N} дн" }
  },
  "activity": {
    "invoiceDraft": "Счёт {number} в черновиках",
    "invoiceSent": "Счёт {number} отправлен",
    "invoicePaid": "Счёт {number} оплачен",
    "invoiceOverdue": "Счёт {number} просрочен",
    "timeLogged": "Учтено {minutes} мин: {description}",
    "timeLoggedNoDesc": "Учтено {minutes} мин",
    "projectActive": "Проект «{title}» активен",
    "projectCompleted": "Проект «{title}» завершён",
    "proposalSent": "Предложение {number} отправлено",
    "proposalAccepted": "Предложение {number} принято"
  },
  "common": {
    "untitled": "без названия"
  }
}
```

`messages/en.json` mirrors keys (existing values stay, new ones added with EN text). Total new keys: ~135.

---

## 3. File-by-File Plan

| # | File | Hook | Keys used | Lines edited | hrs |
|---|---|---|---|---|---|
| 1 | `SuperDashboardClient.tsx` | `useTranslations()` | `dashboard.kpi2.*`, `dashboard.alerts.*`, `dashboard.activeProjects.*`, `dashboard.followUpsHub.*`, `dashboard.leadPipeline.*`, `dashboard.recentActivity.*`, `dashboard.revenueOverview.*`, `dashboard.timeThisWeekHub.*`, `dashboard.errorState.*`, `format.hoursPlural`, `format.justNow/minutesAgo/hoursAgo/yesterday/daysAgo`, `widget.followUps.unknownClient` | ~80 lines | 3.0 |
| 2 | `DashboardClient.tsx` (RevenueLineChart) | `useTranslations()` | `dashboard.revenueChart.*` | 3 lines (386,387,392) | 0.3 |
| 3 | `FreelanceHealthScore.tsx` | `useTranslations()` | `widget.freelanceHealth.*` (15 keys) | ~12 lines | 0.8 |
| 4 | `ChurnRisk.tsx` | `useTranslations()` | `widget.churn.*` | 3 lines | 0.2 |
| 5 | `ScopeCreepWidget.tsx` | `useTranslations()` | `widget.scopeCreep.*` | 4 lines | 0.2 |
| 6 | `ClientHealthGrid.tsx` | `useTranslations()` | `client.status.*`, `widget.clientHealth.*` | ~10 lines | 0.6 |
| 7 | `ClientInactiveAlert.tsx` | `useTranslations()` | `widget.clientInactive.*` | 4 lines | 0.2 |
| 8 | `CashFlowWidget.tsx` | `useTranslations()` | `widget.cashFlow.*` | 8 lines | 0.4 |
| 9 | `EarningsGoalRing.tsx` | `useTranslations()` | `widget.earningsGoal.*` | 7 lines | 0.4 |
| 10 | `LeadsPipelineWidget.tsx` | `useTranslations()` | `widget.leadsPipeline.*`, stage labels | 8 lines | 0.4 |
| 11 | `NextActionWidget.tsx` | `useTranslations()` | `widget.nextAction.*`, `urgency.*` | 5 lines | 0.3 |
| 12 | `TodayAgenda.tsx` (server!) | `getTranslations()` | `widget.todayAgenda.*` | 5 lines | 0.4 |
| 13 | `FollowUpsWidget.tsx` | `useTranslations()` | `widget.followUps.*` | 8 lines | 0.4 |
| 14 | `ActiveProjectsBudgetSummary.tsx` | `useTranslations()` | `widget.activeProjBudget.*` | 7 lines | 0.4 |
| 15 | `MonthlyRevenueGauge.tsx` | `useTranslations()` | `widget.monthlyRevGauge.*` | 4 lines | 0.2 |
| 16 | `WeeklyIncomeSnapshot.tsx` | `useTranslations()` | `widget.weeklyIncome.*` | 1 line | 0.1 |
| 17 | `EarningsPaceWidget.tsx` | `useTranslations()` | `widget.earningsPace.*` | 3 lines | 0.2 |
| 18 | `RecurringRevenueTracker.tsx` | `useTranslations()` | `widget.recurringRev.*` | 3 lines | 0.2 |
| 19 | `ProposalWinRateWidget.tsx` | `useTranslations()` | `widget.proposalWinRate.*` | 1 line | 0.1 |
| 20 | `HourlyEarningsWidget.tsx` | `useTranslations()` | `widget.hourlyEarnings.*` | 3 lines | 0.2 |
| 21 | `RevenueRunRate.tsx` | `useTranslations()` | `widget.runRate.*` | 4 lines | 0.2 |
| 22 | `TaxEstimateWidget.tsx` | `useTranslations()` | `widget.taxEstimate.*` | 8 lines | 0.4 |
| 23 | `OverduePulse.tsx` | `useTranslations()` | `widget.overduePulse.title` | 1 line | 0.1 |
| 24 | `AgingAlertWidget.tsx` | `useTranslations()` | `widget.agingAlert.*` | 3 lines | 0.2 |
| 25 | `DiversificationWidget.tsx` | `useTranslations()` | `widget.diversification.*` | 2 lines | 0.1 |
| 26 | `BurnoutWidget.tsx` | `useTranslations()` | `widget.burnout.*` | 1 line | 0.1 |
| 27 | `GoalProgressWidget.tsx` | `useTranslations()` | `widget.goalProgress.*` | 7 lines | 0.4 |
| 28 | `EarningsMilestones.tsx` | `useTranslations()` | `widget.milestones.*` | 2 lines | 0.1 |
| 29 | `UpcomingInvoicesDue.tsx` | `useTranslations()` | `widget.upcomingInvoices.*`, `format.*` | 6 lines | 0.4 |
| 30 | `ContractExpiryCountdown.tsx` | `useTranslations()` | `widget.contractExpiry.*` | 3 lines | 0.2 |
| 31 | `UnbilledTimeAlert.tsx` | `useTranslations()` | `widget.unbilled.*` | 6 lines | 0.3 |
| 32 | `WorkStreakWidget.tsx` | `useTranslations()` | `widget.workStreak.*`, `format.daysPlural` | 4 lines | 0.3 |
| 33 | `ActiveTimer.tsx` | `useTranslations()` | `widget.activeTimer.*` | 3 lines | 0.2 |
| **Subtotal — widget wiring** | | | | | **10.0** |
| 34 | NEW `src/lib/format/currency.ts` | server+client | shared helper | new file ~25 lines | 0.8 |
| 35 | NEW `src/lib/format/plural-hours.ts` | shared | shared helper | new file ~20 lines | 0.5 |
| 36 | NEW `src/lib/api/locale.ts` | server | shared helper (reads NEXT_LOCALE) | new file ~15 lines | 0.4 |
| 37 | `src/app/api/dashboard/super/route.ts` | server | activity descriptions | ~30 lines (template branch) | 2.0 |
| 38 | `src/app/api/ai/next-action/route.ts` | server | action.action/linkLabel/reasoning | ~20 lines (AI prompt locale + post-process) | 1.5 |
| 39 | `src/components/dashboard/WelcomeBanner.tsx` | useTranslations | extend bucketForHour to 4-bucket + add night icon | 4 lines | 0.3 |
| 40 | `messages/{en,ru}.json` | — | 135 new keys | ~250 lines added | 1.5 |
| **Subtotal — helpers + API** | | | | | **7.0** |
| **TOTAL ESTIMATE** | | | | | **17.0–22.0** |

---

## 4. Server-Side Q1 Fix — Activity Feed + Next Action

### 4.1 New helper: `src/lib/api/locale.ts`

```ts
import { cookies } from 'next/headers'
import { isLocale, defaultLocale, type Locale } from '@/i18n/config'

/** Read NEXT_LOCALE cookie from server route. Falls back to defaultLocale. */
export async function getRequestLocale(): Promise<Locale> {
  const c = await cookies()
  const v = c.get('NEXT_LOCALE')?.value
  return isLocale(v) ? v : defaultLocale
}
```

### 4.2 `/api/dashboard/super/route.ts` — activity.description templates

Current code (~line 200 estimated) builds English strings inline. New code:

```ts
import { getRequestLocale } from '@/lib/api/locale'
import { getTranslations } from 'next-intl/server'

export async function GET() {
  const locale = await getRequestLocale()
  const t = await getTranslations({ locale, namespace: 'activity' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  // ... existing data fetch ...
  const activity = rawActivity.map(item => {
    switch (item.type) {
      case 'invoice':
        return { ...item, description: t(`invoice${capitalize(item.status)}`, { number: item.invoice_number }) }
      case 'time':
        return {
          ...item,
          description: item.description
            ? t('timeLogged', { minutes: item.duration_min, description: item.description })
            : t('timeLoggedNoDesc', { minutes: item.duration_min })
        }
      case 'project':
        return { ...item, description: t(`project${capitalize(item.status)}`, { title: item.title }) }
      case 'proposal':
        return { ...item, description: t(`proposal${capitalize(item.status)}`, { number: item.number }) }
    }
  })
  return Response.json({ ..., activity })
}
```

**Fallback contract:** if `NEXT_LOCALE` cookie missing or invalid → `defaultLocale = 'en'`. Tested via unit (item 4.4).

### 4.3 `/api/ai/next-action/route.ts` — AI prompt locale

Two-pass approach:
1. Pass `locale` param to `generateText()` in lib/ai (already exists per CP-A pass 1 — `auto-locale propagation`).
2. The system prompt to the LLM should say: `Respond in Russian if locale=ru, otherwise English. All linkLabel values must be one of: ['Send invoice', 'Log time', 'Review proposal', ...] — translate after.`

Cleanest: keep AI response in English, post-process `urgency` enum + map `linkLabel` to fixed keys, but let `action`/`reasoning` come in locale via lib/ai's automatic cookie detection (Phase 11 advisor pattern).

### 4.4 Unit test snippet

```ts
// __tests__/api/dashboard/super.locale.test.ts
import { GET } from '@/app/api/dashboard/super/route'
import { cookies } from 'next/headers'

vi.mock('next/headers', () => ({ cookies: () => ({ get: (n: string) => n === 'NEXT_LOCALE' ? { value: 'ru' } : null }) }))

it('returns Russian activity descriptions when NEXT_LOCALE=ru', async () => {
  const res = await GET()
  const body = await res.json()
  expect(body.activity[0].description).toMatch(/Счёт INV-\d+ /)
  expect(body.activity[0].description).not.toMatch(/Invoice INV-/)
})

it('falls back to English when NEXT_LOCALE missing', async () => {
  vi.mocked(cookies).mockReturnValueOnce({ get: () => null } as never)
  const res = await GET()
  const body = await res.json()
  expect(body.activity[0].description).toMatch(/Invoice INV-/)
})
```

---

## 5. Compact Currency Q2

### 5.1 Proposed shared helper: `src/lib/format/currency.ts`

```ts
type Opts = { compact?: boolean; maximumFractionDigits?: number }

/** Locale-aware currency formatter. Reads locale from explicit arg.
 *  Compact mode produces "$1.2K"/"1,2 тыс. $" output. */
export function formatCurrencyLocale(amount: number, currency = 'USD', locale: 'en' | 'ru-RU' = 'en', opts: Opts = {}): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: opts.compact ? 'compact' : 'standard',
    maximumFractionDigits: opts.maximumFractionDigits ?? (opts.compact ? 1 : 0),
  }).format(amount)
}
```

### 5.2 Node REPL output (run on system Node v22.22.1)

```
=== Compact currency: $1.2k notation ===

Locale: en
  1,234 -> $1.2K
  12,345 -> $12.3K
  123,456 -> $123.5K
  1,234,567 -> $1.2M

Locale: ru-RU
  1,234 -> 1,2 тыс. $
  12,345 -> 12,3 тыс. $
  123,456 -> 123,5 тыс. $
  1,234,567 -> 1,2 млн $

=== Full currency (no compact) ===

Locale: en
  1,234 -> $1,234
  12,345 -> $12,345
  123,456 -> $123,456
  1,234,567 -> $1,234,567

Locale: ru-RU
  1,234 -> 1 234 $
  12,345 -> 12 345 $
  123,456 -> 123 456 $
  1,234,567 -> 1 234 567 $
```

### 5.3 Affected widgets

ClientHealthGrid (line 105 — current `new Intl.NumberFormat('en', ...)`), LeadsPipelineWidget (fmt helper line 30-34), SuperDashboardClient (fmt helper line 57). All swap inline calls → `formatCurrencyLocale(value, currency, locale, { compact: true })`.

---

## 6. Night Bucket Q3 — Greeting

### 6.1 Proposed bucketForHour (replace existing)

```ts
function bucketForHour(h: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 18) return 'afternoon'
  if (h >= 18 && h < 23) return 'evening'
  return 'night'  // 23, 0, 1, 2, 3, 4
}
```

### 6.2 Test matrix — 16 boundary cases

| h | bucket | greeting (RU) | icon |
|---|---|---|---|
| 0 | night | Доброй ночи | Moon |
| 1 | night | Доброй ночи | Moon |
| 2 | night | Доброй ночи | Moon |
| 3 | night | Доброй ночи | Moon |
| 4 | night | Доброй ночи | Moon |
| 5 | morning | Доброе утро | Sunrise |
| 6 | morning | Доброе утро | Sunrise |
| 11 | morning | Доброе утро | Sunrise |
| 12 | afternoon | Добрый день | Sun |
| 14 | afternoon | Добрый день | Sun |
| 17 | afternoon | Добрый день | Sun |
| 18 | evening | Добрый вечер | (NEW: Sunset) |
| 20 | evening | Добрый вечер | Sunset |
| 22 | evening | Добрый вечер | Sunset |
| 23 | night | Доброй ночи | Moon |

### 6.3 Icon decision — REVIEWER APPROVAL NEEDED

**Recommendation:** Add lucide `Sunset` icon for evening (18-22), use `Moon` for night (23-04). Today's code uses `Moon` for evening 18-23 which is OK but conflates "evening" with "night". Sunset is more semantically correct for the 18-22 window when sun is setting but social context is still "evening".

**Alternative (zero new icon):** Keep `Moon` for both evening + night (status quo) but use different greeting strings. Marginally less clear.

→ **Q3 final decision needed before Step 4.**

---

## 7. Plural Rules for Hours/Days

### 7.1 Strategy

Use ICU MessageFormat via next-intl `t()` with `{N, plural, one {…} few {…} many {…} other {…}}` syntax. Implemented natively in next-intl@4 (we're on this version per CP1).

### 7.2 Node REPL — Intl.PluralRules('ru-RU')

```
n=0  en: other   ru: many
n=1  en: one     ru: one
n=2  en: other   ru: few
n=4  en: other   ru: few
n=5  en: other   ru: many
n=11 en: other   ru: many
n=21 en: other   ru: one
n=22 en: other   ru: few
n=25 en: other   ru: many
```

### 7.3 Example renderings

| N | category | "час" | "день" |
|---|---|---|---|
| 1 | one | час | день |
| 2 | few | часа | дня |
| 5 | many | часов | дней |
| 21 | one | час | день |
| 22 | few | часа | дня |
| 25 | many | часов | дней |
| 40 | many | часов | дней |

---

## 8. Status Enum — ClientHealthGrid

**Source:** INLINE in `src/app/(app)/dashboard/ClientHealthGrid.tsx:52` — `type health = 'active' | 'idle' | 'at-risk' | 'new'`. No shared enum file (verified by grep). Plan extracts to `messages/*.json` under `client.status.*` namespace; does NOT create new shared TS type (orthogonal refactor — flagged but not in CP-A scope).

| Enum value | EN render | RU render |
|---|---|---|
| `'active'` | Active | Активен |
| `'idle'` | Idle | Пауза |
| `'at-risk'` | At risk (legend) / Overdue (row) | В зоне риска / Просрочка |
| `'new'` | New | Новый |

Note: `'at-risk'` renders DIFFERENTLY depending on context (legend label vs row label). Two separate keys: `client.status.at_risk` (legend) and `client.status.overdue` (row).

---

## 9. Urgency Enum — NextActionWidget

**Source:** INLINE in `src/app/(app)/dashboard/NextActionWidget.tsx:10`. Also generated by `/api/ai/next-action/route.ts` (4 enum locations: lines 168, 215, 227, 238). Plan: extract to `urgency.*` namespace, no shared TS type.

| Enum value | EN | RU |
|---|---|---|
| `'critical'` | critical | критично |
| `'high'` | high | высокая |
| `'medium'` | medium | средняя |
| `'low'` | low | низкая |

---

## 10. Empty States

Comprehensive list (12 distinct empty states across rendered widgets):

| Widget | Trigger | EN | RU key |
|---|---|---|---|
| RevenueLineChart | `data.length === 0 \|\| totalSum === 0` | "No revenue yet" + subtitle + "New invoice" | `dashboard.revenueChart.empty*` |
| LeadsPipelineWidget | `stats.total_active === 0` | "No active leads in pipeline" | `widget.leadsPipeline.emptyState` |
| SuperDashboardClient — Active Projects | `projects.active_count === 0` | "No active projects. Create one →" | `dashboard.activeProjects.noneCreate` |
| SuperDashboardClient — Follow-ups | `follow_ups.due_today.length === 0` (no overdue) | "✓ No follow-ups due today" | `dashboard.followUpsHub.noneToday` |
| SuperDashboardClient — Recent Activity | `activity.length === 0` | "No recent activity yet" | `dashboard.recentActivity.empty` |
| SuperDashboardClient — Time This Week | `time.week_hours === 0` | "No time logged this week" + "Start tracking →" | `dashboard.timeThisWeekHub.none/startTracking` |
| FollowUpsWidget | `items.length === 0` | (widget returns null) | — |
| TodayAgenda | totalItems===0 | (component returns null) | — |
| EarningsGoalRing | n/a | shows zero state inline | `widget.earningsGoal.toGo` |
| GoalProgressWidget | `revenue.target===null && hours.target===null` | "Set revenue & hours goals" | `widget.goalProgress.emptyCta` |
| ClientHealthGrid | `clients.length === 0` | (component returns null) | — |
| ChurnRisk | `atRisk.length === 0` | (component returns null) | — |

---

## 11. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Existing en.json duplicate keys collide with new namespacing | M | L | Pre-implementation grep `messages/en.json` for `clientHealth`/`leadsPipeline`/`urgency` keys (none expected — separate ru-prefix paths). |
| next-intl ICU plural syntax unsupported in installed version | L | H | Verify `pnpm why next-intl` → should be v4+ which supports ICU plurals natively. Tested above with `Intl.PluralRules` directly. |
| getTranslations from /api/dashboard/super doesn't pickup right locale (SSR vs route handler context) | M | M | Use explicit `getTranslations({ locale, namespace })` form rather than auto-detected. Cookie read via own helper guarantees value. |
| Playwright tests pinned to English strings (e.g. test-results/...) break post-fix | M | L | Pre-fix grep `tests/` for hardcoded English UI strings. Update tests OR (preferred) tag tests with locale + skip RU tests until baseline restored. |
| Activity feed translation requires re-running cron for past records | L | L | Activity feed is a "current state" view (rolling 30d). No retroactive translation needed; new translations apply to new records. |
| AI-generated `action.action` string can't be cleanly translated post-hoc | M | M | Per Phase 11 advisor pattern: pass locale to AI prompt as system instruction. Validation: snapshot last 30 prod responses to confirm. |

### Pre-implementation grep checks

```bash
# Duplicate key sanity
grep -c '"clientHealth"\|"leadsPipeline"\|"urgency"' messages/en.json messages/ru.json
# Expected: 0 in current state (new namespaces)

# Playwright test pinned to EN
grep -rn '"No revenue yet"\|"Set revenue goals"\|"Cash Flow"\|"Freelance Health Score"' tests/ 2>/dev/null
# Expected: catalogue, then update or mark .skip
```

---

## 12. Estimate Recap

| Phase | Hours |
|---|---|
| Step 4a — helpers (currency.ts, plural-hours.ts, locale.ts) + Q1 API (dashboard/super + ai/next-action) + 4-bucket greeting | 6.0 |
| Step 4b — 30 widget wirings | 10.0 |
| Step 4c — verify captures + comparison report | 3.0 |
| **TOTAL** | **17–22 hours** |

Reviewer approval gates:
1. Q1 confirmed in scope (activity API translation)
2. Q2 compact currency direction (formatter helper)
3. Q3 night bucket icon choice (new Sunset vs reuse Moon)
4. Discovered_issues: 5 items in inventory _meta need yes/no decisions

---

## END OF PLAN

Standing by for reviewer approval to begin Step 4.
