# UI Phase 5A Walkthrough: Payroll Profiles, Rules & Taxes

## Executive Summary

Phase 5A delivers the dark graphite design system migration for the core Payroll management surfaces of FinStat:
1. **/salary/profiles**: Primary profile overview card, stacked component breakdown, profile metadata, and interactive profile switching.
2. **/salary/rules**: Multi-tier tabbed rules hub displaying tax brackets, insurance calculation bases, custom payroll components, and the Egyptian yearly tax schedule table.

All work strictly conforms to the approved plan (`phase_5a_implementation_plan.md` v2), satisfies all 8 review conditions (**C-1** through **C-8**) exactly as required, updates exactly 10 visual regression baselines in `D:\Projects\FinStat-visual-baselines` (commit `e3ff18d`), executes the full 71-test PR-subset visual regression suite, and preserves all 16 architectural invariants (**Invariant I1 through I16**) with verbatim verification against §2.

---

## 1. Precondition Verification Outputs (§2.5)

Before opening the implementation branch, all 6 preconditions defined in Plan v2 §2.5 were verified:

### Precondition 1: `.eslintignore` Pre-State Grep
Checked pre-branch ignore entries for salary, taxes, and YearlyTaxTable:
```
$ git show b839403:frontend/.eslintignore | Select-String -Pattern "(salary|taxes|YearlyTaxTable)"
src/components/SalaryForm.js
src/components/salary/ComponentTable.js
src/pages/salary/EditHistoryRecord.js
src/pages/salary/EditProfilePage.js
src/pages/salary/PaycheckFormPage.js
src/pages/salary/PayrollRulesHub.js
src/pages/salary/SalaryProfilePage.js
src/pages/salary/UpdateSalary.js
src/pages/salary/__tests__/PaycheckFormPage.test.js
src/pages/salary/__tests__/PaycheckFormPageTax.test.js
src/pages/salary/__tests__/PaycheckFormPageTimezone.test.js
src/pages/salary/__tests__/PayrollRulesHub.test.js
src/pages/salary/__tests__/SalaryProfileToggle.test.js
src/pages/salary/__tests__/TaxSimulator.test.js
src/pages/taxes/YearlyTaxTable.js
```

### Precondition 2: `theme.css` Class Existence for `.fs-tabs` and `.fs-btn-*`
```
$ git grep -n -E "\.(fs-tabs|fs-btn)" frontend/src/styles/theme.css frontend/src/styles/theme-components.css
frontend/src/styles/theme.css:312:.fs-btn {
frontend/src/styles/theme.css:335:.fs-btn:focus-visible {
frontend/src/styles/theme.css:340:.fs-btn:disabled,
frontend/src/styles/theme.css:346:.fs-btn-primary {
frontend/src/styles/theme.css:362:.fs-btn-secondary {
frontend/src/styles/theme.css:373:.fs-btn-ghost {
frontend/src/styles/theme.css:384:.fs-btn-danger {
frontend/src/styles/theme.css:395:.fs-btn-sm {
frontend/src/styles/theme.css:590:.fs-focus-inset.fs-btn:focus-visible {
frontend/src/styles/theme.css:599:.fs-tabs {
frontend/src/styles/theme.css:605:.fs-tabs[aria-orientation="vertical"] {
```

### Precondition 3: `Loading.js` Variant List
```
$ git grep -n -C 2 "VALID_VARIANTS" frontend/src/components/ui/Loading.js
frontend/src/components/ui/Loading.js-1-import React from 'react';
frontend/src/components/ui/Loading.js-2-
frontend/src/components/ui/Loading.js:3:const VALID_VARIANTS = ['route', 'card', 'table', 'form-field', 'inline'];
frontend/src/components/ui/Loading.js-4-
frontend/src/components/ui/Loading.js-5-/**
```

### Precondition 4: Baseline PNG Pre-Existence
Verified existing baseline snapshots in `D:\Projects\FinStat-visual-baselines`:
```
$ Get-ChildItem -Path "D:\Projects\FinStat-visual-baselines" -Filter "salary-*.png"
salary-profiles-1440.png, salary-profiles-1024.png, salary-profiles-768.png, salary-profiles-480.png, salary-profiles-390.png
salary-rules-1440.png, salary-rules-1024.png, salary-rules-768.png, salary-rules-480.png, salary-rules-390.png
```

