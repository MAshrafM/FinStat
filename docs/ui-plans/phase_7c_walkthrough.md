# UI Sub-Phase Walkthrough Template

> **Sub-phase**: UI Phase 7C — Mutual Funds Subsystem  
> **Target Routes**: `/mutual-funds`, `/mutual-funds/new`, `/mutual-funds/edit/:id`, `/mutual-funds/summary`  
> **Date**: 2026-11-26  
> **Branch**: `phase-ui-7c-mutual-funds`  
> **Merge Base**: `main @ 5298b11`  
> **Starting Baseline Commit**: `cfaadb5` in `D:\Projects\FinStat-visual-baselines` (334/334 manifest verified per plan)  
> **Gate 13 Baseline Commit SHA**: `df94041` (`D:\Projects\FinStat-visual-baselines`, 20 MF recaptures)  
> **Additional Baseline Commit**: `fb5e3bf` (`D:\Projects\FinStat-visual-baselines`, 3 trade-summary mobile recaptures for pre-existing b9ecafe staleness; manifest 334/334)  
> **Implementation SHA**: `e1e1822` (local branch `phase-ui-7c-mutual-funds`; feature branch not pushed)  
> **Documentation SHA**: Pending  
> **Merge SHA**: Pending (after sign-off)  
> **Status**: Signed off by user 2026-11-26 — Gate 17 confirmed and Gate 19 in progress (Gates 1–18 passed; Gate 15 full visual reconciliation 326/326 passed; Gate 14 retains only the accepted 3 W-6A-1/AD16 diffs; governance sync complete; merge/push pending)

---

## 1. Executive Summary & Progress Log Entry (§10)

```
Sub-phase:   UI Phase 7C — Mutual Funds Subsystem
Status:      SIGNED OFF BY USER 2026-11-26 — Gates 1–18 pass; Gate 17 visual inspection confirmed; governance sync complete; merge/push pending
Done:        Migrated 4 mutual-funds routes to FinStat dark graphite system. Added MutualFunds.css
             (scoped html[data-fs-theme] .mf-*, zero !important). Added theme-components.css
             Section 17 (active filter accent/ink, danger hover, error-card border) under
             attribute-existence selectors (D22). Decoupled MutualFundLogPage and
             MutualFundSummaryPage from Trades.css/SummaryRow.css without editing shared CSS.
             Purged 30 inline styles total (18 MutualFundForm.js, 7 MutualFundLogPage.js,
             5 MutualFundSummaryPage.js). Replaced inline filter/type styling with neutral
             tokens/badges; P&L uses Delta sign+value+Gain/Loss label; Price Unavailable is
             neutral badge. Added D19 compact-expand cards at <=768px, loading/empty/error/
             validation/disabled states, accessible actions/labels, and ConfirmModal delete flow.
             Removed 4 mutual-funds entries from .eslintignore. Expanded THEMED_PATTERNS 29->33.
             Added/updated CRA+jest-axe suites (12+14+12=38). Wired deterministic Playwright
             mocks and registered mutual-funds-reference-match spec. Investigated/resolved
             Gate 14 trade-summary regression: pre-existing b9ecafe baseline staleness (not 7C);
             added margin-top:0 to .section-title-row .section-title override in Trades.css;
             recaptured 3 trade-summary mobile baselines (fb5e3bf, 334/334 manifest).
Next:        Merge to main, record merge SHAs, push main only (per §14)
Blocked by:  None (explicit sign-off received 2026-11-26)
Allowlist:   THEMED_PATTERNS expanded to 33 routes (+4: /mutual-funds, /mutual-funds/new,
             /mutual-funds/edit/:id, /mutual-funds/summary)
Visual diff: Gate 13 recaptured 20 MF snapshots (df94041). Gate 14 68/71 (3 known W-6A-1/AD16 only). Gate 15 326/326 passed. Gate 18 111/111 passed. 3 trade-summary mobile baselines recaptured as b9ecafe staleness (fb5e3bf).
Fixtures:    calculations.spec.js passing 11/11 (byte-identical, 8 domains unchanged)
Screenshots: 20 MF baseline snapshots recaptured (df94041); 3 trade-summary mobile recaptured (fb5e3bf); Gate 17 user-confirmed 2026-11-26
Branch:      phase-ui-7c-mutual-funds
Merge SHA:   Pending (after sign-off)
```

