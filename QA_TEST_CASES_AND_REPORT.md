# FMS Deep QA Test Plan and Report

## Scope Covered
- Roles: `member`, `trainer`, `admin`, `gymOwner`
- Frontend modules: auth, dashboard, chat, workouts, my plan/training, food vision, coaches, sessions, members/security/admin modules
- Core backend integration: auth login/register, AI plan generation, Kinetix plan/log routes

## Automated Test Suite Added
- Framework: Playwright (Chromium)
- Location: `client/tests/e2e`
- Specs:
  - `roles-smoke.spec.ts` — role-based nav + route smoke checks
  - `plan-and-workouts.spec.ts` — member plan generation + workouts modal/flow smoke
  - `api-contract.spec.ts` — backend auth/RBAC/chat/plan/kinetix API contract checks
- Config: `client/playwright.config.ts`
- Scripts:
  - `npm run test:e2e`
  - `npm run test:e2e:headed`
  - `npm run test:e2e:report`

## Latest Automation Run (Evidence)
- Command: `cd client && npm run test:e2e`
- Result: **11/11 passed**
- Duration: ~54s
- Covered scenarios:
  - Member full flow: login -> training plan update -> advanced nutrition render -> workouts flow
  - Trainer route/module smoke
  - Admin route/module smoke
  - Gym owner route/module smoke
  - Auth profile contract (`401` unauthorized + valid authorized response)
  - Inventory RBAC contract (member blocked, admin allowed)
  - Chat contacts + unread contract
  - AI plan generation + retrieval contract
  - Kinetix plan/log stability contract

## High-Impact Issues Fixed During QA

1. **Crash in `Advanced Nutrition Plan`**
- Root cause: React hook-order instability in `DietChart` caused runtime crash (`Rendered more hooks than during the previous render`) during async plan transitions.
- Fix: moved guard logic to keep hook execution stable and added safe day index handling.

2. **Plan customization logic gap**
- Missing goal selector in `My Plan` prevented backend goal adjustment from being used consistently.
- Fix: added `goals` input and validation in `Training`.

3. **Diet slider-calorie mismatch**
- Interactive plate sliders changed macro grams but not calories.
- Fix: calorie model now recalculates meal/day calories from adjusted macros.

4. **Weekly menu repetition**
- Fallback plans repeated same meals each day.
- Fix: day-wise varied fallback menu in backend + frontend anti-repetition display fallback.

5. **Accessibility to exceptional users (vegan/allergy)**
- No explicit options for diet restrictions.
- Fix: added diet type + allergy selectors in plan form and adaptive filters in diet display/grocery list.

6. **Workout visuals reliability**
- Workout imagery and demo placeholders were inconsistent.
- Fix: deterministic anatomical visual generation + animated form demo fallback.

7. **Inventory add-product reliability bug**
- Root cause: optional `sku` had a non-sparse unique index, causing duplicate-null collisions in repeated admin product creation.
- Fix: updated schema to `unique + sparse` and auto-generated SKU in controller when absent.

8. **AI Progress failure with Pollinations 500 (notably female profile runs)**
- Root cause: upstream image provider intermittently returns `500`, and the flow previously hard-failed.
- Fix: added multi-attempt provider strategy, request timeout hardening, prompt normalization, and a deterministic local SVG fallback so the user always gets a result.
- UX fix: frontend now displays fallback notice instead of only generic failure alerts.

## Manual Deep Test Matrix (Recommended execution)

### Auth & Access Control
- Register/login for each role.
- Unauthorized route redirect.
- Role-specific sidebar and route visibility.

### Member Journey
- Generate AI plan with varied goals.
- Adjust interactive plate and verify projected calories.
- Apply allergies and verify meal/grocery restrictions.
- Open workouts flow and progress modal navigation.
- Chat: global + private coach separation.

### Trainer Journey
- Open members list and generate member plan.
- Validate pending testimonials moderation.
- Sessions and security route rendering.

### Admin Journey
- Inventory management page access.
- Admin users page access.
- Testimonials management access.

### Gym Owner Journey
- Gym owner dashboard access.
- Chat + settings access.

## Cleanup/Hardening Backlog (Next Iteration)
- Persist diet preferences (`dietType`, `allergies`, liked foods) on user profile with dedicated save endpoint.
- Add API integration tests (supertest) for `auth`, `ai/calculate`, `kinetix/log` (optional once server exports app instance).
- Add visual regression snapshots for key pages.
- Add CI pipeline for lint + e2e smoke.

## Business-Analyst Prioritization (Client Value)

### Must Have (Revenue / Trust Impact)
- **Onboarding completion funnel:** Add explicit post-login role landing guidance and completion checklist (profile, plan, coach, session).
- **Chat delivery confidence:** Add "delivered/read" indicators and retry queue for media uploads.
- **Plan persistence:** Save nutrition preferences and liked foods server-side so users do not reconfigure each visit.
- **Operational metrics:** Add basic owner/admin KPIs (active users, plans generated, session completion, conversion to paid sessions).

### Should Have (Engagement / Retention Impact)
- **Workout adherence score:** Weekly score from completed sets + consistency trend.
- **Nutrition variance coach:** Warn when daily projected calories deviate by >15% for multiple days.
- **Role-based empty-state UX:** Actionable prompts when modules have no data (e.g., "No sessions yet, book now").

### Could Have (Differentiation)
- **Goal milestones:** 30/60/90-day milestone cards for body metrics and consistency.
- **Personalized nudges:** Time-based reminders for workout, hydration, and check-ins.

## Build Health
- Frontend production build: `PASS` (`npm run build`)
- Route-level lazy loading implemented in `App` and verified in production build output with split chunks.

## Additional Regression Evidence
- Full suite run: `12/12 passed`
- Includes dedicated female AI progress contract test to prevent recurrence.

