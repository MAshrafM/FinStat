# Implementation Plan — UI Phase 4C: Expenditure Cluster Completion (v2 — Revised)

> **Sub-phase**: UI Phase 4C  
> **Target Routes**:  
> 1. `/expenditures/rules` (`RulesPage.js`)  
> 2. `/expenditures/budgets` (`BudgetsPage.js`)  
> 3. `/expenditures/recurring` (`RecurringSuggestionsPage.js`)  
> 4. `/expenditures/bills` (`RecurringBills.js`)  
> 5. `/expenditure-analysis` (`ExpenditureAnalysisPage.js`)  
> **Status**: Ready for Review (v2 — Revised)  
> **Precondition**: UI Phase 4B merged to `main` at commit `9e49604` (verified: `git log --oneline -1 main` contains `9e49604`)  

---

## 1. Goal Description & Scope

UI Phase 4C is the concluding sub-phase of **Phase 4: Expenditure Ledger & Analytics** (§6.8). It migrates the five remaining expenditure routes to FinStat's dark graphite design system:
1. **Auto-Categorization Rules** (`/expenditures/rules`): Rule engine management cards, condition builders, simulator modal, and active toggles.
2. **Budget Tracker** (`/expenditures/budgets`): Period selector, budget progress meters adhering to §4.3.1 threshold rules, KPI metrics, and budget create/edit modals.
3. **Recurring Expense Automation** (`/expenditures/recurring`): Statistical detection scanner, pending/accepted recurrence cards, frequency actions, and accept modal using the `Tabs` primitive.
4. **Recurring Bills & Schedules** (`/expenditures/bills`): Bill calendar, upcoming payments, payment status chips, and bill action modals with mobile card collapse (D19).
5. **Spending Analysis** (`/expenditure-analysis`): Themed multi-series monthly comparison bar chart, accessible ranked horizontal category bar charts capped at 6 series with "Other" (§4.12, G2), data-table alternatives, and KPI tiles.

### Objectives:
- **Allowlist Expansion**: Add all 5 routes to `THEMED_PATTERNS` in `ProtectedRoute.js`, bringing cumulative allowlist coverage to **9 routes** (all 7 Expenditure routes now fully themed).
- **Inline Style Elimination**: Eliminate all **117 legacy inline styles** across the 5 files (`BudgetsPage.js`: 53, `ExpenditureAnalysisPage.js`: 32, `RecurringSuggestionsPage.js`: 21, `RulesPage.js`: 10, `RecurringBills.js`: 1).
- **ESLint Hygiene**: Remove all 4 remaining expenditure files from `frontend/.eslintignore` (`BudgetsPage.js`, `ExpenditureAnalysisPage.js`, `RecurringSuggestionsPage.js`, `RulesPage.js`), achieving zero ignored files in the expenditure domain.
- **Design System Conformance**:
  - All pages wrapped in `.fs-page` shell with `<PageHeader>`, `<ExpenditureSubNav />`, and `<Loading>` primitives.
  - Strict 8px border-radius ceiling (`--fs-radius-sm`: 4px, `--fs-radius-md`: 6px, `--fs-radius-lg`: 8px). Pill radius banned on buttons.
  - Zero tone tokens directly in page CSS (`lint-tones.js` and Invariant I15 compliance). Shared tone classes from `theme.css` used exclusively.
  - Dark graphite surfaces (`#101114` canvas, `#1a1c20` surfaces, `#22252a` raised panels, `#34383f` borders).
  - Interactive accent teal (`#14b8a6`) reserved exclusively for interactive controls with `#101114` ink text (never white).
- **Chart Modernization & Accessibility (§4.12, G2)**:
  - Migrate all 4 charts on `ExpenditureAnalysisPage.js` to `chartTheme.js`:
    - Volume charts with $\le 4$ segments: `Doughnut` with `doughnutDefaults` and `getChartPalette()`.
    - Category breakdowns with $> 4$ segments: Ranked horizontal bar charts (`indexAxis: 'y'`) capped at 6 series + neutral "Other", accompanied by accessible data table alternatives.
