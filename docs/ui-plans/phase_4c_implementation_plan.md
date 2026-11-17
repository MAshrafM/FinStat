# Implementation Plan — UI Phase 4C: Expenditure Cluster Completion (v3 — Finalized)

> **Sub-phase**: UI Phase 4C  
> **Target Routes**:  
> 1. `/expenditures/rules` (`RulesPage.js`)  
> 2. `/expenditures/budgets` (`BudgetsPage.js`)  
> 3. `/expenditures/recurring` (`RecurringSuggestionsPage.js`)  
> 4. `/expenditures/bills` (`RecurringBills.js`)  
> 5. `/expenditure-analysis` (`ExpenditureAnalysisPage.js`)  
> **Status**: Ready for Execution (v3 — Finalized)  
> **Precondition**: UI Phase 4B merged to `main` at commit `9e49604`  
> - Verified via `git log --oneline -1 main`:  
>   `9cbd875 docs(ui): revise Phase 4C implementation plan to v2 addressing HB-1..HB-4 and RC-1..RC-12`  
> - Verified via `git branch --contains 9e49604`:  
>   `* main`  

---

## 1. Goal Description & Scope

UI Phase 4C is the concluding sub-phase of **Phase 4: Expenditure Ledger & Analytics** (§6.8). It migrates the five remaining expenditure routes to FinStat's dark graphite design system:
1. **Auto-Categorization Rules** (`/expenditures/rules`): Rule engine management cards, condition builders, simulator modal, and active toggles.
2. **Budget Tracker** (`/expenditures/budgets`): Period selector, budget progress meters adhering to §4.3.1 threshold rules, KPI metrics, and budget create/edit modals.
3. **Recurring Expense Automation** (`/expenditures/recurring`): Statistical detection scanner, pending/accepted recurrence cards, frequency actions, and accept modal using the `Tabs` primitive.
4. **Recurring Bills & Schedules** (`/expenditures/bills`): Bill calendar, upcoming payments, payment status chips, and bill action modals with mobile card collapse (D19).
5. **Spending Analysis** (`/expenditure-analysis`): Themed multi-series monthly comparison bar chart, accessible ranked horizontal category bar charts capped at 6 series with "Other" (§4.12, G2), data-table alternatives, and KPI tiles.

### Objectives:
- **Allowlist Expansion**: Add all 5 routes to `THEMED_PATTERNS` in `ProtectedRoute.js`, bringing cumulative allowlist coverage to **9 routes** (all **8** Expenditure routes now fully themed: `/expenditures`, `/expenditures/new`, `/expenditures/edit/:id`, `/expenditures/rules`, `/expenditures/budgets`, `/expenditures/recurring`, `/expenditures/bills`, `/expenditure-analysis`).
- **Inline Style Elimination**: Eliminate all **117 legacy inline styles** across the 5 files:
  - `BudgetsPage.js`: 53
  - `ExpenditureAnalysisPage.js`: 32
  - `RecurringSuggestionsPage.js`: 21
  - `RulesPage.js`: 10
  - `RecurringBills.js`: 1 (Line 320: `<td style={{ textTransform: 'capitalize' }}>{bill.frequency}</td>`; historical "18" in Action Plan §5.3 updated to reflect post-7C.1b extraction).
- **ESLint Hygiene**: Remove all 4 remaining expenditure files from `frontend/.eslintignore` (`BudgetsPage.js`, `ExpenditureAnalysisPage.js`, `RecurringSuggestionsPage.js`, `RulesPage.js`), achieving zero ignored files in the expenditure domain.
- **Design System Conformance**:
  - All pages wrapped in `.fs-page` shell with `<PageHeader>`, `<ExpenditureSubNav />`, and `<Loading>` primitives.
  - Strict 8px border-radius ceiling (`--fs-radius-sm`: 4px, `--fs-radius-md`: 6px, `--fs-radius-lg`: 8px). Pill radius banned on buttons.
  - Zero tone tokens directly in page CSS (`lint-tones.js` and Invariant I15 compliance). Shared tone classes from `theme.css` used exclusively.
  - Dark graphite surfaces (`#101114` canvas, `#1a1c20` surfaces, `#22252a` raised panels, `#34383f` borders).
  - Interactive accent teal (`#14b8a6`) reserved exclusively for interactive controls with `#101114` ink text (never white).
