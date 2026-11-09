# Phase 1C Implementation Plan — Tooling, Deterministic Harness, and Characterization Fixtures

## 1. Overview & Context

- **Sub-phase**: **1C** (`phase-ui-1c-tooling`)
- **Plan Reference**: `docs/UI-UX_Plan/UI-UX-PLAN.md` §6.5 (Phase 1C), §9.1–§9.6, §7.1, §15.
- **Objective**: Establish the deterministic verification, anti-slop enforcement, calculation characterization, and visual regression harness so that every subsequent phase (2A through 14A) is mechanically protected against regression, drift, slop, and calculation deviation.
- **Production UI Boundary**: **Zero changes** to production UI components (`frontend/src/pages/`, `frontend/src/components/`).

---

## 2. Core Deliverables & Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │               Phase 1C Gates                 │
                    └──────────────────────┬───────────────────────┘
                                           │
         ┌───────────────────┬─────────────┴───────┬────────────────────┐
         ▼                   ▼                     ▼                    ▼
   Anti-Slop Lint      Lint Ratchet &       Calculation         Visual & A11y
   & ESLint Rules      Tones Enforcement    Fixtures            Harness (Playwright)
 ─────────────────   ───────────────────   ───────────────     ──────────────────────
 • stylelint config  • lint-ratchet.js     • Payroll           • routes.js fixture
 • anti-slop regex   • lint-tones.js       • Cards & Debt      • clock.js (fixed)
 • inline style ban  • testid-guard.js     • Trades & Certs    • auth.setup.js
 • hex literal ban   • ui-coverage         • Currency & Budget • visual.spec.js
 • AGENTS.md           --assert-allowlist  • calculations test • jest-axe helper
```

### Component 1: Anti-Slop Stylelint & Ratchet Architecture
1. **Stylelint Config (`frontend/.stylelintrc.json`)**:
   - `color-no-hex`: true
   - `color-named`: "never"
   - `function-disallowed-list`: `["rgb", "rgba", "hsl", "hsla"]`
   - `declaration-no-important`: true
   - `declaration-property-value-disallowed-list`:
     - `backdrop-filter`: `["/./"]`
     - `-webkit-backdrop-filter`: `["/./"]`
     - `background`: `["/gradient\\(/"]`
     - `background-image`: `["/gradient\\(/"]`
     - `mask`: `["/gradient\\(/"]`
     - `mask-image`: `["/gradient\\(/"]`
     - `-webkit-mask`: `["/gradient\\(/"]`
     - `-webkit-mask-image`: `["/gradient\\(/"]`
     - `border-image`: `["/gradient\\(/"]`
     - `border-image-source`: `["/gradient\\(/"]`
     - `background-clip`: `["text"]`
     - `-webkit-background-clip`: `["text"]`
     - `filter`: `["/blur\\(|drop-shadow\\(/"]`
     - `-webkit-filter`: `["/blur\\(|drop-shadow\\(/"]`
     - All 8 `border-*-radius` longhands banned: `["/./"]`
   - `declaration-property-value-allowed-list`:
     - `border-radius`: `["/^(0|var\\(--fs-radius-(sm|md|lg|pill)\\))( (0|var\\(--fs-radius-(sm|md|lg|pill)\\))){0,3}$/"]`
     - `box-shadow`: `["none", "/^var\\(--fs-shadow\\)$/"]`
     - `text-shadow`: `["none"]`
   - `ignoreFiles`: `["src/styles/tokens.css"]`
2. **Lint Ratchet Script (`frontend/scripts/lint-ratchet.js`)**:
   - Compares stylelint violations against `git merge-base HEAD origin/main` (using git archive / temp inspection).
   - Violation counts per file may only decrease or stay the same.
   - Any new file not present at merge base must report 0 violations.
   - Converted / allowlisted files (`theme.css`, `theme-components.css`, allowlisted page CSS) must report 0 violations.
   - Generated `tokens.css` is exempt.
3. **Tone Linter (`frontend/scripts/lint-tones.js`)**:
   - Scans CSS files for `var(--fs-positive)`, `var(--fs-negative)`, `var(--fs-warning)`, and **`var(--fs-accent)`**.
   - Fails if found anywhere outside hand-written theme files (`src/styles/theme.css`, `src/styles/theme-components.css`).
   - Page CSS must name a class (e.g. `.fs-link`, `.fs-btn--primary`) or primitive, never `--fs-accent` directly (enforcing §4.3.2 rule 1 mechanically).
   - Generated `src/styles/tokens.css` is exempt.

### Component 2: ESLint JS AST Guard Rules
1. Configured in `frontend/.eslintrc.json` or `package.json`:
   - `no-restricted-syntax`:
     - Inline style object properties matching banned colour/geometry keys (`color`, `background`, `border`, `borderRadius`, `boxShadow`, `filter`, `backdropFilter`, `accentColor`, etc.).
     - Hex color literals (`/#(?:[0-9a-fA-F]{3,4}){1,2}$/`) and template elements.
     - Strict `#14b8a6` literal ban: `#14b8a6` is banned in all JS/JSX files across the codebase without exception (it lives only in `tokens.json` and `theme.css`).
     - Functional colour literals (`rgb`, `rgba`, `hsl`, `hsla`).
     - 148 CSS named colours.
     - Canvas `createLinearGradient`, `createRadialGradient`, `createConicGradient` across any receiver (`ctx`, `chart.ctx`).
   - jsx-a11y warnings: `click-events-have-key-events`, `no-static-element-interactions`, `interactive-supports-focus`, `label-has-associated-control`.
   - Scoped override for `src/styles/chartTheme.js` and `src/constants/categories.js` (re-declaring canvas gradient ban; `#14b8a6` is banned even inside `chartTheme.js` per §4.3.2 rule 6).