- **Budget Threshold Fidelity (§4.3.1)**:
  - Progress meters display neutral fill below 80%, `.fs-progress--warning` at 80–100% (`Warning`), and `.fs-progress--negative` strictly over 100% (`Over budget`, `pct > 100`).
  - Characterization fixtures in `tests/fixtures/calculations/budgets.snapshot.json` remain 100% passing.
- **ExpenditureSubNav Dual-Mode Retirement**:
  - Because Phase 4C finishes the Expenditure cluster, all 7 routes now run under `.fs-page`. Retire the legacy unscoped fallback branch in `ExpenditureSubNav.css` and rely on `.fs-page .expenditure-subnav-*` in `theme-components.css` (matching 9B precedent for `CreditCardSubNav.css`).
- **Visual Regression Gate (Invariant I13)**:
  - 0 diff across all **56 unallowlisted routes**.
  - Exactly 5 accepted diffs (25 baseline replacement snapshots at `1440px`, `1024px`, `768px`, `480px`, `390px`) verified in `D:\Projects\FinStat-visual-baselines` (manifest 334/334).

---

## 2. User Review Required & Design Decisions

> [!IMPORTANT]
> ### 1. Chart Modernization on `/expenditure-analysis` (§4.12 & Decision D14)
> An audit of `ExpenditureAnalysisPage.js` reveals four charts that currently use raw hex colors:
> 1. **Overall Volume Breakdown** (line 234, `overallPieChartData`): 3 segments (`Withdrawals`, `Top-ups`, `Savings`). Since $3 \le 4$, this will be rendered as a `Doughnut` using `doughnutDefaults` and `getChartPalette()` from `chartTheme.js`.
> 2. **Yearly Volume Breakdown** (line 247, `yearlyPieChartData`): 3 segments for the selected year. Converted to `Doughnut` using `doughnutDefaults` and `getChartPalette()`.
> 3. **Overall Category Breakdown** (line 267, `overallCategoryPieChartData`): 12+ categories ($> 4$ segments). Per §4.12 Series Discipline (G2), this is converted to a **ranked horizontal bar chart** (`indexAxis: 'y'`) capped at top 6 categories + neutral "Other", accompanied by an accessible tabular data alternative.
> 4. **Yearly Category Breakdown** (line 283, `yearlyCategoryPieChartData`): 12+ categories ($> 4$ segments). Converted to a **ranked horizontal bar chart** (`indexAxis: 'y'`) capped at top 6 categories + neutral "Other", accompanied by an accessible tabular data alternative.
> 5. **Monthly Volume Comparison** (line 88, `data-testid="bar-chart"`): Preserves all 12 month buckets and dataset names (`Withdrawals`, `Top-ups`, `Savings`), styled via `baseChartOptions` and `getChartPalette().greys` (`grey1`, `grey2`, `grey3`), keeping existing unit tests green.

> [!TIP]
> ### 2. Sub-Navigation Completion Across All 5 Pages
> Currently, `RulesPage`, `BudgetsPage`, and `RecurringSuggestionsPage` mount `<ExpenditureSubNav />`.
> For cluster consistency, `RecurringBills.js` and `ExpenditureAnalysisPage.js` will also mount `<ExpenditureSubNav />` below `<PageHeader>`.
> With all 7 routes in the cluster converted, the legacy fallback classes in `ExpenditureSubNav.css` are retired, finalizing dual-mode retirement for this cluster.

