# UI Phase 5D Walkthrough — Paycheck Form, Part 2 (Allowlist, Accessibility & Verification)

- **Sub-phase**: Phase 5D (`/salary/paychecks/new` and `/salary/paychecks/edit/:id` — Part 2: Allowlist, Accessibility & Verification)
- **Working Branch**: `main` (Local changes only, zero remote push per user instruction)
- **Allowlisted Routes**: `/salary/paychecks/new` and `/salary/paychecks/edit/:id` (Total: 14 allowlisted routes)
- **Date**: 2026-11-22
- **Status**: Completed & Ready for User Review

> [!IMPORTANT]
> **Push Gate & User Review Constraint**: Per the explicit instruction (`proceed, do not push till walkthrough is review and save the walkthrough to docs`), **no changes have been pushed to any remote branch**. All commits and verifications remain strictly local awaiting user review and sign-off.
> **Full Route Theming Achieved**: Both `/salary/paychecks/new` and `/salary/paychecks/edit/:id` are now fully active under the dark graphite design system (`THEMED_PATTERNS` in `ProtectedRoute.js` expanded from 12 to 14 routes). The temporary unscoped legacy CSS block in `PaycheckFormPage.css` (lines 1–984) has been permanently sunset, resulting in zero `stylelint-disable` directives remaining in the file.

---

## 1. Executive Summary & Deliverables

In Phase 5D, we finalized the migration of the Paycheck Form routes (`/salary/paychecks/new` and `/salary/paychecks/edit/:id`), promoting them from the dormant scoped preview state established in Phase 5C into fully active, allowlisted production routes.

### Key Deliverables:
1. **Sunset Legacy Compatibility Block**: Deleted lines 1–984 of `frontend/src/pages/salary/PaycheckFormPage.css`. The file now consists solely of the clean, scoped `.fs-page` theme block. Exactly **0** `stylelint-disable` directives remain in the file.
2. **Component-Table Inline Theming**: Added theme rules to `frontend/src/styles/theme-components.css` for `.component-basis-select`, `.number-input-wrapper`, and `.number-input`, ensuring seamless inline editing states across all table components. `ComponentTable.css` was left completely untouched.
3. **Route-Level Loading Standard (D23)**: Adopted `<Loading variant="route" text="Loading profile & paycheck details..." />` in `PaycheckFormPage.js`, sunsetting ad-hoc spinner JSX while preserving existing test attributes and test expectations.
4. **Form Accessibility & Field Pairing (WCAG 2.1 AA)**:
   - Added `aria-required="true"`, `aria-invalid`, `aria-describedby="pay-period-error"`, and `<span id="pay-period-error" className="form-error" role="alert">Please provide a pay period (e.g. 2026-08)</span>` to `#pay-period`.
   - Wired `onInvalid` to prevent browser tooltip popups and switch into visible `.form-error` display upon attempted submission with empty required fields.
   - Added `aria-required="true"` to `#pay-date`.
5. **Route Allowlist Expansion**: Added `'/salary/paychecks/new'` and `'/salary/paychecks/edit/:id'` to `THEMED_PATTERNS` in `ProtectedRoute.js` (expanding allowlist coverage from 12 to 14 patterns; `node scripts/ui-coverage.js --assert-allowlist` passing).
6. **Real-Browser Axe Gate (Un-injected)**: Removed the temporary harness injection in `a11y.spec.js`; verified un-injected axe tests in Playwright pass with **0 critical** and **0 serious** violations.
7. **Baseline Regeneration (A5-Local, D21)**: Regenerated all 10 baselines for `salary-paychecks-new` and `salary-paychecks-edit` across 5 viewports in `D:\Projects\FinStat-visual-baselines`. All 334 baseline files validated with exact SHA-256 hashes in `manifest.json`.
8. **Recorded Amendment**: Documented the Phase 5D presentation validation state amendment in `docs/UI-UX_Plan/UI-UX-PLAN.md §6.9`.

---

## 2. Visual Comparison & Rendered Snapshots

Snapshots captured in Playwright Chromium with deterministic time and mock fixtures.

### 2.1 New Paycheck Route (`/salary/paychecks/new`)

![New Paycheck Desktop (1440px)](../ui-snapshots/phase-5d/salary-paychecks-new-1440.png)
*Desktop (1440px): Canonical Reference Frame 02 match. Dark graphite canvas (`#101114`), stacked field cards (`var(--fs-surface)` = `#1a1c20`, border `#34383f`), single primary accent Save CTA (`#14b8a6` with `#0d0e10` ink text), 2px left indicator cue on selected disbursement button, tabular figures on numeric preview values, and 4px input radii.*

![New Paycheck Mobile (390px)](../ui-snapshots/phase-5d/salary-paychecks-new-390.png)
*Mobile (390px): Fully responsive mobile presentation. Zero page-level horizontal overflow (`scrollWidth <= clientWidth`), wrapped action rows, 100% width mobile input fields, touch targets $\ge 44$px.*

---

### 2.2 Edit Paycheck Route (`/salary/paychecks/edit/:id`)

![Edit Paycheck Desktop (1440px)](../ui-snapshots/phase-5d/salary-paychecks-edit-1440.png)
*Desktop (1440px): Edit paycheck route populated with existing record data, live recalculations, and themed component table.*

![Edit Paycheck Mobile (390px)](../ui-snapshots/phase-5d/salary-paychecks-edit-390.png)
*Mobile (390px): Edit paycheck form collapsed into mobile layout with compact tabular sections and full-width action buttons.*

