# Verification guide

## Reproduce local checks

Use Node 24.22.2, npm 11.19.1, and Docker.

```bash
npm ci
npm run lint
npm test
npm run build
npm run db:start
# Destructive to the local database only.
npm run db:reset
npm run db:seed
npm run test:db
```

Seed and database-check scripts discover the local API URL and anonymous key through the pinned CLI. They refuse a non-local database URL. No hosted project or service-role credential is required. The database checks create unique synthetic accounts on each run. Reset the local database to remove these fixtures.

The schema includes indexes, RLS, restricted functions, server-owned feed timestamps, and read-only transaction records. Integration checks assert actual database behavior, not SQL text matching. The legacy fixture uses local administrative SQL only to model data that predates a `NOT VALID` constraint; normal clients cannot bypass the current write constraints.

## Browser checks

Configure `.env.local` with the local public URL/key as described in the README. Start the app, then run:

```bash
npm run dev
# Separate terminal, disposable local or CI browser:
npx playwright install chromium
npm run test:e2e
```

Tests use only the documented synthetic seed accounts. They create a post, switch accounts, like and comment, reload, verify role routing, and check phone navigation. Use `E2E_BASE_URL` to select a running app. Account overrides are `E2E_STUDENT_A_EMAIL`, `E2E_STUDENT_B_EMAIL`, `E2E_BUSINESS_EMAIL`, and `E2E_PASSWORD`.

For a managed desktop, set `E2E_CDP_URL` to its existing Chrome CDP endpoint. The fixture attaches to the existing browser context and opens a test tab. It does not create another context or resize the shared desktop. The phone-resize test is explicitly skipped in that mode. Do not run the disposable-browser command inside a managed desktop when policy requires the existing Chrome profile.

CI defines separate static/unit/build and local database/browser jobs. A workflow definition is not evidence that a remote CI run passed.

## What the checks cover

- Unit/component: content limits, profile update allowlists, signup/session states, draft preservation, timeout/failure handling, upload cleanup, optional-provider configuration, and controlled practice API calls.
- Database: signup bootstrap, role immutability, private profiles, author projections, student/business separation, cursor boundaries, duplicate likes, comment limits, image ownership, practice badge idempotence, retained job/project/proposal paths, and business transaction isolation.
- Browser: synthetic two-account persistence, reload, role routing, and responsive navigation when the browser is available.

## Evidence and limits

The original locked application failed production build without Supabase configuration (`supabaseUrl is required`). The upgraded lazy client allows a configuration-free production build. The original lint command also skipped JSX; the new command explicitly includes it.

During implementation, the production build, focused unit tests, and local Supabase integration checks passed. The runtime dependency audit reported zero advisories after compatible Next.js/React updates and a PostCSS override. Consult the PR Testing section and the session Test Report for the final checked revision and exact totals.

Shared Chrome CDP access was unavailable during design work. Static design HTML passed structural validation and numerical palette checks, but that is not browser evidence. Until a live browser check runs, screen layouts, keyboard interaction, computed styles, console errors, and state screenshots remain unverified. Do not claim a complete visual/accessibility pass.

Hosted schema adoption, actual email delivery, hosted storage configuration, real external AI responses, and real payment processing remain outside verified coverage. Quizzes remain client-scored practice, not independent certification.
