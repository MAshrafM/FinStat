# Phase 8B Walkthrough — Certificates of Deposit Log

> **Sub-phase**: UI Phase 8B — Certificates: log  
> **Target Route**: `/certificates` (`CertificateLogPage.js`)  
> **Date**: 2026-11-26 (implemented & verified Gates 1–18); 2026-11-27 (walkthrough revised per review)  
> **Branch**: `phase-ui-8b-certificates-log` *(local only — awaiting Gate 19 user sign-off before merge & push per §14)*  
> **Merge Base**: `main @ 237700a`  
> **Starting Baseline Commit**: `3f174fb` in `D:\Projects\FinStat-visual-baselines` (`334/334` manifest verified)  
> **Gate 13 Baseline Commit SHA**: `19d34c8` in `D:\Projects\FinStat-visual-baselines` (`Phase 8B: recapture 5 certificates log snapshots`; `334/334` manifest verified)  
> **Plan Commit SHA**: `6f31d1b` (`docs(ui-phase-8b): add implementation plan`)  
> **Implementation HEAD SHA**: `23f65bf` (`feat(ui-phase-8b): theme certificates log`)  
> **Walkthrough Commit SHAs**: `92c0747` (initial Gate 19 walkthrough); follow-up review-fix commit recorded on `phase-ui-8b-certificates-log` alongside reconciled plan status  
> **Merge SHA**: `[Pending Gate 19 user sign-off & merge to main]`  
> **Plan & Approval Evidence**: `docs/ui-plans/phase_8b_implementation_plan.md` (v3, explicitly approved by user `"approved. proceed"` on 2026-11-26 after `docs/ui-plans/phase_8b_implementation_plan_review.md`; plan `- **Status**:` line reconciled)  
> **Taste Checkpoint**: N/A (Cluster 8 Taste Checkpoint #6 was delivered and signed off in Phase 8A)  
> **Status**: Ready for Gate 19 Review / Awaiting User Sign-Off

---

## 1. Executive Summary & Progress Log Entry (§10)

```text
Sub-phase:   UI Phase 8B — Certificates: log
Status:      READY FOR GATE 19 SIGN-OFF — Gates 1–18 verified; post-sign-off governance sync & merge pending
Done:        Migrated /certificates (CertificateLogPage.js) into the FinStat dark graphite design system.
             Decoupled Trades.css without editing Trades.css; authored scoped Certificates.css
             (html[data-fs-theme] .cert-page-container / .cert-log-page per D22) and theme-components.css
             Section 19. Purged all 89 inline styles (57 colour-bearing + 32 layout/typographic). Replaced
             purple linear-gradient overview card with Reference Frame 03 Variant B graphite KPI tiles.
             Converted all 5 domain statuses (active, maturing_soon, future, matured, withdrawn) to neutral
             <Badge tone="neutral"> chips pairing existing react-icons/fa icons (aria-hidden) with clean
             text labels per §4.3.1. Enforced Single Primary CTA (Add Certificate), underlined .cert-name-link,
             neutral .fs-num tabular figures, and strengthened non-colour isPayoutDue discoverability.
             Converted delete <FaTrash> icon to button, preserved shared ConfirmModal, rebuilt Withdraw and
             Payout modals as accessible tokenized dark dialogs (focus trap, Escape, focus restore, preserved
             payloads), added D19 mobile cards at <=768px with zero 390px overflow, recorded Waiver W-8B-1
             (.cert-log-page .cert-table-wrap desktop/tablet only), added error state with Retry, removed
             CertificateLogPage.js from .eslintignore, expanded THEMED_PATTERNS 38 -> 39, added 15 Jest +
             jest-axe tests, deterministic certificatesMocks.js, and 7-test Playwright reference-match spec.
Next:        Post-sign-off governance sync (UI-UX-PLAN.md + CHANGELOG.md), merge to main, push main only, then Phase 8C
Blocked by:  Gate 19 user sign-off
Allowlist:   THEMED_PATTERNS expanded 38 -> 39 (+1: /certificates only; /certificates/:id, /new, /edit/:id stay legacy)
Visual diff: Gate 13 replaced 5 /certificates PNGs (19d34c8); Gate 14 68/71 (3 AD16/W-6A-1 only); Gate 15 326
             accounted (292 passed + 34 accepted AD14/AD16, matching 7A/8A; local §15.5 deviation); Gate 18 81/81
Fixtures:    calculations.spec.js 11/11 passed (byte-identical across 8 domains including Domain 5 Certificates)
Screenshots: 5 recaptures across 1440, 1024, 768, 480, 390px (19d34c8); 334/334 manifest verified
Branch:      phase-ui-8b-certificates-log (local commits: 6f31d1b, 23f65bf, 92c0747, + review-fix doc commit)
Merge SHA:   [Pending user sign-off & merge to main]
```

### §0 Plan Decisions Carried Into Sign-Off

1. **Verified inline-style census (`66` → `89`, `57` colour + `32` layout)**: Re-census confirmed **89** `style={{` attributes in legacy `CertificateLogPage.js` (**57** colour-bearing including `borderTop: '1px solid #cbd5e1'` + **32** purely layout/typographic). All 89 are removed; Jest Test 14 asserts zero `[style]` attributes in the rendered log DOM and opened Withdraw modal, while static source inspection confirms zero `style={{` anywhere in `CertificateLogPage.js` (including the Payout modal). Governance sync updates stale `66` counts across `UI-UX-PLAN.md` §5.7, §6.12, and §8.2.
2. **Neutral 5-status & numeric presentation (§4.3.1)**: `CertificateLogPage.js` has five domain statuses (`active`, `maturing_soon`, `future`, `matured`, `withdrawn`). Because §4.3.1 records no certificate warning/overdue threshold, all 5 render via `<Badge tone="neutral">` with existing `react-icons/fa` icons (`aria-hidden="true"`) + text labels, removing emoji circles and `12px` radius. All KPI tiles, `Principal Amount`, `Interest Rate`, `Days Left`, `Accrued Interest`, and modal amounts remain neutral.
3. **Non-colour `isPayoutDue` discoverability**: Preserved via explicit `aria-label="Interest payout due — process payout for <name>"`, `title="Interest Payout Due! Click to process"`, neutral `.cert-icon-btn--due` styling, `data-payout-due="true"`, and mobile drawer `Interest payout due` text label (Gates 7 and 11).
4. **Error-state precedence**: `isLoading` first renders `<Loading variant="table" />`; `!isLoading && error` keeps `.cert-page-header` visible and renders `.cert-error-card` (`role="alert"` + `Retry` calling `refreshCertificates()`) in place of KPIs/filters/table (Gate 7 Test 2).
5. **Single Primary CTA & underlined inline links (§4.4)**: `Add Certificate` is the sole `.fs-btn-primary`; `Process Due Payouts` uses `.fs-btn-secondary`; `.cert-name-link` is underlined (`text-decoration: underline`).
6. **Waiver W-8B-1 & D19**: `.cert-log-page .cert-table-wrap { overflow-x: auto; }` (`Certificates.css:266`) is desktop/tablet-only under Waiver W-8B-1; at $\le 768\text{px}$, D19 compact-expand cards replace the table with zero page overflow at 390px. Formal §7.1 waiver synchronization is queued in Gate 19 governance sync.
7. **Shared CSS decoupling (`Trades.css` untouched)**: Removed `import '../trades/Trades.css'`. `git diff 237700a -- frontend/src/pages/trades/Trades.css` is empty. All 5 remaining `Trades.css` import sites (`TradeLogPage.js`, `TradeForm.js`, `TradeSummaryPage.js`, `CurrencyLogPage.js`, `CreditCardPage.js`) and all 3 legacy 8C certificate routes passed Gate 18 cleanly.
8. **Typography & radii (D16/AD10, I16)**: `.fs-num` uses IBM Plex Sans + `tabular-nums`; filter buttons use `--fs-radius-md` ($\le 8\text{px}$); `--fs-radius-pill` stays restricted to `<Badge>` chips.
9. **Modal architecture**: Shared `<ConfirmModal>` preserved for Delete (`<h3>` precedent); Withdraw & Payout converted to tokenized dark dialogs (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap, Escape close, focus restore, labelled controls, byte-identical payloads).
10. **No sortable columns (§6.12 line 1845 & §7.2 line 2119 clarification)**: Static inspection confirms `CertificateLogPage.js` has **no** column sorting logic or sortable headers in the existing codebase. Phase 8B verified the 6 existing status filters (`all`, `active`, `maturing_soon`, `future`, `matured`, `withdrawn`) and all row actions unchanged without introducing unrequested sort state. Post-sign-off governance sync updates `UI-UX-PLAN.md:1845` to reflect filters and row actions accurately.

---

## 2. Invariant Compliance Checklist (Action Plan §2 Verbatim)

| # | Rule (Verbatim from Action Plan §2) | Verification Method | Status | Evidence / Notes |
| :--- | :--- | :--- | :---: | :--- |
| **I1** | Production routes and URLs unchanged — 75 entries (74 protected + `*`), 10 redirects. | `App.test.js` route-resolution test; `ui-coverage.js` diff | PASS | Gate 1: `ui-coverage.js --assert-allowlist` verified 39 active patterns against 75 routes in `App.js` (`App.js` untouched). Gate 8: `App.test.js` 9/9 passed. |
| **I2** | No API call, payload shape, or service file changed. | PR diff review; blocked path list in CI | PASS | `certificateService.js` and `CertContext.js` untouched vs `237700a`. Jest Tests 9–12 verify exact due-payout, payout, withdraw, and delete payloads. |
| **I3** | No calculation changed on **any** page: payroll, installment schedules, debt payoff, trade P&L, certificate maturity/interest, FX conversion, budget thresholds, real-estate yield. | Characterization fixtures (§9.6) | PASS | Gate 9: `tests/calculations.spec.js` 11/11 passed across all 8 domains (Domain 5 Certificates CD yield & accrual unchanged). |
| **I4** | Auth, roles, `ProtectedAction`, and `useCanModify` gating unchanged. | Viewer-role checklist per phase | PASS | All 6 mutating controls (`Process Due Payouts`, `Add Certificate`, `Edit`, `Payout`, `Withdraw`, `Delete`) remain wrapped in `ProtectedAction` with `useCanModify()` checks (verified by Jest Test 8). |
| **I5** | Test IDs, `data-*` attributes, and accessible labels preserved — 37 `data-testid`, 39 `aria-label`. | test-ID guard script (§9.2) | PASS | Gate 3: `testid-guard.js` 0 deletions vs `237700a`; `data-label`s preserved; explicit `aria-label`s added to icon-only row actions and modal close buttons. |
| **I6** | Tables render as compact-expand cards at ≤ 768px (D19). Horizontal scroll preserved only for tables with ≥ 12 columns (audit logs) where the card pattern is impractical. No page-level horizontal scroll at 390px. | 390 px visual check: card layout renders, no page-level horizontal scroll, all fields reachable via expander. | PASS *(with W-8B-1)* | Desktop/tablet 9-col table uses `.cert-log-page .cert-table-wrap { overflow-x: auto }` (`Certificates.css:266`) under Waiver W-8B-1; ≤768px renders D19 cards (`certificates-mobile-cards`) with zero overflow at 768/480/390px (Gate 11 Test 6). §7.1:2104 waiver text update queued in post-sign-off sync (§6). |
| **I7** | No page loses functionality mid-migration. | Pattern added only in the converting PR (§6.3) | PASS | Only `'/certificates'` added (`38 -> 39`); 8C routes stay legacy; all filters, due payouts, payout/withdraw/delete flows, and navigation links remain functional (Gate 7). |
| **I8** | Dashboard coordinator line cap preserved — `DashboardSummary.js` must remain $\le 120$ lines (post-audit architecture decomposition invariant). All 10 RTL dashboard tests must remain green. | Line count assertion + `npm test` in 3A | PASS | Gate 8: `DashboardSummary.js` = 96 lines ($\le 120$); `DashboardSummary.test.js` 6/6 passed (historic "10 RTL" wording preserved per 7C/8A precedent). |
| **I9** | Production build passes with zero errors and no new warnings. | CI (authoritative); local proxy via `npm start` + ESLint/stylelint (§15) | PASS *(local proxy; CI pending)* | Local build: `CI=true GENERATE_SOURCEMAP=false NODE_OPTIONS=--max-old-space-size=2048 npm run build` compiled with 0 errors and 0 new warnings; Gate 6 ESLint (`--max-warnings=0`) and Gate 5 Stylelint clean. Authoritative CI build runs upon merge to `main`. |
| **I10** | `npm test -- --watchAll=false` passes for touched modules **and** the app route suite. | CI (frontend test job added in 1C); local proxy: touched suites via `npx jest --runInBand` (§15) | PASS *(local suites)* | Gates 7 & 8: `CertificateLogPage.test.js` 15/15 + `App.test.js` 9/9 + `DashboardSummary.test.js` 6/6 = 30/30 passed in-band. Full CI test job runs on merge. |
| **I11** | No new `!important`; a file's count in the 1C lint ratchet may only fall. | stylelint + `lint-ratchet.js` (§9.2) | PASS | Gate 5: `lint-ratchet.js` 0 regressions across 62 CSS files; 0 `!important` in `Certificates.css` and Section 19. |
| **I12** | No new dependency except the Phase 1C tooling list (§9.2). | `package.json` review | PASS | `frontend/package.json` and lockfile untouched vs `237700a`. |
| **I13** | Every non-allowlisted route is pixel-identical to its 1B baseline. | Walkthrough-evidenced per §7.1: developer-run Playwright diff report attached to each phase walkthrough, with zero unexplained diffs. | PASS | Gate 14 (68/71 W-6A-1/AD16 only), Gate 15 (292 + 34 accepted AD14/AD16 = 326, 0 unexplained), Gate 18 (81/81 across certs + remaining `Trades.css` consumers). |
| **I14** | No `backdrop-filter`, gradient, gradient text, glow, `filter: blur()` / `drop-shadow()`, `text-shadow`, `mask`, `-webkit-mask`, `-webkit-mask-image`, `mask-image`, `border-image`, or `border-image-source` anywhere in app CSS or JS; only the reference frames illustrate them. | stylelint (§9.2) | PASS | Removed purple `linear-gradient(...)` banner and pixel `boxShadow`; Gate 5 stylelint + ESLint confirm zero banned effects in `Certificates.css`, Section 19, and `CertificateLogPage.js`. |
| **I15** | Neutral by default: a tone encodes **deviation from expectation or attention**, never the sign of an ordinary amount. Expense amounts, income, and balances are neutral (§4.3). A page never references a tone token directly; it uses `Delta`, `Badge`, or a `.fs-progress--*` modifier. | stylelint + `lint-tones.js` + §4.3 domain table + §7.2 | PASS | Gate 4: `lint-tones.js` 0 tone/token violations across 60 page CSS / 63 total CSS files; all 5 statuses & ordinary amounts neutral; `--fs-danger` used only in Section 19 for destructive/error surfaces. |
| **I16** | No radius above 8 px except `var(--fs-radius-pill)` on status chips and avatars. | stylelint (§9.2) | PASS | Gate 5 stylelint + Gate 11 Test 4 verify radii $\le 8\text{px}$ (`--fs-radius-sm/md/lg`), `--fs-radius-pill` restricted to `<Badge>`. |

---

## 3. Visual Regression Diff Report (§7.1)

Per §7.1 (`UI-UX-PLAN.md:2099`), Gate 13, Gate 14, Gate 15, and Gate 18 were executed against `D:\Projects\FinStat-visual-baselines` (served locally from the Gate 12 `CI=true` static production build).

> [!NOTE]
> **§15.5 Local-Execution Deviation Note**: `UI-UX-PLAN.md` §15.5 (`:3116`) restricts local runs to PR-subset / targeted visual batches, while `docs/ui-plans/phase_8b_implementation_plan.md` Gate 15 mandates running the full 326-test `--project=visual` suite for reconciliation before sign-off. Phase 8B executed the full 326-test suite locally in a single unbroken run against the static `npx serve -s build -l 3000` bundle to satisfy Gate 15 while keeping committed harness config unchanged.

### Diff Summary (Gate 15 Full Visual Suite & Gate 14 PR-Subset)

- **(a) Total routes / captures compared**:
  - **Gate 15 (Full Suite)**: **65 routes × 5 mandatory widths (1440, 1024, 768, 480, 390px) = 325 route captures + 1 auth setup = 326 Playwright tests** (matching `ROUTES.length = 65`).
  - **Gate 14 (`pr-subset`)**: **70 route captures** (65 routes @ 1440px + 5 smoke routes @ 390px) + **1 auth setup = 71 Playwright tests**.
- **(b) Routes / captures with zero diff**:
  - **Gate 15**: **291 zero-diff route captures** (+ `1 setup` = **292 passed**), including **all 5 newly themed `/certificates` baseline recaptures (`19d34c8`)**, all 15 still-unthemed 8C certificate captures (`certificates-detail`, `certificates-new`, `certificates-edit`), and 100% of remaining `Trades.css` consumer captures.
  - **Gate 14**: **67 zero-diff route captures** (+ `1 setup` = **68 passed**).
- **(c) Routes / captures with accepted diffs**:
  - **34 accepted pre-existing baseline diffs in Gate 15** — identical to the **Phase 7A and Phase 8A 292 + 34 reconciliation** *(Phase 7C recorded 326/326 after reconciliation)*; **0 diffs attributable to Phase 8B**:
    - **AD14 (10 diffs)**: `not-found` @ 768/480/390px (`3`), `dashboard` @ 768/480px (`2`), `expenditures` @ 768/480px (`2`), `expenditure-analysis` @ 1024/768/480px (`3`) — pre-existing headless scrollbar / `720b7bf7` baseline debt.
    - **AD16 / W-6A-1 (24 diffs)**: `salary-profiles` @ 768/480/390px (`3`), `salary-profile-update` @ 1440/1024/768/480/390px (`5`), `salary-paychecks-new` @ 768/480/390px (`3`), `salary-paychecks-edit` @ 768/480/390px (`3`), `analysis-payroll` @ 1440/1024/768/480/390px (`5`), `salary-rules` @ 1440/1024/768/480/390px (`5`) — pre-existing W-6A-1 salary baseline debt. *(Gate 14's only 3 failures were `salary-profile-update @ 1440px`, `analysis-payroll @ 1440px`, and `salary-rules @ 1440px`.)*
  - **Intentional Phase 8B recaptures (Gate 13, 0 diff against `19d34c8`)**: `/certificates` @ 1440, 1024, 768, 480, 390px (`5` snapshots replaced in place; AD13 allowlist expansion).
- **(d) Routes with unexplained diffs**: **0** (`0` unexplained diffs; `0` diffs attributable to Phase 8B).

### Manifest Integrity (`verify-baseline-manifest.js`)

- **Starting baseline commit**: `3f174fb` (`D:\Projects\FinStat-visual-baselines`, `334/334`)
- **Gate 13 baseline commit**: `19d34c8` (`D:\Projects\FinStat-visual-baselines`, `"Phase 8B: recapture 5 certificates log snapshots"`, `0` net new entries)
- **Captured command & output**:
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
| **1. Route Allowlist** | PASS | `node frontend/scripts/ui-coverage.js --assert-allowlist` → **39 pattern(s) verified** against 75 defined routes in `App.js`. |
| **2. Token Drift Guard** | PASS | `node frontend/scripts/tokens.js --check --tables` → `All §4.9 contrast tables (including §4.9.3) match tokens.json exactly! (0 drift)`. |
| **3. Test ID & ARIA Guard** | PASS | `node frontend/scripts/testid-guard.js` → `0` deletions vs `237700a`. |
| **4. Semantic Tone Guard** | PASS | `node frontend/scripts/lint-tones.js` → `0` violations across 60 page CSS files; `0` undefined tokens across 63 CSS files. |
| **5. Stylelint, Ratchet & Overflow Audit** | PASS | `lint-ratchet.js`: `0` regressions across 62 CSS files; `stylelint`: `0` errors on `Certificates.css` + `theme-components.css`; `#14b8a6` only in `tokens.css:36`; loading grep shows only pre-existing `SecuritySettingsPage.js:216`; scoped `overflow-x` audit + `git diff 237700a -- frontend/src` show **only** `+  overflow-x: auto;` at `Certificates.css:266` (W-8B-1). Pre-existing §7.1:2104 global-grep drift (`32` matches on `main`) is non-8B debt. |
| **6. ESLint & De-Ignore** | PASS | `npx eslint ... --max-warnings=0` → `0` errors, `0` warnings across all 8 modified/created JS files; `CertificateLogPage.js` removed from `.eslintignore`; `Trades.css` diff empty. |
| **7. CRA Jest & jest-axe** | PASS | `CertificateLogPage.test.js`: **15/15** passed; `0` critical/serious jest-axe violations. |
| **8. Route Guard & Dashboard Coordinator** | PASS | `App.test.js` + `DashboardSummary.test.js`: **15/15** passed (**30/30** combined with Gate 7); `DashboardSummary.js` = `96` lines (`<= 120`). |
| **9. Calculations Parity (I3)** | PASS | `npx jest --runInBand tests/calculations.spec.js --forceExit` → **11/11** passed across all 8 domains (Domain 5 Certificates unchanged). |
| **10. Real-Browser Axe** | PASS | `a11y.spec.js --project=a11y -g "a11y check: certificates$"` → **2 passed** (`setup` + `a11y check: certificates`), `0` critical/serious `wcag2a`/`wcag2aa` violations. |
| **11. Reference Match Spec** | PASS | `certificates-reference-match.spec.js --project=reference` → **8 passed** (`setup` + **7 spec tests**), covering assertions across Frame 01/03 dark surfaces, single primary CTA, `.fs-num`, 5 neutral icon+text `<Badge>`s, underlined name links, `isPayoutDue` label, `<= 8px` filter radii, W-8B-1 container scroll, Withdraw/Payout modal Escape/focus restore, and D19 mobile cards with zero overflow at 768/480/390px. |
| **12. Production Build** | PASS *(local proxy; CI pending)* | `CI=true GENERATE_SOURCEMAP=false NODE_OPTIONS=--max-old-space-size=2048 npm run build` → `Compiled successfully.` (`exit 0`, 0 errors, 0 new warnings). Authoritative CI workflow runs on merge to `main`. *(Used `2048` cap matching Phase 8A hardware note after pre-cleanup low-commit crashes under `4096`/`768`.)* |
| **13. Visual Baselines & Manifest** | PASS | `--grep="certificates @" --update-snapshots`: **6 passed** (`setup` + 5 `/certificates` PNGs replaced in place); `verify-baseline-manifest.js` = **334/334** valid (`0` net new entries); baseline repo SHA `19d34c8`. |
| **14. PR-Subset Visual Regression** | PASS | `PR_SUBSET=true npx playwright test --project=pr-subset tests/visual/visual.spec.js` → **68 passed + 3 accepted W-6A-1/AD16 diffs** (`salary-profile-update @1440`, `analysis-payroll @1440`, `salary-rules @1440`), `0` diffs attributable to 8B. |
| **15. Full 326-Test Visual Suite** | PASS *(§15.5 local deviation)* | `npx playwright test --project=visual tests/visual/visual.spec.js` → **326 accounted = 292 passed + 34 accepted AD14/AD16 diffs** (`15.7m`, matching 7A/8A reconciliation; 0 unexplained, 0 8B-attributable). See §15.5 note in Section 3. |
| **16. Touch Targets & Focus Rings** | PASS | `certificates-reference-match.spec.js -g "interactive touch targets"` → **2 passed** (`setup` + filtered test: `>= 44x44px` primary/mobile, `>= 32x32px` desktop inline, visible `:focus-visible` ring on Tab). |
| **17. Developer Visual Inspection** | PASS | Conformance table & 5 snapshot inspections recorded in Section 5 (`19d34c8`). |
| **18. Unthemed-Consumer & Shared-CSS Decoupling** | PASS | `--grep="certificates\|trades\|trade-summary\|currency\|credit-cards"` → **81 passed** (`1 setup + 16 routes × 5 viewports`: 4 certificate routes + 12 routes covering all 5 remaining `Trades.css` import sites), `0` diffs attributable to 8B. |

---

## 5. Gate 17 Reference-Frame Conformance & Inspection Evidence

### Inspected Snapshot Files (`19d34c8`)
- `certificates-1440.png` (Desktop dense table + 4-tile KPI overview, Frame 01 Variant B & Frame 03 Variant B)
- `certificates-1024.png` (Tablet dense table with `.cert-table-wrap` container scroll under W-8B-1)
- `certificates-768.png` (D19 compact-expand cards replacing table)
- `certificates-480.png` (D19 compact-expand cards)
- `certificates-390.png` (Mobile D19 cards with `0px` page horizontal overflow)

### Computed-Style Reference Conformance (`/certificates`, verified via Gate 11 & Gate 16)

| Property | 1440px (Desktop) | 390px (Mobile) | Reference Frame B Target |
|---|---|---|---|
| `.cert-log-page` canvas background | `rgb(16, 17, 20)` | `rgb(16, 17, 20)` | Graphite canvas `#101114` |
| 4× `.cert-kpi-tile` surface / image / shadow | `rgb(26, 28, 32)` / `none` / `none` | `rgb(26, 28, 32)` / `none` / `none` | Frame 03 Variant B flat graphite KPI tiles (gradient removed) |
| Primary CTA (`Add Certificate`, count = 1) | `rgb(20, 184, 166)` bg, `rgb(13, 14, 16)` ink, radius `<= 8px`, `>= 44x44px` | same | §4.4 Single Primary CTA with `--fs-ink` on `--fs-accent` |
| Active filter button (`.cert-filter-btn.is-active`) | `rgb(20, 184, 166)` bg, `rgb(13, 14, 16)` ink, radius `<= 8px` | same | §4.3.2 Interactive accent + I16 radius ceiling |
| Status `<Badge>` chips (all 5 statuses) | `rgb(34, 37, 42)` (`--fs-surface-raised`), neutral class, `svg[aria-hidden="true"]` | same | Frame 01 neutral chips + §4.3.1 / §6.12 |
| Numeric cells (`td.fs-num`) | IBM Plex Sans + `tabular-nums`, right-aligned | same | D16/AD10 proportional tabular figures |
| `.cert-name-link` | `text-decoration-line` includes `underline` | same | §4.4 underlined inline link |
| Table / Card layout & overflow | 9-col table visible; all columns & actions unclipped at 1440px; `overflowX: auto` on `.cert-table-wrap` at 1024px (W-8B-1) | Desktop table hidden; D19 `.cert-mobile-cards` visible; document `scrollWidth <= clientWidth` (`false` overflow) | Frame 01 Variant B + D19 collapse + AD25 targets (`>= 32px` desktop inline, `>= 44px` mobile) |

### Visual Inspection Notes & §7.4 State-Screenshot Inheritance
- **1440px right-edge fix**: Initial Gate 17 inspection spotted a ~6px `ACTIONS` header clip at `1440px`. Tightening `.cert-table th/td` horizontal padding (`14px → 10px`) and `.cert-actions` gap (`6px → 4px`) resolved it cleanly; re-captured `19d34c8` shows all 9 columns and all 5 action buttons completely unclipped at `1440px`.
- **§7.4 state-screenshot inheritance**: Per established Phase 7C/8A precedent, baseline PNGs capture populated route states while loading (`<Loading variant="table" />`), empty filter state (`.cert-empty-card`), and fetch-error state (`.cert-error-card` with `role="alert"` + Retry keeping `.cert-page-header` visible) are verified directly by Gate 7 (`CertificateLogPage.test.js` Tests 1, 2, and 5).
- Visual screenshots of all 5 recaptured baselines (`19d34c8`) are embedded in the companion artifact walkthrough (`phase_8b_walkthrough.md`).

---

## 6. Gate 19 / Merge Boundary & Complete Post-Sign-Off Governance Checklist

### Pre-Sign-Off Status
- [x] Gates 1–18 completed & reconciled (`Trades.css`, services, context, `App.js`, `calculations.spec.js`, `package.json`, and 8C routes untouched)
- [x] Plan `- **Status**:` line reconciled with recorded `"approved. proceed"` approval (2026-11-26)
- [x] `.auth.json` restored; temporary `test-results` / `playwright-report` cleaned
- [ ] **User sign-off on this Phase 8B walkthrough**

### Post-Sign-Off Governance Synchronization Checklist (Executed After Approval, Before / Upon Merge to `main`)
1. `docs/ui-plans/phase_8b_walkthrough.md`: Record Gate 19 sign-off date and final merge SHA.
2. `docs/UI-UX_Plan/UI-UX-PLAN.md` **§5.7 (`:927`)**: Mark `/certificates` themed & QA'd (`☑ | ☑`); update `66 inline styles` → `89 inline styles purged (57 colour-bearing + 32 layout/typographic)`.
3. `docs/UI-UX_Plan/UI-UX-PLAN.md` **§6.1 (`:1066`)**: Mark Phase 8B board row complete.
4. `docs/UI-UX_Plan/UI-UX-PLAN.md` **§6.12 (`:1841–1846` & `:1889`)**:
   - Check all 6 items under `#### 8B — Certificates: log`.
   - Correct `CertificateLogPage.js (66)` → `(89)` (`:1841`).
   - Align `:1842` wording from `active/matured/redeemed` to the 5 actual domain statuses (`active`, `maturing_soon`, `future`, `matured`, `withdrawn`) via neutral `<Badge>` + `react-icons/fa` icon + text label per §4.3.1.
   - Align `:1845` wording to note no sortable columns exist in `CertificateLogPage.js` (filters and row actions verified).
   - Update Phase 8 exit gate counter (`:1889`): `5 of 16` → `6 of 16 routes themed; 8C–8E remain open`.
5. `docs/UI-UX_Plan/UI-UX-PLAN.md` **§7.1 (`:2104`)**: Add **Waiver W-8B-1** for `.cert-log-page .cert-table-wrap { overflow-x: auto; }` (desktop/tablet 9-column log table only; formally resolves I6 waiver text alignment).
6. `docs/UI-UX_Plan/UI-UX-PLAN.md` **§8.2 (`:2198`)**: Update hotspot table count for `CertificateLogPage.js` from `66` → `89` (purged to `0`).
7. `docs/UI-UX_Plan/UI-UX-PLAN.md` **§10**: Append Phase 8B progress log entry recording branch/plan/implementation/walkthrough/merge/baseline (`19d34c8`) SHAs, `15/15` unit tests (`30/30` with Gate 8), `11/11` calc parity, `5` PNG recaptures (`334/334` manifest), allowlist `38 → 39`, `89` inline styles purged (`57 colour + 32 layout`), Gate 14 `68/71`, Gate 15 `292 + 34 AD14/AD16 = 326`, and Gate 18 `81/81`.
8. `CHANGELOG.md`: Add Phase 8B entry.
9. **Merge & Push (§14)**: Merge `phase-ui-8b-certificates-log` into `main` (`--no-ff`), confirm authoritative CI workflow passes, and push only `main` to `origin/main` (never push feature branch).
