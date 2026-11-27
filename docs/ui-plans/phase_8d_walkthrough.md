# Phase 8D Walkthrough — Currency

> **Sub-phase**: UI Phase 8D — Currency  
> **Target Routes**: `/currency` (`CurrencyLogPage.js`), `/currency/:id` (`CurrencyDetailPage.js`), `/currency/new` (`AddCurrencyPage.js` + `CurrencyForm.js`), `/currency/edit/:id` (`EditCurrencyPage.js` + `CurrencyForm.js`)  
> **Date**: 2026-11-27  
> **Branch**: `phase-ui-8d-currency` *(local only until user sign-off & merge per §14)*  
> **Merge Base**: `main @ af39772`  
> **Gate 0 Commit SHA**: `de0a888` *(plan + Gate 0 `W-8D-1` & Option A `§4.3`/`§4.3.1` amendments on `phase-ui-8d-currency`)*  
> **Starting Baseline Commit**: `39fb1b0` in `D:\Projects\FinStat-visual-baselines` (`334/334` manifest verified)  
> **Gate 13 Baseline Commit SHA**: `d86155f` in `D:\Projects\FinStat-visual-baselines` (`Phase 8D: recapture 20 currency route snapshots`; `334/334` manifest verified)  
> **Implementation Commit SHA**: `79e5afb` (`feat(ui-phase-8d): theme currency log, detail & forms`)  
> **Plan & Approval Evidence**: `docs/ui-plans/phase_8d_implementation_plan.md` (v5; Option A, `CertificateDetail.css` conversion, Waiver `W-8D-1`, Gates 12/15 local deviations, and inherited `$` formatter approved by user on 2026-11-27)  
> **Taste Checkpoint**: N/A *(Cluster 8 Taste Checkpoint #6 was delivered and signed off in Phase 8A)*  
> **Status**: Awaiting Gate 19 User Sign-Off *(implementation & walkthrough committed on local `phase-ui-8d-currency`; `UI-UX-PLAN.md` post-sign-off checkboxes, `CHANGELOG.md`, review cleanup, `--no-ff` merge to `main`, and push remain queued until approval)*

---

## 1. Executive Summary & Progress Log Entry (§10)

```text
Sub-phase:   UI Phase 8D — Currency
Status:      awaiting-signoff (Implemented & verified on local branch phase-ui-8d-currency)
Done:        Migrated all 4 currency routes (/currency, /currency/:id, /currency/new, /currency/edit/:id)
             into the FinStat dark graphite design system (`Currency.css` scoped under `html[data-fs-theme]
             .curr-page-container` + `theme-components.css` Section 21) while leaving shared `Trades.css`
             and `chartTheme.js` strictly untouched. Converted orphaned `CertificateDetail.css` to D22
             dark graphite tokens (closing Phase 8C's deferred `UI-UX-PLAN.md:1850` item with zero lint
             or ratchet violations). Purged all 72 verified inline styles (36 in `CurrencyLogPage.js` +
             36 in `CurrencyDetailPage.js`), 67 hex literals, and 8 rgba literals. Fixed `useCanModify()`
             destructuring in `CurrencyLogPage.js` (`const { canModify } = useCanModify()`). Applied
             Reference Frame 01/03 dark surfaces, neutral `<Badge>` feed-status chips (`Live`, `Stale`,
             `Manual`), Option A `<Delta>` FX unrealized P&L (`Gain` / `Loss` / `No change`), right-aligned
             `.fs-num` tabular columns, Waiver `W-8D-1` desktop table container with D19 <=768px compact-
             expand mobile cards (`0px` overflow), flat detail hero & 6 metric tiles, `chartTheme.js`
             historical rate Line chart with local `currLastPointLabelPlugin`, rounded `toFixed(2) EGP`
             Y-axis ticks (`maxTicksLimit: 7`), trailing-window label clearance, accessible `<details>`/
             `<table>` + D19 mobile rate cards, and Frame 02 Variant B stacked forms with synchronous
             initialData hydration, live Implied Purchase Rate preview, on-blur/on-submit validation, and
             distinct inline/summary/API error banners. Expanded `THEMED_PATTERNS` 42 -> 46, de-ignored
             lines 34-36 in `.eslintignore`, added 38 Jest + jest-axe tests (3/3 suites passed) and a
             9-test Playwright reference-match spec (10/10 passed with setup).
Next:        Phase 8E (Real Estate) after Gate 19 user sign-off & merge
Blocked by:  Gate 19 User Sign-Off
Allowlist:   THEMED_PATTERNS expanded 42 -> 46 (+4: '/currency', '/currency/:id', '/currency/new', '/currency/edit/:id')
Visual diff: Gate 13 replaced 20 PNGs in place (d86155f); Gate 14 68/71 (3 accepted W-6A-1/AD16 only);
             Gate 15 326 accounted (292 passed + 34 accepted AD14/AD16, matching 7A/8A/8B/8C, 0 unexplained);
             Gate 18 66/66 across Currency + Certificates + Trades + Credit Cards
Fixtures:    calculations.spec.js 11/11 passed (Domain 6 Multi-Currency Triangular Conversions unchanged)
Screenshots: 20 recaptures across 1440, 1024, 768, 480, 390px (d86155f); 334/334 manifest verified
Branch:      phase-ui-8d-currency (Gate 0: de0a888; Impl: 79e5afb; Walkthrough: pending commit on branch)
Merge SHA:   Pending Gate 19 User Sign-Off
```

### §0 Plan Decisions Realized

1. **Shared CSS decoupling (`Trades.css` untouched; `CertificateDetail.css` converted)**: `CurrencyLogPage.js` dropped `../trades/Trades.css` and `CurrencyDetailPage.js` dropped `../certificates/CertificateDetail.css` in favor of `./Currency.css`. `git diff af39772 -- frontend/src/pages/trades/Trades.css` is empty, and Gate 18 verified **66/66 passed** across Currency, Certificates, Trades, and Credit Cards. `CertificateDetail.css` (zero remaining active imports) was converted in-place to D22 `html[data-fs-theme]` dark graphite tokens, closing `UI-UX-PLAN.md:1850`.
2. **Inline-style & hardcoded-colour census (`72` total)**: All **72** `style={{` attributes (`36` in `CurrencyLogPage.js`, `36` in `CurrencyDetailPage.js`), `67` hex literals, and `8` `rgba` literals were purged to **0**, enforced by Gate 6 ESLint and Jest DOM `[style]` assertions (`CurrencyLogPage.test.js` Test 13, `CurrencyDetailPage.test.js` Test 12, `CurrencyForm.test.js` Test 10).
3. **Option A FX Unrealized P&L (`<Delta>`) & §4.3/§4.3.1 Gate 0 Amendments**: Per user approval of Plan Review Item #1 **Option A**, `UI-UX-PLAN.md` `§4.3:328`, `§4.3.1:366/:369`, and initial `§10` were amended in Gate 0 (`de0a888`) before Gates 4–18 executed. Both `CurrencyLogPage.js` and `CurrencyDetailPage.js` render FX Unrealized P&L via `<Delta>` (`positive`/`Gain`, `negative`/`Loss`, `neutral`/`No change`), while all exchange rates, foreign units, cost basis, market valuations, hero cards, metric tile containers, and rate-status chips (`Live`, `Stale`, `Manual`) remain neutral. Inherited `$` formatting in `frontend/src/utils/formatters.js` was preserved unchanged per `I3`.
4. **`useCanModify()` destructuring fix (`CurrencyLogPage.js`)**: Corrected legacy `const canModify = useCanModify();` (which always evaluated truthy as an object) to `const { canModify } = useCanModify();`, restoring accurate `disabled={!canModify}` viewer gating while keeping `ProtectedAction` semantics unchanged (`CurrencyLogPage.test.js` Test 10).
5. **Waiver `W-8D-1` & D19 mobile cards (`§7.1:2104`)**: Recorded `W-8D-1` at Gate 0 (`de0a888`) for the 9-column desktop/tablet `.curr-log-page .curr-table-wrap` (`overflow-x: auto`). At `<=768px`, `.curr-table-wrap` and `.curr-history-details` hide cleanly and D19 compact-expand cards (`currency-mobile-cards` and `curr-history-mobile-cards`) render with `0px` page overflow.
6. **Chart accessibility & Gate 17 polish (`CurrencyDetailPage.js` & `Currency.css`)**: Chart uses existing `chartTheme.js` exports (`getChartPalette()`, `withAlpha()`, `baseChartOptions()`, `ariaLabel()`) with zero modifications to `chartTheme.js` and local `currLastPointLabelPlugin`. Passing `aria-label={chartAriaLabel}` directly on `<Line />` resolved axe `role-img-alt` on Chart.js's `<canvas role="img">`. Gate 17 inspection across all 20 PNGs caught and resolved:
   - Unrounded IEEE-754 Y-axis tick strings (`50.80000000000001 EGP`) squeezing the `390px` chart plot area blank -> formatted ticks as `${Number(value).toFixed(2)} EGP` with `maxTicksLimit: 7` on the X-axis, restoring full `390px` plot rendering.
   - Trailing-curve dot overlap on `currLastPointLabelPlugin` at `768px`/`480px` -> computed trailing 8-point `localMinY` clearance clamped inside `chartArea.top + 14`.
   - `1 USD = 48.0000 EGP` unit wrapping at `390px` in `currency-edit-390.png` -> added `white-space: nowrap; flex-shrink: 0` on `.curr-implied-rate-val`.
7. **Form hydration & Playwright blur interaction (`CurrencyForm.js`, `currencyMocks.js`, `currency-reference-match.spec.js`)**: Initialized `CurrencyForm` state synchronously via `buildFormState(initialData, isEdit)` (preventing empty initial render frames on `/currency/edit/:id`), added cross-origin CORS headers + `OPTIONS` preflight handling to `currencyMocks.js` (matching `certificatesMocks.js`), and added `await priceInput.blur()` before submit in Test 6 so `#curr-price-error` renders before clicking `Create Currency`.

---

## 2. Invariant Compliance Checklist (Action Plan §2 Verbatim)

| # | Rule (Verbatim from Action Plan §2) | Verification Method | Status | Evidence / Notes |
| :--- | :--- | :--- | :---: | :--- |
| **I1** | Production routes and URLs unchanged — 75 entries (74 protected + `*`), 10 redirects. | `App.test.js` route-resolution test; `ui-coverage.js` diff | PASS | Gate 1: `ui-coverage.js --assert-allowlist` verified **46** patterns (`42 -> 46`, adding `/currency`, `/currency/:id`, `/currency/new`, `/currency/edit/:id`); `--routes` confirmed **75 route entries / 10 redirects / 65 rendering / 0 unassigned** (`App.js` untouched). Gate 8: `App.test.js` passed (`15/15` total across App + Dashboard). |
| **I2** | No API call, payload shape, or service file changed. | PR diff review; blocked path list in CI | PASS | `currencyService.js`, `CurrContext.js`, `formatters.js`, and backend currency schemas/routes untouched vs `af39772`. Jest Tests 6–8 (`CurrencyForm.test.js`) & 7–9 (`CurrencyLogPage.test.js`, `CurrencyDetailPage.test.js`) verify byte-identical payloads & endpoints. |
| **I3** | No calculation changed on **any** page: payroll, installment schedules, debt payoff, trade P&L, certificate maturity/interest, FX conversion, budget thresholds, real-estate yield. | Characterization fixtures (§9.6) | PASS | Gate 9: `tests/calculations.spec.js` **11/11** passed across all 8 domains (Domain 6 Multi-Currency Triangular Conversions unchanged). Inherited `$` formatter retained unchanged. |
| **I4** | Auth, roles, `ProtectedAction`, and `useCanModify` gating unchanged. | Viewer-role checklist per phase | PASS | `Revalue Now` and `Add Currency` remain wrapped in `ProtectedAction`, and fixed `const { canModify } = useCanModify()` restores accurate `disabled={!canModify}` row/card Delete gating (`CurrencyLogPage.test.js` Test 10). |
| **I5** | Test IDs, `data-*` attributes, and accessible labels preserved — 37 `data-testid`, 39 `aria-label`. | test-ID guard script (§9.2) | PASS | Gate 3: `testid-guard.js --base af39772` `0` deletions; `account-selector-sourceAccount` and all labels preserved; accessible `aria-label`s added to Delete buttons, timeframe group, `<Line />` canvas, and D19 expanders. |
| **I6** | Tables render as compact-expand cards at <= 768px (D19). Horizontal scroll preserved only for tables with >= 12 columns (audit logs) where the card pattern is impractical. No page-level horizontal scroll at 390px. | 390 px visual check: card layout renders, no page-level horizontal scroll, all fields reachable via expander. | PASS | Desktop `.curr-log-page .curr-table-wrap` covered by approved Waiver `W-8D-1` (`Currency.css:212`); at `<=768px` both log and history tables hide cleanly in favor of D19 mobile cards with **0px** page-level overflow at `390px` (Gate 11 Tests 2, 5, 6, 7). |
| **I7** | No page loses functionality mid-migration. | Pattern added only in the converting PR (§6.3) | PASS | All 4 Currency routes added together; CIB revaluation, create/edit/delete flows, timeframe filtering (1W/1M/3M/6M/All), and fallback single-point chart mode all pass Gates 7 & 11. |
| **I8** | Dashboard coordinator line cap preserved — `DashboardSummary.js` must remain $\le 120$ lines (post-audit architecture decomposition invariant). All 10 RTL dashboard tests must remain green. | Line count assertion + `npm test` in 3A | PASS | Gate 8: `DashboardSummary.js` = `96` lines (`<= 120`); `App.test.js` + `DashboardSummary.test.js` **15/15** passed. |
| **I9** | Production build passes with zero errors and no new warnings. | CI (authoritative); local proxy via `npm start` + ESLint/stylelint (§15) | PASS *(local proxy; CI pending)* | Gate 12: `CI=true GENERATE_SOURCEMAP=false NODE_OPTIONS=--max-old-space-size=1536 npm run build` compiled cleanly (`Compiled successfully.`); Gate 6 ESLint (`--max-warnings=0`) and Gate 5 Stylelint clean. Authoritative CI workflow runs on merge to `main`. |
| **I10** | `npm test -- --watchAll=false` passes for touched modules **and** the app route suite. | CI (frontend test job added in 1C); local proxy: touched suites via `npx jest --runInBand` (§15) | PASS *(local suites)* | Gates 7 & 8: `CurrencyLogPage.test.js` (14) + `CurrencyDetailPage.test.js` (13) + `CurrencyForm.test.js` (11) + `App.test.js` + `DashboardSummary.test.js` = **53/53** passed in-band (`38` + `15`). |
| **I11** | No new `!important`; a file's count in the 1C lint ratchet may only fall. | stylelint + `lint-ratchet.js` (§9.2) | PASS | Gate 5: `lint-ratchet.js --base af39772` `0` regressions across `63` CSS files; `0` `!important` in `Currency.css`, `CertificateDetail.css`, and Section 21. |
| **I12** | No new dependency except the Phase 1C tooling list (§9.2). | `package.json` review | PASS | `frontend/package.json` and lockfile untouched vs `af39772`. |
| **I13** | Every non-allowlisted route is pixel-identical to its 1B baseline. | Walkthrough-evidenced per §7.1: developer-run Playwright diff report attached to each phase walkthrough, with zero unexplained diffs. | PASS | Gate 14 (`68/71` W-6A-1/AD16 only), Gate 15 (`292 + 34 accepted AD14/AD16 = 326`, `0` unexplained), Gate 18 (**66/66** across Currency, Certificates, Trades, Credit Cards). |
| **I14** | No `backdrop-filter`, gradient, gradient text, glow, `filter: blur()` / `drop-shadow()`, `text-shadow`, `mask`, `-webkit-mask`, `-webkit-mask-image`, `mask-image`, `border-image`, or `border-image-source` anywhere in app CSS or JS; only the reference frames illustrate them. | stylelint (§9.2) | PASS | Removed blue/dark-navy gradients (`#0284c7 -> #0369a1`, `#0f172a -> #1e293b`), light cards, and pixel `box-shadow`s; Gate 5 stylelint + Gate 6 ESLint confirm zero banned effects. |
| **I15** | Neutral by default: a tone encodes **deviation from expectation or attention**, never the sign of an ordinary amount. Expense amounts, income, and balances are neutral (§4.3). A page never references a tone token directly; it uses `Delta`, `Badge`, or a `.fs-progress--*` modifier. | stylelint + `lint-tones.js` + §4.3 domain table + §7.2 | PASS | Gate 4: `lint-tones.js` `0` violations; rates, foreign units, cost basis, valuations, and feed-status badges (`Live`/`Stale`/`Manual`) stay neutral; FX unrealized P&L uses `<Delta>` per Gate 0 Option A (`§4.3:328`, `§4.3.1:366/:369`); `--fs-danger` is isolated in Section 21 for error surfaces (`role="alert"`) and danger button outlines. |
| **I16** | No radius above 8 px except `var(--fs-radius-pill)` on status chips and avatars. | stylelint (§9.2) | PASS | Removed `16px`, `12px`, `20px`, and `50%` radii; Gate 5 stylelint + Gate 11 verify card/tile/form radii `<= 8px` (`--fs-radius-sm/md/lg`), `--fs-radius-pill` on `<Badge>` only. |

---

## 3. Visual Regression Diff Report (§7.1)

Per §7.1 (`UI-UX-PLAN.md:2099`), Gate 13, Gate 14, Gate 15, and Gate 18 were executed against `D:\Projects\FinStat-visual-baselines` served locally from the Gate 12 `CI=true` static build.

> [!NOTE]
> **Authorized Local Deviations (`Gate 12` & `Gate 15 / §15.5`)**:
> 1. **Gate 12 (`2048`MB -> `1536`MB heap)**: User explicitly authorized running Gate 12 locally (`2048`MB). After an initial `2048`MB build hit a Windows semi-space commit failure, a clean standalone `NODE_OPTIONS='--max-old-space-size=1536'` build compiled cleanly (`Compiled successfully.`). Authoritative CI runs on merge to `main`.
> 2. **Gate 15 (`§15.5`)**: `UI-UX-PLAN.md §15.5` (`:3129–3133`) notes *"Do not run the full visual suite locally; use the PR subset and let CI run the full matrix."* Running the full 326-test `--project=visual` suite locally in Gate 15 was **explicitly authorized by user** (`"authorize the local 2048MB gate 12 and full gate 15"`) per Phase 8A–8C precedent to reconcile all 326 baselines prior to sign-off. Generated `frontend/test-results/` and `frontend/playwright-report/` were cleaned afterward matching 8A–8C git-hygiene precedent.

### Diff Summary (Gate 15 Full Visual Suite & Gate 14 PR-Subset)

- **(a) Total routes / captures compared**:
  - **Gate 15 (Full Suite)**: **65 routes × 5 widths (1440, 1024, 768, 480, 390px) = 325 route captures + 1 auth setup = 326 Playwright tests** (`15.9m`).
  - **Gate 14 (`pr-subset`)**: **70 route captures** (65 routes @ 1440px + 5 smoke routes @ 390px) + **1 auth setup = 71 Playwright tests** (`3.5m`).
- **(b) Routes / captures with zero diff**:
  - **Gate 15**: **291 zero-diff route captures** (+ `1 setup` = **292 passed**), including **all 20 newly themed Phase 8D currency recaptures (`d86155f`)**, all 20 Certificates routes, all 20 Trades routes, and all 5 Credit Cards routes.
  - **Gate 14**: **67 zero-diff route captures** (+ `1 setup` = **68 passed**).
- **(c) Routes / captures with accepted pre-existing diffs**:
  - **34 accepted pre-existing baseline diffs in Gate 15** — identical to Phase 7A, 8A, 8B, and 8C (`292 + 34`); **0 diffs attributable to Phase 8D**:
    - **AD14 (10 diffs)**: `not-found` @ 768/480/390px (`3`), `dashboard` @ 768/480px (`2`), `expenditures` @ 768/480px (`2`), `expenditure-analysis` @ 1024/768/480px (`3`).
    - **AD16 / W-6A-1 (24 diffs)**: `salary-profiles` @ 768/480/390px (`3`), `salary-profile-update` @ 1440/1024/768/480/390px (`5`), `salary-paychecks-new` @ 768/480/390px (`3`), `salary-paychecks-edit` @ 768/480/390px (`3`), `analysis-payroll` @ 1440/1024/768/480/390px (`5`), `salary-rules` @ 1440/1024/768/480/390px (`5`). *(Gate 14's only 3 failures were `salary-profile-update @ 1440px`, `analysis-payroll @ 1440px`, and `salary-rules @ 1440px`.)*
  - **Intentional Phase 8D recaptures (`d86155f`)**: `/currency`, `/currency/1`, `/currency/new`, `/currency/edit/1` × 5 viewports (`20` snapshots replaced in place; AD13 allowlist expansion `42 -> 46`).
- **(d) Routes with unexplained diffs**: **0** (`0` unexplained diffs; `0` diffs attributable to Phase 8D).

### Manifest Integrity (`verify-baseline-manifest.js`)

- **Starting baseline commit**: `39fb1b0` (`D:\Projects\FinStat-visual-baselines`, `334/334`)
- **Gate 13 baseline commit**: `d86155f` (`D:\Projects\FinStat-visual-baselines`, `"Phase 8D: recapture 20 currency route snapshots"`, `21` files changed, `0` net new entries, **`334/334 baselines verified successfully`**)

---

## 4. Gate Verification Evidence (Gates 0–18)

| Gate | Status | Verified Result |
|---|---:|---|
| **0. Plan & Pre-Execution Amendments** | PASS | Committed (`de0a888`) `docs/ui-plans/phase_8d_implementation_plan.md` + `UI-UX-PLAN.md` Waiver `W-8D-1` (`§7.1:2104`) and Option A `<Delta>` amendments (`§4.3:328`, `§4.3.1:366/:369`, initial `§10`) on local branch `phase-ui-8d-currency`. |
| **1. Route Allowlist & Drift** | PASS | `ui-coverage.js --assert-allowlist` -> **46 pattern(s) verified** (`42 -> 46`); `--routes` -> **75 route entries / 10 redirects / 65 rendering / 0 unassigned**. |
| **2. Token Drift Guard** | PASS | `tokens.js --check --tables` -> `0 drift`. |
| **3. Test ID & ARIA Guard** | PASS | Re-verified post-final edit: `testid-guard.js --base af39772` -> `0` deletions (`all data-testid and aria-label attributes preserved`). |
| **4. Semantic Tone Guard** | PASS | Re-verified post-final edit: `lint-tones.js` -> `0` violations across `61` page CSS files; `0` undefined tokens across `64` total CSS files against `tokens.json`. |
| **5. Stylelint, Ratchet, Overflow & Loading** | PASS | Re-verified post-final edit: `lint-ratchet.js --base af39772` -> `0` regressions across `63` CSS files; `stylelint` clean (`0` errors); `#14b8a6` only in `src/styles/tokens.css:36`; `[data-fs-theme="dark"]` only in `tokens.css:2`; loading bypass grep `0`; scoped `overflow-x` only `Currency.css:212` (`W-8D-1`) & `Certificates.css:267` (`W-8B-1`); `Trades.css` & `chartTheme.js` diffs empty. |
| **6. ESLint & De-Ignore** | PASS | `npx eslint ... --max-warnings=0` -> `0` errors / `0` warnings across all 14 touched files; `git grep -in "pages/currency" .eslintignore` -> `0` matches (line 33 `AddTransactionModal.currency.test.js` preserved for Phase 9A). |
| **7. CRA Jest & jest-axe** | PASS | Re-verified post-final edit: `CurrencyLogPage.test.js` (**14**) + `CurrencyDetailPage.test.js` (**13**) + `CurrencyForm.test.js` (**11**) = **3/3 suites, 38/38 passed**; `0` critical/serious jest-axe violations; `0` inline `[style]` elements. |
| **8. App & Dashboard Smoke + Line Cap** | PASS | `App.test.js` + `DashboardSummary.test.js` = **2/2 suites, 15/15 passed**; `DashboardSummary.js` = `96` lines (`<= 120`). |
| **9. Calculations Parity (I3)** | PASS | `npx jest --runInBand tests/calculations.spec.js --forceExit` -> **1/1 suite, 11/11 passed** across all 8 domains (Domain 6 unchanged). |
| **10. Real-Browser Axe** | PASS | `a11y.spec.js --project=a11y -g "a11y check: currency(-detail\|-new\|-edit)?$"` -> **5 passed** (`setup` + 4 routes), `0` critical/serious violations, `0` CORS errors. |
| **11. Reference Match Spec** | PASS | `currency-reference-match.spec.js --project=reference` -> **10 passed** (`setup` + 9 specs covering dark graphite tokens, neutral badges, `<Delta>` P&L, D19 mobile collapse, `0px` overflow, chart plugin, timeframe toggling, form validation, and ConfirmModal Escape). |
| **12. Production Build** | PASS *(local proxy; CI pending)* | Clean standalone build (`CI=true GENERATE_SOURCEMAP=false NODE_OPTIONS='--max-old-space-size=1536' npm run build`) -> `Compiled successfully.` (`0` errors, `0` new warnings; rebuilt after Gate 17 polish). |
| **13. Visual Baselines & Manifest** | PASS | `--grep="currency(-detail\|-new\|-edit)? @"`: 20 PNGs replaced cleanly in `d86155f`; `verify-baseline-manifest.js` -> **`334/334 baselines verified successfully`**. |
| **14. PR-Subset Visual Regression** | PASS | `PR_SUBSET=true` -> **68 passed + 3 accepted W-6A-1/AD16 diffs** (`3.5m`), `0` 8D diffs. |
| **15. Full 326-Test Visual Suite** | PASS *(authorized deviation from §15.5)* | **326 accounted = 292 passed + 34 accepted AD14/AD16 diffs** (`15.9m`; `0` unexplained, `0` 8D diffs); `test-results/` & `playwright-report/` cleaned post-run. |
| **16. Touch Targets & Focus Rings** | PASS | `currency-reference-match.spec.js --project=reference -g "touch targets"` -> **2 passed** (`>= 44px` primary/expander/submit targets, visible `:focus-visible` outlines on Tab). |
| **17. Developer Visual Inspection** | PASS | All 20 recaptured PNGs (`currency`, `currency-detail`, `currency-new`, `currency-edit` × `1440/1024/768/480/390`) inspected directly; caught & resolved 3 chart/layout polish items and re-inspected all 6 affected PNGs (`d86155f`). |
| **18. Cross-Phase Shared-CSS & Mock Check** | PASS | `--grep="(currency\|currency-detail\|currency-new\|currency-edit\|certificates\|certificates-detail\|certificates-new\|certificates-edit\|trades\|trades-add\|trades-edit\|trade-summary\|credit-cards) @"` -> **66/66 passed** (`2.6m`; `1 setup + 65 captures`, `0` diffs). |

---

## 5. Gate 17 Inspected Snapshot Files (`D:\Projects\FinStat-visual-baselines @ d86155f`)

All 20 recaptured Phase 8D snapshots were visually inspected via `read_file` in `C:\Users\User\.gemini\antigravity\brain\6a81524b-5770-4a5a-a050-161c44267e14\` (matching `D:\Projects\FinStat-visual-baselines @ d86155f`):

- **Currency Log (`/currency`)**: `currency-1440.png`, `currency-1024.png`, `currency-768.png`, `currency-480.png`, `currency-390.png`
- **Currency Detail (`/currency/1`)**: `currency-detail-1440.png`, `currency-detail-1024.png`, `currency-detail-768.png`, `currency-detail-480.png`, `currency-detail-390.png`
- **Add Currency (`/currency/new`)**: `currency-new-1440.png`, `currency-new-1024.png`, `currency-new-768.png`, `currency-new-480.png`, `currency-new-390.png`
- **Edit Currency (`/currency/edit/1`)**: `currency-edit-1440.png`, `currency-edit-1024.png`, `currency-edit-768.png`, `currency-edit-480.png`, `currency-edit-390.png`

### §7.4 State-Screenshot Inheritance Note
*Documented precedent-backed deviation from `UI-UX-PLAN.md §7.4` (`:2155, :2158`):* Loading states (`<Loading variant="card" />`, `<Loading variant="form-field" />`), empty not-found/zero-holding cards (`.curr-empty-card`), API error cards (`.curr-error-card` with `role="alert"` + Retry), `.curr-submit-error` API banners, viewer `ProtectedAction` gating, `ConfirmModal` delete dialogs, and `<Delta>` Gain/Loss/No change & form validation states are verified programmatically in Gate 7 Jest (`38/38`) and Gate 11 Playwright (`10/10`), while populated renders across all 5 widths are baseline-locked in `D:\Projects\FinStat-visual-baselines @ d86155f`, matching Phase 7C–8C precedent.

---

## 6. Gate 19 Merge Boundary & Queued Post-Sign-Off Updates

### Current Sign-Off Status (`phase-ui-8d-currency` @ `79e5afb`)
- [x] Gate 0 (`de0a888`) + Gates 1–18 completed & reconciled (`Trades.css`, `chartTheme.js`, `currencyService.js`, `CurrContext.js`, `App.js`, `formatters.js`, `calculations.spec.js`, `package.json` untouched)
- [x] Temporary `frontend/test-results/` & `frontend/playwright-report/` cleaned; `frontend/tests/visual/fixtures/.auth.json` clean
- [x] Implementation (`79e5afb`) committed on local `phase-ui-8d-currency`; `phase_8d_implementation_plan.md` & `phase_8d_walkthrough.md` committed on `phase-ui-8d-currency`
- [ ] **Awaiting Gate 19 User Sign-Off** *(STOPPED HERE)*
- [ ] Post-sign-off governance sync, review cleanup, `--no-ff` merge to `main`, and push `main` *(QUEUED — do not apply until user approves)*

### Queued Post-Sign-Off Governance Checklist (Not Yet Applied)
1. [ ] `docs/UI-UX_Plan/UI-UX-PLAN.md` **§5.7**: Mark `/currency`, `/currency/:id`, `/currency/new`, `/currency/edit/:id` themed & QA'd (`☑ | ☑`; inline styles `36 + 36 = 72` purged to `0`).
2. [ ] `docs/UI-UX_Plan/UI-UX-PLAN.md` **§6.1**: Mark Phase 8D complete (`☑ | ☑`).
3. [ ] `docs/UI-UX_Plan/UI-UX-PLAN.md` **§6.12**: Check off all Phase 8D checklist items, mark deferred `CertificateDetail.css` & currency D19 card items complete, update Phase 8 counter (`13 of 16 routes themed; 8E Real Estate remains`).
4. [ ] `docs/UI-UX_Plan/UI-UX-PLAN.md` **§8.1 / §8.2**: Note CSS inventory update (`Currency.css` added, `CertificateDetail.css` converted to D22 dark tokens) & update `CurrencyLogPage.js` (`36 -> 0`) / `CurrencyDetailPage.js` (`36 -> 0`).
5. [ ] `docs/UI-UX_Plan/UI-UX-PLAN.md` **§10**: Finalize Phase 8D progress log entry with final SHAs (`de0a888`, `79e5afb`, walkthrough SHA, `39fb1b0 -> d86155f`, merge SHA) and `THEMED_PATTERNS = 46`.
6. [ ] `CHANGELOG.md`: Add Phase 8D entry announcing `AD13` allowlist expansion `42 -> 46` (`/currency`, `/currency/:id`, `/currency/new`, `/currency/edit/:id`), Waiver `W-8D-1`, and Gate 0 `§4.3`/`§4.3.1` Option A `<Delta>` amendment.
7. [ ] Update `- **Status**:` in `docs/ui-plans/phase_8d_implementation_plan.md` & `docs/ui-plans/phase_8d_walkthrough.md` with final merge SHA, remove `*review*.md` from `docs/ui-plans/`, merge `phase-ui-8d-currency` into `main` (`git merge --no-ff`), and push only `main`.
