# Phase 8A Walkthrough — Gold Wallet & Purchasing Power

- **Date**: 2026-11-26
- **Branch**: `phase-ui-8a-gold` (signed off 2026-11-26; merge/push authorized)
- **Merge Base**: `main @ 5f1b0bb29a434cf7b7f09306c6910d1a8a83de2a`
- **Branch Commits**: `781fa99` (docs plan), `d4c6f8e` (CI restore), `d8c63bb` (feat implementation), `7dcfcfd` (walkthrough evidence)
- **Implementation HEAD**: `d8c63bb2f09997e01975fba8ea2f4c16e236bad0`
- **Baseline Repo Commit**: `3f174fb` in `D:\Projects\FinStat-visual-baselines` (`Phase 8A: recapture 25 gold snapshots`)
- **Plan**: `docs/ui-plans/phase_8a_implementation_plan.md` (v4, draft, final review complete)
- **Taste Checkpoint #6**: **APPROVED by User on 2026-11-26** for `/gold-wallet` at 1440px and 390px against Reference Frame 01 Variant B (§6.1.1). Approval authorizes Phase 8B to start; recorded in Gate 17, Gate 19, and §10.

## Scope Delivered

5 routes themed (allowlist 33 → 38): `/gold-wallet`, `/gold-wallet/new`, `/gold-wallet/edit/:id`, `/gold-wallet/summary`, `/analytics/purchasing-power`.

Production/test/harness files per plan: `GoldWallet.css` (new), `PurchasingPowerChart.css` rewritten, `theme-components.css` Section 18, 6 gold/chart JSX files, `ProtectedRoute.js`, `.eslintignore` (5 entries removed), `ci.yml` restored from `5e92fa4`, 4 Jest suites (50 tests), `goldMocks.js`, `gold-reference-match.spec.js`, Playwright wiring in `visual.spec.js`, `a11y.spec.js`, `playwright.config.js`.

## §0 Decisions Carried Into Verification

1. **Inline-style census correction**: 23 inline styles purged total (11 GoldLogPage mixed 2 colour + 9 layout/typographic; 11 GoldSummaryPage mixed 4 colour + 7 layout/typographic; 1 PurchasingPowerChart layout-only `height:350`). Zero colour-bearing inline styles remain.
2. **Neutral gold identity, P&L exception**: Gold identity/24K/Hold-Sold/live-stale/KPI tiles neutral; unrealised P&L is sole `<Delta>` exception per §4.3 line 328. Purchasing-power trajectory is sign-only change column (neutral).
3. **P&L labels**: Reused recorded `Gain`/`Loss` via `<Delta>` with explicit sign+value+label; no arrow (7C precedent); no new §4.3.1 label/threshold.
4. **Chart integration / chartTheme deviation**: Uses existing `getChartPalette()+withAlpha()+baseChartOptions()+ariaLabel()`; no new `chartTheme.js` API. Line options composed locally over `baseChartOptions()`; last-point direct label implemented locally. No accent series. Canvas `aria-label` + adjacent summary + data-table alternative present.
5. **W-8A-1 scope/distinct wrappers**: `.gold-log-page .gold-table-wrap { overflow-x: auto; }` (≥12-column audit-log exception) and `.gold-summary-page .gold-table-wrap { overflow-x: auto; }` (W-8A-1, 8-column summary only). D19 compact-expand cards at ≤768px; zero page-level scroll at 390px. `PurchasingPowerChart.css` has no `overflow-x`; currency table is D19 cards.
6. **Shared CSS decoupling**: `Trades.css`/`SummaryRow.css` imports removed from gold pages; shared files unchanged. 7 files / 8 import sites remain and must stay pixel-identical.
7. **I3 characterization**: No calculation fixture/service change; gold math characterized by Gate 7 assertions only; `calculations.spec.js` remains 11/11 across 8 domains.
8. **Push boundary / CI-skip handling**: Branch local only until sign-off; merge to `main` then push only `main` (§14). `5f1b0bb` CI skip reverted in `d4c6f8e`; Gate 6 confirmed clean diff vs `5e92fa4`.
9. **Taste Checkpoint #6**: Developer inspection evidence captured in Gate 17; explicit approval requested in Gate 19 sign-off and must be recorded here before 8B starts.
10. **Typography D16/AD10**: `.fs-num` used for gold figures/prices/totals/chart figures (IBM Plex Sans + tabular-nums + right align); mono reserved for identifiers.
11. **Chart unit-test count**: `PurchasingPowerChart.test.js` expanded 11 → 16; Gate 7 total 50/50.

## Gate Evidence

