# Implementation Plan — UI Phase 4C: Expenditure Cluster Completion (v1)

> **Sub-phase**: UI Phase 4C  
> **Target Routes**:  
> 1. `/expenditures/rules` (`RulesPage.js`)  
> 2. `/expenditures/budgets` (`BudgetsPage.js`)  
> 3. `/expenditures/recurring` (`RecurringSuggestionsPage.js`)  
> 4. `/expenditures/bills` (`RecurringBills.js`)  
> 5. `/expenditure-analysis` (`ExpenditureAnalysisPage.js`)  
> **Status**: Ready for Planning & Review  
> **Precondition**: UI Phase 4B merged to `main` at commit `9e49604`  

---

## 1. Goal Description & Scope

UI Phase 4C is the concluding sub-phase of **Phase 4: Expenditure Ledger & Analytics** (§6.8). It migrates the five remaining expenditure routes to FinStat's dark graphite design system:
1. **Auto-Categorization Rules** (`/expenditures/rules`): Rule engine management cards, condition builders, simulator modal, and active toggles.
2. **Budget Tracker** (`/expenditures/budgets`): Period selector, budget progress meters adhering to §4.3.1 threshold rules, KPI metrics, and budget create/edit modals.
3. **Recurring Expense Automation** (`/expenditures/recurring`): Statistical detection scanner, pending/accepted recurrence cards, frequency actions, and accept modal.
4. **Recurring Bills & Schedules** (`/expenditures/bills`): Bill calendar, upcoming payments, payment status chips, and bill action modals with mobile card collapse (D19).
5. **Spending Analysis** (`/expenditure-analysis`): Themed multi-series monthly comparison bar chart, accessible ranked horizontal category bar chart capped at six series with "Other" (§4.12, G2), data-table alternative, and KPI tiles.

### Objectives:
- **Allowlist Expansion**: Add all 5 routes to `THEMED_PATTERNS` in `ProtectedRoute.js`, bringing cumulative allowlist coverage to **9 routes** (all 7 Expenditure routes now fully themed).
- **Inline Style Elimination**: Eliminate all **117 legacy inline styles** across the 5 files (`BudgetsPage.js`: 53, `ExpenditureAnalysisPage.js`: 32, `RecurringSuggestionsPage.js`: 21, `RulesPage.js`: 10, `RecurringBills.js`: 1).
- **ESLint Hygiene**: Remove all 4 remaining expenditure files from `frontend/.eslintignore` (`BudgetsPage.js`, `ExpenditureAnalysisPage.js`, `RecurringSuggestionsPage.js`, `RulesPage.js`), achieving zero ignored files in the expenditure domain.
- **Design System Conformance**:
  - All pages wrapped in `.fs-page` shell with `<PageHeader>`, `<ExpenditureSubNav />`, and `<Loading>` primitives.
  - Strict 8px border-radius ceiling (`--fs-radius-sm`: 4px, `--fs-radius-md`: 6px, `--fs-radius-lg`: 8px). Pill radius banned on buttons.
  - Zero tone tokens directly in page CSS (`lint-tones.js` compliance).
  - Dark graphite surfaces (`#101114` canvas, `#1a1c20` surfaces, `#22252a` raised panels, `#34383f` borders).
  - Interactive accent teal (`#14b8a6`) reserved exclusively for interactive controls with `#101114` ink text (never white).
- **Chart Accessibility (§4.12, G2)**:
  - Migrate `ExpenditureAnalysisPage.js` from uncapped raw-color Pie charts to `chartTheme.js` compliant ranked horizontal bar charts capped at 6 series with remainder grouped into "Other".
  - Provide accessible data-table equivalents and canvas `aria-label` text.
- **Budget Threshold Fidelity (§4.3.1)**:
  - Progress meters display neutral fill below 80%, `.fs-progress--warning` at 80–100% (`Warning`), and `.fs-progress--negative` over 100% (`Over budget`).
  - `tests/fixtures/calculations/budgets.snapshot.json` characterization fixtures remain 100% passing.
- **Visual Regression Gate (Invariant I13)**:
  - 0 diff across all **56 unallowlisted routes**.
  - Exactly 5 accepted diffs (25 baseline replacement snapshots at `1440px`, `1024px`, `768px`, `480px`, `390px`) verified in `D:\Projects\FinStat-visual-baselines` (manifest 334/334).