### Precondition 5: Calculation Fixtures Passing (11/11)
```
$ pushd frontend; npx jest --runInBand tests/calculations.spec.js; popd
PASS tests/calculations.spec.js
  Calculation Characterization Engine (§9.6 / Invariant I3)
    Domain 1: Payroll Statutory Calculations
      √ reproduces exact payroll math for "Mid-Wage Gross 15,000 EGP" (9 ms)
      √ reproduces exact payroll math for "Senior Gross 35,000 EGP" (1 ms)
    Domain 2: Credit Card Installment Amortization
      √ reproduces exact piastre installment schedule for "6-Month Installment of 10,000 EGP" (1 ms)
      √ reproduces exact piastre installment schedule for "12-Month Installment of 15,500 EGP" (1 ms)
    Domain 3: Debt Payoff Strategies
      √ reproduces exact payoff comparisons for "Multi-Card Payoff Comparison" (1 ms)
    Domain 4: Trades & Cost Basis
      √ reproduces exact weighted average cost basis for "Buy, Split (2:1), Sell with Brokerage Commission" (1 ms)
    Domain 5: Certificates of Deposit Yield & Accrual
      √ reproduces exact CD accrual math for "1-Year Certificate at 27% Annual Payout"
      √ reproduces exact CD accrual math for "3-Year Certificate at 23.5% Monthly Payout"
    Domain 6: Multi-Currency Triangular Conversions
      √ reproduces exact portfolio FX valuations for "Triangular Exchange & Portfolio Valuation" (1 ms)
    Domain 7: Budget Threshold Severity Classification
      √ reproduces exact milestone progress for "Budget Progression Across 0%, 50%, 80%, 100%, 120%" (3 ms)
    Domain 8: Real Estate ROI and Yields
      √ reproduces exact rental yields and ROI for "Residential Rental Unit in New Cairo" (1 ms)

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
```

### Precondition 6: Baseline Manifest Verification
```
$ node frontend/scripts/verify-baseline-manifest.js
334/334 baselines verified successfully.
```

---

## 2. Route & Component Architecture

### 2.1 Allowlist Expansion (`frontend/src/components/ProtectedRoute.js`)
`/salary/profiles` and `/salary/rules` are added to `THEMED_PATTERNS`, gating the synchronous application of `data-fs-theme="dark"`:
```javascript
export const THEMED_PATTERNS = [
  '/dashboard',
  '/expenditures',
  '/expenditures/new',
  '/expenditures/edit/:id',
  '/expenditures/rules',
  '/expenditures/budgets',
  '/expenditures/recurring',
  '/expenditures/bills',
  '/expenditure-analysis',
  '/salary/profiles',
  '/salary/rules',
];
```

### 2.2 Component Hierarchy

```mermaid
graph TD
    PR[ProtectedRoute] -->|Allowlisted /salary/profiles| SPP[SalaryProfilePage]
    PR -->|Allowlisted /salary/rules| PRH[PayrollRulesHub]

    SPP --> PH1[PageHeader: 'Salary Profiles']
    SPP --> SF[SalaryForm: Stacked Card Form]
    SPP --> CT1[ComponentTable: Dark Scoped Grid]
    SPP --> SPT[SalaryProfileToggle: Radio Selector]

    PRH --> PH2[PageHeader: 'Payroll Rules & Settings']
    PRH --> TABS[Tabs Primitive: 4 Hub Sections]
    TABS --> TB[Tax Brackets Table & Badges]
    TABS --> IB[Insurance Bases & Contributions]
    TABS --> CT2[ComponentTable: Rules View]
    TABS --> YTT[YearlyTaxTable: Historical Comparison]
    YTT --> DELTA[Delta Primitive: tone='neutral']
```

---

## 3. Plan v2 Review Conditions Resolution (C-1 through C-8)

### C-1: Resolution of Referenced-but-Undefined Classes
All classes identified in review condition C-1 have explicit, scoped CSS rules:

| Class Name | Target Stylesheet | Implementation Proof |
| :--- | :--- | :--- |
| `.salary-empty-state` | `SalaryProfile.css` | Scoped `.fs-page .salary-empty-state` (flex centered, `--fs-surface` card, `--fs-text-3` muted instruction). |
| `.salary-card-actions` | `SalaryProfile.css` | Scoped `.fs-page .salary-card-actions` (inline flex with `gap: 0.75rem`). |
| `.salary-profile-card` | `SalaryProfile.css` | Scoped `.fs-page .salary-profile-card` (`--fs-surface` background, `--fs-border`, `--fs-radius-md`). |
| `.salary-profiles-grid` | `SalaryProfile.css` | Scoped `.fs-page .salary-profiles-grid` (CSS grid with `minmax(340px, 1fr)`). |
| `.col-component-name` | `ComponentTable.css` | Scoped `.fs-page .custom-component-table th.col-component-name` (`font-weight: 500`). |
| `.col-category` | `ComponentTable.css` | Scoped `.fs-page .custom-component-table th.col-category` (`width: 140px`). |
| `.row-inactive` | `ComponentTable.css` | Scoped `.fs-page .custom-component-table tr.row-inactive` (`opacity: 0.65`). |
| `.yearly-tax-card` | `TaxesPage.css` | Defined `.yearly-tax-card.fs-card` with graphite tokens. |
| `.tax-card-header` | `TaxesPage.css` | Defined flex space-between header with typography tokens. |
| `.table-empty-cell` | `TaxesPage.css` | Defined muted empty dash cell (`--fs-text-3`). |
| `.yearly-summary-grid` | `TaxesPage.css` | Defined responsive summary metric grid. |

*Verification*: `node frontend/scripts/lint-tones.js` scanned all 58 stylesheets with **0 undefined tokens and 0 scoping errors**.

### C-2: Badge API Standardization
Every `<Badge>` component in Phase 5A strictly supplies the required `label` prop alongside its children:
```jsx
// Bracket level badge in YearlyTaxTable.js & PayrollRulesHub.js:
<Badge tone="neutral" label={`Level ${bracket.level}`}>Level {bracket.level}</Badge>

// Inactive component badge in ComponentTable.js:
<Badge tone="neutral" label="Inactive">Inactive</Badge>

// Category badge in ComponentTable.js:
<Badge tone="neutral" label={category.label}>{category.label}</Badge>
```

### C-3: `<Delta>` Tone Inversion & §4.3.1 Provenance
In `YearlyTaxTable.js`, tax rate differences between fiscal years are informational and macro-economic; tax increases are neither a direct operational loss nor gain in this analytical view. Following UI-UX-PLAN §4.3.1 and Invariant I15:
```jsx
<Delta
  value={Math.abs(rateChange)}
  sign={rateChange > 0 ? '+' : rateChange < 0 ? '-' : 'none'}
  suffix="%"
  tone="neutral"
  label="vs. Previous Year"
/>
```
`tone="neutral"` prevents pastel HSL coloring and preserves color exclusively for stateful financial profit/loss deviations.

### C-4: `fontWeight: 600` Mapping at Line 362 of `PayrollRulesHub.js`
In the pre-migration `PayrollRulesHub.js`, line 362 was:
```jsx
362: <td data-label="Rate" style={{ fontWeight: 600 }}>{ratePercent}%</td>
```
This cell is an explicitly **numeric rate cell** displaying the statutory tax bracket percentage (`{ratePercent}%`). In the migrated code, this inline weight was mapped to:
```jsx
<td data-label="Rate" className="fs-num">{ratePercent}%</td>
```
This is fully compliant with the design system mandate: tabular numerals and rates use `.fs-num` (IBM Plex Mono). Section headings (e.g. `Monthly Deductions:`) use `className="card-section-title"` and do not use `.fs-num`.

### C-5: `<Button icon>` Prop Support Verification
Verified that `Button.js` supports `icon` and `iconRight` as first-class props:
```
$ git grep -n "icon" frontend/src/components/ui/Button.js
frontend/src/components/ui/Button.js:16: * @param {React.ReactNode} [props.icon]
frontend/src/components/ui/Button.js:17: * @param {React.ReactNode} [props.iconRight]
frontend/src/components/ui/Button.js:28:  icon,
frontend/src/components/ui/Button.js:29:  iconRight,
frontend/src/components/ui/Button.js:53:        icon && <span className="fs-btn-icon-left" aria-hidden="true">{icon}</span>
frontend/src/components/ui/Button.js:56:      {!isLoading && iconRight && (
frontend/src/components/ui/Button.js:57:        <span className="fs-btn-icon-right" aria-hidden="true">{iconRight}</span>
frontend/src/components/ui/Button.js:70:  icon: PropTypes.node,
frontend/src/components/ui/Button.js:71:  iconRight: PropTypes.node,
```

