// src/app/api/settings/branding/route.ts (pre-fix)
// lines 9-32 — handler destructures legacy names но never assigns them к updates.

  const body = await request.json()
  const {
    logo_url, brand_color, invoice_footer,         // ← legacy fields destructured
    portal_title, portal_welcome_message, portal_accent_color,
    portal_show_branding, portal_footer_text, portal_favicon_url,
    invoice_logo_url, invoice_accent_color, invoice_footer_text,
    invoice_payment_instructions, invoice_show_logo, invoice_template,
  } = body

  const updates: Record<string, unknown> = {}
  if (portal_title !== undefined) updates.portal_title = portal_title
  if (portal_welcome_message !== undefined) updates.portal_welcome_message = portal_welcome_message
  if (portal_accent_color !== undefined) updates.portal_accent_color = portal_accent_color
  if (portal_show_branding !== undefined) updates.portal_show_branding = Boolean(portal_show_branding)
  if (portal_footer_text !== undefined) updates.portal_footer_text = portal_footer_text
  if (portal_favicon_url !== undefined) updates.portal_favicon_url = portal_favicon_url
  // Invoice PDF branding (#170)
  if (invoice_logo_url !== undefined) updates.invoice_logo_url = invoice_logo_url
  if (invoice_accent_color !== undefined) updates.invoice_accent_color = invoice_accent_color || '#6366f1'
  if (invoice_footer_text !== undefined) updates.invoice_footer_text = invoice_footer_text
  // ...
  // ❌ legacy fields (logo_url, brand_color, invoice_footer) ARE NEVER COPIED TO updates
  // Result: when onboarding wizard sends only { brand_color, invoice_footer }, updates is EMPTY → 400
