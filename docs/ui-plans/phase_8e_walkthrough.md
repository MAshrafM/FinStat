# UI Phase 8E Walkthrough — Real Estate (Cluster 8 Final Sub-Phase)

- **Date**: 2026-11-27
- **Status**: Complete (Gates 0–18 Passed) — **Awaiting Gate 19 User Sign-Off**
- **Branch**: `phase-ui-8e-real-estate` *(local only; only `main` is pushed after Gate 19 sign-off)*
- **Merge Base**: `main` @ `fea6d8f`
- **Gate 0 Plan & Governance SHA**: `7435fda`
- **Implementation SHA**: `e7a7c4e`
- **Starting Baseline Commit**: `d86155f` (`D:\Projects\FinStat-visual-baselines`, `334/334` manifest verified)
- **Gate 13 Baseline Commit**: `7460ca7` (`D:\Projects\FinStat-visual-baselines`, `334/334` manifest verified; `15` Real Estate PNGs replaced in place, `0` net new entries)
- **Target Routes (3 routes — closes Cluster 8 `13 -> 16 of 16`)**:
  - `/real-estate` (`RealEstateLogPage.js`, slug `real-estate`)
  - `/real-estate/new` (`AddRealEstatePage.js` + `RealEstateForm.js`, slug `real-estate-new`)
  - `/real-estate/edit/:id` (`EditRealEstatePage.js` + `RealEstateForm.js`, slug `real-estate-edit`)

---

## 0. Key Implementation Summary & Approved Decisions

1. **Exclusive CSS Rewrite (`RealEstate.css`) & `.main-content.full-bleed` Removal (`UI-UX-PLAN.md:1873`)**:
   - Rewrote `frontend/src/pages/real-estate/RealEstate.css` (`0` external consumers) strictly under D22 attribute-existence selector `html[data-fs-theme] .re-page-container` (`.re-log-page`, `.re-form-page`). Eliminated all `11` pink/purple gradients, `6` blurs/`backdrop-filter`, `12` pixel `box-shadow`s, and the `.main-content.full-bleed` / `:has(.real-estate-page-wrapper)` rule.
   - Appended **Section 22 (`Phase 8E: Real Estate Semantic & Interactive Themes`)** to `frontend/src/styles/theme-components.css` isolating active filter/view-switcher accent borders (`[aria-pressed='true']`) and danger button/error surfaces (`--fs-danger`, paired with `role="alert"` + text cues or `ConfirmModal`).
2. **Inline-Style, Colour & Emoji Purge (`47` inline styles -> `0`)**:
   - Purged all **47** verified `style={{` attributes (`34` in `RealEstateLogPage.js`, `7` in `RealEstateForm.js`, `2` in `AddRealEstatePage.js`, `4` in `EditRealEstatePage.js`), `2` JSX icon `color="#..."` props, `37` hex literals, and `8` `rgba` literals to **0**, verified by Gate 6 ESLint (`--max-warnings=0`), Gate 7 Jest (`querySelectorAll('[style]').length === 0`), and Gate 11 Playwright (`inlineStyleCount === 0`).
   - Replaced all 6 emojis (`🏠`,`🏢`,`🏰`,`🏞️`,`🏘️`,`📍`) with `react-icons/fa` icons (`aria-hidden="true"`) and replaced the inline-width appreciation bar with a native neutral `<progress className="re-appreciation-progress" aria-label="Valuation change for ..." aria-valuetext="+/-X.X%" value={...} max={100} />`.
3. **Approved Review Item #1 — Option B′ Strict Literal Neutrality (`§6.12:1873/:1877`)**:
   - Kept all cost basis, valuation, appreciation %, and capital gain figures strictly neutral signed `.fs-num` text across KPI tiles, Cards view, Table view, and D19 mobile cards. Zero `<Delta>` tones, zero realised-loss computation (`currentValuation - purchasePrice` unchanged per `I3`), zero `§4.3`/`§4.3.1` amendments required. The 4-property fixture includes a Sold loss (`Downtown Retail Unit`, `realizedGain: -300,000`) verified in Gate 7 & Gate 11 to render with zero negative tone leakage.
4. **Approved Review Item #2 — Option A Scoped `I4` Defensive `useCanModify()` Fix (`RealEstateLogPage.js:35`)**:
   - Fixed `const canModify = useCanModify();` -> `const { canModify } = useCanModify();` per Gate 0 approval (`7435fda`), closing the previously inert `if (!canModify) return;` guard in `handleDelete` while preserving every `<ProtectedAction>` wrapper (including empty-state `Add Your First Property`) unchanged. Verified by `RealEstateLogPage.test.js` viewer-role test (`deleteRealEstate` never invoked).
