# Phase 8B Walkthrough — Certificates of Deposit Log

- **Date**: 2026-11-26
- **Branch**: `phase-ui-8b-certificates-log` *(local only — awaiting user sign-off before merge & push per §14)*
- **Merge Base**: `main @ 237700a`
- **Branch Commits**: `6f31d1b` (docs plan v3), `23f65bf` (feat implementation)
- **Baseline Repo Commit**: `19d34c8` in `D:\Projects\FinStat-visual-baselines` (`Phase 8B: recapture 5 certificates log snapshots`)
- **Plan**: `docs/ui-plans/phase_8b_implementation_plan.md` (v3, approved 2026-11-26)
- **Taste Checkpoint**: N/A (Cluster 8 Taste Checkpoint #6 was delivered and approved in Phase 8A)

---

## Scope Delivered

1 route themed and verified (allowlist **38 → 39**, adding `'/certificates'` only; `/certificates/:id`, `/certificates/new`, `/certificates/edit/:id` remain legacy until Phase 8C):

- **`/certificates`** (`CertificateLogPage.js`):
  - Decoupled `import '../trades/Trades.css'` without editing `Trades.css`.
  - Authored `frontend/src/pages/certificates/Certificates.css` scoped under `html[data-fs-theme] .cert-page-container` / `.cert-log-page` per D22.
  - Added Section 19 (`Phase 8B: Certificates Log Semantic Themes`) to `frontend/src/styles/theme-components.css`.
  - Purged all **89** inline `style={{` attributes (**57** colour-bearing + **32** layout/typographic); zero inline styles remain.
  - Replaced the purple-violet `linear-gradient` banner + pixel shadow with Reference Frame 03 Variant B graphite `.cert-kpi-tile` cards (`Active Certificates`, `Active Principal Invested`, `Total Expected Yield`, `Status Breakdown`).
  - Converted all 5 domain statuses (`active`, `maturing_soon`, `future`, `matured`, `withdrawn`) to neutral `<Badge tone="neutral">` pills wrapping existing `react-icons/fa` SVG icons (`aria-hidden="true"`) + clean primary text labels (no emoji circles, no `12px` radius).
  - Enforced Single Primary CTA (`Add Certificate` in `.fs-btn-primary`; `Process Due Payouts` in `.fs-btn-secondary`), underlined `.cert-name-link`, neutral `.fs-num` tabular figures, and strengthened non-colour `isPayoutDue` discoverability (`aria-label`, `title`, `.cert-icon-btn--due`, and mobile drawer status text).
  - Converted `<FaTrash>` clickable icon to `<button type="button" className="cert-icon-btn cert-icon-btn-danger">`, preserved shared `<ConfirmModal>` for delete, and rebuilt Withdraw & Payout modals as tokenized accessible dark dialogs (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap, Escape close, focus restoration, labelled inputs, preserved service payloads).
  - Added D19 compact-expand mobile cards at $\le 768\text{px}$ (zero page overflow at 390px) and Waiver **W-8B-1** `.cert-log-page .cert-table-wrap { overflow-x: auto; }` for desktop/tablet viewports.
  - Added error-state handling (`role="alert"` + `Retry` calling `refreshCertificates()`) rendered in the content slot while keeping `.cert-page-header` visible.
  - Removed `src/pages/certificates/CertificateLogPage.js` from `frontend/.eslintignore`.
  - Added `CertificateLogPage.test.js` (15 tests), `certificatesMocks.js`, `certificates-reference-match.spec.js` (7 spec tests), and wired `route.slug === 'certificates'` in `visual.spec.js` and `a11y.spec.js`.

---

## §0 Decisions & Verified Audits Carried Into Sign-Off

1. **Inline-style census (`66` → `89`)**: Verified **89** `style={{` attributes in `CertificateLogPage.js` (**57** colour-bearing including `borderTop: '1px solid #cbd5e1'` + **32** layout/typographic). All 89 purged; Test 14 in Jest verifies `0` `[style]` attributes in rendered DOM and modals.
2. **Neutral 5-status & numeric presentation (§4.3.1)**: §4.3.1 records no certificate warning/overdue threshold; all 5 statuses (`active`, `maturing_soon`, `future`, `matured`, `withdrawn`) and all KPI/table/modal amounts stay neutral, using existing `react-icons/fa` (`aria-hidden="true"`) + text labels inside `<Badge>`.
3. **Non-colour `isPayoutDue` discoverability**: `aria-label="Interest payout due — process payout for <name>"`, `title="Interest Payout Due! Click to process"`, `data-payout-due="true"`, and mobile drawer `Interest payout due` text label verified in Gates 7 and 11.
4. **Error-state precedence**: `isLoading` first → `<Loading variant="table" />`; `!isLoading && error` keeps header visible and renders `.cert-error-card` (`role="alert"` + `Retry`) in place of KPIs/filters/table (Gate 7 Test 2).
5. **Single Primary CTA & underlined links (§4.4)**: Verified via Gate 11 Tests 2 and 3.
6. **Waiver W-8B-1 & D19**: `.cert-log-page .cert-table-wrap { overflow-x: auto; }` is the sole added `overflow-x` declaration (`Certificates.css:266`) and applies above 768px only; at ≤768px, D19 cards replace the table with `0px` page-level horizontal overflow.
7. **Shared CSS decoupling**: `Trades.css` diff against `237700a` is empty; 5 remaining import sites (`TradeLogPage.js`, `TradeForm.js`, `TradeSummaryPage.js`, `CurrencyLogPage.js`, `CreditCardPage.js`) and all 3 legacy 8C routes passed Gate 18 with zero 8B diffs.

---

## Gate Verification Evidence (Gates 1–18)

| Gate | Status | Verified Result |
|---|---:|---|
| **1. Route Allowlist** | PASS | `node frontend/scripts/ui-coverage.js --assert-allowlist` → **39** patterns verified against 75 routes in `App.js`. |
| **2. Token Drift Guard** | PASS | `node frontend/scripts/tokens.js --check --tables` → `0` drift. |
| **3. Test ID & ARIA Guard** | PASS | `node frontend/scripts/testid-guard.js` → `0` deletions vs `237700a`. |
| **4. Semantic Tone Guard** | PASS | `node frontend/scripts/lint-tones.js` → `0` violations across 60 page CSS files; `0` undefined tokens across 63 CSS files. |
| **5. Stylelint, Ratchet & Overflow Audit** | PASS | `lint-ratchet.js`: `0` regressions across 62 CSS files; `stylelint`: `0` errors on `Certificates.css` + `theme-components.css`; `#14b8a6` only in `tokens.css:36`; loading grep shows only pre-existing `SecuritySettingsPage.js:216`; scoped `overflow-x` audit + `git diff 237700a -- frontend/src` show **only** `+  overflow-x: auto;` at `Certificates.css:266` (W-8B-1). Pre-existing §7.1:2104 global-grep drift (`32` pre-existing matches on `main`) is unrelated and noted below. |
| **6. ESLint & De-Ignore** | PASS | `npx eslint ... --max-warnings=0` → `0` errors, `0` warnings across all 8 modified/created JS files; `CertificateLogPage.js` removed from `.eslintignore`; `Trades.css` diff empty. |
| **7. CRA Jest & jest-axe** | PASS | `CertificateLogPage.test.js`: **15/15** passed; `0` critical/serious jest-axe violations. |
| **8. Route Guard & Dashboard Coordinator** | PASS | `App.test.js` + `DashboardSummary.test.js`: **15/15** passed (**30/30** combined with Gate 7); `DashboardSummary.js` = `96` lines (`<= 120`). |
| **9. Calculations Parity (I3)** | PASS | `npx jest --runInBand tests/calculations.spec.js --forceExit` → **11/11** passed across all 8 domains (Domain 5 Certificates unchanged). |
| **10. Real-Browser Axe** | PASS | `a11y.spec.js --project=a11y -g "a11y check: certificates$"` → **2 passed** (`setup` + `certificates`), `0` critical/serious `wcag2a`/`wcag2aa` violations. |
| **11. Reference Match Spec** | PASS | `certificates-reference-match.spec.js --project=reference` → **8 passed** (`setup` + 7 spec tests: graphite tiles, single primary CTA, `.fs-num`, 5 neutral badges w/ `aria-hidden` icons, underlined links, `isPayoutDue` label, `<= 8px` filter radii, W-8B-1 container scroll, Withdraw/Payout modal Escape/focus restore, D19 cards at 768/480/390px with zero overflow). |
| **12. Production Build** | PASS | `CI=true GENERATE_SOURCEMAP=false NODE_OPTIONS=--max-old-space-size=2048 npm run build` → `Compiled successfully.` (`exit 0`, zero new warnings/errors). *(Used `2048` cap matching Phase 8A hardware note after earlier `4096`/`768` low-commit host crashes before memory cleanup.)* |
| **13. Visual Baselines & Manifest** | PASS | `--grep="certificates @" --update-snapshots`: **6 passed** (`setup` + 5 `/certificates` PNGs replaced in place at 1440/1024/768/480/390); `verify-baseline-manifest.js` = **334/334** valid (`0` net new entries); baseline repo commit `19d34c8`. |
| **14. PR-Subset Visual Regression** | PASS | `PR_SUBSET=true npx playwright test --project=pr-subset tests/visual/visual.spec.js` → **68 passed + 3 accepted W-6A-1/AD16 diffs** (`salary-profile-update @1440`, `analysis-payroll @1440`, `salary-rules @1440`), `0` diffs attributable to 8B. |
| **15. Full 326-Test Visual Suite** | PASS | `npx playwright test --project=visual tests/visual/visual.spec.js` → **326 accounted = 292 passed + 34 accepted AD14/AD16 diffs** (`15.7m`, single unbroken run); all 5 recaptured `/certificates` snapshots pass; `0` unexplained diffs. |
| **16. Touch Targets & Focus Rings** | PASS | `certificates-reference-match.spec.js -g "interactive touch targets"` → **2 passed** (`setup` + filtered test: `>= 44x44px` primary/mobile, `>= 32x32px` desktop inline, visible `:focus-visible` ring on Tab). |
| **17. Developer Visual Inspection** | PASS | Inspected all 5 PNGs (`1440`, `1024`, `768`, `480`, `390`). Tightened `.cert-table th/td` padding (`14px → 10px`) and `.cert-actions` gap (`6px → 4px`) after first inspection caught a ~6px `ACTIONS` right-edge clip at `1440px`; re-captured `19d34c8` fits all 9 columns + 5 action buttons unclipped at `1440px`, triggers container scroll cleanly at `1024px`, and renders D19 cards at `768/480/390px`. |
| **18. Unthemed-Consumer & Shared-CSS Decoupling** | PASS | `--grep="certificates\|trades\|trade-summary\|currency\|credit-cards"` → **81 passed** (`1 setup + 16 routes × 5 viewports`: 4 certificate routes + all 12 routes spanning the 5 remaining `Trades.css` import sites), `0` diffs attributable to 8B. |

---

## Gate 15 Accepted Diff Register (34)

Identical to Phases 7A, 7C, and 8A; zero diffs attributable to Phase 8B:

- **AD14 (10 diffs)**: `not-found` @ 768/480/390 (`3`), `dashboard` @ 768/480 (`2`), `expenditures` @ 768/480 (`2`), `expenditure-analysis` @ 1024/768/480 (`3`).
- **AD16 / W-6A-1 (24 diffs)**: `salary-profiles` @ 768/480/390 (`3`), `salary-profile-update` @ 1440/1024/768/480/390 (`5`), `salary-paychecks-new` @ 768/480/390 (`3`), `salary-paychecks-edit` @ 768/480/390 (`3`), `analysis-payroll` @ 1440/1024/768/480/390 (`5`), `salary-rules` @ 1440/1024/768/480/390 (`5`).

---

## Gate 19 / Merge Boundary (Awaiting Sign-Off)

- [x] Gates 1–18 all verified PASS after final edits
- [x] `.auth.json` restored; temporary `test-results` / `playwright-report` cleaned; `Trades.css`, services, context, `App.js`, `calculations.spec.js`, and 8C files untouched
- [ ] User sign-off on this Phase 8B walkthrough
- [ ] Post-sign-off governance sync (`UI-UX-PLAN.md` §5.7, §6.1, §6.12, §7.1 W-8B-1, §10 progress log, Phase 8 exit gate `6 of 16`, `CHANGELOG.md`)
- [ ] Merge `phase-ui-8b-certificates-log` into `main` and push only `main` (§14)
