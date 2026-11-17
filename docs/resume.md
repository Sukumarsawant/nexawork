# Present the fork honestly

Nexawork is a fork of a team project. Keep the original contributor credits. State your own contribution separately from inherited profiles, jobs, projects, AI assistance, and quizzes.

## Project description

**Nexawork — student professional community**  
Next.js, React, PostgreSQL, Supabase Auth/Storage, Vitest, and Playwright.

The fork upgrade focuses on a persisted social feed, authorization boundaries, failure recovery, and reproducible local verification.

## Candidate contribution bullets

Use a bullet only after you confirm the implementation and the linked test evidence. These statements describe code scope, not production impact:

- Replaced a simulated student feed with persisted posts, idempotent likes, inline comments, and cursor pagination using React and Supabase.
- Added row-level access controls and restricted author projections to separate private profiles from feed and business-directory data.
- Added role-aware session recovery, draft-preserving error states, and a shared responsive charcoal-and-violet visual system.
- Added authenticated API boundaries and bounded resume-upload processing with private temporary directories and cleanup.
- Replaced example business-dashboard transactions with account-owned counts, bounded records, and explicit payment-system limitations.
- Added focused unit and database integration checks with a documented local setup and CI workflow.

Do not state that browser tests, hosted services, or real AI processing passed unless the actual results support that claim. See `docs/testing.md` for evidence and limitations.

## Interview demonstration

1. Explain the original application's purpose and credit the team.
2. Show the fork's student feed using synthetic accounts.
3. Create a post, like it from a second account, add a comment, and reload.
4. Explain the unique like key, cursor ordering, and database policies.
5. Show a failed mutation and the preserved draft.
6. Explain what the tests prove and what remains unverified.

Use a real recording or screenshots from the application, not design HTML as product evidence. Do not invent users, throughput, latency gains, revenue, production deployment, or original authorship.
