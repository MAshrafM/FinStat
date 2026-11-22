# UI Phase 5E Implementation Plan — History, Update, Analytics & Tax Simulator (Final Sub-phase of Phase 5)

- **Sub-phase**: UI Phase 5E (`/salary-profile/history`, `/salary-profile/edit`, `/salary-profile/history/edit/:historyId`, `/salary-profile/update`, `/analysis/payroll`, `/salary/simulator`)
- **Working Branch**: `phase-ui-5e-payroll-history`
- **Merge Base**: `cddebc7` (`main` / `origin/main`)
- **Design Tokens**: `frontend/src/styles/tokens.json` (Canvas `#101114`, Surface `#1a1c20`, Surface Raised `#22252a`, Border `#34383f`, Accent `#14b8a6`, Ink `#0d0e10`)
- **Canonical Reference Frames**: Reference Frame 01 (Dense Table Variant B with D19 Mobile Compact-Expand Cards) & Reference Frame 02 (Form Variant B)
- **Cumulative Route Allowlist Progress**: 14 routes -> 20 routes (completing all 19 Phase 5 route entries: 11 rendering + 8 redirects)
- **Status**: Approved — In Execution

---

## 1. Goal Description

Phase 5E is the final, capstone sub-phase of Phase 5 (Payroll & salary). It migrates the remaining 6 rendering routes and 2 redirects in the payroll domain to the dark graphite design language, permanently sunsets the remaining legacy compatibility blocks in `SalaryProfile.css` and `TaxSimulator.css`, eliminates all inline styles across `UpdateSalary.js` (38) and `PayrollAnalyticsPage.js` (5), integrates `chartTheme.js` into `AnalysisCard.js` for theme-aware accessible analytics charts, expands `THEMED_PATTERNS` in `ProtectedRoute.js` from 14 to 20 patterns, purges all remaining Phase 5 files from `.eslintignore`, regenerates the 30 visual baselines for the 6 newly themed routes across 5 viewports, reconciles full visual regression under recorded amendment AD14, and achieves final exit gate sign-off for the entire Phase 5 milestone per `UI-UX-PLAN.md §6.9`.

---

## 2. User Review Required & Governance Commitments

> [!IMPORTANT]
> **Zero Remote Push Policy**: In accordance with user governance instructions, all commits, test executions, and visual baseline updates remain strictly local on working branch `phase-ui-5e-payroll-history` until the final walkthrough is reviewed and signed off.
>
> **Complete Phase 5 Sunset**: Phase 5E permanently sunsets the legacy compatibility blocks in `SalaryProfile.css` and `TaxSimulator.css`. After 5E, **zero** stylelint-disable directives remain across all payroll stylesheets.
>
> **Chart Series Palette Governance (D22 constraint 3)**: The Bar/Line chart in `AnalysisCard.js` (rendered on `/analysis/payroll`) is refactored to read theme tokens dynamically via `getChartPalette()` in `chartTheme.js`. Series colors use neutral greys (`chartPalette.grey1` / `chartPalette.greys[0]` and `chartPalette.grey2`). The teal accent (`#14b8a6`) is strictly banned as a chart series.
>
> **Baseline Debt Carry-Forward (AD14)**: The 10 pre-existing full-run diffs accepted under AD14 in Phase 5D (3 stale `expenditure-analysis` baselines from commit `720b7bf7` and 7 sub-desktop Chromium 20px fullPage height variances on `not-found`, `dashboard`, `expenditures`) are carried forward as accepted baseline debt. The full 326-test run will reconcile these against AD14 with 0 unexplained diffs.
>
> **Navigation Link Normalization**: `EditProfilePage.js` and `UpdateSalary.js` internal link and navigation targets are normalized to the canonical route `/salary/profiles` while leaving the legacy redirect route `/salary-profile` fully functional.

---

## 3. Architecture Decisions

