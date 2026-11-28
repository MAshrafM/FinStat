# UI Phase 9C Walkthrough — Peer-to-Peer Lending (Module 23)

- **Date**: 2026-11-28
- **Status**: Complete — Gate 19 Signed Off 2026-11-28
- **Branch**: `phase-ui-9c-lending` *(tag: `ui-phase-9c-start`; local branch policy per §14/§10)*
- **Merge Base**: `main` @ `1c75926`
- **Gate 0 Plan & Governance SHA**: `52c8f10`
- **Implementation SHA**: `268741d`
- **Walkthrough SHA**: `2268a16`
- **Starting Baseline Commit**: `01e61c5` (`334/334` manifest verified)
- **Gate 13 Baseline Commit**: `5db8c61` in `D:\Projects\FinStat-visual-baselines` (`334/334` manifest verified; 15 Phase 9C PNGs recaptured in place, `0` net new entries)

---

## §0 Approved Review Items & Gate 0 Amendments

1. **Review Item #1 (`WrittenOff` Status Badge Tone, `§4.3.1:371`)**: **Option A** — Rendered `WrittenOff` as `<Badge tone="negative">WrittenOff</Badge>` with the provenance row added to `§4.3.1` at Gate 0 (`52c8f10`); kept `Active`, `Repaid`, `Owes Money`, `Settled`, `Borrow`, `Repayment`, native `<progress>` meters, and AD13 ordinary amounts strictly neutral.
2. **Review Item #2 (Zero New `overflow-x` Waivers & Legacy Wrapper Retirement)**: **Confirmed** — Removed `overflow-x: auto !important` from `Lending.css:222` and `.lending-scroll-hint`, replaced `className="table-container lending-table-card"` with scoped `.lending-table-wrap` (`0` `overflow-x`), and documented unchanged `App.css:230–239` as a pre-existing exception in `§7.1:2105` (explicitly not applied to converted lending routes).
3. **Review Item #3 (Page-Level Destructive Buttons & Confirm Variants, `§4.4:409`)**: **Confirmed** — Neutralized page-level `Delete Person`, `Mark as Written Off`, `Delete Loan`, and row `Delete` triggers to `.fs-btn-secondary`; `<ConfirmModal>` uses `variant="danger"` for Write Off / Delete and `variant="primary"` for Re-activate Loan (replacing unsupported `variant="warning"` at `LoanDetailPage.js:354`).
4. **Review Item #4 (Local Gate 12/15 & Retained `$` Formatter, `I3`)**: **Confirmed** — Local `2048`MB build (`1536`MB fallback), full 326-test Gate 15 (`§15.5`), and retained `formatCurrency()` (`$`) unchanged.
5. **Additional Gate 0 Records (`52c8f10`)**: Recorded `§5.8.1:954` & `§6.13:1928` catalog notes (live equivalents `AddTransactionForm.js`, `PersonCard.js`, inline modals) and `§7.2:2120` sort-header/checked-state not-applicable decision (lending tables use `<select>` filters and have no sortable `<th>` or checkboxes).

---

## §1 Progress Log