---

## 2. User Review Required & Design Decisions

> [!IMPORTANT]
> ### 1. Chart Modernization on `/expenditure-analysis` (§4.12 & Decision D14)
> Legacy `ExpenditureAnalysisPage.js` currently renders multiple multi-colored `Pie` charts with raw hex colors mapping directly to category colors (`EXPENDITURE_CATEGORIES.map(c => c.color)`).
> Per **§4.12 Series Discipline (G2)** and **§4.3 Rule 4**:
> - Doughnuts/Pies are strictly banned for category breakdowns with $> 4$ segments.
> - The category breakdown will be rendered as a **ranked horizontal bar chart** (capped at 6 series + neutral "Other") plus an **accessible tabular data alternative**.
> - The monthly volume chart (Withdrawals, Top-ups, Savings) will use `chartTheme.js` palette (`grey1`, `grey2`, `grey3`) with accessible legend and canvas `aria-label`.
> - The test suite in `ExpenditureAnalysisPage.test.js` only inspects `data-testid="bar-chart"` datasets (which remain intact).

> [!TIP]
> ### 2. Sub-Navigation Completion Across All 5 Pages
> Currently, `RulesPage`, `BudgetsPage`, and `RecurringSuggestionsPage` render `<ExpenditureSubNav />`.
> For cluster consistency, `RecurringBills.js` and `ExpenditureAnalysisPage.js` will also receive `<ExpenditureSubNav />` below `<PageHeader>`, ensuring seamless cluster navigation across all 7 expenditure ledger and analytics routes.

> [!NOTE]
> ### 3. Baseline Replacements vs Additions
> All 5 routes already have pre-existing baseline captures in `FinStat-visual-baselines` from Phase 1C/1B. The 25 snapshots (5 routes $\times$ 5 viewports) will be **in-place replacements**, maintaining total baseline count at **334**.

---

## 3. Proposed Changes

```
frontend/
├── src/
│   ├── components/
│   │   ├── ProtectedRoute.js                           # [MODIFY] Expand THEMED_PATTERNS with 5 routes
│   │   └── __tests__/
│   │       └── ProtectedRoute.test.js                  # [MODIFY] Assert 9 allowlisted routes
│   ├── pages/
│   │   └── expenditure/
│   │       ├── Expenditure.css                         # [MODIFY] Scoped rules for analysis & shared cards
│   │       ├── RulesPage.js                            # [MODIFY] Wrap .fs-page, eliminate 10 inline styles
│   │       ├── RulesPage.css                           # [MODIFY] Tokenize rule cards, conditions, modals
│   │       ├── BudgetsPage.js                          # [MODIFY] Wrap .fs-page, eliminate 53 inline styles
│   │       ├── BudgetsPage.css                         # [MODIFY] Tokenize budget cards, meters, KPI strip
│   │       ├── RecurringSuggestionsPage.js             # [MODIFY] Wrap .fs-page, eliminate 21 inline styles
│   │       ├── RecurringSuggestionsPage.css            # [MODIFY] Tokenize suggestion cards, tab bar
│   │       ├── RecurringBills.js                       # [MODIFY] Wrap .fs-page, eliminate 1 inline style, add D19 cards
│   │       ├── RecurringBills.css                      # [MODIFY] Tokenize bill calendar, tables, status chips
│   │       ├── ExpenditureAnalysisPage.js              # [MODIFY] Wrap .fs-page, eliminate 32 inline styles, chartTheme
│   │       └── __tests__/
│   │           ├── RulesPage.test.js                   # [NEW] Unit + a11y tests for rules
│   │           ├── BudgetsPage.test.js                 # [NEW] Unit + a11y tests for budget progress
│   │           ├── RecurringSuggestionsPage.test.js    # [NEW] Unit + a11y tests for recurring scanner
│   │           ├── RecurringBills.test.js              # [MODIFY] Update for dark classes + jest-axe
│   │           └── ExpenditureAnalysisPage.test.js     # [MODIFY] Preserve bar-chart dataset tests + jest-axe
├── tests/
│   └── visual/
│       └── expenditure-cluster-reference-match.spec.js # [NEW] Playwright reference suite for all 5 routes
└── .eslintignore                                       # [MODIFY] Remove 4 expenditure files
```

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

