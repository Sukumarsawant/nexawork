# Nexawork

A student professional community built with Next.js, React, and Supabase. Students share work, discuss posts, and discover jobs. Businesses publish jobs and browse a limited student directory.

This repository is a fork. The original project includes profiles, projects, jobs, proposals, resume analysis, and practice quizzes. The fork upgrade replaces the simulated student feed with persisted posts, likes, and comments. It also adds focused access controls, account recovery, a consistent charcoal-and-violet design, and reproducible verification tooling.

## Local setup

Prerequisites: Node **24.22.2**, npm **11.19.1**, Docker, and available local ports. The lockfile pins the Supabase CLI; no global CLI installation is required.

```bash
npm ci
npm run db:start
npx supabase status
cp .env.example .env.local
```

Copy the local API URL and anonymous/publishable key into `.env.local`. Never use the service-role key in browser configuration. Set only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the core app.

```bash
# Local development only. This deletes the local database and reapplies migrations.
npm run db:reset
npm run db:seed
npm run dev
```

Open http://localhost:3000. Follow `docs/database.md` for the canonical schema, synthetic accounts, seed configuration, and existing-database preflight. Do not reset or apply these migrations blindly against a hosted project.

Without Supabase configuration, the app shows setup guidance rather than crashing at module import. The public landing page and sign-in screen do not require an AI key.

## Configuration

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-reachable Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key; database policies enforce authorization |
| `GEMINI_API_KEY` | Optional server-only Gemini assistance |
| `RESUME_TEMP_ROOT` | Optional server-only upload workspace; defaults to `/var/tmp` |
| `PYTHON_PATH` | Optional Python executable for the resume analyzer |
| `SUPABASE_SERVER_URL` | Optional server-only Supabase URL; normal setups use the public URL |
| `NEXT_PUBLIC_PREVIEW_AUTH_PROXY` | Optional preview-only auth-header workaround; disabled by default |
| `SUPABASE_PREVIEW_TARGET` | Optional preview-only fixed loopback backend; see `.env.example` |
| `NEXT_ALLOWED_DEV_ORIGINS` | Optional comma-separated exact preview hostnames |

For resume parsing, install `scripts/requirements.txt` in a Python virtual environment and set `PYTHON_PATH` to that environment's Python executable. See `docs/architecture.md` for AI and privacy limits.

## Verification

```bash
npm run audit:dependencies
npm run lint
npm test
npm run build
npm run test:db
npm run test:e2e
```

Database checks require the local Supabase stack and synthetic fixtures. Browser checks also require a running app. See `docs/testing.md` for the exact setup and current evidence limits. Passing unit tests does not prove hosted email, storage, or a real AI provider works.

## Feature boundaries

- The student feed persists posts, optional images, likes, and comments. It uses bounded cursor pagination and explicit refresh, not realtime ranking.
- Full profiles stay private to their owner. Feed authors expose only name, username, avatar, and identifier. Business browsing uses a separate limited projection.
- The business dashboard reads account-owned counts and recent records. It shows read-only payment records, not payment settlement or escrow balances.
- Jobs, projects, and proposals remain inherited workflows with focused compatibility repairs, not a new recruiting platform.
- Images in public buckets remain publicly retrievable. Do not upload confidential images.
- Resume analysis can send resume content to an external AI provider. Do not submit confidential personal information without consent.
- Practice quizzes use client-side scoring. Practice badges do not prove independent certification.
- Connections, messaging, moderation, advanced search, and real payment processing are outside this upgrade.

## Documentation

- [Architecture and boundaries](docs/architecture.md)
- [Database setup and migration safety](docs/database.md)
- [Testing and evidence limits](docs/testing.md)
- [Development dependency advisory policy](docs/dependency-security.md)
- [Honest portfolio presentation](docs/resume.md)

## Original contributors

The original Nexawork project credits:

- [Sukumar Sawant](https://github.com/sukumarsawant)
- [Shreyank Parab](https://github.com/shreyankp06)
- [Rohti Soneji](https://github.com/SwiftByte6)
- [Tejas Kamble](https://github.com/tejask-07)

Original README deployment reference: https://nexawork.netlify.app/. This reference does not claim that the fork upgrade is deployed there.

Describe fork improvements separately from the original team's work. Do not claim original authorship, production scale, users, performance gains, or deployment without evidence.