```text
Sub-phase:   9C (Ready for Gate 19 Sign-Off — Closes Phase 9 Exit Gate 7/7)
Status:      in progress (All Gates 0–18 verified green on phase-ui-9c-lending; awaiting Gate 19 sign-off)
Done:        Converted /lending (`LendingDashboardPage.js`), /lending/persons/:id (`PersonDetailPage.js`), /lending/loans/:id (`LoanDetailPage.js`), `PersonCard.js`, `AddTransactionForm.js`, and `Lending.css` into the FinStat dark graphite design system under D22 `html[data-fs-theme]` (zero changes to `theme.css`, `theme-components.css`, `App.css`, or `ConfirmModal`). Purged all 63 inline styles (`20 + 18 + 20 + 3 + 2`), 46 hex literals, legacy `!important`, and `overflow-x: auto !important` (`Lending.css:222`) to 0. Replaced ad-hoc loading with `<Loading variant="card" />` inside preserved `data-testid="lending-loading"`, replaced inline progress bars with neutral native `<progress className="fs-progress lending-progress" />` (`RealEstate.css:441–466` contract), applied Option A `WrittenOff` negative `<Badge>` + neutral AD13 figures, neutralized page-level destructive triggers per §4.4:409, and implemented guarded `matchMedia('(max-width: 768px)')` D19 compact-expand mobile cards on all 3 tables (`0px` overflow across 1440/1024/768/480/390px) while preserving all 14/14 existing Jest tests byte-identically. De-ignored all 5 lending files in `.eslintignore` (`0` lending entries remain), expanded `THEMED_PATTERNS` `53 -> 56`, added `PersonDetailPage.test.js` & `LendingA11y.test.js` (`4/4` suites, `20/20` passed incl. `jest-axe`, `deleteLoan`, `WrittenOff` toggle, and new-loan creation), added `lendingMocks.js`, and added `lending-reference-match.spec.js` (`9/9` passed, capturing 25 local §7.4 PNGs in gitignored `docs/ui-snapshots/phase-9c/`).
Next:        Post-sign-off governance sync closing Phase 9 Exit Gate (7/7), `--no-ff` merge to `main`, push only `main`, verify CI, start Phase 10A
Blocked by:  Gate 19 User Sign-Off
Allowlist:   ['/lending', '/lending/persons/:id', '/lending/loans/:id'] (cumulative: 56 patterns)
Visual diff: Gate 13 recaptured 15 Phase 9C snapshots in place (5db8c61; 334/334 manifest verified); Gate 14 68/71 (3 W-6A-1/AD16 only); Gate 15 292/34 (326 accounted: 292 zero-diff + 34 AD14/AD16; 0 unexplained; 0 9A/9B/9C/10A+ diffs); Gate 18 46/46 (Cluster 9 7/7 routes + unthemed 10A boundary `/profile` & `/settings`).
Fixtures:    calculations.spec.js byte-identical, 11/11 green across 8 domains
Screenshots: None tracked per D5/D21; 15 baselines in FinStat-visual-baselines repo (5db8c61) + 25 local §7.4 PNGs in gitignored docs/ui-snapshots/phase-9c/
Branch:      phase-ui-9c-lending (tag: ui-phase-9c-start; Gate 0 SHA: 52c8f10; Impl SHA: 268741d)
Merge SHA:   Pending Gate 19 sign-off
```

---

## §2 Governing Invariant Compliance (§2 I1–I16)

| Invariant | Verification Summary | Gate |
|:---:|---|---|
| **I1** | `App.js` untouched; `THEMED_PATTERNS` expanded `53 -> 56` (`56 pattern(s)` verified). | Gate 1 & Gate 8 |
| **I2** | `lendingService.js`, `backend/routes/lendingLoans.js`, `backend/routes/lendingPersons.js`, and payloads byte-identical. | Gate 5 & Gate 7 |
| **I3** | `calculations.spec.js` `11/11` green; `formatCurrency()` (`$`) retained. | Gate 7 & Gate 9 |
| **I4** | Existing role/access patterns & `<ConfirmModal>` confirmations intact (`danger`/`primary`). | Gate 7 |
| **I5** | `0` deletions in `testid-guard.js`; all §0:2 accessible strings preserved. | Gate 3 & Gate 7 |
| **I6** | Guarded `matchMedia` D19 mobile cards on all 3 tables (`0px` overflow at 1440..390px); `Lending.css:222` `overflow-x: auto !important` removed; `App.css` untouched; zero new waivers. | Gate 5, Gate 11 & Gate 17 |
| **I7** | All 3 Lending routes + `PersonCard` + `AddTransactionForm` + `Lending.css` converted atomically (Phase 9 `7/7`). | Gate 7 & Gate 11 |
| **I8** | `DashboardSummary.js` `96` lines (`<= 120`); App/Dashboard `15/15`. | Gate 8 |
| **I9** | Standalone `2048`MB build `Compiled successfully.` (CI on `main` authoritative). | Gate 12 |
| **I10** | `4/4` Lending Jest + `jest-axe` suites (`20/20` tests incl. `14/14` untouched existing tests) + `App`/`Dashboard` (`15/15`) green. | Gates 7 & 8 |
| **I11** | `0` `!important` in `Lending.css`; `lint-ratchet.js` `0` regressions. | Gate 5 |
| **I12** | `frontend/package.json` & lockfile untouched. | Gate 5 |
| **I13** | All 4 Credit Cards routes, Trades, `/profile`, `/settings`, and all non-allowlisted Phase 10A+ routes pixel-identical. | Gates 15 & 18 |
| **I14** | `0` gradients, blurs, glows, or arbitrary pixel shadows. | Gate 5, Gate 6 & Gate 11 |
| **I15** | Neutral by default; AD13 ordinary amounts neutral; neutral `<progress>` fill; zero tone tokens in `Lending.css`/JSX; `theme.css`/`theme-components.css` untouched; `lint-tones.js` `0` violations. | Gate 4, Gate 7 & Gate 11 |
| **I16** | Radii `<= 8px`; `--fs-radius-pill` on `<Badge>` / `<progress>` only. | Gate 5 & Gate 11 |

