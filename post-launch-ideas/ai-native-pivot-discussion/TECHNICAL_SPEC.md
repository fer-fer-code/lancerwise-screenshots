# Lancerwise AI-Native — Технический Spec & Архитектура

**Версия:** 1.0
**Дата:** 27 мая 2026
**Статус:** Draft для review Ramiz
**Цель:** Полный план чтобы агенты строили без багов и глюков

---

## 1. Общая стратегия

### 1.1 Подход
- **Не переписываем** существующий Lancerwise
- **Добавляем AI layer** поверх существующего кода (новые компоненты, новые API routes)
- **Старые виджеты остаются** как fallback — если AI не сработал, юзер всегда может через форму
- **Новый дизайн** (premium glassmorphism, violet/pink) применяется к **новым AI-компонентам**. Существующие виджеты обновляются постепенно, не ломая работу.

### 1.2 Принципы качества
1. **Каждая фича строится end-to-end до перехода к следующей** — не три фичи на 50%, а одна на 100%
2. **Перед merge каждой части — full QA от AGENT 3** с screenshots
3. **Sentry монитор на каждом новом endpoint** — фиксируем ошибки в real-time
4. **Feature flags на каждой фиче** — можем выключить если ломает прод
5. **Database migrations с откатом** — каждая миграция должна иметь rollback
6. **Никаких mock data в production** — только реальные API calls
7. **TypeScript strict mode** на всех новых файлах — нулевая толерантность к `any`
8. **Unit tests на критичные функции** — voice parsing, intent detection, tool calling

### 1.3 Что НЕ делаем в этой итерации
- ❌ Photo recognition (Phase 2)
- ❌ Q&A с источниками (Phase 2)
- ❌ AI sidebar и Cmd+K расширение (Phase 2)
- ❌ Видео транскрипция, скриншоты переписок (Phase 3)
- ❌ Email integration (Phase 3)

**Только одна фича:** голос → счёт (полный flow от микрофона до созданного invoice).

---

## 2. Архитектура

### 2.1 Stack

**Frontend:**
- Next.js 16.2.6 (текущий)
- React 19 (текущий)
- Tailwind CSS (текущий)
- Framer Motion (новое — для анимаций AI bar)
- Lucide React (текущий — для иконок)

**Backend:**
- Next.js API Routes (текущий)
- Supabase PostgreSQL (текущий)
- Supabase Realtime (текущий — для widget stack updates)

**AI Stack (новое):**
- **Voice transcription:** Groq Whisper Large v3 Turbo
  - Free tier: Web Speech API (browser native)
  - Pro tier: Groq API
- **Intent parsing + Tool calling:** Anthropic API
  - Model: `claude-sonnet-4-5-20250514` для mutations (создание счёта)
  - Model: `claude-haiku-4-5-20251001` для read queries
  - Prompt caching enabled (90% discount на system prompt)
- **Audio capture:** Web MediaRecorder API (browser native)

**Не используем (решено ранее):**
- ❌ Claude Max через browser proxy (ToS violation)
- ❌ SuperWhisper API (не существует)

### 2.2 High-level flow: голос → счёт

```
[Юзер] Нажимает 🎤
   ↓
[Browser] MediaRecorder начинает запись
   ↓
[Browser] Web Audio API — visualization (waveform)
   ↓
[Юзер] Говорит "Создай счёт для Acme на три тысячи долларов за лендинг"
   ↓
[Юзер] Нажимает 🎤 ещё раз (или auto-stop при тишине 2с)
   ↓
[Browser] Audio Blob → POST /api/voice/transcribe
   ↓
[/api/voice/transcribe] → Groq Whisper API
   ↓ возвращает transcript "Создай счёт для Acme на три тысячи долларов за лендинг"
[Browser] Показывает transcript live в AI bar (typing animation)
   ↓
[Browser] Auto-submit → POST /api/ai/parse
   ↓
[/api/ai/parse] → Anthropic API с tool definitions
   ↓ Claude вызывает tool: create_invoice_draft({client: "Acme", amount: 3000, currency: "USD", description: "лендинг"})
[/api/ai/parse] → возвращает structured action
   ↓
[Browser] Создаёт widget в стеке со статусом "ожидает подтверждения"
[Browser] Показывает draft счёта с кнопками "Изменить" / "Создать"
   ↓
[Юзер] Нажимает "Создать"
   ↓
[Browser] → POST /api/invoices (существующий endpoint!)
   ↓ создаёт invoice в Supabase
[/api/invoices] → returns invoice_id
   ↓
[Browser] Обновляет widget на статус "готово"
[Browser] Sentry breadcrumb для tracking
```

