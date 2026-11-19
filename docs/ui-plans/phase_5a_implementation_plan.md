# Implementation Plan — UI Phase 5A: Payroll Profiles, Rules & Taxes (v1)

> **Sub-phase**: UI Phase 5A  
> **Cluster**: Payroll & Salary Cluster (§6.9, Cluster 2)  
> **Taste Checkpoint**: Taste Checkpoint 3 (§6.1.1, Table §6.1.1 row 3: `/salary/profiles` vs Reference Frame 02 Variant B Form)  
> **Target Routes**:  
> 1. `/salary/profiles` (`pages/salary/SalaryProfilePage.js` + `SalaryForm.js` + `ComponentTable.js`)  
> 2. `/salary/rules` (`pages/salary/PayrollRulesHub.js` + `YearlyTaxTable.js`)  
> **Redirects Verified**:  
> - `/salary-profile` → `/salary/profiles`  
> - `/social-insurance` → `/salary/rules?tab=insurance`  
> - `/taxes` → `/salary/rules?tab=taxes`  
> **Status**: Ready for Execution (v1)  
> **Precondition**: UI Phase 4C merged to `main` at commit `a87c9a2`  
> - Verified via `git log --oneline -5 main`:  
>   `83a0494 fix(certificates): safely guard nextDue calculation against invalid dates and withdrawn status`  
>   `badc468 feat(certificates): fix interest cron catch-up and add manual payout controls`  
>   `a87c9a2 feat(ui): phase 4c expenditure cluster completion (#17)`  
> - Verified via `git branch --contains a87c9a2`: `* main`  

---

## 1. Goal Description & Scope

UI Phase 5A launches **Phase 5: Payroll & Salary** (§6.9). Payroll is the most calculation-sensitive and historically styled cluster in FinStat, carrying 190 inline styles across five core files. 

Sub-phase 5A migrates the core payroll definitions, rules, and statutory tax visualizers:
1. **Salary Profiles & Components** (`/salary/profiles`):
   - Active compensation cards, salary breakdown items, multiple profile grid, default profile toggles, and profile delete modals.
   - Initial profile creation and component composition via `SalaryForm.js` and `ComponentTable.js`.
   - Evaluated under **Taste Checkpoint 3** (§6.1.1) against **Canonical Reference Frame 02 (Variant B — Form)**.
2. **Payroll Rules & Statutory Visualizers** (`/salary/rules`):
   - Dual-tab rules hub hosting **Egyptian Income Tax Brackets** (Law 175/2023) and **Social Insurance Rules** (Law 148/2019).
   - Grand totals summary card, active bracket tier chips, and yearly historical tax tables via `YearlyTaxTable.js`.
   - Deep-linking query parameter synchronization (`?tab=taxes`, `?tab=insurance`).

### Key Objectives:
- **Allowlist Expansion**: Add `'/salary/profiles'` and `'/salary/rules'` to `THEMED_PATTERNS` in `ProtectedRoute.js`, bringing cumulative allowlist coverage from 9 to **11 routes**.
- **Inline Style Elimination**: Eliminate all **62 legacy inline styles** across the Phase 5A files:
  - `SalaryProfilePage.js`: 26
  - `PayrollRulesHub.js`: 17
  - `ComponentTable.js`: 13
  - `YearlyTaxTable.js`: 6
  - `SalaryForm.js`: 0
- **Orphan CSS Purge**: Permanently delete the 2 unreferenced orphan CSS files identified in Phase 1A (§6.9, §4.16):
  - `frontend/src/pages/salary/SalaryProfilePage.css` (0 imports across `src/`)
  - `frontend/src/pages/salary/PaycheckListPage.css` (0 imports across `src/`)
- **ESLint Hygiene**: Remove all 7 Phase 5A entries from `frontend/.eslintignore`:
  - `src/components/SalaryForm.js`
  - `src/components/salary/ComponentTable.js`
  - `src/pages/salary/PayrollRulesHub.js`
  - `src/pages/salary/SalaryProfilePage.js`
  - `src/pages/salary/__tests__/PayrollRulesHub.test.js`
  - `src/pages/salary/__tests__/SalaryProfileToggle.test.js`
  - `src/pages/taxes/YearlyTaxTable.js`