Update `ProtectedRoute.test.js` to assert `true` for all 9 routes and `false` for unallowlisted routes (`/salary/profiles`, `/trades`, `/reports`, etc.).

---

### 3.2 Rules Page (`RulesPage.js` & `RulesPage.css`)

#### [MODIFY] `frontend/src/pages/expenditure/RulesPage.js`
- Wrap container in `<div className="fs-page">`.
- Replace custom header with `<PageHeader title="Auto-Categorization Rules" subtitle="Automate transaction category tagging with priority-based pattern matching" />`.
- Mount `<ExpenditureSubNav />`.
- Replace raw spinners with `<Loading variant="card" text="Loading categorization rules..." />`.
- Eliminate all 10 inline styles (button flex, condition spacing, priority badges, modal inputs).
- Wrap create, edit, delete, and test triggers with `<ProtectedAction tooltip="View-only access">` (Invariant I4).
- Use `Button` primitive for action controls (`.fs-btn-primary`, `.fs-btn-secondary`).

#### [MODIFY] `frontend/src/pages/expenditure/RulesPage.css`
- Scope all rules under `.fs-page .rules-page-container`.
- De-escalate `.btn-primary` and `.btn-secondary` gradient fills to FinStat tokens (`--fs-accent` with `--fs-ink`, `--fs-surface-raised` with `--fs-border`).
- Convert rule cards to `--fs-surface` (`#1a1c20`) with 1px border `--fs-border` (`#34383f`) and 6px radius (`--fs-radius-md`).
- Active rule toggle indicator styled with `--fs-accent`.
- Replace raw hex colors (`#111827`, `#6b7280`, `#3b82f6`) with token variables (`--fs-text`, `--fs-text-2`, `--fs-text-3`).

---

### 3.3 Budgets Page (`BudgetsPage.js` & `BudgetsPage.css`)

#### [MODIFY] `frontend/src/pages/expenditure/BudgetsPage.js`
- Wrap container in `<div className="fs-page">`.
- Header: `<PageHeader title="Budget Tracker" subtitle="Monitor category limits, period spending thresholds, and variance" />`.
- Mount `<ExpenditureSubNav />`.
- Replace loading text with `<Loading variant="table" text="Calculating budget progress..." />`.
- Eliminate all 53 inline styles (card widths, progress bar inline width, text colors, flex layouts, remaining amount badges).
- Progress Bar Threshold Implementation (§4.3.1):
  ```jsx
  // Calculate severity class per §4.3.1
  const getProgressClass = (pct) => {
    if (pct >= 100) return 'fs-progress-bar fs-progress--negative';
    if (pct >= 80) return 'fs-progress-bar fs-progress--warning';
    return 'fs-progress-bar'; // neutral under 80%
  };
  ```
- Budget Progress Bar Markup:
  ```jsx
  <div className="fs-progress-track" role="progressbar" aria-valuenow={bp.percentageUsed} aria-valuemin="0" aria-valuemax="100" aria-label={`${bp.category} budget progress`}>
    <div
      className={getProgressClass(bp.percentageUsed)}
      style={{ width: `${Math.min(bp.percentageUsed, 100)}%` }}
    />
  </div>
  ```
  *(Note: `style={{ width: ... }}` is strictly allowed for dynamic progress widths per lint rules; tone is applied via class).*
- Badges: Replace tinted remaining tags with `<Badge variant={bp.percentageUsed >= 100 ? 'negative' : bp.percentageUsed >= 80 ? 'warning' : 'neutral'}>`.
- Mutation controls gated with `<ProtectedAction tooltip="View-only access">`.

#### [MODIFY] `frontend/src/pages/expenditure/BudgetsPage.css`
- Scope all rules under `.fs-page .budgets-page-container`.
- Tokenize KPI strip: `.budget-kpi-card` uses `--fs-surface`, 1px border, tabular numerals (`.fs-num`).
- Progress tracks: `--fs-surface-raised` background with 4px radius (`--fs-radius-sm`).
- Scoped progress fill rules:
  - Neutral (under 80%): `background: var(--fs-text-3);`
  - Warning (80–100%): `background: var(--fs-warning);`
  - Negative (over 100%): `background: var(--fs-negative);`