### 2.3 Component Architecture

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── page.tsx                  # ОБНОВИТЬ: добавить <AISearchBar /> наверх
│   │
│   └── api/
│       ├── voice/
│       │   └── transcribe/
│       │       └── route.ts          # НОВОЕ: Groq Whisper API
│       ├── ai/
│       │   ├── parse/
│       │   │   └── route.ts          # НОВОЕ: Anthropic Tool calling
│       │   └── execute/
│       │       └── route.ts          # НОВОЕ: выполнение tool вызовов
│       └── widgets/
│           ├── route.ts              # НОВОЕ: CRUD для widget stack
│           └── [id]/
│               └── route.ts          # НОВОЕ: update/delete виджета
│
├── components/
│   └── ai/
│       ├── AISearchBar.tsx           # НОВОЕ: главная поисковая строка
│       ├── VoiceButton.tsx           # НОВОЕ: микрофон с live transcript
│       ├── PlusMenu.tsx              # НОВОЕ: текстовое меню (Phase 2 — пока только UI)
│       ├── WidgetStack.tsx           # НОВОЕ: лента виджетов
│       ├── VoiceWidget.tsx           # НОВОЕ: виджет голосовой команды
│       ├── InvoiceDraftWidget.tsx    # НОВОЕ: draft счёта для подтверждения
│       └── HintsLayer.tsx            # НОВОЕ: слой подсказок (Phase 1.5, не сейчас)
│
├── lib/
│   ├── ai/
│   │   ├── anthropic-client.ts       # НОВОЕ: Anthropic SDK wrapper
│   │   ├── groq-client.ts            # НОВОЕ: Groq SDK wrapper
│   │   ├── tools/
│   │   │   ├── create-invoice.ts     # НОВОЕ: tool definition
│   │   │   ├── types.ts              # НОВОЕ: TypeScript types
│   │   │   └── index.ts              # НОВОЕ: registry
│   │   ├── prompts/
│   │   │   └── system.ts             # НОВОЕ: system prompt для AI
│   │   └── intent-detector.ts        # НОВОЕ: command vs question
│   ├── voice/
│   │   ├── recorder.ts               # НОВОЕ: MediaRecorder wrapper
│   │   └── visualizer.ts             # НОВОЕ: Web Audio API
│   └── widgets/
│       └── stack-manager.ts          # НОВОЕ: persistence + state
│
└── types/
    ├── ai.ts                          # НОВОЕ: AI types
    └── widgets.ts                     # НОВОЕ: widget types