- **Chart Modernization & Accessibility (§4.12, G2)**:
  - Migrate all 5 charts on `ExpenditureAnalysisPage.js` to `chartTheme.js`:
    - Volume charts with $\le 4$ segments: `Doughnut` with `doughnutDefaults` and `getChartPalette()`.
    - Category breakdowns with $> 4$ segments: Ranked horizontal bar charts (`indexAxis: 'y'`) capped at 6 series + neutral "Other", accompanied by accessible data table alternatives.
    - Monthly Volume Comparison bar chart: Styled via `chartTheme.js` palette, preserving dataset names and unit tests.
- **Budget Threshold Fidelity (§4.3.1)**:
  - Progress meters display neutral fill below 80%, `.fs-progress--warning` at 80–100% (`Warning`), and `.fs-progress--negative` strictly over 100% (`Over budget`, `pct > 100`).
  - Characterization fixtures in `tests/fixtures/calculations/budgets.snapshot.json` remain 100% passing.
- **ExpenditureSubNav Dual-Mode Retirement**:
  - Because Phase 4C finishes the Expenditure cluster, all 8 routes now run under `.fs-page`. Retire the legacy unscoped fallback branch in `ExpenditureSubNav.css` and rely on `.fs-page .expenditure-subnav-*` in `theme-components.css` (matching 9B precedent for `CreditCardSubNav.css`).
- **Visual Regression Gate (Invariant I13)**:
  - 0 diff across all **56 unallowlisted routes** (65 total rendering routes minus 9 allowlisted = 56).
  - Exactly 5 accepted diffs (25 baseline replacement snapshots at `1440px`, `1024px`, `768px`, `480px`, `390px`) verified in `D:\Projects\FinStat-visual-baselines` (manifest 334/334).

---

## 2. User Review Required & Design Decisions

> [!IMPORTANT]
> ### 1. Chart Modernization on `/expenditure-analysis` (§4.12 & Decision D14)
> An audit of `ExpenditureAnalysisPage.js` reveals four pie/doughnut charts plus one monthly volume bar chart (five charts total) that currently use raw hex colors:
> 1. **Overall Volume Breakdown** (line 234, `overallPieChartData`): 3 segments (`Withdrawals`, `Top-ups`, `Savings`). Since $3 \le 4$, this will be rendered as a `Doughnut` using `doughnutDefaults` and `getChartPalette()` from `chartTheme.js`.
> 2. **Yearly Volume Breakdown** (line 247, `yearlyPieChartData`): 3 segments for the selected year. Converted to `Doughnut` using `doughnutDefaults` and `getChartPalette()`.
> 3. **Overall Category Breakdown** (line 267, `overallCategoryPieChartData`): 12+ categories ($> 4$ segments). Per §4.12 Series Discipline (G2), this is converted to a **ranked horizontal bar chart** (`indexAxis: 'y'`) capped at top 6 categories + neutral "Other", accompanied by an accessible tabular data alternative.
> 4. **Yearly Category Breakdown** (line 283, `yearlyCategoryPieChartData`): 12+ categories ($> 4$ segments). Converted to a **ranked horizontal bar chart** (`indexAxis: 'y'`) capped at top 6 categories + neutral "Other", accompanied by an accessible tabular data alternative.
> 5. **Monthly Volume Comparison** (line 88, `data-testid="bar-chart"`): Preserves all 12 month buckets and dataset names (`Withdrawals`, `Top-ups`, `Savings`), styled via `baseChartOptions` and `getChartPalette().greys` (`grey1`, `grey2`, `grey3`), keeping existing unit tests green.

> [!TIP]
> ### 2. Sub-Navigation Completion Across All 8 Expenditure Routes
> Currently, `RulesPage`, `BudgetsPage`, and `RecurringSuggestionsPage` mount `<ExpenditureSubNav />`.
> For cluster consistency, `RecurringBills.js` and `ExpenditureAnalysisPage.js` will also mount `<ExpenditureSubNav />` below `<PageHeader>`.
> Two tabs pointing to existing routes (`/expenditures/bills` and `/expenditure-analysis`) are added to `ExpenditureSubNav.js`. These point to existing routes already handled in `App.js`, so Invariant I1 (route stability) is fully preserved.
> With all 8 routes in the cluster converted, the legacy fallback classes in `ExpenditureSubNav.css` are retired, finalizing dual-mode retirement for this cluster.