### §0 Plan Decisions (recorded for sign-off)

1. **Typography (D16/AD10)**: `.fs-num` remains IBM Plex Sans + `font-variant-numeric: tabular-nums`; `.fs-code`/`.fs-mono` reserved for fund-code identifiers only. No mono-figures amendment.
2. **P&L labels (§4.3.1)**: Use recorded `Gain` / `Loss`. “% Profit” remains column heading; Delta label is `Gain` or `Loss`.
3. **Shared primitives**: Accept implemented `Delta` sign + value + label (no arrow) and shared `ConfirmModal` `<h3>` precedent. No `Delta` arrow support, no `headingLevel` prop, no 7C-only modal.
4. **Tone provenance**: `Buy`/`Sell`/`Coupon` are neutral badges. `Price Unavailable` and coupon-units hints are neutral text/badges carrying meaning in label/text. Validation errors use existing `.form-error` / `aria-invalid` pattern. No new §4.3.1 threshold/label.
5. **W-7C-1 (approved in plan §0, active for Gate 5)**: `.mf-table-wrap { overflow-x: auto; }` retained for 8-column log and 9-column summary tables per 7A `2624f2b` / 7B precedent. Gate 5 scoped to 7C-owned CSS only; page-level overflow at 390px prohibited. §7.1 governing-text sync completed 2026-11-26. **Recorded §7.1 text:** add W-7C-1 to documented overflow exceptions alongside ≥12-column audit-log exceptions and `TaxSimulator.css:280` / legacy audit exceptions: “`.mf-table-wrap` in `frontend/src/pages/mutual-funds/MutualFunds.css` uses `overflow-x: auto` for the 8-column Mutual Fund Log and 9-column Mutual Fund Holdings Summary (W-7C-1, Phase 7C, 7A `2624f2b` / 7B precedent). Page-level horizontal overflow remains prohibited at 390px (D19).” Also update the §7.1 grep/exception sentence to include W-7C-1.
6. **Delta arrow language superseded for 7C**: 7A arrow language is superseded by implemented sign + value + `Gain`/`Loss` label; acceptance is sign/value/label, never colour alone.
7. **Shared delete-dialog heading**: Shared `ConfirmModal` `<h3>` accepted; 7B local `<h2>` remains local precedent only.
8. **Calculation fixtures unchanged**: `tests/calculations.spec.js` unchanged (11/11, 8 domains). MF math characterized by 6 Gate 7 assertions covering 5 named calculations.

---

## 2. Invariant Compliance Checklist (Action Plan §2 Verbatim)

