# Walkthrough — UI Phase 2F: Universal Loading Pattern (D23, `<Loading>` Primitive)

## 1. Executive Summary

Phase 2F implements **Universal Loading Uniformity (Decision D23)** across the FinStat application and delivers **Primitive #8 (`Loading.js`)**, concluding the entire **Phase 2 (Core Theme & Shared UI)** milestone.

Prior to Phase 2F, asynchronous data fetching across FinStat relied on fractured, ad-hoc loading mechanisms: raw `<p>Loading...</p>` tags, bare unstyled text, un-themed animated spinner `div`s, and custom inline classes. Phase 2F unifies all loading visual semantics under a single accessible component (`Loading.js`) with five specialized variants (`route`, `card`, `table`, `form-field`, `inline`), standardized Suspense boundaries, and non-blocking pulse placeholders.

Crucially, Phase 2F equips all CSS loading rules in `theme.css` with **unthemed legacy fallbacks** (`#ddd`, `#2c3e50`, `#6c757d`, `#e9ecef`, `999px`), ensuring spinners and pulse blocks render visibly and correctly across all 60+ unmigrated routes without waiting for per-page conversion phases.

---

## 2. Architecture & Design Implementation

### 2.1 Primitive #8: `<Loading>` (`frontend/src/components/ui/Loading.js`)
- **Variants Supported**:
  1. `route`: Full-page centered loading container with standard 24px spinner and descriptive text (default fallback: `"Loading application..."`).
  2. `card`: Centered within card surfaces with spinner and text (default: `"Loading..."`).
  3. `table`: Tabular skeleton rows simulating data grid rows during queries.
  4. `form-field`: Form field placeholder skeleton for input fields undergoing initial load.
  5. `inline`: Compact 16px inline spinner suitable for buttons, badges, and inline status badges without layout displacement.
- **Accessibility & ARIA Compliance**:
  - `role="status"` with `aria-live="polite"` applied at the root container.
  - Spinner explicitly marked `aria-hidden="true"` to prevent duplicate screen reader announcements.
  - Accompanied by `.fs-visually-hidden` text when no visible text is requested, ensuring all screen readers announce state transitions.
  - Defensive prop fallback: unrecognized variants safely degrade to `'route'` with development warnings.
- **Zero New Dependencies (Invariant I12)**:
  - TypeScript-grade JSDoc typing without introducing external runtime packages (e.g. `prop-types`).
- **Barrel Export**:
  - Exported via `frontend/src/components/ui/index.js` alongside all 7 Phase 2E primitives.

### 2.2 CSS Loading System (`frontend/src/styles/theme.css`)
- **Keyframe Pulse (`@keyframes fs-pulse`)**:
  - Pure opacity pulse (`1.0` to `0.4`), strictly avoiding forbidden CSS gradients and canvas filters per AGENTS.md Rule 3.
  - Motion safe: `@media (prefers-reduced-motion: reduce)` sets animation to `none` and fixes opacity at `0.7`.
- **Skeleton Classes**:
  - Base `.fs-skeleton` with responsive variants `.fs-skeleton--row`, `.fs-skeleton--card`, `.fs-skeleton--form-field`.
- **Unthemed Legacy Fallback Bridge**:
  - Tokens under `:root[data-fs-theme="dark"]` do not resolve on unmigrated routes.
  - In `theme.css`, declarations use defensive legacy fallbacks:
    - `border: 2px solid var(--fs-border, #ddd);`
    - `border-top-color: var(--fs-text, #2c3e50);`
    - `color: var(--fs-text-3, #6c757d);`
    - `background: var(--fs-surface-raised, #e9ecef);`
    - `border-radius: var(--fs-radius-sm, 4px);`
    - `border-radius: var(--fs-radius-pill, 999px);` (spinner border radius)

---

## 3. Durable Documentation Trail (Temporary Exception Sunset)

Because unthemed pages require literal hex and `999px` fallbacks before Phase 12, a localized `stylelint-disable` block was placed around loading classes in `theme.css`.

