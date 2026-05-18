// src/app/api/ai/scan-receipt/route.ts (post-B6, uses /lib/ai generateVision)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateVision, type VisionMimeType } from '@/lib/ai'

export const dynamic = 'force-dynamic'

const CATEGORIES = [
  'Software & Tools', 'Hardware', 'Office', 'Marketing',
  'Travel', 'Education', 'Contractors', 'Banking & Fees', 'Taxes', 'Other',
]
const ALLOWED_MIME_TYPES: VisionMimeType[] = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { imageBase64, mimeType } = await req.json()
    if (!imageBase64 || !mimeType) return NextResponse.json({ error: 'imageBase64 and mimeType required' }, { status: 400 })
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json({ error: `mimeType must be one of: ${ALLOWED_MIME_TYPES.join(', ')}` }, { status: 400 })
    }

    const { text } = await generateVision(prompt, imageBase64, {
      mimeType: mimeType as VisionMimeType,
      maxOutputTokens: 500,
      feature: 'other',
      userId: user.id,
    })

    // ... same JSON parsing, normalization, CATEGORIES whitelist ...
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