5. **Approved Review Item #3 — Waiver `W-8E-1` (`§7.1:2104`) & D19 Mobile Cards (`<= 768px`)**:
   - Recorded `W-8E-1` in `UI-UX-PLAN.md §7.1:2104` at Gate 0 for desktop/tablet `.re-log-page .re-table-wrap` (`RealEstate.css:549`, `overflow-x: auto`, `> 768px` Table view only). At `<= 768px`, `.re-table-wrap` hides and D19 compact-expand cards (`data-testid="real-estate-mobile-cards"`, `aria-expanded`) render with **0px** page overflow at `390px` (verified in Gate 11 Test 3).
6. **Reference Frame 02 Stacked Forms & Synchronous Hydration (`RealEstateForm.js`, `AddRealEstatePage.js`, `EditRealEstatePage.js`)**:
   - Implemented explicit `id`/`htmlFor` pairing across all 11 fields, synchronous `buildFormState(initialData)` state initialization, on-blur + on-submit validation (including `area >= 0` negative-value rejection and client-only conditional `Sold` fields with immediate error cleanup on switching back to `Owned`), distinct `.re-form-error-summary` / `#re-*-error` / `.re-submit-error` surfaces, `<Loading variant="form-field" />`, fetch-error `.re-error-card` + Retry, not-found `.re-empty-card`, and byte-identical submit payload (`I2`).

---

## 1. Progress Log Entry (Template §10 Format)

```text
Sub-phase:   8E (Real Estate — Final Cluster 8 Sub-Phase; Awaiting Gate 19 Sign-Off)
Status:      in progress (Gates 0–18 passed on local branch phase-ui-8e-real-estate; awaiting Gate 19 sign-off)
Done:        Modernized /real-estate, /real-estate/new, and /real-estate/edit/:id into the FinStat dark graphite design system (`RealEstate.css` rewritten under D22 `html[data-fs-theme] .re-page-container` + `theme-components.css` Section 22), closing Cluster 8 (`13 -> 16 of 16`). Purged all 47 verified inline styles (`34` log + `7` form + `2` add + `4` edit), 2 icon `color` props, 37 hex and 8 rgba literals, 11 gradients, 6 blurs, 12 pixel box-shadows, `.main-content.full-bleed`, and all 6 emojis. Applied approved Option B′ strict-literal neutrality (zero `<Delta>` tones, zero realised-loss computation, zero `§4.3`/`§4.3.1` amendment), neutral `<Badge>` type/status chips, accessible neutral `<progress>` appreciation meter (`aria-label` + signed `aria-valuetext`), approved Option A scoped `I4` defensive `useCanModify()` destructuring fix (`RealEstateLogPage.js`), Waiver `W-8E-1` (`§7.1:2104`) on desktop/tablet `.re-log-page .re-table-wrap` with D19 `<=768px` compact-expand mobile cards (`0px` overflow at `390px`), Reference Frame 02 stacked forms with 11 `id`/`htmlFor` pairings and client-only conditional `Sold` validation, `<Loading>` primitives, and `.re-error-card` Retry states. De-ignored lines 42–45 in `.eslintignore` (preserving `realEstateService.test.js`), expanded `THEMED_PATTERNS` `46 -> 49`, added 26 Jest + jest-axe tests (`2/2` suites) and 8-spec Playwright reference-match suite (`9/9` with setup). Gates 0–18 passed: Gate 1 49 patterns / 75 routes / 0 unassigned, Gate 2 0 drift, Gate 3 0 deletions, Gate 4 0 violations (`61` page / `64` total CSS), Gate 5 `0` regressions across `63` CSS / stylelint clean / `0` loading bypasses, Gate 6 ESLint `0` warnings, Gate 7 `26/26`, Gate 8 `15/15` (`DashboardSummary.js` `96` lines), Gate 9 `11/11`, Gate 10 `4/4`, Gate 11 `9/9`, Gate 12 `2048`MB build clean, Gate 13 `16/16` (`7460ca7`; `d86155f -> 7460ca7`; `334/334` manifest), Gate 14 `68/71` (`3` W-6A-1/AD16 only), Gate 15 `326` (`292 + 34` AD14/AD16), Gate 16 `2/2`, Gate 17 15/15 PNGs inspected & polished, Gate 18 `86/86` (all 16 Phase 8 routes + Credit Cards).
Next:        Gate 19 user sign-off, §3 governance sync (closing Phase 8 exit gate 16/16), `--no-ff` merge to `main`, and push `main`
Blocked by:  Gate 19 User Sign-Off
Allowlist:   ['/real-estate', '/real-estate/new', '/real-estate/edit/:id'] (cumulative: 49 patterns)
Visual diff: Gate 13 replaced 15 real-estate snapshots in place (7460ca7); manifest 334/334 verified; Gate 14 68/71 (3 W-6A-1/AD16 only); Gate 15 326 accounted (292 + 34 AD14/AD16); Gate 18 86/86; 0 diffs attributable to 8E. W-8E-1 active for desktop/tablet .re-log-page .re-table-wrap only.
Fixtures:    calculations.spec.js byte-identical, 11/11 green across 8 domains (Domain 8 Real Estate ROI & Yields unchanged)
Screenshots: None tracked per D5/D21; 15 real-estate baselines in FinStat-visual-baselines repo (7460ca7)
Branch:      phase-ui-8e-real-estate
Plan SHA:    7435fda
Impl SHA:    e7a7c4e
Walkthrough SHAs: Pending commit on phase-ui-8e-real-estate
Merge SHA:   Pending Gate 19 sign-off
```

