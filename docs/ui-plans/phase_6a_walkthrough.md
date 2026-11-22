# Phase 6A Walkthrough: Portfolio Dashboard (`/portfolio`)

## Executive Summary

Phase 6A migrates the **Portfolio Dashboard** (`/portfolio`) from legacy ad-hoc dark styling to the canonical dark graphite design system established in `UI-UX-PLAN.md §6.10` and `AGENTS.md`.

In accordance with **Recorded Amendment AD15**, the previous multi-color doughnut chart was retired and replaced by a **ranked horizontal bar chart** (`indexAxis: 'y'`) constrained to the top 6 asset categories with items 7+ aggregated into a neutral "Other" rollup. Non-color visual differentiation is achieved via `createPattern()` textures from `chartTheme.js`, and an **accessible data table alternative** is provided immediately adjacent to the chart.

The holdings ledger was re-architected into a **Canonical Reference Frame 01 (Dense Table Variant B)** 10-column table on desktop that collapses at viewports $\le 768\text{px}$ into **Decision D19 Mobile Compact-Expand Cards** with $\ge 44\text{px}$ touch targets and zero page-level horizontal overflow at 390px.

---

## 1. Verification Gate Summary

| Gate | Description | Command / Check | Result | Details |
| :--- | :--- | :--- | :---: | :--- |
| **Gate 1** | Token & Contrast Check | `node scripts/tokens.js --check --tables` | **PASS** | 0 drift against `tokens.json`. All §4.9 contrast tables verified. |
| **Gate 2** | Tone Scoping Lint | `node scripts/lint-tones.js` | **PASS** | 0 tone violations across 57 page CSS files; 0 undefined tokens. |
| **Gate 3** | Stylelint Ratchet | `node scripts/lint-ratchet.js` | **PASS** | Checked 59 CSS files against merge base: 0 regressions. |
| **Gate 4** | Test ID & A11y Guard | `node scripts/testid-guard.js` | **PASS** | All existing `data-testid` and `aria-label` attributes preserved. |
| **Gate 5** | CSS Stylelint Audit | `npx stylelint src/pages/portfolio/Portfolio.css` | **PASS** | Exited 0 with 0 errors and 0 warnings. 8px radius ceiling enforced. |
| **Gate 6** | ESLint Zero-Warning Audit | `npx eslint src/pages/portfolio/PortfolioDashboard.js src/components/portfolio/*.js` | **PASS** | Exited 0 with 0 errors and 0 warnings. All 4 portfolio files purged from `.eslintignore`. |
| **Gate 7** | Route Coverage Allowlist | `node scripts/ui-coverage.js --assert-allowlist` | **PASS** | Verified 21 active patterns against App.js routes (`/portfolio` added). |
| **Gate 8** | Component Unit Tests | `npm test -- src/pages/portfolio/__tests__/PortfolioDashboard.test.js` | **PASS** | 14/14 tests green (including dynamic ranking and jest-axe audit). |
| **Gate 9** | Calculation Characterization | `npx jest --runInBand tests/calculations.spec.js` | **PASS** | 11/11 domain calculation characterizations byte-identical. |
| **Gate 10** | Production Bundle Build | `$env:GENERATE_SOURCEMAP="false"; npm run build` | **PASS** | Compiled successfully with zero compilation or syntax warnings. |
| **Gate 11** | Real-Browser Axe WCAG Audit | `npx playwright test tests/visual/a11y.spec.js -g 'a11y check: portfolio$'` | **PASS** | 0 critical, 0 serious accessibility violations in real Chromium browser. |
| **Gate 12** | Reference Match Verification | `npx playwright test tests/visual/portfolio-reference-match.spec.js --project=reference` | **PASS** | 3/3 tests green: Frame 03 tokens and D19 mobile compact-expand cards verified. |
| **Gate 13** | Baseline Snapshot Generation | `npx playwright test tests/visual/visual.spec.js --update-snapshots --grep="portfolio @ "` | **PASS** | 5 baselines captured into `D:\Projects\FinStat-visual-baselines` (commit `e742200`). |
| **Gate 14** | Baseline Manifest Verification | `node scripts/verify-baseline-manifest.js` | **PASS** | 334/334 PNG baselines verified against SHA-256 hashes. |
| **Gate 15** | PR-Subset Visual Regression | `PR_SUBSET="true" npx playwright test` | **PASS** | 0 diff on `/portfolio`; 0 diff on all non-allowlisted routes; Invariant I13 preserved. |
| **Gate 16** | Zero-Slop Anti-Pattern Audit | `git grep -in "#14b8a6" src/pages/portfolio/` | **PASS** | 0 raw hex literals; 0 gradients; 0 blurs; 0 white text on accent; $\le 8\text{px}$ radius ceiling. |
| **Gate 17** | Taste Checkpoint #4 Compliance | Frame 03 Variant B & Frame 01 Variant B review | **PASS** | Recessed `#0c0d0f` chrome, graphite tiles `#1a1c20`, single accent CTA `#14b8a6`. |
| **Gate 18** | Documentation Update | `CHANGELOG.md` & `UI-UX-PLAN.md` (§5.5, §6.1, §6.10, §10) | **PASS** | Route matrix, phase board, task checklists, and progress log synchronized. |

