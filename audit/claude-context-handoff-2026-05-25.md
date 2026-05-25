# Claude Context Handoff — 2026-05-25

**For next Claude session.** Read this entire file first before responding to Ramiz.

---

## Кто я и как работаю

Я — **Claude (Anthropic), web/mobile chat в claude.ai**. Я работаю с Ramiz через GitHub MCP integration.

**Мои инструменты:**
- **GitHub MCP** — `get_file_contents`, `create_or_update_file`, `push_files`, `list_commits`, `get_commit`, `pull_request_*`. Я могу читать/писать/коммитить ПРЯМО в репозитории `fer-fer-code/lancerwise` и `fer-fer-code/lancerwise-screenshots`.
- **Phone screenshots** — Ramiz присылает фотки через image upload в чат. Я их вижу нативно как изображения. ЭТО ground truth для verification — я НЕ должен полагаться на текстовые verdict'ы агентов.
- **conversation_search, recent_chats** — past chat memory (если Ramiz явно ссылается на прошлые разговоры).

**Как я фикшу код:** прямые commits в main через `create_or_update_file` или `push_files`. НЕ через PR/branches (мы решили медленно но качественно direct-to-main, у нас pre-launch urgency).

**Что я НЕ могу:**
- Запускать CI локально — полагаюсь на Vercel auto-deploy + Ramiz phone verify
- Открывать прод браузер — Ramiz присылает фотки
- Запускать Claude Code агентов напрямую — Ramiz координирует их в отдельных terminal'ах, передаёт через "→ [AGENT N]:" blocks

---

## Проект

**Lancerwise** — `lancerwise.com`. Next.js 15 + Vercel + Supabase + LemonSqueezy CRM для freelancers. Solo founder Ramiz, бутстрап $25K AUD, цель Pro 1500 пользователей за год.

**Launch:** ProductHunt **Tue 2026-05-26 12:01 AM PDT**. T-~50h на момент написания этого файла.

**Stack notes:**
- Next.js 15.x, Vercel deploy auto-on-main-push
- Supabase для DB + auth + storage
- LemonSqueezy для billing (НЕ Stripe — никогда не упоминать Stripe публично; есть legacy `StripePaymentStatus.tsx` component но он не активен)
- i18n через next-intl (en, ru — Russian L10n уровень 3 в работе)
- Tailwind с design tokens в `src/app/globals.css`

**Repos:**
- `fer-fer-code/lancerwise` — main app
- `fer-fer-code/lancerwise-screenshots` — audit artifacts + agent reports + screenshots

---

## Ramiz — оператор

- В Нячанге (Vietnam), Marina Suites
- Русский язык primary, прямой стиль no-moralizing
- Координирует **6 параллельных Claude Code агентов** в terminal'ах
- В этой сессии все 6 агентов **idle/standby**, я делаю всё сам direct commits
- ВАЖНО: Ramiz сказал "Реши сам нужно сделать всё красивое качественно можно не торопиться можно сделать медленно но качественно" — это режим текущей сессии

**Operational rules для агентов** (если будешь координировать):
1. Agent blocks Russian imperative 50-200 words, code block start `→ [AGENT N]:`
2. End every response "Жду ответы от: [AGENT N]" или "Не жду ответов"
3. Agents do ALL execution (browser, dashboards, OAuth) — Ramiz watching, full access
4. Cross-agent triggers только через Ramiz manual handoff
5. **Visual verification rule:** Claude MUST pull screenshots from GitHub, view independently — НЕ trust текстовый verdict агентов. Lesson learned 3+ раза.
6. Full-page coverage: min 4 captures на страницу или Playwright fullPage:true

---

## ГЛАВНАЯ ЗАДАЧА — SEV1 Palette Regression

### Root cause (двойной баг)