### 1. Mobile Salary History: Decision D19 Compact-Expand Cards
On mobile viewports ($\le 768$px), `SalaryHistory.js` will adopt the **Decision D19 compact-expand vertical card pattern** rather than forcing table horizontal scroll:
- **Collapsed Primary Row**: Displays `Effective Date`, `Actions` (Edit / Delete icon buttons, touch target $\ge 44$px), and the primary financial metric: `Basic Salary`.
- **Expander Toggle**: An accessible button (`aria-expanded`, `aria-label="Expand salary components"`, touch target $\ge 44$px) toggling the accordion breakdown.
- **Expanded Breakdown**: Neatly presents the remaining 9 dynamic component items (`Production`, `Variables`, `Environment`, `Meal`, `Shift`, `Supervising`, `Others`, `Prepaid`, `Bonds`) with tabular numeric values (`.fs-num`).
- **Desktop (>768px)**: Renders the full 12-column dense financial table with `.fs-table` tokens.
- **Guarantee**: Guarantees zero page-level horizontal overflow at 390px (`scrollWidth <= clientWidth`), fully satisfying Invariant I6 and Decision D19 without requiring an unapproved deviation.

### 2. Navigation Link Normalization
Internal links and post-save navigation in `EditProfilePage.js` and `UpdateSalary.js` are normalized to `/salary/profiles` (canonical route), eliminating redundant client-side redirect hops while keeping the `/salary-profile` route alias active in `App.js`.

---

## 4. Proposed Changes

### Component 1: `SalaryHistory.js` (`/salary-profile/history`)
#### [MODIFY] `frontend/src/pages/salary/SalaryHistory.js`
- Adopt `<Loading variant="route" text="Loading salary history..." />` (Decision D23) replacing raw text loading.
- Change navigation link from legacy `.nav-button` to `.fs-btn .fs-btn-secondary`.
- Desktop view (>768px): Canonical Reference Frame 01 (Variant B) dense table:
  - Scoped `.fs-table-container` and `.fs-table`.
  - Header styling with `var(--fs-surface-sunken)` and `var(--fs-text-3)`.
  - Numeric tabular values formatted with `.fs-num` (IBM Plex Sans, `font-variant-numeric: tabular-nums`, right-aligned).
  - Accessible icon buttons with explicit `aria-label="Edit historical record"` and `aria-label="Delete historical record"`, with touch targets $\ge 44$px (WCAG 2.5.5, Invariant I5).
- Mobile view ($\le 768$px): Decision D19 compact-expand vertical cards:
  - Primary card row: `Effective Date` + `Actions` (Edit/Delete).
  - Prominent visible field: `Basic Salary`.
  - Expander toggle button (`aria-expanded`, `aria-label="Expand salary components"`) revealing remaining 9 components (`Production`, `Variables`, `Environment`, `Meal`, `Shift`, `Supervising`, `Others`, `Prepaid`, `Bonds`).
  - Zero page-level horizontal scroll (`scrollWidth <= clientWidth` at 390px).

```diff
- import '../../components/Table.css';
+ import '../../styles/theme-components.css';
+ import { Loading } from '../../components/ui';

- if (!profile) return <div className="page-container">Loading...</div>;
+ if (!profile) return <Loading variant="route" text="Loading salary history..." />;
```

---

### Component 2: `EditProfilePage.js` (`/salary-profile/edit`)
#### [MODIFY] `frontend/src/pages/salary/EditProfilePage.js`
- Eliminate legacy `.paycheck-form-container` and inline styles (`style={{textDecoration: 'none'}}`).
- Structure form according to Canonical Reference Frame 02 (Variant B stacked field cards):
  - Form card container using `var(--fs-surface)` (`#1a1c20`) and `var(--fs-border)` (`#34383f`).
  - Pair all 4 inputs (`name`, `title`, `position`, `year`) with explicit `<label htmlFor="...">` and `<input id="...">` pairings.
  - Primary Save CTA (`.fs-btn .fs-btn-primary` with `var(--fs-accent)` and `var(--fs-ink)` text).
  - Cancel button (`.fs-btn .fs-btn-secondary`).
  - 4px input radii (`var(--fs-radius-sm)`).

---

