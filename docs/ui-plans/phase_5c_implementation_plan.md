# Implementation Plan — UI Phase 5C: Paycheck Form, Part 1 (Styles Only) (v5)

## 1. Executive Summary & Goal Description

Phase 5C initiates the design system migration of FinStat's central compensation entry screen—**/salary/paychecks/new** and **/salary/paychecks/edit/:id** (`frontend/src/pages/salary/PaycheckFormPage.js` and `PaycheckFormPage.css`)—into the flat dark graphite design system.

In strict adherence to `UI-UX-PLAN.md §6.9` (lines 1680–1687), **Phase 5C is a styles-only phase**:
1. **Zero Route Allowlisting (`§6.9`)**: `/salary/paychecks/new` and `/salary/paychecks/edit/:id` **must not** be added to `THEMED_PATTERNS` in `ProtectedRoute.js`. The routes remain unthemed until Phase 5D. The root container in `PaycheckFormPage.js` remains `<div className="page-container">` (no `fs-page` class added in 5C).
2. **Strict Mixed-File Diff Rule (`§6.4` line 1302 & `§6.9`)**: `PaycheckFormPage.js` holds core statutory payroll calculations and temporal logic. The diff may modify **only** `className`, `style`, and JSX presentation structure. **Do not touch** `normalizePayDateInput`, calculation hooks, handlers, state machines, or validation logic.
3. **Complete Inline Styles Elimination**: Completely eliminate all **77 legacy inline style declarations** in `PaycheckFormPage.js` and tokenize all hardcoded hex values (`#009879`, `#6366f1`, `#8b5cf6`, `#0284c7`, `#ec4899`, `#10b981`, `#d97706`, `#f59e0b`, `#e11d48`, `#64748b`).
4. **Compatibility Contract for Unthemed 0-Diff vs Dormant Graphite Theme**: To preserve 0 visual diff on unthemed snapshots while eliminating all 77 inline styles, `PaycheckFormPage.css` maintains a dual-block architecture:
   - *Active Unscoped Legacy Block*: Retains legacy rules and maps extracted inline style classes to unscoped rules matching the unthemed look. Protected by scoped `/* stylelint-disable */` comments so the stylelint ratchet count remains $\le 86$ (ratchet preserved). This block is strictly temporary with a recorded Phase 5D sunset when the route is allowlisted.
   - *Dormant Scoped `.fs-page` Block*: Implements the tokenized graphite theme adhering to Reference Frame 02 (`docs/UI-UX_Plan/reference/02-form.html`). Contains zero raw hex and zero direct tone tokens. Activates in Phase 5D when allowlisted.
5. **No Global Primitive Classes in Unthemed Mode (B3 Resolution)**: Global primitive classes from `theme.css` (`.fs-btn`, `.fs-btn-primary`, `.fs-btn-secondary`, `.fs-num`) are unscoped and would bleed accent colors or tabular alignments onto the unthemed route. JSX in 5C uses page-local semantic classes (`.paycheck-submit-btn`, `.paycheck-cancel-btn`, `.paycheck-recalc-btn`, `.paycheck-preview-value`). In `PaycheckFormPage.css`, these are styled in the unscoped block with legacy properties, and in the scoped `.fs-page` block with dark graphite tokens.
6. **Recorded Plan Amendment (`.eslintignore`)**: CI's changed-files ESLint gate (`ci.yml:173-185`) lints modified JS files with `--max-warnings=0`. Files listed in `.eslintignore` trigger a warning that causes exit code 1. We eliminate all 173 ESLint errors and 20 a11y label warnings (`label-has-associated-control`) in `PaycheckFormPage.js`, allowing it to be safely removed from `frontend/.eslintignore` in 5C with clean ESLint (0 errors, 0 warnings).

---

## 2. User Review Required

> [!IMPORTANT]
> **No Early Route Allowlisting (`§6.9` Invariant)**:  
> Unlike Phases 4A, 4C, 5A, and 5B, Phase 5C does **not** add `/salary/paychecks/new` or `/salary/paychecks/edit/:id` to `THEMED_PATTERNS`. The page is styled in CSS, but remains unthemed in production routing until Phase 5D validation and walkthrough sign-off.

> [!CAUTION]
> **Zero Payroll Calculation Logic Modification (`§6.4` line 1302)**:  
> `normalizePayDateInput`, `triggerCalculation`, `handleSavePaycheck`, `extractProfileSalaryValues`, `computeLiveEstimate`, and all calculation dependencies must remain byte-for-byte identical in behavior. The 11/11 statutory calculation fixtures in `frontend/tests/calculations.spec.js` serve as the cryptographic characterization baseline.