---

## §3 Visual Diff Report

- **(a) Total route-width captures compared**: `326` (`1 setup + 65 routes × 5 widths`).
- **(b) Zero-diff captures**: `292` (including all `15` Lending captures, all `20` Credit Cards captures, and all unthemed Phase 10A+ captures).
- **(c) Accepted diffs (`34` full-suite / `3` pr-subset)**:
  - **PR-Subset (`68 passed / 3 failed`)**: `salary-profile-update @ 1440`, `analysis-payroll @ 1440`, `salary-rules @ 1440` (registered W-6A-1/AD16).
  - **Full Suite (`292 passed / 34 failed`)**: exact 34 registered AD14/AD16 titles.
- **(d) Unexplained / Phase 9A / 9B / 9C / 10A+ diffs**: `0`.
- **Gate 18 scope-change note**: 9B Gate 18 was `56/56` (Credit Cards + Trades + unthemed 9C Lending); 9C Gate 18 is `46 passed` (`1 setup + 20 credit-cards + 15 themed lending + 10 unthemed profile/settings`), while Trades & Security/Admin/Landing/Recycle Bin zero-diff parity is verified by Gate 15 (`292/34`).
- **Baseline manifest**: `334/334 baselines verified successfully.` at commit `5db8c61`.

---

## §4 Gate Evidence Table (Gates 0–18)