> [!NOTE]
> ### 3. Bill Status Threshold Provenance
> Audit of `RecurringBills.js` confirms that status thresholds and labels originate directly from the existing application source:
> - Line 69: `getUpcomingBills({ days: 3 })` defines the 3-day upcoming window.
> - Lines 210–227 (`getBillStatus`):
>   - `!bill.isActive` $\rightarrow$ `bill-badge-paused` $\rightarrow$ `<Badge tone="neutral" label="Paused">Paused</Badge>`
>   - `diffDays < 0` $\rightarrow$ `bill-badge-overdue` $\rightarrow$ `<Badge tone="negative" label="Overdue">Overdue</Badge>`
>   - `diffDays <= 3` $\rightarrow$ `bill-badge-due-soon` $\rightarrow$ `<Badge tone="warning" label="Due Soon">Due Soon</Badge>`
>   - `diffDays > 3` $\rightarrow$ `bill-badge-active` $\rightarrow$ `<Badge tone="neutral" label="Active">Active</Badge>`
> These are preserved with 100% fidelity using the `Badge` primitive.

---

## 3. Detailed Implementation Steps

### 3.1 Route Allowlist (`frontend/src/components/ProtectedRoute.js`)

#### [MODIFY] `frontend/src/components/ProtectedRoute.js`
Expand `THEMED_PATTERNS` to include the 5 remaining routes:

```diff
 export const THEMED_PATTERNS = [
   '/dashboard',
   '/expenditures',
   '/expenditures/new',
   '/expenditures/edit/:id',
+  '/expenditures/rules',
+  '/expenditures/budgets',
+  '/expenditures/recurring',
+  '/expenditures/bills',
+  '/expenditure-analysis',
 ];
```

Update `ProtectedRoute.test.js` to assert `true` for all 9 routes and `false` for unallowlisted routes.

---

### 3.2 Rules Page (`RulesPage.js` & `RulesPage.css`)

#### [MODIFY] `frontend/src/pages/expenditure/RulesPage.js`
- Wrap outer element: `<div className="fs-page rules-page-container">`.
- Replace custom header with `<PageHeader title="Auto-Categorization Rules" subtitle="Automate transaction category tagging with priority-based pattern matching" />`.
- Mount `<ExpenditureSubNav />`.
- Replace raw spinners with `<Loading variant="card" text="Loading categorization rules..." />`.
- Eliminate all 10 inline styles (button flex, condition spacing, priority badges, modal inputs).
- Wrap create, edit, delete, and test triggers with `<ProtectedAction tooltip="View-only access">` (Invariant I4).
- Use `Button` primitive for action controls (`variant="primary"`, `variant="secondary"`).
- Style priority indicators using `<Badge tone="neutral" label={`Priority ${rule.priority}`}>`.

#### [MODIFY] `frontend/src/pages/expenditure/RulesPage.css`
- Scope all rules under `.fs-page .rules-page-container`.
- De-escalate button gradients to FinStat tokens (`--fs-accent` with `--fs-ink`, `--fs-surface-raised` with `--fs-border`).
- Convert rule cards to `--fs-surface` (`#1a1c20`) with 1px border `--fs-border` (`#34383f`) and 6px radius (`--fs-radius-md`).
- Active rule toggle indicator styled with `--fs-accent`.
- Replace raw hex colors (`#111827`, `#6b7280`, `#3b82f6`) with token variables (`--fs-text`, `--fs-text-2`, `--fs-text-3`). Zero tone tokens in page CSS.

---

### 3.3 Budgets Page (`BudgetsPage.js` & `BudgetsPage.css`)

#### [MODIFY] `frontend/src/pages/expenditure/BudgetsPage.js`
- Wrap outer element: `<div className="fs-page budgets-page-container">`.
- Header: `<PageHeader title="Budget Tracker" subtitle="Monitor category limits, period spending thresholds, and variance" />`.
- Mount `<ExpenditureSubNav />`.
- Replace loading text with `<Loading variant="table" text="Calculating budget progress..." />`.
- Eliminate all 53 inline styles.
- **Budget Threshold Implementation (§4.3.1)**:
  ```jsx
  // Calculate tone modifier class per §4.3.1 source fidelity (pct > 100)
  const getProgressModifier = (pct) => {
    if (pct > 100) return 'fs-progress--negative';
    if (pct >= 80) return 'fs-progress--warning';
    return ''; // neutral under 80%
  };
  ```
