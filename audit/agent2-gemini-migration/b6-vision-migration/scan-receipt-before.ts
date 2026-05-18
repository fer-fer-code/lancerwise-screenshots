// src/app/api/ai/scan-receipt/route.ts (pre-B6, last Anthropic SDK consumer)

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic()

const CATEGORIES = [
  'Software & Tools', 'Hardware', 'Office', 'Marketing',
  'Travel', 'Education', 'Contractors', 'Banking & Fees', 'Taxes', 'Other',
]

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { imageBase64, mimeType } = await req.json()
    if (!imageBase64 || !mimeType) return NextResponse.json({ error: 'imageBase64 and mimeType required' }, { status: 400 })

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: imageBase64 },
          },
          { type: 'text', text: `Extract expense info ... ${CATEGORIES.join(', ')}` },
        ],
      }],
    })

    const text = (msg.content[0] as { type: string; text: string }).text.trim()
    // ... JSON parsing ...
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