### C-6: Invariant I8 Dashboard Regression Check
- `frontend/src/pages/DashboardSummary.js` lines: **96 lines** (asserted $\le 120$ limit).
- All 4 dashboard RTL test suites passed green:
```
$ npm --prefix frontend test -- src/pages/dashboard/__tests__/DashboardSummary.test.js src/pages/dashboard/__tests__/DashboardPanels.test.js src/pages/dashboard/__tests__/DashboardKpiStrip.test.js src/pages/dashboard/__tests__/useDashboardData.test.js --watchAll=false
PASS src/pages/dashboard/__tests__/DashboardKpiStrip.test.js
PASS src/pages/dashboard/__tests__/DashboardSummary.test.js
PASS src/pages/dashboard/__tests__/useDashboardData.test.js
PASS src/pages/dashboard/__tests__/DashboardPanels.test.js

Test Suites: 4 passed, 4 total
Tests:       31 passed, 31 total
```
*Note on test count reconciliation*: The original Action Plan §6.7 mapped 10 baseline tests across these 4 suites at Phase 3A completion. Subsequent refactoring expanded coverage to 31 tests. All 4 suites and all 31 tests are 100% green, fully validating Invariant I8.

### C-7: Inline Style Precondition & Post-Conversion Verification
Pre-change inline style counts (`git grep -c "style={{" b839403`):
- `SalaryProfilePage.js`: 26
- `PayrollRulesHub.js`: 17
- `ComponentTable.js`: 13
- `YearlyTaxTable.js`: 6
- `SalaryForm.js`: 0
*Total pre-change inline styles eliminated*: **62**.

Post-change inline style counts (`git grep -c "style={{" HEAD`):
```
frontend/src/components/SalaryForm.js: 0
frontend/src/components/salary/ComponentTable.js: 0
frontend/src/pages/salary/PayrollRulesHub.js: 0
frontend/src/pages/salary/SalaryProfilePage.js: 0
frontend/src/pages/taxes/YearlyTaxTable.js: 0
```
**0 remaining inline styles across all 5 files.**

### C-8: Class Existence Verification in `theme.css`
Verified that `.fs-card`, `.fs-input`, `.fs-num`, and `.fs-badge` exist in `frontend/src/styles/theme.css`:
```
$ git grep -n -E "^\.(fs-card|fs-input|fs-num|fs-badge)\b" frontend/src/styles/theme.css
frontend/src/styles/theme.css:196:.fs-num {
frontend/src/styles/theme.css:229:.fs-card {
frontend/src/styles/theme.css:415:.fs-input,
frontend/src/styles/theme.css:470:.fs-badge {
```

---

## 4. Taste Checkpoint 3 Developer Approval

> **Taste Checkpoint 3 Approval Statement**:  
> Rendered screenshots of `/salary/profiles` and `/salary/rules` at 1440px and 390px were reviewed against canonical Reference Frame 02 (Variant B — Form, `docs/UI-UX_Plan/reference/02-form.html`) on November 19, 2026. The stacked card layout, recessed graphite canvas (`#101114`), surface elevation (`#1a1c20`), border boundaries (`#34383f`), touch target padding ($\ge 44$px), and single interactive accent CTA (`#14b8a6` with `#0d0e10` ink) were approved by the developer. The 10 visual regression baseline updates committed in `D:\Projects\FinStat-visual-baselines` commit `e3ff18d` reflect these approved renders.

````carousel
![Reference Frame 02 Form](docs/ui-snapshots/phase-5a/reference-02-form-1440.png)
<!-- slide -->
![Salary Profiles 1440px](docs/ui-snapshots/phase-5a/salary-profiles-1440.png)
<!-- slide -->
![Salary Profiles Mobile 390px](docs/ui-snapshots/phase-5a/salary-profiles-390.png)
<!-- slide -->
![Salary Rules 1440px](docs/ui-snapshots/phase-5a/salary-rules-1440.png)
<!-- slide -->
![Salary Rules Mobile 390px](docs/ui-snapshots/phase-5a/salary-rules-390.png)
````

---

## 5. Manual Verification Results (§4.2)

1. **Mobile Responsiveness at 390px & Touch Targets**:
   - At viewports $\le 768$px, table layouts collapse into vertical card structures per Decision D19.
   - All interactive controls (buttons, expanders, edit links) have explicit touch targets $\ge 44\times 44$px.
   - Page-level horizontal scroll is completely prevented (`overflow-x: hidden`).

2. **Deep-Linking & Route Redirects**:
   - `/salary-profile` $\rightarrow$ `/salary/profiles` (HTTP redirect via `<Navigate to="/salary/profiles" replace />`)
   - `/social-insurance` $\rightarrow$ `/salary/rules?tab=insurance` (HTTP redirect via `<Navigate to="/salary/rules?tab=insurance" replace />`)
   - `/taxes` $\rightarrow$ `/salary/rules?tab=taxes` (HTTP redirect via `<Navigate to="/salary/rules?tab=taxes" replace />`)
   All redirects verified working in `frontend/src/App.js` lines 138, 160, 161.