- Render progress track and bar:
  ```jsx
  <div
    className={`fs-progress ${getProgressModifier(bp.percentageUsed)}`}
    role="progressbar"
    aria-valuenow={Math.min(bp.percentageUsed, 100)}
    aria-valuemin="0"
    aria-valuemax="100"
    aria-label={`${bp.category} budget usage: ${bp.percentageUsed}%`}
  >
    <div
      className="fs-progress-bar"
      style={{ width: `${Math.min(bp.percentageUsed, 100)}%` }}
    />
  </div>
  ```
- Use `Badge` primitive for remaining balance status:
  ```jsx
  <Badge
    tone={bp.remainingAmount >= 0 ? 'neutral' : 'negative'}
    label={bp.remainingAmount >= 0 ? `${formatCurrency(bp.remainingAmount)} remaining` : `${formatCurrency(Math.abs(bp.remainingAmount))} over limit`}
  >
    {bp.remainingAmount >= 0 ? `${formatCurrency(bp.remainingAmount)} remaining` : `${formatCurrency(Math.abs(bp.remainingAmount))} over limit`}
  </Badge>
  ```
- Wrap budget mutation buttons in `<ProtectedAction tooltip="View-only access">`.

#### [MODIFY] `frontend/src/pages/expenditure/BudgetsPage.css`
- Scope all rules under `.fs-page .budgets-page-container`.
- **Zero Tone Tokens (HB-1 fix)**: Do NOT reference `var(--fs-warning)` or `var(--fs-negative)`. Progress tone is applied 100% by `.fs-progress--warning .fs-progress-bar` and `.fs-progress--negative .fs-progress-bar` from `theme.css`.
- Progress track layout:
  ```css
  .fs-page .budget-card .fs-progress {
    margin-top: 0.75rem;
    margin-bottom: 0.5rem;
  }
  ```
- Replace legacy grid styles with dark graphite surface tokens (`--fs-surface: #1a1c20`, `--fs-surface-raised: #22252a`, `--fs-border: #34383f`).
- KPI metrics formatted with IBM Plex Mono font (`font-family: var(--fs-font-mono)`).

---

### 3.4 Recurring Expense Suggestions (`RecurringSuggestionsPage.js` & `RecurringSuggestionsPage.css`)

#### [MODIFY] `frontend/src/pages/expenditure/RecurringSuggestionsPage.js`
- Wrap outer element: `<div className="fs-page recur-page-container">`.
- Header: `<PageHeader title="Recurring Expense Detection" subtitle="Identify and automate repeating transactions using statistical pattern matching" />`.
- Mount `<ExpenditureSubNav />`.
- Replace loading with `<Loading variant="card" text="Scanning transaction history for recurring patterns..." />`.
- Eliminate all 21 inline styles.
- **Use `Tabs` Primitive (RC-5 fix)**:
  Replace custom `.recur-tabs` buttons with the accessible `Tabs` primitive:
  ```jsx
  import { Tabs } from '../../components/ui';

  const suggestionTabs = [
    { id: 'pending', label: 'Pending Suggestions', badge: pendingSuggestions.length > 0 ? pendingSuggestions.length : undefined },
    { id: 'accepted', label: 'Active Recurrences' },
    { id: 'history', label: 'Dismissed History' },
  ];

  <Tabs
    tabs={suggestionTabs}
    activeTab={activeTab}
    onChange={setActiveTab}
    ariaLabel="Recurring suggestions views"
  />
  ```
- Status and cadence indicators use `<Badge tone="neutral" label={s.cadence}>` and `<Badge tone="warning" label="Detected Pattern">`.
- Accept and dismiss actions wrapped in `<ProtectedAction tooltip="View-only access">`.

#### [MODIFY] `frontend/src/pages/expenditure/RecurringSuggestionsPage.css`
- Scope all rules under `.fs-page .recur-page-container`.
- Remove legacy button gradients and border radii $> 8\text{px}$.
- Tokenize card surfaces (`--fs-surface`, `--fs-surface-raised`, `--fs-border`).
- Zero tone tokens in page CSS.