```

### 2.4 Database Schema (новые таблицы)

```sql
-- ============ widget_stack ============
-- Хранит виджеты которые юзер видит в ленте (голосовые команды, Q&A)
CREATE TABLE widget_stack (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Тип виджета
  widget_type VARCHAR(50) NOT NULL CHECK (widget_type IN (
    'voice_command',      -- голосовая команда
    'invoice_draft',      -- draft счёта ожидает подтверждения
    'invoice_created',    -- счёт создан
    'time_logged',        -- время учтено
    'qa_answer'           -- ответ AI (Phase 2)
  )),
  
  -- Содержимое
  source VARCHAR(20) NOT NULL CHECK (source IN ('voice', 'text', 'photo')),
  user_input TEXT NOT NULL,           -- цитата того что сказал юзер
  
  -- Результат AI parsing
  ai_intent VARCHAR(50),              -- например 'create_invoice'
  ai_extracted_data JSONB,            -- structured данные
  
  -- Статус
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',     -- ожидает подтверждения юзера
    'completed',   -- выполнено
    'rejected',    -- юзер отменил
    'error'        -- ошибка
  )),
  
  -- Ссылка на созданную сущность (если есть)
  related_entity_type VARCHAR(50),    -- 'invoice', 'time_entry', etc.
  related_entity_id UUID,
  
  -- UI state
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  
  -- Метрики
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  ai_processing_ms INTEGER,           -- сколько мс заняло AI
  ai_cost_cents INTEGER,              -- стоимость в центах (для billing)
  
  -- Error tracking
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_widget_stack_user_active 
  ON widget_stack(user_id, created_at DESC) 
  WHERE is_dismissed = false;

CREATE INDEX idx_widget_stack_status 
  ON widget_stack(status) 
  WHERE status IN ('pending', 'error');

-- RLS
ALTER TABLE widget_stack ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see only own widgets" 
  ON widget_stack FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own widgets" 
  ON widget_stack FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own widgets" 
  ON widget_stack FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============ ai_usage_log ============  
-- Логирование всех AI вызовов для billing и debugging
CREATE TABLE ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  service VARCHAR(20) NOT NULL,       -- 'groq_whisper', 'anthropic_sonnet', 'anthropic_haiku'
  endpoint VARCHAR(50) NOT NULL,      -- '/api/voice/transcribe', '/api/ai/parse'
  
  input_tokens INTEGER,
  output_tokens INTEGER,
  cached_tokens INTEGER,              -- prompt caching
  audio_seconds DECIMAL(10,2),        -- для voice transcription
  
  cost_cents INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  
  success BOOLEAN NOT NULL,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_user_month 
  ON ai_usage_log(user_id, created_at DESC);

ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own usage" 
  ON ai_usage_log FOR SELECT 
  USING (auth.uid() = user_id);