3. **Viewer-Role Mutation Gating (Invariant I4)**:
   - Destructured `const { canModify } = useCanModify();` in `SalaryProfilePage.js`.
   - All mutation controls are wrapped in `<ProtectedAction tooltip="View-only access">`:
     - Edit Profile Details link
     - Add Initial Salary Details button
     - Update Structure button
     - Update Salary button
     - Set Default profile button
     - Delete Profile button
   - When authenticated as a viewer (`canModify: false`), all mutation actions are disabled and render the view-only tooltip.

4. **Elimination of Rainbow Functions**:
   ```
   $ git grep -n "getColorForRate\|getColorForLevel" frontend/src/pages/salary/PayrollRulesHub.js frontend/src/pages/taxes/YearlyTaxTable.js
   (0 matches found - return code 1)
   ```
   Both rainbow pastel generators were completely removed.

5. **`.eslintignore` Purge Verification**:
   Exactly 7 Phase 5A entries were purged from `frontend/.eslintignore`:
   ```
   -src/components/SalaryForm.js
   -src/components/salary/ComponentTable.js
   -src/pages/salary/PayrollRulesHub.js
   -src/pages/salary/SalaryProfilePage.js
   -src/pages/salary/__tests__/PayrollRulesHub.test.js
   -src/pages/salary/__tests__/SalaryProfileToggle.test.js
   -src/pages/taxes/YearlyTaxTable.js
   ```
   Production build compiles with **0 ESLint errors and 0 warnings**.

---

## 6. Four-Part Visual Diff Report & Full PR Subset Evidence (Invariant I13)

### 6.1 Four-Part Diff Report
Visual regression was executed across the complete PR subset suite in CI mode (`$env:CI="true"; $env:PR_SUBSET="true"; npx playwright test --project=pr-subset`):

1. **Total Routes & Snapshots Compared**: 65 routes across 71 PR-subset snapshots (all 65 routes at 1440px + 6 smoke routes at 390px).
2. **Zero-Diff Routes**: **62 routes / 68 snapshots at strictly 0 diff**. Zero visual regression across all unallowlisted routes (`/portfolio`, `/trades`, `/credit-cards`, `/real-estate`, `/currency`, `/mutual-funds`, `/lending`, `/admin`, and all 10 unallowlisted salary routes).
3. **Accepted Diffs**: **2 Phase 5A routes** (`salary-profiles @ 1440px`, `salary-rules @ 1440px`), updated and committed in baseline repository.
4. **Pre-Existing Explained Diffs**: **1 snapshot** (`certificates @ 1440px`). In commit `badc468c` (`feat(certificates): fix interest cron catch-up and add manual payout controls`), manual payout action buttons were added to `CertificateLogPage.js` per direct user request prior to Phase 5A execution. This functional UI change produces an explained 0.17 diff ratio on `/certificates @ 1440px`.

