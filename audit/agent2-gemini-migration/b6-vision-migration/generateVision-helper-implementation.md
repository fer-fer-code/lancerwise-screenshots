# generateVision() helper — implementation notes

**Date:** 2026-05-19
**PR:** #66

## API surface

```ts
import { generateVision, type VisionMimeType } from '@/lib/ai'

const { text, tokensUsed, provider, modelVersion } = await generateVision(
  prompt,        // string — instructions for the model
  imageBase64,   // string — base64-encoded image bytes (NO data URI prefix)
  {
    mimeType,    // VisionMimeType — required
    feature,     // AIFeature — optional, for usage logging
    userId,      // string — optional, for budget cap + logging
    model,       // GeminiModel — defaults к gemini-2.5-flash; pro для higher OCR fidelity
    maxOutputTokens,  // number — defaults к 1024
    temperature,      // number — defaults к 0.7
    timeoutMs,        // number — defaults к 30000
    systemPrompt,     // string — optional system instruction
    locale,           // 'en' | 'ru' | string — optional, auto-detected from NEXT_LOCALE cookie
  }
)
```

## VisionMimeType

```ts
export type VisionMimeType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/heic'
  | 'image/heif'
```

These match Gemini's supported image formats. JPEG/PNG/WEBP сover all common camera + screenshot scenarios; HEIC/HEIF covers iOS Live Photos.

## Why no Groq fallback

Llama 3.3-70b through Groq does not support image input — it's text-only. Vision-capable Llama variants (e.g. Llama 3.2 Vision) are not hosted by Groq at the time of this migration.

For vision routes, the fallback strategy is: fail loud → caller handles OR fall back к а separate OCR layer (Tesseract, Google Vision API direct, etc.) — explicitly OUT of /lib/ai scope.

## Budget cap + usage logging

Vision calls flow through the same `checkBudget()` гейт and `logAIUsage()` recorder as `generateText`. Cost is tracked per-user same as text generation.

## Implementation detail — `parts` vs string contents

Gemini accepts both string-form `contents` (text-only) and array-form с `parts`. For multimodal input we must use the array form:

```ts
contents: [{
  role: 'user',
  parts: [
    { inlineData: { mimeType, data: imageBase64 } },
    { text: prompt },
  ],
}]
```

This is necessary because the SDK's type system requires `parts` for non-text input.
