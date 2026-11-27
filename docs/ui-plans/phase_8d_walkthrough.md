# Phase 8D Walkthrough — Currency

> **Sub-phase**: UI Phase 8D — Currency  
> **Target Routes**: `/currency` (`CurrencyLogPage.js`), `/currency/:id` (`CurrencyDetailPage.js`), `/currency/new` (`AddCurrencyPage.js` + `CurrencyForm.js`), `/currency/edit/:id` (`EditCurrencyPage.js` + `CurrencyForm.js`)  
> **Date**: 2026-11-27  
> **Branch**: `phase-ui-8d-currency` *(local only until user sign-off & merge per §14)*  
> **Merge Base**: `main @ af39772`  
> **Plan SHA**: `de0a888` *(Gate 0 approved plan + `W-8D-1` & Option A `§4.3`/`§4.3.1` amendments on `phase-ui-8d-currency`)*  
> **Starting Baseline Commit**: `39fb1b0` in `D:\Projects\FinStat-visual-baselines` (`334/334` manifest verified)  
> **Gate 13 Baseline Commit SHA**: `d86155f` in `D:\Projects\FinStat-visual-baselines` (`Phase 8D: recapture 20 currency route snapshots`; `334/334` manifest verified)  
> **Implementation Commit SHA**: `79e5afb` (`feat(ui-phase-8d): theme currency log, detail & forms`)  
> **Walkthrough SHAs**: `653fb25` *(initial)*, `89cdacf` *(v1 review)*, `ba338a0` *(v2 review N1–N4)*, `4afe5cc` *(governance sync)*  
> **Merge SHA**: `0991448` *(merged to `main`; governance finalized in follow-up commit)*  
> **Plan & Approval Evidence**: `docs/ui-plans/phase_8d_implementation_plan.md` (v5; Option A, `CertificateDetail.css` conversion, Waiver `W-8D-1`, Gates 12/15 local deviations, and inherited `$` formatter approved by user; Gate 19 signed off 2026-11-27 including Gate 12 `1536`MB fallback & scoped `I4` `useCanModify()` fix; merged to `main` as `0991448`)  
> **Taste Checkpoint**: N/A *(Cluster 8 Taste Checkpoint #6 was delivered and signed off in Phase 8A)*  
> **Status**: Complete & Signed Off *(Gate 19 User Approval 2026-11-27; merged to `main` as `0991448`)*

---

## 1. Executive Summary & Progress Log Entry (§10)

```text
Sub-phase:       UI Phase 8D — Currency
Status:          done (Gate 19 Signed off by User 2026-11-27)
Done:            Migrated all 4 currency routes (/currency, /currency/:id, /currency/new, /currency/edit/:id)
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
                 Y-axis ticks (`maxTicksLimit: 7`), trailing-window `localMinY` clearance, accessible `<details>`/
                 `<table>` + D19 mobile rate cards, and Frame 02 Variant B stacked forms with synchronous
                 initialData hydration, live Implied Purchase Rate preview, on-blur/on-submit validation, and
                 distinct inline/summary/API error banners. Expanded `THEMED_PATTERNS` 42 -> 46, de-ignored
                 lines 34-36 in `.eslintignore`, added 38 Jest + jest-axe tests (3/3 suites passed) and a
                 9-test Playwright reference-match spec (10/10 passed with setup).
Next:            Phase 8E (Real Estate) after Gate 19 user sign-off & merge
Blocked by:      Gate 19 User Sign-Off
Allowlist:       THEMED_PATTERNS expanded 42 -> 46 (+4: '/currency', '/currency/:id', '/currency/new', '/currency/edit/:id')
Visual diff:     Gate 13 replaced 20 PNGs in place (d86155f); Gate 14 68/71 (3 accepted W-6A-1/AD16 only);
                 Gate 15 326 accounted (292 passed + 34 accepted AD14/AD16, matching 7A/8A/8B/8C; 7C recorded
                 326/326; 0 unexplained); Gate 18 66/66 across Currency + Certificates + Trades + Credit Cards
Fixtures:        calculations.spec.js 11/11 passed (byte-identical across 8 domains including Domain 6 Multi-Currency)
Screenshots:     20 recaptures across 1440, 1024, 768, 480, 390px (d86155f); 334/334 manifest verified
Branch:          phase-ui-8d-currency
Plan SHA:        de0a888
Implementation:  79e5afb
Walkthrough:     653fb25 (initial), 89cdacf (v1 review), ba338a0 (v2 review N1-N4), 4afe5cc (gov sync)
Merge SHA:       0991448 (merged to main; governance finalized in follow-up commit)
```

### §0 Plan Decisions Realized

1. **Shared CSS decoupling (`Trades.css` untouched; `CertificateDetail.css` converted)**: `CurrencyLogPage.js` dropped `../trades/Trades.css` and `CurrencyDetailPage.js` dropped `../certificates/CertificateDetail.css` in favor of `./Currency.css`. `git diff af39772 -- frontend/src/pages/trades/Trades.css` is empty, and Gate 18 verified **66/66 passed** across Currency, Certificates, Trades, and Credit Cards. `CertificateDetail.css` (zero remaining active imports) was converted in-place to D22 `html[data-fs-theme]` dark graphite tokens, closing `UI-UX-PLAN.md:1850`.
2. **Inline-style & hardcoded-colour census (`72` total)**: All **72** `style={{` attributes (`36` in `CurrencyLogPage.js`, `36` in `CurrencyDetailPage.js`), `67` hex literals, and `8` `rgba` literals were purged to **0**, enforced by Gate 6 ESLint and Jest DOM `[style]` assertions (`CurrencyLogPage.test.js` Test 13, `CurrencyDetailPage.test.js` Test 12, `CurrencyForm.test.js` Test 10).
3. **Option A FX Unrealized P&L (`<Delta>`) & §4.3/§4.3.1 Gate 0 Amendments**: Per user approval of Plan Review Item #1 **Option A**, `UI-UX-PLAN.md` `§4.3:328`, `§4.3.1:366/:369`, and initial `§10` were amended in Gate 0 (`de0a888`) before Gates 4–18 executed. Both `CurrencyLogPage.js` and `CurrencyDetailPage.js` render FX Unrealized P&L via `<Delta>` (`positive`/`Gain`, `negative`/`Loss`, `neutral`/`No change`), while all exchange rates, foreign units, cost basis, market valuations, hero cards, metric tile containers, and rate-status chips (`Live`, `Stale`, `Manual`) remain neutral. Inherited `$` formatting in `frontend/src/utils/formatters.js` was preserved unchanged per `I3`.
4. **Explicit Scoped `I4` Defensive-Bugfix Deviation — `useCanModify()` destructuring (`CurrencyLogPage.js`)**: At `af39772`, `CurrencyLogPage.js` wrote `const canModify = useCanModify();`, binding the full hook object `{ canModify, isViewer, isAdmin, isManager, role }` (always truthy), so the existing `if (!canModify) return;` guards in `handleRevalueNow` (`:67`) and `handleDelete` (`:86`) never fired for viewer accounts. Phase 8D updated this to `const { canModify } = useCanModify();` so those handler guards match `ProtectedAction`. Zero role definitions or `<ProtectedAction>` semantics were changed; because tightening runtime handler gating exceeds strict presentation-only scope (`UI-UX-PLAN.md:12` / `I4`), it is explicitly flagged as a scoped defensive-bugfix deviation for Gate 19 sign-off confirmation.
5. **Waiver `W-8D-1` & D19 mobile cards (`§7.1:2104`)**: Recorded `W-8D-1` at Gate 0 (`de0a888`) for the 9-column desktop/tablet `.curr-log-page .curr-table-wrap` (`overflow-x: auto`). At `<=768px`, `.curr-table-wrap` and `.curr-history-details` hide cleanly and D19 compact-expand cards (`currency-mobile-cards` and `curr-history-mobile-cards`) render with `0px` page overflow.
6. **Chart accessibility, form hydration, & Playwright fixture alignment (`CurrencyDetailPage.js`, `CurrencyForm.js`, `currencyMocks.js`, `currency-reference-match.spec.js`)**: Chart uses existing `chartTheme.js` exports (`getChartPalette()`, `withAlpha()`, `baseChartOptions()`, `ariaLabel()`) with zero modifications to `chartTheme.js` and local `currLastPointLabelPlugin`. Passing `aria-label={chartAriaLabel}` directly on `<Line />` resolved axe `role-img-alt` on Chart.js's `<canvas role="img">`. `CurrencyForm` initializes `useState` synchronously via `buildFormState(initialData, isEdit)` (preventing empty initial render frames on `/currency/edit/:id`), `currencyMocks.js` includes cross-origin CORS headers + `OPTIONS` preflight handling (matching `certificatesMocks.js`), and Test 6 blurs `priceInput` before submit so `#curr-price-error` renders before clicking `Create Currency`.

---

## 2. Invariant Compliance Checklist (Action Plan §2 Verbatim)

| # | Rule (Verbatim from Action Plan §2) | Verification Method | Status | Evidence / Notes |
| :--- | :--- | :--- | :---: | :--- |
| **I1** | Production routes and URLs unchanged — 75 entries (74 protected + `*`), 10 redirects. | `App.test.js` route-resolution test; `ui-coverage.js` diff | PASS | Gate 1: `ui-coverage.js --assert-allowlist` verified **46** patterns (`42 -> 46`, adding `/currency`, `/currency/:id`, `/currency/new`, `/currency/edit/:id`); `--routes` confirmed **75 route entries / 10 redirects / 65 rendering / 0 unassigned** (`App.js` untouched). Gate 8: `App.test.js` passed (`15/15` total across App + Dashboard). |
| **I2** | No API call, payload shape, or service file changed. | PR diff review; blocked path list in CI | PASS | `currencyService.js`, `CurrContext.js`, `formatters.js`, and backend currency schemas/routes untouched vs `af39772`. Jest Tests 6–8 (`CurrencyForm.test.js`) & 7–9 (`CurrencyLogPage.test.js`, `CurrencyDetailPage.test.js`) verify byte-identical payloads & endpoints. |
| **I3** | No calculation changed on **any** page: payroll, installment schedules, debt payoff, trade P&L, certificate maturity/interest, FX conversion, budget thresholds, real-estate yield. | Characterization fixtures (§9.6) | PASS | Gate 9: `tests/calculations.spec.js` **11/11** passed (byte-identical across 8 domains including Domain 6 Multi-Currency Triangular Conversions). Inherited `$` formatter retained unchanged. |
| **I4** | Auth, roles, `ProtectedAction`, and `useCanModify` gating unchanged. | Viewer-role checklist per phase | PASS *(with scoped defensive deviation — see §0.4)* | `Revalue Now` and `Add Currency` remain wrapped in `ProtectedAction`. **Scoped `I4` deviation**: fixed `CurrencyLogPage.js` `const canModify = useCanModify();` -> `const { canModify } = useCanModify();` (`CurrencyLogPage.js:67, 86`). `ProtectedAction`-disabled controls (`disabled` / `aria-disabled="true"` injected via `ProtectedAction.js` using its own hook call) are verified by `CurrencyLogPage.test.js` Test 10; the handler-guard fix (`if (!canModify) return;`) is verified by source inspection, with zero role or `ProtectedAction` behavior changes. |
| **I5** | Test IDs, `data-*` attributes, and accessible labels preserved — 37 `data-testid`, 39 `aria-label`. | test-ID guard script (§9.2) | PASS | Gate 3: `testid-guard.js --base af39772` `0` deletions; `account-selector-sourceAccount` and all labels preserved; accessible `aria-label`s added to Delete buttons, timeframe group, `<Line />` canvas, and D19 expanders. |
| **I6** | Tables render as compact-expand cards at <= 768px (D19). Horizontal scroll preserved only for tables with >= 12 columns (audit logs) where the card pattern is impractical. No page-level horizontal scroll at 390px. | 390 px visual check: card layout renders, no page-level horizontal scroll, all fields reachable via expander. | PASS | Desktop `.curr-log-page .curr-table-wrap` covered by approved Waiver `W-8D-1` (`Currency.css:212`); at `<=768px` both log and history tables hide cleanly in favor of D19 mobile cards with **0px** page-level overflow at `390px` (Gate 11 Tests 2, 5, 6, 7). |
| **I7** | No page loses functionality mid-migration. | Pattern added only in the converting PR (§6.3) | PASS | All 4 Currency routes added together; CIB revaluation, create/edit/delete flows, timeframe filtering (1W/1M/3M/6M/All), and fallback single-point chart mode all pass Gates 7 & 11. |
| **I8** | Dashboard coordinator line cap preserved — `DashboardSummary.js` must remain $\le 120$ lines (post-audit architecture decomposition invariant). All 10 RTL dashboard tests must remain green. | Line count assertion + `npm test` in 3A | PASS | Gate 8: `DashboardSummary.js` = `96` lines (`<= 120`); `App.test.js` + `DashboardSummary.test.js` **15/15** passed. |
| **I9** | Production build passes with zero errors and no new warnings. | CI (authoritative); local proxy via `npm start` + ESLint/stylelint (§15) | PASS *(local proxy; CI pending)* | Gate 12: standalone `CI=true GENERATE_SOURCEMAP=false NODE_OPTIONS='--max-old-space-size=1536' npm run build` compiled cleanly (`Compiled successfully.`) after authorized `2048`MB attempt hit a Windows semi-space commit failure; Gate 6 ESLint (`--max-warnings=0`) and Gate 5 Stylelint clean. Authoritative CI workflow runs on merge to `main`. |
| **I10** | `npm test -- --watchAll=false` passes for touched modules **and** the app route suite. | CI (frontend test job added in 1C); local proxy: touched suites via `npx jest --runInBand` (§15) | PASS *(local suites)* | Gates 7 & 8: `CurrencyLogPage.test.js` (14) + `CurrencyDetailPage.test.js` (13) + `CurrencyForm.test.js` (11) + `App.test.js` + `DashboardSummary.test.js` = **53/53** passed in-band (`38` + `15`). |
| **I11** | No new `!important`; a file's count in the 1C lint ratchet may only fall. | stylelint + `lint-ratchet.js` (§9.2) | PASS | Gate 5: `lint-ratchet.js --base af39772` `0` regressions across `63` CSS files; `0` `!important` in `Currency.css`, `CertificateDetail.css`, and Section 21. |
| **I12** | No new dependency except the Phase 1C tooling list (§9.2). | `package.json` review | PASS | `frontend/package.json` and lockfile untouched vs `af39772`. |
| **I13** | Every non-allowlisted route is pixel-identical to its 1B baseline. | Walkthrough-evidenced per §7.1: developer-run Playwright diff report attached to each phase walkthrough, with zero unexplained diffs. | PASS | Gate 14 (`68/71` W-6A-1/AD16 only), Gate 15 (`292 + 34 accepted AD14/AD16 = 326`, `0` unexplained), Gate 18 (**66/66** across Currency, Certificates, Trades, Credit Cards). |
| **I14** | No `backdrop-filter`, gradient, gradient text, glow, `filter: blur()` / `drop-shadow()`, `text-shadow`, `mask`, `-webkit-mask`, `-webkit-mask-image`, `mask-image`, `border-image`, or `border-image-source` anywhere in app CSS or JS; only the reference frames illustrate them. | stylelint (§9.2) | PASS | Removed blue/dark-navy gradients (`#0284c7 -> #0369a1`, `#0f172a -> #1e293b`), light cards, and pixel `box-shadow`s; Gate 5 stylelint + Gate 6 ESLint confirm zero banned effects. |
| **I15** | Neutral by default: a tone encodes **deviation from expectation or attention**, never the sign of an ordinary amount. Expense amounts, income, and balances are neutral (§4.3). A page never references a tone token directly; it uses `Delta`, `Badge`, or a `.fs-progress--*` modifier. | stylelint + `lint-tones.js` + §4.3 domain table + §7.2 | PASS | Gate 4: `lint-tones.js` `0` violations; rates, foreign units, cost basis, valuations, and feed-status badges (`Live`/`Stale`/`Manual`) stay neutral; FX unrealized P&L uses `<Delta>` per Gate 0 Option A (`§4.3:328`, `§4.3.1:366/:369`); `--fs-danger` is isolated in Section 21 for error surfaces (`role="alert"`) and danger button outlines. |
| **I16** | No radius above 8 px except `var(--fs-radius-pill)` on status chips and avatars. | stylelint (§9.2) | PASS | Removed `16px`, `12px`, `20px`, and `50%` radii; Gate 5 stylelint + Gate 11 verify card/tile/form radii `<= 8px` (`--fs-radius-sm/md/lg`), `--fs-radius-pill` on `<Badge>` only. |

---

## 3. Visual Regression Diff Report (§7.1)

Per §7.1 (`UI-UX-PLAN.md:2099`), Gate 13, Gate 14, Gate 15, and Gate 18 were executed against `D:\Projects\FinStat-visual-baselines` (`d86155f`) served locally from the final Gate 12 `CI=true` static production build.

> [!NOTE]
> **Authorized Local Deviations (`Gate 12` & `Gate 15 / §15.5` + `§7.1` HTML Report Substitution)**:
> 1. **Gate 12 (`2048`MB authorized -> `1536`MB hardware fallback)**: `UI-UX-PLAN.md §15.3` prefers `4096`MB (`:3145`), approved `phase_8d_implementation_plan.md` Gate 12 specifies `2048`MB (explicitly authorized by user on 2026-11-27), and the clean production build used `NODE_OPTIONS='--max-old-space-size=1536'` after `2048`MB hit a Windows V8 semi-space commit failure. **`1536`MB is a further hardware fallback after the authorized `2048`MB attempt failed; authoritative CI on `main` remains authoritative**, and Gate 19 sign-off explicitly confirms accepting this `1536`MB fallback.
> 2. **Gate 15 (`§15.5`)**: `UI-UX-PLAN.md §15.5` (`:3129–3133`) notes *"Do not run the full visual suite locally; use the PR subset and let CI run the full matrix."* Running the full 326-test `--project=visual` suite locally in Gate 15 was **explicitly authorized by user** (`"authorize the local 2048MB gate 12 and full gate 15"`) per Phase 8A–8C precedent to reconcile all 326 baselines prior to sign-off.
> 3. **§7.1 HTML-Report Substitution Disclosure**: Matching Phase 8A–8C git-hygiene precedent, generated `frontend/test-results/` and `frontend/playwright-report/` were removed after Gate 15 completed rather than left untracked in the working tree; §7.1 HTML-report attachment is satisfied by the in-walkthrough `(a)–(d)` diff summary and accepted-diff register below.

### Diff Summary (Gate 15 Full Visual Suite & Gate 14 PR-Subset)

- **(a) Total routes / captures compared**:
  - **Gate 15 (Full Suite)**: **65 routes × 5 widths (1440, 1024, 768, 480, 390px) = 325 route captures + 1 auth setup = 326 Playwright tests** (`15.9m`).
  - **Gate 14 (`pr-subset`)**: **70 route captures** (65 routes @ 1440px + 5 smoke routes @ 390px) + **1 auth setup = 71 Playwright tests** (`3.5m`).
- **(b) Routes / captures with zero diff**:
  - **Gate 15**: **291 zero-diff route captures** (+ `1 setup` = **292 passed**), including **all 20 newly themed Phase 8D currency recaptures (`d86155f`)**, all 20 Certificates routes, all 20 Trades routes, and all 5 Credit Cards routes.
  - **Gate 14**: **67 zero-diff route captures** (+ `1 setup` = **68 passed**).
- **(c) Routes / captures with accepted pre-existing diffs**:
  - **34 accepted pre-existing baseline diffs in Gate 15** — matching Phase 7A, 8A, 8B, and 8C (`292 + 34`) *(Phase 7C recorded `326/326` after reconciliation)*; **0 diffs attributable to Phase 8D**:
    - **AD14 (10 diffs)**: `not-found` @ 768/480/390px (`3`), `dashboard` @ 768/480px (`2`), `expenditures` @ 768/480px (`2`), `expenditure-analysis` @ 1024/768/480px (`3`).
    - **AD16 / W-6A-1 (24 diffs)**: `salary-profiles` @ 768/480/390px (`3`), `salary-profile-update` @ 1440/1024/768/480/390px (`5`), `salary-paychecks-new` @ 768/480/390px (`3`), `salary-paychecks-edit` @ 768/480/390px (`3`), `analysis-payroll` @ 1440/1024/768/480/390px (`5`), `salary-rules` @ 1440/1024/768/480/390px (`5`). *(Gate 14's only 3 failures were `salary-profile-update @ 1440px`, `analysis-payroll @ 1440px`, and `salary-rules @ 1440px`.)*
  - **Intentional Phase 8D recaptures (`d86155f`)**: `/currency`, `/currency/1`, `/currency/new`, `/currency/edit/1` × 5 viewports (`20` snapshots replaced in place; AD13 allowlist expansion `42 -> 46`).
- **(d) Routes with unexplained diffs**: **0** (`0` unexplained diffs; `0` diffs attributable to Phase 8D).

### Manifest Integrity (`verify-baseline-manifest.js`)

- **Starting baseline commit**: `39fb1b0` (`D:\Projects\FinStat-visual-baselines`, `334/334`)
- **Gate 13 baseline commit**: `d86155f` (`D:\Projects\FinStat-visual-baselines`, `"Phase 8D: recapture 20 currency route snapshots"`, `21` files changed, `0` net new entries)
- **Captured commands & output**:
```powershell
node frontend/scripts/verify-baseline-manifest.js --generate
node frontend/scripts/verify-baseline-manifest.js
```
```text
Manifest generated for 334 baselines at D:\Projects\FinStat\frontend\tests\visual\baseline\manifest.json
334/334 baselines verified successfully.
```

---

## 4. Gate Verification Evidence (Gates 0–18)

| Gate | Status | Verified Result |
|---|---:|---|
| **0. Plan & Pre-Execution Amendments** | PASS | Committed (`de0a888`) `docs/ui-plans/phase_8d_implementation_plan.md` + `UI-UX-PLAN.md` Waiver `W-8D-1` (`§7.1:2104`) and Option A `<Delta>` amendments (`§4.3:328`, `§4.3.1:366/:369`, initial `§10`) on local branch `phase-ui-8d-currency`. |
| **1. Route Allowlist & Drift** | PASS | `ui-coverage.js --assert-allowlist` -> **46 pattern(s) verified** (`42 -> 46`); `--routes` -> **75 route entries / 10 redirects / 65 rendering / 0 unassigned** (raw stdout recorded below). |
| **2. Token Drift Guard** | PASS | `tokens.js --check --tables` -> `0 drift`. |
| **3. Test ID & ARIA Guard** | PASS | Re-verified post-final edit: `testid-guard.js --base af39772` -> `0` deletions (`all data-testid and aria-label attributes preserved`). |
| **4. Semantic Tone Guard** | PASS | Re-verified post-final edit: `lint-tones.js` -> `0` violations across `61` unexempt page CSS files; `0` undefined tokens across `64` total CSS files on disk against `tokens.json` (`64` on-disk files vs `§8.1`'s `57`-file snapshot; `lint-tones` Check 1 exempts the `3` shared theme stylesheets `tokens.css`, `theme.css`, `theme-components.css` = `61`). |
| **5. Stylelint, Ratchet, Overflow & Loading** | PASS | Re-verified post-final edit: `lint-ratchet.js --base af39772` -> `0` regressions across `63` linted CSS files (`64` on disk minus exempt generated `tokens.css`); `stylelint` clean (`0` errors); `#14b8a6` only in `src/styles/tokens.css:36`; `[data-fs-theme="dark"]` only in `tokens.css:2`; loading bypass grep `0`; scoped `overflow-x` only `Currency.css:212` (`W-8D-1`) & `Certificates.css:267` (`W-8B-1`); `Trades.css` & `chartTheme.js` diffs empty. |
| **6. ESLint & De-Ignore** | PASS | `npx eslint ... --max-warnings=0` -> `0` errors / `0` warnings across all 14 touched files; `git grep -in "pages/currency" .eslintignore` -> `0` matches (line 33 `AddTransactionModal.currency.test.js` preserved for Phase 9A). |
| **7. CRA Jest & jest-axe** | PASS | Re-verified post-final edit: `CurrencyLogPage.test.js` (**14**) + `CurrencyDetailPage.test.js` (**13**) + `CurrencyForm.test.js` (**11**) = **3/3 suites, 38/38 passed**; `0` critical/serious jest-axe violations; `0` inline `[style]` elements. |
| **8. App & Dashboard Smoke + Line Cap** | PASS | `App.test.js` + `DashboardSummary.test.js` = **2/2 suites, 15/15 passed**; `DashboardSummary.js` = `96` lines (`<= 120`). |
| **9. Calculations Parity (I3)** | PASS *(local proxy; CI pending)* | `npx jest --runInBand tests/calculations.spec.js --forceExit` -> **1/1 suite, 11/11 passed** (byte-identical across 8 domains including Domain 6 Multi-Currency). |
| **10. Real-Browser Axe** | PASS | Filtered command (exact CLI below) -> **5 passed** (`1 setup + 4 routes`), `0` critical/serious violations, `0` CORS errors. |
| **11. Reference Match Spec** | PASS | `currency-reference-match.spec.js --project=reference` -> **10 passed** (`setup` + 9 specs covering dark graphite tokens, neutral badges, `<Delta>` P&L, D19 mobile collapse, `0px` overflow, chart plugin, timeframe toggling, form validation, and ConfirmModal Escape). |
| **12. Production Build** | PASS *(local proxy; CI pending)* | Standalone build with `--max-old-space-size=1536` (hardware fallback after authorized `2048`MB hit a Windows semi-space commit failure) -> `Compiled successfully.` (`0` errors, `0` new warnings; exact CLI below). |
| **13. Visual Baselines & Manifest** | PASS | Filtered snapshot command (exact CLI below): **21 passed** (`1 setup + 20 PNGs` replaced cleanly in `d86155f`); `verify-baseline-manifest.js` -> **`334/334 baselines verified successfully`**. |
| **14. PR-Subset Visual Regression** | PASS | `PR_SUBSET=true` -> **68 passed + 3 accepted W-6A-1/AD16 diffs** (`3.5m`), `0` 8D diffs. |
| **15. Full 326-Test Visual Suite** | PASS *(authorized deviation from §15.5)* | **326 accounted = 292 passed + 34 accepted AD14/AD16 diffs** (`15.9m`; `0` unexplained, `0` 8D diffs); `test-results/` & `playwright-report/` cleaned post-run. |
| **16. Touch Targets & Focus Rings** | PASS | `currency-reference-match.spec.js --project=reference -g "touch targets"` -> **2 passed** (`>= 44px` primary/expander/submit targets, visible `:focus-visible` outlines on Tab). |
| **17. Developer Visual Inspection** | PASS | All 20 recaptured PNGs (`currency`, `currency-detail`, `currency-new`, `currency-edit` × `1440/1024/768/480/390`) inspected directly; caught & resolved 3 chart/layout polish items and re-inspected all 6 affected PNGs (`d86155f`). |
| **18. Cross-Phase Shared-CSS & Mock Check** | PASS | Cross-phase grep (exact CLI below) -> **66/66 passed** (`2.6m`; `1 setup + 65 captures`, `0` diffs). |

### Exact Captured CLI Commands & Gate 1 Raw Stdout

- **Gate 1 (`ui-coverage.js`)**:
```powershell
node frontend/scripts/ui-coverage.js --assert-allowlist
node frontend/scripts/ui-coverage.js --routes
```
```text
[ui-coverage] Asserting allowlist against 75 defined routes in App.js...
✓ [ui-coverage] Allowlist assertion passed. 46 pattern(s) verified against App.js routes.
=== Route Coverage Matrix ===
Total route entries: 75
Redirects: 10
Rendering routes: 65
Unassigned: 0
✓ 75 route entries confirmed. 0 unassigned.
```

- **Gates 10, 12, 13, and 18 Exact Commands**:
```powershell
# Gate 10 (Real-Browser Axe):
npx playwright test a11y.spec.js --project=a11y -g "a11y check: currency(-detail|-new|-edit)?$"

# Gate 12 (Production Build — 1536MB fallback after authorized 2048MB semi-space OOM):
$env:CI='true'; $env:GENERATE_SOURCEMAP='false'; $env:NODE_OPTIONS='--max-old-space-size=1536'; npm run build

# Gate 13 (Baseline Recapture):
npx playwright test visual.spec.js --project=visual --grep="currency(-detail|-new|-edit)? @" --update-snapshots

# Gate 18 (Cross-Phase Shared-CSS & Unthemed Consumer Check):
npx playwright test visual.spec.js --project=visual --grep="(currency|currency-detail|currency-new|currency-edit|certificates|certificates-detail|certificates-new|certificates-edit|trades|trades-add|trades-edit|trade-summary|credit-cards) @"
```

---

## 5. Gate 17 Reference-Frame Conformance & Inspection Evidence

### Gate 17 Catch & Resolution Log & Re-Verification Chronology
During initial Gate 17 visual inspection of the 20 currency recaptures, three polish defects surfaced:
1. **`currency-detail-390.png` blank chart plot area & unrounded IEEE-754 Y-axis ticks**: Unrounded Y-axis ticks (`50.80000000000001 EGP`) consumed ~170px of horizontal space inside the `390px` chart card, squeezing `chartArea.width` blank. Fixed in `CurrencyDetailPage.js` by formatting Y-axis ticks via `${Number(value).toFixed(2)} EGP` and capping X-axis labels at `maxTicksLimit: 7`, restoring full `390px` canvas rendering.
2. **`currLastPointLabelPlugin` trailing dot overlap at `768px` / `480px`**: Because `USD: 50.50 EGP` is right-aligned leftward from `pt.x`, `pt.y - 10` intersected slightly higher trailing dots (`2026-01-13`/`14`). Updated `currLastPointLabelPlugin.afterDatasetsDraw` to compute `localMinY` across the trailing 8 points and place the label above `localMinY - 10` (clamped inside `chartArea.top + 14`).
3. **`currency-edit-390.png` Implied Purchase Rate unit wrap**: `1 USD = 48.0000 EGP` wrapped `"EGP"` onto a second line at `390px`. Added `white-space: nowrap; flex-shrink: 0;` to `.curr-implied-rate-val` in `Currency.css`.

**Strict Post-Polish Re-Verification Chronology**:
After those final edits to `CurrencyDetailPage.js` and `Currency.css`, we re-ran:
1. Gates 3–7 (`testid-guard.js --base af39772`, `lint-tones.js`, `lint-ratchet.js --base af39772`, `stylelint`, `eslint --max-warnings=0`, Jest **38/38 passed**);
2. Gate 12 clean standalone production build (`1536`MB, `Compiled successfully.`);
3. Gates 10 (`5/5`), 11 (`10/10`), and 16 (`2/2`) against that rebuilt bundle;
4. Removed the 6 affected stale PNGs (`currency-detail-*` + `currency-edit-390`) and regenerated fresh snapshots from the rebuilt bundle (`7 passed`), re-inspected all 6 updated renders in Gate 17, and amended `D:\Projects\FinStat-visual-baselines` to final baseline commit `d86155f` (`verify-baseline-manifest.js`: `334/334` verified);
5. Executed Gates 14 (`68/71`), 15 (`292 + 34 = 326`), and 18 (`66/66`) against final build + final `d86155f` baselines before committing implementation as `79e5afb`.

### Inspected Snapshot Files (`D:\Projects\FinStat-visual-baselines @ d86155f`)

All 20 recaptured snapshots in `frontend/tests/visual/baseline/` (tracked in `D:\Projects\FinStat-visual-baselines @ d86155f`) passed Gate 17 visual inspection across 1440, 1024, 768, 480, and 390px:

- **Currency Log (`/currency`)**: `currency-1440.png`, `currency-1024.png`, `currency-768.png`, `currency-480.png`, `currency-390.png`
- **Currency Detail (`/currency/1`)**: `currency-detail-1440.png`, `currency-detail-1024.png`, `currency-detail-768.png`, `currency-detail-480.png`, `currency-detail-390.png`
- **Add Currency (`/currency/new`)**: `currency-new-1440.png`, `currency-new-1024.png`, `currency-new-768.png`, `currency-new-480.png`, `currency-new-390.png`
- **Edit Currency (`/currency/edit/1`)**: `currency-edit-1440.png`, `currency-edit-1024.png`, `currency-edit-768.png`, `currency-edit-480.png`, `currency-edit-390.png`

### Computed-Style Reference Conformance (Verified via Gate 11 & Gate 16)

| Property | Desktop (`1440px`) | Mobile (`390px`) | Reference Frame B Target |
|---|---|---|---|
| `.curr-log-page` / `.curr-detail-page` / `.curr-form-page` canvas | `rgb(16, 17, 20)` | `rgb(16, 17, 20)` | Dark graphite canvas `#101114` |
| Flat KPI tiles (4 log, 1 detail hero, 6 metric tiles) | `rgb(26, 28, 32)`, `background-image: none`, `box-shadow: none`, radius `<= 8px` | same | Frame 03 Variant B flat surfaces (gradients & shadows removed) |
| Primary CTAs & link underline hierarchy | `rgb(20, 184, 166)` bg, `rgb(13, 14, 16)` ink, 1 primary CTA (`>= 44px`); `.curr-name-link` underlined; `.curr-back-link` `text-decoration-line: none` | same, full-width stacked CTA `>= 44px` | §4.4 single accent CTA with `--fs-ink` text |
| Rate status chips & FX P&L | Neutral `<Badge>` (`--fs-surface-raised`, `--fs-radius-pill`) for `Live`/`Stale`/`Manual`; `<Delta>` (`Gain`/`Loss`/`No change`) for P&L; right-aligned `.curr-td-num.fs-num` | same inside D19 cards | §4.3 / §4.3.1 Option A + right-aligned tabular figures |
| Historical rate Line chart & table | Canvas `> 200x200px`, `[data-plugin-ids*="currLastPointLabelPlugin"]`, `toFixed(2) EGP` Y-axis, `maxTicksLimit: 7`, `curr-chart-summary`, `<details>` + `curr-rate-history-table` | Same crisp chart plot + desktop `<details>` hidden; `curr-history-mobile-cards` visible | §4.12 chart accessibility & Gate 17 `390px` plot clarity |
| D19 Mobile Collapse & Page Overflow | `.curr-table-wrap` (`W-8D-1` at `> 768px`) | `.curr-table-wrap` hidden; `currency-mobile-cards` visible (`>= 44x44px` expander), `0px` page overflow | §2 `I6` / D19 compact-expand mobile cards |
| Stacked Form (`.curr-form-card`) | `account-selector-sourceAccount` preserved; live Implied Rate box; blur `#curr-*-error` (`aria-invalid="true"`) & valid-blur reset; distinct submit `.curr-form-error-summary` | Single-line `1 USD = 48.0000 EGP` preview (`nowrap`), full-width Cancel/Submit, `0px` overflow | Frame 02 Variant B stacked form + blur/submit cadence |

### §7.4 State-Screenshot Inheritance Note
*Documented precedent-backed deviation from `UI-UX-PLAN.md §7.4` (`:2155, :2158`):* Loading states (`<Loading variant="card" />`, `<Loading variant="form-field" />`), empty not-found/zero-holding cards (`.curr-empty-card`), API error cards (`.curr-error-card` with `role="alert"` + Retry), `.curr-submit-error` API banners, viewer `ProtectedAction` gating, `ConfirmModal` delete dialogs, and `<Delta>` Gain/Loss/No change & form validation states are verified programmatically in Gate 7 Jest (`38/38`) and Gate 11 Playwright (`10/10`), while populated renders across all 5 widths are baseline-locked in `D:\Projects\FinStat-visual-baselines @ d86155f`, matching Phase 7C–8C precedent.

---

## 6. Gate 19 Merge Boundary & Queued Post-Sign-Off Updates

### Current Sign-Off Status (`phase-ui-8d-currency`)
- [x] Gate 0 (`de0a888`) + Gates 1–18 completed & reconciled (`Trades.css`, `chartTheme.js`, `currencyService.js`, `CurrContext.js`, `App.js`, `formatters.js`, `calculations.spec.js`, `package.json` untouched)
- [x] Temporary `frontend/test-results/` & `frontend/playwright-report/` cleaned; `frontend/tests/visual/fixtures/.auth.json` clean
- [x] Implementation (`79e5afb`) + walkthrough (`653fb25`, `89cdacf`, `ba338a0`) + governance (`4afe5cc`) committed on local `phase-ui-8d-currency`
- [x] **Gate 19 User Sign-Off** (approved 2026-11-27, confirming Gate 12 `1536`MB fallback [H6] and scoped `I4` defensive `useCanModify()` handler-guard fix [N1] alongside Gates 1–18 evidence)
- [x] Post-sign-off governance sync, review cleanup, `--no-ff` merge to `main` (`0991448`), and push only `main` (`origin/main`)

### Post-Sign-Off Governance Checklist (Executed 2026-11-27)
1. [x] `docs/UI-UX_Plan/UI-UX-PLAN.md` **§5.7 (`:931–934`)**: Marked `/currency`, `/currency/:id`, `/currency/new`, `/currency/edit/:id` themed & QA'd (`☑ | ☑`; recorded `36 + 36 = 72` inline styles purged to `0`, D19 cards, `W-8D-1`, `chartTheme` + local `currLastPointLabelPlugin` + `<details>`/`<table>`).
2. [x] `docs/UI-UX_Plan/UI-UX-PLAN.md` **§6.1 (`:1068`)**: Marked Phase **8D** complete (`☑ | ☑`).
3. [x] `docs/UI-UX_Plan/UI-UX-PLAN.md` **§6.12 (`:1850`, `:1854`, `:1862–1869`, `:1889`)**: Checked closed Phase 8C deferred items `:1850` (`CertificateDetail.css` converted to D22 dark tokens) & `:1854` (currency D19 cards), checked all 8 Phase 8D checklist items, and updated Phase 8 counter (`9 of 16` -> `13 of 16 routes themed; 8E Real Estate remains`).
4. [x] `docs/UI-UX_Plan/UI-UX-PLAN.md` **§8.1 (`:2183`)**: Recorded pre-existing CSS inventory drift (**63** pre-8D / **64** post-8D CSS files on disk including `PaycheckLog.css`, `PayrollAnalyticsPage.css`, `MutualFunds.css`, `GoldWallet.css`, `Certificates.css`, `Currency.css` vs `§8.1`'s `57`-file snapshot, plus `CertificateDetail.css` conversion to D22 dark tokens).
5. [x] `docs/UI-UX_Plan/UI-UX-PLAN.md` **§8.2 (`:2206–2207`)**: Updated `CurrencyDetailPage.js` (`36`) and `CurrencyLogPage.js` (`36`) to `36 *(purged to 0 in 8D)*`.
6. [x] `docs/UI-UX_Plan/UI-UX-PLAN.md` **§10**: Finalized Phase 8D progress log entry with all template SHAs (`de0a888`, `79e5afb`, `653fb25`, `89cdacf`, `ba338a0`, `39fb1b0 -> d86155f`), `THEMED_PATTERNS = 46`, H6 Gate 12 `1536`MB fallback, and N1 scoped `I4` defensive `useCanModify()` handler-guard fix.
7. [x] `CHANGELOG.md`: Added Phase 8D entry announcing `AD13` allowlist expansion `42 -> 46` (`/currency`, `/currency/:id`, `/currency/new`, `/currency/edit/:id`), Waiver `W-8D-1`, Gate 0 `§4.3`/`§4.3.1` Option A `<Delta>` amendment, and `CertificateDetail.css` D22 conversion.
8. [x] Updated `- **Status**:` and Merge SHA (`0991448`) in `docs/ui-plans/phase_8d_implementation_plan.md`, `docs/ui-plans/phase_8d_walkthrough.md`, and `UI-UX-PLAN.md §10`, deleted all `*review*.md` files from `docs/ui-plans/`, merged `phase-ui-8d-currency` into `main` (`--no-ff` `0991448`), and pushed only `main` (authoritative CI tracked on `origin/main`).
