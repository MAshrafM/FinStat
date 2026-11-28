# UI Phase 10A — Profile, Settings & Recycle Bin — Walkthrough

- **Date**: 2026-11-28
- **Status**: `Complete — Gate 19 + Checkpoint #8 Signed Off (2026-11-28)`
- **Branch / Tag**: `phase-ui-10a-profile-settings` (`ui-phase-10a-start`, local branch policy per §14/§10)
- **Merge Base**: `main` @ `3f42b4f`
- **Gate 0 Plan & Governance SHA**: `51478bb`
- **Implementation SHA**: `fe20e40`
- **Walkthrough SHA**: `10aab73`
- **Gov SHA**: `e699a5a`
- **Merge SHA**: `dfaca50`
- **Starting Baseline Commit (`D:\Projects\FinStat-visual-baselines`)**: `5db8c61` (`334/334` manifest verified)
- **Gate 13 Baseline Commit (`D:\Projects\FinStat-visual-baselines`)**: `723c4ac` (`334/334` manifest verified; `15` recaptured PNGs + `manifest.json`, `0` net new entries)
- **Gate 12 Serving Harness & Heap**: Static production bundle built via `node --max-old-space-size=2048 node_modules/react-scripts/scripts/build.js` with `GENERATE_SOURCEMAP=false` (`Compiled successfully.`; `NODE_OPTIONS=--max-old-space-size=1536` hit Windows worker `AlignedAlloc` OOM; passing `--max-old-space-size=2048` directly to the main process succeeded). Gates 10, 11, 13–18 served via `npx serve -s build -l 3000` (`CI=true`).

---

## §0 Approved Review Items & Gate 0 Amendments

1. **Decision 1 — Settings Active Radio Card Accent (Option A)**: Added `theme-components.css` Section 25 (`html[data-fs-theme] .fs-page .settings-page .method-option.active`, `input[type="radio"]`, `.active .check-icon`) with `--fs-accent`. `SettingsPage.css` declares no `border-color` on `.method-option.active` and excludes `.active` from hover (`.method-option:not(.active):hover`), ensuring active+hover keeps `--fs-accent`.
2. **Decision 2 — Retained Ignored Test (`RecycleBin.test.js`)**: Kept `frontend/src/pages/profile/__tests__/RecycleBin.test.js` byte-identical (`10/10` passing) in `.eslintignore:25` as a pre-existing exception under §7.1/§7.2 (not a waiver). Removed `ProfilePage.js` and `SettingsPage.js` from `.eslintignore`; `RecycleBin.js` was already absent.
3. **Decision 3 — Gate 0 Live-Scope Clarifications (§6.14, Invariant I2)**:
   - Corrected `SettingsPage.js` inline-style count from `6` to `9`; corrected `RecycleBin.js` `.eslintignore` state.
   - Recorded I2-driven Frame 02 deviations: `ProfilePage.js` has no avatar, no Discard/cancel button, no inline per-field error state, and uses toast feedback rather than an inline success banner.
   - `RecycleBin.js` has no permanent purge modal and no audit-log table (audit logs belong to Phase 10C `AdminDashboard.js`); no sortable `<th>` or checkbox exists, so §7.2:2121 sort-header/checked clause is N/A.
   - Guarded `window.matchMedia('(max-width: 768px)')` hook in `RecycleBin.js` accepted under Phase 9C mixed-file precedent.
   - Forced-error mock (`setupProfileSettingsMocks(..., { error: true })`) produces reproducible error captures with visible toast assertions (toast-hiding disabled on error captures).
   - Full APG tab contract implemented manually on `RecycleBin.js` (`role="tablist"`, `aria-orientation="horizontal"`, `role="tab"`, `aria-selected`, `aria-controls`, roving `tabIndex`, ArrowLeft/ArrowRight/Home/End/Enter/Space, matching `role="tabpanel"` with `aria-labelledby`), preserving `data-testid="tab-expenditures"` and `data-testid="tab-trades"`.
4. **Decision 4 — 0 Waivers & Authorized Local Build / Full Visual Run (§15.5)**: `0` new waivers, `0` `overflow-x` in Phase 10A CSS, and explicit user authorization for Gate 12 local build and Gate 15 full `326`-test visual run.
5. **Cross-Route CSS Collision Overrides (§0:3)**: Explicitly overrode `SalaryProfile.css:18` (`.fs-page .profile-card { max-width: none; margin: 0; }`), `theme-components.css` `.fs-page .form-group*`, `PaycheckFormPage.css` `.fs-page .form-input/.form-label`, `Expenditure.css` `.fs-page .page-header`, `SalaryProfile.css` `.fs-page .section-title`, `RecurringBills.css` `.fs-page .form-group`, and `App.css` `.btn-secondary`. Also added `html[data-fs-theme] .fs-page .user-profile-page .form-input.fs-mono { font-family: var(--fs-font-mono); }` so `nationalId`/`employeeId` render in `IBM Plex Mono` while `dateOfBirth`/`phone` and Recycle Bin figures/dates use `.fs-num` (`IBM Plex Sans` + `tabular-nums`).

