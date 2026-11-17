# UI brief: Nexawork professional feed, auth recovery, and responsive navigation

## Grounding and scope

The current app uses `app/component/Navbar.jsx`, `BusinessNavbar.jsx`, `Login.jsx`, dashboard profile cards, and inline community post/composer UI. Feed implementations compete, like/comment actions are stubs, and community auth can load indefinitely. Preserve the existing logo and lucide icons. Refine the dark shell into neutral charcoal surfaces with restrained violet actions and selection. Use the already loaded Geist font consistently on touched surfaces. There is one supported dark application theme, not an established light/dark toggle.

Design source: `the session Plan panel: design-plan.json`. Its desktop references are 1440×900, with two columns: self-profile rail and a shared feed. Its phone feed is 390×1080 with expanded comments; auth recovery is 390×844. Build fluid responsive layouts, not fixed-height screenshots. Names/activity in the design are illustrative only. The revised design artifacts passed structural checks and numerical palette-contrast checks. Shared Chrome access failed, so browser rendering and live-app accessibility remain unverified.

## Component map

| Element | Existing component or scoped addition | Implementation mapping |
| --- | --- | --- |
| Role navigation / brand / mobile menu | Extend `Navbar.jsx`, `BusinessNavbar.jsx` | Shared route definitions per role, correct destinations, active state, labeled menu button with expanded state and keyboard dismissal. Preserve existing logo. |
| Feed page shell | Extend student dashboard/community routes | Desktop self-profile rail + primary feed, phone single column; no fabricated activity rail or unusable search/connection controls. |
| Self-profile summary | Extract existing dashboard profile card only as needed | Existing real name, username, role, avatar and profile link; no invented statistics. |
| Feed orchestration and status | New `feed/ProfessionalFeed.jsx` | Shared data hook and bounded Load more; explicit refresh, loading, empty, retry, end-of-list states. |
| Composer | New `feed/PostComposer.jsx`, extracted from community | In-flow form, labeled text field, image picker/preview, size/type error, image-publicity hint, disabled/in-flight submit, retained failed draft. |
| Post / author / engagement | New `feed/PostCard.jsx`, extracted from community | Name/username only as author profile text, avatar/initials, timestamp, text/image, stored like/comment counts, `aria-pressed` like button. No new author-profile destination. |
| Comment thread | New `feed/CommentThread.jsx` | Inline expanded thread as phone reference; own load/error/empty states, labeled draft, saved comments and capped Load more. |
| Login/signup and expired session | Extend `Login.jsx`, `app/login/page.jsx` | Shared charcoal card/field/button variants, readable labels, signup role selection, email-confirmation message, expired-session context; do not imply role reset. |
| Protected page/auth state | New `AuthProvider.jsx`, `RoleGate.jsx` | Finite initial loading, signed-out redirect, no-permission/missing-profile/config/error recovery. |
| Business profile route | Reuse existing profile content/editor | Thin business wrapper prevents navigation into a student-only shell; no business-profile redesign. |
| Alerts/buttons/inputs | Reuse neighboring classes; extract tiny shared wrappers only when reused | Semantic status/alert text, existing Tailwind spacing/type/radius, consistent hover/focus/pressed and disabled states. No new component library. |

Token mapping: follow `the approved design-system handoff in the session Plan panel`. Page `#101114`; card `#191B20`; raised `#22252C`; input `#14161A`; primary text `#F5F6FA`; body `#C3C8D2`; muted `#9AA3B2`; decorative line `#333842`; control boundary `#707A8A`; violet action `#7C3AED`; selected/focus `#C4B5FD`; selected surface `#2B2242`. Rose errors, amber warnings, and green confirmed success use documented semantic pairs and text/icon cues. Define named semantic CSS tokens and shared variants; do not duplicate arbitrary primitive overrides. Use Geist, a 4px spacing scale, 12px card radius, 8px control radius, and at least 44px interactive targets. Apply the same variants to touched business navigation/profile controls, not unrelated screens. Numerical key-pair checks pass 4.5:1 for text and 3:1 for control boundaries. Verify computed colors, font loading, interaction states, and contrast again in the running app.

## State matrix

