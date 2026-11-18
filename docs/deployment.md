# Deploying a separate Nexawork environment

This guide deploys this fork to a new Vercel project backed by either an authorized original Supabase project or a new, user-owned Supabase project. It does not deploy to, change, or grant access to the existing Netlify site at https://nexawork.netlify.app/. Vercel access does not control that Netlify deployment.

No deployment, database change, invitation, or hosted-resource provisioning has been performed for this repository.

## Choose the database path first

### A. Continue the original environment

Choose this only if the original Supabase owner invites the intended operator to the original project and authorizes the work. That owner must provide access appropriate to the requested work, the existing project's API URL and browser-safe key, and confirmation of the current Auth and storage settings.

Do not run the migrations in this repository against that project by default. It may contain data and a migration history that this fresh-schema workflow does not model. Follow the existing-installation preflight in [database.md](database.md), take an owner-approved backup, and plan any adoption separately.

### B. Create a new, user-owned environment (recommended without that invitation)

Create a new Supabase project under the account that will operate it, then deploy this fork against it. This creates a separate application and database. It does **not** copy, migrate, recover, or modify any users, posts, storage objects, credentials, or other data from the original project.

Choose a region near the application and its expected users. Supabase recommends separate projects for environments such as staging and production: https://supabase.com/docs/guides/deployment/managing-environments

## Create a fresh Supabase project

1. In the Supabase dashboard, create an empty project under the user-owned organization. Keep its database password private and enter it only in the local CLI prompt when needed; do not commit or paste it into application configuration.
2. After the project is ready, open its Connect dialog or **Project Settings → API Keys** and record:
   - Project URL
   - the browser-safe publishable key, or the legacy `anon` key if that is what the project exposes

   Current Supabase keys and their intended exposure are documented at https://supabase.com/docs/guides/getting-started/api-keys. The code currently reads the historical variable name `NEXT_PUBLIC_SUPABASE_ANON_KEY`; placing the current **publishable** key in that variable is compatible. Never put a `service_role` or secret key in a `NEXT_PUBLIC_*` variable, source file, or Git repository. Row Level Security (RLS) is what makes the browser-safe key safe to expose; the key itself is not a secret.
3. From a clean checkout of this fork, install the pinned toolchain. `package.json` pins the Supabase CLI to `3.2.0`.

   ```bash
   npm ci
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   ```

   The project ref is the identifier shown in the Supabase dashboard URL. `login` opens the normal CLI authorization flow; `link` and the hosted database commands may prompt for the database password locally. Do not add it to `.env.local` or Vercel.

4. Review the exact remote change before applying it:

   ```bash
   npx supabase db push --remote --dry-run
   ```

   This repository's canonical fresh schema is the four ordered files in `supabase/migrations/`. The older `database/*.sql` files are historical reference, not a second installation path. Only after reviewing the dry run, and only for the new empty project, apply it:

   ```bash
   npx supabase db push --remote
   ```

   Do not run `supabase db reset`, `npm run db:reset`, `db:seed`, or `supabase db push --include-seed` against a hosted project. The reset and seed commands are local development tools; their sample accounts are synthetic and must never become a production demo account.

The CLI workflow and the `--remote` / `--dry-run` behavior are documented at https://supabase.com/docs/guides/local-development/cli-workflows and https://supabase.com/docs/reference/cli/supabase-db-push.

## Configure Supabase Auth before real signups

In **Authentication → URL Configuration**, set **Site URL** to the exact final production Vercel URL, for example `https://your-project.vercel.app`. Add only the exact production URL and the preview/local callback origins that are needed under **Redirect URLs**. Add preview origins narrowly; do not use a broad wildcard when a known Vercel preview URL or controlled preview pattern is sufficient.

Site URL is the default destination for confirmation and recovery emails, and redirect targets must be allowlisted. Details and wildcard semantics: https://supabase.com/docs/guides/auth/redirect-urls

For a production app with email confirmation, configure custom SMTP and test deliverability. Supabase's default SMTP service is intended for testing: it sends only to organization-team email addresses and is limited to two messages per hour per project. See https://supabase.com/docs/guides/auth/auth-smtp.

After deployment, smoke-test signup with two newly created accounts through the UI: one student and one business. Use unique test addresses and passwords you control; do not seed or publish a plaintext demo account. Confirm each account receives the correct role experience and that confirmation/recovery links return to the configured Vercel origin.

## Create the Vercel project

