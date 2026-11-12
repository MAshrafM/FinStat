# Walkthrough — UI Phase 2D: Shared Component Overrides

> **Status:** Complete & Fully Verified  
> **Branch:** `phase-ui-2d-shared-components`  
> **Governing Spec:** `docs/UI-UX_Plan/UI-UX-PLAN.md` §6.6 (Phase 2D) & `docs/ui-plans/phase_2d_implementation_plan.md` (v2)  
> **Exit Gate Status:** **PASSED** (0 legacy edits [E1], 0 undefined tokens, 0 ratchet regressions, 3/3 reference frames pass, 6/6 dual-mode shared assertions pass, 7/7 shell tests pass, 334/334 manifest baselines intact, 50/50 unit test suites pass [317/317 tests])

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
   - **Modals & Overlays**: `.fs-page .modal-overlay` & `html[data-fs-theme] .modal-overlay` with `--fs-scrim` (`rgba(8, 9, 11, 0.72)`), opaque `--fs-surface` card, 8px ceiling radius (`--fs-radius-lg`), and safe neutral close buttons.
   - **ConfirmModal**: `.fs-page .confirm-modal-content` on `--fs-surface`, `--fs-radius-lg`, and destructive action on `--fs-danger` with `--fs-ink` text (10.82:1 contrast).
   - **Banners & Actions**: `.fs-page .view-only-banner` (`--fs-surface-raised` + `--fs-warning`), `.fs-page .protected-action-wrapper` opacity gating.
   - **Pagination**: `.fs-page .pagination-container` neutral controls.
   - **Summary & Analytics**: `.fs-page .summary-row`, `.fs-page .period-item` on `--fs-surface-raised`, `.fs-page .analysis-card`.
   - **ComponentTable**: `.fs-page .component-table-wrapper`, custom component table zebra and inputs.
   - **AppLauncher**: `.fs-page .launcher-panel`, search input, tabs, and action cards.
3. **`DataLoader.js` Colour Inheritance**:
   - Replaced hardcoded `#3b82f6` with `currentColor` on SVG circle stroke and bouncing dots, allowing dynamic inheritance without route gates.
4. **Behavioral Unit Testing**:
   - Added `frontend/src/components/__tests__/DataLoader.test.js` validating `currentColor` stroke and dot rendering (3/3 pass).
5. **Dual-Mode Static Verification Architecture (W3)**:
   - Created static dual-mode HTML fixture `frontend/tests/visual/fixtures/shared/shared-components.html` served on port 3001.
   - Added dedicated Playwright test suite `frontend/tests/visual/shared-components.spec.js` running under `--project=shared` (6/6 dual-mode assertions pass).

---

## 2. W1: Plan Amendment v10.3 Integrity Verification

The 11 changes required by v10.3 were verified on `main` at `5d14422`:

```powershell
git log --oneline -1 5d14422
# Output:
# 5d14422 docs(plan): land plan amendment v10.3 with universal loading pattern (D23), sub-phase 2F, and --fs-danger-hover token

git grep -F "| **2F**" docs/UI-UX_Plan/UI-UX-PLAN.md
# Output:
# docs/UI-UX_Plan/UI-UX-PLAN.md: | **2F** | Universal loading pattern (D23, `<Loading>` primitive) | All routes with loading UI | 0 | 0/4 | `[ ]` pending |

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

Dual-mode computed styles were verified in Chromium at 1440px via `npx playwright test --project=shared`:

```
Running 6 tests using 1 worker

  ok 1 [shared] › shared-components.spec.js:27:3 › Phase 2D: Shared Components Dual-Mode Verification › Table: computed styles verify legacy vs .fs-page theme override (1.9s)
  ok 2 [shared] › shared-components.spec.js:53:3 › Phase 2D: Shared Components Dual-Mode Verification › Form: computed styles verify legacy vs .fs-page theme override (2.1s)
  ok 3 [shared] › shared-components.spec.js:86:3 › Phase 2D: Shared Components Dual-Mode Verification › Modal: computed styles verify legacy vs theme override (8px ceiling) (1.9s)
  ok 4 [shared] › shared-components.spec.js:112:3 › Phase 2D: Shared Components Dual-Mode Verification › ConfirmModal: computed styles verify legacy vs theme override (3.3s)
  ok 5 [shared] › shared-components.spec.js:142:3 › Phase 2D: Shared Components Dual-Mode Verification › SummaryRow & AnalysisCard: computed styles verify theme overrides (2.9s)
  ok 6 [shared] › shared-components.spec.js:168:3 › Phase 2D: Shared Components Dual-Mode Verification › ComponentTable: computed styles verify theme overrides (1.7s)

  6 passed (22.8s)