> [!NOTE]
> ### 3. Bill Status Threshold Provenance (§4.3.1 Traceability)
> Audit of `RecurringBills.js` confirms that status thresholds and labels originate directly from the existing application source:
> - Line 69: `getUpcomingBills({ days: 3 })` defines the 3-day upcoming window.
> - Lines 210–227 (`getBillStatus`):
>   - `!bill.isActive` $\rightarrow$ `bill-badge-paused` $\rightarrow$ `{ tone: 'neutral', label: 'Paused' }`
>   - `diffDays < 0` $\rightarrow$ `bill-badge-overdue` $\rightarrow$ `{ tone: 'negative', label: 'Overdue' }`
>   - `diffDays <= 3` $\rightarrow$ `bill-badge-due-soon` $\rightarrow$ `{ tone: 'warning', label: 'Due Soon' }`
>   - `diffDays > 3` $\rightarrow$ `bill-badge-active` $\rightarrow$ `{ tone: 'neutral', label: 'Active' }`
> The Overdue/Due Soon escalation mirrors the §4.3.1 pattern for debt and credit-card balances (due soon $\rightarrow$ Warning; overdue $\rightarrow$ Negative). The 3-day window is a per-domain specificity matching the backend query; the escalation logic matches §4.3.1 semantics.

---

## 3. Detailed Implementation Steps

### Precondition Verifications (Mandatory Before Opening Branch)

1. **Verify Progress Classes in `theme.css` (RC-A)**:
   Lines 666–685 of `frontend/src/styles/theme.css` contain:
   ```css
   .fs-progress { ... }
   .fs-progress-bar { ... }
   .fs-progress--warning .fs-progress-bar { background: var(--fs-warning); }
   .fs-progress--negative .fs-progress-bar { background: var(--fs-negative); }
   ```
   Both base and modifier classes are pre-existing from Phase 2E.

2. **Verify `.eslintignore` Pre-Condition State (HB-B)**:
   Command:
   ```powershell
   git grep -in "expenditure" frontend/.eslintignore
   ```
   Verified Output:
   ```
   frontend/.eslintignore:51:src/pages/expenditure/BudgetsPage.js
   frontend/.eslintignore:52:src/pages/expenditure/ExpenditureAnalysisPage.js
   frontend/.eslintignore:53:src/pages/expenditure/RecurringSuggestionsPage.js
   frontend/.eslintignore:54:src/pages/expenditure/RulesPage.js
   ```
   *Note*: The 4B walkthrough ran `git grep -n "Expenditure"` with a capital "E", which matched only `ExpenditureAnalysisPage.js` due to case sensitivity. All 4 files above are verified present. `RecurringBills.js` is not in `.eslintignore` (it was never ignored).  
   > [!IMPORTANT]
   > If the grep output does not match the 4 expected entries above, HALT and investigate before opening the branch.

3. **Verify Baseline Snapshot Pre-Existence in `D:\Projects\FinStat-visual-baselines` (RC-E)**:
   All 25 snapshots (5 routes $\times$ 5 viewports) pre-exist:
   - `expenditures-rules-{1440,1024,768,480,390}.png`
   - `expenditures-budgets-{1440,1024,768,480,390}.png`
   - `expenditures-recurring-{1440,1024,768,480,390}.png`
   - `expenditures-bills-{1440,1024,768,480,390}.png`
   - `expenditure-analysis-{1440,1024,768,480,390}.png`  
   All 25 will be in-place replacements. Net baseline manifest count remains **334/334**.

---

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
- Eliminate all 10 inline styles.
- Wrap create, edit, delete, and test triggers with `<ProtectedAction tooltip="View-only access">` (Invariant I4).
- Use `Button` primitive for action controls (`variant="primary"`, `variant="secondary"`).
- Style priority indicators using `<Badge tone="neutral" label={`Priority ${rule.priority}`}>`.