| Standard state | Applies / N/A and expected behavior |
| --- | --- |
| Loading | Applies: finite auth bootstrap; feed skeleton; comments/loading more preserve existing content. |
| Empty | Applies: first-post invitation; empty comments; no false profiles/activity. |
| Error and retry | Applies: feed read, page append, image upload, like/comment/post save, auth/config, optional AI failures. Retry the failed operation without clearing successful content. |
| Partial | Applies: author/avatar unavailable; image unavailable; existing rows remain when next page/comments fail. Use honest local fallback, not synthetic content. |
| Disabled / no permission | Applies: empty/invalid draft, mutation in flight, signed-out session and wrong role. Authentication actions stay reachable. |
| Hover / focus-visible / pressed | Applies: all links, buttons, picker, inputs, mobile menu and saved like state. Keyboard focus never disappears. |
| One item vs many | Applies: one post/comment, multiple pages, end-of-list, duplicated page response, and changing counts. |
| Long text | Applies: long names, usernames, URLs, max-size post/comment, legacy longer content, multiline errors. Wrap without horizontal overflow. |
| Narrow and wide | Applies: 390px phone and 1440px desktop plus existing md 768px and lg 1024px transitions. Desktop is two columns, not the former three-column dashboard. |
| Each supported theme | Applies: current dark shell. Light theme N/A because no theme feature is introduced. |
| In-flight / success | Applies: composer/comment/like/upload/auth; preserve failed drafts and expose saved state only after confirmation. |
| Live updates without flicker | N/A to realtime subscriptions: intentionally use explicit refresh and confirmed local insertion. Stable IDs, preserved scroll and no whole-list flicker still apply. |
| Destructive confirmation | N/A to new UI: no post/comment delete feature added. If a pre-existing destructive control is retained on a touched screen, keep its confirmation guard and owner restriction. |
| Image validation | Applies: non-image/oversized file, preview remove/reselect, failed upload, failed post after successful upload, broken legacy image. |
| Session recovery | Applies: expiry during a mutation; do not pretend content saved. Clear prior-user data on account change; never leak another account's draft. |
| Confirmation-required signup | Applies: no initial session is normal; show email instructions and preserve selected role in account bootstrap. |
| Reduced motion | Applies: respect preference for any new status animation; avoid forced smooth scrolling. |

## Verification list

Testing agent/main runs ui-craft live verification once in the real Next app against local Supabase; HTML design renders are not application verification.

- Dark × 390px/1440px × populated, empty, initial loading, initial error/retry, partial-page error, long text, one/many posts, image-validation failure, image success/failure, in-flight and saved post/like/comment.
- Dark × 390px/1440px × expanded comments with none/one/many, next-page loading/error/end, keyboard focus, comment failure with draft preserved.
- Dark × 390px/1440px × signed-out, expired session, login error/in-flight, confirmation-required signup, missing profile/config and wrong-role recovery.
- Dark × 390px/768px/1024px/1440px × student and business navigation; check immediately around md/lg thresholds if a layout changes. Menu opens/closes, destinations exist, profile target respects role, and content never hides under sticky/fixed UI.
- Keyboard-only traversal, semantic heading/order, labeled controls, status announcements, image alternatives, `aria-pressed`, visible focus, reduced motion, AA text/background contrast, and no horizontal overflow. Check password autocomplete and accessible signup role choice.
- Spot-check computed color/spacing/font/radius styles on changed components resolve to approved token/neighbor values. Verify no new console errors/warnings or error boundaries.
- Capture every changed state in the supported dark theme, covering both representative widths for layout-dependent states. Attach selected evidence to the implementation report, not raw logs. Record anything blocked as not verified, with its cause; never infer application correctness from these design files.

## Design references and handoff

Attach `the session Plan panel: design-plan.json` through the Design tab with its seven variations:

- `network-feed-desktop-populated.html`
- `network-feed-desktop-empty.html`
- `network-feed-desktop-loading.html`
- `network-feed-desktop-error.html`
- `network-feed-desktop-image-validation.html`
- `network-feed-phone-comments.html`
- `network-auth-phone-expired.html`

The design subagent has completed the handoff. No further mockup creation is required to draft this plan. States not explicitly drawn remain acceptance requirements in the matrix, implemented with the same components.

## Not changed

No logo/identity replacement, public profile directory for students, connections, messaging, new advanced search, feed ranking, theme switcher, job/project redesign, new AI product, business social-feed surface, moderation console, or post/comment editing/deletion UI. Preserve existing jobs/projects/business/AI features except the bounded auth/security/compatibility repairs in the plan. Existing badges remain clearly practice-only; do not introduce certification or a quiz-scoring product. Optional-service failures use the existing status patterns, not new management screens. The focused test suite proves changed flows, not exhaustive platform coverage. No claim of browser/live-app verification accompanies these artifacts.


## Requested business-dashboard addition

Extend `app/business/dashboard/page.jsx` with a bounded data helper, real owner-filtered counts and latest records, and the shared charcoal/violet card/control tokens. Reuse Post job and Browse students destinations. Link Manage openings to #openings and Payment records to #payments. No new payment/escrow actions or processing. Use honest empty/loading/partial/error/retry states. Keep read-only payment-record limitations visible. Check populated and empty desktop/390px layouts, long titles, keyboard navigation, owner isolation, and token contrast. Business-desktop and business-phone design variations extend the same manifest. This addition supersedes the earlier exclusion of a business-dashboard surface; unrelated business workflows remain unchanged.


## Implementation compatibility note

The retained job form also uses shared input/button/surface tokens while preserving its fields. It no longer accepts an owner, timestamps, or application count. The signed-in business supplies ownership; the database supplies generated fields. This is a compatibility repair, not a new job workflow.