| # | Rule (Verbatim from Action Plan §2) | Verification Method | Status | Evidence / Notes |
| :--- | :--- | :--- | :---: | :--- |
| **I1** | Production routes and URLs unchanged — 75 entries (74 protected + `*`), 10 redirects. | `ui-coverage.js --assert-allowlist`; `App.test.js` | PASS | Gate 1: 33/33 patterns verified against 75 routes. Gate 8: `App.test.js` 9/9 passed. |
| **I2** | No API call, payload shape, or service file changed. | PR diff review; blocked path list in CI | PASS (local review) | No `mutualFundService.js`/`MFContext.js` production changes; form submit preserves payload fields (`units`, `price`, `fees`, `totalValue`, `sourceAccount`, `destinationAccount`, `autoReinvest`). |
| **I3** | No calculation changed on **any** page: payroll, installment schedules, debt payoff, trade P&L, certificate maturity/interest, FX conversion, budget thresholds, real-estate yield. | Characterization fixtures (§9.6) | PASS | Gate 9: `calculations.spec.js` 11/11 passed, unchanged 8 domains. Gate 7 includes 6 MF math assertions: Buy totalValue, Sell/Coupon totalValue, `totalUnitsForCode`, `valueWithoutCoupons`, `sellingValue`, `totalProfit`. |
| **I4** | Auth, roles, `ProtectedAction`, and `useCanModify` gating unchanged. | Viewer-role checklist per phase | PASS | `ProtectedAction` wraps Add/Edit/Delete actions; `useCanModify()` gates delete; read-only tests assert disabled/aria-disabled behavior. |
| **I5** | Test IDs, `data-*` attributes, and accessible labels preserved — 37 `data-testid`, 39 `aria-label`. | test-ID guard script (§9.2) | PASS | Gate 3: 0 deletions. Added new accessible labels/testids (`mf-mobile-card-list`, `mf-summary-mobile-card-list`, expand/delete/edit aria-labels). |
| **I6** | Tables render as compact-expand cards at ≤ 768px (D19). Horizontal scroll preserved only for tables with ≥ 12 columns (audit logs) where the card pattern is impractical. No page-level horizontal scroll at 390px. | 390 px visual check: card layout renders, no page-level horizontal scroll, all fields reachable via expander. | PASS | CSS implements D19 mobile cards and desktop `.mf-table-wrap` (W-7C-1). Gate 11 passed (9/9), asserting 390/480/768 behavior, zero page scroll, and ≥44px expanders. Gate 17 user visual confirmation received 2026-11-26. |
| **I7** | No page loses functionality mid-migration. | Pattern added only in the converting PR (§6.3) | PASS (local) | All 4 MF patterns added together in `THEMED_PATTERNS`; CRUD/filter/pagination/coupon auto-reinvest/summary preserved by code and unit tests. |
| **I8** | Dashboard coordinator line cap preserved — `DashboardSummary.js` must remain $\le 120$ lines (post-audit architecture decomposition invariant). All 10 RTL dashboard tests must remain green. | Line count assertion + `npm test` in 3A | PASS | Gate 8: `DashboardSummary.test.js` 6/6 passed (current suite count; historical "10" note preserved). `frontend/src/pages/DashboardSummary.js` = 96 lines. |
| **I9** | Production build passes with zero errors and no new warnings. | CI (authoritative); local proxy via `npm start` + ESLint/stylelint (§15) | PASS (local) | Gate 12: `npm run build` compiled successfully with CI=true, GENERATE_SOURCEMAP=false, NODE_OPTIONS=--max-old-space-size=4096. |
| **I10** | `npm test -- --watchAll=false` passes for touched modules **and** the app route suite. | CI (frontend test job added in 1C); local proxy: touched suites via `npx jest --runInBand` (§15) | PASS | Gate 7: 38/38 passed. Gate 8: App.test 9/9 + DashboardSummary 6/6 passed. |
| **I11** | No new `!important`; a file's count in the 1C lint ratchet may only fall. | stylelint + `lint-ratchet.js` (§9.2) | PASS | Gate 5: 0 regressions against 5298b11; stylelint clean for `MutualFunds.css` and `theme-components.css`; no `!important` added. |
| **I12** | No new dependency except the Phase 1C tooling list (§9.2). | `package.json` review | PASS (local) | No `package.json`/lockfile changes in 7C work. |
| **I13** | Every non-allowlisted route is pixel-identical to its 1B baseline. | Walkthrough-evidenced per §7.1: developer-run Playwright diff report attached to each phase walkthrough, with zero unexplained diffs. | PASS | Gate 14: 68/71 with only the 3 accepted W-6A-1/AD16 diffs. Gate 15: 326/326 passed. Gate 18: 111/111 passed. Shared `Trades.css`/`SummaryRow.css` unchanged by 7C (only the targeted b9ecafe `margin-top: 0` fix in `Trades.css`). |
| **I14** | No `backdrop-filter`, gradient, gradient text, glow, `filter: blur()` / `drop-shadow()`, `text-shadow`, `mask`, `-webkit-mask`, `-webkit-mask-image`, `mask-image`, `border-image`, or `border-image-source` anywhere in app CSS or JS; only the reference frames illustrate them. | stylelint (§9.2) | PASS | Gate 5 stylelint passed on touched CSS; no banned visual slop added in 7C files. |
| **I15** | Neutral by default: a tone encodes **deviation from expectation or attention**, never the sign of an ordinary amount. Expense amounts, income, and balances are neutral (§4.3). A page never references a tone token directly; it uses `Delta`, `Badge`, or a `.fs-progress--*` modifier. | stylelint + `lint-tones.js` + §4.3 domain table + §7.2 | PASS | Gate 4: 0 tone scoping violations, 0 undefined tokens. Buy/Sell/Coupon and Price Unavailable neutral; P&L uses `<Delta>` sign+Gain/Loss. |
| **I16** | No radius above 8 px except `var(--fs-radius-pill)` on status chips and avatars. | stylelint (§9.2) | PASS | Gate 5 stylelint passed; 7C CSS uses radius tokens/pill only for icon/chip-like elements. |

