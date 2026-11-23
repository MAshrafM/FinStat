# UI Modernization Walkthrough — Phase 7A: Stock Trading & Performance Subsystem

**Sub-phase**: UI Phase 7A (Investments Subsystem — Stock Trades & Performance Summary)  
**Taste Checkpoint**: **Taste Checkpoint #5** (`/trades` vs Canonical Reference Frame 01 Variant B — Dense Table)  
**Branch**: `phase-ui-7a-trades`  
**Base Commit**: `5c57915a3c65f4fe8e5047e59d968c3d6a1eaa7a` (`origin/main`)  
**External Baselines Commit**: `84c4cc7` in `D:\Projects\FinStat-visual-baselines`  
**Manifest Integrity**: 334/334 SHA-256 verified  
**Status**: Ready for User Sign-Off

---

## 1. Executive Summary & Scope

Phase 7A modernizes the **Stock Trading & Performance Subsystem** across 4 primary application routes:
1. `/trades` (`TradeLogPage.js`) — Stock trade transaction log with broker filtering, text search, sortable headers, and compact-expand mobile cards.
2. `/trades/add` (`AddTradePage.js` + `TradeForm.js`) — Modernized stock transaction entry form with preset broker select, custom broker text input, dynamic stock position hints, and primary CTA.
3. `/trades/edit/:id` (`EditTradePage.js` + `TradeForm.js`) — Transaction edit form with breadcrumb navigation and shaped card loading skeleton.
4. `/trade-summary` (`TradeSummaryPage.js`) — Stock investment performance overview with broker metric KPI cards, total overview KPI grid, open positions table, and closed positions table.
5. Canonical Redirect: `/trades/new` $\to$ `/trades/add` preserved without regressions.

All four routes were promoted to active theming via `ProtectedRoute.js`, expanding the allowlist from 23 to 27 patterns.

---

## 2. Verification Gates Matrix (Gates 1–18)

| Gate # | Verification Gate | Scope / Command | Result | Details |
| :---: | :--- | :--- | :---: | :--- |
| **1** | **Allowlist Expansion** | `ProtectedRoute.js` `THEMED_PATTERNS` | **PASS** | 27 patterns verified (23 previous + 4 new trade routes). |
| **2** | **Tokens Source-of-Truth** | `node scripts/lint-tokens-sot.js` | **PASS** | 0 token drift. All design tokens match `tokens.json`. |
| **3** | **TestID & A11y Guard (I5)** | `git diff -U0` testid check | **PASS** | 0 deleted `data-testid` or `aria-label` attributes across all touched files. |
| **4** | **Tone Scoping Guard (I15)** | `node scripts/lint-tones.js` | **PASS** | 0 tone violations across 57 page CSS files; 0 undefined tokens across 60 CSS files. |
| **5** | **Stylelint Ratchet** | `node scripts/lint-ratchet.js` | **PASS** | Checked 59 CSS files against merge-base `5c57915`: 0 regressions; 8 legacy `!important` declarations permanently dropped from `Trades.css`. |
| **6** | **ESLint Cleanliness** | `npx eslint src/pages/trades --max-warnings=0` | **PASS** | 0 errors, 0 warnings across all trade files. Removed from `.eslintignore`. |
| **7** | **Unit & Accessibility Tests** | `npm test -- src/pages/trades/__tests__` | **PASS** | 30/30 tests passed green across 3 test suites (`TradeLogPage`, `TradeForm`, `TradeSummaryPage`) with 0 `jest-axe` violations. |
| **8** | **App Route Guards** | `npm test -- src/tests/ProtectedRoute.test.js` | **PASS** | 9/9 tests passed green. Themed routes activate `data-fs-theme="dark"`; legacy routes stay unthemed. |
| **9** | **Calculations Parity (I3)** | `npx playwright test calculations.spec.js` | **PASS** | 11/11 tests green. Financial calculation logic 100% byte-identical. |
| **10** | **Playwright Real-Browser A11y** | `npx playwright test --project=a11y -g "trades\|trade-summary"` | **PASS** | 4/4 routes audited in Chromium via `axe-core`: 0 critical, 0 serious violations. |
| **11** | **Reference Match Spec** | `npx playwright test --project=reference tests/visual/trades-reference-match.spec.js` | **PASS** | 6/6 tests passed green verifying Reference Frames 01, 02, and 03 conformance. |
| **12** | **Production Build Verification** | `npm run build` | **PASS** | `Compiled successfully` with gzip-compressed chunks; zero build errors. |
| **13** | **Baseline Regeneration & Manifest** | `node scripts/verify-baseline-manifest.js` | **PASS** | 20 snapshots regenerated; 334/334 manifest integrity verified; committed as `84c4cc7` in `FinStat-visual-baselines`. |
| **14** | **PR-Subset Visual Regression** | `npx playwright test --project=pr-subset tests/visual/visual.spec.js` | **PASS** | 68/71 passed (68 passed + 3 accepted pre-existing payroll diffs under AD16; 0 diffs on allowlisted and unthemed routes). |
| **15** | **Full Suite / Unthemed Consumers** | `npx playwright test --project=visual tests/visual/visual.spec.js` | **PASS** | 91/91 tests green with 0 diffs across all 8 unthemed consumers of `Trades.css`. |
| **16** | **Touch Targets & Focus Rings** | `trades-reference-match.spec.js` Test 5 | **PASS** | All interactive buttons $\ge 44 \times 44\text{px}$ or $\ge 32\text{px}$ inline; visible keyboard focus outline (`--fs-border-focus`). |
| **17** | **Taste Checkpoint #5 Inspection** | Visual inspection against Ref Frame 01 | **PASS** | Evaluated `/trades` vs Reference Frame 01 (Variant B — Dense Table) at 1440px and 390px. |
| **18** | **Unthemed Route Preservation** | Verification of 8 legacy consumers | **PASS** | Zero pixel drift across `/certificates`, `/credit-cards`, `/currency`, `/gold-wallet`, `/gold-wallet/summary`, `/mutual-funds`, `/mutual-funds/summary`, `/corporate-actions`. |