```

### 2.5 API Endpoints

#### POST /api/voice/transcribe
**Назначение:** Транскрибирует audio в текст

**Request:**
```typescript
// multipart/form-data
{
  audio: Blob (audio/webm or audio/mp4),
  language: 'ru' | 'en' (optional, auto-detect)
}
```

**Response:**
```typescript
{
  success: true,
  transcript: string,
  language: string,
  duration_ms: number,
  cost_cents: number
}
```

**Errors:**
- 400: invalid audio format
- 413: audio too large (>25MB)
- 429: rate limit (Groq)
- 500: Groq API error

**Rate limit:** 10 req/min per user (через Upstash)

#### POST /api/ai/parse
**Назначение:** Парсит transcript → intent + structured data

**Request:**
```typescript
{
  text: string,
  context: {
    user_id: string,
    locale: 'ru' | 'en',
    recent_clients: string[],  // для context-aware parsing
    recent_projects: string[]
  }
}
```

**Response:**
```typescript
{
  success: true,
  intent: 'create_invoice' | 'log_time' | 'ask_question' | 'unknown',
  confidence: number,  // 0-1
  tool_calls: ToolCall[],
  widget_id: string  // ID созданного виджета
}
```

#### POST /api/ai/execute
**Назначение:** Выполняет confirmed tool call

**Request:**
```typescript
{
  widget_id: string,
  confirmed_data: ExtractedInvoiceData  // может быть отредактировано юзером
}
```

**Response:**
```typescript
{
  success: true,
  entity_type: 'invoice',
  entity_id: string,
  widget_updated_at: timestamp
}
```

### 2.6 Tool Definition (для Anthropic Tools API)

```typescript
// src/lib/ai/tools/create-invoice.ts
export const createInvoiceTool: Tool = {
  name: "create_invoice_draft",
  description: "Create a draft invoice for a client. The draft will be shown to user for confirmation before actually creating the invoice.",
  input_schema: {
    type: "object",
    properties: {
      client_name: {
        type: "string",
        description: "Client name as mentioned by user. Will be matched against existing clients."
      },
      amount: {
        type: "number",
        description: "Invoice amount as a number (without currency symbol)"
      },
      currency: {
        type: "string",
        enum: ["USD", "EUR", "RUB", "VND"],
        description: "ISO currency code"
      },
      description: {
        type: "string",
        description: "What the invoice is for (e.g. 'website redesign', 'consulting')"
      },
      due_days: {
        type: "number",
        description: "Net days for payment. Default 14."
      },
      items: {
        type: "array",
        description: "Line items if multiple specified",
        items: {
          type: "object",
          properties: {
            description: { type: "string" },
            quantity: { type: "number" },
            rate: { type: "number" }
          }
        }
      }
    },
    required: ["client_name", "amount", "currency"]
  }
};
```

### 2.7 Cost calculation

**Per voice command:**
- Groq Whisper Turbo: $0.04/час → ~5 sec command = $0.0001
- Anthropic Sonnet (with prompt caching): ~500 input tokens = $0.0015
- **Total: ~$0.002 per command**

**Per active Pro user/month** (200 commands):
- $0.40 → $19/mo plan → **97% margin**

---

## 3. Implementation Plan (этапы)

### Stage 0: Подготовка (1-2 дня)

**Цель:** Закрыть pending tasks у агентов перед началом нового scope. Чтобы не было tech debt.

**AGENT 1:** Закрыть i18n /clients Heavy 10
**AGENT 2:** Закрыть OnboardingWizard discovery 7 routes
**AGENT 5:** Закрыть /work/time Phase 3 EN leaks
**AGENT 3:** Full QA по всему что закрыли
**AGENT 4:** Sentry проверка что ничего не сломалось

**Done when:** Все PR merged, нет EN leaks, нет регрессий по Sentry.

---

### Stage 1: Foundation (3-4 дня)

**Цель:** Backend + DB готовы, без UI.

#### 1.1 Database Migration
**Кто:** AGENT 2 (backend specialist)
**Файлы:**
- `supabase/migrations/2026-05-28-widget-stack.sql`
- `supabase/migrations/2026-05-28-ai-usage-log.sql`

**Чеклист:**
- [ ] Создать таблицы `widget_stack` и `ai_usage_log`
- [ ] RLS policies (только свои данные)
- [ ] Indexes для performance
- [ ] **Rollback migration** (DROP TABLE с CASCADE)
- [ ] Тест миграции на staging Supabase
- [ ] Backup БД перед production apply

**Quality gate:** AGENT 3 verifies RLS exploits (как в #99/#100/#101 раньше).

#### 1.2 API Clients
**Кто:** AGENT 2
**Файлы:**
- `src/lib/ai/groq-client.ts`
- `src/lib/ai/anthropic-client.ts`

**Чеклист:**
- [ ] Groq client с retry logic (exponential backoff)
- [ ] Anthropic client с prompt caching enabled
- [ ] Error handling: rate limits, timeouts, network errors
- [ ] Logging в `ai_usage_log` после каждого вызова
- [ ] Cost calculation accurate to 0.01 cent
- [ ] Unit tests (jest или vitest)

**Env vars:**
```
GROQ_API_KEY=...
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL_SONNET=claude-sonnet-4-5-20250514
ANTHROPIC_MODEL_HAIKU=claude-haiku-4-5-20251001
```

#### 1.3 Tool Definitions
**Кто:** AGENT 2
**Файлы:**
- `src/lib/ai/tools/create-invoice.ts`
- `src/lib/ai/tools/types.ts`
- `src/lib/ai/tools/index.ts`
- `src/lib/ai/prompts/system.ts`

**Чеклист:**
- [ ] `create_invoice_draft` tool с full schema
- [ ] System prompt на русском (т.к. юзер пишет/говорит по-русски)
- [ ] Тест на 20+ примеров команд (создание invoice разными формулировками)
- [ ] Confidence threshold (если <0.7 → confirm с юзером перед executing)

#### 1.4 API Routes
**Кто:** AGENT 2
**Файлы:**
- `src/app/api/voice/transcribe/route.ts`
- `src/app/api/ai/parse/route.ts`
- `src/app/api/ai/execute/route.ts`
- `src/app/api/widgets/route.ts`
- `src/app/api/widgets/[id]/route.ts`

**Чеклист:**
- [ ] CSRF protection
- [ ] Rate limiting (Upstash Redis)
- [ ] Input validation (zod schemas)
- [ ] Auth check (Supabase session)
- [ ] Error responses follow existing convention
- [ ] Sentry integration на errors
- [ ] OpenAPI docs (для frontend dev)

**Quality gate:** AGENT 3 — Postman/curl тесты на каждый endpoint, включая edge cases (пустой audio, нет auth, invalid currency).

---

### Stage 2: Core UI Components (4-5 дней)

**Цель:** Все компоненты построены и тестируются изолированно. Без интеграции в dashboard.

#### 2.1 Design Tokens
**Кто:** AGENT 1 (generalist + UI)
**Файлы:**
- `src/styles/ai-design-tokens.css`
- `tailwind.config.ts` (обновить)

**Чеклист:**
- [ ] Violet palette (#8B5CF6 primary, #C4B5FD light, #6D28D9 dark)
- [ ] Pink palette (#EC4899, #F9A8D4, #BE185D)
- [ ] Glassmorphism utility classes
- [ ] Glow shadows utility classes
- [ ] Inter font с tight letter-spacing
- [ ] Dark + Light theme tokens
- [ ] Storybook stories (если есть, или standalone HTML)

#### 2.2 AISearchBar component
**Кто:** AGENT 1
**Файлы:**
- `src/components/ai/AISearchBar.tsx`
- `src/components/ai/AISearchBar.module.css`
- `src/components/ai/AISearchBar.test.tsx`

**Чеклист:**
- [ ] Layout: sparkle icon + placeholder + Cmd+K + plus + mic
- [ ] Keyboard shortcut Cmd+K (Mac) / Ctrl+K (Win) активирует focus
- [ ] Click outside closes any open menu
- [ ] Accessibility: ARIA labels, keyboard navigation
- [ ] Loading state когда AI работает
- [ ] Error state с retry button
- [ ] Responsive (mobile + desktop)
- [ ] Light + Dark theme support
- [ ] Storybook examples (8+ states)

#### 2.3 VoiceButton component
**Кто:** AGENT 1
**Файлы:**
- `src/components/ai/VoiceButton.tsx`
- `src/lib/voice/recorder.ts`
- `src/lib/voice/visualizer.ts`

**Чеклист:**
- [ ] Click → start recording
- [ ] Click again → stop recording
- [ ] Visual feedback: pulse animation when recording
- [ ] Permission handling (mic denied → tooltip)
- [ ] Browser support detection (no MediaRecorder → graceful degradation)
- [ ] Auto-stop при тишине 2 секунды (VAD)
- [ ] Max recording time 60 секунд (защита от abuse)
- [ ] Audio format: webm/opus (Safari support: mp4/aac fallback)
- [ ] Upload progress indicator

**Quality gate:** AGENT 3 тестирует на 4 браузерах: Chrome, Safari, Firefox, Edge.

#### 2.4 WidgetStack component
**Кто:** AGENT 1
**Файлы:**
- `src/components/ai/WidgetStack.tsx`
- `src/components/ai/VoiceWidget.tsx`
- `src/components/ai/InvoiceDraftWidget.tsx`

**Чеклист:**
- [ ] Stack новейших сверху, infinite scroll вниз
- [ ] Close button × на каждом виджете (soft delete → is_dismissed)
- [ ] "Очистить все" button
- [ ] Empty state ("История пуста — нажми 🎤")
- [ ] Loading skeleton при первой загрузке
- [ ] Real-time updates через Supabase Realtime
- [ ] Animation: slide in from top для нового, fade out для closed
- [ ] InvoiceDraftWidget с editable полями + "Изменить" / "Создать" buttons
- [ ] Optimistic updates (immediate UI feedback before API confirms)

**Quality gate:** AGENT 3 — flow test 10 раз подряд: voice → widget → confirm → invoice created.

---

### Stage 3: Integration (2-3 дня)

**Цель:** AI bar интегрирован в существующий dashboard. Старые виджеты не сломаны.

#### 3.1 Dashboard Update
**Кто:** AGENT 1
**Файлы:**
- `src/app/(dashboard)/page.tsx`

**Изменения:**
```tsx
// БЫЛО:
<DashboardHero />
<RevenueActivityHub />
<KPICards />
<RevenueChart />
<ActivityFeed />

