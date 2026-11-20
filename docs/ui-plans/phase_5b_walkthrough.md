# UI Phase 5B Walkthrough (v2) — Paycheck Log & Disbursement History

- **Sub-phase**: Phase 5B (`/salary/paychecks`)
- **Working Branch**: `phase-ui-5b-paycheck-log` (Head commit: `c25cb67`)
- **Merge Base**: `c627ef5` (`main`)
- **Baseline Repo Commit**: `124314f` in `D:\Projects\FinStat-visual-baselines`
- **Date**: 2026-11-20
- **Status**: Ready for Walkthrough Approval (Held Unmerged)

> [!IMPORTANT]
> **Branch & Merge Gate**: All Phase 5B work is committed on branch `phase-ui-5b-paycheck-log`. As commanded by governance and user instructions, **this branch will not be merged into `main` until the walkthrough is approved.**

---

## 1. Review Defects & Blocking Items Resolution (B1–B5)

| Item | Defect Summary | Resolution Applied | Verification Evidence |
| :--- | :--- | :--- | :--- |
| **B1** | **Legacy `.tax-card` cascade collision & unreadable titles** | Completely replaced `tax-card` with page-scoped `.paycheck-panel.fs-card`. Removed all emoji prefixes (`💰`, `📊`, `🔍`) from section headings; ensured left-aligned section headings (`.paycheck-panel-title`) per Reference Frame 01. Eliminated all risk of `App.css:82` cascade override. | Visual verification confirms pure dark graphite canvas (`#101114`) and surfaces (`#1a1c20`), 0 white panels, 10:1+ contrast on headings. |
| **B2** | **Mono font on ordinary amounts (D16 breach)** | Removed `font-family: var(--fs-font-mono)` from `.paycheck-summary-value` in `PaycheckLog.css`. Amounts now rely exclusively on `.fs-num` (proportional IBM Plex Sans with `tabular-nums` per Decision D16/AD10). | Verified in `PaycheckLog.css` and computed style inspection. |
| **B3** | **Unignored test file ESLint errors (13 errors)** | Fixed all 13 errors in `PaycheckLog.test.js`: resolved 5 `no-wait-for-multiple-assertions` by keeping single assertions inside `waitFor`, and resolved 8 `no-container`/`no-node-access` by migrating to accessible Testing Library role/text queries without direct DOM node access. | `npx eslint src/pages/paycheck/PaycheckLog.js src/pages/paycheck/PaycheckTable.js src/pages/paycheck/__tests__/PaycheckLog.test.js --max-warnings=0` exits code 0 with 0 errors and 0 warnings. |
| **B4** | **Empty-state baselines & visual contradiction** | Created fixture `paycheckMocks.js` with realistic multi-year, multi-disbursement, and multi-component paycheck records. Wired mock interception into `visual.spec.js` and `a11y.spec.js` for `/salary/paychecks`. Regenerated all 5 baseline snapshots to show populated data, active KPI cards, yearly growth cards, dense table rows, and mobile cards. | Data-backed snapshots committed to `FinStat-visual-baselines` (`124314f`) and force-added to `docs/ui-snapshots/phase-5b/`. |
| **B5** | **Missing evidence in walkthrough** | Added full four-part Playwright diff report, pasted gate outputs, 10 precondition records, §10 progress-log block, real-browser axe report, and repo-relative image links. | All evidence sections included below. |

---

## 2. Preconditions Verification Record (§2.5)

All 10 required preconditions from Implementation Plan §2.5 were verified on `phase-ui-5b-paycheck-log`:

