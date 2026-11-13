# Walkthrough — UI Phase 2D: Shared Component Overrides

> **Status:** Complete & Fully Verified  
> **Branch:** `phase-ui-2d-shared-components`  
> **Governing Spec:** `docs/UI-UX_Plan/UI-UX-PLAN.md` §6.6 (Phase 2D) & `docs/ui-plans/phase_2d_implementation_plan.md` (v2)  
> **Exit Gate Status:** **PASSED** (0 legacy edits [E1], 0 undefined tokens, 0 ratchet regressions, 3/3 reference frames pass, 10/10 dual-mode shared tests pass, 7/7 shell tests pass, 326/326 visual route regression tests pass with 0 diff [I13], 334/334 manifest baselines intact, 50/50 unit test suites pass [317/317 tests])

---

## 1. Summary of Changes

Phase 2D implements `.fs-page`-scoped Plain CSS expanded overrides for all shared components in `frontend/src/styles/theme-components.css` while strictly adhering to **Constraint E1** (zero edits to legacy shared CSS files) and **Invariant I13** (zero diff on unmigrated routes):

1. **Plan Amendment v10.3 Landed on `main` (`5d14422`)**:
   - Sub-phase 2F added ("Universal loading pattern", D23), advancing sub-phase count from 37 to 38.
   - Primitive #8 (`Loading`) documented in §8.4.
   - Action token `--fs-danger-hover: #c36066` added to `tokens.json`; regenerated `tokens.css` and §4.9.1 contrast tables (4.77:1, Pass).
   - Refined §6.4 loading row and updated dependency graph (`2D -> 2E -> 2F -> 3A`).
2. **Shared Component Shadow Overrides in `theme-components.css`**:
   - **Tables**: `.fs-page .styled-table`, `.fs-page .table-container`, header on `--fs-surface-sunken`, borders `--fs-border`, hover `--fs-surface-raised`, zebra `--fs-surface-sunken`.
   - **Forms**: `.fs-page .paycheck-form-container`, `.fs-page .form-group` inputs, textareas, selects, focus rings, disabled states, and submit button.
   - **Modals & Overlays**: `.fs-page .modal-overlay` & `html[data-fs-theme] .modal-overlay` with `--fs-scrim` (`rgba(8, 9, 11, 0.72)`), opaque `--fs-surface` card, 8px ceiling radius (`--fs-radius-lg`), safe neutral close buttons, and explicit `backdrop-filter: none;` (`-webkit-backdrop-filter: none;`) to suppress legacy blurs.
   - **ConfirmModal**: `.fs-page .confirm-modal-content` on `--fs-surface`, `--fs-radius-lg`, destructive action on `--fs-danger` with `--fs-ink` text (`#0d0e10` / `rgb(13, 14, 16)`, 6.00:1 contrast, passing WCAG 2.1 AA), and explicit `backdrop-filter: none;` suppressing legacy `blur(2px)`.
   - **Banners & Actions**: `.fs-page .view-only-banner` (`--fs-surface-raised` + `--fs-warning` `#cfa24f`, explicit `backdrop-filter: none;` suppressing legacy `blur(8px)`), `.fs-page .protected-action-wrapper` opacity gating (`--fs-disabled-opacity: 0.45`).
   - **Pagination**: `.fs-page .pagination-container` neutral controls on `--fs-surface`, `--fs-border-control`, and 4px radius (`--fs-radius-sm`).
   - **Summary & Analytics**: `.fs-page .summary-row`, `.fs-page .period-item` on `--fs-surface-raised`, `.fs-page .analysis-card`.
   - **ComponentTable**: `.fs-page .component-table-wrapper`, custom component table zebra and inputs.
   - **AppLauncher**: `.fs-page .launcher-panel` on `--fs-surface` (`rgb(26, 28, 32)`), search input, tabs, action cards, and `backdrop-filter: none;` suppressing legacy `blur(10px)`.
3. **`DataLoader.js` Colour Inheritance**:
   - Replaced hardcoded `#3b82f6` with `currentColor` on SVG circle stroke and bouncing dots, allowing dynamic inheritance without route gates.