### Component 3: Repository Hygiene, Test-ID Guard, and `AGENTS.md`
1. **`AGENTS.md`** at repository root:
   - Frozen design direction: graphite ramp, teal interactive accent (`#14b8a6`), recessed `#0c0d0f` chrome, mobile compact-expand cards (D19), IBM Plex Sans/Mono.
   - References to canonical frames (`docs/UI-UX_Plan/reference/01-dense-table.html`, `02-form.html`, `03-dashboard.html`).
   - Explicit banned patterns list (gradients, blur, box-shadow glows, unlisted radii, white text on accent).
2. **Test-ID & Aria Label Guard (`frontend/scripts/testid-guard.js`)**:
   - Diffs occurrences of `data-testid` and `aria-label` across all `.js`/`.jsx` files between HEAD and the merge base.
   - Prevents accidental deletion or alteration of the 37 `data-testid` and 39 `aria-label` anchors (Invariant I5).
3. **`ui-coverage.js --assert-allowlist`**:
   - Validates that every route entry in `App.js` matches the allowlist ownership structure from §6.3.

### Component 4: Calculation Characterization Fixtures (§9.6, Invariant I3)
Preserve current numerical calculations with zero deviation:
1. **Payroll**: gross $\to$ net, tax brackets, social insurance deductions (`PaycheckFormPage`, `PaycheckTable`, `YearlyTaxTable`).
2. **Credit Cards**: installment schedule amortization, statement cycle, partial payment interest.
3. **Debt Payoff**: payoff projections across Avalanche vs Snowball strategies (`DebtPayoffPage`).
4. **Trades**: trade P&L, fees/charges, corporate-action share adjustments.
5. **Certificates**: CD maturity values, daily/monthly interest accrual schedule.
6. **Currency**: multi-currency conversions, portfolio valuation, historical rate triangulation.
7. **Budgets**: threshold calculation at 0%, 50%, 80%, 100%, 120%.
8. **Real Estate**: rental yield, ROI, maintenance and acquisition cost totals.
- Implemented as characterization test suites in `frontend/tests/fixtures/calculations/` executed via single-worker jest/test runner.

### Component 5: Deterministic Playwright Visual Regression Harness (§9.5)
1. **Directory layout**:
   - `frontend/tests/visual/fixtures/routes.js`: deterministic mock payloads for all rendering routes.
   - `frontend/tests/visual/fixtures/clock.js`: fixed timestamp helper (`2026-01-15T09:00:00Z`).
   - `frontend/tests/visual/fixtures/auth.setup.js`: pre-baked `storageState` session (no login round-trip).
   - `frontend/tests/visual/visual.spec.js`: route $\times$ 5 viewport widths (1440, 1280, 1024, 768, 390).
   - `frontend/tests/visual/a11y.spec.js`: axe audit per route.
2. **Automated Masking**:
   - `data-visual-mask` applied to clock, volatile timestamps, random IDs.
3. **CI Pipeline Integration (`.github/workflows/ci.yml`)**:
   - Add frontend test job: `npm test -- --watchAll=false`.
   - Add PR trigger for frontend jobs.
   - Add lint ratchet and tones checks.

---

## 3. Verification & Acceptance Criteria (§6.5 Exit Gate 1C)

1. `git check-ignore` confirms `.gitignore` integrity (plan is trackable, snapshots ignored).
2. `node frontend/scripts/lint-tones.js` exits 0.
3. `node frontend/scripts/lint-ratchet.js` compares cleanly against merge base without failure.
4. `node frontend/scripts/testid-guard.js` confirms zero deleted `data-testid` or `aria-label` attributes.
5. `node frontend/scripts/ui-coverage.js --assert-allowlist` exits 0.
6. Calculation characterization test suite passes 100% green against existing code.
7. CI workflow `.github/workflows/ci.yml` validates frontend test, lint, and PR triggers.
8. Local workstation memory constraints (§15) respected: tests executed with `--runInBand` / single worker.

---

## 4. Execution Steps

1. Create branch `phase-ui-1c-tooling` from `main`.
2. Install necessary dev dependencies: `stylelint`, `stylelint-config-standard` (or required stylelint rules), `jest-axe`.
3. Create `frontend/.stylelintrc.json` with verbatim anti-slop rules from §9.2.
4. Create `frontend/scripts/lint-ratchet.js` and `frontend/scripts/lint-tones.js`.
5. Update ESLint configuration in `frontend/` with AST selectors from §9.2.
6. Create `frontend/scripts/testid-guard.js`.
7. Extend `frontend/scripts/ui-coverage.js` with `--assert-allowlist` mode.
8. Author `AGENTS.md` at repo root.
9. Construct calculation fixtures in `frontend/tests/fixtures/calculations/` and runner.
10. Setup Playwright visual regression harness structure in `frontend/tests/visual/`.
11. Update `.github/workflows/ci.yml` to include frontend test & lint jobs on PRs.
12. Run full verification suite and produce walkthrough artifact.

