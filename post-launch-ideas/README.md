# Post-Launch Ideas

Папка с дизайн-мокапами и идеями фич для **после launch** (T+1 неделя и далее). Сюда складываются концепты которые мы согласовываем pre-launch но реализуем после.

## Содержимое

### 📁 perplexity-inspired-features/

Дизайн-мокап 4 фич вдохновлённых Perplexity AI, адаптированных под Lancerwise палитру.

**Файл:** [`mockup.html`](perplexity-inspired-features/mockup.html)

**Открыть мокап:** [👉 RAW preview](https://raw.githack.com/fer-fer-code/lancerwise-screenshots/main/post-launch-ideas/perplexity-inspired-features/mockup.html)

#### 4 фичи в roadmap

| # | Фича | Когда | Работа | Где находится |
|---|---|---|---|---|
| 1 | ⚡ **AI Step-by-Step UI** | Неделя 1 после launch | ~12 ч | Все 12 AI endpoints (модалы) |
| 2 | 📎 **Citations в AI Бизнес-советнике** | Неделя 2-3 после launch | ~24 ч | `/insights` + AI Анализ рисков |
| 3 | 💬 **AI Assistant Sidebar** (Phase 2 differentiator) | 4-6 недель | ~120 ч | Глобально, справа на authed |
| 4 | ⌘ **Cmd+K Command Palette** | Phase 2 | ~36 ч | Глобально, ⌘K |

#### Палитра использованная в мокапе

Locked palette из дизайн-системы Lancerwise:

- Canvas: `#0B0B12`
- Surface: `#11111A`
- Card: `#15151F`
- Elevated: `#1B1B26`
- Accent: `#6A5AE0`
- Brand gradient: `linear-gradient(135deg, #483ACC 0%, #935AF0 50%, #F897FE 100%)`
- Text primary: `#F4F4F6`
- Text secondary: `#A0A0AE`
- Success: `#43C97A`

#### Согласовано

- **Дата:** 2026-05-24
- **Статус:** approved by Ramiz, deferred to post-launch backlog
- **Pre-launch:** не трогаем, focus на palette regression fix + launch readiness

## Как добавлять новые идеи в эту папку

Структура:
```
post-launch-ideas/
├── README.md                          ← этот файл (обновлять список ↑)
├── perplexity-inspired-features/
│   ├── mockup.html                    ← главный мокап
│   └── notes.md                       ← optional доп. заметки
└── <next-idea-folder>/
    ├── mockup.html
    └── notes.md
```

Каждая идея — отдельная папка с осмысленным именем. Главный файл всегда `mockup.html` чтобы был один паттерн.