---

### 3.5 Recurring Bills & Schedules (`RecurringBills.js` & `RecurringBills.css`)

#### [MODIFY] `frontend/src/pages/expenditure/RecurringBills.js`
- Outer element: `<div className="fs-page recurring-bills-container" data-testid="recurring-bills-page">`.
- Header: `<PageHeader title="Recurring Bills & Schedules" subtitle="Track subscriptions, utilities, and scheduled payments with automatic due-date roll-forward" />`.
- Mount `<ExpenditureSubNav />`.
- Replace spinners with `<Loading variant="table" text="Loading bills and schedules..." />`.
- Eliminate inline styles.
- **Status Chips with `Badge` Primitive (HB-3 & RC-3 fix)**:
  Update `getBillStatus` to return semantic props for `Badge`:
  ```jsx
  const getBillStatusBadge = (bill) => {
    if (!bill.isActive) {
      return <Badge tone="neutral" label="Paused">Paused</Badge>;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(bill.nextDueDate);
    dueDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <Badge tone="negative" label="Overdue">Overdue</Badge>;
    }
    if (diffDays <= 3) {
      return <Badge tone="warning" label="Due Soon">Due Soon</Badge>;
    }
    return <Badge tone="neutral" label="Active">Active</Badge>;
  };
  ```
- **Mobile Responsive Pattern (Decision D19)**:
  - Desktop: Dense bills table with tabular amounts.
  - Mobile ($\le 768\text{px}$ / $390\text{px}$): Conditionally collapse bills into vertical cards with status badges, due date, payment method, and actions.
  - Calendar strip tested at $390\text{px}$; collapses to a vertical list of upcoming schedules on mobile viewports.
- Actions gated with `<ProtectedAction tooltip="View-only access">`.

#### [MODIFY] `frontend/src/pages/expenditure/RecurringBills.css`
- Scope all rules under `.fs-page .recurring-bills-container`.
- Tokenize KPI grid and summary tiles (`--fs-surface`, `--fs-border`, `--fs-radius-md`).
- Zero tone tokens in page CSS.

---

### 3.6 Spending Analysis Page (`ExpenditureAnalysisPage.js` & `Expenditure.css`)

#### [MODIFY] `frontend/src/pages/expenditure/ExpenditureAnalysisPage.js`
- Wrap outer element: replace legacy `<div className="page-container">` with `<div className="fs-page expenditure-analysis-container">` (RC-12 fix).
- Note on stylesheet: `ExpenditureAnalysisPage.js` imports `./Expenditure.css` (RC-6 fix). No separate CSS file exists. All scoped styles live under `.fs-page .expenditure-analysis-container` in `Expenditure.css`.
- Header: `<PageHeader title="Spending Analysis" subtitle="Annual and multi-year expenditure trends, volume breakdowns, and category distributions" />`.
- Mount `<ExpenditureSubNav />`.
- Eliminate all 32 inline styles.
- **Chart.js Modernization (§4.12 & Decision D14 — RC-7 fix)**:
  - Import `getChartPalette`, `baseChartOptions`, `barDefaults`, `doughnutDefaults`, `withAlpha`, `ariaLabel` from `../../styles/chartTheme`.
  - **Chart 1: Overall Volume Breakdown** (`overallPieChartData`, 3 segments $\le 4$):
    - Converted to `Doughnut` with `doughnutDefaults` and palette `[greys[0], greys[1], greys[2]]`.
  - **Chart 2: Yearly Volume Breakdown** (`yearlyPieChartData`, 3 segments $\le 4$):
    - Converted to `Doughnut` with `doughnutDefaults` and palette `[greys[0], greys[1], greys[2]]`.
  - **Chart 3: Overall Category Breakdown** (`overallCategoryPieChartData`, 12+ categories $> 4$):
    - Converted to ranked horizontal bar chart (`Bar` with `options.indexAxis = 'y'`).
    - Capped at top 6 categories; remaining categories aggregated into neutral `"Other"`.
    - Adjacent accessible data table displaying complete un-truncated category totals and percentages.
  - **Chart 4: Yearly Category Breakdown** (`yearlyCategoryPieChartData`, 12+ categories $> 4$):
    - Converted to ranked horizontal bar chart (`Bar` with `options.indexAxis = 'y'`).
    - Capped at top 6 categories + neutral `"Other"`, accompanied by an accessible data table.
  - **Chart 5: Monthly Volume Comparison** (`data-testid="bar-chart"`):
    - Update datasets (`Withdrawals`, `Top-ups`, `Savings`) to use `chartTheme.js` palette:
      - Withdrawals: `palette.grey1` (`#8b929b`)
      - Top-ups: `palette.grey2` (`#b8bec6`)
      - Savings: `palette.grey3` (`#6a7078`)
    - Preserve `data-testid="bar-chart"` and dataset indexing to keep existing tests green.