---

## 3. Visual Regression Diff Report (§7.1)

Per §7.1 of the Action Plan, visual regression testing is walkthrough-evidenced. Gates 13–15, 17, and 18 were executed/confirmed with the results recorded below.

### Diff Summary (executed):
- **(a) Total routes compared**: Gate 15 full visual run — **326/326 passed** (1 setup + 325 visual). Final 7 lending-detail snapshots rerun after full-run timeout and passed. Gate 14 PR-subset — **68 passed, 3 failed** (71 total), matching known W-6A-1/AD16.
- **(b) Routes with zero diff**: All 325 visual snapshots pass; 20 MF snapshots are the intended Gate 13 recaptures; 3 trade-summary mobile snapshots recaptured for pre-existing b9ecafe staleness (see §6).
- **(c) Routes with accepted diffs**: Gate 14's only failures are the 3 known W-6A-1/AD16 diffs: `salary-profile-update @ 1440`, `analysis-payroll @ 1440`, `salary-rules @ 1440`. No unexpected 7C diffs.
  - `/mutual-funds`: Recaptured by Gate 13 (`df94041`).
  - `/mutual-funds/new`: Recaptured by Gate 13 (`df94041`).
  - `/mutual-funds/edit/1`: Recaptured by Gate 13 (`df94041`).
  - `/mutual-funds/summary`: Recaptured by Gate 13 (`df94041`).
  - `/trade-summary` @ 768/480/390: Recaptured as `fb5e3bf` to reconcile pre-existing b9ecafe staleness; 1440/1024 already matched after margin-top fix. Not 7C-caused.
- **(d) Routes with unexplained diffs**: **None**.

### Manifest Integrity:
- **Starting baseline commit**: `cfaadb5` (`D:\Projects\FinStat-visual-baselines`, 334/334 manifest verified per plan/review context).
- **Gate 13 baseline commit SHA**: `df94041` (`D:\Projects\FinStat-visual-baselines`, "Phase 7C: recapture 20 mutual-funds baselines").
- **Additional baseline commit SHA**: `fb5e3bf` (`D:\Projects\FinStat-visual-baselines`, "fix(baselines): recapture 3 trade-summary mobile baselines for b9ecafe staleness (334/334 manifest)").
- **Manifest verification command**: `node frontend/scripts/verify-baseline-manifest.js` — passed (`334/334 baselines verified successfully`) after Gate 13 and after `fb5e3bf`.

---

## 4. Automated Gate Verification Results

### 4.1 Design Tokens Integrity (`tokens.js --check`)
```powershell
node frontend/scripts/tokens.js --check --tables
```
```
✓ All §4.9 contrast tables (including §4.9.3) match tokens.json exactly! (0 drift)
```

### 4.2 Tone & Accent Scoping (`lint-tones.js`)
```powershell
node frontend/scripts/lint-tones.js
```
```
✓ [lint-tones] Scanned 58 page CSS files for tone scoping: 0 violations.
✓ [lint-tones] Scanned 61 total CSS files against tokens.json: 0 undefined tokens.
```

### 4.3 Stylelint Ratchet & Radius Ceiling (`lint-ratchet.js`)
```powershell
node scripts/lint-ratchet.js
npx stylelint src/pages/mutual-funds/MutualFunds.css src/styles/theme-components.css
Get-ChildItem -Recurse -Path src/pages/mutual-funds -Filter *.css | Select-String -Pattern 'overflow-x'
```
```
[lint-ratchet] Evaluating stylelint ratchet against merge-base: 5298b11b1133dcc7c80cd62ed26f87e477519275
✓ [lint-ratchet] Checked 60 CSS files against 5298b11b1133dcc7c80cd62ed26f87e477519275: 0 regressions.

(stylelint) no output / exit 0

src\pages\mutual-funds\MutualFunds.css:187:  overflow-x: auto;
```

### 4.4 Test ID & Accessible Label Guard (`testid-guard.js`)
```powershell
node frontend/scripts/testid-guard.js
```
```
[testid-guard] Checking data-testid & aria-label preservation against merge-base: 5298b11b1133dcc7c80cd62ed26f87e477519275
✓ [testid-guard] Checked diff against 5298b11b1133dcc7c80cd62ed26f87e477519275: all data-testid and aria-label attributes preserved.
```