---

## 2. Invariant Compliance Checklist (Action Plan §2 Verbatim)

| # | Rule (Verbatim from Action Plan §2) | Verification Method | Status | Evidence / Notes |
| :--- | :--- | :--- | :---: | :--- |
| **I1** | Production routes and URLs unchanged — 75 entries (74 protected + `*`), 10 redirects. | `App.test.js` route-resolution test; `ui-coverage.js` diff | PASS | Gate 1: `ui-coverage.js --assert-allowlist` verified **49** patterns (`46 -> 49`, adding `/real-estate`, `/real-estate/new`, `/real-estate/edit/:id`); `--routes` confirmed **75 route entries / 10 redirects / 65 rendering / 0 unassigned** (`App.js` untouched). Gate 8: `App.test.js` passed (`15/15` total). |
| **I2** | No API call, payload shape, or service file changed. | PR diff review; blocked path list in CI | PASS | `realEstateService.js`, `formatters.js`, `backend/routes/realEstates.js`, and `backend/validationSchemas/realEstateSchemas.js` byte-identical vs `fea6d8f` (Gate 5 protected-file diff empty). `RealEstateForm.test.js` verifies byte-identical submit payload. |
| **I3** | No calculation changed on **any** page: payroll, installment schedules, debt payoff, trade P&L, certificate maturity/interest, FX conversion, budget thresholds, real-estate yield. | Characterization fixtures (§9.6) | PASS | Gate 9: `tests/calculations.spec.js` **11/11** passed (byte-identical across 8 domains including Domain 8 Real Estate ROI and Yields). Displayed gain remains `currentValuation - purchasePrice`; inherited `$` `formatCurrency()` retained. |
| **I4** | Auth, roles, `ProtectedAction`, and `useCanModify` gating unchanged. | Viewer-role checklist per phase | PASS *(authorized Gate 0 Option A defensive fix)* | All `<ProtectedAction>` wrappers preserved (including empty-state `Add Your First Property`). Per Gate 0 Option A (`7435fda`), fixed `const { canModify } = useCanModify();` (`RealEstateLogPage.js`) closing the inert `handleDelete` guard; verified by `RealEstateLogPage.test.js` viewer-role test with zero visible `ProtectedAction` changes. |
| **I5** | Test IDs, `data-*` attributes, and accessible labels preserved — 37 `data-testid`, 39 `aria-label`. | test-ID guard script (§9.2) | PASS | Gate 3: `testid-guard.js --base fea6d8f` `0` deletions; accessible `aria-label`s added to Edit/Delete buttons, view/filter groups, mobile expanders, and `<progress>` meters. |
| **I6** | Tables render as compact-expand cards at <= 768px (D19). Horizontal scroll preserved only for tables with >= 12 columns (audit logs) where the card pattern is impractical. No page-level horizontal scroll at 390px. | 390 px visual check: card layout renders, no page-level horizontal scroll, all fields reachable via expander. | PASS | Desktop/tablet `.re-log-page .re-table-wrap` covered by Gate 0 Waiver `W-8E-1` (`RealEstate.css:549`); at `<=768px`, `.re-table-wrap` hides and D19 mobile cards (`real-estate-mobile-cards`) render with **0px** page-level overflow at `390px` (Gate 11 Test 3). |
| **I7** | No page loses functionality mid-migration. | Pattern added only in the converting PR (§6.3) | PASS | All 3 Real Estate routes migrated atomically; Cards/Table toggle, status/type/search/sort filters, create/edit/delete flows, and conditional `Sold` fields all pass Gates 7 & 11. |
| **I8** | Dashboard coordinator line cap preserved — `DashboardSummary.js` must remain $\le 120$ lines (post-audit architecture decomposition invariant). All 10 RTL dashboard tests must remain green. | Line count assertion + `npm test` in 3A | PASS | Gate 8: `DashboardSummary.js` = `96` lines (`<= 120`); `App.test.js` + `DashboardSummary.test.js` **15/15** passed. |
| **I9** | Production build passes with zero errors and no new warnings. | CI (authoritative); local proxy via `npm start` + ESLint/stylelint (§15) | PASS *(local proxy; CI pending)* | Gate 12: standalone `CI=true GENERATE_SOURCEMAP=false NODE_OPTIONS='--max-old-space-size=2048' npm run build` compiled cleanly (`Compiled successfully.`, `0` errors, `0` new warnings). Authoritative CI workflow runs on merge to `main`. |
| **I10** | `npm test -- --watchAll=false` passes for touched modules **and** the app route suite. | CI (frontend test job added in 1C); local proxy: touched suites via `npx jest --runInBand` (§15) | PASS *(local suites)* | Gates 7 & 8: `RealEstateLogPage.test.js` (14) + `RealEstateForm.test.js` (12) + `App.test.js` + `DashboardSummary.test.js` = **41/41** passed in-band (`26` + `15`). |
| **I11** | No new `!important`; a file's count in the 1C lint ratchet may only fall. | stylelint + `lint-ratchet.js` (§9.2) | PASS | Gate 5: `lint-ratchet.js --base fea6d8f` `0` regressions across `63` CSS files; `0` `!important` in `RealEstate.css` and Section 22. |
| **I12** | No new dependency except the Phase 1C tooling list (§9.2). | `package.json` review | PASS | `frontend/package.json` and `frontend/package-lock.json` untouched vs `fea6d8f`. |
| **I13** | Every non-allowlisted route is pixel-identical to its 1B baseline. | Walkthrough-evidenced per §7.1: developer-run Playwright diff report attached to each phase walkthrough, with zero unexplained diffs. | PASS | Gate 14 (`68/71` W-6A-1/AD16 only), Gate 15 (`292 + 34 accepted AD14/AD16 = 326`, `0` unexplained), Gate 18 (**86/86** across all 16 Phase 8 routes + Credit Cards). |
| **I14** | No `backdrop-filter`, gradient, gradient text, glow, `filter: blur()` / `drop-shadow()`, `text-shadow`, `mask`, `-webkit-mask`, `-webkit-mask-image`, `mask-image`, `border-image`, or `border-image-source` anywhere in app CSS or JS; only the reference frames illustrate them. | stylelint (§9.2) | PASS | Removed all 11 gradients, 6 blurs, and 12 pixel box-shadows from `RealEstate.css`; Gate 5 stylelint + Gate 6 ESLint + Gate 11 computed-style checks confirm zero banned effects. |
| **I15** | Neutral by default: a tone encodes **deviation from expectation or attention**, never the sign of an ordinary amount. Expense amounts, income, and balances are neutral (§4.3). A page never references a tone token directly; it uses `Delta`, `Badge`, or a `.fs-progress--*` modifier. | stylelint + `lint-tones.js` + §4.3 domain table + §7.2 | PASS | Gate 4: `lint-tones.js` `0` violations; Option B′ keeps all Real Estate costs, valuations, appreciation %, capital gains, and type/status `<Badge>` chips strictly neutral (`0` `<Delta>` primitives; Sold-loss fixture verified neutral); `--fs-danger` is isolated in `theme-components.css` Section 22. |
| **I16** | No radius above 8 px except `var(--fs-radius-pill)` on status chips and avatars. | stylelint (§9.2) | PASS | Gate 5 stylelint + Gate 11 verify card/tile/form radii `<= 8px` (`--fs-radius-sm/md/lg`), `--fs-radius-pill` on `<Badge>` only. |