> [!NOTE]
> **Compatibility Contract & Stylelint Ratchet**:  
> Extracted inline style colors are mapped to an unscoped legacy CSS block in `PaycheckFormPage.css` to guarantee 0 diff on `salary-paychecks-new @ 1440px`. To prevent ratchet regression above the merge-base baseline of 86 violations, the temporary unscoped compatibility block is wrapped in scoped `/* stylelint-disable */` comments. Direct `stylelint --max-warnings=0` on this file is deferred to Phase 5D when the legacy block is purged.

---

## 3. Plan & Tooling Amendments

### 1. Recorded Plan Amendment: Move `.eslintignore` Removal to Phase 5C
- **Amendment**: Move "Remove `PaycheckFormPage.js` from `frontend/.eslintignore`; verify clean ESLint" from Phase 5D (`UI-UX-PLAN.md §6.9` line 1695) to Phase 5C (`§6.9` line 1683).
- **Owner & Date**: Antigravity, 2026-11-20.
- **Reason**: CI's changed-files ESLint gate (`.github/workflows/ci.yml:173-185`) executes `npx eslint $CHANGED_FILES --max-warnings=0`. When an edited file is listed in `.eslintignore`, ESLint emits a warning:
  ```text
  warning File ignored because of a matching ignore pattern. Use "--no-ignore" to override
  ESLint found too many warnings (maximum: 0).
  ```
  This causes exit code 1. De-ignoring `PaycheckFormPage.js` in 5C after resolving all 173 errors and 20 warnings prevents this failure.
- **Scope Limit**: The three test files (`src/pages/salary/__tests__/PaycheckFormPage*.test.js`) remain in `.eslintignore`. Only `PaycheckFormPage.js` is de-ignored.
- **Tracking**: Recorded in `UI-UX-PLAN.md §6.9` and `§10 Progress Log`.

### 2. Tooling Amendment: Extend `playwright.config.js` Reference Project `testMatch`
- **Amendment**: In `frontend/playwright.config.js` line 37, update the `reference` project regex:
  ```javascript
  // Before:
  testMatch: /(reference-frames|dashboard-reference-match|expenditure-reference-match|expenditure-form-reference-match)\.spec\.js/,
  // After:
  testMatch: /(reference-frames|dashboard-reference-match|expenditure-reference-match|expenditure-form-reference-match|paycheck-form-reference-match)\.spec\.js/,
  ```
- **Owner & Date**: Antigravity, 2026-11-20.
- **Reason**: Permits discovery and execution of `frontend/tests/visual/paycheck-form-reference-match.spec.js` by Playwright's `reference` project.

### 3. Recorded Plan Amendment: Inline Styles Extraction Scope Alignment
- **Amendment**: Pull the complete extraction of all 77 inline style declarations from Phase 5D into Phase 5C.
- **Owner & Date**: Antigravity, 2026-11-20.
- **Reason**: `frontend/.eslintrc.json` enforces `no-restricted-syntax` which bans all `style={{ ... }}` declarations. Once `PaycheckFormPage.js` is removed from `.eslintignore` (Amendment 1) and touched in 5C, any surviving inline styles will fail the CI changed-files gate. Complete extraction in 5C ensures 0 errors.

### 4. Recorded Plan Amendment: Temporary Dual-Mode Legacy CSS Compatibility Block with Phase 5D Sunset
- **Amendment**: Author a temporary unscoped legacy compatibility block in `PaycheckFormPage.css` protected by scoped `/* stylelint-disable color-no-hex, color-named, function-disallowed-list, declaration-property-value-allowed-list, declaration-property-value-disallowed-list */` comments.
- **Owner & Date**: Antigravity, 2026-11-20.
- **Precedent**: Follows the Phase 2F precedent (`UI-UX-PLAN.md §12` line 1968) where temporary unscoped compatibility rules were bounded and given an explicit sunset.
- **Sunset**: The unscoped compatibility block and its `stylelint-disable` comments will be completely purged in Phase 5D when `/salary/paychecks/new` and `/salary/paychecks/edit/:id` are allowlisted. In Phase 5D, `PaycheckFormPage.css` will be required to pass direct `stylelint --max-warnings=0` cleanly.

### 5. Recorded Plan Amendment: Deferral of Loading Primitive (`<Loading variant="route" />`) to Phase 5D
- **Amendment**: Retain the markup structure and tag hierarchy of the legacy loading state in `PaycheckFormPage.js:654-661` (`RefreshCw` spinner + status text) while extracting inline styles to `.paycheck-loading-*` classes. Adoption of `<Loading variant="route" />` per D23 and §6.4 line 1290 is deferred to Phase 5D.
- **Owner & Date**: Antigravity, 2026-11-20.
- **Reason**: Preserves 0-diff on unthemed loading state snapshots during the styles-only Phase 5C. When the route is allowlisted in Phase 5D, the loading state will be switched to the shared `<Loading variant="route" />` component.