### 4.5 Route Allowlist Assertion (`ui-coverage.js --assert-allowlist`)
```powershell
node frontend/scripts/ui-coverage.js --assert-allowlist
```
```
[ui-coverage] Asserting allowlist against 75 defined routes in App.js...
✓ [ui-coverage] Allowlist assertion passed. 33 pattern(s) verified against App.js routes.
```

### 4.6 ESLint Hygiene on Touched Files
```powershell
npx eslint src/pages/mutual-funds/AddMutualFundPage.js src/pages/mutual-funds/EditMutualFundPage.js src/pages/mutual-funds/MutualFundForm.js src/pages/mutual-funds/MutualFundLogPage.js src/pages/mutual-funds/MutualFundSummaryPage.js src/components/ProtectedRoute.js src/pages/mutual-funds/__tests__/MutualFundForm.test.js src/pages/mutual-funds/__tests__/MutualFundLogPage.test.js src/pages/mutual-funds/__tests__/MutualFundSummaryPage.test.js tests/visual/fixtures/mutualFundsMocks.js tests/visual/mutual-funds-reference-match.spec.js tests/visual/visual.spec.js tests/visual/a11y.spec.js playwright.config.js --max-warnings=0
```
```
(no ESLint errors/warnings; exit 0; browserslist staleness notice only)
```

### 4.7 `.eslintignore` Post-Conversion Grep
```powershell
git grep -in "MutualFund" frontend/.eslintignore
```
```
(no matches; exit 1)
```

### 4.8 Jest Test Suites (In-Band)
```powershell
$env:CI='true'; npm test -- src/pages/mutual-funds/__tests__/MutualFundLogPage.test.js src/pages/mutual-funds/__tests__/MutualFundForm.test.js src/pages/mutual-funds/__tests__/MutualFundSummaryPage.test.js --watchAll=false --runInBand --verbose
```
```
PASS src/pages/mutual-funds/__tests__/MutualFundForm.test.js
PASS src/pages/mutual-funds/__tests__/MutualFundSummaryPage.test.js
PASS src/pages/mutual-funds/__tests__/MutualFundLogPage.test.js

Test Suites: 3 passed, 3 total
Tests:       38 passed, 38 total
Snapshots:   0 total
Time:        20.725 s
```

Observed non-blocking warnings: React `act(...)` console.error warnings emitted from `MutualFundForm` debounce lookup during tests; tests remained green.

### 4.9 Calculation Characterization Fixtures (Invariant I3)
```powershell
npx jest --runInBand tests/calculations.spec.js --forceExit
```
```
PASS tests/calculations.spec.js
Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
Snapshots:   0 total
```

### 4.10 Production Bundle Build (Invariant I9)
```powershell
$env:CI='true'; $env:GENERATE_SOURCEMAP='false'; $env:NODE_OPTIONS='--max-old-space-size=4096'; npm run build
```
```
Creating an optimized production build...
Compiled successfully.
```

### 4.11 Additional Gate 8 Evidence
```powershell
$env:CI='true'; npm test -- src/App.test.js src/pages/dashboard/__tests__/DashboardSummary.test.js --watchAll=false --runInBand
(Get-Content src/pages/DashboardSummary.js).Count
```
```
Test Suites: 2 passed, 2 total
Tests:       15 passed, 15 total  (9 App.test.js + 6 DashboardSummary.test.js)

DashboardSummary.js line count: 96
```

### 4.12 Gate 10 — Real-Browser Axe (Playwright a11y)
```powershell
cd frontend; $env:CI='true'; npx playwright test tests/visual/a11y.spec.js --project=a11y -g "mutual-funds"
```
```
5 passed (32.2s)
  - 1 setup + 4 MF routes: mutual-funds, mutual-funds-new, mutual-funds-edit, mutual-funds-summary
  - 0 critical/serious wcag2a/wcag2aa violations
```

### 4.13 Gate 11 — Reference Match Spec
```powershell
cd frontend; $env:CI='true'; npx playwright test --project=reference tests/visual/mutual-funds-reference-match.spec.js
```
```
9 passed (42.3s)
  - 1 setup + 8 spec tests (Frame 01/02/03, filter/accent, badges, Delta, validation/read-only, D19, W-7C-1 overflow, touch/focus)
```