// СТАЛО:
<DashboardHero />
<AISearchBar />  {/* НОВОЕ */}
<WidgetStack />  {/* НОВОЕ */}
<RevenueActivityHub />
<KPICards />
<RevenueChart />
<ActivityFeed />
```

**Чеклист:**
- [ ] Feature flag `ENABLE_AI_BAR` (можем выключить если ломает)
- [ ] При выключенном флаге — старая dashboard работает без изменений
- [ ] Backward compat: existing routes /clients, /invoices, /time не тронуты
- [ ] Mobile responsive
- [ ] i18n (RU/EN) для всех новых текстов

**Quality gate:** AGENT 3 — full regression test всех существующих фич dashboard. Никаких новых ошибок в Sentry.

#### 3.2 End-to-end Flow Test
**Кто:** AGENT 3 (QA)
**Сценарии:**

1. **Happy path:**
   - Юзер заходит на /dashboard
   - Нажимает 🎤
   - Говорит "Создай счёт для Acme на 3000 долларов за лендинг"
   - Видит live transcript
   - Видит draft widget с amount $3,000, client Acme, description "лендинг"
   - Нажимает "Создать"
   - Видит widget со статусом "готово"
   - Открывает /invoices — счёт там
   - Запись в `ai_usage_log` корректная

2. **Edge cases:**
   - Mic permission denied → корректный error
   - Network failure во время записи → retry button
   - Whisper не понял (gibberish) → "Не понял, повтори"
   - AI parsed но client не существует → "Создать клиента Acme?"
   - User отменяет draft → widget marked rejected
   - Multiple voice commands подряд → стек растёт

3. **Stress test:**
   - 100 voice commands за 5 минут (single user)
   - Rate limit срабатывает корректно
   - UI не лагает
   - DB не падает

**Done when:** Все 3 категории пройдены без багов.

---

### Stage 4: Beta + Monitoring (1 неделя)

#### 4.1 Closed beta
**Кто:** Ты + 5-10 фрилансеров (твои знакомые)

**Setup:**
- Feature flag только для beta accounts
- Sentry alerts на ALL errors в AI endpoints
- Daily review с тобой по метрикам

**Метрики (Sentry + custom dashboard):**
- % успешных команд (target: >85%)
- Среднее время от 🎤 до созданного invoice (target: <8 сек)
- % juicer fallback to manual form (target: <20%)
- Distribution of intents (что чаще всего говорят)
- Cost per user/day

**Что значит "готово":**
- Неделя без P0/P1 багов
- 85%+ success rate
- Метрики стабильные

---

### Stage 5: Public Launch

После того как beta стабильна:
- Feature flag → ON для всех Pro users
- Marketing landing с новым hero design
- Twitter/LinkedIn/ProductHunt анонсы
- Sentry monitoring 24/7 первую неделю

---

## 4. Quality Gates — Anti-bug система

### 4.1 Pre-merge checklist (для каждого PR)

**AGENT 3 проверяет:**
- [ ] Все unit tests прошли
- [ ] TypeScript strict — нет `any`
- [ ] ESLint — нет warnings
- [ ] Прошёл visual review (4+ screenshots fullPage)
- [ ] Mobile + Desktop работает
- [ ] Dark + Light theme работает
- [ ] RU + EN i18n работает
- [ ] Нет console.errors в браузере
- [ ] Sentry — нет новых ошибок за 1 час после deploy

**AGENT 4 (Sentry) проверяет:**
- [ ] Error rate не вырос >5% за 24ч
- [ ] P95 latency не вырос >20%
- [ ] Нет новых типов ошибок

### 4.2 Feature flags
Каждая фича за флагом. Можем выключить в production за 30 секунд если что-то сломалось.

```typescript
// src/lib/feature-flags.ts
export const featureFlags = {
  ENABLE_AI_BAR: process.env.NEXT_PUBLIC_ENABLE_AI_BAR === 'true',
  ENABLE_VOICE: process.env.NEXT_PUBLIC_ENABLE_VOICE === 'true',
  ENABLE_PHOTO: process.env.NEXT_PUBLIC_ENABLE_PHOTO === 'true', // Phase 2
};
```

### 4.3 Rollback plan
- DB migrations имеют rollback script
- Feature flags выключают новые компоненты мгновенно
- Vercel rollback к предыдущему deploy за 1 клик
- Backup БД перед каждой миграцией

### 4.4 Sentry alerts
Новые alerts:
- `/api/voice/transcribe` error rate > 5%
- `/api/ai/parse` error rate > 5%
- `/api/ai/execute` error rate > 2% (более критично)
- Median latency `/api/ai/parse` > 3s

### 4.5 Cost monitoring
Если месячные AI расходы > $X на одного юзера — alert (защита от abuse).

---

## 5. Распределение задач по агентам

| Stage | AGENT 1 (generalist/UI) | AGENT 2 (backend) | AGENT 3 (QA) | AGENT 4 (Sentry) | AGENT 5 (если активен) |
|---|---|---|---|---|---|
| 0 | Closing /clients i18n | (rest) | Verify all closures | Sentry baseline | Closing /work/time |
| 1 | Design tokens | DB migration + API clients + Tool defs + API routes | Postman tests every endpoint | Sentry config | (idle) |
| 2 | All UI components | Support for component data needs | Component tests, browser matrix | Performance baseline | (idle) |
| 3 | Dashboard integration | API tuning if needed | E2E regression | Monitor integration deploy | (idle) |
| 4 | Polish based on beta feedback | Backend fixes from beta | Daily QA cycles | 24/7 monitoring | (idle) |
| 5 | Launch readiness | Production optimization | Final acceptance | Launch day monitoring | (idle) |

---

## 6. Что нужно от Ramiz перед стартом

1. **Approval этого spec** — что-то менять? добавить? убрать?
2. **API keys** — Groq и Anthropic API keys в Vercel env vars
3. **Confirm budget** — $0.002/command × ~10k commands/month launch month = ~$20. OK?
4. **Pending tasks decision** — закрываем (Stage 0) или пропускаем?
5. **Beta users** — кто 5-10 фрилансеров для closed beta?

---

## 7. Открытые вопросы для решения позже

- Что делать если client не существует в БД? Auto-create или ask?
- VAT/налоги в invoice — auto-calculate или manual?
- Multiple currencies в одном invoice — поддерживать?
- Recurring invoices через голос — Phase 2?
- Voice в /clients и /time страницах тоже — или только /dashboard?
- Mobile native apps — нужны или web достаточно?

Обсудим после Stage 3.

---

**Конец Spec v1.0**

После approval Ramiz — переходим к Stage 0 (закрытие pending) и затем Stage 1 (foundation).