---

### 3.4 Recurring Suggestions Page (`RecurringSuggestionsPage.js` & `RecurringSuggestionsPage.css`)

#### [MODIFY] `frontend/src/pages/expenditure/RecurringSuggestionsPage.js`
- Wrap container in `<div className="fs-page">`.
- Header: `<PageHeader title="Recurring Expense Detection" subtitle="Statistical pattern detector identifies repeated bills and subscriptions from your ledger" />`.
- Mount `<ExpenditureSubNav />`.
- Replace spinners with `<Loading variant="card" text="Scanning recurring patterns..." />`.
- Eliminate all 21 inline styles (tab counts, card actions, amount text, flex spacing).
- Internal tabs: Rendered using FinStat tab pattern (`.fs-tabs`, `.fs-tab.active` with `--fs-accent` indicator).
- Suggestion cards: Render recurring frequency as neutral badge, amounts with `.fs-num`.
- Actions: "Accept" triggers accept modal; "Dismiss" triggers confirmation; both gated with `<ProtectedAction tooltip="View-only access">`.

#### [MODIFY] `frontend/src/pages/expenditure/RecurringSuggestionsPage.css`
- Scope all rules under `.fs-page .recur-page-container`.
- Card container: `--fs-surface`, 1px border, hover elevation `--fs-surface-raised`.
- Badges: Neutral surface counters with `--fs-text-2`.

---

### 3.5 Recurring Bills Page (`RecurringBills.js` & `RecurringBills.css`)

#### [MODIFY] `frontend/src/pages/expenditure/RecurringBills.js`
- Wrap container in `<div className="fs-page">`.
- Header: `<PageHeader title="Recurring Bills & Schedules" subtitle="Track subscriptions, utilities, and scheduled payments with automatic due-date roll-forward" />`.
- Mount `<ExpenditureSubNav />`.
- Replace spinners with `<Loading variant="table" text="Loading bills and schedules..." />`.
- Eliminate inline styles.
- **Mobile Responsive Pattern (Decision D19)**:
  - Desktop: Render dense bills table with tabular amounts.
  - Mobile ($\le 768\text{px}$ / $390\text{px}$): Conditionally collapse bills into vertical cards with status badges, due date, payment method, and actions.
- Status Chips (§4.3.1):
  - `Overdue` (`diffDays < 0`): `<Badge variant="negative">Overdue</Badge>`
  - `Due Soon` (`diffDays <= 3`): `<Badge variant="warning">Due Soon</Badge>`
  - `Active` (`diffDays > 3`): `<Badge variant="neutral">Active</Badge>`
  - `Paused` (`!bill.isActive`): `<Badge variant="neutral">Paused</Badge>`
- Payment actions gated with `<ProtectedAction tooltip="View-only access">`.

#### [MODIFY] `frontend/src/pages/expenditure/RecurringBills.css`
- Scope all rules under `.fs-page .recurring-bills-container`.
- Tokenize KPI grid and summary tiles.
- Calendar strip: Dark graphite calendar days with subtle border highlight on active/due dates.
- Modal styling: Integrate with FinStat shared modal styles.

---

### 3.6 Spending Analysis Page (`ExpenditureAnalysisPage.js` & `Expenditure.css`)

#### [MODIFY] `frontend/src/pages/expenditure/ExpenditureAnalysisPage.js`
- Wrap container in `<div className="fs-page">`.
- Header: `<PageHeader title="Spending Analysis" subtitle="Annual and multi-year expenditure trends, volume breakdowns, and category distributions" />`.
- Mount `<ExpenditureSubNav />`.
- Eliminate all 32 inline styles (summary card backgrounds, search inputs, flex containers, chart height wrappers).
- **Chart.js Modernization (§4.12 & Decision D14)**:
  - Import `getChartPalette`, `baseChartOptions`, `barDefaults`, `withAlpha`, `ariaLabel` from `../../styles/chartTheme`.
  - **Category Breakdown Modernization**:
    - Replace raw-color pie chart with **ranked horizontal bar chart** (`Bar` with `options.indexAxis = 'y'`).
    - Cap at top 6 categories by volume; aggregate remaining categories into neutral `"Other"`.
    - Provide adjacent accessible data table displaying full un-truncated breakdown with percentages and amounts.
  - **Monthly Volume Comparison**:
    - Update `barChartData` datasets (Withdrawals, Top-ups, Savings) to use `chartTheme.js` palette:
      - Withdrawals: `palette.grey1` (`#8b929b`)
      - Top-ups: `palette.grey2` (`#b8bec6`)
      - Savings: `palette.grey3` (`#6a7078`)
    - Apply `baseChartOptions` for dark grid lines, tooltips, and IBM Plex fonts.
    - Preserve `data-testid="bar-chart"` and dataset indexing to ensure existing unit tests in `ExpenditureAnalysisPage.test.js` remain green.