---

## 3. Verification Gates Summary (14 of 14 Passed)

Every verification gate specified in `phase_5d_implementation_plan.md` was executed and passed:

| # | Gate | Target / Requirement | Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Clean Git Tree | Working tree verified clean prior to commit | Local changes staged cleanly | **PASSED** |
| **2** | Stylelint | 0 errors, 0 warnings; exactly 0 `stylelint-disable` in `PaycheckFormPage.css` | Exited 0; 0 errors, 0 warnings, 0 disables | **PASSED** |
| **3** | ESLint | 0 errors, 0 warnings across all touched JS and test files | Exited 0 with `--max-warnings=0` | **PASSED** |
| **4** | Tone Audit | Scans for banned hex/gradients and undefined CSS tokens | 0 tone violations across 56 page CSS files; 0 undefined tokens across 59 CSS files | **PASSED** |
| **5** | Unit Suites | Touched React test suites in `src/pages/salary/__tests__/` | 4 suites, 22 tests passing green | **PASSED** |
| **6** | Characterization Parity (I3) | Payroll and financial math calculations characterization | `tests/calculations.spec.js` 11/11 tests passing green | **PASSED** |
| **7** | Real-Browser Axe Gate | Playwright axe test on live allowlisted route with zero DOM harness injection | 3 passed, 0 critical, 0 serious accessibility violations | **PASSED** |
| **8** | Reference Match Spec | Playwright visual assertions matching Reference Frame 02 | `paycheck-form-reference-match.spec.js` 5/5 passed | **PASSED** |
| **9** | Production Build | Production bundle compilation | `npm run build` compiled successfully | **PASSED** |
| **10** | Visual Regression (PR-Subset) | 71 PR-subset visual tests with 0 diff on unthemed routes | 71/71 tests green, 0 diff | **PASSED** |
| **11** | Allowlist Coverage | Allowlist count assertion | `node scripts/ui-coverage.js --assert-allowlist` verifies exactly 14 patterns | **PASSED** |
| **12** | Manifest Integrity | Verification of baseline SHA-256 hashes | `334/334 baselines verified successfully.` | **PASSED** |
| **13** | TestID Guard & Ratchet | Zero test ID deletions, zero ratchet regressions | 0 regressions, all 37 test IDs and 39 aria labels preserved | **PASSED** |
| **14** | Local Commit Only | Commit changes locally without pushing to remote | Staged and committed locally; remote push held | **PASSED** |

---

## 4. Invariants Compliance (UI-UX-PLAN.md §2)

| Invariant | Rule | Phase 5D Verification |
| :--- | :--- | :--- |
| **I1** | Production routes and URLs unchanged — 75 entries | 75 routes confirmed; allowlist assertion verified for 14 patterns. |
| **I2** | No API call, payload shape, or service file changed | `paycheckService.js` and backend API endpoints completely untouched. |
| **I3** | No calculation changed on any page | `tests/calculations.spec.js` 11/11 tests passing green. Form calculation logic byte-identical. |
| **I4** | Auth, roles, `ProtectedAction`, and `useCanModify` gating unchanged | Viewer role protection preserved; form modify guards unchanged. |
| **I5** | Test IDs and accessible labels preserved — 37 test IDs, 39 aria labels | `node scripts/testid-guard.js` reported 0 deletions. |
| **I6** | Mobile responsiveness (D19) — no horizontal overflow at 390px | Playwright verified `scrollWidth <= clientWidth` at 390px. |
| **I7** | No page loses functionality mid-migration | Verified both `/salary/paychecks/new` and `/salary/paychecks/edit/:id` fully operational under theme. |
| **I8** | Dashboard line cap preserved ($\le 120$ lines) | `DashboardSummary.js` unchanged at 97 lines. |
| **I9** | Production build passes with zero errors | `npm run build` completed with exit code 0. |
| **I10** | Touched unit suites pass | All 4 suites in `src/pages/salary/__tests__/` passed (22/22). |
| **I11** | No new `!important`; ratchet count may only fall | `lint-ratchet.js` passed; `PaycheckFormPage.css` violations dropped to 0. |
| **I12** | No new dependency | Zero dependencies added to `package.json`. |
| **I13** | Design token single source of truth | Verified against `tokens.json`. |
| **I14** | Anti-slop invariants: no unlisted border-radii, no blurs | Verified by `stylelint` and `lint-tones.js`. |
| **I15** | Design System Separation | No global `.fs-*` utility classes in unthemed routes. |
| **I16** | Zero `stylelint-disable` directives in page CSS | Exactly 0 `stylelint-disable` directives in `PaycheckFormPage.css`. |

---

## 5. Recorded Amendments & Deviations

1. **Phase 5D Presentation Validation State Amendment**:
   - Recorded in `docs/UI-UX_Plan/UI-UX-PLAN.md §6.9`.
   - To adhere to WCAG 2.1 AA and Reference Frame 02 standards without breaking form submission logic, presentation validation state (`formSubmitted` flag) was added to `PaycheckFormPage.js`. Native browser validation tooltips are intercepted via `onInvalid={(e) => { e.preventDefault(); setFormSubmitted(true); }}` to render inline accessible error alerts (`#pay-period-error`, `role="alert"`) with proper `aria-describedby` and `aria-invalid` bindings.

---

## 6. Next Steps

Awaiting user review and approval of this walkthrough. Upon approval:
1. Push branch to remote.
2. Proceed to Phase 5E (`/salary/tax-simulator` — Tax Simulator migration).
