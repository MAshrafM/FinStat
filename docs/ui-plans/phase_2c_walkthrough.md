# Walkthrough — UI Phase 2C: `App.css` `!important` Removal

Phase 2C safely de-escalates all 11 `!important` declarations from [`frontend/src/App.css`](file:///d:/Projects/FinStat/frontend/src/App.css) across four staged groups, authors `.fs-page`-scoped button and spinner rules in [`frontend/src/styles/theme-components.css`](file:///d:/Projects/FinStat/frontend/src/styles/theme-components.css), adds universal `@keyframes spin` and merges reduced-motion styling in [`frontend/src/styles/theme.css`](file:///d:/Projects/FinStat/frontend/src/styles/theme.css), and proves **0 visual regression diff** across all 326 route tests (**Invariant I13**) at every intermediate step and in the final composite state.

---

## 1. Summary of Changes

### 1.1 `App.css` `!important` De-escalation
All 11 instances of `!important` were removed from `frontend/src/App.css`. The stylelint `declaration-no-important` error count dropped from **11 $\to$ 9 $\to$ 7 $\to$ 1 $\to$ 0**. Total problems in `App.css` dropped from 61 to 50 (the remaining 50 are pre-existing font/color/radius violations scheduled for Phase 10 cleanup):

| Group | Line(s) | Selector | De-escalated Property | New Declaration | Stylelint `declaration-no-important` | Visual Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Baseline** | — | — | Current state | — | 11 errors (61 total) | — |
| **Group 1: Links** | 133, 146 | `.btn`, `a.btn, a.btn:hover, ...` | `text-decoration` | `text-decoration: none;` | 9 errors (59 total) | 326 passed, **0 diff** |
| **Group 2: Disabled** | 152, 153 | `.btn:disabled` | `transform`, `box-shadow` | `transform: none;`<br>`box-shadow: none;` | 7 errors (57 total) | 326 passed, **0 diff** |
| **Group 3: Colours** | 158, 167,<br>176, 184,<br>194, 203 | `.btn-primary`, `.btn-secondary`, `.btn-danger` | `color` | `color: #ffffff;`<br>`color: #374151;`<br>`color: #111827;` | 1 error (51 total) | 326 passed, **0 diff** |
| **Group 4: Overflow-x**| 237 | `.table-container, ... .lending-table-card` | `overflow-x` | `overflow-x: auto;` | **0 errors** (50 total) | 326 passed, **0 diff** |

### 1.2 `theme-components.css` Scoped Overrides
Added `.dashboard-button` and `.loading-spinner` scoped under `.fs-page`:
- `.fs-page .dashboard-button`: Uses design tokens (`--fs-action-bg`, `--fs-action-hover`, `--fs-action-text`, `--fs-radius-md`, `--fs-font-sans`, `--fs-weight-semibold`).
- `.fs-page .loading-spinner`: 24×24px spinner using stylelint-compliant `border-radius: var(--fs-radius-pill);` (`9999px`), strictly respecting §4.8 and §9.2 radius ceilings without triggering AST linter errors.

### 1.3 `theme.css` Global Spin & Merged Reduced Motion
- Added universal `@keyframes spin { to { transform: rotate(360deg); } }`.
- Merged `.fs-page .loading-spinner { animation: none; }` directly into the single existing `@media (prefers-reduced-motion: reduce)` block (avoiding duplicate media queries).

---

## 2. Verification Evidence

### 2.1 Staged Group Visual Verification
Each of the 4 groups was compiled and verified against the full 326-test Playwright visual regression suite:
- **Group 1 Run**: 326 passed (0 diff) in 20.0m
- **Group 2 Run**: 326 passed (0 diff) in 19.2m
- **Group 3 Run**: 326 passed (0 diff) in 19.0m
- **Group 4 Run**: 326 passed (0 diff) in 19.1m

### 2.2 Final Exit Gate 2C Suite Execution
All verification scripts and test suites passed cleanly against the final composite build:

1. **Tokens Check (`node frontend/scripts/tokens.js --check`)**:
   ```
   ✓ All §4.9 contrast tables match tokens.json (0 drift).
   ✓ tokens.css matches tokens.json verbatim (0 drift).
   ✓ All tokens checks passed successfully.
   ```
2. **Ratchet Check (`node frontend/scripts/lint-ratchet.js`)**:
   ```
   [lint-ratchet] Evaluating stylelint ratchet against merge-base: 4bcb8a927bd9bd34ed21d7bc9a8ac8a7a723a507
   ✓ [lint-ratchet] Checked 59 CSS files against 4bcb8a927bd9bd34ed21d7bc9a8ac8a7a723a507: 0 regressions.
   ```
3. **Reference Frames (`npx playwright test --project=reference`)**:
   ```
   ok 1 [reference] › 01-dense-table @ 1440px (2.9s)
   ok 2 [reference] › 02-form @ 1440px (2.3s)
   ok 3 [reference] › 03-dashboard @ 1440px (2.2s)
   3 passed (23.2s), 0 diff
   ```
4. **Shell Tests (`npx playwright test --project=shell`)**:
   ```
   ok 1 [setup] authenticate visual test session (13ms)
   ok 2 [shell] shell-legacy-desktop (8.9s)
   ok 3 [shell] shell-legacy-mobile (2.4s)
   ok 4 [shell] shell-dark-desktop-collapsed (3.3s)
   ok 5 [shell] shell-dark-desktop-expanded (2.8s)
   ok 6 [shell] shell-dark-mobile-drawer (2.9s)
   ok 7 [shell] shell-dark-account-dropdown (6.1s)
   7 passed (41.6s), 0 diff
   ```
5. **Final Composite Visual Suite (`npx playwright test --project=visual`)**:
   ```
   326 passed (19.1m), 0 diff
   ```
6. **Manifest Verification (`node frontend/scripts/verify-baseline-manifest.js`)**:
   ```
   334/334 baselines verified successfully.
   ```
7. **Unit Test Suite (`npm test -- --watchAll=false --runInBand`)**:
   ```
   Test Suites: 49 passed, 49 total
   Tests:       314 passed, 314 total
   Snapshots:   0 total
   Time:        38.988 s
   ```
8. **Stylelint & Tone Verification**:
   - `npx stylelint "src/styles/theme-components.css" "src/styles/theme.css"`: 0 errors
   - `node frontend/scripts/lint-tones.js`: 0 violations, 0 undefined tokens

---

## 3. Accepted-Diff Register (§6.6 / §10)

```
Accepted diffs in Phase 2C: None (0 route changes; 100% pixel fidelity preserved across all 326 unmigrated routes).
```

---

## 4. Git Status

```
On branch phase-ui-2c-app-css-fix
Changes to be committed / untracked:
  modified:   frontend/src/App.css
  modified:   frontend/src/styles/theme-components.css
  modified:   frontend/src/styles/theme.css
  modified:   docs/UI-UX_Plan/UI-UX-PLAN.md
  new file:   docs/ui-plans/phase_2c_implementation_plan.md
  new file:   docs/ui-plans/phase_2c_walkthrough.md
```
Ready for review and merging to `main`.