- **Design System Conformance**:
  - Dark graphite surfaces (`--fs-page-bg: #101114`, recessed chrome shell `--fs-chrome-bg: #0c0d0f`, surface `--fs-card-bg: #16181d`, border `--fs-border: #23272f`).
  - Strict 8px border-radius ceiling (`--fs-radius-sm`: 4px, `--fs-radius-md`: 6px, `--fs-radius-lg`: 8px, `--fs-radius-pill` reserved strictly for status chips and avatars).
  - Interactive accent teal (`--fs-accent: #14b8a6`) reserved exclusively for interactive controls with ink text (`--fs-ink: #101114`). White text on accent is strictly banned.
  - Zero tone tokens directly in page CSS (`lint-tones.js` and Invariant I15 compliance). Shared tone classes from `theme.css` used exclusively.
- **Mobile Responsive Pattern (D19)**:
  - At viewports $\le 768$px, `ComponentTable.js`, `PayrollRulesHub.js` bracket tables, and `YearlyTaxTable.js` collapse into compact-expand vertical cards with touch targets $\ge 44$px. Zero page-level horizontal scroll at 390px.
- **Calculation Invariance (Invariant I3)**:
  - Zero modifications to statutory payroll tax math, social insurance rate calculations, or tier lookups. `tests/calculations.spec.js` must remain 100% byte-identical (11/11 passing).
- **Visual Regression Gate (Invariant I13)**:
  - Exactly 2 accepted diffs (10 baseline replacement snapshots: 2 routes $\times$ 5 viewports at 1440px, 1024px, 768px, 480px, 390px) committed in `D:\Projects\FinStat-visual-baselines`.
  - 0 diff across all **54 unallowlisted routes** (65 total routes minus 11 allowlisted = 54).

---

## 2. User Review Required & Design Decisions

> [!IMPORTANT]
> ### 1. Taste Checkpoint 3 Alignment (§6.1.1 & Reference Frame 02 Variant B Form)
> Per §6.1.1, the first sub-phase of every cluster requires developer taste sign-off against its reference frame.
> `/salary/profiles` is evaluated against **Reference Frame 02 (Variant B — Form)** (`docs/UI-UX_Plan/reference/02-form.html`):
> - **Stacked Field Cards**: Compensation sections (Basic Salary, Fixed Allowances, Variable Inflows, Deductions) are presented as clean stacked graphite surface cards with recessed card headers.
> - **Inline Error & State Placement**: Field validations and component count badges display inline using `--fs-text-3` and semantic badge primitives.
> - **Safe Neutral Discard**: Discard, cancel, and back actions use subtle neutral buttons (`.fs-btn-ghost`), never loud red borders or warning washes.
> - **Single Accent CTA**: Only the primary action ("Save Profile" or "Add Component") carries the interactive teal `.fs-btn-primary`.

> [!WARNING]
> ### 2. Elimination of Pastel Rate Gradient Inline Styles in Tax Tables
> In `PayrollRulesHub.js` (line 170) and `YearlyTaxTable.js` (line 15), legacy code implemented dynamic pastel rainbow row backgrounds:
> ```javascript
> // LEGACY ANTI-PATTERN (VIOLATES INVARIANTS I14 & I15):
> const getColorForRate = (rate) => {
>   const hue = Math.max(0, 120 - normalized * 3.5 * 120);
>   return `hsl(${hue}, 70%, 94%)`; // Light-mode pastel fill
> };
> ```
> In the dark graphite theme, these pastel `hsl()` styles destroy contrast (yielding unreadable 1.2:1 contrast with white text) and violate Invariant I15 (colour encodes deviation, not bracket level).
> **Solution**:
> - Eliminate `getColorForRate` and `getColorForLevel`.
> - Render bracket rows on standard dark graphite alternating table surfaces (`--fs-surface` and `--fs-surface-raised`).
> - The tax rate / level is displayed with clear tabular numeric alignment (`.fs-num`), with bracket tier pills using neutral status chips (`.fs-badge`).

