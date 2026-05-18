# Bug #024 — Light Theme Migration Discovery

**Date:** 2026-05-18
**Branch:** `fix/bug-024-privacy-terms-dark-theme`
**Scope:** Migrate `/privacy` (167 lines) and `/terms` (181 lines) to dark marketing theme matching `/about`, `/contact`, `/faq`, `/pricing`, `/changelog`.

---

## Current state — light theme legacy

Both `/privacy` and `/terms` follow an identical legacy pattern with inline navbar + inline footer + light-gray background. No shared marketing chrome.

### Wrapper
```tsx
<div className="min-h-screen bg-gray-50">
```

### Inline navbar (privacy 27-34, terms 27-34)
```tsx
<nav className="bg-white border-b border-gray-200">
  <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
    <Link href="/" className="text-lg font-bold text-violet-600">LancerWise</Link>
    <Link href="/" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
      ← Back to home
    </Link>
  </div>
</nav>
```

### Page header
```tsx
<h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
<p className="text-sm text-gray-400">Last updated: April 26, 2026</p>
```

### Content card
```tsx
<div className="bg-white rounded-xl border border-gray-200 p-8 space-y-8 text-sm text-gray-700 leading-relaxed">
```

### Section heading
```tsx
<h2 className="text-base font-semibold text-gray-900 mb-3">N. Title</h2>
```

### Inline links
```tsx
<a href="..." className="text-violet-600 hover:underline">legal@lancerwise.com</a>
```

### Inline footer (privacy 158-164, terms 172-178)
```tsx
<footer className="border-t border-gray-200 mt-16 py-8 text-center text-sm text-gray-400">
  <Link href="/" className="hover:text-gray-600 transition-colors">← Back to LancerWise</Link>
  <span className="mx-3">·</span>
  <Link href="/faq" className="hover:text-gray-600 transition-colors">FAQ</Link>
  <span className="mx-3">·</span>
  <Link href="/terms|privacy">...</Link>
</footer>
```

### Function signature
Synchronous (`export default function PrivacyPage()`), no `getTranslations()`.

---

## Target state — dark marketing theme (mirroring /about)

`/about` (`src/app/about/page.tsx`, 143 lines) is the canonical dark marketing pattern post-Bug #001 PR E. Key elements:

### Wrapper
```tsx
<div className="min-h-screen bg-slate-900">
  <MarketingNavbar />
  <main className="max-w-5xl mx-auto px-6 py-16">
    ...
  </main>
  <MarketingFooter />
</div>
```

### Content card
```tsx
<div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 md:p-12">
```

### Headings
- H1: `text-3xl md:text-4xl font-bold text-white`
- H2: `text-base font-semibold text-white`

### Body text
`text-slate-400 text-base leading-relaxed` (or `text-sm` for compact content)

### Subdued meta
`text-slate-500` (e.g., "Last updated: ...")

### Inline links
`text-violet-400 hover:text-indigo-300 transition-colors`

### Function signature
`export default async function PrivacyPage()` with `const t = await getTranslations()` (kept for parity even though no translation keys are introduced — content stays as-is per scope).

---

## Class swap map

| Legacy (light) | Target (dark) | Notes |
|---|---|---|
| `bg-gray-50` | `bg-slate-900` | Page wrapper |
| `bg-white` (card) | `bg-slate-800` | Content card |
| `bg-white` (nav) | n/a | Removed — replaced by `<MarketingNavbar />` |
| `border-gray-200` | `border-slate-700` | Card + footer dividers |
| `text-gray-900` (h1/h2) | `text-white` | Headings |
| `text-gray-700` (body) | `text-slate-400` | Body copy |
| `text-gray-400` (meta) | `text-slate-500` | "Last updated", footer copy |
| `text-violet-600 hover:underline` | `text-violet-400 hover:text-indigo-300 transition-colors` | Inline mail/section links |
| `rounded-xl` | `rounded-2xl` | Match /about card radius |
| inline `<nav>` block | `<MarketingNavbar />` | Shared chrome |
| inline `<footer>` block | `<MarketingFooter />` | Shared chrome |

---

## Migration plan

### Step 1 — privacy/page.tsx
1. Add imports: `import { getTranslations } from 'next-intl/server'`, `import { MarketingNavbar } from '@/components/marketing/MarketingNavbar'`, `import { MarketingFooter } from '@/components/marketing/MarketingFooter'`
2. Make function `async` (even though no `t()` calls added — preserves parity for future i18n)
3. Replace wrapper: `bg-gray-50` → `bg-slate-900`
4. Remove inline `<nav>` block; insert `<MarketingNavbar />`
5. Apply class swap to header, card, sections, links per table above
6. Remove inline `<footer>` block; insert `<MarketingFooter />`
7. Keep all legal section content byte-identical (text, ordering, list items, mailto links, GDPR/Stripe/Resend mentions)

### Step 2 — terms/page.tsx
Identical migration. Same imports, same swaps, content untouched.

### Step 3 — verification
- Local `next dev` smoke test
- Playwright screenshots: mobile 390x844 + desktop 1280x800, EN + RU
- Push branch → preview deploy
- Production check post-merge

---

## Risks

1. **visual-regression CI gate WILL fail** — this is an intentional visual change to two routes. Expected; will document failure as intentional and rely on admin-merge.
2. **Legal text integrity** — content must remain byte-identical. Diff verified line-by-line during migration. No translation work in this PR (theme-only).
3. **Inline navbar links removed** — "← Back to home" no longer exists on these pages, but `<MarketingNavbar />` provides "Home" + breadcrumb-style nav, so functional equivalence preserved.
4. **Inline footer cross-links removed** — `/privacy` no longer has direct "FAQ · Terms" links; `<MarketingFooter />` includes both in the Legal column.
5. **No new i18n keys needed** — `marketingNavbar.*` and `marketingFooter.*` already in both `en.json` + `ru.json` (Bug #001 PR A).

---

## Files audited (read-only at discovery time)

- `src/app/privacy/page.tsx` (167 lines, light theme)
- `src/app/terms/page.tsx` (181 lines, light theme)
- `src/app/about/page.tsx` (143 lines, dark theme reference)
- `src/components/marketing/MarketingNavbar.tsx` (exists, server component)
- `src/components/marketing/MarketingFooter.tsx` (exists, server component)

---

## Next: Phase 2 migration