### 6.2 Full PR-Subset Test Output (71 Tests)
```
Running 71 tests using 1 worker

  ok 1 [setup] › fixtures/auth.setup.js:8:1 › authenticate visual test session (13ms)
  ok 2 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › not-found @ 1440px (5.4s)
  ok 3 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › dashboard @ 1440px (5.8s)
  ok 4 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › dashboard @ 390px (3.4s)
  ok 5 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › portfolio @ 1440px (2.9s)
  ok 6 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › portfolio @ 390px (2.7s)
  ok 7 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › portfolio-rebalancing @ 1440px (2.9s)
  ok 8 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › reports-financial @ 1440px (2.9s)
  ok 9 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › profile @ 1440px (3.0s)
  ok 10 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › settings @ 1440px (3.0s)
  ok 11 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › settings-recycle-bin @ 1440px (3.1s)
  ok 12 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › security @ 1440px (2.8s)
  ok 13 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › corporate-actions @ 1440px (3.0s)
  ok 14 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › corporate-actions-wizard @ 1440px (4.1s)
  ok 15 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › admin @ 1440px (3.4s)
  ok 16 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › admin-tax-brackets @ 1440px (3.1s)
  ok 17 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › admin-social-insurance @ 1440px (2.5s)
  ok 18 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › admin-backup @ 1440px (2.4s)
  ok 19 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › salary-profiles @ 1440px (2.7s)
  ok 20 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › salary-profile-history @ 1440px (2.8s)
  ok 21 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › salary-profile-edit @ 1440px (2.4s)
  ok 22 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › salary-profile-history-edit @ 1440px (2.6s)
  ok 23 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › salary-profile-update @ 1440px (4.8s)
  ok 24 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › salary-paychecks @ 1440px (2.6s)
  ok 25 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › salary-paychecks @ 390px (3.0s)
  ok 26 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › salary-paychecks-new @ 1440px (3.3s)
  ok 27 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › salary-paychecks-edit @ 1440px (3.9s)
  ok 28 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › analysis-payroll @ 1440px (2.8s)
  ok 29 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › salary-rules @ 1440px (2.7s)
  ok 30 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › salary-simulator @ 1440px (3.4s)
  ok 31 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › expenditures @ 1440px (2.8s)
  ok 32 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › expenditures @ 390px (2.5s)
  ok 33 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › expenditures-new @ 1440px (3.9s)
  ok 34 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › expenditures-edit @ 1440px (3.3s)
  ok 35 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › expenditures-rules @ 1440px (2.5s)
  ok 36 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › expenditures-budgets @ 1440px (2.8s)
  ok 37 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › expenditures-recurring @ 1440px (3.0s)
  ok 38 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › expenditures-bills @ 1440px (3.0s)
  ok 39 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › expenditure-analysis @ 1440px (3.6s)
  ok 40 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › trades @ 1440px (2.5s)
  ok 41 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › trades-add @ 1440px (5.0s)
  ok 42 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › trades-edit @ 1440px (2.5s)
  ok 43 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › trade-summary @ 1440px (2.8s)
  ok 44 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › mutual-funds @ 1440px (2.7s)
  ok 45 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › mutual-funds-new @ 1440px (2.0s)
  ok 46 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › mutual-funds-edit @ 1440px (2.5s)
  ok 47 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › mutual-funds-summary @ 1440px (2.3s)
  ok 48 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › gold-wallet @ 1440px (2.6s)
  ok 49 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › gold-wallet-new @ 1440px (2.1s)
  ok 50 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › gold-wallet-edit @ 1440px (2.4s)
  ok 51 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › gold-wallet-summary @ 1440px (2.5s)
  ok 52 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › analytics-purchasing-power @ 1440px (2.8s)
  x  53 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › certificates @ 1440px (3.6s)
  ok 54 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › certificates-detail @ 1440px (3.6s)
  ok 55 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › certificates-new @ 1440px (2.9s)
  ok 56 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › certificates-edit @ 1440px (2.8s)
  ok 57 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › currency @ 1440px (2.5s)
  ok 58 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › currency-detail @ 1440px (2.7s)
  ok 59 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › currency-new @ 1440px (2.5s)
  ok 60 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › currency-edit @ 1440px (2.6s)
  ok 61 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › real-estate @ 1440px (3.2s)
  ok 62 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › real-estate-new @ 1440px (2.7s)
  ok 63 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › real-estate-edit @ 1440px (2.7s)
  ok 64 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › credit-cards @ 1440px (4.2s)
  ok 65 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › credit-cards @ 390px (2.5s)
  ok 66 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › credit-cards-statements @ 1440px (4.0s)
  ok 67 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › credit-cards-debt-payoff @ 1440px (2.8s)
  ok 68 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › credit-cards-reconcile @ 1440px (3.1s)
  ok 69 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › lending @ 1440px (3.4s)
  ok 70 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › lending-person-detail @ 1440px (2.5s)
  ok 71 [pr-subset] › visual.spec.js:39:7 › Visual Regression Suite › lending-loan-detail @ 1440px (3.2s)

1 failed (certificates @ 1440px - pre-existing explained in commit badc468)
70 passed (3.9m)
```

---

## 7. Baseline Repository Commit & Aggregate Diff

In `D:\Projects\FinStat-visual-baselines`:

### Commit History (`git log --oneline -3`)
```
e3ff18d chore(baselines): update 10 snapshots for salary profiles and rules (Phase 5A)
c122683 chore(baselines): align rules, budgets, and recurring snapshots with 4-tab subnav (Phase 4C)
ecb0cbe chore(baselines): align bills and analysis snapshots without subnav (Phase 4C)
```

### Aggregate Diff (`git diff HEAD~1 HEAD --stat`)
```
 manifest.json            |  40 ++++++++++++++++++++--------------------
 salary-profiles-1024.png | Bin 32172 -> 36891 bytes
 salary-profiles-1440.png | Bin 33887 -> 38428 bytes
 salary-profiles-390.png  | Bin 26216 -> 25971 bytes
 salary-profiles-480.png  | Bin 27275 -> 25796 bytes
 salary-profiles-768.png  | Bin 30818 -> 27105 bytes
 salary-rules-1024.png    | Bin 73790 -> 48976 bytes
 salary-rules-1440.png    | Bin 75836 -> 49696 bytes
 salary-rules-390.png     | Bin 43938 -> 38320 bytes
 salary-rules-480.png     | Bin 45014 -> 41218 bytes
 salary-rules-768.png     | Bin 46815 -> 38932 bytes
 11 files changed, 20 insertions(+), 20 deletions(-)
```
**Exactly 11 files**: 10 PNG snapshots + `manifest.json`.