### 6. Deferred Form Accessibility Scope (Phase 5D)
- In accordance with the strict Phase 5C scope rule (`§6.4` line 1302: presentation and CSS extraction only, no logic or DOM behavior modifications), the following form accessibility features are explicitly deferred to Phase 5D:
  - `aria-required="true"` on statutory required inputs.
  - `aria-describedby` linking inputs to helper texts or field error containers.
  - `aria-invalid="true"` dynamic bindings on invalid inputs.
  - Inline field error rendering and focus management.
- In Phase 5C, we resolve all 20 `jsx-a11y/label-has-associated-control` warnings by pairing existing `<label>` elements with input `id` attributes via `htmlFor`.

---

## 4. Preconditions

Before modifying code or creating branch `phase-ui-5c-paycheck-form-a`, verify:

1. **PC-1: `.eslintignore` Pre-State**:
   ```powershell
   git grep -n "PaycheckFormPage" frontend/.eslintignore
   ```
   *Expect*: Line 74 `src/pages/salary/PaycheckFormPage.js`, lines 76–78 for test files.
2. **PC-2: Shared Theme Primitives Existence**:
   ```powershell
   git grep -n "fs-btn" frontend/src/styles/theme.css
   git grep -n "fs-num" frontend/src/styles/theme.css
   ```
   *Expect*: `.fs-btn`, `.fs-btn-primary`, `.fs-btn-secondary`, `.fs-num` exist in `theme.css`.
3. **PC-3: `Loading.js` Variant Support**:
   ```powershell
   git grep -n "VALID_VARIANTS" frontend/src/components/ui/Loading.js
   ```
   *Expect*: Supports `['route', 'card', 'table', 'form-field', 'inline']`.
4. **PC-4: Baseline Pre-Existence**:
   ```powershell
   cd D:\Projects\FinStat-visual-baselines
   git ls-files 'salary-paychecks-new*' 'salary-paychecks-edit*'
   ```
   *Expect*: Baselines exist for both slugs at 1440, 1024, 768, 480, and 390px.
5. **PC-5: Manifest Integrity Pre-Check**:
   ```powershell
   node frontend/scripts/verify-baseline-manifest.js
   ```
   *Expect*: `334/334 baselines verified successfully.`
6. **PC-6: Characterization Engine Pre-Check**:
   ```powershell
   cd frontend; npx jest tests/calculations.spec.js
   ```
   *Expect*: 11/11 tests pass.
7. **PC-7: Hex Code & Style Isolation Pre-Check (B1 Fixed)**:
   ```powershell
   git grep -n "style={{" frontend/src/pages/salary/PaycheckFormPage.js | Measure-Object -Line
   git grep -n -A 12 "const DISBURSEMENT_TYPES = \[" frontend/src/pages/salary/PaycheckFormPage.js | Select-String "color: '#" | Measure-Object -Line
   ```
   *Expect*: Exactly 77 inline styles total, and exactly 9 hardcoded hex colors in the `DISBURSEMENT_TYPES` literal.
8. **PC-8: Clean Git Status**:
   ```powershell
   git status
   ```
   *Expect*: Working tree clean on `main` (with plan/review docs committed or tracked).
9. **PC-9: Allowlist Pre-State**:
   ```powershell
   git grep -n "'/salary/paychecks" frontend/src/components/ProtectedRoute.js
   ```
   *Expect*: Exactly 1 match (`'/salary/paychecks'`). New and edit routes are absent.
10. **PC-10: Loading State Structure Pre-Check**:
    Verify lines 654–661 in `PaycheckFormPage.js` render `<div className="page-container">`, `<RefreshCw className="spinning-icon" ...>`, and `<p>Loading profile & paycheck details...</p>`. Extracted classes (`.paycheck-loading-container`, `.paycheck-loading-icon`, `.paycheck-loading-text`) retain the exact element tag hierarchy and string content.

---

## 5. Proposed Architecture & Component Flow

```mermaid
graph TD
    subgraph Phase 5C Scope: Styles & Presentation Only
        A["PaycheckFormPage.js (Unthemed Route)"] --> B["Dual-Block Stylesheet (PaycheckFormPage.css)"]
        B --> C["Active Unscoped Legacy Block<br/>(Preserves unthemed 0-diff, stylelint-disabled)"]
        B --> D["Dormant Scoped .fs-page Block<br/>(Adheres to Frame 02 flat dark graphite)"]
    end

    subgraph Verification Modes
        C --> E["PR-Subset Visual Regression (71/71 tests)<br/>Asserts 0-diff on unthemed new & edit routes"]
        D --> F["Reference Match Test Harness<br/>Injects data-fs-theme='dark' & .fs-page<br/>Asserts Frame 02 graphite tokens & 2px cue"]
        A --> G["Calculations Fixtures (11/11 pass)<br/>Zero payroll logic modified"]
        A --> H["CI Changed-Files ESLint Gate (0 warnings)<br/>77 inline styles eliminated, 20 labels paired"]
    end

    subgraph Phase 5D Sunset
        C -.->|Deleted in 5D upon allowlist| I["Clean Tokenized Page CSS<br/>(stylelint exit-0 without disables)"]
    end
```