| Gate | Result | Evidence |
|---|---:|---|
| 1 Route allowlist | PASS | `node frontend/scripts/ui-coverage.js --assert-allowlist` → 38/38 active patterns. |
| 2 Token drift | PASS | `node frontend/scripts/tokens.js --check --tables` → 0 drift. |
| 3 testid/aria guard | PASS | `node frontend/scripts/testid-guard.js` → 0 deletions vs `5f1b0bb`. |
| 4 Tone guard | PASS | `node frontend/scripts/lint-tones.js` → 0 tone violations; 0 undefined tokens. |
| 5 Stylelint/ratchet/overflow | PASS | `lint-ratchet.js` 0 regressions vs `5f1b0bb`; stylelint clean for `GoldWallet.css`, `PurchasingPowerChart.css`, `theme-components.css`; `#14b8a6` only in `src/styles/tokens.css`; scoped overflow audit shows exactly `GoldWallet.css:212` (`.gold-log-page .gold-table-wrap`) and `GoldWallet.css:223` (`.gold-summary-page .gold-table-wrap`); diff vs `5f1b0bb` adds only those 2 `overflow-x` lines. Pre-existing: `SecuritySettingsPage.js:216` has `className="loading-spinner"` (not 8A). §7.1:2102 global `overflow-x` grep remains pre-existing governance-text drift (32 matches on `main`; `TaxSimulator.css:280`), not an 8A defect. |
| 6 ESLint/CI restore | PASS | ESLint `--max-warnings=0` clean on all plan-listed 8A files; 5 `.eslintignore` entries removed; `git diff 5e92fa4 -- .github/workflows/ci.yml` empty. |
| 7 Jest + jest-axe | PASS | **50/50**: `GoldLogPage.test.js` 12, `GoldSummaryPage.test.js` 12, `GoldForm.test.js` 10, `PurchasingPowerChart.test.js` 16. 0 critical/serious jest-axe. |
| 8 Route guard + dashboard cap | PASS | `App.test.js` + `DashboardSummary.test.js` = **15/15**; `DashboardSummary.js` 96 lines (≤120). |
| 9 I3 calc parity | PASS | `tests/calculations.spec.js` **11/11** across 8 existing domains; byte-identical fixtures. |
| 10 Real-browser axe | PASS | Playwright a11y project `-g "gold|purchasing-power"`: **6 passed** (1 setup + 5 routes), 0 critical/serious wcag2a/wcag2aa. |
| 11 Reference match | PASS | `gold-reference-match.spec.js`: **9 passed** (1 setup + 8 spec tests). |
| 12 Production build | PASS | Final rebuild: `CI=true GENERATE_SOURCEMAP=false NODE_OPTIONS=--max-old-space-size=2048 npm run build` exit 0, `Compiled successfully.` with no application errors/warnings (only the non-blocking Browserslist stale-data advisory), using default `.env.production` (`https://finstat-backend.vercel.app/api`); local build log captured under `C:\Users\User\AppData\Local\Temp\opencode\phase8a-final-build.log`. An earlier `4096` attempt OOM'd on the low-memory verification device (see hardware note). |
| 13 Baseline/manifest | PASS | 25 snapshots recaptured (5 routes × 5 viewports); baseline repo commit `3f174fb` "Phase 8A: recapture 25 gold snapshots"; `verify-baseline-manifest.js` **334/334**. |
| 14 PR-subset visual | PASS (68/71 per W-6A-1) | Reconciled to **68 passed + 3 accepted W-6A-1/AD16 diffs** (`salary-profile-update @1440`, `analysis-payroll @1440`, `salary-rules @1440`). All other 1440px smoke routes and all five smoke-route 390px snapshots are 0-diff in the stable Gate 15 run. 0 diffs attributable to 8A. Earlier `ERR_CONNECTION_REFUSED`/browser-context failures were infrastructure-only (detached-server churn); the reconciled result comes from the stable batched run below, not from the production-URL local rerun, which is blocked by the CORS issue noted below. |
| 15 Full 326 visual | PASS | Deviation from the single-command plan run: full suite executed in short batches against a deterministic local static build server (temporary config only, not committed) because the single run was unstable on the low-memory verification device: **326 accounted = 292 zero-diff passed + 34 accepted pre-existing AD14/AD16 diffs**. All 25 recaptured gold snapshots pass. 0 unexplained diffs, 0 diffs attributable to 8A. Accepted-diff register below. |
| 16 Touch targets/focus | PASS | `gold-reference-match.spec.js -g "interactive touch targets"`: **2 passed** (1 setup + 1 filtered test), rerun after final edits. |
| 17 Reference conformance / Taste Checkpoint #6 | PASS / **APPROVED** | All 25 snapshots were reconciled by Gate 15; Gate 11 verifies Frame 01/02/03 tokens, neutral tone, `.fs-num`, D19, W-8A-1, chart a11y. Additional computed-style inspection of `/gold-wallet` at 1440/390 is recorded below. Developer approval was recorded 2026-11-26; Phase 8B is authorized. |
| 18 Unthemed consumer preservation | PASS | Earlier targeted run of `corporate-actions|mutual-funds|gold-wallet|analytics-purchasing-power|certificates|currency|credit-cards` reconciled **116/116** (1 setup + 23 routes × 5 viewports). Gate 15 independently re-verified every one of those 23 routes at all five viewports with 0 8A-attributable diffs; shared CSS remains unchanged (7 files / 8 import sites). A later local-backend diagnostic failed 15 snapshots across `certificates`, `currency`, and `credit-cards` at all five viewports (populated live data differs from mock-captured baselines); this is pre-existing data-dependent environmental drift, not an 8A change. Final clean Gate 18 rerun after cleanup: **116 passed** (1 setup + 23 routes × 5 viewports), 0 failures, 0 8A-attributable diffs. |