### 4.14 Gate 13 — Baseline Recapture + Manifest
```powershell
cd frontend
$env:CI='true'
npx playwright test --project=visual tests/visual/visual.spec.js --grep="mutual-funds" --update-snapshots
node scripts/verify-baseline-manifest.js --generate
node scripts/verify-baseline-manifest.js
git -C 'D:\Projects\FinStat-visual-baselines' add -A
git -C 'D:\Projects\FinStat-visual-baselines' commit -m "Phase 7C: recapture 20 mutual-funds baselines"
git -C 'D:\Projects\FinStat-visual-baselines' rev-parse --short HEAD
```
```
21 passed (1.6m)  (1 setup + 20 snapshots: 4 routes × 5 viewports)
Manifest generated for 334 baselines
334/334 baselines verified successfully.
Baseline commit: df94041
```

### 4.15 Gate 16 — Touch Targets & Focus Rings
```powershell
cd frontend; $env:CI='true'; npx playwright test --project=reference tests/visual/mutual-funds-reference-match.spec.js -g "interactive touch targets"
```
```
2 passed (22.5s)  (1 setup + 1 filtered test)
```

### 4.16 Gate 18 — Unthemed Consumer Preservation
```powershell
cd frontend; $env:CI='true'; npx playwright test --project=visual tests/visual/visual.spec.js --grep="corporate-actions|mutual-funds|gold-wallet|certificates|currency|credit-cards"
```
```
111 passed (5.2m)  (1 setup + 22 routes × 5 viewports)
Noisy CORS console errors observed from mocked/unmocked backend fetch attempts; test assertions passed.
```

### 4.17 Gate 14 — PR-Subset Visual Regression (W-6A-1)
Initial run (before trade-summary reconciliation):
```powershell
cd frontend; $env:CI='true'; $env:PR_SUBSET='true'; npx playwright test --project=pr-subset tests/visual/visual.spec.js
```
```
67 passed, 4 failed (71 total)
Failures:
  - salary-profile-update @ 1440px  (expected/known AD16 area - W-6A-1)
  - analysis-payroll @ 1440px        (expected/known AD16 area - W-6A-1)
  - salary-rules @ 1440px            (expected/known AD16 area - W-6A-1)
  - trade-summary @ 1440px           (unexpected; investigated — see §6)
```

Rerun (after §6 reconciliation):
```
68 passed, 3 failed (71 total)
Failures:
  - salary-profile-update @ 1440px  (known W-6A-1/AD16)
  - analysis-payroll @ 1440px        (known W-6A-1/AD16)
  - salary-rules @ 1440px            (known W-6A-1/AD16)
```

### 4.18 Gate 15 — Full 326 Visual Reconciliation
```powershell
cd frontend; $env:CI='true'; npx playwright test --project=visual tests/visual/visual.spec.js
```
```
326/326 passed (1 setup + 325 visual)
- Full run completed up to 319 passing tests before terminal output timeout; remaining 7 lending-detail snapshots rerun separately: 11 passed (1 setup + 10 lending-detail snapshots).
- No unexplained diffs. 20 MF snapshots match Gate 13 recaptures. 3 trade-summary mobile snapshots recaptured as pre-existing b9ecafe staleness (fb5e3bf).
```

---

## 5. Gate Execution Status (Gate 19 merge/push in progress)

> **Gate 17 confirmed:** The user reviewed the 20 MF snapshots and explicitly signed off Phase 7C on 2026-11-26. All gates 1–18 pass; the accepted W-6A-1/AD16 3-diff set is confined to the Gate 14 PR subset, while the Gate 15 full suite is 326/326 green. Only the merge/push boundary of Gate 19 remains.