#### [MODIFY] `frontend/src/pages/expenditure/Expenditure.css`
- Add scoped rules for analysis summary cards, search filter toolbar, and chart card containers under `.fs-page .expenditure-analysis-container`.

---

### 3.7 Tooling & Linting (`frontend/.eslintignore`)

#### [MODIFY] `frontend/.eslintignore`
Delete the 4 remaining expenditure ignore lines:
- Line 51: `src/pages/expenditure/BudgetsPage.js`
- Line 52: `src/pages/expenditure/ExpenditureAnalysisPage.js`
- Line 53: `src/pages/expenditure/RecurringSuggestionsPage.js`
- Line 54: `src/pages/expenditure/RulesPage.js`

Verify `git grep -n "expenditure" frontend/.eslintignore` returns **0 matches**.

---

## 4. Verification & Testing Plan

### 4.1 Automated Script Verification Commands

```powershell
# 1. Verify Design Tokens integrity and contrast tables
node frontend/scripts/tokens.js --check

# 2. Verify Tone Scoping & Undefined Tokens (Invariant I15)
node frontend/scripts/lint-tones.js

# 3. Verify Test ID & ARIA Preservation (Invariant I5)
node frontend/scripts/testid-guard.js

# 4. Verify Stylelint Ratchet (Invariant I11)
node frontend/scripts/lint-ratchet.js

# 5. Assert Exact Allowlist Match (Invariant I4)
node frontend/scripts/ui-coverage.js --assert-allowlist

# 6. Verify Baseline Manifest Integrity (334/334 baselines)
node frontend/scripts/verify-baseline-manifest.js

# 7. Verify zero expenditure files in .eslintignore
git grep -n "expenditure" frontend/.eslintignore
```

---

### 4.2 Targeted Unit & Accessibility Test Suites

```powershell
# Run all expenditure unit tests + route tests in single-worker mode (Invariant I10)
npm --prefix frontend test -- --watchAll=false `
  src/pages/expenditure/__tests__/RulesPage.test.js `
  src/pages/expenditure/__tests__/BudgetsPage.test.js `
  src/pages/expenditure/__tests__/RecurringSuggestionsPage.test.js `
  src/pages/expenditure/__tests__/RecurringBills.test.js `
  src/pages/expenditure/__tests__/ExpenditureAnalysisPage.test.js `
  src/components/__tests__/ProtectedRoute.test.js `
  src/App.test.js
```

All suites must include `expectNoA11yViolations` (`jest-axe`) and assert `<ProtectedAction>` viewer role gating.

---

### 4.3 Playwright Reference Match & Visual Regression Suites

```powershell
# 1. Compile production build with memory safety
cd frontend
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# 2. Run Playwright reference match suite (CI mode)
$env:CI="true"
npx playwright test --project=reference

# 3. Regenerate baselines for the 5 Phase 4C routes (25 snapshots)
# Target viewports: 1440, 1024, 768, 480, 390
# Verify manifest integrity in FinStat-visual-baselines
node frontend/scripts/verify-baseline-manifest.js