### Disbursement Types 9-Type Explicit Mapping Table (B5 Resolution)

In `PaycheckFormPage.js`, each item in `DISBURSEMENT_TYPES` is assigned a semantic identifier `typeClass`:

| # | Type `id` | Legacy Color | `typeClass` | Unscoped Selected Style | Scoped `.fs-page` Style (Frame 02) |
|---|---|---|---|---|---|
| 1 | `Regular` | `#009879` | `type-regular` | `border: 2px solid #009879; bg: #f8fafc; shadow: 0 0 0 1px #00987920` | `bg: var(--fs-surface-raised); border-left: 2px solid var(--fs-text-2)` |
| 2 | `Basic Months` | `#6366f1` | `type-basic-months` | `border: 2px solid #6366f1; bg: #f8fafc; shadow: 0 0 0 1px #6366f120` | `bg: var(--fs-surface-raised); border-left: 2px solid var(--fs-text-2)` |
| 3 | `Basic Production` | `#8b5cf6` | `type-basic-production` | `border: 2px solid #8b5cf6; bg: #f8fafc; shadow: 0 0 0 1px #8b5cf620` | `bg: var(--fs-surface-raised); border-left: 2px solid var(--fs-text-2)` |
| 4 | `Sector Bonus` | `#0284c7` | `type-sector-bonus` | `border: 2px solid #0284c7; bg: #f8fafc; shadow: 0 0 0 1px #0284c720` | `bg: var(--fs-surface-raised); border-left: 2px solid var(--fs-text-2)` |
| 5 | `Individual Bonus` | `#ec4899` | `type-individual-bonus` | `border: 2px solid #ec4899; bg: #f8fafc; shadow: 0 0 0 1px #ec489920` | `bg: var(--fs-surface-raised); border-left: 2px solid var(--fs-text-2)` |
| 6 | `Surplus` | `#10b981` | `type-surplus` | `border: 2px solid #10b981; bg: #f8fafc; shadow: 0 0 0 1px #10b98120` | `bg: var(--fs-surface-raised); border-left: 2px solid var(--fs-text-2)` |
| 7 | `Bond Distribution` | `#d97706` | `type-bond-distribution` | `border: 2px solid #d97706; bg: #f8fafc; shadow: 0 0 0 1px #d9770620` | `bg: var(--fs-surface-raised); border-left: 2px solid var(--fs-text-2)` |
| 8 | `End of Year Bonus` | `#f59e0b` | `type-end-of-year-bonus` | `border: 2px solid #f59e0b; bg: #f8fafc; shadow: 0 0 0 1px #f59e0b20` | `bg: var(--fs-surface-raised); border-left: 2px solid var(--fs-text-2)` |
| 9 | `Prepaid` | `#64748b` | `type-prepaid` | `border: 2px solid #64748b; bg: #f8fafc; shadow: 0 0 0 1px #64748b20` | `bg: var(--fs-surface-raised); border-left: 2px solid var(--fs-text-2)` |

#### Unselected State for All 9 Types:
- **Unscoped Legacy**: `background: #ffffff; border: 1px solid #e2e8f0; color: #1e293b; icon-bg: ${color}15; icon-color: ${color}; desc: #64748b`.
- **Scoped `.fs-page`**: `background: var(--fs-surface); border: 1px solid var(--fs-border); border-left: 1px solid var(--fs-border); color: var(--fs-text); icon-bg: var(--fs-surface-raised); icon-color: var(--fs-text-2); desc: var(--fs-text-muted)`.

#### Selected State for All 9 Types:
- **Unscoped Legacy**: Styled via `.paycheck-type-btn.type-*.selected` per the table above.
- **Scoped `.fs-page`**: Unified flat dark graphite treatment (G5):
  ```css
  .fs-page .paycheck-type-btn.selected {
    background: var(--fs-surface-raised);
    border: 1px solid var(--fs-border-strong);
    border-left: 2px solid var(--fs-text-2);
    box-shadow: none;
  }
  .fs-page .paycheck-type-btn.selected .paycheck-type-title {
    color: var(--fs-text);
  }
  .fs-page .paycheck-type-btn.selected .paycheck-type-icon-wrapper {
    background: var(--fs-surface);
    color: var(--fs-text);
  }
  ```