---

## §1 Progress Log

- **Sub-phase**: `10A` (Profile, Settings & Recycle Bin — Cluster 10 start)
- **Allowlist**: `['/profile', '/settings', '/settings/recycle-bin']` (`THEMED_PATTERNS`: `56 -> 59`)
- **Status**: Gates 0–18 green; awaiting Gate 19 User Sign-Off + Taste Checkpoint #8 approval.
- **Fixtures**: `frontend/tests/visual/fixtures/profileSettingsMocks.js` wired as final `else if` branch for the 3 Phase 10A slugs only in `visual.spec.js` and `a11y.spec.js`; `paycheckMocks.js` byte-identical; `RecycleBin.test.js` byte-identical (`10/10`); `calculations.spec.js` byte-identical (`11/11`).
- **Screenshots**: `0` tracked in app repo per D5/D21; `15` baselines updated in `FinStat-visual-baselines` (`723c4ac`, `334/334` manifest verified) + `31` local §7.4 PNGs in gitignored `docs/ui-snapshots/phase-10a/`.
- **Next**: Phase 10B (`/security`) after Checkpoint #8 + Gate 19 sign-off.
- **Blocked by**: Gate 19 User Sign-Off (Checkpoint #8 pending).

---

## §2 Governing Invariant Compliance (Condensed 9A–9C Format, §2 I1–I16)

| Invariant | Phase 10A Outcome | Gate |
|:---:|---|---|
| **I1** | `App.js` untouched; `THEMED_PATTERNS` `56 -> 59` (`/profile`, `/settings`, `/settings/recycle-bin`). | Gates 1, 8 |
| **I2** | `userService.js`, `apiClient.js`, backend routes/schemas byte-identical; Frame 02 I2 deviations recorded. | Gates 5, 7 |
| **I3** | `formatCurrency()` (`$`) unchanged; `calculations.spec.js` `11/11` green. | Gates 7, 9 |
| **I4** | `<ProtectedAction>` restore gating & `<ConfirmModal variant="primary">` intact. | Gate 7 |
| **I5** | `0` deleted `data-testid`/`aria-label`; desktop table + `RecycleBin.test.js` `10/10` preserved; mobile D19 cards render separately via guarded `matchMedia`. | Gates 3, 7, 11 |
| **I6** | D19 compact-expand cards at `<= 768px`; `0px` overflow at `390px`; `0` `overflow-x`; `0` waivers. | Gates 5, 11, 17 |
| **I7** | All 3 Cluster 10A routes converted atomically. | Gates 7, 11 |
| **I8** | `DashboardSummary.js` `96` lines (`<= 120`); App/ProtectedRoute/Dashboard `3/3` suites `21/21`. | Gate 8 |
| **I9** | Local static build clean (`Compiled successfully.`). | Gate 12 |
| **I10** | `4/4` profile Jest suites (`17/17`, incl. `RecycleBin.test.js` `10/10` & `jest-axe`) green. | Gates 7, 8 |
| **I11** | `0` `!important` in Phase 10A CSS; `lint-ratchet.js --base 3f42b4f` `0` regressions. | Gate 5 |
| **I12** | `package.json` & `package-lock.json` untouched. | Gate 5 |
| **I13** | Gate 18 `61/61` (`0` diffs on Cluster 9 & unthemed 10B/10C); Gate 15 `292/34` (`0` unexplained diffs). | Gates 15, 18 |
| **I14** | `0` gradients, blurs, glows, arbitrary shadows, masks, or radius longhands. | Gates 5, 6, 11 |
| **I15** | `.fs-num` sans+tabular on dates/phone/amounts; `.fs-mono` only on `nationalId`/`employeeId`; `--fs-accent` only on primary CTA, checked radio (Section 25), and active tab; `lint-tones.js` `0` violations. | Gates 4, 7, 11 |
| **I16** | Radii `<= 8px` (`--fs-radius-sm/md/lg`); `--fs-radius-pill` only on `<Badge>`. | Gates 5, 11 |

---

## §3 Visual Diff Report (§7.1 HTML-Report Substitution)

> **§7.1 HTML-Report Substitution Disclosure**: Local `frontend/test-results/` and `frontend/playwright-report/` were cleaned after execution to keep the workspace clean; the full `(a)–(d)` breakdown and embedded 34-title AD14/AD16 register below are substituted verbatim from the `Tee-Object` stdout captures.

- **(a) Total routes/snapshots compared (Gate 15)**: `326` (`1` auth setup + `65` routes × `5` widths)
- **(b) Zero-diff passes**: `292` (including all `15` Phase 10A baselines against `723c4ac`, all `7` Cluster 9 routes, all `5` unthemed 10B/10C routes, and Landing)
- **(c) Accepted diffs**: `34` (all registered AD14/AD16 items):
  - **AD14 (10)**: `not-found` (`768, 480, 390`), `dashboard` (`768, 480`), `expenditures` (`768, 480`), `expenditure-analysis` (`1024, 768, 480`)
  - **AD16 / W-6A-1 (24)**: `salary-profiles` (`768, 480, 390`), `salary-profile-update` (`1440..390`), `salary-paychecks-new` (`768, 480, 390`), `salary-paychecks-edit` (`768, 480, 390`), `analysis-payroll` (`1440..390`), `salary-rules` (`1440..390`)
- **(d) Unexplained diffs**: `0`
- **PR-Subset (Gate 14)**: `68 passed / 3 failed` (`salary-profile-update @ 1440`, `analysis-payroll @ 1440`, `salary-rules @ 1440`)
- **Gate 13 Baseline Aggregate Diff (`git -C D:\Projects\FinStat-visual-baselines diff --stat 5db8c61 723c4ac`)**: `16 files changed, 30 insertions(+), 30 deletions(-)` (`15` PNGs + `manifest.json`; `334/334` manifest verified; `0` net new entries).
- **Gate 18 Guard Scope-Change Note**: `61 passed` (`1 setup + 20 credit-cards + 15 lending + 25 security/admin`; `12` slugs × `5` widths). Phase 9C Gate 18 was `46 passed`; now-themed 10A routes moved to Gate 13 (`16 passed`).

---

## §4 Gate Evidence Table (Gates 0–18)

| Gate | Command / Scope | Result |
|:---:|---|---|
| **0** | Branch `phase-ui-10a-profile-settings` (`ui-phase-10a-start` @ `3f42b4f`), baseline `5db8c61` (`334/334`), governance sync `51478bb` | **PASS** |
| **1** | `node scripts/ui-coverage.js --assert-allowlist` & `--routes` | **PASS** (`59` patterns; `75 / 10 / 65 / 0` unassigned) |
| **2** | `node scripts/tokens.js --check --tables` | **PASS** (`0` drift) |
| **3** | `node scripts/testid-guard.js --base 3f42b4f` | **PASS** (`0` deletions) |
| **4** | `node scripts/lint-tones.js` | **PASS** (`61` page / `64` total CSS; `0` violations) |
| **5** | `lint-ratchet.js --base 3f42b4f`, `stylelint`, ban greps, protected diff, append-only check | **PASS** (`0` regressions across `63` CSS, `0` stylelint errors, `0` `overflow-x`, `#14b8a6` only at `tokens.css:36`, `0` loading bypasses, `0` raw hex in JS, `0` protected diffs, `0` removed lines in `theme-components.css`) |
| **6** | `npx eslint --max-warnings=0` on all touched JS & test files | **PASS** (`0` errors, `0` warnings; `RecycleBin.test.js` retained ignored) |
| **7** | `npx react-scripts test --watchAll=false --runInBand src/pages/profile/__tests__/` | **PASS** (`4/4` suites, `17/17` tests incl. untouched `10/10` `RecycleBin.test.js` + `jest-axe`) |
| **8** | `npx react-scripts test --watchAll=false --runInBand src/App.test.js src/components/__tests__/ProtectedRoute.test.js src/pages/dashboard/__tests__/DashboardSummary.test.js` | **PASS** (`3/3` suites, `21/21` tests; `DashboardSummary.js` `96` lines) |
| **9** | `npx jest --runInBand tests/calculations.spec.js --forceExit` | **PASS** (`1/1` suite, `11/11` tests) |
| **12** | `node --max-old-space-size=2048 node_modules/react-scripts/scripts/build.js` (`GENERATE_SOURCEMAP=false`) | **PASS** (`Compiled successfully.`) |
| **10** | `npx playwright test --project=a11y -g "a11y check: (profile\|settings\|settings-recycle-bin)$"` | **PASS** (`4 passed`: `1 setup + 3 routes`, `0` serious/critical) |
| **11** | `npx playwright test profile-settings-reference-match.spec.js --project=reference` | **PASS** (`9 passed`: `1 setup + 8 specs`, `31/31` PNGs `>= 1000` bytes) |
| **13** | `npx playwright test visual.spec.js --project=visual --grep="(profile\|settings\|settings-recycle-bin) @" --update-snapshots` + manifest + commit | **PASS** (`16 passed`, `334/334` manifest verified, baseline SHA `723c4ac`) |
| **14** | `$env:PR_SUBSET='true'; npx playwright test visual.spec.js --project=pr-subset` | **PASS** (`68 passed / 3 failed`: `salary-profile-update @ 1440`, `analysis-payroll @ 1440`, `salary-rules @ 1440`) |
| **15** | `npx playwright test visual.spec.js --project=visual` | **PASS** (`292 passed / 34 failed` — all 34 AD14/AD16 verified, `0` unexplained) |
| **16** | `npx playwright test profile-settings-reference-match.spec.js --project=reference -g "touch targets"` | **PASS** (`2 passed`: `1 setup + 1 spec`) |
| **17** | Visual inspection of baselines + `31` §3.7 artifacts | **PASS** (caught & fixed `[role="status"]` masking on `settings-recycle-bin-empty`; re-verified Gates 6, 11, 16) |
| **18** | `npx playwright test visual.spec.js --project=visual --grep="(credit-cards @\|...\|admin-backup @)"` | **PASS** (`61 passed`, `0` diffs across Cluster 9 + unthemed 10B/10C) |

### Artifact-to-Spec Mapping (`31` §3.7 PNGs in `docs/ui-snapshots/phase-10a/`)

| Spec in `profile-settings-reference-match.spec.js` | Generated Artifacts (`31` PNGs) | Count |
|---|---|---:|
| Spec 1 (`/profile` 5-width sweep) | `profile-{1440,1024,768,480,390}.png` | 5 |
| Spec 2 (Checkpoint #8 side-by-side) | `frame-02-form-side-by-side-{1440,390}.png` | 2 |
| Spec 4 (`/settings` 5-width sweep + FIFO) | `settings-{1440,1024,768,480,390}.png`, `settings-fifo-selected-{1440,390}.png` | 7 |
| Spec 5 (`/settings/recycle-bin` 5-width + Trades) | `settings-recycle-bin-{1440,1024,768,480,390}.png`, `settings-recycle-bin-trades-{1440,390}.png` | 7 |
| Spec 7 (Restore modal, empty, loading, error) | `settings-recycle-bin-restore-modal-{1440,390}.png`, `settings-recycle-bin-empty-{1440,390}.png`, `{profile,settings,settings-recycle-bin}-{loading,error}.png` | 10 |

---

## §5 Inspection Log & Taste Checkpoint #8 Comparison

- **Checkpoint #8 (`frame-02-form-side-by-side-1440.png` & `frame-02-form-side-by-side-390.png`)**: Sunken `--fs-surface-sunken` header (`20px/600` title, `13px/--fs-text-3` subtitle) and neutral `<Badge>ADMIN</Badge>`, stacked `--fs-surface-raised` section cards (`max-width: none` overriding `SalaryProfile.css:18`), 2-column grid at `1440px` collapsing cleanly to `1` column at `390px`, sunken footer with single `--fs-accent` primary CTA (`--fs-ink` text), `0px` overflow.
- **Settings (`/settings`)**: Section 25 `--fs-accent` border, radio dot, and check icon preserved under active+hover; neutral `.info-box` with `--fs-border-control` left rule; secondary `Back to Profile` and `Open Recycle Bin` links (`>= 44px` touch targets at `390px`).
- **Recycle Bin (`/settings/recycle-bin`)**: APG `role="tab"`/`aria-selected`/`aria-labelledby` tabs with `.fs-tab--active` underline; `.fs-num` tabular figures/dates; D19 compact-expand mobile cards at `<= 768px` (desktop table unrendered in mobile DOM); `<EmptyState>` (`Recycle Bin is empty`) and `<ConfirmModal variant="primary">` verified at `1440px` and `390px`; loading skeletons and visible error toasts verified on all 3 routes.

![Checkpoint #8 Side-by-Side 1440px](file:///C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/frame-02-form-side-by-side-1440.png)

![Checkpoint #8 Side-by-Side 390px](file:///C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/frame-02-form-side-by-side-390.png)

---

## §6 Post-Sign-Off Checklist

- [x] Receive explicit **Gate 19 + Taste Checkpoint #8 sign-off** from the User *(Signed off 2026-11-28; Phase 10B unblocked)*.
- [ ] Update two-stage walkthrough header (`Complete — Gate 19 Signed Off`, `Checkpoint #8 approved`, `Gov SHA`, `Merge SHA`), finalize `UI-UX-PLAN.md` (§6.1, §6.1.1, §6.14, §10) & `phase_10a_implementation_plan.md` (`Status: Complete`).
- [x] Merge `phase-ui-10a-profile-settings` into `main` (`--no-ff` `dfaca50`), record final Merge SHA on `main`, and push only `main` (`phase-ui-10a-profile-settings` remains local).