| Gate | Status | Reason / Next Action |
|---|---|---|
| Gate 10 Real-browser axe (Playwright a11y, 4 MF routes) | PASS | `npx playwright test tests/visual/a11y.spec.js --project=a11y -g "mutual-funds"` → **5 passed** (1 setup + 4 MF routes), 0 critical/serious violations. |
| Gate 11 Reference match spec | PASS | `npx playwright test --project=reference tests/visual/mutual-funds-reference-match.spec.js` → **9 passed** (1 setup + 8 spec tests). |
| Gate 13 Baseline recapture + manifest | PASS | `--grep="mutual-funds" --update-snapshots` → **21 passed** (1 setup + 20 snapshots). `verify-baseline-manifest.js --generate` + verify → **334/334 verified**. Baseline repo committed: `df94041` ("Phase 7C: recapture 20 mutual-funds baselines"). Starting baseline remains `cfaadb5`. |
| Gate 14 PR-subset visual regression | PASS | `PR_SUBSET=true ... --project=pr-subset` → **68 passed, 3 failed** (71 total). The 3 failures are the known W-6A-1/AD16 diffs: `salary-profile-update @ 1440`, `analysis-payroll @ 1440`, `salary-rules @ 1440`. The previously unexpected `trade-summary @ 1440` failure was resolved (see §6.1). |
| Gate 15 Full 326 visual reconciliation | PASS | Full `--project=visual tests/visual/visual.spec.js` run completed: **326/326 passed** (1 setup + 325 visual). The long run timed out before printing the final summary line, but all 319 completed tests were passing and the remaining 7 lending-detail snapshots were rerun and passed (`11 passed`). No unexplained diffs; 20 MF snapshots match Gate 13 recaptures. |
| Gate 16 Touch targets & focus rings | PASS | `... -g "interactive touch targets"` → **2 passed** (1 setup + 1 filtered test). |
| Gate 17 Reference frame conformance inspection | PASS (user-confirmed) | Automated sanity: 20 MF baselines present, 334/334 manifest verified, Gate 11 reference-match passed, Gate 10 axe passed. User visually confirmed the 20 recaptured snapshots across 1440/1024/768/480/390 against the §6.2 checklist on 2026-11-26. |
| Gate 18 Unthemed consumer preservation | PASS | Legacy consumer subset grep command → **111/111 passed** (1 setup + 22 routes × 5 viewports). Noisy CORS console errors observed in output, but tests passed. |
| Gate 19 Walkthrough sign-off/merge/push boundary | IN PROGRESS | User sign-off received 2026-11-26; governance sync complete. Merge to `main` and push `main` only remain; feature branch never pushed. |

---

## 6. Implementation Notes / Evidence

- **Inline-style census (corrected)**: 30 total purged — 18 `MutualFundForm.js`, 7 `MutualFundLogPage.js`, 5 `MutualFundSummaryPage.js`. UI-UX-PLAN stale “15” must be corrected during post-sign-off governance sync.
- **W-7C-1**: `.mf-table-wrap { overflow-x: auto; }` is the only `overflow-x` in `frontend/src/pages/mutual-funds/MutualFunds.css` (Gate 5 scoped check). Page-level overflow remains prohibited by D19 tests/spec.
- **Shared CSS**: `SummaryRow.css` was not edited; MF pages decoupled by removing Trades.css/SummaryRow.css imports and using `MutualFunds.css`. `frontend/src/pages/trades/Trades.css` received a targeted b9ecafe-oversight fix (`margin-top: 0` on `.section-title-row .section-title`) during Gate 14 reconciliation; no 7C MF styling added to shared trade CSS.
- **Deterministic mocks**: `frontend/tests/visual/fixtures/mutualFundsMocks.js` intercepts paginated/all/summary/code/batch-prices/last-price/id and POST/PUT/DELETE; wired in `visual.spec.js` and `a11y.spec.js`.
- **Reference spec**: `frontend/tests/visual/mutual-funds-reference-match.spec.js` registered in `playwright.config.js`; 8 spec tests cover Frame 01/02/03, filter accent/ink, neutral badges, Delta sign+Gain/Loss, validation/read-only, D19 390/480/768, W-7C-1 overflow, and touch/focus.


## 6.1 Trade-Summary Reconciliation (Gate 14 blocker resolution)

**Observed:** Gate 14 initially failed with `trade-summary @ 1440` (unexpected) plus the 3 known W-6A-1/AD16 failures. Isolated visual run showed all 5 trade-summary viewports failing with 24–32px height increase vs pre-7C baseline.

**Root cause:** Pre-existing b9ecafe staleness, not 7C. Commit `b9ecafe` added `.section-title-row` wrapping for Open Positions and CSS in `frontend/src/pages/trades/Trades.css`, but did not recapture trade-summary baselines. The override `.section-title-row .section-title { margin-bottom: 0; }` did not zero `margin-top`, so the general `.trade-summary-page .section-title { margin-top: 1.5rem; }` applied (+24px at all viewports). Mobile 768/480/390 had additional 8px b9ecafe staleness.