## Gate 15 Accepted Diff Register (34)

All 34 diffs are pre-existing baseline debt carried under AD14/AD16, identical to the 7A/7C reconciliation. None is attributable to Phase 8A.

- **AD14 — 10 diffs**
  - `not-found` @ 768, 480, 390px (3): pre-existing 20px headless Chromium fullPage scrollbar variance.
  - `dashboard` @ 768, 480px (2): same sub-desktop height variance.
  - `expenditures` @ 768, 480px (2): same sub-desktop height variance.
  - `expenditure-analysis` @ 1024, 768, 480px (3): stale baselines from prior bugfix `720b7bf7`.
- **AD16 / W-6A-1 — 24 diffs**
  - `salary-profiles` @ 768, 480, 390px (3).
  - `salary-profile-update` @ 1440, 1024, 768, 480, 390px (5).
  - `salary-paychecks-new` @ 768, 480, 390px (3).
  - `salary-paychecks-edit` @ 768, 480, 390px (3).
  - `analysis-payroll` @ 1440, 1024, 768, 480, 390px (5).
  - `salary-rules` @ 1440, 1024, 768, 480, 390px (5).

## Gate 17 Inspection Evidence (`/gold-wallet`)

Computed-style inspection at 1440px and 390px, using deterministic gold mocks:

| Property | 1440px | 390px | Frame 01 Variant B expectation |
|---|---|---|---|
| `html[data-fs-theme]` | `dark` | `dark` | scoped theme attribute preserved (D22) |
| `body` background | `rgb(16,17,20)` | `rgb(16,17,20)` | graphite canvas `#101114` |
| `body` text | `rgb(242,243,245)` | `rgb(242,243,245)` | neutral text `#f2f3f5` |
| `.fs-num` font / variant / align | IBM Plex Sans / `tabular-nums` / right | same | D16/AD10 numeric treatment |
| Primary CTA background / text | `rgb(20,184,166)` / `rgb(13,14,16)` | same | accent `#14b8a6` with `--fs-ink` (never white) |
| `.gold-log-page .gold-table-wrap` overflow-x | `auto` | `auto` | ≥12-column audit-log exception |
| Desktop table | visible | hidden | D19 compact-expand cards at ≤768px |
| `.gold-mobile-card` nodes | rendered (hidden on desktop) | rendered/visible | D19 cards present at mobile |
| Document horizontal overflow | `false` | `false` | zero page-level scroll at 390px |

Coverage mapping for the full Gate 17 requirement: Frame 01 log/summary tables are asserted by Gate 11's `gold-reference-match.spec.js` (8 tests) and reconciled across all 25 snapshots in Gate 15; Frame 02 form and Frame 03 KPI-tile checks are covered by the same reference spec plus the 1440/390 computed-style sample above; loading/empty/fetch-failure states, inline validation, and disabled/read-only states are evidenced by Gate 7's 50 Jest/jest-axe tests and Gate 11. The 1440/390 rows above are the explicit developer-inspection sample for Taste Checkpoint #6; approval was recorded 2026-11-26.

The rendered page class is `page-container gold-page-container gold-log-page`, with the distinct log wrapper scoped separately from the W-8A-1 summary wrapper.

## W-8A-1

Active from plan approval for Gate 5: `.gold-summary-page .gold-table-wrap { overflow-x: auto; }` is a documented summary-table exception (8 columns, W-8A-1). `.gold-log-page .gold-table-wrap` uses the existing §7.1 ≥12-column audit-log exception. `PurchasingPowerChart.css` contains no `overflow-x`.

## Governance Drift / Notes

