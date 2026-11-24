# Phase 7B Walkthrough — Corporate Actions Subsystem Modernization

## 1. Executive Summary

Phase 7B modernizes the **Corporate Actions Subsystem** of FinStat, covering:
1. **`/corporate-actions`** (`CorporateActionsList.js` & `CorporateActionsList.css`): The corporate actions registry table displaying historical stock splits and bonus share events, real-time ratio formatting, empty-state guidance, and interactive delete confirmation modal with full keyboard accessibility.
2. **`/corporate-actions/wizard`** (`CorporateActionWizard.js` & `CorporateActionWizard.css`): The 3-step corporate action configuration wizard (Select Holding $\to$ Configure Action & Ratio $\to$ Review & Confirm Impact) featuring live recalculation preview, segmented type toggle buttons, and compliant step indicators.

### Key Architectural & Design System Deliverables
- **Complete Decoupling**: Completely severed legacy coupling to `Trades.css` and `Table.css`. All styles are scoped strictly under `html[data-fs-theme]` and use canonical CSS tokens from `tokens.json`.
- **Reference Frame Conformance**:
  - `/corporate-actions` conforms to **Reference Frame 01 (Variant B — Dense Table)**: `#101114` dark graphite canvas, `#1a1c20` surface, `#34383f` borders, tabular figures for ratios/dates, and desktop/tablet horizontal table scroll (`overflow-x: auto`).
  - `/corporate-actions/wizard` conforms to **Reference Frame 02 (Variant B — Form)** and **Reference Frame 03 (Variant B — Dashboard)**: 3-step segmented flow, stacked field cards, inline guidance, and comparison impact column.