1. **`src/app/globals.css:89`** — `.dark { --background: #0a0a0a }` НЕ был mapped к `--canvas` (#0B0B12). Body использовал `var(--background)` так что warm canvas token никогда не доходил до dark mode. **Fix:** PR #226 (`ac82d6be`) — `.dark { --background: var(--canvas) }`.

2. **Page wrappers + child components hardcode `bg-slate-*`** вместо design tokens. Это leaked navy slate-900 (#0f172a) на всех видимых routes.

### Design tokens (canonical source of truth)

В `src/app/globals.css`:
```
--canvas: #0B0B12      page background
--surface: #11111A     nav chrome
--card: #15151F        cards
--elevated: #1B1B26    modals/hover
--border-subtle: rgba(255,255,255,0.06)
--border: rgba(255,255,255,0.08)
--border-strong: rgba(255,255,255,0.10)
--accent-primary: #6A5AE0
--brand-gradient: linear-gradient(135deg, #483ACC 0%, #935AF0 50%, #F897FE 100%)
```

### Canonical swap rules

| Old (blue slate) | New (warm canvas/card token) |
|---|---|
| `bg-slate-800/50 rounded-xl border border-slate-700` | `bg-card rounded-xl border border-subtle` |
| `bg-slate-800` solid | `bg-elevated` |
| `bg-slate-800/95` (nav chrome) | `bg-surface/95` |
| `bg-slate-900` (input/textarea fill) | `bg-canvas` |
| `bg-slate-900/50` (hover/nested) | `bg-elevated/40` |
| `bg-slate-700` (inline code badge) | `bg-elevated` |
| `border-slate-700` / `/50` | `border-subtle` |
| `border-slate-600` | `border-subtle` или `border-line` |
| `border-dashed border-slate-{600,700}` | `border-dashed border-subtle` |
| `divide-slate-700/40` | `divide-subtle` |
| `hover:bg-slate-700/50` | `hover:bg-elevated/50` |

**НЕ трогать:**
- `bg-violet-*` (brand)
- `bg-green-*`, `bg-red-*`, `bg-amber-*`, `bg-blue-*` (status colors)
- `bg-zinc-*` (intentional contrast — e.g. non-billable button)
- Hero gradient `#090918` background (intentional design)
- CTA banner gradient (intentional design)
- `bg-violet-950/60` (intentional brand)
- `text-slate-700` SVG strokes (donut chart tracks — design choice)
- `bg-slate-950` в Cash Flow tooltip (можно swap to `bg-elevated` для consistency)

---

## Что уже зафикшено (chronological commits на main)

**Pre-session foundation:**
- PR #225 (`3a1c8ecb`) — a11y `text-slate-500 → text-slate-400` (78 WCAG fixes)
- PR #226 (`ac82d6be`) — `.dark --background: var(--canvas)` (Tier 1 root cause)
- PR #227 (`966cc384`) — Tier 2 app shell (layout.tsx, Sidebar, MobileBottomNav nav bar)
- PR #228 (`4e45e054`) — Tier 3+4 surgical: `/pricing` wrapper + `/clients/[id]` page (35 swaps)

**Mid-session direct commits на main (мои first 6):**
1. `27763586` — MarketingNavbar.tsx
2. `7455601e` — MarketingFooter.tsx
3. `5b916649` — PricingSection.tsx (7 swaps)
4. `71f866f4` — ClientActivityFeed.tsx
5. `19e61514` — CommsTimeline.tsx
6. `26d53ada` — MessageThread.tsx

**Tier 4 visible cleanup batch (мои next 14 commits, "медленно но качественно" session):**
7. `a13712fc` — MobileBottomNav.tsx (more-menu popup, 2 lines)
8. `c92ac913` — NotificationPreferences.tsx (3 lines = 58 visible toggle rows)
9. `efeec5a9` — **SettingsRootClient.tsx** (~35 swaps — Profile, Appearance, Business Info, Plan, Items, API, Data, Security, Danger)
10. `5afc67d0` — BrandingSettings.tsx (6 swaps)
11. `3fdbe6d0` — StripePaymentStatus.tsx (5 swaps)
12. `3e414d49` — RateCard.tsx (7 swaps)
13. `9e0d0184` — DiscountCodes.tsx (6 swaps)
14. `94bd6889` — EmailTemplates.tsx (6 swaps)
15. `10dcd172` — LineItemTemplates.tsx (7 swaps)
16. `342ed056` — FreelancerProfile.tsx (9 swaps)
17. `1236bfba` — **Dashboard widgets batch** (CashFlowWidget + CashFlowForecast + HealthScoreWidget, 9 swaps total)
18. `edb85393` — **time-tracker/page.tsx** (=/work/time, ~20 swaps — Timer, Weekly chart, Stats Panel, Manual entry, filters, day/project groups)
19. **`e862699e` — CRITICAL: `src/app/page.tsx` landing page** (~16 swaps — main wrapper `bg-slate-900 → bg-canvas`, Stats bar, Features grid 12 cards, How it works section + 3 mock cards, Use Cases section + 3 cards, FAQ cards)

**HEAD на момент handoff = `e862699e`** (или новее если что-то ship'нулось).

### КРИТИЧЕСКИЙ урок этой сессии

Я **3 раза подряд** упускал что **page wrappers** важнее компонентов:
1. Ramiz прислал phone screenshots `/pricing` + `/clients/[id]` navy → я fix'ил компоненты, забыл wrappers → PR #228 fix'ил wrappers
2. Ramiz прислал screenshots с навы в child components → я fix'ил компоненты
3. **Ramiz прислал 10 screenshots landing page `lancerwise.com`** → я fix'ил authed routes (settings, dashboard, work/time), забыл что landing page имеет свой wrapper `src/app/page.tsx:116` `bg-slate-900` → commit `e862699e` finally fix'нул

**Memory rule (хард-encoded):** Когда Ramiz присылает screenshot — **первым делом** identify URL/route, потом найти **wrapper** этой route, потом дети. Wrapper > children.

---

## Что в БЭКЛОГЕ (НЕ блокер launch, но запланировано)

### Immediate (если Ramiz пришлёт ещё навы)

1. **PortalBrandingSettings.tsx** — 10 swaps. AGENT 6 warned: `:250-:290` preview shell intentionally mimics customer portal default theme. Нужен design call перед swap внутренностей preview. Card chrome + inputs можно swap безопасно.

2. **/insights page bg-slate-950** — AGENT 5 нашёл 10 DOM elements но source files НЕ identified. Нужен `grep -r "bg-slate-950" src/app/(app)/insights/` чтобы найти источник.

3. **/work/time + /insights deep routes** — AGENT 5 нашёл ещё много DOM drift но я не покрыл все. После Ramiz phone verify — добивать.

### Post-launch backlog (deferred, memory-encoded)

1. Remove `|string EmailType`
2. Register Lancerwise legal entity + address
3. Git worktree per agent (isolation)
4. Claude Council skill
5. Mac free voice input
6. Obsidian vault
7. LemonSqueezy Russian welcome email
8. Supabase migration tracking fix (7 untracked, ~45 min + CI gate)
9. /dashboard FCP optimization
10. SEO post-launch — Schema.org Organization, GSC setup, sitemap, 16-query baseline Portugal VPN, Reddit, /alternatives/ pages, long-tail blog, backlinks
11. **Tier 5: ~3,300 invisible widget shells** в deep routes (`/proposals`, `/tools/*`, `/clients/[id]/communications`) — post-launch backlog
12. CLS layout shift bug на `/clients/[id]` (~50 async client components)

### Phase 2 (4-6 недель после launch)

**AI-assistant для freelancers** — поисковик по налогам/контрактам/расценкам:
- Stack: pgvector + Tavily + Claude Sonnet
- Дифференциация: персональный контекст из CRM
- Tier 1: налоги по странам, cross-border, pricing benchmarks, контракты
- Monetization: free 5/мес, Pro unlimited
- Маржа: 75-85%
- Pre-launch: waitlist tease + сбор топ-100 questions
- Юр риски: disclaimers + citations + affiliate с tax pros
- Repositioning: "AI-powered ops layer"

### Long-term

- Lancerwise vision: market leader SaaS CRM для freelancers за 6-12 месяцев, global
- Russian market (Yandex + Bitrix24) deferred 6-12mo post-launch
- AI-native features = product direction
- Geographic target: global, USD globally, Russian cards disabled

---

## Memory rules (мои hard-encoded правила)

1. **Visual verification ground truth.** Agent текстовые verdict'ы NEVER trust. Pull screenshots from independent source. Ramiz phone = canonical ground truth. Когда я "проверяю" свой собственный fix через скриншоты которые сделал агент-фиксер — это confirmation bias, не verification.

2. **Page wrappers > children.** Когда страница выглядит навы — первый кандидат это wrapper класс (`min-h-screen bg-slate-*`). Дети второй.

3. **Design tokens canonical, не reference screenshots.** Spec в context docs И approved reference screenshots оба могут не быть ground truth. Canonical source = design tokens/CSS vars (`globals.css`). Verify: grep var в codebase, verify component uses var не hardcoded Tailwind chains.

4. **Direct main commits acceptable когда:** urgent + small scope + reversion easy + 7+ min CI gate × N PRs unfeasible. Pre-launch SEV1 = текущий case.

5. **Full-page coverage в QA.** Screenshots ВСЕГДА cover full page height. Минимум 4 capture per page или fullPage:true. После PR Claude САМ pull screenshots, view tool, compare с baseline + эталон.

6. **AGENT line-number citations могут быть wrong.** Пример из этой сессии: AGENT 6 указал `settings/page.tsx:308/510` но реальный файл — Suspense wrapper. Visual heavy lifting в `SettingsRootClient.tsx`. **Always verify file contents перед apply edits.**

7. **Agents do ALL execution.** Browser automation, dashboard logins (Supabase/Vercel/Sentry/LS), Turnstile-protected pages через session injection, screenshots, config UI changes, OAuth. Ramiz watching, full access granted. Только исключение: OAuth consent specific to Ramiz identity. Ramiz repeated 6+ times this rule. NEVER suggest manual Ramiz work as fallback.

---

## Текущее состояние pipeline

| Agent | State |
|---|---|
| [AGENT 1] | Stand-down |
| [AGENT 2] | Standby armed |
| [AGENT 3] | Standby armed |
| [AGENT 4] | Standby armed |
| [AGENT 5] | Standby armed (Tier 4 drift audit shipped at `audit/agent5-tier4-drift-audit-2026-05-25/`) |
| [AGENT 6] | Standby armed (Tier 4 honest audit shipped at `audit/agent6-tier4-honest-audit/AUDIT.md`) |

**Все 6 агентов idle. Claude (я) делает всё сам direct commits.**

---

## Артефакты этой сессии

**Post-launch artifacts saved:**
1. **Perplexity-inspired features mockup** (2026-05-24) — `lancerwise-screenshots/post-launch-ideas/perplexity-inspired-features/mockup.html`. 4 фичи: AI Step-by-Step W1, Citations W2-3, AI Sidebar Phase2, Cmd+K Phase2.
2. **Year-1 business plan v1.0** EN+RU HTML (2026-05-25) — `lancerwise-screenshots/post-launch-ideas/business-plan-year-1/business-plan.html` + `business-plan-en.html`. $25K AUD bootstrap, $18K MRR target EOY. Render: `https://raw.githack.com/fer-fer-code/lancerwise-screenshots/main/post-launch-ideas/business-plan-year-1/business-plan{,-en}.html`. KPIs Q1→Q4: Signups 1.5K→25K, WAU 400→7.5K, Subs 40→700, MRR $600→$18K. Cash-flow positive Month 4-5.

**Audit artifacts:**
- `audit/agent5-tier4-drift-audit-2026-05-25/AUDIT.md` — DOM-counting через MCP Playwright, 2,196 drift elements, 9 routes, 11 EVIDENCE JPEGs
- `audit/agent6-tier4-honest-audit/AUDIT.md` — static grep + 12 Ramiz callouts, 17 items / 15 files / ~74 min plan
- `audit/agent6-palette-drift-fix-2026-05-24/REMEDIATION-PLAN.md` — Tier 1-4 master plan

---

## Что прямо сейчас в воздухе

**Последнее что произошло:**

1. Ramiz прислал 10 phone screenshots (`IMG_9313 — IMG_9322`) с landing page `lancerwise.com` — навы везде (FAQ, "For freelancer" use cases, Send invoices step mock, Get paid step mock, Get started in minutes, features grid с Contract Generator/Time Tracker/CRM/Analytics cards, footer).

2. Я **сначала ошибся** — фикснул Settings/Dashboard/work-time (commits 7-18 из списка). Это были полезные fixes но не root cause того что Ramiz видел.

3. **Понял ошибку** когда Ramiz прислал screenshots в полный экран — это landing page, не authed routes. Открыл `src/app/page.tsx`, нашёл line 116 `bg-slate-900` wrapper + кучу children. Зафиксил commit `e862699e` (~16 swaps).

4. Ramiz сказал "Где ответ" — я подумал что он не увидел моё длинное сообщение с fix'ом. Объяснил commit.

5. Ramiz сказал "Потом я тебе ещё отправил скрин скриншоты ты на них не ответил" — я в context **не вижу новых screenshots после `e862699e` commit**. Возможно они не загрузились или были в другом chat session. Попросил переслать.

6. Ramiz сказал "В этом чате заполнилось память составь весь контекст для нового чата" — это сейчас, ты читаешь.

---

## Что должно произойти в новом чате (priority order)

1. **Read this file полностью.** Ничего не пропускать.

2. **Запросить у Ramiz те screenshots которые он сказал что присылал.** Сказать прямо: "Ramiz, я (новый chat) не вижу screenshots которые ты упоминал — пришли заново". Они либо не загрузились в прошлом чате, либо были в другом session.

3. **Проверить deploy status:** `list_commits` на `fer-fer-code/lancerwise` main — убедиться что `e862699e` на месте. Если HEAD дальше — Ramiz или агент что-то ship'нул, узнать что.

4. **Когда Ramiz пришлёт фотки:**
   - Identify URL/route на скриншоте
   - Pull wrapper file ПЕРВЫМ (`src/app/page.tsx`, `src/app/(app)/[route]/page.tsx`, `src/app/(app)/layout.tsx`)
   - Найти `bg-slate-*` / `border-slate-*` на wrapper
   - Apply canonical swap rules (см. таблицу выше)
   - Direct commit на main с descriptive message
   - Дождаться Vercel deploy (~3-5 min)
   - Спросить Ramiz phone verify

5. **НЕ начинать новые scope'ы** пока Tier 3 palette не closed (visual verification на phone). Backlog подождёт.

6. **Если Ramiz скажет "всё ок"** — переходить к ProductHunt launch prep (Tue 2026-05-26 12:01 AM PDT).

---

## Tone и стиль

- Russian primary
- Прямой, no-moralizing, no-bureaucracy
- Короткие сообщения, без лишних объяснений
- Когда облажался — признать прямо ("я облажался", "пропустил") без excessive apology
- Когда уверен — действовать (direct commit), не спрашивать разрешения для мелких swaps
- Когда не уверен (PortalBrandingSettings design call, preview shell) — defer и спросить
- **НИКОГДА** не говорить "VERIFIED PASS" без independent visual check. 3 раза за сессию я это сказал → 3 раза Ramiz прислал screenshot с навы. Lesson hard-coded.

---

## Финал

Pre-launch ProductHunt T-~50h. Palette regression close to done (landing + settings + dashboard + work-time done; insights + PortalBranding в backlog). Ramiz в режиме "медленно но качественно" — спешки нет, важно сделать правильно.

Удачи, новый Claude. Не повторяй мои ошибки с page wrappers.

— Claude (prev session)