---

## 6. Detailed Implementation Steps

### Step 1: Tooling Amendment
In `frontend/playwright.config.js` line 37:
```javascript
testMatch: /(reference-frames|dashboard-reference-match|expenditure-reference-match|expenditure-form-reference-match|paycheck-form-reference-match)\.spec\.js/,
```

### Step 2: Scoped Stylesheet Conversion in `frontend/src/pages/salary/PaycheckFormPage.css`
Author `PaycheckFormPage.css` containing:

1. **Temporary Unscoped Legacy Compatibility Block**:
   ```css
   /* ==========================================================================
      TEMPORARY LEGACY COMPATIBILITY BLOCK (Phase 5C only, Sunset: Phase 5D)
      Preserves byte-for-byte unthemed appearance during styles-only phase.
      Governed by Recorded Plan Amendment 4.
      ========================================================================== */
   /* stylelint-disable color-no-hex, color-named, function-disallowed-list, declaration-property-value-allowed-list, declaration-property-value-disallowed-list */
   ...
   /* stylelint-enable color-no-hex, color-named, function-disallowed-list, declaration-property-value-allowed-list, declaration-property-value-disallowed-list */
   ```
   Contains all legacy unscoped rules plus classes extracted from inline styles (`.paycheck-submit-btn`, `.paycheck-cancel-btn`, `.paycheck-type-btn`, `.type-regular`, etc.) matching original unthemed hex values, gradients, and shadows.

2. **Dormant Scoped `.fs-page` Block (Reference Frame 02)**:
   - All rules strictly scoped under `.fs-page`:
     ```css
     .fs-page .page-container {
       background: var(--fs-bg);
       color: var(--fs-text);
       max-width: 1200px;
       margin: 0 auto;
       padding: 1.5rem 1rem;
     }
     .fs-page .paycheck-card {
       background: var(--fs-surface);
       border: var(--fs-border-width) solid var(--fs-border);
       border-radius: var(--fs-radius-lg);
       padding: 1.5rem;
       margin-bottom: 1.5rem;
     }
     /* Form controls aligned with Reference Frame 02 and theme-components.css */
     .fs-page .form-group input,
     .fs-page .form-group select,
     .fs-page .form-group textarea,
     .fs-page .form-control {
       background: var(--fs-surface);
       color: var(--fs-text);
       border: var(--fs-border-width) solid var(--fs-border-control);
       border-radius: var(--fs-radius-sm);
       font-family: var(--fs-font-sans);
     }
     .fs-page .form-group label {
       color: var(--fs-text-2);
       font-size: var(--fs-text-xs);
       font-weight: var(--fs-weight-medium);
     }
     /* Buttons: page-local classes styled with theme tokens */
     .fs-page .paycheck-submit-btn {
       background: var(--fs-action-bg);
       color: var(--fs-action-text);
       border: 1px solid transparent;
       border-radius: var(--fs-radius-md);
       font-family: var(--fs-font-sans);
       font-size: var(--fs-text-sm);
       font-weight: var(--fs-weight-medium);
       padding: 0.625rem 1.25rem;
       cursor: pointer;
     }
     .fs-page .paycheck-cancel-btn {
       background: var(--fs-surface-raised);
       color: var(--fs-text);
       border: 1px solid var(--fs-border-control);
       border-radius: var(--fs-radius-md);
       font-family: var(--fs-font-sans);
       font-size: var(--fs-text-sm);
       padding: 0.625rem 1.25rem;
       cursor: pointer;
     }
     /* Read-only calculated inputs */
     .fs-page .paycheck-calc-readonly {
       background: var(--fs-surface-raised);
       color: var(--fs-text-2);
       border-color: var(--fs-border);
       font-family: var(--fs-font-mono);
     }
     ```
   - Zero raw hex, zero banned effects, zero unlisted radii, zero direct tone tokens (`var(--fs-accent)` is never used; semantic action token `var(--fs-action-bg)` is used).

### Step 3: `frontend/src/pages/salary/PaycheckFormPage.js` Presentation Refactor
1. **Preserve Root Container**: Keep `<div className="page-container">` (no `fs-page` in 5C).
2. **Remove All 77 Inline `style={{ ... }}` Declarations**: Replace each with a semantic class name.
3. **Disbursement Types Array**:
   - Remove presentation-only `color` property from `DISBURSEMENT_TYPES` items.
   - Add semantic `typeClass: 'type-regular'`, etc.
   - Button renders `className={`paycheck-type-btn ${dt.typeClass} ${isSelected ? 'selected' : ''}`}`.
4. **Form Labels Association**:
   - Pair all 20 `<label>` elements with input `id` attributes via `htmlFor="field-id"`.