> [!TIP]
> ### 3. Cluster Tab Bar Dual-Mode Continuity (§6.9, §4.16)
> Per §6.9: *"PayrollRulesHub.js: tab bar stays dual-mode until 5E."*
> The tabs in `PayrollRulesHub.js` navigate between Taxes and Social Insurance rules, with a link to the Tax Simulator.
> While `/salary/rules` is themed in 5A, `/salary/simulator` is converted in 5E.
> Therefore:
> - The tab strip in `PayrollRulesHub.js` will use `.fs-tabs` under `.fs-page` with proper `aria-selected` and `role="tab"`.
> - Unscoped fallback rules in CSS are preserved so that unmigrated routes referencing these tabs retain their appearance until 5E.

> [!NOTE]
> ### 4. Deletion of 2 Verified Orphan CSS Files (§6.9)
> Phase 1A audit verified that two CSS files on disk have zero imports anywhere in `src/`:
> 1. `frontend/src/pages/salary/SalaryProfilePage.css`
> 2. `frontend/src/pages/salary/PaycheckListPage.css`
> Both files will be deleted in git during this phase, reducing dead bundle weight and satisfying the §6.9 exit task.

---

## 3. Detailed Proposed Changes

```
frontend/src/
├── components/
│   ├── ProtectedRoute.js                  # [MODIFY] Allowlist /salary/profiles and /salary/rules
│   ├── SalaryForm.js                      # [MODIFY] Convert to graphite form card, remove raw styling
│   └── salary/
│       ├── ComponentTable.js              # [MODIFY] Eliminate 13 inline styles, D19 mobile collapse
│       └── ComponentTable.css             # [MODIFY] Light -> graphite tokens, 8px radius ceiling
├── pages/
│   ├── salary/
│   │   ├── SalaryProfilePage.js           # [MODIFY] Eliminate 26 inline styles, .fs-page + PageHeader + Loading
│   │   ├── SalaryProfile.css              # [MODIFY] Light -> graphite conversion, dark cards
│   │   ├── SalaryProfilePage.css          # [DELETE] Orphan CSS file deleted
│   │   ├── PaycheckListPage.css           # [DELETE] Orphan CSS file deleted
│   │   └── PayrollRulesHub.js             # [MODIFY] Eliminate 17 inline styles, dark tabs & cards
│   └── taxes/
│       ├── TaxesPage.css                  # [MODIFY] Tokenize classes, remove #009879 teal and light bgs
│       └── YearlyTaxTable.js              # [MODIFY] Eliminate 6 inline styles, remove getColorForLevel
└── .eslintignore                          # [MODIFY] Purge 7 Phase 5A entries
```

---

### 3.1 Route Allowlist Expansion (`frontend/src/components/ProtectedRoute.js`)

#### [MODIFY] `frontend/src/components/ProtectedRoute.js`
Expand `THEMED_PATTERNS` to include `'/salary/profiles'` and `'/salary/rules'`:

```diff
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
+  '/salary/profiles',
+  '/salary/rules',
 ];
```

---

### 3.2 Salary Profiles Page (`frontend/src/pages/salary/SalaryProfilePage.js` & `SalaryProfile.css`)

#### [MODIFY] `frontend/src/pages/salary/SalaryProfilePage.js`
- Wrap entire page in `<div className="fs-page">`.
- Replace legacy `.page-header` with `<PageHeader title="Salary Profile" subtitle="Manage your salary components, compensation structure, and history">`.
- Header action links styled via `.fs-btn .fs-btn-secondary` and primary CTA via `.fs-btn .fs-btn-primary`.
- Loading state uses `<Loading variant="screen" />` (Invariant I10 / D23).
- Eliminate all 26 inline styles:
  - Lines 96, 138, 151, 171: Replace inline padding/margin with CSS classes `.salary-empty-state`, `.salary-card-actions`.
  - Lines 190, 194, 195, 198: Replace hardcoded `#0d9488`, `#2c3e50`, `#6c757d` with tokens via `.fs-btn` utility classes.
  - Lines 210, 228, 254: Replace card container margins and `#7f8c8d` with `.salary-profile-card` and `--fs-text-3`.
  - Lines 269, 275: Replace `#2c3e50` button background with `.fs-btn-secondary`.
  - Lines 284, 285, 292, 294, 295, 300, 301, 303, 308, 314, 323: Multiple profiles section converted to graphite grid `.salary-profiles-grid` with tokenized status badges (`.fs-badge`).