- **§7.1:2102 global `overflow-x` grep** is pre-existing non-clean on `main` (32 matches; `TaxSimulator.css:280`, text/stale line ref drift as noted in plan). Phase 8A used 7C-style scoped audit + `5f1b0bb` no-new-overflow diff check. Not 8A-attributable.
- **§6.12 line 1834** stale count (`GoldLogPage.js` 9) to be corrected to 11 during post-sign-off governance sync; §5.6 already records 11 for summary page.
- **CI skip revert**: `d4c6f8e` restores `.github/workflows/ci.yml` from `5e92fa4`; Gate 6 confirmed empty diff.
- **Temporary harness**: Gate 15/16 were run with a temporary local Playwright config and static build server under `C:\Users\User\AppData\Local\Temp\opencode` to avoid detached-server churn. No harness file in the repository was changed for these runs.
- **Deployed-backend CORS / local-backend diagnostic**: `https://finstat-backend.vercel.app/api` answers the browser preflight from `http://localhost:3000` without `Access-Control-Allow-Origin`, so production-URL local visual runs fail at fetch time. A diagnostic rerun against `http://localhost:5000/api` with a temporary valid harness JWT produced `44 passed / 27 failed`; the failures were live-data/content drift against mock-captured baselines (including the known salary/AD16 routes), not 8A CSS regressions. A follow-up Gate 18 local-backend diagnostic produced `1 passed (setup) + 15 failed` across `certificates`, `currency`, and `credit-cards` at all five viewports, again live-data drift. Neither diagnostic was used as Gate 14/15 evidence; the temporary JWT, local-API build, static servers, and repo-root logs have been cleaned up, so no production source or committed harness remains changed.
- **Local verification hardware**: The verification device is older and has very limited memory. Repeated Playwright/test and local-build crashes on this machine — including the `4096` MB heap OOM — were caused by that resource constraint, not by application defects. The successful final build used `--max-old-space-size=2048`.

## Gate 19 / Merge Boundary (SIGNED OFF)

### Sign-Off Record (2026-11-26)

- **Taste Checkpoint #6**: Approved by User for `/gold-wallet` at 1440px and 390px against Reference Frame 01 Variant B; Phase 8B is authorized to start.
- **Walkthrough sign-off**: Explicit user sign-off received for `docs/ui-plans/phase_8a_walkthrough.md`.
- **Authority granted**: Merge `phase-ui-8a-gold` into `main`, record SHAs, verify the restored full CI workflow, and push only `main` to `origin/main`.

- [x] Gate 14 reconciled at 68/71 (3 AD16/W-6A-1 only)
- [x] Gate 15 reconciled at 326 accounted (292 + 34 AD14/AD16)
- [x] Gate 17 developer inspection evidence captured (`/gold-wallet` 1440/390 vs Frame 01 Variant B)
- [x] Diagnostic harness cleaned up (`.auth.json`, production build, temporary servers, repo-root logs)
- [x] Taste Checkpoint #6 explicitly approved by developer (`/gold-wallet` 1440/390 vs Frame 01 Variant B)
- [x] User sign-off on this walkthrough (2026-11-26)
- [ ] Merge `phase-ui-8a-gold` into `main`; record branch/merge/baseline SHAs in §10
- [ ] Verify CI runs full workflow on `main`
- [ ] Push only `main` to `origin/main` (§14)
- [ ] Post-sign-off governance updates (§6.2 items 1-9)

## Post-Sign-Off Governance Checklist (§6.2)

1. `UI-UX-PLAN.md` §6.12: check all five 8A checklist items; correct `GoldLogPage.js` count line 1834 from 9 to 11.
2. `UI-UX-PLAN.md` §5.6: mark all five gold routes themed and QA'd.
3. `UI-UX-PLAN.md` §6.1/§6.1.1: mark 8A complete; record Taste Checkpoint #6 approval for `/gold-wallet`.
4. `UI-UX-PLAN.md` §7.1: add W-8A-1 for `.gold-summary-page .gold-table-wrap` (8-column summary only); note `.gold-log-page .gold-table-wrap` is ≥12-column exception and `PurchasingPowerChart.css` has no `overflow-x`.
5. `UI-UX-PLAN.md` §10: append 8A row with SHAs, CI-skip revert, 50 unit tests, 11/11 calc tests unchanged, 25 snapshots, 334/334 manifest, 33→38 allowlist, 23 inline styles purged (11+11 mixed + 1 layout-only; zero colour-bearing remain), Gate 18 116/116, all §0 decisions; update cumulative allowlist to 38.
6. `UI-UX-PLAN.md` Phase 8 exit gate: record 5/16 routes themed; 8B–8E remain open.
7. `CHANGELOG.md`: add Phase 8A entry.
8. Confirm no §4.3.1 amendment required: gold identity neutral; recorded `Gain`/`Loss` reused; trajectory sign-only; no new threshold.
9. Record §7.1:2102 global `overflow-x` grep pre-existing drift in walkthrough/§10 (32 matches, `TaxSimulator.css:280`).