4. **Behavioral Unit Testing**:
   - Added `frontend/src/components/__tests__/DataLoader.test.js` validating `currentColor` stroke and dot rendering (3/3 pass).
5. **Dual-Mode Static Verification Architecture (W3)**:
   - Created static dual-mode HTML fixture `frontend/tests/visual/fixtures/shared/shared-components.html` served on port 3001.
   - Added dedicated Playwright test suite `frontend/tests/visual/shared-components.spec.js` running under `--project=shared` (10/10 dual-mode shared tests pass).

---

## 2. W1: Plan Amendment v10.3 Integrity Verification

The 11 changes required by v10.3 were verified on `main` at `5d14422`:

```powershell
git log --oneline -1 5d14422
# Output:
# 5d14422 docs(plan): land plan amendment v10.3 with universal loading pattern (D23), sub-phase 2F, and --fs-danger-hover token

git grep -n "phase-ui-2f-loading" docs/UI-UX_Plan/UI-UX-PLAN.md
# Output:
# docs/UI-UX_Plan/UI-UX-PLAN.md:1048:| **2F** | Universal loading pattern (D23, `<Loading>` primitive) | `phase-ui-2f-loading` | ☐ | ☐ |

grep -c "2F" docs/UI-UX_Plan/UI-UX-PLAN.md
# Output:
# 25

grep -c "P2F" docs/UI-UX_Plan/UI-UX-PLAN.md
# Output:
# 2

grep -A3 "#### 2F" docs/UI-UX_Plan/UI-UX-PLAN.md
# Output:
# #### 2F — Universal loading pattern
# 
# **Goal:** Every route that shows any loading indication shows the same loading indication. Establish `<Loading>` primitive and migrate every page's ad-hoc loading UI to it.

grep -c "D23" docs/UI-UX_Plan/UI-UX-PLAN.md
# Output:
# 5

git grep -i "Loading" frontend/src/styles/tokens.css
# Output: (empty - 0 occurrences, confirming no leaked tokens)
```

---

## 3. W2: DataLoader Behavioral Unit Tests

`frontend/src/components/__tests__/DataLoader.test.js` tests color inheritance:

```powershell
cd frontend; npm test -- --watchAll=false src/components/__tests__/DataLoader.test.js
```

```
PASS src/components/__tests__/DataLoader.test.js
  DataLoader Component (Phase 2D Colour Inheritance)
    √ renders with currentColor stroke on SVG progress circle, not hardcoded blue (119 ms)
    √ renders bouncing dots with currentColor background (42 ms)
    √ renders children when isLoading is false and no error (24 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Snapshots:   0 total
```

---

## 4. W3: Dual-Mode Browser Verification & Screenshots

### 4.1 Legacy Blur Suppression Audit
Verification that legacy CSS files contain `backdrop-filter: blur(...)` and that Phase 2D's `.fs-page` / `html[data-fs-theme]` overrides successfully eliminate them to `none`:

```powershell
git grep -n "backdrop-filter" frontend/src/components/Modal.css frontend/src/components/common/ConfirmModal.css frontend/src/components/common/ViewOnlyBanner.css frontend/src/components/dashboard/AppLauncher.css
```
```
frontend/src/components/common/ConfirmModal.css:13:  backdrop-filter: blur(2px);
frontend/src/components/common/ViewOnlyBanner.css:13:  backdrop-filter: blur(8px);
frontend/src/components/dashboard/AppLauncher.css:12:  backdrop-filter: blur(10px);
frontend/src/components/dashboard/AppLauncher.css:13:  -webkit-backdrop-filter: blur(10px);
```
*(Note: `Modal.css` did not define a legacy blur; it renders with `backdrop-filter: none` by default and is explicitly locked to `none` under theme).*

### 4.2 Browser Computed Style Test Run
Dual-mode computed styles were verified in Chromium at 1440px via `npx playwright test --project=shared`:

```
Running 10 tests using 1 worker

  ok 1 [shared] › shared-components.spec.js:27:3 › Phase 2D: Shared Components Dual-Mode Verification › Table: computed styles verify legacy vs .fs-page theme override (3.8s)
  ok 2 [shared] › shared-components.spec.js:53:3 › Phase 2D: Shared Components Dual-Mode Verification › Form: computed styles verify legacy vs .fs-page theme override (3.8s)
  ok 3 [shared] › shared-components.spec.js:86:3 › Phase 2D: Shared Components Dual-Mode Verification › Modal: computed styles verify legacy vs theme override (8px ceiling) (3.6s)
  ok 4 [shared] › shared-components.spec.js:114:3 › Phase 2D: Shared Components Dual-Mode Verification › ConfirmModal: computed styles verify legacy vs theme override (3.2s)
  ok 5 [shared] › shared-components.spec.js:148:3 › Phase 2D: Shared Components Dual-Mode Verification › SummaryRow & AnalysisCard: computed styles verify theme overrides (3.0s)
  ok 6 [shared] › shared-components.spec.js:174:3 › Phase 2D: Shared Components Dual-Mode Verification › ComponentTable: computed styles verify theme overrides (3.5s)
  ok 7 [shared] › shared-components.spec.js:198:3 › Phase 2D: Shared Components Dual-Mode Verification › ViewOnlyBanner: computed styles verify theme overrides and backdrop-filter none (2.2s)
  ok 8 [shared] › shared-components.spec.js:218:3 › Phase 2D: Shared Components Dual-Mode Verification › ProtectedAction: computed styles verify opacity gating (2.4s)
  ok 9 [shared] › shared-components.spec.js:232:3 › Phase 2D: Shared Components Dual-Mode Verification › Pagination: computed styles verify theme overrides (3.0s)
  ok 10 [shared] › shared-components.spec.js:256:3 › Phase 2D: Shared Components Dual-Mode Verification › AppLauncher: computed styles verify theme overrides and backdrop-filter none (2.6s)

  10 passed (50.7s)
```

### 4.3 Computed Style Assertion Matrix