#### [MODIFY] `frontend/src/pages/expenditure/Expenditure.css`
- Add scoped rules for analysis summary cards, search filter toolbar, and chart card containers under `.fs-page .expenditure-analysis-container`.

---

### 3.7 ExpenditureSubNav Dual-Mode Retirement (`ExpenditureSubNav.css` & `ExpenditureSubNav.js`)

#### [MODIFY] `frontend/src/pages/expenditure/ExpenditureSubNav.js`
- Add missing tabs so all 7 cluster routes are reachable from the sub-nav:
  - `/expenditures/bills` ("Bills & Schedules", short: "Bills")
  - `/expenditure-analysis` ("Spending Analysis", short: "Analysis")
- Retain `active` detection based on `location.pathname`.

#### [MODIFY] `frontend/src/pages/expenditure/ExpenditureSubNav.css`
- Retire the legacy unscoped `.expenditure-subnav-*` rules now that all 7 expenditure routes are allowlisted under `.fs-page` (RC-4 fix).
- Sub-nav styling is fully handled by `.fs-page .expenditure-subnav-*` in `theme-components.css`.

---

### 3.8 Tooling & Linting (`frontend/.eslintignore`)

#### [MODIFY] `frontend/.eslintignore`
Delete the 4 remaining expenditure ignore lines (verified via `git grep -in "expenditure" frontend/.eslintignore` — HB-4 & RC-2 fix):
- Line 51: `src/pages/expenditure/BudgetsPage.js`
- Line 52: `src/pages/expenditure/ExpenditureAnalysisPage.js`
- Line 53: `src/pages/expenditure/RecurringSuggestionsPage.js`
- Line 54: `src/pages/expenditure/RulesPage.js`

Verify `git grep -in "expenditure" frontend/.eslintignore` returns **0 matches**.

---

## 4. Verification & Testing Plan

### 4.1 Automated Script Verification Commands

```powershell
# 1. Verify Design Tokens integrity and contrast tables
node frontend/scripts/tokens.js --check

# 2. Verify Tone Scoping & Undefined Tokens (Invariant I15)
node frontend/scripts/lint-tones.js

# 3. Verify Stylelint Ratchet & 8px Radius Ceiling
node frontend/scripts/lint-ratchet.js

# 4. Verify Test ID and ARIA Label Preservation (Invariant I5)
node frontend/scripts/testid-guard.js

# 5. Verify ESLint on all touched files with zero warnings
npx eslint frontend/src/pages/expenditure/RulesPage.js `
           frontend/src/pages/expenditure/BudgetsPage.js `
           frontend/src/pages/expenditure/RecurringSuggestionsPage.js `
           frontend/src/pages/expenditure/RecurringBills.js `
           frontend/src/pages/expenditure/ExpenditureAnalysisPage.js `
           frontend/src/components/ProtectedRoute.js --max-warnings=0

# 6. Verify zero remaining expenditure files in .eslintignore (case-insensitive)
git grep -in "expenditure" frontend/.eslintignore

