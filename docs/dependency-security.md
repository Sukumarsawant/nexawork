# Dependency advisory policy

`npm run audit:dependencies` is the required dependency-advisory gate. It runs both the complete dependency audit and the production dependency audit with a 20-second maximum for each npm invocation. A timeout, invalid JSON, or registry/network error fails the check rather than producing a false clean result.

The gate reports the raw npm finding count, then flattens the direct advisory records in npm's JSON report and deduplicates them by advisory URL (or npm source ID if no URL is present). It fails for every advisory identity except the explicitly listed temporary exception below. It also fails for any production/runtime finding, including the exception.

## Documented unresolved development-tool advisory

- `picomatch` — [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), ReDoS through crafted repeated-extglob patterns. This applies to every published version through `4.0.7`. Registry verification with `npm view picomatch version` returned `4.0.7`; the GitHub advisory lists no patched version. The package is currently reachable only through development tools (Vitest/Vite and their globbing dependencies), not the production dependency audit.

This is a warning-only exception for this exact advisory identity, not a suppression of package-level counts or future advisories. Tool glob configuration is repository-owned (`vitest.config.mjs` uses a fixed `tests/**/*.test.{js,jsx}` include); do not pass untrusted values into test, lint, or build glob options. Revisit this exception when Picomatch publishes a fixed release. Do not change the allowlist without reviewing a new audit and upstream release information.

## Completed repair

The lockfile uses current compatible TypeScript-ESLint `8.73.0` packages, which support the `^8` ranges required by `eslint-config-next@15.5.29`; their `typescript-estree` dependency requires patched Minimatch `^11.0.1` and resolves `11.0.9`. This removes the previously reported `minimatch@9.0.9` advisory without a force fix.

`eslint-import-resolver-typescript` is overridden to `4.4.5`. It retains the standard ESLint resolver peer contract (`eslint` and `eslint-plugin-import` remain unconstrained peers) on Node 24, and the repository lint suite is the compatibility regression check. The override is narrow: it affects only resolver instances, rather than downgrading Next, Vitest, or ESLint.

No force-based npm fix, fork, package alias, or unreviewed vendor patch is used. `npm audit` can still report a nonzero raw development-tool count while the Picomatch upstream fix is unavailable; this documentation and the audit gate must not be represented as a zero-advisory full audit.