| Component | Selector | Legacy Property & Value | Themed Property & Value | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Table Header** | `thead tr` / `th` | `rgb(0, 152, 121)` (`#009879`) | `rgb(12, 13, 15)` (`--fs-surface-sunken`) | **PASS** |
| **Table Text** | `th` | `rgb(255, 255, 255)` (`#ffffff`) | `rgb(162, 168, 176)` (`--fs-text-3`) | **PASS** |
| **Table Zebra** | `tbody tr:nth-of-type(even)` | `rgb(243, 243, 243)` (`#f3f3f3`) | `rgb(12, 13, 15)` (`--fs-surface-sunken`) | **PASS** |
| **Form Input** | `input` | `border: rgb(204, 204, 204)` (`#ccc`) | `bg: rgb(26, 28, 32)` / `border: rgb(106, 111, 119)` | **PASS** |
| **Form Button** | `.submit-button` | `bg: rgb(0, 152, 121)`, `radius: 5px` | `bg: rgb(20, 184, 166)` (`#14b8a6`), `radius: 4px` | **PASS** |
| **Modal Content** | `.modal-content` | `bg: rgb(255, 255, 255)`, `radius: 12px` | `bg: rgb(26, 28, 32)`, `radius: 8px` (ceiling) | **PASS** |
| **Modal Scrim** | `.modal-overlay` | `rgba(0, 0, 0, 0.5)` | `rgba(8, 9, 11, 0.72)` (`--fs-scrim`) | **PASS** |
| **Modal Blur** | `.modal-overlay` | `backdrop-filter: none` (no legacy blur) | `backdrop-filter: none` (anti-slop clean) | **PASS** |
| **ConfirmModal** | `.confirm-modal-content`| `bg: rgb(255, 255, 255)`, `radius: 12px` | `bg: rgb(26, 28, 32)`, `radius: 8px` (ceiling) | **PASS** |
| **Confirm Blur** | `.confirm-modal-overlay`| `backdrop-filter: blur(2px)` | `backdrop-filter: none` (anti-slop clean) | **PASS** |
| **Confirm Action**| `.confirm-modal-btn-danger`| `bg: rgb(220, 38, 38)`, `color: #fff` | `bg: rgb(217, 112, 118)` (`--fs-danger`), `color: rgb(13, 14, 16)` (`#0d0e10`, `--fs-ink`, 6.00:1) | **PASS** |
| **Summary Row** | `.summary-row` | `bg: rgb(248, 249, 250)` (`#f8f9fa`) | `bg: rgb(26, 28, 32)` (`--fs-surface`) | **PASS** |
| **Period Item** | `.period-item` | `bg: rgb(255, 255, 255)` (`#ffffff`) | `bg: rgb(34, 37, 42)` (`--fs-surface-raised`) | **PASS** |
| **Component Table**| `.component-table-wrapper`| `bg: rgb(255, 255, 255)` (`#ffffff`) | `bg: rgb(26, 28, 32)` (`--fs-surface`) | **PASS** |
| **ViewOnlyBanner**| `.view-only-banner` | `bg: rgb(254, 243, 199)`, `color: rgb(146, 64, 14)` | `bg: rgb(34, 37, 42)` (`--fs-surface-raised`), `color: rgb(207, 162, 79)` (`#cfa24f`, `--fs-warning`) | **PASS** |
| **ViewOnly Blur** | `.view-only-banner` | `backdrop-filter: blur(8px)` | `backdrop-filter: none` (anti-slop clean) | **PASS** |
| **ProtectedAction**| `.action-disabled` | `opacity: 1` | `opacity: 0.45` (`--fs-disabled-opacity`) | **PASS** |
| **Pagination Button**| `.pagination-container button` | `bg: rgb(255, 255, 255)`, `border: rgb(221, 221, 221)`, `radius: 5px` | `bg: rgb(26, 28, 32)` (`--fs-surface`), `border: rgb(106, 111, 119)` (`--fs-border-control`), `radius: 4px` | **PASS** |
| **AppLauncher** | `.launcher-panel` | `bg: rgb(255, 255, 255)`, `radius: 12px` | `bg: rgb(26, 28, 32)` (`#1a1c20`, `--fs-surface`), `radius: 8px` (ceiling) | **PASS** |
| **AppLauncher Blur** | `.launcher-backdrop` | `backdrop-filter: blur(10px)` | `backdrop-filter: none` (anti-slop clean) | **PASS** |

### 4.4 Visual Comparisons (Legacy vs Dark Theme Overrides)