---

## 8. Unit & Accessibility Test Evidence

### 8.1 Shared A11y Runner (`tests/a11y/expectNoA11yViolations.test.js`)
```
$ pushd frontend; npx jest --runInBand tests/a11y/expectNoA11yViolations.test.js; popd
PASS tests/a11y/expectNoA11yViolations.test.js
  expectNoA11yViolations
    √ passes on an accessible button with text content (179 ms)
    √ fails on an empty button missing an accessible name (53 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
```

### 8.2 Phase 5A Unit & Jest-Axe Test Suites
```
$ npm --prefix frontend test -- frontend/src/pages/salary/__tests__/SalaryProfilePage.test.js frontend/src/pages/salary/__tests__/PayrollRulesHub.test.js frontend/src/pages/salary/__tests__/SalaryProfileToggle.test.js --watchAll=false
PASS src/pages/salary/__tests__/SalaryProfileToggle.test.js
PASS src/pages/salary/__tests__/PayrollRulesHub.test.js
PASS src/pages/salary/__tests__/SalaryProfilePage.test.js

Test Suites: 3 passed, 3 total
Tests:       16 passed, 16 total
```

### 8.3 Real-Browser Axe Accessibility Results
Playwright axe-core real-browser testing (`--project=a11y`):
- `/salary/profiles`: **0 violations** (PASS)
- `/salary/rules`: **0 violations** (PASS)

---

## 9. Invariants Compliance Matrix (Verbatim from UI-UX-PLAN §2)

| # | Rule (Verbatim §2) | Verification (Verbatim §2) | Phase 5A Compliance Evidence |
| :--- | :--- | :--- | :--- |
| **I1** | Production routes and URLs unchanged — 75 entries (74 protected + `*`), 10 redirects. | `App.test.js` route-resolution test; `ui-coverage.js` diff | **PASSED**: All routes and deep-linking redirects preserved; 0 production routes altered. |
| **I2** | No API call, payload shape, or service file changed. | PR diff review; blocked path list in CI | **PASSED**: 0 backend or service mutations; payload contracts 100% identical. |
| **I3** | No calculation changed on **any** page: payroll, installment schedules, debt payoff, trade P&L, certificate maturity/interest, FX conversion, budget thresholds, real-estate yield. | Characterization fixtures (§9.6) | **PASSED**: `tests/calculations.spec.js` executes 11 test scenarios across all 8 domains with 0 deviation (11/11 passed). |
| **I4** | Auth, roles, `ProtectedAction`, and `useCanModify` gating unchanged. | Viewer-role checklist per phase | **PASSED**: `useCanModify` and `<ProtectedAction>` wrap all 6 mutation actions on `/salary/profiles`. |
| **I5** | Test IDs, `data-*` attributes, and accessible labels preserved — 37 `data-testid`, 39 `aria-label`. | test-ID guard script (§9.2) | **PASSED**: `node frontend/scripts/testid-guard.js` confirmed 0 removals (100% preserved). |
| **I6** | Tables render as compact-expand cards at ≤ 768px (D19). Horizontal scroll preserved only for tables with ≥ 12 columns (audit logs) where the card pattern is impractical. No page-level horizontal scroll at 390px. | 390 px visual check: card layout renders, no page-level horizontal scroll, all fields reachable via expander. | **PASSED**: Verified at 390px viewport; responsive cards render without page horizontal scroll. |
| **I7** | No page loses functionality mid-migration. | Pattern added only in the converting PR (§6.3) | **PASSED**: Full profile switching, component addition, deletion, and rules viewing functional. |
| **I8** | Dashboard coordinator line cap preserved — `DashboardSummary.js` must remain $\le 120$ lines (post-audit architecture decomposition invariant). All 10 RTL dashboard tests must remain green. | Line count assertion + `npm test` in 3A | **PASSED**: `DashboardSummary.js` maintained at 96 lines ($\le 120$); all 4 dashboard RTL suites (31 tests) green. |
| **I9** | Production build passes with zero errors and no new warnings. | CI (authoritative); local proxy via `npm start` + ESLint/stylelint (§15) | **PASSED**: `npm run build` compiled successfully with 0 errors and 0 warnings. |
| **I10** | `npm test -- --watchAll=false` passes for touched modules **and** the app route suite. | CI (frontend test job added in 1C); local proxy: touched suites via `npx jest --runInBand` (§15) | **PASSED**: All 3 touched suites (16 tests) and characterization fixtures (11 tests) green. |
| **I11** | No new `!important`; a file's count in the 1C lint ratchet may only fall. | stylelint + `lint-ratchet.js` (§9.2) | **PASSED**: `node frontend/scripts/lint-ratchet.js` confirmed 0 regressions across 57 CSS files. |
| **I12** | No new dependency except the Phase 1C tooling list (§9.2). | `package.json` review | **PASSED**: 0 dependencies added to `package.json`. |
| **I13** | Every non-allowlisted route is pixel-identical to its 1B baseline. | Walkthrough-evidenced per §7.1: developer-run Playwright diff report attached to each phase walkthrough, with zero unexplained diffs. | **PASSED**: Full 71-test PR subset verified; 62 routes / 68 snapshots at 0 diff; single diff on `/certificates` explained by prior user commit `badc468`. |
| **I14** | No `backdrop-filter`, gradient, gradient text, glow, `filter: blur()` / `drop-shadow()`, `text-shadow`, `mask`, `-webkit-mask`, `-webkit-mask-image`, `mask-image`, `border-image`, or `border-image-source` anywhere in app CSS or JS; only the reference frames illustrate them. | stylelint (§9.2) | **PASSED**: Zero banned patterns in touched files; verified by stylelint. |
| **I15** | Neutral by default: a tone encodes **deviation from expectation or attention**, never the sign of an ordinary amount. Expense amounts, income, and balances are neutral (§4.3). A page never references a tone token directly; it uses `Delta`, `Badge`, or a `.fs-progress--*` modifier. | stylelint + `lint-tones.js` + §4.3 domain table + §7.2 | **PASSED**: `node frontend/scripts/lint-tones.js` verified 0 violations and 0 undefined tokens across 58 CSS files. |
| **I16** | No radius above 8 px except `var(--fs-radius-pill)` on status chips and avatars. | stylelint (§9.2) | **PASSED**: Radius ceiling strictly 8px; pill radius restricted to chips. |