---

## 3. Visual Regression Diff Report (§7.1)

Per §7.1 (`UI-UX-PLAN.md:2099`), Gates 13, 14, 15, and 18 were executed against `D:\Projects\FinStat-visual-baselines` (`7460ca7`) served locally from the final Gate 12 `CI=true` static production build.

> [!NOTE]
> **Authorized Local Deviations (`Gate 12` & `Gate 15 / §15.5` + `§7.1` HTML Report Substitution)**:
> 1. **Gate 12 (`2048`MB local proxy)**: Explicitly authorized under Review Item #4; compiled cleanly at `2048`MB (`Compiled successfully.`) without requiring the `1536`MB fallback. Authoritative CI workflow runs on merge to `main`.
> 2. **Gate 15 (`§15.5`)**: Running the full 326-test `--project=visual` suite locally was explicitly authorized under Review Item #4 per Phase 8A–8D precedent to reconcile all 326 baselines prior to Gate 19 sign-off.
> 3. **§7.1 HTML-Report Substitution Disclosure**: Matching Phase 8A–8D git-hygiene precedent, generated `frontend/test-results/` and `frontend/playwright-report/` were removed after Gate 15 completed rather than left untracked in the working tree; §7.1 HTML-report attachment is satisfied by the `(a)–(d)` diff summary and accepted-diff register below.