- Invariant I4 / `ProtectedAction` wrapping preserved verbatim on all mutations (edit, update, set default, delete).
- Invariant I5: All existing labels and test IDs preserved.

#### [MODIFY] `frontend/src/pages/salary/SalaryProfile.css`
- Scope all rules under `.fs-page .salary-profile-card`, `.fs-page .profile-card`, `.fs-page .profile-grid`.
- Surfaces converted to `var(--fs-card-bg)` (`#16181d`), borders to `var(--fs-border)` (`#23272f`).
- Recessed card headers styled with `background: var(--fs-chrome-bg)` (`#0c0d0f`) and `border-bottom: 1px solid var(--fs-border)`.
- Replace arbitrary shadows (`box-shadow: 0 4px 12px rgba(0,0,0,0.1)`) with `box-shadow: none` or `var(--fs-shadow)`.
- Enforce strict 8px radius ceiling (`var(--fs-radius-md): 6px`, `var(--fs-radius-lg): 8px`).

---

### 3.3 Salary Form & Component Table (`SalaryForm.js`, `ComponentTable.js`, `ComponentTable.css`)

#### [MODIFY] `frontend/src/components/SalaryForm.js`
- Wrap form in `.fs-card` stacked container.
- Input fields mapped to `.fs-input` with `--fs-border-control` boundaries and `--fs-placeholder` styling.
- Primary submit button uses `.fs-btn .fs-btn-primary` (black text on teal).
- Cancel button uses `.fs-btn .fs-btn-ghost`.

#### [MODIFY] `frontend/src/components/salary/ComponentTable.js`
- Eliminate all 13 inline styles:
  - Line 91–95: Move column width inline styles to CSS `.col-component-name`, `.col-category`, etc.
  - Line 116: Replace `style={isInactive ? { opacity: 0.6 } : undefined}` with `.row-inactive` class in CSS.
  - Lines 120, 126–134, 141, 153–163: Replace inline flex and hardcoded `#e5e7eb` / `#4b5563` with `.fs-badge-inactive`.
  - Lines 174–178: Replace inline category color pill styles with `.fs-category-badge--{category}` classes mapped in CSS.
- **Mobile Responsive Pattern (D19)**:
  - Add media query at `@media (max-width: 768px)`: table rows display as vertical stacked cards with touch targets $\ge 44$px for toggle checkboxes and remove buttons.
  - No horizontal scrolling at 390px.

#### [MODIFY] `frontend/src/components/salary/ComponentTable.css`
- Convert container to `background: var(--fs-card-bg)`, border `var(--fs-border)`.
- Replace `#009879` on `.add-component-btn` and `.add-first-component-btn` with `.fs-btn-primary`.
- Clamp pill radius from `12px` to `var(--fs-radius-pill)` strictly on category/status badges. Table container and buttons strictly $\le 8$px.
- Table headers and borders styled via `var(--fs-chrome-bg)` and `var(--fs-border)`.

---

### 3.4 Payroll Rules Hub & Yearly Tax Table (`PayrollRulesHub.js`, `YearlyTaxTable.js`, `TaxesPage.css`)

#### [MODIFY] `frontend/src/pages/salary/PayrollRulesHub.js`
- Wrap page in `<div className="fs-page">` with `<PageHeader>`.
- Convert top tab bar to accessible `.fs-tabs` with `role="tablist"` and `aria-selected` attributes.
- Eliminate all 17 inline styles:
  - Lines 250–257, 263–276: Replace inline tab button and simulator link styles with `.fs-tab-btn` and `.fs-btn-secondary`.
  - Line 284: Replace inline loading style with `<Loading variant="screen" />`.
  - Lines 316, 319–327: Replace inline header flex and `#ecfdf5` / `#047857` status badge styles with `.fs-badge .fs-badge--positive` / `.fs-badge--warning`.
  - Lines 333, 335: Replace inline `#64748b` and `#0284c7` with `--fs-text-3` and `--fs-text`.
  - Line 358: Remove `getColorForRate(rateVal)` inline background. Rows use standard alternating dark table zebra `.fs-table-row`.
  - Lines 362: Replace inline `fontWeight: 600` with `.fs-font-semibold`.