Per user requirements, this exception has been permanently registered in two authoritative locations in [`docs/UI-UX_Plan/UI-UX-PLAN.md`](file:///d:/Projects/FinStat/docs/UI-UX_Plan/UI-UX-PLAN.md):

1. **Section 13 — Deferred / out of scope**:
   ```markdown
   | **2F stylelint disable block (theme.css)** | Temporary bridge for unthemed loading fallbacks (`#e9ecef`, `#ddd`, `#2c3e50`, `#6c757d`, `999px`). Sunset: Phase 12 removes the block and migrates values to unconditional `:root` in `tokens.css` | Phase 12 (cleanup) |
   ```

2. **Section 6.16 — Phase 12 (Cleanup and consolidation tasks)**:
   ```markdown
   - [ ] Remove the stylelint-disable declaration-property-value-allowed-list, color-no-hex block from theme.css and eliminate the loading-fallback hex values.
   ```

---

## 4. Route Standardizations & Proof Pages

### 4.1 Global Suspense Standardizations
- **`frontend/src/App.js` (Line 116)**:
  - Replaced legacy fallback with `<Loading variant="route" text="Loading application..." />`.
- **`frontend/src/components/ProtectedRoute.js` (Line 146)**:
  - Replaced legacy fallback with `<Loading variant="route" text="Loading session..." />`.

### 4.2 Five Representative Proof Pages
1. **`LandingPage.js` (Public / Unthemed, Inline Variant)**:
   - Replaced custom `.login-spinner` with `<Loading variant="inline" data-testid="login-spinner" />` for both sign-in submission and initial authentication check.
   - Preserved `data-testid="login-spinner"` per Invariant I5.
2. **`AdminDashboard.js` (Card Variant)**:
   - Replaced `.loading-spinner` with `<Loading variant="card" text={`Loading ${isManager ? 'viewers' : 'users'}...`} />`.
3. **`CertificateLogPage.js` (Table Variant)**:
   - Replaced raw text `<p>Loading Certificates...</p>` with structured `<Loading variant="table" text="Loading Certificates..." />`.
4. **`EditCertificatePage.js` (Form-Field Variant)**:
   - Replaced bare `<p>Loading...</p>` with `<Loading variant="form-field" text="Loading certificate..." />`.
5. **`PortfolioDashboard.js` (Route Variant)**:
   - Replaced custom container `.spinner` with `<Loading variant="route" text="Loading Unified Investment Portfolio..." />`.

---

## 5. Verification Evidence

### 5.1 Mechanical Tooling Gates
| Check | Command | Result |
| :--- | :--- | :--- |
| **Token Drift** | `node frontend/scripts/tokens.js --check` | **0 drift** |
| **Tone & Accent Linter** | `node frontend/scripts/lint-tones.js` | **0 violations, 0 undefined tokens** |
| **Ratchet Linter** | `node frontend/scripts/lint-ratchet.js` | **0 regressions** |
| **Stylelint AST** | `cd frontend; npx stylelint "src/styles/*.css"` | **0 errors, 0 warnings** |
| **Test ID Guard** | `node frontend/scripts/testid-guard.js` | **0 test IDs or ARIA labels removed (Invariant I5)** |
| **ESLint Changed Files** | `cd frontend; npx eslint <changed-files> --max-warnings=0` | **Exit 0, 0 warnings** |
| **Full Unit & a11y Suite** | `cd frontend; $env:CI="true"; npm test -- --watchAll=false` | **59 passed, 59 total suites (379 tests passed)** |
| **CRA Production Build** | `cd frontend; $env:CI="true"; npm run build` | **Compiled successfully** |

### 5.2 Loading Component Unit & A11y Suite (`Loading.test.js`)
All 11 unit & a11y tests passed clean:
- `Loading renders route variant with default accessible text` -> Pass
- `Loading renders route variant with custom text` -> Pass
- `Loading renders card variant with spinner and text` -> Pass
- `Loading renders table variant with skeleton rows` -> Pass
- `Loading renders form-field variant with field skeletons` -> Pass
- `Loading renders inline variant with 16px spinner` -> Pass
- `Loading applies custom className and forward props` -> Pass
- `Loading safely falls back to route variant for invalid variant` -> Pass
- `Loading has role="status" and aria-live="polite"` -> Pass
- `Loading spinner is marked aria-hidden="true"` -> Pass
- `Loading passes jest-axe accessibility checks across all variants` -> Pass

### 5.3 Playwright Browser Verification
| Project | Specs | Result | Duration |
| :--- | :--- | :--- | :--- |
| **Primitives Dual-Mode** | `primitives.spec.js` (including Section 9 Loading in themed & unthemed) | **3 passed** | 18.0s |
| **Reference Frames** | `reference-frames.spec.js` | **3 passed** | 18.8s |
| **Shell Verification** | `shell.spec.js` | **7 passed** | 39.6s |
| **Shared Components** | `shared-components.spec.js` | **10 passed** | 27.8s |
| **Route Visual Regression** | `visual.spec.js` (full suite across 5 viewports) | **326 passed (0 diff)** | 18.4m |
| **Baseline Manifest** | `node frontend/scripts/verify-baseline-manifest.js` | **334/334 verified** | 2.1s |

---

## 6. Phase 2 Exit Checklist & Sign-Off

With the completion of Phase 2F:
- [x] **Phase 2A (Tokens & Primitives)**: Tokens generated under `:root[data-fs-theme="dark"]`, IBM Plex self-hosted, body gating.
- [x] **Phase 2B (Gated Shell)**: Skip link, synchronous theme gating, Navbar/Sidebar/Toast dark overrides.
- [x] **Phase 2C (App.css Cleanup)**: All 11 `!important` declarations removed, `@keyframes spin` established.
- [x] **Phase 2D (Shared Component Overrides)**: Plain CSS expanded shadow rules in `theme-components.css` without touching legacy shared CSS (Constraint E1).
- [x] **Phase 2E (7 Primitives & Specificity)**: Extracted `Button`, `Card`, `Badge`, `Delta`, `PageHeader`, `EmptyState`, `Tabs`, category labels locked, dual-mode sub-navs.
- [x] **Phase 2F (Universal Loading)**: Extracted Primitive #8 `Loading.js` with 5 variants, standardized Suspense boundaries, unthemed legacy fallbacks, and 0 regression diff across all 326 visual routes.

Phase 2 is formally signed off and complete. Ready for merge to `main`.