### Component 3: `EditHistoryRecord.js` (`/salary-profile/history/edit/:historyId`)
#### [MODIFY] `frontend/src/pages/salary/EditHistoryRecord.js`
- Replace `<div className="page-container">Loading record...</div>` with `<Loading variant="route" text="Loading historical record..." />` (Decision D23).
- Pair `effectiveDate` and all 10 salary inputs with explicit `<label htmlFor="...">` and `<input id="...">` pairings.
- Eliminate inline `style={{textDecoration: 'none'}}` on Cancel button.
- Format numeric fields with `.fs-input` / `.fs-num` styling.
- Primary Save CTA (`.fs-btn .fs-btn-primary`) and Cancel (`.fs-btn .fs-btn-secondary`).

---

### Component 4: `UpdateSalary.js` (`/salary-profile/update`)
#### [MODIFY] `frontend/src/pages/salary/UpdateSalary.js`
- Eliminate all **38 inline style declarations** (`style={{ ... }}`).
- Replace legacy `RefreshCw` loading spinner with canonical `<Loading variant="route" text="Loading salary profile structure..." />` (Decision D23).
- Map profile metadata fields to semantic classes (`.update-salary-meta-card`, `.update-salary-grid`, `.update-salary-field`).
- Re-style the 4 KPI summary cards to neutral dark graphite KPI tiles (Invariant I15):
  - Basic Salary, Estimated Gross, Insurable Earnings, Taxable Earnings.
  - Surface `var(--fs-surface)`, border `var(--fs-border)`, numeric values formatted with `.fs-num`.
  - Zero colored background washes or glowing borders.
- Action buttons: Primary Save CTA (`.fs-btn .fs-btn-primary`) with `<Save />` icon, Cancel (`.fs-btn .fs-btn-secondary`) with `<ArrowLeft />` icon.
- Pair labels and inputs with `htmlFor` and `id`.

---

### Component 5: `PayrollAnalyticsPage.js` & Subcomponents (`/analysis/payroll`)
#### [MODIFY] `frontend/src/pages/analysis/PayrollAnalyticsPage.js`
- Eliminate all **5 inline style declarations** (`style={{ ... }}`).
- Adopt canonical `<Loading variant="route" text="Loading payroll analytics..." />` when `isLoading` is true.
- Style segmented cycle toggle bar according to Reference Frame 01/03 segmented control pattern:
  - Container `var(--fs-surface-raised)`, border `var(--fs-border)`, 6px radius.
  - Active button uses `var(--fs-surface)` with `var(--fs-text)` and subtle bottom accent cue.
  - Inactive button uses `var(--fs-text-3)` with hover state.
- Retain seamless query param synchronization (`?cycle=calendar` and `?cycle=fiscal`).

#### [VERIFY] `frontend/src/pages/analysis/CalendarAnalysis.js` & `FiscalAnalysis.js`
- Confirm that both files are lightweight redirect wrappers returning `<Navigate to="/analysis/payroll?cycle=calendar" replace />` and `<Navigate to="/analysis/payroll?cycle=fiscal" replace />`.
- Because they contain no HTML markup or presentation styles, they require no CSS changes.
- The calendar/fiscal cycle chips, token colors (`--fs-surface-raised`, `--fs-border`, `--fs-surface`), and `?cycle=calendar|fiscal` query parameter synchronization are implemented and styled directly in `PayrollAnalyticsPage.js`.

#### [MODIFY] `frontend/src/components/SummaryRow.js` & `SummaryRow.css`
- Modernize `SummaryRow.css` under `.fs-page .summary-row`:
  - Grand total card: neutral graphite card with `.fs-num` figure.
  - Period totals: yearly totals with growth % badge.
  - Growth % badge: positive uses canonical `.fs-delta--positive`, negative uses canonical `.fs-delta--negative`, N/A uses canonical `.fs-delta--neutral` (Invariant I15).
  - Eliminate hardcoded `#f8f9fa`, `#fff`, `#009879`, `#dee2e6`, box-shadows.

#### [MODIFY] `frontend/src/components/AnalysisCard.js` & `AnalysisCard.css`
- Modernize `AnalysisCard.css` under `.fs-page .analysis-card`:
  - 3 KPI tiles styled with neutral `.fs-card` and `.fs-num`.
  - Eliminate hardcoded `#fff`, `#009879`, `#333`, `#555`, box-shadows.