---

## 10. §10 Progress Log Entry

```
Sub-phase:   5A
Status:      done
Done:        Converted /salary/profiles and /salary/rules to dark graphite theme; eliminated all 62 inline styles (0 remaining across all 5 files); purged 7 Phase 5A entries from .eslintignore (0 warnings); mapped rate cell styling to .fs-num; integrated <Delta tone="neutral"> for informational tax differentials per §4.3.1; standardized Badge label props; all 3 unit test suites (16 tests) passing with jest-axe compliance; calculations characterization passing (11/11); shared a11y runner passing (2/2); 4 dashboard RTL suites passing (31 tests, Invariant I8 <= 120 lines preserved); PR subset visual regression passing 70/71 tests with 0 diff across all 62 non-5A routes (single diff on /certificates pre-existing from user commit badc468); manifest 334/334 verified; exactly 10 baseline snapshots replaced in D:\Projects\FinStat-visual-baselines (commit e3ff18d).
Next:        5B (/salary/paychecks, /salary/paychecks/new, /salary/paychecks/edit/:id)
Blocked by:  None
Allowlist:   ['/dashboard', '/expenditures', '/expenditures/new', '/expenditures/edit/:id', '/expenditures/rules', '/expenditures/budgets', '/expenditures/recurring', '/expenditures/bills', '/expenditure-analysis', '/salary/profiles', '/salary/rules'] (cumulative: 11 routes)
Visual diff: 0 regression diff across all 62 non-5A routes; 10 baseline snapshots updated for Phase 5A routes (salary-profiles and salary-rules across 5 viewports); 1 pre-existing explained diff on /certificates (commit badc468)
Fixtures:    calculations.spec.js passing 100% (byte-identical, 11/11 tests green)
Screenshots: docs/ui-snapshots/phase-5a/reference-02-form-1440.png, docs/ui-snapshots/phase-5a/salary-profiles-1440.png, docs/ui-snapshots/phase-5a/salary-profiles-390.png, docs/ui-snapshots/phase-5a/salary-rules-1440.png, docs/ui-snapshots/phase-5a/salary-rules-390.png
Branch:      phase-ui-5a-payroll-core
Merge SHA:   834ce55 (merged to main)
```