#### Table Component
````carousel
![Table — Legacy Context (Un-scoped)](file:///C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-2d/table-legacy-1440.png)
<!-- slide -->
![Table — Dark Theme (.fs-page scoped)](file:///C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-2d/table-dark-1440.png)
````

#### Form Component
````carousel
![Form — Legacy Context (Un-scoped)](file:///C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-2d/form-legacy-1440.png)
<!-- slide -->
![Form — Dark Theme (.fs-page scoped)](file:///C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-2d/form-dark-1440.png)
````

#### Modal Component (8px Ceiling)
````carousel
![Modal — Legacy Context (12px Radius, White Card)](file:///C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-2d/modal-legacy-1440.png)
<!-- slide -->
![Modal — Dark Theme (8px Radius Ceiling, Graphite Card, Scrim)](file:///C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-2d/modal-dark-1440.png)
````

#### ConfirmModal Component
````carousel
![ConfirmModal — Legacy Context (12px Radius, Red Button)](file:///C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-2d/confirm-legacy-1440.png)
<!-- slide -->
![ConfirmModal — Dark Theme (8px Ceiling, --fs-danger, --fs-ink text)](file:///C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-2d/confirm-dark-1440.png)
````

#### SummaryRow Component
````carousel
![SummaryRow — Legacy Context](file:///C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-2d/summary-legacy-1440.png)
<!-- slide -->
![SummaryRow — Dark Theme](file:///C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-2d/summary-dark-1440.png)
````

#### ComponentTable Component
````carousel
![ComponentTable — Legacy Context](file:///C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-2d/component-table-legacy-1440.png)
<!-- slide -->
![ComponentTable — Dark Theme](file:///C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-2d/component-table-dark-1440.png)
````

---

## 5. Full Exit Gate 2D Verification Suite

### 5.1 Constraint E1 Compliance Verification (Zero Legacy Edits)
```powershell
git diff --name-only main
```
```
docs/UI-UX_Plan/UI-UX-PLAN.md
docs/ui-plans/phase_2d_walkthrough.md
frontend/.gitignore
frontend/.stylelintrc.json
frontend/playwright.config.js
frontend/src/components/DataLoader.js
frontend/src/components/__tests__/DataLoader.test.js
frontend/src/styles/theme-components.css
frontend/tests/visual/fixtures/shared/shared-components.html
frontend/tests/visual/shared-components.spec.js
```
*Zero legacy shared CSS files were touched (Constraint E1 preserved).*

### 5.2 Tokens Check
```powershell
node frontend/scripts/tokens.js --check
```
```
✓ All §4.9 contrast tables match tokens.json (0 drift).
✓ tokens.css matches tokens.json verbatim (0 drift).
✓ All tokens checks passed successfully.
```

### 5.3 Lint Tones
```powershell
node frontend/scripts/lint-tones.js
```
```
✓ [lint-tones] Scanned 57 page CSS files for tone scoping: 0 violations.
✓ [lint-tones] Scanned 60 total CSS files against tokens.json: 0 undefined tokens.
```

### 5.4 Stylelint Ratchet
```powershell
node frontend/scripts/lint-ratchet.js
```
```
[lint-ratchet] Evaluating stylelint ratchet against merge-base: 4bcb8a927bd9bd34ed21d7bc9a8ac8a7a723a507
✓ [lint-ratchet] Checked 59 CSS files against 4bcb8a927bd9bd34ed21d7bc9a8ac8a7a723a507: 0 regressions.
```

### 5.5 Theme Components Stylelint Check
```powershell
cd frontend; npx stylelint "src/styles/theme-components.css" "src/styles/theme.css"
```
```
(Clean exit with code 0 - 0 errors)
```

### 5.6 Reference Frames Suite
```powershell
cd frontend; npx playwright test --project=reference
```
```
Running 3 tests using 1 worker

  ok 1 [reference] › reference-frames.spec.js:35:5 › Reference Frames Visual Suite › 01-dense-table @ 1440px (2.9s)
  ok 2 [reference] › reference-frames.spec.js:35:5 › Reference Frames Visual Suite › 02-form @ 1440px (2.3s)
  ok 3 [reference] › reference-frames.spec.js:35:5 › Reference Frames Visual Suite › 03-dashboard @ 1440px (2.6s)

  3 passed (16.9s)
```

### 5.7 Shell Visual Suite
```powershell
cd frontend; npx playwright test --project=shell
```
```
Running 7 tests using 1 worker

  ok 1 [setup] › fixtures\auth.setup.js:8:1 › authenticate visual test session (22ms)
  ok 2 [shell] › shell.spec.js:51:3 › Shell Visual Suite (Option A) › shell-legacy-desktop (20.1s)
  ok 3 [shell] › shell.spec.js:56:3 › Shell Visual Suite (Option A) › shell-legacy-mobile (5.1s)
  ok 4 [shell] › shell.spec.js:61:3 › Shell Visual Suite (Option A) › shell-dark-desktop-collapsed (5.1s)
  ok 5 [shell] › shell.spec.js:73:3 › Shell Visual Suite (Option A) › shell-dark-desktop-expanded (5.0s)
  ok 6 [shell] › shell.spec.js:92:3 › Shell Visual Suite (Option A) › shell-dark-mobile-drawer (4.6s)
  ok 7 [shell] › shell.spec.js:105:3 › Shell Visual Suite (Option A) › shell-dark-account-dropdown (8.2s)

  7 passed (1.0m)
```

### 5.8 Visual Route Regression Suite (Invariant I13: 326/326 Passed with 0 Diff)
```powershell
cd frontend; $env:CI="true"; $env:NODE_OPTIONS="--max-old-space-size=4096"; npx playwright test --project=visual
```
```
Running 326 tests using 1 worker

  ok 1 [setup] › fixtures\auth.setup.js:8:1 › authenticate visual test session (18ms)
  ok 2 [visual] › visual.spec.js:39:7 › Visual Regression Suite › not-found @ 1440px (11.2s)
  ok 3 [visual] › visual.spec.js:39:7 › Visual Regression Suite › not-found @ 1024px (5.5s)
  ok 4 [visual] › visual.spec.js:39:7 › Visual Regression Suite › not-found @ 768px (5.3s)
  ok 5 [visual] › visual.spec.js:39:7 › Visual Regression Suite › not-found @ 480px (6.7s)
  ok 6 [visual] › visual.spec.js:39:7 › Visual Regression Suite › not-found @ 390px (5.7s)
  ok 7 [visual] › visual.spec.js:39:7 › Visual Regression Suite › dashboard @ 1440px (6.2s)
  ok 8 [visual] › visual.spec.js:39:7 › Visual Regression Suite › dashboard @ 1024px (5.4s)
  ok 9 [visual] › visual.spec.js:39:7 › Visual Regression Suite › dashboard @ 768px (6.6s)
  ok 10 [visual] › visual.spec.js:39:7 › Visual Regression Suite › dashboard @ 480px (6.9s)
  ...
  ok 317 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-person-detail @ 1440px (3.2s)
  ok 318 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-person-detail @ 1024px (2.3s)
  ok 319 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-person-detail @ 768px (2.3s)
  ok 320 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-person-detail @ 480px (3.2s)
  ok 321 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-person-detail @ 390px (3.4s)
  ok 322 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-loan-detail @ 1440px (2.8s)
  ok 323 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-loan-detail @ 1024px (3.2s)
  ok 324 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-loan-detail @ 768px (3.8s)
  ok 325 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-loan-detail @ 480px (2.4s)
  ok 326 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-loan-detail @ 390px (3.1s)

  Slow test file: [visual] › visual.spec.js (19.8m)
  Consider splitting slow test files to speed up parallel execution
  326 passed (20.1m)
```

Across all 326 visual route snapshots, zero visual differences (0 diff) were detected against the established Phase 2A baselines. This confirms that all Phase 2D shared component overrides are strictly scoped to `.fs-page` and do not leak onto legacy unmigrated routes.

### 5.9 Baseline Manifest Verification
```powershell
node frontend/scripts/verify-baseline-manifest.js
```
```
334/334 baselines verified successfully.
```

### 5.10 Jest Unit Test Suite
```powershell
cd frontend; $env:CI='true'; npm test
```
```
Test Suites: 50 passed, 50 total
Tests:       317 passed, 317 total
Snapshots:   0 total
Time:        35.635 s
Ran all test suites.
```

---

## 6. Exit Gate Checklist

- [x] `Table`, `Modal`, `ConfirmModal`, `Form`, `ViewOnlyBanner`, `ProtectedAction`, `Pagination`, `AppLauncher`, `SummaryRow`, and `ComponentTable` inside `.fs-page` look correct (verified in 10/10 dual-mode tests).
- [x] The same components outside `.fs-page` look exactly as they did (verified in legacy fixtures).
- [x] Zero diff on legacy routes across all 326 route snapshots (Invariant I13 preserved).
- [x] `theme-components.css` reports zero violations (stylelint clean).
- [x] Computed-style browser checks recorded in walkthrough table including verified suppression of legacy blurs to `none`.
- [x] Radius ceiling $\le 8\text{px}$ respected (`--fs-radius-lg` on modals and launchers).
- [x] Zero edits to legacy shared CSS files (Constraint E1 preserved and proven via `git diff --name-only main`).