- Chart.js Bar & Line chart theming:
  - Import `getChartPalette()` from `frontend/src/styles/chartTheme.js`.
  - Monthly Sum bar dataset uses neutral grey series (`chartPalette.grey1` or `chartPalette.greys[0]`).
  - Period Average line dataset uses secondary grey (`chartPalette.grey2`).
  - Teal accent (`#14b8a6`) is strictly disallowed in chart datasets (D22 constraint 3).

---

### Component 6: `TaxSimulator.js` & `TaxSimulator.css` (`/salary/simulator`)
#### [MODIFY] `frontend/src/pages/salary/TaxSimulator.css`
- Completely overhaul `TaxSimulator.css` to conform to Design System tokens:
  - **Eliminate Gradients (Invariant I14)**: Delete `linear-gradient` on lines 216 and 221; use solid opaque surfaces (`var(--fs-surface)`).
  - **Enforce 8px Ceiling (Invariant I16)**: Replace all 12px radii with `var(--fs-radius-md)` (6px) or `var(--fs-radius-lg)` (8px).
  - **Eliminate Raw Colors**: Replace `#3B82F6`, `#2563EB`, `#1E293B`, `#0F172A`, `#F8FAFC`, `#2ECC71`, `#EF4444` with tokens (`--fs-surface`, `--fs-border`, `--fs-text`, `--fs-accent`).
  - Range slider: styled with `var(--fs-accent)` thumb and `var(--fs-border-control)` track.
  - Quick presets: `.fs-badge` pill styling with `var(--fs-surface-raised)`; active preset uses `.fs-btn-primary`.
  - View mode toggle: segmented toggle matching design system.
  - 4 KPI summary cards (Neutral Invariant I15):
    - Net Take-Home Pay: Neutral solid graphite surface (`var(--fs-surface)`), border `var(--fs-border)`, `.fs-num`.
    - Gross Salary: Neutral.
    - Effective Tax Rate: Neutral.
    - Total Deductions: Neutral solid graphite surface (`var(--fs-surface)`), border `var(--fs-border)`, `.fs-num`.
    - Zero colored border cues or background washes (Invariant I15).
  - Tables (Progressive Slices & Deductions Waterfall): clean `.fs-table` tokens with tabular figures (`.fs-num`).
  - Employer Total Cost accordion: themed button with chevron and graphite breakdown items.

#### [MODIFY] `frontend/src/pages/salary/TaxSimulator.js`
- Clean up raw hexes and legacy color classes:
  - Remove `text-green` and `text-red`.
  - Standard financial figures (deductions, employer contributions, net pay) are rendered neutrally via `.fs-num` (Invariant I15).
  - If a status badge is used, use base `.fs-badge` or `.fs-badge--positive` (`theme.css:485`).

---

### Component 7: `SalaryProfile.css` Legacy Sunset
#### [MODIFY] `frontend/src/pages/salary/SalaryProfile.css`
- Sunset the legacy compatibility block (lines 1–321), retaining only the clean, scoped `.fs-page` rules.
- Enforce strict exit-0 stylelint with exactly **0** `stylelint-disable` directives remaining.

---

### Component 8: Progressive `.eslintignore` De-ignoring
#### [MODIFY] `frontend/.eslintignore`
- Permanently remove all 7 remaining Phase 5 entries:
  - `src/components/AnalysisCard.js`
  - `src/pages/analysis/PayrollAnalyticsPage.js`
  - `src/pages/analysis/__tests__/PayrollAnalyticsPage.test.js`
  - `src/pages/salary/EditHistoryRecord.js`
  - `src/pages/salary/EditProfilePage.js`
  - `src/pages/salary/UpdateSalary.js`
  - `src/pages/salary/__tests__/TaxSimulator.test.js`
- Run `npx eslint ... --max-warnings=0` across all files to ensure 0 errors and 0 warnings.

---

### Component 9: Route Allowlist Expansion (14 -> 20 patterns)
#### [MODIFY] `frontend/src/components/ProtectedRoute.js`
- Add the 6 remaining Phase 5 routes to `THEMED_PATTERNS`:
  - `'/salary-profile/history'`
  - `'/salary-profile/edit'`
  - `'/salary-profile/history/edit/:historyId'`
  - `'/salary-profile/update'`
  - `'/analysis/payroll'`
  - `'/salary/simulator'`