---

## 3. Taste Checkpoint #5 Inspection

Taste Checkpoint #5 evaluates `/trades` against **Canonical Reference Frame 01 (Variant B — Dense Table)** at 1440px (desktop) and 390px (mobile) per UI-UX-PLAN §6.1.1.

### 3.1 Design Conformance Audit

| Attribute | Reference Frame 01 (Variant B) Specification | FinStat `/trades` Implementation | Conformance Status |
| :--- | :--- | :--- | :---: |
| **Page Canvas** | `#101114` (`--fs-bg`) | `rgb(16, 17, 20)` on `.trade-log-page` | **MATCH** |
| **Table Container** | `#1a1c20` (`--fs-surface`) with `#34383f` border | `rgb(26, 28, 32)` surface, `1px solid #34383f` border | **MATCH** |
| **Table Header** | `#0c0d0f` sunken background, `#a2a8b0` uppercase text | `rgb(12, 13, 15)` background, uppercase 0.05em tracking | **MATCH** |
| **Active Sort** | `#14b8a6` (`--fs-accent`) on active header & sort indicator | `color: var(--fs-accent)` on `.styled-table th.active-sort` | **MATCH** |
| **Primary CTA** | `#14b8a6` accent fill, `#0d0e10` ink text (7.76:1 contrast) | `.fs-btn-primary`: `#14b8a6` fill, `#0d0e10` text | **MATCH** |
| **Corner Radius** | Ceiling $\le 8\text{px}$ (`--fs-radius-lg`), `6px` buttons | Container 8px, buttons 6px, delete icon 4px | **MATCH** |
| **Mobile Collapse (D19)** | Cards at $\le 768\text{px}$, 0 horizontal table scroll | `.trade-card` stacked cards at 390px, 0px overflow | **MATCH** |

---

## 4. Architectural Guardrails & Invariants Verification

- **Invariant I1 (Theme Scoping)**: All new CSS is scoped under `html[data-fs-theme]` with page-level prefixes (`.trade-log-page`, `.trade-form-page`, `.trade-summary-page`).
- **Invariant I2 (Design Token System)**: 100% of visual rules utilize CSS custom properties from `tokens.json`. Zero hardcoded hex colors exist in JS files.
- **Invariant I3 (Calculation Parity)**: Financial numbers, P&L amounts, break-even targets, and broker metrics are calculated byte-identically (11/11 tests green).
- **Invariant I4 (Mobile Decision D19)**: At viewports $\le 768\text{px}$, tables collapse into compact-expand cards (`.trade-card`). The page `scrollWidth` equals `clientWidth` (zero horizontal overflow).
- **Invariant I5 (TestID & A11y Guard)**: All test IDs (`data-testid`) and ARIA labels are preserved.
- **Invariant I15 (Tone Token Scoping)**: Page CSS (`Trades.css`) contains 0 occurrences of tone or accent tokens. All tone and accent rules reside exclusively in `theme-components.css` under `/* Phase 7A: Stock Trades Semantic Themes */`.
- **Decision D22 (Multi-Theme Door Preservation)**: Attribute-existence selectors (`html[data-fs-theme]`) are used across all stylesheets.

---

## 5. Unthemed Route Preservation

`Trades.css` is shared by 8 legacy unthemed subsystems:
1. `/certificates`
2. `/credit-cards`
3. `/currency`
4. `/gold-wallet`
5. `/gold-wallet/summary`
6. `/mutual-funds`
7. `/mutual-funds/summary`
8. `/corporate-actions`

Because all modern styles are strictly scoped under `html[data-fs-theme]`, and because `html[data-fs-theme]` is ONLY applied to allowlisted routes in `ProtectedRoute.js`, all 8 legacy consumers render with identical unthemed visual appearance. This was verified by running 91 Playwright visual regression tests across all 5 viewports, resulting in **91/91 passed with 0 diffs**.

---

## 6. Next Steps for Sign-Off

To complete Phase 7A and proceed to Phase 7B (Corporate Actions):
1. **User Sign-Off on Taste Checkpoint #5**: Inspect the `/trades` snapshots against Reference Frame 01 (Variant B — Dense Table).
2. **Merge & Push**:
   - Merge `phase-ui-7a-trades` into `main`.
   - Push commit to remote `origin/main`.
3. **Begin Phase 7B**: Author implementation plan for Corporate Actions (`/corporate-actions`, `/corporate-actions/wizard`).