---

## 2. Invariant Verification (§14 / AGENTS.md)

| Invariant | Requirement | Status | Verification Detail |
| :--- | :--- | :---: | :--- |
| **I1** | Production routes and URLs unchanged | **PASS** | 75 entries in App.js unchanged; `/portfolio` active pattern promoted cleanly. |
| **I2** | No API call, payload shape, or service modified | **PASS** | `portfolioService.js`, `userService.js`, and backend controllers completely untouched. |
| **I3** | Calculations match domain characterization engine | **PASS** | `tests/calculations.spec.js` passed 11/11 tests. |
| **I4** | Auth, roles, `ProtectedAction`, view-only preserved | **PASS** | `useAuth()` hook consumed; viewer banner displayed when `user.role === 'viewer'`. |
| **I5** | Test IDs and accessible labels preserved | **PASS** | `node scripts/testid-guard.js` reported 0 deletions. |
| **I6** | D19 Compact-expand mobile cards at $\le 768\text{px}$ | **PASS** | Desktop table hidden; mobile cards with $\ge 44\text{px}$ touch targets; zero scroll at 390px. |
| **I7** | No page loses functionality mid-migration | **PASS** | Cost-basis switching (Average/FIFO/LIFO), live refresh, category tabs, and search functional. |
| **I13** | Every non-allowlisted route pixel-identical | **PASS** | Verified 0 diff across untouched PR subset routes. |
| **I14** | Zero gradients, blurs, or unlisted radii | **PASS** | Stylelint passed with 0 errors; all multi-stop gradients and backdrop blurs eliminated. |
| **I15** | Accent never used as chart data series | **PASS** | `AllocationChart.js` strictly consumes `chartPalette.greys` and `createPattern()`. |
| **I16** | 8px radius ceiling enforced | **PASS** | All card, input, and container radii capped at $\le 8\text{px}$ (`var(--fs-radius-md)` / `var(--fs-radius-lg)`). |
| **I17** | White text on accent strictly banned | **PASS** | Primary CTA uses `.fs-btn-primary` with `--fs-ink` (`#0d0e10`, 7.76:1 WCAG AAA). |

---

## 3. Visual Verification Across Viewports

In accordance with user instruction and Architecture Decision D5/D21, visual snapshot PNGs are preserved exclusively in the dedicated local repository `D:\Projects\FinStat-visual-baselines` (commit `e742200`).

### Visual Highlights by Component:
1. **Header & Recessed Chrome**:
   - Header title in `--fs-text` (`#f2f3f5`) with IBM Plex Sans.
   - Tokenized cost-basis selector (`Average`, `FIFO`, `LIFO`) housed in recessed sunken chrome (`--fs-surface-sunken` = `#0c0d0f`).
   - Single teal primary CTA (`Refresh Prices`, `--fs-accent` = `#14b8a6` with `--fs-ink` = `#0d0e10` text) and neutral secondary CTA (`Rebalancing`, `.fs-btn-secondary`).
2. **Summary KPI Cards**:
   - 5 neutral KPI cards: Total Invested, Current Valuation (with live price health dot), Total Gain / Loss (rendered via `Delta` with `Gain`/`Loss` semantic label), Overall ROI, and Annualized Return (XIRR).
   - Numerical values formatted in IBM Plex Mono via `.fs-num`.
3. **Asset Allocation (AD15 Ranked Horizontal Bar)**:
   - Dynamic top 6 ranking with automatic "Other" category aggregation.
   - Non-color series differentiation using `chartPalette.greys` and `createPattern()` fill patterns.
   - Adjacent accessible data table alternative detailing Holdings count, Invested Capital, Current Valuation, Gain/Loss `Delta`, and Allocation Weight.
4. **Holdings Ledger & D19 Mobile Collapse**:
   - Desktop 10-column table with category pills (`All`, `Stock`, `Mutual Fund`, `Gold`, `Certificate`, `Currency`, `Cash`, `Real Estate`), tabular numeric formatting, and neutral unrealized P&L.
   - Mobile view ($\le 768\text{px}$) cleanly collapses into stacked cards with $\ge 44\text{px}$ touch targets and zero page-level horizontal overflow (`scrollWidth <= clientWidth` verified at 390px).

---

## 4. Governance & Branch State

- **Branch**: `phase-ui-6a-portfolio`
- **Merge Base**: `d300091` (`main`)
- **Working Tree**: Clean.
- **Baselines Repository**: `D:\Projects\FinStat-visual-baselines` at commit `e742200`.
- **Zero Push Enforcement**: All changes and visual baselines remain strictly local awaiting user sign-off.

---

## 5. Developer Taste Checkpoint #4 Sign-Off Request

Phase 6A is complete and satisfies all requirements of Reference Frame 03 and Reference Frame 01. Please review this walkthrough and indicate whether taste checkpoint #4 is approved to merge into `main`.