- Verify `node frontend/scripts/ui-coverage.js --assert-allowlist` passes with 20 patterns.

---

### Component 10: Automated Tests & Visual Fixtures
#### [NEW] `frontend/src/pages/salary/__tests__/SalaryHistory.test.js`
- Unit tests for `SalaryHistory` component:
  1. Renders loading state initially.
  2. Renders profile name and 12-column table with formatted salary records.
  3. Formats all monetary values via `formatCurrency`.
  4. Triggers delete modal and confirms deletion of historical record.
  5. Back button navigates to `/salary/profiles`.
  6. Renders D19 compact-expand cards with expander button.

#### [NEW] `frontend/src/pages/salary/__tests__/EditProfilePage.test.js`
- Unit tests for `EditProfilePage` component:
  1. Loads profile details and populates form fields.
  2. Updates form inputs on change.
  3. Submits updated details and navigates upon save.
  4. Cancel button navigates back without saving.

#### [NEW] `frontend/src/pages/salary/__tests__/EditHistoryRecord.test.js`
- Unit tests for `EditHistoryRecord` component:
  1. Loads record by ID and populates date and 10 salary inputs.
  2. Modifies component amounts.
  3. Submits numeric conversions and navigates upon save.

#### [NEW] `frontend/src/pages/salary/__tests__/UpdateSalary.test.js`
- Unit tests for `UpdateSalary` component:
  1. Loads profile and populates metadata and component rows.
  2. Updates live structure summary cards dynamically upon component change.
  3. Submits updated components payload and navigates upon save.

#### [MODIFY] `frontend/tests/visual/fixtures/paycheckMocks.js` & `a11y.spec.js`
- Ensure mock handlers exist for `/api/salary-profile`, `/api/salary-profiles`, `/api/tax-brackets/simulate`.
- Real-browser Playwright axe test runs un-injected on all 6 Phase 5E routes, asserting 0 critical and 0 serious violations.

#### [NEW] `frontend/tests/visual/payroll-history-reference-match.spec.js`
- Playwright reference match test asserting:
  1. Canonical Reference Frame 01 (tables with D19 cards) and Reference Frame 02 (forms) token conformity.
  2. Touch targets $\ge 44$px at 1440px and 390px.
  3. Zero page-level horizontal overflow at 390px (`scrollWidth <= clientWidth`).

---

### Component 11: Visual Baseline Capture & External Manifest Regeneration
Prior to executing visual regression assertions, the 30 new baselines (6 routes × 5 viewports) are captured and committed in the external baselines repository:
1. Capture updated snapshots:
   `cd frontend; Remove-Item env:PR_SUBSET -ErrorAction SilentlyContinue; npx playwright test tests/visual/visual.spec.js --project=visual --update-snapshots --grep="salary-profile-(history|edit|update)|analysis-payroll|salary-simulator"; cd ..`
2. Regenerate baseline manifest:
   `node frontend/scripts/verify-baseline-manifest.js --generate`
3. Commit external repository locally:
   `git -C D:\Projects\FinStat-visual-baselines commit -am "chore(baselines): regenerate 30 baselines for phase 5e payroll routes"`

---

## 5. Verification Plan (18 Automated & Governance Gates)