- Invariant I6: Add mobile card collapse for current tax brackets table at $\le 768$px.

#### [MODIFY] `frontend/src/pages/taxes/YearlyTaxTable.js`
- Eliminate all 6 inline styles:
  - Line 23: Replace inline margin with CSS class `.yearly-tax-card`.
  - Lines 24, 27: Replace inline header flex and `#64748b` with `.tax-card-header` and `--fs-text-3`.
  - Line 92: Replace inline empty state with `.table-empty-cell`.
  - Lines 105–108: Remove `getColorForLevel(p.bracketLevel)`. Bracket level rendered as clean numeric badge `.fs-badge`.
- Summary grid (`.yearly-summary-grid`) converted to graphite KPI card grid (`--fs-surface` with `--fs-border`).
- Rate of change indicator preserves `change-positive` / `change-negative` / `change-neutral` classes using semantic tones via `theme.css`.

#### [MODIFY] `frontend/src/pages/taxes/TaxesPage.css`
- Scope rules under `.fs-page .tax-card`, `.fs-page .styled-table`, `.fs-page .yearly-summary-grid`.
- Replace `#009879` on `.nav-button` with `.fs-btn-primary`.
- Replace `#f8f9fa`, `#f0f4f8` backgrounds with `var(--fs-card-bg)` and `var(--fs-surface-raised)`.
- Replace `#34495e` and `#333` text colours with `var(--fs-text)` and `var(--fs-text-2)`.
- Add D19 mobile compact-expand cards for `.styled-table` at $\le 768$px.

---

### 3.5 Orphan CSS File Deletions

#### [DELETE] `frontend/src/pages/salary/SalaryProfilePage.css`
- Orphan file verified in 1A with 0 imports. Delete from repository.

#### [DELETE] `frontend/src/pages/salary/PaycheckListPage.css`
- Orphan file verified in 1A with 0 imports. Delete from repository.

---

### 3.6 ESLint Ignore Purge (`frontend/.eslintignore`)

#### [MODIFY] `frontend/.eslintignore`
Purge the 7 Phase 5A entries:
```diff
-src/components/SalaryForm.js
-src/components/salary/ComponentTable.js
-src/pages/salary/PayrollRulesHub.js
-src/pages/salary/SalaryProfilePage.js
-src/pages/salary/__tests__/PayrollRulesHub.test.js
-src/pages/salary/__tests__/SalaryProfileToggle.test.js
-src/pages/taxes/YearlyTaxTable.js
```

---

## 4. Verification Plan

### 4.1 Automated Tests

1. **Tokens and Contrast**:
   ```powershell
   node frontend/scripts/tokens.js --check
   ```
   *Expected*: 0 drift against `tokens.json`.

2. **Tone Token Scoping (`lint-tones.js`)**:
   ```powershell
   node frontend/scripts/lint-tones.js
   ```
   *Expected*: 0 violations across all CSS files (no tone token named in page CSS).

3. **Stylelint Ratchet (`lint-ratchet.js`)**:
   ```powershell
   node frontend/scripts/lint-ratchet.js
   ```
   *Expected*: 0 regressions against merge-base.

4. **Test ID & Accessibility Label Preservation (`testid-guard.js`)**:
   ```powershell
   node frontend/scripts/testid-guard.js
   ```
   *Expected*: 0 testid/aria-label modifications (Invariant I5).

5. **Calculation Characterization Engine (`tests/calculations.spec.js`)**:
   ```powershell
   Set-Location frontend; npx jest --runInBand tests/calculations.spec.js
   ```
   *Expected*: 11/11 tests passing with zero byte deviation across all 8 domains (Invariant I3).

6. **Unit & A11y Suite (`jest-axe`)**:
   ```powershell
   Set-Location frontend; $env:CI="true"; npm test -- src/pages/salary/__tests__/PayrollRulesHub.test.js src/pages/salary/__tests__/SalaryProfileToggle.test.js src/pages/salary/__tests__/SalaryProfilePage.test.js
   ```
   *Expected*: All test suites pass 100% with zero axe accessibility violations.