| Gate | Command / Scope | Result | Key Output |
|:---:|---|---|---|
| **0** | Branch `phase-ui-9c-lending` + tag `ui-phase-9c-start` + `UI-UX-PLAN.md` amendments | **PASS** | `MERGE_BASE=1c75926`, `BASELINE_HEAD=01e61c5`, `GATE0_SHA=52c8f10` |
| **1** | `ui-coverage.js --assert-allowlist` & `--routes` | **PASS** | `56 pattern(s) verified`; `75 / 10 / 65 / 0` |
| **2** | `tokens.js --check --tables` | **PASS** | `0 drift` |
| **3** | `testid-guard.js --base 1c75926` | **PASS** | `0` deletions |
| **4** | `lint-tones.js` | **PASS** | `61 page CSS`, `64 total CSS`, `0 violations` |
| **5** | `lint-ratchet.js --base 1c75926`, `stylelint`, `overflow-x`, `#14b8a6`, loading-bypass, hex-in-JS, protected diffs | **PASS** | `0` regressions across `63` CSS; `0` `overflow-x` in `Lending.css`; `0` loading bypasses; protected diffs empty |
| **6** | `npx eslint --max-warnings=0` on all 5 lending JS files, `ProtectedRoute.js`, `lendingMocks.js`, and tests | **PASS** | `0` errors, `0` warnings; `0` lending entries in `.eslintignore` |
| **7** | `react-scripts test --runInBand src/pages/lending/__tests__/` | **PASS** | `4/4` suites, `20/20` tests green (`14/14` existing untouched + `6` new incl. `jest-axe`) |
| **8** | `App.test.js` + `DashboardSummary.test.js` + I8 check | **PASS** | `2/2` suites, `15/15` passed; `DashboardSummary.js` `96` lines |
| **9** | `npx jest --runInBand tests/calculations.spec.js --forceExit` | **PASS** | `11/11` passed |
| **12** | Standalone `2048`MB `npm run build` (run before 10/11) | **PASS** | `Compiled successfully.` |
| **10** | `a11y.spec.js --project=a11y -g "a11y check: lending(?:-person-detail|-loan-detail)?$"` | **PASS** | `4 passed (21.5s)` (`0` serious/critical) |
| **11** | `lending-reference-match.spec.js --project=reference` | **PASS** | `9 passed (32.8s)`; `25` §7.4 PNGs `>= 1000` bytes; `0px` overflow `1440..390px` |
| **13** | Recapture 15 lending baselines + `verify-baseline-manifest.js` | **PASS** | `16 passed (59.0s)`, `334/334` verified, baseline SHA `5db8c61` |
| **14** | `PR_SUBSET=true` `visual.spec.js --project=pr-subset` | **PASS** | Exit `1`; `68 passed (3.7m) / 3 failed` (`salary-profile-update`, `analysis-payroll`, `salary-rules @ 1440`) |
| **15** | Full `visual.spec.js --project=visual` (authorized §15.5 local run) | **PASS** | Exit `1`; `292 passed (15.7m) / 34 failed`, all 34 AD14/AD16 verified |
| **16** | `lending-reference-match.spec.js -g "touch targets"` | **PASS** | `2 passed (17.3s)` |
| **17** | Visual inspection of 15 baselines + 25 local PNGs (`read_file`) | **PASS** | Dark canvas, neutral `<progress>`, `WrittenOff` negative badge, D19 cards, Frame 01/02 verified |
| **18** | Cluster 9 (`credit-cards*` + `lending*`) + unthemed 10A (`/profile`, `/settings`) | **PASS** | `46 passed (2.0m)` (`0` diffs across 7 themed routes & 2 unthemed 10A routes) |

---

## §5 Gate 17 Visual Inspection Log

- **Baselines inspected**: `lending-{1440,390}.png`, `lending-person-detail-{1440,390}.png`, `lending-loan-detail-{1440,390}.png` — recessed `#0c0d0f` chrome, `#101114` canvas, flat `#1a1c20` KPI/counterparty cards, single primary accent CTA, neutral native `<progress>` meters, `Active`/`Repaid` neutral badges, `WrittenOff` negative `<Badge>` with 2px left rule, and D19 compact-expand cards at `390px` with `0px` overflow.
- **Local §7.4 artifacts inspected** (`docs/ui-snapshots/phase-9c/`, 25/25 verified `>= 1000` bytes): `frame-01-dense-table-side-by-side.png` (8-column Loan Ledgers table vs `01-dense-table.html`) and `frame-02-form-side-by-side.png` (`AddTransactionForm` Record Repayment modal vs `02-form.html`).
- **Computed-style conformance**: `0` `[style]` attributes on `.lending-page`; `0` clickable sortable `<th>` or checkboxes (§7.2:2120 not applicable); `0` gradients/blurs/shadows; `scrollWidth === clientWidth` across `1440..390px`.

---

## §6 Post-Sign-Off Checklist

- [x] Receive explicit **Gate 19** user sign-off on `phase_9c_walkthrough.md`.
- [x] Sync governance in `docs/UI-UX_Plan/UI-UX-PLAN.md` (`§5.8.1:954–956`, `§6.1:1072`, `§6.13:1907/:1924–1934` closing Phase 9 Exit Gate `7/7`, `§10` final SHAs & Merge SHA).
- [x] Update `docs/ui-plans/phase_9c_implementation_plan.md` & `phase_9c_walkthrough.md` (`Status: Complete`, final SHAs/sign-off date).
- [x] Update `CHANGELOG.md` (Phase 9C conversion, `THEMED_PATTERNS` `53 -> 56`, Phase 9 Exit Gate closure, AD13 ordinary-amount neutrality).
- [ ] Merge `phase-ui-9c-lending` into `main` (`--no-ff`), finalize SHA closure on `main`, and push only `main`.
- [ ] Clean `frontend/test-results/` and `frontend/playwright-report/`, and verify post-merge CI passes on `main`.