| Gate # | Gate Name | Command / Script | Success Criteria |
| :---: | :--- | :--- | :--- |
| **Gate 1** | Clean Working Tree | `git status --short` | Branch `phase-ui-5e-payroll-history`; working tree clean. |
| **Gate 2** | Stylelint AST & Sunset | `cd frontend; npx stylelint "src/pages/salary/*.css" "src/components/*.css" "src/styles/*.css"` | Exit code 0; 0 errors, 0 warnings; 0 `stylelint-disable` directives remaining in `SalaryProfile.css` and `TaxSimulator.css`. |
| **Gate 3** | ESLint Hygiene | `cd frontend; npx eslint src/pages/salary/ src/pages/analysis/ src/components/AnalysisCard.js src/components/SummaryRow.js --max-warnings=0` | Exit code 0; 0 errors, 0 warnings across all touched production and test files. |
| **Gate 4** | `.eslintignore` Audit | `git grep -in "pages/salary" frontend/.eslintignore; git grep -in "pages/analysis" frontend/.eslintignore; git grep -in "AnalysisCard" frontend/.eslintignore` | Exit code 1 (0 matches — all Phase 5 entries permanently purged). |
| **Gate 5** | Design Tokens & Tones | `node frontend/scripts/tokens.js --check; node frontend/scripts/lint-tones.js` | 0 token drift; 0 tone scoping violations; 0 undefined tokens. |
| **Gate 6** | Stylelint Ratchet & TestID Guard | `node frontend/scripts/lint-ratchet.js; node frontend/scripts/testid-guard.js` | 0 ratchet regressions; all `data-testid` and `aria-label` attributes preserved. |
| **Gate 7** | Route Allowlist Assertion | `node frontend/scripts/ui-coverage.js --assert-allowlist` | Exactly 20 pattern(s) verified against App.js routes. |
| **Gate 8** | Touched Unit Test Suites | `cd frontend; $env:CI="true"; npm test -- --runInBand --watchAll=false src/pages/salary/ src/pages/analysis/ src/App.test.js` | All touched suites pass 100% green. |
| **Gate 9** | Calculation Parity Invariant I3 | `cd frontend; npx jest --runInBand tests/calculations.spec.js` | 11/11 tests green; characterization fixtures byte-identical. |
| **Gate 10** | Real-Browser Axe Accessibility | `cd frontend; $env:CI="true"; npx playwright test tests/visual/a11y.spec.js --project=a11y --grep="a11y check: (salary-profile|analysis-payroll|salary-simulator)"` | 0 critical, 0 serious violations across touched Phase 5E routes un-injected. |
| **Gate 11** | Reference Match Spec | `cd frontend; $env:CI="true"; npx playwright test tests/visual/payroll-history-reference-match.spec.js --project=reference` | 100% pass rate; Reference Frame 01 & 02 match; touch targets $\ge 44$px; zero horizontal overflow at 390px. |
| **Gate 12** | Production Build Compilation | `cd frontend; $env:NODE_OPTIONS="--max-old-space-size=4096"; npm run build` | Exit code 0; bundle compiles with no new warnings. |
| **Gate 13** | Functional End-to-End Checklist | Section 6 manual / test verification | All 7 functional flows verified green. |
| **Gate 14** | Visual Regression PR-Subset Run | `cd frontend; $env:PR_SUBSET="true"; npx playwright test tests/visual/visual.spec.js --project=visual` | 71/71 PR-subset snapshots match baselines with 0 unexpected diffs. Note: `$env:PR_SUBSET="true"` is passed because `visual.spec.js:26` gates subset execution on this environment variable. |
| **Gate 15** | Full Visual Regression Suite & AD14 Reconciliation | `cd frontend; Remove-Item env:PR_SUBSET -ErrorAction SilentlyContinue; npx playwright test tests/visual/visual.spec.js --project=visual` | All 326 visual snapshot tests run (after baseline capture in Component 11). Detailed report reconciles: (a) 326 snapshot tests across 65 routes, (b) 316 tests with 0 diff, (c) 10 accepted diffs citing AD14 (3 stale `expenditure-analysis`, 7 sub-desktop height variances), (d) 0 unexplained diffs. |
| **Gate 16** | Baseline Manifest Verification | `node frontend/scripts/verify-baseline-manifest.js` | Validates all 334/334 PNG baselines in `D:\Projects\FinStat-visual-baselines` against SHA-256 hashes in `manifest.json`. |
| **Gate 17** | Zero-Teal & Orphan-CSS Audit | Step 1: `git grep -in "#14b8a6" frontend/src/pages/salary/ frontend/src/pages/analysis/`<br>Step 2: `powershell -Command "if (Test-Path frontend/src/pages/salary/SalaryProfilePage.css) { throw 'SalaryProfilePage.css exists!' }; if (Test-Path frontend/src/pages/salary/PaycheckListPage.css) { throw 'PaycheckListPage.css exists!' }; Write-Host 'Orphan CSS absence verified.'"` | Step 1 exits 1 (zero matches for raw teal in salary/analysis); Step 2 exits 0 (both legacy files confirmed absent). |
| **Gate 18** | Documentation & Phase 5 Exit Gate Sign-Off | `docs/UI-UX_Plan/UI-UX-PLAN.md §10`, `CHANGELOG.md`, `phase_5e_walkthrough.md` | §10 log row added; CHANGELOG updated; walkthrough screenshot SHAs documented; all 7 Phase 5 Exit Gate criteria signed off. |

