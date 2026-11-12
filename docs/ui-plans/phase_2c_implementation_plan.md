# Implementation Plan — UI Phase 2C: `App.css` `!important` Removal (v3 — Revised)

## 1. Goal Description

Phase 2C safely and systematically removes all 11 `!important` declarations from [`frontend/src/App.css`](file:///d:/Projects/FinStat/frontend/src/App.css) across four logical groups, scopes `.dashboard-button` and `.loading-spinner` under `.fs-page` in [`frontend/src/styles/theme-components.css`](file:///d:/Projects/FinStat/frontend/src/styles/theme-components.css), preserves legacy fidelity on unmigrated routes (**Invariant I13**), and prepares the codebase for Phase 3A (Dashboard) and Phase 2D (Shared Component Overrides) where un-forced button and table styling is required.

---

## 2. User Review Required

> [!IMPORTANT]
> **Per-Group Visual Regression & Bisectability (§6.6 / Blocking Issue 2)**:
> Per UI-UX-PLAN §6.6, the 11 `!important` declarations are removed in 4 distinct groups:
> 1. **Link text-decoration** (2 declarations)
> 2. **Disabled button transform & box-shadow** (2 declarations)
> 3. **`.btn-*` colours** (6 declarations)
> 4. **Table container `overflow-x`** (1 declaration)
>
> After **each** group is applied, the full visual regression suite (`--project=visual`) will run. Any unexpected diff stops the removal of that group immediately for bisection and investigation.

> [!NOTE]
> **Stylelint Radius Compliance (§4.8 / §9.2)**:
> In accordance with §4.8 and §9.2 (`declaration-property-value-allowed-list`), `.fs-page .loading-spinner` uses `border-radius: var(--fs-radius-pill);` (`9999px`) instead of literal `50%`. On a 24×24px square element, the browser clamps the pill radius to half the dimension (12px), rendering an identical circle while remaining 100% compliant with stylelint.

> [!NOTE]
> **Single Reduced-Motion Block in `theme.css` (NB1)**:
> The loading spinner reduced-motion rule (`animation: none;`) will be merged directly into the single existing `@media (prefers-reduced-motion: reduce)` block in `frontend/src/styles/theme.css` (lines 626–637) alongside `.fs-skeleton`, avoiding duplicate media queries.

> [!NOTE]
> **Primary Button Hover Luminance (M1)**:
> `--fs-action-hover` (`#22c4b3`) is intentionally brighter than `--fs-action-bg` (`#14b8a6`), providing deliberate visual feedback through increased luminance for primary actions. Text contrast against `--fs-ink` (`#101114`) remains 10.82:1 (well above the WCAG 2.1 AA 4.5:1 requirement).

---

## 3. Inventory of the 11 `!important` Declarations in `App.css`

| Group | Line in `App.css` | Selector | Declaration to De-escalate | Target Replacement | Stylelint `declaration-no-important` Count |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Baseline** | — | — | Current state | — | **11 errors** (61 total problems) |
| **G1: Links** | Line 133 | `.btn` | `text-decoration: none !important;` | `text-decoration: none;` | Drops to **9 errors** |
| **G1: Links** | Line 146 | `a.btn, a.btn:hover, a.btn:focus, a.btn:visited` | `text-decoration: none !important;` | `text-decoration: none;` | |
| **G2: Disabled** | Line 152 | `.btn:disabled` | `transform: none !important;` | `transform: none;` | Drops to **7 errors** |
| **G2: Disabled** | Line 153 | `.btn:disabled` | `box-shadow: none !important;` | `box-shadow: none;` | |
| **G3: Colours** | Line 158 | `.btn-primary` | `color: #ffffff !important;` | `color: #ffffff;` | Drops to **1 error** |
| **G3: Colours** | Line 167 | `.btn-primary:hover:not(:disabled)` | `color: #ffffff !important;` | `color: #ffffff;` | |
| **G3: Colours** | Line 176 | `.btn-secondary` | `color: #374151 !important;` | `color: #374151;` | |
| **G3: Colours** | Line 184 | `.btn-secondary:hover:not(:disabled)` | `color: #111827 !important;` | `color: #111827;` | |
| **G3: Colours** | Line 194 | `.btn-danger` | `color: #ffffff !important;` | `color: #ffffff;` | |
| **G3: Colours** | Line 203 | `.btn-danger:hover:not(:disabled)` | `color: #ffffff !important;` | `color: #ffffff;` | |
| **G4: Overflow** | Line 237 | `.table-container, ... .lending-table-card` | `overflow-x: auto !important;` | `overflow-x: auto;` | Drops to **0 errors** (50 total problems remain for Phase 10) |

> [!NOTE]
> **Pre-existing Violations in `App.css` (NB4 & NB5)**:
> When Group 4 is completed, `App.css` has **0 `declaration-no-important` errors**. Exactly 50 pre-existing violations remain in `App.css` (including literal `border-radius: 8px` on `.btn` at line 131, font-family literals, hex color literals, and transition literals). These 50 violations are scheduled for complete remediation or retirement in Phase 10 (Legacy Cleanup).

---

## 4. Comprehensive Pre-Removal Specificity Audit

A complete audit across all categories was conducted across `frontend/src` to identify every rule that could interact with or supersede these selectors when `!important` is removed:

### 4.1. `.btn-primary` Color Overrides
```powershell
$ git grep -n "\.btn-primary" frontend/src
```
- **`RulesPage.css:37`**: `.btn-primary { color: white; ... }` (Specificity: `0,1,0`). Color matches `App.css`.
- **`SalaryProfilePage.css:307`**: `.btn-primary { color: white; ... }` (Specificity: `0,1,0`). Matches.
- **`CorporateActionWizard.css:271`**: `.wizard-page .btn-primary { color: #ffffff !important; ... }` (Specificity: `0,2,0`). Scoped to `.wizard-page`, explicitly retains white text.
- **`Trades.css:205`**: `.btn-primary { color: #ffffff !important; ... }` (Specificity: `0,1,0`). Identical white text.
- **`TaxConfigPage.css:68`** & **`RealEstate.css:66`**: Uses separate class `.btn-primary-add` with its own explicit white text styling.
- **Assessment**: Zero conflicts. No rule in any page overrides `.btn-primary` with non-white text.

### 4.2. `.btn-secondary` Color Overrides
```powershell
$ git grep -n "\.btn-secondary" frontend/src
```
- **Standard Contexts**: Standard contexts retain dark slate grey `#374151` (`App.css:161`, `RulesPage.css:58`, `SalaryProfilePage.css:297`, `Trades.css:223`).
- **Wizard Contexts (NB2)**: Wizard contexts retain `#1e293b` (`CorporateActionWizard.css:290: .wizard-page .btn-secondary { color: #1e293b !important; }`, Specificity: `0,2,0`), which is explicitly scoped to the wizard.
- **Hover States**: Standard hover retains `#111827` (`App.css:170`).
- **Assessment**: Zero conflicts. Both standard `#374151` and wizard `#1e293b` colors are fully preserved.

### 4.3. `.btn-danger` Color Overrides
```powershell
$ git grep -n "\.btn-danger" frontend/src
```
- **`App.css:192, 199, 206`**: `.btn-danger` is defined **exclusively** in `App.css`.
- **Page CSS files**: Zero instances across the entire codebase. (`CorporateActionsList.css` defines `.action-btn-danger`, not `.btn-danger`).
- **Assessment**: Zero conflicts. Removing `!important` from lines 194 and 203 cannot cause any contextual rule to win or alter button text color.

### 4.4. `.table-container` Overflow-X Overrides
```powershell
$ git grep -n "\.table-container" frontend/src
```
- **`components/Table.css:2`**: `.table-container { overflow-x: auto; -webkit-overflow-scrolling: touch; }`.
- **`TaxConfigPage.css:255`**: `.card-table-wrapper { overflow-x: auto; }`.
- **`TaxConfigPage.css:642`**: `.admin-table-container { overflow-x: auto; }`.
- **`PaycheckListPage.css:94`**: `.paycheck-table-container { overflow-x: auto; }`.
- **`Lending.css:218` (NB3)**: `.lending-table-card { overflow-x: auto !important; }`. Note: `Lending.css` retains its own local `!important` on `.lending-table-card` until Phase 9C.
- **Assessment**: Every table container class defines `overflow-x: auto;` in its own CSS. Removing `!important` from `App.css` introduces zero clipping or scroll regressions.

### 4.5. `.btn` Base Text-Decoration Overrides
```powershell
$ git grep -n "text-decoration" frontend/src
```
- **`Trades.css:182, 195`**: `a.btn, a.btn:hover, a.btn:focus, a.btn:visited { text-decoration: none !important; }`.
- **`CorporateActionsList.css:56`**: `a.action-btn, a.action-btn:hover { text-decoration: none !important; }`.
- **`CorporateActionWizard.css:252`**: `a.action-btn, a.action-btn:hover { text-decoration: none !important; }`.
- **Page stylesheets**: No stylesheet in `frontend/src` specifies `text-decoration: underline` or contextual decoration on `.btn` or `a.btn`.
- **Assessment**: Zero conflicts. In `App.css`, `text-decoration: none;` remains the base rule on `.btn` (line 133) and `a.btn` (line 146).

### 4.6. `.btn:disabled` State-Based Overrides (`transform` & `box-shadow`)
```powershell
$ git grep -n "transform" frontend/src | grep "disabled"
$ git grep -n "box-shadow" frontend/src | grep "disabled"
```
- **`CorporateActionWizard.css:267-268`**: `.action-btn:disabled { transform: none !important; box-shadow: none !important; }`.
- **`CorporateActionsList.css:71-72`**: `.action-btn:disabled { transform: none !important; box-shadow: none !important; }`.
- **`Trades.css:201-202`**: `.btn:disabled { transform: none !important; box-shadow: none !important; }`.
- **Page stylesheets**: No stylesheet in `frontend/src` specifies hover transforms or hover shadows that apply when `:disabled` is set.
- **Assessment**: Zero conflicts. In `App.css`, `transform: none;` and `box-shadow: none;` remain on `.btn:disabled` (lines 152–153).

---

## 5. Proposed Changes

### Component 1: Branch Creation
- Branch: `phase-ui-2c-app-css-fix` created cleanly from `main`.

---

### Component 2: Staged `!important` Removal in `frontend/src/App.css`

#### [MODIFY] `frontend/src/App.css`

```diff
 /* Global Button Styles */
 .btn {
   display: inline-flex;
   align-items: center;
   justify-content: center;
   gap: 0.5rem;
   padding: 0.65rem 1.25rem;
   font-family: inherit;
   font-size: 0.92rem;
   font-weight: 600;
   border-radius: 8px;
   cursor: pointer;
-  text-decoration: none !important;
+  text-decoration: none;
   border: 1px solid transparent;
   transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
   box-sizing: border-box;
   line-height: 1.4;
   white-space: nowrap;
   outline: none;
 }
 
 a.btn,
 a.btn:hover,
 a.btn:focus,
 a.btn:visited {
-  text-decoration: none !important;
+  text-decoration: none;
 }
 
 .btn:disabled {
   opacity: 0.6;
   cursor: not-allowed;
-  transform: none !important;
-  box-shadow: none !important;
+  transform: none;
+  box-shadow: none;
 }
 
 .btn-primary {
   background: linear-gradient(135deg, #2563eb, #1d4ed8);
-  color: #ffffff !important;
+  color: #ffffff;
   border-color: #1d4ed8;
   box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
 }
 
 .btn-primary:hover:not(:disabled) {
   background: linear-gradient(135deg, #1d4ed8, #1e40af);
   box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
   transform: translateY(-1px);
-  color: #ffffff !important;
+  color: #ffffff;
 }
 
 .btn-primary:active:not(:disabled) {
   transform: translateY(0);
 }
 
 .btn-secondary {
   background: #ffffff;
-  color: #374151 !important;
+  color: #374151;
   border: 1px solid #d1d5db;
   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
 }
 
 .btn-secondary:hover:not(:disabled) {
   background: #f9fafb;
   border-color: #9ca3af;
-  color: #111827 !important;
+  color: #111827;
   transform: translateY(-1px);
 }
 
 .btn-secondary:active:not(:disabled) {
   transform: translateY(0);
 }
 
 .btn-danger {
   background: linear-gradient(135deg, #ef4444, #dc2626);
-  color: #ffffff !important;
+  color: #ffffff;
   border-color: #dc2626;
   box-shadow: 0 2px 6px rgba(220, 38, 38, 0.25);
 }
 
 .btn-danger:hover:not(:disabled) {
   background: linear-gradient(135deg, #dc2626, #b91c1c);
   box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);
   transform: translateY(-1px);
-  color: #ffffff !important;
+  color: #ffffff;
 }
 
 .btn-danger:active:not(:disabled) {
   transform: translateY(0);
 }
 ...
 .table-container,
 .table-responsive,
 .paycheck-table-container,
 .admin-table-container,
 .card-table-wrapper,
 .lending-table-card {
-  overflow-x: auto !important;
+  overflow-x: auto;
   -webkit-overflow-scrolling: touch;
 }
```

---

### Component 3: Scoped Overrides in `theme-components.css` & Global Spin in `theme.css`

#### [MODIFY] `frontend/src/styles/theme-components.css`

Add `.fs-page .dashboard-button` and `.fs-page .loading-spinner` overrides scoped under `.fs-page`, using `border-radius: var(--fs-radius-pill);` to strictly obey stylelint:

```css
/* ==========================================================================
   FinStat Design System — Scoped Page Overrides: Buttons & Spinners
   Governed by UI-UX-PLAN.md §6.6 (Phase 2C)
   ========================================================================== */

.fs-page .dashboard-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 2rem;
  padding: 0.75rem 1.5rem;
  font-size: var(--fs-text-base);
  font-family: var(--fs-font-sans);
  font-weight: var(--fs-weight-semibold);
  background: var(--fs-action-bg);
  color: var(--fs-action-text);
  border-radius: var(--fs-radius-md);
  text-decoration: none;
  border: 1px solid transparent;
  box-shadow: none;
  cursor: pointer;
  transition: background var(--fs-duration-fast) var(--fs-ease-standard);
}

.fs-page .dashboard-button:hover {
  background: var(--fs-action-hover);
  color: var(--fs-action-text);
}

.fs-page .loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--fs-border);
  border-top-color: var(--fs-text);
  border-radius: var(--fs-radius-pill);
  animation: spin 1s linear infinite;
}
```

#### [MODIFY] `frontend/src/styles/theme.css`

1. Add universal `@keyframes spin` definition:
```css
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

2. Merge loading spinner reduced-motion rule directly into the single existing `@media (prefers-reduced-motion: reduce)` block (lines 626–637) (NB1):
```diff
 @media (prefers-reduced-motion: reduce) {
   .fs-skeleton {
     animation: none;
     background: var(--fs-surface-raised);
   }
 
+  .fs-page .loading-spinner {
+    animation: none;
+  }
+
   .fs-btn,
   .fs-input,
   .fs-progress-bar {
     transition: none;
   }
 }
```

---

## 6. Verification Plan & Protocol

### Step-by-Step Staged Execution & Verification

1. **Step 1 — Create Branch**:
   ```powershell
   git checkout -b phase-ui-2c-app-css-fix
   ```

2. **Step 2 — Group 1: Link Text Decoration (2 removals)**:
   - Edit lines 133 & 146 in `frontend/src/App.css`.
   - Verify stylelint error count:
     ```powershell
     cd frontend; npx stylelint "src/App.css"
     ```
     **Assert**: `declaration-no-important` error count drops from 11 $\to$ **9**.
   - Rebuild bundle:
     ```powershell
     cd frontend; $env:NODE_OPTIONS="--max-old-space-size=4096"; npm run build
     ```
   - Run visual suite:
     ```powershell
     cd frontend; $env:CI="true"; npx playwright test --project=visual
     ```
     **Assert**: 326 passed, **0 diff**.

3. **Step 3 — Group 2: Disabled Transform & Box-Shadow (2 removals)**:
   - Edit lines 152 & 153 in `frontend/src/App.css`.
   - Verify stylelint error count:
     ```powershell
     cd frontend; npx stylelint "src/App.css"
     ```
     **Assert**: `declaration-no-important` error count drops from 9 $\to$ **7**.
   - Rebuild bundle & run visual suite:
     ```powershell
     cd frontend; $env:CI="true"; npx playwright test --project=visual
     ```
     **Assert**: 326 passed, **0 diff**.

4. **Step 4 — Group 3: `.btn-*` Colours (6 removals)**:
   - Edit lines 158, 167, 176, 184, 194, 203 in `frontend/src/App.css`.
   - Verify stylelint error count:
     ```powershell
     cd frontend; npx stylelint "src/App.css"
     ```
     **Assert**: `declaration-no-important` error count drops from 7 $\to$ **1**.
   - Rebuild bundle & run visual suite:
     ```powershell
     cd frontend; $env:CI="true"; npx playwright test --project=visual
     ```
     **Assert**: 326 passed, **0 diff**.

5. **Step 5 — Group 4: Table Container `overflow-x` (1 removal)**:
   - Edit line 237 in `frontend/src/App.css`.
   - Verify stylelint error count:
     ```powershell
     cd frontend; npx stylelint "src/App.css"
     ```
     **Assert**: `declaration-no-important` error count drops from 1 $\to$ **0**. Total stylelint problems drop from 61 $\to$ 50 (50 pre-existing violations remain for Phase 10 cleanup).
   - Rebuild bundle & run visual suite:
     ```powershell
     cd frontend; $env:CI="true"; npx playwright test --project=visual
     ```
     **Assert**: 326 passed, **0 diff**.

6. **Step 6 — Author `.fs-page` Component Overrides & Global Spin**:
   - Add `.fs-page .dashboard-button` and `.fs-page .loading-spinner` to `theme-components.css`.
   - Add `@keyframes spin` and merge spinner into existing reduced-motion block in `theme.css`.
   - Verify clean stylelint:
     ```powershell
     cd frontend; npx stylelint "src/styles/theme-components.css" "src/styles/theme.css"
     ```
     **Assert**: 0 stylelint errors.
   - Verify lint-tones:
     ```powershell
     node frontend/scripts/lint-tones.js
     ```
     **Assert**: 0 violations, 0 undefined tokens.

7. **Step 7 — Full Verification Suite (Exit Gate 2C)**:
   - Tokens check: `node frontend/scripts/tokens.js --check` (0 drift)
   - Ratchet check: `node frontend/scripts/lint-ratchet.js` (0 regressions, ratchet reduced)
   - Reference frames: `npx playwright test --project=reference` (3 passed, 0 diff)
   - Shell tests: `npx playwright test --project=shell` (7 passed, 0 diff)
   - Visual regression suite: `npx playwright test --project=visual` (326 passed, 0 diff)
   - Manifest verification: `node frontend/scripts/verify-baseline-manifest.js` (334/334 verified)
   - Unit tests: `npm test -- --watchAll=false --runInBand` (49 suites, 314 tests passed)

8. **Step 8 — Protocol for Accepted-Diff Register**:
   - If any visual diff surfaces during any group removal:
     1. Stop removal immediately and isolate the affected route.
     2. Inspect the element in Chrome DevTools to determine why the diff appeared.
     3. If the change was unintended (cascade regression), revert the change in that group and resolve.
     4. If the diff reveals an intended bug fix previously suppressed by `!important`, document and record it as a new Accepted Diff (`AD-*`) in `docs/UI-UX_Plan/UI-UX-PLAN.md` §6.6 and note in §10.
   - If 0 diff across all 326 tests, record: `"No accepted diffs; 0 route changes."`

9. **Step 9 — Walkthrough Artifact & Plan Documentation**:
   - Create walkthrough artifact `phase_2c_walkthrough.md` and copy to `docs/ui-plans/phase_2c_walkthrough.md`.
   - Update `docs/UI-UX_Plan/UI-UX-PLAN.md` §6.6 (Phase 2C checklist) and §10.