# 4. Run PR subset visual regression suite
$env:CI="true"
$env:PR_SUBSET="true"
npx playwright test --project=pr-subset
# Assert 71 passed, 0 diff across all 56 unallowlisted routes
```

---

### 4.4 Manual Verification Checklist

1. **Auto-Categorization Rules (`/expenditures/rules`)**:
   - Create a new rule (`description contains "Spotify" -> Subscriptions`). Confirm rule appears in active list.
   - Click "Test Rules". Enter transaction note and verify simulator modal shows matched category.
   - Authenticate as `viewer` role; confirm Add, Edit, Delete, and Test actions render disabled with tooltip.
2. **Budget Tracker (`/expenditures/budgets`)**:
   - Verify budget progress meters:
     - Under 80%: Neutral grey bar with no warning tag.
     - 80% to 100%: Amber warning bar with `Warning` tag.
     - Over 100%: Red negative bar with `Over budget` tag.
   - Test period toggle (`Monthly` vs `Quarterly` vs `Yearly`).
3. **Recurring Suggestions (`/expenditures/recurring`)**:
   - Click "Scan Patterns Now"; verify pulse animation and suggestions population.
   - Click "Accept" on a suggestion; verify modal opens with pre-filled category/amount.
4. **Recurring Bills (`/expenditures/bills`)**:
   - Verify bills table on desktop (1440px) vs mobile cards (390px). Confirm `scrollWidth <= clientWidth` on mobile (no horizontal scroll).
   - Test "Pay Bill" quick action.
5. **Spending Analysis (`/expenditure-analysis`)**:
   - Confirm category breakdown renders as a ranked horizontal bar chart capped at 6 series + "Other".
   - Confirm data table alternative displays all category rows below the chart.
   - Confirm yearly volume comparison chart renders using monochrome grey palette.

---

## 5. Invariant Compliance Matrix (Action Plan §2)

| # | Text (verbatim from Action Plan §2) | Strategy for Phase 4C |
| :--- | :--- | :--- |
| **I1** | Production routes and URLs unchanged — 75 entries (74 protected + `*`), 10 redirects. | Verified by `App.test.js` and `ui-coverage.js --assert-allowlist`. Zero route paths modified. |
| **I2** | No API call, payload shape, or service file changed. | Zero backend changes; services (`ruleService`, `budgetService`, `recurringService`, `recurringBillService`, `expenditureService`) called with identical payloads. |
| **I3** | No calculation changed on **any** page. | Characterization fixtures in `calculations.spec.js` (including Domain 7 Budgets) remain untouched and green. |
| **I4** | Auth, roles, `ProtectedAction`, and `useCanModify` gating unchanged. | All mutate actions (create, edit, delete, scan, pay) wrapped with `<ProtectedAction tooltip="View-only access">`. |
| **I5** | Test IDs, `data-*` attributes, and accessible labels preserved — 37 `data-testid`, 39 `aria-label`. | All existing `data-testid` attributes preserved; verified clean by `testid-guard.js`. |
| **I6** | Tables render as compact-expand cards at ≤ 768px (D19). No page-level horizontal scroll at 390px. | Implemented for `RecurringBills` table and `ExpenditureAnalysis` data table; verified at 390px. |
| **I7** | No page loses functionality mid-migration. | All CRUD operations, simulators, filters, and period pickers remain fully functional. |
| **I8** | Dashboard coordinator line cap preserved — `DashboardSummary.js` $\le 120$ lines. | N/A to Phase 4C (Dashboard untouched). |
| **I9** | Production build passes with zero errors and no new warnings. | Verified via `npm run build` with `CI=true`. |
| **I10** | `npm test -- --watchAll=false` passes for touched modules and the app route suite. | All touched expenditure suites passing (single-worker mode). |
| **I11** | No new `!important`; a file's count in the 1C lint ratchet may only fall. | Verified by `lint-ratchet.js`. |
| **I12** | No new dependency except the Phase 1C tooling list. | `package.json` completely unchanged. |
| **I13** | Every non-allowlisted route is pixel-identical to its 1B baseline. | Playwright PR subset visual suite asserts 0 diff on all 56 unallowlisted routes. |
| **I14** | No `backdrop-filter`, gradient, gradient text, glow, `filter: blur()` / `drop-shadow()`, etc. | Verified by ESLint and Stylelint AST rules. |
| **I15** | Neutral by default: a tone encodes deviation from expectation or attention. | Verified by `lint-tones.js`. Tone tokens applied only via semantic classes. |
| **I16** | No radius above 8 px except `var(--fs-radius-pill)` on status chips and avatars. | Strict ceiling of 8px enforced by Stylelint. |