---

## 6. Functional End-to-End Checklist (Gate 13 Detail)

| Flow # | Route | Functional Verification |
| :---: | :--- | :--- |
| **Flow 1** | `/salary-profile/history` | Render sorted salary history records; format all currency values; trigger delete modal and cancel/confirm deletion; toggle D19 compact-expand card on mobile (390px). |
| **Flow 2** | `/salary-profile/edit` | Pre-fill profile name, title, position, year; edit inputs; submit and navigate back to canonical `/salary/profiles`. |
| **Flow 3** | `/salary-profile/history/edit/:id` | Load existing historical record by ID; edit effective date and component amounts; submit and verify numeric conversion. |
| **Flow 4** | `/salary-profile/update` | Load profile structure; add/modify dynamic salary components; verify live recalculation of basic, gross, insurable, and taxable cards; submit updated profile. |
| **Flow 5** | `/analysis/payroll` | Switch between Calendar Year and Fiscal Year segmented cycles; verify URL sync (`?cycle=fiscal`); verify chart and summary totals recalculate without extra network fetches. |
| **Flow 6** | `/salary/simulator` | Drag gross salary range slider; click quick presets; toggle Monthly/Annual view; verify live progressive tax bracket breakdown and statutory waterfall recalculation; toggle employer cost accordion. |
| **Flow 7** | Redirects | Verify `/analysis/calendar` -> `/analysis/payroll?cycle=calendar` and `/analysis/fiscal` -> `/analysis/payroll?cycle=fiscal` resolve smoothly with cycle param preservation. |

---

## 7. Phase 5 Exit Gate Sign-Off Matrix (§6.9)

| Exit Gate Requirement | Target State in Phase 5E | Verification Method |
| :--- | :--- | :--- |
| **19 route entries themed or redirect-verified** | 11 rendering routes + 8 redirects in payroll domain | `App.js` route audit & `ProtectedRoute.js` allowlist (20 patterns total across app) |
| **Zero teal in the payroll domain** | 0 occurrences of `#14b8a6` in `src/pages/salary/` and `src/pages/analysis/` | `git grep -in "#14b8a6"` returns 0 matches (Gate 17) |
| **Orphan CSS deleted** | `SalaryProfilePage.css` and `PaycheckListPage.css` absent; legacy block in `SalaryProfile.css` sunset | File existence checks + stylelint AST validation |
| **Payroll calculation fixtures byte-identical** | Characterization fixtures byte-identical to 1C snapshot | `npx jest --runInBand tests/calculations.spec.js` 11/11 passing (Gate 9) |
| **`PaycheckFormPage.js` diff purity** | Zero changes to hooks, handlers, or calculations | `git diff main -- frontend/src/pages/salary/PaycheckFormPage.js` is clean |
| **Real-browser Playwright axe test passes** | 0 critical or serious violations un-injected on all 6 touched Phase 5E payroll routes (with previously themed routes verified in 5A–5D) | `npx playwright test tests/visual/a11y.spec.js --project=a11y --grep="a11y check: (salary-profile|analysis-payroll|salary-simulator)"` (Gate 10) |
| **Zero diff on non-allowlisted routes** | Non-allowlisted routes 100% pixel-identical (except AD14 baseline debt) | Playwright visual suite (Gate 14 & 15) |

---

## 8. Rollback Plan

If any gate fails or an unexpected regression is detected:
1. Revert working tree via `git checkout -- frontend/ docs/ .gitignore`.
2. Revert external visual baselines repo via `git -C D:\Projects\FinStat-visual-baselines reset --hard 4d118b9`.
3. Re-verify clean working tree via `git status`.
4. Document root cause before re-attempting.