1. In Vercel, import the upgraded fork's Git repository. Select the `main` branch after its changes are merged, or select the pull-request branch only when the goal is a Preview Deployment for review. Do not treat a Preview Deployment as the Netlify production site.
2. Let Vercel detect **Next.js**. In **Project Settings → General**, select Node.js 24 to match this repository's `>=24 <25` engine constraint. Vercel's project and runtime configuration is documented at https://vercel.com/docs/projects.
3. In **Project Settings → Environment Variables**, add these values for the intended environment(s):

   | Variable | Value and scope |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | The new project's HTTPS Project URL. Browser-safe and required. |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The new project's publishable key (or legacy anon key). Browser-safe and required. |
   | `GEMINI_API_KEY` | Optional; server-only Gemini integration. Omit it to disable AI assistance. |
   | `SUPABASE_SERVER_URL` | Optional server-only override. In this normal direct-Supabase deployment it may be omitted; if used, set it to the same public HTTPS Project URL, never a localhost URL. |
   | `RESUME_TEMP_ROOT` | Required before enabling resume analysis on Vercel. Configure a platform-supported writable temporary directory and verify it in the deployed function. The default `/var/tmp` is not writable there. Do not use a repository path. |

   Do **not** configure `NEXT_PUBLIC_PREVIEW_AUTH_PROXY`, `SUPABASE_PREVIEW_TARGET`, or a localhost `SUPABASE_SERVER_URL` in Vercel. Those are a local preview-adapter path, not this production deployment. `NEXT_ALLOWED_DEV_ORIGINS` is development-only and should also be left unset in Vercel unless a specific development-server workflow requires exact hostnames.

   `NEXT_PUBLIC_*` values are bundled into client JavaScript at build time. They are public and require a redeploy after changing them. See https://nextjs.org/docs/app/guides/environment-variables and https://vercel.com/docs/environment-variables.
4. Deploy, then set the exact deployed production URL as the Supabase Site URL and add only necessary callback origins. If the auth settings change, test a fresh confirmation and recovery flow.

Connected Git deployments create Preview Deployments for non-production branches and production deployments from the configured production branch. Vercel describes this flow at https://vercel.com/docs/deployments/environments and https://vercel.com/docs/deployments/git.

## Resume-analysis boundary on Vercel

The existing `app/api/uploadResume` route is a Node.js route that attempts to execute a local Python analyzer. A normal Vercel Node function does not automatically provide this executable or the repository's Python dependencies. Therefore PDF and DOCX analysis must be treated as unavailable on a default Vercel deployment; do not claim it works until it has been deliberately implemented and tested.

Every upload, including TXT, uses a temporary directory before analysis. Vercel does not permit writes to the default `/var/tmp` location. Therefore **all resume formats are unavailable under the default configuration**, even with `GEMINI_API_KEY`. Configure `RESUME_TEMP_ROOT` as a platform-supported writable temporary directory before enabling analysis. Verify this setting in the deployed function. See the filesystem limits at https://vercel.com/docs/functions/runtimes.

TXT can use the Gemini fallback only after that temporary-directory setup succeeds and the server-only `GEMINI_API_KEY` is configured. Verify the complete upload flow before claiming support. Without those verified settings, treat TXT analysis as unavailable. Do not send sensitive resumes to an external provider without consent.

Vercel supports Python Functions, but they require an explicit Python function entrypoint under `/api` (or another supported Python application setup). That is not provided by the current Node route. A separately hosted parser service or an explicit, tested Python-function implementation is a future change, not a setting to turn on here: https://vercel.com/docs/functions/runtimes/python

## Troubleshooting

| Symptom | Check and safe response |
| --- | --- |
| Setup guidance or database errors in the app | Verify both required `NEXT_PUBLIC_SUPABASE_*` values are present in the deployed Vercel environment, point to the same project, and redeploy. Do not substitute a secret/service-role key. |
| Browser bundle still has old public values | Change the Vercel environment value and deploy again. `NEXT_PUBLIC_*` values are baked in at build time. |
| `db push` lists unexpected migrations or fails on an existing database | Stop. Do not use reset, seed, drops, type conversions, or `--include-all` to force it. Use the backed-up, owner-approved existing-installation process in [database.md](database.md). |
| Signup or password email lands on the wrong host or never arrives | Recheck Supabase Site URL and narrow Redirect URLs, then configure/test custom SMTP for non-team recipients. |
| Student/business actions are denied | Create the account through the app's signup flow so the profile trigger can assign its role. Do not bypass RLS with a service-role key. Verify the four canonical migrations applied to this fresh project. |
| Image uploads or feed images fail | Check that the migration-created public storage buckets and their RLS policies exist. Use an authenticated student and a JPEG/PNG/GIF/WebP image at most 5 MiB. Public buckets mean uploaded images are publicly retrievable. |
| Any resume upload fails or analysis returns unavailable | All formats are unavailable under the default Vercel configuration because the route first writes to `/var/tmp`. Configure and verify a writable `RESUME_TEMP_ROOT`. TXT/Gemini also requires `GEMINI_API_KEY` and a successful deployed upload test. PDF/DOCX additionally requires an implemented, tested parser service/function. |

## Handoff checklist

- [ ] Original owner invitation obtained and separately reviewed, **or** an empty user-owned Supabase project created.
- [ ] Four canonical migrations reviewed with `--dry-run` and applied only to the empty user-owned project.
- [ ] Vercel project imports the intended fork branch, uses Next.js and Node 24.
- [ ] Both required public Supabase variables point to the same project; no secret/service-role or localhost adapter variables are in Vercel.
- [ ] Supabase Site URL, narrowly scoped redirects, and production SMTP are configured and tested.
- [ ] Fresh student and business signups are smoke-tested without publishing demo credentials.

These steps create a new independently operated environment. They leave https://nexawork.netlify.app/ unchanged.