- **Decision D19 Mobile Compact-Expand Pattern**: At viewports $\le 768\text{px}$, the desktop table collapses into structured vertical cards featuring stock badges, ratio previews, an expand/collapse toggle ($\ge 44\times 44\text{px}$ touch target), and nested metadata (broker, effective date, notes, delete action). Zero page-level horizontal overflow (`scrollWidth <= clientWidth`).
- **Strict Accessibility & Contrast (WCAG 2.1 AA)**:
  - Stepper active indicator: strictly `--fs-ink` (`#0d0e10`) text on `--fs-accent` (`#14b8a6`) background ($7.76:1$ contrast ratio). Zero white text on accent.
  - Heading order compliance: `h1` $\to$ `h2` $\to$ `h3` strictly enforced and verified by `axe-core`.
  - Accessible delete confirmation dialog with `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and `Escape` key dismissal.
- **Protected Actions & Security**: Mutation controls wrapped with `<ProtectedAction>` ensuring view-only users cannot trigger delete or modification operations.
- **Allowlist Expansion**: `ProtectedRoute.js` promoted `/corporate-actions` and `/corporate-actions/wizard` to `THEMED_PATTERNS`, expanding the active route allowlist from 27 to 29.
- **Linter & Guard Cleanliness**: Removed lines 62–63 from `frontend/.eslintignore`. 0 ESLint errors, 0 stylelint regressions, 0 undefined tokens, and 16 legacy `!important` declarations permanently removed.
- **Visual Baseline Integrity**: 10 baseline snapshots re-captured across 5 viewports (1440px, 1024px, 768px, 480px, 390px) in `D:\Projects\FinStat-visual-baselines` (commit `90978c5`), verifying 334/334 manifest integrity.

---

## 2. 18-Gate Verification Matrix

| # | Gate Verification Check | Command | Result | Status |
|---|-------------------------|---------|--------|:------:|
| 1 | Route Coverage & Allowlist Guard | `node frontend/scripts/ui-coverage.js --assert-allowlist` | 29 patterns verified, exits 0 | **PASS** |
| 2 | Design Token Source of Truth | `node frontend/scripts/tokens.js --check --tables` | 0 token drift, exits 0 | **PASS** |
| 3 | Test ID & A11y Label Guard | `node frontend/scripts/testid-guard.js` | 0 test ID regressions, exits 0 | **PASS** |
| 4 | Semantic Tone Scoping & Undefined Tokens | `node frontend/scripts/lint-tones.js` | 0 tone violations, 0 undefined tokens | **PASS** |
| 5 | Stylelint Ratchet & CSS Standards | `node scripts/lint-ratchet.js` | 0 regressions, 16 `!important` purged | **PASS** |
| 6 | ESLint Conformance | `npx eslint <touched_files>` | 0 errors, 0 warnings across all files | **PASS** |
| 7 | Unit Tests & Axe A11y Audit | `npm test -- CorporateActionsList.test.js CorporateActionWizard.test.js` | 26/26 tests passed, 0 axe violations | **PASS** |
| 8 | App Route Guards & Role Security | `npm test -- src/App.test.js` | 9/9 tests passed, exits 0 | **PASS** |
| 9 | Calculation Characterization Engine | `npx jest --runInBand tests/calculations.spec.js` | 11/11 domains passed, 0 math drift | **PASS** |
| 10 | Playwright Real-Browser Axe A11y Audit | `npx playwright test tests/visual/a11y.spec.js --project=a11y -g "corporate-actions"` | 3/3 passed, 0 axe violations | **PASS** |
| 11 | Reference Match Computed-Style Suite | `npx playwright test --project=reference tests/visual/corporate-actions-reference-match.spec.js` | 6/6 passed (colors, stepper, D19, scroll) | **PASS** |
| 12 | Production Bundle Build | `npm run build` | Compiled cleanly with 0 errors | **PASS** |
| 13 | Visual Baseline Recapture | `npx playwright test --project=visual tests/visual/visual.spec.js --grep="corporate-actions" --update-snapshots` | 10 snapshots updated | **PASS** |
| 14 | Baseline Manifest Verification | `node frontend/scripts/verify-baseline-manifest.js` | 334/334 SHA-256 match, commit `90978c5` | **PASS** |
| 15 | PR-Subset Visual Regression Suite | `npx playwright test --project=pr-subset tests/visual/visual.spec.js` | 292 passed + 34 accepted un-migrated | **PASS** |
| 16 | Touch Target & Focus Ring Audit | `npx playwright test --project=reference corporate-actions-reference-match.spec.js -g "interactive touch targets"` | All touch targets $\ge 44\text{px}$, focus rings visible | **PASS** |
| 17 | Visual Inspection Gallery across 5 Viewports | Review baseline gallery at 1440, 1024, 768, 480, 390px | 10/10 snapshots verified against tokens | **PASS** |
| 18 | User Walkthrough Review & Sign-Off | Artifact `phase_7b_walkthrough.md` submitted to user | Awaiting explicit user sign-off | **PENDING** |

---

## 3. Visual Baseline Gallery

### 3.1 `/corporate-actions` (Registry Table & Mobile Cards)
- Desktop 1440px: [docs/ui-snapshots/phase-7b/corporate-actions-1440.png](file:///d:/Projects/FinStat/docs/ui-snapshots/phase-7b/corporate-actions-1440.png)
- Small Desktop 1024px: [docs/ui-snapshots/phase-7b/corporate-actions-1024.png](file:///d:/Projects/FinStat/docs/ui-snapshots/phase-7b/corporate-actions-1024.png)
- Tablet 768px: [docs/ui-snapshots/phase-7b/corporate-actions-768.png](file:///d:/Projects/FinStat/docs/ui-snapshots/phase-7b/corporate-actions-768.png)
- Mobile 480px: [docs/ui-snapshots/phase-7b/corporate-actions-480.png](file:///d:/Projects/FinStat/docs/ui-snapshots/phase-7b/corporate-actions-480.png)
- Mobile 390px: [docs/ui-snapshots/phase-7b/corporate-actions-390.png](file:///d:/Projects/FinStat/docs/ui-snapshots/phase-7b/corporate-actions-390.png)

### 3.2 `/corporate-actions/wizard` (3-Step Configuration Wizard)
- Desktop 1440px: [docs/ui-snapshots/phase-7b/corporate-actions-wizard-1440.png](file:///d:/Projects/FinStat/docs/ui-snapshots/phase-7b/corporate-actions-wizard-1440.png)
- Small Desktop 1024px: [docs/ui-snapshots/phase-7b/corporate-actions-wizard-1024.png](file:///d:/Projects/FinStat/docs/ui-snapshots/phase-7b/corporate-actions-wizard-1024.png)
- Tablet 768px: [docs/ui-snapshots/phase-7b/corporate-actions-wizard-768.png](file:///d:/Projects/FinStat/docs/ui-snapshots/phase-7b/corporate-actions-wizard-768.png)
- Mobile 480px: [docs/ui-snapshots/phase-7b/corporate-actions-wizard-480.png](file:///d:/Projects/FinStat/docs/ui-snapshots/phase-7b/corporate-actions-wizard-480.png)
- Mobile 390px: [docs/ui-snapshots/phase-7b/corporate-actions-wizard-390.png](file:///d:/Projects/FinStat/docs/ui-snapshots/phase-7b/corporate-actions-wizard-390.png)

---

## 4. Key Architectural Highlights

### 4.1 Decision D19 Mobile Compact-Expand Pattern
- **Desktop/Tablet ($> 768\text{px}$)**: Renders a dense tabular view with full horizontal scroll (`overflow-x: auto`), IBM Plex Mono for numeric split ratios (`2:1`, `10.0%`), and direct action buttons.
- **Mobile ($\le 768\text{px}$)**: Renders vertical compact-expand cards (`.ca-mobile-card`):
  - Primary header row displaying stock ticker (`.ca-card-stock`), semantic badge (`ca-badge-split` or `ca-badge-bonus`), formatted ratio, and chevron toggle button.
  - Expandable drawer containing secondary metadata: Broker name, Effective Date, Notes, and a full-width destructive Remove action.
  - Expander button touch target is verified at $44\times 44\text{px}$ minimum.
  - Zero page-level horizontal scroll (`scrollWidth <= clientWidth` at 390px).

### 4.2 Stepper Contrast Compliance (WCAG 2.1 AA)
- Stepper component in `CorporateActionWizard` was overhauled:
  - Active step circle: background `--fs-accent` (`#14b8a6`), text color `--fs-ink` (`#0d0e10`), contrast ratio $7.76:1$ (exceeds WCAG 2.1 AA requirement of $4.5:1$).
  - Completed step circle: background `--fs-surface-sunken`, text color `--fs-text-2`, border `--fs-border`.
  - Inactive step circle: background `--fs-surface-sunken`, text color `--fs-text-3`.
  - Zero raw hex colors or gradients in JSX or CSS.

### 4.3 Section 16 Semantic Tone Styles
- Added Section 16 in `theme-components.css` scoped under `html[data-fs-theme]` for:
  - Active and completed stepper items
  - Active segmented toggle buttons
  - Summary callout panels
  - Impact positive stat highlights
  - Table delete button hover/focus states

---

## 5. Next Steps for Sign-Off and Merge

1. **User Review**: Please review the 18-gate verification results, code changes, and snapshot gallery.
2. **Sign-off**: Upon explicit user sign-off:
   - Update `docs/UI-UX_Plan/UI-UX-PLAN.md` (§6.1 Phase Board, §5 Route Coverage Matrix, §6.11 checklist, §10 Progress Log, cumulative allowlist line 2846 to 29).
   - Merge `phase-ui-7b-corporate-actions` into `main`.
   - Strictly push ONLY `main` to `origin/main` (feature branch remains strictly local).
