# Phase 8C Walkthrough — Certificates: Detail & Forms

> **Sub-phase**: UI Phase 8C — Certificates: detail + forms  
> **Target Routes**: `/certificates/:id` (`CertificateDetailPage.js`), `/certificates/new` (`AddCertificatePage.js` + `CertificateForm.js`), `/certificates/edit/:id` (`EditCertificatePage.js` + `CertificateForm.js`)  
> **Date**: 2026-11-27  
> **Branch**: `phase-ui-8c-certificates-detail` *(local only until user sign-off & merge per §14)*  
> **Merge Base**: `main @ 942e165`  
> **Starting Baseline Commit**: `19d34c8` in `D:\Projects\FinStat-visual-baselines` (`334/334` manifest verified)  
> **Gate 13 Baseline Commit SHA**: `39fb1b0` in `D:\Projects\FinStat-visual-baselines` (`Phase 8C: recapture 15 certificates detail and form snapshots`; `334/334` manifest verified)  
> **Implementation & Plan Commit SHA**: `8826a99` (`feat(ui-phase-8c): theme certificates detail & forms`; plan status reconciled pre-sign-off)  
> **Walkthrough Commit SHAs**: `34cdc8c` *(initial)* + `ad20b22` *(v1 review revision)* + pre-sign-off R1–R6 cleanup commit  
> **Merge SHA**: `pending` *(upon post-sign-off `--no-ff` merge to `main`)*  
> **Plan & Approval Evidence**: `docs/ui-plans/phase_8c_implementation_plan.md` (v3, explicitly approved by user `"approved. begin execution"` on 2026-11-27 after `phase_8c_implementation_plan_review.md` & `phase_8c_implementation_plan_v2_review.md`; plan `- **Status**:` line reconciled pre-sign-off)  
> **Taste Checkpoint**: N/A (Cluster 8 Taste Checkpoint #6 was delivered and signed off in Phase 8A)  
> **Status**: Verification Gates 1–18 Complete; Walkthrough Committed on Local Branch — **Awaiting Explicit User Sign-Off**

---

## 1. Executive Summary & Progress Log Entry (§10)

```text
Sub-phase:   UI Phase 8C — Certificates: detail + forms
Status:      AWAITING SIGN-OFF (Gates 1–18 complete on phase-ui-8c-certificates-detail; plan reconciled; walkthrough revised after ad20b22)
Done:        Migrated /certificates/:id, /certificates/new, and /certificates/edit/:id into the FinStat
             dark graphite design system while leaving CertificateDetail.css (imported by Phase 8D
             CurrencyDetailPage.js) and Phase 8B CertificateLogPage.js strictly untouched.
             Extended Certificates.css (.cert-detail-page, .cert-form-page) and appended
             theme-components.css Section 20 under D22 html[data-fs-theme] attribute-existence selectors.
             Purged all 90 verified inline styles (88 in CertificateDetailPage.js [62 colour-bearing + 26
             layout/typographic] + 2 in CertificateForm.js [2 colour-bearing]; Add/Edit wrappers had 0),
             plus 84 hex and 10 rgba literals across the 4 JSX files. Replaced purple linear-gradient
             hero, green payout-due banner, and coloured metric tiles with flat Reference Frame 03
             Variant B dark surfaces, neutral <Badge tone="neutral"> status/remaining chips (icon
             aria-hidden + text, zero emojis), un-underlined .cert-back-link, and neutral .fs-num
             tabular figures. Enforced §4.4 section/dialog CTA scoping (Disburse Payout Now primary when
             banner shown, else top-bar Add Interest Payout primary; Withdraw uses --fs-danger/--fs-ink
             confirm). Migrated the dual-series accrual Line chart to existing chartTheme.js exports
             (grey4 solid + grey1 dashed, zero #14b8a6 accent series) with local certLastPointLabelPlugin
             (direct endpoints for both series), y-scale headroom preventing <=768px legend overlap,
             accessible aria-label + summary, 8A <details>/<table data-testid="cert-trajectory-table">,
             and D19 <=768px compact-expand mobile cards with zero new overflow-x. Converted
             Withdraw/Payout dialogs to accessible dark modals (initial closeBtn focus, Tab trap, Escape,
             exact trigger restore, preserved 'Deposit Proceeds To:' / 'Destination Account' labels).
             Converted forms to Reference Frame 02 Variant B stacked layout with id/htmlFor pairing,
             preserved account-selector-sourceAccount, on-blur+submit validation, valid-blur clearing &
             aria-describedby reset, startDate edit revalidation, distinct inline #cert-last-payout-error
             vs .cert-form-error-summary vs wrapper .cert-submit-error, and loading/error/empty surfaces.
             Removed lines 23–24 (CertificateDetailPage.js, CertificateForm.js) from .eslintignore (0
             certificate files remain ignored), expanded THEMED_PATTERNS 39 -> 42, added 28 new Jest +
             jest-axe tests (43/43 certificate suite total), extended certificatesMocks.js with ordered
             detail/accrual matching (keeping MOCK_CERTIFICATES byte-identical to 8B), and added 8-test
             Playwright reference-match spec (9/9 passed with setup).
Next:        Phase 8D (Currency)
Blocked by:  Awaiting explicit user sign-off on this walkthrough before §6 governance sync, merge (--no-ff), and push main
Allowlist:   THEMED_PATTERNS expanded 39 -> 42 (+3: '/certificates/:id', '/certificates/new', '/certificates/edit/:id')
Visual diff: Gate 13 replaced 15 PNGs in place (39fb1b0); Gate 14 68/71 (3 accepted W-6A-1/AD16 only);
             Gate 15 326 accounted (292 passed + 34 accepted AD14/AD16, matching 7A/8A/8B; 7C recorded
             326/326; explicitly authorized by approved 8C plan Gate 15 deviating from §15.5 prohibition);
             Gate 18 41/41 across all Certificates + Currency routes
Fixtures:    calculations.spec.js 11/11 passed (byte-identical across 8 domains including Domain 5 Certificates)
Screenshots: 15 recaptures across 1440, 1024, 768, 480, 390px (39fb1b0); 334/334 manifest verified
Branch:      phase-ui-8c-certificates-detail (plan+impl SHA: 8826a99; walkthrough SHAs: 34cdc8c, ad20b22)
Merge SHA:   pending (upon post-sign-off --no-ff merge to main)
```

### §0 Plan Decisions Realized

1. **Shared CSS decoupling (`CertificateDetail.css` & `CertificateLogPage.js` untouched; Phase 8D deferral)**: Dropped `import './CertificateDetail.css'` from `CertificateDetailPage.js` in favor of `./Certificates.css`. `git diff 942e165` on both `CertificateDetail.css` and `CertificateLogPage.js` is empty; Gate 18 verified **41/41** across all 8 routes (`certificates`, `certificates-detail`, `certificates-new`, `certificates-edit`, `currency`, `currency-detail`, `currency-new`, `currency-edit`). Conversion of `CertificateDetail.css` (`UI-UX-PLAN.md:1850`) and currency-log D19 cards (`:1854`) is explicitly deferred to Phase 8D (`CurrencyDetailPage.js` / `CurrencyLogPage.js`) per Plan Decisions 1 & 9, and recorded in the §10 amendment queued in §6. All new selectors for `.cert-detail-page`, `.cert-form-page`, and Section 20 use `html[data-fs-theme]` attribute-existence selectors (D22), with zero `[data-fs-theme="dark"]` selectors added outside `tokens.css` and zero changes to `chartTheme.js`.
2. **Verified inline-style census (`58`/`61` → `88` detail + `2` form = `90` total)**: All **90** `style={{` attributes across the newline-terminated source files (`789` / `152` / `20` / `37` lines) plus `84` hex literals and `10` `rgba` literals were purged. Jest Test 15 (`CertificateDetailPage.test.js`) and Test 11 (`CertificateForm.test.js`) assert zero `[style]` elements across rendered pages and opened dialogs.
3. **Neutral 5-status chips, un-underlined `.cert-back-link`, & flat graphite tiles**: All 5 domain statuses and the days-remaining chip use `<Badge tone="neutral">` with `aria-hidden` icons + text (zero emojis; `<Badge>` uses children pattern avoiding `Badge.js` string-label warning). `.cert-back-link` uses `text-decoration: none` per §4.4 navigation exclusion, keeping `.cert-name-link` exclusively for `CertificateLogPage.js`.
4. **Section/Dialog CTA Scoping & `--fs-danger` Reconciliation (§4.4, §4.10)**: On `/certificates/:id`, when Payout Due notice is visible (`showPayoutDueBanner`), `Disburse Payout Now` is the sole visible `.fs-btn-primary` and top-bar `Add Interest Payout` (`data-testid="add-payout-btn"`) drops to `.fs-btn-secondary`. When absent, `Add Interest Payout` is `.fs-btn-primary`. Inside modals, `Confirm Payout` uses `.fs-btn-primary` and `Confirm Withdrawal` uses `.cert-withdraw-confirm-btn` (`--fs-danger`/`--fs-ink`). Extending `--fs-danger` border/text styling in `theme-components.css` Section 20 to error surfaces (`.cert-error-card`, `.cert-form-error-summary`, `.cert-submit-error`, `#cert-last-payout-error`, each paired with `role="alert"` and explicit text cues per §4.10) follows Phase 8B Section 19 (`theme-components.css:2175`) and reconciles with §4.4 (`:409`). On forms, `{Create|Update} Certificate` is the sole `.fs-btn-primary` paired with neutral Cancel `.fs-btn-secondary`.
5. **Dual-series chart (`chartTheme.js` + `certLastPointLabelPlugin`) & 8A schedule table + D19 mobile cards (§4.12 & D22)**: Uses existing `getChartPalette()`, `withAlpha()`, `baseChartOptions()`, `ariaLabel()` (`grey4` solid + `grey1` dashed; zero `#14b8a6` series). **Reconciliation note (§4.12)**: Implementing `certLastPointLabelPlugin` locally inside `CertificateDetailPage.js` instead of adding a new `chartTheme.js` export deviates intentionally from `UI-UX-PLAN.md` §4.12 (`:665, :670, :1540`) shared-helper wording, following Phase 8A (`PurchasingPowerChart.js:252–271`) and Phase 8C v1 Plan Review Finding #1 so `chartTheme.js` stays unchanged. `certLastPointLabelPlugin` draws direct `Actual:` and `Projected:` labels at each dataset's final non-null datum; `scales.y` uses `beginAtZero: true, grace: '25%'` with top-edge label clamping so labels stay clear of legends across all widths. Below the chart sit `cert-chart-summary`, `<details>`/`<summary>` + `<table data-testid="cert-trajectory-table">` (`<caption>`, `scope="col"`, `data-label`), and D19 `.cert-trajectory-mobile-cards` at $\le 768\text{px}$. Zero new `overflow-x` added.
6. **Form validation cadence, error clearing & distinct error surfaces**: `CertificateForm.js` validates `lastPayoutDate` on blur & on submit, clearing `fieldErrors.lastPayoutDate` and `submitErrors` on valid blur (returning `aria-invalid="false"` and resetting `aria-describedby` cleanly back to `"cert-last-payout-help"`), and revalidating immediately on `startDate` edits. It keeps `#cert-last-payout-error` inline under `cert-last-payout-date` (`aria-invalid`, `aria-describedby`), `.cert-form-error-summary` for failed submit validation, and wrapper `.cert-submit-error` on `AddCertificatePage`/`EditCertificatePage` for API failures (never duplicate `.cert-form-error-summary`). `<AccountSelector>` `id="account-selector-sourceAccount"` and detail modal select labels (`Deposit Proceeds To:`, `Destination Account`) are preserved intact.

---

## 2. Invariant Compliance Checklist (Action Plan §2 Verbatim)

| # | Rule (Verbatim from Action Plan §2) | Verification Method | Status | Evidence / Notes |
| :--- | :--- | :--- | :---: | :--- |
| **I1** | Production routes and URLs unchanged — 75 entries (74 protected + `*`), 10 redirects. | `App.test.js` route-resolution test; `ui-coverage.js` diff | PASS | Gate 1: `ui-coverage.js --assert-allowlist` verified **42** active patterns (`39 -> 42`, adding `/certificates/:id`, `/certificates/new`, `/certificates/edit/:id`) and `ui-coverage.js --routes` confirmed **75 route entries / 0 unassigned** (`App.js` untouched). Gate 8: `App.test.js` 9/9 passed. |
| **I2** | No API call, payload shape, or service file changed. | PR diff review; blocked path list in CI | PASS | `certificateService.js` and `CertContext.js` untouched vs `942e165`. Jest Tests 11–13 (`CertificateDetailPage.test.js`) and 5–6, 10 (`CertificateForm.test.js`) verify byte-identical payloads (including withdraw `destinationAccount` and parsed numeric/ISO form fields). |
| **I3** | No calculation changed on **any** page: payroll, installment schedules, debt payoff, trade P&L, certificate maturity/interest, FX conversion, budget thresholds, real-estate yield. | Characterization fixtures (§9.6) | PASS | Gate 9: `tests/calculations.spec.js` **11/11** passed across all 8 domains (Domain 5 Certificates unchanged). |
| **I4** | Auth, roles, `ProtectedAction`, and `useCanModify` gating unchanged. | Viewer-role checklist per phase | PASS | `Add Interest Payout` and `Disburse Payout Now` remain wrapped in `ProtectedAction` checking `{ canModify }` (`CertificateDetailPage.test.js` Test 10). |
| **I5** | Test IDs, `data-*` attributes, and accessible labels preserved — 37 `data-testid`, 39 `aria-label`. | test-ID guard script (§9.2) | PASS | Gate 3: `testid-guard.js` `0` deletions vs `942e165`; `data-testid="add-payout-btn"`, `account-selector-sourceAccount`, and modal labels (`Deposit Proceeds To:`, `Destination Account`) preserved; `aria-label`s added to refresh button, modal close buttons, and chart wrapper. |
| **I6** | Tables render as compact-expand cards at ≤ 768px (D19). Horizontal scroll preserved only for tables with ≥ 12 columns (audit logs) where the card pattern is impractical. No page-level horizontal scroll at 390px. | 390 px visual check: card layout renders, no page-level horizontal scroll, all fields reachable via expander. | PASS | Trajectory schedule table has 3 columns and collapses cleanly to D19 `.cert-trajectory-mobile-cards` at `<=768px`; **0** new `overflow-x` lines added vs `942e165`; Gate 11 Tests 5–7 verify `0` page-level overflow at `390px` across detail, new, and edit routes. |
| **I7** | No page loses functionality mid-migration. | Pattern added only in the converting PR (§6.3) | PASS | All 3 remaining certificate routes added together; live accrual refresh (manual + 60s), payout/withdraw/delete dialogs, create, and edit flows all pass Gates 7 & 11. |
| **I8** | Dashboard coordinator line cap preserved — `DashboardSummary.js` must remain $\le 120$ lines (post-audit architecture decomposition invariant). All 10 RTL dashboard tests must remain green. | Line count assertion + `npm test` in 3A | PASS | Gate 8: `DashboardSummary.js` = `96` lines ($\le 120$); `DashboardSummary.test.js` 6/6 passed (historic "10 RTL" wording preserved per 7C/8A/8B precedent). |
| **I9** | Production build passes with zero errors and no new warnings. | CI (authoritative); local proxy via `npm start` + ESLint/stylelint (§15) | PASS *(local proxy; CI pending)* | Gate 12: `CI=true GENERATE_SOURCEMAP=false NODE_OPTIONS=--max-old-space-size=2048 npm run build` compiled cleanly (`Compiled successfully.`); Gate 6 ESLint (`--max-warnings=0`) and Gate 5 Stylelint clean. Authoritative CI workflow runs on merge to `main`. |
| **I10** | `npm test -- --watchAll=false` passes for touched modules **and** the app route suite. | CI (frontend test job added in 1C); local proxy: touched suites via `npx jest --runInBand` (§15) | PASS *(local suites)* | Gates 7 & 8: `CertificateDetailPage.test.js` (16/16) + `CertificateForm.test.js` (12/12) + `CertificateLogPage.test.js` (15/15) + `App.test.js` (9/9) + `DashboardSummary.test.js` (6/6) = **58/58** passed in-band. |
| **I11** | No new `!important`; a file's count in the 1C lint ratchet may only fall. | stylelint + `lint-ratchet.js` (§9.2) | PASS | Gate 5: `lint-ratchet.js` `0` regressions across 62 linted CSS files (excluding generated `tokens.css`); `0` `!important` in `Certificates.css` and Section 20. |
| **I12** | No new dependency except the Phase 1C tooling list (§9.2). | `package.json` review | PASS | `frontend/package.json` and lockfile untouched vs `942e165`. |
| **I13** | Every non-allowlisted route is pixel-identical to its 1B baseline. | Walkthrough-evidenced per §7.1: developer-run Playwright diff report attached to each phase walkthrough, with zero unexplained diffs. | PASS | Gate 14 (68/71 W-6A-1/AD16 only), Gate 15 (292 + 34 accepted AD14/AD16 = 326, 0 unexplained), Gate 18 (**41/41** across Certificates + Currency including `/currency/:id` consumer of untouched `CertificateDetail.css`). |
| **I14** | No `backdrop-filter`, gradient, gradient text, glow, `filter: blur()` / `drop-shadow()`, `text-shadow`, `mask`, `-webkit-mask`, `-webkit-mask-image`, `mask-image`, `border-image`, or `border-image-source` anywhere in app CSS or JS; only the reference frames illustrate them. | stylelint (§9.2) | PASS | Removed purple hero gradient (`#1e1b4b -> #312e81`) and all pixel `box-shadow`s; Gate 5 stylelint + Gate 6 ESLint confirm zero banned effects. |
| **I15** | Neutral by default: a tone encodes **deviation from expectation or attention**, never the sign of an ordinary amount. Expense amounts, income, and balances are neutral (§4.3). A page never references a tone token directly; it uses `Delta`, `Badge`, or a `.fs-progress--*` modifier. | stylelint + `lint-tones.js` + §4.3 domain table + §7.2 | PASS | Gate 4: `lint-tones.js` `0` violations; hero, payout-due notice, 5 status badges, 6 metric tiles, and chart series stay neutral; `--fs-danger` is isolated in Section 20 for error surfaces (always paired with `role="alert"` and textual cues per §4.10) and for the destructive Withdraw confirm button (`.cert-withdraw-confirm-btn`, paired with confirmation checkbox + warning copy per §4.4). |
| **I16** | No radius above 8 px except `var(--fs-radius-pill)` on status chips and avatars. | stylelint (§9.2) | PASS | Removed `16px`, `12px`, `20px`, and `50%` radii; Gate 5 stylelint + Gate 11 Test 1 confirm all card/banner/tile radii $\le 8\text{px}$ (`--fs-radius-sm/md/lg`), `--fs-radius-pill` on `<Badge>` only. |

---

## 3. Visual Regression Diff Report (§7.1)

Per §7.1 (`UI-UX-PLAN.md:2099`), Gate 13, Gate 14, Gate 15, and Gate 18 were executed against `D:\Projects\FinStat-visual-baselines` (served locally from the Gate 12 `CI=true` static production build).

> [!NOTE]
> **§15.5 Deliberate Deviation Disclosure**: `UI-UX-PLAN.md §15.5` (`:3129–3133`) states *"Do not run the full visual suite locally; use the PR subset and let CI run the full matrix."* Running the full 326-test `--project=visual` suite locally in Gate 15 was **explicitly authorized by approved `phase_8c_implementation_plan.md` Gate 15** (and Phase 8A/8B precedent) under the local `2048`MB build heap hardware context in order to satisfy §9.5 / D21 full-suite visual reconciliation prior to sign-off, rather than leaving reconciliation exclusively to post-merge CI (acknowledging the documented internal tension between §15.5 and §9.5/D21 while keeping committed harness config unchanged). Additionally, matching Phase 8A/8B git-hygiene precedent, the generated `frontend/playwright-report/` folder was removed alongside `frontend/test-results/` after Gate 15 completed rather than left untracked in the working tree; §7.1 HTML-report attachment is treated as satisfied by the in-walkthrough diff summary and accepted-diff register, per 8A/8B cleanup precedent.

### Diff Summary (Gate 15 Full Visual Suite & Gate 14 PR-Subset)

- **(a) Total routes / captures compared**:
  - **Gate 15 (Full Suite)**: **65 routes × 5 mandatory widths (1440, 1024, 768, 480, 390px) = 325 route captures + 1 auth setup = 326 Playwright tests** (`15.8m`).
  - **Gate 14 (`pr-subset`)**: **70 route captures** (65 routes @ 1440px + 5 smoke routes @ 390px) + **1 auth setup = 71 Playwright tests** (`3.5m`).
- **(b) Routes / captures with zero diff**:
  - **Gate 15**: **291 zero-diff route captures** (+ `1 setup` = **292 passed**), including **all 15 newly themed Phase 8C recaptures (`39fb1b0`)**, all 5 Phase 8B `/certificates` captures (`certificatesMocks.js` `MOCK_CERTIFICATES` kept byte-identical to `942e165`), and all 20 unthemed Currency captures (including `currency-detail` consuming untouched `CertificateDetail.css`).
  - **Gate 14**: **67 zero-diff route captures** (+ `1 setup` = **68 passed**).
- **(c) Routes / captures with accepted diffs**:
  - **34 accepted pre-existing baseline diffs in Gate 15** — matching the **Phase 7A, 8A, and 8B `292 + 34` reconciliation** *(Phase 7C recorded 326/326 after reconciliation)*; **0 diffs attributable to Phase 8C**:
    - **AD14 (10 diffs)**: `not-found` @ 768/480/390px (`3`), `dashboard` @ 768/480px (`2`), `expenditures` @ 768/480px (`2`), `expenditure-analysis` @ 1024/768/480px (`3`).
    - **AD16 / W-6A-1 (24 diffs)**: `salary-profiles` @ 768/480/390px (`3`), `salary-profile-update` @ 1440/1024/768/480/390px (`5`), `salary-paychecks-new` @ 768/480/390px (`3`), `salary-paychecks-edit` @ 768/480/390px (`3`), `analysis-payroll` @ 1440/1024/768/480/390px (`5`), `salary-rules` @ 1440/1024/768/480/390px (`5`). *(Gate 14's only 3 failures were `salary-profile-update @ 1440px`, `analysis-payroll @ 1440px`, and `salary-rules @ 1440px`.)*
  - **Intentional Phase 8C recaptures (Gate 13, 0 diff against `39fb1b0`)**: `/certificates/1`, `/certificates/new`, and `/certificates/edit/1` × 5 viewports (`15` snapshots replaced in place; AD13 allowlist expansion).
- **(d) Routes with unexplained diffs**: **0** (`0` unexplained diffs; `0` diffs attributable to Phase 8C).

### Manifest Integrity (`verify-baseline-manifest.js`)

- **Starting baseline commit**: `19d34c8` (`D:\Projects\FinStat-visual-baselines`, `334/334`)
- **Gate 13 baseline commit**: `39fb1b0` (`D:\Projects\FinStat-visual-baselines`, `"Phase 8C: recapture 15 certificates detail and form snapshots"`, `0` net new entries)
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

## 4. Gate Verification Evidence (Gates 1–18)

| Gate | Status | Verified Result |
|---|---:|---|
| **1. Route Allowlist & Drift** | PASS | `node frontend/scripts/ui-coverage.js --assert-allowlist` → **42 pattern(s) verified** against 75 routes in `App.js`; `--routes` → **75 route entries confirmed. 0 unassigned.** (§7.1:2098 route-coverage drift check). |
| **2. Token Drift Guard** | PASS | `node frontend/scripts/tokens.js --check --tables` → `0 drift`. |
| **3. Test ID & ARIA Guard** | PASS | `node frontend/scripts/testid-guard.js` → `0` deletions vs `942e165` (`add-payout-btn` preserved). |
| **4. Semantic Tone Guard** | PASS | `node frontend/scripts/lint-tones.js` → `0` violations across `60` page CSS files; `0` undefined tokens across `63` total CSS files checked against `tokens.json` *(vs §8.1's `57` disk files, the extra files reflect shared/test stylesheets included by the verification globs)*. |
| **5. Stylelint, Ratchet, Overflow & Loading Checks** | PASS | `lint-ratchet.js`: `0` regressions across `62` CSS files (excluding generated `tokens.css`); `stylelint`: `0` errors on `Certificates.css` + `theme-components.css`; `#14b8a6` only in `tokens.css:36`; D22 compliance: `.cert-detail-page`/`.cert-form-page` (`Certificates.css`) and Section 20 (`theme-components.css`) use `html[data-fs-theme]` attribute-existence selectors with zero `[data-fs-theme="dark"]` selectors outside `tokens.css` and zero changes to `chartTheme.js`; loading consistency grep (`git grep -nE '<div>Loading\|className="loading-spinner"\|custom spinner SVG'`) → `0` legacy bypasses (`CertificateDetailPage.js` uses `<Loading variant="card" />`, `EditCertificatePage.js` uses `<Loading variant="form-field" />`); scoped `overflow-x` audit shows only 8B `.cert-log-page .cert-table-wrap` (`Certificates.css:267`, W-8B-1 — shifted 1 line from Plan Gate 5's pre-edit `:266` estimate due to Phase 8C header comment addition); `git diff 942e165 -- frontend/src` adds `0` `overflow-x` lines; `CertificateDetail.css` & `CertificateLogPage.js` diffs empty. |
| **6. ESLint & De-Ignore** | PASS | `npx eslint ... --max-warnings=0` → `0` errors, `0` warnings across all 12 touched JS files; `git grep -in "certificates" .eslintignore` → `0` matches. |
| **7. CRA Jest & jest-axe** | PASS | `CertificateDetailPage.test.js` (**16/16**) + `CertificateForm.test.js` (**12/12**) + `CertificateLogPage.test.js` (**15/15**) = **43/43** passed; `0` critical/serious jest-axe violations. |
| **8. Route Guard & Dashboard Coordinator** | PASS | `App.test.js` (9/9) + `DashboardSummary.test.js` (6/6) = **15/15** passed; `DashboardSummary.js` = `96` lines (`<= 120`). |
| **9. Calculations Parity (I3)** | PASS | `npx jest --runInBand tests/calculations.spec.js --forceExit` → **11/11** passed across all 8 domains (Domain 5 Certificates unchanged). |
| **10. Real-Browser Axe** | PASS | `a11y.spec.js --project=a11y -g "a11y check: certificates-(detail\|new\|edit)$"` → **4 passed** (`setup` + 3 routes), `0` critical/serious `wcag2a`/`wcag2aa` violations. |
| **11. Reference Match Spec** | PASS | `certificates-detail-forms-reference-match.spec.js --project=reference` → **9 passed** (`setup` + **8 spec tests**). |
| **12. Production Build** | PASS *(local proxy; CI pending)* | `CI=true GENERATE_SOURCEMAP=false NODE_OPTIONS=--max-old-space-size=2048 npm run build` → `Compiled successfully.` (`0` errors, `0` new warnings; authoritative CI runs on merge). |
| **13. Visual Baselines & Manifest** | PASS | `--grep="certificates-(detail\|new\|edit) @" --update-snapshots`: **16 passed** (`setup` + 15 PNGs replaced in place); `verify-baseline-manifest.js` = **334/334** (`0` net new entries); baseline SHA `39fb1b0`. |
| **14. PR-Subset Visual Regression** | PASS | `PR_SUBSET=true` → **68 passed + 3 accepted W-6A-1/AD16 diffs**, `0` diffs attributable to 8C. |
| **15. Full 326-Test Visual Suite** | PASS *(authorized deviation from §15.5)* | **326 accounted = 292 passed + 34 accepted AD14/AD16 diffs** (`15.8m`; `0` unexplained, `0` 8C-attributable). Explicitly authorized by approved 8C plan Gate 15 deviating from §15.5 (`:3133`) local prohibition per 8A/8B precedent; `playwright-report/` cleaned post-run. |
| **16. Touch Targets & Focus Rings** | PASS | `certificates-detail-forms-reference-match.spec.js -g "interactive touch targets"` → **2 passed** (`>= 44x44px` primary/mobile/form buttons, `>= 32x32px` desktop refresh button, visible `:focus-visible` outline on Tab). |
| **17. Developer Visual Inspection** | PASS | Conformance table & 9 inspected snapshots (`39fb1b0`) recorded in Section 5 below. |
| **18. Unthemed-Consumer & Shared-CSS Decoupling** | PASS | `--grep="certificates\|currency"` → **41/41 passed** (`1 setup + 20 certificates + 20 currency`), `0` diffs attributable to 8C; caught & corrected an initial `MOCK_CERTIFICATES` drift that caused a `certificates @ 1440px` diff. |

---

## 5. Gate 17 Reference-Frame Conformance & Inspection Evidence

### Gate 17 Catch & Resolution Log
1. **Chart direct-label / legend overlap at `768px` / `480px` / `390px`**: Initial visual inspection caught `Projected: $20,000.00` touching the Chart.js legend (`Projected Accrual (Dashed)`) because `Jul 2026: 20000` sat on `chartArea.top`. Fixed via `scales.y` (`beginAtZero: true`, `grace: '25%'`) and top-edge placement clamping inside `certLastPointLabelPlugin.afterDatasetsDraw`.
2. **Global `.App { text-align: center; }` inheritance**: Initial captures showed form `<label>`s and detail card headings centered in narrower/form contexts. Added direct `text-align: left;` rules on `.cert-detail-hero` / `.cert-metric-body` / `.cert-chart-header` / `.cert-form-page .form-group label` & help/error text, plus balanced `repeat(3, minmax(0, 1fr))` on `.cert-metrics-grid` at `>= 960px`. Re-captured and re-verified (`39fb1b0`): all 9 inspected PNGs are cleanly aligned with clear chart label headroom.

### Inspected Snapshot Files (`D:\Projects\FinStat-visual-baselines @ 39fb1b0`)
All 15 recaptured snapshots in `frontend/tests/visual/baseline/` (tracked in `D:\Projects\FinStat-visual-baselines @ 39fb1b0`) passed visual verification across 1440, 1024, 768, 480, and 390px, with direct developer visual inspection of the 9 core renders below:
- `frontend/tests/visual/baseline/certificates-detail-1440.png` (`39fb1b0`)
- `frontend/tests/visual/baseline/certificates-detail-1024.png` (`39fb1b0`)
- `frontend/tests/visual/baseline/certificates-detail-768.png` (`39fb1b0`)
- `frontend/tests/visual/baseline/certificates-detail-480.png` (`39fb1b0`)
- `frontend/tests/visual/baseline/certificates-detail-390.png` (`39fb1b0`)
- `frontend/tests/visual/baseline/certificates-new-1440.png` (`39fb1b0`)
- `frontend/tests/visual/baseline/certificates-new-390.png` (`39fb1b0`)
- `frontend/tests/visual/baseline/certificates-edit-1440.png` (`39fb1b0`)
- `frontend/tests/visual/baseline/certificates-edit-390.png` (`39fb1b0`)

### Computed-Style Reference Conformance (Verified via Gate 11 & Gate 16)

| Property | Desktop (`1440px`) | Mobile (`390px`) | Reference Frame B Target |
|---|---|---|---|
| `.cert-detail-page` / `.cert-form-page` canvas | `rgb(16, 17, 20)` | `rgb(16, 17, 20)` | Dark graphite canvas `#101114` |
| `.cert-detail-hero` & 6× `.cert-metric-tile` | `rgb(26, 28, 32)`, `image: none`, `shadow: none`, radius `<= 8px` | same | Frame 03 Variant B flat tiles (hero gradient & glow removed) |
| `.cert-back-link` | `text-decoration-line: none` | `text-decoration-line: none`, height `>= 44px` | §4.4 navigation exclusion (`.cert-name-link` stays underlined in 8B) |
| Primary CTA (`Disburse Payout Now` / `{Create\|Update} Certificate`) | `rgb(20, 184, 166)` bg, `rgb(13, 14, 16)` ink, count `1` per section, `>= 44x44px` | same | §4.4 Single Primary CTA with `--fs-ink` on `--fs-accent` |
| Hero status & days `<Badge>` chips | `rgb(34, 37, 42)` (`--fs-surface-raised`), `1px solid --fs-border`, `--fs-text-2` (`#c9cdd3`), `--fs-radius-pill`, `svg[aria-hidden="true"]`, text label | same | §4.3.1 neutral badges, zero emojis |
| Dual-series chart & schedule table | Canvas `width/height > 0`, `cert-chart-canvas-wrapper[data-plugin-ids*="certLastPointLabelPlugin"]`, `<details>` + `cert-trajectory-table` (`<caption>`, `scope="col"`, `data-label`) | Desktop `<details>` hidden; D19 `.cert-trajectory-mobile-cards` visible (`>= 44x44px` expander), `0px` page overflow | §4.12 chart accessibility + D19 collapse + zero new `overflow-x` |
| Stacked form (`.cert-form-card`) | `account-selector-sourceAccount` preserved; blur `#cert-last-payout-error` (`aria-invalid="true"`); valid blur clears error & resets `aria-describedby="cert-last-payout-help"`; failed submit adds distinct `.cert-form-error-summary` | Full-width stacked Cancel/Submit, `0px` page overflow | Frame 02 Variant B + Phase 7C blur/submit precedent |

### §7.4 State-Screenshot Inheritance Note
*Documented precedent-backed deviation from `UI-UX-PLAN.md` §7.4 (`:2155, :2158`):* Rather than saving separate unversioned state PNGs under `docs/ui-snapshots/phase-8c/`, loading cards (`<Loading variant="card" />`, `<Loading variant="form-field" />`), empty not-found card (`.cert-empty-card`), API fetch-error cards (`.cert-error-card` with `role="alert"` + Retry), wrapper `.cert-submit-error`, viewer `ProtectedAction` gating, opened Payout/Withdraw dialogs with initial focus & Tab trap, and all 5 certificate status badge variants are verified directly by Gate 7 Jest + jest-axe suites (`CertificateDetailPage.test.js` 16/16 + `CertificateForm.test.js` 12/12), while populated route renders across all 5 viewports are baseline-locked in `D:\Projects\FinStat-visual-baselines` (`39fb1b0`), matching Phase 7C, 8A, and 8B precedent.

---

## 6. Gate 19 / Merge Boundary & Complete Post-Sign-Off Governance Checklist

### Pre-Sign-Off Status
- [x] Gates 1–18 completed & reconciled (`CertificateDetail.css`, `CertificateLogPage.js`, `certificateService.js`, `CertContext.js`, `App.js`, `calculations.spec.js`, `package.json` untouched)
- [x] Temporary `test-results` / `playwright-report` cleaned; `.auth.json` clean
- [x] Plan & implementation (`8826a99`) and walkthrough (`34cdc8c` + `ad20b22` + v2 review reconciliation) committed on local `phase-ui-8c-certificates-detail`
- [x] Plan status reconciliation (`phase_8c_implementation_plan.md`) completed prior to sign-off
- [ ] **User sign-off on this Phase 8C walkthrough**
- [ ] Governance sync (`UI-UX-PLAN.md`, `CHANGELOG.md`) & review-file cleanup (`*review*.md`)
- [ ] Merge `phase-ui-8c-certificates-detail` into `main` (`--no-ff`) and push only `main` (§14)

### Post-Sign-Off Governance Synchronization Checklist (Execute Only After Approval)
1. `docs/ui-plans/phase_8c_implementation_plan.md`: Update `- **Status**:` (`:6`) with the final `main` merge SHA (`merged to main as <merge-sha>`).
2. `docs/ui-plans/phase_8c_walkthrough.md`: Record Gate 19 sign-off date and final `main` merge SHA.
3. Delete all `*review*.md` files from `docs/ui-plans/`.
4. `docs/UI-UX_Plan/UI-UX-PLAN.md` **§5.7 (`:928–930`)**: Mark `/certificates/:id`, `/certificates/new`, `/certificates/edit/:id` themed & QA'd (`☑ | ☑`); update `58 inline styles; chart` → `88 inline styles purged (62 colour + 26 layout; 789 lines); chartTheme dual-series + local certLastPointLabelPlugin + data table`.
5. `docs/UI-UX_Plan/UI-UX-PLAN.md` **§6.1 (`:1067`)**: Mark Phase 8C complete (`☑ | ☑`).
6. `docs/UI-UX_Plan/UI-UX-PLAN.md` **§6.12 (`:1848–1858` & `:1889`)**:
   - Check the **7** completed items (`:1851–1853`, `:1855–1858`).
   - Do **not** check `:1850` (`CertificateDetail.css — light → graphite`, explicitly deferred to Phase 8D per Plan Decision 1) or the currency-log portion of `:1854`; annotate both clearly as deferred to Phase 8D (`Currency`) and record an explicit scope-amendment note in `UI-UX-PLAN.md` §10.
   - Update `(58)` → `(88)` (`90` total across 789/152/20/37 lines), and update Phase 8 exit gate counter (`:1889`) from `6 of 16` → `9 of 16 routes themed; 8D–8E remain open`.
7. `docs/UI-UX_Plan/UI-UX-PLAN.md` **§8.2 (`:2199`)**: Update `CertificateDetailPage.js` hotspot count from `61` → `88 (purged to 0 in 8C; originally audited 61)`.
8. `docs/UI-UX_Plan/UI-UX-PLAN.md` **§10**: Append Phase 8C progress log entry with full SHAs (`phase-ui-8c-certificates-detail` branch / plan+impl `8826a99`, walkthrough SHAs, merge SHA, starting `19d34c8` & Gate 13 baseline `39fb1b0`), `28` new (`43` total cert) Jest tests, `11/11` calc, `15` snapshots replaced in place (`334/334` manifest), allowlist `39 → 42`, `90` inline styles purged, `0` new `overflow-x`, explicit Phase 8D scope deferral note (`CertificateDetail.css` & currency-log cards), explicit Gate 15 authorization vs §15.5 note, and Gate 18 `41/41`.
9. `CHANGELOG.md`: Add Phase 8C entry explicitly announcing the **`AD13` allowlist expansion (`39 → 42`, adding `/certificates/:id`, `/certificates/new`, `/certificates/edit/:id`)** per §7.2 (`:2132`).
10. **Merge & Push (§14)**: Merge `phase-ui-8c-certificates-detail` into `main` (`--no-ff`) and push only `main` to `origin/main` (never push feature branch).