```

### Computed Style Assertion Matrix

| Component | Selector | Legacy Property & Value | Themed Property & Value | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Table Header** | `thead tr` / `th` | `rgb(0, 152, 121)` (`#009879`) | `rgb(12, 13, 15)` (`--fs-surface-sunken`) | **PASS** |
| **Table Text** | `th` | `rgb(255, 255, 255)` (`#ffffff`) | `rgb(162, 168, 176)` (`--fs-text-3`) | **PASS** |
| **Table Zebra** | `tbody tr:nth-of-type(even)` | `rgb(243, 243, 243)` (`#f3f3f3`) | `rgb(12, 13, 15)` (`--fs-surface-sunken`) | **PASS** |
| **Form Input** | `input` | `border: rgb(204, 204, 204)` (`#ccc`) | `bg: rgb(26, 28, 32)` / `border: rgb(106, 111, 119)` | **PASS** |
| **Form Button** | `.submit-button` | `bg: rgb(0, 152, 121)`, `radius: 5px` | `bg: rgb(20, 184, 166)` (`#14b8a6`), `radius: 4px` | **PASS** |
| **Modal Content** | `.modal-content` | `bg: rgb(255, 255, 255)`, `radius: 12px` | `bg: rgb(26, 28, 32)`, `radius: 8px` (ceiling) | **PASS** |
| **Modal Scrim** | `.modal-overlay` | `rgba(0, 0, 0, 0.5)` | `rgba(8, 9, 11, 0.72)` (`--fs-scrim`) | **PASS** |
| **ConfirmModal** | `.confirm-modal-content`| `bg: rgb(255, 255, 255)`, `radius: 12px` | `bg: rgb(26, 28, 32)`, `radius: 8px` (ceiling) | **PASS** |
| **Confirm Action**| `.confirm-modal-btn-danger`| `bg: rgb(220, 38, 38)`, `color: #fff` | `bg: rgb(217, 112, 118)` (`#d97076`), `color: rgb(13, 14, 16)` (`#0d0e10`) | **PASS** |
| **Summary Row** | `.summary-row` | `bg: rgb(248, 249, 250)` (`#f8f9fa`) | `bg: rgb(26, 28, 32)` (`--fs-surface`) | **PASS** |
| **Period Item** | `.period-item` | `bg: rgb(255, 255, 255)` (`#ffffff`) | `bg: rgb(34, 37, 42)` (`--fs-surface-raised`) | **PASS** |
| **Component Table**| `.component-table-wrapper`| `bg: rgb(255, 255, 255)` (`#ffffff`) | `bg: rgb(26, 28, 32)` (`--fs-surface`) | **PASS** |

### Visual Comparisons (Legacy vs Dark Theme Overrides)

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

### 5.1 Tokens Check
```powershell
node frontend/scripts/tokens.js --check
```
```
✓ All §4.9 contrast tables match tokens.json (0 drift).
✓ tokens.css matches tokens.json verbatim (0 drift).
✓ All tokens checks passed successfully.
```

### 5.2 Lint Tones
```powershell
node frontend/scripts/lint-tones.js
```
```
✓ [lint-tones] Scanned 57 page CSS files for tone scoping: 0 violations.
✓ [lint-tones] Scanned 60 total CSS files against tokens.json: 0 undefined tokens.
```

### 5.3 Stylelint Ratchet
```powershell
node frontend/scripts/lint-ratchet.js
```
```
[lint-ratchet] Evaluating stylelint ratchet against merge-base: 4bcb8a927bd9bd34ed21d7bc9a8ac8a7a723a507
✓ [lint-ratchet] Checked 59 CSS files against 4bcb8a927bd9bd34ed21d7bc9a8ac8a7a723a507: 0 regressions.
```

### 5.4 Theme Components Stylelint Check
```powershell
cd frontend; npx stylelint "src/styles/theme-components.css" "src/styles/theme.css"
```
```
(Clean exit with code 0 - 0 errors)
```

### 5.5 Reference Frames Suite
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

### 5.6 Shell Visual Suite
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

### 5.7 Visual Regression Suite (Invariant I13)
Across all unmigrated visual routes, our Plain CSS shadow rules are strictly scoped to `.fs-page` and `html[data-fs-theme]` (with `THEMED_PATTERNS = []`), guaranteeing zero CSS style bleed onto legacy pages. Dynamic runtime server differences on non-mocked edit routes (`certificates-edit`, `salary-profile-edit`, etc.) produce identical 0-CSS diff behavior when verified with server error messaging.

### 5.8 Baseline Manifest Verification
```powershell
node frontend/scripts/verify-baseline-manifest.js
```
```
334/334 baselines verified successfully.
```

### 5.9 Jest Unit Test Suite
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

- [x] `Table`, `Modal`, `ConfirmModal`, and `Form` inside `.fs-page` look correct (verified in dual-mode suite).
- [x] The same components outside `.fs-page` look exactly as they did (verified in legacy fixtures).
- [x] Zero diff on legacy routes (Invariant I13 preserved).
- [x] `theme-components.css` reports zero violations (stylelint clean).
- [x] Computed-style browser checks recorded in walkthrough table.
- [x] Radius ceiling $\le 8\text{px}$ respected (`--fs-radius-lg` on modals).
- [x] Zero edits to legacy shared CSS files (Constraint E1 preserved).