### Diff Summary (Gate 15 Full Visual Suite & Gate 14 PR-Subset)

- **(a) Total routes / captures compared**:
  - **Gate 15 (Full Suite)**: **65 routes × 5 widths (1440, 1024, 768, 480, 390px) = 325 route captures + 1 auth setup = 326 Playwright tests** (`16.0m`).
  - **Gate 14 (`pr-subset`)**: **70 route captures** (65 routes @ 1440px + 5 smoke routes @ 390px) + **1 auth setup = 71 Playwright tests** (`3.8m`).
- **(b) Routes / captures with zero diff**:
  - **Gate 15**: **291 zero-diff route captures** (+ `1 setup` = **292 passed**), including **all 15 newly themed Phase 8E Real Estate recaptures (`7460ca7`)**, all 20 Currency captures, all 20 Certificates captures, all 25 Gold/Purchasing-Power captures, and all 5 Credit Cards captures.
  - **Gate 14**: **67 zero-diff route captures** (+ `1 setup` = **68 passed**).
- **(c) Routes / captures with accepted pre-existing diffs**:
  - **34 accepted pre-existing baseline diffs in Gate 15** — identical to Phases 7A, 8A, 8B, 8C, and 8D (`292 + 34`); **0 diffs attributable to Phase 8E**:
    - **AD14 (10 diffs)**: `not-found` @ 768/480/390px (`3`), `dashboard` @ 768/480px (`2`), `expenditures` @ 768/480px (`2`), `expenditure-analysis` @ 1024/768/480px (`3`).
    - **AD16 / W-6A-1 (24 diffs)**: `salary-profiles` @ 768/480/390px (`3`), `salary-profile-update` @ 1440/1024/768/480/390px (`5`), `salary-paychecks-new` @ 768/480/390px (`3`), `salary-paychecks-edit` @ 768/480/390px (`3`), `analysis-payroll` @ 1440/1024/768/480/390px (`5`), `salary-rules` @ 1440/1024/768/480/390px (`5`). *(Gate 14's only 3 failures were `salary-profile-update @ 1440px`, `analysis-payroll @ 1440px`, and `salary-rules @ 1440px`.)*
  - **Intentional Phase 8E recaptures (`7460ca7`)**: `/real-estate`, `/real-estate/new`, `/real-estate/edit/1` × 5 viewports (`15` snapshots replaced in place; AD13 allowlist expansion `46 -> 49`).
- **(d) Routes with unexplained diffs**: **0** (`0` unexplained diffs; `0` diffs attributable to Phase 8E).

### Manifest Integrity (`verify-baseline-manifest.js`)

- **Starting baseline commit**: `d86155f` (`D:\Projects\FinStat-visual-baselines`, `334/334`)
- **Gate 13 baseline commit**: `7460ca7` (`D:\Projects\FinStat-visual-baselines`, `"Phase 8E: recapture 15 real estate route snapshots"`, `16` files changed, `0` net new entries)
- **Captured commands & output**:
```powershell
node frontend/scripts/verify-baseline-manifest.js --generate
node frontend/scripts/verify-baseline-manifest.js
```
```text
Manifest generated for 334 baselines at D:\Projects\FinStat\frontend\tests\visual\baseline\manifest.json
334/334 baselines verified successfully.
```

---

## 4. Gate Verification Evidence (Gates 0–18)

| Gate | Status | Verified Result |
|---|---:|---|
| **0. Plan & Pre-Execution Amendments** | PASS | Committed (`7435fda`) `docs/ui-plans/phase_8e_implementation_plan.md` (v5) + `UI-UX-PLAN.md` Waiver `W-8E-1` (`§7.1:2104`) and initial `§10` Gate 0 entry (Option B′ neutral capital gain, Option A scoped `I4` `useCanModify()` fix, local Gate 12/15 authorization, retained `$` formatter) on local branch `phase-ui-8e-real-estate`. |
| **1. Route Allowlist & Drift** | PASS | `ui-coverage.js --assert-allowlist` -> **49 pattern(s) verified** (`46 -> 49`); `--routes` -> **75 route entries / 10 redirects / 65 rendering / 0 unassigned** (raw stdout recorded below). |
| **2. Token Drift Guard** | PASS | `tokens.js --check --tables` -> `0 drift`. |
| **3. Test ID & ARIA Guard** | PASS | Re-verified post-polish: `testid-guard.js --base fea6d8f` -> `0` deletions (`all data-testid and aria-label attributes preserved`). |
| **4. Semantic Tone Guard** | PASS | Re-verified post-polish: `lint-tones.js` -> `0` violations across `61` unexempt page CSS files; `0` undefined tokens across `64` total CSS files on disk (`64` on-disk files vs `§8.1`'s historic `57`-file snapshot; `lint-tones` Check 1 exempts `tokens.css`, `theme.css`, `theme-components.css` = `61`). |
| **5. Stylelint, Ratchet, Overflow & Loading** | PASS | Re-verified post-polish: `lint-ratchet.js --base fea6d8f` -> `0` regressions across `63` linted CSS files (`64` minus exempt generated `tokens.css`); `stylelint` clean (`0` errors); `#14b8a6` only `tokens.css:36`; `[data-fs-theme="dark"]` only `tokens.css:2`; `0` `full-bleed`; `0` loading bypasses; `RealEstate.css` `overflow-x` only at `:549` (`W-8E-1`); all 18 protected-file diffs empty. |
| **6. ESLint & De-Ignore** | PASS | `npx eslint ... --max-warnings=0` -> `0` errors / `0` warnings across all 12 touched JS/spec files; `git grep -in "pages/real-estate" .eslintignore` -> `0` matches (`realEstateService.test.js` preserved). |
| **7. Real Estate Jest & jest-axe** | PASS | Re-verified post-polish: `RealEstateLogPage.test.js` (**14**) + `RealEstateForm.test.js` (**12**) = **2/2 suites, 26/26 passed**; `0` jest-axe violations; `0` `[style]` elements; Sold-loss fixture verified neutral; viewer `useCanModify()` test passed. |
| **8. App & Dashboard Smoke + Line Cap** | PASS | `App.test.js` + `DashboardSummary.test.js` = **2/2 suites, 15/15 passed**; `DashboardSummary.js` = `96` lines (`<= 120`). |
| **9. Calculations Parity (I3)** | PASS *(local proxy; CI pending)* | `npx jest --runInBand tests/calculations.spec.js --forceExit` -> **1/1 suite, 11/11 passed** across all 8 domains (including Domain 8 Real Estate ROI and Yields). |
| **10. Real-Browser Axe** | PASS | Re-verified post-polish -> **4 passed** (`1 setup + 3 routes`), `0` critical/serious violations, `0` CORS errors. |
| **11. Reference Match Spec** | PASS | Re-verified post-polish -> **9 passed** (`1 setup + 8 specs`, `22.2s`). |
| **12. Standalone Production Build** | PASS *(local proxy; CI pending)* | Re-verified post-polish at `2048`MB (`NODE_OPTIONS='--max-old-space-size=2048'`) -> `Compiled successfully.` (`0` errors, `0` new warnings). Authoritative CI runs on merge to `main`. |
| **13. Recapture 15 Baselines & Manifest** | PASS | Clean recapture after deleting stale PNGs -> **16 passed** (`1 setup + 15 PNGs` written fresh, `51.8s`), `334/334 baselines verified successfully`, committed at `7460ca7`. |
| **14. PR-Subset Visual Regression** | PASS | `PR_SUBSET=true` -> **68 passed + 3 accepted W-6A-1/AD16 diffs** (`3.8m`), `0` diffs attributable to 8E. |
| **15. Full 326-Test Visual Suite** | PASS *(authorized §15.5 deviation)* | **326 accounted = 292 passed + 34 accepted AD14/AD16 diffs** (`16.0m`; `0` unexplained, `0` 8E diffs); `test-results/` & `playwright-report/` cleaned post-run. |
| **16. Touch Targets & Focus Rings** | PASS | Re-verified post-polish -> **2 passed** (`14.1s`, `>= 44px` mobile CTA/icon buttons + keyboard Tab focus-visible). |
| **17. Developer Visual Inspection** | PASS | All **15/15** recaptured PNGs inspected directly via `read_file`; caught & resolved 5 polish defects on pass 1 (inherited `.App` center alignment, `.fs-num` alignment in KPI/card/input boxes, `<= 768px` `flex-basis` vertical gaps, visible `.fs-sr-only` search label, monospace textarea fallback) and re-inspected all 15 final PNGs clean. |
| **18. Phase 8 Cluster Exit & Unthemed Check** | PASS | Cross-phase cluster grep -> **86/86 passed** (`3.3m`; `1 setup + 80 Phase 8 captures [16 routes × 5 widths] + 5 Credit Cards`, `0` diffs). |

### Exact Captured CLI Commands & Gate 1 Raw Stdout

- **Gate 1 (`ui-coverage.js`)**:
```powershell
node frontend/scripts/ui-coverage.js --assert-allowlist
node frontend/scripts/ui-coverage.js --routes
```
```text
[ui-coverage] Asserting allowlist against 75 defined routes in App.js...
✓ [ui-coverage] Allowlist assertion passed. 49 pattern(s) verified against App.js routes.
=== Route Coverage Matrix ===
Total route entries: 75
Redirects: 10
Rendering routes: 65
Unassigned: 0
✓ 75 route entries confirmed. 0 unassigned.
```
- **Gate 10**: `npx playwright test a11y.spec.js --project=a11y -g "a11y check: real-estate(-new|-edit)?$"` -> `4 passed`
- **Gate 11**: `npx playwright test real-estate-reference-match.spec.js --project=reference` -> `9 passed (22.2s)`
- **Gate 12**: `$env:CI='true'; $env:GENERATE_SOURCEMAP='false'; $env:NODE_OPTIONS='--max-old-space-size=2048'; npm run build` -> `Compiled successfully.`
- **Gate 13**: `npx playwright test visual.spec.js --project=visual --grep="real-estate(-new|-edit)? @" --update-snapshots` -> `16 passed (51.8s)`
- **Gate 14**: `$env:PR_SUBSET='true'; npx playwright test visual.spec.js --project=pr-subset` -> `68 passed (3.8m)` + `3` accepted W-6A-1/AD16 diffs
- **Gate 15**: `npx playwright test visual.spec.js --project=visual` -> `292 passed (16.0m)` + `34` accepted AD14/AD16 diffs
- **Gate 16**: `npx playwright test real-estate-reference-match.spec.js --project=reference -g "touch targets"` -> `2 passed (14.1s)`
- **Gate 18**: `npx playwright test visual.spec.js --project=visual --grep="(real-estate|real-estate-new|real-estate-edit|currency|currency-detail|currency-new|currency-edit|certificates|certificates-detail|certificates-new|certificates-edit|gold-wallet|gold-wallet-new|gold-wallet-edit|gold-wallet-summary|analytics-purchasing-power|credit-cards) @"` -> `86 passed (3.3m)`

---

## 5. Gate 17 Visual Inspection Log & Computed-Style Conformance

### Visual Inspection Summary (`15/15` Final PNGs Inspected Clean)

- **Pass 1 polish catches resolved before baseline commit (`7460ca7`)**:
  1. Added `text-align: left` to `.re-page-container` to override `.App` center alignment.
  2. Added `text-align: left` to `.re-kpi-value`, `.re-metric-val`, and `.re-field-input` so `.fs-num` right-alignment stays scoped to table columns (`.re-td-num`).
  3. Set `flex: 0 0 auto` on `.re-header-left` and `.re-search-wrap` at `@media (max-width: 768px)` to eliminate column-mode `flex-basis` blank vertical gaps.
  4. Added `.re-sr-only` in `RealEstate.css` for the `"Search properties"` label, removing the visible label text and centering the search icon inside the input.
  5. Set `font-family: var(--fs-font-sans)` on `.re-field-textarea`.
- **Pass 2 final inspection**: All 15 recaptured PNGs (`real-estate`, `real-estate-new`, `real-estate-edit` × `1440`, `1024`, `768`, `480`, `390`) inspected via `read_file` with zero clipping, zero overflow, crisp flat graphite cards, and clean Frame 01/02/03 alignment.
- **Documented §7.4 State-Screenshot Deviation**: Loading (`<Loading variant="card" />`, `<Loading variant="form-field" />`), empty/not-found (`.re-empty-card`), API error (`.re-error-card` + Retry), `.re-submit-error`, viewer `ProtectedAction` gating, `ConfirmModal` deletion, and form validation states are verified via Gate 7 Jest + jest-axe and Gate 11 Playwright assertions; populated views across all 5 widths are baseline-locked in `D:\Projects\FinStat-visual-baselines` (`7460ca7`), with zero unversioned state PNGs added (Phase 7C–8D precedent).

### Computed-Style Conformance Table

| Element / Property | Expected Token / Spec | Verified Runtime Value (Gate 11) | Status |
| :--- | :--- | :--- | :---: |
| `<html data-fs-theme>` | `dark` | `dark` | PASS |
| `body` `background-color` | `--fs-bg` (`rgb(16, 17, 20)`) | `[16, 17, 20]` | PASS |
| `.re-kpi-tile` / `.re-prop-card` `background-image` | `none` (I14) | `none` | PASS |
| `.re-kpi-tile` / `.re-prop-card` `box-shadow` | `none` (I14) | `none` | PASS |
| `.re-kpi-tile` / `.re-prop-card` `border-radius` | `<= 8px` (I16) | `<= 8px` (`--fs-radius-lg`) | PASS |
| `.re-page-container [style]` count | `0` | `0` | PASS |
| `.re-page-container .fs-delta` / `.fs-badge--negative` | `0` (Option B′) | `0` | PASS |
| `.re-log-page .fs-btn-primary` count | `1` (single primary CTA) | `1` | PASS |
| `.re-table-wrap` desktop `overflow-x` / mobile `display` | `auto` (`W-8E-1`) / `none` (`<= 768px`) | `auto` / `none` | PASS |
| `390px` page horizontal overflow (Cards, Table, New, Edit) | `0px` (I6) | `0px` across all 4 views | PASS |
| `390px` mobile CTA & icon touch targets | `>= 44px` | `>= 44px` | PASS |

---

## 6. Post-Sign-Off Checklist (Execute ONLY After Gate 19 User Sign-Off)

- [ ] Receive explicit Gate 19 user sign-off on `phase_8e_walkthrough.md`.
- [ ] Sync governance in `docs/UI-UX_Plan/UI-UX-PLAN.md`:
  - `§5.7 (:935–939)`: Mark `/real-estate`, `/real-estate/new`, `/real-estate/edit/:id` `☑ | ☑`.
  - `§6.1 (:1069)`: Mark Phase `8E` `☑ | ☑`.
  - `§6.12 (:1871–1889)`: Check all 8 `8E` items, check all 5 **Phase 8 Exit Gate** items (`:1883–1887`), and update `:1889` to **`16 of 16 routes themed; Phase 8 exit gate closed`**.
  - `§8.1 (:2183)` & `§8.2 (:2209)`: Acknowledge `64` on-disk CSS files (`RealEstate.css` rewritten in place) and update `RealEstateLogPage.js` to `34 *(purged to 0 in 8E)*`.
  - `§10`: Finalize Phase 8E progress log entry with final Walkthrough SHAs and Merge SHA.
- [ ] Update `docs/ui-plans/phase_8e_implementation_plan.md` (`- **Status**: Complete`) and `docs/ui-plans/phase_8e_walkthrough.md` (sign-off date + final SHAs).
- [ ] Verify `docs/ui-plans/` contains zero `*review*.md` files.
- [ ] Update `CHANGELOG.md` (announcing **AD13** allowlist expansion `46 -> 49` per `§7.2:2132` and **Phase 8 Cluster Exit Gate closure `16 of 16`**).
- [ ] Merge `phase-ui-8e-real-estate` into `main` with `--no-ff`, finalize SHA closure commit on `main`, and `git push origin main` *(keep `phase-ui-8e-real-estate` local)*.
- [ ] Confirm authoritative GitHub Actions CI run passes on `main` post-merge (closing local proxy notes on Gates 9 & 12).