5. **No Global Primitive Classes**:
   - Do NOT add `.fs-btn`, `.fs-btn-primary`, `.fs-btn-secondary`, or `.fs-num` in JSX during 5C. Use `.paycheck-submit-btn`, `.paycheck-cancel-btn`, etc.
6. **Strict Logic Preservation (`§6.4` line 1302)**:
   - Ensure byte-for-byte identical code in `normalizePayDateInput`, `triggerCalculation`, `handleSavePaycheck`, `extractProfileSalaryValues`, `computeLiveEstimate`, and all form state handlers.

### Step 4: `.eslintignore` Update
In `frontend/.eslintignore`, delete line 74:
```text
src/pages/salary/PaycheckFormPage.js
```
Leave the three test files (`src/pages/salary/__tests__/PaycheckFormPage*.test.js`) untouched in `.eslintignore`.

### Step 5: Test Specs Authoring
1. **Reference Frame 02 Match Test**:
   Author `frontend/tests/visual/paycheck-form-reference-match.spec.js`:
   - Navigates to `/salary/paychecks/new`.
   - Injects dark theme and `.fs-page` via `page.evaluate()`:
     ```javascript
     await page.evaluate(() => {
       document.documentElement.dataset.fsTheme = 'dark';
       document.querySelector('main').classList.add('fs-page');
     });
     ```
   - Verifies Frame 02 design token computed properties:
     - Primary Save CTA background matches computed `var(--fs-action-bg)` and text matches `var(--fs-action-text)`.
     - Exactly one primary accent CTA on page.
     - Stacked card container background matches computed `var(--fs-surface)` and border matches `var(--fs-border)`.
     - Form input background matches computed `var(--fs-surface)` and border-radius matches `var(--fs-radius-sm)` (4px), aligning with `theme-components.css`.
     - Selected disbursement button exhibits 2px left indicator (`border-left-width: 2px`).
     - Statutory preview warning banner preserves `⚠` glyph, label, and `role="alert"`.
     - Zero horizontal overflow (`scrollWidth <= clientWidth`) at 390px.
2. **Jest-Axe Component Test**:
   Author `frontend/src/pages/salary/__tests__/PaycheckFormPageAxe.test.js`:
   - Renders `PaycheckFormPage` within `MemoryRouter` with a mock store/context.
   - Runs `await axe(container)` and asserts zero critical or serious accessibility violations.

---

## 7. Quality Gates Verification Plan (13 Gates)

All commands executed from `frontend/` unless otherwise indicated:

1. **Characterization Engine (I3)**:
   ```powershell
   npx jest tests/calculations.spec.js
   ```
   *Expected*: 11/11 tests pass. Snapshot byte-identical to Phase 1C baseline.

2. **PaycheckFormPage Unit Test Suites (I10)**:
   ```powershell
   npm test -- --watchAll=false src/pages/salary/__tests__/PaycheckFormPage.test.js src/pages/salary/__tests__/PaycheckFormPageTax.test.js src/pages/salary/__tests__/PaycheckFormPageTimezone.test.js
   ```
   *Expected*: All 16 unit tests across the 3 test suites pass.

3. **CI Changed-Files ESLint Gate Simulation (Gate Coverage Fixed)**:
   ```powershell
   npx eslint src/pages/salary/PaycheckFormPage.js src/pages/salary/__tests__/PaycheckFormPageAxe.test.js --max-warnings=0
   ```
   *Expected*: 0 errors, 0 warnings, exit code 0.

4. **Stylelint Ratchet & Tone Linters (I11, I14, I15, B2)**:
   ```powershell
   node scripts/tokens.js --check
   node scripts/lint-tones.js
   node scripts/lint-ratchet.js
   ```
   *Expected*: All exit 0. `lint-ratchet.js` verifies `PaycheckFormPage.css` violations $\le 86$ (ratchet preserved). `lint-tones.js` verifies zero direct tone/accent tokens in page CSS and zero undefined tokens.

5. **Route Allowlist Assertion (I1, I7)**:
   ```powershell
   node scripts/ui-coverage.js --assert-allowlist
   ```
   *Expected*: Exactly 12 allowlisted routes. `/salary/paychecks/new` and `/salary/paychecks/edit/:id` are **not** allowlisted.

6. **Test ID & Accessibility Label Guard (I5)**:
   ```powershell
   node scripts/testid-guard.js
   ```
   *Expected*: Clean diff against merge-base. 0 test IDs or accessible labels deleted or modified.