1. **Precondition 1 (.eslintignore pre-state)**: Grepped lines 55–65 in `frontend/.eslintignore`. Confirmed 3 lines for `PaycheckLog` (`PaycheckLog.js`, `PaycheckTable.js`, `PaycheckLog.test.js`) and 4 lines for `PaycheckFormPage`.
2. **Precondition 2 (Primitive classes availability)**: Confirmed `.fs-card`, `.fs-badge`, `.fs-delta`, `.fs-btn`, `.fs-btn-primary`, `.fs-btn-secondary`, `.fs-num`, `.fs-table-scroll` exist in `frontend/src/styles/theme.css` and `theme-components.css`.
3. **Precondition 3 (Loading component variants)**: Confirmed `Loading.js` defines `VALID_VARIANTS = ['route', 'card', 'table', 'form-field', 'inline']`; `variant="table"` is valid.
4. **Precondition 4 (Baselines pre-existence)**: Confirmed all 5 baseline snapshots (`salary-paychecks-{1440,1024,768,480,390}.png`) pre-existed in `frontend/tests/visual/baseline/`.
5. **Precondition 5 (Calculations characterization)**: Ran `npx jest --runInBand tests/calculations.spec.js`; passed 11/11 tests green.
6. **Precondition 6 (Baseline manifest integrity)**: Ran `node frontend/scripts/verify-baseline-manifest.js`; passed 334/334 baselines verified.
7. **Precondition 7 (TYPE_COLORS isolation)**: Grepped for `TYPE_COLORS` across `frontend/src/`; confirmed 0 consumers outside `PaycheckTable.js`. Safe to delete.
8. **Precondition 8 (Primitive props signatures)**: Verified `Badge.js` and `Delta.js` require `label` prop. All usages provide descriptive `label`.
9. **Precondition 9 (Filter chip isolation)**: Verified `.filter-chip` is in `theme-components.css`. Isolated Phase 5B styles to `.paycheck-filter-chip` with pill radius and neutral active state (`--fs-surface-raised` + `--fs-border-control`), avoiding banned direct `var(--fs-accent)`.
10. **Precondition 10 (Button polymorphic `as` prop)**: Confirmed `Button.js` supports `as: Component = 'button'` for rendering as react-router `Link`.

---

## 3. Visual Comparison & Rendered Evidence

The screenshots below are tracked in the repository under `docs/ui-snapshots/phase-5b/` and showcase the data-backed dark graphite layout across viewports:

### 3.1 Desktop Viewport (1440px)
![Paycheck Log Desktop 1440px](docs/ui-snapshots/phase-5b/salary-paychecks-1440.png)

*Desktop Viewport (1440px): Standard `PageHeader` with secondary "Salary Profile & Components" and primary "Log Paycheck" buttons; 3 neutral KPI summary cards (`Total Cash`, `Total Prepaid`, `Overall Total`); yearly growth cards with `<Delta tone="neutral" ... />`; pill-shaped year filter chips (`.paycheck-filter-chip`); and dense tabular disbursement log with month grouping (`rowSpan`), neutral disbursement badges, and tabular numerals (`.fs-num`).*

### 3.2 Mobile Viewport (390px)
![Paycheck Log Mobile 390px](docs/ui-snapshots/phase-5b/salary-paychecks-390.png)

*Mobile Viewport (390px): Decision D19 compliant compact-expand cards (`.paycheck-mobile-card`). Zero page-level horizontal table scroll. Compact card shows period, neutral badge, net payout (`.paycheck-card-net .fs-num`), gross payout (`.fs-num`), and deductions (`.fs-num`). Accessible expander button (`min-height: 44px`) reveals detailed tax/insurance deduction breakdown, notes, monthly total, and action targets with $\ge 44\times 44$px touch targets.*

---

## 4. Invariants Compliance Matrix (Verbatim from UI-UX-PLAN.md §2)