#### [MODIFY] `frontend/src/pages/expenditure/RulesPage.css`
- Scope all rules under `.fs-page .rules-page-container`.
- De-escalate button gradients to FinStat tokens (`--fs-accent` with `--fs-ink`, `--fs-surface-raised` with `--fs-border`).
- Convert rule cards to `--fs-surface` (`#1a1c20`) with 1px border `--fs-border` (`#34383f`) and 6px radius (`--fs-radius-md`).
- Active rule toggle indicator styled with `--fs-accent`.
- Replace raw hex colors with token variables (`--fs-text`, `--fs-text-2`, `--fs-text-3`). Zero tone tokens in page CSS.

---

### 3.3 Budgets Page (`BudgetsPage.js` & `BudgetsPage.css`)

#### [MODIFY] `frontend/src/pages/expenditure/BudgetsPage.js`
- Wrap outer element: `<div className="fs-page budgets-page-container">`.
- Header: `<PageHeader title="Budget Tracker" subtitle="Monitor category limits, period spending thresholds, and variance" />`.
- Mount `<ExpenditureSubNav />`.
- Replace loading text with `<Loading variant="table" text="Calculating budget progress..." />`.
- Eliminate all 53 inline styles.
- **Budget Threshold Implementation (§4.3.1 — HB-2 fix)**:
  ```jsx
  // Calculate tone modifier class per §4.3.1 source fidelity (pct > 100)
  const getProgressModifier = (pct) => {
    if (pct > 100) return 'fs-progress--negative';
    if (pct >= 80) return 'fs-progress--warning';
    return ''; // neutral under 80%
  };
  ```