# 7. Verify chartTheme test-mode fallback in Jest (RC-8)
npx --prefix frontend jest --runInBand -t "chartTheme"
```

### 4.2 Jest Test Suites Execution (In-Band per §15.5 — RC-1 fix)

```powershell
# Run touched and calculation unit tests in-band
npx --prefix frontend jest --runInBand `
  src/pages/expenditure/__tests__/RulesPage.test.js `
  src/pages/expenditure/__tests__/BudgetsPage.test.js `
  src/pages/expenditure/__tests__/RecurringSuggestionsPage.test.js `
  src/pages/expenditure/__tests__/RecurringBills.test.js `
  src/pages/expenditure/__tests__/ExpenditureAnalysisPage.test.js `
  src/components/__tests__/ProtectedRoute.test.js `
  tests/calculations.spec.js `
  tests/a11y/expectNoA11yViolations.test.js
```

### 4.3 Production Build Verification (RC-11 note)

```powershell
# Verify production build with memory allocation (§15.3 Option 4)
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm --prefix frontend run build
```
> **Memory Note**: Build verified via §15.3 Option 4 (`NODE_OPTIONS: --max-old-space-size=4096`); if local build OOMs, CI build is authoritative per §15.4.

### 4.4 Visual Regression & Baseline Verification (Invariant I13)

```powershell
# 1. Assert route allowlist coverage (9 allowlisted, 56 unallowlisted)
node frontend/scripts/ui-coverage.js --assert-allowlist

# 2. Run visual regression across allowlisted and unallowlisted routes
npm run test:visual:pr-subset

# 3. Verify manifest integrity (334/334 snapshots verified in D:\Projects\FinStat-visual-baselines)
node frontend/scripts/verify-baseline-manifest.js
```

---

## 5. Invariant Checklist (Action Plan §2 Verbatim)

- [ ] **I1: Route stability**: Production routes and URLs unchanged — 75 entries (74 protected + `*`), 10 redirects.
- [ ] **I2: DTO & API contract stability**: No API call, payload shape, or service file changed. Presentation layer only.
- [ ] **I3: Characterization test stability**: No calculation changed on any page; calculation tests pass identical inputs to identical outputs.
- [ ] **I4: Allowlist gate integrity**: Auth, roles, ProtectedAction, and useCanModify gating unchanged. Viewers cannot mutate.
- [ ] **I5: Test-ID & ARIA preservation**: Test IDs, data-* attributes, and accessible labels preserved.
- [ ] **I6: Mobile responsive pattern (D19)**: Tables collapse into compact-expand cards $\le 768\text{px}$; no horizontal scroll.
- [ ] **I7: Mid-migration continuity**: No page loses functionality mid-migration. Unallowlisted pages render legacy views intact.
- [ ] **I8: Coordinator line cap (N/A)**: Preserved for DashboardSummary.js ($\le 120$ lines; not touched in this phase).
- [ ] **I9: Production build pass**: Production build passes with zero errors and no new warnings.
- [ ] **I10: CRA suite stability**: `npm test -- --watchAll=false` passes for touched modules and the app route suite.
- [ ] **I11: Bundle-size ratchet**: Bundle size within budget; no new font weight loaded; zero new runtime dependencies.
- [ ] **I12: Reference-frame fidelity**: Pages match canonical reference frames (01 dense table, 02 form, 03 dashboard).
- [ ] **I13: Visual regression gate**: 0 diff across all unallowlisted routes; exactly the targeted allowlisted diffs; manifest verified (334/334).
- [ ] **I14: Single source of truth (tokens.json)**: All visual tokens trace directly to `tokens.json`. Zero hardcoded hex/radii outside tokens.
- [ ] **I15: Zero tone tokens in page CSS**: Page CSS contains zero direct tone tokens (`--fs-positive`, `--fs-negative`, `--fs-warning`). Tone via primitives only.
- [ ] **I16: Multi-theme door preservation (D22)**: Scoped theme blocks in `tokens.css`; attribute-existence selectors `[data-fs-theme]`; theme-aware chart palette.
