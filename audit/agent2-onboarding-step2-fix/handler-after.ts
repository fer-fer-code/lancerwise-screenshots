// src/app/api/settings/branding/route.ts (post-fix) — added 3 lines
// Maps legacy → canonical invoice_* columns. Backwards-compatible.

  const updates: Record<string, unknown> = {}
  // Legacy field names sent by onboarding wizard (Step 2 "Brand Your Invoices") —
  // map к canonical invoice_* columns. Without this, wizard submits с only
  // legacy keys и handler returns 400 "No fields to update".
  if (logo_url !== undefined) updates.invoice_logo_url = logo_url
  if (brand_color !== undefined) updates.invoice_accent_color = brand_color || '#6366f1'
  if (invoice_footer !== undefined) updates.invoice_footer_text = invoice_footer
  if (portal_title !== undefined) updates.portal_title = portal_title
  // ... rest unchanged