7. **Production Build & ESLint Hygiene**:
   ```powershell
   Set-Location frontend; $env:CI="true"; node --max-old-space-size=4096 ./node_modules/react-scripts/scripts/build.js
   ```
   *Expected*: Build succeeds with 0 errors and 0 warnings.

8. **Visual Regression Gate (PR Subset)**:
   ```powershell
   Set-Location frontend; $env:PR_SUBSET="true"; npx playwright test --project=pr-subset
   ```
   *Expected*: 0 regression diff on all 54 unallowlisted routes; exactly 2 routes (`/salary/profiles` and `/salary/rules`) reflect accepted theme changes.

9. **Baseline Manifest Verification**:
   ```powershell
   node frontend/scripts/verify-baseline-manifest.js
   ```
   *Expected*: Manifest 334/334 verified in `D:\Projects\FinStat-visual-baselines`.

---

### 4.2 Manual Verification Checklist & Taste Checkpoint 3

1. **Taste Checkpoint 3 Review (`/salary/profiles`)**:
   - Compare rendered `/salary/profiles` at 1440px and 390px against **Reference Frame 02 (Variant B — Form)** (`docs/UI-UX_Plan/reference/02-form.html`).
   - Verify dark graphite canvas (`#101114`), recessed card headers (`#0c0d0f`), surface cards (`#16181d`), and clean 1px borders (`#23272f`).
   - Verify single accent CTA ("Update Salary" / "Save") in teal with black text.
2. **Component Table Mobile Responsiveness (390px)**:
   - View `/salary/profiles` on mobile viewport (390px).
   - Ensure component table rows render as compact cards without page-level horizontal scroll.
   - Verify toggle switch and delete button touch targets reach $\ge 44\text{px}$.
3. **Tab Navigation & Deep-Linking (`/salary/rules`)**:
   - Click "Taxes" tab: URL updates to `/salary/rules?tab=taxes` and displays active tax brackets and grand summary.
   - Click "Social Insurance" tab: URL updates to `/salary/rules?tab=insurance` and displays insurance brackets and remaining burden.
   - Navigate to `/taxes` and `/social-insurance` directly: verify redirect to `/salary/rules?tab=taxes` and `/salary/rules?tab=insurance` works seamlessly.
4. **Viewer Role Mutation Gating (Invariant I4)**:
   - In viewer role (`canModify = false`), verify that "Update Structure", "Edit Profile Details", "Set Default", and "Delete" actions are either hidden, disabled, or protected by `ProtectedAction`.

---

## 5. Invariant Checklist (Action Plan §2 Verbatim)

The following table reproduces **verbatim** the 16 invariant rules defined in `docs/UI-UX_Plan/UI-UX-PLAN.md` §2, alongside the specific verification method for Phase 5A:

| # | Rule | Verification Method in Phase 5A |
| :--- | :--- | :--- |
| **I1** | Production routes and URLs unchanged — 75 entries (74 protected + `*`), 10 redirects. | `App.test.js` route-resolution test; redirects `/salary-profile`, `/social-insurance`, and `/taxes` verified intact. |
| **I2** | No API call, payload shape, or service file changed. | `salaryService.js`, `salaryProfileService.js`, `taxService.js`, and `socialInsuranceService.js` diff review: 0 API signature or payload modifications. |
| **I3** | No calculation changed on **any** page: payroll, installment schedules, debt payoff, trade P&L, certificate maturity/interest, FX conversion, budget thresholds, real-estate yield. | Characterization fixtures in `tests/calculations.spec.js` pass 100% green (11/11 tests, byte-identical). |
| **I4** | Auth, roles, `ProtectedAction`, and `useCanModify` gating unchanged. | Viewer-role mutations verified on `SalaryProfilePage.js` and `ComponentTable.js`. |
| **I5** | Test IDs, `data-*` attributes, and accessible labels preserved — 37 `data-testid`, 39 `aria-label`. | `node frontend/scripts/testid-guard.js` returns 0 modified test IDs or accessibility labels. |
| **I6** | Tables render as compact-expand cards at ≤ 768px (D19). Horizontal scroll preserved only for tables with ≥ 12 columns (audit logs) where the card pattern is impractical. No page-level horizontal scroll at 390px. | 390px Playwright mobile check on `ComponentTable.js`, current tax brackets, and `YearlyTaxTable.js`: card collapse verified, no page-level horizontal scroll. |
| **I7** | No page loses functionality mid-migration. | Patterns `'/salary/profiles'` and `'/salary/rules'` added exclusively in this converting PR (§6.3). |
| **I8** | Dashboard coordinator line cap preserved — `DashboardSummary.js` must remain $\le 120$ lines (post-audit architecture decomposition invariant). All 10 RTL dashboard tests must remain green. | `DashboardSummary.js` untouched; line count $\le 120$ asserted. |
| **I9** | Production build passes with zero errors and no new warnings. | Production build passes cleanly with 0 errors and 0 warnings via `scripts/build.js`. |
| **I10** | `npm test -- --watchAll=false` passes for touched modules **and** the app route suite. | Touched salary test suites pass 100% green via `npx jest --runInBand`. |
| **I11** | No new `!important`; a file's count in the 1C lint ratchet may only fall. | `node frontend/scripts/lint-ratchet.js` reports 0 regressions across all CSS files. |
| **I12** | No new dependency except the Phase 1C tooling list (§9.2). | `package.json` diff review confirms 0 new dependencies added. |
| **I13** | Every non-allowlisted route is pixel-identical to its 1B baseline. | Playwright PR subset visual regression suite reports 0 diff across all 54 unallowlisted routes. |
| **I14** | No `backdrop-filter`, gradient, gradient text, glow, `filter: blur()` / `drop-shadow()`, `text-shadow`, `mask`, `-webkit-mask`, `-webkit-mask-image`, `mask-image`, `border-image`, or `border-image-source` anywhere in app CSS or JS; only the reference frames illustrate them. | Stylelint and `lint-tones.js` pass with 0 anti-slop violations. |
| **I15** | Neutral by default: a tone encodes **deviation from expectation or attention**, never the sign of an ordinary amount. Expense amounts, income, and balances are neutral (§4.3). A page never references a tone token directly; it uses `Delta`, `Badge`, or a `.fs-progress--*` modifier. | `node frontend/scripts/lint-tones.js` reports 0 tone token references in page CSS; salary figures and tax rates remain neutral. |
| **I16** | No radius above 8 px except `var(--fs-radius-pill)` on status chips and avatars. | Stylelint enforces strict $\le 8\text{px}$ ceiling; pill radius strictly confined to status badges. |

---

## 6. Visual Regression & Baseline Snapshot Plan

Phase 5A converts 2 routes across the 5 mandatory QA widths:
- `/salary/profiles` (`salary-profiles`): 1440px, 1024px, 768px, 480px, 390px (5 snapshots)
- `/salary/rules` (`salary-rules`): 1440px, 1024px, 768px, 480px, 390px (5 snapshots)

Total: **10 baseline replacement snapshots** captured and committed into `D:\Projects\FinStat-visual-baselines`.
The baseline manifest (`manifest.json`) will be updated to reflect the new SHA-256 hashes for these 10 snapshots while preserving the remaining 324 snapshots unchanged.

---

## 7. Progress Log & Merge Traceability

```
Sub-phase:   5A
Cluster:     Payroll & Salary (Cluster 2)
Taste Check: Taste Checkpoint 3 (Reference Frame 02 Variant B Form)
Status:      ready-to-execute
Done:        Pending execution
Next:        5B (/salary/paychecks)
Blocked by:  None
Allowlist:   ['/dashboard', '/expenditures', '/expenditures/new', '/expenditures/edit/:id', '/expenditures/rules', '/expenditures/budgets', '/expenditures/recurring', '/expenditures/bills', '/expenditure-analysis', '/salary/profiles', '/salary/rules'] (cumulative: 11 routes)
Visual diff: 0 regression diff across all 54 unallowlisted routes; exactly 10 baseline snapshots replaced for /salary/profiles and /salary/rules
Fixtures:    calculations.spec.js passing 100% (byte-identical, 11/11 tests green)
Branch:      phase-ui-5a-payroll-core
```