7. **Jest-Axe Component Test & Real-Browser Playwright Axe (I10)**:
   - Run Jest-Axe component test:
     ```powershell
     npm test -- --watchAll=false src/pages/salary/__tests__/PaycheckFormPageAxe.test.js
     ```
     *Expected*: 0 axe violations on the rendered form component in jsdom.
   - Run Playwright real-browser axe test:
     ```powershell
     npx playwright test --project=a11y -g "salary-paychecks-new|salary-paychecks-edit"
     ```
     *Expected*: 0 critical or serious axe violations in Chromium.

8. **Application Route Suite & Dashboard RTL Regression Suites (I8, I10)**:
   ```powershell
   npm test -- --watchAll=false src/App.test.js src/pages/dashboard/__tests__/DashboardSummary.test.js src/pages/dashboard/__tests__/DashboardKpiStrip.test.js src/pages/dashboard/__tests__/DashboardPanels.test.js src/pages/dashboard/__tests__/useDashboardData.test.js
   ```
   *Expected*: 5 test suites pass (App.test.js 9/9, and 31 tests across the 4 Dashboard suites).

9. **Canonical Reference Frame 02 Match Spec with Harness Injection (B4 Fixed)**:
   ```powershell
   npx playwright test --project=reference tests/visual/paycheck-form-reference-match.spec.js
   ```
   *Expected*: All assertions pass against computed design tokens (Save CTA has computed `var(--fs-action-bg)` and `var(--fs-action-text)`, exactly one accent CTA, inputs compute to `var(--fs-surface)` and `var(--fs-radius-sm)` per Frame 02 and `theme-components.css`, selected disbursement button exhibits 2px left indicator cue).

10. **Visual Regression PR-Subset Gate (71/71) & Four-Part Diff Report**:
    ```powershell
    $env:CI="true"; $env:PR_SUBSET="true"; npx playwright test --project=pr-subset
    ```
    *Authoritative Scope*: 71 tests (1 auth setup + 65 routes at 1440px + 5 smoke routes at 390px).
    *Required Report Structure*:
    - (a) Total routes tested: 71.
    - (b) Zero-diff routes: 71 (including `salary-paychecks-new` and `salary-paychecks-edit` at 1440px).
    - (c) Accepted diffs: 0.
    - (d) Unexplained diffs: 0.

11. **Baseline Manifest Integrity**:
    ```powershell
    node scripts/verify-baseline-manifest.js
    ```
    *Expected*: All 334 baseline snapshots in `D:\Projects\FinStat-visual-baselines` match manifest SHA-256 hashes.

12. **Banned Pattern & Anti-Slop Audit (§7.1)**:
    ```powershell
    git grep -rn '#14b8a6' src/pages/salary/ src/components/salary/
    ```
    *Expected*: Zero occurrences of `#14b8a6` across all salary page and component files. Verify no page-level horizontal overflow at 390px.

13. **Production Build Compilation (I9)**:
    ```powershell
    cmd /c "set NODE_OPTIONS=--max-old-space-size=8192 && npm run build"
    ```
    *Expected*: Clean production build with zero compilation errors using the proven 8192 MB heap allocation.

---

## 8. Verbatim Master Plan Invariants Matrix (UI-UX-PLAN.md §2)

These 16 invariants are verified at every sub-phase:

| # | Rule | Verification | Plan Compliance / Evidence |
| :--- | :--- | :--- | :--- |
| **I1** | Production routes and URLs unchanged — 75 entries (74 protected + `*`), 10 redirects. | `App.test.js` route-resolution test; `ui-coverage.js` diff | Verified in gate 8 (`App.test.js` 9/9 passing) and gate 5 (`ui-coverage.js --assert-allowlist`). |
| **I2** | No API call, payload shape, or service file changed. | PR diff review; blocked path list in CI | No service file touched. Handlers and submission payload in `PaycheckFormPage.js` preserved byte-identically. |
| **I3** | No calculation changed on **any** page: payroll, installment schedules, debt payoff, trade P&L, certificate maturity/interest, FX conversion, budget thresholds, real-estate yield. | Characterization fixtures (§9.6) | Verified in gate 1 (`tests/calculations.spec.js` 11/11 tests pass byte-identically). |
| **I4** | Auth, roles, `ProtectedAction`, and `useCanModify` gating unchanged. | Viewer-role checklist per phase | Auth gating unchanged: route is protected by `ProtectedRoute.js`. `PaycheckFormPage.js` contains no auth hooks or role checks; route accessibility is governed by `ProtectedRoute`. |
| **I5** | Test IDs, `data-*` attributes, and accessible labels preserved — 37 `data-testid`, 39 `aria-label`. | test-ID guard script (§9.2) | Verified in gate 6 (`node frontend/scripts/testid-guard.js` clean diff). |
| **I6** | Tables render as compact-expand cards at ≤ 768px (D19). Horizontal scroll preserved only for tables with ≥ 12 columns (audit logs) where the card pattern is impractical. No page-level horizontal scroll at 390px. | 390 px visual check: card layout renders, no page-level horizontal scroll, all fields reachable via expander. | Form grids collapse to single-column at $\le 768\text{px}$; touch targets $\ge 44\text{px}$; zero page-level horizontal overflow (`scrollWidth <= clientWidth`). |
| **I7** | No page loses functionality mid-migration. | Pattern added only in the converting PR (§6.3) | `/salary/paychecks/new` remains unthemed in 5C. Zero functional disruption. |
| **I8** | Dashboard coordinator line cap preserved — `DashboardSummary.js` must remain $\le 120$ lines (post-audit architecture decomposition invariant). All 10 RTL dashboard tests must remain green. | Line count assertion + `npm test` in 3A | Verified in gate 8 (`DashboardSummary.js` line cap and 31 dashboard RTL tests pass). |
| **I9** | Production build passes with zero errors and no new warnings. | CI (authoritative); local proxy via `npm start` + ESLint/stylelint (§15) | Verified in gate 13 (`NODE_OPTIONS=--max-old-space-size=8192 npm run build`). |
| **I10**| `npm test -- --watchAll=false` passes for touched modules **and** the app route suite. | CI (frontend test job added in 1C); local proxy: touched suites via `npx jest --runInBand` (§15) | Verified in gates 2, 7, and 8 (`PaycheckFormPage` suites, Axe suite, and `App.test.js`). |
| **I11**| No new `!important`; a file's count in the 1C lint ratchet may only fall. | stylelint + `lint-ratchet.js` (§9.2) | Verified in gate 4 (`node scripts/lint-ratchet.js`). Zero new `!important`. |
| **I12**| No new dependency except the Phase 1C tooling list (§9.2). | `package.json` review | `package.json` diff is empty. Zero new dependencies introduced. |
| **I13**| Every non-allowlisted route is pixel-identical to its 1B baseline. | Walkthrough-evidenced per §7.1: developer-run Playwright diff report attached to each phase walkthrough, with zero unexplained diffs. | Verified in gate 10 (`$env:CI="true"; $env:PR_SUBSET="true"; npx playwright test --project=pr-subset`: 71/71 passing with 0 diff on unthemed routes). |
| **I14**| No `backdrop-filter`, gradient, gradient text, glow, `filter: blur()` / `drop-shadow()`, `text-shadow`, `mask`, `-webkit-mask`, `-webkit-mask-image`, `mask-image`, `border-image`, or `border-image-source` anywhere in app CSS or JS; only the reference frames illustrate them. | stylelint (§9.2) | Verified in gate 4. The scoped `.fs-page` rules contain zero banned effects. Unscoped legacy compatibility block is governed by Recorded Amendment 4 with scheduled Phase 5D sunset. |
| **I15**| Neutral by default: a tone encodes **deviation from expectation or attention**, never the sign of an ordinary amount. Expense amounts, income, and balances are neutral (§4.3). A page never references a tone token directly; it uses `Delta`, `Badge`, or a `.fs-progress--*` modifier. | stylelint + `lint-tones.js` + §4.3 domain table + §7.2 | Verified in gate 4 (`node scripts/lint-tones.js`). Preview amounts use neutral `.fs-num`. No direct tone tokens in page CSS. |
| **I16**| No radius above 8 px except `var(--fs-radius-pill)` on status chips and avatars. | stylelint (§9.2) | Verified in gate 4 (`node scripts/lint-ratchet.js`). The scoped `.fs-page` card radii use `var(--fs-radius-lg)` (8px), inputs/badges use `var(--fs-radius-sm)` (4px) or `var(--fs-radius-md)` (6px). Legacy block governed by Recorded Amendment 4. |

---

## 9. Walkthrough Artifact Requirements (§7.1, §7.2)

Upon completion of Phase 5C implementation and quality gates verification, the walkthrough document `docs/ui-plans/phase_5c_walkthrough.md` will record:
1. **Four-Part Visual Regression Diff Report**:
   - Total routes tested: 71
   - Zero-diff routes: 71
   - Accepted diffs: 0
   - Unexplained diffs: 0
2. **Before / After Screenshots**:
   - Unthemed live route at 1440px and 390px (0-diff evidence).
   - Test-harness injected `.fs-page` dark graphite preview at 1440px and 390px.
3. **Master Plan & Progress Log Updates**:
   - Update `docs/UI-UX_Plan/UI-UX-PLAN.md §5 Status Matrix`, `§6.1 Route Migration Master Table`, and `§10 Progress Log`.
   - Update root `CHANGELOG.md` with Phase 5C entry.
4. **Evidence Outputs**:
   - Full command output for all 13 quality gates.