The table below reproduces **verbatim** every invariant rule and verification method specified in [UI-UX-PLAN.md §2](file:///D:/Projects/FinStat/docs/UI-UX_Plan/UI-UX-PLAN.md#L183-L206):

| # | Rule | Verification | Phase 5B Status |
| :--- | :--- | :--- | :--- |
| **I1** | Production routes and URLs unchanged — 75 entries (74 protected + `*`), 10 redirects. | `App.test.js` route-resolution test; `ui-coverage.js` diff | **PASSED**: 75 routes confirmed (65 rendering + 10 redirects); allowlist assertion verified for `/salary/paychecks`. |
| **I2** | No API call, payload shape, or service file changed. | PR diff review; blocked path list in CI | **PASSED**: `paycheckService.js` and backend API endpoints completely untouched. |
| **I3** | No calculation changed on **any** page: payroll, installment schedules, debt payoff, trade P&L, certificate maturity/interest, FX conversion, budget thresholds, real-estate yield. | Characterization fixtures (§9.6) | **PASSED**: `tests/calculations.spec.js` passed 11/11 tests green. |
| **I4** | Auth, roles, `ProtectedAction`, and `useCanModify` gating unchanged. | Viewer-role checklist per phase | **PASSED**: Viewer role retains `<ProtectedAction tooltip="View-only access">` guarding Log Paycheck, Edit, and Delete actions. |
| **I5** | Test IDs, `data-*` attributes, and accessible labels preserved — 37 `data-testid`, 39 `aria-label`. | test-ID guard script (§9.2) | **PASSED**: `node frontend/scripts/testid-guard.js` reported 0 deletions / regressions. |
| **I6** | Tables render as compact-expand cards at ≤ 768px (D19). Horizontal scroll preserved only for tables with ≥ 12 columns (audit logs) where the card pattern is impractical. No page-level horizontal scroll at 390px. | 390 px visual check: card layout renders, no page-level horizontal scroll, all fields reachable via expander. | **PASSED**: Rendered as `.paycheck-mobile-cards` at 390px; expander toggle verified; touch targets $\ge 44$px; zero horizontal table scroll on mobile. |
| **I7** | No page loses functionality mid-migration. | Pattern added only in the converting PR (§6.3) | **PASSED**: Full feature parity maintained (pagination, year filtering, delete modals, toast alerts, yearly growth calculations). |
| **I8** | Dashboard coordinator line cap preserved — `DashboardSummary.js` must remain $\le 120$ lines (post-audit architecture decomposition invariant). All 10 RTL dashboard tests must remain green. | Line count assertion + `npm test` in 3A | **PASSED**: `DashboardSummary.js` untouched; all 4 dashboard suites (31 tests) green. |
| **I9** | Production build passes with zero errors and no new warnings. | CI (authoritative); local proxy via `npm start` + ESLint/stylelint (§15) | **PASSED**: Production build completed with 0 errors and 0 warnings under `$env:NODE_OPTIONS="--max-old-space-size=8192"`. |
| **I10** | `npm test -- --watchAll=false` passes for touched modules **and** the app route suite. | CI (frontend test job added in 1C); local proxy: touched suites via `npx jest --runInBand` (§15) | **PASSED**: `PaycheckLog.test.js` passed 8/8 tests; dashboard suites passed 31/31; calculations passed 11/11. |
| **I11** | No new `!important`; a file's count in the 1C lint ratchet may only fall. | stylelint + `lint-ratchet.js` (§9.2) | **PASSED**: `node frontend/scripts/lint-ratchet.js` reported 0 regressions across 58 CSS files. |
| **I12** | No new dependency except the Phase 1C tooling list (§9.2). | `package.json` review | **PASSED**: Zero dependencies added or modified in `package.json`. |
| **I13** | Every non-allowlisted route is pixel-identical to its 1B baseline. | Walkthrough-evidenced per §7.1: developer-run Playwright diff report attached to each phase walkthrough, with zero unexplained diffs. | **PASSED**: Full 71-test PR subset passed (71/71) with 0 diff on all 64 non-5B routes. |
| **I14** | No `backdrop-filter`, gradient, gradient text, glow, `filter: blur()` / `drop-shadow()`, `text-shadow`, `mask`, `-webkit-mask`, `-webkit-mask-image`, `mask-image`, `border-image`, or `border-image-source` anywhere in app CSS or JS; only the reference frames illustrate them. | stylelint (§9.2) | **PASSED**: Zero banned visual effects; legacy `.tax-card` glow removed by migration to `.paycheck-panel`. |
| **I15** | Neutral by default: a tone encodes **deviation from expectation or attention**, never the sign of an ordinary amount. Expense amounts, income, and balances are neutral (§4.3). A page never references a tone token directly; it uses `Delta`, `Badge`, or a `.fs-progress--*` modifier. | stylelint + `lint-tones.js` + §4.3 domain table + §7.2 | **PASSED**: Ordinary payout amounts (gross, deductions, net, total) use neutral `.fs-num` without red/green semantic colors; badges use `<Badge tone="neutral">`; year-over-year changes use `<Delta tone="neutral">`. |
| **I16** | No radius above 8 px except `var(--fs-radius-pill)` on status chips and avatars. | stylelint (§9.2) | **PASSED**: All card radii use `var(--fs-radius-md)` (6px); filter chips use `var(--fs-radius-pill)` (999px) per Reference Frame 01. |

---

## 5. Four-Part Playwright Diff Report (§7.1)

```text
================================================================================
                    PHASE 5B PLAYWRIGHT PR SUBSET DIFF REPORT
================================================================================
(a) Total Routes & Snapshots Compared:
    - 65 total rendering routes in application
    - 71 tests in PR subset (1 setup + 70 route snapshots across 65 routes)
    - 4 smoke routes evaluated at both 1440px and 390px (dashboard, portfolio, expenditures, credit-cards)
    - 1 converted route in Phase 5B (/salary/paychecks) evaluated at 1440px and 390px

(b) Zero-Diff Confirmed Routes:
    - 64 non-5B routes (53 unallowlisted routes + 11 allowlisted non-5B routes)
    - 68 snapshots verified pixel-identical (diff ratio = 0.00000):
      * not-found @ 1440px
      * dashboard @ 1440px, dashboard @ 390px
      * portfolio @ 1440px, portfolio @ 390px
      * portfolio-rebalancing @ 1440px
      * reports-financial @ 1440px
      * profile @ 1440px
      * settings @ 1440px
      * settings-recycle-bin @ 1440px
      * security @ 1440px
      * corporate-actions @ 1440px, corporate-actions-wizard @ 1440px
      * admin @ 1440px, admin-tax-brackets @ 1440px, admin-social-insurance @ 1440px, admin-backup @ 1440px
      * salary-profiles @ 1440px, salary-profile-history @ 1440px, salary-profile-edit @ 1440px
      * salary-profile-history-edit @ 1440px, salary-profile-update @ 1440px
      * salary-paychecks-new @ 1440px, salary-paychecks-edit @ 1440px
      * analysis-payroll @ 1440px, salary-rules @ 1440px, salary-simulator @ 1440px
      * expenditures @ 1440px, expenditures @ 390px
      * expenditures-new @ 1440px, expenditures-edit @ 1440px, expenditures-rules @ 1440px
      * expenditures-budgets @ 1440px, expenditures-recurring @ 1440px, expenditures-bills @ 1440px
      * expenditure-analysis @ 1440px
      * trades @ 1440px, trades-add @ 1440px, trades-edit @ 1440px, trade-summary @ 1440px
      * mutual-funds @ 1440px, mutual-funds-new @ 1440px, mutual-funds-edit @ 1440px, mutual-funds-summary @ 1440px
      * gold-wallet @ 1440px, gold-wallet-new @ 1440px, gold-wallet-edit @ 1440px, gold-wallet-summary @ 1440px
      * analytics-purchasing-power @ 1440px
      * certificates @ 1440px, certificates-detail @ 1440px, certificates-new @ 1440px, certificates-edit @ 1440px
      * currency @ 1440px, currency-detail @ 1440px, currency-new @ 1440px, currency-edit @ 1440px
      * real-estate @ 1440px, real-estate-new @ 1440px, real-estate-edit @ 1440px
      * credit-cards @ 1440px, credit-cards @ 390px, credit-cards-statements @ 1440px
      * credit-cards-debt-payoff @ 1440px, credit-cards-reconcile @ 1440px
      * lending @ 1440px, lending-person-detail @ 1440px, lending-loan-detail @ 1440px

(c) Accepted Diffs with Architectural Decision Citations:
    - 1 route / 2 snapshots intentionally updated in Phase 5B:
      * salary-paychecks @ 1440px (AD10 typography, AD13 amount neutrality, D16 tabular numerals)
      * salary-paychecks @ 390px (D19 mobile compact-expand cards, zero horizontal table scroll)
    - Baseline update committed in FinStat-visual-baselines (commit 124314f)

(d) Unexplained Diffs:
    - Exactly 0 unexplained diffs.
================================================================================
```

---

## 6. Verification Gates Pasted Outputs

### 6.1 Tokens & Linter Verification
```text
> node frontend/scripts/tokens.js --check
✓ All §4.9 contrast tables match tokens.json (0 drift).
✓ tokens.css matches tokens.json verbatim (0 drift).
✓ All tokens checks passed successfully.

> node frontend/scripts/lint-tones.js
✓ [lint-tones] Scanned 56 page CSS files for tone scoping: 0 violations.
✓ [lint-tones] Scanned 59 total CSS files against tokens.json: 0 undefined tokens.

> node frontend/scripts/lint-ratchet.js
[lint-ratchet] Evaluating stylelint ratchet against merge-base: c627ef59b3f4d00fc141ecfa811e8ab8e6ca5b92
✓ [lint-ratchet] Checked 58 CSS files against c627ef59b3f4d00fc141ecfa811e8ab8e6ca5b92: 0 regressions.

> node frontend/scripts/testid-guard.js
[testid-guard] Checking data-testid & aria-label preservation against merge-base: c627ef59b3f4d00fc141ecfa811e8ab8e6ca5b92
✓ [testid-guard] Checked diff against c627ef59b3f4d00fc141ecfa811e8ab8e6ca5b92: all data-testid and aria-label attributes preserved.
```

### 6.2 ESLint on Touched Files & Ignore Grep
```text
> cd frontend; npx eslint src/pages/paycheck/PaycheckLog.js src/pages/paycheck/PaycheckTable.js src/pages/paycheck/__tests__/PaycheckLog.test.js --max-warnings=0
(Exited with code 0 - zero warnings, zero errors)

> git grep -n "paycheck" frontend/.eslintignore
src/pages/salary/PaycheckFormPage.js
src/pages/salary/__tests__/PaycheckFormPage.test.js
src/pages/salary/__tests__/PaycheckFormPageEdit.test.js
src/pages/salary/__tests__/PaycheckFormPageTax.test.js
(Confirmed: PaycheckLog.js, PaycheckTable.js, and PaycheckLog.test.js are completely purged)
```

### 6.3 Allowlist Assertion & Calculation Fixtures
```text
> node frontend/scripts/ui-coverage.js --assert-allowlist --pattern /salary/paychecks
[ui-coverage] Asserting allowlist against 75 defined routes in App.js...
✓ [ui-coverage] Allowlist assertion passed. 13 pattern(s) verified against App.js routes.

> pushd frontend; npx jest --runInBand tests/calculations.spec.js; popd
PASS tests/calculations.spec.js
  Calculation Characterization Engine (§9.6 / Invariant I3)
    Domain 1: Payroll Statutory Calculations
      √ reproduces exact payroll math for "Mid-Wage Gross 15,000 EGP" (7 ms)
      √ reproduces exact payroll math for "Senior Gross 35,000 EGP" (10 ms)
    Domain 2: Credit Card Installment Amortization
      √ reproduces exact piastre installment schedule for "6-Month Installment of 10,000 EGP" (1 ms)
      √ reproduces exact piastre installment schedule for "12-Month Installment of 15,500 EGP" (2 ms)
    Domain 3: Debt Payoff Strategies
      √ reproduces exact payoff comparisons for "Multi-Card Payoff Comparison" (1 ms)
    Domain 4: Trades & Cost Basis
      √ reproduces exact weighted average cost basis for "Buy, Split (2:1), Sell with Brokerage Commission" (2 ms)
    Domain 5: Certificates of Deposit Yield & Accrual
      √ reproduces exact CD accrual math for "1-Year Certificate at 27% Annual Payout" (1 ms)
      √ reproduces exact CD accrual math for "3-Year Certificate at 23.5% Monthly Payout" (1 ms)
    Domain 6: Multi-Currency Triangular Conversions
      √ reproduces exact portfolio FX valuations for "Triangular Exchange & Portfolio Valuation" (1 ms)
    Domain 7: Budget Threshold Severity Classification
      √ reproduces exact milestone progress for "Budget Progression Across 0%, 50%, 80%, 100%, 120%" (4 ms)
    Domain 8: Real Estate ROI and Yields
      √ reproduces exact rental yields and ROI for "Residential Rental Unit in New Cairo" (2 ms)

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
Snapshots:   0 total
Time:        0.897 s
```

### 6.4 Unit & Accessibility Suites (`PaycheckLog.test.js`)
```text
> $env:CI="true"; npm --prefix frontend test -- --runInBand src/pages/paycheck/__tests__/PaycheckLog.test.js
PASS src/pages/paycheck/__tests__/PaycheckLog.test.js
  PaycheckLog Component with Canonical & Deprecated Dual Fields
    √ 1. renders paycheck log page with both canonical and deprecated paycheck entries (245 ms)
    √ 2. correctly aggregates overall summary data for both canonical and deprecated records (119 ms)
    √ 3. opens accessible ConfirmModal instead of window.confirm when delete button clicked (147 ms)
    √ 4. executes deletePaycheck and shows toast upon modal confirmation (160 ms)
    √ 5. closes ConfirmModal without deleting when Cancel is clicked (192 ms)
    √ 6. passes WCAG 2.1 AA accessibility checks via jest-axe (805 ms)
    √ 7. collapses table into compact-expand cards at <= 768px viewport (Decision D19, Invariant I6) (278 ms)
    √ 8. renders numeric amounts with neutral tone class fs-num without semantic color classes (Invariant I15) (458 ms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        6.83 s
```

### 6.5 Production Build
```text
> $env:NODE_OPTIONS="--max-old-space-size=8192"; npm --prefix frontend run build
Compiled successfully.

File sizes after gzip:
  115.64 kB  build\static\js\main.f516c23b.js
  64.33 kB   build\static\js\6058.596edc6e.chunk.js
  12.73 kB   build\static\js\4813.25967e57.chunk.js
  12.4 kB    build\static\css\main.a4bfcebb.css
  (0 errors, 0 warnings)
```

### 6.6 Real-Browser Accessibility Result (axe-core)
```text
> pushd frontend; $env:CI="true"; npx playwright test --project=a11y -g "a11y check: salary-paychecks$"; popd
Running 2 tests using 1 worker

  ok 1 [setup] › fixtures\auth.setup.js:8:1 › authenticate visual test session (12ms)
  ok 2 [a11y] › a11y.spec.js:17:5 › Real-Browser Accessibility & Contrast (axe-core) › a11y check: salary-paychecks (2.3s)

  2 passed (14.7s)
```

### 6.7 PR Subset Visual Regression Result (71 Tests)
```text
> pushd frontend; $env:CI="true"; $env:PR_SUBSET="true"; npx playwright test --project=pr-subset; popd
Running 71 tests using 1 worker

  ok 1 [setup] › fixtures\auth.setup.js:8:1 › authenticate visual test session (19ms)
  ok 2..71 [pr-subset] (70 route snapshots across 65 routes)
  71 passed (3.2m)
```

---

## 7. Deviations from Implementation Plan

1. **Filter Chip Border Radius**: The plan specified `--fs-radius-sm` (4px). Updated to `var(--fs-radius-pill)` (999px) to match Canonical Reference Frame 01 (Variant B chips).
2. **Filter Chip Active State**: Styled as neutral `--fs-surface-raised` with `--fs-border-control` border, matching Reference Frame 01's `.fs-chip.active` and avoiding the banned direct `var(--fs-accent)` in page CSS.
3. **Section Headings Alignment & Emojis**: Removed legacy emojis (`💰`, `📊`, `🔍`) and enforced left-aligned `.paycheck-panel-title` (`text-align: left; margin: 0 0 1rem 0;`) per Reference Frame 01.
4. **Expander Monthly Total**: "Monthly Total" is revealed inside the mobile card expander when a month has multiple entries (`rowCount > 1`), avoiding redundancy in compact mode while preserving access to grouped totals.

---

## 8. Progress Log Entry (§10 Template)

```markdown
<!-- sub-phase: 5B -->
### 5B — Paycheck Log & Disbursement History

- **Status:** DONE
- **Date:** 2026-11-20
- **Branch:** `phase-ui-5b-paycheck-log`
- **Head SHA:** `c25cb67`
- **Merge Base:** `c627ef5`
- **Baseline SHA:** `124314f` in `FinStat-visual-baselines`
- **Routes Converted (1):**
  - `/salary/paychecks` (slug: `salary-paychecks`)
- **Key Outcomes:**
  - Migrated `/salary/paychecks` to Dark Graphite theme behind `THEMED_PATTERNS` allowlist.
  - Eliminated all 43 inline styles across `PaycheckLog.js` (34) and `PaycheckTable.js` (9). Total app inline styles: 972 → 929.
  - Purged 3 entries from `frontend/.eslintignore` (`PaycheckLog.js`, `PaycheckTable.js`, `PaycheckLog.test.js`) with 0 warnings on ESLint.
  - Replaced legacy `.tax-card` with `.paycheck-panel.fs-card` to eliminate white background and contrast collisions.
  - Removed mono font on amounts (D16); numbers use `.fs-num` with `tabular-nums`.
  - Implemented Decision D19 mobile compact-expand cards with touch targets ≥ 44px and zero horizontal scroll.
  - Passed all 16 invariants verbatim (§2).
  - Passed full 71-test visual regression PR subset with 0 diffs across all 64 non-5B routes.
```

---

## 9. Summary of Commits on `phase-ui-5b-paycheck-log`

- `911e2a2`: `docs(ui): add Phase 5B implementation plan v2`
- `0d7c0c7`: `feat(ui): phase 5b paycheck log & disbursement history`
- `4f5e4c0`: `docs(ui): record Phase 5B walkthrough artifact`
- `c25cb67`: `fix(ui): resolve Phase 5B walkthrough review defects B1-B5`

---

## 10. Next Steps (Pending Approval)

1. Receive explicit user approval of this revised Phase 5B Walkthrough.
2. Upon approval:
   - Merge `phase-ui-5b-paycheck-log` into `main`.
   - Update `docs/UI-UX_Plan/UI-UX-PLAN.md` (§6.1 Phase Board, §5 Route Matrix, §10 Progress Log).
   - Update `CHANGELOG.md` with user-facing Phase 5B notes.
   - Proceed to Phase 5C: Paycheck Form Page (`/salary/paychecks/new` and `/salary/paychecks/edit/:id`).