- Render progress track and bar (RC-F & RC-9):
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
- Outer element: `<div className="fs-page recurring-bills-container" data-testid="recurring-bills-page">` (`data-testid="recurring-bills-page"` pre-exists on line 230 and is preserved per I5 — RC-H).
- Header: `<PageHeader title="Recurring Bills & Schedules" subtitle="Track subscriptions, utilities, and scheduled payments with automatic due-date roll-forward" />`.
- Mount `<ExpenditureSubNav />`.
- Replace spinners with `<Loading variant="table" text="Loading bills and schedules..." />`.
- Eliminate the 1 inline style on line 320 (`textTransform: 'capitalize'`).
- **Status Chips with `Badge` Primitive (HB-3, RC-3 & RC-D fix)**:
  Rewrite `getBillStatus` to return semantic props `{ tone, label }`:
  ```jsx
  const getBillStatus = (bill) => {
    if (!bill.isActive) {
      return { tone: 'neutral', label: 'Paused' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(bill.nextDueDate);
    dueDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { tone: 'negative', label: 'Overdue' };
    }
    if (diffDays <= 3) {
      return { tone: 'warning', label: 'Due Soon' };
    }
    return { tone: 'neutral', label: 'Active' };
  };
  ```
  In JSX:
  ```jsx
  const status = getBillStatus(bill);
  <Badge tone={status.tone} label={status.label}>
    {status.label}
  </Badge>
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
- Add missing tabs so all 8 cluster routes are reachable from the sub-nav:
  - `/expenditures/bills` ("Bills & Schedules", short: "Bills")
  - `/expenditure-analysis` ("Spending Analysis", short: "Analysis")
- Retain `active` detection based on `location.pathname`.
- Both new tabs point to existing routes in `App.js`; no route is added or changed (Invariant I1 preserved — RC-G).

#### [MODIFY] `frontend/src/pages/expenditure/ExpenditureSubNav.css`
- Retire the legacy unscoped `.expenditure-subnav-*` rules now that all 8 expenditure routes are allowlisted under `.fs-page` (RC-4 fix).
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

## 5. Invariant Compliance Checklist (Action Plan §2 Verbatim)

The table below is copied verbatim from `docs/UI-UX_Plan/UI-UX-PLAN.md` §2. Every invariant will be evidenced in the sub-phase walkthrough.

| # | Rule (Verbatim from Action Plan §2) | Verification Method |
| :--- | :--- | :--- |
| **I1** | Production routes and URLs unchanged — 75 entries (74 protected + `*`), 10 redirects. | `App.test.js` route-resolution test; `ui-coverage.js` diff |
| **I2** | No API call, payload shape, or service file changed. | PR diff review; blocked path list in CI |
| **I3** | No calculation changed on **any** page: payroll, installment schedules, debt payoff, trade P&L, certificate maturity/interest, FX conversion, budget thresholds, real-estate yield. | Characterization fixtures (§9.6) |
| **I4** | Auth, roles, `ProtectedAction`, and `useCanModify` gating unchanged. | Viewer-role checklist per phase |
| **I5** | Test IDs, `data-*` attributes, and accessible labels preserved — 37 `data-testid`, 39 `aria-label`. | test-ID guard script (§9.2) |
| **I6** | Tables render as compact-expand cards at ≤ 768px (D19). Horizontal scroll preserved only for tables with ≥ 12 columns (audit logs) where the card pattern is impractical. No page-level horizontal scroll at 390px. | 390 px visual check: card layout renders, no page-level horizontal scroll, all fields reachable via expander. |
| **I7** | No page loses functionality mid-migration. | Pattern added only in the converting PR (§6.3) |
| **I8** | Dashboard coordinator line cap preserved — `DashboardSummary.js` must remain $\le 120$ lines (post-audit architecture decomposition invariant). All 10 RTL dashboard tests must remain green. | Line count assertion + `npm test` in 3A |
| **I9** | Production build passes with zero errors and no new warnings. | CI (authoritative); local proxy via `npm start` + ESLint/stylelint (§15) |
| **I10** | `npm test -- --watchAll=false` passes for touched modules **and** the app route suite. | CI (frontend test job added in 1C); local proxy: touched suites via `npx jest --runInBand` (§15) |
| **I11** | No new `!important`; a file's count in the 1C lint ratchet may only fall. | stylelint + `lint-ratchet.js` (§9.2) |
| **I12** | No new dependency except the Phase 1C tooling list (§9.2). | `package.json` review |
| **I13** | Every non-allowlisted route is pixel-identical to its 1B baseline. | Walkthrough-evidenced per §7.1: developer-run Playwright diff report attached to each phase walkthrough, with zero unexplained diffs. |
| **I14** | No `backdrop-filter`, gradient, gradient text, glow, `filter: blur()` / `drop-shadow()`, `text-shadow`, `mask`, `-webkit-mask`, `-webkit-mask-image`, `mask-image`, `border-image`, or `border-image-source` anywhere in app CSS or JS; only the reference frames illustrate them. | stylelint (§9.2) |
| **I15** | Neutral by default: a tone encodes **deviation from expectation or attention**, never the sign of an ordinary amount. Expense amounts, income, and balances are neutral (§4.3). A page never references a tone token directly; it uses `Delta`, `Badge`, or a `.fs-progress--*` modifier. | stylelint + `lint-tones.js` + §4.3 domain table + §7.2 |
| **I16** | No radius above 8 px except `var(--fs-radius-pill)` on status chips and avatars. | stylelint (§9.2) |

---

## 6. Walkthrough Progress Log Template (§10)

```
Sub-phase:   UI Phase 4C: Expenditure Cluster Completion
Status:      DONE
Done:        Converted 5 expenditure routes to dark graphite tokens; eliminated all 117 inline styles; modernized 5 charts on /expenditure-analysis with chartTheme.js; budget threshold source fidelity (pct > 100); mobile cards on /expenditures/bills (D19); Tabs primitive on /expenditures/recurring; dual-mode sub-nav retired; removed 4 remaining files from .eslintignore (0 warnings); 25 visual baselines updated; 0 diff on 56 unallowlisted routes; manifest 334/334 verified.
Next:        UI Phase 5A: Payroll & Salary Overview
Blocked by:  None
Allowlist:   THEMED_PATTERNS expanded to 9 routes (+5: /expenditures/rules, /expenditures/budgets, /expenditures/recurring, /expenditures/bills, /expenditure-analysis)
Visual diff: 0 diff across 56 unallowlisted routes; exactly 5 accepted diffs (25 snapshots regenerated)
Fixtures:    calculations.spec.js passing 100% (byte-identical)
Screenshots: Captured across 5 viewports (1440, 1024, 768, 480, 390)
Branch:      phase-ui-4c-expenditure-cluster
Merge SHA:   <pending merge to main>
```
