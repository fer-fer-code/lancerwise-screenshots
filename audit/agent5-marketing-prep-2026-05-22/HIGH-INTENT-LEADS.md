# High-Intent Leads — mailto inbox sweep

**Status:** ⏸️ SKIPPED pre-launch
**Date:** 2026-05-22

---

## Why skipped

The mailto link `hello@lancerwise.com?subject=Notify me when Business plan launches` (in the Pricing section, "Business plan" card) routes to a forwarding chain set up by a separate agent. Ramiz does not have direct credentials / forwarding config handy at this point, and unblocking this is not worth holding up launch.

## What was supposed to happen

1. Login to `hello@lancerwise.com` inbox (likely Gmail / Google Workspace)
2. Search subject lines: "Notify me when Business plan", "Business plan", "pricing"
3. Extract sender email, date, custom message body (if any)
4. Compile to lead list for inclusion in launch email blast (T-24h, T+0, T+24h emails per [EMAIL-LAUNCH.md](./EMAIL-LAUNCH.md))

## Recommendation — post-launch action

**Owner:** Ramiz, post-launch (target: Day +7 to Day +14)

**Steps:**
1. Reconnect with the agent who set up `hello@lancerwise.com` forwarding chain — get credentials or shared inbox access
2. Search inbox for `subject:"Notify me when Business plan launches"` + any custom subjects from people who typed their own
3. Build CSV: email, date, body
4. Import to Resend audience as "business-plan-interest" segment
5. Send dedicated "Business plan now in beta" email when Business tier is ready (post-launch roadmap)

**Estimated volume:** unknown — could be 0 if no one clicked the mailto, could be 50+ if pricing page has had organic traffic. Worth checking.

## Pre-launch mitigation

Email sequence in [EMAIL-LAUNCH.md](./EMAIL-LAUNCH.md) is not blocked — it falls back to:
1. Product Hunt "Coming Soon" page subscribers (PH exports this)
2. PH Maker email blast (one launch email to PH followers)
3. Personal network (Ramiz's contacts directly)

These three sources cover the lead-list need for launch day. The mailto inbox is a post-launch optimization, not a launch-blocker.

---

## Future improvement

Replace the mailto link with a proper `/api/waitlist` endpoint + `waitlist_signups` table so future "Notify me when X launches" interest is captured in your own database rather than depending on inbox forwarding. ~30 min of work. Tracked in this kit's [README.md](./README.md) findings section.
