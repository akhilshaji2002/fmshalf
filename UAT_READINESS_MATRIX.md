# FMS UAT Readiness Matrix

## Legend
- `✅ Verified` = covered by automation and passing in latest run
- `⚠️ Partial` = basic smoke covered; deeper manual/edge validation still needed
- `❌ Pending` = not yet validated end-to-end

## Global Status Snapshot
- Automation run: `13 passed`, `1 skipped` (external dependency)
- Frontend lint: `PASS`
- Frontend production build: `PASS`
- Scope level: strong coverage on core flows, partial on advanced edge/business scenarios

## Module-by-Module Readiness

- `Auth (register/login/profile)` — `✅ Verified`
  - Token-required profile API and login flow tested.
- `Role Access / Navigation` — `✅ Verified`
  - Member, trainer, admin, gymOwner route smoke checks pass.
- `Dashboard (all roles)` — `⚠️ Partial`
  - Route rendering verified; deep metric correctness and live telemetry accuracy need manual UAT.
- `Chat Platform (community + private + unread)` — `⚠️ Partial`
  - Contacts/unread contract and route behavior verified.
  - Manual validation still needed for long-session reliability, attachment retries, and moderation workflow.
- `Training / My Plan (nutrition generation)` — `✅ Verified`
  - Plan generation + retrieval + chart rendering flow covered and passing.
- `Diet advanced behavior (allergy/vegan/interactive plate)` — `⚠️ Partial`
  - Core generation/render path is stable.
  - Need manual validation for multiple allergy combinations and long-term preference persistence UX.
- `Workouts / Kinetix` — `✅ Verified`
  - Plan fetch/log APIs verified.
  - UI flow modal + next/previous + flow playback verified.
- `Food Vision` — `⚠️ Partial`
  - Route visibility is covered.
  - Deep model-quality/manual input tests still required.
- `AI Progress` — `⚠️ Partial`
  - Route/module integration works.
  - Provider-stability e2e is skipped due to external dependency (Pollinations uptime/latency).
- `Members` — `⚠️ Partial`
  - Route smoke covered.
  - Deep CRUD validation and permission edge-cases should be manually tested.
- `Sessions / Bookings` — `⚠️ Partial`
  - Route smoke covered; backend booking validation hardened.
  - Manual tests needed for overlap policy/rescheduling/cancellation UX.
- `Coaches` — `⚠️ Partial`
  - Route smoke covered; booking path used in member journey.
  - Manual UAT needed for testimonials UX and coach-management edge cases.
- `Security Logs / Scan` — `⚠️ Partial`
  - Route smoke covered.
  - Live scan accuracy and high-frequency polling behavior need manual verification.
- `Inventory / Shop / POS` — `⚠️ Partial`
  - RBAC add-product API tested; inventory reliability fixes applied.
  - Manual UAT needed for checkout stock concurrency and payment edge states.
- `Admin Users / Testimonials Admin` — `⚠️ Partial`
  - Route smoke covered.
  - Manual UAT needed for destructive actions (delete/reset/status changes) and auditability.
- `Gym Discovery / Gym Owner` — `⚠️ Partial`
  - Role route visibility verified.
  - Manual UAT needed for gym registration, join flow, and ownership transitions.
- `Payment Gateway` — `❌ Pending`
  - Route is present; no deep automated payment lifecycle coverage yet.

## Priority Manual UAT (Final Sign-off)

- `P0`: End-to-end booking lifecycle (member -> coach -> session list updates -> status transitions)
- `P0`: Chat media reliability under repeated uploads and role switches
- `P0`: AI Progress real provider test (male/female, 5 runs each) with response-time logging
- `P1`: Payment gateway complete flow (success/failure/cancel/refund if applicable)
- `P1`: Inventory checkout under low stock and concurrent purchase simulation
- `P1`: Admin critical actions rollback/readability (delete user, reset password, testimonial moderation)

## P0 Runbook Execution (Mar 10, 2026)

- `P0-1 Booking lifecycle` — `✅ PASS (automated API UAT)`
  - Added and executed `client/tests/e2e/p0-critical.spec.ts`.
  - Verified booking creation as member and visibility from both member and trainer booking lists.
- `P0-2 Chat media repeated uploads` — `✅ PASS (automated API UAT)`
  - Repeated image upload (`x3`) to `/api/chat/upload` and validated stable image responses.
- `P0-3 AI Progress provider reliability (male/female x5 each)` — `⚠️ OPEN (manual/external)`
  - Still external-provider dependent and intentionally excluded from strict pass/fail automation due to Pollinations instability.
  - Keep as manual timed run with response log capture for final acceptance.

## Release Recommendation
- Current build is **near-production for core flows**.
- Final production sign-off should follow a focused manual UAT cycle on all `⚠️ Partial` and `❌ Pending` items above.