**Fix:** Added `margin-top: 0;` to `html[data-fs-theme] .trade-summary-page .section-title-row .section-title` in `frontend/src/pages/trades/Trades.css` (targeted b9ecafe oversight fix). Rebuilt frontend and reran trade-summary visuals. 1440/1024 passed after fix; 768/480/390 recaptured as pre-existing b9ecafe mobile staleness.

**Baseline:** Recaptured 3 trade-summary mobile baselines (768/480/390), regenerated manifest, committed baseline repo `fb5e3bf` ("fix(baselines): recapture 3 trade-summary mobile baselines for b9ecafe staleness (334/334 manifest)"). 1440/1024 unchanged.

**Result:** Gate 14 rerun = **68 passed, 3 failed** (known W-6A-1/AD16 only). Gate 15 = **326/326 passed**. No unexplained diffs remain.

## 6.2 Gate 17 — User Visual Inspection Checklist

The 20 recaptured snapshots are in `D:\Projects\FinStat-visual-baselines\`:

- Log: `mutual-funds-{1440,1024,768,480,390}.png`
- Form (new): `mutual-funds-new-{1440,1024,768,480,390}.png`
- Form (edit): `mutual-funds-edit-{1440,1024,768,480,390}.png`
- Summary: `mutual-funds-summary-{1440,1024,768,480,390}.png`

Confirm for each route:

1. Dark graphite surfaces, neutral chips/badges, teal only on interactive controls, `--fs-ink` text on accent, and no gradients/blurs/glows.
2. Log and summary tables match Reference Frame 01 Variant B; form matches Reference Frame 02 Variant B (stacked field cards, inline errors, one primary CTA plus neutral Cancel); summary KPI grid matches Reference Frame 03 Variant B.
3. Figures use proportional tabular numerals; fund codes use mono; P&L shows explicit sign + `Gain`/`Loss`, never colour alone; `Price Unavailable` is a neutral badge.
4. At 768/480/390px, tables are replaced by compact-expand cards with reachable fields and no page-level horizontal overflow.
5. Loading, empty, error, and fetch-failure states are evidenced by Gate 7 Jest suites per plan; inline validation and disabled/read-only states are evidenced by Gate 11.

Direct image inspection was unavailable in the agent environment; the user confirmed the checklist above on 2026-11-26, satisfying Gate 17.

## 7. Post-Sign-Off Governance Sync Checklist (completed 2026-11-26)

- [x] Update `docs/UI-UX_Plan/UI-UX-PLAN.md` §6.1, §5.6, §6.11 checklist, §6.11 Phase 7 exit gate, §7.1 W-7C-1 text sync, §10 row, and any remaining allowlist/governance fields.
- [x] Correct stale MF inline-style count (15 -> 18 form; full census 18/7/5=30) in §5.6 line 912 and §6.11 line 1819. `UI-UX-PLAN.md:2218` already records `MutualFundForm.js | 18 | 7C`; kept consistent without double-editing.
- [x] Reconcile UI-UX-PLAN allowlist drift: §5.6, §6.1 board, and §6.11 7C checkboxes now checked consistently with the cumulative `7C | 4 | 33` entry at `:994` and the THEMED_PATTERNS example at `:1204-1205`.
- [x] Add W-7C-1 to §7.1 overflow exceptions and the overflow-grep exception text (`UI-UX-PLAN.md:2022`, `:2102`) for `.mf-table-wrap` alongside existing documented exceptions.
- [x] Add `CHANGELOG.md` Phase 7C entry.
- [x] Confirm `AGENTS.md` baseline count is 334 (corrected during review fix pass; no stale 325 reference remains).
- [x] Record Gate 13 emitted baseline commit short SHA `df94041` (starting `cfaadb5`), implementation SHA `e1e1822`, doc SHA, and merge SHA in §10 and this walkthrough (doc/merge SHAs finalized in the sign-off commits).
- [ ] Merge `phase-ui-7c-mutual-funds` into `main` and push only `main` (in progress).

## 8. Sign-Off

- **User review**: Completed 2026-11-26 (20 MF baselines reviewed against §6.2 checklist)
- **Explicit sign-off**: Granted 2026-11-26 ("Confirmed — sign off & finish")
- **Merge/push**: In progress — feature branch local only; never pushed
